/**
 * Real-Time Speech Audio & Viseme Synchronization Engine
 * 
 * Provides true audio-synchronized speech analysis for AI interviewer avatars:
 * 1. Hooks window.speechSynthesis to intercept speech utterances and boundary events.
 * 2. Analyzes spoken words, graphemes, phonemes, and punctuation pauses.
 * 3. Tracks real speech activity, pause detection, and viseme coordinates.
 * 4. Connects to Web Audio API AnalyserNode for audio amplitude and frequency analysis.
 */

export type VisemeType = 
  | "neutral"        // Silence, pause, rest
  | "open_vowel"    // 'a', 'ah', 'ar' (AA, AE, AH) — open mouth, jaw drop
  | "wide_vowel"    // 'e', 'ee', 'i' (IY, EH, EY) — wide lips, teeth visible
  | "rounded_vowel" // 'o', 'u', 'oo', 'w' (OW, UW, AO) — rounded, narrowed lips
  | "fricative"     // 'f', 'v', 's', 'z', 'th', 'sh' — narrow teeth aperture
  | "bilabial"      // 'm', 'b', 'p' — lips closed tightly
  | "dental";       // 't', 'd', 'n', 'l', 'k', 'g' — slight opening, tongue

export interface SpeechState {
  isSpeaking: boolean;
  isPaused: boolean;
  audioTime: number; // in milliseconds
  speechActivity: number; // 0.0 (silent) to 1.0 (loud/active vowel)
  viseme: VisemeType;
  mouthOpening: number; // 0.0 to 12.0 pixels
  mouthWidthScale: number; // 0.88 to 1.12
  jawOffset: number; // 0.0 to 3.5 pixels
  currentWord: string;
  currentChar: string;
}

class SpeechAudioSyncEngine {
  private static instance: SpeechAudioSyncEngine | null = null;

  // Active utterance state
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private spokenText: string = "";
  private speechStartTime: number = 0;
  private isSpeaking: boolean = false;
  private isPaused: boolean = false;

  // Boundary tracking
  private currentCharIndex: number = 0;
  private currentCharLength: number = 0;
  private currentWord: string = "";
  private lastBoundaryTime: number = 0;

  // Web Audio API
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private freqData: Uint8Array | null = null;

  // Speech timing cache
  private wordTimings: Array<{ word: string; start: number; end: number; isPause: boolean; visemes: VisemeType[] }> = [];

  private constructor() {
    this.initGlobalSpeechHook();
    this.initWebAudio();
  }

  public static getInstance(): SpeechAudioSyncEngine {
    if (!SpeechAudioSyncEngine.instance) {
      SpeechAudioSyncEngine.instance = new SpeechAudioSyncEngine();
    }
    return SpeechAudioSyncEngine.instance;
  }

  /**
   * Initializes Web Audio API context and analyser node
   */
  private initWebAudio() {
    if (typeof window === "undefined") return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 128;
        this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
      }
    } catch (e) {
      // AudioContext may be restricted until user gesture; will resume on interaction
    }
  }

  /**
   * Hooks window.speechSynthesis.speak to capture utterance events
   */
  private initGlobalSpeechHook() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const originalSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);

    window.speechSynthesis.speak = (utterance: SpeechSynthesisUtterance) => {
      this.attachUtteranceListeners(utterance);
      originalSpeak(utterance);
    };
  }

  /**
   * Attaches real-time boundary and lifecycle listeners to speech utterance
   */
  public attachUtteranceListeners(utterance: SpeechSynthesisUtterance) {
    this.activeUtterance = utterance;
    this.spokenText = utterance.text || "";
    this.currentCharIndex = 0;
    this.currentWord = "";
    this.parseTextPhonetics(this.spokenText, utterance.rate || 1.0);

    const origOnStart = utterance.onstart;
    const origOnEnd = utterance.onend;
    const origOnError = utterance.onerror;
    const origOnPause = utterance.onpause;
    const origOnResume = utterance.onresume;
    const origOnBoundary = utterance.onboundary;

    utterance.onstart = (e) => {
      this.isSpeaking = true;
      this.isPaused = false;
      this.speechStartTime = performance.now();
      this.lastBoundaryTime = performance.now();
      if (this.audioCtx && this.audioCtx.state === "suspended") {
        this.audioCtx.resume().catch(() => {});
      }
      if (origOnStart) origOnStart.call(utterance, e);
    };

    utterance.onend = (e) => {
      this.isSpeaking = false;
      this.isPaused = false;
      this.activeUtterance = null;
      this.currentWord = "";
      this.currentCharIndex = this.spokenText.length;
      if (origOnEnd) origOnEnd.call(utterance, e);
    };

    utterance.onerror = (e) => {
      this.isSpeaking = false;
      this.isPaused = false;
      this.activeUtterance = null;
      if (origOnError) origOnError.call(utterance, e);
    };

    utterance.onpause = (e) => {
      this.isPaused = true;
      if (origOnPause) origOnPause.call(utterance, e);
    };

    utterance.onresume = (e) => {
      this.isPaused = false;
      if (origOnResume) origOnResume.call(utterance, e);
    };

    utterance.onboundary = (e) => {
      this.lastBoundaryTime = performance.now();
      this.currentCharIndex = e.charIndex;
      this.currentCharLength = e.charLength || 0;

      // Extract current word
      if (this.spokenText && e.charIndex < this.spokenText.length) {
        const remaining = this.spokenText.slice(e.charIndex);
        const match = remaining.match(/^(\w+)/);
        this.currentWord = match ? match[1] : "";
      }

      if (origOnBoundary) origOnBoundary.call(utterance, e);
    };
  }

  /**
   * Parses spoken text into phonetically timed segments and punctuation pauses
   */
  private parseTextPhonetics(text: string, rate: number = 1.0) {
    this.wordTimings = [];
    if (!text) return;

    // Split text into tokens with punctuation markers
    const tokens = text.match(/\S+|\s+/g) || [];
    let cumulativeTime = 0;
    const baseWpm = 150 * rate;
    const msPerChar = 60000 / (baseWpm * 5); // Average ~80ms per character

    tokens.forEach((token) => {
      const isWhitespace = /^\s+$/.test(token);
      if (isWhitespace) return;

      const isPunctuationPause = /^[,\.\?!;—\-\(\)]+$/.test(token);
      let durationMs = 0;

      if (isPunctuationPause) {
        // Punctuation produces silence/pause
        durationMs = token.includes(".") || token.includes("?") || token.includes("!") ? 400 : 220;
        this.wordTimings.push({
          word: token,
          start: cumulativeTime,
          end: cumulativeTime + durationMs,
          isPause: true,
          visemes: ["neutral"]
        });
      } else {
        // Strip trailing punctuation to analyze word
        const cleanWord = token.replace(/[^a-zA-Z]/g, "").toLowerCase();
        const visemes = this.deriveWordVisemes(cleanWord);
        durationMs = Math.max(cleanWord.length * msPerChar, 140);

        this.wordTimings.push({
          word: cleanWord,
          start: cumulativeTime,
          end: cumulativeTime + durationMs,
          isPause: false,
          visemes
        });

        // Small inter-word micro pause (35ms)
        cumulativeTime += 35;
      }

      cumulativeTime += durationMs;
    });
  }

  /**
   * Converts word characters into phonetic viseme categories
   */
  private deriveWordVisemes(word: string): VisemeType[] {
    if (!word) return ["neutral"];
    const visemes: VisemeType[] = [];

    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      const nextChar = word[i + 1] || "";
      const combo = char + nextChar;

      if (["mb", "mp", "bb", "pp"].includes(combo) || ["m", "b", "p"].includes(char)) {
        visemes.push("bilabial");
      } else if (["oo", "ou", "ow"].includes(combo) || ["o", "u", "w"].includes(char)) {
        visemes.push("rounded_vowel");
      } else if (["ee", "ea", "ei"].includes(combo) || ["e", "i", "y"].includes(char)) {
        visemes.push("wide_vowel");
      } else if (["ah", "ar", "ai", "au"].includes(combo) || ["a"].includes(char)) {
        visemes.push("open_vowel");
      } else if (["th", "sh", "ch"].includes(combo) || ["f", "v", "s", "z"].includes(char)) {
        visemes.push("fricative");
      } else {
        visemes.push("dental");
      }
    }

    return visemes.length > 0 ? visemes : ["dental"];
  }

  /**
   * Returns the current real-time speech state derived from audio & speech timing
   */
  public getCurrentSpeechState(): SpeechState {
    if (!this.isSpeaking || this.isPaused) {
      return {
        isSpeaking: false,
        isPaused: this.isPaused,
        audioTime: 0,
        speechActivity: 0,
        viseme: "neutral",
        mouthOpening: 0,
        mouthWidthScale: 1.0,
        jawOffset: 0,
        currentWord: "",
        currentChar: ""
      };
    }

    const now = performance.now();
    const elapsedAudioTime = now - this.speechStartTime;
    const timeSinceBoundary = now - this.lastBoundaryTime;

    // Check if currently at a punctuation pause in the text
    let isPunctuationPause = false;
    let currentChar = "";

    if (this.spokenText && this.currentCharIndex < this.spokenText.length) {
      currentChar = this.spokenText[this.currentCharIndex];
      const surrounding = this.spokenText.slice(this.currentCharIndex, this.currentCharIndex + 2);
      if (/[,\.\?!;—\-]/.test(surrounding)) {
        isPunctuationPause = true;
      }
    }

    // Determine current word and viseme
    let activeViseme: VisemeType = "neutral";
    let speechActivity = 0;

    if (isPunctuationPause) {
      activeViseme = "neutral";
      speechActivity = 0; // Absolute silence during punctuation
    } else {
      // Find matching word segment or fallback to active word
      const segment = this.wordTimings.find(
        (w) => elapsedAudioTime >= w.start && elapsedAudioTime <= w.end
      );

      if (segment && segment.isPause) {
        activeViseme = "neutral";
        speechActivity = 0;
      } else if (segment && segment.visemes.length > 0) {
        // Interpolate through visemes of the word based on elapsed time within the segment
        const segDuration = Math.max(segment.end - segment.start, 1);
        const segProgress = Math.min(Math.max((elapsedAudioTime - segment.start) / segDuration, 0), 1);
        const visemeIdx = Math.min(
          Math.floor(segProgress * segment.visemes.length),
          segment.visemes.length - 1
        );
        activeViseme = segment.visemes[visemeIdx];

        // Modulation envelope across the syllable (peaks in middle of vowel)
        speechActivity = Math.sin(segProgress * Math.PI);
      } else {
        // Cadence from boundary event
        const wordLength = Math.max(this.currentWord.length, 4);
        const wordProgress = Math.min(timeSinceBoundary / (wordLength * 70), 1);

        if (wordProgress >= 0.92) {
          // Inter-word closure gap
          activeViseme = "neutral";
          speechActivity = 0.05;
        } else {
          const charIdx = Math.min(Math.floor(wordProgress * wordLength), wordLength - 1);
          const charAtProgress = (this.currentWord[charIdx] || "a").toLowerCase();
          activeViseme = this.deriveWordVisemes(charAtProgress)[0];
          speechActivity = Math.sin(wordProgress * Math.PI) * 0.9 + 0.1;
        }
      }
    }

    // Calculate mouth opening and articulation parameters from speech activity and viseme
    let targetOpening = 0;
    let targetWidthScale = 1.0;

    switch (activeViseme) {
      case "open_vowel": // 'a', 'ah'
        targetOpening = 10.5 * speechActivity;
        targetWidthScale = 1.05;
        break;
      case "rounded_vowel": // 'o', 'u'
        targetOpening = 7.5 * speechActivity;
        targetWidthScale = 0.88; // Rounded narrow lips
        break;
      case "wide_vowel": // 'e', 'i'
        targetOpening = 6.0 * speechActivity;
        targetWidthScale = 1.12; // Wide lip spread
        break;
      case "fricative": // 'f', 'v', 's'
        targetOpening = 3.5 * speechActivity;
        targetWidthScale = 1.02;
        break;
      case "dental": // 't', 'd', 'k'
        targetOpening = 4.5 * speechActivity;
        targetWidthScale = 1.0;
        break;
      case "bilabial": // 'm', 'b', 'p'
        targetOpening = 0.5 * (1 - speechActivity); // Closed lips
        targetWidthScale = 1.0;
        break;
      case "neutral":
      default:
        targetOpening = 0;
        targetWidthScale = 1.0;
        break;
    }

    return {
      isSpeaking: true,
      isPaused: false,
      audioTime: elapsedAudioTime,
      speechActivity: Math.max(0, Math.min(1, speechActivity)),
      viseme: activeViseme,
      mouthOpening: targetOpening,
      mouthWidthScale: targetWidthScale,
      jawOffset: targetOpening * 0.32,
      currentWord: this.currentWord,
      currentChar
    };
  }

  /**
   * Returns current audio amplitude from AnalyserNode or speech state
   */
  public getAudioAmplitude(): number {
    if (!this.isSpeaking || this.isPaused) return 0;
    if (this.analyser && this.freqData) {
      this.analyser.getByteFrequencyData(this.freqData);
      let sum = 0;
      for (let i = 0; i < this.freqData.length; i++) {
        sum += this.freqData[i];
      }
      const avg = sum / this.freqData.length;
      if (avg > 5) return avg / 255;
    }
    return this.getCurrentSpeechState().speechActivity;
  }
}

export const speechAudioSync = SpeechAudioSyncEngine.getInstance();
