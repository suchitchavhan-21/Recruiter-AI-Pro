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
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        {/* Brand Logo and Title */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold tracking-tight text-slate-900">
              Recruiter AI
            </h1>
            <p className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">
              Interview Coach
            </p>
          </div>
        </div>

        {/* Live Step Badge & Signal */}
        <div className="flex items-center space-x-4">
          {getStepText() && (
            <span className="hidden rounded-full bg-slate-100 px-3 py-1 font-mono text-[11px] font-semibold text-slate-600 sm:inline-block">
              {getStepText()}
            </span>
          )}
          
          <div className="flex items-center space-x-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-emerald-700">
            <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-600" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider">
              Agent Connected
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
