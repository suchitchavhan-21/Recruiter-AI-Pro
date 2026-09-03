import React, { useState, useEffect, useRef } from "react";
import { MicOff, Sparkles, User } from "lucide-react";
import { speechAudioSync } from "./speechAudioSync";

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
  scale: number;
  naturalTilt: number;
  facialLandmarks: {
    leftEye: { x: number; y: number; w: number; h: number };
    rightEye: { x: number; y: number; w: number; h: number };
    mouth: { x: number; y: number; w: number; h: number };
    skinTone: string;
    skinHighlight: string;
    lipColor: string;
    lipInner: string;
    teethColor: string;
  };
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Presence and accessibility state
  const [hasImageError, setHasImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // State refs for 60fps zero-re-render physics loop
  const isSpeakingRef = useRef(isSpeaking);
  const isThinkingRef = useRef(isThinking);
  const candidateSpeakingRef = useRef(candidateIsSpeaking);
  const isActiveRef = useRef(isActive);

  // Animation physics state refs
  const mouthOpenRef = useRef(0);
  const mouthWidthScaleRef = useRef(1);
  const jawOffsetRef = useRef(0);
  const blinkPhaseRef = useRef(0); // 0 = open, 1 = closed
  const blinkTargetRef = useRef(0);
  const nextBlinkTimeRef = useRef(Date.now() + 2000 + Math.random() * 3000);
  const eyeGazeXRef = useRef(0);
  const eyeGazeYRef = useRef(0);
  const nextGazeTimeRef = useRef(Date.now() + 2500);

  // Keep refs in sync with props
  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
    isThinkingRef.current = isThinking;
    candidateSpeakingRef.current = candidateIsSpeaking;
    isActiveRef.current = isActive;
    if (isActive) {
      speechAudioSync.setActivePersona(id);
      if (typeof window !== "undefined") {
        (window as any).__ACTIVE_INTERVIEWER_PERSONA_ID__ = id;
      }
    }
  }, [isSpeaking, isThinking, candidateIsSpeaking, isActive, id]);

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

  // Persona configurations with calibrated facial coordinates
  const personaConfigs: Record<number, PersonaConfig> = {
    0: { // Sarah Jenkins — VP of People & Culture
      avatarUrl: "/assets/sarah.png",
      accentColor: "#818cf8",
      ambientGlow: "rgba(99, 102, 241, 0.22)",
      objectPosition: "50% 16%",
      scale: 1.10,
      naturalTilt: 0.15,
      facialLandmarks: {
        leftEye: { x: 224, y: 194, w: 24, h: 11 },
        rightEye: { x: 290, y: 194, w: 24, h: 11 },
        mouth: { x: 256, y: 310, w: 46, h: 10 },
        skinTone: "#edd0be",
        skinHighlight: "#f5ded0",
        lipColor: "#c26363",
        lipInner: "#381212",
        teethColor: "#f7f0eb"
      },
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
      ambientGlow: "rgba(59, 130, 246, 0.22)",
      objectPosition: "50% 14%",
      scale: 1.10,
      naturalTilt: -0.15,
      facialLandmarks: {
        leftEye: { x: 222, y: 188, w: 23, h: 10 },
        rightEye: { x: 290, y: 188, w: 23, h: 10 },
        mouth: { x: 256, y: 302, w: 42, h: 9 },
        skinTone: "#cca28a",
        skinHighlight: "#dab39d",
        lipColor: "#aa5d54",
        lipInner: "#341010",
        teethColor: "#f4ebe5"
      },
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
      ambientGlow: "rgba(16, 185, 129, 0.22)",
      objectPosition: "50% 16%",
      scale: 1.10,
      naturalTilt: 0.1,
      facialLandmarks: {
        leftEye: { x: 225, y: 202, w: 24, h: 11 },
        rightEye: { x: 288, y: 202, w: 24, h: 11 },
        mouth: { x: 256, y: 316, w: 44, h: 10 },
        skinTone: "#7d5038",
        skinHighlight: "#916045",
        lipColor: "#673a2c",
        lipInner: "#260e0a",
        teethColor: "#ece2da"
      },
      expressionText: {
        speaking: "Assessing Strategic Leadership",
        thinking: "Measuring Delivery Velocity",
        listening: "Observing Executive Posture",
        standby: "Standby"
      }
    }
  };

  const persona = personaConfigs[id] || personaConfigs[0];

  // Load portrait image into memory for high-performance canvas composite
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = persona.avatarUrl;
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
      setHasImageError(false);
    };
    img.onerror = () => {
      setHasImageError(true);
      setImageLoaded(false);
    };
  }, [persona.avatarUrl]);

  // Real-Time 60 FPS Speech-Synchronized Facial Rig Loop
  useEffect(() => {
    if (!imageLoaded || reducedMotion) return;

    let lastTime = performance.now();

    const renderLoop = (currentTime: number) => {
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const img = imageRef.current;

      if (canvas && ctx && img) {
        const now = Date.now();
        const isSpk = isSpeakingRef.current && isActiveRef.current;
        const landmarks = persona.facialLandmarks;

        // Register active persona with audio sync engine
        if (isSpk) {
          speechAudioSync.setActivePersona(id);
        }

        // 1. Audio-Driven Speech Articulation from AnalyserNode
        if (isSpk) {
          const audio = speechAudioSync.getAudioAcousticMetrics();

          if (audio.isPlaying && audio.speechActivity > 0.02) {
            const targetOpening = audio.mouthOpening;
            const targetWidthScale = audio.mouthWidthScale;
            const targetJaw = audio.jawOffset;

            // Fast, organic muscular spring interpolation
            mouthOpenRef.current += (targetOpening - mouthOpenRef.current) * Math.min(delta * 24, 1);
            mouthWidthScaleRef.current += (targetWidthScale - mouthWidthScaleRef.current) * Math.min(delta * 18, 1);
            jawOffsetRef.current += (targetJaw - jawOffsetRef.current) * Math.min(delta * 20, 1);
          } else {
            // Silence gap -> smooth closure to rest
            mouthOpenRef.current += (0 - mouthOpenRef.current) * Math.min(delta * 26, 1);
            mouthWidthScaleRef.current += (1 - mouthWidthScaleRef.current) * Math.min(delta * 20, 1);
            jawOffsetRef.current += (0 - jawOffsetRef.current) * Math.min(delta * 22, 1);
          }
        } else {
          // Resting neutral mouth
          mouthOpenRef.current += (0 - mouthOpenRef.current) * Math.min(delta * 28, 1);
          mouthWidthScaleRef.current += (1 - mouthWidthScaleRef.current) * Math.min(delta * 20, 1);
          jawOffsetRef.current += (0 - jawOffsetRef.current) * Math.min(delta * 24, 1);
        }

        // 2. Natural Irregular Blinking Rig (100–120ms human blink cycle)
        if (now > nextBlinkTimeRef.current) {
          blinkTargetRef.current = 1;
          nextBlinkTimeRef.current = now + 3000 + Math.random() * 3200;
        }

        if (blinkTargetRef.current === 1) {
          blinkPhaseRef.current += delta * 18; // Fast close (~50ms)
          if (blinkPhaseRef.current >= 1) {
            blinkPhaseRef.current = 1;
            blinkTargetRef.current = 0;
          }
        } else {
          blinkPhaseRef.current -= delta * 14; // Smooth open (~70ms)
          if (blinkPhaseRef.current <= 0) {
            blinkPhaseRef.current = 0;
          }
        }

        // 3. Gaze Direction Logic
        if (isThinkingRef.current) {
          // Contemplative gaze drift slightly up and right
          eyeGazeXRef.current = 1.0;
          eyeGazeYRef.current = -0.8;
        } else if (candidateSpeakingRef.current) {
          // Attentive listening forward gaze
          eyeGazeXRef.current = 0.0;
          eyeGazeYRef.current = 0.2;
        } else if (now > nextGazeTimeRef.current) {
          eyeGazeXRef.current = (Math.random() - 0.5) * 0.6;
          eyeGazeYRef.current = (Math.random() - 0.5) * 0.4;
          nextGazeTimeRef.current = now + 2500 + Math.random() * 2500;
        }

        // 4. Head Rig Transform: Natural Breathing, Speaking Nod, & Expression Posture
        const tSec = now * 0.001;
        const breathingY = Math.sin(tSec * 1.6) * 0.75;
        const openVal = mouthOpenRef.current;
        const bPhase = blinkPhaseRef.current;

        // Subconscious conversational nodding while speaking
        const speakingNod = (isSpk && openVal > 0.6) 
          ? Math.sin(tSec * 4.8) * Math.min(openVal * 0.05, 0.35) * (Math.PI / 180)
          : 0;

        let headTilt = persona.naturalTilt;
        if (isThinkingRef.current) {
          headTilt += 0.012; // Inquisitive tilt
        } else if (candidateSpeakingRef.current) {
          headTilt -= 0.008; // Receptive tilt
        } else if (isSpk) {
          headTilt += speakingNod;
        }

        // Clear canvas
        ctx.clearRect(0, 0, 512, 512);

        ctx.save();
        // Pivot head transforms around anatomical neck/skull center (256, 256)
        ctx.translate(256, 256);
        ctx.rotate(headTilt);
        ctx.translate(-256, -256 + breathingY);

        // Render base authentic photograph
        ctx.drawImage(img, 0, 0, 512, 512);

        // 5. Photographic Lower-Face & Mouth Rig Warping
        if (openVal > 0.35) {
          const m = landmarks.mouth;
          const mouthY = m.y;
          const wScale = mouthWidthScaleRef.current;
          const halfW = (m.w * wScale) * 0.5;

          // Anatomical Jaw & Lip Parameters
          const lipElevate = Math.min(openVal * 0.12, 1.2); // Upper lip elevator muscle
          const jawDrop = openVal * 0.44;                   // Mandible hinge drop (0 to 4.5px)

          // Upper face down to upper lip line
          ctx.drawImage(img, 0, 0, 512, mouthY - 14, 0, 0, 512, mouthY - 14);

          // Upper lip tissue (mouthY - 14 to mouthY): slight upward expansion
          const upperLipH = 14;
          for (let y = mouthY - upperLipH; y < mouthY; y += 2) {
            const frac = (y - (mouthY - upperLipH)) / upperLipH;
            const offsetY = -lipElevate * frac;
            ctx.drawImage(img, 0, y, 512, 2, 0, y + offsetY, 512, 2);
          }

          // Natural Oral Cavity Depth in the parted slit between vermilion borders
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(m.x, mouthY + (jawDrop - lipElevate) * 0.5, halfW, (jawDrop + lipElevate) * 0.52, 0, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(14, 5, 5, 0.94)";
          ctx.fill();
          ctx.restore();

          // Lower Face Mesh (Lower lip, chin, jawline down to neck):
          // Mandible rotation falloff from lower lip to collar
          const startY = mouthY;
          const endY = 475;
          const sliceH = 1.5;
          const totalRange = endY - startY;

          for (let y = startY; y < endY; y += sliceH) {
            const progress = (y - startY) / totalRange;
            const displacementFactor = Math.cos(progress * Math.PI * 0.5);
            const offsetY = jawDrop * displacementFactor;

            ctx.drawImage(
              img,
              0, y, 512, sliceH,
              0, y + offsetY, 512, sliceH
            );
          }
        }

        // 6. Natural Texture-Preserving Eyelid Blinking Rig
        if (bPhase > 0.02) {
          const eyes = [landmarks.leftEye, landmarks.rightEye];
          eyes.forEach((eye) => {
            const eyeX = eye.x + eyeGazeXRef.current;
            const eyeY = eye.y + eyeGazeYRef.current;
            const boxW = eye.w * 1.8;
            const boxH = eye.h * 1.6;
            const srcX = eyeX - boxW * 0.5;
            const srcY = eyeY - boxH * 0.5;

            // Compress eye aperture downward using authentic eyelid skin
            const blinkScaleY = 1.0 - bPhase * 0.88;
            const currentH = boxH * blinkScaleY;
            const destY = srcY + (boxH - currentH) * 0.55;

            ctx.drawImage(
              img,
              srcX, srcY, boxW, boxH,
              srcX, destY, boxW, currentH
            );
          });
        }

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [imageLoaded, reducedMotion, id]);

  // Gentle panel turn angle for multi-interviewer boardroom stage
  const getPanelTurnAngle = () => {
    if (isActive || interviewerCount <= 1 || reducedMotion) return 0;
    if (id === 0) return 1.2; // Sarah subtle focus toward center
    if (id === 2) return -1.2; // Marcus subtle focus toward center
    if (id === 1) return activeSpeakerIdx === 0 ? -1.0 : 1.0;
    return 0;
  };

  const panelTurnY = getPanelTurnAngle();
  
  // Head posture shifts
  let finalHeadTilt = persona.naturalTilt;
  if (isThinking) {
    finalHeadTilt = id === 0 ? -0.5 : 0.5;
  } else if (candidateIsSpeaking) {
    finalHeadTilt = persona.naturalTilt + 0.15;
  }

  const headTranslateY = isThinking ? 0.25 : 0;
  const headTranslateX = panelTurnY * 0.08;

  // Determine active 2.5D animation class based on conversational state
  const getAvatarAnimationClass = () => {
    if (reducedMotion) return "";
    if (isActive && isSpeaking) return "animate-avatar-speaking";
    if (isActive && isThinking) return "animate-avatar-thinking";
    if (candidateIsSpeaking) return "animate-avatar-listening";
    return "animate-avatar-idle";
  };

  const avatarAnimationClass = getAvatarAnimationClass();

  // Live status badge information
  const getStatusBadge = () => {
    if (isActive && isSpeaking) {
      return {
        label: "Speaking",
        containerClass: "bg-indigo-950/85 border-indigo-500/50 text-indigo-200 shadow-lg shadow-indigo-500/25",
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
        containerClass: "bg-amber-950/85 border-amber-500/50 text-amber-200 shadow-lg shadow-amber-500/25",
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
      className={`relative h-full w-full rounded-2xl overflow-hidden bg-[#06080e] select-none transition-all duration-500 ease-out ${
        isActive && isSpeaking
          ? "border border-indigo-400/50 shadow-2xl shadow-indigo-950/80 ring-2 ring-indigo-500/40 scale-[1.012] -translate-y-0.5 z-10"
          : isActive && isThinking
            ? "border border-amber-400/40 shadow-2xl shadow-amber-950/50 ring-2 ring-amber-500/30 scale-[1.006] z-10"
            : candidateIsSpeaking
              ? "border border-emerald-500/30 ring-1 ring-emerald-500/20 opacity-95"
              : "border border-white/10 opacity-90 hover:opacity-100 hover:border-white/20"
      }`}
    >
      {/* 1. LAYER 1: 2.5D Volumetric Studio Backdrop & Reactive Ambient Glow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-gradient-to-b from-[#0a0d18] via-[#060810] to-[#020306]">
        {/* Dynamic persona-tinted volumetric back-lighting with speech bloom */}
        <div 
          className={`absolute inset-0 filter blur-3xl scale-125 transition-opacity duration-1000 ${
            isActive && isSpeaking && !reducedMotion ? "animate-ambient-speaking opacity-35" : "opacity-25"
          }`}
          style={{ 
            background: `radial-gradient(circle at 50% 30%, ${persona.accentColor} 0%, transparent 68%)` 
          }}
        />
        
        {/* Subtle camera studio optical vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_55%,_rgba(2,4,8,0.70)_100%)] pointer-events-none" />
      </div>

      {/* 2. LAYER 2: Live Talking AI Avatar Canvas Stage */}
      <div className="relative w-full h-full flex items-center justify-center z-10 overflow-hidden">
        
        {/* Head Rig with 2.5D Respiration, Micro-Parallax & Speaking Cadence */}
        <div 
          className={`w-full h-full relative transition-transform duration-500 ease-out flex items-center justify-center ${avatarAnimationClass}`}
          style={{
            transform: `translate3d(${headTranslateX}px, ${headTranslateY}px, 0) rotate(${finalHeadTilt}deg) rotateY(${panelTurnY}deg)`,
          }}
        >
          {/* Live High-Fidelity Talking Avatar Canvas */}
          {!hasImageError ? (
            <canvas
              ref={canvasRef}
              width={512}
              height={512}
              className="w-full h-full object-cover pointer-events-none select-none transition-all duration-700 ease-out"
              style={{
                objectPosition: persona.objectPosition,
                transform: `scale(${persona.scale})`,
                filter: isThinking 
                  ? "brightness(0.97) contrast(1.035) saturate(0.98)" 
                  : isActive && isSpeaking 
                    ? "brightness(1.03) contrast(1.025) saturate(1.02)" 
                    : isActive 
                      ? "brightness(1.01) contrast(1.01)" 
                      : "brightness(0.90) contrast(0.98)"
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

        {/* 3. LAYER 3: Reactive Studio Rim Light & Lens Bloom */}
        {isActive && (
          <div 
            className={`absolute inset-0 rounded-2xl pointer-events-none transition-all duration-500 ${
              isSpeaking && !reducedMotion ? "animate-rim-speaking" : ""
            }`}
            style={{
              boxShadow: `inset 0 0 26px ${persona.ambientGlow}`
            }}
          />
        )}

        {/* Subtle camera lens glass sheen */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.035] via-transparent to-transparent pointer-events-none rounded-2xl" />
      </div>

      {/* 4. LAYER 4: Clean Video Call UI & Grounded Metadata */}
      
      {/* Top Left: Live Status Pill */}
      <div className="absolute top-3 left-3 z-20 pointer-events-none">
        <div className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider font-mono shadow-md border flex items-center gap-1.5 backdrop-blur-md transition-all duration-300 ${statusBadge.containerClass}`}>
          {statusBadge.icon}
          <span>{statusBadge.label}</span>
        </div>
      </div>

      {/* Bottom Floating Executive Nameplate */}
      <div className="absolute bottom-3 inset-x-3 z-20 flex justify-between items-end pointer-events-none">
        <div className="backdrop-blur-md bg-slate-950/85 px-3 py-1.5 rounded-xl flex items-center gap-2.5 max-w-[85%] border border-white/15 shadow-xl">
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
              <span className="text-xs sm:text-sm font-semibold text-white leading-none truncate font-sans tracking-tight">
                {name}
              </span>
              <span 
                className="text-[7.5px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 border"
                style={{
                  backgroundColor: `${persona.accentColor}20`,
                  borderColor: `${persona.accentColor}40`,
                  color: persona.accentColor
                }}
              >
                {focus}
              </span>
            </div>
            <span className="text-[9.5px] text-slate-300 font-sans mt-0.5 leading-none truncate">
              {role}
            </span>
          </div>
        </div>

        {/* Contextual Status Sub-Label (Desktop only) */}
        <div className="hidden md:block max-w-[42%] text-right backdrop-blur-md bg-slate-950/70 border border-white/10 px-2.5 py-1 rounded-lg shadow-md">
          <span className="text-[8.5px] font-mono font-medium text-slate-300 leading-tight block truncate">
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
