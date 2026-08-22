import React, { useEffect, useState, useRef } from "react";
import { apiFetch } from "../lib/api";
import { Question } from "../types";
import { 
  FacialExpression, 
  Panelist, 
  SidebarTab 
} from "./boardroom/types";
import { HumanAvatar } from "./boardroom/HumanAvatar";
import { CandidateVideoTile } from "./boardroom/CandidateVideoTile";
import { BoardroomTopBar } from "./boardroom/BoardroomTopBar";
import { QuestionGlassCard } from "./boardroom/QuestionGlassCard";
import { CandidateDesk } from "./boardroom/CandidateDesk";
import { BoardroomControlDock } from "./boardroom/BoardroomControlDock";
import { BoardroomDrawer } from "./boardroom/BoardroomDrawer";
import { PresentationModal } from "./boardroom/PresentationModal";
import { ExitConfirmModal } from "./boardroom/ExitConfirmModal";
import { AudioSettingsModal } from "./boardroom/AudioSettingsModal";
import { MessageSquare, Volume2, Sparkles, Smile, Radio } from "lucide-react";

interface ActiveInterviewProps {
  questions: Question[];
  currentQuestionIndex: number;
  onNextQuestion: (answer: string) => void;
  onFinishInterview: (answer: string) => void;
  persona: string;
  companyName: string;
  roleName: string;
  interviewerCount?: number;
  currentUser?: any;
  onExitSession?: () => void;
}

const getDynamicCoachFeedback = (questionText: string, roleName: string) => {
  const text = (questionText || "").toLowerCase();
  let concepts = ["STAR response structure", "Concrete metrics of impact", "Core trade-offs", "Collaboration"];
  let starSituation = "Outline the project scope, business context, and the technical complexity.";
  let starAction = "Focus on your individual contributions, decision-making rationales, and design trade-offs.";
  let focusHint = "Sarah is looking for communication clarity. David Chen wants to hear deep-dive architectural trade-offs.";

  if (text.includes("conflict") || text.includes("disagree") || text.includes("team") || text.includes("collaborate")) {
    concepts = ["Empathy", "Active Listening", "Win-Win Resolution", "Post-mortem / Retrospective", "Constructive alignment"];
    starSituation = "Describe a team project where a critical disagreement occurred.";
    starAction = "Explain how you organized a data-backed discussion instead of an emotional debate.";
    focusHint = "Sarah Jenkins is focusing heavily on this behavioral prompt. Keep your tone highly constructive.";
  } else if (text.includes("design") || text.includes("architecture") || text.includes("system") || text.includes("scale") || text.includes("performance")) {
    concepts = ["Caching / CDN", "Database Sharding", "Load Balancing", "Single Point of Failure", "Horizontal scalability"];
    starSituation = "Set the scale target (e.g., 100k DAU) and the performance bottleneck.";
    starAction = "Detail your caching layers, architectural trade-offs, and failure mode mitigation.";
    focusHint = "David Chen is in technical deep-dive mode. Avoid superficial explanations and speak about exact protocols.";
  } else if (text.includes("prioritize") || text.includes("deadline") || text.includes("pressure") || text.includes("fail")) {
    concepts = ["Triage", "Stakeholder management", "Scope reduction", "Milestone tracking", "Post-mortem reflection"];
    starSituation = "Detail a mission-critical release that faced severe resource or timeline pressure.";
    starAction = "Explain your prioritization framework (e.g., Eisenhower Matrix) and scope-negotiation tactics.";
    focusHint = "Marcus Brody is measuring your project management, risk-assessment capacity, and professional maturity.";
  } else if (roleName.toLowerCase().includes("engineer") || roleName.toLowerCase().includes("developer")) {
    concepts = ["Scalability", "Maintainability", "Technical debt", "Unit testing", "CI/CD automation"];
    focusHint = "David Chen is monitoring your software engineering principles. Discuss architectural longevity.";
  }

  return { concepts, starSituation, starAction, focusHint };
};

export default function ActiveInterview({
  questions,
  currentQuestionIndex,
  onNextQuestion,
  onFinishInterview,
  persona,
  companyName,
  roleName,
  interviewerCount = 3,
  currentUser,
  onExitSession
}: ActiveInterviewProps) {
  const currentQuestion = questions[currentQuestionIndex] || {
    id: 1,
    text: "Can you introduce yourself and describe a challenging project you engineered?",
    type: "behavioral" as const,
    expectedFocus: "Communication clarity and architectural depth"
  };
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // Answer state
  const [answerText, setAnswerText] = useState("");
  const [duration, setDuration] = useState(0);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);

  // Recruiter speech state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [visibleSubtitle, setVisibleSubtitle] = useState("");
  const [showCaptions, setShowCaptions] = useState(true);

  // Floating Emoji reactions
  const [reactions, setReactions] = useState<Array<{ id: string; emoji: string; left: number; sender: string }>>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Modals & Sidebars
  const [sidebarType, setSidebarType] = useState<SidebarTab>(null);
  const [showPresentation, setShowPresentation] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showAudioSettings, setShowAudioSettings] = useState(false);

  // Scratchpad
  const [scratchNotes, setScratchNotes] = useState(() => {
    return localStorage.getItem("recruiter_session_scratchpad") || "";
  });

  const handleScratchNotesChange = (val: string) => {
    setScratchNotes(val);
    localStorage.setItem("recruiter_session_scratchpad", val);
  };

  // Candidate Video & Audio
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [soundBars, setSoundBars] = useState<number[]>([15, 25, 45, 30, 15, 35, 55, 40, 65, 50, 30, 40, 45, 30, 15]);

  // Voice synthesis options
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceRate, setVoiceRate] = useState(() => {
    const saved = localStorage.getItem("voice_calibrated_rate");
    return saved ? parseFloat(saved) : 0.95;
  });
  const [voicePitch, setVoicePitch] = useState(() => {
    const saved = localStorage.getItem("voice_calibrated_pitch");
    return saved ? parseFloat(saved) : 1.0;
  });
  const [voiceVolume, setVoiceVolume] = useState(1.0);

  // Session timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPaused) {
        setDuration(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused]);

  // Audio equalizer bars
  useEffect(() => {
    let animId: number;
    if (isListening) {
      const update = () => {
        setSoundBars(prev => prev.map(() => Math.floor(Math.random() * 60) + 15));
        animId = requestAnimationFrame(update);
      };
      update();
    } else {
      setSoundBars([15, 25, 45, 30, 15, 35, 55, 40, 65, 50, 30, 40, 45, 30, 15]);
    }
    return () => cancelAnimationFrame(animId);
  }, [isListening]);

  // Speech synthesis voice loader
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const load = () => {
        const available = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith("en"));
        setVoices(available);
      };
      load();
      window.speechSynthesis.onvoiceschanged = load;
    }
  }, []);

  // Web Speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechClass) {
        const rec = new SpeechClass();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";

        rec.onresult = (event: any) => {
          if (!micOn) return;
          let final = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            }
          }
          if (final) {
            setAnswerText(prev => (prev.trim() + " " + final).trim());
          }
        };

        rec.onerror = () => {
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        setRecognition(rec);
      }
    }
  }, [micOn]);

  // Panel configuration
  const panelists: Panelist[] = [
    {
      id: 0,
      name: "Sarah Jenkins",
      role: "VP of People & Culture",
      focus: "Behavioral & EQ",
      bio: "Evaluates teamwork, constructive resolution, and structured communication.",
      avatarUrl: "/assets/sarah.png",
      accentColor: "#818cf8",
      avatarVisuals: {
        skin: "#ffd8c2",
        lips: "#e07a7a",
        irisColor: "#503020",
        eyeWidth: 9.8,
        eyeHeight: 5.6,
        mouthWidth: 19.5,
        mouthHeight: 9.6
      }
    },
    {
      id: 1,
      name: "David Chen",
      role: "Principal Systems Architect",
      focus: "Technical Architecture",
      bio: "Deep-dives into database sharding, latency SLAs, caching tiers, and scalability.",
      avatarUrl: "/assets/david.png",
      accentColor: "#60a5fa",
      avatarVisuals: {
        skin: "#cc9c80",
        lips: "#bc6f62",
        irisColor: "#3e2417",
        eyeWidth: 8.8,
        eyeHeight: 4.8,
        mouthWidth: 17.5,
        mouthHeight: 8.6
      }
    },
    {
      id: 2,
      name: "Marcus Brody",
      role: "Head of Engineering",
      focus: "Executive Strategy",
      bio: "Measures project delivery under pressure, operational risk, and team leadership.",
      avatarUrl: "/assets/marcus.png",
      accentColor: "#34d399",
      avatarVisuals: {
        skin: "#d9a184",
        lips: "#be7067",
        irisColor: "#2e3747",
        eyeWidth: 9.2,
        eyeHeight: 5.2,
        mouthWidth: 18.5,
        mouthHeight: 9.2
      }
    }
  ];

  const currentPanel = interviewerCount === 1 
    ? (persona === "architect" ? [panelists[1]] : persona === "product_leader" ? [panelists[2]] : [panelists[0]])
    : panelists.slice(0, Math.max(1, Math.min(3, interviewerCount)));

  const activeSpeakerIdx = currentPanel.length === 1 
    ? currentPanel[0].id 
    : currentPanel[currentQuestionIndex % currentPanel.length].id;

  const activeSpeaker = panelists.find(p => p.id === activeSpeakerIdx) || panelists[0];

  // Trigger speech on question change
  useEffect(() => {
    if (currentQuestion && voiceEnabled) {
      speakQuestion(currentQuestion.text);
    } else if (currentQuestion) {
      simulateSubtitles(currentQuestion.text);
    }
  }, [currentQuestionIndex]);

  const simulateSubtitles = (fullText: string) => {
    setVisibleSubtitle("");
    let cur = 0;
    const interval = setInterval(() => {
      cur += 4;
      if (cur >= fullText.length) {
        setVisibleSubtitle(fullText);
        clearInterval(interval);
      } else {
        setVisibleSubtitle(fullText.substring(0, cur));
      }
    }, 35);
  };

  const speakQuestion = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsThinking(true);
      setIsSpeaking(false);
      setVisibleSubtitle("Formulating question...");

      setTimeout(() => {
        setIsThinking(false);
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = voiceRate;
        utterance.pitch = voicePitch;
        utterance.volume = voiceVolume;

        // Pick gender-appropriate voice
        const enVoices = voices.filter(v => v.lang.toLowerCase().startsWith("en"));
        if (enVoices.length > 0) {
          if (activeSpeakerIdx === 0) {
            // Female voice for Sarah
            const femaleVoice = enVoices.find(v => 
              /samantha|zira|karen|moira|tessa|fiona|lisa|amy|victoria|zoe|female|sara|jenny|aria/i.test(v.name)
            );
            if (femaleVoice) utterance.voice = femaleVoice;
          } else {
            // Male voice for David / Marcus
            const maleVoice = enVoices.find(v => 
              /david|george|ravi|richard|mark|peter|daniel|james|male|alex|guy|brian|ryan|steve/i.test(v.name)
            );
            if (maleVoice) utterance.voice = maleVoice;
          }
        }

        utterance.onstart = () => {
          setIsSpeaking(true);
          simulateSubtitles(text);
        };

        utterance.onend = () => {
          setIsSpeaking(false);
        };

        utterance.onerror = () => {
          setIsSpeaking(false);
          setVisibleSubtitle(text);
        };

        window.speechSynthesis.speak(utterance);
      }, 1000);
    } else {
      simulateSubtitles(text);
    }
  };

  // Handlers
  const handleToggleListening = () => {
    if (!micOn) {
      alert("Please enable the microphone in the candidate dock first.");
      return;
    }
    if (isListening) {
      if (recognition) recognition.stop();
      setIsListening(false);
    } else {
      if (recognition) {
        try {
          recognition.start();
          setIsListening(true);
        } catch {
          setIsListening(true);
        }
      } else {
        setIsListening(true);
      }
    }
  };

  const handleGenerateDraft = async () => {
    setIsGeneratingDraft(true);
    try {
      const res = await apiFetch("/api/generate-draft-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: currentQuestion.text,
          expectedFocus: currentQuestion.expectedFocus,
          roleName: roleName,
          companyName: companyName,
          persona: persona
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.draftAnswer) {
          setAnswerText(data.draftAnswer);
        }
      }
    } catch (err) {
      console.error("Error generating AI draft answer:", err);
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleSubmitAnswer = (forceSkip = false) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (isListening && recognition) {
      recognition.stop();
      setIsListening(false);
    }
    setIsSpeaking(false);

    const submission = answerText.trim() || (forceSkip ? "[Candidate skipped question response]" : "[Answered verbally during simulation]");
    setAnswerText("");

    if (isLastQuestion) {
      onFinishInterview(submission);
    } else {
      onNextQuestion(submission);
    }
  };

  const triggerEmoji = (emoji: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    const left = Math.floor(Math.random() * 60) + 20;
    setReactions(prev => [...prev, { id, emoji, left, sender: "You" }]);
    setShowEmojiPicker(false);

    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    }, 4000);

    // Recruiter sympathetic response
    if (Math.random() < 0.6) {
      setTimeout(() => {
        const rId = Math.random().toString(36).substring(2, 9);
        const rLeft = Math.floor(Math.random() * 60) + 20;
        const panelName = activeSpeaker.name;
        setReactions(prev => [...prev, { id: rId, emoji: emoji === "👍" ? "👏" : "👍", left: rLeft, sender: panelName }]);
        setTimeout(() => {
          setReactions(prev => prev.filter(r => r.id !== rId));
        }, 4000);
      }, 900);
    }
  };

  // Format timer
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // STAR regex evaluation
  const checkSituation = /bottleneck|challenge|problem|legacy|issue|situation|scale|incident|failure|bug/i.test(answerText);
  const checkTask = /task|goal|objective|required|responsibility|target|aimed|expected/i.test(answerText);
  const checkAction = /designed|implemented|sharded|cached|refactored|built|debugged|engineered|profiled|optimized/i.test(answerText);
  const checkResult = /reduced|improved|increased|%|percent|ms|latency|saved|throughput|down|up|speedup/i.test(answerText);

  return (
    <div 
      id="active-interview-boardroom"
      className="boardroom-stage min-h-screen text-slate-100 p-3 sm:p-5 flex flex-col justify-between space-y-4 max-w-7xl mx-auto select-none"
    >
      {/* 1. TOP BAR */}
      <BoardroomTopBar 
        companyName={companyName}
        roleName={roleName}
        currentQuestionIndex={currentQuestionIndex}
        questions={questions}
        duration={duration}
        isPaused={isPaused}
        onTogglePause={() => setIsPaused(!isPaused)}
        onOpenAudioSettings={() => setShowAudioSettings(true)}
        voiceEnabled={voiceEnabled}
        onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
        onOpenExitModal={() => setShowExitModal(true)}
        formatTime={formatTime}
      />

      {/* 2. MAIN BOARDROOM STAGE + DRAWER ROW */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start relative z-10">
        
        {/* LEFT COLUMN: Panelists Video Grid + Live Subtitles + Question Card + Candidate Desk */}
        <div className={`${sidebarType ? "lg:col-span-8" : "lg:col-span-12"} space-y-4 transition-all duration-500`}>
          
          {/* Executive Panelists Stage Frame */}
          <div className="liquid-glass-dock rounded-3xl p-3 sm:p-4 border border-white/15 shadow-2xl relative overflow-hidden min-h-[380px] sm:min-h-[440px] flex flex-col justify-between">
            
            {/* Ambient Room Lighting Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-1/2 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Floating Reactions Overlay */}
            <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
              {reactions.map((r) => (
                <div
                  key={r.id}
                  className="absolute bottom-4 animate-float-up flex flex-col items-center gap-1"
                  style={{ left: `${r.left}%` }}
                >
                  <span className="text-4xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">{r.emoji}</span>
                  <div className="px-2 py-0.5 liquid-glass-strong rounded-md text-[7.5px] font-bold text-white font-mono uppercase tracking-wider border border-white/10">
                    {r.sender}
                  </div>
                </div>
              ))}
            </div>

            {/* Panelists Video Grid Layout */}
            <div className={`grid gap-3.5 flex-1 relative z-10 ${
              currentPanel.length === 1 
                ? "grid-cols-1 max-w-md mx-auto w-full" 
                : currentPanel.length === 2 
                  ? "grid-cols-1 sm:grid-cols-2" 
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            }`}>
              {currentPanel.map((panelist) => (
                <div key={panelist.id} className="h-64 sm:h-72 md:h-80 w-full">
                  <HumanAvatar 
                    id={panelist.id}
                    name={panelist.name}
                    role={panelist.role}
                    focus={panelist.focus}
                    isActive={activeSpeakerIdx === panelist.id}
                    isSpeaking={activeSpeakerIdx === panelist.id && isSpeaking}
                    isThinking={activeSpeakerIdx === panelist.id && isThinking}
                    accentColor={panelist.accentColor}
                    activeSpeakerIdx={activeSpeakerIdx}
                    candidateIsSpeaking={isListening}
                    interviewerCount={currentPanel.length}
                  />
                </div>
              ))}
            </div>

            {/* Candidate Mini Tile Overlay (in corner of stage) */}
            <div className="absolute bottom-4 right-4 z-20 w-40 sm:w-48 hidden sm:block">
              <CandidateVideoTile 
                cameraOn={cameraOn}
                onToggleCamera={() => setCameraOn(!cameraOn)}
                micOn={micOn}
                onToggleMic={() => setMicOn(!micOn)}
                isListening={isListening}
                soundBars={soundBars}
                candidateName={currentUser?.name ? `${currentUser.name} (You)` : "You (Candidate)"}
              />
            </div>

            {/* Live Subtitles Ticker */}
            {showCaptions && visibleSubtitle && (
              <div className="mt-3 liquid-glass-subtle px-4 py-2.5 rounded-xl border border-white/10 flex items-start gap-2.5 max-w-2xl mx-auto shadow-lg animate-fade-in relative z-20">
                <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-left flex-1">
                  <span className="text-[8.5px] font-mono font-bold text-indigo-300 uppercase block mb-0.5">
                    {isSpeaking ? `${activeSpeaker.name} (Speaking)` : activeSpeaker.name}
                  </span>
                  <p className="text-xs text-slate-100 font-medium leading-relaxed">
                    {visibleSubtitle}
                  </p>
                </div>
              </div>
            )}

            {/* Hand Raised Banner */}
            {isHandRaised && (
              <div className="mt-2 liquid-glass-strong border border-amber-500/40 px-4 py-2 rounded-xl flex items-center justify-between text-amber-200 text-xs animate-slide-up z-20">
                <div className="flex items-center gap-2">
                  <span className="text-base">✋</span>
                  <span className="font-semibold">Hand Raised: Asking panelist for clarification</span>
                </div>
                <button
                  onClick={() => setIsHandRaised(false)}
                  className="px-2 py-0.5 liquid-glass-subtle hover:bg-white/10 rounded-lg text-[9px] font-mono text-slate-300 hover:text-white cursor-pointer"
                >
                  Lower Hand
                </button>
              </div>
            )}

          </div>

          {/* Question Presentation Card */}
          <QuestionGlassCard 
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            speakerName={activeSpeaker.name}
            speakerRole={activeSpeaker.role}
            speakerImg={activeSpeaker.avatarUrl}
            onReplayAudio={() => speakQuestion(currentQuestion.text)}
            isSpeaking={isSpeaking}
          />

          {/* Candidate Response Workspace */}
          <CandidateDesk 
            answerText={answerText}
            onAnswerChange={setAnswerText}
            isListening={isListening}
            onToggleListening={handleToggleListening}
            soundBars={soundBars}
            isGeneratingDraft={isGeneratingDraft}
            onGenerateDraft={handleGenerateDraft}
            onSubmitAnswer={handleSubmitAnswer}
            isLastQuestion={isLastQuestion}
            checkSituation={checkSituation}
            checkTask={checkTask}
            checkAction={checkAction}
            checkResult={checkResult}
            currentQuestionIndex={currentQuestionIndex}
          />

        </div>

        {/* RIGHT COLUMN: Multi-tab Drawer */}
        {sidebarType && (
          <div className="lg:col-span-4 h-full">
            <BoardroomDrawer 
              sidebarType={sidebarType}
              onClose={() => setSidebarType(null)}
              onSelectTab={setSidebarType}
              currentQuestion={currentQuestion}
              currentQuestionIndex={currentQuestionIndex}
              totalQuestions={questions.length}
              roleName={roleName}
              answerText={answerText}
              onAnswerChange={setAnswerText}
              isListening={isListening}
              onToggleListening={handleToggleListening}
              soundBars={soundBars}
              checkSituation={checkSituation}
              checkTask={checkTask}
              checkAction={checkAction}
              checkResult={checkResult}
              duration={duration}
              scratchNotes={scratchNotes}
              onScratchNotesChange={handleScratchNotesChange}
              currentPanel={currentPanel}
              getDynamicCoachFeedback={getDynamicCoachFeedback}
              formatTime={formatTime}
              onSubmitAnswer={handleSubmitAnswer}
              isLastQuestion={isLastQuestion}
            />
          </div>
        )}

      </main>

      {/* 3. FLOATING CONTROL DOCK + EMOJI TOOLBAR */}
      <footer className="relative z-30 pt-2 pb-1 space-y-2">
        {/* Emoji Reactions Picker Bar */}
        {showEmojiPicker && (
          <div className="flex items-center justify-center gap-2 liquid-glass-strong p-2 rounded-full border border-white/20 shadow-2xl max-w-fit mx-auto animate-slide-up">
            {["👍", "👏", "💡", "🎯", "🚀", "❤️"].map((emoji) => (
              <button
                key={emoji}
                onClick={() => triggerEmoji(emoji)}
                className="text-lg p-1.5 hover:scale-125 transition-transform cursor-pointer rounded-full hover:bg-white/10"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-center gap-2">
          <BoardroomControlDock 
            micOn={micOn}
            onToggleMic={() => setMicOn(!micOn)}
            cameraOn={cameraOn}
            onToggleCamera={() => setCameraOn(!cameraOn)}
            showCaptions={showCaptions}
            onToggleCaptions={() => setShowCaptions(!showCaptions)}
            handRaised={isHandRaised}
            onToggleHandRaised={() => setIsHandRaised(!isHandRaised)}
            onOpenPresentation={() => setShowPresentation(true)}
            voiceEnabled={voiceEnabled}
            onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
            onOpenAudioSettings={() => setShowAudioSettings(true)}
            activeSidebar={sidebarType}
            onSelectSidebar={setSidebarType}
            onOpenExitModal={() => setShowExitModal(true)}
          />

          {/* Quick Reaction Button */}
          <button
            id="btn-trigger-emoji-picker"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-3 liquid-glass-dock hover:bg-white/10 text-amber-300 rounded-full border border-white/20 transition-all cursor-pointer shadow-xl"
            title="React with Emoji"
          >
            <Smile className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* 4. MODALS */}
      <PresentationModal 
        isOpen={showPresentation}
        onClose={() => setShowPresentation(false)}
        roleName={roleName}
        companyName={companyName}
      />

      <ExitConfirmModal 
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirmExit={() => {
          setShowExitModal(false);
          if (onExitSession) {
            onExitSession();
          } else {
            handleSubmitAnswer(true);
          }
        }}
        questionsAnswered={currentQuestionIndex}
        totalQuestions={questions.length}
      />

      <AudioSettingsModal 
        isOpen={showAudioSettings}
        onClose={() => setShowAudioSettings(false)}
        voicePitch={voicePitch}
        onVoicePitchChange={setVoicePitch}
        voiceRate={voiceRate}
        onVoiceRateChange={setVoiceRate}
        voiceVolume={voiceVolume}
        onVoiceVolumeChange={setVoiceVolume}
        voiceEnabled={voiceEnabled}
        onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
        onTestVoice={() => speakQuestion("Hello, this is a calibration test for the Recruiter AI executive voice engine.")}
      />

    </div>
  );
}
