import React, { useState } from "react";
import { Volume2, Sparkles, ChevronDown, ChevronUp, Target, MessageSquare } from "lucide-react";
import { Question } from "../../types";

interface QuestionGlassCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  speakerName: string;
  speakerRole: string;
  speakerImg: string;
  onReplayAudio: () => void;
  isSpeaking: boolean;
}

export function QuestionGlassCard({
  question,
  questionNumber,
  totalQuestions,
  speakerName,
  speakerRole,
  speakerImg,
  onReplayAudio,
  isSpeaking
}: QuestionGlassCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div 
      id="current-question-card"
      className="liquid-glass-strong p-4 sm:p-5 rounded-2xl border border-white/15 shadow-2xl relative transition-all duration-300"
    >
      {/* Header bar: Speaker Attribution + Question Counter + Replay Action */}
      <div className="flex items-center justify-between gap-3 mb-3 border-b border-white/10 pb-3">
        {/* Speaker Profile */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-indigo-400/40 bg-slate-900 shrink-0 shadow-md">
            <img 
              src={speakerImg} 
              alt={speakerName} 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer" 
            />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white leading-none">{speakerName}</span>
              {isSpeaking && (
                <span className="flex items-center gap-1 text-[8px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-full border border-indigo-500/20">
                  <span className="w-1 h-1 rounded-full bg-indigo-400 animate-ping" />
                  Speaking
                </span>
              )}
            </div>
            <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">{speakerRole}</span>
          </div>
        </div>

        {/* Question Counter Pill & Controls */}
        <div className="flex items-center gap-2">
          <div className="liquid-glass-subtle px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
            <span className="text-[9px] font-mono font-bold text-indigo-300">
              QUESTION {String(questionNumber).padStart(2, '0')} / {String(totalQuestions).padStart(2, '0')}
            </span>
          </div>

          {/* Audio Replay */}
          <button
            id="btn-replay-question-prompt"
            onClick={onReplayAudio}
            className="p-1.5 liquid-glass-subtle hover:bg-white/10 text-slate-300 hover:text-white rounded-xl border border-white/10 transition-all cursor-pointer flex items-center gap-1 text-[9px] font-mono"
            title="Replay Recruiter Audio Prompt"
          >
            <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Repeat</span>
          </button>

          {/* Expand/Collapse */}
          <button
            id="btn-toggle-expand-question"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 liquid-glass-subtle hover:bg-white/10 text-slate-400 hover:text-white rounded-xl border border-white/10 transition-all cursor-pointer"
            title={isExpanded ? "Collapse Question Card" : "Expand Question Card"}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Question Text & Focus Pill */}
      {isExpanded && (
        <div className="space-y-3 text-left animate-fade-in">
          <div className="flex items-start gap-2.5">
            <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <h3 className="text-sm sm:text-base font-semibold text-white leading-relaxed tracking-tight font-display">
              "{question.text}"
            </h3>
          </div>

          {/* Expected Evaluation Focus Area */}
          {question.expectedFocus && (
            <div className="flex items-center gap-2 pt-1">
              <div className="flex items-center gap-1.5 liquid-glass-subtle px-3 py-1 rounded-xl border border-indigo-500/20 text-[9.5px] font-mono text-slate-300">
                <Target className="w-3 h-3 text-indigo-400 shrink-0" />
                <span className="font-bold text-indigo-300 uppercase text-[8px] tracking-wider">Evaluation Focus:</span>
                <span className="text-slate-200">{question.expectedFocus}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
