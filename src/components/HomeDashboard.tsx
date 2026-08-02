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
  Sliders,
  FileText
} from "lucide-react";
import { UserProfile, InterviewSession } from "../types";

interface HomeDashboardProps {
  currentUser?: UserProfile | null;
  sessionsHistory?: InterviewSession[];
  onStartInterview: () => void;
  onExploreCompanies?: () => void;
  onNavigateToStudy?: () => void;
  onNavigateToResume?: () => void;
  onNavigateToCalibrate?: () => void;
}

export default function HomeDashboard({ 
  currentUser,
  sessionsHistory = [],
  onStartInterview,
  onExploreCompanies,
  onNavigateToStudy,
  onNavigateToResume,
  onNavigateToCalibrate
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
    <div className="relative min-h-[85vh] flex flex-col justify-between items-center py-10 px-4 md:px-8 overflow-hidden rounded-[24px] border border-white/10 bg-[#09090B]/60 backdrop-blur-2xl shadow-[0_16px_40px_0_rgba(0,0,0,0.5)] animate-fade-in">
      {/* Subtle Animated Background Gradients resembling Google/Meta/OpenAI ambient spheres */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-4 left-1/4 w-[350px] h-[350px] bg-gradient-to-r from-blue-500/15 via-[#6D5EF8]/15 to-indigo-500/10 rounded-full blur-[130px] animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute top-20 right-1/4 w-[300px] h-[300px] bg-gradient-to-r from-pink-500/10 via-violet-500/10 to-emerald-500/10 rounded-full blur-[110px] animate-pulse" style={{ animationDuration: "12s" }} />
        <div className="absolute bottom-10 left-10 w-[200px] h-[200px] bg-emerald-500/10 rounded-full blur-[90px] animate-pulse" style={{ animationDuration: "14s" }} />
      </div>

      {/* Decorative Brand Top Badge */}
      <div className="relative z-10 flex items-center gap-2 glass-pill px-4 py-1.5 rounded-full text-[10px] font-mono tracking-wider text-slate-200 shadow-md">
        <Sparkles className="h-3.5 w-3.5 text-[#818cf8] animate-pulse" />
        <span>RECRUITER AI • YOUR SMART INTERVIEW PRACTICE PARTNER</span>
      </div>

      {/* Hero & Modern Tech Typography */}
      <div className="relative z-10 max-w-4xl text-center space-y-6 pt-12 animate-fade-in">
        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.15] font-sans">
          Prepare Like It's Real. <br />
          <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-emerald-300 bg-clip-text text-transparent drop-shadow-sm font-sans">
            Interview Like You Belong.
          </span>
        </h1>
        
        <p className="text-[#a5b4fc] font-bold text-sm sm:text-base tracking-wide font-mono uppercase">
          ✦ Powered by AI Human Recruiters ✦
        </p>
        
        <p className="text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed max-w-3xl mx-auto font-medium">
          Step into our immersive virtual boardrooms where specialized HR, Technical, and Hiring Manager agents evaluate you naturally through speech, adaptive contextual lines of reasoning, and highly responsive simulated digital human avatars.
        </p>

        {/* Big Action Buttons */}
        <div className="flex flex-wrap justify-center items-center gap-3.5 pt-4">
          <button
            onClick={onStartInterview}
            className="px-6 py-3 bg-gradient-to-r from-[#6D5EF8] to-indigo-600 hover:from-[#5b4be0] hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-[0_8px_25px_0_rgba(109,94,248,0.35)] flex items-center justify-center gap-2 cursor-pointer border border-white/20 backdrop-blur-md group active:scale-[0.98]"
            id="btn-start-simulation"
          >
            <Mic className="h-4 w-4" />
            <span>Practice Interview Simulator</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onNavigateToResume}
            className="px-6 py-3 glass-card hover:bg-white/10 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <FileText className="h-4 w-4 text-indigo-400" />
            <span>ATS Resume Scanner</span>
          </button>

          <button
            onClick={onNavigateToCalibrate}
            className="px-6 py-3 glass-card hover:bg-white/10 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Sliders className="h-4 w-4 text-emerald-400" />
            <span>Voice & Audio Tuner</span>
          </button>
          
          <button
            onClick={onExploreCompanies}
            className="px-6 py-3 glass-card hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
            id="btn-explore-companies"
          >
            <Briefcase className="h-4 w-4 text-slate-400" />
            <span>Explore Jobs</span>
          </button>
        </div>
      </div>

      {/* Bento Spotlight Widgets with Glassmorphism */}
      <div className="relative z-10 w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-5xl">
        
        {/* Bento Card 1: Live Voice Telemetry */}
        <div className="glass-card glass-card-hover p-5 rounded-2xl flex flex-col justify-between group">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#818cf8] font-mono tracking-wider uppercase">Speech Analysis</span>
              <Activity className="h-4 w-4 text-[#818cf8] animate-pulse" />
            </div>
            <h3 className="text-xs font-bold text-white">Speech & Flow Analysis</h3>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Tracks your speaking speed and pauses during practice to give you friendly feedback on filler words and conversational flow.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Status: Ready</span>
            <span className="text-emerald-400 font-semibold">● Voice Practice</span>
          </div>
        </div>

        {/* Bento Card 2: Custom JDs & Tracks */}
        <div className="glass-card glass-card-hover p-5 rounded-2xl flex flex-col justify-between group">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-400 font-mono tracking-wider uppercase">Targeted Prep</span>
              <Cpu className="h-4 w-4 text-emerald-400" />
            </div>
            <h3 className="text-xs font-bold text-white">Custom Job Focus</h3>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Upload any job description or choose one of our preset paths to customize your practice questions.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Curated Profiles</span>
            <span className="text-slate-200">Google L5/L6 • OpenAI L4</span>
          </div>
        </div>

        {/* Bento Card 3: Performance Insights */}
        <div className="glass-card glass-card-hover p-5 rounded-2xl flex flex-col justify-between group">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-sky-400 font-mono tracking-wider uppercase">Scorecards</span>
              <TrendingUp className="h-4 w-4 text-sky-400" />
            </div>
            <h3 className="text-xs font-bold text-white">Detailed Feedback</h3>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Shows clear score breakdowns, helpful tips on your answers, and suggestions for highlighting key skills.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Latest Avg. Score</span>
            <span className="text-sky-400 font-semibold">84% Match</span>
          </div>
        </div>

      </div>

      {/* Curated Company Logos Row with High-Tech styling */}
      <div className="relative z-10 w-full border-t border-slate-800/50 pt-8 mt-12">
        <p className="text-center text-[9px] font-mono tracking-wider text-slate-500 uppercase font-semibold mb-4">
          curated interview patterns for top-tier companies
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
