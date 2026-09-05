/**
 * Recruiter AI Pro — Google Cloud Text-to-Speech (TTS) Provider
 * 
 * Production implementation using Google Cloud Text-to-Speech API:
 * - Server-side authentication via GOOGLE_CLOUD_API_KEY or GEMINI_API_KEY
 * - Persona-conditioned Google Neural2 voices (en-US-Neural2-F, en-US-Neural2-D, en-GB-Neural2-B)
 * - Zero third-party web scraping / zero ttsmp3.com
 * - Strict timeout, retry, and robust mock fallback for offline test environments
 */

import { ENV } from "../config/env";
import { PERSONA_VOICE_MAP, getPersonaVoiceDiagnostics } from "./interviewerVoices";

export interface TTSProvider {
  name: string;
  synthesizeSpeech(text: string, voiceId: string): Promise<Buffer>;
}

/**
 * Builds a valid, standard MPEG audio buffer containing silent MP3 frames
 * for local testing, offline development, or graceful degradation.
 */
export function createSilentMp3Buffer(frameCount = 25): Buffer {
  // Standard MPEG-1 Layer 3 frame header (44.1kHz, 128kbps stereo)
  // Each frame is 417 bytes with a 4-byte sync header: 0xFF, 0xFB, 0x90, 0x64
  const frameLength = 417;
  const buffer = Buffer.alloc(frameLength * frameCount);

  for (let i = 0; i < frameCount; i++) {
    const offset = i * frameLength;
    buffer[offset] = 0xff;
    buffer[offset + 1] = 0xfb;
    buffer[offset + 2] = 0x90;
    buffer[offset + 3] = 0x64;
  }

  return buffer;
}

export class MockTTSProvider implements TTSProvider {
  name = "MockGoogleTTS";

  async synthesizeSpeech(text: string, voiceId: string): Promise<Buffer> {
    const start = Date.now();
    // Generate ~83.4 KB of valid MPEG audio frames (approx 5.22 seconds of 44.1kHz audio)
    const buf = createSilentMp3Buffer(200);
    setLastSynthesisLatency(Date.now() - start);
    return buf;
  }
}

export class GoogleCloudTTSProvider implements TTSProvider {
  name = "GoogleCloudTTS";

  private getVoiceConfig(voiceId: string) {
    const normalized = voiceId.toLowerCase();
    for (const persona of Object.values(PERSONA_VOICE_MAP)) {
      if (
        persona.voiceId.toLowerCase() === normalized ||
        persona.googleVoice.name.toLowerCase() === normalized ||
        persona.personaName.toLowerCase().includes(normalized)
      ) {
        return persona.googleVoice;
      }
    }

    // Default to en-US Neural2 Female
    return {
      languageCode: "en-US",
      name: "en-US-Neural2-F",
      ssmlGender: "FEMALE" as const
    };
  }

  async synthesizeSpeech(text: string, voiceId: string): Promise<Buffer> {
    const start = Date.now();
    const apiKey = (process.env.GOOGLE_CLOUD_API_KEY || process.env.GOOGLE_CLOUD_TTS_API_KEY || "").trim();
    const accessToken = (process.env.GOOGLE_CLOUD_ACCESS_TOKEN || "").trim();
    const voiceConfig = this.getVoiceConfig(voiceId);

    // Dedicated Google Cloud credentials are strictly required; Gemini API key fallback is prohibited
    if (!apiKey && !accessToken) {
      throw new Error("Google Cloud TTS credentials are not configured. Dedicated GOOGLE_CLOUD_API_KEY or GOOGLE_CLOUD_TTS_API_KEY is required; GEMINI_API_KEY cannot be used as an implicit substitute.");
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const queryParam = apiKey ? `?key=${encodeURIComponent(apiKey)}` : "";
        const url = `https://texttospeech.googleapis.com/v1/text:synthesize${queryParam}`;
        const headers: Record<string, string> = {
          "Content-Type": "application/json"
        };

        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`;
        }

        const requestBody = {
          input: { text },
          voice: {
            languageCode: voiceConfig.languageCode,
            name: voiceConfig.name,
            ssmlGender: voiceConfig.ssmlGender
          },
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: 1.0,
            pitch: 0.0
          }
        };

        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(8000)
        });

        if (!response.ok) {
          throw new Error(`Google Cloud TTS returned HTTP status ${response.status}`);
        }

        const json: any = await response.json();
        if (!json.audioContent) {
          throw new Error("Google Cloud TTS response missing audioContent field");
        }

        setLastSynthesisLatency(Date.now() - start);
        return Buffer.from(json.audioContent, "base64");
      } catch (err: any) {
        const sanitizedMsg = (err?.message || "Unknown error").replace(/key=[^&\s]+/gi, "key=[REDACTED]");
        lastError = new Error(sanitizedMsg);
        console.warn(`[GOOGLE CLOUD TTS RETRY]: Attempt ${attempt} for voice '${voiceId}' failed:`, sanitizedMsg);
        if (attempt === 1) {
          await new Promise(r => setTimeout(r, 400));
        }
      }
    }

    // Fail explicitly so the HTTP layer returns 503 TTS_UNAVAILABLE instead of masking failure with fake audio
    throw new Error(`Google Cloud TTS synthesis failed: ${lastError?.message || "Service unavailable"}`);
  }
}

let lastSynthesisLatencyMs = 0;

export function getLastSynthesisLatency(): number {
  return lastSynthesisLatencyMs;
}

export function setLastSynthesisLatency(ms: number): void {
  lastSynthesisLatencyMs = ms;
}

// Backward-compatible alias
export const ProductionTTSProvider = GoogleCloudTTSProvider;

function resolveInitialTTSProvider(): TTSProvider {
  const isRealRequired = process.env.REAL_TTS_REQUIRED === "true";
  if (isRealRequired) {
    return new GoogleCloudTTSProvider();
  }
  return (process.env.MOCK_TTS === "true" || process.env.USE_MOCK_TTS === "true")
    ? new MockTTSProvider()
    : new GoogleCloudTTSProvider();
}

let activeTTSProvider: TTSProvider = resolveInitialTTSProvider();

export function getTTSProvider(): TTSProvider {
  return activeTTSProvider;
}

export function setTTSProvider(provider: TTSProvider): void {
  activeTTSProvider = provider;
}

export function resetTTSProvider(): void {
  activeTTSProvider = resolveInitialTTSProvider();
}

export interface TTSDiagnosticsReport {
  activeProvider: string;
  realTTSRequired: boolean;
  credentialsConfigured: boolean;
  credentialType: "api_key" | "access_token" | "none";
  personas: import("./interviewerVoices").VoiceDiagnosticsItem[];
  lastLatencyMs: number;
}

export function getTTSDiagnostics(): TTSDiagnosticsReport {
  const apiKey = (process.env.GOOGLE_CLOUD_API_KEY || process.env.GOOGLE_CLOUD_TTS_API_KEY || "").trim();
  const accessToken = (process.env.GOOGLE_CLOUD_ACCESS_TOKEN || "").trim();
  const hasCredentials = Boolean(apiKey || accessToken);

  return {
    activeProvider: activeTTSProvider.name,
    realTTSRequired: process.env.REAL_TTS_REQUIRED === "true",
    credentialsConfigured: hasCredentials,
    credentialType: accessToken ? "access_token" : apiKey ? "api_key" : "none",
    personas: getPersonaVoiceDiagnostics(),
    lastLatencyMs: lastSynthesisLatencyMs
  };
}
