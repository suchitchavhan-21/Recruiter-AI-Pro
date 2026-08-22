import React from "react";
import { 
  Mic, 
  MicOff, 
  Camera, 
  CameraOff, 
  MessageSquare, 
  Hand, 
  Monitor, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Cpu, 
  Award, 
  FileText, 
  Users, 
  PhoneOff,
  Sparkles,
  Layers
} from "lucide-react";
import { SidebarTab } from "./types";

interface BoardroomControlDockProps {
  micOn: boolean;
  onToggleMic: () => void;
  cameraOn: boolean;
  onToggleCamera: () => void;
  showCaptions: boolean;
  onToggleCaptions: () => void;
  handRaised: boolean;
  onToggleHandRaised: () => void;
  onOpenPresentation: () => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onOpenAudioSettings: () => void;
  activeSidebar: SidebarTab;
  onSelectSidebar: (tab: SidebarTab) => void;
  onOpenExitModal: () => void;
}

export function BoardroomControlDock({
  micOn,
  onToggleMic,
  cameraOn,
  onToggleCamera,
  showCaptions,
  onToggleCaptions,
  handRaised,
  onToggleHandRaised,
  onOpenPresentation,
  voiceEnabled,
  onToggleVoice,
  onOpenAudioSettings,
  activeSidebar,
  onSelectSidebar,
  onOpenExitModal
}: BoardroomControlDockProps) {
  return (
    <div 
      id="boardroom-control-dock"
      className="liquid-glass-dock px-4 py-2.5 rounded-full border border-white/20 shadow-2xl flex items-center justify-center gap-2 sm:gap-3 max-w-fit mx-auto transition-all duration-300 z-30"
    >
      {/* 1. Microphone Toggle */}
      <button
        id="dock-btn-mic"
        onClick={onToggleMic}
        className={`p-3 rounded-full transition-all cursor-pointer border flex items-center justify-center ${
          micOn 
            ? "liquid-glass-subtle hover:bg-white/10 text-white border-white/15 shadow-md" 
            : "bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30"
        }`}
        title={micOn ? "Mute Microphone" : "Unmute Microphone"}
      >
        {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
      </button>

      {/* 2. Camera Toggle */}
      <button
        id="dock-btn-camera"
        onClick={onToggleCamera}
        className={`p-3 rounded-full transition-all cursor-pointer border flex items-center justify-center ${
          cameraOn 
            ? "liquid-glass-subtle hover:bg-white/10 text-white border-white/15 shadow-md" 
            : "bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30"
        }`}
        title={cameraOn ? "Turn Camera Off" : "Turn Camera On"}
      >
        {cameraOn ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-white/15" />

      {/* 3. Closed Captions (CC) */}
      <button
        id="dock-btn-captions"
        onClick={onToggleCaptions}
        className={`p-3 rounded-full transition-all cursor-pointer border flex items-center justify-center ${
          showCaptions 
            ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30" 
            : "liquid-glass-subtle hover:bg-white/10 text-slate-300 border-white/15"
        }`}
        title={showCaptions ? "Disable Live Closed Captions" : "Enable Live Closed Captions"}
      >
        <span className="text-[9px] font-mono font-bold tracking-tighter">CC</span>
      </button>

      {/* 4. Raise Hand */}
      <button
        id="dock-btn-raise-hand"
        onClick={onToggleHandRaised}
        className={`p-3 rounded-full transition-all cursor-pointer border flex items-center justify-center ${
          handRaised 
            ? "bg-amber-500 text-white border-amber-300 animate-bounce shadow-lg shadow-amber-500/40" 
            : "liquid-glass-subtle hover:bg-white/10 text-slate-300 border-white/15"
        }`}
        title={handRaised ? "Lower Hand" : "Raise Hand to ask clarifying question"}
      >
        <Hand className="w-4 h-4" />
      </button>

      {/* 5. Screen Share / Presentation Modal */}
      <button
        id="dock-btn-presentation"
        onClick={onOpenPresentation}
        className="p-3 liquid-glass-subtle hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-200 rounded-full border border-indigo-500/30 transition-all cursor-pointer flex items-center justify-center shadow-md"
        title="Open Interactive System Architecture Diagram & Case Brief"
      >
        <Monitor className="w-4 h-4" />
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-white/15 hidden sm:block" />

      {/* 6. AI Coach Drawer Toggle */}
      <button
        id="dock-btn-ai-coach"
        onClick={() => onSelectSidebar(activeSidebar === "coach" ? null : "coach")}
        className={`p-3 rounded-full transition-all cursor-pointer border flex items-center justify-center ${
          activeSidebar === "coach" 
            ? "bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30" 
            : "liquid-glass-subtle hover:bg-white/10 text-slate-300 border-white/15"
        }`}
        title="Open Real-time AI Coach Diagnostics"
      >
        <Cpu className="w-4 h-4" />
      </button>

      {/* 7. Live Scorecard Toggle */}
      <button
        id="dock-btn-scorecard"
        onClick={() => onSelectSidebar(activeSidebar === "scorecard" ? null : "scorecard")}
        className={`p-3 rounded-full transition-all cursor-pointer border flex items-center justify-center ${
          activeSidebar === "scorecard" 
            ? "bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30" 
            : "liquid-glass-subtle hover:bg-white/10 text-slate-300 border-white/15"
        }`}
        title="Open Live Scorecard & Rubric Analysis"
      >
        <Award className="w-4 h-4" />
      </button>

      {/* 8. Private Scratchpad Toggle */}
      <button
        id="dock-btn-scratchpad"
        onClick={() => onSelectSidebar(activeSidebar === "notepad" ? null : "notepad")}
        className={`p-3 rounded-full transition-all cursor-pointer border flex items-center justify-center ${
          activeSidebar === "notepad" 
            ? "bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30" 
            : "liquid-glass-subtle hover:bg-white/10 text-slate-300 border-white/15"
        }`}
        title="Open Private Notes Scratchpad"
      >
        <FileText className="w-4 h-4" />
      </button>

      {/* 9. Board Members Bio Toggle */}
      <button
        id="dock-btn-board-members"
        onClick={() => onSelectSidebar(activeSidebar === "participants" ? null : "participants")}
        className={`p-3 rounded-full transition-all cursor-pointer border flex items-center justify-center ${
          activeSidebar === "participants" 
            ? "bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30" 
            : "liquid-glass-subtle hover:bg-white/10 text-slate-300 border-white/15"
        }`}
        title="Open Board Member Biographies & Priorities"
      >
        <Users className="w-4 h-4" />
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-white/15" />

      {/* 10. End Call / Exit Interview */}
      <button
        id="dock-btn-leave-call"
        onClick={onOpenExitModal}
        className="p-3 bg-rose-600 hover:bg-rose-500 text-white rounded-full border border-rose-400 shadow-lg shadow-rose-600/40 transition-all cursor-pointer flex items-center justify-center hover:scale-105"
        title="End Simulation & Leave Boardroom"
      >
        <PhoneOff className="w-4 h-4" />
      </button>
    </div>
  );
}
