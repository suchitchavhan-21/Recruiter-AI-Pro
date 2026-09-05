/**
 * Recruiter AI Pro — Authoritative Interviewer Persona Voice Registry
 * 
 * Strict immutable mapping:
 * - Sarah Jenkins (personaId: 0) -> Salli (Female, US Executive)
 * - David Chen (personaId: 1)    -> Matthew (Male, US Technical Architect)
 * - Marcus Brody (personaId: 2)  -> Brian (Male, UK Engineering Leadership)
 */

export interface PersonaVoiceConfig {
  personaId: number;
  personaName: string;
  voiceId: string; // Canonical identifier: Google Cloud Neural2 voice
  legacyAlias: "Salli" | "Matthew" | "Brian"; // Backward-compatibility alias
  googleVoice: {
    languageCode: string;
    name: string;
    ssmlGender: "FEMALE" | "MALE";
  };
  gender: "female" | "male";
  locale: string;
}

export const PERSONA_VOICE_MAP: Record<number, PersonaVoiceConfig> = {
  0: {
    personaId: 0,
    personaName: "Sarah Jenkins",
    voiceId: "en-US-Neural2-F",
    legacyAlias: "Salli",
    googleVoice: {
      languageCode: "en-US",
      name: "en-US-Neural2-F",
      ssmlGender: "FEMALE"
    },
    gender: "female",
    locale: "en-US"
  },
  1: {
    personaId: 1,
    personaName: "David Chen",
    voiceId: "en-US-Neural2-D",
    legacyAlias: "Matthew",
    googleVoice: {
      languageCode: "en-US",
      name: "en-US-Neural2-D",
      ssmlGender: "MALE"
    },
    gender: "male",
    locale: "en-US"
  },
  2: {
    personaId: 2,
    personaName: "Marcus Brody",
    voiceId: "en-GB-Neural2-B",
    legacyAlias: "Brian",
    googleVoice: {
      languageCode: "en-GB",
      name: "en-GB-Neural2-B",
      ssmlGender: "MALE"
    },
    gender: "male",
    locale: "en-GB"
  }
};

/**
 * Resolves interviewer voice configuration strictly by persona ID.
 * Throws explicit error on missing or invalid persona ID.
 */
export function resolveInterviewerVoice(personaParam: unknown): PersonaVoiceConfig {
  if (personaParam === undefined || personaParam === null || String(personaParam).trim() === "") {
    throw new Error("MISSING_PERSONA: Valid persona parameter (0, 1, or 2) is required");
  }

  const raw = String(personaParam).trim().toLowerCase();
  let id: number | null = null;

  if (raw === "0" || raw === "sarah" || raw.includes("sarah") || raw === "salli" || raw === "en-us-neural2-f") {
    id = 0;
  } else if (raw === "1" || raw === "david" || raw.includes("david") || raw === "matthew" || raw === "en-us-neural2-d") {
    id = 1;
  } else if (raw === "2" || raw === "marcus" || raw.includes("marcus") || raw === "brian" || raw === "en-gb-neural2-b") {
    id = 2;
  } else {
    const parsed = Number(raw);
    if (!Number.isNaN(parsed) && parsed in PERSONA_VOICE_MAP) {
      id = parsed;
    }
  }

  if (id === null || !(id in PERSONA_VOICE_MAP)) {
    throw new Error(`INVALID_PERSONA: Unknown persona '${personaParam}'. Must be 0 (Sarah Jenkins), 1 (David Chen), or 2 (Marcus Brody)`);
  }

  return PERSONA_VOICE_MAP[id];
}

/**
 * Returns all configured interviewer persona voice profiles.
 */
export function getAllPersonasVoiceConfig(): PersonaVoiceConfig[] {
  return Object.values(PERSONA_VOICE_MAP);
}

export interface VoiceDiagnosticsItem {
  personaId: number;
  personaName: string;
  voiceId: string;
  legacyAlias: string;
  voiceAlias: string; // Backward-compatible alias
  googleVoiceName: string;
  gender: "female" | "male";
  locale: string;
}

/**
 * Returns clean diagnostic metadata for all persona voices without exposing secrets.
 */
export function getPersonaVoiceDiagnostics(): VoiceDiagnosticsItem[] {
  return Object.values(PERSONA_VOICE_MAP).map(p => ({
    personaId: p.personaId,
    personaName: p.personaName,
    voiceId: p.voiceId,
    legacyAlias: p.legacyAlias,
    voiceAlias: p.legacyAlias,
    googleVoiceName: p.googleVoice.name,
    gender: p.gender,
    locale: p.locale
  }));
}

/**
 * Automated invariant assertion function for interviewer voice mapping.
 * Throws an Error if any invariant fails.
 */
export function assertPersonaVoiceInvariants(): { success: boolean; verifiedCount: number } {
  const sarah = PERSONA_VOICE_MAP[0];
  const david = PERSONA_VOICE_MAP[1];
  const marcus = PERSONA_VOICE_MAP[2];

  if (!sarah || !david || !marcus) {
    throw new Error("INVARIANT_VIOLATION: Missing one or more authoritative persona voice records");
  }

  // 1. Canonical voice names
  if (sarah.voiceId !== "en-US-Neural2-F") throw new Error(`INVARIANT_VIOLATION: Sarah canonical voice must be 'en-US-Neural2-F', got '${sarah.voiceId}'`);
  if (david.voiceId !== "en-US-Neural2-D") throw new Error(`INVARIANT_VIOLATION: David canonical voice must be 'en-US-Neural2-D', got '${david.voiceId}'`);
  if (marcus.voiceId !== "en-GB-Neural2-B") throw new Error(`INVARIANT_VIOLATION: Marcus canonical voice must be 'en-GB-Neural2-B', got '${marcus.voiceId}'`);

  // 2. Gender assignment
  if (sarah.gender !== "female" || sarah.googleVoice.ssmlGender !== "FEMALE") throw new Error("INVARIANT_VIOLATION: Sarah gender must strictly be female/FEMALE");
  if (david.gender !== "male" || david.googleVoice.ssmlGender !== "MALE") throw new Error("INVARIANT_VIOLATION: David gender must strictly be male/MALE");
  if (marcus.gender !== "male" || marcus.googleVoice.ssmlGender !== "MALE") throw new Error("INVARIANT_VIOLATION: Marcus gender must strictly be male/MALE");

  // 3. Language & Locale code
  if (sarah.locale !== "en-US" || sarah.googleVoice.languageCode !== "en-US") throw new Error("INVARIANT_VIOLATION: Sarah locale must be 'en-US'");
  if (david.locale !== "en-US" || david.googleVoice.languageCode !== "en-US") throw new Error("INVARIANT_VIOLATION: David locale must be 'en-US'");
  if (marcus.locale !== "en-GB" || marcus.googleVoice.languageCode !== "en-GB") throw new Error("INVARIANT_VIOLATION: Marcus locale must be 'en-GB'");

  // 4. Legacy aliases preserved
  if (sarah.legacyAlias !== "Salli") throw new Error("INVARIANT_VIOLATION: Sarah legacy alias must be 'Salli'");
  if (david.legacyAlias !== "Matthew") throw new Error("INVARIANT_VIOLATION: David legacy alias must be 'Matthew'");
  if (marcus.legacyAlias !== "Brian") throw new Error("INVARIANT_VIOLATION: Marcus legacy alias must be 'Brian'");

  return { success: true, verifiedCount: 16 };
}
