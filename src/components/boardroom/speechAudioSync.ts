/**
 * Real-Time Audio-Driven Speech & Analyser Synchronization Engine
 * 
 * Pipeline:
 * 1. Takes Gemini interviewer text
 * 2. Fetches high-definition neural speech audio (/api/tts)
 * 3. Decodes into Web Audio API AudioBuffer
 * 4. Routes through AnalyserNode -> AudioContext.destination
 *    (Candidate hears natural audio; Analyser measures exact acoustic signal)
 * 5. Extracts RMS energy, spectral features, and jaw displacement
 * 6. Drives HumanAvatar continuous photographic mesh deformation
 */

export interface AudioAcousticMetrics {
  isPlaying: boolean;
  rms: number;             // Real-time RMS amplitude (0.0 to 1.0)
  spectralEnergy: number;  // Frequency bin magnitude (0 to 255)
  speechActivity: number;  // 0.0 (silent/pause) to 1.0 (loud speech)
  mouthOpening: number;    // Derived directly from acoustic energy (0.0 to 10.0px)
  mouthWidthScale: number; // Lip spread/rounding (0.92 to 1.08)
  jawOffset: number;       // Proportional chin displacement (0.0 to 3.8px)
}

class SpeechAudioSyncEngine {
  private static instance: SpeechAudioSyncEngine | null = null;

  // Web Audio API Graph
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private currentSource: AudioBufferSourceNode | null = null;

  // Analyser buffers
  private timeData: Uint8Array | null = null;
  private freqData: Uint8Array | null = null;

  // Playback state
  private isPlaying: boolean = false;
  private activePersonaId: number = 0;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private currentAbortController: AbortController | null = null;

  private constructor() {
    this.initWebAudio();
    this.initGlobalSpeechHook();
  }

  public static getInstance(): SpeechAudioSyncEngine {
    if (!SpeechAudioSyncEngine.instance) {
      SpeechAudioSyncEngine.instance = new SpeechAudioSyncEngine();
    }
    return SpeechAudioSyncEngine.instance;
  }

  /**
   * Sets the active interviewer persona for voice calibration
   * 0 = Sarah Jenkins (Salli - Female)
   * 1 = David Chen (Matthew - Male Technical)
   * 2 = Marcus Brody (Brian - Male Leadership)
   */
  public setActivePersona(personaId: number): void {
    this.activePersonaId = personaId;
  }

  public getActivePersona(): number {
    return this.activePersonaId;
  }

  /**
   * Initializes the Web Audio API audio graph
   */
  public initWebAudio() {
    if (typeof window === "undefined") return;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass && !this.audioCtx) {
        this.audioCtx = new AudioCtxClass();
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.2;

        this.gainNode = this.audioCtx.createGain();
        this.gainNode.gain.value = 1.0;

        // Routing: source -> gain -> analyser -> destination (Candidate hears audio)
        this.gainNode.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);

        this.timeData = new Uint8Array(this.analyser.fftSize);
        this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
      }
    } catch (err) {
      // AudioContext will resume on first user interaction
    }
  }

  /**
   * Global Hook on window.speechSynthesis to route speech through the neural audio pipeline
   */
  private initGlobalSpeechHook() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const originalSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
    const originalCancel = window.speechSynthesis.cancel.bind(window.speechSynthesis);

    window.speechSynthesis.speak = (utterance: SpeechSynthesisUtterance) => {
      this.playUtteranceWithNeuralAudio(utterance, originalSpeak);
    };

    window.speechSynthesis.cancel = () => {
      this.stopCurrentAudio();
      originalCancel();
    };
  }

  /**
   * Plays speech using natural neural audio routed through Web Audio API & AnalyserNode
   */
  public async playUtteranceWithNeuralAudio(
    utterance: SpeechSynthesisUtterance,
    fallbackSpeak?: (utt: SpeechSynthesisUtterance) => void
  ) {
    this.initWebAudio();
    this.stopCurrentAudio();

    const text = (utterance.text || "").trim();
    if (!text) return;

    this.activeUtterance = utterance;
    this.currentAbortController = new AbortController();

    if (this.audioCtx && this.audioCtx.state === "suspended") {
      await this.audioCtx.resume().catch(() => {});
    }

    try {
      // Resolve persona ID reliably: from utterance, window global, or active persona
      const personaId = (utterance as any).personaId !== undefined
        ? Number((utterance as any).personaId)
        : ((typeof window !== "undefined" && (window as any).__ACTIVE_INTERVIEWER_PERSONA_ID__ !== undefined)
            ? Number((window as any).__ACTIVE_INTERVIEWER_PERSONA_ID__)
            : this.activePersonaId);

      // Determine persona voice ID
      const voiceId = personaId === 0 ? "Salli" : (personaId === 1 ? "Matthew" : "Brian");

      // Fetch natural human speech audio from neural TTS endpoint
      const res = await fetch(`/api/tts?text=${encodeURIComponent(text)}&persona=${personaId}&voice=${voiceId}`, {
        signal: this.currentAbortController.signal
      });

      if (!res.ok) throw new Error(`TTS HTTP error: ${res.status}`);

      const arrayBuf = await res.arrayBuffer();
      if (!this.audioCtx || !this.analyser || !this.gainNode) throw new Error("Audio graph uninitialized");

      const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuf);
      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.gainNode);

      this.currentSource = source;
      this.isPlaying = true;

      // Trigger start lifecycle
      if (utterance.onstart) {
        (utterance as any).onstart(new Event("start"));
      }

      source.onended = () => {
        if (this.currentSource === source) {
          this.isPlaying = false;
          this.currentSource = null;
          this.activeUtterance = null;
          if (utterance.onend) {
            (utterance as any).onend(new Event("end"));
          }
        }
      };

      source.start(0);
    } catch (err: any) {
      if (err?.name === "AbortError") return;

      // Resilient fallback to native browser voice if offline/network failure
      console.warn("[TTS PIPELINE]: Falling back to native browser speech:", err?.message);
      if (fallbackSpeak) {
        this.isPlaying = false;
        fallbackSpeak(utterance);
      }
    }
  }

  /**
   * Immediately stops any currently playing audio
   */
  public stopCurrentAudio() {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }
    if (this.currentSource) {
      try {
        this.currentSource.stop(0);
        this.currentSource.disconnect();
      } catch {}
      this.currentSource = null;
    }
    this.isPlaying = false;
    this.activeUtterance = null;
  }

  /**
   * Extracts real-time acoustic metrics directly from AnalyserNode
   * Directly drives HumanAvatar photographic lower-face deformation
   */
  public getAudioAcousticMetrics(): AudioAcousticMetrics {
    if (!this.isPlaying || !this.analyser || !this.timeData || !this.freqData) {
      return {
        isPlaying: false,
        rms: 0,
        spectralEnergy: 0,
        speechActivity: 0,
        mouthOpening: 0,
        mouthWidthScale: 1.0,
        jawOffset: 0
      };
    }

    // 1. Time-domain waveform analysis (RMS energy)
    this.analyser.getByteTimeDomainData(this.timeData);
    let sumSq = 0;
    for (let i = 0; i < this.timeData.length; i++) {
      const normalized = (this.timeData[i] - 128) / 128;
      sumSq += normalized * normalized;
    }
    const rms = Math.sqrt(sumSq / this.timeData.length);

    // 2. Frequency-domain spectral analysis
    this.analyser.getByteFrequencyData(this.freqData);
    let totalFreq = 0;
    const binCount = this.freqData.length;
    for (let i = 0; i < binCount; i++) {
      totalFreq += this.freqData[i];
    }
    const spectralEnergy = totalFreq / binCount;

    // 3. Acoustic Silence / Pause Detection
    // Absolute silence when RMS drops below threshold
    if (rms < 0.015 || spectralEnergy < 3) {
      return {
        isPlaying: true,
        rms: 0,
        spectralEnergy: 0,
        speechActivity: 0,
        mouthOpening: 0,
        mouthWidthScale: 1.0,
        jawOffset: 0
      };
    }

    // 4. Acoustic Articulation & Lower Face Displacement
    const speechActivity = Math.min(rms * 4.2, 1.0);
    const targetMouthOpening = Math.min(rms * 28.0, 9.5); // Natural opening in pixels
    const targetJawOffset = targetMouthOpening * 0.42;    // Proportional jaw drop

    return {
      isPlaying: true,
      rms,
      spectralEnergy,
      speechActivity,
      mouthOpening: targetMouthOpening,
      mouthWidthScale: 1.0,
      jawOffset: targetJawOffset
    };
  }

  public getCurrentSpeechState() {
    const metrics = this.getAudioAcousticMetrics();
    return {
      isSpeaking: metrics.isPlaying && metrics.speechActivity > 0,
      isPaused: metrics.isPlaying && metrics.speechActivity === 0,
      speechActivity: metrics.speechActivity,
      mouthOpening: metrics.mouthOpening,
      mouthWidthScale: metrics.mouthWidthScale,
      jawOffset: metrics.jawOffset
    };
  }
}

export const speechAudioSync = SpeechAudioSyncEngine.getInstance();
