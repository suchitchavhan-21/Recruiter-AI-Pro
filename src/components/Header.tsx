import React from "react";
import { Briefcase, Radio, Award } from "lucide-react";
import { Phase } from "../types";

interface HeaderProps {
  phase: Phase;
}

export default function Header({ phase }: HeaderProps) {
  const getStepText = () => {
    switch (phase) {
      case "PHASE1_INPUT":
        return "Step 1: Role Configuration";
      case "PHASE1_SUMMARY":
        return "Step 2: Industry Research";
      case "PHASE2_INTERVIEW":
        return "Step 3: Live Session";
      case "PHASE3_FEEDBACK":
        return "Step 4: Performance Review";
      case "PHASE4_COACHING":
        return "Step 5: Coaching & Mastery";
      default:
        return "";
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#09090B]/70 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        {/* Brand Logo and Title */}
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6D5EF8] to-indigo-500 text-white shadow-lg shadow-[#6D5EF8]/20 ring-1 ring-white/20">
            <Briefcase className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="font-display text-base font-bold tracking-tight text-white">
              Recruiter AI Pro
            </h1>
            <p className="font-mono text-[9.5px] text-slate-400 uppercase tracking-widest">
              Executive Interview Coach
            </p>
          </div>
        </div>

        {/* Live Step Badge & Signal */}
        <div className="flex items-center space-x-3">
          {getStepText() && (
            <span className="hidden rounded-full bg-white/5 border border-white/10 px-3 py-1 font-mono text-[11px] font-semibold text-slate-300 backdrop-blur-md sm:inline-block">
              {getStepText()}
            </span>
          )}
          
          <div className="flex items-center space-x-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 backdrop-blur-md px-3 py-1 text-emerald-400">
            <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-wider">
              Agent Connected
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
