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
  decisionBadge: DecisionSupportBadge;
  badgeRationale: string;
  competencyBreakdown: Record<CompetencyType, CompetencyScore>;
  strengths: string[];
  growthAreas: string[];
  actionableRecommendations: string[];
  weightsUsed: Record<CompetencyType, number>;
}

/**
 * Computes deterministic weighted score across all 7 competency dimensions.
 */
export function calculateWeightedInterviewScore(
  scores: Record<CompetencyType, CompetencyScore>
): { overallScore: number; weightsUsed: Record<CompetencyType, number> } {
  const weights: Record<CompetencyType, number> = {
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

  for (const [key, def] of Object.entries(COMPETENCY_DEFINITIONS)) {
    const compKey = key as CompetencyType;
    const scoreItem = scores[compKey];
    const scoreVal = scoreItem ? scoreItem.score : 50; // Fallback median if unassessed
    const weight = def.weight;

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
  scores: Record<CompetencyType, CompetencyScore>
): CandidateScoringReport {
  const { overallScore, weightsUsed } = calculateWeightedInterviewScore(scores);

  // Check confidence metrics across core competencies
  const scoreValues = Object.values(scores);
  const lowConfidenceCount = scoreValues.filter(s => s.confidence < 0.4 || s.status === "INSUFFICIENT_EVIDENCE").length;
  const avgConfidence = scoreValues.length > 0 
    ? scoreValues.reduce((acc, s) => acc + s.confidence, 0) / scoreValues.length 
    : 0;

  let decisionBadge: DecisionSupportBadge = "Moderate evidence";
  let badgeRationale = "";

  if (lowConfidenceCount >= 3) {
    decisionBadge = "Insufficient evidence";
    badgeRationale = `The session did not gather sufficient observable evidence across ${lowConfidenceCount} competencies to form a definitive assessment.`;
  } else if (overallScore >= 80 && avgConfidence >= 0.60) {
    decisionBadge = "Strong evidence";
    badgeRationale = `Consistent, verifiable demonstration of high-level proficiency across technical depth, problem-solving, and communication (Overall Score: ${overallScore}/100).`;
  } else if (overallScore >= 65 && avgConfidence >= 0.5) {
    decisionBadge = "Moderate evidence";
    badgeRationale = `Demonstrates sound foundational engineering capabilities with specific opportunities for deeper architectural or STAR detail (Overall Score: ${overallScore}/100).`;
  } else {
    decisionBadge = "Needs improvement";
    badgeRationale = `Several key competency areas scored below the target threshold or lacked requisite technical depth (Overall Score: ${overallScore}/100).`;
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

  // Always supply at least 2 constructive recommendations
  if (actionableRecommendations.length < 2) {
    actionableRecommendations.push(
      "Practice STAR responses emphasizing individual contribution metrics ('I achieved a 35% latency reduction' instead of 'We improved the system')."
    );
    actionableRecommendations.push(
      "In technical architecture questions, explicitly discuss failure modes, circuit breakers, and data consistency models."
    );
  }

  return {
    overallScore,
    decisionBadge,
    badgeRationale,
    competencyBreakdown: scores,
    strengths,
    growthAreas,
    actionableRecommendations,
    weightsUsed
  };
}
