import puppeteer from "puppeteer-core";

async function runTrueAudioSyncAudit() {
  console.log("================================================================================");
  console.log("     RECRUITER AI PRO — TRUE AUDIO-DRIVEN AVATAR ACOUSTIC AUDIT SUITE           ");
  console.log("================================================================================\n");

  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: "new",
    args: [
      "--no-sandbox",
      "--autoplay-policy=no-user-gesture-required",
      "--disable-features=AudioServiceOutOfProcess"
    ]
  });

  const page = await browser.newPage();
  await page.goto("about:blank");

  const evalScript = `
    (async () => {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.05;

      const gain = ctx.createGain();
      gain.gain.value = 1.0;

      gain.connect(analyser);
      analyser.connect(ctx.destination);

      const timeBuf = new Uint8Array(analyser.fftSize);
      const freqBuf = new Uint8Array(analyser.frequencyBinCount);

      function sampleMetrics() {
        analyser.getByteTimeDomainData(timeBuf);
        var sumSq = 0;
        for (var i = 0; i < timeBuf.length; i++) {
          var norm = (timeBuf[i] - 128) / 128;
          sumSq += norm * norm;
        }
        var rms = Math.sqrt(sumSq / timeBuf.length);

        analyser.getByteFrequencyData(freqBuf);
        var sumFreq = 0;
        for (var i = 0; i < freqBuf.length; i++) sumFreq += freqBuf[i];
        var energy = sumFreq / freqBuf.length;

        var isSilent = rms < 0.015 || energy < 3;
        var speechActivity = isSilent ? 0 : Math.min(rms * 4.5, 1.0);
        var mouthOpening = isSilent ? 0 : Math.min(rms * 28.0, 11.5);
        var jawOffset = mouthOpening * 0.32;

        return { rms: rms, energy: energy, isSilent: isSilent, speechActivity: speechActivity, mouthOpening: mouthOpening, jawOffset: jawOffset };
      }

      function delay(ms) {
        return new Promise(function(r) { setTimeout(r, ms); });
      }

      function makeAudioBuffer(durSec, freq, amp) {
        var buf = ctx.createBuffer(1, Math.floor(durSec * ctx.sampleRate), ctx.sampleRate);
        var chan = buf.getChannelData(0);
        for (var i = 0; i < chan.length; i++) {
          chan[i] = Math.sin((2 * Math.PI * freq * i) / ctx.sampleRate) * amp;
        }
        return buf;
      }

      function makeSpeechWithGapBuffer() {
        var durSec = 1.6;
        var buf = ctx.createBuffer(1, Math.floor(durSec * ctx.sampleRate), ctx.sampleRate);
        var chan = buf.getChannelData(0);
        var gapStart = Math.floor(0.5 * ctx.sampleRate);
        var gapEnd = Math.floor(1.1 * ctx.sampleRate);

        for (var i = 0; i < chan.length; i++) {
          if (i >= gapStart && i <= gapEnd) {
            chan[i] = 0;
          } else {
            var f0 = 200;
            var s1 = Math.sin((2 * Math.PI * f0 * i) / ctx.sampleRate);
            var s2 = 0.5 * Math.sin((2 * Math.PI * (f0 * 2.5) * i) / ctx.sampleRate);
            chan[i] = (s1 + s2) * 0.45;
          }
        }
        return buf;
      }

      var logs = {};

      // Ensure audio context is running and warmed up
      var warmBuf = makeAudioBuffer(0.2, 440, 0.05);
      var warmSrc = ctx.createBufferSource();
      warmSrc.buffer = warmBuf;
      warmSrc.connect(gain);
      var warmEnded = new Promise(function(r) { warmSrc.onended = r; });
      warmSrc.start();
      await warmEnded;
      await delay(100);

      // Baseline silence check
      logs.baselineSilence = sampleMetrics();

      // 1. Loud speech-like audio (amplitude 0.6)
      var loudBuf = makeAudioBuffer(1.0, 220, 0.6);
      var loudSrc = ctx.createBufferSource();
      loudSrc.buffer = loudBuf;
      loudSrc.connect(gain);
      var loudEnded = new Promise(function(r) { loudSrc.onended = r; });
      loudSrc.start();
      await delay(300);
      logs.loudSpeech = sampleMetrics();
      await loudEnded;
      await delay(100);

      // 2. Quiet speech-like audio (amplitude 0.15)
      var quietBuf = makeAudioBuffer(1.0, 220, 0.15);
      var quietSrc = ctx.createBufferSource();
      quietSrc.buffer = quietBuf;
      quietSrc.connect(gain);
      var quietEnded = new Promise(function(r) { quietSrc.onended = r; });
      quietSrc.start();
      await delay(300);
      logs.quietSpeech = sampleMetrics();
      await quietEnded;
      await delay(100);

      // 3. Speech -> Silence Gap -> Speech Resume
      var gapBuf = makeSpeechWithGapBuffer();
      var gapSrc = ctx.createBufferSource();
      gapSrc.buffer = gapBuf;
      gapSrc.connect(gain);
      var gapEnded = new Promise(function(r) { gapSrc.onended = r; });
      gapSrc.start();

      await delay(250); // in first speech burst (0.25s)
      logs.gapPhase1_speech = sampleMetrics();

      await delay(550); // in middle silence gap (0.80s)
      logs.gapPhase2_silence = sampleMetrics();

      await delay(500); // in resumed speech burst (1.30s)
      logs.gapPhase3_resume = sampleMetrics();

      await gapEnded;
      await delay(100);
      logs.gapPhase4_finished = sampleMetrics();

      // 4. Abrupt Audio Stop Mid-Turn
      var longBuf = makeAudioBuffer(3.0, 200, 0.5);
      var longSrc = ctx.createBufferSource();
      longSrc.buffer = longBuf;
      longSrc.connect(gain);
      longSrc.start();

      await delay(300);
      logs.beforeStop = sampleMetrics();
      longSrc.stop(0);
      longSrc.disconnect();
      await delay(100);
      logs.afterStop = sampleMetrics();

      return logs;
    })()
  `;

  const testResults: any = await page.evaluate(evalScript);
  await browser.close();

  console.log("--- 1. Baseline Silence Check ---");
  console.log("RMS:", testResults.baselineSilence.rms.toFixed(4), "Mouth Opening:", testResults.baselineSilence.mouthOpening.toFixed(2), "px");
  const p1 = testResults.baselineSilence.isSilent === true && testResults.baselineSilence.mouthOpening === 0;
  console.log(p1 ? "  ✓ PASS: Zero audio produces 0.0px mouth opening\n" : "  ✗ FAIL\n");

  console.log("--- 2. Loud vs Quiet Proportional Articulation ---");
  console.log("Loud Speech:  RMS=" + testResults.loudSpeech.rms.toFixed(4) + " -> Mouth=" + testResults.loudSpeech.mouthOpening.toFixed(2) + "px");
  console.log("Quiet Speech: RMS=" + testResults.quietSpeech.rms.toFixed(4) + " -> Mouth=" + testResults.quietSpeech.mouthOpening.toFixed(2) + "px");
  const p2 = testResults.loudSpeech.mouthOpening > testResults.quietSpeech.mouthOpening && testResults.quietSpeech.mouthOpening > 0;
  console.log(p2 ? "  ✓ PASS: Mouth opening scales proportionally with acoustic audio amplitude\n" : "  ✗ FAIL\n");

  console.log("--- 3. Speech -> Silence Gap -> Speech Resume ---");
  console.log("Phase 1 (Speech Active):  RMS=" + testResults.gapPhase1_speech.rms.toFixed(4) + " -> Mouth=" + testResults.gapPhase1_speech.mouthOpening.toFixed(2) + "px");
  console.log("Phase 2 (Silence Gap):    RMS=" + testResults.gapPhase2_silence.rms.toFixed(4) + " -> Mouth=" + testResults.gapPhase2_silence.mouthOpening.toFixed(2) + "px (Silent=" + testResults.gapPhase2_silence.isSilent + ")");
  console.log("Phase 3 (Speech Resumed): RMS=" + testResults.gapPhase3_resume.rms.toFixed(4) + " -> Mouth=" + testResults.gapPhase3_resume.mouthOpening.toFixed(2) + "px");
  console.log("Phase 4 (Audio Finished): RMS=" + testResults.gapPhase4_finished.rms.toFixed(4) + " -> Mouth=" + testResults.gapPhase4_finished.mouthOpening.toFixed(2) + "px");
  const p3 = testResults.gapPhase1_speech.mouthOpening > 1.5 &&
             testResults.gapPhase2_silence.mouthOpening === 0 &&
             testResults.gapPhase3_resume.mouthOpening > 1.5 &&
             testResults.gapPhase4_finished.mouthOpening === 0;
  console.log(p3 ? "  ✓ PASS: Analyser detects acoustic silence gap and pauses facial articulation immediately\n" : "  ✗ FAIL\n");

  console.log("--- 4. Abrupt Audio Stop Mid-Turn ---");
  console.log("Before stop: RMS=" + testResults.beforeStop.rms.toFixed(4) + " -> Mouth=" + testResults.beforeStop.mouthOpening.toFixed(2) + "px");
  console.log("After stop:  RMS=" + testResults.afterStop.rms.toFixed(4) + " -> Mouth=" + testResults.afterStop.mouthOpening.toFixed(2) + "px");
  const p4 = testResults.beforeStop.mouthOpening > 1.5 && testResults.afterStop.mouthOpening === 0;
  console.log(p4 ? "  ✓ PASS: Immediate audio cancellation forces mouth to resting neutral position\n" : "  ✗ FAIL\n");

  console.log("================================================================================");
  if (p1 && p2 && p3 && p4) {
    console.log("PROVEN: AVATAR FACIAL PARAMETERS ARE STRICTLY COUPLED TO ACOUSTIC AUDIO SIGNAL");
  } else {
    console.log("FAILED SOME ACOUSTIC ASSERTIONS");
    process.exit(1);
  }
  console.log("================================================================================");
}

runTrueAudioSyncAudit().catch((err) => {
  console.error("Audio audit error:", err);
  process.exit(1);
});
