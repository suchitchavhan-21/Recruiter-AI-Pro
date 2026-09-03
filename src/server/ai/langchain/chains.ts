import { StringOutputParser } from "@langchain/core/output_parsers";
import { getLangChainChatModel, createLangChainDiagnostics, DiagnosticLangChainMeta } from "./llm";
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
  const model = getLangChainChatModel({ temperature: 0.1 });
  const chain = JD_REQUIREMENTS_EXTRACTION_PROMPT.pipe(model).pipe(new StringOutputParser());

  const rawOutput = await chain.invoke({
    role: params.role || "Software Engineer",
    company: params.company || "Technology Company",
    jdText: params.jdText
  });

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
  // Step A: Extract structured requirements via LangChain extraction chain
  let reqs: JdRequirementsOutput;
  try {
    reqs = await runJdExtractionChain({
      role: params.role,
      company: params.company,
      jdText: params.jdText
    });
  } catch (err) {
    // Graceful fallback for requirements parsing if prompt is concise
    reqs = {
      mustHave: params.jdText.split(/[\n,;]+/).map(s => s.trim()).filter(s => s.length > 3).slice(0, 5),
      preferred: [],
      responsibilities: []
    };
  }

  // Step B: Retrieve candidate evidence using LangChain PostgreSQL pgvector retriever
  let candidateEvidenceText = "No indexed resume evidence found.";
  let evidenceChunksCount = 0;

  if (params.userId) {
    try {
      const retriever = createCandidateRetriever(params.userId, { topK: 4, minSimilarity: 0.15 });
      const queryTopic = `${params.role} ${reqs.mustHave.join(" ")}`;
      const documents = await retriever.invoke(queryTopic);
      evidenceChunksCount = documents.length;

      if (documents.length > 0) {
        candidateEvidenceText = documents.map(doc => `[Section: ${doc.metadata.section || "General"}]: ${doc.pageContent}`).join("\n\n");
      }
    } catch (retrieverErr) {
      console.warn("[LANGCHAIN RETRIEVER WARNING] Vector retrieval failed, evaluating profile skills:", retrieverErr);
    }
  }

  // Step C: Run LangChain ATS Evaluation Chain
  const model = getLangChainChatModel({ temperature: 0.2 });
  const chain = ATS_EVIDENCE_MATCHING_PROMPT.pipe(model).pipe(new StringOutputParser());

  const rawOutput = await chain.invoke({
    role: params.role,
    company: params.company,
    mustHave: reqs.mustHave.join(", ") || "General Engineering",
    preferred: reqs.preferred.join(", ") || "None specified",
    candidateEvidence: candidateEvidenceText,
    candidateSkills: (params.candidateProfile?.skills || []).join(", ") || "General engineering skills"
  });

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
  const model = getLangChainChatModel({ temperature: 0.2 });
  const chain = STAR_EVALUATION_PROMPT.pipe(model).pipe(new StringOutputParser());

  const rawOutput = await chain.invoke({
    role: params.role || "Software Engineer",
    company: params.company || "Tech Company",
    title: params.title || "STAR Story",
    situation: params.situation,
    task: params.task,
    action: params.action,
    result: params.result
  });

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
  const model = getLangChainChatModel({ temperature: 0.2 });
  const chain = INTERVIEW_EVALUATION_PROMPT.pipe(model).pipe(new StringOutputParser());

  const transcript = params.qaPairs
    .map((qa, i) => `Q${i + 1} (${qa.type || "general"}): ${qa.questionText}\nCandidate A${i + 1}: ${qa.answerText}`)
    .join("\n\n");

  const rawOutput = await chain.invoke({
    role: params.role,
    company: params.company,
    difficulty: params.difficulty || "Senior",
    qaTranscript: transcript
  });

  const evaluation = parseAndValidateJson(rawOutput, InterviewEvaluationSchema, "InterviewEvaluationSchema");
  return {
    ...evaluation,
    diagnostics: createLangChainDiagnostics("InterviewEvaluationChain")
  };
}
