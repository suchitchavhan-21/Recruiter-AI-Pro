/**
 * Recruiter AI Pro — Objective Transparent Scoring & Decision-Support Model
 * 
 * Mathematically reproducible weighted scoring model:
 * - Technical Depth: 25%
 * - Problem Solving: 20%
 * - System Design: 15%
 * - Communication: 15%
 * - Behavioral (STAR): 10%
 * - Role Fit: 10%
 * - Coding: 5%
 * 
 * Decision-Support Badging:
 * - "Strong evidence"
 * - "Moderate evidence"
 * - "Insufficient evidence"
 * - "Needs improvement"
 * 
 * Never outputs binary "Hired" or "Rejected" verdicts.
 */

import { CompetencyScore, CompetencyType, COMPETENCY_DEFINITIONS } from "./competencyModel";

export type DecisionSupportBadge = 
  | "Strong evidence"
  | "Moderate evidence"
  | "Insufficient evidence"
  | "Needs improvement";

export interface CandidateScoringReport {
  overallScore: number; // 0 - 100
  overallConfidence: number; // 0.0 - 1.0
  decisionBadge: DecisionSupportBadge;
  decisionSupportBadge: DecisionSupportBadge; // Canonical alias
  badgeRationale: string;
  competencyBreakdown: Record<CompetencyType, CompetencyScore>;
  strengths: string[];
  growthAreas: string[];
  actionableRecommendations: string[];
  weightsUsed: Record<string, number>;
  jobFamily?: string;
  practicalAssessmentType?: string;
  codingRequired?: boolean;
}

/**
 * Computes deterministic weighted score across any dynamic competency dimensions.
 * Falls back to canonical 7-D engineering weights if customWeights is omitted.
 */
export function calculateWeightedInterviewScore(
  scores: Record<CompetencyType, CompetencyScore>,
  customWeights?: Record<string, number>
): { overallScore: number; weightsUsed: Record<string, number> } {
  const weights: Record<string, number> = customWeights || {
    technical: COMPETENCY_DEFINITIONS.technical.weight,
    problem_solving: COMPETENCY_DEFINITIONS.problem_solving.weight,
    system_design: COMPETENCY_DEFINITIONS.system_design.weight,
    communication: COMPETENCY_DEFINITIONS.communication.weight,
    behavioral: COMPETENCY_DEFINITIONS.behavioral.weight,
    role_fit: COMPETENCY_DEFINITIONS.role_fit.weight,
    coding: COMPETENCY_DEFINITIONS.coding.weight
  };

  let weightedSum = 0;
  let totalWeight = 0;

  for (const [key, weight] of Object.entries(weights)) {
    const scoreItem = scores[key];
    const scoreVal = scoreItem ? scoreItem.score : 50; // Fallback median if unassessed
    weightedSum += scoreVal * weight;
    totalWeight += weight;
  }

  const overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  return {
    overallScore,
    weightsUsed: weights
  };
}

/**
 * Generates transparent decision-support badge and personalized recommendations.
 */
export function generateScoringReport(
  scores: Record<CompetencyType, CompetencyScore>,
  customWeights?: Record<string, number>,
  metadata?: {
    jobFamily?: string;
    practicalAssessmentType?: string;
    codingRequired?: boolean;
    learningFocus?: string;
    targetRole?: string;
  }
): CandidateScoringReport {
  const { overallScore, weightsUsed } = calculateWeightedInterviewScore(scores, customWeights);

  // Check confidence metrics across competencies
  const scoreValues = Object.values(scores);
  const lowConfidenceCount = scoreValues.filter(s => s.confidence < 0.4 || s.status === "INSUFFICIENT_EVIDENCE").length;
  const avgConfidence = scoreValues.length > 0 
    ? scoreValues.reduce((acc, s) => acc + s.confidence, 0) / scoreValues.length 
    : 0;

  let decisionBadge: DecisionSupportBadge = "Moderate evidence";
  let badgeRationale = "";

  const domainLabel = metadata?.jobFamily === "engineering" || !metadata?.jobFamily
    ? "technical and architectural"
    : `${metadata.jobFamily.replace(/_/g, " ")} domain`;

  if (lowConfidenceCount >= 3) {
    decisionBadge = "Insufficient evidence";
    badgeRationale = `The session did not gather sufficient observable evidence across ${lowConfidenceCount} competencies to form a definitive assessment.`;
  } else if (overallScore >= 80 && avgConfidence >= 0.60) {
    decisionBadge = "Strong evidence";
    badgeRationale = `Consistent, verifiable demonstration of high-level proficiency across ${domainLabel} depth, problem-solving, and communication (Overall Score: ${overallScore}/100).`;
  } else if (overallScore >= 65 && avgConfidence >= 0.5) {
    decisionBadge = "Moderate evidence";
    badgeRationale = `Demonstrates sound foundational capabilities with specific opportunities for deeper concrete detail or STAR metrics (Overall Score: ${overallScore}/100).`;
  } else {
    decisionBadge = "Needs improvement";
    badgeRationale = `Several key competency areas scored below the target threshold or lacked requisite depth (Overall Score: ${overallScore}/100).`;
  }

  // Derive verifiable strengths and growth areas
  const strengths: string[] = [];
  const growthAreas: string[] = [];
  const actionableRecommendations: string[] = [];

  for (const item of scoreValues) {
    if (item.score >= 75 && item.status === "CONFIRMED") {
      strengths.push(`${item.name}: ${item.positiveSignals[0] || item.evidence.slice(0, 100)}`);
    } else if (item.score < 65 || item.status === "INSUFFICIENT_EVIDENCE") {
      growthAreas.push(`${item.name}: ${item.missingEvidence[0] || "Needs deeper concrete examples and metrics"}`);
      if (item.recommendedFollowUp) {
        actionableRecommendations.push(`Practice for ${item.name}: ${item.recommendedFollowUp}`);
      }
    }
  }

  // Domain-aware recommendations fallback
  if (metadata?.learningFocus) {
    actionableRecommendations.unshift(metadata.learningFocus);
  }

  if (actionableRecommendations.length < 2) {
    actionableRecommendations.push(
      "Practice STAR responses emphasizing individual contribution metrics ('I achieved a 35% improvement' instead of 'We improved the system')."
    );

    if (metadata?.jobFamily && metadata.jobFamily !== "engineering") {
      const familyRecs: Record<string, string> = {
        marketing: "Practice campaign measurement, customer acquisition cost (CAC) payback, and audience segmentation.",
        sales: "Practice diagnostic discovery questions, MEDDPICC qualification, and objection handling.",
        human_resources: "Practice employment scenario responses, workplace conflict mediation, and policy compliance.",
        education: "Practice classroom-management scenarios, differentiated instruction, and lesson planning.",
        finance: "Practice variance analysis, cash flow forecasting, and financial reasoning.",
        data_analytics: "Practice complex SQL window functions, statistical hypothesis testing, and dashboard storytelling.",
        product: "Practice customer discovery interviews, North Star metrics, and RICE prioritization."
      };
      actionableRecommendations.push(familyRecs[metadata.jobFamily] || "Deepen domain-specific case studies with quantifiable outcomes.");
    } else {
      actionableRecommendations.push(
        "In technical architecture questions, explicitly discuss failure modes, circuit breakers, and data consistency models."
      );
    }
  }

  return {
    overallScore,
    overallConfidence: avgConfidence,
    decisionBadge,
    decisionSupportBadge: decisionBadge,
    badgeRationale,
    competencyBreakdown: scores,
    strengths,
    growthAreas,
    actionableRecommendations,
    weightsUsed,
    jobFamily: metadata?.jobFamily,
    practicalAssessmentType: metadata?.practicalAssessmentType,
    codingRequired: metadata?.codingRequired
  };
}
