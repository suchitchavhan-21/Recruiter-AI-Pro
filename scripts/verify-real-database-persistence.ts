import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { spawn, ChildProcess } from "child_process";
import { queryPostgres, isPgVectorAvailable, initPostgresSchema } from "../src/server/db/postgres";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function startServer(port: number): Promise<ChildProcess> {
  const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
  const proc = spawn(npxCmd, ["tsx", "server.ts"], {
    env: {
      ...process.env,
      NODE_ENV: "development",
      PORT: String(port),
      JWT_SECRET: "test_jwt_secret_token_recruiter_ai_pro_2026_long_secret_key",
      JWT_REFRESH_SECRET: "test_jwt_refresh_secret_token_recruiter_ai_pro_2026_long_secret_key"
    },
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
    shell: true
  });

  for (let i = 0; i < 40; i++) {
    await delay(500);
    try {
      const health = await fetchJson(`http://127.0.0.1:${port}/api/health`);
      if (health.status === 200 && health.data?.status === "ok") {
        return proc;
      }
    } catch {
      // Waiting
    }
  }

  proc.kill();
  throw new Error(`Server failed to start on port ${port}`);
}

async function runPersistenceVerification() {
  console.log("================================================================================");
  console.log("     DATABASE & CROSS-PROCESS PERSISTENCE VERIFICATION (PGVECTOR + RESTART)     ");
  console.log("================================================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, label: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${label}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${label}`);
      failed++;
    }
  }

  try {
    // 1. Database & pgvector Direct Operations Test
    console.log("\n[STAGE 1] Testing Database Connection & pgvector cosine similarity...");
    await initPostgresSchema();
    const hasVector = await isPgVectorAvailable();
    assert(hasVector, "pgvector extension is verified active in database");

    await queryPostgres(`
      CREATE TABLE IF NOT EXISTS test_vector_persistence (
        id VARCHAR(50) PRIMARY KEY,
        label TEXT NOT NULL,
        embedding vector(768)
      );
    `);

    // Create 768d vector
    const vecA = new Array(768).fill(0);
    vecA[0] = 1.0;
    const vecB = new Array(768).fill(0);
    vecB[0] = 0.9;
    vecB[1] = 0.1;

    await queryPostgres(
      `INSERT INTO test_vector_persistence (id, label, embedding) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET embedding = $3;`,
      ["vec-1", "Reference Vector A", `[${vecA.join(",")}]`]
    );
    await queryPostgres(
      `INSERT INTO test_vector_persistence (id, label, embedding) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET embedding = $3;`,
      ["vec-2", "Similar Vector B", `[${vecB.join(",")}]`]
    );

    const queryRes = await queryPostgres(`
      SELECT id, label, embedding <=> $1 AS distance
      FROM test_vector_persistence
      ORDER BY embedding <=> $1 ASC
      LIMIT 2;
    `, [`[${vecA.join(",")}]`]);

    assert(queryRes.rows.length >= 2, "pgvector cosine distance query returns matching vectors");
    assert(queryRes.rows[0].id === "vec-1" && Math.abs(queryRes.rows[0].distance) < 0.001, "Nearest neighbor vector distance is ~0");
    await queryPostgres(`DROP TABLE IF EXISTS test_vector_persistence;`);

    // 2. Cross-Process Persistence: Process A creates records
    console.log("\n[STAGE 2] Starting Process A (Port 3020) to create records...");
    const procA = await startServer(3020);
    console.log("  ✓ Process A started on port 3020");

    const email = `restart_test_${Date.now()}@example.com`;
    const password = "Password123!";
    const regRes = await fetchJson("http://127.0.0.1:3020/api/auth/register", { method: "POST" }, JSON.stringify({
      fullName: "Persistence Test Candidate",
      email,
      phoneNumber: "+1555" + Math.floor(1000000 + Math.random() * 9000000),
      password,
      confirmPassword: password,
      agreeTerms: true
    }));
    assert(regRes.status === 201, "Process A: Created user account");
    if (regRes.data?.verificationLink) {
      await fetchJson(regRes.data.verificationLink);
    }

    const loginResA = await fetchJson("http://127.0.0.1:3020/api/auth/login", { method: "POST" }, JSON.stringify({ email, password }));
    const tokenA = loginResA.data?.accessToken;
    const headersA = { Authorization: `Bearer ${tokenA}` };

    // Process A creates Resume
    const scanRes = await fetchJson("http://127.0.0.1:3020/api/scan-resume", { method: "POST", headers: headersA }, JSON.stringify({
      fileName: "Persistent_Resume.txt",
      resumeText: "Principal Distributed Systems Engineer with 10 years experience building Raft and Paxos consensus engines in Go and Rust.",
      targetRole: "Principal Engineer"
    }));
    assert(scanRes.status === 200, "Process A: Saved resume scan with pgvector embeddings");
    const resumeId = scanRes.data?.resume?.id;

    // Process A records Job Application
    const jobRes = await fetchJson("http://127.0.0.1:3020/api/jobs", { method: "POST", headers: headersA }, JSON.stringify({
      company: "Stripe",
      role: "Principal Infrastructure Engineer",
      roleCategory: "Distributed Systems",
      applicantName: "Persistence Test Candidate",
      applicantEmail: email,
      coverLetter: "10+ years scaling low-latency services.",
      notes: "Advisory locks and lease coordination."
    }));
    assert(jobRes.status === 201, "Process A: Recorded job application");
    const jobId = jobRes.data?.application?.id;

    // Process A starts Adaptive Interview Session
    const adaptiveRes = await fetchJson("http://127.0.0.1:3020/api/interview/adaptive/start", { method: "POST", headers: headersA }, JSON.stringify({
      role: "Principal Infrastructure Engineer",
      company: "Stripe",
      difficulty: "Expert",
      interviewerCount: 2,
      questions: [
        { id: 1, text: "How do you guarantee linearizable reads in a distributed key-value database?", type: "technical" }
      ]
    }));
    assert(adaptiveRes.status === 200 || adaptiveRes.status === 201, "Process A: Created adaptive interview session");
    const sessionId = adaptiveRes.data?.state?.sessionId;

    // Process A saves STAR Story
    const starRes = await fetchJson("http://127.0.0.1:3020/api/star-stories", { method: "POST", headers: headersA }, JSON.stringify({
      title: "Consensus Pipeline Migration",
      role: "Principal Infrastructure Engineer",
      company: "Stripe",
      situation: "Consensus pipeline bottleneck under 50k QPS.",
      task: "Redesign consensus pipelining.",
      action: "Implemented asynchronous batching with Raft in Rust.",
      result: "P99 latency decreased from 45ms to 8ms.",
      expertStory: "Asynchronous batching Raft pipeline."
    }));
    assert(starRes.status === 201, "Process A: Created STAR story");
    const storyId = starRes.data?.story?.id;

    // Terminate Process A
    console.log("\n[STAGE 3] Terminating Process A completely...");
    procA.kill();
    await delay(1000);
    console.log("  ✓ Process A is terminated.");

    // 3. Process B spawns fresh on Port 3021 and verifies persistence
    console.log("\n[STAGE 4] Starting Process B (Port 3021) to verify database persistence...");
    const procB = await startServer(3021);
    console.log("  ✓ Process B started on port 3021");

    // Login via Process B
    const loginResB = await fetchJson("http://127.0.0.1:3021/api/auth/login", { method: "POST" }, JSON.stringify({ email, password }));
    assert(loginResB.status === 200 && Boolean(loginResB.data?.accessToken), "Process B: Logged in as existing user created by Process A");
    const tokenB = loginResB.data?.accessToken;
    const headersB = { Authorization: `Bearer ${tokenB}` };

    // Verify Profile
    const profileResB = await fetchJson("http://127.0.0.1:3021/api/profile", { headers: headersB });
    assert(profileResB.status === 200 && profileResB.data?.user?.email === email, "Process B: User profile persisted across server restart");

    // Verify Resumes
    const resumesResB = await fetchJson("http://127.0.0.1:3021/api/resumes", { headers: headersB });
    assert(resumesResB.status === 200 && resumesResB.data?.resumes?.some((r: any) => r.id === resumeId), "Process B: Resume and vector data persisted across server restart");

    // Verify Job Applications
    const jobsResB = await fetchJson("http://127.0.0.1:3021/api/jobs", { headers: headersB });
    assert(jobsResB.status === 200 && jobsResB.data?.applications?.some((j: any) => j.id === jobId), "Process B: Job application persisted across server restart");

    // Verify Adaptive Session State
    if (sessionId) {
      const stateResB = await fetchJson(`http://127.0.0.1:3021/api/interview/adaptive/state/${sessionId}`, { headers: headersB });
      assert(stateResB.status === 200 && stateResB.data?.state?.sessionId === sessionId, "Process B: Adaptive interview session persisted across server restart");
    }

    // Verify STAR Stories
    const starResB = await fetchJson("http://127.0.0.1:3021/api/star-stories", { headers: headersB });
    assert(starResB.status === 200 && starResB.data?.stories?.some((s: any) => s.id === storyId), "Process B: STAR story persisted across server restart");

    // Terminate Process B
    procB.kill();
    await delay(500);

    console.log("\n================================================================================");
    console.log(`PERSISTENCE AUDIT: ${passed + failed} TOTAL | ${passed} PASSED | ${failed} FAILED`);
    console.log("================================================================================");

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }

  } catch (err: any) {
    console.error("Database persistence verification failed:", err);
    process.exit(1);
  }
}

runPersistenceVerification();
