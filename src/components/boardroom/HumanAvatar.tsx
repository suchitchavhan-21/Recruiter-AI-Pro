import React, { useState, useEffect, useRef } from "react";
import { MicOff, Sparkles, User } from "lucide-react";

interface HumanAvatarProps {
  id: number;
  name: string;
  role: string;
  focus: string;
  isActive: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  accentColor: string;
  activeSpeakerIdx?: number;
  candidateIsSpeaking?: boolean;
  interviewerCount?: number;
}

interface PersonaConfig {
  avatarUrl: string;
  accentColor: string;
  ambientGlow: string;
  objectPosition: string;
  naturalTilt: number;
  expressionText: {
    speaking: string;
    thinking: string;
    listening: string;
    standby: string;
  };
}

export function HumanAvatar({ 
  id, 
  name, 
  role, 
  focus, 
  isActive, 
  isSpeaking, 
  isThinking, 
  accentColor,
  activeSpeakerIdx = 0,
  candidateIsSpeaking = false,
  interviewerCount = 1
}: HumanAvatarProps) {
  // Motion and presence state
  const [headNod, setHeadNod] = useState(0);
  const [hasImageError, setHasImageError] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const nodTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Respect prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, []);

  // Persona configurations tuned specifically for the authentic Sarah, David, and Marcus portraits
  const personaConfigs: Record<number, PersonaConfig> = {
    0: { // Sarah Jenkins — VP of People & Culture
      avatarUrl: "/assets/sarah.png",
      accentColor: "#818cf8",
      ambientGlow: "rgba(99, 102, 241, 0.15)",
      objectPosition: "50% 22%",
      naturalTilt: 0.4,
      expressionText: {
        speaking: "Presenting Behavioral Assessment",
        thinking: "Evaluating Behavioral Competencies",
        listening: "Active Listening",
        standby: "Standby"
      }
    },
    1: { // David Chen — Principal Systems Architect
      avatarUrl: "/assets/david.png",
      accentColor: "#60a5fa",
      ambientGlow: "rgba(59, 130, 246, 0.15)",
      objectPosition: "50% 20%",
      naturalTilt: -0.4,
      expressionText: {
        speaking: "Exploring Technical Architecture",
        thinking: "Evaluating Systems Scalability",
        listening: "Reviewing Technical Details",
        standby: "Standby"
      }
    },
    2: { // Marcus Brody — Head of Engineering
      avatarUrl: "/assets/marcus.png",
      accentColor: "#34d399",
      ambientGlow: "rgba(16, 185, 129, 0.15)",
      objectPosition: "50% 24%",
      naturalTilt: 0.3,
      expressionText: {
        speaking: "Assessing Strategic Leadership",
        thinking: "Measuring Delivery Velocity",
        listening: "Observing Executive Posture",
        standby: "Standby"
      }
    }
  };

  const persona = personaConfigs[id] || personaConfigs[0];

  // 1. CANDIDATE LISTENING MICRO-NODS (Attentive executive acknowledgment)
  useEffect(() => {
    if (!candidateIsSpeaking || reducedMotion) {
      setHeadNod(0);
      if (nodTimerRef.current) clearInterval(nodTimerRef.current);
      return;
    }

    // Occasional gentle nod (0.8px) every 4.5 seconds
    nodTimerRef.current = setInterval(() => {
      if (Math.random() < 0.6) {
        setHeadNod(0.8);
        setTimeout(() => setHeadNod(0), 400);
      }
    }, 4500);

    return () => {
      if (nodTimerRef.current) clearInterval(nodTimerRef.current);
    };
  }, [candidateIsSpeaking, reducedMotion]);

  // Turn angle for multi-interviewer stage
  const getPanelTurnAngle = () => {
    if (isActive || interviewerCount <= 1 || reducedMotion) return 0;
    if (id === 0) return 2.5; // Sarah turns slightly toward center
    if (id === 2) return -2.5; // Marcus turns slightly toward center
    if (id === 1) return activeSpeakerIdx === 0 ? -2.0 : 2.0; // David orients toward speaker
    return 0;
  };

  const panelTurnY = getPanelTurnAngle();
  
  // Head posture shifts
  let finalHeadTilt = persona.naturalTilt;
  if (isThinking) {
    finalHeadTilt = id === 0 ? -1.0 : 1.0;
  } else if (candidateIsSpeaking) {
    finalHeadTilt = persona.naturalTilt + 0.3;
  }

  const headTranslateY = isThinking ? 0.4 : headNod;
  const headTranslateX = panelTurnY * 0.15;

  // Live status badge information
  const getStatusBadge = () => {
    if (isActive && isSpeaking) {
      return {
        label: "Speaking",
        containerClass: "bg-indigo-950/85 border-indigo-500/50 text-indigo-200 shadow-lg shadow-indigo-500/20",
        icon: (
          <span className="flex items-end gap-0.5 h-2.5 mr-0.5">
            <span className="w-0.5 bg-indigo-400 rounded-full animate-bounce [animation-duration:0.6s] h-1.5" />
            <span className="w-0.5 bg-indigo-400 rounded-full animate-bounce [animation-duration:0.4s] h-2.5" />
            <span className="w-0.5 bg-indigo-400 rounded-full animate-bounce [animation-duration:0.5s] h-2" />
          </span>
        )
      };
    }
    if (isActive && isThinking) {
      return {
        label: "Evaluating",
        containerClass: "bg-amber-950/85 border-amber-500/50 text-amber-200 shadow-lg shadow-amber-500/20",
        icon: <Sparkles className="w-2.5 h-2.5 text-amber-400 animate-spin mr-0.5" />
      };
    }
    if (candidateIsSpeaking) {
      return {
        label: "Listening",
        containerClass: "bg-emerald-950/85 border-emerald-500/50 text-emerald-200 shadow-lg shadow-emerald-500/20",
        icon: <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-0.5" />
      };
    }
    return {
      label: "Standby",
      containerClass: "bg-slate-950/70 border-white/10 text-slate-400",
      icon: <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-0.5" />
    };
  };

  const statusBadge = getStatusBadge();

  return (
    <div 
      id={`avatar-container-${id}`}
      className={`relative h-full w-full rounded-2xl overflow-hidden bg-[#07090e] select-none transition-all duration-500 ease-out ${
        isActive 
          ? "border border-indigo-500/50 shadow-2xl shadow-indigo-500/20 ring-1 ring-indigo-500/30 scale-[1.005] z-10" 
          : "border border-white/10 opacity-90 hover:opacity-100 hover:border-white/20"
      }`}
    >
      {/* 1. LAYER 1: Deep Charcoal / Near-Black Executive Studio Backdrop */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-gradient-to-b from-[#090c14] via-[#07090e] to-[#04060a]">
        {/* Soft persona-tinted back-lighting for depth separation */}
        <div 
          className="absolute inset-0 opacity-25 filter blur-3xl scale-125 transition-opacity duration-1000"
          style={{ 
            background: `radial-gradient(circle at 50% 35%, ${persona.accentColor} 0%, transparent 65%)` 
          }}
        />
        
        {/* Subtle camera studio vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_50%,_rgba(4,6,10,0.75)_100%)] pointer-events-none" />
      </div>

      {/* 2. LAYER 2: Pure Photographic Portrait Stage (Hero Visual) */}
      <div className="relative w-full h-full flex items-center justify-center z-10 overflow-hidden">
        
        {/* Head Rig & Breathing Layer */}
        <div 
          className={`w-full h-full relative transition-transform duration-500 ease-out ${
            !reducedMotion ? "animate-avatar-breathe" : ""
          }`}
          style={{
            transform: `translate3d(${headTranslateX}px, ${headTranslateY}px, 0) rotate(${finalHeadTilt}deg) rotateY(${panelTurnY}deg)`,
          }}
        >
          {/* Base Executive Video Portrait Image */}
          {!hasImageError ? (
            <img 
              src={persona.avatarUrl}
              alt={name}
              referrerPolicy="no-referrer"
              onError={() => setHasImageError(true)}
              className="w-full h-full object-cover pointer-events-none select-none transition-all duration-700 ease-out"
              style={{ 
                objectPosition: persona.objectPosition,
                filter: isThinking 
                  ? "brightness(0.98) contrast(1.04) saturate(0.98)" 
                  : isActive && isSpeaking 
                    ? "brightness(1.03) contrast(1.02) saturate(1.02)" 
                    : isActive 
                      ? "brightness(1.01) contrast(1.01)" 
                      : "brightness(0.92) contrast(0.98)"
              }}
            />
          ) : (
            /* Graceful Production Fallback (Only in the rare case image fails to load) */
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-slate-900 to-slate-950">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center mb-3 shadow-xl border"
                style={{ 
                  backgroundColor: `${persona.accentColor}20`,
                  borderColor: `${persona.accentColor}40`
                }}
              >
                <User className="w-10 h-10" style={{ color: persona.accentColor }} />
              </div>
              <span className="text-sm font-semibold text-white">{name}</span>
              <span className="text-xs text-slate-400 mt-1">{role}</span>
            </div>
          )}
        </div>

        {/* Soft edge rim light when active */}
        {isActive && (
          <div 
            className="absolute inset-0 rounded-2xl pointer-events-none transition-all duration-500"
            style={{
              boxShadow: `inset 0 0 20px ${persona.ambientGlow}`
            }}
          />
        )}
      </div>

      {/* 3. LAYER 3: Clean Video Call UI & Metadata (Google Meet Style) */}
      
      {/* Top Left: Live Status Pill */}
      <div className="absolute top-3 inset-x-3 flex justify-between items-center z-20 pointer-events-none">
        <div className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider font-mono shadow-md border flex items-center gap-1.5 backdrop-blur-md transition-all duration-300 ${statusBadge.containerClass}`}>
          {statusBadge.icon}
          <span>{statusBadge.label}</span>
        </div>

        {/* Top Right: Studio Feed Quality Indicator */}
        <div className="text-[8px] font-mono font-medium text-slate-300 backdrop-blur-md bg-slate-950/60 px-2 py-0.8 rounded-full flex items-center gap-1.5 border border-white/10 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]" />
          <span>1080p Studio</span>
        </div>
      </div>

      {/* Bottom Floating Executive Nameplate */}
      <div className="absolute bottom-3 inset-x-3 z-20 flex justify-between items-end pointer-events-none">
        <div className="backdrop-blur-md bg-slate-950/80 px-3 py-2 rounded-xl flex items-center gap-2.5 max-w-[85%] border border-white/15 shadow-xl">
          {/* Status Mic Icon */}
          <div className={`flex items-center justify-center w-5 h-5 rounded-lg border shrink-0 transition-colors ${
            isActive && isSpeaking 
              ? "bg-indigo-600/30 border-indigo-400/40 text-indigo-300" 
              : "bg-black/40 border-white/10 text-slate-400"
          }`}>
            {isActive && isSpeaking ? (
              <span className="flex items-end gap-0.5 h-2.5">
                <span className="w-0.5 bg-indigo-400 rounded-full animate-bounce [animation-duration:0.6s] h-1.5" />
                <span className="w-0.5 bg-indigo-400 rounded-full animate-bounce [animation-duration:0.4s] h-2.5" />
                <span className="w-0.5 bg-indigo-400 rounded-full animate-bounce [animation-duration:0.5s] h-2" />
              </span>
            ) : (
              <MicOff className="w-2.5 h-2.5" />
            )}
          </div>
          
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-white leading-none truncate font-sans tracking-tight">
                {name}
              </span>
              <span 
                className="text-[7.5px] font-mono font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider shrink-0 border"
                style={{
                  backgroundColor: `${persona.accentColor}20`,
                  borderColor: `${persona.accentColor}40`,
                  color: persona.accentColor
                }}
              >
                {focus}
              </span>
            </div>
            <span className="text-[9px] text-slate-400 font-mono mt-0.5 leading-none truncate">
              {role}
            </span>
          </div>
        </div>

        {/* Contextual Status Sub-Label (Desktop only) */}
        <div className="hidden md:block max-w-[42%] text-right backdrop-blur-md bg-slate-950/60 border border-white/10 px-2.5 py-1 rounded-lg shadow-md">
          <span className="text-[8px] font-mono font-medium text-slate-300 leading-tight block truncate">
            {isSpeaking 
              ? persona.expressionText.speaking 
              : isThinking 
                ? persona.expressionText.thinking 
                : candidateIsSpeaking 
                  ? persona.expressionText.listening 
                  : persona.expressionText.standby}
          </span>
        </div>
      </div>

    </div>
  );
}
