import { StringOutputParser } from "@langchain/core/output_parsers";
import { invokeChainWithModelFallback, createLangChainDiagnostics, DiagnosticLangChainMeta } from "./llm";
import {
  JD_REQUIREMENTS_EXTRACTION_PROMPT,
  ATS_EVIDENCE_MATCHING_PROMPT,
  INTERVIEW_EVALUATION_PROMPT,
  STAR_EVALUATION_PROMPT
} from "./prompts";
import {
  JdRequirementsSchema,
  JdRequirementsOutput,
  AtsEvaluationSchema,
  AtsEvaluationOutput,
  InterviewEvaluationSchema,
  InterviewEvaluationOutput,
  StarEvaluationSchema,
  StarEvaluationOutput,
  parseAndValidateJson
} from "./structured-output";
import { createCandidateRetriever } from "./retrievers";

export interface AtsChainResult {
  score: number;
  matchedRequirements: Array<{ requirement: string; matched: boolean; evidence: string; confidence: number }>;
  missingRequirements: string[];
  mustHave: string[];
  preferred: string[];
  responsibilities: string[];
  strengths: string[];
  gaps: string[];
  summary: string;
  diagnostics: DiagnosticLangChainMeta;
}

/**
 * 1. LangChain Chain: Extract Structured Job Requirements from JD
 */
export async function runJdExtractionChain(params: {
  role: string;
  company: string;
  jdText: string;
}): Promise<JdRequirementsOutput> {
  const rawOutput = await invokeChainWithModelFallback(
    model => JD_REQUIREMENTS_EXTRACTION_PROMPT.pipe(model).pipe(new StringOutputParser()),
    {
      role: params.role || "Software Engineer",
      company: params.company || "Technology Company",
      jdText: params.jdText
    },
    { temperature: 0.1 }
  );

  return parseAndValidateJson(rawOutput, JdRequirementsSchema, "JdRequirementsSchema");
}

/**
 * 2. LangChain Chain: Evidence-Based ATS Requirement Matching with pgvector RAG
 */
export async function runAtsMatchingChain(params: {
  userId: string;
  role: string;
  company: string;
  jdText: string;
  candidateProfile?: { skills?: string[] };
}): Promise<AtsChainResult> {
  if (!params.userId) {
    throw new Error("[ATS CHAIN ERROR] Candidate userId is required for tenant-scoped vector retrieval.");
  }

  if (!params.jdText || !params.jdText.trim()) {
    throw new Error("[ATS CHAIN ERROR] Job description text is required.");
  }

  // Step A: Extract structured requirements via LangChain extraction chain (fail explicitly if extraction fails)
  const reqs = await runJdExtractionChain({
    role: params.role,
    company: params.company,
    jdText: params.jdText
  });

  if (!reqs || !Array.isArray(reqs.mustHave) || reqs.mustHave.length === 0) {
    throw new Error("[ATS CHAIN ERROR] Failed to extract structured requirements from job description.");
  }

  // Step B: Retrieve candidate evidence using LangChain PostgreSQL pgvector retriever (fail explicitly if retrieval fails)
  let candidateEvidenceText = "Candidate has no indexed resume records in vector store.";
  let evidenceChunksCount = 0;

  const retriever = createCandidateRetriever(params.userId, { topK: 4, minSimilarity: 0.15 });
  const queryTopic = `${params.role} ${reqs.mustHave.join(" ")}`;
  const documents = await retriever.invoke(queryTopic);
  evidenceChunksCount = documents.length;

  if (documents.length > 0) {
    candidateEvidenceText = documents.map(doc => `[Section: ${doc.metadata.section || "General"}]: ${doc.pageContent}`).join("\n\n");
  }

  // Step C: Run LangChain ATS Evaluation Chain
  const rawOutput = await invokeChainWithModelFallback(
    model => ATS_EVIDENCE_MATCHING_PROMPT.pipe(model).pipe(new StringOutputParser()),
    {
      role: params.role,
      company: params.company,
      mustHave: reqs.mustHave.join(", ") || "General Engineering",
      preferred: reqs.preferred.join(", ") || "None specified",
      candidateEvidence: candidateEvidenceText,
      candidateSkills: (params.candidateProfile?.skills || []).join(", ") || "General engineering skills"
    },
    { temperature: 0.2 }
  );

  const evaluation = parseAndValidateJson(rawOutput, AtsEvaluationSchema, "AtsEvaluationSchema");

  return {
    score: evaluation.score,
    matchedRequirements: evaluation.matchedRequirements,
    missingRequirements: evaluation.missingRequirements,
    mustHave: reqs.mustHave,
    preferred: reqs.preferred,
    responsibilities: reqs.responsibilities,
    strengths: evaluation.strengths,
    gaps: evaluation.gaps,
    summary: evaluation.summary,
    diagnostics: createLangChainDiagnostics("AtsMatchingChain", {
      evidenceChunksRetrieved: evidenceChunksCount
    })
  };
}

/**
 * 3. LangChain Chain: STAR Story Narrative Evaluation
 */
export async function runStarEvaluationChain(params: {
  role: string;
  company: string;
  title?: string;
  situation: string;
  task: string;
  action: string;
  result: string;
}): Promise<StarEvaluationOutput & { diagnostics: DiagnosticLangChainMeta }> {
  const rawOutput = await invokeChainWithModelFallback(
    model => STAR_EVALUATION_PROMPT.pipe(model).pipe(new StringOutputParser()),
    {
      role: params.role || "Software Engineer",
      company: params.company || "Tech Company",
      title: params.title || "STAR Story",
      situation: params.situation,
      task: params.task,
      action: params.action,
      result: params.result
    },
    { temperature: 0.2 }
  );

  const evaluation = parseAndValidateJson(rawOutput, StarEvaluationSchema, "StarEvaluationSchema");
  return {
    ...evaluation,
    diagnostics: createLangChainDiagnostics("StarEvaluationChain")
  };
}

/**
 * 4. LangChain Chain: Final Interview Comprehensive Evaluation
 */
export async function runInterviewEvaluationChain(params: {
  role: string;
  company: string;
  difficulty?: string;
  qaPairs: Array<{ questionText: string; answerText: string; type?: string }>;
}): Promise<InterviewEvaluationOutput & { diagnostics: DiagnosticLangChainMeta }> {
  const transcript = params.qaPairs
    .map((qa, i) => `Q${i + 1} (${qa.type || "general"}): ${qa.questionText}\nCandidate A${i + 1}: ${qa.answerText}`)
    .join("\n\n");

  const rawOutput = await invokeChainWithModelFallback(
    model => INTERVIEW_EVALUATION_PROMPT.pipe(model).pipe(new StringOutputParser()),
    {
      role: params.role,
      company: params.company,
      difficulty: params.difficulty || "Senior",
      qaTranscript: transcript
    },
    { temperature: 0.2 }
  );

  const evaluation = parseAndValidateJson(rawOutput, InterviewEvaluationSchema, "InterviewEvaluationSchema");
  return {
    ...evaluation,
    diagnostics: createLangChainDiagnostics("InterviewEvaluationChain")
  };
}
