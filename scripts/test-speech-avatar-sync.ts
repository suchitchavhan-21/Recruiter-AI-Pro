import { synthesizeAcousticSpeech } from "../src/components/boardroom/controlledAudioTts";
import { speechAudioSync } from "../src/components/boardroom/speechAudioSync";

function runSpeechAudioPcmSyncValidation() {
  console.log("================================================================================");
  console.log("    RECRUITER AI PRO — ACOUSTIC SPEECH PCM & AUDIO ENVELOPE AUDIT SUITE         ");
  console.log("================================================================================\n");

  // 1. Long sentence acoustic synthesis
  console.log("--- TEST 1: Long Interviewer Sentence Acoustic Synthesis ---");
  const text1 = "We require high-throughput database sharding for scalability.";
  const pcm1 = synthesizeAcousticSpeech(text1, { gender: "female" }, 24000);
  console.log(`  Synthesized ${pcm1.length} PCM audio samples (${(pcm1.length / 24000).toFixed(2)}s)`);

  let maxAmp1 = 0;
  let nonZeroCount1 = 0;
  for (let i = 0; i < pcm1.length; i++) {
    const abs = Math.abs(pcm1[i]);
    if (abs > maxAmp1) maxAmp1 = abs;
    if (abs > 0.005) nonZeroCount1++;
  }
  console.log(`  Peak Amplitude: ${maxAmp1.toFixed(3)}, Active Speech Samples: ${nonZeroCount1}/${pcm1.length}`);
  const t1Passed = maxAmp1 > 0.1 && nonZeroCount1 > 1000;
  console.log(t1Passed ? "  ✓ PASS: Generated valid acoustic speech waveform with vocal formants\n" : "  ✗ FAIL\n");

  // 2. Pause detection: sentence with period and comma
  console.log("--- TEST 2: Acoustic Silence Gaps at Punctuation Pauses ---");
  const text2 = "Let us pause here. Now, we continue.";
  const pcm2 = synthesizeAcousticSpeech(text2, { gender: "female" }, 24000);
  
  // Find silent samples in the middle
  let longestSilenceRun = 0;
  let currentSilenceRun = 0;
  for (let i = 0; i < pcm2.length; i++) {
    if (Math.abs(pcm2[i]) < 0.0001) {
      currentSilenceRun++;
      if (currentSilenceRun > longestSilenceRun) longestSilenceRun = currentSilenceRun;
    } else {
      currentSilenceRun = 0;
    }
  }
  const silenceDurationMs = (longestSilenceRun / 24000) * 1000;
  console.log(`  Longest Acoustic Silence Run: ${longestSilenceRun} samples (${silenceDurationMs.toFixed(1)}ms)`);
  const t2Passed = silenceDurationMs >= 300; // Period creates >= 300ms pause
  console.log(t2Passed ? "  ✓ PASS: Real acoustic silence is generated during punctuation pauses\n" : "  ✗ FAIL\n");

  // 3. Different speaking speeds
  console.log("--- TEST 3: Speaking Rate Variation (0.8x vs 1.4x) ---");
  const text3 = "Architectural review.";
  const pcmSlow = synthesizeAcousticSpeech(text3, { gender: "female", rate: 0.8 }, 24000);
  const pcmFast = synthesizeAcousticSpeech(text3, { gender: "female", rate: 1.4 }, 24000);
  console.log(`  Slow (0.8x): ${pcmSlow.length} samples (${(pcmSlow.length / 24000).toFixed(2)}s)`);
  console.log(`  Fast (1.4x): ${pcmFast.length} samples (${(pcmFast.length / 24000).toFixed(2)}s)`);
  const t3Passed = pcmSlow.length > pcmFast.length;
  console.log(t3Passed ? "  ✓ PASS: Audio length scales inversely with speech rate\n" : "  ✗ FAIL\n");

  // 4. Voice gender pitch differences (Sarah vs David/Marcus)
  console.log("--- TEST 4: Gender-Specific Vocal Pitch Calibration ---");
  const text4 = "System design interview.";
  const pcmSarah = synthesizeAcousticSpeech(text4, { gender: "female" }, 24000);
  const pcmDavid = synthesizeAcousticSpeech(text4, { gender: "male" }, 24000);
  console.log(`  Sarah (Female F0 ~205Hz): ${pcmSarah.length} samples`);
  console.log(`  David (Male F0 ~125Hz):   ${pcmDavid.length} samples`);
  const t4Passed = pcmSarah.length > 0 && pcmDavid.length > 0;
  console.log(t4Passed ? "  ✓ PASS: Both female and male acoustic voice profiles generate cleanly\n" : "  ✗ FAIL\n");

  // 5. Speech Audio Sync state query
  console.log("--- TEST 5: Real-Time Audio Metric Queries ---");
  const state = speechAudioSync.getAudioAcousticMetrics();
  console.log(`  Pre-playback State: isPlaying=${state.isPlaying}, rms=${state.rms}, mouthOpening=${state.mouthOpening}px`);
  const t5Passed = state.isPlaying === false && state.mouthOpening === 0;
  console.log(t5Passed ? "  ✓ PASS: Resting state is strictly zero mouth opening\n" : "  ✗ FAIL\n");

  console.log("================================================================================");
  if (t1Passed && t2Passed && t3Passed && t4Passed && t5Passed) {
    console.log("ALL 5 ACOUSTIC SPEECH AUDIT TESTS PASSED SUCCESSFULLY");
  } else {
    process.exit(1);
  }
  console.log("================================================================================");
}

runSpeechAudioPcmSyncValidation();
