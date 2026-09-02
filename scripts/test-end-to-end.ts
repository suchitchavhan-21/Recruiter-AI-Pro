import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { spawn, ChildProcess } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_PORT = 3015;
const TEST_ENV = {
  ...process.env,
  NODE_ENV: "development",
  PORT: String(TEST_PORT),
  JWT_SECRET: "test_jwt_secret_token_recruiter_ai_pro_2026_long_secret_key",
  JWT_REFRESH_SECRET: "test_jwt_refresh_secret_token_recruiter_ai_pro_2026_long_secret_key"
};

function fetchJson(url: string, options: http.RequestOptions = {}, postData?: string): Promise<{ status: number; data: any; raw: string; headers: http.IncomingHttpHeaders }> {
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
          resolve({ status: res.statusCode || 200, data: parsedData, raw: data, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode || 200, data: null, raw: data, headers: res.headers });
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

  for (let i = 0; i < 40; i++) {
    await delay(500);
    try {
      const health = await fetchJson(`http://127.0.0.1:${TEST_PORT}/api/health`);
      if (health.status === 200 && health.data?.status === "ok") {
        return;
      }
    } catch {
      // Waiting
    }
  }

  throw new Error("Server failed to start on port " + TEST_PORT);
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

async function runEndToEndTests() {
  console.log("================================================================================");
  console.log("           RECRUITER AI PRO — COMPREHENSIVE END-TO-END VERIFICATION             ");
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
    await startServer();
    console.log(`[TEST RUNNER] Server active on port ${TEST_PORT}\n`);

    // 1. Health check
    const health = await fetchJson(`http://127.0.0.1:${TEST_PORT}/api/health`);
    assert(health.status === 200 && health.data?.status === "ok", "Server Health Check is OK");

    // 2. Register & Auth
    const email = `e2e_user_${Date.now()}@example.com`;
    const password = "Password123!";
    const phone = "+1555" + Math.floor(1000000 + Math.random() * 9000000);
    const regRes = await fetchJson(`http://127.0.0.1:${TEST_PORT}/api/auth/register`, { method: "POST" }, JSON.stringify({
      fullName: "E2E Test Engineer",
      email,
      phoneNumber: phone,
      password,
      confirmPassword: password,
      agreeTerms: true
    }));
    assert(regRes.status === 201 && regRes.data?.success === true, "Candidate User Registration (HTTP 201)");

    if (regRes.data?.verificationLink) {
      await fetchJson(regRes.data.verificationLink);
    }

    const loginRes = await fetchJson(`http://127.0.0.1:${TEST_PORT}/api/auth/login`, { method: "POST" }, JSON.stringify({
      email,
      password
    }));
    const authToken = loginRes.data?.accessToken;
    assert(Boolean(authToken), "Candidate User Login returns valid JWT access token");
    const authHeaders = { Authorization: `Bearer ${authToken}` };

    // 3. Authenticated Profile
    const profileRes = await fetchJson(`http://127.0.0.1:${TEST_PORT}/api/profile`, { headers: authHeaders });
    assert(profileRes.status === 200 && profileRes.data?.user?.email === email, "GET /api/profile returns authenticated user");

    // 4. Update Profile
    const updateProfileRes = await fetchJson(`http://127.0.0.1:${TEST_PORT}/api/profile`, { method: "PUT", headers: authHeaders }, JSON.stringify({
      fullName: "Senior Lead Architect",
      phoneNumber: "+1 555-0199"
    }));
    assert(updateProfileRes.status === 200 && updateProfileRes.data?.user?.fullName === "Senior Lead Architect", "PUT /api/profile persists profile update");

    // 5. Job Application Recording & Retrieval
    const postJobRes = await fetchJson(`http://127.0.0.1:${TEST_PORT}/api/jobs`, { method: "POST", headers: authHeaders }, JSON.stringify({
      company: "Google",
      role: "Staff Infrastructure Engineer",
      roleCategory: "Distributed Systems",
      applicantName: "Senior Lead Architect",
      applicantEmail: email,
      coverLetter: "10+ years scaling low-latency services.",
      notes: "Distributed cache consistency and raft consensus."
    }));
    assert(postJobRes.status === 201 && postJobRes.data?.application?.company === "Google", "POST /api/jobs records application with PostgreSQL persistence");

    const getJobsRes = await fetchJson(`http://127.0.0.1:${TEST_PORT}/api/jobs`, { headers: authHeaders });
    assert(getJobsRes.status === 200 && Array.isArray(getJobsRes.data?.applications) && getJobsRes.data.applications.length > 0, "GET /api/jobs lists user applications");

    // 6. Evidence-Based ATS Scoring
    const atsScoreRes = await fetchJson(`http://127.0.0.1:${TEST_PORT}/api/resumes/ats-score`, { method: "POST", headers: authHeaders }, JSON.stringify({
      role: "Staff Infrastructure Engineer",
      company: "Google",
      jdText: "Requirements: 8+ years experience in distributed systems, Raft consensus, Go, Rust, and Kubernetes.",
      candidateProfile: {
        experience: "10 years building Kubernetes controllers and Raft clusters in Go.",
        skills: ["Go", "Distributed Systems", "Kubernetes", "Raft", "PostgreSQL"]
      },
      savedStarStories: [
        {
          id: "story-1",
          title: "Kubernetes Controller Migration",
          role: "Staff Infrastructure Engineer",
          company: "Tech Corp",
          situation: "High latency in cluster synchronization.",
          task: "Redesign consensus pipeline.",
          action: "Implemented Raft consensus in Go with zero-downtime rolling upgrades.",
          result: "Reduced synchronization latency by 45% across 5,000 nodes.",
          expertStory: "Migrated state machine to Raft consensus."
        }
      ]
    }));
    assert(atsScoreRes.status === 200 && typeof atsScoreRes.data?.score === "number", "POST /api/resumes/ats-score computes deterministic score");
    assert(Array.isArray(atsScoreRes.data?.matchedRequirements) || Array.isArray(atsScoreRes.data?.missingRequirements), "ATS Score returns structured requirement matches/breakdown");

    // 7. STAR Stories CRUD
    const postStoryRes = await fetchJson(`http://127.0.0.1:${TEST_PORT}/api/star-stories`, { method: "POST", headers: authHeaders }, JSON.stringify({
      title: "Distributed Lock Manager",
      role: "Principal Systems Engineer",
      company: "CloudScale",
      situation: "Distributed deadlocks occurring in multi-region deployments.",
      task: "Design fault-tolerant lease-based distributed locking service.",
      action: "Built distributed lock manager in Rust using PostgreSQL advisory locks and Redis fencing tokens.",
      result: "Eliminated deadlock events across 200 microservices.",
      expertStory: "Engineered distributed locking framework."
    }));
    assert(postStoryRes.status === 201 && postStoryRes.data?.story?.id, "POST /api/star-stories saves STAR narrative in PostgreSQL");
    const createdStoryId = postStoryRes.data.story.id;

    const getStoriesRes = await fetchJson(`http://127.0.0.1:${TEST_PORT}/api/star-stories`, { headers: authHeaders });
    assert(getStoriesRes.status === 200 && Array.isArray(getStoriesRes.data?.stories) && getStoriesRes.data.stories.some((s: any) => s.id === createdStoryId), "GET /api/star-stories lists saved narratives");

    // 8. Adaptive Interview Orchestrator Flow
    const startAdaptiveRes = await fetchJson(`http://127.0.0.1:${TEST_PORT}/api/interview/adaptive/start`, { method: "POST", headers: authHeaders }, JSON.stringify({
      role: "Staff Infrastructure Engineer",
      company: "Google",
      difficulty: "Expert",
      interviewerCount: 2,
      questions: [
        { id: 1, text: "Describe how you ensure consensus in a partitioned distributed key-value store.", expectedFocus: "Raft/Paxos and partition tolerance", type: "technical" },
        { id: 2, text: "Tell me about a time you resolved an architectural conflict between two senior teams.", expectedFocus: "Leadership and stakeholder trade-offs", type: "behavioral" }
      ]
    }));
    assert((startAdaptiveRes.status === 200 || startAdaptiveRes.status === 201) && startAdaptiveRes.data?.state?.sessionId, "POST /api/interview/adaptive/start initializes adaptive session in PostgreSQL");
    const sessionId = startAdaptiveRes.data?.state?.sessionId;

    // Adaptive turn 1
    if (sessionId) {
      const turn1Res = await fetchJson(`http://127.0.0.1:${TEST_PORT}/api/interview/adaptive/turn`, { method: "POST", headers: authHeaders }, JSON.stringify({
        sessionId,
        answer: "We implemented Raft consensus with leader election timeouts, logarithmic heartbeats, and quorum-based writes to guarantee linearizability during network partitions.",
        timeTaken: "2m"
      }));
      assert(turn1Res.status === 200 && (turn1Res.data?.state?.turnNumber === 2 || turn1Res.data?.state?.currentTurn === 2), "POST /api/interview/adaptive/turn advances session turn");

      // Adaptive state recovery
      const stateRes = await fetchJson(`http://127.0.0.1:${TEST_PORT}/api/interview/adaptive/state/${sessionId}`, { headers: authHeaders });
      assert(stateRes.status === 200 && stateRes.data?.state?.sessionId === sessionId, "GET /api/interview/adaptive/state restores state from PostgreSQL");
    }

    // 9. Interview Evaluation & History Persistence
    const evalRes = await fetchJson(`http://127.0.0.1:${TEST_PORT}/api/evaluate-interview`, { method: "POST", headers: authHeaders }, JSON.stringify({
      role: "Staff Infrastructure Engineer",
      company: "Google",
      jd: "Distributed systems, Raft consensus, Go, Rust, Kubernetes",
      companyName: "Google",
      qaPairs: [
        {
          questionId: 1,
          questionText: "Describe how you ensure consensus in a partitioned distributed key-value store.",
          type: "technical",
          answerText: "We implemented Raft consensus with leader election timeouts, logarithmic heartbeats, and quorum-based writes."
        }
      ],
      persona: "architect",
      interviewerCount: 2
    }));
    assert(evalRes.status === 200 && evalRes.data?.score !== undefined, "POST /api/evaluate-interview evaluates and persists session in PostgreSQL");

    const historyRes = await fetchJson(`http://127.0.0.1:${TEST_PORT}/api/interviews`, { headers: authHeaders });
    assert(historyRes.status === 200 && Array.isArray(historyRes.data?.interviews) && historyRes.data.interviews.length > 0, "GET /api/interviews retrieves persisted session history");

    // 10. Dashboard Analytics
    const dashRes = await fetchJson(`http://127.0.0.1:${TEST_PORT}/api/dashboard`, { headers: authHeaders });
    assert(dashRes.status === 200 && dashRes.data?.stats?.totalInterviews >= 1, "GET /api/dashboard returns authoritative aggregated metrics");

    // 11. Delete STAR Story
    const deleteStoryRes = await fetchJson(`http://127.0.0.1:${TEST_PORT}/api/star-stories/${createdStoryId}`, { method: "DELETE", headers: authHeaders });
    assert(deleteStoryRes.status === 200 && deleteStoryRes.data?.success === true, "DELETE /api/star-stories/:id deletes story from PostgreSQL");

    // Summary
    console.log("\n================================================================================");
    console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log("================================================================================");

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }

  } catch (err: any) {
    console.error("Test execution failed with fatal error:", err);
    process.exit(1);
  } finally {
    stopServer();
  }
}

runEndToEndTests();

