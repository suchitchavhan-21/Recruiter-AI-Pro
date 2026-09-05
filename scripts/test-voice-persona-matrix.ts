import { PERSONA_VOICE_MAP, resolveInterviewerVoice, getPersonaVoiceDiagnostics, assertPersonaVoiceInvariants } from "../src/server/voice/interviewerVoices";
import { getTTSDiagnostics, GoogleCloudTTSProvider, MockTTSProvider } from "../src/server/voice/ttsProvider";

async function runVoicePersonaMatrixTests() {
  console.log("================================================================================");
  console.log("    RECRUITER AI PRO — AUTHORITATIVE VOICE PERSONA MATRIX VERIFICATION         ");
  console.log("================================================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}${detail ? `: ${detail}` : ""}`);
      failed++;
    }
  }

  // --- 1. SARAH JENKINS (PERSONA 0) ---
  console.log("\n--- TEST 1: SARAH JENKINS (PERSONA 0) MAPPINGS ---");
  const sarah = PERSONA_VOICE_MAP[0];
  assert(sarah !== undefined, "Persona 0 exists in registry");
  assert(sarah.personaName === "Sarah Jenkins", "Persona 0 name is 'Sarah Jenkins'");
  assert(sarah.gender === "female", "Persona 0 gender is strictly 'female'");
  assert(sarah.googleVoice.ssmlGender === "FEMALE", "Persona 0 ssmlGender is strictly 'FEMALE'");
  assert(sarah.googleVoice.name === "en-US-Neural2-F", "Persona 0 Google Voice is 'en-US-Neural2-F'");
  assert(sarah.googleVoice.languageCode === "en-US", "Persona 0 languageCode is 'en-US'");
  assert(sarah.voiceId === "en-US-Neural2-F", "Persona 0 canonical voiceId is 'en-US-Neural2-F'");
  assert(sarah.legacyAlias === "Salli", "Persona 0 backward-compatible alias is 'Salli'");

  // --- 2. DAVID CHEN (PERSONA 1) ---
  console.log("\n--- TEST 2: DAVID CHEN (PERSONA 1) MAPPINGS ---");
  const david = PERSONA_VOICE_MAP[1];
  assert(david !== undefined, "Persona 1 exists in registry");
  assert(david.personaName === "David Chen", "Persona 1 name is 'David Chen'");
  assert(david.gender === "male", "Persona 1 gender is strictly 'male'");
  assert(david.googleVoice.ssmlGender === "MALE", "Persona 1 ssmlGender is strictly 'MALE'");
  assert(david.googleVoice.name === "en-US-Neural2-D", "Persona 1 Google Voice is 'en-US-Neural2-D'");
  assert(david.googleVoice.languageCode === "en-US", "Persona 1 languageCode is 'en-US'");
  assert(david.voiceId === "en-US-Neural2-D", "Persona 1 canonical voiceId is 'en-US-Neural2-D'");
  assert(david.legacyAlias === "Matthew", "Persona 1 backward-compatible alias is 'Matthew'");

  // --- 3. MARCUS BRODY (PERSONA 2) ---
  console.log("\n--- TEST 3: MARCUS BRODY (PERSONA 2) MAPPINGS ---");
  const marcus = PERSONA_VOICE_MAP[2];
  assert(marcus !== undefined, "Persona 2 exists in registry");
  assert(marcus.personaName === "Marcus Brody", "Persona 2 name is 'Marcus Brody'");
  assert(marcus.gender === "male", "Persona 2 gender is strictly 'male'");
  assert(marcus.googleVoice.ssmlGender === "MALE", "Persona 2 ssmlGender is strictly 'MALE'");
  assert(marcus.googleVoice.name === "en-GB-Neural2-B", "Persona 2 Google Voice is 'en-GB-Neural2-B'");
  assert(marcus.googleVoice.languageCode === "en-GB", "Persona 2 languageCode is 'en-GB'");
  assert(marcus.voiceId === "en-GB-Neural2-B", "Persona 2 canonical voiceId is 'en-GB-Neural2-B'");
  assert(marcus.legacyAlias === "Brian", "Persona 2 backward-compatible alias is 'Brian'");

  // --- 4. RESOLVER BEHAVIOR & FLEXIBLE LOOKUP ---
  console.log("\n--- TEST 4: RESOLVER LOOKUPS & SYNONYMS ---");
  assert(resolveInterviewerVoice(0).personaId === 0, "resolveInterviewerVoice(0) resolves Sarah");
  assert(resolveInterviewerVoice("0").personaId === 0, "resolveInterviewerVoice('0') resolves Sarah");
  assert(resolveInterviewerVoice("sarah").personaId === 0, "resolveInterviewerVoice('sarah') resolves Sarah");
  assert(resolveInterviewerVoice("salli").personaId === 0, "resolveInterviewerVoice('salli') resolves Sarah via legacy alias");
  assert(resolveInterviewerVoice("en-US-Neural2-F").personaId === 0, "resolveInterviewerVoice('en-US-Neural2-F') resolves Sarah via canonical voice ID");
  assert(resolveInterviewerVoice(1).personaId === 1, "resolveInterviewerVoice(1) resolves David");
  assert(resolveInterviewerVoice("david").personaId === 1, "resolveInterviewerVoice('david') resolves David");
  assert(resolveInterviewerVoice("matthew").personaId === 1, "resolveInterviewerVoice('matthew') resolves David via legacy alias");
  assert(resolveInterviewerVoice(2).personaId === 2, "resolveInterviewerVoice(2) resolves Marcus");
  assert(resolveInterviewerVoice("marcus").personaId === 2, "resolveInterviewerVoice('marcus') resolves Marcus");
  assert(resolveInterviewerVoice("brian").personaId === 2, "resolveInterviewerVoice('brian') resolves Marcus via legacy alias");

  // --- 5. RESOLVER REJECTION OF INVALID / EMPTY INPUTS ---
  console.log("\n--- TEST 5: REJECTION OF INVALID / EMPTY INPUTS ---");
  let emptyRejected = false;
  try {
    resolveInterviewerVoice("");
  } catch (e: any) {
    emptyRejected = e.message.includes("MISSING_PERSONA");
  }
  assert(emptyRejected, "Empty persona parameter rejected with MISSING_PERSONA error");

  let invalidRejected = false;
  try {
    resolveInterviewerVoice(99);
  } catch (e: any) {
    invalidRejected = e.message.includes("INVALID_PERSONA");
  }
  assert(invalidRejected, "Persona ID 99 rejected with INVALID_PERSONA error");

  let stringInvalidRejected = false;
  try {
    resolveInterviewerVoice("unknown_bot");
  } catch (e: any) {
    stringInvalidRejected = e.message.includes("INVALID_PERSONA");
  }
  assert(stringInvalidRejected, "Unknown string persona rejected with INVALID_PERSONA error");

  // --- 6. VOICE DIAGNOSTICS & TELEMETRY AUDIT ---
  console.log("\n--- TEST 6: VOICE DIAGNOSTICS & TELEMETRY AUDIT ---");
  const diagnostics = getTTSDiagnostics();
  assert(diagnostics.personas.length === 3, "Diagnostics reports exactly 3 personas");
  assert(diagnostics.personas[0].googleVoiceName === "en-US-Neural2-F", "Diagnostics reports Sarah Google Voice");
  assert(diagnostics.personas[1].googleVoiceName === "en-US-Neural2-D", "Diagnostics reports David Google Voice");
  assert(diagnostics.personas[2].googleVoiceName === "en-GB-Neural2-B", "Diagnostics reports Marcus Google Voice");
  assert(typeof diagnostics.activeProvider === "string", `Diagnostics activeProvider is string ('${diagnostics.activeProvider}')`);
  assert(typeof diagnostics.credentialsConfigured === "boolean", "Diagnostics reports credential configuration flag");
  assert(Array.isArray(diagnostics.recentTelemetry), "Diagnostics reports recent telemetry array");

  // Security check: diagnostics stringified must not contain secret patterns
  const diagString = JSON.stringify(diagnostics);
  assert(!diagString.includes("AIzaSy"), "Diagnostics payload does not leak Google API key patterns");
  assert(!diagString.includes("Bearer"), "Diagnostics payload does not leak Bearer tokens");

  // --- 7. MALE / FEMALE STRICT INVARIANTS & AUTOMATED INVARIANT ASSERTIONS ---
  console.log("\n--- TEST 7: MALE / FEMALE STRICT INVARIANTS ---");
  assert(PERSONA_VOICE_MAP[0].gender === "female", "Persona 0 is FEMALE");
  assert(PERSONA_VOICE_MAP[1].gender === "male", "Persona 1 is MALE");
  assert(PERSONA_VOICE_MAP[2].gender === "male", "Persona 2 is MALE");

  const invariantResult = assertPersonaVoiceInvariants();
  assert(invariantResult.success === true, `Automated assertPersonaVoiceInvariants() verified ${invariantResult.verifiedCount} invariants cleanly`);

  console.log("\n================================================================================");
  console.log(`VOICE PERSONA MATRIX RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runVoicePersonaMatrixTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
