import React from "react";
import { 
  LayoutDashboard, 
  Mic, 
  Briefcase, 
  BarChart3, 
  BookOpen, 
  User, 
  Sparkles,
  ChevronRight
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
    { id: "jobs", label: "Jobs", icon: Briefcase },
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "study", label: "Study Hub", icon: BookOpen },
    { id: "profile", label: "Profile", icon: User }
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-[#09090B] border-r border-[#27272A] text-slate-200 p-5 shrink-0 z-20">
      {/* Brand Logo */}
      <div className="flex items-center gap-2.5 mb-8 px-2 select-none">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6D5EF8] to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-[#6D5EF8]/20">
          <Sparkles className="h-4.5 w-4.5 animate-pulse" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight leading-none font-sans">Recruiter AI Pro</h2>
          <span className="text-[10px] text-slate-500 font-medium font-mono">Executive Coach Suite</span>
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                isActive
                  ? "bg-[#111827] text-[#6D5EF8] border border-[#27272A]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent"
              }`}
            >
              <Icon className={`h-4.5 w-4.5 transition-colors ${isActive ? "text-[#6D5EF8]" : "text-slate-400 group-hover:text-slate-200"}`} />
              <span className="flex-1 text-left">{item.label}</span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#6D5EF8]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Start Interview Action */}
      <div className="p-1 mb-4">
        <button
          onClick={() => setActiveTab("interview")}
          className="w-full py-2.5 px-4 bg-[#6D5EF8] hover:bg-[#6D5EF8]/90 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-[#6D5EF8]/15 flex items-center justify-center gap-2 cursor-pointer border border-[#6D5EF8]/20"
        >
          <Mic className="h-3.5 w-3.5" />
          <span>Practice Session</span>
        </button>
      </div>

      {/* User Quick Profile Info */}
      <div className="border-t border-[#27272A] pt-4 mt-auto">
        <div 
          onClick={onOpenProfile}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-900/50 cursor-pointer group transition-colors"
        >
          <div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-900 border border-[#27272A] flex items-center justify-center text-sm shadow shrink-0">
            {currentUser?.profilePhoto ? (
              <img src={currentUser.profilePhoto} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              currentUser?.avatarEmoji || "⚡"
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-white truncate font-sans">
              {activeTab === "home" ? "Profile Active" : (currentUser?.name || "Anonymous Candidate")}
            </h4>
            <p className="text-[10px] text-slate-500 truncate font-mono">
              {currentUser?.roleTitle || "Systems Architect"}
            </p>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
        </div>

        {/* Version display */}
        <div className="mt-2 flex justify-end px-2 text-[10px] font-mono text-slate-500">
          <span>v1.5</span>
        </div>
      </div>
    </aside>
  );
}
