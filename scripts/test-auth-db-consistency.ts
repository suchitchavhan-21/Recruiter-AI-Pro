import http from "http";
import { queryPostgres, isPostgresActive, initPostgresSchema, closePostgresPool } from "../src/server/db/postgres";
import { createExpressApp } from "../src/server/app";
import { findUserByEmail, insertResume, insertApplication, insertInterview, insertSTARStory, listResumesByUserId, listApplicationsByUserId, listInterviewsByUserId } from "../src/server/db/repository";
import { generateUUID } from "../src/server/db/repository";

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

function fetchJson(url: string, options: http.RequestOptions = {}, postData?: string): Promise<{ status: number; data: any; headers: http.IncomingHttpHeaders }> {
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
          resolve({ status: res.statusCode || 200, data: parsedData, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode || 200, data: null, headers: res.headers });
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

async function runAuthDbConsistencyTests() {
  console.log("=================================================================");
  console.log("🔒 DATABASE ROUTING, PERSISTENCE & AUTHENTICATION CONSISTENCY TEST");
  console.log("=================================================================\n");

  // Step 1: Database Initialization
  console.log("[PHASE 1] Initializing Canonical Database...");
  const initOk = await initPostgresSchema();
  check(initOk, "PostgreSQL/PGlite schema initialized successfully");
  check(isPostgresActive(), "Canonical isPostgresActive() returns true in development");

  // Step 2: Test Server Setup
  const app = createExpressApp();
  const server = http.createServer(app);
  const TEST_PORT = 3088;
  await new Promise<void>((resolve) => server.listen(TEST_PORT, "127.0.0.1", resolve));
  console.log(`[TEST SERVER] Active on http://127.0.0.1:${TEST_PORT}\n`);

  try {
    // Step 3: Health & Readiness Endpoints
    console.log("[PHASE 2] Testing System Probes...");
    const health = await fetchJson(`http://127.0.0.1:${TEST_PORT}/api/health`);
    check(health.status === 200 && health.data.status === "ok", "Liveness probe GET /api/health returns HTTP 200 OK");

    const readiness = await fetchJson(`http://127.0.0.1:${TEST_PORT}/api/readiness`);
    check(readiness.status === 200 && readiness.data.status === "ready", "Readiness probe GET /api/readiness returns HTTP 200 ready", `Got status ${readiness.status}: ${JSON.stringify(readiness.data)}`);
    check(readiness.data.persistence?.database === "postgresql", "Readiness confirms canonical database is postgresql");

    // Step 4: Seeded User Logins
    console.log("\n[PHASE 3] Verifying Seeded Accounts Login...");
    const candLogin = await fetchJson(`http://127.0.0.1:${TEST_PORT}/api/login`, { method: "POST" }, JSON.stringify({
      email: "candidate@example.com",
      password: "CandidatePassword123!"
    }));
    check(candLogin.status === 200 && candLogin.data.success, "Seeded candidate@example.com logs in successfully with HTTP 200");
    check(Boolean(candLogin.data.accessToken), "Login response returns valid JWT accessToken");

    const adminLogin = await fetchJson(`http://127.0.0.1:${TEST_PORT}/api/login`, { method: "POST" }, JSON.stringify({
      email: "admin@coach.ai",
      password: "AdminPassword123!"
    }));
    check(adminLogin.status === 200 && adminLogin.data.user?.role === "admin", "Seeded admin@coach.ai logs in successfully with admin role");

    // Step 5: New User Registration & Lifecycle
    console.log("\n[PHASE 4] Registering New User & Testing Authentication Invariants...");
    const testId = Date.now();
    const testEmail = `test_engineer_${testId}@example.com`;
    const testPhone = `+1 555-${String(testId).slice(-7)}`;
    const testPassword = "StrongSecurePassword999!";

    const regRes = await fetchJson(`http://127.0.0.1:${TEST_PORT}/api/register`, { method: "POST" }, JSON.stringify({
      fullName: "Test Verification Engineer",
      email: testEmail,
      phoneNumber: testPhone,
      password: testPassword,
      confirmPassword: testPassword,
      agreeTerms: true
    }));
    check(regRes.status === 201 && regRes.data.success, "User registration succeeds with HTTP 201 Created");
    const createdUser = regRes.data.user;

    // Verify User in Database
    const dbUser = await findUserByEmail(testEmail);
    check(dbUser !== null && dbUser.id === createdUser.id, "Registered user exists in active PostgreSQL database");

    // Test: Wrong password rejected
    const wrongPassRes = await fetchJson(`http://127.0.0.1:${TEST_PORT}/api/login`, { method: "POST" }, JSON.stringify({
      email: testEmail,
      password: "WrongPassword123!"
    }));
    check(wrongPassRes.status === 401 && wrongPassRes.data.error?.code === "INVALID_CREDENTIALS", "Incorrect password rejected with HTTP 401 INVALID_CREDENTIALS");

    // Test: Nonexistent email rejected
    const nonexistentRes = await fetchJson(`http://127.0.0.1:${TEST_PORT}/api/login`, { method: "POST" }, JSON.stringify({
      email: "nonexistent_ghost_user@example.com",
      password: "AnyPassword123!"
    }));
    check(nonexistentRes.status === 401 && nonexistentRes.data.error?.code === "INVALID_CREDENTIALS", "Nonexistent email rejected with HTTP 401 INVALID_CREDENTIALS");

    // Test: Malformed payload rejected
    const malformedRes = await fetchJson(`http://127.0.0.1:${TEST_PORT}/api/login`, { method: "POST" }, JSON.stringify({
      email: "not-an-email"
    }));
    check(malformedRes.status === 400, "Malformed login request without valid email/password rejected with HTTP 400");

    // Activate and verify email for login
    await queryPostgres("UPDATE users SET email_verified = TRUE, account_status = 'active' WHERE id = $1;", [createdUser.id]);

    // Test: Valid login
    const loginRes = await fetchJson(`http://127.0.0.1:${TEST_PORT}/api/login`, { method: "POST" }, JSON.stringify({
      email: testEmail,
      password: testPassword
    }));
    check(loginRes.status === 200 && loginRes.data.success, "Registered user logs in successfully with HTTP 200 OK");
    const userToken = loginRes.data.accessToken;

    // Test: Authenticated Request
    const profileRes = await fetchJson(`http://127.0.0.1:${TEST_PORT}/api/profile`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${userToken}` }
    });
    const retrievedUserId = profileRes.data.user?.id || profileRes.data.id;
    check(profileRes.status === 200 && retrievedUserId === createdUser.id, "Authenticated request to /api/profile succeeds with user profile");

    // Test: Unauthenticated Request
    const unauthRes = await fetchJson(`http://127.0.0.1:${TEST_PORT}/api/profile`, { method: "GET" });
    check(unauthRes.status === 401, "Unauthenticated request to /api/profile rejected with HTTP 401");

    // Step 6: Database Consistency Across Related Entities
    console.log("\n[PHASE 5] Testing Database Consistency Across Resumes, Jobs & Interviews...");
    const resumeId = generateUUID();
    await insertResume({
      id: resumeId,
      userId: createdUser.id,
      resumeName: "Principal_Architect.pdf",
      fileSize: 10240,
      fileMimeType: "application/pdf",
      atsScore: 92,
      matchScore: 95,
      targetRole: "Staff Systems Engineer",
      parsedContent: "Experienced distributed systems and PostgreSQL engineer.",
      analysis: { score: 92 },
      suggestions: ["Add more cloud benchmarks"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const appId = generateUUID();
    await insertApplication({
      id: appId,
      userId: createdUser.id,
      company: "Cloud Distributed Systems Inc",
      role: "Staff Systems Engineer",
      roleCategory: "Engineering",
      applicantName: createdUser.fullName,
      applicantEmail: createdUser.email,
      status: "Submitted",
      coverLetter: "Experienced distributed systems and PostgreSQL engineer.",
      matchScore: 95,
      notes: "Direct candidate application",
      appliedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const interviewId = generateUUID();
    await insertInterview({
      id: interviewId,
      userId: createdUser.id,
      company: "Cloud Distributed Systems Inc",
      role: "Staff Systems Engineer",
      difficulty: "Senior",
      interviewerCount: 2,
      persona: "technical",
      state: "COMPLETED",
      score: 94,
      questions: ["Describe consensus protocols in distributed stores."],
      answers: ["Raft and Paxos ensure linearizable state transitions."],
      evaluation: { feedback: "Strong systems architecture depth" },
      sessionState: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const storyId = generateUUID();
    await insertSTARStory({
      id: storyId,
      userId: createdUser.id,
      role: "Staff Systems Engineer",
      company: "Cloud Distributed Systems Inc",
      title: "Zero Downtime Database Migration",
      situation: "Legacy JSON storage needed migration to PostgreSQL",
      task: "Design idempotent dual-write and data sync pipeline",
      action: "Implemented canonical database routing with ON CONFLICT DO NOTHING",
      result: "Achieved 100% login reliability and data preservation",
      expertStory: "Migrated state safely into PostgreSQL with full idempotency.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Verify Direct SQL Consistency
    const checkUsersSql = await queryPostgres("SELECT id, email FROM users WHERE id = $1;", [createdUser.id]);
    const checkResumeSql = await queryPostgres("SELECT id, user_id FROM resumes WHERE id = $1;", [resumeId]);
    const checkAppSql = await queryPostgres("SELECT id, user_id FROM applications WHERE id = $1;", [appId]);
    const checkIntSql = await queryPostgres("SELECT id, user_id FROM interviews WHERE id = $1;", [interviewId]);
    const checkStorySql = await queryPostgres("SELECT id, user_id FROM star_stories WHERE id = $1;", [storyId]);

    check(checkUsersSql.rows.length === 1, "User stored in active PostgreSQL database");
    check(checkResumeSql.rows[0]?.user_id === createdUser.id, "Resume stored in SAME active database with matching foreign key");
    check(checkAppSql.rows[0]?.user_id === createdUser.id, "Application stored in SAME active database with matching foreign key");
    check(checkIntSql.rows[0]?.user_id === createdUser.id, "Interview stored in SAME active database with matching foreign key");
    check(checkStorySql.rows[0]?.user_id === createdUser.id, "STAR Story stored in SAME active database with matching foreign key");

    // Step 7: Restart / Re-initialization Durability
    console.log("\n[PHASE 6] Testing Application Re-initialization & Persistence Across Restart...");
    // Simulate server and pool restart
    await closePostgresPool();
    await initPostgresSchema();

    // Verify Login again after restart
    const loginAfterRestart = await fetchJson(`http://127.0.0.1:${TEST_PORT}/api/login`, { method: "POST" }, JSON.stringify({
      email: testEmail,
      password: testPassword
    }));
    check(loginAfterRestart.status === 200 && loginAfterRestart.data.success, "User logs in successfully AFTER database re-initialization (restart)");

    // Verify data accessible after restart
    const userResumes = await listResumesByUserId(createdUser.id);
    check(userResumes.length >= 1 && userResumes[0].id === resumeId, "User's resumes retrieved correctly after restart");

    const userApps = await listApplicationsByUserId(createdUser.id);
    check(userApps.length >= 1 && userApps[0].id === appId, "User's applications retrieved correctly after restart");

    const userInts = await listInterviewsByUserId(createdUser.id);
    check(userInts.length >= 1 && userInts[0].id === interviewId, "User's interviews retrieved correctly after restart");

    console.log("\n=================================================================");
    console.log(`📊 CONSISTENCY TEST AUDIT: ${passCount} PASSED, ${failCount} FAILED`);
    console.log("=================================================================");
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await closePostgresPool();
  }

  process.exit(failCount > 0 ? 1 : 0);
}

runAuthDbConsistencyTests().catch(err => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});

