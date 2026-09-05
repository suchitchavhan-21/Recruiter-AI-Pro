/**
 * Recruiter AI Pro — Coding Challenge & Practice Controller
 * 
 * Tenant-scoped endpoints for coding practice problems, safe sandbox execution, and progress analytics.
 */

import { Request, Response } from "express";
import { z } from "zod";
import { findCodingQuestions, findCodingQuestionById, insertCodingAttempt, findCodingAttemptsByUserId, generateUUID } from "../db/repository";
import type { CodingAttemptRecord } from "../db/schema";
import { executeInSandbox } from "../services/codeSandbox";
import { seedCodingQuestionsIfEmpty } from "../services/codingBank";

export const submitCodeSchema = z.object({
  questionId: z.string().min(1, "Question ID is required"),
  code: z.string().min(1, "Code is required").max(15000, "Code exceeds 15KB limit"),
  language: z.enum(["javascript", "typescript"]).default("javascript"),
  timeToSolveSeconds: z.number().nonnegative().default(0),
  hintsUsed: z.number().nonnegative().default(0)
});

/**
 * List all coding questions with visible test cases.
 */
export async function listCodingQuestionsHandler(req: Request, res: Response) {
  try {
    await seedCodingQuestionsIfEmpty();
    const category = req.query.category ? String(req.query.category) : undefined;
    const difficulty = req.query.difficulty ? String(req.query.difficulty) : undefined;

    const questions = await findCodingQuestions({ category, difficulty });
    // Sanitize to hide hidden test cases from list
    const sanitized = questions.map(q => ({
      id: q.id,
      title: q.title,
      difficulty: q.difficulty,
      category: q.category,
      description: q.description,
      expectedComplexity: q.expectedComplexity,
      hintsCount: q.hints?.length || 0,
      createdAt: q.createdAt
    }));

    return res.status(200).json({ questions: sanitized });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to list coding questions", details: err.message });
  }
}

/**
 * Get question details by ID with starter code and public test cases.
 */
export async function getCodingQuestionByIdHandler(req: Request, res: Response) {
  try {
    await seedCodingQuestionsIfEmpty();
    const { id } = req.params;
    const question = await findCodingQuestionById(id);
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    // Only expose non-hidden test cases to client editor
    const publicTestCases = question.testCases.filter(tc => !tc.hidden);

    return res.status(200).json({
      question: {
        id: question.id,
        title: question.title,
        difficulty: question.difficulty,
        category: question.category,
        description: question.description,
        starterCode: question.starterCode,
        visibleTestCases: publicTestCases,
        expectedComplexity: question.expectedComplexity,
        hints: question.hints
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to retrieve coding question", details: err.message });
  }
}

/**
 * Submit solution and execute against full test suite in isolated sandbox.
 */
export async function submitCodingSolutionHandler(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "UNAUTHORIZED", message: "Authentication required" });
    }

    const { questionId, code, language, timeToSolveSeconds, hintsUsed } = req.body;
    const question = await findCodingQuestionById(questionId);
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    // Determine entry function from question ID (e.g. "two-sum" -> "twoSum", "valid-parentheses" -> "isValid")
    let entryFunctionName = "solution";
    if (questionId === "two-sum") entryFunctionName = "twoSum";
    else if (questionId === "valid-parentheses") entryFunctionName = "isValid";
    else if (questionId === "binary-search") entryFunctionName = "search";

    // Run in isolated sandbox
    const sandboxResult = await executeInSandbox(
      code,
      entryFunctionName,
      question.testCases,
      question.expectedComplexity
    );

    // Compute comprehensive coding metrics
    const priorAttempts = (await findCodingAttemptsByUserId(userId)).filter(a => a.questionId === questionId);
    const attemptNumber = priorAttempts.length + 1;
    const testPassRate = sandboxResult.totalTests > 0 
      ? Math.round((sandboxResult.passedTests / sandboxResult.totalTests) * 100) 
      : 0;
    
    const edgeCasesPassed = (sandboxResult.results || []).filter(r => r.hidden && r.passed).length;
    const totalEdgeCases = (question.testCases || []).filter(tc => tc.hidden).length;

    // First working solution and final solution metrics
    const firstPassedPrior = priorAttempts.find(a => a.status === "PASSED");
    const isFirstWorkingSolution = sandboxResult.status === "PASSED" && !firstPassedPrior;
    const timeToFirstWorkingSolution = isFirstWorkingSolution 
      ? (timeToSolveSeconds || 0) 
      : (firstPassedPrior?.timeToSolveSeconds || (sandboxResult.status === "PASSED" ? (timeToSolveSeconds || 0) : null));
    
    const priorSolveTime = priorAttempts.reduce((acc, a) => acc + (a.timeToSolveSeconds || 0), 0);
    const timeToFinalSolution = priorSolveTime + (timeToSolveSeconds || 0);

    // Code Quality & Communication heuristic indicators
    const hasComments = /\/\*[\s\S]*?\*\/|\/\/.*/.test(code);
    const codeQuality = sandboxResult.complexityAssessment.isOptimal
      ? (hasComments ? 95 : 85)
      : (hasComments ? 80 : 70);
    const communication = hasComments ? "Clear in-code documentation and comments" : "Standard implementation; recommend documenting edge-case handling";

    // Save attempt record
    const attemptRecord = {
      id: generateUUID(),
      userId,
      questionId,
      code,
      language,
      status: ((sandboxResult.status === "PASSED" || sandboxResult.status === "FAILED" || sandboxResult.status === "TIMEOUT")
        ? sandboxResult.status
        : "ERROR") as CodingAttemptRecord["status"],
      passedTests: sandboxResult.passedTests,
      totalTests: sandboxResult.totalTests,
      runtimeMs: sandboxResult.runtimeMs,
      memoryBytes: sandboxResult.memoryBytes,
      timeToSolveSeconds,
      hintsUsed,
      complexityAssessment: sandboxResult.complexityAssessment,
      interviewerFeedback: sandboxResult.interviewerFeedback,
      createdAt: new Date().toISOString()
    };

    await insertCodingAttempt(attemptRecord);

    return res.status(200).json({
      attemptId: attemptRecord.id,
      status: sandboxResult.status,
      passedTests: sandboxResult.passedTests,
      totalTests: sandboxResult.totalTests,
      testPassRate,
      executionTimeMs: sandboxResult.runtimeMs,
      memoryUsage: sandboxResult.memoryBytes,
      attempts: attemptNumber,
      hintsUsed,
      timeToFirstWorkingSolution,
      timeToFinalSolution,
      edgeCasesPassed,
      totalEdgeCases,
      algorithmicComplexity: sandboxResult.complexityAssessment,
      codeQuality,
      communication,
      results: sandboxResult.results,
      interviewerFeedback: sandboxResult.interviewerFeedback
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to evaluate code submission", details: err.message });
  }
}

/**
 * Get candidate coding practice analytics (tenant-scoped).
 */
export async function getCodingAnalyticsHandler(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "UNAUTHORIZED", message: "Authentication required" });
    }

    const attempts = await findCodingAttemptsByUserId(userId);
    const questions = await findCodingQuestions();
    const questionMap = new Map(questions.map(q => [q.id, q]));

    const totalAttempts = attempts.length;
    const passedAttempts = attempts.filter(a => a.status === "PASSED");
    const uniqueSolved = new Set(passedAttempts.map(a => a.questionId)).size;

    const overallAccuracy = totalAttempts > 0 ? Math.round((passedAttempts.length / totalAttempts) * 100) : 0;
    const avgSolveTimeSeconds = passedAttempts.length > 0
      ? Math.round(passedAttempts.reduce((acc, a) => acc + (a.timeToSolveSeconds || 0), 0) / passedAttempts.length)
      : 0;
    const totalHintsUsed = attempts.reduce((acc, a) => acc + (a.hintsUsed || 0), 0);

    // Category breakdown
    const categoryStats: Record<string, { attempts: number; passed: number; accuracy: number }> = {};
    // Difficulty breakdown
    const difficultyStats: Record<string, { attempts: number; passed: number; accuracy: number }> = {
      Easy: { attempts: 0, passed: 0, accuracy: 0 },
      Medium: { attempts: 0, passed: 0, accuracy: 0 },
      Hard: { attempts: 0, passed: 0, accuracy: 0 }
    };

    for (const a of attempts) {
      const q = questionMap.get(a.questionId);
      const cat = q?.category || "general";
      const diff = q?.difficulty || "Medium";

      if (!categoryStats[cat]) {
        categoryStats[cat] = { attempts: 0, passed: 0, accuracy: 0 };
      }
      categoryStats[cat].attempts++;
      if (difficultyStats[diff]) {
        difficultyStats[diff].attempts++;
      }

      if (a.status === "PASSED") {
        categoryStats[cat].passed++;
        if (difficultyStats[diff]) {
          difficultyStats[diff].passed++;
        }
      }
    }

    for (const cat of Object.keys(categoryStats)) {
      const stat = categoryStats[cat];
      stat.accuracy = Math.round((stat.passed / stat.attempts) * 100);
    }
    for (const diff of Object.keys(difficultyStats)) {
      const stat = difficultyStats[diff];
      stat.accuracy = stat.attempts > 0 ? Math.round((stat.passed / stat.attempts) * 100) : 0;
    }

    // Identify weak & strong categories
    const categoryEntries = Object.entries(categoryStats);
    const strongCategories = categoryEntries.filter(([_, s]) => s.accuracy >= 70).map(([cat]) => cat);
    const weakCategories = categoryEntries.filter(([_, s]) => s.accuracy < 60).map(([cat]) => cat);

    // Trend assessment (recent 5 attempts vs older)
    let trend: "improving" | "stable" | "needs_attention" = "stable";
    if (attempts.length >= 6) {
      const recent = attempts.slice(0, Math.floor(attempts.length / 2));
      const older = attempts.slice(Math.floor(attempts.length / 2));
      const recentAcc = recent.filter(a => a.status === "PASSED").length / recent.length;
      const olderAcc = older.filter(a => a.status === "PASSED").length / older.length;
      if (recentAcc > olderAcc + 0.1) trend = "improving";
      else if (recentAcc < olderAcc - 0.1) trend = "needs_attention";
    }

    // Recommended practice area
    let recommendedPractice = "Solve medium algorithmic questions";
    if (weakCategories.length > 0) {
      recommendedPractice = `Practice more questions in '${weakCategories[0]}' to improve edge-case handling`;
    } else if (difficultyStats.Medium.accuracy < 60 && difficultyStats.Medium.attempts > 0) {
      recommendedPractice = "Focus on Medium-difficulty questions in dynamic programming and tree traversal";
    } else if (uniqueSolved < 3) {
      recommendedPractice = "Complete initial problem set across arrays, strings, and search";
    }

    return res.status(200).json({
      analytics: {
        totalAttempts,
        uniqueQuestionsSolved: uniqueSolved,
        overallAccuracy,
        avgSolveTimeSeconds,
        totalHintsUsed,
        trend,
        categoryStats,
        difficultyStats,
        strongCategories,
        weakCategories,
        recommendedPractice,
        recentAttempts: attempts.slice(0, 10).map(a => ({
          id: a.id,
          questionId: a.questionId,
          questionTitle: questionMap.get(a.questionId)?.title || a.questionId,
          status: a.status,
          passedTests: a.passedTests,
          totalTests: a.totalTests,
          runtimeMs: a.runtimeMs,
          createdAt: a.createdAt
        }))
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to generate coding analytics", details: err.message });
  }
}
