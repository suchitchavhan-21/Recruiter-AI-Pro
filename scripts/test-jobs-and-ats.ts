import http from "http";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { spawn, ChildProcess } from "child_process";
import { extractJobRequirements, calculateEvidenceBasedATSScore } from "../src/server/ai/ats/evidenceScorer";
import { indexResumeDocument } from "../src/server/ai/rag/pipeline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_PORT = 3012;
const TEST_ENV = {
  ...process.env,
  NODE_ENV: "development",
  PORT: String(TEST_PORT),
  JWT_SECRET: "test_jwt_secret_token_recruiter_ai_pro_2026_long_secret_key",
  JWT_REFRESH_SECRET: "test_jwt_refresh_secret_token_recruiter_ai_pro_2026_long_secret_key",
  EMBEDDING_MODEL: "gemini-embedding-2"
};

function fetchJson(url: string, options: http.RequestOptions = {}, postData?: string): Promise<{ status: number; data: any; raw: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqHeaders: Record<string, any> = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };
    if (postData) {
      reqHeaders["Content-Length"] = Buffer.byteLength(postData);
    }

    const reqOptions: http.RequestOptions = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || "GET",
      headers: reqHeaders
    };

    const req = http.request(reqOptions, (res) => {
      let data = "";
      res.on("data", chunk => { data += chunk; });
      res.on("end", () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({ status: res.statusCode || 200, data: parsedData, raw: data });
        } catch {
          resolve({ status: res.statusCode || 200, data: null, raw: data });
        }
      });
    });

    req.on("error", reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let serverProcess: ChildProcess | null = null;

async function startServer(): Promise<void> {
  const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
  serverProcess = spawn(npxCmd, ["tsx", "server.ts"], {
    env: TEST_ENV,
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
    shell: true
  });

  serverProcess.stdout?.on("data", (data) => {
    // console.log("[SERVER]", data.toString().trim());
  });

  serverProcess.stderr?.on("data", (data) => {
    // console.error("[SERVER ERR]", data.toString().trim());
  });

  // Poll /api/health until responsive
  for (let i = 0; i < 40; i++) {
    await delay(500);
    try {
      const health = await fetchJson(`http://127.0.0.1:${TEST_PORT}/api/health`);
      if (health.status === 200 && health.data?.status === "ok") {
        return;
      }
    } catch {
      // Keep waiting
    }
  }

  throw new Error("Server failed to bind to port within timeout");
}

async function runTests() {
  console.log("==========================================================");
  console.log("RECRUITER AI PRO — JOBS BACKEND & ATS SCORING TEST SUITE");
  console.log("==========================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`[PASS] Test ${total}: ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] Test ${total}: ${testName}`);
      if (detail) console.error(`       Detail: ${detail}`);
    }
  }

  // UNIT TESTS: ATS Requirement Extraction & Determinism
  console.log("--- PART 1: DETERMINISTIC ATS SCORING ENGINE ---");

  const sampleJD = `
Job Title: Senior Distributed Systems Engineer
Company: Stripe

Responsibilities:
- Build high-scale financial transaction processing pipelines.
- Lead architecture of fault-tolerant distributed ledger infrastructure.
- Coordinate with platform security teams on PCI-DSS compliance.

Requirements:
- 5+ years of experience with distributed systems and concurrency in Go, Rust, or C++.
- Deep expertise in PostgreSQL or relational database internals.
- Proven experience designing idempotent APIs and event-driven architectures.

Preferred Qualifications:
- Familiarity with mTLS security and zero-trust networking.
- Experience operating Kafka or real-time stream processing clusters.
`;

  const reqs = extractJobRequirements(sampleJD);
  assert(reqs.length >= 5, "extractJobRequirements extracts structured requirements", `Found ${reqs.length} requirements`);
  assert(reqs.some(r => r.category === "must_have"), "extractJobRequirements categorizes must_have requirements");
  assert(reqs.some(r => r.category === "preferred"), "extractJobRequirements categorizes preferred qualifications");
  assert(reqs.some(r => r.category === "responsibility"), "extractJobRequirements categorizes responsibilities");

  // Determinism test: 2 calls on same input yield exact same requirements
  const reqs2 = extractJobRequirements(sampleJD);
  assert(
    JSON.stringify(reqs) === JSON.stringify(reqs2),
    "extractJobRequirements is 100% deterministic on identical input"
  );

  // Index candidate resume evidence for test candidate
  const candidateIdA = "test_user_ats_candidate_" + Date.now();
  const resumeText = `
Summary: Senior Software Engineer with 7 years of experience building distributed systems.
Experience:
- Stripe & Fintech Corp: Architected high-throughput financial ledgers in Go and PostgreSQL.
- Implemented idempotent API pipelines processing $50M daily transaction volume.
- Engineered event-driven Kafka streaming architectures with sub-50ms latency.
Skills: Go, PostgreSQL, Distributed Systems, Concurrency, Kafka, mTLS, Idempotent APIs.
`;

  try {
    await indexResumeDocument({
      resumeId: "resume-123",
      userId: candidateIdA,
      resumeText: resumeText
    });
  } catch (err: any) {
    console.warn("Candidate indexing notice:", err.message);
  }

  const atsScoreUserA = await calculateEvidenceBasedATSScore({
    userId: candidateIdA,
    jdText: sampleJD,
    role: "Senior Distributed Systems Engineer"
  });

  assert(
    typeof atsScoreUserA.score === "number" && atsScoreUserA.score >= 0 && atsScoreUserA.score <= 100,
    "calculateEvidenceBasedATSScore produces bounded score (0 - 100)",
    `Score = ${atsScoreUserA.score}`
  );

  assert(
    atsScoreUserA.breakdown && typeof atsScoreUserA.breakdown.mustHave === "number",
    "calculateEvidenceBasedATSScore includes structured breakdown (mustHave, preferred, responsibilities)"
  );

  assert(
    atsScoreUserA.matchedRequirements.length > 0,
    "Candidate with matching skills has grounded matchedRequirements with provenance",
    `Matched = ${atsScoreUserA.matchedRequirements.length}`
  );

  // Candidate with zero resume
  const candidateIdEmpty = "test_user_empty_" + Date.now();
  const atsScoreEmpty = await calculateEvidenceBasedATSScore({
    userId: candidateIdEmpty,
    jdText: sampleJD,
    role: "Senior Distributed Systems Engineer"
  });

  assert(
    atsScoreEmpty.score < atsScoreUserA.score,
    "Candidate with no indexed resume receives lower score than candidate with relevant experience",
    `Empty score (${atsScoreEmpty.score}) < Candidate A score (${atsScoreUserA.score})`
  );

  assert(
    atsScoreEmpty.missingRequirements.length > 0,
    "Candidate with no indexed resume reports missing requirements"
  );

  console.log("\n--- PART 2: POSTGRESQL JOBS APPLICATION PERSISTENCE & API ---");

  await startServer();

  const baseUrl = `http://127.0.0.1:${TEST_PORT}`;

  // 1. Register & Login User A
  const userAEmail = `applicant_a_${Date.now()}@example.com`;
  const userAPassword = "Password123!";
  const registerARes = await fetchJson(`${baseUrl}/api/auth/register`, { method: "POST" }, JSON.stringify({
    fullName: "Alice Applicant",
    email: userAEmail,
    phoneNumber: "+1555" + Math.floor(1000000 + Math.random() * 9000000),
    password: userAPassword,
    confirmPassword: userAPassword,
    agreeTerms: true
  }));

  assert(registerARes.status === 201 && registerARes.data?.success === true, "Register User A returns HTTP 201");
  if (registerARes.data?.verificationLink) {
    await fetchJson(registerARes.data.verificationLink);
  }

  const loginARes = await fetchJson(`${baseUrl}/api/auth/login`, { method: "POST" }, JSON.stringify({
    email: userAEmail,
    password: userAPassword
  }));
  const tokenA = loginARes.data?.accessToken;
  assert(Boolean(tokenA), "Login User A returns valid access token");

  // 2. Register & Login User B
  const userBEmail = `applicant_b_${Date.now()}@example.com`;
  const userBPassword = "Password123!";
  const registerBRes = await fetchJson(`${baseUrl}/api/auth/register`, { method: "POST" }, JSON.stringify({
    fullName: "Bob Applicant",
    email: userBEmail,
    phoneNumber: "+1555" + Math.floor(1000000 + Math.random() * 9000000),
    password: userBPassword,
    confirmPassword: userBPassword,
    agreeTerms: true
  }));

  assert(registerBRes.status === 201 && registerBRes.data?.success === true, "Register User B returns HTTP 201");
  if (registerBRes.data?.verificationLink) {
    await fetchJson(registerBRes.data.verificationLink);
  }

  const loginBRes = await fetchJson(`${baseUrl}/api/auth/login`, { method: "POST" }, JSON.stringify({
    email: userBEmail,
    password: userBPassword
  }));
  const tokenB = loginBRes.data?.accessToken;
  assert(Boolean(tokenB), "Login User B returns valid access token");

  // 3. User A records an application
  const applyRes = await fetchJson(`${baseUrl}/api/jobs`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tokenA}` }
  }, JSON.stringify({
    company: "Stripe",
    role: "Staff Systems Engineer",
    roleCategory: "Engineering",
    applicantName: "Alice Applicant",
    applicantEmail: userAEmail,
    coverLetter: "Excited to contribute to payment rails.",
    matchScore: 88,
    notes: "Applied via Recruiter AI Pro workspace."
  }));

  assert(applyRes.status === 201 && applyRes.data?.success === true, "User A POST /api/jobs records application with 201 Created");
  const createdApp = applyRes.data?.application;
  assert(Boolean(createdApp?.id), "POST /api/jobs returns persisted application record with UUID");
  assert(createdApp?.status === "Submitted", "Default application status is 'Submitted'");
  assert(createdApp?.matchScore === 88, "Persisted application stores matchScore correctly");

  // 4. User A lists applications
  const listARes = await fetchJson(`${baseUrl}/api/jobs`, {
    headers: { Authorization: `Bearer ${tokenA}` }
  });

  assert(listARes.status === 200 && Array.isArray(listARes.data?.applications), "User A GET /api/jobs returns applications array");
  assert(listARes.data.applications.some((a: any) => a.id === createdApp.id), "User A GET /api/jobs contains newly created application");

  // 5. User A patches application status
  const patchRes = await fetchJson(`${baseUrl}/api/jobs/${createdApp.id}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${tokenA}` }
  }, JSON.stringify({
    status: "Interview Scheduled"
  }));

  assert(patchRes.status === 200 && patchRes.data?.success === true, "User A PATCH /api/jobs/:id/status updates status to 'Interview Scheduled'");
  assert(patchRes.data?.application?.status === "Interview Scheduled", "PATCH /api/jobs/:id/status returns updated record");

  // 6. Verify User B tenant isolation (User B cannot see or modify User A's application)
  const listBRes = await fetchJson(`${baseUrl}/api/jobs`, {
    headers: { Authorization: `Bearer ${tokenB}` }
  });

  assert(listBRes.status === 200 && listBRes.data.applications.length === 0, "User B GET /api/jobs is isolated (sees 0 of User A's applications)");

  const patchBRes = await fetchJson(`${baseUrl}/api/jobs/${createdApp.id}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${tokenB}` }
  }, JSON.stringify({
    status: "Offered"
  }));

  assert(patchBRes.status === 404 || patchBRes.status === 403, "User B cannot patch User A's application (Tenant Isolation enforced)");

  // 7. Unauthenticated requests fail with 401
  const unauthRes = await fetchJson(`${baseUrl}/api/jobs`);
  assert(unauthRes.status === 401, "Unauthenticated GET /api/jobs fails with 401 Unauthorized");

  const unauthPostRes = await fetchJson(`${baseUrl}/api/jobs`, { method: "POST" }, JSON.stringify({
    company: "Google",
    role: "ML Engineer",
    applicantName: "Hacker",
    applicantEmail: "hacker@example.com"
  }));
  assert(unauthPostRes.status === 401, "Unauthenticated POST /api/jobs fails with 401 Unauthorized");

  // 8. Test /api/resumes/ats-score endpoint
  const atsEndpointRes = await fetchJson(`${baseUrl}/api/resumes/ats-score`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tokenA}` }
  }, JSON.stringify({
    jobDescription: sampleJD,
    role: "Senior Distributed Systems Engineer"
  }));

  assert(
    atsEndpointRes.status === 200 && atsEndpointRes.data?.success === true,
    "Authenticated POST /api/resumes/ats-score returns 200 OK with ATS analysis"
  );
  assert(
    typeof atsEndpointRes.data?.score === "number" && atsEndpointRes.data?.breakdown,
    "POST /api/resumes/ats-score returns score and breakdown structure"
  );

  console.log("\n--- PART 3: PROHIBITED STRING & HEURISTIC SCAN ---");

  // Scan src/ for prohibited simulation strings
  const prohibitedPatterns = [
    { pattern: "charSum", name: "charSum character sum heuristic" },
    { pattern: "referral-${Date.now()}", name: "referral- client-side ID generator" },
    { pattern: "Routing direct loop bypass", name: "Fake loop bypass message" },
    { pattern: "Fast-Track Approved!", name: "Fake Fast-Track approval claim" },
    { pattern: "seedApplicationsList", name: "Fake seedApplicationsList generator" }
  ];

  function searchFilesRecursively(dir: string): string[] {
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "node_modules" && entry.name !== "dist" && entry.name !== ".git") {
          files.push(...searchFilesRecursively(fullPath));
        }
      } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
        files.push(fullPath);
      }
    }
    return files;
  }

  const srcFiles = searchFilesRecursively(path.resolve(__dirname, "../src"));

  for (const check of prohibitedPatterns) {
    let foundIn: string[] = [];
    for (const file of srcFiles) {
      const content = fs.readFileSync(file, "utf8");
      if (content.includes(check.pattern)) {
        foundIn.push(path.basename(file));
      }
    }
    assert(foundIn.length === 0, `Zero references to '${check.name}' in src/`, foundIn.join(", "));
  }

  // Clean up server process
  if (serverProcess) {
    serverProcess.kill();
  }

  console.log("\n==========================================================");
  console.log(`TEST RESULTS: ${passed}/${total} PASSED`);
  console.log("==========================================================");

  if (passed === total) {
    console.log("SUCCESS: All Jobs Backend & ATS Evidence Scoring tests PASSED.\n");
    process.exit(0);
  } else {
    console.error("FAILURE: Some tests failed.\n");
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test execution fatal error:", err);
  if (serverProcess) serverProcess.kill();
  process.exit(1);
});
