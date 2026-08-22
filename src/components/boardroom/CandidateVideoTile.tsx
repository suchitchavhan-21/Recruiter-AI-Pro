import React, { useState, useEffect, useRef } from "react";
import { Camera, CameraOff, Mic, MicOff, Maximize2, Minimize2, Radio } from "lucide-react";

interface CandidateVideoTileProps {
  cameraOn: boolean;
  onToggleCamera: () => void;
  micOn: boolean;
  onToggleMic: () => void;
  isListening: boolean;
  soundBars?: number[];
  candidateName?: string;
}

export function CandidateVideoTile({
  cameraOn,
  onToggleCamera,
  micOn,
  onToggleMic,
  isListening,
  soundBars = [20, 40, 60, 30, 70, 50, 40, 20],
  candidateName = "Candidate"
}: CandidateVideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [radialRings, setRadialRings] = useState<number[]>([10, 30, 50, 70]);
  const [isMinimized, setIsMinimized] = useState(false);

  // Webcam stream management
  useEffect(() => {
    if (cameraOn) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(s => {
          setStream(s);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(err => {
          console.warn("Camera permission denied or camera unavailable:", err);
          onToggleCamera();
        });
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraOn]);

  // Audio radar wave loop
  useEffect(() => {
    let intervalId: number;
    if (isListening) {
      intervalId = window.setInterval(() => {
        setRadialRings(prev => prev.map(r => {
          const next = r + 3;
          return next > 90 ? 10 : next;
        }));
      }, 60);
    } else {
      setRadialRings([20, 40, 60, 80]);
    }
    return () => clearInterval(intervalId);
  }, [isListening]);

  if (isMinimized) {
    return (
      <div 
        id="candidate-video-minimized"
        onClick={() => setIsMinimized(false)}
        className="liquid-glass-strong p-2.5 rounded-2xl flex items-center gap-2 cursor-pointer hover:border-indigo-500/50 transition-all border border-white/15 shadow-xl"
        title="Click to expand candidate video"
      >
        <div className={`w-3 h-3 rounded-full ${isListening ? "bg-rose-500 animate-ping" : "bg-indigo-400"}`} />
        <span className="text-[9px] font-mono font-bold text-slate-200">You (Candidate)</span>
        <Maximize2 className="w-3 h-3 text-slate-400 ml-1" />
      </div>
    );
  }

  return (
    <div 
      id="candidate-video-card"
      className="relative liquid-glass-strong border border-white/15 rounded-2xl overflow-hidden aspect-video w-full shadow-2xl transition-all duration-300"
    >
      {/* Absolute Header Overlay */}
      <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 pointer-events-none">
        <span className={`w-2 h-2 rounded-full ${cameraOn ? 'bg-rose-500 animate-ping' : isListening ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
        <span className="text-[8.5px] font-mono font-bold tracking-wider text-slate-200 liquid-glass-subtle px-2 py-0.5 rounded-full border border-white/10 shadow-sm">
          {cameraOn ? "CANDIDATE: LIVE FEED" : "CANDIDATE: DIAGNOSTIC"}
        </span>
      </div>

      {/* Minimize Button */}
      <div className="absolute top-2.5 right-2.5 z-20">
        <button
          id="btn-minimize-candidate-video"
          onClick={() => setIsMinimized(true)}
          className="p-1 liquid-glass-subtle hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer border border-white/10"
          title="Minimize Video Tile"
        >
          <Minimize2 className="w-3 h-3" />
        </button>
      </div>

      {cameraOn ? (
        /* Real Web Camera Stream */
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="absolute inset-0 w-full h-full object-cover scale-x-[-1] z-10"
        />
      ) : (
        /* Dynamic SVG Spectrogram Radar Fallback */
        <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-[#070913] text-slate-500 p-4">
          <svg viewBox="0 0 100 100" className="w-20 h-20 stroke-indigo-500/30 fill-none">
            {radialRings.map((radius, idx) => (
              <circle 
                key={idx} 
                cx="50" 
                cy="50" 
                r={radius} 
                strokeWidth={isListening ? "0.8" : "0.4"} 
                className="transition-all duration-75" 
                style={{ opacity: (100 - radius) / 100 }}
              />
            ))}
            <line x1="50" y1="5" x2="50" y2="95" strokeWidth="0.2" strokeDasharray="3 3" />
            <line x1="5" y1="50" x2="95" y2="50" strokeWidth="0.2" strokeDasharray="3 3" />
            <circle cx="50" cy="50" r="4" fill={isListening ? "#10B981" : "#4B5563"} className={isListening ? "animate-pulse" : ""} />
          </svg>
          
          <div className="flex items-center gap-1.5 mt-2">
            <Radio className={`w-3 h-3 ${isListening ? "text-emerald-400 animate-pulse" : "text-slate-500"}`} />
            <span className="text-[8.5px] font-mono text-slate-400 uppercase tracking-widest">
              {isListening ? "capturing verbal stream" : "audio detector standby"}
            </span>
          </div>

          {/* Sound bars preview */}
          {isListening && (
            <div className="flex items-end gap-0.5 h-3 mt-1.5">
              {soundBars.map((val, idx) => (
                <span 
                  key={idx} 
                  className="w-1 bg-emerald-400 rounded-full transition-all duration-75" 
                  style={{ height: `${Math.max(20, val)}%` }} 
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Control Overlay Buttons & Nameplate */}
      <div className="absolute bottom-2.5 inset-x-2.5 z-20 flex items-center justify-between pointer-events-auto">
        <div className="liquid-glass-subtle px-2 py-0.5 rounded-md border border-white/10">
          <span className="text-[8.5px] font-mono font-bold text-slate-200 truncate block max-w-[110px]">
            {candidateName}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id="btn-candidate-toggle-camera"
            onClick={onToggleCamera}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
              cameraOn 
                ? "bg-indigo-600/30 border-indigo-500/50 text-indigo-200" 
                : "liquid-glass-subtle border-white/10 text-slate-400 hover:text-white"
            }`}
            title={cameraOn ? "Disable Camera" : "Enable Web Camera"}
          >
            {cameraOn ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5" />}
          </button>
          
          <button
            id="btn-candidate-toggle-mic"
            onClick={onToggleMic}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
              micOn 
                ? "bg-emerald-600/30 border-emerald-500/50 text-emerald-200" 
                : "bg-rose-500/20 border-rose-500/30 text-rose-300"
            }`}
            title={micOn ? "Mute Microphone" : "Unmute Microphone"}
          >
            {micOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

    </div>
  );
}
