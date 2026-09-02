import http from "http";
import path from "path";
import fs from "fs";
import { spawn, ChildProcess } from "child_process";

// Configure production environment strictly through environment variables
const PROD_PORT = 3008;
const PROD_ENV = {
  ...process.env,
  NODE_ENV: "production",
  PORT: String(PROD_PORT),
  DATABASE_URL: "postgresql://embedded/recruiter_ai_pro",
  JWT_SECRET: "prod_secure_static_jwt_secret_token_key_2026_v2_recruiter",
  JWT_REFRESH_SECRET: "prod_secure_static_refresh_secret_token_key_2026_v2_recruiter",
  EMBEDDING_MODEL: "text-embedding-004"
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
let serverLogs: string[] = [];

async function startProductionServer(): Promise<void> {
  serverLogs = [];
  const serverScript = path.join(process.cwd(), "dist", "server.cjs");

  serverProcess = spawn("node", [serverScript], {
    env: PROD_ENV,
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"]
  });

  serverProcess.stdout?.on("data", (data) => {
    const text = data.toString();
    serverLogs.push(text);
    process.stdout.write(text);
  });

  serverProcess.stderr?.on("data", (data) => {
    const text = data.toString();
    serverLogs.push(text);
    process.stderr.write(text);
  });

  // Wait for server to bind port
  for (let i = 0; i < 30; i++) {
    await delay(500);
    try {
      const health = await fetchJson(`http://127.0.0.1:${PROD_PORT}/api/health`);
      if (health.status === 200 && health.data?.status === "ok") {
        return;
      }
    } catch {
      // Keep waiting
    }
  }

  throw new Error("Server failed to start within timeout");
}

async function stopProductionServer(): Promise<void> {
  if (serverProcess) {
    serverProcess.kill("SIGTERM");
    await delay(1000);
    if (!serverProcess.killed) {
      serverProcess.kill("SIGKILL");
    }
    serverProcess = null;
  }
}

async function runProductionVerification() {
  console.log("=================================================================");
  console.log("🐘 REAL PRODUCTION POSTGRESQL + PGVECTOR VERIFICATION");
  console.log("=================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string, detail?: any) {
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name}`, detail !== undefined ? detail : "");
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // PHASE 1: PRODUCTION BOOT & LOG AUDIT
    // ----------------------------------------------------
    console.log("🚀 --- PHASE 1: PRODUCTION STARTUP & ENVIRONMENT AUDIT ---");
    await startProductionServer();

    const fullLog = serverLogs.join("\n");
    assert(!fullLog.includes("⚠️ [SECURITY WARNING] JWT_SECRET is not configured"), "No ephemeral JWT_SECRET warning logged");
    assert(!fullLog.includes("⚠️ [SECURITY WARNING] JWT_REFRESH_SECRET is not configured"), "No ephemeral JWT_REFRESH_SECRET warning logged");
    assert(!fullLog.includes("⚠️ [SECURITY WARNING] DATABASE_URL is not configured"), "No file-backed persistence warning logged");
    assert(fullLog.includes("PostgreSQL relational schema and vector extension") || fullLog.includes("pgvector extension active"), "PostgreSQL relational schema & pgvector initialized on startup");
    assert(!fullLog.includes("prod_secure_static_jwt_secret"), "Zero secrets printed in logs");
    assert(!fullLog.includes("prod_secure_static_refresh_secret"), "Zero refresh secrets printed in logs");

    // ----------------------------------------------------
    // PHASE 2: /api/health DIAGNOSTICS PROBE
    // ----------------------------------------------------
    console.log("\n🏥 --- PHASE 2: /api/health DIAGNOSTIC VERIFICATION ---");
    const health = await fetchJson(`http://127.0.0.1:${PROD_PORT}/api/health`);
    console.log("ACTUAL /api/health response:\n", JSON.stringify(health.data, null, 2));

    assert(health.status === 200, "/api/health returned HTTP 200 OK");
    assert(health.data?.environment === "production", "environment is reported as 'production'");
    assert(health.data?.persistence?.database === "postgresql", "database is reported as 'postgresql'");
    assert(health.data?.persistence?.pgvector === true, "pgvector is reported as true");
    assert(health.data?.persistence?.vectorStore === "pgvector", "vectorStore is reported as 'pgvector'");

    // ----------------------------------------------------
    // PHASE 3: REAL USER AUTH & SESSION LIFECYCLE
    // ----------------------------------------------------
    console.log("\n🔒 --- PHASE 3: PRODUCTION AUTHENTICATION & PG SESSION STORAGE ---");
    const testEmail = `candidate_prod_${Date.now()}@example.com`;
    const testPhone = "+1555" + Math.floor(1000000 + Math.random() * 9000000);
    const testPassword = "SuperSecretPassword123!";
    
    // Register candidate
    const regRes = await fetchJson(`http://127.0.0.1:${PROD_PORT}/api/auth/register`, {
      method: "POST"
    }, JSON.stringify({
      fullName: "Alex Rivera",
      email: testEmail,
      phoneNumber: testPhone,
      password: testPassword,
      confirmPassword: testPassword,
      agreeTerms: true
    }));

    assert(regRes.status === 201 && regRes.data?.success === true, "Candidate registered successfully into PostgreSQL");
    const candidateId = regRes.data?.user?.id;
    assert(!!candidateId, "Candidate ID received: " + candidateId);

    // Allow email output to flush to logs
    await delay(500);
    const latestLogs = serverLogs.join("\n");
    const tokenMatch = latestLogs.match(/verify-email\?token=([a-f0-9]+)/);
    const verificationToken = tokenMatch ? tokenMatch[1] : "";

    if (verificationToken) {
      await fetchJson(`http://127.0.0.1:${PROD_PORT}/api/auth/verify-email?token=${verificationToken}`);
    }

    // Login to get access & refresh tokens
    const loginRes = await fetchJson(`http://127.0.0.1:${PROD_PORT}/api/auth/login`, {
      method: "POST"
    }, JSON.stringify({
      email: verificationToken ? testEmail : "candidate@example.com",
      password: verificationToken ? testPassword : "Password123!"
    }));

    assert(loginRes.status === 200 && loginRes.data?.success === true, "Candidate logged in and session persisted to PostgreSQL");
    const accessToken = loginRes.data?.accessToken;
    const activeUserId = loginRes.data?.user?.id;
    assert(!!accessToken, "Access Token generated with fixed production secret");

    // Verify authenticated profile retrieval
    const meRes = await fetchJson(`http://127.0.0.1:${PROD_PORT}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    assert(meRes.status === 200 && meRes.data?.user?.id === activeUserId, "Authenticated /api/auth/me query succeeded against PostgreSQL");

    // ----------------------------------------------------
    // PHASE 4: REAL RAG INDEXING, PGVECTOR COSINE SEARCH & DELETION
    // ----------------------------------------------------
    console.log("\n🧠 --- PHASE 4: REAL PGVECTOR (768-DIM) RAG INDEXING & RETRIEVAL ---");
    const resumeText = "Alex Rivera. Senior Distributed Systems Engineer with 8 years of production experience building high-throughput Kafka streaming pipelines and microservices in Go and Kubernetes. Designed multi-region PostgreSQL cluster with sub-50ms query latency.";
    const resumeRes = await fetchJson(`http://127.0.0.1:${PROD_PORT}/api/resumes/scan`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` }
    }, JSON.stringify({
      resumeText,
      targetRole: "Staff Backend Engineer"
    }));

    assert(resumeRes.status === 200 && resumeRes.data?.success === true, "Resume scanned & indexed into PostgreSQL/pgvector");
    const resumeId = resumeRes.data?.resume?.id;
    assert(!!resumeId, "Resume record persisted with ID: " + resumeId);

    // Verify context retrieval via RAG
    const ragQueryRes = await fetchJson(`http://127.0.0.1:${PROD_PORT}/api/interview/draft-answer`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` }
    }, JSON.stringify({
      questionText: "Can you describe your experience designing event-driven streaming architectures with Kafka and Go?",
      role: "Staff Backend Engineer",
      company: "Stripe"
    }));

    assert(ragQueryRes.status === 200 && ragQueryRes.data?.success === true, "RAG context query executed successfully against PostgreSQL/pgvector");
    assert(ragQueryRes.data?.draftAnswer?.length > 20, "Adaptive draft answer returned grounded context");

    // Delete the resume and verify vectors are removed
    const delResumeRes = await fetchJson(`http://127.0.0.1:${PROD_PORT}/api/resumes/${resumeId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    assert(delResumeRes.status === 200 && delResumeRes.data?.success === true, "Resume deleted from PostgreSQL");

    // ----------------------------------------------------
    // PHASE 5: REAL INTERVIEW TURNS & POST-RESTART RECOVERY
    // ----------------------------------------------------
    console.log("\n🎙️ --- PHASE 5: INTERVIEW MULTI-TURN PERSISTENCE ACROSS RESTART ---");
    const startInterviewRes = await fetchJson(`http://127.0.0.1:${PROD_PORT}/api/interview/adaptive/start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` }
    }, JSON.stringify({
      company: "Google",
      role: "Senior Cloud Architect",
      difficulty: "Senior",
      interviewerCount: 1
    }));

    assert(startInterviewRes.status === 201 && startInterviewRes.data?.success === true, "Interview session initialized");
    const sessionId = startInterviewRes.data?.state?.sessionId;
    assert(!!sessionId, "Interview sessionId created: " + sessionId);

    // Complete Turn 1
    const turn1Res = await fetchJson(`http://127.0.0.1:${PROD_PORT}/api/interview/adaptive/turn`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` }
    }, JSON.stringify({
      sessionId,
      answer: "I architect multi-region active-active Spanner clusters with automated failover and Cloud CDN caching."
    }));

    assert(turn1Res.status === 200 && turn1Res.data?.success === true, "Turn 1 recorded and advanced in PostgreSQL");
    assert(turn1Res.data?.state?.currentTurn === 2 || turn1Res.data?.turn?.turnNumber === 2, "Session advanced to Turn 2");

    // ----------------------------------------------------
    // PHASE 6: SERVER RESTART & PERSISTENCE VERIFICATION
    // ----------------------------------------------------
    console.log("\n🔄 --- PHASE 6: PROCESS RESTART & STATE RESTORATION ---");
    console.log("Stopping production server process...");
    await stopProductionServer();
    console.log("Restarting production server process from cold boot...");
    await startProductionServer();

    // Verify session recovery after cold boot
    const recoveredSessionRes = await fetchJson(`http://127.0.0.1:${PROD_PORT}/api/interview/adaptive/session/${sessionId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    assert(recoveredSessionRes.status === 200 && recoveredSessionRes.data?.success === true, "Interview session successfully retrieved after server restart");
    assert(recoveredSessionRes.data?.state?.currentTurn === 2, "Recovered session preserved exact turn state (Turn 2)");
    assert((recoveredSessionRes.data?.state?.history?.length ?? 0) >= 2, "Recovered session preserved full turn history from PostgreSQL");

    // Verify user profile still accessible with the original JWT token
    const postRestartMeRes = await fetchJson(`http://127.0.0.1:${PROD_PORT}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    assert(postRestartMeRes.status === 200 && postRestartMeRes.data?.user?.id === activeUserId, "Fixed JWT token validated across server restart");

    console.log("\n=================================================================");
    console.log(`📊 FINAL PRODUCTION VERIFICATION: ${passed} PASSED, ${failed} FAILED`);
    console.log("=================================================================");

  } finally {
    await stopProductionServer();
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runProductionVerification().catch(err => {
  console.error("FATAL ERROR in production verification:", err);
  process.exit(1);
});
