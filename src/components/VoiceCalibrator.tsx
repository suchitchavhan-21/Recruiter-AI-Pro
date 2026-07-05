import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, 
  MicOff, 
  Sliders, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Sparkles, 
  Activity, 
  Volume1, 
  ShieldCheck, 
  Play, 
  Square,
  HelpCircle,
  Info
} from "lucide-react";

interface VoiceCalibratorProps {
  onCalibrationComplete?: (settings: {
    pitch: number;
    rate: number;
    noiseFloor: number;
    fidelityScore: number;
    speakingPace: string;
    gain: number;
  }) => void;
}

export default function VoiceCalibrator({ onCalibrationComplete }: VoiceCalibratorProps) {
  // Test Calibration States
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [noiseFloor, setNoiseFloor] = useState<number>(0.05); // Default noise floor threshold
  const [gainValue, setGainValue] = useState<number>(1.0); // Calibrated digital gain
  
  // Speech Recognition Calibration
  const [isSTTListening, setIsSTTListening] = useState(false);
  const [sttTranscript, setSttTranscript] = useState("");
  const [sttFidelity, setSttFidelity] = useState<number | null>(null);
  const [sttStatus, setSttStatus] = useState<"idle" | "listening" | "success" | "error">("idle");
  const [sttError, setSttError] = useState("");
  
  // Pace metrics
  const [speakingWPM, setSpeakingWPM] = useState<number | null>(null);
  const [paceLabel, setPaceLabel] = useState<"Too Slow" | "Perfect" | "Too Fast" | "">("");

  // Synthesis calibration states
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [synthRate, setSynthRate] = useState(0.93);
  const [synthPitch, setSynthPitch] = useState(0.98);
  const [isPlayingTestSynth, setIsPlayingTestSynth] = useState(false);

  // Calibration Wizard Steps: "hardware" | "fidelity" | "synth"
  const [activeStep, setActiveStep] = useState<"hardware" | "fidelity" | "synth">("hardware");
  const [isCalibratingNoise, setIsCalibratingNoise] = useState(false);
  const [noiseCountdown, setNoiseCountdown] = useState(3);

  // Calibration Target sentence
  const targetSentence = "I specialize in scaling high-throughput APIs and designing distributed systems.";

  // Audio Context Ref for level meter
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const sttStartTimeRef = useRef<number>(0);

  // 1. Load Synthesis Voices on Mount
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const loadVoices = () => {
        const available = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith("en"));
        setVoices(available);
        if (available.length > 0) {
          const defaultVoice = available.find(v => 
            v.name.includes("Natural") || 
            v.name.includes("Google US English") || 
            v.name.includes("Samantha") ||
            v.name.includes("Zira")
          );
          setSelectedVoice(defaultVoice ? defaultVoice.name : available[0].name);
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Recover stored settings if any
    const savedRate = localStorage.getItem("voice_calibrated_rate");
    const savedPitch = localStorage.getItem("voice_calibrated_pitch");
    const savedGain = localStorage.getItem("voice_calibrated_gain");
    const savedNoise = localStorage.getItem("voice_calibrated_noise");
    
    if (savedRate) setSynthRate(parseFloat(savedRate));
    if (savedPitch) setSynthPitch(parseFloat(savedPitch));
    if (savedGain) setGainValue(parseFloat(savedGain));
    if (savedNoise) setNoiseFloor(parseFloat(savedNoise));

    return () => {
      stopMicStream();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        try { recognitionRef.current.stop(); } catch(e){}
      }
    };
  }, []);

  // 2. Microphone stream management
  const startMicStream = async () => {
    try {
      stopMicStream();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStream(stream);
      
      // Initialize Web Audio API for metering
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        dataArrayRef.current = dataArray;

        const updateMeter = () => {
          if (!analyserRef.current || !dataArrayRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArrayRef.current);
          
          // Calculate average amplitude
          let sum = 0;
          for (let i = 0; i < dataArrayRef.current.length; i++) {
            sum += dataArrayRef.current[i];
          }
          const average = sum / dataArrayRef.current.length;
          const normalized = Math.min(average / 140, 1.0); // Normalize to 0-1
          setAudioLevel(normalized);
          
          animationFrameRef.current = requestAnimationFrame(updateMeter);
        };
        updateMeter();
      }
    } catch (err: any) {
      console.error("Mic Access Denied:", err);
      setSttStatus("error");
      setSttError("Microphone permission was denied. If you are inside an iframe preview, please click the 'Open in New Tab' icon at the top right to grant microphone permissions directly to the app browser window.");
    }
  };

  const stopMicStream = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (micStream) {
      micStream.getTracks().forEach(track => track.stop());
      setMicStream(null);
    }
    setAudioLevel(0);
  };

  // 3. Ambient Noise Calibration
  const triggerNoiseCalibration = () => {
    if (!micStream) {
      alert("Please initialize your microphone test stream first!");
      return;
    }
    setIsCalibratingNoise(true);
    setNoiseCountdown(3);
    
    const noiseLevels: number[] = [];
    
    const interval = setInterval(() => {
      setNoiseCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // Calculate noise floor (average level during silence)
          const finalNoise = noiseLevels.length > 0 
            ? Math.max(...noiseLevels, 0.02) // At least 0.02
            : 0.05;
          
          // Recommend gain based on silence
          const recommendedGain = finalNoise > 0.15 ? 0.8 : finalNoise < 0.04 ? 1.3 : 1.0;
          setNoiseFloor(parseFloat(finalNoise.toFixed(3)));
          setGainValue(parseFloat(recommendedGain.toFixed(2)));
          
          localStorage.setItem("voice_calibrated_noise", finalNoise.toFixed(3));
          localStorage.setItem("voice_calibrated_gain", recommendedGain.toFixed(2));
          
          setIsCalibratingNoise(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Collect levels
    const collectInterval = setInterval(() => {
      setAudioLevel(curr => {
        noiseLevels.push(curr);
        return curr;
      });
    }, 150);

    setTimeout(() => clearInterval(collectInterval), 3000);
  };

  // 4. Speech to Text Calibration and WPM Calculator
  const handleToggleSTTTest = () => {
    if (isSTTListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsSTTListening(false);
      return;
    }

    setSttTranscript("");
    setSttFidelity(null);
    setSpeakingWPM(null);
    setPaceLabel("");
    setSttError("");

    const SpeechClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechClass) {
      setSttStatus("error");
      setSttError("Speech recognition API is not supported in this browser. Please use Chrome/Safari or open the app in a new tab.");
      return;
    }

    try {
      const rec = new SpeechClass();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = "en-US";
      recognitionRef.current = rec;

      rec.onstart = () => {
        setIsSTTListening(true);
        setSttStatus("listening");
        sttStartTimeRef.current = Date.now();
      };

      rec.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setSttTranscript(transcript);
      };

      rec.onerror = (e: any) => {
        console.error("STT Calibration Error:", e);
        setSttStatus("error");
        setSttError(`Recognition error code: ${e.error || "Unknown"}. Make sure your microphone is working and not muted.`);
        setIsSTTListening(false);
      };

      rec.onend = () => {
        setIsSTTListening(false);
        setSttStatus("success");
        calculateFidelityAndPace();
      };

      rec.start();
    } catch (err: any) {
      console.error(err);
      setSttStatus("error");
      setSttError(err.message || "Failed to initialize Web Speech API");
    }
  };

  // Compare transcript and target sentence to calculate similarity
  const calculateFidelityAndPace = () => {
    setSttTranscript(currTranscript => {
      if (!currTranscript) {
        setSttFidelity(0);
        return currTranscript;
      }

      // 1. Calculate accuracy/fidelity score
      const tWords = targetSentence.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").split(/\s+/);
      const cWords = currTranscript.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").split(/\s+/);

      let matches = 0;
      tWords.forEach(w => {
        if (cWords.includes(w)) matches++;
      });

      const fidelity = Math.round((matches / tWords.length) * 100);
      setSttFidelity(fidelity);

      // 2. Calculate speaking pace (WPM)
      const durationSeconds = (Date.now() - sttStartTimeRef.current) / 1000;
      const wordCount = cWords.length;
      if (durationSeconds > 0.5) {
        const wpm = Math.round((wordCount / durationSeconds) * 60);
        setSpeakingWPM(wpm);

        if (wpm < 100) {
          setPaceLabel("Too Slow");
        } else if (wpm > 165) {
          setPaceLabel("Too Fast");
        } else {
          setPaceLabel("Perfect");
        }
      }

      // Save accuracy to local storage
      localStorage.setItem("voice_calibrated_fidelity", fidelity.toString());
      return currTranscript;
    });
  };

  // 5. Speak Synthetic Test Question
  const handlePlayTestSynth = () => {
    if (isPlayingTestSynth) {
      window.speechSynthesis.cancel();
      setIsPlayingTestSynth(false);
      return;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      
      const text = "Voice calibration diagnostics successful. I will speak at this speed and tone pitch during your active simulation loop.";
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (selectedVoice) {
        const targetVoice = voices.find(v => v.name === selectedVoice);
        if (targetVoice) utterance.voice = targetVoice;
      }
      
      utterance.rate = synthRate;
      utterance.pitch = synthPitch;
      
      utterance.onstart = () => setIsPlayingTestSynth(true);
      utterance.onend = () => setIsPlayingTestSynth(false);
      utterance.onerror = () => setIsPlayingTestSynth(false);
      
      window.speechSynthesis.speak(utterance);

      // Save synthesis states
      localStorage.setItem("voice_calibrated_rate", synthRate.toString());
      localStorage.setItem("voice_calibrated_pitch", synthPitch.toString());
      localStorage.setItem("recruiter_selected_voice", selectedVoice);
    }
  };

  // 6. Complete and Save full Voice Profile
  const handleSaveFullCalibration = () => {
    localStorage.setItem("voice_calibrated_active", "true");
    
    const settings = {
      pitch: synthPitch,
      rate: synthRate,
      noiseFloor: noiseFloor,
      fidelityScore: sttFidelity || 85,
      speakingPace: paceLabel || "Perfect",
      gain: gainValue
    };

    if (onCalibrationComplete) {
      onCalibrationComplete(settings);
    }

    alert("Voice Profile fully calibrated and saved! Your microphone threshold, speaking tempo metrics, and preferred interviewer speech synthetics have been successfully locked in.");
  };

  return (
    <div className="bg-[#111827] border border-[#27272A] rounded-2xl overflow-hidden shadow-2xl space-y-0 animate-fade-in max-w-3xl mx-auto">
      {/* Calibration Header */}
      <div className="p-6 border-b border-[#27272A]/70 bg-gradient-to-r from-indigo-950/20 to-transparent flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-[#6D5EF8]/10 border border-[#6D5EF8]/20 text-xs text-[#6D5EF8]">
              <Sliders className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-extrabold text-white uppercase font-mono tracking-wider">
              AI Voice & Mic Calibration Suite
            </h3>
          </div>
          <p className="text-[11px] text-slate-400">
            Tune speech-to-text filters, sound gains, pace meters, and synthesis variables for optimal hands-free interview simulation.
          </p>
        </div>

        {/* Dynamic Status Badges */}
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className={`px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
            micStream 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
              : "bg-slate-900 border-[#27272A] text-slate-500"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${micStream ? "bg-emerald-400 animate-ping" : "bg-slate-700"}`} />
            {micStream ? "Hardware Connected" : "Hardware Offline"}
          </span>
        </div>
      </div>

      {/* Step Wizard Buttons */}
      <div className="grid grid-cols-3 border-b border-[#27272A]/50 bg-[#09090B]/40 text-xs font-mono text-center">
        <button
          onClick={() => { setActiveStep("hardware"); startMicStream(); }}
          className={`py-3 transition-colors cursor-pointer border-r border-[#27272A]/40 font-bold flex items-center justify-center gap-1.5 ${
            activeStep === "hardware" ? "bg-[#111827] text-[#6D5EF8] border-b-2 border-b-[#6D5EF8]" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          <span>1. Hardware Setup</span>
        </button>

        <button
          onClick={() => { setActiveStep("fidelity"); startMicStream(); }}
          className={`py-3 transition-colors cursor-pointer border-r border-[#27272A]/40 font-bold flex items-center justify-center gap-1.5 ${
            activeStep === "fidelity" ? "bg-[#111827] text-[#6D5EF8] border-b-2 border-b-[#6D5EF8]" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Mic className="h-3.5 w-3.5" />
          <span>2. Speech Metrics</span>
        </button>

        <button
          onClick={() => setActiveStep("synth")}
          className={`py-3 transition-colors cursor-pointer font-bold flex items-center justify-center gap-1.5 ${
            activeStep === "synth" ? "bg-[#111827] text-[#6D5EF8] border-b-2 border-b-[#6D5EF8]" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Volume2 className="h-3.5 w-3.5" />
          <span>3. Synthesis Tuner</span>
        </button>
      </div>

      {/* Main Calibration Workshop Content */}
      <div className="p-6 space-y-6">

        {/* IFRAME CAUTION HELPER IF MIC DOCKED */}
        {sttStatus === "error" && (
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 text-slate-300 rounded-xl space-y-2 text-xs leading-normal">
            <div className="flex gap-2 items-center text-amber-400 font-bold">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
              <span>Browser Sandbox / Permissions Notice</span>
            </div>
            <p>
              Microphone capture request was block-interrupted or browser support is limited.
            </p>
            <p className="text-slate-400 text-[11px]">
              <strong>Solution:</strong> Because you are using AI Studio's preview iframe, browsers frequently block microphone access for secondary frame sandboxes. Please click the <strong>"Open App in a New Tab"</strong> button in the top right header (or visit your developer URL directly) to allow Chrome or Safari to activate speech APIs instantly.
            </p>
          </div>
        )}

        {/* STEP 1: HARDWARE SETUP */}
        {activeStep === "hardware" && (
          <div className="space-y-5 animate-fade-in">
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-white font-sans">Hardware Capture & Noise Filtration</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Test if your microphone captures signals clearly. Use the ambient filter tool during silence to calibrate a gate threshold, filtering out background hums.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mic activation & Level visualizer */}
              <div className="bg-[#09090B] border border-[#27272A] rounded-xl p-4.5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Live Capture Meter</span>
                  {micStream ? (
                    <button
                      onClick={stopMicStream}
                      className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-[10px] font-mono cursor-pointer transition-colors"
                    >
                      Disconnect Stream
                    </button>
                  ) : (
                    <button
                      onClick={startMicStream}
                      className="px-2.5 py-1 bg-indigo-500/15 hover:bg-indigo-500/25 text-[#6D5EF8] border border-indigo-500/20 rounded-lg text-[10px] font-mono cursor-pointer transition-colors"
                    >
                      Connect Mic
                    </button>
                  )}
                </div>

                {/* Level meter graphic */}
                <div className="space-y-2">
                  <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-[#27272A] relative">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-75"
                      style={{ width: `${audioLevel * 100}%` }}
                    />
                    
                    {/* Noise floor marker */}
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-rose-500"
                      style={{ left: `${noiseFloor * 100}%` }}
                      title={`Noise Floor Threshold: ${noiseFloor}`}
                    />
                  </div>

                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                    <span>SILENT</span>
                    <span className="text-rose-400 font-bold">Ambient Noise Gate ({noiseFloor})</span>
                    <span>LOUD</span>
                  </div>
                </div>

                <div className="text-[10.5px] text-slate-400 leading-relaxed space-y-1">
                  <p>✔ Speaking level should ideally push the meter past the red gate.</p>
                  <p>✔ Adjust your physical mic placement if volume levels feel weak.</p>
                </div>
              </div>

              {/* Ambient Noise Gate Calibration */}
              <div className="bg-[#09090B] border border-[#27272A] rounded-xl p-4.5 space-y-4 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider block">Background Gate Calibration</span>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Click the calibrator button, then remain completely silent for 3 seconds. The engine will sample background hums and adjust the audio sensitivity automatically.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {isCalibratingNoise ? (
                    <div className="p-3 bg-[#6D5EF8]/10 border border-[#6D5EF8]/25 rounded-xl text-center space-y-2">
                      <div className="w-5 h-5 border-2 border-[#6D5EF8] border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <span className="text-[11px] font-mono font-bold text-white block">
                        Sampling silence... Keep quiet for {noiseCountdown}s
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={triggerNoiseCalibration}
                      className="w-full py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-[#6D5EF8] hover:text-[#6D5EF8]/90 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Calibrate Gate Floor</span>
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-mono">
                    <div className="p-2 bg-slate-950 border border-[#27272A]/70 rounded-lg">
                      <span className="text-slate-500 text-[9px] uppercase block">Gate Threshold</span>
                      <span className="text-white font-extrabold text-xs block mt-0.5">{noiseFloor}</span>
                    </div>
                    <div className="p-2 bg-slate-950 border border-[#27272A]/70 rounded-lg">
                      <span className="text-slate-500 text-[9px] uppercase block">Rec. Signal Gain</span>
                      <span className="text-emerald-400 font-extrabold text-xs block mt-0.5">+{gainValue}x</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: SPEECH METRICS */}
        {activeStep === "fidelity" && (
          <div className="space-y-5 animate-fade-in">
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-white font-sans">Accuracy Transcription & Speaking Pace</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Speak the standardized calibration sentence below using your system microphone. The system analyzes phonetic distance to estimate your speech-to-text accuracy and measure your speaking pace.
              </p>
            </div>

            {/* Test Sentence Card */}
            <div className="p-4 bg-[#09090B] border border-[#27272A] rounded-xl space-y-3.5 relative">
              <span className="absolute top-3 right-3 text-[9px] text-[#6D5EF8] font-mono uppercase font-bold tracking-wider bg-[#6D5EF8]/10 px-2 py-0.5 border border-[#6D5EF8]/15 rounded">
                Test Prompter
              </span>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">Please read aloud:</label>
              <p className="text-sm font-semibold text-slate-100 italic select-none pl-3 border-l-2 border-[#6D5EF8] leading-relaxed">
                "{targetSentence}"
              </p>
            </div>

            {/* STT Controls and Feedback loop */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-1">
              
              <div className="md:col-span-4 flex flex-col justify-between gap-4">
                <button
                  onClick={handleToggleSTTTest}
                  className={`w-full py-4 rounded-2xl text-xs font-extrabold transition-all cursor-pointer border flex flex-col items-center justify-center gap-2 ${
                    isSTTListening 
                      ? "bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-400 animate-pulse" 
                      : "bg-[#6D5EF8] hover:bg-[#6D5EF8]/95 text-white border-none shadow-lg shadow-[#6D5EF8]/20"
                  }`}
                >
                  {isSTTListening ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  <span>{isSTTListening ? "Stop & Evaluate" : "Activate & Record"}</span>
                </button>

                {/* Score Indicators */}
                <div className="space-y-2.5 font-mono text-[10px]">
                  <div className="flex items-center justify-between p-2.5 bg-slate-950 border border-[#27272A] rounded-xl">
                    <span className="text-slate-500 uppercase">STT Accuracy</span>
                    <span className={`font-extrabold text-sm ${
                      sttFidelity === null ? "text-slate-600" : sttFidelity >= 85 ? "text-emerald-400" : sttFidelity >= 60 ? "text-indigo-400" : "text-rose-400"
                    }`}>
                      {sttFidelity === null ? "Waiting..." : `${sttFidelity}%`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-950 border border-[#27272A] rounded-xl">
                    <span className="text-slate-500 uppercase">Speaking Tempo</span>
                    <span className={`font-extrabold text-sm ${
                      speakingWPM === null ? "text-slate-600" : "text-white"
                    }`}>
                      {speakingWPM === null ? "Waiting..." : `${speakingWPM} WPM`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Transcript Output block */}
              <div className="md:col-span-8 bg-[#09090B] border border-[#27272A] rounded-xl p-4.5 flex flex-col justify-between h-[180px]">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider block border-b border-[#27272A] pb-1.5 mb-2">Live Transcript Result</span>
                  {sttTranscript ? (
                    <p className="text-xs text-indigo-300 leading-relaxed font-sans font-medium line-clamp-4">
                      "{sttTranscript}"
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-600 italic font-mono mt-1">
                      {isSTTListening ? "Listening... Speak the test sentence clearly into your mic." : "No live transcript logged. Press record and read the prompter text above to calibrate."}
                    </p>
                  )}
                </div>

                {/* Cadence assessment helper */}
                {paceLabel && (
                  <div className={`p-2.5 rounded-lg border text-[10px] font-mono leading-relaxed flex items-center gap-1.5 mt-2 ${
                    paceLabel === "Perfect" 
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" 
                      : "bg-amber-500/5 border-amber-500/20 text-amber-400"
                  }`}>
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>
                      Pace assessment: <strong>{speakingWPM} words/min ({paceLabel})</strong>. Ideal speech cadence is 110-150 words per minute.
                    </span>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* STEP 3: SYNTHESIS TUNER */}
        {activeStep === "synth" && (
          <div className="space-y-5 animate-fade-in">
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-white font-sans">Synthetic Voice & Playback Calibration</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Calibrate how the AI interviewer sounds. Choose your preferred local text-to-speech voice engine and adjust speech speed / tone pitch to fit your auditory comfort level.
              </p>
            </div>

            <div className="bg-[#09090B] border border-[#27272A] rounded-xl p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Voice Model Selector */}
                <div className="space-y-1.5">
                  <label htmlFor="voice-model" className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">System Voice Engine Model</label>
                  <select
                    id="voice-model"
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full bg-[#111827] border border-[#27272A] text-slate-300 rounded-lg p-2.5 text-xs focus:outline-none cursor-pointer focus:border-[#6D5EF8]"
                  >
                    {voices.length > 0 ? (
                      voices.map(v => (
                        <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                      ))
                    ) : (
                      <option value="">Standard Browser Voice (Fallback)</option>
                    )}
                  </select>
                </div>

                {/* Synthesis controls info */}
                <div className="flex items-center gap-3 bg-indigo-950/20 border border-[#6D5EF8]/10 p-3.5 rounded-xl text-[10.5px] text-slate-400 leading-relaxed font-sans">
                  <Info className="h-4.5 w-4.5 text-[#6D5EF8] shrink-0" />
                  <p>
                    Synthesis speed and pitches configured below will govern the strict systems architect and mentor recruiter characters in all active mock loops.
                  </p>
                </div>
              </div>

              {/* Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1 border-t border-[#27272A]/40">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">Synthesis Speed / Rate</span>
                    <span className="text-[11px] text-[#6D5EF8] font-mono font-bold">{synthRate}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.7"
                    max="1.3"
                    step="0.05"
                    value={synthRate}
                    onChange={(e) => setSynthRate(parseFloat(e.target.value))}
                    className="w-full accent-[#6D5EF8] bg-slate-900 h-1.5 rounded-lg cursor-pointer"
                  />
                  <span className="text-[9px] text-slate-600 font-mono block">Slow/deliberate (0.7x) to fast/responsive (1.3x)</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">Speaker Pitch / Tone</span>
                    <span className="text-[11px] text-[#6D5EF8] font-mono font-bold">{synthPitch}</span>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="1.2"
                    step="0.05"
                    value={synthPitch}
                    onChange={(e) => setSynthPitch(parseFloat(e.target.value))}
                    className="w-full accent-[#6D5EF8] bg-slate-900 h-1.5 rounded-lg cursor-pointer"
                  />
                  <span className="text-[9px] text-slate-600 font-mono block">Deep authoritative (0.8) to energetic friendly (1.2)</span>
                </div>
              </div>

              {/* Play test Synthesis */}
              <button
                onClick={handlePlayTestSynth}
                className="w-full py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-[#6D5EF8] border border-indigo-500/20 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                {isPlayingTestSynth ? <Square className="h-4 w-4 shrink-0" /> : <Play className="h-4 w-4 shrink-0" />}
                <span>{isPlayingTestSynth ? "Stop Voice Playback" : "Speak Diagnostic Voice Sample"}</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Save Settings Footer */}
      <div className="p-4.5 bg-[#09090B] border-t border-[#27272A] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex gap-2 items-center text-[10px] text-slate-500 font-mono">
          <ShieldCheck className="h-4 w-4 text-[#6D5EF8]" />
          <span>SaaS Calibration Framework v1.4 • Locally Docked</span>
        </div>

        <button
          onClick={handleSaveFullCalibration}
          className="w-full sm:w-auto px-6 py-2.5 bg-[#6D5EF8] hover:bg-[#6D5EF8]/90 text-white rounded-xl text-xs font-bold shadow-md shadow-[#6D5EF8]/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Save Voice Profile Settings</span>
        </button>
      </div>
    </div>
  );
}
