import { CandidateFact, CandidateMemoryProfile } from "../../db/schema";
import { getCandidateMemoryByUserId, saveCandidateMemory, generateUUID } from "../../db/repository";

export function createDefaultCandidateMemory(userId: string): CandidateMemoryProfile {
  return {
    userId,
    skills: [],
    experienceYears: 0,
    targetRoles: [],
    targetCompanies: [],
    strengths: [],
    weaknesses: [],
    recurringImprovements: [],
    readinessSignals: {},
    interviewOutcomes: [],
    facts: [],
    updatedAt: new Date().toISOString()
  };
}

/**
 * Retrieves the durable candidate memory profile for a user.
 */
export async function getCandidateMemory(userId: string): Promise<CandidateMemoryProfile> {
  const existing = await getCandidateMemoryByUserId(userId);
  if (existing) {
    return existing;
  }
  const defaultProfile = createDefaultCandidateMemory(userId);
  await saveCandidateMemory(userId, defaultProfile);
  return defaultProfile;
}

/**
 * Records a durable candidate fact with provenance and source metadata.
 */
export async function addCandidateFact(
  userId: string,
  factData: Omit<CandidateFact, "id" | "createdAt" | "updatedAt">
): Promise<CandidateFact> {
  const profile = await getCandidateMemory(userId);
  const now = new Date().toISOString();
  const fact: CandidateFact = {
    id: generateUUID(),
    ...factData,
    createdAt: now,
    updatedAt: now
  };

  profile.facts.push(fact);

  // Reflect into high-level profile categories
  if (fact.category === "skill") {
    const existingSkill = profile.skills.find(s => s.name.toLowerCase() === fact.topic.toLowerCase());
    if (!existingSkill) {
      profile.skills.push({ name: fact.topic, level: "intermediate", evidence: fact.detail });
    }
  } else if (fact.category === "strength" && !profile.strengths.includes(fact.detail)) {
    profile.strengths.push(fact.detail);
  } else if (fact.category === "weakness" && !profile.weaknesses.includes(fact.detail)) {
    profile.weaknesses.push(fact.detail);
  } else if (fact.category === "improvement_area" && !profile.recurringImprovements.includes(fact.detail)) {
    profile.recurringImprovements.push(fact.detail);
  } else if (fact.category === "target_role" && !profile.targetRoles.includes(fact.topic)) {
    profile.targetRoles.push(fact.topic);
  }

  await saveCandidateMemory(userId, profile);
  return fact;
}

/**
 * Ingests resume scan analysis into candidate memory.
 */
export async function updateCandidateMemoryFromResume(
  userId: string,
  resumeId: string,
  parsedContent: string,
  analysis: any
): Promise<void> {
  const profile = await getCandidateMemory(userId);
  const now = new Date().toISOString();

  // 1. Ingest skills
  if (analysis?.skills && Array.isArray(analysis.skills)) {
    for (const skill of analysis.skills) {
      const skillName = typeof skill === "string" ? skill : skill.name;
      if (skillName && !profile.skills.some(s => s.name.toLowerCase() === skillName.toLowerCase())) {
        profile.skills.push({ name: skillName, level: "intermediate", evidence: `Extracted from resume (${resumeId})` });
        profile.facts.push({
          id: generateUUID(),
          category: "skill",
          topic: skillName,
          detail: `Proficient in ${skillName}`,
          confidenceScore: 0.9,
          source: "resume_scan",
          sourceId: resumeId,
          createdAt: now,
          updatedAt: now
        });
      }
    }
  }

  // 2. Ingest strengths & improvements
  if (analysis?.strengths && Array.isArray(analysis.strengths)) {
    for (const st of analysis.strengths) {
      if (typeof st === "string" && !profile.strengths.includes(st)) {
        profile.strengths.push(st);
      }
    }
  }

  if (analysis?.suggestions && Array.isArray(analysis.suggestions)) {
    for (const sug of analysis.suggestions) {
      const text = typeof sug === "string" ? sug : sug.text || sug.message;
      if (text && !profile.recurringImprovements.includes(text)) {
        profile.recurringImprovements.push(text);
      }
    }
  }

  await saveCandidateMemory(userId, profile);
}

/**
 * Ingests completed interview evaluation into candidate memory.
 */
export async function updateCandidateMemoryFromInterview(
  userId: string,
  sessionId: string,
  evaluation: any,
  role: string,
  company: string
): Promise<void> {
  const profile = await getCandidateMemory(userId);
  const now = new Date().toISOString();

  const score = typeof evaluation?.score === "number" ? evaluation.score : 75;

  profile.interviewOutcomes.push({
    sessionId,
    role,
    company,
    score,
    date: now
  });

  // Ingest strengths and improvements
  if (evaluation?.strengths && Array.isArray(evaluation.strengths)) {
    for (const st of evaluation.strengths) {
      if (typeof st === "string" && !profile.strengths.includes(st)) {
        profile.strengths.push(st);
      }
    }
  }

  if (evaluation?.improvements && Array.isArray(evaluation.improvements)) {
    for (const imp of evaluation.improvements) {
      if (typeof imp === "string" && !profile.recurringImprovements.includes(imp)) {
        profile.recurringImprovements.push(imp);
      }
    }
  }

  // Update readiness signals
  const domainKey = role || "General";
  profile.readinessSignals[domainKey] = score;

  await saveCandidateMemory(userId, profile);
}

/**
 * Formats durable candidate memory facts into an evidence string for LLM prompts.
 */
export async function formatCandidateMemoryContext(userId: string): Promise<string> {
  const profile = await getCandidateMemory(userId);

  const lines: string[] = [];
  if (profile.skills.length > 0) {
    lines.push(`- Core Skills: ${profile.skills.map(s => s.name).slice(0, 10).join(", ")}`);
  }
  if (profile.strengths.length > 0) {
    lines.push(`- Known Strengths: ${profile.strengths.slice(0, 4).join("; ")}`);
  }
  if (profile.recurringImprovements.length > 0) {
    lines.push(`- Improvement Focus Areas: ${profile.recurringImprovements.slice(0, 4).join("; ")}`);
  }
  if (profile.interviewOutcomes.length > 0) {
    const last = profile.interviewOutcomes[profile.interviewOutcomes.length - 1];
    lines.push(`- Prior Mock Interview: ${last.role} @ ${last.company} (Score: ${last.score}/100)`);
  }

  return lines.length > 0 ? lines.join("\n") : "No prior interview memory on record.";
}
