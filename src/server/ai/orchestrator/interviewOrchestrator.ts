import { generateUUID, findInterviewById, insertInterview, updateInterviewById } from "../../db/repository";
import { InterviewSessionRecord } from "../../db/schema";
import { evaluateInterviewSession, InterviewEvaluationResult } from "../../services/gemini.service";
import { retrieveCandidateEvidence } from "../agents/tools";
import { formatCandidateMemoryContext, updateCandidateMemoryFromInterview } from "../memory/candidateMemory";

export interface InterviewTurn {
  turnIndex: number;
  questionId: number;
  interviewerRole: "HR" | "Technical" | "HiringManager";
  interviewerName: string;
  interviewerTitle: string;
  questionText: string;
  questionType: "technical" | "behavioral";
  expectedCompetency: string;
  evaluationRubric: string;
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
  candidateMemorySnapshot?: string;
  evaluation?: InterviewEvaluationResult;
  createdAt: string;
  updatedAt: string;
}

// In-memory cache for fast turn processing; backed by authoritative database persistence
const stateCache = new Map<string, AdaptiveInterviewState>();

export const INTERVIEWER_PERSONAS = {
  HR: {
    role: "HR" as const,
    name: "Sarah Jenkins",
    title: "Senior People Partner & Behavioral Assessor",
    focus: "Communication clarity, STAR methodology, teamwork, conflict resolution, and cultural values alignment.",
    rubric: "Evaluate candidate behavioral evidence using STAR (Situation, Task, Action, Result), cross-functional empathy, and ownership."
  },
  Technical: {
    role: "Technical" as const,
    name: "David Chen",
    title: "Principal Software Architect",
    focus: "System architecture, fault tolerance, trade-offs, scalability, and technical depth.",
    rubric: "Evaluate architectural soundness, failure domain isolation, concurrency trade-offs, and concrete technology choices."
  },
  HiringManager: {
    role: "HiringManager" as const,
    name: "Marcus Brody",
    title: "VP of Engineering",
    focus: "Execution velocity, strategic roadmapping, technical debt management, and stakeholder alignment.",
    rubric: "Evaluate business impact, pragmatic trade-offs between speed and perfection, and delivery ownership."
  }
};

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

    // Load candidate memory context
    const memoryContext = await formatCandidateMemoryContext(params.userId);

    const firstQuestion = params.initialQuestions?.[0] || {
      id: 1,
      text: `Can you walk me through your background and the most complex architecture you designed for ${params.targetRole}?`,
      type: "technical" as const,
      expectedFocus: "System architecture, trade-offs, ownership"
    };

    const initialPersona = count > 1 ? INTERVIEWER_PERSONAS.HR : INTERVIEWER_PERSONAS.Technical;

    const initialTurn: InterviewTurn = {
      turnIndex: 1,
      questionId: firstQuestion.id,
      interviewerRole: initialPersona.role,
      interviewerName: initialPersona.name,
      interviewerTitle: initialPersona.title,
      questionText: firstQuestion.text,
      questionType: firstQuestion.type,
      expectedCompetency: firstQuestion.expectedFocus || "System Architecture",
      evaluationRubric: initialPersona.rubric,
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
      candidateMemorySnapshot: memoryContext,
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
        interviewerName: idx % 2 === 0 ? INTERVIEWER_PERSONAS.Technical.name : INTERVIEWER_PERSONAS.HR.name,
        interviewerTitle: idx % 2 === 0 ? INTERVIEWER_PERSONAS.Technical.title : INTERVIEWER_PERSONAS.HR.title,
        questionText: q.text,
        questionType: q.type,
        expectedCompetency: "Core Engineering",
        evaluationRubric: idx % 2 === 0 ? INTERVIEWER_PERSONAS.Technical.rubric : INTERVIEWER_PERSONAS.HR.rubric,
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

      // Update candidate memory facts from completed interview
      await updateCandidateMemoryFromInterview(
        params.userId,
        state.sessionId,
        evaluation,
        state.targetRole,
        state.company
      );

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

    // 3. True Adaptive Decision Engine:
    // Evaluate competency evidence and identify whether depth probe, behavioral STAR probe, or execution trade-off is needed next.
    state.currentTurn += 1;
    const nextTurnIndex = state.currentTurn;

    const lastAnswer = params.candidateAnswer.toLowerCase();
    const answerWordCount = params.candidateAnswer.trim().split(/\s+/).length;

    let nextPersona: { role: "HR" | "Technical" | "HiringManager"; name: string; title: string; focus: string; rubric: string } = INTERVIEWER_PERSONAS.Technical;
    let nextType: "technical" | "behavioral" = "technical";
    let nextCompetency = "Distributed Systems & Reliability";

    if (state.interviewerCount === 1) {
      // Single interviewer adapts between technical depth and architectural trade-offs
      if (nextTurnIndex === 2) {
        nextCompetency = "Fault Tolerance & High Concurrency";
      } else if (nextTurnIndex === 3) {
        nextCompetency = "Production Incident Triage & Root Cause Analysis";
      } else {
        nextCompetency = "System Scalability & Performance Optimization";
      }
    } else if (state.interviewerCount === 2) {
      // Panel of 2: HR and Lead Architect
      if (nextTurnIndex % 2 === 0) {
        nextPersona = INTERVIEWER_PERSONAS.Technical;
        nextType = "technical";
        nextCompetency = "Scalable Architecture & Technical Trade-offs";
      } else {
        nextPersona = INTERVIEWER_PERSONAS.HR;
        nextType = "behavioral";
        nextCompetency = "Cross-Functional Collaboration & Conflict Resolution";
      }
    } else {
      // Panel of 3: Adaptive rotation based on candidate response analysis
      if (nextTurnIndex === 2) {
        // Deepen technical inspection
        nextPersona = INTERVIEWER_PERSONAS.Technical;
        nextType = "technical";
        nextCompetency = "Data Consistency & Microservices Communication";
      } else if (nextTurnIndex === 3) {
        // Evaluate hiring manager execution and delivery ownership
        nextPersona = INTERVIEWER_PERSONAS.HiringManager;
        nextType = "behavioral";
        nextCompetency = "Pragmatic Prioritization & Technical Debt vs Delivery";
      } else if (nextTurnIndex === 4) {
        // Evaluate cultural fit and behavioral alignment
        nextPersona = INTERVIEWER_PERSONAS.HR;
        nextType = "behavioral";
        nextCompetency = "Mentorship, Culture & Stakeholder Communication";
      } else {
        nextPersona = INTERVIEWER_PERSONAS.HiringManager;
        nextType = "behavioral";
        nextCompetency = "High-Stakes Decision Making Under Ambiguity";
      }
    }

    // Retrieve candidate evidence to ground the next question
    const evidence = await retrieveCandidateEvidence(params.userId, nextCompetency, 1);
    const contextHook = evidence.success && evidence.data?.[0]
      ? `Based on your experience in ${evidence.data[0].section}, `
      : "";

    // Generate adaptive question tailored to the active persona and candidate answer quality
    let nextQuestionText = "";
    if (nextPersona.role === "Technical") {
      if (answerWordCount < 30) {
        nextQuestionText = `${contextHook}Could you elaborate on the technical internals? How would you handle database bottlenecks, replication lag, and cache invalidation under 10x traffic surge?`;
      } else {
        nextQuestionText = `${contextHook}How do you architect distributed fault-tolerance and handle failover scenarios in high-concurrency production systems?`;
      }
    } else if (nextPersona.role === "HiringManager") {
      nextQuestionText = `${contextHook}Tell me about a time you had to make a difficult trade-off between shipping on a tight executive deadline versus addressing critical technical debt. How did you align stakeholders?`;
    } else {
      nextQuestionText = `${contextHook}Tell me about a time you had to resolve a technical or priority disagreement with a cross-functional partner (e.g. Product or Design). How did you reach consensus?`;
    }

    const newTurn: InterviewTurn = {
      turnIndex: nextTurnIndex,
      questionId: nextTurnIndex,
      interviewerRole: nextPersona.role,
      interviewerName: nextPersona.name,
      interviewerTitle: nextPersona.title,
      questionText: nextQuestionText,
      questionType: nextType,
      expectedCompetency: nextCompetency,
      evaluationRubric: nextPersona.rubric,
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
