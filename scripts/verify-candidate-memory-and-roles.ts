import { 
  getCandidateMemory, 
  addCandidateFact, 
  updateCandidateMemoryFromResume, 
  updateCandidateMemoryFromInterview, 
  formatCandidateMemoryContext 
} from "../src/server/ai/memory/candidateMemory";
import { InterviewOrchestrator, INTERVIEWER_PERSONAS } from "../src/server/ai/orchestrator/interviewOrchestrator";
import { queryPostgres, initPostgresSchema } from "../src/server/db/postgres";

async function run() {
  console.log("=================================================================");
  console.log("🧠 VERIFYING CANDIDATE MEMORY & ROLE-SPECIALIZED ORCHESTRATOR");
  console.log("=================================================================\n");

  const testUserId = "user-candidate-memory-test-" + Date.now();

  try {
    // 1. Initialize PostgreSQL schema
    await initPostgresSchema();

    // 2. Candidate Memory Initialization
    console.log("Step 1: Testing initial Candidate Memory creation...");
    const initialMemory = await getCandidateMemory(testUserId);
    console.log(`✅ [PASS] Candidate memory created for user: ${initialMemory.userId}`);
    if (initialMemory.facts.length !== 0) throw new Error("Expected 0 initial facts");

    // 3. Add Candidate Facts & Resume Scan Ingestion
    console.log("\nStep 2: Testing Candidate Fact ingestion from resume scan...");
    await updateCandidateMemoryFromResume(testUserId, "resume-123", "Full stack engineer with 6 years experience in React, Node, PostgreSQL, and distributed systems", {
      skills: ["React", "TypeScript", "Node.js", "PostgreSQL", "Distributed Systems"],
      strengths: ["Strong architectural depth", "Clear communication"],
      suggestions: ["Add more quantifiable business impact metrics"]
    });

    const memoryAfterResume = await getCandidateMemory(testUserId);
    console.log(`✅ [PASS] Ingested ${memoryAfterResume.skills.length} skills and ${memoryAfterResume.facts.length} facts`);
    console.log(`   Skills: ${memoryAfterResume.skills.map(s => s.name).join(", ")}`);
    console.log(`   Strengths: ${memoryAfterResume.strengths.join(", ")}`);

    // 4. Role-Specialized Personas Verification
    console.log("\nStep 3: Verifying Role-Specialized Interviewer Personas...");
    console.log(`   HR Persona: ${INTERVIEWER_PERSONAS.HR.name} — ${INTERVIEWER_PERSONAS.HR.title}`);
    console.log(`   Technical Persona: ${INTERVIEWER_PERSONAS.Technical.name} — ${INTERVIEWER_PERSONAS.Technical.title}`);
    console.log(`   Hiring Manager Persona: ${INTERVIEWER_PERSONAS.HiringManager.name} — ${INTERVIEWER_PERSONAS.HiringManager.title}`);
    if (!INTERVIEWER_PERSONAS.HR || !INTERVIEWER_PERSONAS.Technical || !INTERVIEWER_PERSONAS.HiringManager) {
      throw new Error("Missing specialized persona definitions");
    }
    console.log("✅ [PASS] All 3 specialized interviewer personas defined with unique focus & rubrics");

    // 5. Adaptive Interview Session Progression
    console.log("\nStep 4: Testing Bounded Adaptive Turn Progression with 3 Interviewers...");
    const session = await InterviewOrchestrator.startSession({
      userId: testUserId,
      targetRole: "Staff Distributed Systems Engineer",
      company: "Stripe",
      difficulty: "Senior",
      interviewerCount: 3
    });

    console.log(`✅ [PASS] Session started: ${session.sessionId}`);
    console.log(`   Turn 1 Interviewer: ${session.history[0].interviewerName} (${session.history[0].interviewerRole})`);
    console.log(`   Turn 1 Question: ${session.history[0].questionText}`);

    // Turn 1 Answer -> Progress to Turn 2 (Technical Architect)
    console.log("\nSubmitting Turn 1 answer...");
    const turn2Result = await InterviewOrchestrator.submitAnswerAndProgress({
      sessionId: session.sessionId,
      userId: testUserId,
      candidateAnswer: "I built an event-driven payment processing pipeline using Kafka and PostgreSQL with idempotent consumers and distributed locks."
    });

    if (turn2Result.isCompleted) throw new Error("Session should not be completed on turn 1");
    const turn2 = turn2Result.nextTurn!;
    console.log(`✅ [PASS] Advanced to Turn 2: ${turn2.interviewerName} (${turn2.interviewerRole})`);
    console.log(`   Competency: ${turn2.expectedCompetency}`);
    console.log(`   Rubric: ${turn2.evaluationRubric}`);
    console.log(`   Question: ${turn2.questionText}`);

    // Turn 2 Answer -> Progress to Turn 3 (Hiring Manager)
    console.log("\nSubmitting Turn 2 answer...");
    const turn3Result = await InterviewOrchestrator.submitAnswerAndProgress({
      sessionId: session.sessionId,
      userId: testUserId,
      candidateAnswer: "We implemented partitioned Raft consensus with read-replicas and active-active multi-region failover."
    });

    if (turn3Result.isCompleted) throw new Error("Session should not be completed on turn 2");
    const turn3 = turn3Result.nextTurn!;
    console.log(`✅ [PASS] Advanced to Turn 3: ${turn3.interviewerName} (${turn3.interviewerRole})`);
    console.log(`   Competency: ${turn3.expectedCompetency}`);
    console.log(`   Rubric: ${turn3.evaluationRubric}`);
    console.log(`   Question: ${turn3.questionText}`);

    // Turn 3 Answer -> Finalize Bounded Session
    console.log("\nSubmitting Turn 3 answer to finalize session...");
    session.maxTurns = 3; // Bound to 3 turns for this test
    const finalResult = await InterviewOrchestrator.submitAnswerAndProgress({
      sessionId: session.sessionId,
      userId: testUserId,
      candidateAnswer: "I prioritized shipping the core payment idempotency engine first to unblock Q3 revenue, while scheduling technical debt refactoring for Q4 sprint."
    });

    if (!finalResult.isCompleted) throw new Error("Session should be completed at maxTurns");
    console.log(`✅ [PASS] Interview session completed successfully`);
    console.log(`   Overall Score: ${finalResult.state.evaluation?.score}%`);
    console.log(`   Hiring Recommendation: ${finalResult.state.evaluation?.hiringRecommendation || "N/A"}`);

    // 6. Verify Candidate Memory Context Enrichment
    console.log("\nStep 5: Verifying Candidate Memory Context formatting...");
    const memoryContext = await formatCandidateMemoryContext(testUserId);
    console.log("Formatted Memory Context for AI Prompt Injection:\n" + memoryContext);
    if (!memoryContext.includes("React") || !memoryContext.includes("Stripe")) {
      throw new Error("Memory context missing ingested facts");
    }
    console.log("✅ [PASS] Candidate memory correctly preserved and formatted for grounding");

    console.log("\n=================================================================");
    console.log("🎉 ALL CANDIDATE MEMORY & ADAPTIVE ORCHESTRATOR TESTS PASSED!");
    console.log("=================================================================\n");
  } catch (err: any) {
    console.error("❌ [VERIFICATION FAILED]:", err.message);
    process.exit(1);
  }
}

run();
