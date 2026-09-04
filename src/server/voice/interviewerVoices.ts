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
  voiceId: string;
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
    voiceId: "Salli",
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
    voiceId: "Matthew",
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
    voiceId: "Brian",
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

  if (raw === "0" || raw === "sarah" || raw.includes("sarah")) {
    id = 0;
  } else if (raw === "1" || raw === "david" || raw.includes("david")) {
    id = 1;
  } else if (raw === "2" || raw === "marcus" || raw.includes("marcus")) {
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
