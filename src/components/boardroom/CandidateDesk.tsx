import React, { useState } from "react";
import { 
  Send, 
  Mic, 
  MicOff, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  PenTool, 
  Radio, 
  Trash2,
  FileText,
  AlertCircle
} from "lucide-react";
import { CandidateInputMode } from "./types";

interface CandidateDeskProps {
  answerText: string;
  onAnswerChange: (text: string) => void;
  isListening: boolean;
  onToggleListening: () => void;
  soundBars: number[];
  isGeneratingDraft: boolean;
  onGenerateDraft: () => void;
  onSubmitAnswer: (skip: boolean) => void;
  isLastQuestion: boolean;
  checkSituation: boolean;
  checkTask: boolean;
  checkAction: boolean;
  checkResult: boolean;
  currentQuestionIndex: number;
}

export function CandidateDesk({
  answerText,
  onAnswerChange,
  isListening,
  onToggleListening,
  soundBars,
  isGeneratingDraft,
  onGenerateDraft,
  onSubmitAnswer,
  isLastQuestion,
  checkSituation,
  checkTask,
  checkAction,
  checkResult,
  currentQuestionIndex
}: CandidateDeskProps) {
  const [activeMode, setActiveMode] = useState<CandidateInputMode>("write");
  const [showEmptyWarning, setShowEmptyWarning] = useState(false);

  const wordCount = answerText.trim() === "" ? 0 : answerText.trim().split(/\s+/).filter(w => w.length > 0).length;
  const charCount = answerText.length;

  const handleMainSubmit = () => {
    if (wordCount === 0 && !showEmptyWarning) {
      setShowEmptyWarning(true);
      return;
    }
    setShowEmptyWarning(false);
    onSubmitAnswer(false);
  };

  return (
    <div 
      id="candidate-response-desk"
      className="liquid-glass-strong p-4 sm:p-5 rounded-2xl border border-white/15 shadow-2xl space-y-4 text-left transition-all duration-300"
    >
      {/* Desk Mode Switcher & Live Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        {/* Mode Toggles */}
        <div className="flex items-center gap-1.5 p-1 liquid-glass-subtle rounded-xl border border-white/10">
          <button
            id="tab-desk-write-mode"
            type="button"
            onClick={() => setActiveMode("write")}
            className={`px-3 py-1.5 rounded-lg text-[9.5px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              activeMode === "write"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-white/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <PenTool className="w-3 h-3" />
            <span>Write Response</span>
          </button>

          <button
            id="tab-desk-voice-mode"
            type="button"
            onClick={() => setActiveMode("mic")}
            className={`px-3 py-1.5 rounded-lg text-[9.5px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              activeMode === "mic"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-white/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Mic className="w-3 h-3" />
            <span>Voice Stream</span>
          </button>
        </div>

        {/* Word Counter & STAR Quick Chips */}
        <div className="flex items-center gap-2">
          {/* STAR framework live detection tags */}
          <div className="flex items-center gap-1">
            <span 
              className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded transition-all ${
                checkSituation 
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                  : "bg-white/5 text-slate-500 border border-white/5"
              }`}
              title="Situation / Context detected"
            >
              {checkSituation ? "✓ S" : "S"}
            </span>
            <span 
              className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded transition-all ${
                checkTask 
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                  : "bg-white/5 text-slate-500 border border-white/5"
              }`}
              title="Task / Problem statement detected"
            >
              {checkTask ? "✓ T" : "T"}
            </span>
            <span 
              className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded transition-all ${
                checkAction 
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                  : "bg-white/5 text-slate-500 border border-white/5"
              }`}
              title="Action / Individual contribution detected"
            >
              {checkAction ? "✓ A" : "A"}
            </span>
            <span 
              className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded transition-all ${
                checkResult 
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                  : "bg-white/5 text-slate-500 border border-white/5"
              }`}
              title="Result / Quantitative metrics detected"
            >
              {checkResult ? "✓ R" : "R"}
            </span>
          </div>

          <div className="liquid-glass-subtle px-2.5 py-1 rounded-lg border border-white/10 text-[9px] font-mono text-slate-300">
            <span className="font-bold text-white">{wordCount}</span> words • <span>{charCount}</span> chars
          </div>
        </div>
      </div>

      {/* Voice Mode Audio Visualizer Card */}
      {activeMode === "mic" && (
        <div className="liquid-glass-medium p-4 rounded-xl border border-white/10 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                id="btn-desk-record-mic"
                type="button"
                onClick={onToggleListening}
                className={`p-3.5 rounded-2xl transition-all flex items-center justify-center cursor-pointer border shadow-lg ${
                  isListening
                    ? "bg-rose-500 text-white border-rose-400 animate-pulse scale-105 shadow-rose-500/30"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400/50 shadow-indigo-600/30"
                }`}
                title={isListening ? "Stop Voice Recording" : "Start Live Voice Answer"}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <div>
                <h4 className="text-xs font-bold text-white">
                  {isListening ? "🎙️ Recording Vocal Answer Stream..." : "Microphone Ready"}
                </h4>
                <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                  {isListening ? "AI is transcribing speech in real-time." : "Click microphone to begin speaking your answer."}
                </p>
              </div>
            </div>

            {/* Audio Equalizer */}
            <div className="flex items-end gap-1 h-7 w-24 px-2 liquid-glass-subtle rounded-lg border border-white/10 overflow-hidden">
              {soundBars.map((val, idx) => (
                <span 
                  key={idx}
                  className={`w-1 rounded-full transition-all duration-75 ${isListening ? 'bg-indigo-400' : 'bg-slate-700'}`}
                  style={{ height: `${isListening ? Math.max(15, val) : 20}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Text Editor Area */}
      <div className="space-y-1.5 relative">
        <textarea
          id="candidate-answer-textarea"
          rows={5}
          value={answerText}
          onChange={(e) => {
            onAnswerChange(e.target.value);
            if (showEmptyWarning) setShowEmptyWarning(false);
          }}
          placeholder="Speak aloud or draft your structured response here...
Use the STAR structure (Situation, Task, Action, Result) with engineering metrics and trade-offs."
          className="w-full liquid-glass-input rounded-xl p-3.5 text-xs text-slate-100 placeholder-slate-500 leading-relaxed font-sans focus:outline-none border border-white/15 focus:border-indigo-400 transition-all resize-none shadow-inner"
        />

        {/* Clear text quick icon */}
        {answerText.length > 0 && (
          <button
            type="button"
            onClick={() => onAnswerChange("")}
            className="absolute top-2.5 right-2.5 p-1 liquid-glass-subtle hover:bg-white/10 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
            title="Clear Draft Text"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Empty Warning Notification */}
      {showEmptyWarning && (
        <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-start gap-2.5 animate-slide-up text-amber-200 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Your answer is currently empty!</p>
            <p className="text-[10px] text-amber-300/90 font-mono">
              Leaving questions blank may result in a "No Hire" rating. You can click <strong>"Auto-Draft Answer"</strong> to generate an expert blueprint, or click <strong>"Submit Anyway"</strong> to proceed.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onGenerateDraft}
                className="px-2.5 py-1 bg-amber-500/25 hover:bg-amber-500/40 text-amber-100 rounded-lg text-[9px] font-mono font-bold cursor-pointer"
              >
                Auto-Draft Expert Answer
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEmptyWarning(false);
                  onSubmitAnswer(true);
                }}
                className="px-2.5 py-1 bg-transparent hover:bg-white/10 text-amber-300 rounded-lg text-[9px] font-mono underline cursor-pointer"
              >
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-white/10">
        {/* Auto-Draft Suggestion Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            id="btn-auto-draft-suggestion"
            type="button"
            onClick={onGenerateDraft}
            disabled={isGeneratingDraft}
            className="px-3.5 py-2 text-[10.5px] font-bold liquid-glass-subtle hover:bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>{isGeneratingDraft ? "Generating AI Draft..." : "Auto-Draft AI Suggestion"}</span>
          </button>

          <button
            id="btn-skip-question"
            type="button"
            onClick={() => onSubmitAnswer(true)}
            className="px-2.5 py-2 text-[10px] font-mono text-slate-500 hover:text-rose-400 transition-colors cursor-pointer hover:underline"
          >
            Skip Question
          </button>
        </div>

        {/* Primary Submit Button */}
        <button
          id="btn-submit-boardroom-answer"
          type="button"
          onClick={handleMainSubmit}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 border border-white/20 group shrink-0"
        >
          <span>{isLastQuestion ? "Finish Interview & Evaluate" : "Submit Answer & Next Question"}</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
