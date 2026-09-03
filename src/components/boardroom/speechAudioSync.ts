/**
 * Real-Time Audio-Driven Speech & Analyser Synchronization Engine
 * 
 * Implements the required target architecture:
 * Gemini interviewer text
 *         ↓
 * controlled TTS audio (Acoustic Synthesizer or Audio Element)
 *         ↓
 * HTMLAudioElement / AudioBuffer
 *         ↓
 * Web Audio API (AudioBufferSourceNode / MediaElementAudioSourceNode)
 *         ↓
 * AnalyserNode (RMS amplitude, low/mid/high spectral analysis)
 *         ↓
 * speech activity / spectral features
 *         ↓
 * facial articulation
 *         ↓
 * HumanAvatar canvas
 * 
 * The same audio source is simultaneously heard by the candidate (via audioCtx.destination)
 * and analyzed by the avatar (via analyserNode).
 */

import { synthesizeAcousticSpeech, VoiceOptions } from "./controlledAudioTts";

export interface AudioAcousticMetrics {
  isPlaying: boolean;
  rms: number;             // Root Mean Square amplitude (0.0 to 1.0)
  spectralEnergy: number;  // Average spectral bin magnitude (0 to 255)
  midEnergy: number;       // Vowel formant energy (400 - 2200 Hz)
  highEnergy: number;      // Fricative / consonant energy (2500 - 6000 Hz)
  speechActivity: number;  // 0.0 (silent/pause) to 1.0 (loud speech)
  mouthOpening: number;    // Derived directly from acoustic energy (0.0 to 11.5px)
  mouthWidthScale: number; // Lip spread/rounding (0.90 to 1.10)
  jawOffset: number;       // Proportional chin displacement (0.0 to 3.7px)
}

class SpeechAudioSyncEngine {
  private static instance: SpeechAudioSyncEngine | null = null;

  // Web Audio API Core
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private currentMediaElementSource: MediaElementAudioSourceNode | null = null;

  // Analyser buffers
  private timeData: Uint8Array | null = null;
  private freqData: Uint8Array | null = null;

  // Playback state
  private isPlaying: boolean = false;
  private activeUtterance: SpeechSynthesisUtterance | null = null;

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
        this.analyser.smoothingTimeConstant = 0.35;

        this.gainNode = this.audioCtx.createGain();
        this.gainNode.gain.value = 1.0;

        // Routing: source -> gain -> analyser -> destination (Candidate hears audio)
        this.gainNode.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);

        this.timeData = new Uint8Array(this.analyser.fftSize);
        this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
      }
    } catch (err) {
      // AudioContext may be restricted until first user interaction
    }
  }

  /**
   * Hooks window.speechSynthesis to route speech through the controlled audio pipeline
   */
  private initGlobalSpeechHook() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const originalSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
    const originalCancel = window.speechSynthesis.cancel.bind(window.speechSynthesis);

    window.speechSynthesis.speak = (utterance: SpeechSynthesisUtterance) => {
      this.playUtteranceWithAudio(utterance);
    };

    window.speechSynthesis.cancel = () => {
      this.stopCurrentAudio();
      originalCancel();
    };
  }

  /**
   * Plays speech using controlled acoustic audio routed through Web Audio API & AnalyserNode
   */
  public playUtteranceWithAudio(utterance: SpeechSynthesisUtterance) {
    this.initWebAudio();
    this.stopCurrentAudio();

    if (!this.audioCtx || !this.analyser || !this.gainNode) {
      // Fallback if Web Audio unavailable
      if (utterance.onstart) (utterance as any).onstart();
      setTimeout(() => { if (utterance.onend) (utterance as any).onend(); }, 2000);
      return;
    }

    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }

    this.activeUtterance = utterance;
    const text = utterance.text || "";

    // Determine voice gender from utterance voice or default
    const isFemale = utterance.voice?.name ? /samantha|zira|karen|moira|tessa|fiona|lisa|amy|victoria|zoe|female|sara|jenny|aria/i.test(utterance.voice.name) : true;
    const gender: "female" | "male" = isFemale ? "female" : "male";

    // Synthesize real acoustic audio samples
    const sampleRate = this.audioCtx.sampleRate || 24000;
    const pcm = synthesizeAcousticSpeech(
      text,
      {
        gender,
        rate: utterance.rate || 1.0,
        pitch: utterance.pitch || 1.0
      },
      sampleRate
    );

    // Create AudioBuffer from acoustic PCM
    const buffer = this.audioCtx.createBuffer(1, pcm.length, sampleRate);
    buffer.copyToChannel(pcm, 0);

    // Create and connect AudioBufferSourceNode
    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gainNode);

    this.currentSource = source;
    this.isPlaying = true;

    // Trigger onstart event for ActiveInterview component
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
  }

  /**
   * Connects an external HTMLAudioElement to the same Web Audio API graph
   */
  public connectAudioElement(audioEl: HTMLAudioElement) {
    this.initWebAudio();
    if (!this.audioCtx || !this.gainNode) return;

    if (!this.currentMediaElementSource) {
      this.currentMediaElementSource = this.audioCtx.createMediaElementSource(audioEl);
      this.currentMediaElementSource.connect(this.gainNode);
    }
  }

  /**
   * Immediately stops any currently playing audio
   */
  public stopCurrentAudio() {
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
   * Used by HumanAvatar to drive organic facial articulation
   */
  public getAudioAcousticMetrics(): AudioAcousticMetrics {
    if (!this.isPlaying || !this.analyser || !this.timeData || !this.freqData) {
      return {
        isPlaying: false,
        rms: 0,
        spectralEnergy: 0,
        midEnergy: 0,
        highEnergy: 0,
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
    let midFreq = 0;
    let highFreq = 0;
    const binCount = this.freqData.length;

    // Bins roughly corresponding to 400-2200Hz (vowels) and 2500-6000Hz (consonants)
    const midStart = Math.floor(binCount * 0.08);
    const midEnd = Math.floor(binCount * 0.45);
    const highStart = midEnd;
    const highEnd = Math.floor(binCount * 0.85);

    for (let i = 0; i < binCount; i++) {
      const val = this.freqData[i];
      totalFreq += val;
      if (i >= midStart && i < midEnd) midFreq += val;
      if (i >= highStart && i < highEnd) highFreq += val;
    }

    const spectralEnergy = totalFreq / binCount;
    const midEnergy = midFreq / Math.max(midEnd - midStart, 1);
    const highEnergy = highFreq / Math.max(highEnd - highStart, 1);

    // 3. Audio Silence / Pause Detection
    // When acoustic RMS drops below threshold or during a punctuation pause, mouth closes completely
    const isSilent = rms < 0.016 || spectralEnergy < 4;

    if (isSilent) {
      return {
        isPlaying: true,
        rms: 0,
        spectralEnergy: 0,
        midEnergy: 0,
        highEnergy: 0,
        speechActivity: 0,
        mouthOpening: 0,
        mouthWidthScale: 1.0,
        jawOffset: 0
      };
    }

    // 4. Acoustic Articulation Mapping
    // Speech activity is proportional to audio RMS energy
    const speechActivity = Math.min(rms * 4.5, 1.0);
    // Vowel formant ratio influences vertical mouth opening
    const formantRatio = midEnergy / Math.max(midEnergy + highEnergy, 1);
    const targetMouthOpening = Math.min(rms * 34.0 * (0.75 + 0.5 * formantRatio), 11.5);
    // Lip spread / rounding derived from formant frequency ratio
    const targetWidthScale = 1.0 + (formantRatio - 0.5) * 0.16;
    const targetJawOffset = targetMouthOpening * 0.32;

    return {
      isPlaying: true,
      rms,
      spectralEnergy,
      midEnergy,
      highEnergy,
      speechActivity,
      mouthOpening: targetMouthOpening,
      mouthWidthScale: targetWidthScale,
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
