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
    confidence: z.number().default(0.85)
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
  technicalScore: z.number().min(0).max(100).default(75),
  behavioralScore: z.number().min(0).max(100).default(75),
  communicationScore: z.number().min(0).max(100).default(75),
  overallRating: z.string().default("Hire"),
  strengths: z.array(z.string()).default([]),
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

  let parsedJson: any = null;

  // 1. Try direct JSON parse
  try {
    parsedJson = JSON.parse(rawText.trim());
  } catch {
    // 2. Try regex extraction of markdown code fences: ```json ... ```
    const match = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match && match[1]) {
      try {
        parsedJson = JSON.parse(match[1].trim());
      } catch {}
    }

    // 3. Try finding outer braces: { ... }
    if (!parsedJson) {
      const firstBrace = rawText.indexOf("{");
      const lastBrace = rawText.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        try {
          parsedJson = JSON.parse(rawText.substring(firstBrace, lastBrace + 1));
        } catch {}
      }
    }
  }

  if (!parsedJson) {
    throw new Error(`[LANGCHAIN STRUCTURED OUTPUT ERROR] Failed to parse valid JSON from model output for schema '${schemaName}'. Raw preview: ${rawText.substring(0, 120)}`);
  }

  const validationResult = schema.safeParse(parsedJson);
  if (!validationResult.success) {
    const errorDetails = validationResult.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(", ");
    throw new Error(`[LANGCHAIN STRUCTURED OUTPUT ERROR] Output failed Zod schema validation for '${schemaName}': ${errorDetails}`);
  }

  return validationResult.data;
}
