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
  RotateCcw,
  Target,
  ShieldCheck
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
  // 1. Mathematically sound score derivation from real evaluation output
  let calculatedScore: number | null = typeof evaluation.score === "number" && !isNaN(evaluation.score) ? evaluation.score : null;

  if (calculatedScore === null) {
    if (evaluation.questionBreakdown && evaluation.questionBreakdown.length > 0) {
      const validScores = evaluation.questionBreakdown
        .map(q => Number(q.score))
        .filter(s => !isNaN(s));
      if (validScores.length > 0) {
        calculatedScore = Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length);
      }
    } else if (evaluation.panelFeedback) {
      const panelVals: number[] = [];
      if (evaluation.panelFeedback.hr?.score !== undefined) panelVals.push(Number(evaluation.panelFeedback.hr.score));
      if (evaluation.panelFeedback.technical?.score !== undefined) panelVals.push(Number(evaluation.panelFeedback.technical.score));
      if (evaluation.panelFeedback.hiringManager?.score !== undefined) panelVals.push(Number(evaluation.panelFeedback.hiringManager.score));
      const validPanel = panelVals.filter(s => !isNaN(s));
      if (validPanel.length > 0) {
        calculatedScore = Math.round(validPanel.reduce((a, b) => a + b, 0) / validPanel.length);
      }
    }
  }

  const score = calculatedScore !== null ? Math.max(0, Math.min(100, Math.round(calculatedScore))) : null;

  // 2. Synchronized rating badge
  const ratingText = evaluation.overallRating || (score !== null ? (score >= 85 ? "Strong Hire" : score >= 70 ? "Lean Hire" : "Needs Practice") : "Evaluation Pending");
  const ratingColor = score !== null && score >= 85 
    ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" 
    : score !== null && score >= 70 
    ? "text-amber-400 border-amber-500/20 bg-amber-500/5" 
    : "text-rose-400 border-rose-500/20 bg-rose-500/5";
  const scoreColorHex = score !== null && score >= 85 ? "#10b981" : score !== null && score >= 70 ? "#f59e0b" : "#ef4444";

  // 3. Technical & Behavioral Domain Breakdown from actual questions
  const techQuestions = evaluation.questionBreakdown?.filter((q, idx) => {
    const type = questions[idx]?.type || (q as any)?.type;
    return type === "technical" || type === "coding" || type === "system-design";
  }) || [];

  const behavQuestions = evaluation.questionBreakdown?.filter((q, idx) => {
    const type = questions[idx]?.type || (q as any)?.type;
    return type === "behavioral" || type === "situational" || type === "leadership";
  }) || [];

  const technicalAccuracy = techQuestions.length > 0
    ? Math.round(techQuestions.reduce((acc, q) => acc + (Number(q.score) || (score || 0)), 0) / techQuestions.length)
    : ((evaluation as any).technicalProficiency !== undefined ? Number((evaluation as any).technicalProficiency) : score);

  const starConsistency = behavQuestions.length > 0
    ? Math.round(behavQuestions.reduce((acc, q) => acc + (Number(q.score) || (score || 0)), 0) / behavQuestions.length)
    : ((evaluation as any).behavioralScore !== undefined ? Number((evaluation as any).behavioralScore) : score);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Return to home button */}
      <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-white/10 pb-5">
        <button
          onClick={onBackToDashboard}
          className="px-3.5 py-1.5 glass-pill hover:bg-slate-200/50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-[10.5px] font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Exit Feedback Workspace</span>
        </button>

        <span className="text-[10px] text-slate-500 font-mono">AI-Generated Practice Evaluation</span>
      </div>

      {/* Main Score & Summary Hero */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Gauge Card */}
        <div className="md:col-span-4 glass-panel p-6 rounded-2xl flex flex-col justify-between items-center text-center">
          <div className="w-full text-left">
            <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block">Practice Verdict</span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-sans mt-0.5">Session Performance Score</h3>
          </div>

          <div className="relative w-28 h-28 my-6 flex items-center justify-center select-none">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="56" cy="56" r="48" stroke="currentColor" className="text-slate-200 dark:text-white/10" strokeWidth="8" fill="transparent" />
              <circle cx="56" cy="56" r="48" stroke={scoreColorHex} strokeWidth="8" fill="transparent" strokeDasharray="301" strokeDashoffset={301 - (301 * score) / 100} strokeLinecap="round" />
            </svg>
            <div className="absolute text-center">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{score !== null ? `${score}%` : "N/A"}</span>
              <span className="text-[8px] text-slate-500 font-mono block mt-0.5">PROFICIENCY</span>
            </div>
          </div>

          <div className={`px-4 py-1.5 rounded-xl border text-xs font-bold font-mono tracking-wide ${ratingColor}`}>
            {ratingText}
          </div>

          {evaluation.decisionBadge && (
            <div className="mt-3 w-full text-center">
              <span className={`inline-block px-3 py-1 rounded-lg text-[9.5px] font-mono font-bold uppercase tracking-wider border ${
                evaluation.decisionBadge === "Strong evidence"
                  ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                  : evaluation.decisionBadge === "Moderate evidence"
                  ? "text-blue-400 border-blue-500/30 bg-blue-500/10"
                  : evaluation.decisionBadge === "Insufficient evidence"
                  ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                  : "text-rose-400 border-rose-500/30 bg-rose-500/10"
              }`}>
                {evaluation.decisionBadge}
              </span>
            </div>
          )}
        </div>

        {/* Narrative Summary card */}
        <div className="md:col-span-8 glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Board Commentary</span>
              <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-mono font-bold flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                Verified AI Feedback
              </span>
            </div>
            
            <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
              {evaluation.overallFeedback}
            </p>

            {evaluation.badgeRationale && (
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans pt-2 border-t border-slate-200/40 dark:border-white/5">
                <strong className="text-indigo-400 font-mono">Assessment Rationale:</strong> {evaluation.badgeRationale}
              </p>
            )}
          </div>

          {/* Calibrated skill indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-200/60 dark:border-white/10">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-500 dark:text-slate-400">Technical Domain Accuracy</span>
                <span className="text-slate-900 dark:text-white font-bold">{technicalAccuracy !== null ? `${technicalAccuracy}%` : "N/A"}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-[#6D5EF8]" style={{ width: `${technicalAccuracy || 0}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-500 dark:text-slate-400">STAR Structure Consistency</span>
                <span className="text-slate-900 dark:text-white font-bold">{starConsistency !== null ? `${starConsistency}%` : "N/A"}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-[#6D5EF8]" style={{ width: `${starConsistency || 0}%` }} />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 7-DIMENSIONAL COMPETENCY BREAKDOWN */}
      {evaluation.competencyScores && Object.keys(evaluation.competencyScores).length > 0 && (
        <div className="bg-[#111827] border border-[#27272A] p-6 rounded-[18px] space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#27272A]/60 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Target className="h-4.5 w-4.5 text-indigo-400" />
                <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                  7-Dimensional Evidence-Based Competency Assessment
                </h3>
              </div>
              <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                Objective scoring backed by candidate statements, STAR metrics, and algorithmic complexity.
              </p>
            </div>
            {evaluation.decisionBadge && (
              <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border self-start sm:self-auto ${
                evaluation.decisionBadge === "Strong evidence"
                  ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                  : evaluation.decisionBadge === "Moderate evidence"
                  ? "text-blue-400 border-blue-500/30 bg-blue-500/10"
                  : evaluation.decisionBadge === "Insufficient evidence"
                  ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                  : "text-rose-400 border-rose-500/30 bg-rose-500/10"
              }`}>
                {evaluation.decisionBadge}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(evaluation.competencyScores).map(([key, comp]: [string, any]) => {
              const statusColor = comp.status === "CONFIRMED"
                ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5"
                : comp.status === "MODERATE"
                ? "text-blue-400 border-blue-500/20 bg-blue-500/5"
                : "text-amber-400 border-amber-500/20 bg-amber-500/5";

              return (
                <div key={key} className="p-4 bg-slate-950/50 border border-[#27272A] rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="text-xs font-bold text-white">{comp.name || key}</h5>
                      <span className="text-[9px] font-mono text-slate-500">
                        Confidence: {Math.round((comp.confidence || 0) * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8.5px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${statusColor}`}>
                        {comp.status || "EVALUATED"}
                      </span>
                      <span className="text-xs font-mono font-bold text-indigo-400">
                        {comp.score}/100
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" 
                      style={{ width: `${Math.max(5, comp.score || 0)}%` }} 
                    />
                  </div>

                  {/* Evidence & Signals */}
                  {comp.evidence && (
                    <p className="text-[10.5px] text-slate-300 font-sans italic line-clamp-2">
                      "{comp.evidence}"
                    </p>
                  )}

                  {comp.positiveSignals && comp.positiveSignals.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {comp.positiveSignals.slice(0, 2).map((sig: string, sIdx: number) => (
                        <span key={sIdx} className="text-[8px] font-mono text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10">
                          + {sig}
                        </span>
                      ))}
                    </div>
                  )}

                  {comp.missingEvidence && comp.missingEvidence.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {comp.missingEvidence.slice(0, 2).map((gap: string, gIdx: number) => (
                        <span key={gIdx} className="text-[8px] font-mono text-amber-400 bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/10">
                          Missing: {gap}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      {/* PER-QUESTION RECRUITER ASSESSMENT BREAKDOWN */}
      {evaluation.questionBreakdown && evaluation.questionBreakdown.length > 0 && (
        <div className="bg-[#111827] border border-[#27272A] p-6 rounded-[18px] space-y-5 animate-fade-in">
          <div className="flex justify-between items-center border-b border-[#27272A]/60 pb-3">
            <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span>Per-Question Recruiter Assessment Scorecard</span>
            </h4>
            <span className="text-[10px] font-mono text-slate-400">
              Avg Score: <strong className="text-white">{score}%</strong>
            </span>
          </div>

          <div className="space-y-4">
            {evaluation.questionBreakdown.map((q, idx) => {
              const qScore = Math.max(0, Math.min(100, Math.round(Number(q.score) || 0)));
              const qBadgeColor = qScore >= 85 
                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
                : qScore >= 70 
                ? "text-amber-400 bg-amber-500/10 border-amber-500/20" 
                : "text-rose-400 bg-rose-500/10 border-rose-500/20";

              return (
                <div key={idx} className="p-4 bg-slate-950/60 border border-[#27272A] rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-mono font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h5 className="text-xs font-bold text-white line-clamp-1">{q.questionText}</h5>
                    </div>
                    <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-lg border shrink-0 ${qBadgeColor}`}>
                      {qScore}/100 Score
                    </span>
                  </div>

                  {/* Question Score progress line */}
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${qScore >= 85 ? "bg-emerald-500" : qScore >= 70 ? "bg-amber-500" : "bg-rose-500"}`} 
                      style={{ width: `${qScore}%` }} 
                    />
                  </div>

                  <div className="text-xs text-slate-300 leading-relaxed font-sans">
                    <span className="text-[10px] font-mono text-slate-400 block font-bold uppercase tracking-wider mb-1">Recruiter Evaluation</span>
                    <p>{q.critique || q.feedback || "Answer met baseline expectations."}</p>
                  </div>

                  {q.modelAnswer && (
                    <div className="p-3 bg-[#6D5EF8]/5 border border-[#6D5EF8]/10 rounded-lg text-xs text-indigo-200 leading-relaxed font-sans mt-2">
                      <span className="text-[9px] font-mono font-bold text-indigo-400 block uppercase tracking-wider mb-1">Principal Benchmark Response</span>
                      <p>{q.modelAnswer}</p>
                    </div>
                  )}
                </div>
              );
            })}
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
