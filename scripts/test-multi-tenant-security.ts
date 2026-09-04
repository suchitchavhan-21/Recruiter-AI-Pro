/**
 * Multi-Tenant Security & Tenant Boundary Enforcement Suite
 * 
 * Tests that User B cannot access, modify, list, or delete User A's private resources:
 * 1. Resumes
 * 2. STAR Stories
 * 3. Job Applications
 * 4. Adaptive Interview State & Turns
 */

import http from "http";
import { spawn, ChildProcess } from "child_process";

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

let passedCount = 0;
let failedCount = 0;

function check(condition: boolean, title: string, details?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${title}`);
    passedCount++;
  } else {
    console.error(`  ❌ [FAIL] ${title}${details ? ` - ${details}` : ""}`);
    failedCount++;
  }
}

async function startServer(port: number): Promise<ChildProcess> {
  const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
  const proc = spawn(npxCmd, ["tsx", "server.ts"], {
    env: {
      ...process.env,
      NODE_ENV: "development",
      PORT: String(port),
      JWT_SECRET: "test_multi_tenant_secret_access_key_123456!",
      JWT_REFRESH_SECRET: "test_multi_tenant_secret_refresh_key_123456!"
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
      // Waiting for server
    }
  }

  proc.kill();
  throw new Error(`Server failed to start on port ${port}`);
}

async function runSecurityAudit() {
  console.log("=================================================================");
  console.log("🔒 MULTI-TENANT ISOLATION & PRIVILEGE BOUNDARY SECURITY SUITE");
  console.log("=================================================================");

  const PORT = 3042;
  const proc = await startServer(PORT);
  const BASE = `http://127.0.0.1:${PORT}`;

  try {
    const timestamp = Date.now();
    const emailA = `tenant_a_${timestamp}@example.com`;
    const emailB = `tenant_b_${timestamp}@example.com`;
    const phoneA = "+1555" + Math.floor(1000000 + Math.random() * 9000000);
    const phoneB = "+1555" + Math.floor(1000000 + Math.random() * 9000000);
    const password = "TenantPassword123!";

    // 1. Register and Login User A
    const regA = await fetchJson(`${BASE}/api/auth/register`, { method: "POST" }, JSON.stringify({
      fullName: "Tenant A User",
      email: emailA,
      phoneNumber: phoneA,
      password,
      confirmPassword: password,
      agreeTerms: true
    }));
    if (regA.data?.verificationLink) {
      await fetchJson(regA.data.verificationLink);
    }
    const loginA = await fetchJson(`${BASE}/api/auth/login`, { method: "POST" }, JSON.stringify({
      email: emailA,
      password
    }));
    const tokenA = loginA.data?.accessToken;
    const headersA = { Authorization: `Bearer ${tokenA}` };
    check(Boolean(tokenA), "User A registered and authenticated successfully");

    // 2. Register and Login User B
    const regB = await fetchJson(`${BASE}/api/auth/register`, { method: "POST" }, JSON.stringify({
      fullName: "Tenant B User",
      email: emailB,
      phoneNumber: phoneB,
      password,
      confirmPassword: password,
      agreeTerms: true
    }));
    if (regB.data?.verificationLink) {
      await fetchJson(regB.data.verificationLink);
    }
    const loginB = await fetchJson(`${BASE}/api/auth/login`, { method: "POST" }, JSON.stringify({
      email: emailB,
      password
    }));
    const tokenB = loginB.data?.accessToken;
    const headersB = { Authorization: `Bearer ${tokenB}` };
    check(Boolean(tokenB), "User B registered and authenticated successfully");

    // 3. User A creates a Resume
    const scanA = await fetchJson(`${BASE}/api/scan-resume`, { method: "POST", headers: headersA }, JSON.stringify({
      fileName: "Confidential_Architect_A.txt",
      resumeText: "Top secret architectural blueprints and candidate proprietary patents for User A.",
      targetRole: "Staff Infrastructure Architect"
    }));
    const resumeIdA = scanA.data?.resume?.id;
    check(Boolean(resumeIdA), "User A created confidential resume");

    // 4. User B attempts cross-tenant DELETE on User A resume -> MUST be 404
    const deleteResumeCross = await fetchJson(`${BASE}/api/resumes/${resumeIdA}`, { method: "DELETE", headers: headersB });
    check(
      deleteResumeCross.status === 404,
      "User B cannot DELETE User A resume (rejected with 404 Not Found)",
      `Status: ${deleteResumeCross.status}`
    );

    // Verify User A resume is still safe
    const listResumesA = await fetchJson(`${BASE}/api/resumes`, { method: "GET", headers: headersA });
    const userAResumeExists = (listResumesA.data?.resumes || []).some((r: any) => r.id === resumeIdA);
    check(userAResumeExists, "User A resume remains completely intact and undisturbed");

    // 5. User A creates a STAR Story
    const saveStarA = await fetchJson(`${BASE}/api/star-stories`, { method: "POST", headers: headersA }, JSON.stringify({
      role: "Staff Infrastructure Architect",
      company: "Proprietary Quantum Inc",
      title: "Tenant A Executive Outage Resolution",
      situation: "Critical datacenter partition in US-East-1",
      task: "Restore Paxos quorum without data loss",
      action: "Applied forced epoch lease fencing",
      result: "Restored 100% quorum in under 3 minutes",
      expertStory: "Faced with a cross-region partition, I orchestrated emergency epoch lease fencing across all nodes to re-establish quorum."
    }));
    const starIdA = saveStarA.data?.story?.id;
    check(Boolean(starIdA), "User A created confidential STAR story");

    // 6. User B attempts cross-tenant DELETE on User A STAR story -> MUST be 404
    const deleteStarCross = await fetchJson(`${BASE}/api/star-stories/${starIdA}`, { method: "DELETE", headers: headersB });
    check(
      deleteStarCross.status === 404,
      "User B cannot DELETE User A STAR story (rejected with 404 Not Found)",
      `Status: ${deleteStarCross.status}`
    );

    // Verify User B STAR list does NOT leak User A story
    const listStarB = await fetchJson(`${BASE}/api/star-stories`, { method: "GET", headers: headersB });
    const userBSeesAStory = (listStarB.data?.stories || []).some((s: any) => s.id === starIdA);
    check(!userBSeesAStory, "User B star stories list is strictly partitioned (zero story leakage)");

    // 7. User A creates a Job Application
    const jobA = await fetchJson(`${BASE}/api/jobs`, { method: "POST", headers: headersA }, JSON.stringify({
      company: "Proprietary Quantum Inc",
      role: "Chief Architect",
      roleCategory: "Architecture",
      applicantName: "Tenant A User",
      applicantEmail: emailA,
      coverLetter: "Proprietary cover letter for User A only"
    }));
    const jobIdA = jobA.data?.application?.id;
    check(Boolean(jobIdA), "User A created confidential job application");

    // Verify User B jobs list does NOT leak User A application
    const listJobsB = await fetchJson(`${BASE}/api/jobs`, { method: "GET", headers: headersB });
    const userBSeesJobA = (listJobsB.data?.applications || []).some((j: any) => j.id === jobIdA);
    check(!userBSeesJobA, "User B job applications list is strictly partitioned (zero application leakage)");

    // 8. User A starts an Adaptive Interview
    const interviewA = await fetchJson(`${BASE}/api/interview/adaptive/start`, { method: "POST", headers: headersA }, JSON.stringify({
      role: "Staff Infrastructure Architect",
      company: "Proprietary Quantum Inc",
      difficulty: "Expert",
      interviewerCount: 2
    }));
    const sessionIdA = interviewA.data?.state?.sessionId || interviewA.data?.session?.sessionId || interviewA.data?.id;
    check(Boolean(sessionIdA), "User A started adaptive interview session");

    // 9. User B attempts cross-tenant GET on User A interview state -> MUST be 404
    const getInterviewCross = await fetchJson(`${BASE}/api/interview/adaptive/state/${sessionIdA}`, { method: "GET", headers: headersB });
    check(
      getInterviewCross.status === 404,
      "User B cannot GET User A interview state (rejected with 404 Not Found)",
      `Status: ${getInterviewCross.status}`
    );

    // 10. User B attempts cross-tenant submitTurn on User A session -> MUST fail
    const submitTurnCross = await fetchJson(`${BASE}/api/interview/adaptive/turn`, { method: "POST", headers: headersB }, JSON.stringify({
      sessionId: sessionIdA,
      answer: "Hijacked answer submitted by Tenant B"
    }));
    check(
      submitTurnCross.status !== 200,
      "User B cannot submit turns to User A interview session (strictly unauthorized)",
      `Status: ${submitTurnCross.status}`
    );

    // 11. Multi-Tenant Session Isolation & Revocation (IDOR Prevention)
    const sessionsA = await fetchJson(`${BASE}/api/profile/sessions`, { method: "GET", headers: headersA });
    const sessAId = sessionsA.data?.sessions?.[0]?.id;
    check(Boolean(sessAId), "User A has active session record listed");

    if (sessAId) {
      // User B attempts to revoke User A's session
      const crossRevoke = await fetchJson(`${BASE}/api/sessions/${sessAId}`, { method: "DELETE", headers: headersB });
      check(
        crossRevoke.status === 404,
        "User B cannot revoke User A session (IDOR prevented with 404 Not Found)",
        `Status: ${crossRevoke.status}`
      );

      // User A can revoke own session
      const ownRevoke = await fetchJson(`${BASE}/api/sessions/${sessAId}`, { method: "DELETE", headers: headersA });
      check(
        ownRevoke.status === 200,
        "User A can successfully revoke own session",
        `Status: ${ownRevoke.status}`
      );
    }

    // 12. Race-Safe Atomic Refresh Token Rotation Concurrency Check
    console.log("\n[TEST 12] Testing concurrent refresh token rotation race-safety...");
    const loginFresh = await fetchJson(`${BASE}/api/auth/login`, { method: "POST" }, JSON.stringify({
      email: emailA,
      password
    }));
    const freshRefreshToken = loginFresh.data?.refreshToken;
    check(Boolean(freshRefreshToken), "Issued fresh refresh token for concurrency testing");

    if (freshRefreshToken) {
      // Fire 5 concurrent refresh attempts with the exact same refresh token
      const refreshPromises = Array.from({ length: 5 }).map(() =>
        fetchJson(`${BASE}/api/auth/refresh`, { method: "POST" }, JSON.stringify({ refreshToken: freshRefreshToken }))
      );
      const refreshResults = await Promise.all(refreshPromises);
      const successCount = refreshResults.filter(r => r.status === 200).length;
      const rejectedCount = refreshResults.filter(r => r.status === 401).length;

      check(
        successCount === 1 && rejectedCount === 4,
        "Concurrent refresh token rotation is strictly race-safe (exactly 1 succeeded, 4 rejected)",
        `Successes: ${successCount}, Rejected: ${rejectedCount}`
      );
    }

    // 13. Route Ordering Check: candidate-memory and star-stories must NOT be shadowed by /:id
    console.log("\n[TEST 13] Verifying interview static route ordering (no shadowing by /:id)...");
    const memRes = await fetchJson(`${BASE}/api/interviews/candidate-memory`, { headers: headersA });
    check(memRes.status === 200, "GET /api/interviews/candidate-memory resolves correctly (HTTP 200, not shadowed)", `Status: ${memRes.status}`);

    const starRes = await fetchJson(`${BASE}/api/interviews/star-stories`, { headers: headersA });
    check(starRes.status === 200, "GET /api/interviews/star-stories resolves correctly (HTTP 200, not shadowed)", `Status: ${starRes.status}`);

    // 14. Admin Account Status Zod Enum Validation
    console.log("\n[TEST 14] Verifying admin status change schema validation...");
    const userIdA = loginA.data?.user?.id;
    const badStatusRes = await fetchJson(`${BASE}/api/admin/users/${userIdA}/status`, {
      method: "PATCH",
      headers: headersA
    }, JSON.stringify({ status: "arbitrary_unvalidated_status" }));
    check(
      badStatusRes.status === 400 || badStatusRes.status === 403,
      "Unvalidated admin status change strictly rejected with HTTP 400/403",
      `Status: ${badStatusRes.status}`
    );

    // 15. Resume Upload: Oversized Decoded Base64 File Size Rejection
    console.log("\n[TEST 15] Verifying decoded base64 resume file size limit...");
    const oversizedBase64 = Buffer.alloc(11 * 1024 * 1024, "A").toString("base64"); // 11MB decoded
    const oversizedRes = await fetchJson(`${BASE}/api/resumes/upload`, {
      method: "POST",
      headers: headersA
    }, JSON.stringify({ base64Data: oversizedBase64, fileName: "oversized.pdf" }));
    check(
      oversizedRes.status === 413 || (oversizedRes.status === 400 && oversizedRes.data?.error?.code === "FILE_TOO_LARGE"),
      "Oversized decoded base64 resume upload rejected with HTTP 413 or 400 FILE_TOO_LARGE",
      `Status: ${oversizedRes.status}`
    );

    // 16. Resume Upload: Malformed PDF Rejection
    console.log("\n[TEST 16] Verifying malformed PDF rejection...");
    const corruptPdfBase64 = Buffer.from("%PDF-1.4\nCorrupted Binary Stream That Cannot Be Parsed").toString("base64");
    const corruptPdfRes = await fetchJson(`${BASE}/api/resumes/upload`, {
      method: "POST",
      headers: headersA
    }, JSON.stringify({ base64Data: corruptPdfBase64, fileName: "corrupt.pdf" }));
    check(
      corruptPdfRes.status === 400,
      "Malformed PDF document rejected with HTTP 400 parsing error",
      `Status: ${corruptPdfRes.status}`
    );

    // 17. Resume Upload: Legacy .doc Format Rejection
    console.log("\n[TEST 17] Verifying legacy Word (.doc) format rejection...");
    const legacyDocBase64 = Buffer.from("Legacy Word Binary Content").toString("base64");
    const legacyDocRes = await fetchJson(`${BASE}/api/resumes/upload`, {
      method: "POST",
      headers: headersA
    }, JSON.stringify({ base64Data: legacyDocBase64, fileName: "resume.doc" }));
    check(
      legacyDocRes.status === 400,
      "Legacy binary .doc format rejected with HTTP 400 UNSUPPORTED_FORMAT",
      `Status: ${legacyDocRes.status}`
    );

  } finally {
    try {
      if (proc.pid) {
        if (process.platform === "win32") {
          spawn("taskkill", ["/pid", String(proc.pid), "/T", "/F"], { shell: true });
        } else {
          proc.kill();
        }
      }
    } catch {}
  }

  console.log("=================================================================");
  console.log(`📊 MULTI-TENANT SECURITY SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=================================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runSecurityAudit().catch(err => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
