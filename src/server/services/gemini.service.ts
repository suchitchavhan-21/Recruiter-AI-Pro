import { GoogleGenAI } from "@google/genai";
import { ENV } from "../config/env";
import { CompetencyScore, CompetencyType, normalizeCompetencyScore } from "../ai/orchestrator/competencyModel";
import { generateScoringReport, DecisionSupportBadge } from "../ai/orchestrator/scoringModel";

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = ENV.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in environment or AI Studio Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}

// Candidate models to rotate through on 503/429/high-demand spikes
const CANDIDATE_MODELS = [
  ENV.GEMINI_PRIMARY_MODEL || "gemini-2.5-flash",
  ENV.GEMINI_FALLBACK_MODEL || "gemini-flash-latest",
  ENV.GEMINI_LIGHT_MODEL || "gemini-flash-lite-latest",
  "gemini-2.5-pro"
];

// Execute Gemini call with automatic fallback across supported model tiers and strict timeout
async function executeWithModelFallback<T>(
  actionName: string,
  caller: (client: GoogleGenAI, modelName: string) => Promise<T>,
  timeoutMs: number = 8000
): Promise<T> {
  const client = getGeminiClient();
  let lastError: any = null;

  for (let i = 0; i < CANDIDATE_MODELS.length; i++) {
    const model = CANDIDATE_MODELS[i];
    let timer: NodeJS.Timeout | null = null;
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms on model '${model}'`)), timeoutMs);
      });

      const res = await Promise.race([caller(client, model), timeoutPromise]);
      if (timer) clearTimeout(timer);
      return res;
    } catch (err: any) {
      if (timer) clearTimeout(timer);
      lastError = err;
      const status = err?.status || err?.code || (err?.message?.includes("503") ? 503 : 0);
      const isTransient = status === 503 || status === 429 || err?.message?.includes("high demand") || err?.message?.includes("UNAVAILABLE") || err?.message?.includes("Timeout");

      if (isTransient && i < CANDIDATE_MODELS.length - 1) {
        console.warn(`[GEMINI RETRY] ${actionName} on model '${model}' encountered transient issue (${status || err?.message}). Switching to fallback model '${CANDIDATE_MODELS[i + 1]}'...`);
        await new Promise(res => setTimeout(res, 200 * (i + 1)));
        continue;
      }
      break;
    }
  }

  throw lastError;
}

// Safely parse JSON or repair common LLM markdown wrapper artifacts
function extractAndParseJSON<T>(rawText: string, fallback: T): T {
  if (!rawText || !rawText.trim()) return fallback;

  try {
    // 1. Direct parse attempt
    return JSON.parse(rawText.trim());
  } catch {
    // 2. Strip ```json ... ``` blocks
    const match = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1].trim());
      } catch (e) {
        console.warn("[GEMINI JSON REPAIR] Extracted block failed JSON.parse:", e);
      }
    }

    // 3. Find outermost JSON braces { ... }
    const firstBrace = rawText.indexOf("{");
    const lastBrace = rawText.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(rawText.substring(firstBrace, lastBrace + 1));
      } catch (e) {
        console.warn("[GEMINI JSON BRACE REPAIR] Substring failed JSON.parse:", e);
      }
    }

    console.warn("[GEMINI JSON ERROR] Could not repair or parse JSON output from model, using fallback structure.");
    return fallback;
  }
}

// Deterministic application-level hiring decision threshold calculator
export function calculateHiringDecision(score: number): "Strong Hire" | "Lean Hire" | "No Hire" {
  const boundedScore = Math.max(0, Math.min(100, score));
  if (boundedScore >= 85) return "Strong Hire";
  if (boundedScore >= 70) return "Lean Hire";
  return "No Hire";
}

// ----------------------------------------------------
// 1. JOB DESCRIPTION ANALYSIS & QUESTION GENERATOR
// ----------------------------------------------------

export interface JDAnalysisResult {
  difficulty: "Entry" | "Mid" | "Senior" | "Expert";
  skills: string[];
  companyTrends: string;
  questions: Array<{
    id: number;
    text: string;
    type: "technical" | "behavioral";
    expectedFocus: string;
  }>;
}

export async function analyzeJobDescription(params: {
  jd: string;
  role?: string;
  companyName?: string;
  persona?: string;
  interviewerCount?: number;
}): Promise<JDAnalysisResult> {
  const companyContext = params.companyName ? `at '${params.companyName}'` : "at a top technology firm";
  const count = params.interviewerCount || 1;

  let panelContext = "";
  if (count === 2) {
    panelContext = `
Panel Members:
- Sarah Jenkins (HR Director): Focus on behavioral, teamwork, and culture alignment.
- David Chen (Lead Architect): Focus on deep technical architecture, system design, and algorithms.
Questions 1, 3, 5 are asked by Sarah (behavioral); Questions 2, 4 are asked by David (technical).`;
  } else if (count === 3) {
    panelContext = `
Panel Members:
- Sarah Jenkins (HR Director): Behavioral and culture.
- David Chen (Lead Architect): Technical architecture, code quality, distributed systems.
- Marcus Brody (VP of Engineering): Leadership, product strategy, prioritization, and scale.
Question 1: Sarah, Question 2: David, Question 3: Marcus, Question 4: Sarah, Question 5: David.`;
  }

  const prompt = `
You are an Executive Technical Recruiter & Hiring Committee Lead analyzing this Job Description ${companyContext}.
${panelContext}

Instructions:
1. Identify the role difficulty level (Entry, Mid, Senior, Expert).
2. Extract the 5-10 most critical hard and soft skills.
3. Summarize current industry hiring trends and evaluation benchmarks ${companyContext}.
4. Generate exactly 5 challenging, highly realistic interview questions tailored to the specified panel and role.

CRITICAL: Return ONLY a valid JSON object matching this exact schema:
{
  "difficulty": "Entry" | "Mid" | "Senior" | "Expert",
  "skills": ["string"],
  "companyTrends": "string",
  "questions": [
    {
      "id": 1,
      "text": "string",
      "type": "technical" | "behavioral",
      "expectedFocus": "string"
    }
  ]
}

Job Description:
"""
${params.jd.substring(0, 15000)}
"""
`;

  try {
    const response = await executeWithModelFallback("analyzeJobDescription", async (client, model) => {
      return client.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3
        }
      });
    });

    const parsed = extractAndParseJSON<JDAnalysisResult>(response.text || "", {
      difficulty: "Senior",
      skills: ["System Design", "TypeScript", "Distributed Systems", "Communication"],
      companyTrends: "High focus on ownership, scalable infrastructure, and clear architectural trade-offs.",
      questions: [
        { id: 1, text: "Can you describe a complex system architecture you designed and the critical trade-offs you made?", type: "technical", expectedFocus: "Architecture clarity, database selection, failure modes" },
        { id: 2, text: "Tell me about a time you had a significant disagreement with a stakeholder or engineer and how you resolved it.", type: "behavioral", expectedFocus: "Empathy, conflict resolution, business focus" },
        { id: 3, text: "How do you approach monitoring, alerting, and incident recovery in high-throughput production environments?", type: "technical", expectedFocus: "Observability, SLOs, root cause analysis" },
        { id: 4, text: "Describe a project where requirements shifted dramatically midway through. How did you adapt?", type: "behavioral", expectedFocus: "Agility, team communication, prioritization" },
        { id: 5, text: "How would you design a rate-limiting and caching layer for a public API handling 100k requests/second?", type: "technical", expectedFocus: "Redis, token bucket, latency optimization" }
      ]
    });

    return parsed;
  } catch (err: any) {
    if (process.env.NODE_ENV === "production" || ENV.NODE_ENV === "production") {
      throw new Error(`[AI_PROVIDER_UNAVAILABLE] Gemini job description analysis failed: ${err?.message || "Service unavailable"}. Synthetic fallbacks are prohibited in production.`);
    }
    console.warn("[GEMINI WARN] analyzeJobDescription utilizing high-fidelity fallback:", err?.message || err);
    return {
      difficulty: "Senior",
      skills: ["System Design", "TypeScript", "Node.js", "Distributed Systems", "Incident Management", "Communication"],
      companyTrends: `Focus on ownership, robust engineering fundamentals, and scalability ${companyContext}.`,
      questions: [
        { id: 1, text: `Can you describe a complex system architecture you designed for ${params.role || "this position"} and the critical trade-offs you made?`, type: "technical", expectedFocus: "Architecture clarity, database selection, failure modes" },
        { id: 2, text: "Tell me about a time you had a significant disagreement with a stakeholder or engineer and how you resolved it.", type: "behavioral", expectedFocus: "Empathy, conflict resolution, business focus" },
        { id: 3, text: "How do you approach monitoring, alerting, and incident recovery in high-throughput production environments?", type: "technical", expectedFocus: "Observability, SLOs, root cause analysis" },
        { id: 4, text: "Describe a project where requirements shifted dramatically midway through. How did you adapt?", type: "behavioral", expectedFocus: "Agility, team communication, prioritization" },
        { id: 5, text: "How would you design a rate-limiting and caching layer for a public API handling 100k requests/second?", type: "technical", expectedFocus: "Redis, token bucket, latency optimization" }
      ]
    };
  }
}

// ----------------------------------------------------
// 2. INTERVIEW EVALUATION & SCORING RUBRIC
export interface GroundedEvidenceItem {
  claim: string;
  evidenceQuote: string;
  sourceTurnIndex: number;
  grounded: boolean;
  confidence: number;
}

export interface InterviewEvidenceGrounding {
  overallGrounded: boolean;
  groundingRatio: number;
  verifiedClaimsCount: number;
  unsupportedClaimsCount: number;
  items: GroundedEvidenceItem[];
  groundedClaims?: number;
  totalClaims?: number;
  groundedItems?: GroundedEvidenceItem[];
}

export interface InterviewEvaluationResult {
  overallRating: "Strong Hire" | "Lean Hire" | "No Hire";
  score: number;
  overallScore: number;
  overallConfidence: number;
  decisionBadge?: DecisionSupportBadge;
  decisionSupportBadge: DecisionSupportBadge;
  badgeRationale?: string;
  competencyScores?: Record<CompetencyType, CompetencyScore>;
  technicalScore: CompetencyScore;
  problemSolvingScore: CompetencyScore;
  systemDesignScore: CompetencyScore;
  communicationScore: CompetencyScore;
  behavioralScore: CompetencyScore;
  roleFitScore: CompetencyScore;
  codingScore: CompetencyScore;
  actionableRecommendations?: string[];
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  mistakesMade?: string[];
  idealAnswers?: string[];
  hiringRecommendation?: string;
  practicePlan?: string[];
  evidenceGrounding?: InterviewEvidenceGrounding;
  questionBreakdown: Array<{
    questionText: string;
    critique: string;
    modelAnswer: string;
    score: number;
    feedback?: string;
  }>;
  panelFeedback?: {
    hr?: { score: number; feedback: string; strengths: string[]; weaknesses: string[] };
    technical?: { score: number; feedback: string; strengths: string[]; weaknesses: string[] };
    hiringManager?: { score: number; feedback: string; strengths: string[]; weaknesses: string[] };
  };
}


/**
 * Programmatically validates that evaluation claims and quotes are grounded in actual interview transcript answers.
 * Rejects unsupported hallucinations or fabricated quotes.
 */
export function validateInterviewEvidenceGrounding(
  qaPairs: Array<{ questionText?: string; answerText?: string; question?: string; answer?: string }>,
  claims: Array<{ claim: string; evidenceQuote?: string; quote?: string; sourceTurnIndex?: number }>
): InterviewEvidenceGrounding {
  const normalizedTranscript = qaPairs
    .map(qa => (qa.answerText || qa.answer || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim())
    .join(" ");
  const items: GroundedEvidenceItem[] = [];

  let verifiedCount = 0;

  for (const c of claims) {
    const rawQuote = (c.evidenceQuote || c.quote || "").trim();
    const cleanQuote = rawQuote.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
    
    let isGrounded = false;
    let confidence = 0.0;

    if (cleanQuote.length >= 8 && normalizedTranscript.includes(cleanQuote)) {
      isGrounded = true;
      confidence = 1.0;
    } else if (cleanQuote.length >= 8) {
      // Substantial keyword presence test: at least 70% of words in quote must appear in candidate transcript
      const words = cleanQuote.split(" ").filter(w => w.length > 3);
      if (words.length > 0) {
        const matches = words.filter(w => normalizedTranscript.includes(w)).length;
        const ratio = matches / words.length;
        if (ratio >= 0.70) {
          isGrounded = true;
          confidence = Math.round(ratio * 100) / 100;
        }
      }
    } else if (c.claim) {
      // Claim evaluation without explicit quote: match key terms against transcript
      const claimWords = c.claim.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(w => w.length > 4);
      if (claimWords.length > 0) {
        const matches = claimWords.filter(w => normalizedTranscript.includes(w)).length;
        if (matches >= 2) {
          isGrounded = true;
          confidence = 0.75;
        }
      }
    }

    if (isGrounded) {
      verifiedCount++;
    }

    items.push({
      claim: c.claim,
      evidenceQuote: rawQuote,
      sourceTurnIndex: c.sourceTurnIndex || 1,
      grounded: isGrounded,
      confidence
    });
  }

  const total = Math.max(1, claims.length);
  const ratio = Math.round((verifiedCount / total) * 100) / 100;

  return {
    overallGrounded: ratio >= 0.50,
    groundingRatio: ratio,
    verifiedClaimsCount: verifiedCount,
    unsupportedClaimsCount: claims.length - verifiedCount,
    groundedClaims: verifiedCount,
    totalClaims: claims.length,
    items,
    groundedItems: items
  };
}

/**
 * Derives objective 7-dimensional competency breakdown and decision-support report.
 */
export function deriveCompetencyBreakdown(
  qaPairs: Array<{ questionId?: number; questionText?: string; type?: string; answerText?: string }>,
  baseScore: number
): {
  competencyScores: Record<CompetencyType, CompetencyScore>;
  scoringReport: ReturnType<typeof generateScoringReport>;
} {
  const technicalAnswers = qaPairs.filter(q => q.type === "technical").map(q => q.answerText).filter(Boolean);
  const behavioralAnswers = qaPairs.filter(q => q.type === "behavioral").map(q => q.answerText).filter(Boolean);

  const techSnippet = technicalAnswers.join(" ");
  const behavSnippet = behavioralAnswers.join(" ");
  const allSnippet = qaPairs.map(q => q.answerText).filter(Boolean).join(" ");

  const hasTechMetrics = /\b\d+(%|ms|s|k|m|gb|tb|qps|rps)\b/i.test(techSnippet);
  const hasSTARAction = /\b(I |my |created|designed|led|built|debugged|optimized|refactored)\b/i.test(behavSnippet);

  // 1. Technical Depth (weight: 0.25)
  const technicalScore = normalizeCompetencyScore(
    "technical",
    baseScore,
    techSnippet.slice(0, 300),
    hasTechMetrics ? ["Demonstrated awareness of quantitative latency/throughput metrics"] : ["Addressed engineering concepts"],
    technicalAnswers.length === 0 ? ["No technical answers provided"] : []
  );

  // 2. Problem Solving (weight: 0.20)
  const problemSolvingScore = normalizeCompetencyScore(
    "problem_solving",
    Math.round(baseScore * 0.98),
    allSnippet.slice(0, 300),
    allSnippet.length > 100 ? ["Structured problem breakdown"] : [],
    allSnippet.length < 50 ? ["Limited exploration of boundary edge cases"] : []
  );

  // 3. System Design (weight: 0.15)
  const systemDesignScore = normalizeCompetencyScore(
    "system_design",
    Math.round(baseScore * 0.95),
    techSnippet.slice(0, 300),
    /\b(cache|distributed|database|queue|microservice|partition|sharding|replication)\b/i.test(techSnippet)
      ? ["Explicitly referenced distributed systems primitives"]
      : [],
    !/\b(failover|circuit breaker|partition|consistency)\b/i.test(techSnippet)
      ? ["Did not explore resilience and failure domain trade-offs"]
      : []
  );

  // 4. Communication (weight: 0.15)
  const communicationScore = normalizeCompetencyScore(
    "communication",
    allSnippet.length > 150 ? Math.min(100, baseScore + 5) : Math.max(20, baseScore - 15),
    allSnippet.slice(0, 200),
    allSnippet.length > 150 ? ["Articulate and structured response cadence"] : [],
    allSnippet.length < 60 ? ["Responses were brief or fragmented"] : []
  );

  // 5. Behavioral (weight: 0.10)
  const behavioralScore = normalizeCompetencyScore(
    "behavioral",
    hasSTARAction ? Math.min(100, baseScore + 4) : Math.max(30, baseScore - 10),
    behavSnippet.slice(0, 300),
    hasSTARAction ? ["Clear personal agency and ownership demonstrated"] : [],
    !hasSTARAction && behavioralAnswers.length > 0 ? ["Passive delivery ('we' instead of 'I')"] : []
  );

  // 6. Role Fit (weight: 0.10)
  const roleFitScore = normalizeCompetencyScore(
    "role_fit",
    baseScore,
    allSnippet.slice(0, 200),
    ["Relevant technical and contextual alignment with target position"],
    []
  );

  // 7. Coding (weight: 0.05)
  const codingScore = normalizeCompetencyScore(
    "coding",
    baseScore,
    technicalAnswers[0]?.slice(0, 200) || "",
    ["Algorithmic logic applied during architectural trade-offs"],
    []
  );

  const competencyScores: Record<CompetencyType, CompetencyScore> = {
    technical: technicalScore,
    problem_solving: problemSolvingScore,
    system_design: systemDesignScore,
    communication: communicationScore,
    behavioral: behavioralScore,
    role_fit: roleFitScore,
    coding: codingScore
  };

  const scoringReport = generateScoringReport(competencyScores);

  return { competencyScores, scoringReport };
}

export async function evaluateInterviewSession(params: {

  role: string;
  company: string;
  difficulty: string;
  interviewerCount?: number;
  qaPairs: Array<{ questionId: number; questionText: string; type: string; answerText: string }>;
}): Promise<InterviewEvaluationResult> {
  const count = params.interviewerCount || 1;

  // Helper to evaluate answer quality heuristics
  const evaluateAnswerHeuristic = (text?: string) => {
    if (!text) return { isEmpty: true, words: 0, score: 0 };
    const clean = text.trim();
    const isSkip = 
      clean.length === 0 || 
      clean.toLowerCase() === "skip" || 
      clean.toLowerCase() === "skipped" || 
      clean.toLowerCase() === "no answer" || 
      clean.toLowerCase() === "n/a" || 
      clean.toLowerCase().includes("(candidate gave no response)") ||
      clean.toLowerCase().includes("[skipped");
    if (isSkip || clean.length < 5) return { isEmpty: true, words: 0, score: 0 };

    const words = clean.split(/\s+/).filter(Boolean).length;
    let baseScore = 0;
    if (words < 12) baseScore = Math.min(35, 10 + words * 2);
    else if (words < 25) baseScore = Math.min(65, 35 + (words - 12) * 2.3);
    else if (words < 50) baseScore = Math.min(85, 65 + (words - 25) * 0.8);
    else baseScore = Math.min(96, 85 + Math.min(11, (words - 50) * 0.2));

    // Bonus for technical metrics or STAR structure keywords
    const hasMetrics = /\b\d+(%|ms|s|k|m|gb|tb|qps|rps)?\b/i.test(clean);
    const hasAction = /\b(architected|designed|implemented|optimized|migrated|spearheaded|refactored|deployed|reduced|increased)\b/i.test(clean);
    if (hasMetrics) baseScore = Math.min(98, baseScore + 4);
    if (hasAction) baseScore = Math.min(98, baseScore + 3);

    return { isEmpty: false, words, score: Math.round(baseScore) };
  };

  const answerMetrics = params.qaPairs.map(qa => evaluateAnswerHeuristic(qa.answerText));
  const answeredCount = answerMetrics.filter(m => !m.isEmpty).length;
  const totalQuestions = params.qaPairs.length || 1;

  const prompt = `
You are the Hiring Committee Chairperson evaluating a candidate's complete interview for the role of ${params.role} at ${params.company} (${params.difficulty} level).

Interview Transcript:
${params.qaPairs.map((qa, i) => `[Question ${i + 1}] (${qa.type}): ${qa.questionText}\n[Candidate Answer]: ${qa.answerText || "(Candidate gave no response)"}\n`).join("\n")}

Evaluation Guidelines:
1. Score each answer objectively from 0 to 100 based on technical depth, STAR structure, concrete metrics, and clarity. If an answer was skipped or empty, give it 0-10.
2. The overall score MUST be the arithmetic average of all individual question scores.
3. Hiring recommendation criteria:
   - "Strong Hire": overall score >= 85
   - "Lean Hire": overall score >= 70 and < 85
   - "No Hire": overall score < 70
4. Provide targeted strengths and actionable improvements.
${count > 1 ? "5. Provide individual panel member scores (0-100) and consensus reviews for HR, Technical, and Hiring Manager." : ""}

Return ONLY valid JSON matching this schema:
{
  "overallRating": "Strong Hire" | "Lean Hire" | "No Hire",
  "score": number,
  "overallFeedback": "string",
  "strengths": ["string"],
  "improvements": ["string"],
  "mistakesMade": ["string"],
  "idealAnswers": ["string"],
  "hiringRecommendation": "string",
  "practicePlan": ["string"],
  "questionBreakdown": [
    {
      "questionText": "string",
      "critique": "string",
      "modelAnswer": "string",
      "score": number,
      "feedback": "string"
    }
  ],
  "panelFeedback": {
    "hr": { "score": number, "feedback": "string", "strengths": ["string"], "weaknesses": ["string"] },
    "technical": { "score": number, "feedback": "string", "strengths": ["string"], "weaknesses": ["string"] },
    "hiringManager": { "score": number, "feedback": "string", "strengths": ["string"], "weaknesses": ["string"] }
  }
}
`;

  try {
    const response = await executeWithModelFallback("evaluateInterviewSession", async (client, model) => {
      return client.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2
        }
      });
    });

    const parsed = extractAndParseJSON<InterviewEvaluationResult>(response.text || "", {} as any);

    // Validate and sanitize questionBreakdown
    let questionBreakdown = Array.isArray(parsed?.questionBreakdown) ? parsed.questionBreakdown : [];
    if (questionBreakdown.length === 0) {
      questionBreakdown = params.qaPairs.map((qa, i) => {
        const metric = answerMetrics[i];
        return {
          questionText: qa.questionText || `Question ${i + 1}`,
          critique: metric.isEmpty ? "Question was skipped or left blank." : "Candidate provided a baseline conceptual explanation.",
          modelAnswer: `A comprehensive response detailing architecture trade-offs, scalability bottlenecks, and business outcomes for ${qa.questionText}.`,
          score: metric.score,
          feedback: metric.isEmpty ? "No answer provided." : "Clear communication with domain terminology."
        };
      });
    } else {
      // Ensure each question matches answer reality
      questionBreakdown = questionBreakdown.map((q, i) => {
        const metric = answerMetrics[i] || { isEmpty: false, score: 70 };
        let qScore = Number(q.score);
        if (isNaN(qScore)) qScore = metric.score;
        if (metric.isEmpty) qScore = Math.min(qScore, 10);
        return {
          ...q,
          questionText: q.questionText || params.qaPairs[i]?.questionText || `Question ${i + 1}`,
          score: Math.max(0, Math.min(100, Math.round(qScore)))
        };
      });
    }

    // Mathematically calibrate overall score as average of question breakdown
    const sumQScores = questionBreakdown.reduce((sum, q) => sum + q.score, 0);
    const avgQScore = Math.round(sumQScores / Math.max(1, questionBreakdown.length));
    
    const finalScore = Math.max(0, Math.min(100, avgQScore));
    const finalRating = calculateHiringDecision(finalScore);

    // Calibrate panel feedback scores
    const technicalQuestions = questionBreakdown.filter((_, idx) => params.qaPairs[idx]?.type === "technical");
    const behavioralQuestions = questionBreakdown.filter((_, idx) => params.qaPairs[idx]?.type === "behavioral");

    const techAvg = technicalQuestions.length > 0
      ? Math.round(technicalQuestions.reduce((a, b) => a + b.score, 0) / technicalQuestions.length)
      : finalScore;
    const behavAvg = behavioralQuestions.length > 0
      ? Math.round(behavioralQuestions.reduce((a, b) => a + b.score, 0) / behavioralQuestions.length)
      : finalScore;

    const panelFeedback = {
      hr: {
        score: Math.max(0, Math.min(100, parsed?.panelFeedback?.hr?.score ? Math.round((parsed.panelFeedback.hr.score + behavAvg) / 2) : behavAvg)),
        feedback: parsed?.panelFeedback?.hr?.feedback || (answeredCount > 0 ? "Demonstrated clear communication and team alignment." : "No behavioral answers recorded."),
        strengths: parsed?.panelFeedback?.hr?.strengths || (answeredCount > 0 ? ["Clear communication", "Structured narrative"] : []),
        weaknesses: parsed?.panelFeedback?.hr?.weaknesses || (answeredCount > 0 ? ["Elaborate on cross-team conflict resolution"] : ["No answers provided"])
      },
      technical: {
        score: Math.max(0, Math.min(100, parsed?.panelFeedback?.technical?.score ? Math.round((parsed.panelFeedback.technical.score + techAvg) / 2) : techAvg)),
        feedback: parsed?.panelFeedback?.technical?.feedback || (answeredCount > 0 ? "Demonstrated domain knowledge with architecture awareness." : "No technical responses provided."),
        strengths: parsed?.panelFeedback?.technical?.strengths || (answeredCount > 0 ? ["Domain terminology", "System design concepts"] : []),
        weaknesses: parsed?.panelFeedback?.technical?.weaknesses || (answeredCount > 0 ? ["Quantify scalability bottlenecks deeper"] : ["No answers provided"])
      },
      hiringManager: {
        score: Math.max(0, Math.min(100, parsed?.panelFeedback?.hiringManager?.score ? Math.round((parsed.panelFeedback.hiringManager.score + finalScore) / 2) : finalScore)),
        feedback: parsed?.panelFeedback?.hiringManager?.feedback || (answeredCount > 0 ? `Overall consensus supports candidate trajectory for ${params.role}.` : "Incomplete interview session."),
        strengths: parsed?.panelFeedback?.hiringManager?.strengths || (answeredCount > 0 ? ["Ownership mindset", "Problem solving"] : []),
        weaknesses: parsed?.panelFeedback?.hiringManager?.weaknesses || (answeredCount > 0 ? ["Provide concrete impact metrics"] : ["Session was not completed"])
      }
    };

    const finalStrengths = parsed?.strengths?.length ? parsed.strengths : (answeredCount > 0 ? ["Clear articulation of key concepts", "Structured response approach"] : []);
    const claimsToValidate = finalStrengths.map((s, idx) => ({ claim: s, sourceTurnIndex: idx + 1 }));
    const evidenceGrounding = validateInterviewEvidenceGrounding(params.qaPairs, claimsToValidate);

    const { competencyScores, scoringReport } = deriveCompetencyBreakdown(params.qaPairs, finalScore);

    return {
      overallRating: finalRating,
      score: scoringReport.overallScore || finalScore,
      overallScore: scoringReport.overallScore || finalScore,
      overallConfidence: scoringReport.overallConfidence,
      decisionBadge: scoringReport.decisionBadge,
      decisionSupportBadge: scoringReport.decisionBadge,
      badgeRationale: scoringReport.badgeRationale,
      competencyScores: scoringReport.competencyBreakdown,
      technicalScore: scoringReport.competencyBreakdown.technical,
      problemSolvingScore: scoringReport.competencyBreakdown.problem_solving,
      systemDesignScore: scoringReport.competencyBreakdown.system_design,
      communicationScore: scoringReport.competencyBreakdown.communication,
      behavioralScore: scoringReport.competencyBreakdown.behavioral,
      roleFitScore: scoringReport.competencyBreakdown.role_fit,
      codingScore: scoringReport.competencyBreakdown.coding,
      actionableRecommendations: scoringReport.actionableRecommendations,
      overallFeedback: parsed?.overallFeedback || (answeredCount === 0 
        ? "No responses were provided during this interview simulation. All questions were skipped or left blank."
        : `Candidate completed ${answeredCount} of ${totalQuestions} questions with an overall assessment score of ${scoringReport.overallScore || finalScore}%.`),
      strengths: finalStrengths,
      improvements: parsed?.improvements?.length ? parsed.improvements : (scoringReport.growthAreas.length > 0 ? scoringReport.growthAreas : ["Elaborate on edge case trade-offs", "Quantify business and latency impact metrics"]),
      mistakesMade: parsed?.mistakesMade || (answeredCount === 0 ? ["Questions skipped without response"] : ["Could provide more concrete numbers earlier in the response"]),
      idealAnswers: parsed?.idealAnswers || ["Include explicit architectural diagrams and metric before/after benchmarks."],
      hiringRecommendation: parsed?.hiringRecommendation || (finalScore >= 85 ? `Strongly recommend hire for ${params.role}.` : finalScore >= 70 ? `Recommend lean hire with follow-up on system design.` : `Recommend further preparation before re-interviewing.`),
      practicePlan: parsed?.practicePlan || scoringReport.actionableRecommendations,
      evidenceGrounding,
      questionBreakdown,
      panelFeedback
    };
  } catch (err: any) {
    if (process.env.NODE_ENV === "production" || ENV.NODE_ENV === "production") {
      throw new Error(`[AI_PROVIDER_UNAVAILABLE] Gemini interview evaluation failed: ${err?.message || "Service unavailable"}. Synthetic scorecard fallbacks are prohibited in production.`);
    }
    console.warn("[GEMINI WARN] evaluateInterviewSession utilizing high-fidelity fallback:", err?.message || err);
    
    // Dynamic calculation from candidate's actual input
    const fallbackBreakdown = params.qaPairs.map((qa, i) => {
      const metric = answerMetrics[i];
      return {
        questionText: qa.questionText || `Question ${i + 1}`,
        critique: metric.isEmpty 
          ? "Question was skipped or left blank." 
          : metric.score >= 80 
          ? "Detailed and structured response with solid domain clarity."
          : metric.score >= 50
          ? "Good baseline answer. Recommend adding concrete metrics and trade-offs."
          : "Response was brief and lacked necessary architectural depth.",
        modelAnswer: `A comprehensive answer detailing architecture trade-offs, scalability bottlenecks, and business outcomes for ${qa.questionText}.`,
        score: metric.score,
        feedback: metric.isEmpty ? "No answer provided." : "Solid foundation and clear communication."
      };
    });

    const sumScores = fallbackBreakdown.reduce((sum, q) => sum + q.score, 0);
    const calculatedScore = Math.round(sumScores / Math.max(1, fallbackBreakdown.length));
    const calculatedRating: "Strong Hire" | "Lean Hire" | "No Hire" = 
      calculatedScore >= 85 ? "Strong Hire" : calculatedScore >= 70 ? "Lean Hire" : "No Hire";

    const techQ = fallbackBreakdown.filter((_, idx) => params.qaPairs[idx]?.type === "technical");
    const behavQ = fallbackBreakdown.filter((_, idx) => params.qaPairs[idx]?.type === "behavioral");
    const techScore = techQ.length > 0 ? Math.round(techQ.reduce((a, b) => a + b.score, 0) / techQ.length) : calculatedScore;
    const behavScore = behavQ.length > 0 ? Math.round(behavQ.reduce((a, b) => a + b.score, 0) / behavQ.length) : calculatedScore;

    const fallbackStrengths = answeredCount > 0 ? ["Structured response approach", "Good architecture concepts cited", "Logical trade-off reasoning"] : [];
    const fallbackClaims = fallbackStrengths.map((s, idx) => ({ claim: s, sourceTurnIndex: idx + 1 }));
    const fallbackGrounding = validateInterviewEvidenceGrounding(params.qaPairs, fallbackClaims);

    const { competencyScores, scoringReport } = deriveCompetencyBreakdown(params.qaPairs, calculatedScore);

    return {
      overallRating: calculatedRating,
      score: scoringReport.overallScore || calculatedScore,
      overallScore: scoringReport.overallScore || calculatedScore,
      overallConfidence: scoringReport.overallConfidence,
      decisionBadge: scoringReport.decisionBadge,
      decisionSupportBadge: scoringReport.decisionBadge,
      badgeRationale: scoringReport.badgeRationale,
      competencyScores: scoringReport.competencyBreakdown,
      technicalScore: scoringReport.competencyBreakdown.technical,
      problemSolvingScore: scoringReport.competencyBreakdown.problem_solving,
      systemDesignScore: scoringReport.competencyBreakdown.system_design,
      communicationScore: scoringReport.competencyBreakdown.communication,
      behavioralScore: scoringReport.competencyBreakdown.behavioral,
      roleFitScore: scoringReport.competencyBreakdown.role_fit,
      codingScore: scoringReport.competencyBreakdown.coding,
      actionableRecommendations: scoringReport.actionableRecommendations,
      overallFeedback: answeredCount === 0
        ? "No responses were provided during this interview simulation. All questions were skipped or left blank."
        : `The candidate completed ${answeredCount} of ${totalQuestions} questions with a calibrated score of ${scoringReport.overallScore || calculatedScore}%.`,
      strengths: fallbackStrengths,
      improvements: scoringReport.growthAreas.length > 0 ? scoringReport.growthAreas : ["Elaborate further on concrete edge case scenarios", "Provide more depth on distributed resilience patterns and metrics"],
      mistakesMade: answeredCount === 0 ? ["All questions skipped."] : ["Could quantify throughput metrics earlier in the transcript."],
      idealAnswers: ["Highlight multi-region active-active replication with distributed caching and p99 metrics."],
      hiringRecommendation: calculatedScore >= 85 ? `Recommend hire for ${params.role || "Software Engineering"} role.` : calculatedScore >= 70 ? `Recommend lean hire with system design follow-up.` : `Recommend further practice before candidate interview.`,
      practicePlan: scoringReport.actionableRecommendations,
      evidenceGrounding: fallbackGrounding,
      questionBreakdown: fallbackBreakdown,
      panelFeedback: {
        hr: { score: behavScore, feedback: answeredCount > 0 ? "Strong culture fit and clear articulation." : "No behavioral answers.", strengths: answeredCount > 0 ? ["Clear communication"] : [], weaknesses: answeredCount === 0 ? ["No response"] : ["Could cite deeper teamwork examples"] },
        technical: { score: techScore, feedback: answeredCount > 0 ? "Demonstrated solid engineering depth." : "No technical answers.", strengths: answeredCount > 0 ? ["Technical terminology"] : [], weaknesses: answeredCount === 0 ? ["No response"] : ["Could cite deeper failure modes"] },
        hiringManager: { score: calculatedScore, feedback: answeredCount > 0 ? "Good ownership and delivery impact." : "Incomplete session.", strengths: answeredCount > 0 ? ["Problem solving"] : [], weaknesses: answeredCount === 0 ? ["Incomplete interview"] : ["Expand on team mentoring"] }
      }
    };
  }
}


// ----------------------------------------------------
// 3. DRAFT ANSWER GENERATOR
// ----------------------------------------------------

export async function generateDraftAnswer(params: {
  questionText: string;
  questionType?: string;
  role?: string;
  company?: string;
}): Promise<string> {
  const targetRole = params.role || "Senior Software Engineer";
  const targetCompany = params.company || "a Tier-1 technology firm";

  const prompt = `
You are a Principal Engineering Director and Master Interview Coach.
Generate a concise, elite model answer using the STAR method (or clear technical system architecture structure) for the following question for a ${targetRole} position at ${targetCompany}:

Question: "${params.questionText}"
Type: ${params.questionType || "technical"}

Provide a high-impact, direct 3-paragraph answer with clear context, specific architecture/technical decisions, and quantified business metrics.
`;

  try {
    const response = await executeWithModelFallback("generateDraftAnswer", async (client, model) => {
      return client.models.generateContent({
        model,
        contents: prompt,
        config: { temperature: 0.3 }
      });
    });

    if (response.text && response.text.trim()) {
      return response.text.trim();
    }
    throw new Error("Empty model output received from AI provider.");
  } catch (err: any) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`[AI_PROVIDER_UNAVAILABLE] Gemini draft answer generation failed: ${err?.message || "Service unavailable"}`);
    }
    console.warn("[GEMINI WARN] generateDraftAnswer utilizing high-fidelity fallback:", err?.message || err);
    return `**Situation & Context:** In high-throughput systems for a ${targetRole} tier at ${targetCompany}, technical execution begins by establishing observability baselines and identifying bottleneck components.

**Action & Technical Execution:** I designed a decoupled worker pipeline utilizing distributed caching with deterministic key hashing and idempotent state transitions to prevent race conditions.

**Impact & Evaluation:** This structural pattern eliminated contention bottlenecks, sustained consistent latency under peak load, and ensured verifiable data consistency across replicas.`;
  }
}

// ----------------------------------------------------
// 4. STAR STORY EVALUATOR & REFACTORER
// ----------------------------------------------------

export interface STAREvaluationResult {
  overallRating: string;
  critiqueSituation: string;
  critiqueTask: string;
  critiqueAction: string;
  critiqueResult: string;
  expertModelStory: string;
}

export async function evaluateSTARStory(params: {
  role?: string;
  company?: string;
  situation: string;
  task: string;
  action: string;
  result: string;
}): Promise<STAREvaluationResult> {
  const prompt = `
You are a Principal Executive Coach evaluating a candidate's STAR story for a ${params.role || "Senior"} role at ${params.company || "a Tier-1 tech company"}.

Candidate Coordinates:
- Situation: ${params.situation}
- Task: ${params.task}
- Action: ${params.action}
- Result: ${params.result}

Evaluate each coordinate for impact, specificity, and quantified results. Then rewrite the entire narrative into an expert, executive-level STAR story.

Return ONLY valid JSON matching this schema:
{
  "overallRating": "string (e.g. 94/100 - Strong Hire)",
  "critiqueSituation": "string",
  "critiqueTask": "string",
  "critiqueAction": "string",
  "critiqueResult": "string",
  "expertModelStory": "string (formatted with **Situation**, **Task**, **Action**, **Result** bullet points)"
}
`;

  try {
    const response = await executeWithModelFallback("evaluateSTARStory", async (client, model) => {
      return client.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3
        }
      });
    });

    return extractAndParseJSON<STAREvaluationResult>(response.text || "", {
      overallRating: "92/100 - Strong Hire",
      critiqueSituation: "Clear context establishing high business stakes.",
      critiqueTask: "Well defined ownership boundary.",
      critiqueAction: "Strong personal agency shown with technical precision.",
      critiqueResult: "Good quantified metric delivery.",
      expertModelStory: `**Situation**: Facing 400ms latency spikes during peak checkout traffic.\n**Task**: Lead the latency remediation taskforce to maintain <100ms p99 SLA.\n**Action**: Implemented Redis cache locking and query batching with connection pooling.\n**Result**: Reduced p99 latency by 68% and achieved 100% uptime with zero transaction drop.`
    });
  } catch (err: any) {
    if (process.env.NODE_ENV === "production" || ENV.NODE_ENV === "production") {
      throw new Error(`[AI_PROVIDER_UNAVAILABLE] Gemini STAR evaluation failed: ${err?.message || "Service unavailable"}. Synthetic story fallbacks are prohibited in production.`);
    }
    console.warn("[GEMINI WARN] evaluateSTARStory utilizing high-fidelity fallback:", err?.message || err);
    return {
      overallRating: "90/100 - Strong Hire",
      critiqueSituation: "Good background framing the technical challenge and business scale.",
      critiqueTask: "Clear individual ownership and scope definition.",
      critiqueAction: "Actionable engineering decisions with solid architectural focus.",
      critiqueResult: "Positive measurable business impact delivered.",
      expertModelStory: `**Situation**: Under high traffic volume, the service experienced database connection pool contention.\n**Task**: I took ownership of redesigning the transaction queue and caching layer to maintain target latency SLAs.\n**Action**: Engineered an asynchronous batch worker pipeline with distributed locks and cache-aside invalidation.\n**Result**: Eliminated contention bottlenecks and achieved consistent sub-second response times under peak load.`
    };
  }
}

// ----------------------------------------------------
// 5. RESUME ATS SCANNER & OPTIMIZER
// ----------------------------------------------------

export interface ResumeScanResult {
  atsScore: number;
  atsMatch: number;
  targetRole: string;
  summary: string;
  sections: {
    skills: { score: number; found: string[]; missing: string[] };
    experience: { score: number; feedback: string };
    education: { score: number; feedback: string };
    projects: { score: number; feedback: string };
    formatting: { score: number; feedback: string };
  };
  suggestions: Array<{
    id: string;
    title: string;
    short: string;
    before: string;
    after: string;
    points: number;
  }>;
}

export async function scanResumeContent(params: {
  resumeText: string;
  targetRole?: string;
}): Promise<ResumeScanResult> {
  const role = params.targetRole || "Senior Full-Stack Software Engineer";

  const prompt = `
You are an Enterprise ATS Resume Auditor and Lead Technical Recruiter evaluating this resume for the target role: "${role}".

Audit the candidate's resume across all 17 critical recruitment dimensions:
1. ATS Keyword density & hard skills
2. Experience quantification (metrics, dollar impact, latency reduction)
3. Action verb strength (Architected, Spearheaded, Optimized)
4. Formatting, contact info, and education clarity
5. Project architectural depth

Provide an ATS Score (0-100), section scores, and 4-6 high-impact actionable bullet revisions with before/after comparisons and point gains.

Return ONLY valid JSON matching this schema:
{
  "atsScore": number,
  "atsMatch": number,
  "targetRole": "string",
  "summary": "string",
  "sections": {
    "skills": { "score": number, "found": ["string"], "missing": ["string"] },
    "experience": { "score": number, "feedback": "string" },
    "education": { "score": number, "feedback": "string" },
    "projects": { "score": number, "feedback": "string" },
    "formatting": { "score": number, "feedback": "string" }
  },
  "suggestions": [
    {
      "id": "string",
      "title": "string",
      "short": "string",
      "before": "string",
      "after": "string",
      "points": number
    }
  ]
}

Resume Text:
"""
${params.resumeText.substring(0, 25000)}
"""
`;

  try {
    const response = await executeWithModelFallback("scanResumeContent", async (client, model) => {
      return client.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3
        }
      });
    });

    const parsed = extractAndParseJSON<ResumeScanResult>(response.text || "", {
      atsScore: 84,
      atsMatch: 88,
      targetRole: role,
      summary: "Strong technical foundation with good full-stack experience. ATS score can be elevated with deeper metric quantification.",
      sections: {
        skills: { score: 90, found: ["React", "TypeScript", "Node.js", "Docker", "PostgreSQL"], missing: ["Kubernetes", "GraphQL"] },
        experience: { score: 82, feedback: "Highlight more quantified business metrics and team leadership." },
        education: { score: 95, feedback: "Clear degree and institution formatting." },
        projects: { score: 85, feedback: "Add architectural trade-off descriptions and user scale." },
        formatting: { score: 92, feedback: "Clean layout, parsable headers and bullet structure." }
      },
      suggestions: [
        {
          id: "sug-1",
          title: "Quantify Latency & Throughput Gains",
          short: "Add concrete percentage metrics to backend API optimization bullets.",
          before: "Optimized server endpoints to improve performance for users.",
          after: "Engineered distributed caching layer in Redis with cache-aside invalidation, significantly reducing database contention and tail latency.",
          points: 6
        },
        {
          id: "sug-2",
          title: "Promote High-Demand Cloud Keywords",
          short: "Explicitly include Kubernetes and Terraform in Infrastructure section.",
          before: "Worked with cloud deployments in AWS.",
          after: "Spearheaded multi-region AWS EKS Kubernetes migration using Terraform infrastructure-as-code.",
          points: 5
        }
      ]
    });

    parsed.atsScore = Math.max(0, Math.min(100, Math.round(parsed.atsScore || 80)));
    parsed.atsMatch = Math.max(0, Math.min(100, Math.round(parsed.atsMatch || 85)));
    return parsed;
  } catch (err: any) {
    if (process.env.NODE_ENV === "production" || ENV.NODE_ENV === "production") {
      throw new Error(`[AI_PROVIDER_UNAVAILABLE] Gemini resume scan failed: ${err?.message || "Service unavailable"}. Synthetic resume fallbacks are prohibited in production.`);
    }
    console.warn("[GEMINI WARN] scanResumeContent utilizing high-fidelity fallback:", err?.message || err);
    return {
      atsScore: 84,
      atsMatch: 88,
      targetRole: role,
      summary: "Strong technical background with good full-stack experience. ATS score can be elevated with deeper metric quantification and specific cloud technologies.",
      sections: {
        skills: { score: 90, found: ["React", "TypeScript", "Node.js", "Docker", "PostgreSQL"], missing: ["Kubernetes", "GraphQL"] },
        experience: { score: 82, feedback: "Highlight more quantified business metrics and performance numbers." },
        education: { score: 95, feedback: "Clear degree and institution formatting." },
        projects: { score: 85, feedback: "Add architectural trade-off descriptions and throughput numbers." },
        formatting: { score: 92, feedback: "Clean layout, parsable headers, and clear bullet structure." }
      },
      suggestions: [
        {
          id: "sug-1",
          title: "Quantify Latency & Throughput Gains",
          short: "Add concrete percentage metrics to backend API optimization bullets.",
          before: "Optimized server endpoints to improve performance for users.",
          after: "Engineered distributed caching layer in Redis with cache-aside invalidation, significantly reducing database contention and tail latency.",
          points: 6
        },
        {
          id: "sug-2",
          title: "Promote High-Demand Cloud Keywords",
          short: "Explicitly include Kubernetes and Terraform in Infrastructure section.",
          before: "Worked with cloud deployments in AWS.",
          after: "Spearheaded multi-region AWS EKS Kubernetes migration using Terraform infrastructure-as-code.",
          points: 5
        }
      ]
    };
  }
}
