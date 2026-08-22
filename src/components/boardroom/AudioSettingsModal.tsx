import React from "react";
import { X, Volume2, Sliders, Mic, Sparkles } from "lucide-react";

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  voicePitch: number;
  onVoicePitchChange: (val: number) => void;
  voiceRate: number;
  onVoiceRateChange: (val: number) => void;
  voiceVolume: number;
  onVoiceVolumeChange: (val: number) => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onTestVoice: () => void;
}

export function AudioSettingsModal({
  isOpen,
  onClose,
  voicePitch,
  onVoicePitchChange,
  voiceRate,
  onVoiceRateChange,
  voiceVolume,
  onVoiceVolumeChange,
  voiceEnabled,
  onToggleVoice,
  onTestVoice
}: AudioSettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      id="modal-boardroom-audio-settings"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="w-full max-w-md liquid-glass-strong rounded-3xl p-6 border border-white/20 shadow-2xl space-y-5 text-left">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-display">Audio & Voice Synthesis Calibration</h3>
              <p className="text-[10px] text-slate-400 font-mono">Real-time Recruiter TTS Parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 liquid-glass-subtle hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Master Voice Enable Switch */}
          <div className="flex items-center justify-between p-3 liquid-glass-medium rounded-xl border border-white/10">
            <div>
              <span className="text-xs font-bold text-white block">Recruiter Speech Synthesis</span>
              <span className="text-[9px] text-slate-400 font-mono">Enable Web Speech Audio for all 3 panelists</span>
            </div>
            <button
              onClick={onToggleVoice}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                voiceEnabled ? "bg-indigo-600 text-white" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
              }`}
            >
              {voiceEnabled ? "ENABLED" : "MUTED"}
            </button>
          </div>

          {/* Voice Pitch Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Voice Pitch</span>
              <span className="font-mono text-indigo-400 font-bold">{voicePitch.toFixed(1)}x</span>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="1.5" 
              step="0.1" 
              value={voicePitch} 
              onChange={(e) => onVoicePitchChange(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Speech Rate Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Speech Rate / Cadence</span>
              <span className="font-mono text-indigo-400 font-bold">{voiceRate.toFixed(1)}x</span>
            </div>
            <input 
              type="range" 
              min="0.7" 
              max="1.4" 
              step="0.05" 
              value={voiceRate} 
              onChange={(e) => onVoiceRateChange(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Volume Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Output Volume</span>
              <span className="font-mono text-indigo-400 font-bold">{Math.round(voiceVolume * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0.1" 
              max="1.0" 
              step="0.05" 
              value={voiceVolume} 
              onChange={(e) => onVoiceVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <button
            onClick={onTestVoice}
            className="px-3.5 py-2 liquid-glass-subtle hover:bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Test Audio Prompt</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md shadow-indigo-600/30"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
