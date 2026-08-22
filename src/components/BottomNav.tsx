import React from "react";
import { 
  LayoutDashboard, 
  Mic, 
  Briefcase, 
  BarChart3, 
  BookOpen, 
  User,
  FileText,
  Sliders
} from "lucide-react";
import { UserProfile } from "../types";

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser?: UserProfile | null;
}

export default function BottomNav({ activeTab, setActiveTab, currentUser }: BottomNavProps) {
  const menuItems = [
    { id: "home", label: "Home", icon: LayoutDashboard },
    { id: "interview", label: "Interview", icon: Mic },
    { id: "resume", label: "Resume", icon: FileText },
    { id: "calibrate", label: "Tuner", icon: Sliders },
    { id: "jobs", label: "Jobs", icon: Briefcase },
    { id: "dashboard", label: "Analytics", icon: BarChart3 },
    { id: "study", label: "Study", icon: BookOpen },
    { id: "profile", label: "Profile", icon: User }
  ];

  return (
    <nav className="md:hidden fixed bottom-3 left-3 right-3 h-16 glass-dock rounded-2xl flex items-center justify-around px-2 z-40 shadow-2xl">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className="flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-400 focus:outline-none cursor-pointer relative"
          >
            <div className={`p-1.5 rounded-xl transition-all ${isActive ? "text-[#818cf8] bg-white/10" : "text-slate-400"}`}>
              <Icon className="h-4.5 w-4.5" />
            </div>
            <span className={`text-[9px] font-sans transition-colors ${isActive ? "text-[#818cf8] font-bold" : "text-slate-400"}`}>
              {item.label}
            </span>
            {isActive && (
              <span className="absolute bottom-1 w-4 h-0.5 bg-[#818cf8] shadow-[0_0_8px_#818cf8] rounded-full" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
