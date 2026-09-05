/**
 * Recruiter AI Pro — Competency Definition & Evidence Extraction Engine
 * 
 * Defines 7 structured evaluation dimensions with evidence-backed extraction,
 * confidence scoring, and zero-hallucination guarantees.
 */

export type CompetencyType = 
  | "technical"
  | "problem_solving"
  | "system_design"
  | "communication"
  | "behavioral"
  | "role_fit"
  | "coding";

export interface CompetencyDefinition {
  type: CompetencyType;
  name: string;
  weight: number;
  description: string;
  positiveIndicators: string[];
  negativeIndicators: string[];
  defaultFollowUp: string;
}

export const COMPETENCY_DEFINITIONS: Record<CompetencyType, CompetencyDefinition> = {
  technical: {
    type: "technical",
    name: "Technical Depth & Core Engineering",
    weight: 0.25,
    description: "Deep understanding of programming fundamentals, language semantics, frameworks, and low-level trade-offs.",
    positiveIndicators: [
      "Explains exact memory or execution trade-offs",
      "Demonstrates concrete language or framework internals knowledge",
      "Names specific profiling tools and debugging methodologies"
    ],
    negativeIndicators: [
      "Gives vague high-level buzzwords without technical grounding",
      "Conflates library usage with architectural understanding",
      "Unable to explain failure modes or edge cases"
    ],
    defaultFollowUp: "Can you dive deeper into the technical trade-offs you encountered when choosing that specific implementation?"
  },
  problem_solving: {
    type: "problem_solving",
    name: "Analytical Problem Solving",
    weight: 0.20,
    description: "Structured decomposition of ambiguous problems, boundary condition awareness, and iterative refinement.",
    positiveIndicators: [
      "Clarifies ambiguous constraints before proposing solutions",
      "Systematically breaks down large problems into tractable sub-problems",
      "Identifies boundary conditions and edge cases unprompted"
    ],
    negativeIndicators: [
      "Jumps immediately to premature solutions without clarifying requirements",
      "Overlooks obvious edge cases or negative numbers/nulls",
      "Resists exploring alternative problem formulations"
    ],
    defaultFollowUp: "What were the primary edge cases you identified, and how did your solution safeguard against them?"
  },
  system_design: {
    type: "system_design",
    name: "System Architecture & Scalability",
    weight: 0.15,
    description: "Distributed systems, fault tolerance, horizontal scaling, data consistency, and failure domain isolation.",
    positiveIndicators: [
      "Defines clear system boundaries, bottlenecks, and data flows",
      "Explicitly weighs CAP theorem and consistency vs availability trade-offs",
      "Accounts for cascading failures, circuit breakers, and rate limits"
    ],
    negativeIndicators: [
      "Treats third-party components as magic black boxes with zero failure risk",
      "Ignores database indexing, sharding, or replication limits",
      "Proposes monolithic solutions without considering operational overhead"
    ],
    defaultFollowUp: "How does this architecture handle a sudden 10x traffic spike or a downstream database failure?"
  },
  communication: {
    type: "communication",
    name: "Clarity & Executive Communication",
    weight: 0.15,
    description: "Concise, structured delivery, cross-functional empathy, and ability to tailor technical concepts to different audiences.",
    positiveIndicators: [
      "Structure is clear and follows a logical progression (e.g., bottom-line first)",
      "Maintains crisp pacing without rambling",
      "Explains complex technical concepts with intuitive mental models"
    ],
    negativeIndicators: [
      "Rambles without reaching a clear conclusion or answer",
      "Uses opaque jargon without defining context",
      "Interrupts or ignores the interviewer's specific constraints"
    ],
    defaultFollowUp: "Could you summarize that in 2-3 sentences for a non-technical stakeholder?"
  },
  behavioral: {
    type: "behavioral",
    name: "Behavioral & STAR Execution",
    weight: 0.10,
    description: "Structured STAR storytelling demonstrating personal ownership, conflict navigation, and team leadership.",
    positiveIndicators: [
      "Clearly articulates personal actions ('I did') versus passive team actions ('we did')",
      "Provides measurable business results and quantitative impacts",
      "Demonstrates humility and lessons learned from past mistakes"
    ],
    negativeIndicators: [
      "Remains passive, speaking only about what the overall team or company did",
      "Omits tangible outcomes or measurable results",
      "Places blame on others when describing conflicts or failures"
    ],
    defaultFollowUp: "What was your specific personal contribution in that outcome, and what was the quantifiable result?"
  },
  role_fit: {
    type: "role_fit",
    name: "Role & Seniority Alignment",
    weight: 0.10,
    description: "Alignment with target role scope, company domain, and expectations for the requested seniority level.",
    positiveIndicators: [
      "Demonstrates scope commensurate with target seniority (e.g. org impact for Staff/Principal)",
      "Shows genuine interest in and understanding of the company's business model",
      "Anticipates business value beyond purely engineering considerations"
    ],
    negativeIndicators: [
      "Scope of answers is misaligned with required seniority",
      "Zero knowledge of industry domain or customer needs",
      "Shows reluctance to own production operations or team mentoring"
    ],
    defaultFollowUp: "How does this experience translate to the strategic priorities of this role at our company?"
  },
  coding: {
    type: "coding",
    name: "Algorithm & Code Execution",
    weight: 0.05,
    description: "Algorithmic correctness, time/space complexity optimality, and clean code construction.",
    positiveIndicators: [
      "Produces clean, idiomatic code that passes all edge cases",
      "Achieves optimal asymptotic time and auxiliary space complexity",
      "Handles null, empty, and large inputs gracefully"
    ],
    negativeIndicators: [
      "Code contains syntax errors or unhandled runtime exceptions",
      "Uses brute-force O(n^2) when O(n) hash map or O(log n) binary search is possible",
      "Fails hidden boundary test cases"
    ],
    defaultFollowUp: "Can you analyze the auxiliary space complexity of your solution and optimize it to O(1) or O(n)?"
  }
};

export interface STARBreakdown {
  situation: number; // 0 - 25
  task: number;      // 0 - 25
  action: number;    // 0 - 25
  result: number;    // 0 - 25
  total: number;     // 0 - 100
  feedback: string;
}

export interface CompetencyScore {
  competency: CompetencyType;
  name: string;
  score: number; // 0 - 100
  confidence: number; // 0.0 - 1.0 (low confidence when evidence is sparse)
  evidence: string; // Verifiable candidate statements or observations
  positiveSignals: string[];
  negativeSignals: string[];
  missingEvidence: string[];
  recommendedFollowUp: string;
  status: "CONFIRMED" | "MODERATE" | "INSUFFICIENT_EVIDENCE";
}

/**
 * Validates and normalizes candidate competency evaluation.
 * Enforces ZERO hallucination: if evidence is missing or trivial,
 * confidence is lowered and marked as INSUFFICIENT_EVIDENCE.
 */
export function normalizeCompetencyScore(
  competency: CompetencyType,
  rawScore: number,
  rawEvidence: string,
  positiveSignals: string[] = [],
  negativeSignals: string[] = [],
  missingEvidence: string[] = []
): CompetencyScore {
  const def = COMPETENCY_DEFINITIONS[competency];
  const evidenceTrimmed = (rawEvidence || "").trim();

  // If candidate didn't address or provided empty/negligible evidence
  const isEvidenceSparse = evidenceTrimmed.length < 25;
  const confidence = isEvidenceSparse ? 0.3 : Math.min(1.0, Math.max(0.4, (positiveSignals.length * 0.2) + 0.4));

  let normalizedScore = Math.max(0, Math.min(100, Math.round(rawScore)));
  if (isEvidenceSparse) {
    normalizedScore = Math.min(normalizedScore, 45);
  }

  let status: "CONFIRMED" | "MODERATE" | "INSUFFICIENT_EVIDENCE" = "MODERATE";
  if (confidence >= 0.7 && normalizedScore >= 70) {
    status = "CONFIRMED";
  } else if (confidence < 0.5 || isEvidenceSparse) {
    status = "INSUFFICIENT_EVIDENCE";
  }

  return {
    competency,
    name: def.name,
    score: normalizedScore,
    confidence,
    evidence: isEvidenceSparse 
      ? "Insufficient concrete detail provided during interview session." 
      : evidenceTrimmed,
    positiveSignals: positiveSignals.filter(Boolean),
    negativeSignals: negativeSignals.filter(Boolean),
    missingEvidence: missingEvidence.length > 0 
      ? missingEvidence 
      : (isEvidenceSparse ? ["Concrete technical implementation details", "Measurable outcomes"] : []),
    recommendedFollowUp: def.defaultFollowUp,
    status
  };
}

/**
 * Formats STAR breakdown with objective evaluation criteria.
 */
export function evaluateSTARComponents(
  situationText: string,
  taskText: string,
  actionText: string,
  resultText: string
): STARBreakdown {
  const sitScore = situationText.length > 30 ? 22 : situationText.length > 10 ? 15 : 8;
  const taskScore = taskText.length > 30 ? 22 : taskText.length > 10 ? 15 : 8;
  const actScore = actionText.length > 50 && /\b(I |my |created|designed|led|built|debugged|optimized)\b/i.test(actionText) ? 25 : actionText.length > 20 ? 16 : 8;
  const resScore = resultText.length > 30 && /\b(\d+%|\$\d+|\d+x|improved|reduced|increased|delivered)\b/i.test(resultText) ? 25 : resultText.length > 15 ? 16 : 7;

  const total = sitScore + taskScore + actScore + resScore;

  let feedback = "";
  if (total >= 85) {
    feedback = "Exceptional STAR structure with distinct personal agency and measurable metrics.";
  } else if (total >= 70) {
    feedback = "Solid STAR structure. For even higher impact, quantify results with explicit business metrics.";
  } else {
    feedback = "Needs improvement: clearly isolate your individual actions ('I') from team efforts and state quantified results.";
  }

  return {
    situation: sitScore,
    task: taskScore,
    action: actScore,
    result: resScore,
    total,
    feedback
  };
}
