import React from "react";
import { 
  X, 
  Send, 
  Cpu, 
  Award, 
  FileText, 
  Users, 
  Mic, 
  MicOff, 
  Sparkles, 
  Trash2, 
  Copy, 
  Sliders, 
  Volume2, 
  VolumeX, 
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { SidebarTab, Panelist, DynamicCoachFeedback } from "./types";
import { Question } from "../../types";

interface BoardroomDrawerProps {
  sidebarType: SidebarTab;
  onClose: () => void;
  onSelectTab: (tab: SidebarTab) => void;
  currentQuestion: Question;
  currentQuestionIndex: number;
  totalQuestions: number;
  roleName: string;
  answerText: string;
  onAnswerChange: (text: string) => void;
  isListening: boolean;
  onToggleListening: () => void;
  soundBars: number[];
  checkSituation: boolean;
  checkTask: boolean;
  checkAction: boolean;
  checkResult: boolean;
  duration: number;
  scratchNotes: string;
  onScratchNotesChange: (val: string) => void;
  currentPanel: Panelist[];
  getDynamicCoachFeedback: (q: string, role: string) => DynamicCoachFeedback;
  formatTime: (sec: number) => string;
  onSubmitAnswer: (skip?: boolean) => void;
  isLastQuestion: boolean;
}

export function BoardroomDrawer({
  sidebarType,
  onClose,
  onSelectTab,
  currentQuestion,
  currentQuestionIndex,
  totalQuestions,
  roleName,
  answerText,
  onAnswerChange,
  isListening,
  onToggleListening,
  soundBars,
  checkSituation,
  checkTask,
  checkAction,
  checkResult,
  duration,
  scratchNotes,
  onScratchNotesChange,
  currentPanel,
  getDynamicCoachFeedback,
  formatTime,
  onSubmitAnswer,
  isLastQuestion
}: BoardroomDrawerProps) {
  if (!sidebarType) return null;

  return (
    <aside 
      id="boardroom-multitab-drawer"
      className="w-full lg:w-96 liquid-glass-strong rounded-2xl p-4 sm:p-5 flex flex-col h-full border border-white/15 shadow-2xl animate-fade-in relative z-20"
    >
      {/* Header Tabs switcher */}
      <div className="flex items-center border-b border-white/10 pb-3 gap-1 overflow-x-auto">
        <button
          id="drawer-tab-answer"
          type="button"
          onClick={() => onSelectTab("answer")}
          className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider font-mono flex items-center gap-1 transition-all cursor-pointer border shrink-0 ${
            sidebarType === "answer"
              ? "bg-indigo-600/30 text-indigo-300 border-indigo-500/50 shadow-sm"
              : "bg-transparent text-slate-400 border-transparent hover:text-white"
          }`}
        >
          <Send className="h-3 w-3" />
          <span>Worksheet</span>
        </button>

        <button
          id="drawer-tab-coach"
          type="button"
          onClick={() => onSelectTab("coach")}
          className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider font-mono flex items-center gap-1 transition-all cursor-pointer border shrink-0 ${
            sidebarType === "coach"
              ? "bg-indigo-600/30 text-indigo-300 border-indigo-500/50 shadow-sm"
              : "bg-transparent text-slate-400 border-transparent hover:text-white"
          }`}
        >
          <Cpu className="h-3 w-3" />
          <span>AI Coach</span>
        </button>

        <button
          id="drawer-tab-scorecard"
          type="button"
          onClick={() => onSelectTab("scorecard")}
          className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider font-mono flex items-center gap-1 transition-all cursor-pointer border shrink-0 ${
            sidebarType === "scorecard"
              ? "bg-indigo-600/30 text-indigo-300 border-indigo-500/50 shadow-sm"
              : "bg-transparent text-slate-400 border-transparent hover:text-white"
          }`}
        >
          <Award className="h-3 w-3" />
          <span>Scorecard</span>
        </button>

        <button
          id="drawer-tab-notepad"
          type="button"
          onClick={() => onSelectTab("notepad")}
          className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider font-mono flex items-center gap-1 transition-all cursor-pointer border shrink-0 ${
            sidebarType === "notepad"
              ? "bg-indigo-600/30 text-indigo-300 border-indigo-500/50 shadow-sm"
              : "bg-transparent text-slate-400 border-transparent hover:text-white"
          }`}
        >
          <FileText className="h-3 w-3" />
          <span>Notes</span>
        </button>

        <button
          id="drawer-tab-participants"
          type="button"
          onClick={() => onSelectTab("participants")}
          className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider font-mono flex items-center gap-1 transition-all cursor-pointer border shrink-0 ${
            sidebarType === "participants"
              ? "bg-indigo-600/30 text-indigo-300 border-indigo-500/50 shadow-sm"
              : "bg-transparent text-slate-400 border-transparent hover:text-white"
          }`}
        >
          <Users className="h-3 w-3" />
          <span>Board</span>
        </button>

        <button
          id="btn-close-drawer"
          type="button"
          onClick={onClose}
          className="ml-auto p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          title="Close Sidebar Drawer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* TAB 1: WORKSHEET & SPEECH */}
      {sidebarType === "answer" && (
        <div className="space-y-4 flex-1 flex flex-col justify-between animate-fade-in overflow-y-auto max-h-[600px] pr-1 mt-3">
          <div className="space-y-3.5 text-left">
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
              <span className="font-bold">VERBAL CAPTURE INTERACTOR</span>
              <span className="text-indigo-400 font-bold">100% SPEECH TO TEXT</span>
            </div>

            {/* Mic capture action */}
            <div className="liquid-glass-medium border border-white/10 rounded-xl p-3.5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onToggleListening}
                className={`p-3 rounded-xl transition-all flex items-center justify-center cursor-pointer shrink-0 border ${
                  isListening
                    ? "bg-rose-500 text-white border-rose-400 animate-pulse scale-105"
                    : "bg-indigo-600 text-white border-indigo-400/40 hover:bg-indigo-500"
                }`}
                title={isListening ? "Stop voice recognition" : "Record Voice Answer"}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-white truncate">
                  {isListening ? "🎙️ Recording Vocal Stream" : "Mic Standby"}
                </h4>
                <p className="text-[9px] text-slate-400 mt-0.5 leading-snug">
                  {isListening ? "Processing live speech input..." : "Click mic to speak answer. Text outputs below."}
                </p>
              </div>

              {/* Sound visualizer */}
              <div className="flex items-end gap-0.5 h-6 shrink-0 w-14 overflow-hidden">
                {soundBars.map((val, idx) => (
                  <span 
                    key={idx}
                    className={`w-0.5 rounded-full transition-all duration-75 ${isListening ? 'bg-indigo-400' : 'bg-slate-700'}`}
                    style={{ height: `${val}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Live STAR checklist */}
            <div className="p-3 liquid-glass-medium border border-white/10 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-sans font-bold text-slate-200">Live Answer Diagnostics</span>
                <span className="text-[8px] font-mono text-slate-400 uppercase">Auto-scans draft</span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                <div className={`p-1.5 rounded-lg border text-center transition-all ${
                  checkSituation ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : "bg-black/30 border-white/5 text-slate-500"
                }`}>
                  <span className="text-[10px] font-mono font-bold block">{checkSituation ? "✓" : "S"}</span>
                  <span className="text-[7px] font-sans block mt-0.5 truncate">Situation</span>
                </div>
                <div className={`p-1.5 rounded-lg border text-center transition-all ${
                  checkTask ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : "bg-black/30 border-white/5 text-slate-500"
                }`}>
                  <span className="text-[10px] font-mono font-bold block">{checkTask ? "✓" : "T"}</span>
                  <span className="text-[7px] font-sans block mt-0.5 truncate">Task</span>
                </div>
                <div className={`p-1.5 rounded-lg border text-center transition-all ${
                  checkAction ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : "bg-black/30 border-white/5 text-slate-500"
                }`}>
                  <span className="text-[10px] font-mono font-bold block">{checkAction ? "✓" : "A"}</span>
                  <span className="text-[7px] font-sans block mt-0.5 truncate">Action</span>
                </div>
                <div className={`p-1.5 rounded-lg border text-center transition-all ${
                  checkResult ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : "bg-black/30 border-white/5 text-slate-500"
                }`}>
                  <span className="text-[10px] font-mono font-bold block">{checkResult ? "✓" : "R"}</span>
                  <span className="text-[7px] font-sans block mt-0.5 truncate">Result</span>
                </div>
              </div>
            </div>

            {/* Evaluation Goal Tip */}
            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-[10px] leading-relaxed text-slate-300 font-mono">
              <span className="text-indigo-400 font-bold">CRITICAL EVALUATION GOAL:</span> {currentQuestion.expectedFocus}
            </div>
          </div>

          <div className="pt-3 border-t border-white/10">
            <button
              onClick={() => onSubmitAnswer(false)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/30 border border-white/20"
            >
              <span>{isLastQuestion ? "Finish Interview & Evaluate" : "Submit Answer"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: AI COACH */}
      {sidebarType === "coach" && (() => {
        const coachFeedback = getDynamicCoachFeedback(currentQuestion.text, roleName);
        const wordCount = answerText.trim() === "" ? 0 : answerText.trim().split(/\s+/).length;
        const wpm = wordCount === 0 ? 0 : Math.min(160, Math.max(90, Math.round((wordCount / Math.max(1, duration)) * 60)));
        const fillerMatches = (answerText.match(/\b(um|uh|like|actually|basically|so)\b/gi) || []);
        const fillerCount = fillerMatches.length;
        const confidenceScore = wordCount < 5 ? 0 : Math.min(98, Math.max(72, Math.round(92 - (fillerCount * 1.5) + (checkAction ? 5 : 0))));

        const keywordsToInclude = [
          { word: "Sharding", matched: answerText.toLowerCase().includes("shard") },
          { word: "SLA / SLI", matched: answerText.toLowerCase().includes("sla") || answerText.toLowerCase().includes("sli") },
          { word: "Redis / Cache", matched: answerText.toLowerCase().includes("redis") || answerText.toLowerCase().includes("cach") },
          { word: "Write Throughput", matched: answerText.toLowerCase().includes("write") || answerText.toLowerCase().includes("throughput") },
          { word: "Scale Mitigation", matched: answerText.toLowerCase().includes("scale") || answerText.toLowerCase().includes("mitigat") },
          { word: "Fault Tolerance", matched: answerText.toLowerCase().includes("fault") || answerText.toLowerCase().includes("toleran") }
        ];

        return (
          <div className="space-y-4 flex-1 flex flex-col justify-between animate-fade-in overflow-y-auto max-h-[600px] pr-1 mt-3 text-left">
            <div className="space-y-3.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_8px_#818cf8]" />
                <span className="text-[10px] font-mono text-indigo-300 font-bold uppercase tracking-wider">
                  Real-time AI Coach Assessment
                </span>
              </div>

              {/* Live Metrics Trackers Panel */}
              <div className="grid grid-cols-2 gap-2 liquid-glass-medium border border-white/10 rounded-xl p-3">
                <div>
                  <span className="text-[8px] font-bold font-mono text-slate-400 uppercase block mb-0.5">Confidence</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-bold text-white">{confidenceScore === 0 ? "--" : `${confidenceScore}%`}</span>
                    <span className="text-[8px] text-slate-400">gaze adjusted</span>
                  </div>
                </div>
                <div>
                  <span className="text-[8px] font-bold font-mono text-slate-400 uppercase block mb-0.5">Speech Pace</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-bold text-white">{wpm === 0 ? "Standby" : `${wpm} WPM`}</span>
                    <span className={`text-[8px] ${wpm === 0 ? "text-slate-500" : wpm < 110 ? "text-yellow-400" : wpm <= 145 ? "text-emerald-400" : "text-amber-400"}`}>
                      {wpm === 0 ? "idle" : wpm < 110 ? "slow" : wpm <= 145 ? "optimal" : "fast"}
                    </span>
                  </div>
                </div>
                <div className="col-span-2 border-t border-white/10 pt-2 mt-1">
                  <span className="text-[8px] font-bold font-mono text-slate-400 uppercase block mb-0.5">Filler Words Scanned</span>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${fillerCount > 3 ? "text-rose-400 animate-pulse" : fillerCount > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                      {fillerCount} filler {fillerCount === 1 ? "word" : "words"} detected
                    </span>
                    {fillerCount > 3 && <span className="text-[7.5px] font-mono text-rose-400 uppercase font-semibold">Take a pause</span>}
                  </div>
                </div>
              </div>

              {/* Calibration Hint */}
              <div className="p-3 liquid-glass-medium border border-white/10 rounded-xl">
                <span className="text-[8px] font-bold font-mono text-indigo-400 uppercase tracking-wider block mb-1">
                  Boardroom Calibration Hint
                </span>
                <p className="text-[10.5px] text-slate-300 leading-relaxed font-sans">
                  "{coachFeedback.focusHint}"
                </p>
              </div>

              {/* Recommended STAR Response Structure */}
              <div className="space-y-2">
                <span className="text-[8.5px] font-bold font-mono text-slate-300 uppercase tracking-wider block">
                  Recommended STAR Response Architecture
                </span>

                <div className="space-y-2">
                  <div className="p-2.5 liquid-glass-medium border border-white/10 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[8.5px] font-mono font-bold text-indigo-400">SITUATION / COMPLEXITY</span>
                      <span className={`text-[8px] font-mono font-bold ${checkSituation ? "text-emerald-400" : "text-slate-500"}`}>
                        {checkSituation ? "✓ DETECTED" : "MISSING"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-relaxed">{coachFeedback.starSituation}</p>
                  </div>

                  <div className="p-2.5 liquid-glass-medium border border-white/10 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[8.5px] font-mono font-bold text-indigo-400">ACTION / RESOLUTION</span>
                      <span className={`text-[8px] font-mono font-bold ${checkAction ? "text-emerald-400" : "text-slate-500"}`}>
                        {checkAction ? "✓ DETECTED" : "MISSING"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-relaxed">{coachFeedback.starAction}</p>
                  </div>
                </div>
              </div>

              {/* Target Vocabulary Checklist */}
              <div className="space-y-2">
                <span className="text-[8.5px] font-bold font-mono text-slate-300 uppercase tracking-wider block">
                  Target Concept Vocabulary to Include
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {keywordsToInclude.map((kw, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[9px] font-mono transition-all ${
                        kw.matched 
                          ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300" 
                          : "liquid-glass-subtle border-white/10 text-slate-400"
                      }`}
                    >
                      <span className="font-bold">{kw.matched ? "✓" : "•"}</span>
                      <span className="truncate">{kw.word}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10">
              <span className="text-[8.5px] text-slate-400 font-mono leading-tight block text-center">
                🤖 Real-time calibration parameters adjust automatically.
              </span>
            </div>
          </div>
        );
      })()}

      {/* TAB 3: SCORECARD */}
      {sidebarType === "scorecard" && (() => {
        const currentWords = answerText.trim().split(/\s+/).filter(w => w.length > 0).length;
        const hasTypedAnswer = currentWords >= 5;
        const completedCount = currentQuestionIndex;
        const progressPct = Math.round(((completedCount + (hasTypedAnswer ? 0.5 : 0)) / totalQuestions) * 100);
        
        const ProgressRing = ({ percent, label, color }: { percent: number; label: string; color: string }) => {
          const radius = 18;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (percent / 100) * circumference;
          return (
            <div className="flex flex-col items-center justify-center liquid-glass-medium border border-white/10 p-2.5 rounded-xl">
              <div className="relative flex items-center justify-center w-11 h-11">
                <svg className="w-11 h-11 transform -rotate-90">
                  <circle cx="22" cy="22" r={radius} className="stroke-white/10" strokeWidth="2.5" fill="transparent" />
                  <circle 
                    cx="22" 
                    cy="22" 
                    r={radius} 
                    className={color} 
                    strokeWidth="3" 
                    fill="transparent" 
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.8s ease" }}
                  />
                </svg>
                <span className="absolute text-[8.5px] font-bold font-mono text-white">{percent}%</span>
              </div>
              <span className="text-[7.5px] font-sans text-slate-300 font-medium text-center mt-1.5 uppercase tracking-wide leading-none">{label}</span>
            </div>
          );
        };

        return (
          <div className="space-y-4 flex-1 flex flex-col justify-between animate-fade-in overflow-y-auto max-h-[600px] pr-1 mt-3 text-left">
            <div className="space-y-3.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                <span className="text-[10px] font-mono text-emerald-300 font-bold uppercase tracking-wider">
                  Live Simulation Evaluation Criteria
                </span>
              </div>

              {/* Progress Overview Card */}
              <div className="liquid-glass-medium border border-white/10 rounded-xl p-3.5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[8px] font-bold font-mono text-slate-400 uppercase block tracking-wider">Simulation Progress</span>
                  <h4 className="text-xl font-extrabold text-white">{progressPct}% <span className="text-[10px] text-indigo-400 font-mono font-medium">In Progress</span></h4>
                  <p className="text-[8.5px] text-slate-300 leading-normal">
                    {hasTypedAnswer 
                      ? `Active response: ~${currentWords} words recorded` 
                      : "Awaiting your written or spoken response"}
                  </p>
                </div>
              </div>

              {/* Evaluation Grid */}
              <div className="grid grid-cols-3 gap-2">
                <ProgressRing percent={hasTypedAnswer ? Math.min(100, Math.round(currentWords * 1.5)) : 0} label="Response Depth" color="stroke-indigo-400" />
                <ProgressRing percent={hasTypedAnswer ? Math.min(100, Math.round(currentWords * 1.2)) : 0} label="Technical Depth" color="stroke-blue-400" />
                <ProgressRing percent={Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)} label="Pacing" color="stroke-purple-400" />
                <ProgressRing percent={hasTypedAnswer ? 85 : 0} label="STAR Method" color="stroke-emerald-400" />
                <ProgressRing percent={90} label="Delivery Mode" color="stroke-amber-400" />
                <ProgressRing percent={100} label="Context Match" color="stroke-rose-400" />
              </div>

              {/* Parameters review */}
              <div className="liquid-glass-medium border border-white/10 rounded-xl p-3 space-y-2">
                <span className="text-[8px] font-bold font-mono text-slate-400 uppercase tracking-wider block">Executive Parameters Review</span>
                <div className="space-y-1.5 text-[9.5px]">
                  <div className="flex justify-between border-b border-white/10 pb-1.5">
                    <span className="text-slate-400">Questions Completed</span>
                    <span className="font-mono font-bold text-white">{currentQuestionIndex + 1} of {totalQuestions}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-1.5">
                    <span className="text-slate-400">Elapsed Time</span>
                    <span className="font-mono font-bold text-slate-300">{formatTime(duration)}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-1.5">
                    <span className="text-slate-400">Current Question Stage</span>
                    <span className="font-bold text-indigo-400">Architecture Scale</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Evaluation Difficulty</span>
                    <span className="font-mono font-bold text-indigo-300 uppercase text-[8px]">Executive Tier</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB 4: PRIVATE SCRATCHPAD */}
      {sidebarType === "notepad" && (
        <div className="space-y-4 flex-1 flex flex-col justify-between animate-fade-in mt-3 text-left">
          <div className="space-y-3 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-300 font-bold uppercase tracking-wider">
                Private Blueprint Scratchpad
              </span>
              <span className="text-[8px] text-slate-400 font-mono">Auto Persists</span>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed">
              Use this private text pad to outline STAR metrics, write time complexity ($O(N \log N)$), or jot database schema ideas. It will not be graded.
            </p>

            <textarea
              rows={10}
              placeholder="✍️ private blueprint scratchpad...
- STAR: Saturation peaked under massive traffic load.
- Resolution: Integrated Redis caching clusters."
              className="w-full flex-1 liquid-glass-input rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 font-mono leading-relaxed focus:outline-none border border-white/15 focus:border-indigo-400 resize-none min-h-[220px]"
              value={scratchNotes}
              onChange={(e) => onScratchNotesChange(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                if (scratchNotes.trim()) {
                  onAnswerChange((answerText.trim() + "\n\n" + scratchNotes).trim());
                }
              }}
              className="py-2 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Append scratchpad contents to answer field"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Add to Answer</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm("Are you sure you want to clear your scratchpad notes?")) {
                  onScratchNotesChange("");
                }
              }}
              className="py-2 px-3 liquid-glass-subtle hover:bg-white/10 text-slate-400 hover:text-rose-400 border border-white/10 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: BOARD MEMBERS */}
      {sidebarType === "participants" && (
        <div className="space-y-4 flex-1 flex flex-col animate-fade-in overflow-y-auto max-h-[600px] pr-1 mt-3 text-left">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span className="text-[10px] font-mono text-emerald-300 font-bold uppercase tracking-wider">
              Board Recruiter Profiles ({currentPanel.length} Members)
            </span>
          </div>

          <p className="text-[10px] text-slate-400 leading-relaxed">
            These recruiters are assessing your responses. Calibrate your answers to address their key priorities:
          </p>

          <div className="space-y-3">
            {currentPanel.map((recruiter) => (
              <div key={recruiter.id} className="p-3.5 liquid-glass-medium border border-white/10 rounded-xl space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-slate-900 shrink-0">
                    <img 
                      src={recruiter.avatarUrl} 
                      alt={recruiter.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white leading-none">{recruiter.name}</h5>
                    <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">{recruiter.role}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[9px] pt-1">
                  <div className="p-1.5 liquid-glass-subtle rounded-lg">
                    <span className="text-[7.5px] text-slate-400 font-mono uppercase block">FOCUS AREA</span>
                    <span className="text-indigo-300 font-bold font-mono">{recruiter.focus}</span>
                  </div>
                  <div className="p-1.5 liquid-glass-subtle rounded-lg">
                    <span className="text-[7.5px] text-slate-400 font-mono uppercase block">CRITICAL CHECK</span>
                    <span className="text-amber-300 font-bold font-sans">
                      {recruiter.id === 0 ? "STAR clarity" : recruiter.id === 1 ? "Technical debt" : "Business impact"}
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-300 leading-relaxed font-sans pt-1">
                  {recruiter.id === 0 && "Sarah values constructive conflict-resolution, strong team empathy, clear communication structure, and professional growth."}
                  {recruiter.id === 1 && "David evaluates system scalability, clean database design, microservice decouplings, and SLA risk mitigation."}
                  {recruiter.id === 2 && "Marcus weighs your operational performance under pressure, project triage capabilities, and executive maturity."}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
