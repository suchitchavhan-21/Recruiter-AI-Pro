import React from "react";
import { 
  Activity, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Pause, 
  Play, 
  LogOut, 
  Check, 
  Clock,
  Sparkles
} from "lucide-react";
import { Question } from "../../types";

interface BoardroomTopBarProps {
  companyName: string;
  roleName: string;
  currentQuestionIndex: number;
  questions: Question[];
  duration: number;
  isPaused: boolean;
  onTogglePause: () => void;
  onOpenAudioSettings: () => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onOpenExitModal: () => void;
  formatTime: (sec: number) => string;
}

export function BoardroomTopBar({
  companyName,
  roleName,
  currentQuestionIndex,
  questions,
  duration,
  isPaused,
  onTogglePause,
  onOpenAudioSettings,
  voiceEnabled,
  onToggleVoice,
  onOpenExitModal,
  formatTime
}: BoardroomTopBarProps) {
  return (
    <header 
      id="boardroom-top-bar"
      className="liquid-glass-dock px-5 py-3 rounded-2xl flex items-center justify-between gap-4 border border-white/15 shadow-2xl relative z-30"
    >
      {/* Left: Branding & Role Target */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-white/20">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white font-display tracking-tight">Recruiter AI Pro</span>
              <span className="text-[7.5px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded-full uppercase">
                Executive
              </span>
            </div>
            <p className="text-[9.5px] text-slate-400 font-mono truncate max-w-[180px] sm:max-w-[260px]">
              {companyName ? `${companyName} • ` : ""}{roleName || "Senior Software Engineer"}
            </p>
          </div>
        </div>
      </div>

      {/* Center: Live Studio Badge + Timer + Question Progression */}
      <div className="flex items-center gap-4">
        {/* Live Studio Status Badge */}
        <div className="flex items-center gap-2 liquid-glass-subtle px-3 py-1 rounded-full border border-white/10 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-live-pulse shadow-[0_0_8px_#f43f5e]" />
          <span className="text-[10px] font-bold text-white uppercase font-mono tracking-wider">
            {isPaused ? "PAUSED" : "● LIVE SIMULATION"}
          </span>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-300 font-bold">
            <Clock className="w-3 h-3 text-indigo-400" />
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Question Step Progress Pills (Desktop) */}
        <div className="hidden lg:flex items-center gap-1.5 liquid-glass-subtle px-3 py-1 rounded-full border border-white/10">
          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase mr-1">Progress:</span>
          {questions.map((_, idx) => {
            const isCompleted = currentQuestionIndex > idx;
            const isCurrent = currentQuestionIndex === idx;
            return (
              <div key={idx} className="flex items-center gap-1">
                <div 
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono font-bold transition-all duration-300 ${
                    isCompleted 
                      ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-400" 
                      : isCurrent 
                        ? "bg-indigo-600 border border-indigo-400 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)] scale-110" 
                        : "bg-white/5 border border-white/10 text-slate-500"
                  }`}
                  title={`Question ${idx + 1}`}
                >
                  {isCompleted ? <Check className="w-3 h-3" /> : idx + 1}
                </div>
                {idx < questions.length - 1 && (
                  <span className={`w-2 h-0.5 rounded-full ${isCompleted ? "bg-emerald-500/50" : "bg-white/10"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Actions, Audio Settings, Pause & Exit */}
      <div className="flex items-center gap-2">
        {/* Connection status */}
        <div className="hidden md:flex items-center gap-1.5 liquid-glass-subtle px-2.5 py-1 rounded-xl border border-white/10">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[9px] font-mono text-slate-300 font-semibold">1080p Secure</span>
        </div>

        {/* Audio Mute/Unmute */}
        <button
          id="btn-topbar-toggle-speech-synthesis"
          onClick={onToggleVoice}
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            voiceEnabled 
              ? "liquid-glass-subtle text-slate-300 hover:text-white border-white/10" 
              : "bg-rose-500/20 text-rose-300 border-rose-500/30"
          }`}
          title={voiceEnabled ? "Mute Recruiter Voice Synthesis" : "Unmute Recruiter Voice Synthesis"}
        >
          {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Audio Calibration Settings */}
        <button
          id="btn-topbar-audio-settings"
          onClick={onOpenAudioSettings}
          className="p-2 liquid-glass-subtle hover:bg-white/10 text-slate-300 hover:text-white rounded-xl border border-white/10 transition-all cursor-pointer"
          title="Voice Synthesis & Audio Adjusters"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Pause/Resume Simulation */}
        <button
          id="btn-topbar-pause-simulation"
          onClick={onTogglePause}
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            isPaused 
              ? "bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-md" 
              : "liquid-glass-subtle text-slate-300 hover:text-white border-white/10"
          }`}
          title={isPaused ? "Resume Simulation" : "Pause Simulation Timer"}
        >
          {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>

        {/* Exit / Leave Boardroom */}
        <button
          id="btn-topbar-leave-interview"
          onClick={onOpenExitModal}
          className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 border border-rose-500/30 rounded-xl text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          title="Leave or End Interview Simulation"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Leave Room</span>
        </button>
      </div>
    </header>
  );
}
