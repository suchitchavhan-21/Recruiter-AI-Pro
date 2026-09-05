import { generateUUID, findInterviewById, insertInterview, updateInterviewById, updateInterviewTurnAtomically, insertCompetencyScore } from "../../db/repository";
import { InterviewSessionRecord } from "../../db/schema";
import { evaluateInterviewSession, InterviewEvaluationResult } from "../../services/gemini.service";
import { retrieveCandidateEvidence } from "../agents/tools";
import { formatCandidateMemoryContext, updateCandidateMemoryFromInterview } from "../memory/candidateMemory";
import { generateInterviewBlueprint, InterviewBlueprint } from "./roleIntelligence";

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
  blueprint?: InterviewBlueprint;
  createdAt: string;
  updatedAt: string;
}

interface CacheEntry {
  state: AdaptiveInterviewState;
  updatedAtMs: number;
}

class BoundedStateCache {
  private cache = new Map<string, CacheEntry>();
  private readonly maxEntries: number;
  private readonly ttlMs: number;

  constructor(maxEntries = 100, ttlMinutes = 30) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMinutes * 60 * 1000;
  }

  get(sessionId: string): AdaptiveInterviewState | null {
    const entry = this.cache.get(sessionId);
    if (!entry) return null;
    if (Date.now() - entry.updatedAtMs > this.ttlMs) {
      this.cache.delete(sessionId);
      return null;
    }
    // Refresh LRU position
    this.cache.delete(sessionId);
    this.cache.set(sessionId, entry);
    return entry.state;
  }

  set(sessionId: string, state: AdaptiveInterviewState): void {
    if (this.cache.has(sessionId)) {
      this.cache.delete(sessionId);
    } else if (this.cache.size >= this.maxEntries) {
      // Evict oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(sessionId, { state, updatedAtMs: Date.now() });
  }

  delete(sessionId: string): void {
    this.cache.delete(sessionId);
  }

  clear(): void {
    this.cache.clear();
  }
}

// In-memory bounded LRU/TTL cache for fast turn processing; backed by authoritative database persistence
const stateCache = new BoundedStateCache(100, 30);

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

const inFlightSessionLocks = new Map<string, Promise<any>>();

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

    // Generate role-specific interview blueprint
    const blueprint = generateInterviewBlueprint({
      targetRole: params.targetRole,
      company: params.company,
      seniority: diff,
      candidateResume: memoryContext
    });

    const firstQuestion = params.initialQuestions?.[0] || {
      id: blueprint.firstQuestion.id,
      text: blueprint.firstQuestion.text,
      type: blueprint.firstQuestion.type,
      expectedFocus: blueprint.firstQuestion.expectedFocus
    };

    const initialPersona = count > 1 
      ? blueprint.interviewers.hr 
      : (blueprint.firstQuestion.interviewerRole === "HR" ? blueprint.interviewers.hr : blueprint.interviewers.domain);

    const initialTurn: InterviewTurn = {
      turnIndex: 1,
      questionId: firstQuestion.id,
      interviewerRole: initialPersona.role,
      interviewerName: initialPersona.name,
      interviewerTitle: initialPersona.title,
      questionText: firstQuestion.text,
      questionType: firstQuestion.type,
      expectedCompetency: firstQuestion.expectedFocus || blueprint.competencies[0]?.name || "Core Competency",
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
      competenciesCovered: [firstQuestion.expectedFocus || blueprint.competencies[0]?.name || "Core Competency"],
      candidateMemorySnapshot: memoryContext,
      blueprint,
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
    const cached = stateCache.get(sessionId);
    if (cached) {
      return cached;
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
   * Processes a candidate turn with serialization and concurrency protection to prevent duplicate turn advancement.
   */
  static async submitAnswerAndProgress(params: {
    sessionId: string;
    userId: string;
    candidateAnswer: string;
    turnIndex?: number;
    timeTaken?: string;
  }): Promise<{ state: AdaptiveInterviewState; isCompleted: boolean; nextTurn?: InterviewTurn }> {
    const prevLock = inFlightSessionLocks.get(params.sessionId) || Promise.resolve();
    let releaseLock: () => void = () => {};
    const currentLock = new Promise<void>((resolve) => { releaseLock = resolve; });
    inFlightSessionLocks.set(params.sessionId, currentLock);

    try {
      await prevLock;
      return await this.executeSubmitAnswer(params);
    } finally {
      releaseLock();
      if (inFlightSessionLocks.get(params.sessionId) === currentLock) {
        inFlightSessionLocks.delete(params.sessionId);
      }
    }
  }

  private static async executeSubmitAnswer(params: {
    sessionId: string;
    userId: string;
    candidateAnswer: string;
    turnIndex?: number;
    timeTaken?: string;
  }): Promise<{ state: AdaptiveInterviewState; isCompleted: boolean; nextTurn?: InterviewTurn }> {
    // Evict cached copy to load authoritative state from database
    stateCache.delete(params.sessionId);
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

    // Concurrency Protection:
    // Case A: Client specifies turnIndex and the session has already advanced past it
    if (params.turnIndex !== undefined && state.currentTurn > params.turnIndex) {
      const nextTurn = state.history[params.turnIndex] || state.history[state.history.length - 1];
      return { state, isCompleted: false, nextTurn };
    }

    // Case B: Duplicate submission detection (identical answer submitted concurrently for the turn that just advanced)
    const prevTurn = state.history[state.currentTurn - 2];
    if (prevTurn && prevTurn.candidateAnswer === params.candidateAnswer) {
      const nextTurn = state.history[state.currentTurn - 1];
      return { state, isCompleted: false, nextTurn };
    }

    // Case C: Current active turn was already answered and next turn is already prepared
    const activeTurnIndex = state.currentTurn - 1;
    if (
      state.history[activeTurnIndex]?.candidateAnswer &&
      state.history.length > state.currentTurn
    ) {
      const nextTurn = state.history[state.currentTurn];
      return { state, isCompleted: false, nextTurn };
    }

    // 1. Record candidate answer for the current active turn
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



      // Ensure blueprint exists
      const blueprint = state.blueprint || generateInterviewBlueprint({
        targetRole: state.targetRole,
        company: state.company,
        seniority: state.difficulty,
        candidateResume: state.candidateMemorySnapshot
      });
      state.blueprint = blueprint;

      const evaluation = await evaluateInterviewSession({
        role: state.targetRole,
        company: state.company,
        difficulty: state.difficulty,
        interviewerCount: state.interviewerCount,
        qaPairs,
        blueprint
      });

      state.evaluation = evaluation;

      // Persist structured competency scores in PostgreSQL
      if (evaluation.competencyScores) {
        for (const [compKey, compScore] of Object.entries(evaluation.competencyScores)) {
          try {
            await insertCompetencyScore({
              id: generateUUID(),
              sessionId: state.sessionId,
              userId: params.userId,
              competency: compKey,
              score: compScore.score,
              confidence: compScore.confidence,
              evidence: compScore.evidence,
              positiveSignals: compScore.positiveSignals || [],
              negativeSignals: compScore.negativeSignals || [],
              missingEvidence: compScore.missingEvidence || [],
              recommendedFollowUp: compScore.recommendedFollowUp || "",
              createdAt: new Date().toISOString()
            });
          } catch (scoreErr: any) {
            console.warn(`[ORCHESTRATOR WARN] Failed to persist competency score for ${compKey}:`, scoreErr?.message);
          }
        }
      }

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

    // Ensure blueprint exists
    const blueprint = state.blueprint || generateInterviewBlueprint({
      targetRole: state.targetRole,
      company: state.company,
      seniority: state.difficulty,
      candidateResume: state.candidateMemorySnapshot
    });
    state.blueprint = blueprint;

    // Identify next unresolved competency from blueprint
    const uncoveredComps = blueprint.competencies.filter(
      c => !state.competenciesCovered.some(cov => cov.toLowerCase().includes(c.name.toLowerCase()) || cov.toLowerCase().includes(c.id.toLowerCase()))
    );
    const targetComp = uncoveredComps[0] || blueprint.competencies[(nextTurnIndex - 1) % blueprint.competencies.length];
    const nextCompetency = targetComp ? targetComp.name : "Role Proficiency & Core Fundamentals";

    let nextPersona: { role: "HR" | "Technical" | "HiringManager"; name: string; title: string; focus: string; rubric: string } = blueprint.interviewers.domain;
    let nextType: "technical" | "behavioral" = targetComp?.category === "universal" ? "behavioral" : "technical";

    if (state.interviewerCount === 1) {
      nextPersona = blueprint.interviewers.domain;
      nextType = targetComp?.category === "universal" ? "behavioral" : "technical";
    } else if (state.interviewerCount === 2) {
      // Panel of 2: HR and Domain Lead
      if (nextTurnIndex % 2 === 0) {
        nextPersona = blueprint.interviewers.domain;
        nextType = "technical";
      } else {
        nextPersona = blueprint.interviewers.hr;
        nextType = "behavioral";
      }
    } else {
      // Panel of 3: Adaptive rotation (HR, Domain Lead, Hiring Manager)
      if (nextTurnIndex === 2) {
        nextPersona = blueprint.interviewers.domain;
        nextType = "technical";
      } else if (nextTurnIndex === 3) {
        nextPersona = blueprint.interviewers.hiringManager;
        nextType = "behavioral";
      } else if (nextTurnIndex === 4) {
        nextPersona = blueprint.interviewers.hr;
        nextType = "behavioral";
      } else {
        nextPersona = blueprint.interviewers.hiringManager;
        nextType = "behavioral";
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
      nextQuestionText = `${contextHook}${targetComp?.sampleQuestion || `How do you approach core methodologies and operational trade-offs for ${state.targetRole}?`}`;
    } else if (nextPersona.role === "HiringManager") {
      nextQuestionText = `${contextHook}Tell me about a time you had to make a difficult trade-off under ambiguity to deliver business impact in ${state.targetRole}. How did you align key stakeholders?`;
    } else {
      nextQuestionText = `${contextHook}Tell me about a time you had to resolve a priority disagreement or collaborate across teams in your role. How did you navigate the situation?`;
    }

    // LangChain Multi-Agent Execution:
    // Execute the selected specialist agent (Sarah Jenkins, David Chen, or Marcus Brody)
    try {
      const { executeInterviewerAgent } = await import("../langchain/agents");
      const agentResult = await executeInterviewerAgent(nextPersona.role, {
        userId: params.userId,
        targetRole: state.targetRole,
        company: state.company,
        difficulty: state.difficulty,
        turnNumber: nextTurnIndex,
        previousQuestion: state.history[activeTurnIndex]?.questionText || "",
        previousAnswer: params.candidateAnswer,
        targetCompetency: nextCompetency,
        candidateMemory: state.candidateMemorySnapshot
      });

      if (agentResult && agentResult.nextQuestion) {
        nextQuestionText = agentResult.nextQuestion;
      }
    } catch (agentErr: any) {
      console.warn(`[ORCHESTRATOR] Specialist agent execution fell back to blueprint question: ${agentErr?.message || agentErr}`);
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
    // Atomically persist state update in PostgreSQL (cross-container concurrency safe)
    const previousTurnNumber = nextTurnIndex - 1;
    const saveResult = await updateInterviewTurnAtomically(state.sessionId, previousTurnNumber, state);
    if (!saveResult.success && saveResult.currentState) {
      const refreshedState = saveResult.currentState;
      stateCache.set(refreshedState.sessionId, refreshedState);
      const existingNextTurn = refreshedState.history[refreshedState.currentTurn - 1] || refreshedState.history[refreshedState.history.length - 1];
      return {
        state: refreshedState,
        isCompleted: refreshedState.status === "COMPLETED",
        nextTurn: existingNextTurn
      };
    }

    stateCache.set(state.sessionId, state);

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
