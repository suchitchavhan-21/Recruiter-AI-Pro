import React from "react";
import { AlertTriangle, LogOut, X, Check, Award, ArrowRight } from "lucide-react";

interface ExitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExit: () => void;
  onFinishEarly?: () => void;
  questionsAnswered: number;
  totalQuestions: number;
}

export function ExitConfirmModal({
  isOpen,
  onClose,
  onConfirmExit,
  onFinishEarly,
  questionsAnswered,
  totalQuestions
}: ExitConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      id="modal-boardroom-exit-confirm"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md liquid-glass-strong rounded-3xl p-6 border border-white/20 shadow-2xl space-y-5 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">Leave Live Boardroom?</h3>
              <p className="text-xs text-slate-400 font-mono">
                Progress: {questionsAnswered} of {totalQuestions} questions completed
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          You are currently in an active interview simulation. Choose whether you would like to conclude now and generate an evaluation report for the questions answered so far, or discard the session and return to the dashboard.
        </p>

        <div className="space-y-2 pt-2">
          {onFinishEarly && questionsAnswered > 0 && (
            <button
              type="button"
              id="btn-exit-finish-early"
              onClick={onFinishEarly}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition-all shadow-lg shadow-indigo-600/30 border border-indigo-400/50 group"
            >
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-200" />
                <span>Finish Early & View Evaluation</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
            <button
              type="button"
              id="btn-exit-cancel"
              onClick={onClose}
              className="px-4 py-2 liquid-glass-subtle hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-all border border-white/10"
            >
              Stay in Session
            </button>
            <button
              type="button"
              id="btn-exit-confirm-leave"
              onClick={onConfirmExit}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-lg shadow-rose-600/30 border border-rose-400/50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Discard & Exit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

