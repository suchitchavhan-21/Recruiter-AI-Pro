import React from "react";
import { Bot, FileText, TrendingUp, Sparkles, ShieldCheck } from "lucide-react";

export function AuthBrandPanel() {
  return (
    <div className="w-full h-full glass-brand-panel p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden">
      
      {/* Top Section */}
      <div className="space-y-8 relative z-10">
        
        {/* Logo and App Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-white/20 shrink-0">
            <Bot className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <span className="block text-[13px] font-bold tracking-wider text-slate-100 uppercase">
              Recruiter AI
            </span>
            <span className="block text-[11px] font-semibold text-indigo-400 tracking-widest uppercase">
              Coach Pro
            </span>
          </div>
        </div>

        {/* Main Headline & Description */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-white tracking-tight leading-[1.2]">
            Prepare for your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300">
              Dream Job.
            </span>
          </h1>
          <p className="text-slate-300 text-[15px] leading-relaxed max-w-[420px]">
            AI-powered interviews, resume intelligence, and personalized preparation built to help you perform at your best.
          </p>
        </div>

        {/* Benefits List with Glass Cards */}
        <div className="space-y-3 pt-2">
          
          {/* Benefit 1 */}
          <div className="glass-benefit-card p-3.5 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-400/25 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5 shadow-xs">
              <Bot className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <h2 className="text-sm font-semibold text-slate-100">
                AI Interview Practice
              </h2>
              <p className="text-[13px] text-slate-400 leading-snug">
                Practice realistic technical, system design, and behavioral interviews.
              </p>
            </div>
          </div>

          {/* Benefit 2 */}
          <div className="glass-benefit-card p-3.5 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-400/25 flex items-center justify-center text-blue-400 shrink-0 mt-0.5 shadow-xs">
              <FileText className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <h2 className="text-sm font-semibold text-slate-100">
                Resume Intelligence
              </h2>
              <p className="text-[13px] text-slate-400 leading-snug">
                Analyze your resume against target roles to improve ATS match calibration.
              </p>
            </div>
          </div>

          {/* Benefit 3 */}
          <div className="glass-benefit-card p-3.5 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-400/25 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5 shadow-xs">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <h2 className="text-sm font-semibold text-slate-100">
                Personalized Growth
              </h2>
              <p className="text-[13px] text-slate-400 leading-snug">
                Pinpoint improvement areas and follow structured coaching suggestions.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Subtle Note */}
      <div className="pt-6 border-t border-white/10 mt-8 relative z-10">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
          <span>Built for serious interview preparation.</span>
        </div>
      </div>

    </div>
  );
}
