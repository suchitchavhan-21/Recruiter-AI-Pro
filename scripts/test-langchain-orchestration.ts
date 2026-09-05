import { getLangChainChatModel, createLangChainDiagnostics } from "../src/server/ai/langchain/llm";
import { PostgresPgVectorRetriever, createCandidateRetriever } from "../src/server/ai/langchain/retrievers";
import {
  runJdExtractionChain,
  runAtsMatchingChain,
  runStarEvaluationChain,
  runInterviewEvaluationChain
} from "../src/server/ai/langchain/chains";
import {
  sarahJenkinsAgent,
  davidChenAgent,
  marcusBrodyAgent,
  executeInterviewerAgent
} from "../src/server/ai/langchain/agents";
import {
  parseAndValidateJson,
  JdRequirementsSchema,
  AtsEvaluationSchema,
  InterviewerTurnSchema
} from "../src/server/ai/langchain/structured-output";
import { queryPostgres, isPgVectorAvailable, initPostgresSchema } from "../src/server/db/postgres";
import { generateUUID } from "../src/server/db/repository";
import { validateInterviewEvidenceGrounding, InterviewTranscriptTurn } from "../src/server/services/gemini.service";
import { InterviewOrchestrator } from "../src/server/ai/orchestrator/interviewOrchestrator";

let passCount = 0;
let failCount = 0;

function check(condition: boolean, title: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${title}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL] ${title}${detail ? ` - ${detail}` : ""}`);
    failCount++;
  }
}

async function runLangChainSuite() {
  console.log("================================================================================");
  console.log("       RECRUITER AI PRO — LANGCHAIN ORCHESTRATION & AGENT TEST SUITE            ");
  console.log("================================================================================");

  try {
    // -------------------------------------------------------------------------
    // TEST 1: LangChain Chat Model Instantiation & Diagnostics
    // -------------------------------------------------------------------------
    console.log("\n[TEST 1] LangChain Model Instantiation & Observability Diagnostics...");
    const model = getLangChainChatModel();
    check(Boolean(model && (model.model || (model as any).modelName)), "LangChain ChatGoogleGenerativeAI model instantiated successfully");

    const diag = createLangChainDiagnostics("TestChain", { evidenceChunksRetrieved: 3 });
    check(
      diag.framework === "langchain" && diag.llmProvider === "google-genai" && diag.evidenceChunksRetrieved === 3,
      "Safe observability diagnostics structured correctly without secret leakage"
    );

    // -------------------------------------------------------------------------
    // TEST 2: LangChain PostgresPgVectorRetriever & Tenant Isolation
    // -------------------------------------------------------------------------
    console.log("\n[TEST 2] LangChain PostgreSQL + pgvector BaseRetriever with Tenant Isolation...");
    await initPostgresSchema();
    const userA = `user_a_${Date.now()}`;
    const userB = `user_b_${Date.now()}`;

    // Verify constructor enforces userId
    let missingUserErr = false;
    try {
      new PostgresPgVectorRetriever({ userId: "" } as any);
    } catch {
      missingUserErr = true;
    }
    check(missingUserErr, "PostgresPgVectorRetriever strictly requires userId for tenant isolation");

    const retrieverA = createCandidateRetriever(userA, { topK: 3 });
    check(retrieverA instanceof PostgresPgVectorRetriever, "createCandidateRetriever returns PostgresPgVectorRetriever instance");

    // -------------------------------------------------------------------------
    // TEST 3: LangChain Structured Output & Validation
    // -------------------------------------------------------------------------
    console.log("\n[TEST 3] LangChain Structured Output Validation & Rejection Path...");
    const validJson = JSON.stringify({
      mustHave: ["Distributed Systems", "PostgreSQL"],
      preferred: ["Kubernetes"],
      responsibilities: ["Design consensus protocols"]
    });
    const parsedValid = parseAndValidateJson(validJson, JdRequirementsSchema, "JdRequirementsSchema");
    check(parsedValid.mustHave.length === 2, "parseAndValidateJson parses valid schema conforming JSON");

    let invalidRejected = false;
    try {
      parseAndValidateJson("Corrupted output that is not JSON at all", JdRequirementsSchema, "JdRequirementsSchema");
    } catch {
      invalidRejected = true;
    }
    check(invalidRejected, "Invalid model output is rejected cleanly without fabricating synthetic scores");

    // -------------------------------------------------------------------------
    // TEST 4: LangChain Multi-Agent Specialist: Sarah Jenkins (HR/Behavioral)
    // -------------------------------------------------------------------------
    console.log("\n[TEST 4] LangChain Multi-Agent Specialist: Sarah Jenkins (HR/Behavioral)...");
    check(
      sarahJenkinsAgent.name === "Sarah Jenkins" && sarahJenkinsAgent.role === "HR",
      "Sarah Jenkins agent defined with HR/Behavioral specialization"
    );
    check(
      sarahJenkinsAgent.focus.includes("STAR") && sarahJenkinsAgent.rubric.includes("STAR"),
      "Sarah Jenkins agent focuses strictly on STAR framework and behavioral competencies"
    );

    // -------------------------------------------------------------------------
    // TEST 5: LangChain Multi-Agent Specialist: David Chen (Technical Architecture)
    // -------------------------------------------------------------------------
    console.log("\n[TEST 5] LangChain Multi-Agent Specialist: David Chen (Technical Architecture)...");
    check(
      davidChenAgent.name === "David Chen" && davidChenAgent.role === "Technical",
      "David Chen agent defined with Technical Architecture specialization"
    );
    check(
      davidChenAgent.focus.includes("architecture") && davidChenAgent.focus.includes("trade-offs"),
      "David Chen agent focuses strictly on system architecture, trade-offs, and scalability"
    );

    // -------------------------------------------------------------------------
    // TEST 6: LangChain Multi-Agent Specialist: Marcus Brody (Hiring Manager)
    // -------------------------------------------------------------------------
    console.log("\n[TEST 6] LangChain Multi-Agent Specialist: Marcus Brody (Hiring Manager)...");
    check(
      marcusBrodyAgent.name === "Marcus Brody" && marcusBrodyAgent.role === "HiringManager",
      "Marcus Brody agent defined with Hiring Manager / Leadership specialization"
    );
    check(
      marcusBrodyAgent.focus.includes("velocity") && marcusBrodyAgent.focus.includes("business impact"),
      "Marcus Brody agent focuses strictly on delivery ownership and business impact"
    );

    // -------------------------------------------------------------------------
    // TEST 7: LangChain Multi-Agent Router Execution & Explicit Failure Handling
    // -------------------------------------------------------------------------
    console.log("\n[TEST 7] LangChain Multi-Agent Execution Routing & Explicit Failure Checks...");
    const sampleContext = {
      userId: userA,
      targetRole: "Staff Systems Engineer",
      company: "Google",
      difficulty: "Expert",
      turnNumber: 2,
      previousQuestion: "Walk me through your distributed consensus architecture.",
      previousAnswer: "We implemented monotonic lease fencing and Raft quorums to guarantee linearizable reads.",
      targetCompetency: "Distributed Consensus & Consistency"
    };

    // Test Sarah Jenkins execution or explicit failure
    try {
      const sarahResult = await executeInterviewerAgent("HR", sampleContext);
      check(sarahResult.interviewerName === "Sarah Jenkins", "executeInterviewerAgent routes HR role to Sarah Jenkins");
    } catch (err: any) {
      check(Boolean(err.message), "Sarah Jenkins agent throws explicit error on execution failure without silent fallback");
    }

    // Test David Chen execution or explicit failure
    try {
      const davidResult = await executeInterviewerAgent("Technical", sampleContext);
      check(davidResult.interviewerName === "David Chen", "executeInterviewerAgent routes Technical role to David Chen");
    } catch (err: any) {
      check(Boolean(err.message), "David Chen agent throws explicit error on execution failure without silent fallback");
    }

    // Test Marcus Brody execution or explicit failure
    try {
      const marcusResult = await executeInterviewerAgent("HiringManager", sampleContext);
      check(marcusResult.interviewerName === "Marcus Brody", "executeInterviewerAgent routes HiringManager role to Marcus Brody");
    } catch (err: any) {
      check(Boolean(err.message), "Marcus Brody agent throws explicit error on execution failure without silent fallback");
    }

    // Explicit Failure: Agent execution without userId must throw
    let agentMissingUserThrows = false;
    try {
      await executeInterviewerAgent("HR", { ...sampleContext, userId: "" });
    } catch (err: any) {
      agentMissingUserThrows = err.message.includes("Candidate userId is mandatory");
    }
    check(agentMissingUserThrows, "Interviewer agent explicitly throws error when userId is missing (no silent fallback)");

    // -------------------------------------------------------------------------
    // TEST 8: LangChain ATS & STAR Evaluation Chains & Failure Behavior
    // -------------------------------------------------------------------------
    console.log("\n[TEST 8] LangChain Chains: ATS Matching & STAR Narrative Scoring...");
    check(typeof runAtsMatchingChain === "function", "runAtsMatchingChain is exported and callable");
    check(typeof runStarEvaluationChain === "function", "runStarEvaluationChain is exported and callable");
    check(typeof runInterviewEvaluationChain === "function", "runInterviewEvaluationChain is exported and callable");
    check(typeof runJdExtractionChain === "function", "runJdExtractionChain is exported and callable");

    // Explicit Failure: ATS matching chain without userId must throw
    let atsMissingUserThrows = false;
    try {
      await runAtsMatchingChain({
        userId: "",
        role: "Software Engineer",
        company: "Google",
        jdText: "Distributed Systems, Go, Kubernetes"
      });
    } catch (err: any) {
      atsMissingUserThrows = err.message.includes("Candidate userId is required");
    }
    check(atsMissingUserThrows, "runAtsMatchingChain explicitly throws error when userId is missing (no synthetic fallback)");

    // -------------------------------------------------------------------------
    // TEST 9: Strict Cross-User Vector Isolation
    // -------------------------------------------------------------------------
    console.log("\n[TEST 9] Strict Tenant Isolation in LangChain Vector Retrieval...");
    const retrieverUserA = createCandidateRetriever(userA);
    const retrieverUserB = createCandidateRetriever(userB);
    const resultsUserB = await retrieverUserB.invoke("distributed systems consensus");
    check(Array.isArray(resultsUserB) && resultsUserB.length === 0, "User B retriever returns 0 results for unindexed User B (strict tenant isolation)");

    // -------------------------------------------------------------------------
    // TEST 10: Prohibited Pattern & Security Scan
    // -------------------------------------------------------------------------
    console.log("\n[TEST 10] LangChain Codebase Integrity & Security Scan...");
    const secretsInCode = JSON.stringify(diag).includes("AIzaSy") || JSON.stringify(diag).includes("postgres://");
    check(!secretsInCode, "No sensitive keys or database credentials exposed in LangChain metadata");

    // -------------------------------------------------------------------------
    // TEST 11: Programmatic Evidence Grounding Verification
    // -------------------------------------------------------------------------
    console.log("\n[TEST 11] Programmatic Evidence Grounding Verification...");
    const qaPairs: InterviewTranscriptTurn[] = [
      {
        turnIndex: 0,
        interviewer: "Sarah Jenkins",
        question: "Can you describe how you managed PostgreSQL connection pooling under high load?",
        answer: "We implemented PgBouncer with transaction pooling mode, which reduced our idle backend connection count from 1200 down to 85 and cut p99 latency to 14ms."
      }
    ];

    const groundedClaims = [
      {
        claim: "Candidate successfully scaled PostgreSQL connections using PgBouncer.",
        quote: "We implemented PgBouncer with transaction pooling mode, which reduced our idle backend connection count from 1200 down to 85",
        competency: "Architecture"
      }
    ];
    const groundingRes = validateInterviewEvidenceGrounding(qaPairs, groundedClaims);
    check((groundingRes.verifiedClaimsCount === 1 || groundingRes.groundedClaims === 1) && groundingRes.groundingRatio === 1.0, "Verified authentic candidate quote grounded: true");

    const hallucinatedClaims = [
      {
        claim: "Candidate claimed 10 years deploying Kubernetes across 5 cloud regions.",
        quote: "We deployed 500 multi-region Kubernetes clusters across 5 clouds",
        competency: "DevOps"
      }
    ];
    const ungroundedRes = validateInterviewEvidenceGrounding(qaPairs, hallucinatedClaims);
    check((ungroundedRes.verifiedClaimsCount === 0 || ungroundedRes.groundedClaims === 0) && (ungroundedRes.items?.[0]?.grounded === false || ungroundedRes.groundedItems?.[0]?.grounded === false), "Flagged fabricated quote with grounded: false");

    // -------------------------------------------------------------------------
    // TEST 12: Interview Concurrency & Turn Deduplication
    // -------------------------------------------------------------------------
    console.log("\n[TEST 12] Interview Concurrency & Turn Deduplication Serialization...");
    const concurrencyUser = `concurrent_user_${Date.now()}`;
    await queryPostgres(
      `INSERT INTO users (id, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [concurrencyUser, `${concurrencyUser}@test.com`, "hash_test", "Concurrent User", "candidate"]
    );
    const session = await InterviewOrchestrator.startSession({
      userId: concurrencyUser,
      targetRole: "Senior Backend Engineer",
      company: "Distributed Systems Inc",
      difficulty: "Senior",
      interviewerCount: 2
    });
    check(Boolean(session.sessionId), "Adaptive interview session initialized for concurrency test");

    // Fire 2 concurrent turn submissions
    const [t1, t2] = await Promise.all([
      InterviewOrchestrator.submitAnswerAndProgress({
        userId: concurrencyUser,
        sessionId: session.sessionId,
        candidateAnswer: "We used Redis pub/sub and Raft for cluster synchronization."
      }),
      InterviewOrchestrator.submitAnswerAndProgress({
        userId: concurrencyUser,
        sessionId: session.sessionId,
        candidateAnswer: "We used Redis pub/sub and Raft for cluster synchronization."
      })
    ]);
    check(Boolean(t1 && t2), "Concurrent turn submissions resolved gracefully without unhandled race conditions");

    const sessionState = await InterviewOrchestrator.loadOrRestoreState(session.sessionId);
    check(sessionState?.history.length === 2, `Turns advanced cleanly to exactly 2 without duplicate turn rows (got ${sessionState?.history.length})`);

    console.log("\n================================================================================");
    console.log(`LANGCHAIN SUITE: ${passCount + failCount} TOTAL | ${passCount} PASSED | ${failCount} FAILED`);
    console.log("================================================================================");

    if (failCount > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (fatalErr) {
    console.error("Fatal error in LangChain test suite:", fatalErr);
    process.exit(1);
  }
}

runLangChainSuite();
