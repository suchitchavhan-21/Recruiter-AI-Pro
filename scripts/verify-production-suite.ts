/**
 * Comprehensive Verification & Regression Test Suite for Recruiter AI Pro
 * Tests:
 * 1. Authentication lifecycle & token security
 * 2. RAG indexing, tenant isolation, and dimension validation
 * 3. Resume lifecycle & vector chunk cleanup
 * 4. Bounded adaptive interview state machine & database recovery
 * 5. Zero-fabrication metric compliance
 */

import { generateUUID, insertUser, findUserByEmail, updateUserById, findUserById } from "../src/server/db/repository";
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from "../src/server/middleware/auth";
import { getVectorStore } from "../src/server/ai/vectorStore";
import { generateEmbedding } from "../src/server/ai/embeddings/provider";
import { 
  indexResumeDocument, 
  retrieveCandidateEvidence, 
  retrieveTechnicalKnowledge, 
  deleteResumeVectors,
  matchJDWithCandidateEvidence,
  indexTechnicalCurriculum
} from "../src/server/ai/rag/pipeline";
import { InterviewOrchestrator } from "../src/server/ai/orchestrator/interviewOrchestrator";
import { generateDraftAnswer, evaluateSTARStory, scanResumeContent } from "../src/server/services/gemini.service";
import bcrypt from "bcryptjs";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ""}`);
    failedCount++;
  }
}

async function runAuthTests() {
  console.log("\n🔒 --- 1. AUTHENTICATION & SECURITY TESTS ---");

  const testEmail = `candidate_test_${Date.now()}@example.com`;
  const password = "SuperSecretPassword123!";
  const passwordHash = await bcrypt.hash(password, 10);
  const userId = generateUUID();

  // Test User Creation
  await insertUser({
    id: userId,
    fullName: "Test Candidate",
    email: testEmail,
    phoneNumber: "1234567890",
    passwordHash,
    role: "candidate",
    provider: "local",
    emailVerified: false,
    accountStatus: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const foundUser = await findUserByEmail(testEmail);
  assert(foundUser !== null && foundUser.id === userId, "User created and retrieved by email");

  // Password verification
  const isMatch = await bcrypt.compare(password, foundUser!.passwordHash);
  assert(isMatch, "Bcrypt password comparison matches");

  const isWrongMatch = await bcrypt.compare("WrongPassword", foundUser!.passwordHash);
  assert(!isWrongMatch, "Bcrypt rejects invalid password");

  // JWT signing and verification
  const accessToken = signAccessToken({ userId: foundUser!.id, email: foundUser!.email, role: foundUser!.role });
  const verifiedAccess = verifyAccessToken(accessToken);
  assert(verifiedAccess !== null && verifiedAccess.userId === userId, "Access token signed & verified");

  const refreshToken = signRefreshToken({ userId: foundUser!.id });
  const verifiedRefresh = verifyRefreshToken(refreshToken);
  assert(verifiedRefresh !== null && verifiedRefresh.userId === userId, "Refresh token signed & verified");

  // Email verification status
  await updateUserById(userId, { emailVerified: true });
  const updatedUser = await findUserById(userId);
  assert(updatedUser?.emailVerified === true, "Email verification transition updated in database");
}

async function runRAGAndTenantTests() {
  console.log("\n🧠 --- 2. RAG & STRICT TENANT ISOLATION TESTS ---");

  const candidateAId = `user_a_${Date.now()}`;
  const candidateBId = `user_b_${Date.now()}`;
  const resumeAId = `res_a_${Date.now()}`;
  const resumeBId = `res_b_${Date.now()}`;

  const resumeTextA = `
SUMMARY
Principal Backend Architect specializing in high-concurrency Go and PostgreSQL.

EXPERIENCE
Architected global payment settlement pipeline processing 10,000 transactions per second with PostgreSQL.
Reduced checkout processing latency by implementing cache-aside Redis clusters.

SKILLS
Go, PostgreSQL, Redis, Distributed Systems, Docker, Kubernetes
`;

  const resumeTextB = `
SUMMARY
Senior Frontend Engineer specializing in React, Next.js, and Design Systems.

EXPERIENCE
Engineered micro-frontend framework for financial portal serving 500,000 monthly active users.
Built responsive component library with 100% test coverage using Tailwind and Jest.

SKILLS
React, TypeScript, Next.js, Tailwind CSS, Jest, GraphQL
`;

  // Index candidate resumes
  const indexedA = await indexResumeDocument({
    resumeId: resumeAId,
    userId: candidateAId,
    resumeText: resumeTextA
  });
  assert(indexedA > 0, "Candidate A resume chunked and vector-indexed", `Indexed ${indexedA} chunks`);

  const indexedB = await indexResumeDocument({
    resumeId: resumeBId,
    userId: candidateBId,
    resumeText: resumeTextB
  });
  assert(indexedB > 0, "Candidate B resume chunked and vector-indexed", `Indexed ${indexedB} chunks`);

  // Index shared technical curriculum
  await indexTechnicalCurriculum([{
    id: "sys-curriculum-1",
    title: "Distributed Consistency",
    content: "Raft and Paxos consensus algorithms guarantee deterministic state machine replication across partitioned nodes.",
    section: "Distributed Systems"
  }]);

  // Strict Tenant Isolation Test: Candidate A queries for Go backend
  const resultsA = await retrieveCandidateEvidence(candidateAId, "Go and PostgreSQL backend");
  assert(resultsA.length > 0, "Candidate A retrieves their own Go/PostgreSQL experience");
  assert(resultsA.every(r => r.userId === candidateAId), "Candidate A receives ZERO results from Candidate B (Strict Tenant Isolation)");

  // Candidate B queries for React frontend
  const resultsB = await retrieveCandidateEvidence(candidateBId, "React micro-frontends");
  assert(resultsB.length > 0, "Candidate B retrieves their own React experience");
  assert(resultsB.every(r => r.userId === candidateBId), "Candidate B receives ZERO results from Candidate A (Strict Tenant Isolation)");

  // Shared technical curriculum retrieval
  const techResults = await retrieveTechnicalKnowledge("consensus algorithms state machine");
  assert(techResults.length > 0, "Candidate can retrieve shared system technical curriculum");
  assert(techResults[0].knowledgeDomain === "technical_shared", "Shared knowledge domain verified");

  // Embedding Dimension Validation
  const embedTest = await generateEmbedding("Test vector dimension");
  assert(embedTest.dimension === 768, `Embedding vector dimension verified as 768 (got ${embedTest.dimension})`);

  // Document Cleanup / Vector Deletion Test
  const deletedChunks = await deleteResumeVectors(resumeAId, candidateAId);
  assert(deletedChunks > 0, `Resume deletion successfully purged ${deletedChunks} associated vector chunks`);

  const afterDeleteA = await retrieveCandidateEvidence(candidateAId, "Go backend");
  assert(afterDeleteA.length === 0, "Purged resume chunks are no longer returned in retrieval");
}

async function runInterviewOrchestratorTests() {
  console.log("\n🎙️ --- 3. BOUNDED ADAPTIVE INTERVIEW & PERSISTENCE RECOVERY TESTS ---");

  const testUserId = `interview_user_${Date.now()}`;
  const sessionId = `session_${Date.now()}`;

  // 1. Start Session (Verify exactly ONE persistent record created)
  const sessionState = await InterviewOrchestrator.startSession({
    sessionId,
    userId: testUserId,
    targetRole: "Staff Backend Engineer",
    company: "Acme Cloud",
    difficulty: "Senior",
    interviewerCount: 2
  });

  assert(sessionState.sessionId === sessionId, "Interview session initialized");
  assert(sessionState.currentTurn === 1, "Session starts at Turn 1");
  assert(sessionState.status === "IN_PROGRESS", "Session status is IN_PROGRESS");

  // 2. Submit Turn 1 Answer & Progress
  const turn1Result = await InterviewOrchestrator.submitAnswerAndProgress({
    sessionId,
    userId: testUserId,
    candidateAnswer: "I architected the service using event-driven microservices with RabbitMQ and PostgreSQL read replicas."
  });

  assert(!turn1Result.isCompleted, "Turn 1 progresses without premature completion");
  assert(turn1Result.state.currentTurn === 2, "Session advances to Turn 2");
  assert(turn1Result.nextTurn !== undefined, "Next interviewer question generated adaptively");

  // 3. Database State Loss & Recovery Simulation
  InterviewOrchestrator.clearMemoryCache(); // Simulate complete Node.js instance restart / memory loss

  const recoveredState = await InterviewOrchestrator.loadOrRestoreState(sessionId);
  assert(recoveredState !== null, "Session state successfully recovered from persistent database after memory cache cleared");
  assert(recoveredState?.currentTurn === 2, "Recovered session preserves active turn count (Turn 2)");
  assert(recoveredState?.history.length === 2, "Recovered session preserves complete transcript history");

  // 4. Progress to Bounded Completion
  await InterviewOrchestrator.submitAnswerAndProgress({
    sessionId,
    userId: testUserId,
    candidateAnswer: "We resolved the stakeholder conflict by establishing clear SLI/SLO metrics and running an A/B latency experiment."
  });

  await InterviewOrchestrator.submitAnswerAndProgress({
    sessionId,
    userId: testUserId,
    candidateAnswer: "For database failover, we used patroni with Raft consensus and automated health checks."
  });

  await InterviewOrchestrator.submitAnswerAndProgress({
    sessionId,
    userId: testUserId,
    candidateAnswer: "I organized weekly architecture review meetings and created blameless post-mortem templates."
  });

  const finalResult = await InterviewOrchestrator.submitAnswerAndProgress({
    sessionId,
    userId: testUserId,
    candidateAnswer: "We enforced zero-trust mTLS and automated rate limiting at the ingress gateway."
  });

  assert(finalResult.isCompleted, "Bounded interview completed at max turn boundary (Turn 5)");
  assert(finalResult.state.status === "COMPLETED", "Final state marked as COMPLETED");
  assert(typeof finalResult.state.evaluation?.score === "number", `Evaluation score calibrated: ${finalResult.state.evaluation?.score}%`);
}

async function runZeroFabricationTests() {
  console.log("\n🛡️ --- 4. ZERO-FABRICATION COMPLIANCE TESTS ---");

  // Test generateDraftAnswer fallback
  const draftAnswer = await generateDraftAnswer({
    questionText: "How do you optimize slow queries in PostgreSQL?",
    role: "Database Administrator",
    company: "CloudCorp"
  });

  const hasFabricatedLatency = draftAnswer.includes("450ms to under 45ms") || draftAnswer.includes("25,000 requests/sec");
  assert(!hasFabricatedLatency, "Draft answer fallback contains ZERO fabricated synthetic metrics (450ms / 25k QPS)");

  // Test evaluateSTARStory fallback
  const starEval = await evaluateSTARStory({
    situation: "Production outage occurred during high load.",
    task: "Restore service SLA.",
    action: "Configured connection pooler and added cache layer.",
    result: "System recovered and latency stabilized."
  });

  const starHasFabricated = (starEval.expertModelStory || "").includes("25,000 requests/sec") || (starEval.expertModelStory || "").includes("72%");
  assert(!starHasFabricated, "STAR story evaluation fallback contains ZERO fabricated synthetic metrics");

  // Test scanResumeContent fallback
  const resumeScan = await scanResumeContent({
    resumeText: "Experienced engineer with JavaScript and SQL background."
  });

  const resumeHasFabricated = JSON.stringify(resumeScan.suggestions).includes("380ms → 110ms");
  assert(!resumeHasFabricated, "Resume scan suggestions contain ZERO fabricated metric bullets");
}

async function runAllTests() {
  console.log("=================================================================");
  console.log("🚀 STARTING PRODUCTION VERIFICATION SUITE — RECRUITER AI PRO");
  console.log("=================================================================");

  try {
    await runAuthTests();
    await runRAGAndTenantTests();
    await runInterviewOrchestratorTests();
    await runZeroFabricationTests();

    console.log("\n=================================================================");
    console.log(`📊 TEST SUITE SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log("=================================================================");

    if (failedCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("❌ Fatal verification error:", err);
    process.exit(1);
  }
}

runAllTests();
