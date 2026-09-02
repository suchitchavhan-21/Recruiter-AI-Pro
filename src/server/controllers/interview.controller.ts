import { Response } from "express";
import { z } from "zod";
import { 
  analyzeJobDescription, 
  evaluateInterviewSession, 
  evaluateSTARStory, 
  generateDraftAnswer,
  getGeminiClient 
} from "../services/gemini.service";
import { 
  insertInterview, 
  listInterviewsByUserId, 
  findInterviewById, 
  insertSTARStory, 
  listSTARStoriesByUserId, 
  deleteSTARStoryById, 
  insertActivity, 
  generateUUID 
} from "../db/repository";
import { InterviewSessionRecord, SavedSTARStoryRecord } from "../db/schema";
import { AuthenticatedRequest } from "../middleware/auth";
import { InterviewOrchestrator, AdaptiveInterviewState } from "../ai/orchestrator/interviewOrchestrator";

export const startAdaptiveSchema = z.object({
  sessionId: z.string().optional(),
  role: z.string().min(1, "Role is required"),
  company: z.string().min(1, "Company is required"),
  difficulty: z.enum(["Entry", "Mid", "Senior", "Expert"]).optional(),
  interviewerCount: z.union([z.number(), z.string()]).optional(),
  questions: z.array(z.any()).optional()
});

export const processTurnSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  answer: z.string().min(1, "Answer is required"),
  timeTaken: z.string().optional()
});

export const analyzeJdSchema = z.object({
  jd: z.string().min(10, "Job description must be at least 10 characters long."),
  companyName: z.string().optional(),
  persona: z.enum(["mentor", "architect", "product_leader"]).optional(),
  interviewerCount: z.union([z.number(), z.string()]).optional()
});

export const evaluateInterviewSchema = z.object({
  role: z.string().optional(),
  company: z.string().optional(),
  companyName: z.string().optional(),
  jd: z.string().optional(),
  difficulty: z.string().optional(),
  persona: z.string().optional(),
  interviewerCount: z.union([z.number(), z.string()]).optional(),
  qaPairs: z.array(z.any()).optional(),
  qaList: z.array(z.any()).optional(),
  answers: z.array(z.any()).optional(),
  timeTaken: z.string().optional()
});

export const evaluateStarSchema = z.object({
  role: z.string().optional(),
  company: z.string().optional(),
  situation: z.string().min(5, "Situation coordinate is required."),
  task: z.string().min(5, "Task coordinate is required."),
  action: z.string().min(5, "Action coordinate is required."),
  result: z.string().min(5, "Result coordinate is required.")
});

export const saveStarSchema = z.object({
  role: z.string().min(1),
  company: z.string().min(1),
  situation: z.string().min(1),
  task: z.string().min(1),
  action: z.string().min(1),
  result: z.string().min(1),
  expertStory: z.string().min(1),
  title: z.string().optional()
});

// 1. ANALYZE JD
export async function analyzeJdHandler(req: AuthenticatedRequest, res: Response) {
  const { jd, companyName, persona, interviewerCount } = req.body;
  const count = parseInt(String(interviewerCount || "1"), 10);

  try {
    const analysis = await analyzeJobDescription({
      jd,
      companyName,
      persona: persona || "mentor",
      interviewerCount: count
    });

    if (req.user?.userId) {
      await insertActivity({
        userId: req.user.userId,
        activityType: "JD_ANALYZED",
        activityName: "Job Description Analysis",
        description: `Analyzed JD for ${companyName || "Target Role"} with ${count} interviewer(s).`,
        metadata: { difficulty: analysis.difficulty, skillsCount: analysis.skills.length }
      });
    }

    return res.status(200).json(analysis);
  } catch (err: any) {
    console.error("[INTERVIEW ERROR] analyzeJdHandler failed:", err);
    return res.status(500).json({
      success: false,
      error: { code: "AI_GENERATION_ERROR", message: err.message || "Failed to analyze job description." }
    });
  }
}

// 2. EVALUATE COMPLETE INTERVIEW
export async function evaluateInterviewHandler(req: AuthenticatedRequest, res: Response) {
  const { 
    role, 
    company, 
    companyName, 
    jd, 
    difficulty, 
    interviewerCount, 
    qaPairs, 
    qaList, 
    answers, 
    timeTaken 
  } = req.body;

  const targetRole = role || jd || "Software Engineer";
  const targetCompany = company || companyName || "Target Company";
  const count = parseInt(String(interviewerCount || "1"), 10);
  const rawPairs = qaPairs || qaList || answers || [];

  const normalizedQAPairs = rawPairs.map((q: any, idx: number) => ({
    questionId: typeof q.questionId === "number" ? q.questionId : (idx + 1),
    questionText: q.questionText || q.text || `Question ${idx + 1}`,
    type: q.type || "technical",
    answerText: q.answerText || q.answer || "(No answer provided)"
  }));

  try {
    const evaluation = await evaluateInterviewSession({
      role: targetRole,
      company: targetCompany,
      difficulty: difficulty || "Senior",
      interviewerCount: count,
      qaPairs: normalizedQAPairs
    });

    // Authoritative Interview Record Persistence
    if (req.user?.userId) {
      const interviewRecord: InterviewSessionRecord = {
        id: generateUUID(),
        userId: req.user.userId,
        company: targetCompany,
        role: targetRole,
        difficulty: (difficulty as any) || "Senior",
        interviewerCount: count,
        persona: "mentor",
        state: "COMPLETED",
        score: evaluation.score,
        timeTaken: timeTaken || "15m",
        questions: normalizedQAPairs.map((q) => ({
          id: q.questionId,
          text: q.questionText,
          type: q.type as any
        })),
        answers: normalizedQAPairs,
        evaluation,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await insertInterview(interviewRecord);

      await insertActivity({
        userId: req.user.userId,
        activityType: "INTERVIEW_COMPLETED",
        activityName: "Mock Interview Completed",
        description: `Completed ${targetRole} mock interview for ${targetCompany}. Score: ${evaluation.score}%.`,
        metadata: { score: evaluation.score, rating: evaluation.overallRating }
      });
    }

    return res.status(200).json(evaluation);
  } catch (err: any) {
    console.error("[INTERVIEW ERROR] evaluateInterviewHandler failed:", err);
    return res.status(500).json({
      success: false,
      error: { code: "EVALUATION_FAILED", message: err.message || "Failed to evaluate interview transcript." }
    });
  }
}

// 3. GENERATE DRAFT ANSWER
export async function generateDraftAnswerHandler(req: AuthenticatedRequest, res: Response) {
  const { questionText, questionType, role, company, roleName, companyName } = req.body;
  if (!questionText) {
    return res.status(400).json({ success: false, error: { code: "INVALID_INPUT", message: "Question text is required." } });
  }

  const targetRole = role || roleName || "Senior Engineer";
  const targetCompany = company || companyName || "Tier-1 technology firm";

  try {
    const draftAnswer = await generateDraftAnswer({
      questionText,
      questionType,
      role: targetRole,
      company: targetCompany
    });

    return res.status(200).json({
      success: true,
      draftAnswer
    });
  } catch (err: any) {
    console.warn("[AI WARN] generateDraftAnswerHandler encountered error:", err?.message || err);
    return res.status(200).json({
      success: true,
      draftAnswer: `**Situation & Context:** In high-throughput systems for a ${targetRole} tier at ${targetCompany}, technical execution begins by establishing observability baselines and identifying bottleneck components.\n\n**Action & Technical Execution:** I designed a decoupled worker pipeline utilizing distributed caching with deterministic key hashing and idempotent state transitions to prevent race conditions.\n\n**Impact & Evaluation:** This structural pattern eliminated contention bottlenecks, sustained consistent latency under peak load, and ensured verifiable data consistency across replicas.`
    });
  }
}

// 4. EVALUATE STAR STORY
export async function evaluateStarHandler(req: AuthenticatedRequest, res: Response) {
  const { role, company, situation, task, action, result } = req.body;

  try {
    const evaluation = await evaluateSTARStory({
      role,
      company,
      situation,
      task,
      action,
      result
    });

    return res.status(200).json(evaluation);
  } catch (err: any) {
    console.error("[STAR ERROR] evaluateStarHandler failed:", err);
    return res.status(500).json({
      success: false,
      error: { code: "STAR_EVALUATION_FAILED", message: err.message || "Failed to evaluate STAR narrative." }
    });
  }
}

// 5. LIST USER INTERVIEW SESSIONS
export async function listInterviewsHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user?.userId) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
  }

  const interviews = await listInterviewsByUserId(req.user.userId);
  return res.status(200).json({
    success: true,
    interviews
  });
}

// 6. GET SINGLE INTERVIEW
export async function getInterviewByIdHandler(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id;
  const interview = await findInterviewById(id);

  if (!interview || interview.userId !== req.user?.userId) {
    return res.status(404).json({ success: false, error: { code: "INTERVIEW_NOT_FOUND", message: "Interview session not found." } });
  }

  return res.status(200).json({
    success: true,
    interview
  });
}

// 7. STAR STORIES CRUD
export async function listStarStoriesHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user?.userId) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
  }

  const stories = await listSTARStoriesByUserId(req.user.userId);
  return res.status(200).json({
    success: true,
    stories
  });
}

export async function saveStarStoryHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user?.userId) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
  }

  const { role, company, situation, task, action, result, expertStory, title } = req.body;

  const newStory: SavedSTARStoryRecord = {
    id: generateUUID(),
    userId: req.user.userId,
    role,
    company,
    situation,
    task,
    action,
    result,
    expertStory,
    title: title || `${role} at ${company}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await insertSTARStory(newStory);

  await insertActivity({
    userId: req.user.userId,
    activityType: "STAR_STORY_SAVED",
    activityName: "STAR Narrative Saved",
    description: `Saved STAR behavioral narrative for ${newStory.title}.`
  });

  return res.status(201).json({
    success: true,
    message: "STAR story saved to answer bank.",
    story: newStory
  });
}

export async function deleteStarStoryHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user?.userId) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
  }

  const id = req.params.id;
  await deleteSTARStoryById(id, req.user.userId);

  return res.status(200).json({
    success: true,
    message: "STAR story deleted."
  });
}

// 8. START ADAPTIVE INTERVIEW SESSION (Bounded, Single Persistent Record)
export async function startAdaptiveInterviewHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user?.userId) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
  }

  const { sessionId, role, company, difficulty, interviewerCount, questions } = req.body;
  const count = parseInt(String(interviewerCount || "1"), 10);

  try {
    const sessionState = await InterviewOrchestrator.startSession({
      sessionId,
      userId: req.user.userId,
      targetRole: role,
      company,
      difficulty,
      interviewerCount: count,
      initialQuestions: questions
    });

    await insertActivity({
      userId: req.user.userId,
      activityType: "INTERVIEW_STARTED",
      activityName: "Adaptive Interview Started",
      description: `Started adaptive mock interview for ${role} at ${company}.`,
      metadata: { sessionId: sessionState.sessionId, difficulty }
    });

    return res.status(201).json({
      success: true,
      state: sessionState
    });
  } catch (err: any) {
    console.error("[ORCHESTRATOR ERROR] startAdaptiveInterviewHandler failed:", err);
    return res.status(500).json({
      success: false,
      error: { code: "START_SESSION_FAILED", message: err.message || "Failed to initialize adaptive interview session." }
    });
  }
}

// 9. PROCESS ADAPTIVE TURN & PROGRESS
export async function processAdaptiveTurnHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user?.userId) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
  }

  const { sessionId, answer, timeTaken } = req.body;

  try {
    const result = await InterviewOrchestrator.submitAnswerAndProgress({
      sessionId,
      userId: req.user.userId,
      candidateAnswer: answer,
      timeTaken
    });

    if (result.isCompleted && req.user.userId) {
      await insertActivity({
        userId: req.user.userId,
        activityType: "INTERVIEW_COMPLETED",
        activityName: "Adaptive Interview Completed",
        description: `Completed adaptive interview. Score: ${result.state.evaluation?.score || 0}%.`,
        metadata: { sessionId, score: result.state.evaluation?.score }
      });
    }

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (err: any) {
    console.error("[ORCHESTRATOR ERROR] processAdaptiveTurnHandler failed:", err);
    return res.status(500).json({
      success: false,
      error: { code: "TURN_PROCESSING_FAILED", message: err.message || "Failed to process interview turn." }
    });
  }
}

// 10. GET ADAPTIVE INTERVIEW STATE (Recoverable from Persistent DB)
export async function getAdaptiveInterviewStateHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user?.userId) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
  }

  const sessionId = req.params.sessionId || req.params.id;
  const state = await InterviewOrchestrator.loadOrRestoreState(sessionId);

  if (!state || state.userId !== req.user.userId) {
    return res.status(404).json({
      success: false,
      error: { code: "SESSION_NOT_FOUND", message: "Interview session state not found." }
    });
  }

  return res.status(200).json({
    success: true,
    state
  });
}

