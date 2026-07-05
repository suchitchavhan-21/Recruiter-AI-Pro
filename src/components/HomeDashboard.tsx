import React from "react";
import { 
  ArrowRight, 
  Sparkles, 
  Mic, 
  Briefcase, 
  Terminal,
  Activity,
  Cpu,
  BookmarkCheck,
  TrendingUp,
  Sliders
} from "lucide-react";
import { UserProfile, InterviewSession } from "../types";

interface HomeDashboardProps {
  currentUser?: UserProfile | null;
  sessionsHistory?: InterviewSession[];
  onStartInterview: () => void;
  onExploreCompanies?: () => void;
  onNavigateToStudy?: () => void;
}

export default function HomeDashboard({ 
  currentUser,
  sessionsHistory = [],
  onStartInterview,
  onExploreCompanies,
  onNavigateToStudy
}: HomeDashboardProps) {

  const targetCompanies = [
    { name: "Google", logo: "G" },
    { name: "Amazon", logo: "A" },
    { name: "Microsoft", logo: "M" },
    { name: "OpenAI", logo: "O" },
    { name: "Meta", logo: "∞" },
    { name: "Netflix", logo: "N" },
    { name: "Apple", logo: "" },
    { name: "Stripe", logo: "S" }
  ];

  return (
    <div className="relative min-h-[85vh] flex flex-col justify-between items-center py-10 px-4 md:px-8 overflow-hidden rounded-[24px] border border-slate-800/80 bg-gradient-to-b from-slate-950/40 via-[var(--bg-app,#09090B)] to-[var(--bg-app,#09090B)] animate-fade-in">
      {/* Subtle Animated Background Gradients resembling Google/Meta/OpenAI ambient spheres */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-4 left-1/4 w-[350px] h-[350px] bg-gradient-to-r from-blue-500/10 via-[#6D5EF8]/10 to-indigo-500/5 rounded-full blur-[130px] animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute top-20 right-1/4 w-[300px] h-[300px] bg-gradient-to-r from-pink-500/5 via-violet-500/5 to-emerald-500/5 rounded-full blur-[110px] animate-pulse" style={{ animationDuration: "12s" }} />
        <div className="absolute bottom-10 left-10 w-[200px] h-[200px] bg-emerald-500/5 rounded-full blur-[90px] animate-pulse" style={{ animationDuration: "14s" }} />
      </div>

      {/* Decorative Brand Top Badge */}
      <div className="relative z-10 flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3.5 py-1.5 rounded-full text-[10px] font-mono tracking-wider text-slate-300 shadow-sm backdrop-blur-md">
        <Sparkles className="h-3.5 w-3.5 text-[#6D5EF8] animate-pulse" />
        <span>RECRUITER AI ENGINE • HIGH-FIDELITY ACTIVE</span>
      </div>

      {/* Hero & Modern Tech Typography */}
      <div className="relative z-10 max-w-4xl text-center space-y-6 pt-12">
        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1] font-sans">
          Practice Real Interviews <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent drop-shadow-sm font-sans">
            engineered by Recruiter AI
          </span>
        </h1>
        
        <p className="text-slate-400 text-xs sm:text-sm md:text-base leading-relaxed max-w-2xl mx-auto font-medium">
          Deploying state-of-the-art AI coaching telemetry to prepare for highly technical interview pipelines at **Google, OpenAI, Microsoft, and Meta**.
        </p>

        {/* Big Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
          <button
            onClick={onStartInterview}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#6D5EF8] hover:bg-[#6D5EF8]/90 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-[#6D5EF8]/25 flex items-center justify-center gap-2.5 cursor-pointer border border-[#6D5EF8]/30 group active:scale-[0.98]"
            id="btn-start-simulation"
          >
            <Mic className="h-4 w-4" />
            <span>Launch Simulation</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button
            onClick={onExploreCompanies}
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
            id="btn-explore-companies"
          >
            <Briefcase className="h-4 w-4 text-slate-400" />
            <span>Explore Partner Portals</span>
          </button>
        </div>
      </div>

      {/* Bento Spotlight Widgets for "Tech Giant" feel */}
      <div className="relative z-10 w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-5xl">
        
        {/* Bento Card 1: Live Voice Telemetry */}
        <div className="bg-slate-950/60 backdrop-blur-md border border-slate-800/70 p-5 rounded-2xl flex flex-col justify-between hover:border-[#6D5EF8]/40 transition-all duration-300 group">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#6D5EF8] font-mono tracking-wider uppercase">Voice Telemetry</span>
              <Activity className="h-4 w-4 text-[#6D5EF8] animate-pulse" />
            </div>
            <h3 className="text-xs font-bold text-white">Advanced Voice Calibrator</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Analyzes speech pace (WPM), noise floor, and tone with millisecond precision to simulate real partner evaluation.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-900 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>Status: Ready</span>
            <span className="text-emerald-400">● Live Capture</span>
          </div>
        </div>

        {/* Bento Card 2: Custom JDs & Tracks */}
        <div className="bg-slate-950/60 backdrop-blur-md border border-slate-800/70 p-5 rounded-2xl flex flex-col justify-between hover:border-emerald-500/40 transition-all duration-300 group">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-400 font-mono tracking-wider uppercase">Flexible Tracks</span>
              <Cpu className="h-4 w-4 text-emerald-400" />
            </div>
            <h3 className="text-xs font-bold text-white">Targeted JD Evaluation</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Upload custom job descriptions or choose curated tech-giant pipelines to tailor the AI agent's questions.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-900 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>Curated Profiles</span>
            <span className="text-slate-300">Google L5/L6 • OpenAI L4</span>
          </div>
        </div>

        {/* Bento Card 3: Performance Insights */}
        <div className="bg-slate-950/60 backdrop-blur-md border border-slate-800/70 p-5 rounded-2xl flex flex-col justify-between hover:border-blue-500/40 transition-all duration-300 group">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-blue-400 font-mono tracking-wider uppercase">ATS Metrics</span>
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </div>
            <h3 className="text-xs font-bold text-white">Instant Scorecard Audit</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Provides visual score breakdown, strong / weak answer indicators, and missing industry keywords.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-900 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>Latest Avg. Score</span>
            <span className="text-blue-400">84% Match</span>
          </div>
        </div>

      </div>

      {/* Curated Company Logos Row with High-Tech styling */}
      <div className="relative z-10 w-full border-t border-slate-800/50 pt-8 mt-12">
        <p className="text-center text-[9px] font-mono tracking-wider text-slate-500 uppercase font-semibold mb-4">
          curated interview patterns optimized for elite pipelines
        </p>
        <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 opacity-50 grayscale hover:opacity-95 transition-opacity duration-300">
          {targetCompanies.map((company, index) => (
            <div key={index} className="flex items-center gap-1.5 text-slate-400 select-none">
              <span className="w-5 h-5 rounded bg-slate-850 flex items-center justify-center text-[10px] font-bold font-mono border border-slate-800 text-slate-200">
                {company.logo}
              </span>
              <span className="text-xs font-medium font-sans tracking-tight text-slate-300">{company.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
