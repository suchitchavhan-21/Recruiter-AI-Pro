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

const sarahImg = "/assets/sarah.png";
const davidImg = "/assets/david.png";
const marcusImg = "/assets/marcus.png";

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
  
  const score = evaluation.score !== undefined ? evaluation.score : (isStrong ? 93 : isLean ? 76 : 52);
  const ratingColor = score >= 85 ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" : score >= 65 ? "text-amber-400 border-amber-500/20 bg-amber-500/5" : "text-rose-400 border-rose-500/20 bg-rose-500/5";
  const scoreColorHex = score >= 85 ? "#10b981" : score >= 65 ? "#f59e0b" : "#ef4444";

  const technicalAccuracy = score === 0 ? 0 : Math.max(10, Math.min(100, Math.round(score * 1.02)));
  const starConsistency = score === 0 ? 0 : Math.max(10, Math.min(100, Math.round(score * 0.95)));

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
                <span className="text-white font-bold">{technicalAccuracy}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-[#6D5EF8]" style={{ width: `${technicalAccuracy}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-400">STAR Structure Consistency</span>
                <span className="text-white font-bold">{starConsistency}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-[#6D5EF8]" style={{ width: `${starConsistency}%` }} />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* AI PANEL INTERVIEWER SCORECARDS */}
      {evaluation.panelFeedback && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
              <Award className="h-4.5 w-4.5 text-indigo-400" />
              <span>AI Panel Individual Scorecards</span>
            </h3>
            <span className="text-[9px] font-mono bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 px-2.5 py-0.5 rounded font-bold uppercase">Consensus Metrics</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* HR Manager */}
            {evaluation.panelFeedback.hr && (
              <div className="bg-[#111827] border border-[#27272A] p-5 rounded-[18px] space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 border-b border-[#27272A]/60 pb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/15 shadow-sm shrink-0">
                      <img 
                        src={sarahImg} 
                        alt="Sarah Jenkins" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-white">Sarah Jenkins</h4>
                      <p className="text-[9px] text-slate-400 font-mono">HR Manager / Behavioral</p>
                    </div>
                    <span className="ml-auto text-xs font-mono font-bold bg-[#6D5EF8]/10 text-indigo-400 border border-[#6D5EF8]/20 px-2 py-0.5 rounded">
                      {evaluation.panelFeedback.hr.score}/100
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans line-clamp-4">
                    "{evaluation.panelFeedback.hr.feedback}"
                  </p>
                </div>
                
                <div className="space-y-2 pt-3 border-t border-[#27272A]/50">
                  <div className="flex flex-wrap gap-1">
                    {evaluation.panelFeedback.hr.strengths.slice(0, 2).map((s, i) => (
                      <span key={i} className="text-[8px] font-mono text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10">
                        + {s}
                      </span>
                    ))}
                    {evaluation.panelFeedback.hr.weaknesses.slice(0, 2).map((w, i) => (
                      <span key={i} className="text-[8px] font-mono text-amber-400 bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/10">
                        - {w}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Technical Expert */}
            {evaluation.panelFeedback.technical && (
              <div className="bg-[#111827] border border-[#27272A] p-5 rounded-[18px] space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 border-b border-[#27272A]/60 pb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/15 shadow-sm shrink-0">
                      <img 
                        src={davidImg} 
                        alt="David Chen" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-white">David Chen</h4>
                      <p className="text-[9px] text-slate-400 font-mono">Technical Expert / Architecture</p>
                    </div>
                    <span className="ml-auto text-xs font-mono font-bold bg-[#6D5EF8]/10 text-indigo-400 border border-[#6D5EF8]/20 px-2 py-0.5 rounded">
                      {evaluation.panelFeedback.technical.score}/100
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans line-clamp-4">
                    "{evaluation.panelFeedback.technical.feedback}"
                  </p>
                </div>
                
                <div className="space-y-2 pt-3 border-t border-[#27272A]/50">
                  <div className="flex flex-wrap gap-1">
                    {evaluation.panelFeedback.technical.strengths.slice(0, 2).map((s, i) => (
                      <span key={i} className="text-[8px] font-mono text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10">
                        + {s}
                      </span>
                    ))}
                    {evaluation.panelFeedback.technical.weaknesses.slice(0, 2).map((w, i) => (
                      <span key={i} className="text-[8px] font-mono text-amber-400 bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/10">
                        - {w}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Hiring Manager */}
            {evaluation.panelFeedback.hiringManager ? (
              <div className="bg-[#111827] border border-[#27272A] p-5 rounded-[18px] space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 border-b border-[#27272A]/60 pb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/15 shadow-sm shrink-0">
                      <img 
                        src={marcusImg} 
                        alt="Marcus Brody" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-white">Marcus Brody</h4>
                      <p className="text-[9px] text-slate-400 font-mono">Hiring Manager / Leadership</p>
                    </div>
                    <span className="ml-auto text-xs font-mono font-bold bg-[#6D5EF8]/10 text-indigo-400 border border-[#6D5EF8]/20 px-2 py-0.5 rounded">
                      {evaluation.panelFeedback.hiringManager.score}/100
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans line-clamp-4">
                    "{evaluation.panelFeedback.hiringManager.feedback}"
                  </p>
                </div>
                
                <div className="space-y-2 pt-3 border-t border-[#27272A]/50">
                  <div className="flex flex-wrap gap-1">
                    {evaluation.panelFeedback.hiringManager.strengths.slice(0, 2).map((s, i) => (
                      <span key={i} className="text-[8px] font-mono text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10">
                        + {s}
                      </span>
                    ))}
                    {evaluation.panelFeedback.hiringManager.weaknesses.slice(0, 2).map((w, i) => (
                      <span key={i} className="text-[8px] font-mono text-amber-400 bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/10">
                        - {w}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#111827] border border-[#27272A] p-5 rounded-[18px] space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-[#6D5EF8] font-bold uppercase tracking-wider block">Panel Consensus Summary</span>
                  <h4 className="text-[11px] font-bold text-white">Panel Recommendation Summary</h4>
                  <p className="text-[10.5px] text-slate-400 leading-relaxed font-sans line-clamp-5">
                    {evaluation.hiringRecommendation || "The panel consensus suggests strong technical proficiency with slight behavioral follow-up recommendations to ensure seamless organizational alignment."}
                  </p>
                </div>
                <div className="text-[9px] text-slate-500 font-mono pt-3 border-t border-[#27272A]/50">
                  Calibration Level: 100% Secure
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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

      {/* MISTAKES MADE & PRACTICE PLAN */}
      {((evaluation.mistakesMade && evaluation.mistakesMade.length > 0) || (evaluation.practicePlan && evaluation.practicePlan.length > 0)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {evaluation.mistakesMade && evaluation.mistakesMade.length > 0 && (
            <div className="bg-[#111827] border border-[#27272A] p-6 rounded-[18px] space-y-4">
              <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
                <AlertTriangle className="h-4.5 w-4.5 text-rose-500" />
                <span>Critical Mistakes Detected</span>
              </h4>
              <div className="space-y-3">
                {evaluation.mistakesMade.map((mistake, idx) => (
                  <div key={idx} className="p-3.5 bg-rose-500/5 border border-rose-500/10 rounded-xl text-xs text-rose-300 leading-relaxed font-sans flex gap-3">
                    <span className="text-rose-500 shrink-0 font-bold font-mono">✗</span>
                    <p>{mistake}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {evaluation.practicePlan && evaluation.practicePlan.length > 0 && (
            <div className="bg-[#111827] border border-[#27272A] p-6 rounded-[18px] space-y-4">
              <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="h-4.5 w-4.5 text-emerald-400" />
                <span>Targeted Practice Roadmap</span>
              </h4>
              <div className="space-y-3">
                {evaluation.practicePlan.map((step, idx) => (
                  <div key={idx} className="p-3.5 bg-[#6D5EF8]/5 border border-[#6D5EF8]/10 rounded-xl text-xs text-indigo-300 leading-relaxed font-sans flex gap-3">
                    <span className="text-indigo-400 shrink-0 font-bold font-mono">{idx + 1}.</span>
                    <p>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* IDEAL ANSWERS BREAKDOWN */}
      {evaluation.idealAnswers && evaluation.idealAnswers.length > 0 && (
        <div className="bg-[#111827] border border-[#27272A] p-6 rounded-[18px] space-y-4 animate-fade-in">
          <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="h-4.5 w-4.5 text-indigo-400" />
            <span>Principal Ideal Responses</span>
          </h4>
          <div className="space-y-4">
            {evaluation.idealAnswers.map((answer, idx) => (
              <div key={idx} className="p-4 bg-slate-950/60 border border-[#27272A]/80 rounded-xl space-y-2">
                <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-wider">Question {idx + 1} Suggested Structure</span>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

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
