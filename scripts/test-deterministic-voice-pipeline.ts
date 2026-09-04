import { spawn, execSync } from "child_process";
import puppeteer from "puppeteer-core";

async function runDeterministicVoiceTests() {
  console.log("================================================================================");
  console.log("    RECRUITER AI PRO — DETERMINISTIC PERSONA VOICE PIPELINE TEST SUITE          ");
  console.log("================================================================================\n");

  const port = 3065;
  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const TEST_ENV = {
    ...process.env,
    PORT: String(port),
    NODE_ENV: "development",
    DATABASE_URL: "",
    JWT_SECRET: "test_jwt_secret_token_recruiter_ai_pro_2026_long_secret_key",
    JWT_REFRESH_SECRET: "test_jwt_refresh_secret_token_recruiter_ai_pro_2026_long_secret_key"
  };

  console.log("[TEST SETUP] Starting server on port " + port + "...");
  const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
  const serverProcess = spawn(npxCmd, ["tsx", "server.ts"], {
    env: TEST_ENV,
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
    shell: true
  });

  let serverReady = false;
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const ping = await fetch(`http://localhost:${port}/api/health`);
      if (ping.ok) {
        serverReady = true;
        console.log(`[TEST SETUP] Server ready on port ${port}\n`);
        break;
      }
    } catch {}
  }

  if (!serverReady) {
    console.error("Failed to start server within timeout");
    try { execSync(`taskkill /pid ${serverProcess.pid} /T /F`); } catch {}
    process.exit(1);
  }

  let allPassed = true;

  try {
    // --- TEST 1: MISSING PERSONA PARAMETER ---
    console.log("--- TEST 1: MISSING PERSONA PARAMETER ---");
    const res1 = await fetch(`http://localhost:${port}/api/tts?text=Hello`);
    const json1: any = await res1.json();
    console.log(`  Status: HTTP ${res1.status} | Error: "${json1.error}"`);
    if (res1.status === 400 && json1.error.includes("MISSING_PERSONA")) {
      console.log("  ✓ PASS: Missing persona parameter is strictly rejected\n");
    } else {
      console.log("  ✗ FAIL: Did not reject missing persona\n");
      allPassed = false;
    }

    // --- TEST 2: INVALID PERSONA PARAMETER ---
    console.log("--- TEST 2: INVALID PERSONA PARAMETER (persona=99) ---");
    const res2 = await fetch(`http://localhost:${port}/api/tts?text=Hello&persona=99`);
    const json2: any = await res2.json();
    console.log(`  Status: HTTP ${res2.status} | Error: "${json2.error}"`);
    if (res2.status === 400 && json2.error.includes("INVALID_PERSONA")) {
      console.log("  ✓ PASS: Invalid persona ID 99 is strictly rejected with explicit error\n");
    } else {
      console.log("  ✗ FAIL: Did not reject invalid persona\n");
      allPassed = false;
    }

    // --- TEST 3: CONFLICTING PERSONA & VOICE (persona=0&voice=Matthew) ---
    console.log("--- TEST 3: CONFLICTING PERSONA & VOICE (Sarah with Matthew) ---");
    const res3 = await fetch(`http://localhost:${port}/api/tts?text=Hello&persona=0&voice=Matthew`);
    const json3: any = await res3.json();
    console.log(`  Status: HTTP ${res3.status} | Error: "${json3.error}"`);
    if (res3.status === 400 && json3.error.includes("VOICE_CONFLICT")) {
      console.log("  ✓ PASS: Server strictly refuses to assign male voice Matthew to Sarah Jenkins\n");
    } else {
      console.log("  ✗ FAIL: Server permitted conflicting voice for persona\n");
      allPassed = false;
    }

    // --- TEST 4: AUTHORITATIVE SARAH JENKINS (persona=0 -> Salli) ---
    console.log("--- TEST 4: SARAH JENKINS (persona=0 -> Salli -> Female) ---");
    const res4 = await fetch(`http://localhost:${port}/api/tts?text=Welcome+candidate&persona=0`);
    const voice4 = res4.headers.get("X-TTS-Voice");
    const persona4 = res4.headers.get("X-TTS-Persona");
    const ct4 = res4.headers.get("Content-Type");
    const bytes4 = (await res4.arrayBuffer()).byteLength;
    console.log(`  Status: HTTP ${res4.status} | X-TTS-Voice: ${voice4} | X-TTS-Persona: ${persona4} | Bytes: ${bytes4}`);
    if (res4.status === 200 && voice4 === "Salli" && persona4 === "Sarah" && ct4?.includes("audio") && bytes4 > 5000) {
      console.log("  ✓ PASS: Sarah Jenkins resolves strictly to Salli (Female)\n");
    } else {
      console.log("  ✗ FAIL: Sarah Jenkins did not resolve to Salli\n");
      allPassed = false;
    }

    // --- TEST 5: AUTHORITATIVE DAVID CHEN (persona=1 -> Matthew) ---
    console.log("--- TEST 5: DAVID CHEN (persona=1 -> Matthew -> Male) ---");
    const res5 = await fetch(`http://localhost:${port}/api/tts?text=Welcome+candidate&persona=1`);
    const voice5 = res5.headers.get("X-TTS-Voice");
    const persona5 = res5.headers.get("X-TTS-Persona");
    const ct5 = res5.headers.get("Content-Type");
    const bytes5 = (await res5.arrayBuffer()).byteLength;
    console.log(`  Status: HTTP ${res5.status} | X-TTS-Voice: ${voice5} | X-TTS-Persona: ${persona5} | Bytes: ${bytes5}`);
    if (res5.status === 200 && voice5 === "Matthew" && persona5 === "David" && ct5?.includes("audio") && bytes5 > 5000) {
      console.log("  ✓ PASS: David Chen resolves strictly to Matthew (Male)\n");
    } else {
      console.log("  ✗ FAIL: David Chen did not resolve to Matthew\n");
      allPassed = false;
    }

    // --- TEST 6: AUTHORITATIVE MARCUS BRODY (persona=2 -> Brian) ---
    console.log("--- TEST 6: MARCUS BRODY (persona=2 -> Brian -> Male) ---");
    const res6 = await fetch(`http://localhost:${port}/api/tts?text=Welcome+candidate&persona=2`);
    const voice6 = res6.headers.get("X-TTS-Voice");
    const persona6 = res6.headers.get("X-TTS-Persona");
    const ct6 = res6.headers.get("Content-Type");
    const bytes6 = (await res6.arrayBuffer()).byteLength;
    console.log(`  Status: HTTP ${res6.status} | X-TTS-Voice: ${voice6} | X-TTS-Persona: ${persona6} | Bytes: ${bytes6}`);
    if (res6.status === 200 && voice6 === "Brian" && persona6 === "Marcus" && ct6?.includes("audio") && bytes6 > 5000) {
      console.log("  ✓ PASS: Marcus Brody resolves strictly to Brian (Male)\n");
    } else {
      console.log("  ✗ FAIL: Marcus Brody did not resolve to Brian\n");
      allPassed = false;
    }

    // --- TEST 7: CONCURRENT ISOLATION (Sarah + David + Marcus in parallel) ---
    console.log("--- TEST 7: CONCURRENT PERSONA ISOLATION (Sarah, David, Marcus parallel) ---");
    const testSentences = [
      { persona: 0, expectedVoice: "Salli", expectedPersona: "Sarah", text: "Sarah speaking concurrently." },
      { persona: 1, expectedVoice: "Matthew", expectedPersona: "David", text: "David speaking concurrently." },
      { persona: 2, expectedVoice: "Brian", expectedPersona: "Marcus", text: "Marcus speaking concurrently." }
    ];

    const concurrentResults = await Promise.all(testSentences.map(async req => {
      const resp = await fetch(`http://localhost:${port}/api/tts?text=${encodeURIComponent(req.text)}&persona=${req.persona}`);
      const v = resp.headers.get("X-TTS-Voice");
      const p = resp.headers.get("X-TTS-Persona");
      const ab = await resp.arrayBuffer();
      return {
        personaId: req.persona,
        expectedVoice: req.expectedVoice,
        returnedVoice: v,
        expectedPersona: req.expectedPersona,
        returnedPersona: p,
        status: resp.status,
        bytes: ab.byteLength
      };
    }));

    let concurrentPassed = true;
    for (const cr of concurrentResults) {
      console.log(`  Persona ${cr.personaId} (${cr.expectedPersona}): HTTP ${cr.status} | Expected Voice: ${cr.expectedVoice} | Returned Voice: ${cr.returnedVoice} | Bytes: ${cr.bytes}`);
      if (cr.status !== 200 || cr.returnedVoice !== cr.expectedVoice || cr.returnedPersona !== cr.expectedPersona || cr.bytes < 3000) {
        concurrentPassed = false;
      }
    }

    if (concurrentPassed) {
      console.log("  ✓ PASS: Concurrent requests maintain strict persona & voice isolation without leakage\n");
    } else {
      console.log("  ✗ FAIL: Cross-persona voice leakage detected in concurrent requests\n");
      allPassed = false;
    }

    // --- TEST 8: BROWSER PLAYBACK & AUDIO DYNAMICS ACCEPTANCE ---
    console.log("--- TEST 8: BROWSER PLAYBACK & AUDIO ACOUSTIC DYNAMICS ---");
    const browser = await puppeteer.launch({
      executablePath: edgePath,
      headless: "new",
      args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"]
    });
    const page = await browser.newPage();
    await page.goto(`http://localhost:${port}/`, { waitUntil: "domcontentloaded" });

    const fullSentence = "Please explain how you would design a scalable distributed system for millions of users, and describe how you would handle failure recovery.";

    for (const p of [0, 1, 2]) {
      const pName = p === 0 ? "Sarah Jenkins" : (p === 1 ? "David Chen" : "Marcus Brody");
      const expectedVoice = p === 0 ? "Salli" : (p === 1 ? "Matthew" : "Brian");

      const audioInfo = await page.evaluate(async (port, persona, sentence) => {
        const url = `http://localhost:${port}/api/tts?text=${encodeURIComponent(sentence)}&persona=${persona}`;
        const res = await fetch(url);
        const voiceHeader = res.headers.get("X-TTS-Voice");
        const personaHeader = res.headers.get("X-TTS-Persona");
        const ab = await res.arrayBuffer();
        const rawBytes = ab.byteLength;

        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (ctx.state === "suspended") await ctx.resume();
        const decoded = await ctx.decodeAudioData(ab);

        const chan = decoded.getChannelData(0);
        let peak = 0;
        let nonZero = 0;
        for (let i = 0; i < chan.length; i++) {
          const abs = Math.abs(chan[i]);
          if (abs > peak) peak = abs;
          if (abs > 0.01) nonZero++;
        }

        return {
          status: res.status,
          voiceHeader,
          personaHeader,
          bytes: rawBytes,
          duration: decoded.duration,
          peak,
          activeRatio: nonZero / chan.length
        };
      }, port, p, fullSentence);

      console.log(`  [${pName}] Decoded Duration: ${audioInfo.duration.toFixed(2)}s | Peak: ${audioInfo.peak.toFixed(3)} | Active Ratio: ${(audioInfo.activeRatio * 100).toFixed(1)}% | Voice: ${audioInfo.voiceHeader} | Bytes: ${audioInfo.bytes}`);
      const cond = audioInfo.status === 200 && audioInfo.voiceHeader === expectedVoice && audioInfo.duration >= 5.0 && audioInfo.bytes > 10000;
      console.log(`  Check: status200=${audioInfo.status === 200}, voiceMatch=${audioInfo.voiceHeader === expectedVoice} ('${audioInfo.voiceHeader}' === '${expectedVoice}'), dur>=5=${audioInfo.duration >= 5.0}, bytes>10k=${audioInfo.bytes > 10000}`);

      if (cond) {
        console.log(`  ✓ PASS: ${pName} voice verified in browser (${expectedVoice})\n`);
      } else {
        console.log(`  ✗ FAIL: ${pName} voice verification failed in browser\n`);
        allPassed = false;
      }
    }

    await browser.close();

  } finally {
    try { execSync(`taskkill /pid ${serverProcess.pid} /T /F`); } catch {}
  }

  console.log("================================================================================");
  if (allPassed) {
    console.log("ALL DETERMINISTIC VOICE TESTS PASSED — ZERO GENERIC FALLBACKS DETECTED");
    process.exit(0);
  } else {
    console.log("DETERMINISTIC VOICE PIPELINE FAILED ACCEPTANCE");
    process.exit(1);
  }
}

runDeterministicVoiceTests().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
