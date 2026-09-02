import { retrieveCandidateEvidence } from "../rag/pipeline";

export type RequirementCategory = "must_have" | "preferred" | "responsibility";

export interface JobRequirement {
  id: string;
  text: string;
  category: RequirementCategory;
  importance: number;
}

export interface RequirementMatch {
  requirementId: string;
  requirementText: string;
  category: RequirementCategory;
  status: "strong_match" | "partial_match" | "missing";
  confidence: number;
  evidence: Array<{
    text: string;
    sourceType: string;
    sourceSection?: string;
    similarity: number;
  }>;
}

export interface ATSScoreResult {
  score: number;
  confidence: number;
  breakdown: {
    mustHave: number;
    preferred: number;
    responsibilities: number;
  };
  matchedRequirements: RequirementMatch[];
  partialRequirements: RequirementMatch[];
  missingRequirements: RequirementMatch[];
  limitations: string[];
}

/**
 * Deterministically extracts structured requirements from a job description text.
 */
export function extractJobRequirements(jdText: string): JobRequirement[] {
  if (!jdText || typeof jdText !== "string") {
    return [];
  }

  const lines = jdText
    .split(/\r?\n/)
    .map(l => l.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter(l => l.length >= 15 && l.length <= 300);

  const requirements: JobRequirement[] = [];
  let currentCategory: RequirementCategory = "must_have";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // Identify section transitions
    if (
      lower.includes("preferred") || 
      lower.includes("nice to have") || 
      lower.includes("bonus") || 
      lower.includes("plus")
    ) {
      currentCategory = "preferred";
      continue;
    } else if (
      lower.includes("responsibilit") || 
      lower.includes("what you'll do") || 
      lower.includes("day to day") || 
      lower.includes("duties") ||
      lower.includes("role overview")
    ) {
      currentCategory = "responsibility";
      continue;
    } else if (
      lower.includes("requirement") || 
      lower.includes("qualificat") || 
      lower.includes("must have") || 
      lower.includes("minimum") || 
      lower.includes("who you are")
    ) {
      currentCategory = "must_have";
      continue;
    }

    // Skip generic headings
    if (line.endsWith(":") && line.length < 35) {
      continue;
    }

    const importance = currentCategory === "must_have" ? 2 : 1;

    requirements.push({
      id: `req-${requirements.length + 1}`,
      text: line,
      category: currentCategory,
      importance
    });

    if (requirements.length >= 12) break; // Cap at 12 distinct requirements for thorough analysis
  }

  // If no bullet points were parsed, extract distinct sentence clauses
  if (requirements.length === 0) {
    const sentences = jdText
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length >= 20 && s.length <= 250);

    sentences.slice(0, 6).forEach((sentence, idx) => {
      const cat: RequirementCategory = idx === 0 || idx === 1 ? "must_have" : (idx % 2 === 0 ? "responsibility" : "preferred");
      requirements.push({
        id: `req-${idx + 1}`,
        text: sentence,
        category: cat,
        importance: cat === "must_have" ? 2 : 1
      });
    });
  }

  return requirements;
}

/**
 * Evaluates candidate evidence against job requirements using candidate-private RAG.
 * Formula is 100% deterministic, explainable, and grounded in vector retrieval confidence.
 */
export async function calculateEvidenceBasedATSScore(params: {
  userId: string;
  jdText: string;
  jobId?: string;
  role?: string;
}): Promise<ATSScoreResult> {
  const requirements = extractJobRequirements(params.jdText);

  if (requirements.length === 0) {
    return {
      score: 0,
      confidence: 0,
      breakdown: { mustHave: 0, preferred: 0, responsibilities: 0 },
      matchedRequirements: [],
      partialRequirements: [],
      missingRequirements: [],
      limitations: [
        "Job description does not contain sufficient structured text for evidence analysis."
      ]
    };
  }

  const matches: RequirementMatch[] = [];

  for (const req of requirements) {
    // 1. Query candidate's private vector index
    const vectorResults = await retrieveCandidateEvidence(params.userId, req.text, 2);

    if (vectorResults.length > 0 && vectorResults[0].similarity >= 0.65) {
      const top = vectorResults[0];
      matches.push({
        requirementId: req.id,
        requirementText: req.text,
        category: req.category,
        status: "strong_match",
        confidence: Math.round(top.similarity * 100) / 100,
        evidence: [{
          text: top.content,
          sourceType: "resume_chunk",
          sourceSection: top.section,
          similarity: Math.round(top.similarity * 100) / 100
        }]
      });
    } else if (vectorResults.length > 0 && vectorResults[0].similarity >= 0.45) {
      const top = vectorResults[0];
      matches.push({
        requirementId: req.id,
        requirementText: req.text,
        category: req.category,
        status: "partial_match",
        confidence: Math.round(top.similarity * 100) / 100,
        evidence: [{
          text: top.content,
          sourceType: "resume_chunk",
          sourceSection: top.section,
          similarity: Math.round(top.similarity * 100) / 100
        }]
      });
    } else {
      const top = vectorResults[0];
      matches.push({
        requirementId: req.id,
        requirementText: req.text,
        category: req.category,
        status: "missing",
        confidence: top ? Math.round(top.similarity * 100) / 100 : 0,
        evidence: []
      });
    }
  }

  // 2. Compute deterministic weighted score
  let totalWeightedContribution = 0;
  let totalPossibleWeight = 0;

  let mustHaveScore = 0;
  let mustHavePossible = 0;

  let prefScore = 0;
  let prefPossible = 0;

  let respScore = 0;
  let respPossible = 0;

  let totalConfidenceSum = 0;

  for (const match of matches) {
    const weight = match.category === "must_have" ? 2 : 1;
    const matchValue = match.status === "strong_match" ? 1.0 : (match.status === "partial_match" ? 0.5 : 0.0);
    const contribution = matchValue * weight;

    totalWeightedContribution += contribution;
    totalPossibleWeight += weight;
    totalConfidenceSum += match.confidence;

    if (match.category === "must_have") {
      mustHaveScore += contribution;
      mustHavePossible += weight;
    } else if (match.category === "preferred") {
      prefScore += contribution;
      prefPossible += weight;
    } else if (match.category === "responsibility") {
      respScore += contribution;
      respPossible += weight;
    }
  }

  const overallScore = totalPossibleWeight > 0
    ? Math.max(0, Math.min(100, Math.round((100 * totalWeightedContribution) / totalPossibleWeight)))
    : 0;

  const mustHaveBreakdown = mustHavePossible > 0
    ? Math.max(0, Math.min(100, Math.round((100 * mustHaveScore) / mustHavePossible)))
    : 100;

  const prefBreakdown = prefPossible > 0
    ? Math.max(0, Math.min(100, Math.round((100 * prefScore) / prefPossible)))
    : 100;

  const respBreakdown = respPossible > 0
    ? Math.max(0, Math.min(100, Math.round((100 * respScore) / respPossible)))
    : 100;

  const meanConfidence = matches.length > 0
    ? Math.round((totalConfidenceSum / matches.length) * 100) / 100
    : 0;

  const matchedRequirements = matches.filter(m => m.status === "strong_match");
  const partialRequirements = matches.filter(m => m.status === "partial_match");
  const missingRequirements = matches.filter(m => m.status === "missing");

  return {
    score: overallScore,
    confidence: meanConfidence,
    breakdown: {
      mustHave: mustHaveBreakdown,
      preferred: prefBreakdown,
      responsibilities: respBreakdown
    },
    matchedRequirements,
    partialRequirements,
    missingRequirements,
    limitations: [
      "ATS matching evaluates evidence available in your candidate profile and indexed documents. It does not guarantee recruiter selection.",
      "Scores are calculated using deterministic semantic similarity against candidate-private vector chunks."
    ]
  };
}
