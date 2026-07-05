import React, { useEffect, useState, useRef } from "react";
import { 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  VolumeX, 
  Clock, 
  CheckCircle, 
  Terminal, 
  Play, 
  Square,
  AlertTriangle,
  Sliders,
  FileText,
  Trash2,
  Copy,
  BookOpen
} from "lucide-react";
import { Question, QAHistory, InterviewerPersona } from "../types";

interface ActiveInterviewProps {
  questions: Question[];
  currentQuestionIndex: number;
  onNextQuestion: (answerText: string) => void;
  onFinishInterview: (answerText: string) => void;
  persona: InterviewerPersona;
  companyName: string;
  roleName: string;
}

export default function ActiveInterview({
  questions,
  currentQuestionIndex,
  onNextQuestion,
  onFinishInterview,
  persona,
  companyName,
  roleName
}: ActiveInterviewProps) {
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // Active inputs
  const [answerText, setAnswerText] = useState("");
  const [duration, setDuration] = useState(0);

  // Persistent Scratchpad State
  const [scratchNotes, setScratchNotes] = useState(() => {
    return localStorage.getItem("recruiter_session_scratchpad") || "";
  });
  const [notepadOpen, setNotepadOpen] = useState(true);

  const handleScratchNotesChange = (val: string) => {
    setScratchNotes(val);
    localStorage.setItem("recruiter_session_scratchpad", val);
  };

  // Speech and Audio Synthesis States
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [micUnavailable, setMicUnavailable] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState(() => {
    return localStorage.getItem("recruiter_selected_voice") || "";
  });
  const [voiceRate, setVoiceRate] = useState(() => {
    const saved = localStorage.getItem("voice_calibrated_rate");
    return saved ? parseFloat(saved) : 0.93;
  });
  const [voicePitch, setVoicePitch] = useState(() => {
    const saved = localStorage.getItem("voice_calibrated_pitch");
    return saved ? parseFloat(saved) : 0.98;
  });
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

  // Visual animated sound bars
  const [soundBars, setSoundBars] = useState<number[]>([30, 45, 60, 40, 25, 40, 70, 50, 85, 60, 35, 45, 55, 40, 50]);

  // Handle active timer
  useEffect(() => {
    const timer = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format seconds into MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Soundwave animation loop
  useEffect(() => {
    let animationId: number;
    if (isListening) {
      const updateBars = () => {
        setSoundBars(prev => prev.map(() => Math.floor(Math.random() * 65) + 15));
        animationId = requestAnimationFrame(updateBars);
      };
      updateBars();
    } else {
      setSoundBars([30, 45, 60, 40, 25, 40, 70, 50, 85, 60, 35, 45, 55, 40, 50]);
    }
    return () => cancelAnimationFrame(animationId);
  }, [isListening]);

  // Load Synthesis Voices
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const loadVoices = () => {
        const available = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith("en"));
        setVoices(available);

        if (available.length > 0) {
          const storedVoice = localStorage.getItem("recruiter_selected_voice");
          const hasStored = storedVoice && available.some(v => v.name === storedVoice);
          if (hasStored) {
            setSelectedVoiceName(storedVoice);
          } else {
            const softDefault = available.find(v => 
              v.name.includes("Natural") || 
              v.name.includes("Google US English") || 
              v.name.includes("Samantha") ||
              v.name.includes("Zira")
            );
            setSelectedVoiceName(softDefault ? softDefault.name : available[0].name);
          }
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Setup Web Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechClass) {
        const rec = new SpeechClass();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";

        rec.onresult = (event: any) => {
          let interim = "";
          let final = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          if (final) {
            setAnswerText(prev => (prev.trim() + " " + final).trim());
          }
        };

        rec.onerror = (e: any) => {
          console.warn("Speech recognition error:", e);
          if (e.error === "not-allowed" || e.error === "service-not-allowed") {
            setMicUnavailable(true);
          }
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        setRecognition(rec);
      } else {
        setMicUnavailable(true);
      }
    }
  }, []);

  // Speak the question automatically when it changes
  useEffect(() => {
    if (currentQuestion && voiceEnabled) {
      speakText(currentQuestion.text);
    }
  }, [currentQuestionIndex]);

  // Native Speech Synthesis speaker
  const speakText = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel(); // kill existing playback

      const utterance = new SpeechSynthesisUtterance(text);
      if (selectedVoiceName) {
        const targetVoice = voices.find(v => v.name === selectedVoiceName);
        if (targetVoice) utterance.voice = targetVoice;
      }
      utterance.rate = voiceRate;
      utterance.pitch = voicePitch;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Toggle voice recognition listening
  const toggleListening = () => {
    if (micUnavailable || !recognition) {
      alert("Microphone speech recognition is not available or blocked in this browser. Please type your response.");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
      } catch (e) {
        console.error("Failed to start speech recognition:", e);
      }
    }
  };

  // Advance state
  const handleAnswerSubmit = () => {
    // Stop recording if active
    if (isListening && recognition) {
      recognition.stop();
      setIsListening(false);
    }

    const currentResponse = answerText.trim() || "[No written response provided. Candidate answered via live voice or skipped text typing.]";
    
    // Clear text area for next
    setAnswerText("");

    if (isLastQuestion) {
      onFinishInterview(currentResponse);
    } else {
      onNextQuestion(currentResponse);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Simulation Header stats bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-[#111827] border border-[#27272A] rounded-2xl gap-4">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#6D5EF8] animate-ping" />
          <div>
            <h3 className="text-xs font-bold text-white font-sans">{roleName} Simulation</h3>
            <span className="text-[10px] text-slate-500 font-mono block">Employer: {companyName} • Style: {persona}</span>
          </div>
        </div>

        {/* Question progress and timer */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Notepad Toggle Button */}
          <button
            onClick={() => setNotepadOpen(!notepadOpen)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 transition-all cursor-pointer border ${
              notepadOpen 
                ? "bg-[#6D5EF8]/10 text-[#6D5EF8] border-[#6D5EF8]/25" 
                : "bg-slate-900 text-slate-400 border-[#27272A] hover:text-slate-200"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Notepad: {notepadOpen ? "ON" : "OFF"}</span>
          </button>

          <div className="h-8 w-px bg-[#27272A]" />

          <div className="text-center sm:text-right">
            <span className="text-[9px] font-mono text-slate-500 uppercase block">Simulation Time</span>
            <span className="text-xs font-bold font-mono text-white flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              {formatTime(duration)}
            </span>
          </div>
          <div className="h-8 w-px bg-[#27272A]" />
          <div className="text-center sm:text-right">
            <span className="text-[9px] font-mono text-slate-500 uppercase block">Question Progression</span>
            <span className="text-xs font-bold text-indigo-400 font-sans">
              {currentQuestionIndex + 1} of {questions.length}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: split panel layout */}
      <div className={`grid grid-cols-1 ${notepadOpen ? "lg:grid-cols-12" : ""} gap-6 items-start`}>
        
        {/* LEFT COLUMN: Active Interviewer / Answer Workspace */}
        <div className={`${notepadOpen ? "lg:col-span-8" : "w-full max-w-4xl mx-auto"} bg-[#111827] border border-[#27272A] rounded-[18px] p-6 md:p-8 relative overflow-hidden space-y-6 transition-all duration-200`}>
          
          {/* Interviewer Avatar & Bubble */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-[#27272A] flex items-center justify-center text-lg shadow-sm shrink-0 select-none">
              {persona === "architect" ? "⚡" : persona === "product_leader" ? "📈" : "🍃"}
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#6D5EF8] font-mono uppercase">
                  {persona === "architect" ? "Strict Systems Architect" : persona === "product_leader" ? "Product Director" : "Encouraging Recruiter Mentor"}
                </h4>
                <button
                  onClick={() => speakText(currentQuestion.text)}
                  className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors border border-[#27272A]"
                  title="Speak question"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>
              
              {/* Display Question Text */}
              <div className="p-5 bg-slate-950/60 rounded-xl border border-[#27272A]/80 relative">
                <p className="text-sm md:text-base font-medium text-slate-100 leading-relaxed font-sans">
                  "{currentQuestion.text}"
                </p>
                <div className="absolute -left-2 top-4 w-4 h-4 bg-slate-950 border-l border-b border-[#27272A] rotate-45" />
              </div>
            </div>
          </div>

          {/* Expected Focus Point Indicator */}
          <div className="p-3 bg-[#6D5EF8]/5 rounded-xl border border-[#6D5EF8]/10 text-[10.5px] leading-relaxed text-slate-400 font-mono">
            <strong className="text-[#6D5EF8]">Coaching focus:</strong> {currentQuestion.expectedFocus}
          </div>

          {/* Voice and Audio Capture HUD */}
          <div className="bg-slate-950 border border-[#27272A] rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={toggleListening}
                className={`p-3 rounded-xl transition-all flex items-center justify-center cursor-pointer shrink-0 border ${
                  isListening
                    ? "bg-[#EF4444] text-white border-red-500 animate-pulse scale-[1.03]"
                    : "bg-[#111827] text-slate-300 border-[#27272A] hover:text-white"
                }`}
                title={isListening ? "Stop Microphone Capture" : "Trigger Microphone Capture"}
              >
                {isListening ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
              </button>
              <div>
                <h4 className="text-xs font-bold text-white">
                  {isListening ? "Microphone Active (Streaming)" : "Speech Capture Inactive"}
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                  {isListening ? "Transcribing your spoken sentences real-time..." : "Click microphone button to answer by voice"}
                </p>
              </div>
            </div>

            {/* Graphical Soundwave */}
            <div className="flex items-end justify-center gap-1 h-8 px-2 w-full sm:w-48 overflow-hidden select-none">
              {soundBars.map((val, idx) => (
                <span
                  key={idx}
                  className={`w-1 rounded-full transition-all duration-75 ${isListening ? "bg-[#6D5EF8]" : "bg-slate-800"}`}
                  style={{ height: `${val}%` }}
                />
              ))}
            </div>
          </div>

          {/* Response Input Form */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
              <span>ANSWER COMPOSER (MIC TRANSCRIPT & EDITS)</span>
              <span>{answerText.length} Characters</span>
            </div>

            <textarea
              id="candidate-response"
              rows={5}
              placeholder="Your answer will automatically dictate here when using the mic, or you can type directly. You can also compose outline notes in the Notepad on the right..."
              className="w-full bg-slate-950 border border-[#27272A] rounded-xl p-4 text-xs text-slate-200 placeholder-slate-650 leading-relaxed focus:outline-none focus:border-[#6D5EF8] font-sans"
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
            />
          </div>

          {/* Action button row */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 border-t border-[#27272A] pt-5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-[#27272A] rounded-xl text-[10px] font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 cursor-pointer"
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>Voice Synthesis Settings</span>
              </button>
              <button
                onClick={() => {
                  setVoiceEnabled(!voiceEnabled);
                  if (voiceEnabled) window.speechSynthesis.cancel();
                }}
                className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-xl border border-[#27272A]"
              >
                {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
            </div>

            <button
              onClick={handleAnswerSubmit}
              className="px-6 py-3 bg-[#6D5EF8] hover:bg-[#6D5EF8]/90 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#6D5EF8]/15"
            >
              <span>{isLastQuestion ? "Submit Simulation for Grading" : "Submit Answer & Proceed"}</span>
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Voice Customization Drawer */}
          {showVoiceSettings && (
            <div className="p-4 bg-slate-950 border border-[#27272A] rounded-xl space-y-4 animate-slide-up">
              <h4 className="text-[10px] font-bold text-white uppercase font-mono tracking-wider">Voice Synthesis Tuner</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1.5">Voice Engine Model</label>
                  <select
                    value={selectedVoiceName}
                    onChange={(e) => setSelectedVoiceName(e.target.value)}
                    className="w-full bg-[#111827] border border-[#27272A] text-slate-300 rounded-lg p-2 text-[10px] focus:outline-none"
                  >
                    {voices.map(v => (
                      <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1.5">Speech Rate ({voiceRate}x)</label>
                  <input
                    type="range"
                    min="0.7"
                    max="1.3"
                    step="0.05"
                    value={voiceRate}
                    onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                    className="w-full accent-[#6D5EF8] bg-slate-900 h-1 rounded"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1.5">Tone Pitch ({voicePitch})</label>
                  <input
                    type="range"
                    min="0.8"
                    max="1.2"
                    step="0.05"
                    value={voicePitch}
                    onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                    className="w-full accent-[#6D5EF8] bg-slate-900 h-1 rounded"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Persistent Scratchpad / Notepad */}
        {notepadOpen && (
          <div className="lg:col-span-4 bg-[#111827] border border-[#27272A] rounded-[18px] p-5 space-y-4 flex flex-col h-full animate-fade-in">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-[#6D5EF8]" />
                <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">Scratchpad / Notepad</h4>
              </div>
              <span className="text-[8px] text-slate-500 font-mono">Persists globally</span>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed">
              Jot down hints, architectural blocks, or draft your STAR structural layout. Use the buttons below to easily clear or merge notes into your main answer.
            </p>

            <textarea
              rows={12}
              placeholder="✍️ Personal scratchpad...
- Key Tech: Redis, Kafka, Raft
- STAR: Saturation occurred under 35k RPS.
- Solution: Double buffering & sharded locks."
              className="w-full bg-slate-950 border border-[#27272A] rounded-xl p-3.5 text-xs text-slate-250 placeholder-slate-650 font-mono leading-relaxed focus:outline-none focus:border-[#6D5EF8] resize-none h-[280px]"
              value={scratchNotes}
              onChange={(e) => handleScratchNotesChange(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (scratchNotes.trim()) {
                    setAnswerText(prev => (prev.trim() + "\n\n" + scratchNotes).trim());
                  }
                }}
                className="py-2 px-3 bg-[#6D5EF8]/10 hover:bg-[#6D5EF8]/20 text-[#6D5EF8] border border-[#6D5EF8]/25 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Append scratchpad contents to answer field"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Append to Ans</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm("Are you sure you want to clear your scratchpad notes?")) {
                    handleScratchNotesChange("");
                  }
                }}
                className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-[#27272A] rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                <span>Clear Notes</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
