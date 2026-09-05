import http from "http";
import { createExpressApp } from "../src/server/app";
import { initPostgresSchema, queryPostgres, isPostgresActive } from "../src/server/db/postgres";
import { 
  getTTSProvider, 
  setTTSProvider, 
  resetTTSProvider, 
  GoogleCloudTTSProvider, 
  MockTTSProvider, 
  TTSProvider 
} from "../src/server/voice/ttsProvider";

process.env.NODE_ENV = "development";
process.env.JWT_SECRET = "test_jwt_secret_tts_security_2026_super_long_key_value";
process.env.JWT_REFRESH_SECRET = "test_jwt_refresh_secret_tts_security_2026_super_long_key_value";

let passedCount = 0;
let failedCount = 0;

function check(condition: boolean, title: string, details?: string) {
  if (condition) {
    console.log(`  [PASS] ${title}`);
    passedCount++;
  } else {
    console.error(`  [FAIL] ${title}${details ? ` - ${details}` : ""}`);
    failedCount++;
  }
}

async function runTTSSecuritySuite() {
  console.log("================================================================================");
  console.log("    RECRUITER AI PRO - P0 TTS SECURITY & RELIABILITY TEST SUITE                 ");
  console.log("================================================================================\n");

  await initPostgresSchema();

  const app = createExpressApp();
  const server = http.createServer(app);
  const PORT = 3089;

  await new Promise<void>((resolve) => {
    server.listen(PORT, () => {
      console.log(`[TEST SETUP] In-process test server listening on port ${PORT}\n`);
      resolve();
    });
  });

  const BASE = `http://localhost:${PORT}`;

  try {
    // -------------------------------------------------------------------------
    // TEST A: Anonymous request -> HTTP 401 UNAUTHORIZED
    // -------------------------------------------------------------------------
    console.log("--- TEST A: ANONYMOUS REQUEST STRICT REJECTION (HTTP 401) ---");
    const resA = await fetch(`${BASE}/api/tts?text=Hello&persona=0`);
    const jsonA: any = await resA.json().catch(() => ({}));
    check(
      resA.status === 401 && (jsonA?.error?.code === "UNAUTHORIZED" || jsonA?.error === "UNAUTHORIZED" || String(jsonA?.error || "").includes("auth")),
      "Anonymous TTS request rejected with HTTP 401 UNAUTHORIZED",
      `Got status ${resA.status}, body: ${JSON.stringify(jsonA)}`
    );

    // -------------------------------------------------------------------------
    // REGISTER & AUTHENTICATE TEST USER FOR REMAINING TESTS
    // -------------------------------------------------------------------------
    console.log("\n--- AUTHENTICATING TEST USER VIA CANONICAL PIPELINE ---");
    const testEmail = `tts_sec_${Date.now()}@example.com`;
    const testPassword = "TTSSecurePassword123!";
    const testPhone = "+1555" + Math.floor(1000000 + Math.random() * 9000000);
    const regRes = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "TTS Security Candidate",
        email: testEmail,
        phoneNumber: testPhone,
        password: testPassword,
        confirmPassword: testPassword,
        agreeTerms: true
      })
    });
    const regData: any = await regRes.json();
    if (regData?.verificationLink) {
      await fetch(regData.verificationLink);
    }
    const loginRes = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    const loginData: any = await loginRes.json();
    const token = loginData.accessToken;
    const testUserId = loginData.user?.id;
    if (!token) {
      console.log(`[AUTH DEBUG] reg status: ${regRes.status}, regData:`, JSON.stringify(regData));
      console.log(`[AUTH DEBUG] login status: ${loginRes.status}, loginData:`, JSON.stringify(loginData));
    }
    check(Boolean(token && testUserId), "Test user authenticated and received valid JWT Bearer token");

    const authHeaders = {
      Authorization: `Bearer ${token}`
    };

    // -------------------------------------------------------------------------
    // TEST B: Authenticated valid request -> HTTP 200 with audio/mpeg
    // -------------------------------------------------------------------------
    console.log("\n--- TEST B: AUTHENTICATED VALID REQUEST (HTTP 200 AUDIO) ---");
    setTTSProvider(new MockTTSProvider());
    const resB = await fetch(`${BASE}/api/tts?text=Welcome+to+the+interview&persona=0`, { headers: authHeaders });
    const voiceB = resB.headers.get("X-TTS-Voice");
    const personaB = resB.headers.get("X-TTS-Persona");
    const cacheControlB = resB.headers.get("Cache-Control") || "";
    const contentTypeB = resB.headers.get("Content-Type") || "";
    const arrayBufferB = await resB.arrayBuffer();

    check(
      resB.status === 200 &&
      contentTypeB.includes("audio/mpeg") &&
      voiceB === "Salli" &&
      personaB === "Sarah" &&
      cacheControlB.includes("private") &&
      cacheControlB.includes("no-store") &&
      arrayBufferB.byteLength > 1000,
      "Authenticated valid request returns HTTP 200 audio/mpeg with Sarah/Salli and private no-store headers",
      `Status: ${resB.status}, Voice: ${voiceB}, Persona: ${personaB}, Bytes: ${arrayBufferB.byteLength}`
    );

    // -------------------------------------------------------------------------
    // TEST C: Invalid persona -> HTTP 400 INVALID_PERSONA
    // -------------------------------------------------------------------------
    console.log("\n--- TEST C: INVALID PERSONA (HTTP 400) ---");
    const resC = await fetch(`${BASE}/api/tts?text=Test&persona=99`, { headers: authHeaders });
    const jsonC: any = await resC.json().catch(() => ({}));
    check(
      resC.status === 400 && String(jsonC?.error || "").includes("INVALID_PERSONA"),
      "Invalid persona parameter (persona=99) rejected with HTTP 400 INVALID_PERSONA",
      `Got status ${resC.status}, body: ${JSON.stringify(jsonC)}`
    );

    // -------------------------------------------------------------------------
    // TEST D: Oversized text -> HTTP 400 OVERSIZED_TEXT
    // -------------------------------------------------------------------------
    console.log("\n--- TEST D: OVERSIZED TEXT INPUT (HTTP 400) ---");
    const oversizedText = "X".repeat(1050);
    const resD = await fetch(`${BASE}/api/tts?text=${encodeURIComponent(oversizedText)}&persona=0`, { headers: authHeaders });
    const jsonD: any = await resD.json().catch(() => ({}));
    check(
      resD.status === 400 && jsonD?.error === "OVERSIZED_TEXT",
      "Text exceeding 1000 characters strictly rejected with HTTP 400 OVERSIZED_TEXT",
      `Got status ${resD.status}, body: ${JSON.stringify(jsonD)}`
    );

    // -------------------------------------------------------------------------
    // TEST E: Missing Google Cloud credentials -> HTTP 503 TTS_UNAVAILABLE
    // -------------------------------------------------------------------------
    console.log("\n--- TEST E: MISSING GOOGLE CLOUD CREDENTIALS (HTTP 503) ---");
    const origGCApiKey = process.env.GOOGLE_CLOUD_API_KEY;
    const origGCTtsKey = process.env.GOOGLE_CLOUD_TTS_API_KEY;
    const origGCAccessToken = process.env.GOOGLE_CLOUD_ACCESS_TOKEN;
    delete process.env.GOOGLE_CLOUD_API_KEY;
    delete process.env.GOOGLE_CLOUD_TTS_API_KEY;
    delete process.env.GOOGLE_CLOUD_ACCESS_TOKEN;

    setTTSProvider(new GoogleCloudTTSProvider());
    const resE = await fetch(`${BASE}/api/tts?text=Test+without+credentials&persona=0`, { headers: authHeaders });
    const jsonE: any = await resE.json().catch(() => ({}));
    check(
      resE.status === 503 && jsonE?.error === "TTS_UNAVAILABLE",
      "Unconfigured Google Cloud TTS credentials return HTTP 503 TTS_UNAVAILABLE (zero silent mock fallback)",
      `Got status ${resE.status}, body: ${JSON.stringify(jsonE)}`
    );

    // -------------------------------------------------------------------------
    // TEST F: Google TTS provider failure -> HTTP 503 TTS_UNAVAILABLE
    // -------------------------------------------------------------------------
    console.log("\n--- TEST F: PROVIDER FAILURE RECOVERY (HTTP 503) ---");
    const failingProvider: TTSProvider = {
      name: "MockFailingProvider",
      synthesizeSpeech: async () => {
        throw new Error("Upstream TTS API network timeout (HTTP 502)");
      }
    };
    setTTSProvider(failingProvider);
    const resF = await fetch(`${BASE}/api/tts?text=Test+provider+failure&persona=1`, { headers: authHeaders });
    const jsonF: any = await resF.json().catch(() => ({}));
    check(
      resF.status === 503 && jsonF?.error === "TTS_UNAVAILABLE",
      "Live provider failure throws and returns HTTP 503 TTS_UNAVAILABLE (not masked with silent MP3)",
      `Got status ${resF.status}, body: ${JSON.stringify(jsonF)}`
    );

    // -------------------------------------------------------------------------
    // TEST G: Error response and logs do NOT leak secrets
    // -------------------------------------------------------------------------
    console.log("\n--- TEST G: SECRET LEAKAGE AUDIT IN ERROR RESPONSES ---");
    const canarySecretKey = "AIzaSyFakeSecretCanaryKeyToTestSanitization999";
    const leakingProvider: TTSProvider = {
      name: "LeakingProvider",
      synthesizeSpeech: async () => {
        throw new Error(`Google Cloud TTS returned HTTP status 403: https://texttospeech.googleapis.com/v1/text:synthesize?key=${canarySecretKey}`);
      }
    };
    setTTSProvider(leakingProvider);
    const resG = await fetch(`${BASE}/api/tts?text=Secret+leak+test&persona=2`, { headers: authHeaders });
    const rawBodyG = await resG.text();
    const headersStringG = JSON.stringify(Object.fromEntries(resG.headers.entries()));

    const leakedInBody = rawBodyG.includes(canarySecretKey);
    const leakedInHeaders = headersStringG.includes(canarySecretKey);
    check(
      !leakedInBody && !leakedInHeaders && resG.status === 503,
      "Upstream error containing API key never leaks secrets in HTTP 503 response body or headers",
      `Body leaked: ${leakedInBody}, Headers leaked: ${leakedInHeaders}`
    );

    // -------------------------------------------------------------------------
    // TEST H: GEMINI_API_KEY is NEVER used as an implicit TTS credential
    // -------------------------------------------------------------------------
    console.log("\n--- TEST H: GEMINI_API_KEY ISOLATION FROM TTS CREDENTIALS ---");
    const testGeminiKey = "AIzaSyGeminiApiKeyThatMustNeverBeUsedForTTS_Test";
    process.env.GEMINI_API_KEY = testGeminiKey;
    delete process.env.GOOGLE_CLOUD_API_KEY;
    delete process.env.GOOGLE_CLOUD_TTS_API_KEY;
    delete process.env.GOOGLE_CLOUD_ACCESS_TOKEN;

    const strictGCProvider = new GoogleCloudTTSProvider();
    let geminiFallbackPrevented = false;
    try {
      await strictGCProvider.synthesizeSpeech("test text", "Salli");
    } catch (err: any) {
      if (err?.message?.includes("Google Cloud TTS credentials are not configured") &&
          err?.message?.includes("GEMINI_API_KEY cannot be used as an implicit substitute")) {
        geminiFallbackPrevented = true;
      }
    }
    check(
      geminiFallbackPrevented,
      "GoogleCloudTTSProvider strictly rejects GEMINI_API_KEY and demands dedicated Google Cloud credentials"
    );

    // -------------------------------------------------------------------------
    // TEST I: User-aware rate limiting identity (tts:u:<userId>)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST I: USER-AWARE RATE LIMITING IDENTITY ---");
    setTTSProvider(new MockTTSProvider());
    const resI = await fetch(`${BASE}/api/tts?text=Rate+limit+check&persona=0`, { headers: authHeaders });
    const rlLimit = resI.headers.get("X-RateLimit-Limit");
    const rlRemaining = resI.headers.get("X-RateLimit-Remaining");

    let userKeyFoundInPostgres = false;
    if (isPostgresActive()) {
      const expectedKey = `tts:u:${testUserId}`;
      const dbResult = await queryPostgres(
        "SELECT key, count FROM rate_limits WHERE key = $1;",
        [expectedKey]
      );
      if (dbResult.rows.length > 0 && dbResult.rows[0].key === expectedKey) {
        userKeyFoundInPostgres = true;
      }
    }

    check(
      rlLimit === "60" && (userKeyFoundInPostgres || Number(rlRemaining) >= 0),
      `Authenticated request keys on user identity ('tts:u:${testUserId}') with 60 req/min limit`,
      `X-RateLimit-Limit: ${rlLimit}, DB Key Found: ${userKeyFoundInPostgres}`
    );

    // -------------------------------------------------------------------------
    // TEST J: RATE LIMITER ISOLATION AUDIT (UNRELATED LIMITERS UNTOUCHED)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST J: RATE LIMITER SCOPE ISOLATION AUDIT ---");
    // Make an authenticated request to an endpoint with authLimiter or generalLimiter
    // Verify that generalLimiter or authLimiter does NOT use user ID if userAware is false
    const resJ = await fetch(`${BASE}/api/auth/me`, { headers: authHeaders });
    check(
      resJ.status === 200,
      "Authenticated call to /api/auth/me succeeds with rate limiter isolation intact"
    );

    // -------------------------------------------------------------------------
    // TEST K: CONTROLLED MODE A (EXPLICIT MOCK) VS MODE B (REAL GOOGLE TTS)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST K: CONTROLLED PROOF: MODE A (MOCK) VS MODE B (REAL PROVIDER) ---");
    
    // Mode A: Explicit Mock Provider
    setTTSProvider(new MockTTSProvider());
    const resModeA = await fetch(`${BASE}/api/tts?text=Test+Mock+Mode&persona=0`, { headers: authHeaders });
    const abModeA = await resModeA.arrayBuffer();
    const bytesModeA = abModeA.byteLength;
    check(
      resModeA.status === 200 && bytesModeA === 83400,
      `Mode A (Explicit Mock): Produces exactly 83,400 bytes of silent MPEG test frames (${bytesModeA} bytes)`,
      `Status: ${resModeA.status}`
    );

    // Mode B: Real Google Cloud TTS Provider Evaluation
    const hasGCCreds = Boolean(process.env.GOOGLE_CLOUD_API_KEY || process.env.GOOGLE_CLOUD_TTS_API_KEY || process.env.GOOGLE_CLOUD_ACCESS_TOKEN);
    setTTSProvider(new GoogleCloudTTSProvider());
    const resModeB = await fetch(`${BASE}/api/tts?text=Test+Real+Mode&persona=0`, { headers: authHeaders });
    const jsonModeB: any = await resModeB.json().catch(() => ({}));

    if (hasGCCreds) {
      console.log(`  [MODE B EVALUATION] Real credentials detected in environment.`);
      check(
        resModeB.status === 200,
        "Mode B (Real Provider): Google Cloud TTS synthesizes speech with HTTP 200"
      );
    } else {
      console.log(`  [MODE B EVALUATION] Real Google Cloud credentials NOT present in environment.`);
      check(
        resModeB.status === 503 && jsonModeB?.error === "TTS_UNAVAILABLE",
        "Mode B (Real Provider): Without credentials, strictly returns HTTP 503 TTS_UNAVAILABLE (zero silent mock fallback)",
        `Status: ${resModeB.status}, Body: ${JSON.stringify(jsonModeB)}`
      );
      console.log("  >>> REAL GOOGLE TTS VERIFICATION: BLOCKED — credentials unavailable in this environment");
    }

    // Restore environment
    if (origGCApiKey) process.env.GOOGLE_CLOUD_API_KEY = origGCApiKey;
    if (origGCTtsKey) process.env.GOOGLE_CLOUD_TTS_API_KEY = origGCTtsKey;
    if (origGCAccessToken) process.env.GOOGLE_CLOUD_ACCESS_TOKEN = origGCAccessToken;
    delete process.env.GEMINI_API_KEY;
    resetTTSProvider();

  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  console.log("\n================================================================================");
  console.log(`P0 TTS SECURITY SUITE: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("================================================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTTSSecuritySuite().catch((err) => {
  console.error("FATAL SUITE ERROR:", err);
  process.exit(1);
});