import { Response } from "express";
import { z } from "zod";
import { 
  analyzeJobDescription, 
  evaluateInterviewSession, 
  evaluateSTARStory, 
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

export const analyzeJdSchema = z.object({
  jd: z.string().min(10, "Job description must be at least 10 characters long."),
  companyName: z.string().optional(),
  persona: z.enum(["mentor", "architect", "product_leader"]).optional(),
  interviewerCount: z.union([z.number(), z.string()]).optional()
});

export const evaluateInterviewSchema = z.object({
  role: z.string().min(1, "Role is required."),
  company: z.string().min(1, "Company is required."),
  difficulty: z.string().optional(),
  interviewerCount: z.union([z.number(), z.string()]).optional(),
  qaPairs: z.array(z.object({
    questionId: z.number(),
    questionText: z.string(),
    type: z.string(),
    answerText: z.string()
  })).min(1, "At least one question/answer pair is required."),
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
  const { role, company, difficulty, interviewerCount, qaPairs, timeTaken } = req.body;
  const count = parseInt(String(interviewerCount || "1"), 10);

  try {
    const evaluation = await evaluateInterviewSession({
      role,
      company,
      difficulty: difficulty || "Senior",
      interviewerCount: count,
      qaPairs
    });

    // Authoritative Interview Record Persistence
    if (req.user?.userId) {
      const interviewRecord: InterviewSessionRecord = {
        id: generateUUID(),
        userId: req.user.userId,
        company,
        role,
        difficulty: (difficulty as any) || "Senior",
        interviewerCount: count,
        persona: "mentor",
        state: "COMPLETED",
        score: evaluation.score,
        timeTaken: timeTaken || "15m",
        questions: qaPairs.map((q: any) => ({
          id: q.questionId,
          text: q.questionText,
          type: q.type as any
        })),
        answers: qaPairs,
        evaluation,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await insertInterview(interviewRecord);

      await insertActivity({
        userId: req.user.userId,
        activityType: "INTERVIEW_COMPLETED",
        activityName: "Mock Interview Completed",
        description: `Completed ${role} mock interview for ${company}. Score: ${evaluation.score}%.`,
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
  const { questionText, questionType, role, company } = req.body;
  if (!questionText) {
    return res.status(400).json({ success: false, error: { code: "INVALID_INPUT", message: "Question text is required." } });
  }

  try {
    const client = getGeminiClient();
    const prompt = `
You are a Principal Engineering Director and Master Interview Coach.
Generate a concise, elite model answer using the STAR method (or clear technical system architecture structure) for the following question for a ${role || "Senior"} position at ${company || "a Tier-1 technology firm"}:

Question: "${questionText}"
Type: ${questionType || "technical"}

Provide a high-impact, direct 3-paragraph answer with clear context, specific architecture/technical decisions, and quantified business metrics.
`;

    const response = await client.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: { temperature: 0.3 }
    });

    return res.status(200).json({
      success: true,
      draftAnswer: response.text || "Here is a structured, executive-level response covering situation context, architectural execution, and quantitative business impact."
    });
  } catch (err: any) {
    console.error("[AI ERROR] generateDraftAnswer failed:", err);
    return res.status(500).json({
      success: false,
      error: { code: "DRAFT_GENERATION_FAILED", message: err.message || "Failed to generate draft answer." }
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
