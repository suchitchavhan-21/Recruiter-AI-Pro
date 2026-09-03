import React, { useState, useEffect, useRef } from "react";
import { MicOff, Sparkles } from "lucide-react";
import { FacialExpression } from "./types";

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
  skinTone: string;
  eyelidColorTop: string;
  eyelidColorBot: string;
  lipColor: string;
  leftEye: { x: number; y: number; w: number; h: number };
  rightEye: { x: number; y: number; w: number; h: number };
  mouth: { x: number; y: number; w: number; h: number };
  naturalTilt: number;
  turnOffset: number;
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
  // Micro-motion and expression state
  const [isBlinking, setIsBlinking] = useState(false);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const [mouthOpening, setMouthOpening] = useState(0); // 0 (closed) to 1 (max open)
  const [expression, setExpression] = useState<FacialExpression>('neutral');
  const [headNod, setHeadNod] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const speechTimerRef = useRef<NodeJS.Timeout | null>(null);
  const blinkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gazeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const nodTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check user preference for reduced motion
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, []);

  // Persona configurations with tuned coordinates for Sarah, David, Marcus
  const personaConfigs: Record<number, PersonaConfig> = {
    0: { // Sarah Jenkins — VP of People & Culture
      avatarUrl: "/assets/sarah.png",
      accentColor: "#818cf8",
      ambientGlow: "rgba(99, 102, 241, 0.12)",
      skinTone: "#ffd8c2",
      eyelidColorTop: "#eec0aa",
      eyelidColorBot: "#dfad96",
      lipColor: "#c96f6f",
      leftEye: { x: 42.5, y: 41.2, w: 8.6, h: 4.4 },
      rightEye: { x: 57.0, y: 41.2, w: 8.6, h: 4.4 },
      mouth: { x: 49.5, y: 61.5, w: 17.5, h: 7.5 },
      naturalTilt: 0.5,
      turnOffset: 3.5,
      expressionText: {
        speaking: "Presenting Behavioral Prompt",
        thinking: "Formulating Behavioral Evaluation",
        listening: "Active Listening",
        standby: "Standby"
      }
    },
    1: { // David Chen — Principal Systems Architect
      avatarUrl: "/assets/david.png",
      accentColor: "#60a5fa",
      ambientGlow: "rgba(59, 130, 246, 0.12)",
      skinTone: "#cc9c80",
      eyelidColorTop: "#b8876e",
      eyelidColorBot: "#a6765d",
      lipColor: "#a85e53",
      leftEye: { x: 44.2, y: 41.6, w: 7.8, h: 4.0 },
      rightEye: { x: 57.2, y: 41.6, w: 7.8, h: 4.0 },
      mouth: { x: 50.8, y: 62.2, w: 16.5, h: 7.2 },
      naturalTilt: -0.5,
      turnOffset: -3.0,
      expressionText: {
        speaking: "Exploring Technical Architecture",
        thinking: "Analyzing Engineering Patterns",
        listening: "Reviewing Technical Details",
        standby: "Standby"
      }
    },
    2: { // Marcus Brody — Head of Engineering
      avatarUrl: "/assets/marcus.png",
      accentColor: "#34d399",
      ambientGlow: "rgba(16, 185, 129, 0.12)",
      skinTone: "#d9a184",
      eyelidColorTop: "#c48e73",
      eyelidColorBot: "#b37b60",
      lipColor: "#ab6159",
      leftEye: { x: 42.8, y: 41.0, w: 8.2, h: 4.2 },
      rightEye: { x: 55.8, y: 41.0, w: 8.2, h: 4.2 },
      mouth: { x: 49.0, y: 60.8, w: 17.0, h: 7.5 },
      naturalTilt: 0.3,
      turnOffset: -4.0,
      expressionText: {
        speaking: "Evaluating Strategic Leadership",
        thinking: "Measuring Delivery Velocity",
        listening: "Observing Executive Posture",
        standby: "Standby"
      }
    }
  };

  const persona = personaConfigs[id] || personaConfigs[0];

  // 1. RESTRAINED PHONETIC SPEECH MODULATION
  // Generates human-like speech cadence: alternating syllable widths, natural pauses, and return to rest
  useEffect(() => {
    if (!isSpeaking || reducedMotion) {
      setMouthOpening(0);
      if (speechTimerRef.current) clearInterval(speechTimerRef.current);
      return;
    }

    // Syllable rhythm cycle (simulating vowels, consonants, word breaks)
    const syllableCadence = [0.25, 0.65, 0.35, 0.8, 0.45, 0.1, 0.7, 0.3, 0.05, 0.55, 0.9, 0.4, 0.15, 0.0];
    let step = 0;

    speechTimerRef.current = setInterval(() => {
      const baseOpen = syllableCadence[step % syllableCadence.length];
      // Add subtle organic variation
      const jitter = (Math.random() - 0.5) * 0.15;
      const finalOpen = Math.max(0, Math.min(1, baseOpen + jitter));
      setMouthOpening(finalOpen);
      step++;
    }, 110);

    return () => {
      if (speechTimerRef.current) clearInterval(speechTimerRef.current);
    };
  }, [isSpeaking, reducedMotion]);

  // 2. IRREGULAR, NATURAL BLINK SYSTEM
  // Organic non-linear intervals (3.5s to 6.5s) with independent seed and occasional double blink
  useEffect(() => {
    if (reducedMotion) return;

    let isMounted = true;

    const scheduleNextBlink = () => {
      const nextInterval = 3200 + Math.random() * 3200 + (id * 400); // de-synchronize panel
      blinkTimerRef.current = setTimeout(() => {
        if (!isMounted) return;

        // Perform natural single blink
        setIsBlinking(true);
        setTimeout(() => {
          if (!isMounted) return;
          setIsBlinking(false);

          // 7% probability of immediate natural double-blink
          if (Math.random() < 0.07) {
            setTimeout(() => {
              if (!isMounted) return;
              setIsBlinking(true);
              setTimeout(() => {
                if (isMounted) setIsBlinking(false);
              }, 90);
            }, 120);
          }

          scheduleNextBlink();
        }, 110);
      }, nextInterval);
    };

    scheduleNextBlink();

    return () => {
      isMounted = false;
      if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current);
    };
  }, [id, reducedMotion]);

  // 3. CONTROLLED MICRO-SACCADES & GAZE DIRECTION
  useEffect(() => {
    if (reducedMotion) {
      setGaze({ x: 0, y: 0 });
      return;
    }

    const gazeInterval = setInterval(() => {
      if (isActive && isSpeaking) {
        // Direct, focused contact with candidate / camera with micro-saccades (<0.3px)
        setGaze({
          x: (Math.random() - 0.5) * 0.3,
          y: (Math.random() - 0.5) * 0.2
        });
      } else if (isThinking) {
        // Subtle downward contemplation glance
        setGaze({
          x: (Math.random() - 0.5) * 0.4,
          y: 0.6 + Math.random() * 0.3
        });
      } else if (candidateIsSpeaking) {
        // Attentive direct gaze toward candidate
        setGaze({
          x: (Math.random() - 0.5) * 0.25,
          y: (Math.random() - 0.5) * 0.2
        });
      } else if (interviewerCount > 1 && activeSpeakerIdx !== id) {
        // Inactive panelist naturally orients gaze slightly toward active speaker
        const turnRight = id === 0 || (id === 1 && activeSpeakerIdx === 2);
        setGaze({
          x: turnRight ? 0.8 : -0.8,
          y: -0.1
        });
      } else {
        // Relaxed standby gaze
        setGaze({
          x: (Math.random() - 0.5) * 0.4,
          y: (Math.random() - 0.5) * 0.3
        });
      }
    }, 3200);

    return () => clearInterval(gazeInterval);
  }, [isActive, isSpeaking, isThinking, candidateIsSpeaking, activeSpeakerIdx, id, interviewerCount, reducedMotion]);

  // 4. CANDIDATE LISTENING MICRO-NODS
  useEffect(() => {
    if (!candidateIsSpeaking || reducedMotion) {
      setHeadNod(0);
      if (nodTimerRef.current) clearInterval(nodTimerRef.current);
      return;
    }

    // Occasional gentle professional nod (0.8px - 1.2px) every 4-5 seconds
    nodTimerRef.current = setInterval(() => {
      if (Math.random() < 0.65) {
        setHeadNod(1.2);
        setTimeout(() => setHeadNod(0), 450);
      }
    }, 4200);

    return () => {
      if (nodTimerRef.current) clearInterval(nodTimerRef.current);
    };
  }, [candidateIsSpeaking, reducedMotion]);

  // 5. EXPRESSION STATE HARMONIZATION
  useEffect(() => {
    if (isThinking) {
      setExpression('thinking');
    } else if (isSpeaking) {
      setExpression('serious');
    } else if (candidateIsSpeaking) {
      setExpression('agreeing');
    } else {
      setExpression('neutral');
    }
  }, [isThinking, isSpeaking, candidateIsSpeaking]);

  // Turn angle calculation for multi-interviewer stage
  const getPanelTurnAngle = () => {
    if (isActive || interviewerCount <= 1 || reducedMotion) return 0;
    if (id === 0) return 3.2; // Sarah turns slightly toward center
    if (id === 2) return -3.2; // Marcus turns slightly toward center
    if (id === 1) return activeSpeakerIdx === 0 ? -2.5 : 2.5; // David orients toward speaker
    return 0;
  };

  const panelTurnY = getPanelTurnAngle();
  
  // Head posture shifts
  let finalHeadTilt = persona.naturalTilt;
  if (isThinking) {
    finalHeadTilt = id === 0 ? -1.4 : 1.2;
  } else if (candidateIsSpeaking) {
    finalHeadTilt = persona.naturalTilt + 0.4;
  } else if (isActive && isSpeaking) {
    finalHeadTilt = persona.naturalTilt + (Math.sin(mouthOpening * Math.PI) * 0.4);
  }

  const headTranslateY = headNod;
  const headTranslateX = panelTurnY * 0.2;

  // Live status badge information
  const getStatusBadge = () => {
    if (isActive && isSpeaking) {
      return {
        label: "Speaking",
        dotClass: "bg-indigo-400",
        containerClass: "bg-indigo-950/80 border-indigo-500/40 text-indigo-200 shadow-indigo-500/10",
        icon: (
          <span className="flex items-end gap-0.5 h-2.5 mr-0.5">
            <span className="w-0.5 bg-indigo-400 rounded-full animate-bounce [animation-duration:0.6s] h-2" />
            <span className="w-0.5 bg-indigo-400 rounded-full animate-bounce [animation-duration:0.4s] h-2.5" />
            <span className="w-0.5 bg-indigo-400 rounded-full animate-bounce [animation-duration:0.5s] h-1.5" />
          </span>
        )
      };
    }
    if (isActive && isThinking) {
      return {
        label: "Evaluating",
        dotClass: "bg-amber-400 animate-pulse",
        containerClass: "bg-amber-950/80 border-amber-500/40 text-amber-200 shadow-amber-500/10",
        icon: <Sparkles className="w-2.5 h-2.5 text-amber-400 animate-spin mr-0.5" />
      };
    }
    if (candidateIsSpeaking) {
      return {
        label: "Listening",
        dotClass: "bg-emerald-400 animate-pulse",
        containerClass: "bg-emerald-950/80 border-emerald-500/40 text-emerald-200 shadow-emerald-500/10",
        icon: <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-0.5" />
      };
    }
    return {
      label: "Standby",
      dotClass: "bg-slate-500",
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
          ? "border border-indigo-500/50 shadow-2xl shadow-indigo-500/15 ring-1 ring-indigo-500/30 scale-[1.005] z-10" 
          : "border border-white/10 opacity-90 hover:opacity-100 hover:border-white/20"
      }`}
    >
      {/* 1. LAYER 1: Deep Near-Black Executive Studio Backdrop */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-gradient-to-b from-[#0a0d16] via-[#07090e] to-[#04060a]">
        {/* Soft persona-tinted back-lighting */}
        <div 
          className="absolute inset-0 opacity-20 filter blur-3xl scale-125 transition-opacity duration-1000"
          style={{ 
            background: `radial-gradient(circle at 50% 30%, ${persona.accentColor} 0%, transparent 70%)` 
          }}
        />
        
        {/* Subtle camera studio vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_45%,_rgba(4,6,10,0.8)_100%)] pointer-events-none" />
      </div>

      {/* 2. LAYER 2 & 3: High-Fidelity Portrait Stage (Hero Visual) */}
      <div className="relative w-full h-full flex items-center justify-center z-10 overflow-hidden">
        
        {/* Head Rig & Breathing Layer */}
        <div 
          className={`w-full h-full relative transition-transform duration-300 ease-out ${
            !reducedMotion ? "animate-avatar-breathe" : ""
          }`}
          style={{
            transform: `translate3d(${headTranslateX}px, ${headTranslateY}px, 0) rotate(${finalHeadTilt}deg) rotateY(${panelTurnY}deg)`,
          }}
        >
          {/* Base Executive Video Portrait Image */}
          <img 
            src={persona.avatarUrl}
            alt={name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-[50%_28%] pointer-events-none select-none transition-all duration-500"
            style={{ 
              filter: isThinking 
                ? "brightness(0.97) contrast(1.03) saturate(0.98)" 
                : isActive && isSpeaking 
                  ? "brightness(1.02) contrast(1.02)" 
                  : "brightness(1.0) contrast(1.0)"
            }}
          />

          {/* 3. LAYER 4: Natural Eye System (Corneal Catchlight & Micro-Saccades) */}
          {/* Note: The original high-res eyes remain fully visible. We add realistic ocular sheen and saccade catchlight */}
          {!isBlinking && (
            <>
              {/* Left Eye Specular Reflection */}
              <div 
                className="absolute pointer-events-none transition-transform duration-300 ease-out"
                style={{
                  left: `${persona.leftEye.x - persona.leftEye.w / 2}%`,
                  top: `${persona.leftEye.y - persona.leftEye.h / 2}%`,
                  width: `${persona.leftEye.w}%`,
                  height: `${persona.leftEye.h}%`,
                  transform: `translate3d(${gaze.x}px, ${gaze.y}px, 0)`
                }}
              >
                {/* Micro corneal specular catchlight */}
                <div 
                  className="w-full h-full rounded-full opacity-60 mix-blend-screen"
                  style={{
                    background: "radial-gradient(circle at 45% 38%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.15) 30%, transparent 65%)"
                  }}
                />
              </div>

              {/* Right Eye Specular Reflection */}
              <div 
                className="absolute pointer-events-none transition-transform duration-300 ease-out"
                style={{
                  left: `${persona.rightEye.x - persona.rightEye.w / 2}%`,
                  top: `${persona.rightEye.y - persona.rightEye.h / 2}%`,
                  width: `${persona.rightEye.w}%`,
                  height: `${persona.rightEye.h}%`,
                  transform: `translate3d(${gaze.x}px, ${gaze.y}px, 0)`
                }}
              >
                {/* Micro corneal specular catchlight */}
                <div 
                  className="w-full h-full rounded-full opacity-60 mix-blend-screen"
                  style={{
                    background: "radial-gradient(circle at 45% 38%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.15) 30%, transparent 65%)"
                  }}
                />
              </div>
            </>
          )}

          {/* 4. Natural Blinking Eyelid Shutter */}
          {/* Organic skin-toned feathered curve that sweeps down smoothly */}
          <div 
            className="absolute pointer-events-none transition-transform duration-100 ease-in-out origin-top rounded-full"
            style={{
              left: `${persona.leftEye.x - persona.leftEye.w / 2 - 0.5}%`,
              top: `${persona.leftEye.y - persona.leftEye.h / 2 - 0.5}%`,
              width: `${persona.leftEye.w + 1.0}%`,
              height: `${persona.leftEye.h + 1.5}%`,
              transform: `scaleY(${isBlinking ? 1 : 0})`,
              background: `linear-gradient(180deg, ${persona.eyelidColorTop} 0%, ${persona.eyelidColorBot} 100%)`,
              boxShadow: isBlinking ? "0 1px 2px rgba(0,0,0,0.3)" : "none",
              filter: "blur(0.35px)",
              opacity: 0.98
            }}
          />
          <div 
            className="absolute pointer-events-none transition-transform duration-100 ease-in-out origin-top rounded-full"
            style={{
              left: `${persona.rightEye.x - persona.rightEye.w / 2 - 0.5}%`,
              top: `${persona.rightEye.y - persona.rightEye.h / 2 - 0.5}%`,
              width: `${persona.rightEye.w + 1.0}%`,
              height: `${persona.rightEye.h + 1.5}%`,
              transform: `scaleY(${isBlinking ? 1 : 0})`,
              background: `linear-gradient(180deg, ${persona.eyelidColorTop} 0%, ${persona.eyelidColorBot} 100%)`,
              boxShadow: isBlinking ? "0 1px 2px rgba(0,0,0,0.3)" : "none",
              filter: "blur(0.35px)",
              opacity: 0.98
            }}
          />

          {/* 5. Restrained Phonetic Speech Mouth Aperture */}
          {/* Active only during speech; resting mouth is 100% genuine photo */}
          {isSpeaking && mouthOpening > 0.05 && (
            <div 
              className="absolute pointer-events-none flex items-center justify-center transition-opacity duration-100"
              style={{
                left: `${persona.mouth.x - persona.mouth.w / 2}%`,
                top: `${persona.mouth.y - persona.mouth.h / 2}%`,
                width: `${persona.mouth.w}%`,
                height: `${persona.mouth.h}%`,
              }}
            >
              <svg 
                viewBox="0 0 100 50" 
                className="w-full h-full overflow-visible"
                style={{ filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.35))" }}
              >
                <defs>
                  {/* Soft feathered oral cavity blur */}
                  <filter id={`feather-mouth-${id}`} x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="0.4" />
                  </filter>
                </defs>

                {/* Inner Oral Depth & Cavity Aperture */}
                <path 
                  d={`M 14,25 Q 50,${25 - mouthOpening * 1.5} 86,25 Q 50,${25 + mouthOpening * 8.5} 14,25 Z`} 
                  fill="#150604" 
                  filter={`url(#feather-mouth-${id})`}
                />

                {/* Subtle Upper Teeth Line (only visible on medium/wide openings) */}
                {mouthOpening > 0.35 && (
                  <path 
                    d={`M 26,24.5 Q 50,23.5 74,24.5 Q 50,${24.5 + mouthOpening * 2.2} 26,24.5 Z`} 
                    fill="#f3f4f6" 
                    opacity="0.85"
                    filter={`url(#feather-mouth-${id})`}
                  />
                )}

                {/* Soft feathered lower lip boundary contour */}
                <path 
                  d={`M 14,25 Q 50,${25 + mouthOpening * 8.0} 86,25 Q 50,${25 + mouthOpening * 9.5} 14,25 Z`} 
                  fill={persona.lipColor} 
                  opacity="0.9"
                  filter={`url(#feather-mouth-${id})`}
                />

                {/* Soft feathered upper lip highlight */}
                <path 
                  d={`M 14,25 Q 50,${25 - mouthOpening * 1.8} 86,25 Q 50,${25 - mouthOpening * 0.5} 14,25 Z`} 
                  fill={persona.lipColor} 
                  opacity="0.8"
                  filter={`url(#feather-mouth-${id})`}
                />
              </svg>
            </div>
          )}

          {/* 6. Subtle Cognitive Brow Accent (Thinking / Curiosity) */}
          {(expression === 'thinking') && (
            <div 
              className="absolute pointer-events-none rounded-full bg-[#120804]/10 blur-[1.5px] transition-opacity duration-300 mix-blend-multiply"
              style={{
                left: `${persona.leftEye.x - 1}%`,
                top: `${persona.leftEye.y - 6}%`,
                width: `${persona.rightEye.x - persona.leftEye.x + 2}%`,
                height: "2.5%",
                transform: "rotate(-0.5deg)"
              }}
            />
          )}
        </div>

        {/* Cinematic Studio Lens & Lighting Vignette */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/[0.04] pointer-events-none mix-blend-overlay" />
        
        {/* Soft edge rim light when active */}
        {isActive && (
          <div 
            className="absolute inset-0 rounded-2xl pointer-events-none transition-all duration-500"
            style={{
              boxShadow: `inset 0 0 16px ${persona.ambientGlow}`
            }}
          />
        )}
      </div>

      {/* 7. LAYER 5: Clean Video Call UI & Metadata (Google Meet Style) */}
      
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
