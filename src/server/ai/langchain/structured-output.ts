import { z } from "zod";

/**
 * 1. Schema for Extracted Job Requirements
 */
export const JdRequirementsSchema = z.object({
  mustHave: z.array(z.string()).default([]),
  preferred: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).default([])
});
export type JdRequirementsOutput = z.infer<typeof JdRequirementsSchema>;

/**
 * 2. Schema for ATS Evidence Evaluation
 */
export const AtsEvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  matchedRequirements: z.array(z.object({
    requirement: z.string(),
    matched: z.boolean(),
    evidence: z.string().default(""),
    confidence: z.number().min(0).max(1)
  })).default([]),
  missingRequirements: z.array(z.string()).default([]),
  strengths: z.array(z.string()).default([]),
  gaps: z.array(z.string()).default([]),
  summary: z.string().default("")
});
export type AtsEvaluationOutput = z.infer<typeof AtsEvaluationSchema>;

/**
 * 3. Schema for Interview Turn Decisions
 */
export const InterviewerTurnSchema = z.object({
  interviewerName: z.string(),
  interviewerRole: z.enum(["HR", "Technical", "HiringManager"]),
  interviewerTitle: z.string(),
  turnFeedback: z.string(),
  nextQuestion: z.string(),
  questionType: z.enum(["technical", "behavioral"]),
  expectedCompetency: z.string(),
  evaluationRubric: z.string()
});
export type InterviewerTurnOutput = z.infer<typeof InterviewerTurnSchema>;

/**
 * 4. Schema for Final Interview Evaluation
 */
export const InterviewEvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  technicalScore: z.number().min(0).max(100),
  behavioralScore: z.number().min(0).max(100),
  communicationScore: z.number().min(0).max(100),
  overallRating: z.string(),
  overallFeedback: z.string(),
  strengths: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
  areasForImprovement: z.array(z.string()).default([]),
  detailedFeedback: z.string().default("")
});
export type InterviewEvaluationOutput = z.infer<typeof InterviewEvaluationSchema>;

/**
 * 5. Schema for STAR Narrative Evaluation
 */
export const StarEvaluationSchema = z.object({
  score: z.number().min(0).max(100).default(80),
  overallRating: z.string().default("Strong Candidate"),
  situationScore: z.number().min(0).max(100).default(75),
  taskScore: z.number().min(0).max(100).default(75),
  actionScore: z.number().min(0).max(100).default(75),
  resultScore: z.number().min(0).max(100).default(75),
  critiqueSituation: z.string().default("Good contextual clarity."),
  critiqueTask: z.string().default("Clear problem definition."),
  critiqueAction: z.string().default("Strong technical initiative and action verbs."),
  critiqueResult: z.string().default("Quantified business and architectural metrics."),
  expertModelStory: z.string().default(""),
  strengths: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
  refinedStory: z.string().default("")
});
export type StarEvaluationOutput = z.infer<typeof StarEvaluationSchema>;

/**
 * 6. Schema for Evidence-Based Multi-Dimensional Competency Evaluation
 */
export const CompetencyEvaluationSchema = z.object({
  overallScore: z.number().min(0).max(100),
  decisionBadge: z.enum([
    "Strong evidence",
    "Moderate evidence",
    "Insufficient evidence",
    "Needs improvement"
  ]),
  badgeRationale: z.string(),
  competencies: z.object({
    technical: z.object({
      score: z.number().min(0).max(100),
      confidence: z.number().min(0).max(1),
      evidence: z.string(),
      positiveSignals: z.array(z.string()).default([]),
      negativeSignals: z.array(z.string()).default([]),
      missingEvidence: z.array(z.string()).default([]),
      recommendedFollowUp: z.string()
    }),
    problem_solving: z.object({
      score: z.number().min(0).max(100),
      confidence: z.number().min(0).max(1),
      evidence: z.string(),
      positiveSignals: z.array(z.string()).default([]),
      negativeSignals: z.array(z.string()).default([]),
      missingEvidence: z.array(z.string()).default([]),
      recommendedFollowUp: z.string()
    }),
    system_design: z.object({
      score: z.number().min(0).max(100),
      confidence: z.number().min(0).max(1),
      evidence: z.string(),
      positiveSignals: z.array(z.string()).default([]),
      negativeSignals: z.array(z.string()).default([]),
      missingEvidence: z.array(z.string()).default([]),
      recommendedFollowUp: z.string()
    }),
    communication: z.object({
      score: z.number().min(0).max(100),
      confidence: z.number().min(0).max(1),
      evidence: z.string(),
      positiveSignals: z.array(z.string()).default([]),
      negativeSignals: z.array(z.string()).default([]),
      missingEvidence: z.array(z.string()).default([]),
      recommendedFollowUp: z.string()
    }),
    behavioral: z.object({
      score: z.number().min(0).max(100),
      confidence: z.number().min(0).max(1),
      evidence: z.string(),
      positiveSignals: z.array(z.string()).default([]),
      negativeSignals: z.array(z.string()).default([]),
      missingEvidence: z.array(z.string()).default([]),
      recommendedFollowUp: z.string(),
      starBreakdown: z.object({
        situation: z.number().min(0).max(25),
        task: z.number().min(0).max(25),
        action: z.number().min(0).max(25),
        result: z.number().min(0).max(25)
      }).optional()
    }),
    role_fit: z.object({
      score: z.number().min(0).max(100),
      confidence: z.number().min(0).max(1),
      evidence: z.string(),
      positiveSignals: z.array(z.string()).default([]),
      negativeSignals: z.array(z.string()).default([]),
      missingEvidence: z.array(z.string()).default([]),
      recommendedFollowUp: z.string()
    }),
    coding: z.object({
      score: z.number().min(0).max(100),
      confidence: z.number().min(0).max(1),
      evidence: z.string(),
      positiveSignals: z.array(z.string()).default([]),
      negativeSignals: z.array(z.string()).default([]),
      missingEvidence: z.array(z.string()).default([]),
      recommendedFollowUp: z.string()
    })
  }),
  strengths: z.array(z.string()).default([]),
  growthAreas: z.array(z.string()).default([]),
  actionableRecommendations: z.array(z.string()).default([])
});
export type CompetencyEvaluationOutput = z.infer<typeof CompetencyEvaluationSchema>;

function tryParseJson(str: string): any {
  if (!str) return null;
  try {
    return JSON.parse(str.trim());
  } catch {}

  // Strip markdown code fences if present inside
  const fenceMatch = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {}
  }

  // Extract from first { to last }
  const firstBrace = str.indexOf("{");
  const lastBrace = str.lastIndexOf("}");
  const candidate = (firstBrace !== -1 && lastBrace > firstBrace)
    ? str.substring(firstBrace, lastBrace + 1)
    : str;

  try {
    return JSON.parse(candidate);
  } catch {}

  // Clean trailing commas
  try {
    const noTrailing = candidate.replace(/,(\s*[}\]])/g, "$1");
    return JSON.parse(noTrailing);
  } catch {}

  // Character scan: escape literal unescaped newlines/tabs inside string values
  try {
    let inString = false;
    let escaped = false;
    let sanitized = "";
    for (let i = 0; i < candidate.length; i++) {
      const c = candidate[i];
      if (c === '"' && !escaped) {
        inString = !inString;
        sanitized += c;
      } else if (inString && c === "\n") {
        sanitized += "\\n";
      } else if (inString && c === "\r") {
        sanitized += "\\r";
      } else if (inString && c === "\t") {
        sanitized += "\\t";
      } else {
        sanitized += c;
      }
      escaped = (c === "\\" && !escaped);
    }
    const noTrailing = sanitized.replace(/,(\s*[}\]])/g, "$1");
    return JSON.parse(noTrailing);
  } catch {}

  return null;
}

/**
 * Parses and validates LLM raw response text against a strict Zod schema.
 * Rejects invalid output cleanly without silently fabricating values.
 */
export function parseAndValidateJson<T>(
  rawText: string,
  schema: z.ZodSchema<T>,
  schemaName: string
): T {
  if (!rawText || !rawText.trim()) {
    throw new Error(`[LANGCHAIN STRUCTURED OUTPUT ERROR] Empty output received for schema '${schemaName}'.`);
  }

  const parsedJson = tryParseJson(rawText);

  if (!parsedJson) {
    throw new Error(`[LANGCHAIN STRUCTURED OUTPUT ERROR] Failed to parse valid JSON from model output for schema '${schemaName}' (length: ${rawText.length}). Raw content: ${rawText.length > 500 ? rawText.substring(0, 500) + '...' : rawText}`);
  }

  const validationResult = schema.safeParse(parsedJson);
  if (!validationResult.success) {
    const errorDetails = validationResult.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(", ");
    throw new Error(`[LANGCHAIN STRUCTURED OUTPUT ERROR] Output failed Zod schema validation for '${schemaName}': ${errorDetails}`);
  }

  return validationResult.data;
}
