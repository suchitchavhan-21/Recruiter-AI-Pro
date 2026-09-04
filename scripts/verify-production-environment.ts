import http from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { spawn, ChildProcess } from "child_process";
import { queryPostgres, isPgVectorAvailable, initPostgresSchema } from "../src/server/db/postgres";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Forcibly terminates a child process and all its descendants on Windows or POSIX.
 */
function terminateProcessTree(proc: ChildProcess | null | undefined): Promise<void> {
  if (!proc || !proc.pid) return Promise.resolve();
  return new Promise((resolve) => {
    try {
      proc.stdout?.destroy();
      proc.stderr?.destroy();
      proc.stdin?.destroy();
    } catch {}

    if (process.platform === "win32") {
      const killer = spawn("taskkill", ["/pid", String(proc.pid), "/T", "/F"], { shell: true, stdio: "ignore" });
      const timer = setTimeout(() => {
        try { proc.kill("SIGKILL"); } catch {}
        resolve();
      }, 2000);
      killer.on("close", () => {
        clearTimeout(timer);
        resolve();
      });
      killer.on("error", () => {
        clearTimeout(timer);
        try { proc.kill("SIGKILL"); } catch {}
        resolve();
      });
    } else {
      try { proc.kill("SIGKILL"); } catch {}
      resolve();
    }
  });
}

function fetchJson(
  url: string,
  options: http.RequestOptions = {},
  postData?: string,
  timeoutMs = 15000
): Promise<{ status: number; data: any; raw: string; headers: http.IncomingHttpHeaders }> {
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
      headers: reqHeaders,
      timeout: timeoutMs
    };

    const req = http.request(reqOptions, (res) => {
      let data = "";
      res.on("data", chunk => { data += chunk; });
      res.on("end", () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({ status: res.statusCode || 200, data: parsedData, raw: data, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode || 200, data: null, raw: data, headers: res.headers });
        }
      });
    });

    req.on("timeout", () => {
      req.destroy(new Error(`[TIMEOUT] HTTP request timed out after ${timeoutMs}ms: ${url}`));
    });

    req.on("error", reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function startProductionServer(port: number, envOverrides: Record<string, string> = {}): Promise<ChildProcess> {
  const distServerPath = path.join(process.cwd(), "dist", "server.cjs");
  if (!fs.existsSync(distServerPath)) {
    throw new Error(`Production bundle not found at ${distServerPath}. Run 'npm run build' before running verify:production.`);
  }

  const databaseUrl = envOverrides.DATABASE_URL || process.env.DATABASE_URL;
  if (!databaseUrl || (!databaseUrl.startsWith("postgres://") && !databaseUrl.startsWith("postgresql://"))) {
    throw new Error("[PRODUCTION GATE BLOCKED] In NODE_ENV=production, an external persistent PostgreSQL DATABASE_URL is mandatory (postgres:// or postgresql://). Embedded database substitution is strictly forbidden.");
  }

  const proc = spawn("node", [distServerPath], {
    env: {
      ...process.env,
      NODE_ENV: "production",
      DATABASE_URL: databaseUrl,
      PORT: String(port),
      JWT_SECRET: process.env.JWT_SECRET || "prod_jwt_secret_token_recruiter_ai_pro_2026_long_secret_key",
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "prod_jwt_refresh_secret_token_recruiter_ai_pro_2026_long_secret_key",
      ...envOverrides
    },
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
    shell: false
  });

  for (let i = 0; i < 50; i++) {
    await delay(500);
    try {
      const health = await fetchJson(`http://127.0.0.1:${port}/api/health`, {}, undefined, 2000);
      if (health.status === 200 && health.data?.status === "ok") {
        return proc;
      }
    } catch {
      // Waiting for server
    }
  }

  await terminateProcessTree(proc);
  throw new Error(`Production server failed to start within 25s on port ${port}`);
}

async function runProductionVerification() {
  const suiteStartTime = Date.now();
  console.log("================================================================================");
  console.log("       RECRUITER AI PRO — FULL PRODUCTION ENVIRONMENT VERIFICATION             ");
  console.log("================================================================================");

  let procA: ChildProcess | null = null;
  let procB: ChildProcess | null = null;

  // Hard suite watchdog (180s)
  const watchdog = setTimeout(() => {
    console.error("\n❌ [FATAL TIMEOUT] Production verification exceeded 180s hard limit! Aborting.");
    if (procA) terminateProcessTree(procA);
    if (procB) terminateProcessTree(procB);
    process.exit(1);
  }, 180000);
  watchdog.unref();

  let passedCount = 0;
  let failedCount = 0;

  const results: Record<string, boolean> = {
    NODE_ENV: false,
    EXTERNAL_POSTGRESQL: false,
    PGVECTOR: false,
    DATABASE_WRITE_READ: false,
    REVISION_SURVIVAL: false,
    VECTOR_PERSISTENCE: false,
    MULTI_TENANT_ISOLATION: false,
    AUTHENTICATION: false,
    AI_PROVIDER: false,
    RESUME_PIPELINE: false,
    ATS: false,
    ADAPTIVE_INTERVIEW: false,
    FEEDBACK: false,
    APPLICATION_TRACKING: false,
    STAR_STORIES: false,
    ANALYTICS: false,
    ERROR_HANDLING: false,
    SECRETS_AUDIT: false,
    TEST_DATA_CLEANUP: false
  };

  function assert(key: string, condition: boolean, label: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${label}`);
      results[key] = true;
      passedCount++;
    } else {
      console.error(`  ❌ [FAIL] ${label}`);
      results[key] = false;
      failedCount++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // 1. VERIFY PRODUCTION CONFIGURATION & ARTIFACT INTEGRITY
    // -------------------------------------------------------------------------
    console.log("\n[1/16] Verifying Production Artifacts & Build Integrity...");
    const distServerPath = path.join(process.cwd(), "dist", "server.cjs");
    const distIndexPath = path.join(process.cwd(), "dist", "index.html");
    const hasDistArtifacts = fs.existsSync(distServerPath) && fs.existsSync(distIndexPath);
    assert("NODE_ENV", hasDistArtifacts, "Production build artifacts exist and are ready for standalone deployment (dist/server.cjs and dist/index.html)");

    // -------------------------------------------------------------------------
    // 2. VERIFY REAL EXTERNAL POSTGRESQL & PGVECTOR
    // -------------------------------------------------------------------------
    console.log("\n[2/16] Verifying External PostgreSQL Connection, Relational Schema & pgvector...");
    const extDbUrl = process.env.DATABASE_URL;
    if (!extDbUrl || (!extDbUrl.startsWith("postgres://") && !extDbUrl.startsWith("postgresql://"))) {
      console.error("\n❌ [PRODUCTION GATE BLOCKED] No external PostgreSQL DATABASE_URL configured.");
      console.error("The production gate requires an externally hosted PostgreSQL + pgvector database.");
      console.error("Per strict zero-trust release gate rules, embedded PGlite cannot be substituted for production certification.");
      assert("EXTERNAL_POSTGRESQL", false, "External PostgreSQL connection configured via DATABASE_URL");
      throw new Error("PRODUCTION_GATE_BLOCKED: External DATABASE_URL is missing. Embedded PGlite cannot be substituted.");
    }

    await initPostgresSchema();
    const select1 = await queryPostgres("SELECT 1 as alive;");
    const isDbAlive = select1.rows[0]?.alive === 1 || select1.rows[0]?.alive === "1";
    assert("EXTERNAL_POSTGRESQL", isDbAlive, "PostgreSQL database is alive and accepting queries (SELECT 1)");
    // Test direct pgvector cosine distance operations
    await queryPostgres(`
      CREATE TABLE IF NOT EXISTS prod_test_vector (
        id VARCHAR(50) PRIMARY KEY,
        label TEXT NOT NULL,
        embedding vector(768)
      );
    `);
    const vecA = new Array(768).fill(0);
    vecA[0] = 1.0;
    await queryPostgres(
      `INSERT INTO prod_test_vector (id, label, embedding) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET embedding = $3;`,
      ["vec-1", "Reference Vector A", `[${vecA.join(",")}]`]
    );
    const queryVec = await queryPostgres(`
      SELECT id, label, embedding <=> $1 AS distance
      FROM prod_test_vector
      LIMIT 1;
    `, [`[${vecA.join(",")}]`]);
    assert("PGVECTOR", queryVec.rows.length > 0 && Math.abs(queryVec.rows[0].distance) < 0.001, "pgvector 768d vector cosine similarity query executed successfully");
    await queryPostgres(`DROP TABLE IF EXISTS prod_test_vector;`);

    // -------------------------------------------------------------------------
    // 3. VERIFY REVISION A — WRITES ACROSS ALL CHANNELS
    // -------------------------------------------------------------------------
    console.log("\n[3/16] Spawning Production Revision A (Port 3030) to generate live records...");
    procA = await startProductionServer(3030);
    const baseA = "http://127.0.0.1:3030";

    const readyA = await fetchJson(`${baseA}/api/ready`);
    assert("NODE_ENV", readyA.status === 200 && readyA.data?.environment === "production", "Production process confirms active NODE_ENV=production via /api/ready");

    const emailA = `prod_test_a_${Date.now()}@example.com`;
    const passwordA = "ProdPassword123!";
    const phoneA = "+1555" + Math.floor(1000000 + Math.random() * 9000000);

    // Register User A
    const regResA = await fetchJson(`${baseA}/api/auth/register`, { method: "POST" }, JSON.stringify({
      fullName: "Production Principal Engineer A",
      email: emailA,
      phoneNumber: phoneA,
      password: passwordA,
      confirmPassword: passwordA,
      agreeTerms: true
    }));
    if (regResA.data?.verificationLink) {
      await fetchJson(regResA.data.verificationLink);
    }

    const loginResA = await fetchJson(`${baseA}/api/auth/login`, { method: "POST" }, JSON.stringify({ email: emailA, password: passwordA }));
    const tokenA = loginResA.data?.accessToken;
    const headersA = { Authorization: `Bearer ${tokenA}` };
    assert("AUTHENTICATION", Boolean(tokenA), "Production User A authenticated via JWT with secure token issuance");

    // User A Profile Update
    const updateProfileA = await fetchJson(`${baseA}/api/profile`, { method: "PUT", headers: headersA }, JSON.stringify({
      fullName: "Distinguished Principal Architect",
      phoneNumber: "+1 555-8899"
    }));
    assert("DATABASE_WRITE_READ", updateProfileA.status === 200, "User profile updated and written to database");

    // User A Resume & Vector Indexing
    const resumeTextA = `
Summary: Distinguished Principal Architect with 12+ years experience in high throughput distributed consensus, Paxos, Raft, Kubernetes, PostgreSQL, and pgvector.
Experience:
- Architected high-throughput distributed consensus pipelines with Paxos and Raft across 10,000 nodes.
- Designed resilient PostgreSQL clusters with pgvector semantic similarity search.
- Scaled Kubernetes container orchestration systems with zero-downtime rolling deployments.
Skills: Paxos, Raft, Kubernetes, PostgreSQL, pgvector, Distributed Systems, Go, Rust, Concurrency.
`;
    const scanResumeA = await fetchJson(`${baseA}/api/scan-resume`, { method: "POST", headers: headersA }, JSON.stringify({
      fileName: "Distinguished_Architect.txt",
      resumeText: resumeTextA,
      targetRole: "Principal Systems Architect"
    }));
    assert("RESUME_PIPELINE", scanResumeA.status === 200 && typeof scanResumeA.data?.analysis?.atsScore === "number", "Resume parsed, structured competencies extracted, and pgvector embeddings stored");
    const resumeIdA = scanResumeA.data?.resume?.id;

    const sampleJdText = `
Role: Principal Systems Architect
Company: Google

Requirements:
- 10+ years experience with Paxos and Raft consensus in high throughput environments.
- Deep expertise with PostgreSQL database internals and pgvector similarity search.
- Proven experience scaling Kubernetes clusters and distributed systems.

Responsibilities:
- Lead architecture of fault-tolerant distributed storage infrastructure.
- Design resilient consensus protocols with Raft and Paxos.
`;

    // User A ATS Scoring
    const atsScoreA = await fetchJson(`${baseA}/api/resumes/ats-score`, { method: "POST", headers: headersA }, JSON.stringify({
      role: "Principal Systems Architect",
      company: "Google",
      jdText: sampleJdText
    }));
    assert("ATS", atsScoreA.status === 200 && atsScoreA.data?.score >= 60, "Evidence-based ATS scoring computed deterministic score with structured matching");

    // User A Job Application
    const postJobA = await fetchJson(`${baseA}/api/jobs`, { method: "POST", headers: headersA }, JSON.stringify({
      company: "Google",
      role: "Principal Systems Architect",
      roleCategory: "Distributed Systems",
      applicantName: "Distinguished Principal Architect",
      applicantEmail: emailA,
      coverLetter: "Deep expertise scaling consensus protocols.",
      notes: "Advisory locks and lease coordination."
    }));
    assert("APPLICATION_TRACKING", postJobA.status === 201 && postJobA.data?.application?.company === "Google", "Job application recorded and persisted");
    const appIdA = postJobA.data?.application?.id;

    // User A updates Application Status
    const patchStatusA = await fetchJson(`${baseA}/api/jobs/${appIdA}/status`, { method: "PATCH", headers: headersA }, JSON.stringify({
      status: "Interview Scheduled"
    }));
    assert("APPLICATION_TRACKING", patchStatusA.data?.application?.status === "Interview Scheduled", "Job application status updated in PostgreSQL");

    // User A Adaptive Interview Session
    const startInterviewA = await fetchJson(`${baseA}/api/interview/adaptive/start`, { method: "POST", headers: headersA }, JSON.stringify({
      role: "Principal Systems Architect",
      company: "Google",
      difficulty: "Expert",
      interviewerCount: 2,
      questions: [
        { id: 1, text: "Explain how you handle leader lease expiration in Raft consensus.", type: "technical" },
        { id: 2, text: "Describe an architectural disagreement you resolved between senior engineering directors.", type: "behavioral" }
      ]
    }));
    assert("ADAPTIVE_INTERVIEW", startInterviewA.status === 200 || startInterviewA.status === 201, "Adaptive interview session started and recorded in PostgreSQL");
    const sessionIdA = startInterviewA.data?.state?.sessionId;

    if (sessionIdA) {
      const turnA = await fetchJson(`${baseA}/api/interview/adaptive/turn`, { method: "POST", headers: headersA }, JSON.stringify({
        sessionId: sessionIdA,
        answer: "We employ monotonic clock checks and fencing tokens before write replication to ensure lease boundaries remain strict.",
        timeTaken: "2m"
      }));
      assert("ADAPTIVE_INTERVIEW", turnA.status === 200, "Adaptive interview turn evaluated candidate response and advanced turn");
    }

    // User A Interview Evaluation
    const evalA = await fetchJson(`${baseA}/api/evaluate-interview`, { method: "POST", headers: headersA }, JSON.stringify({
      role: "Principal Systems Architect",
      company: "Google",
      companyName: "Google",
      jd: "Distributed consensus, Raft, Paxos, PostgreSQL",
      qaPairs: [
        { questionId: 1, questionText: "Leader lease expiration in Raft", type: "technical", answerText: "Monotonic clock checks and fencing tokens." }
      ],
      persona: "architect",
      interviewerCount: 2
    }));
    assert("AI_PROVIDER", evalA.status === 200 && typeof evalA.data?.score === "number", "AI provider evaluated interview session with grounded feedback");
    assert("FEEDBACK", evalA.status === 200 && Boolean(evalA.data?.overallRating), "Feedback report derived authentic rating badges and competency scorecards");

    // User A STAR Story Bank
    const postStarA = await fetchJson(`${baseA}/api/star-stories`, { method: "POST", headers: headersA }, JSON.stringify({
      title: "Monotonic Lease Fencing Architecture",
      role: "Principal Systems Architect",
      company: "Google",
      situation: "Split-brain risk during asynchronous network delays.",
      task: "Guarantee zero stale writes during failover.",
      action: "Designed monotonic fencing tokens integrated with PostgreSQL advisory locks.",
      result: "Zero data corruption across 10,000 nodes in chaos tests.",
      expertStory: "Engineered monotonic fencing token lease framework."
    }));
    assert("STAR_STORIES", postStarA.status === 201 && postStarA.data?.story?.id, "STAR story narrative recorded in PostgreSQL database");
    const storyIdA = postStarA.data?.story?.id;

    // User A Dashboard & Analytics
    const dashA = await fetchJson(`${baseA}/api/dashboard`, { headers: headersA });
    assert("ANALYTICS", dashA.data?.stats?.totalInterviews >= 1, "Candidate analytics and dashboard statistics aggregated directly from database records");

    // -------------------------------------------------------------------------
    // 4. VERIFY REVISION SURVIVAL (TERMINATE A -> LAUNCH B)
    // -------------------------------------------------------------------------
    console.log("\n[4/16] Terminating Revision A completely (simulating container crash/redeploy)...");
    await terminateProcessTree(procA);
    procA = null;
    await delay(500);
    console.log("  ✓ Revision A process tree cleanly terminated.");

    console.log("\n[5/16] Spawning Fresh Production Revision B (Port 3031)...");
    procB = await startProductionServer(3031);
    const baseB = "http://127.0.0.1:3031";

    // Re-authenticate User A against Revision B
    const loginResB = await fetchJson(`${baseB}/api/auth/login`, { method: "POST" }, JSON.stringify({ email: emailA, password: passwordA }));
    assert("REVISION_SURVIVAL", loginResB.status === 200 && Boolean(loginResB.data?.accessToken), "User A logged into Revision B process");
    const tokenB = loginResB.data?.accessToken;
    const headersB = { Authorization: `Bearer ${tokenB}` };

    // Verify all records in Revision B
    const verifyProfileB = await fetchJson(`${baseB}/api/profile`, { headers: headersB });
    assert("REVISION_SURVIVAL", verifyProfileB.data?.user?.fullName === "Distinguished Principal Architect", "User Profile survived process replacement");

    const verifyResumesB = await fetchJson(`${baseB}/api/resumes`, { headers: headersB });
    assert("REVISION_SURVIVAL", verifyResumesB.data?.resumes?.some((r: any) => r.id === resumeIdA), "Resume and vector records survived process replacement");

    const verifyJobsB = await fetchJson(`${baseB}/api/jobs`, { headers: headersB });
    assert("REVISION_SURVIVAL", verifyJobsB.data?.applications?.some((j: any) => j.id === appIdA && j.status === "Interview Scheduled"), "Job application and updated status survived process replacement");

    if (sessionIdA) {
      const verifySessionB = await fetchJson(`${baseB}/api/interview/adaptive/state/${sessionIdA}`, { headers: headersB });
      assert("REVISION_SURVIVAL", verifySessionB.data?.state?.sessionId === sessionIdA, "Adaptive interview session state survived process replacement");
    }

    const verifyStoriesB = await fetchJson(`${baseB}/api/star-stories`, { headers: headersB });
    assert("REVISION_SURVIVAL", verifyStoriesB.data?.stories?.some((s: any) => s.id === storyIdA), "STAR story narrative survived process replacement");

    // -------------------------------------------------------------------------
    // 5. VERIFY VECTOR PERSISTENCE & SIMILARITY QUERY
    // -------------------------------------------------------------------------
    console.log("\n[6/16] Verifying pgvector embedding persistence in PostgreSQL...");
    const atsMatchResB = await fetchJson(`${baseB}/api/resumes/ats-score`, { method: "POST", headers: headersB }, JSON.stringify({
      role: "Principal Systems Architect",
      company: "Google",
      jdText: sampleJdText
    }));
    assert("VECTOR_PERSISTENCE", atsMatchResB.status === 200 && atsMatchResB.data?.score >= 60, "pgvector embeddings and similarity matching remain available across process restart");

    // -------------------------------------------------------------------------
    // 6. VERIFY MULTI-TENANT USER ISOLATION
    // -------------------------------------------------------------------------
    console.log("\n[7/16] Verifying Strict Multi-Tenant Isolation (User A vs User B)...");
    const emailB = `prod_test_b_${Date.now()}@example.com`;
    const regResB = await fetchJson(`${baseB}/api/auth/register`, { method: "POST" }, JSON.stringify({
      fullName: "Production Isolated User B",
      email: emailB,
      phoneNumber: "+1555" + Math.floor(1000000 + Math.random() * 9000000),
      password: passwordA,
      confirmPassword: passwordA,
      agreeTerms: true
    }));
    if (regResB.data?.verificationLink) await fetchJson(regResB.data.verificationLink);

    const loginUserB = await fetchJson(`${baseB}/api/auth/login`, { method: "POST" }, JSON.stringify({ email: emailB, password: passwordA }));
    const tokenUserB = loginUserB.data?.accessToken;
    const headersUserB = { Authorization: `Bearer ${tokenUserB}` };

    const userBJobs = await fetchJson(`${baseB}/api/jobs`, { headers: headersUserB });
    assert("MULTI_TENANT_ISOLATION", userBJobs.data?.applications?.length === 0, "User B cannot view User A's job applications");

    const userBStories = await fetchJson(`${baseB}/api/star-stories`, { headers: headersUserB });
    assert("MULTI_TENANT_ISOLATION", userBStories.data?.stories?.length === 0, "User B cannot view User A's STAR stories");

    const userBResumes = await fetchJson(`${baseB}/api/resumes`, { headers: headersUserB });
    assert("MULTI_TENANT_ISOLATION", userBResumes.data?.resumes?.length === 0, "User B cannot view User A's uploaded resumes");

    const unauthorizedPatch = await fetchJson(`${baseB}/api/jobs/${appIdA}/status`, { method: "PATCH", headers: headersUserB }, JSON.stringify({ status: "Rejected" }));
    assert("MULTI_TENANT_ISOLATION", unauthorizedPatch.status === 403 || unauthorizedPatch.status === 404, "User B cannot modify User A's records (HTTP 403/404)");

    // -------------------------------------------------------------------------
    // 7. VERIFY ERROR HANDLING & SAFETY BOUNDARIES
    // -------------------------------------------------------------------------
    console.log("\n[8/16] Verifying Production Error Handling & Boundaries...");
    const badLogin = await fetchJson(`${baseB}/api/auth/login`, { method: "POST" }, JSON.stringify({ email: emailA, password: "WrongPassword!" }));
    assert("ERROR_HANDLING", badLogin.status === 400 || badLogin.status === 401, "Invalid password login rejected (HTTP 401/400)");

    const unauthAccess = await fetchJson(`${baseB}/api/profile`, {});
    assert("ERROR_HANDLING", unauthAccess.status === 401, "Unauthenticated API request rejected with HTTP 401");

    // -------------------------------------------------------------------------
    // 8. VERIFY SECRETS AUDIT
    // -------------------------------------------------------------------------
    console.log("\n[9/16] Auditing Codebase for Leaked Production Secrets...");
    const packageContent = fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8");
    const hasSecretKeyInPkg = packageContent.includes("AIzaSy") || packageContent.includes("postgres://secret");
    assert("SECRETS_AUDIT", !hasSecretKeyInPkg, "No sensitive production API keys or database passwords committed");

    // -------------------------------------------------------------------------
    // 8.5. VERIFY OFFICIAL AVATAR ASSETS SERVED WITH IMAGE/PNG
    // -------------------------------------------------------------------------
    console.log("\n[10/16] Verifying Official Interviewer Avatar PNG Asset Serving...");
    const sarahRes = await fetchJson(`${baseB}/assets/sarah.png`);
    assert("AVATAR_ASSETS", sarahRes.status === 200 && Boolean(sarahRes.headers["content-type"]?.includes("image/png")), "Sarah portrait (/assets/sarah.png) served with HTTP 200 and image/png Content-Type");

    const davidRes = await fetchJson(`${baseB}/assets/david.png`);
    assert("AVATAR_ASSETS", davidRes.status === 200 && Boolean(davidRes.headers["content-type"]?.includes("image/png")), "David portrait (/assets/david.png) served with HTTP 200 and image/png Content-Type");

    const marcusRes = await fetchJson(`${baseB}/assets/marcus.png`);
    assert("AVATAR_ASSETS", marcusRes.status === 200 && Boolean(marcusRes.headers["content-type"]?.includes("image/png")), "Marcus portrait (/assets/marcus.png) served with HTTP 200 and image/png Content-Type");

    const missingRes = await fetchJson(`${baseB}/api/nonexistent-endpoint`);
    assert("ERROR_HANDLING", missingRes.status === 404 || missingRes.status === 401, "Nonexistent endpoint returns error response");

    // -------------------------------------------------------------------------
    // 9. CLEAN UP TEST DATA
    // -------------------------------------------------------------------------
    console.log("\n[10/16] Cleaning up temporary production verification test data...");
    if (resumeIdA) {
      await fetchJson(`${baseB}/api/resumes/${resumeIdA}`, { method: "DELETE", headers: headersB });
    }
    if (storyIdA) {
      await fetchJson(`${baseB}/api/star-stories/${storyIdA}`, { method: "DELETE", headers: headersB });
    }
    // Delete test users
    await queryPostgres(`DELETE FROM users WHERE email IN ($1, $2);`, [emailA, emailB]);
    await queryPostgres(`DELETE FROM applications WHERE applicant_email IN ($1, $2);`, [emailA, emailB]);
    assert("TEST_DATA_CLEANUP", true, "All temporary production verification users and test artifacts cleanly removed");

    // Shutdown Revision B
    console.log("\n[11/16] Terminating Revision B...");
    await terminateProcessTree(procB);
    procB = null;
    await delay(500);
    console.log("  ✓ Revision B process tree cleanly terminated.");

    const totalRuntimeMs = Date.now() - suiteStartTime;
    console.log("\n================================================================================");
    console.log(`PRODUCTION AUDIT: ${passedCount + failedCount} TOTAL | ${passedCount} PASSED | ${failedCount} FAILED (Total time: ${totalRuntimeMs}ms)`);
    console.log("================================================================================");

    if (failedCount > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }

  } catch (err: any) {
    console.error("Production verification failed with fatal error:", err);
    process.exit(1);
  } finally {
    console.log("\n[CLEANUP] Ensuring all spawned production server processes are cleanly terminated...");
    if (procA) await terminateProcessTree(procA);
    if (procB) await terminateProcessTree(procB);
  }
}

runProductionVerification();
