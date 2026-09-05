/**
 * Test Suite: Evidence-Based Adaptive Interview Engine & Competency Scoring
 * 
 * Verifies:
 * 1. 7-dimensional competency model and weighted score reproducibility
 * 2. Decision support badges ("Strong evidence", "Moderate evidence", "Insufficient evidence", "Needs improvement")
 * 3. Prohibition of binary "Hired" / "Rejected" outputs
 * 4. Human HR STAR scoring (Situation, Task, Action, Result separate scoring)
 * 5. Tenant isolation in competency score persistence
 * 6. Evidence extraction and zero-hallucination confidence scoring
 */

import { initPostgresSchema, closePostgresPool } from "../src/server/db/postgres";
import { 
  COMPETENCY_DEFINITIONS, 
  normalizeCompetencyScore, 
  evaluateSTARComponents, 
  CompetencyType, 
  CompetencyScore 
} from "../src/server/ai/orchestrator/competencyModel";
import { 
  calculateWeightedInterviewScore, 
  generateScoringReport 
} from "../src/server/ai/orchestrator/scoringModel";
import { 
  insertCompetencyScore, 
  findCompetencyScoresBySessionId, 
  insertUser,
  insertInterview,
  generateUUID 
} from "../src/server/db/repository";
import { deriveCompetencyBreakdown } from "../src/server/services/gemini.service";

async function runAdaptiveEvidenceTests() {
  console.log("==================================================");
  console.log("RUNNING EVIDENCE-BASED ADAPTIVE INTERVIEW TEST SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, description: string) {
    if (condition) {
      console.log(`  [PASS] ${description}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${description}`);
      failed++;
    }
  }

  // 1. Competency Definitions & Weights Integrity
  console.log("Test Group 1: 7-Dimensional Competency Weight Calibration");
  const totalWeight = Object.values(COMPETENCY_DEFINITIONS).reduce((sum, def) => sum + def.weight, 0);
  assert(Math.abs(totalWeight - 1.0) < 0.001, `Total competency weights sum to 1.0 (exact: ${totalWeight})`);
  assert(COMPETENCY_DEFINITIONS.technical.weight === 0.25, "Technical depth weight is exactly 25%");
  assert(COMPETENCY_DEFINITIONS.problem_solving.weight === 0.20, "Problem solving weight is exactly 20%");
  assert(COMPETENCY_DEFINITIONS.system_design.weight === 0.15, "System design weight is exactly 15%");
  assert(COMPETENCY_DEFINITIONS.communication.weight === 0.15, "Communication weight is exactly 15%");
  assert(COMPETENCY_DEFINITIONS.behavioral.weight === 0.10, "Behavioral weight is exactly 10%");
  assert(COMPETENCY_DEFINITIONS.role_fit.weight === 0.10, "Role fit weight is exactly 10%");
  assert(COMPETENCY_DEFINITIONS.coding.weight === 0.05, "Coding weight is exactly 5%");

  // 2. Mathematical Scoring Reproducibility
  console.log("\nTest Group 2: Mathematical Scoring Reproducibility");
  const testScores: Record<CompetencyType, CompetencyScore> = {
    technical: normalizeCompetencyScore("technical", 80, "Used Redis cache and Kafka streaming.", ["Kafka", "Redis"]),
    problem_solving: normalizeCompetencyScore("problem_solving", 90, "Identified boundary conditions and edge cases.", ["Boundary checks"]),
    system_design: normalizeCompetencyScore("system_design", 70, "Addressed circuit breakers and horizontal scaling.", ["Circuit breaker"]),
    communication: normalizeCompetencyScore("communication", 85, "Concise and structured executive summary.", ["Clear structure"]),
    behavioral: normalizeCompetencyScore("behavioral", 75, "Led the incident response team personally.", ["Personal agency"]),
    role_fit: normalizeCompetencyScore("role_fit", 80, "Aligned with Staff Engineer scope.", ["Senior scope"]),
    coding: normalizeCompetencyScore("coding", 100, "Optimal Two Sum O(n) solution using Map.", ["Optimal O(n)"])
  };

  // Expected weighted:
  // 80*0.25 + 90*0.20 + 70*0.15 + 85*0.15 + 75*0.10 + 80*0.10 + 100*0.05
  // = 20 + 18 + 10.5 + 12.75 + 7.5 + 8 + 5 = 81.75 -> round = 82
  const weightedResult = calculateWeightedInterviewScore(testScores);
  assert(weightedResult.overallScore === 82, `Deterministic weighted score: ${weightedResult.overallScore} (expected 82)`);

  const report = generateScoringReport(testScores);
  assert(report.decisionBadge === "Strong evidence", `Decision badge for 82% score: ${report.decisionBadge}`);
  assert(!report.decisionBadge.includes("Hired") && !report.decisionBadge.includes("Rejected"), "Report avoids binary Hired/Rejected verdicts");
  assert(report.actionableRecommendations.length >= 2, "Report includes actionable recommendations");

  // 3. Sparse Evidence / Insufficient Evidence Detection
  console.log("\nTest Group 3: Insufficient Evidence & Confidence Guardrails");
  const sparseScores: Record<CompetencyType, CompetencyScore> = {
    technical: normalizeCompetencyScore("technical", 50, "ok"),
    problem_solving: normalizeCompetencyScore("problem_solving", 50, ""),
    system_design: normalizeCompetencyScore("system_design", 50, "none"),
    communication: normalizeCompetencyScore("communication", 60, "I think so"),
    behavioral: normalizeCompetencyScore("behavioral", 50, ""),
    role_fit: normalizeCompetencyScore("role_fit", 50, ""),
    coding: normalizeCompetencyScore("coding", 50, "")
  };

  const sparseReport = generateScoringReport(sparseScores);
  assert(sparseReport.decisionBadge === "Insufficient evidence", `Sparse answers yield 'Insufficient evidence': ${sparseReport.decisionBadge}`);
  assert(sparseScores.technical.status === "INSUFFICIENT_EVIDENCE", "Technical score marked INSUFFICIENT_EVIDENCE when evidence is empty");
  assert(sparseScores.technical.confidence <= 0.4, `Confidence is reduced for sparse evidence: ${sparseScores.technical.confidence}`);

  // 4. Human HR STAR Breakdown Evaluation
  console.log("\nTest Group 4: Human HR STAR Component Scoring");
  const starResult = evaluateSTARComponents(
    "Our production payment service was experiencing 5% failure rates during Black Friday flash sales.",
    "I was assigned as technical lead to diagnose the root cause and restore 99.99% availability within 48 hours.",
    "I profiled the database queries, identified unindexed locks, designed a redis cache write-behind queue, and spearheaded the deployment.",
    "We eliminated 100% of the timeout errors, reduced p99 latency by 65%, and handled 10x traffic without dropping any transactions."
  );

  assert(starResult.situation >= 20, `Situation scored objectively: ${starResult.situation}/25`);
  assert(starResult.task >= 20, `Task scored objectively: ${starResult.task}/25`);
  assert(starResult.action === 25, `Action with personal agency verbs scored: ${starResult.action}/25`);
  assert(starResult.result === 25, `Result with quantifiable metrics (65%, 10x) scored: ${starResult.result}/25`);
  assert(starResult.total >= 90, `Total STAR score: ${starResult.total}/100`);

  // 5. Transcript-Grounded Competency Extraction
  console.log("\nTest Group 5: Transcript-Grounded Breakdown Extraction");
  const mockTranscript = [
    {
      questionId: 1,
      questionText: "Can you walk me through your background and the most complex architecture you designed?",
      type: "technical",
      answerText: "At Acme Corp, I architected a distributed event-driven pipeline processing 50k QPS using Apache Kafka, Go, and PostgreSQL. We had replication lag issues which I resolved by sharding the database by customer tenant ID."
    },
    {
      questionId: 2,
      questionText: "Tell me about a time you had a significant disagreement with an engineering partner.",
      type: "behavioral",
      answerText: "When choosing between GraphQL and REST for our public API, my peer favored GraphQL. I created a benchmark proving REST with protobuf reduced latency by 35% on mobile devices, aligning the team through empirical data."
    }
  ];

  const derived = deriveCompetencyBreakdown(mockTranscript, 85);
  assert(!!derived.competencyScores.technical, "Technical competency extracted");
  assert(derived.competencyScores.technical.positiveSignals.length > 0, "Positive signal detected for 50k QPS / Kafka");
  assert(derived.competencyScores.behavioral.positiveSignals.length > 0, "Positive signal detected for personal agency (I created, benchmark)");
  assert(derived.scoringReport.overallScore > 0, `Scoring report overall score computed: ${derived.scoringReport.overallScore}`);
  assert(derived.scoringReport.overallConfidence > 0, `Scoring report overall confidence computed: ${derived.scoringReport.overallConfidence}`);
  assert(derived.scoringReport.decisionSupportBadge === "Strong evidence", `Decision support badge is '${derived.scoringReport.decisionSupportBadge}'`);

  // Verify all 7 competency score objects contain required attributes
  const allSevenCompetencies: CompetencyType[] = ["technical", "problem_solving", "system_design", "communication", "behavioral", "role_fit", "coding"];
  for (const c of allSevenCompetencies) {
    const compObj = derived.competencyScores[c];
    assert(compObj !== undefined, `Competency '${c}' is present`);
    assert(typeof compObj.score === "number", `Competency '${c}' score is numeric (${compObj.score})`);
    assert(typeof compObj.confidence === "number", `Competency '${c}' confidence is numeric (${compObj.confidence})`);
    assert(typeof compObj.evidence === "string", `Competency '${c}' has verifiable evidence string`);
    assert(Array.isArray(compObj.positiveSignals), `Competency '${c}' has positiveSignals array`);
    assert(Array.isArray(compObj.negativeSignals), `Competency '${c}' has negativeSignals array`);
    assert(Array.isArray(compObj.missingEvidence), `Competency '${c}' has missingEvidence array`);
    assert(typeof compObj.recommendedFollowUp === "string", `Competency '${c}' has recommendedFollowUp string`);
  }

  // 6. Tenant-Isolated Database Persistence
  console.log("\nTest Group 6: Tenant-Isolated PostgreSQL Competency Persistence");
  await initPostgresSchema();

  const userA = generateUUID();
  const userB = generateUUID();
  const sessionA = generateUUID();

  // Insert userA and userB to satisfy foreign key constraints
  await insertUser({
    id: userA,
    fullName: "Candidate A",
    email: `candidate_a_${Date.now()}@example.com`,
    passwordHash: "hash123",
    role: "candidate",
    provider: "local",
    emailVerified: true,
    accountStatus: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  await insertUser({
    id: userB,
    fullName: "Candidate B",
    email: `candidate_b_${Date.now()}@example.com`,
    passwordHash: "hash123",
    role: "candidate",
    provider: "local",
    emailVerified: true,
    accountStatus: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Insert sessionA for userA
  await insertInterview({
    id: sessionA,
    userId: userA,
    company: "Acme",
    role: "Staff Engineer",
    difficulty: "Senior",
    interviewerCount: 1,
    persona: "mentor",
    state: "COMPLETED",
    score: 88,
    timeTaken: "15m",
    questions: [],
    answers: [],
    evaluation: {} as any,
    sessionState: {} as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  await insertCompetencyScore({
    id: generateUUID(),
    sessionId: sessionA,
    userId: userA,
    competency: "technical",
    score: 88,
    confidence: 0.9,
    evidence: "Architected event-driven microservices with Kafka and Go.",
    positiveSignals: ["Kafka", "Event-driven"],
    negativeSignals: [],
    missingEvidence: [],
    recommendedFollowUp: "Explore circuit breakers",
    createdAt: new Date().toISOString()
  });

  const userAScores = await findCompetencyScoresBySessionId(sessionA, userA);
  assert(userAScores.length === 1, `User A retrieved exactly 1 competency record`);
  assert(userAScores[0].score === 88, `User A retrieved correct score: ${userAScores[0].score}`);

  // Cross-tenant probe: User B querying session A must return 0 records
  const userBScores = await findCompetencyScoresBySessionId(sessionA, userB);
  assert(userBScores.length === 0, `Tenant isolation verified: User B cannot access User A's competency scores (returned ${userBScores.length} records)`);


  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  await closePostgresPool();

  if (failed > 0) {
    process.exit(1);
  }
}

runAdaptiveEvidenceTests().catch(err => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
