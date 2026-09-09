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
      res.on("error", reject);
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

function extractTokenFromCookies(headers: http.IncomingHttpHeaders): string | undefined {
  return extractCookieFromHeaders(headers, "access_token");
}

function extractCookieFromHeaders(headers: http.IncomingHttpHeaders, name: string): string | undefined {
  const setCookie = headers["set-cookie"];
  if (!setCookie) return undefined;
  const list = Array.isArray(setCookie) ? setCookie : [setCookie];
  for (const item of list) {
    const match = item.match(new RegExp(`${name}=([^;]+)`));
    if (match) return match[1];
  }
  return undefined;
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

const TEST_SEC_DIR = path.join(process.cwd(), "data", "test_security_data");

async function startServer(port: number): Promise<ChildProcess> {
  if (fs.existsSync(TEST_SEC_DIR)) {
    try { fs.rmSync(TEST_SEC_DIR, { recursive: true, force: true }); } catch {}
  }

  const tsxCli = path.resolve(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
  const isTsxCli = fs.existsSync(tsxCli);
  const execCmd = isTsxCli ? process.execPath : (process.platform === "win32" ? "npx.cmd" : "npx");
  const execArgs = isTsxCli ? [tsxCli, "server.ts"] : ["tsx", "server.ts"];

  const proc = spawn(execCmd, execArgs, {
    env: {
      ...process.env,
      NODE_ENV: "development",
      PORT: String(port),
      POSTGRES_DATA_DIR: TEST_SEC_DIR,
      DATABASE_URL: "",
      JWT_SECRET: "test_multi_tenant_secret_access_key_123456!",
      JWT_REFRESH_SECRET: "test_multi_tenant_secret_refresh_key_123456!"
    },
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
    shell: false
  });

  proc.stdout?.on("data", d => {
    const text = d.toString();
    if (process.env.DEBUG) console.log(`[SERVER STDOUT] ${text}`);
    const matches = text.matchAll(/\[DEV EMAIL LINK\]\s+(https?:\/\/[^\s\r\n]+)/g);
    for (const match of matches) {
      capturedLinks.push(match[1]);
    }
  });
  proc.stderr?.on("data", d => {
    console.error(`[SERVER STDERR] ${d}`);
  });
  proc.on("exit", code => {
    console.warn(`[SERVER EXIT] Process exited with code ${code}`);
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

const capturedLinks: string[] = [];

async function verifyLatestUser() {
  for (let i = 0; i < 40; i++) {
    if (capturedLinks.length > 0) {
      const link = capturedLinks.shift()!;
      await fetchJson(link);
      return true;
    }
    await delay(100);
  }
  return false;
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
    check(
      regA.data?.verificationLink === undefined,
      "Zero-Trust Security: User A registration response does NOT leak verificationLink in JSON body"
    );
    await verifyLatestUser();

    const loginA = await fetchJson(`${BASE}/api/auth/login`, { method: "POST" }, JSON.stringify({
      email: emailA,
      password
    }));
    check(
      loginA.data?.accessToken === undefined && loginA.data?.refreshToken === undefined,
      "Zero-Trust Security: User A login response does NOT leak tokens in JSON body"
    );
    const tokenA = extractTokenFromCookies(loginA.headers);
    const headersA = { Authorization: `Bearer ${tokenA}` };
    check(Boolean(tokenA), "User A registered and authenticated successfully via HttpOnly cookie");

    // 2. Register and Login User B
    const regB = await fetchJson(`${BASE}/api/auth/register`, { method: "POST" }, JSON.stringify({
      fullName: "Tenant B User",
      email: emailB,
      phoneNumber: phoneB,
      password,
      confirmPassword: password,
      agreeTerms: true
    }));
    check(
      regB.data?.verificationLink === undefined,
      "Zero-Trust Security: User B registration response does NOT leak verificationLink in JSON body"
    );
    await verifyLatestUser();

    const loginB = await fetchJson(`${BASE}/api/auth/login`, { method: "POST" }, JSON.stringify({
      email: emailB,
      password
    }));
    check(
      loginB.data?.accessToken === undefined && loginB.data?.refreshToken === undefined,
      "Zero-Trust Security: User B login response does NOT leak tokens in JSON body"
    );
    const tokenB = extractTokenFromCookies(loginB.headers);
    const headersB = { Authorization: `Bearer ${tokenB}` };
    check(Boolean(tokenB), "User B registered and authenticated successfully via HttpOnly cookie");

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
    const freshRefreshToken = extractCookieFromHeaders(loginFresh.headers, "refresh_token");
    check(Boolean(freshRefreshToken), "Issued fresh refresh token via HttpOnly cookie for concurrency testing");

    if (freshRefreshToken) {
      // Fire 5 concurrent refresh attempts with the exact same refresh token
      const refreshPromises = Array.from({ length: 5 }).map(() =>
        fetchJson(`${BASE}/api/auth/refresh`, {
          method: "POST",
          headers: { Cookie: `refresh_token=${freshRefreshToken}` }
        }, JSON.stringify({ refreshToken: freshRefreshToken }))
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

    // 18. Resume Upload: Valid PDF Parsing Verification
    console.log("\n[TEST 18] Verifying valid PDF upload and text extraction...");
    const contentStream = "BT\n/F1 12 Tf\n50 700 Td\n(Senior Cloud Infrastructure Architect with 10 years of experience in distributed systems, Kubernetes, TypeScript, and high-throughput microservices.) Tj\nET";
    const streamLen = Buffer.byteLength(contentStream, "utf8");
    const h = "%PDF-1.4\n";
    const o1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
    const o2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
    const o3 = "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n";
    const o4 = "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";
    const o5 = `5 0 obj\n<< /Length ${streamLen} >>\nstream\n${contentStream}\nendstream\nendobj\n`;
    let off = Buffer.byteLength(h, "utf8");
    const off1 = off; off += Buffer.byteLength(o1, "utf8");
    const off2 = off; off += Buffer.byteLength(o2, "utf8");
    const off3 = off; off += Buffer.byteLength(o3, "utf8");
    const off4 = off; off += Buffer.byteLength(o4, "utf8");
    const off5 = off; off += Buffer.byteLength(o5, "utf8");
    const xrefOff = off;
    const p = (n: number) => String(n).padStart(10, "0");
    const xr = `xref\n0 6\n0000000000 65535 f \n${p(off1)} 00000 n \n${p(off2)} 00000 n \n${p(off3)} 00000 n \n${p(off4)} 00000 n \n${p(off5)} 00000 n \n`;
    const tr = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOff}\n%%EOF\n`;
    const validPdfBuffer = Buffer.from(h + o1 + o2 + o3 + o4 + o5 + xr + tr, "utf8");
    const validPdfBase64 = validPdfBuffer.toString("base64");
    const validPdfRes = await fetchJson(`${BASE}/api/resumes/upload`, {
      method: "POST",
      headers: headersA
    }, JSON.stringify({ base64Data: validPdfBase64, fileName: "staff_engineer_resume.pdf" }));
    check(
      validPdfRes.status === 200 || validPdfRes.status === 201,
      "Valid PDF resume uploaded, parsed and accepted successfully without pdf-parse crash",
      `Status: ${validPdfRes.status} Error: ${JSON.stringify(validPdfRes.data?.error || validPdfRes.data)}`
    );

    // 19. Rate Limiting on Bridge Routes (/api/login)
    console.log("\n[TEST 19] Verifying rate limiter enforcement on legacy bridge /api/login...");
    let rateLimited = false;
    for (let i = 0; i < 35; i++) {
      const rlRes = await fetchJson(`${BASE}/api/login`, { method: "POST" }, JSON.stringify({
        email: "nonexistent_attacker@example.com",
        password: "WrongPassword123!"
      }));
      if (rlRes.status === 429) {
        rateLimited = true;
        break;
      }
    }
    check(
      rateLimited,
      "Rate limiter active on /api/login: correctly returns HTTP 429 after threshold exceeded"
    );

  } finally {
    try {
      if (proc.pid) {
        if (process.platform === "win32") {
          spawn("taskkill", ["/pid", String(proc.pid), "/T", "/F"], { shell: true });
        } else {
          try { process.kill(proc.pid, "SIGKILL"); } catch {}
          try { proc.kill("SIGKILL"); } catch {}
        }
      }
    } catch {}
    await delay(1000);
    if (fs.existsSync(TEST_SEC_DIR)) {
      try { fs.rmSync(TEST_SEC_DIR, { recursive: true, force: true }); } catch {}
    }
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
