import React, { useState, useEffect, useRef } from "react";
import { MicOff, Activity, Sparkles } from "lucide-react";
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
  const [breath, setBreath] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const [mouthMumble, setMouthMumble] = useState(0);
  const [expression, setExpression] = useState<FacialExpression>('neutral');
  
  // Gestures
  const [nodOffset, setNodOffset] = useState({ x: 0, y: 0, r: 0 });
  const frameRef = useRef<number | null>(null);

  // Feature maps for accurate facial vector mapping
  const featureMaps: Record<number, { leftEye: { x: number, y: number }, rightEye: { x: number, y: number }, mouth: { x: number, y: number }, scale: number }> = {
    0: { // Sarah Jenkins
      leftEye: { x: 42.5, y: 41.2 },
      rightEye: { x: 57.0, y: 41.2 },
      mouth: { x: 49.5, y: 61.5 },
      scale: 1.05
    },
    1: { // David Chen
      leftEye: { x: 44.2, y: 41.6 },
      rightEye: { x: 57.2, y: 41.6 },
      mouth: { x: 50.8, y: 62.2 },
      scale: 1.03
    },
    2: { // Marcus Brody
      leftEye: { x: 42.8, y: 41.0 },
      rightEye: { x: 55.8, y: 41.0 },
      mouth: { x: 49.0, y: 60.8 },
      scale: 1.04
    }
  };

  const coords = featureMaps[id] || featureMaps[0];

  // 60FPS animation loop for breathing and lip sync
  useEffect(() => {
    const animate = (time: number) => {
      const breathVal = Math.sin(time * 0.0018) * 1.6;
      setBreath(breathVal);

      if (isSpeaking) {
        const soundPulse = Math.abs(Math.sin(time * 0.015) * 8 + Math.cos(time * 0.008) * 4);
        setMouthMumble(soundPulse);
      } else {
        setMouthMumble(0);
      }

      if (isActive) {
        setNodOffset({ x: 0, y: 0, r: 0 });
      } else if (candidateIsSpeaking) {
        const nodY = Math.abs(Math.sin(time * 0.008)) * 1.8;
        const tilt = Math.sin(time * 0.004) * 0.5;
        setNodOffset({ x: 0, y: nodY, r: tilt });
      } else {
        setNodOffset({ x: 0, y: 0, r: 0 });
      }

      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [isSpeaking, isActive, candidateIsSpeaking]);

  // Expression lifecycle
  useEffect(() => {
    const expressionInterval = setInterval(() => {
      if (isThinking) {
        setExpression('thinking');
      } else if (isSpeaking) {
        setExpression(Math.random() < 0.6 ? 'serious' : 'smiling');
      } else if (candidateIsSpeaking) {
        const rolls = Math.random();
        if (rolls < 0.45) setExpression('agreeing');
        else if (rolls < 0.70) setExpression('curious');
        else if (rolls < 0.90) setExpression('smiling');
        else setExpression('neutral');
      } else {
        setExpression('neutral');
      }
    }, 4000);

    return () => clearInterval(expressionInterval);
  }, [isThinking, isSpeaking, candidateIsSpeaking]);

  // Periodic blinking
  useEffect(() => {
    const blinkTimer = setInterval(() => {
      if (Math.random() < 0.28) {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 120);
      }
    }, 1800);
    return () => clearInterval(blinkTimer);
  }, []);

  // Eye gaze tracking
  useEffect(() => {
    const gazeTimer = setInterval(() => {
      if (isActive) {
        if (Math.random() < 0.25) {
          setGaze({
            x: (Math.random() - 0.5) * 1.2,
            y: (Math.random() - 0.5) * 0.8
          });
        } else {
          setGaze({ x: 0, y: 0 });
        }
      } else if (interviewerCount > 1 && activeSpeakerIdx !== id) {
        const turnRight = id === 0 || (id === 1 && activeSpeakerIdx === 2);
        setGaze({
          x: turnRight ? 2.8 : -2.8,
          y: -0.5
        });
      } else {
        setGaze({
          x: (Math.random() - 0.5) * 2.5,
          y: (Math.random() - 0.5) * 1.5
        });
      }
    }, 2500);

    return () => clearInterval(gazeTimer);
  }, [isActive, activeSpeakerIdx, id, interviewerCount]);

  const getMeetingRoomTurnAngle = () => {
    if (isActive) return 0;
    if (interviewerCount <= 1) return 0;
    if (id === 0) return 11;
    if (id === 2) return -11;
    if (id === 1) {
      return activeSpeakerIdx === 0 ? -9 : 9;
    }
    return 0;
  };

  const breathingY = breath * 0.35;
  const breathingScale = 1 + (breath * 0.001);
  const roomTurnY = getMeetingRoomTurnAngle();

  let headTilt = nodOffset.r;
  if (isThinking) {
    headTilt = id === 0 ? -3.5 : 3.0;
  } else if (expression === 'curious') {
    headTilt = -4.0;
  } else if (isActive && isSpeaking) {
    headTilt = Math.sin(breath * 0.4) * 1.2;
  }

  const headY = breathingY + nodOffset.y;
  const headX = nodOffset.x + (roomTurnY * 0.15);

  const avatarUrl = id === 0 
    ? "/assets/sarah.png"
    : id === 1
      ? "/assets/david.png"
      : "/assets/marcus.png";

  const avatarVisuals: Record<number, { skin: string, lips: string, irisColor: string, eyeWidth: number, eyeHeight: number, mouthWidth: number, mouthHeight: number }> = {
    0: {
      skin: "#ffd8c2",
      lips: "#e07a7a",
      irisColor: "#503020",
      eyeWidth: 9.8,
      eyeHeight: 5.6,
      mouthWidth: 19.5,
      mouthHeight: 9.6
    },
    1: {
      skin: "#cc9c80",
      lips: "#bc6f62",
      irisColor: "#3e2417",
      eyeWidth: 8.8,
      eyeHeight: 4.8,
      mouthWidth: 17.5,
      mouthHeight: 8.6
    },
    2: {
      skin: "#d9a184",
      lips: "#be7067",
      irisColor: "#2e3747",
      eyeWidth: 9.2,
      eyeHeight: 5.2,
      mouthWidth: 18.5,
      mouthHeight: 9.2
    }
  };

  const visuals = avatarVisuals[id] || avatarVisuals[0];

  const getExpressionText = () => {
    if (!isActive) {
      if (candidateIsSpeaking) {
        if (expression === 'agreeing') return "🤝 Nodding in agreement...";
        if (expression === 'curious') return "👂 Registering complexity...";
        if (expression === 'smiling') return "😊 Encouraging posture...";
        return "👂 Active listening...";
      }
      return "○ Boardroom Standby";
    }
    if (isThinking) {
      if (id === 0) return "🤔 Formulating behavioral evaluation...";
      if (id === 1) return "🤔 Analyzing engineering patterns...";
      return "🤔 Measuring organizational strategic value...";
    }
    if (isSpeaking) {
      if (id === 0) return "💬 Presenting behavioral prompt...";
      if (id === 1) return "💬 Exploring technical architecture...";
      return "💬 Evaluating executive posture...";
    }
    return "👁️ Concentrated assessment...";
  };

  const eyeSquint = (expression === 'thinking' || expression === 'curious') ? 0.82 : 1.0;

  return (
    <div 
      id={`avatar-container-${id}`}
      className={`relative h-full w-full rounded-2xl overflow-hidden transition-all duration-700 ease-out ${
        isActive 
          ? "border border-indigo-500/40 shadow-2xl shadow-indigo-500/20 scale-[1.01] z-10" 
          : "border border-white/5 opacity-85 hover:opacity-100 hover:border-white/15"
      }`}
    >
      {/* Immersive Executive Boardroom Studio Backdrop */}
      <div className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-none bg-[#090b13]">
        {/* Soft glass architectural dividers */}
        <div className="absolute inset-y-0 left-1/3 w-px bg-white/[0.04]" />
        <div className="absolute inset-y-0 right-1/3 w-px bg-white/[0.04]" />
        <div className="absolute h-px inset-x-0 bottom-1/4 bg-white/[0.04]" />
        
        {/* Subtle Watermark Branding */}
        <div className="absolute top-3.5 right-4 opacity-10 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[7.5px] font-mono tracking-widest text-white uppercase font-bold">EXECUTIVE BOARDROOM V3</span>
        </div>

        {/* Ambient Studio Lighting Glow */}
        <div 
          className={`absolute inset-0 bg-cover bg-center filter blur-3xl opacity-20 scale-110 transition-all duration-1000 ${
            isActive ? "opacity-35 blur-3xl scale-125" : "opacity-10"
          }`} 
          style={{ backgroundImage: `url(${avatarUrl})` }} 
        />
        
        {id === 0 && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent opacity-60" />}
        {id === 1 && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent opacity-60" />}
        {id === 2 && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent opacity-60" />}
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070d] via-slate-950/30 to-black/60" />
      </div>

      {/* Main Avatar Stage */}
      <div className="relative w-full h-full flex flex-col justify-center items-center z-10 pb-8 select-none">
        
        {/* Halo Frame around the recruiter portrait */}
        <div 
          className={`relative rounded-2xl p-1 transition-all duration-700 ease-out ${
            isActive && isSpeaking 
              ? "avatar-speaking-glow ring-2 ring-indigo-400 scale-[1.03]" 
              : isActive && isThinking
                ? "avatar-thinking-glow ring-2 ring-amber-400 scale-[1.01]"
                : candidateIsSpeaking
                  ? "avatar-listening-glow ring-1 ring-emerald-400/80 scale-[1.005]"
                  : "ring-1 ring-white/10"
          }`}
          style={isActive && isSpeaking ? { transform: `scale(${1.03 + (mouthMumble * 0.003)})` } : undefined}
        >
          {/* Portrait composite frame */}
          <div className="w-48 h-56 md:w-56 md:h-64 lg:w-64 lg:h-72 rounded-2xl overflow-hidden border border-white/15 bg-[#070b13] shadow-2xl relative select-none">
            
            {/* Rigged Facial Layer */}
            <div 
              className="w-full h-full relative transition-transform duration-150 ease-out"
              style={{
                transform: `scale(${coords.scale * breathingScale}) translate3d(${headX}px, ${headY}px, 0) rotate(${headTilt}deg) rotateY(${roomTurnY}deg)`,
              }}
            >
              {/* 1. Base Portrait Image */}
              <img 
                src={avatarUrl}
                alt={name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover pointer-events-none"
                style={{ 
                  filter: isThinking 
                      ? "brightness(0.94) contrast(1.05) saturate(0.95)" 
                      : "brightness(1) contrast(1.02)"
                }}
              />

              {/* 2. Micro-Smiling Cheek Lift Glow */}
              {expression === 'smiling' && (
                <>
                  <div 
                    className="absolute pointer-events-none rounded-full bg-rose-500/15 blur-md transition-opacity duration-500 mix-blend-soft-light"
                    style={{ 
                      left: `${coords.leftEye.x - 4}%`, 
                      top: `${coords.leftEye.y + 10}%`,
                      width: "16%",
                      height: "12%"
                    }}
                  />
                  <div 
                    className="absolute pointer-events-none rounded-full bg-rose-500/15 blur-md transition-opacity duration-500 mix-blend-soft-light"
                    style={{ 
                      left: `${coords.rightEye.x - 12}%`, 
                      top: `${coords.rightEye.y + 10}%`,
                      width: "16%",
                      height: "12%"
                    }}
                  />
                </>
              )}

              {/* 3. Eye Gaze Reflectors */}
              {!isBlinking && (
                <>
                  {/* Left Eye Gaze */}
                  <div 
                    className="absolute pointer-events-none flex items-center justify-center rounded-full transition-transform duration-300 ease-out"
                    style={{
                      left: `${coords.leftEye.x - visuals.eyeWidth / 2}%`,
                      top: `${coords.leftEye.y - visuals.eyeHeight / 2}%`,
                      width: `${visuals.eyeWidth}%`,
                      height: `${visuals.eyeHeight}%`,
                    }}
                  >
                    <div 
                      className="w-[45%] h-[45%] rounded-full relative transition-transform duration-200"
                      style={{
                        transform: `translate3d(${gaze.x * 0.16}px, ${gaze.y * 0.12}px, 0) scaleY(${eyeSquint})`,
                        background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${visuals.irisColor} 30%, #000000 85%)`,
                        boxShadow: "0 0 1px rgba(0,0,0,0.4)"
                      }}
                    >
                      <div className="absolute w-[25%] h-[25%] rounded-full bg-white/80 top-[15%] left-[15%] blur-[0.2px]" />
                    </div>
                  </div>

                  {/* Right Eye Gaze */}
                  <div 
                    className="absolute pointer-events-none flex items-center justify-center rounded-full transition-transform duration-300 ease-out"
                    style={{
                      left: `${coords.rightEye.x - visuals.eyeWidth / 2}%`,
                      top: `${coords.rightEye.y - visuals.eyeHeight / 2}%`,
                      width: `${visuals.eyeWidth}%`,
                      height: `${visuals.eyeHeight}%`,
                    }}
                  >
                    <div 
                      className="w-[45%] h-[45%] rounded-full relative transition-transform duration-200"
                      style={{
                        transform: `translate3d(${gaze.x * 0.16}px, ${gaze.y * 0.12}px, 0) scaleY(${eyeSquint})`,
                        background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${visuals.irisColor} 30%, #000000 85%)`,
                        boxShadow: "0 0 1px rgba(0,0,0,0.4)"
                      }}
                    >
                      <div className="absolute w-[25%] h-[25%] rounded-full bg-white/80 top-[15%] left-[15%] blur-[0.2px]" />
                    </div>
                  </div>
                </>
              )}

              {/* 4. Blinking Eyelid Shutters */}
              <div 
                className="absolute pointer-events-none transition-transform duration-100 origin-top rounded-full blur-[0.5px]"
                style={{
                  left: `${coords.leftEye.x - visuals.eyeWidth / 2}%`,
                  top: `${coords.leftEye.y - visuals.eyeHeight / 2 - 1}%`,
                  width: `${visuals.eyeWidth}%`,
                  height: `${visuals.eyeHeight + 2}%`,
                  transform: `scaleY(${isBlinking ? 1 : 0})`,
                  background: `linear-gradient(180deg, ${visuals.skin}e0 0%, ${visuals.skin} 100%)`,
                  opacity: 0.96
                }}
              />
              <div 
                className="absolute pointer-events-none transition-transform duration-100 origin-top rounded-full blur-[0.5px]"
                style={{
                  left: `${coords.rightEye.x - visuals.eyeWidth / 2}%`,
                  top: `${coords.rightEye.y - visuals.eyeHeight / 2 - 1}%`,
                  width: `${visuals.eyeWidth}%`,
                  height: `${visuals.eyeHeight + 2}%`,
                  transform: `scaleY(${isBlinking ? 1 : 0})`,
                  background: `linear-gradient(180deg, ${visuals.skin}e0 0%, ${visuals.skin} 100%)`,
                  opacity: 0.96
                }}
              />

              {/* 5. Realistic Phoneme Lip-Syncing Vector Mouth Layer */}
              {isSpeaking && mouthMumble > 0 && (
                <div 
                  className="absolute pointer-events-none flex items-center justify-center transition-opacity duration-150"
                  style={{
                    left: `${coords.mouth.x - visuals.mouthWidth / 2}%`,
                    top: `${coords.mouth.y - visuals.mouthHeight / 2}%`,
                    width: `${visuals.mouthWidth}%`,
                    height: `${visuals.mouthHeight}%`,
                  }}
                >
                  <svg 
                    viewBox="0 0 100 50" 
                    className="w-full h-full overflow-visible drop-shadow-md"
                  >
                    <path 
                      d={`M 10,25 Q 50,${25 - mouthMumble * 0.4} 90,25 Q 50,${25 + mouthMumble * 1.8} 10,25 Z`} 
                      fill="#1a0a08" 
                    />
                    
                    <path 
                      d={`M 10,25 Q 50,${25 + mouthMumble * 1.9} 90,25 Q 50,${25 + mouthMumble * 2.2} 10,25 Z`} 
                      fill={visuals.lips} 
                      className="opacity-95"
                    />

                    {mouthMumble > 2.5 && (
                      <path 
                        d="M 22,23 Q 50,22 78,23 Q 50,26 22,23 Z" 
                        fill="#f3f4f6" 
                        className="opacity-95"
                        filter="url(#mesh-soften-boardroom)"
                      />
                    )}

                    {mouthMumble > 5 && (
                      <ellipse 
                        cx="50" 
                        cy={`${32 + mouthMumble * 0.3}`} 
                        rx="18" 
                        ry={`${4 + mouthMumble * 0.6}`} 
                        fill="#cf525b" 
                        className="opacity-90"
                        filter="url(#mesh-soften-boardroom)"
                      />
                    )}

                    <path 
                      d={`M 10,25 Q 50,${25 - mouthMumble * 0.6} 90,25 Q 50,${25 - mouthMumble * 0.2} 10,25 Z`} 
                      fill={visuals.lips} 
                      className="opacity-95"
                    />
                    
                    <defs>
                      <filter id="mesh-soften-boardroom">
                        <feGaussianBlur stdDeviation="0.8" />
                      </filter>
                    </defs>
                  </svg>
                </div>
              )}

              {/* 6. Cognitive Furrow */}
              {(expression === 'thinking' || expression === 'curious') && (
                <div 
                  className="absolute pointer-events-none rounded-full bg-[#110905]/15 blur-[2px] transition-all duration-300 mix-blend-multiply"
                  style={{
                    left: `${coords.leftEye.x - 2}%`,
                    top: `${coords.leftEye.y - 7}%`,
                    width: `${coords.rightEye.x - coords.leftEye.x + 4}%`,
                    height: "3%",
                    transform: "rotate(-1deg)"
                  }}
                />
              )}
            </div>

            {/* Cinematic Lens Flare Reflection */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none mix-blend-overlay" />
          </div>

          {/* Micro-waveform speaking ripple */}
          {isActive && isSpeaking && (
            <div className="absolute bottom-1 right-1 bg-indigo-600 rounded-full p-1.5 border border-white/20 flex items-center justify-center gap-0.5 shadow-lg">
              <span className="w-1 h-2.5 bg-white rounded-full animate-bounce [animation-delay:0.1s]" />
              <span className="w-1 h-4 bg-white rounded-full animate-bounce [animation-delay:0.3s]" />
              <span className="w-1 h-2.5 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
            </div>
          )}

          {/* Thinking status */}
          {isActive && isThinking && (
            <div className="absolute bottom-1 right-1 bg-amber-500 rounded-full p-1.5 border border-white/20 animate-pulse flex items-center justify-center shadow-lg">
              <Sparkles className="w-3 h-3 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Top Floating Meet Quality Status */}
        <div className="absolute top-3.5 inset-x-4 flex justify-between items-start z-20 pointer-events-none">
          <span className={`px-2.5 py-1 rounded-full text-[8.5px] font-bold uppercase tracking-wider font-mono shadow border flex items-center gap-1.5 backdrop-blur-xl transition-all duration-300 ${
            isActive && isSpeaking
              ? "bg-indigo-600/90 text-white border-indigo-400 shadow-indigo-600/30" 
              : isActive && isThinking
                ? "bg-amber-500/90 text-white border-amber-300 shadow-amber-500/30"
                : candidateIsSpeaking
                  ? "bg-emerald-600/90 text-white border-emerald-400 shadow-emerald-600/30"
                  : "liquid-glass-subtle text-slate-400 border-white/10"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              isActive && isSpeaking ? "bg-white animate-ping" : isActive && isThinking ? "bg-white animate-pulse" : candidateIsSpeaking ? "bg-white animate-pulse" : "bg-slate-500"
            }`} />
            <span>{isActive && isSpeaking ? "LIVE SPEAKER" : isActive && isThinking ? "EVALUATING" : candidateIsSpeaking ? "LISTENING" : "STANDBY"}</span>
          </span>

          <span className="text-[8px] font-mono font-bold text-slate-300 liquid-glass-subtle px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/10 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
            <span>1080P HD</span>
          </span>
        </div>

        {/* Bottom Floating Google Meet / Liquid Glass Nameplate */}
        <div className="absolute bottom-3.5 inset-x-4 z-20 flex justify-between items-end pointer-events-none">
          <div className="liquid-glass-strong px-3.5 py-2 rounded-xl flex items-center gap-2.5 max-w-[85%] border border-white/15 shadow-xl">
            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-black/40 border border-white/10 shrink-0">
              {isActive && isSpeaking ? (
                <div className="flex items-end gap-0.5 h-3">
                  <span className="w-0.5 bg-indigo-400 rounded-full animate-bounce h-2 [animation-duration:0.6s]" />
                  <span className="w-0.5 bg-indigo-400 rounded-full animate-bounce h-3 [animation-duration:0.4s]" />
                  <span className="w-0.5 bg-indigo-400 rounded-full animate-bounce h-1.5 [animation-duration:0.5s]" />
                </div>
              ) : (
                <MicOff className="w-3 h-3 text-slate-400" />
              )}
            </div>
            
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white leading-none truncate">{name}</span>
                <span className="text-[7.5px] font-mono font-bold bg-indigo-500/25 border border-indigo-500/35 text-indigo-200 px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                  {focus}
                </span>
              </div>
              <span className="text-[9px] text-slate-400 font-mono mt-0.5 leading-none truncate">{role}</span>
            </div>
          </div>

          <div className="hidden sm:block max-w-[45%] text-right liquid-glass-subtle border border-white/10 px-3 py-1.5 rounded-xl shadow-lg">
            <span className="text-[8.5px] font-mono font-semibold text-slate-200 leading-tight block">
              {getExpressionText()}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
