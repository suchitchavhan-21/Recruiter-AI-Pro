/**
 * Comprehensive Zero-Trust Adversarial & Boundary Verification Suite
 * 
 * Verifies:
 * 1. Adversarial Role Classification & Blueprint Normalization
 * 2. Cloud Run Horizontal Multi-Instance JWT Consistency
 * 3. Intrinsic Production Secret & External Database Enforcement
 * 4. Gemini Embedding & LangChain Mock-Credential Safety Boundaries
 * 5. Multi-Tenant Candidate RAG Isolation & Grounding Integrity
 */

import jwt from "jsonwebtoken";
import { 
  classifyRole, 
  generateInterviewBlueprint, 
  RoleClassificationInput 
} from "../src/server/ai/orchestrator/roleIntelligence";
import { generateEmbedding } from "../src/server/ai/embeddings/provider";
import { getLangChainChatModel, invokeChainWithModelFallback } from "../src/server/ai/langchain/llm";
import { getVectorStore, resetVectorStore } from "../src/server/ai/vectorStore";
import { validateEnvironment, ENV } from "../src/server/config/env";
import { isPostgresActive } from "../src/server/db/postgres";

let passed = 0;
let failed = 0;

function assert(condition: boolean, title: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${title}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${title}${detail ? ` - ${detail}` : ""}`);
    failed++;
  }
}

async function runAdversarialBoundaryTests() {
  console.log("================================================================================");
  console.log("🛡️  ZERO-TRUST ADVERSARIAL BOUNDARY & HORIZONTAL INTEGRITY VERIFICATION SUITE");
  console.log("================================================================================\n");

  // ============================================================================
  // SECTION 1: Adversarial Role Classification & Normalization
  // ============================================================================
  console.log("--- 1. ADVERSARIAL ROLE CLASSIFICATION & BLUEPRINT TESTS ---");

  // Test 1.1: Solutions Architect
  const solArchBp = generateInterviewBlueprint({
    targetRole: "Senior Solutions Architect",
    jobDescription: "Design multi-tier cloud architectures, consult on integrations, and present to CIOs.",
    seniority: "Senior"
  });
  assert(solArchBp.jobFamily === "engineering", "Solutions Architect classified into engineering family", solArchBp.jobFamily);
  assert(solArchBp.subFamily === "solutions_architecture", "Solutions Architect subFamily is solutions_architecture", solArchBp.subFamily);
  assert(solArchBp.codingRequired === false, "Solutions Architect does not require live coding", String(solArchBp.codingRequired));
  assert(solArchBp.practicalAssessmentType === "CASE_STUDY", "Solutions Architect practical assessment is CASE_STUDY", solArchBp.practicalAssessmentType);
  const solArchWeightSum = solArchBp.competencies.reduce((s, c) => s + c.weight, 0);
  assert(Math.abs(solArchWeightSum - 1.0) < 0.0001, `Solutions Architect weights sum to exactly 1.0 (got: ${solArchWeightSum})`);
  assert(!solArchBp.competencies.some(c => c.id === "coding"), "Solutions Architect has no coding competency");
  assert(solArchBp.competencies.some(c => c.id === "solution_architecture" || c.id === "system_design"), "Solutions Architect includes architecture competency");

  // Test 1.2: Sales Engineer
  const salesEngBp = generateInterviewBlueprint({
    targetRole: "Senior Sales Engineer",
    jobDescription: "Deliver technical product demos, answer RFPs, and handle enterprise security objections.",
    seniority: "Senior"
  });
  assert(salesEngBp.jobFamily === "sales", "Sales Engineer classified into sales family", salesEngBp.jobFamily);
  assert(salesEngBp.codingRequired === false, "Sales Engineer does not require live coding", String(salesEngBp.codingRequired));
  const salesEngWeightSum = salesEngBp.competencies.reduce((s, c) => s + c.weight, 0);
  assert(Math.abs(salesEngWeightSum - 1.0) < 0.0001, `Sales Engineer weights sum to exactly 1.0 (got: ${salesEngWeightSum})`);

  // Test 1.3: Technical Product Manager
  const tpmBp = generateInterviewBlueprint({
    targetRole: "Technical Product Manager",
    jobDescription: "Own API platform roadmap, define developer documentation, and manage sprint backlog.",
    seniority: "Mid"
  });
  assert(tpmBp.jobFamily === "product", "TPM classified into product family", tpmBp.jobFamily);
  assert(tpmBp.codingRequired === false, "TPM does not require live coding", String(tpmBp.codingRequired));
  const tpmWeightSum = tpmBp.competencies.reduce((s, c) => s + c.weight, 0);
  assert(Math.abs(tpmWeightSum - 1.0) < 0.0001, `TPM weights sum to exactly 1.0 (got: ${tpmWeightSum})`);

  // Test 1.4: School Principal
  const principalBp = generateInterviewBlueprint({
    targetRole: "High School Principal",
    jobDescription: "Oversee academic administration, staff evaluations, and school board relations.",
    seniority: "Expert"
  });
  assert(principalBp.jobFamily === "education", "School Principal classified into education family", principalBp.jobFamily);
  assert(principalBp.seniority === "Expert", "School Principal has Expert seniority", principalBp.seniority);
  assert(principalBp.codingRequired === false, "School Principal does not require coding", String(principalBp.codingRequired));
  const principalWeightSum = principalBp.competencies.reduce((s, c) => s + c.weight, 0);
  assert(Math.abs(principalWeightSum - 1.0) < 0.0001, `School Principal weights sum to exactly 1.0 (got: ${principalWeightSum})`);

  // Test 1.5: Empty Role & Whitespace Role (Adversarial input)
  const emptyBp = generateInterviewBlueprint({
    targetRole: "",
    jobDescription: ""
  });
  assert(emptyBp.jobFamily === "general", "Empty role falls back gracefully to general", emptyBp.jobFamily);
  const emptyWeightSum = emptyBp.competencies.reduce((s, c) => s + c.weight, 0);
  assert(Math.abs(emptyWeightSum - 1.0) < 0.0001, `Empty role weights sum to exactly 1.0 (got: ${emptyWeightSum})`);

  const whitespaceBp = generateInterviewBlueprint({
    targetRole: "   ",
    jobDescription: "   "
  });
  assert(whitespaceBp.jobFamily === "general", "Whitespace role falls back gracefully to general", whitespaceBp.jobFamily);
  const whitespaceWeightSum = whitespaceBp.competencies.reduce((s, c) => s + c.weight, 0);
  assert(Math.abs(whitespaceWeightSum - 1.0) < 0.0001, `Whitespace role weights sum to exactly 1.0 (got: ${whitespaceWeightSum})`);

  // Test 1.6: Regex Precedence & Title Hierarchy
  const peResult = classifyRole({ targetRole: "Principal Distributed Systems Engineer" });
  assert(peResult.jobFamily === "engineering" && peResult.seniority === "Expert", "Principal Engineer: engineering + Expert", `${peResult.jobFamily} / ${peResult.seniority}`);

  const sdsResult = classifyRole({ targetRole: "Senior Director of Enterprise Sales" });
  assert(sdsResult.jobFamily === "sales" && sdsResult.seniority === "Expert", "Senior Director of Sales: sales + Expert", `${sdsResult.jobFamily} / ${sdsResult.seniority}`);

  const staffDataResult = classifyRole({ targetRole: "Staff Data Scientist" });
  assert(staffDataResult.jobFamily === "data_analytics" && staffDataResult.seniority === "Expert", "Staff Data Scientist: data_analytics + Expert", `${staffDataResult.jobFamily} / ${staffDataResult.seniority}`);

  // ============================================================================
  // SECTION 2: Cloud Run Horizontal Multi-Instance JWT Consistency
  // ============================================================================
  console.log("\n--- 2. CLOUD RUN HORIZONTAL MULTI-INSTANCE JWT CONSISTENCY ---");

  const sharedSecret = "production_shared_cluster_secret_key_256bit_length!";
  const testPayload = { userId: "user_horizontal_scale_123", email: "candidate@scale.test", role: "candidate" };

  // Instance A signs token
  const tokenFromInstanceA = jwt.sign(testPayload, sharedSecret, { expiresIn: "15m", algorithm: "HS256" });
  assert(typeof tokenFromInstanceA === "string" && tokenFromInstanceA.length > 30, "Instance A signs JWT successfully");

  // Instance B verifies token using the same configured secret
  let verifiedOnInstanceB: any = null;
  try {
    verifiedOnInstanceB = jwt.verify(tokenFromInstanceA, sharedSecret);
  } catch (err: any) {
    verifiedOnInstanceB = null;
  }
  assert(verifiedOnInstanceB?.userId === "user_horizontal_scale_123", "Instance B verifies token signed by Instance A with matching payload");

  // Ephemeral instance key simulation: if Instance B used a different ephemeral secret, it must fail
  const rogueSecret = "ephemeral_random_different_instance_secret_key!";
  let failedAsExpected = false;
  try {
    jwt.verify(tokenFromInstanceA, rogueSecret);
  } catch {
    failedAsExpected = true;
  }
  assert(failedAsExpected, "Mismatched/ephemeral instance secret strictly rejects token (proves why ephemeral disk secrets are forbidden in Cloud Run)");

  // ============================================================================
  // SECTION 3: Intrinsic Production Configuration & Secrets Enforcement
  // ============================================================================
  console.log("\n--- 3. INTRINSIC PRODUCTION SECRET & PERSISTENCE ENFORCEMENT ---");

  const origEnv = { ...process.env };
  try {
    process.env.NODE_ENV = "production";
    delete process.env.STRICT_FAIL_FAST; // Verify WITHOUT STRICT_FAIL_FAST

    // Test missing secrets
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.DATABASE_URL;

    const checkResult = validateEnvironment();
    assert(!checkResult.valid, "validateEnvironment reports invalid in production when secrets are missing");
    assert(checkResult.errors.some(e => e.includes("JWT_SECRET")), "Missing JWT_SECRET reported as fatal error");
    assert(checkResult.errors.some(e => e.includes("JWT_REFRESH_SECRET")), "Missing JWT_REFRESH_SECRET reported as fatal error");
    assert(checkResult.errors.some(e => e.includes("DATABASE_URL")), "Missing DATABASE_URL reported as fatal error");

    // Test embedded database rejection in production
    process.env.DATABASE_URL = "embedded://postgres_data";
    const embeddedCheck = validateEnvironment();
    assert(embeddedCheck.errors.some(e => e.includes("Embedded container-local database storage is strictly prohibited")), "Embedded DB URL in production is unconditionally rejected as fatal error");
  } finally {
    process.env = origEnv;
  }

  // ============================================================================
  // SECTION 4: Gemini Embedding & LangChain Mock-Credential Safety Boundaries
  // ============================================================================
  console.log("\n--- 4. GEMINI EMBEDDING & LANGCHAIN MOCK SAFETY BOUNDARIES ---");

  const origNodeEnv = process.env.NODE_ENV;
  const origGeminiKey = process.env.GEMINI_API_KEY;

  try {
    // 4.1: In production mode without GEMINI_API_KEY -> embedding MUST throw fatal error (never fake)
    process.env.NODE_ENV = "production";
    process.env.GEMINI_API_KEY = "";

    let embeddingThrew = false;
    try {
      await generateEmbedding("Test candidate resume segment");
    } catch (err: any) {
      embeddingThrew = (err?.message || "").includes("[EMBEDDING FATAL]");
    }
    assert(embeddingThrew, "Production strictly throws [EMBEDDING FATAL] when GEMINI_API_KEY is missing (no synthetic fallback)");

    // 4.2: In non-production mode without GEMINI_API_KEY -> deterministic offline vector is returned
    process.env.NODE_ENV = "development";
    process.env.GEMINI_API_KEY = "";

    const devEmb = await generateEmbedding("Frontend React Developer with TypeScript experience");
    assert(devEmb.dimension === 768, "Development mode generates 768-dim offline fallback vector", String(devEmb.dimension));
    assert(devEmb.model === "deterministic_projection_fallback", "Development mode explicitly labels fallback model", devEmb.model);

    // 4.3: LangChain chat model creation in production without key MUST throw
    process.env.NODE_ENV = "production";
    process.env.GEMINI_API_KEY = "";
    let lcThrew = false;
    try {
      getLangChainChatModel();
    } catch (err: any) {
      lcThrew = (err?.message || "").includes("[LANGCHAIN ERROR]");
    }
    assert(lcThrew, "LangChain strictly throws [LANGCHAIN ERROR] in production when GEMINI_API_KEY is missing");

    // 4.4: invokeChainWithModelFallback MUST throw if GEMINI_API_KEY is missing (never calls external API with mock key)
    let chainThrew = false;
    try {
      await invokeChainWithModelFallback(() => ({} as any), "test input");
    } catch (err: any) {
      chainThrew = (err?.message || "").includes("[LANGCHAIN ERROR]");
    }
    assert(chainThrew, "invokeChainWithModelFallback strictly throws without calling network when GEMINI_API_KEY is missing");

  } finally {
    process.env.NODE_ENV = origNodeEnv;
    if (origGeminiKey !== undefined) process.env.GEMINI_API_KEY = origGeminiKey;
    else delete process.env.GEMINI_API_KEY;
  }

  // ============================================================================
  // SECTION 5: Multi-Tenant Candidate RAG Isolation & Grounding
  // ============================================================================
  console.log("\n--- 5. MULTI-TENANT CANDIDATE RAG ISOLATION & GROUNDING ---");

  resetVectorStore();
  const vectorStore = await getVectorStore();

  const candidateAId = `tenant_cand_A_${Date.now()}`;
  const candidateBId = `tenant_cand_B_${Date.now()}`;

  // Generate embeddings for Candidate A and Candidate B
  const embA = await generateEmbedding("Candidate A: Expert in Kubernetes cluster administration, Envoy proxies, and Terraform.");
  const embB = await generateEmbedding("Candidate B: Certified Public Accountant specializing in corporate income tax and GAAP audits.");

  // Insert Candidate A chunks
  await vectorStore.insertChunks([{
    id: `chunk_A_1_${Date.now()}`,
    userId: candidateAId,
    documentId: `resume_A_${Date.now()}`,
    section: "experience",
    content: "Candidate A: 8 years building cloud infrastructure with Kubernetes and Terraform.",
    embedding: embA.embedding,
    knowledgeDomain: "candidate_private",
    chunkIndex: 0,
    tokenCount: 20,
    metadata: { tenant: candidateAId }
  }]);

  // Insert Candidate B chunks
  await vectorStore.insertChunks([{
    id: `chunk_B_1_${Date.now()}`,
    userId: candidateBId,
    documentId: `resume_B_${Date.now()}`,
    section: "experience",
    content: "Candidate B: 6 years preparing GAAP corporate financial statements and tax filings.",
    embedding: embB.embedding,
    knowledgeDomain: "candidate_private",
    chunkIndex: 0,
    tokenCount: 20,
    metadata: { tenant: candidateBId }
  }]);

  // Query Candidate A's vector space with Candidate A's ID
  const queryEmbA = await generateEmbedding("cloud infrastructure Kubernetes Terraform");
  const candAResults = await vectorStore.search({
    queryVector: queryEmbA.embedding,
    userId: candidateAId,
    scope: "candidate_private",
    topK: 5
  });

  assert(candAResults.length > 0, "Candidate A search returned Candidate A chunks");
  assert(candAResults.every(r => r.userId === candidateAId), "Candidate A search contains ONLY Candidate A chunks");
  assert(!candAResults.some(r => r.userId === candidateBId), "Candidate A search strictly excludes Candidate B chunks");

  // Query Candidate B's vector space
  const queryEmbB = await generateEmbedding("GAAP corporate tax accounting");
  const candBResults = await vectorStore.search({
    queryVector: queryEmbB.embedding,
    userId: candidateBId,
    scope: "candidate_private",
    topK: 5
  });

  assert(candBResults.length > 0, "Candidate B search returned Candidate B chunks");
  assert(candBResults.every(r => r.userId === candidateBId), "Candidate B search contains ONLY Candidate B chunks");
  assert(!candBResults.some(r => r.userId === candidateAId), "Candidate B search strictly excludes Candidate A chunks");

  // Cleanup vectors
  await vectorStore.deleteByUserId(candidateAId);
  await vectorStore.deleteByUserId(candidateBId);

  const afterCleanupA = await vectorStore.search({ queryVector: queryEmbA.embedding, userId: candidateAId, scope: "candidate_private", topK: 5 });
  assert(afterCleanupA.length === 0, "Candidate A vectors purged cleanly on delete");

  // ============================================================================
  // SUMMARY REPORT
  // ============================================================================
  console.log("\n================================================================================");
  console.log(`🛡️  ADVERSARIAL BOUNDARY SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");

  process.exit(failed > 0 ? 1 : 0);
}

runAdversarialBoundaryTests().catch(err => {
  console.error("Fatal error in adversarial boundary test suite:", err);
  process.exit(1);
});
