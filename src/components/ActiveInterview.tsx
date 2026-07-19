import React, { useEffect, useState, useRef } from "react";
import { 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  VolumeX, 
  Clock, 
  CheckCircle, 
  Play, 
  Square,
  AlertTriangle,
  Sliders,
  FileText,
  Trash2,
  Copy,
  BookOpen,
  Camera,
  CameraOff,
  Video,
  Activity,
  UserCheck,
  Smile,
  Compass,
  ArrowRight
} from "lucide-react";
import { Question, QAHistory, InterviewerPersona } from "../types";

const sarahImg = "/assets/sarah.png";
const davidImg = "/assets/david.png";
const marcusImg = "/assets/marcus.png";

interface ActiveInterviewProps {
  questions: Question[];
  currentQuestionIndex: number;
  onNextQuestion: (answerText: string) => void;
  onFinishInterview: (answerText: string) => void;
  persona: InterviewerPersona;
  companyName: string;
  roleName: string;
  interviewerCount?: number;
}

// -------------------------------------------------------------
// HIGH-FIDELITY DIGITAL HUMAN EXPRESSION & MICRO-ANIMATION ENGINE
// -------------------------------------------------------------
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

type FacialExpression = 'neutral' | 'smiling' | 'thinking' | 'serious' | 'confused' | 'agreeing' | 'disagreeing' | 'curious' | 'surprised';

function HumanAvatar({ 
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
  const [microExpressionTime, setMicroExpressionTime] = useState(0);
  
  // Nodding and shaking animation states for active gestures
  const [nodOffset, setNodOffset] = useState({ x: 0, y: 0, r: 0 });
  const frameRef = useRef<number | null>(null);

  // Precise feature coordinate maps for each avatar to align the dynamic vector overlays perfectly over the portraits
  const featureMaps: Record<number, { leftEye: { x: number, y: number }, rightEye: { x: number, y: number }, mouth: { x: number, y: number }, scale: number }> = {
    0: { // Sarah Jenkins (Female, HR Manager)
      leftEye: { x: 42.5, y: 41.2 },
      rightEye: { x: 57.0, y: 41.2 },
      mouth: { x: 49.5, y: 61.5 },
      scale: 1.05
    },
    1: { // David Chen (Male, Technical Expert)
      leftEye: { x: 44.2, y: 41.6 },
      rightEye: { x: 57.2, y: 41.6 },
      mouth: { x: 50.8, y: 62.2 },
      scale: 1.03
    },
    2: { // Marcus Brody (Male, Hiring Manager)
      leftEye: { x: 42.8, y: 41.0 },
      rightEye: { x: 55.8, y: 41.0 },
      mouth: { x: 49.0, y: 60.8 },
      scale: 1.04
    }
  };

  const coords = featureMaps[id] || featureMaps[0];

  // 60FPS physics and lifelike micro-vibration looping engine
  useEffect(() => {
    const animate = (time: number) => {
      // Elegant, physical chest and shoulder breathing
      const breathVal = Math.sin(time * 0.0018) * 1.6;
      setBreath(breathVal);
      setMicroExpressionTime(time);

      // Sound-reactive lip mumble shape calculation
      if (isSpeaking) {
        // Multi-frequency sound wave modulation simulating phonetic syllables
        const soundPulse = Math.abs(Math.sin(time * 0.015) * 8 + Math.cos(time * 0.008) * 4);
        setMouthMumble(soundPulse);
      } else {
        setMouthMumble(0);
      }

      // Handle physiological feedback states (Nodding/Shaking)
      if (isActive) {
        setNodOffset({ x: 0, y: 0, r: 0 });
      } else if (candidateIsSpeaking) {
        // Continuous, gentle micro-nod of agreement while candidate answers
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

  // Lifelike cognitive expression selector cycle
  useEffect(() => {
    const expressionInterval = setInterval(() => {
      if (isThinking) {
        setExpression('thinking');
      } else if (isSpeaking) {
        // Alternate between professional serious and encouraging smiling explanations
        setExpression(Math.random() < 0.6 ? 'serious' : 'smiling');
      } else if (candidateIsSpeaking) {
        // Active listening reactions to candidate statements
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

  // Trigger instantaneous blinking micro-expression
  useEffect(() => {
    const blinkTimer = setInterval(() => {
      if (Math.random() < 0.28) {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 120);
      }
    }, 1800);
    return () => clearInterval(blinkTimer);
  }, []);

  // Spatial gaze-shifting and multi-agent interaction coordinator
  useEffect(() => {
    const gazeTimer = setInterval(() => {
      // 1. If currently speaking, maintain focused eye-contact with candidate/webcam
      if (isActive) {
        if (Math.random() < 0.25) {
          // Subtle micro-saccades to prevent dead robotic staring
          setGaze({
            x: (Math.random() - 0.5) * 1.2,
            y: (Math.random() - 0.5) * 0.8
          });
        } else {
          setGaze({ x: 0, y: 0 });
        }
      } 
      // 2. If another panelist is speaking, turn and coordinate gaze toward them
      else if (interviewerCount > 1 && activeSpeakerIdx !== id) {
        const turnRight = id === 0 || (id === 1 && activeSpeakerIdx === 2);
        setGaze({
          x: turnRight ? 2.8 : -2.8,
          y: -0.5
        });
      } 
      // 3. Active candidate-listening idle gaze drift
      else {
        setGaze({
          x: (Math.random() - 0.5) * 2.5,
          y: (Math.random() - 0.5) * 1.5
        });
      }
    }, 2500);

    return () => clearInterval(gazeTimer);
  }, [isActive, activeSpeakerIdx, id, interviewerCount]);

  // Determine physical spatial head-turning angle based on meeting room layout
  const getMeetingRoomTurnAngle = () => {
    if (isActive) return 0; // Look straight at candidate
    if (interviewerCount <= 1) return 0;

    // Leftmost interviewer (Sarah) looks right
    if (id === 0) return 11;
    // Rightmost interviewer (Marcus) looks left
    if (id === 2) return -11;
    // Central interviewer (David) looks left/right based on active speaker
    if (id === 1) {
      return activeSpeakerIdx === 0 ? -9 : 9;
    }
    return 0;
  };

  // Math-mapped physiological offsets
  const breathingY = breath * 0.35;
  const breathingScale = 1 + (breath * 0.001);
  const roomTurnY = getMeetingRoomTurnAngle();

  // Combine multiple independent head gestures and tilts
  let headTilt = nodOffset.r;
  if (isThinking) {
    headTilt = id === 0 ? -3.5 : 3.0; // Puzzled/analytical head tilt
  } else if (expression === 'curious') {
    headTilt = -4.0;
  } else if (isActive && isSpeaking) {
    headTilt = Math.sin(breath * 0.4) * 1.2;
  }

  const headY = breathingY + nodOffset.y;
  const headX = nodOffset.x + (roomTurnY * 0.15);

  const avatarUrl = id === 0 
    ? sarahImg
    : id === 1
      ? davidImg
      : marcusImg;

  // Fine-tuned visual configurations for each interviewer avatar to blend features seamlessly
  const avatarVisuals: Record<number, { skin: string, lips: string, irisColor: string, eyeWidth: number, eyeHeight: number, mouthWidth: number, mouthHeight: number }> = {
    0: { // Sarah Jenkins (Female, HR Manager)
      skin: "#ffd8c2",     // Light peach skin tone
      lips: "#e07a7a",     // Soft rosy lips
      irisColor: "#503020", // Brown eyes
      eyeWidth: 9.8,
      eyeHeight: 5.6,
      mouthWidth: 19.5,
      mouthHeight: 9.6
    },
    1: { // David Chen (Male, Technical Expert)
      skin: "#cc9c80",     // Warm golden undertone
      lips: "#bc6f62",     // Clay coral
      irisColor: "#3e2417", // Rich dark brown
      eyeWidth: 8.8,
      eyeHeight: 4.8,
      mouthWidth: 17.5,
      mouthHeight: 8.6
    },
    2: { // Marcus Brody (Male, Hiring Manager)
      skin: "#d9a184",     // Sand beige tone
      lips: "#be7067",     // Terracotta rose
      irisColor: "#2e3747", // Hazel-blue deep hybrid
      eyeWidth: 9.2,
      eyeHeight: 5.2,
      mouthWidth: 18.5,
      mouthHeight: 9.2
    }
  };

  const visuals = avatarVisuals[id] || avatarVisuals[0];

  // Real-time Cognitive Expression Text
  const getExpressionText = () => {
    if (!isActive) {
      if (candidateIsSpeaking) {
        if (expression === 'agreeing') return "🤝 Nodding in agreement...";
        if (expression === 'curious') return "👂 Registering complexity...";
        if (expression === 'smiling') return "😊 Encouraging posture...";
        return "👂 Active listening...";
      }
      return "💤 STANDBY MODE";
    }
    if (isThinking) {
      if (id === 0) return "🤔 Formulating behavioral evaluation...";
      if (id === 1) return "🤔 Analyzing engineering patterns...";
      return "🤔 Measuring organizational strategic value...";
    }
    if (isSpeaking) {
      if (id === 0) return "💬 Presenting behavioral prompt...";
      if (id === 1) return "💬 Exploring technical details...";
      return "💬 Evaluating cultural posture...";
    }
    return "👁️ Concentrated assessment...";
  };

  // Determine eye squint based on expression
  const eyeSquint = (expression === 'thinking' || expression === 'curious') ? 0.82 : 1.0;

  return (
    <div className={`relative h-full w-full rounded-2xl overflow-hidden border transition-all duration-700 ease-out ${
      isActive 
        ? "bg-gradient-to-b from-[#0f172a] to-[#020617] border-[#6D5EF8]/90 shadow-2xl shadow-[#6D5EF8]/20 scale-[1.01]" 
        : "bg-gradient-to-b from-slate-900 to-[#09090B] border-[#27272A]/70 opacity-75"
    }`}>
      {/* Immersive background lighting and vignette */}
      <div className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-none">
        <div 
          className={`absolute inset-0 bg-cover bg-center filter blur-2xl opacity-15 scale-110 transition-all duration-1000 ${
            isActive ? "opacity-30 blur-3xl scale-125" : "opacity-5"
          }`} 
          style={{ backgroundImage: `url(${avatarUrl})` }} 
        />
        {id === 0 && <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_35%,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent opacity-40" />}
        {id === 1 && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,_var(--tw-gradient-stops))] from-blue-500/15 via-transparent to-transparent opacity-45" />}
        {id === 2 && <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_35%,_var(--tw-gradient-stops))] from-indigo-500/15 via-transparent to-transparent opacity-45" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-black/45" />
      </div>

      {/* Main Avatar Canvas Container */}
      <div className="relative w-full h-full flex flex-col justify-center items-center z-10 pb-4 select-none">
        
        {/* Dynamic Studio Framing Halo */}
        <div className={`relative rounded-full p-1.5 transition-all duration-700 ease-out ${
          isActive && isSpeaking 
            ? "shadow-2xl shadow-[#6D5EF8]/35 ring-4 ring-[#6D5EF8] scale-[1.03]" 
            : isActive && isThinking
              ? "ring-4 ring-amber-500/90 scale-[1.01]"
              : candidateIsSpeaking
                ? "ring-2 ring-emerald-500/50 scale-[1.005]"
                : "ring-2 ring-white/5"
        }`}
        style={isActive && isSpeaking ? { transform: `scale(${1.03 + (mouthMumble * 0.003)})` } : undefined}
        >
          {/* Photorealistic Composite Face Mesh Window */}
          <div className="w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden border border-white/10 bg-[#070b13] shadow-inner relative select-none">
            
            {/* Unified Puppet Rigging Layer (Keeps base portrait and dynamic features locked in perfect lockstep) */}
            <div 
              className="w-full h-full relative transition-transform duration-150 ease-out"
              style={{
                transform: `scale(${coords.scale * breathingScale}) translate3d(${headX}px, ${headY}px, 0) rotate(${headTilt}deg) rotateY(${roomTurnY}deg)`,
              }}
            >
              {/* 1. Underlying Portrait */}
              <img 
                src={avatarUrl}
                alt={name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover pointer-events-none"
                style={{ 
                  filter: isThinking 
                      ? "brightness(0.92) contrast(1.05) saturate(0.95)" 
                      : "brightness(1) contrast(1)"
                }}
              />

              {/* 2. Micro-Smiling Cheek Lift Glow Overlay */}
              {expression === 'smiling' && (
                <>
                  <div 
                    className="absolute pointer-events-none rounded-full bg-rose-500/10 blur-md transition-opacity duration-500 mix-blend-soft-light"
                    style={{ 
                      left: `${coords.leftEye.x - 4}%`, 
                      top: `${coords.leftEye.y + 10}%`,
                      width: "16%",
                      height: "12%"
                    }}
                  />
                  <div 
                    className="absolute pointer-events-none rounded-full bg-rose-500/10 blur-md transition-opacity duration-500 mix-blend-soft-light"
                    style={{ 
                      left: `${coords.rightEye.x - 12}%`, 
                      top: `${coords.rightEye.y + 10}%`,
                      width: "16%",
                      height: "12%"
                    }}
                  />
                </>
              )}

              {/* 3. High-Fidelity Eye Gaze & Micro-Reflection Vectors */}
              {!isBlinking && (
                <>
                  {/* Left Eye Gaze Reflector */}
                  <div 
                    className="absolute pointer-events-none flex items-center justify-center rounded-full transition-transform duration-300 ease-out"
                    style={{
                      left: `${coords.leftEye.x - visuals.eyeWidth / 2}%`,
                      top: `${coords.leftEye.y - visuals.eyeHeight / 2}%`,
                      width: `${visuals.eyeWidth}%`,
                      height: `${visuals.eyeHeight}%`,
                    }}
                  >
                    {/* Dark blended pupil core with organic specular glaze */}
                    <div 
                      className="w-[45%] h-[45%] rounded-full relative transition-transform duration-200"
                      style={{
                        transform: `translate3d(${gaze.x * 0.16}px, ${gaze.y * 0.12}px, 0) scaleY(${eyeSquint})`,
                        background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${visuals.irisColor} 30%, #000000 85%)`,
                        boxShadow: "0 0 1px rgba(0,0,0,0.4)"
                      }}
                    >
                      {/* Secondary reflection point */}
                      <div className="absolute w-[25%] h-[25%] rounded-full bg-white/70 top-[15%] left-[15%] blur-[0.2px]" />
                    </div>
                  </div>

                  {/* Right Eye Gaze Reflector */}
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
                      <div className="absolute w-[25%] h-[25%] rounded-full bg-white/70 top-[15%] left-[15%] blur-[0.2px]" />
                    </div>
                  </div>
                </>
              )}

              {/* 4. Physiological Organic Eyelid Shutters (Blinking) */}
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

              {/* 5. Natural Phoneme-Based Lip-Syncing Vector Mouth Layer */}
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
                    {/* Shadowed Mouth cavity */}
                    <path 
                      d={`M 10,25 Q 50,${25 - mouthMumble * 0.4} 90,25 Q 50,${25 + mouthMumble * 1.8} 10,25 Z`} 
                      fill="#1a0a08" 
                    />
                    
                    {/* Lower Lip backing */}
                    <path 
                      d={`M 10,25 Q 50,${25 + mouthMumble * 1.9} 90,25 Q 50,${25 + mouthMumble * 2.2} 10,25 Z`} 
                      fill={visuals.lips} 
                      className="opacity-95"
                    />

                    {/* Pearlescent upper teeth */}
                    {mouthMumble > 2.5 && (
                      <path 
                        d="M 22,23 Q 50,22 78,23 Q 50,26 22,23 Z" 
                        fill="#f3f4f6" 
                        className="opacity-95"
                        filter="url(#mesh-soften)"
                      />
                    )}

                    {/* Dynamic soft-shaded tongue */}
                    {mouthMumble > 5 && (
                      <ellipse 
                        cx="50" 
                        cy={`${32 + mouthMumble * 0.3}`} 
                        rx="18" 
                        ry={`${4 + mouthMumble * 0.6}`} 
                        fill="#cf525b" 
                        className="opacity-90"
                        filter="url(#mesh-soften)"
                      />
                    )}

                    {/* Upper Lip overlay */}
                    <path 
                      d={`M 10,25 Q 50,${25 - mouthMumble * 0.6} 90,25 Q 50,${25 - mouthMumble * 0.2} 10,25 Z`} 
                      fill={visuals.lips} 
                      className="opacity-95"
                    />
                    
                    <defs>
                      <filter id="mesh-soften">
                        <feGaussianBlur stdDeviation="0.8" />
                      </filter>
                    </defs>
                  </svg>
                </div>
              )}

              {/* 6. Dynamic micro forehead furrow shadow for analytical look */}
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

            {/* Subtle high-fidelity lens glare overlay to look like a premium 4K camera */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none mix-blend-overlay" />
            
            {/* Soft scanline texture for tech-vibe */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.12)_50%)] bg-[size:100%_4px] opacity-15 pointer-events-none" />

          </div>

          {/* Micro-waveform speaking ripple */}
          {isActive && isSpeaking && (
            <div className="absolute bottom-1 right-1 bg-[#6D5EF8] rounded-full p-1.5 border border-white/20 flex items-center justify-center gap-0.5 shadow-md">
              <span className="w-1 h-2.5 bg-white rounded-full animate-bounce [animation-delay:0.1s]" />
              <span className="w-1 h-4 bg-white rounded-full animate-bounce [animation-delay:0.3s]" />
              <span className="w-1 h-2.5 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
            </div>
          )}

          {/* Thinking light overlay */}
          {isActive && isThinking && (
            <div className="absolute bottom-1 right-1 bg-amber-500 rounded-full p-1 border border-white/20 animate-pulse flex items-center justify-center shadow-md">
              <span className="text-[10px]">🤔</span>
            </div>
          )}
        </div>

        {/* Recruiter Details Label Overlay */}
        <div className="absolute top-4 left-4 flex flex-col gap-0.5 z-20">
          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider font-mono shadow border transition-colors duration-350 ${
            isActive && isSpeaking
              ? "bg-[#6D5EF8] text-white border-[#8175f9] animate-pulse" 
              : isActive && isThinking
                ? "bg-amber-500 text-white border-amber-400"
                : candidateIsSpeaking
                  ? "bg-emerald-500/90 text-white border-emerald-400"
                  : "bg-slate-900/95 text-slate-400 border-slate-800"
          }`}>
            {isActive && isSpeaking ? "🔴 SPEAKING" : isActive && isThinking ? "⚡ THINKING" : candidateIsSpeaking ? "👂 LISTENING" : "💤 STANDBY"}
          </span>
          <span className="text-[11px] font-bold text-white drop-shadow mt-1">{name}</span>
          <span className="text-[8px] font-mono text-slate-350 drop-shadow">{role}</span>
          
          {/* Cognitive psychological state caption */}
          <span className="text-[8px] font-mono text-indigo-300 drop-shadow mt-1 tracking-tight">
            {getExpressionText()}
          </span>
        </div>

        {/* Bottom Panel Spec Card */}
        <div className="absolute bottom-4 right-4 z-20">
          <span className="text-[8.5px] font-mono bg-slate-900/90 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-md text-indigo-300 font-bold uppercase tracking-wider shadow-sm">
            {focus} FOCUS
          </span>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// WEBCAM STREAM SIMULATOR / DYNAMIC SPECTROGRAM RADAR
// -------------------------------------------------------------
interface WebcamFeedProps {
  cameraOn: boolean;
  onToggleCamera: () => void;
  micOn: boolean;
  onToggleMic: () => void;
  isListening: boolean;
}

function WebcamFeed({ cameraOn, onToggleCamera, micOn, onToggleMic, isListening }: WebcamFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [radialRings, setRadialRings] = useState<number[]>([10, 30, 50, 70]);

  // Handle browser camera acquisition
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
          alert("Could not access your system web camera. Please check your permissions. Showing voice spectrogram diagnostic instead.");
          onToggleCamera(); // revert setting
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

  // Audio Spectrogram Radar Ring Loop
  useEffect(() => {
    let intervalId: number;
    if (isListening) {
      intervalId = setInterval(() => {
        setRadialRings(prev => prev.map(r => {
          const next = r + 3;
          return next > 90 ? 10 : next;
        }));
      }, 60) as any;
    } else {
      setRadialRings([20, 40, 60, 80]);
    }
    return () => clearInterval(intervalId);
  }, [isListening]);

  return (
    <div className="relative bg-slate-950/90 border border-[#27272A]/80 rounded-2xl overflow-hidden aspect-video w-full max-w-sm shrink-0">
      
      {/* Absolute Header Overlay */}
      <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${cameraOn ? 'bg-rose-500 animate-ping' : 'bg-slate-500'}`} />
        <span className="text-[8.5px] font-mono font-bold tracking-wider text-white bg-slate-900/80 px-2 py-0.5 rounded">
          {cameraOn ? "CANDIDATE FEED: REAL" : "CANDIDATE DIAGNOSTIC"}
        </span>
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
        <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-slate-950 text-slate-500 p-4">
          <svg viewBox="0 0 100 100" className="w-24 h-24 stroke-[#6D5EF8]/30 fill-none">
            {radialRings.map((radius, idx) => (
              <circle 
                key={idx} 
                cx="50" 
                cy="50" 
                r={radius} 
                strokeWidth={isListening ? "0.6" : "0.3"} 
                className="transition-all duration-75" 
                style={{ opacity: (100 - radius) / 100 }}
              />
            ))}
            <line x1="50" y1="5" x2="50" y2="95" strokeWidth="0.2" strokeDasharray="3 3" />
            <line x1="5" y1="50" x2="95" y2="50" strokeWidth="0.2" strokeDasharray="3 3" />
            {/* Focal indicator */}
            <circle cx="50" cy="50" r="4" fill={isListening ? "#10B981" : "#4B5563"} className={isListening ? "animate-pulse" : ""} />
          </svg>
          <span className="text-[9px] font-mono text-slate-450 uppercase tracking-widest mt-2">
            {isListening ? "🎤 capturing verbal stream" : "💤 audio detector standby"}
          </span>
        </div>
      )}

      {/* Control Overlay Buttons */}
      <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1.5">
        <button
          onClick={onToggleCamera}
          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
            cameraOn 
              ? "bg-rose-500/10 border-rose-500/30 text-rose-400" 
              : "bg-slate-900/90 border-[#27272A] text-slate-400 hover:text-white"
          }`}
          title={cameraOn ? "Disable Camera" : "Enable Webcam Stream"}
        >
          {cameraOn ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={onToggleMic}
          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
            micOn 
              ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" 
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}
          title={micOn ? "Active Mic" : "Muted"}
        >
          {micOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
        </button>
      </div>

    </div>
  );
}

// -------------------------------------------------------------
// MAIN ACTIVE INTERVIEW EXPERIENCE WORKSPACE
// -------------------------------------------------------------
export default function ActiveInterview({
  questions,
  currentQuestionIndex,
  onNextQuestion,
  onFinishInterview,
  persona,
  companyName,
  roleName,
  interviewerCount = 1
}: ActiveInterviewProps) {
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // Active status
  const [answerText, setAnswerText] = useState("");
  const [duration, setDuration] = useState(0);

  // AI Active state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  // Scratchpad globally stored
  const [scratchNotes, setScratchNotes] = useState(() => {
    return localStorage.getItem("recruiter_session_scratchpad") || "";
  });
  const [notepadOpen, setNotepadOpen] = useState(false);

  const handleScratchNotesChange = (val: string) => {
    setScratchNotes(val);
    localStorage.setItem("recruiter_session_scratchpad", val);
  };

  // Webcam States
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(true);

  // Web Speech synthesis configuration
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [micUnavailable, setMicUnavailable] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState(() => {
    return localStorage.getItem("recruiter_selected_voice") || "";
  });
  const [voiceRate, setVoiceRate] = useState(() => {
    const saved = localStorage.getItem("voice_calibrated_rate");
    return saved ? parseFloat(saved) : 0.93;
  });
  const [voicePitch, setVoicePitch] = useState(() => {
    const saved = localStorage.getItem("voice_calibrated_pitch");
    return saved ? parseFloat(saved) : 0.98;
  });
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

  // Audio Spectrum visual bars
  const [soundBars, setSoundBars] = useState<number[]>([15, 25, 45, 30, 15, 35, 55, 40, 65, 50, 30, 40, 45, 30, 15]);

  // Scrolling live subtitles stream
  const [visibleSubtitle, setVisibleSubtitle] = useState("");

  // Start Elapsed session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format Elapsed clock seconds
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Audio capture bar height animator
  useEffect(() => {
    let animationId: number;
    if (isListening) {
      const updateBars = () => {
        setSoundBars(prev => prev.map(() => Math.floor(Math.random() * 60) + 15));
        animationId = requestAnimationFrame(updateBars);
      };
      updateBars();
    } else {
      setSoundBars([15, 25, 45, 30, 15, 35, 55, 40, 65, 50, 30, 40, 45, 30, 15]);
    }
    return () => cancelAnimationFrame(animationId);
  }, [isListening]);

  // Load Synthesis Voices available
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const loadVoices = () => {
        const available = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith("en"));
        setVoices(available);

        if (available.length > 0) {
          const storedVoice = localStorage.getItem("recruiter_selected_voice");
          const hasStored = storedVoice && available.some(v => v.name === storedVoice);
          if (hasStored) {
            setSelectedVoiceName(storedVoice);
          } else {
            const softDefault = available.find(v => 
              v.name.includes("Natural") || 
              v.name.includes("Google US English") || 
              v.name.includes("Samantha") ||
              v.name.includes("Zira")
            );
            setSelectedVoiceName(softDefault ? softDefault.name : available[0].name);
          }
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Web Speech recognition setup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechClass) {
        const rec = new SpeechClass();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";

        rec.onresult = (event: any) => {
          if (!micOn) return; // Mute check

          let interim = "";
          let final = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          if (final) {
            setAnswerText(prev => (prev.trim() + " " + final).trim());
          }
        };

        rec.onerror = (e: any) => {
          console.warn("Speech recognition error:", e);
          if (e.error === "not-allowed" || e.error === "service-not-allowed") {
            setMicUnavailable(true);
          }
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        setRecognition(rec);
      } else {
        setMicUnavailable(true);
      }
    }
  }, [micOn]);

  // Map 1, 2, or 3 panels based on selection size
  const getPanelConfiguration = () => {
    const list = [
      { id: 0, name: "Sarah Jenkins", role: "HR Manager", focus: "Behavioral", accent: "Friendly & Observant" },
      { id: 1, name: "David Chen", role: "Principal Engineer", focus: "Technical", accent: "Analytical & Detail" },
      { id: 2, name: "Marcus Brody", role: "Hiring Manager", focus: "Leadership", accent: "Strategic & Calm" }
    ];

    if (!interviewerCount || interviewerCount === 1) {
      // Map based on persona
      if (persona === "architect") {
        return [list[1]]; // David
      } else if (persona === "product_leader") {
        return [list[2]]; // Marcus
      } else {
        return [list[0]]; // Sarah
      }
    }

    return list.slice(0, interviewerCount);
  };

  // Rotational schedule determination
  const getSpeakerRotationIdx = () => {
    const panel = getPanelConfiguration();
    if (!panel || panel.length === 0) return 0;
    if (panel.length === 1) {
      return panel[0].id;
    }
    const idx = currentQuestionIndex % panel.length;
    return panel[idx] ? panel[idx].id : 0;
  };

  const activeSpeakerIdx = getSpeakerRotationIdx();

  const currentPanel = getPanelConfiguration();

  // Trigger TTS voice output on question changes
  useEffect(() => {
    if (currentQuestion && voiceEnabled) {
      speakText(currentQuestion.text);
    } else if (currentQuestion) {
      // simulate subtitle generation when voice is silent
      simulateSubtitles(currentQuestion.text);
    }
  }, [currentQuestionIndex]);

  // Simulated subtitle typewriter delay
  const simulateSubtitles = (fullText: string) => {
    setVisibleSubtitle("");
    let curIndex = 0;
    const interval = setInterval(() => {
      curIndex += 4;
      if (curIndex >= fullText.length) {
        setVisibleSubtitle(fullText);
        clearInterval(interval);
      } else {
        setVisibleSubtitle(fullText.substring(0, curIndex));
      }
    }, 45);
    return () => clearInterval(interval);
  };

  // Speaks using browser speech engines, updating animation triggers
  const speakText = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel(); // Stop playing

      // Simulate quick thinking pause first
      setIsThinking(true);
      setIsSpeaking(false);
      setVisibleSubtitle("Thinking...");

      setTimeout(() => {
        setIsThinking(false);
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Dynamic gender-aware voice matching based on the active speaker's profile
        const speakerPanel = currentPanel.find(p => p.id === activeSpeakerIdx) || currentPanel[0];
        const speakerId = speakerPanel ? speakerPanel.id : 0;
        
        let targetVoice = null;
        let availableVoices = voices;
        if (!availableVoices || availableVoices.length === 0) {
          availableVoices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith("en"));
        }
        
        if (availableVoices && availableVoices.length > 0) {
          // Filter English voices
          const enVoices = availableVoices.filter(v => v.lang.toLowerCase().startsWith("en"));
          
          const femaleKeywords = ["samantha", "zira", "karen", "moira", "tessa", "veena", "hazel", "susan", "fiona", "lisa", "amy", "sally", "victoria", "zoe", "female", "woman", "girl", "sara", "jenny", "aria", "siri"];
          const maleKeywords = ["david", "george", "ravi", "richard", "mark", "peter", "daniel", "oliver", "james", "male", "man", "guy", "boy", "alex", "stefan", "microsoft david", "guy", "andrew", "brian", "ryan", "steve"];

          // Score a voice for a target gender
          const getVoiceScore = (voice: SpeechSynthesisVoice, gender: "female" | "male") => {
            const name = voice.name.toLowerCase();
            let score = 0;
            
            // Check gender keywords
            if (gender === "female") {
              const hasFemale = femaleKeywords.some(kw => name.includes(kw));
              const hasMale = maleKeywords.some(kw => name.includes(kw));
              if (hasFemale && !hasMale) score += 50;
              else if (!hasFemale && hasMale) return -100; // Definitely not female
            } else {
              const hasFemale = femaleKeywords.some(kw => name.includes(kw));
              const hasMale = maleKeywords.some(kw => name.includes(kw));
              if (hasMale && !hasFemale) score += 50;
              else if (!hasMale && hasFemale) return -100; // Definitely not male
            }
            
            // Prioritize high-quality natural/neural/google/siri voices
            if (name.includes("natural")) score += 100;
            if (name.includes("neural")) score += 80;
            if (name.includes("google")) score += 50;
            if (name.includes("siri")) score += 50;
            if (name.includes("online")) score += 30;
            
            return score;
          };

          // Find sorted female and male voices
          const femaleVoices = enVoices
            .map(v => ({ voice: v, score: getVoiceScore(v, "female") }))
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(item => item.voice);

          const maleVoices = enVoices
            .map(v => ({ voice: v, score: getVoiceScore(v, "male") }))
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(item => item.voice);

          if (speakerId === 0) {
            // Sarah - Female
            targetVoice = femaleVoices[0] || null;
          } else if (speakerId === 1) {
            // David - Male
            targetVoice = maleVoices[0] || null;
          } else {
            // Marcus - Male (prefer second male voice for variety if available)
            targetVoice = maleVoices.length > 1 ? maleVoices[1] : (maleVoices[0] || null);
          }

          // Fallback if specific matches failed
          if (!targetVoice && selectedVoiceName) {
            targetVoice = availableVoices.find(v => v.name === selectedVoiceName);
          }
          if (!targetVoice) {
            targetVoice = availableVoices[0];
          }
        }

        if (targetVoice) {
          utterance.voice = targetVoice;
        }
        
        utterance.rate = voiceRate;
        utterance.pitch = voicePitch;

        utterance.onstart = () => {
          setIsSpeaking(true);
          simulateSubtitles(text);
        };

        utterance.onend = () => {
          setIsSpeaking(false);
        };

        utterance.onerror = (e) => {
          console.warn("Speech synthesis error:", e);
          setIsSpeaking(false);
          setVisibleSubtitle(text);
        };

        window.speechSynthesis.speak(utterance);
      }, 1200); // 1.2s realistic reflection period

    } else {
      simulateSubtitles(text);
    }
  };

  // Toggle voice streaming listeners
  const toggleListening = () => {
    if (!micOn) {
      alert("Microphone is currently disabled in your virtual interface. Toggle the mic button on your webcam console first!");
      return;
    }
    if (micUnavailable || !recognition) {
      alert("Microphone Speech Recognition is not supported or was blocked by browser permissions. Please type your response directly.");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
      } catch (e) {
        console.error("Failed to acquire Speech Recognition:", e);
      }
    }
  };

  // Propagates active state answer forwards
  const handleAnswerSubmit = () => {
    // Kill playback and active recordings
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (isListening && recognition) {
      recognition.stop();
      setIsListening(false);
    }
    setIsSpeaking(false);

    const currentResponse = answerText.trim() || "[No written response provided. Answered via voice or skipped text typing.]";
    setAnswerText("");

    if (isLastQuestion) {
      onFinishInterview(currentResponse);
    } else {
      onNextQuestion(currentResponse);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Dynamic Session Metadata Banner */}
      <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-[#111827] border border-[#27272A] rounded-2xl gap-4">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Virtual Board Room Live Simulation
            </h3>
            <span className="text-[10px] text-slate-400 block">
              Interviewing with {companyName} for {roleName}
            </span>
          </div>
        </div>

        {/* Global session parameters */}
        <div className="flex flex-wrap items-center gap-4">
          
          <button
            onClick={() => setNotepadOpen(!notepadOpen)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 transition-all cursor-pointer border ${
              notepadOpen 
                ? "bg-[#6D5EF8]/10 text-[#6D5EF8] border-[#6D5EF8]/25" 
                : "bg-slate-900 text-slate-400 border-[#27272A] hover:text-slate-200"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Scratchpad: {notepadOpen ? "COLLAPSE" : "EXPAND"}</span>
          </button>

          <div className="h-8 w-px bg-[#27272A]" />

          <div className="text-center md:text-right">
            <span className="text-[9px] font-mono text-slate-500 uppercase block">ELAPSED TIME</span>
            <span className="text-xs font-bold font-mono text-white flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              {formatTime(duration)}
            </span>
          </div>

          <div className="h-8 w-px bg-[#27272A]" />

          <div className="text-center md:text-right">
            <span className="text-[9px] font-mono text-slate-500 uppercase block">PROGRESSION</span>
            <span className="text-xs font-bold text-indigo-400 font-sans">
              PROMPT {currentQuestionIndex + 1} of {questions.length}
            </span>
          </div>

        </div>
      </div>

      {/* Grid: Main Board Room Platform */}
      <div className={`grid grid-cols-1 ${notepadOpen ? "lg:grid-cols-12" : ""} gap-6`}>
        
        {/* LEFT COMPONENT: The Boardroom Stage & Workdesk */}
        <div className={`${notepadOpen ? "lg:col-span-8" : "w-full"} space-y-6`}>
          
          {/* THE BOARDROOM STAGE (Avatars Video Conference Feed) */}
          <div className="bg-[#09090B] border border-[#27272A] rounded-2xl p-4 md:p-6 space-y-4">
            
            <div className="flex justify-between items-center border-b border-[#27272A] pb-3">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6D5EF8]" />
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                  Recruiter Board Video Streams ({currentPanel.length} Active Members)
                </span>
              </div>
              <span className="text-[8.5px] font-mono bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded text-indigo-300 font-bold uppercase">
                1080P Studio Lighting Enforced
              </span>
            </div>

            {/* Avatars Grid */}
            <div className={`grid gap-4 ${
              currentPanel.length === 1 ? "grid-cols-1 max-w-lg mx-auto" : 
              currentPanel.length === 2 ? "grid-cols-1 md:grid-cols-2" : 
              "grid-cols-1 md:grid-cols-3"
            }`}>
              {currentPanel.map((recruiter) => {
                // Determine if this exact avatar in the panel is the currently designated speaker
                const isSpeakerActive = recruiter.id === activeSpeakerIdx;
                return (
                  <div key={recruiter.id} className="h-60 md:h-64">
                    <HumanAvatar
                      id={recruiter.id}
                      name={recruiter.name}
                      role={recruiter.role}
                      focus={recruiter.focus}
                      isActive={isSpeakerActive}
                      isSpeaking={isSpeakerActive && isSpeaking}
                      isThinking={isSpeakerActive && isThinking}
                      accentColor={recruiter.id === 0 ? "indigo" : recruiter.id === 1 ? "blue" : "emerald"}
                      activeSpeakerIdx={activeSpeakerIdx}
                      candidateIsSpeaking={isListening}
                      interviewerCount={currentPanel.length}
                    />
                  </div>
                );
              })}
            </div>

            {/* Floating Live Subtitles Banner */}
            <div className="p-4 bg-slate-950/90 border border-[#27272A] rounded-xl relative overflow-hidden flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Smile className="w-4.5 h-4.5 text-[#6D5EF8] animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[8.5px] font-mono text-indigo-400 font-bold uppercase tracking-widest block">
                  ACTIVE SPEAKER TRANSCRIPT SUBTITLES:
                </span>
                <p className="text-xs md:text-sm text-slate-100 font-sans italic leading-relaxed mt-1">
                  "{visibleSubtitle || "Standing by for speaker introduction..."}"
                </p>
              </div>
            </div>

          </div>

          {/* CANDIDATE INTERFACE WORKSPACE */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Candidate Mirror Camera console */}
            <div className="md:col-span-5 w-full flex justify-center">
              <WebcamFeed 
                cameraOn={cameraOn}
                onToggleCamera={() => setCameraOn(!cameraOn)}
                micOn={micOn}
                onToggleMic={() => setMicOn(!micOn)}
                isListening={isListening}
              />
            </div>

            {/* Answer control workspace */}
            <div className="md:col-span-7 bg-[#111827] border border-[#27272A] rounded-2xl p-5 space-y-4 w-full">
              
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                <span>VERBAL CAPTURE INTERACTOR</span>
                <span className="text-indigo-400 font-bold">100% SPEECH TO TEXT</span>
              </div>

              {/* Mic capture action */}
              <div className="bg-slate-950 border border-[#27272A] rounded-xl p-4 flex items-center justify-between gap-4">
                <button
                  onClick={toggleListening}
                  className={`p-3 rounded-xl transition-all flex items-center justify-center cursor-pointer shrink-0 border ${
                    isListening
                      ? "bg-rose-500 text-white border-rose-500 animate-pulse scale-[1.03]"
                      : "bg-[#111827] text-slate-300 border-[#27272A] hover:text-white"
                  }`}
                  title={isListening ? "Stop voice recognition" : "Record Voice Answer"}
                >
                  {isListening ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[11px] font-bold text-white truncate">
                    {isListening ? "🎙️ Recording Vocal Stream" : "Mic Standby"}
                  </h4>
                  <p className="text-[8.5px] text-slate-500 mt-0.5 leading-snug">
                    {isListening ? "Processing continuous speech parameters..." : "Click mic to speak answer. Text outputs below."}
                  </p>
                </div>

                {/* Animated sound equalizer */}
                <div className="flex items-end gap-0.5 h-6 shrink-0 w-20 overflow-hidden select-none">
                  {soundBars.map((val, idx) => (
                    <span 
                      key={idx}
                      className={`w-0.5 rounded-full transition-all duration-75 ${isListening ? 'bg-[#6D5EF8]' : 'bg-slate-800'}`}
                      style={{ height: `${val}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="p-3 bg-[#6D5EF8]/5 rounded-xl border border-[#6D5EF8]/10 text-[10px] leading-relaxed text-slate-350 font-mono">
                <span className="text-[#6D5EF8] font-bold">CRITICAL EVALUATION GOAL:</span> {currentQuestion.expectedFocus}
              </div>

              {/* Main Response Area */}
              <div className="space-y-2">
                <label htmlFor="boardroom-response" className="block text-[9px] font-bold uppercase tracking-wider text-slate-450 font-mono">
                  Your Answer Statement
                </label>
                <textarea
                  id="boardroom-response"
                  rows={4}
                  placeholder="Draft your answer text or speak aloud to stream into this terminal field..."
                  className="w-full bg-slate-950 border border-[#27272A] rounded-xl p-3.5 text-xs text-slate-200 placeholder-slate-650 leading-relaxed focus:outline-none focus:border-[#6D5EF8]"
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                />
              </div>

              {/* Action Buttons row */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-3 border-t border-[#27272A]/80">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-[#27272A] rounded-xl text-[9px] font-bold uppercase tracking-wider font-mono flex items-center gap-1 cursor-pointer"
                  >
                    <Sliders className="h-3.5 w-3.5" />
                    <span>Voice Calibration</span>
                  </button>
                  <button
                    onClick={() => {
                      setVoiceEnabled(!voiceEnabled);
                      if (voiceEnabled) window.speechSynthesis.cancel();
                    }}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-xl border border-[#27272A]"
                    title="Audio mute toggle"
                  >
                    {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </button>
                </div>

                <button
                  onClick={handleAnswerSubmit}
                  className="px-5 py-2 bg-[#6D5EF8] hover:bg-[#6D5EF8]/90 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#6D5EF8]/10"
                >
                  <span>{isLastQuestion ? "Consolidate & Fin" : "Next Prompt"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Voice Slider Expandable settings */}
              {showVoiceSettings && (
                <div className="p-4 bg-slate-950 border border-[#27272A] rounded-xl space-y-4 animate-slide-up mt-2">
                  <h4 className="text-[9px] font-bold text-white uppercase font-mono tracking-wider">Voice Adjusters</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[8.5px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">Synthesizer Voice</label>
                      <select
                        value={selectedVoiceName}
                        onChange={(e) => setSelectedVoiceName(e.target.value)}
                        className="w-full bg-[#111827] border border-[#27272A] text-slate-300 rounded-lg p-2 text-[9px] focus:outline-none"
                      >
                        {voices.map(v => (
                          <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[8.5px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">Speaking Speed ({voiceRate}x)</label>
                      <input
                        type="range"
                        min="0.75"
                        max="1.25"
                        step="0.05"
                        value={voiceRate}
                        onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                        className="w-full accent-[#6D5EF8] bg-slate-900 h-1 rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-[8.5px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">Speaking Pitch ({voicePitch})</label>
                      <input
                        type="range"
                        min="0.85"
                        max="1.15"
                        step="0.05"
                        value={voicePitch}
                        onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                        className="w-full accent-[#6D5EF8] bg-slate-900 h-1 rounded"
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

        {/* RIGHT COMPONENT: Scratchpad side-rail */}
        {notepadOpen && (
          <div className="lg:col-span-4 bg-[#111827] border border-[#27272A] rounded-2xl p-5 space-y-4 flex flex-col h-full animate-fade-in">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-[#6D5EF8]" />
                <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">My Board Notepad</h4>
              </div>
              <span className="text-[8px] text-slate-500 font-mono">Auto Persists</span>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed">
              Use this private text pad to outline STAR metrics, write complexity metrics ($O(N \log N)$), or list sharded db tables. It won't be evaluated.
            </p>

            <textarea
              rows={14}
              placeholder="✍️ private blueprint scratchpad...
- STAR: Saturation peaked under massive traffic load.
- Resolution: Integrated redis caching clusters."
              className="w-full bg-slate-950 border border-[#27272A] rounded-xl p-3.5 text-xs text-slate-250 placeholder-slate-650 font-mono leading-relaxed focus:outline-none focus:border-[#6D5EF8] resize-none h-[280px]"
              value={scratchNotes}
              onChange={(e) => handleScratchNotesChange(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (scratchNotes.trim()) {
                    setAnswerText(prev => (prev.trim() + "\n\n" + scratchNotes).trim());
                  }
                }}
                className="py-2 px-3 bg-[#6D5EF8]/10 hover:bg-[#6D5EF8]/20 text-[#6D5EF8] border border-[#6D5EF8]/25 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Append scratchpad contents to answer field"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Add to Answer</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm("Are you sure you want to clear your scratchpad notes?")) {
                    handleScratchNotesChange("");
                  }
                }}
                className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-[#27272A] rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
