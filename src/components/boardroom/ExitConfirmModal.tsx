import React from "react";
import { AlertTriangle, LogOut, X, Check } from "lucide-react";

interface ExitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExit: () => void;
  questionsAnswered: number;
  totalQuestions: number;
}

export function ExitConfirmModal({
  isOpen,
  onClose,
  onConfirmExit,
  questionsAnswered,
  totalQuestions
}: ExitConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      id="modal-boardroom-exit-confirm"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="w-full max-w-md liquid-glass-strong rounded-3xl p-6 border border-white/20 shadow-2xl space-y-5 text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-display">Leave Live Boardroom?</h3>
            <p className="text-xs text-slate-400 font-mono">
              Progress: {questionsAnswered} of {totalQuestions} questions answered
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          Leaving now will terminate your live executive interview session. You can review an early evaluation report based on the answers provided so far, or return to the boardroom.
        </p>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 liquid-glass-subtle hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-all border border-white/10"
          >
            Return to Interview
          </button>
          <button
            type="button"
            onClick={onConfirmExit}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-lg shadow-rose-600/30 border border-rose-400/50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Confirm & Exit</span>
          </button>
        </div>
      </div>
    </div>
  );
}
