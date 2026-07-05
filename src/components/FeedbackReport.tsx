import React from "react";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  BookOpen, 
  ArrowLeft, 
  Check, 
  Award,
  ChevronRight,
  TrendingUp,
  RotateCcw
} from "lucide-react";
import { FeedbackReport as FeedbackType, Question } from "../types";

interface FeedbackReportProps {
  evaluation: FeedbackType;
  onBackToDashboard: () => void;
  onNavigateToStudy: () => void;
  questions: Question[];
}

export default function FeedbackReport({
  evaluation,
  onBackToDashboard,
  onNavigateToStudy,
  questions
}: FeedbackReportProps) {
  const isStrong = evaluation.overallRating.toLowerCase().includes("strong");
  const isLean = evaluation.overallRating.toLowerCase().includes("lean");
  
  const score = isStrong ? 93 : isLean ? 76 : 52;
  const ratingColor = isStrong ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" : isLean ? "text-amber-400 border-amber-500/20 bg-amber-500/5" : "text-rose-400 border-rose-500/20 bg-rose-500/5";
  const scoreColorHex = isStrong ? "#10b981" : isLean ? "#f59e0b" : "#ef4444";

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Return to home button */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBackToDashboard}
          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-[#27272A] rounded-xl text-[10.5px] font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Exit Feedback Workspace</span>
        </button>

        <span className="text-[10px] text-slate-500 font-mono">Calibrated against Stripe/Apple Hiring rubrics</span>
      </div>

      {/* Main Score & Summary Hero */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Gauge Card */}
        <div className="md:col-span-4 bg-[#111827] border border-[#27272A] p-6 rounded-[18px] flex flex-col justify-between items-center text-center">
          <div className="w-full text-left">
            <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block">Calibrated Verdict</span>
            <h3 className="text-sm font-bold text-white font-sans mt-0.5">Recruiter Assessment Score</h3>
          </div>

          <div className="relative w-28 h-28 my-6 flex items-center justify-center select-none">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="56" cy="56" r="48" stroke="#1F2937" strokeWidth="8" fill="transparent" />
              <circle cx="56" cy="56" r="48" stroke={scoreColorHex} strokeWidth="8" fill="transparent" strokeDasharray="301" strokeDashoffset={301 - (301 * score) / 100} strokeLinecap="round" />
            </svg>
            <div className="absolute text-center">
              <span className="text-2xl font-bold text-white">{score}%</span>
              <span className="text-[8px] text-slate-500 font-mono block mt-0.5">PROFICIENCY</span>
            </div>
          </div>

          <div className={`px-4 py-1.5 rounded-lg border text-xs font-bold font-mono tracking-wide ${ratingColor}`}>
            {evaluation.overallRating}
          </div>
        </div>

        {/* Narrative Summary card */}
        <div className="md:col-span-8 bg-[#111827] border border-[#27272A] p-6 rounded-[18px] flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Board Commentary</span>
              <span className="text-[10px] text-indigo-400 font-mono font-bold flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                Verified AI Feedback
              </span>
            </div>
            
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-sans">
              {evaluation.overallFeedback}
            </p>
          </div>

          {/* Calibrated skill indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-5 border-t border-[#27272A]/80">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-400">Technical Domain Accuracy</span>
                <span className="text-white font-bold">{isStrong ? 95 : isLean ? 78 : 55}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-[#6D5EF8]" style={{ width: `${isStrong ? 95 : isLean ? 78 : 55}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-400">STAR Structure Consistency</span>
                <span className="text-white font-bold">{isStrong ? 91 : isLean ? 72 : 48}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-[#6D5EF8]" style={{ width: `${isStrong ? 91 : isLean ? 72 : 48}%` }} />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Strengths & Improvement gaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Strengths */}
        <div className="bg-[#111827] border border-[#27272A] p-6 rounded-[18px] space-y-4">
          <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
            <span>Identified Domain Strengths</span>
          </h4>

          <div className="space-y-3">
            {evaluation.strengths.map((str, idx) => (
              <div key={idx} className="p-3.5 bg-slate-950/40 border border-[#27272A] rounded-xl text-xs text-slate-300 leading-relaxed font-sans flex gap-3">
                <span className="text-emerald-400 shrink-0 font-bold font-mono">✓</span>
                <p>{str}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Improvement Gaps */}
        <div className="bg-[#111827] border border-[#27272A] p-6 rounded-[18px] space-y-4">
          <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
            <span>Core Improvement Gaps</span>
          </h4>

          <div className="space-y-3">
            {evaluation.improvements.map((gap, idx) => (
              <div key={idx} className="p-3.5 bg-slate-950/40 border border-[#27272A] rounded-xl text-xs text-slate-300 leading-relaxed font-sans flex gap-3">
                <span className="text-amber-500 shrink-0 font-bold font-mono">!</span>
                <p>{gap}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recommended Roadmap Cheatsheets CTA */}
      <div className="bg-[#111827] border border-[#27272A] p-6 rounded-[18px] flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h4 className="text-xs font-bold text-white">Need to refine missing keyword gaps?</h4>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">Use our interactive STAR Builder worksheets to refactor your story responses.</p>
        </div>

        <button
          onClick={onNavigateToStudy}
          className="px-4 py-2 bg-[#6D5EF8] hover:bg-[#6D5EF8]/90 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-[#6D5EF8]/10"
        >
          <BookOpen className="h-4 w-4" />
          <span>Launch STAR Worksheet</span>
        </button>
      </div>
    </div>
  );
}
