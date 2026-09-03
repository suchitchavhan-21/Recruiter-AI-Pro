import { StringOutputParser } from "@langchain/core/output_parsers";
import { invokeChainWithModelFallback, createLangChainDiagnostics, DiagnosticLangChainMeta } from "./llm";
import {
  SARAH_JENKINS_PROMPT,
  DAVID_CHEN_PROMPT,
  MARCUS_BRODY_PROMPT
} from "./prompts";
import {
  InterviewerTurnSchema,
  InterviewerTurnOutput,
  parseAndValidateJson
} from "./structured-output";
import { createCandidateRetriever } from "./retrievers";

export interface InterviewAgentContext {
  userId: string;
  targetRole: string;
  company: string;
  difficulty: string;
  turnNumber: number;
  previousQuestion: string;
  previousAnswer: string;
  targetCompetency: string;
  candidateMemory?: string;
}

export interface InterviewAgentResult extends InterviewerTurnOutput {
  diagnostics: DiagnosticLangChainMeta;
}

export interface IInterviewAgent {
  readonly name: string;
  readonly role: "HR" | "Technical" | "HiringManager";
  readonly title: string;
  readonly focus: string;
  readonly rubric: string;
  executeTurn(context: InterviewAgentContext): Promise<InterviewAgentResult>;
}

/**
 * 1. Sarah Jenkins Agent — HR & Behavioral Assessor
 */
export class SarahJenkinsAgent implements IInterviewAgent {
  readonly name = "Sarah Jenkins";
  readonly role = "HR" as const;
  readonly title = "Senior People Partner & Behavioral Assessor";
  readonly focus = "Communication clarity, STAR methodology, teamwork, conflict resolution, and cultural values alignment.";
  readonly rubric = "Evaluate candidate behavioral evidence using STAR (Situation, Task, Action, Result), cross-functional empathy, and ownership.";

  async executeTurn(context: InterviewAgentContext): Promise<InterviewAgentResult> {
    // Gather candidate evidence via LangChain pgvector retriever (fail explicitly if retrieval fails)
    if (!context.userId) {
      throw new Error("[SARAH AGENT ERROR] Candidate userId is mandatory for tenant-scoped vector retrieval.");
    }

    const retriever = createCandidateRetriever(context.userId, { topK: 2, minSimilarity: 0.2 });
    const docs = await retriever.invoke(context.targetCompetency || "teamwork collaboration leadership");
    const chunkCount = docs.length;
    const retrievedEvidence = docs.length > 0
      ? docs.map(d => d.pageContent).join("\n---\n")
      : "No matching candidate resume excerpts found for this competency in vector store.";

    const rawOutput = await invokeChainWithModelFallback(
      model => SARAH_JENKINS_PROMPT.pipe(model).pipe(new StringOutputParser()),
      {
        company: context.company,
        targetRole: context.targetRole,
        difficulty: context.difficulty,
        candidateMemory: context.candidateMemory || "None",
        retrievedEvidence,
        turnNumber: context.turnNumber,
        previousQuestion: context.previousQuestion || "None",
        previousAnswer: context.previousAnswer || "None",
        targetCompetency: context.targetCompetency
      },
      { temperature: 0.2 }
    );

    const parsed = parseAndValidateJson(rawOutput, InterviewerTurnSchema, "SarahJenkinsTurnSchema");

    return {
      ...parsed,
      diagnostics: createLangChainDiagnostics("SarahJenkinsAgent", {
        interviewerPersona: this.name,
        evidenceChunksRetrieved: chunkCount
      })
    };
  }
}

/**
 * 2. David Chen Agent — Principal Software Architect
 */
export class DavidChenAgent implements IInterviewAgent {
  readonly name = "David Chen";
  readonly role = "Technical" as const;
  readonly title = "Principal Software Architect";
  readonly focus = "System architecture, fault tolerance, trade-offs, scalability, and technical depth.";
  readonly rubric = "Evaluate architectural soundness, failure domain isolation, concurrency trade-offs, and concrete technology choices.";

  async executeTurn(context: InterviewAgentContext): Promise<InterviewAgentResult> {
    // Gather technical evidence via LangChain pgvector retriever (fail explicitly if retrieval fails)
    if (!context.userId) {
      throw new Error("[DAVID AGENT ERROR] Candidate userId is mandatory for tenant-scoped vector retrieval.");
    }

    const retriever = createCandidateRetriever(context.userId, { topK: 3, minSimilarity: 0.15 });
    const docs = await retriever.invoke(context.targetCompetency || "system architecture distributed systems scalability");
    const chunkCount = docs.length;
    const retrievedEvidence = docs.length > 0
      ? docs.map(d => d.pageContent).join("\n---\n")
      : "No matching candidate technical excerpts found for this competency in vector store.";

    const rawOutput = await invokeChainWithModelFallback(
      model => DAVID_CHEN_PROMPT.pipe(model).pipe(new StringOutputParser()),
      {
        company: context.company,
        targetRole: context.targetRole,
        difficulty: context.difficulty,
        candidateMemory: context.candidateMemory || "None",
        retrievedEvidence,
        turnNumber: context.turnNumber,
        previousQuestion: context.previousQuestion || "None",
        previousAnswer: context.previousAnswer || "None",
        targetCompetency: context.targetCompetency
      },
      { temperature: 0.2 }
    );

    const parsed = parseAndValidateJson(rawOutput, InterviewerTurnSchema, "DavidChenTurnSchema");

    return {
      ...parsed,
      diagnostics: createLangChainDiagnostics("DavidChenAgent", {
        interviewerPersona: this.name,
        evidenceChunksRetrieved: chunkCount
      })
    };
  }
}

/**
 * 3. Marcus Brody Agent — VP of Engineering
 */
export class MarcusBrodyAgent implements IInterviewAgent {
  readonly name = "Marcus Brody";
  readonly role = "HiringManager" as const;
  readonly title = "VP of Engineering";
  readonly focus = "Execution velocity, strategic roadmapping, technical debt management, delivery ownership, and business impact.";
  readonly rubric = "Evaluate business impact, pragmatic trade-offs between speed and perfection, and delivery ownership.";

  async executeTurn(context: InterviewAgentContext): Promise<InterviewAgentResult> {
    // Gather leadership/execution evidence via LangChain pgvector retriever (fail explicitly if retrieval fails)
    if (!context.userId) {
      throw new Error("[MARCUS AGENT ERROR] Candidate userId is mandatory for tenant-scoped vector retrieval.");
    }

    const retriever = createCandidateRetriever(context.userId, { topK: 2, minSimilarity: 0.15 });
    const docs = await retriever.invoke(context.targetCompetency || "project delivery business impact roadmap");
    const chunkCount = docs.length;
    const retrievedEvidence = docs.length > 0
      ? docs.map(d => d.pageContent).join("\n---\n")
      : "No matching candidate leadership excerpts found for this competency in vector store.";

    const rawOutput = await invokeChainWithModelFallback(
      model => MARCUS_BRODY_PROMPT.pipe(model).pipe(new StringOutputParser()),
      {
        company: context.company,
        targetRole: context.targetRole,
        difficulty: context.difficulty,
        candidateMemory: context.candidateMemory || "None",
        retrievedEvidence,
        turnNumber: context.turnNumber,
        previousQuestion: context.previousQuestion || "None",
        previousAnswer: context.previousAnswer || "None",
        targetCompetency: context.targetCompetency
      },
      { temperature: 0.2 }
    );

    const parsed = parseAndValidateJson(rawOutput, InterviewerTurnSchema, "MarcusBrodyTurnSchema");

    return {
      ...parsed,
      diagnostics: createLangChainDiagnostics("MarcusBrodyAgent", {
        interviewerPersona: this.name,
        evidenceChunksRetrieved: chunkCount
      })
    };
  }
}

/**
 * Singleton instances of the specialized agents
 */
export const sarahJenkinsAgent = new SarahJenkinsAgent();
export const davidChenAgent = new DavidChenAgent();
export const marcusBrodyAgent = new MarcusBrodyAgent();

/**
 * Router to select and execute the appropriate LangChain interview agent
 */
export async function executeInterviewerAgent(
  role: "HR" | "Technical" | "HiringManager",
  context: InterviewAgentContext
): Promise<InterviewAgentResult> {
  switch (role) {
    case "HR":
      return await sarahJenkinsAgent.executeTurn(context);
    case "Technical":
      return await davidChenAgent.executeTurn(context);
    case "HiringManager":
      return await marcusBrodyAgent.executeTurn(context);
    default:
      return await davidChenAgent.executeTurn(context);
  }
}
