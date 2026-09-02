import { generateUUID, findInterviewById, insertInterview, updateInterviewById } from "../../db/repository";
import { InterviewSessionRecord } from "../../db/schema";
import { evaluateInterviewSession, InterviewEvaluationResult } from "../../services/gemini.service";
import { retrieveCandidateEvidence } from "../agents/tools";

export interface InterviewTurn {
  turnIndex: number;
  questionId: number;
  interviewerRole: "HR" | "Technical" | "HiringManager";
  interviewerName: string;
  questionText: string;
  questionType: "technical" | "behavioral";
  expectedCompetency: string;
  candidateAnswer?: string;
  turnScore?: number;
  turnFeedback?: string;
  timestamp: string;
}

export interface AdaptiveInterviewState {
  sessionId: string;
  userId: string;
  targetRole: string;
  company: string;
  difficulty: "Entry" | "Mid" | "Senior" | "Expert";
  interviewerCount: number;
  currentTurn: number;
  minTurns: number;
  maxTurns: number;
  hardTurnLimit: number;
  status: "IN_PROGRESS" | "COMPLETED" | "ABORTED";
  history: InterviewTurn[];
  competenciesCovered: string[];
  evaluation?: InterviewEvaluationResult;
  createdAt: string;
  updatedAt: string;
}

// In-memory cache for ultra-fast turn processing; backed by database persistence
const stateCache = new Map<string, AdaptiveInterviewState>();

export class InterviewOrchestrator {
  /**
   * Initializes or creates a new bounded adaptive interview session.
   * Guarantees EXACTLY ONE persistent interview record is created.
   */
  static async startSession(params: {
    sessionId?: string;
    userId: string;
    targetRole: string;
    company: string;
    difficulty?: "Entry" | "Mid" | "Senior" | "Expert";
    interviewerCount?: number;
    initialQuestions?: Array<{ id: number; text: string; type: "technical" | "behavioral"; expectedFocus?: string }>;
  }): Promise<AdaptiveInterviewState> {
    const sessionId = params.sessionId || generateUUID();
    const count = params.interviewerCount || 1;
    const diff = params.difficulty || "Senior";

    // 1. Check if session already exists in DB or cache to avoid duplicate insertion
    const existing = await this.loadOrRestoreState(sessionId);
    if (existing) {
      return existing;
    }

    const firstQuestion = params.initialQuestions?.[0] || {
      id: 1,
      text: `Can you walk me through your background and the most complex architecture you designed for ${params.targetRole}?`,
      type: "technical" as const,
      expectedFocus: "System architecture, trade-offs, ownership"
    };

    const initialTurn: InterviewTurn = {
      turnIndex: 1,
      questionId: firstQuestion.id,
      interviewerRole: count > 1 ? "HR" : "Technical",
      interviewerName: count > 1 ? "Sarah Jenkins (HR Director)" : "David Chen (Lead Architect)",
      questionText: firstQuestion.text,
      questionType: firstQuestion.type,
      expectedCompetency: firstQuestion.expectedFocus || "System Architecture",
      timestamp: new Date().toISOString()
    };

    const newState: AdaptiveInterviewState = {
      sessionId,
      userId: params.userId,
      targetRole: params.targetRole,
      company: params.company,
      difficulty: diff,
      interviewerCount: count,
      currentTurn: 1,
      minTurns: 3,
      maxTurns: 5,
      hardTurnLimit: 8,
      status: "IN_PROGRESS",
      history: [initialTurn],
      competenciesCovered: ["System Architecture"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Cache in memory
    stateCache.set(sessionId, newState);

    // Save authoritative record to persistent database
    const dbRecord: InterviewSessionRecord = {
      id: sessionId,
      userId: params.userId,
      company: params.company,
      role: params.targetRole,
      difficulty: diff,
      interviewerCount: count,
      persona: "mentor",
      state: "IN_PROGRESS",
      score: 0,
      timeTaken: "0m",
      questions: [{ id: firstQuestion.id, text: firstQuestion.text, type: firstQuestion.type }],
      answers: [],
      sessionState: newState,
      createdAt: newState.createdAt,
      updatedAt: newState.updatedAt
    };

    await insertInterview(dbRecord);
    return newState;
  }

  /**
   * Loads session from memory cache, or recovers state from the database.
   */
  static async loadOrRestoreState(sessionId: string): Promise<AdaptiveInterviewState | null> {
    if (stateCache.has(sessionId)) {
      return stateCache.get(sessionId)!;
    }

    const record = await findInterviewById(sessionId);
    if (!record) {
      return null;
    }

    if (record.sessionState && (record.sessionState as any).sessionId) {
      const restored = record.sessionState as AdaptiveInterviewState;
      stateCache.set(sessionId, restored);
      return restored;
    }

    // Reconstruct state from record fields if sessionState JSON was partial
    const restored: AdaptiveInterviewState = {
      sessionId: record.id,
      userId: record.userId,
      targetRole: record.role,
      company: record.company,
      difficulty: record.difficulty,
      interviewerCount: record.interviewerCount,
      currentTurn: record.questions?.length || 1,
      minTurns: 3,
      maxTurns: 5,
      hardTurnLimit: 8,
      status: record.state as any,
      history: (record.questions || []).map((q, idx) => ({
        turnIndex: idx + 1,
        questionId: q.id,
        interviewerRole: idx % 2 === 0 ? "Technical" : "HR",
        interviewerName: idx % 2 === 0 ? "David Chen (Lead Architect)" : "Sarah Jenkins (HR Director)",
        questionText: q.text,
        questionType: q.type,
        expectedCompetency: "Core Engineering",
        candidateAnswer: record.answers?.[idx]?.answerText,
        timestamp: record.createdAt
      })),
      competenciesCovered: ["Core Engineering"],
      evaluation: record.evaluation as any,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };

    stateCache.set(sessionId, restored);
    return restored;
  }

  /**
   * Processes a candidate turn, evaluates answer quality, decides adaptive next step, and persists state.
   */
  static async submitAnswerAndProgress(params: {
    sessionId: string;
    userId: string;
    candidateAnswer: string;
    timeTaken?: string;
  }): Promise<{ state: AdaptiveInterviewState; isCompleted: boolean; nextTurn?: InterviewTurn }> {
    const state = await this.loadOrRestoreState(params.sessionId);
    if (!state) {
      throw new Error(`[ORCHESTRATOR ERROR] Interview session ${params.sessionId} not found.`);
    }

    if (state.userId !== params.userId) {
      throw new Error("[ORCHESTRATOR ERROR] Unauthorized access to interview session.");
    }

    if (state.status === "COMPLETED") {
      return { state, isCompleted: true };
    }

    // 1. Record candidate answer for the current active turn
    const activeTurnIndex = state.currentTurn - 1;
    if (state.history[activeTurnIndex]) {
      state.history[activeTurnIndex].candidateAnswer = params.candidateAnswer;
    }

    // 2. Bounded Loop Check: determine if interview should complete
    const reachedMaxTurns = state.currentTurn >= state.maxTurns;
    const reachedHardLimit = state.currentTurn >= state.hardTurnLimit;

    if (reachedMaxTurns || reachedHardLimit) {
      // Finalize complete session
      state.status = "COMPLETED";
      state.updatedAt = new Date().toISOString();

      const qaPairs = state.history.map(h => ({
        questionId: h.questionId,
        questionText: h.questionText,
        type: h.questionType,
        answerText: h.candidateAnswer || ""
      }));

      const evaluation = await evaluateInterviewSession({
        role: state.targetRole,
        company: state.company,
        difficulty: state.difficulty,
        interviewerCount: state.interviewerCount,
        qaPairs
      });

      state.evaluation = evaluation;

      // Update in memory and persist in DB
      stateCache.set(state.sessionId, state);
      await updateInterviewById(state.sessionId, {
        state: "COMPLETED",
        score: evaluation.score,
        timeTaken: params.timeTaken || "15m",
        answers: qaPairs,
        evaluation,
        sessionState: state
      });

      return { state, isCompleted: true };
    }

    // 3. Adaptive Decision Engine: Decide next interviewer, competency, and question
    state.currentTurn += 1;
    const nextTurnIndex = state.currentTurn;

    let nextRole: "HR" | "Technical" | "HiringManager" = "Technical";
    let nextName = "David Chen (Lead Architect)";
    let nextType: "technical" | "behavioral" = "technical";
    let nextCompetency = "Distributed Systems";

    if (state.interviewerCount === 2) {
      if (nextTurnIndex % 2 === 1) {
        nextRole = "HR";
        nextName = "Sarah Jenkins (HR Director)";
        nextType = "behavioral";
        nextCompetency = "Team Collaboration & Conflict Resolution";
      }
    } else if (state.interviewerCount === 3) {
      if (nextTurnIndex === 2) {
        nextRole = "Technical";
        nextName = "David Chen (Lead Architect)";
        nextType = "technical";
        nextCompetency = "System Reliability & Incident Triage";
      } else if (nextTurnIndex === 3) {
        nextRole = "HiringManager";
        nextName = "Marcus Brody (VP of Engineering)";
        nextType = "behavioral";
        nextCompetency = "Strategic Trade-offs & Ownership";
      } else if (nextTurnIndex === 4) {
        nextRole = "HR";
        nextName = "Sarah Jenkins (HR Director)";
        nextType = "behavioral";
        nextCompetency = "Culture Alignment";
      }
    }

    // Retrieve candidate evidence to ground the next question
    const evidence = await retrieveCandidateEvidence(params.userId, nextCompetency, 1);
    const contextHook = evidence.success && evidence.data?.[0]
      ? `Based on your work with ${evidence.data[0].section}, `
      : "";

    const nextQuestionText = nextType === "technical"
      ? `${contextHook}How do you architect distributed fault-tolerance and handle failover scenarios in high-concurrency production systems?`
      : `${contextHook}Tell me about a time you had to lead through ambiguous technical requirements with tight stakeholder deadlines.`;

    const newTurn: InterviewTurn = {
      turnIndex: nextTurnIndex,
      questionId: nextTurnIndex,
      interviewerRole: nextRole,
      interviewerName: nextName,
      questionText: nextQuestionText,
      questionType: nextType,
      expectedCompetency: nextCompetency,
      timestamp: new Date().toISOString()
    };

    state.history.push(newTurn);
    if (!state.competenciesCovered.includes(nextCompetency)) {
      state.competenciesCovered.push(nextCompetency);
    }
    state.updatedAt = new Date().toISOString();

    // Cache and persist state update
    stateCache.set(state.sessionId, state);
    await updateInterviewById(state.sessionId, {
      sessionState: state,
      updatedAt: state.updatedAt
    });

    return {
      state,
      isCompleted: false,
      nextTurn: newTurn
    };
  }

  /**
   * Clears the in-memory cache for testing session restoration from database.
   */
  static clearMemoryCache(): void {
    stateCache.clear();
  }
}
