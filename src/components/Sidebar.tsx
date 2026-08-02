import React from "react";
import { 
  LayoutDashboard, 
  Mic, 
  Briefcase, 
  BarChart3, 
  BookOpen, 
  User, 
  Sparkles,
  ChevronRight,
  FileText,
  Sliders
} from "lucide-react";
import { UserProfile } from "../types";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserProfile | null;
  onOpenProfile: () => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  currentUser, 
  onOpenProfile
}: SidebarProps) {
  const menuItems = [
    { id: "home", label: "Home", icon: LayoutDashboard },
    { id: "interview", label: "Interview", icon: Mic },
    { id: "resume", label: "Resume Scanner", icon: FileText },
    { id: "calibrate", label: "Voice Tuner", icon: Sliders },
    { id: "jobs", label: "Jobs", icon: Briefcase },
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "study", label: "Study Hub", icon: BookOpen },
    { id: "profile", label: "Profile", icon: User }
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-[#09090B]/70 backdrop-blur-xl border-r border-white/10 text-slate-200 p-5 shrink-0 z-20 shadow-[0_0_40px_0_rgba(0,0,0,0.5)]">
      {/* Brand Logo */}
      <div className="flex items-center gap-2.5 mb-8 px-2 select-none">
        <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-[#6D5EF8] via-indigo-500 to-purple-400 flex items-center justify-center text-white shadow-lg shadow-[#6D5EF8]/30 ring-1 ring-white/20">
          <Sparkles className="h-4.5 w-4.5 animate-pulse" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight leading-none font-sans">Recruiter AI Pro</h2>
          <span className="text-[10px] text-slate-400 font-medium font-mono">Executive Coach Suite</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer backdrop-blur-md ${
                isActive
                  ? "bg-white/10 text-white border border-white/20 shadow-[0_4px_16px_0_rgba(109,94,248,0.25)] font-bold"
                  : "text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent"
              }`}
            >
              <Icon className={`h-4.5 w-4.5 transition-colors ${isActive ? "text-[#818cf8]" : "text-slate-400 group-hover:text-slate-200"}`} />
              <span className="flex-1 text-left">{item.label}</span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#818cf8] shadow-[0_0_8px_#818cf8]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Start Interview Action */}
      <div className="p-1 mb-4">
        <button
          onClick={() => setActiveTab("interview")}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-[#6D5EF8]/90 to-indigo-600/90 hover:from-[#6D5EF8] hover:to-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-[0_8px_20px_0_rgba(109,94,248,0.35)] flex items-center justify-center gap-2 cursor-pointer border border-white/20 backdrop-blur-md active:scale-98"
        >
          <Mic className="h-3.5 w-3.5" />
          <span>Practice Session</span>
        </button>
      </div>

      {/* User Quick Profile Info */}
      <div className="border-t border-white/10 pt-4 mt-auto">
        <div 
          onClick={onOpenProfile}
          className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/15 cursor-pointer group transition-all backdrop-blur-md"
        >
          <div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-900 border border-white/15 flex items-center justify-center text-sm shadow shrink-0">
            {currentUser?.profilePhoto ? (
              <img src={currentUser.profilePhoto} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              currentUser?.avatarEmoji || "⚡"
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-white truncate font-sans">
              {activeTab === "home" ? "Profile Active" : (currentUser?.name || "Anonymous Candidate")}
            </h4>
            <p className="text-[10px] text-slate-400 truncate font-mono">
              {currentUser?.roleTitle || "Systems Architect"}
            </p>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
        </div>

        {/* Version display */}
        <div className="mt-2 flex justify-end px-2 text-[10px] font-mono text-slate-500">
          <span>v1.5</span>
        </div>
      </div>
    </aside>
  );
}
