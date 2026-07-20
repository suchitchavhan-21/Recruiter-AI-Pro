import React, { useEffect, useState, useRef } from "react";
import { apiFetch } from "../lib/api";
import { 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  VolumeX, 
  Clock, 
  CheckCircle, 
  Play, 
  Pause,
  RotateCcw,
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
  ArrowRight,
  Cpu,
  Users,
  X,
  Pin,
  MonitorUp,
  MoreVertical,
  Phone,
  Hand,
  LayoutDashboard,
  Briefcase,
  BarChart3,
  User,
  Sparkles,
  ChevronRight,
  Settings,
  Search,
  Award,
  Download
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
  currentUser?: any;
  onExitSession?: () => void;
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

interface CandidateVideoCardProps {
  stream: MediaStream | null;
}

function CandidateVideoCard({ stream }: CandidateVideoCardProps) {
  const localRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (localRef.current && stream) {
      localRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) {
    return (
      <div className="absolute inset-0 bg-[#0d0f17] flex flex-col items-center justify-center overflow-hidden">
        {/* Futuristic glowing geometric backdrop */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,#6D5EF8_0%,transparent_70%)] animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '16px 16px', opacity: 0.15 }} />
        
        {/* Video scanner lines */}
        <div className="absolute inset-y-0 left-0 right-0 h-[2px] bg-indigo-500/10 shadow-[0_0_10px_rgba(99,102,241,0.3)] animate-[bounce_5s_infinite_linear] pointer-events-none" />

        {/* Animated holographic waveform/indicator */}
        <div className="relative z-10 flex flex-col items-center text-center p-6 space-y-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse" />
            <div className="w-16 h-16 rounded-full bg-slate-950 border-2 border-indigo-500/50 flex items-center justify-center text-indigo-400 relative z-10 shadow-lg shadow-indigo-500/20">
              <Camera className="w-7 h-7 text-indigo-400 animate-pulse" />
            </div>
            {/* Live blinking recording dot */}
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-400 uppercase bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
              Holographic Cam Feed Active
            </span>
            <p className="text-[11px] text-slate-350 font-sans max-w-[200px] leading-relaxed">
              Your video presence is active and streaming dynamically to the panel.
            </p>
          </div>
        </div>

        {/* Corner framing indicators */}
        <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-indigo-500/40" />
        <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-indigo-500/40" />
        <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-indigo-500/40" />
        <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-indigo-500/40" />
      </div>
    );
  }

  return (
    <video
      ref={localRef}
      autoPlay
      playsInline
      muted
      className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
    />
  );
}

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
        ? "border-[#6D5EF8] ring-2 ring-[#6D5EF8]/30 shadow-2xl shadow-[#6D5EF8]/20 scale-[1.01] z-10" 
        : "border-slate-800/80 opacity-85 hover:opacity-100 hover:border-slate-700"
    }`}>
      {/* Immersive high-fidelity executive boardroom virtual background */}
      <div className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-none bg-slate-950">
        {/* Abstract frosted glass pane dividers simulating a modern corporate office */}
        <div className="absolute inset-y-0 left-1/3 w-px bg-white/5" />
        <div className="absolute inset-y-0 right-1/3 w-px bg-white/5" />
        <div className="absolute h-px inset-x-0 bottom-1/4 bg-white/5" />
        
        {/* Soft corporate brand logo watermark in the background wall */}
        <div className="absolute top-3 right-4 opacity-5 flex items-center gap-1">
          <Activity className="w-3 h-3 text-slate-300" />
          <span className="text-[7px] font-mono tracking-widest text-white uppercase font-bold">RECRUITER BOARD V3</span>
        </div>

        {/* Dynamic ambient studio spotlight glow behind the recruiter */}
        <div 
          className={`absolute inset-0 bg-cover bg-center filter blur-3xl opacity-20 scale-110 transition-all duration-1000 ${
            isActive ? "opacity-35 blur-4xl scale-125" : "opacity-10"
          }`} 
          style={{ backgroundImage: `url(${avatarUrl})` }} 
        />
        
        {/* Gradient overlays */}
        {id === 0 && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent opacity-50" />}
        {id === 1 && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent opacity-50" />}
        {id === 2 && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent opacity-50" />}
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-slate-950/20 to-black/55" />
      </div>

      {/* Main Avatar Canvas Container */}
      <div className="relative w-full h-full flex flex-col justify-center items-center z-10 pb-8 select-none">
        
        {/* Dynamic Studio Framing Halo */}
        <div className={`relative rounded-2xl p-1 transition-all duration-700 ease-out ${
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
          <div className="w-48 h-56 md:w-52 md:h-60 lg:w-56 lg:h-64 rounded-2xl overflow-hidden border border-white/10 bg-[#070b13] shadow-inner relative select-none">
            
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

        {/* Top Bar Indicators (Meet Stream Quality Info) */}
        <div className="absolute top-3 inset-x-3 flex justify-between items-start z-20 pointer-events-none">
          {/* Stream Status Pin */}
          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider font-mono shadow border flex items-center gap-1.5 backdrop-blur-md transition-all duration-350 ${
            isActive && isSpeaking
              ? "bg-indigo-600/90 text-white border-indigo-500 shadow-indigo-600/20" 
              : isActive && isThinking
                ? "bg-amber-500/90 text-white border-amber-400"
                : candidateIsSpeaking
                  ? "bg-emerald-600/90 text-white border-emerald-500"
                  : "bg-slate-950/80 text-slate-400 border-slate-800/80"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              isActive && isSpeaking ? "bg-white animate-ping" : isActive && isThinking ? "bg-white animate-pulse" : candidateIsSpeaking ? "bg-white animate-pulse" : "bg-slate-500"
            }`} />
            <span>{isActive && isSpeaking ? "LIVE SPEAKER" : isActive && isThinking ? "ANALYSIS RUNNING" : candidateIsSpeaking ? "LISTENING" : "STANDBY"}</span>
          </span>

          {/* 1080P HD Status Badge */}
          <span className="text-[7.5px] font-mono font-bold text-slate-400 bg-slate-950/70 backdrop-blur-md border border-slate-800 px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
            <span className="w-1 h-1 rounded-full bg-emerald-500" />
            <span>1080P HD</span>
          </span>
        </div>

        {/* Bottom Floating Google Meet-style Glassmorphic Nameplate */}
        <div className="absolute bottom-3 inset-x-3 z-20 flex justify-between items-end pointer-events-none">
          <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800/85 px-3 py-1.5 rounded-xl flex items-center gap-2 max-w-[85%] shadow-lg shadow-black/30">
            {/* Speaking volume spectrum or muted icon */}
            <div className="flex items-center justify-center w-5 h-5 rounded-lg bg-slate-900/95 border border-slate-800 flex-shrink-0">
              {isActive && isSpeaking ? (
                <div className="flex items-end gap-0.5 h-2.5">
                  <span className="w-0.5 bg-indigo-400 rounded-full animate-bounce h-1.5 [animation-duration:0.6s]" />
                  <span className="w-0.5 bg-indigo-400 rounded-full animate-bounce h-2.5 [animation-duration:0.4s]" />
                  <span className="w-0.5 bg-indigo-400 rounded-full animate-bounce h-1 [animation-duration:0.5s]" />
                </div>
              ) : (
                <MicOff className="w-2.5 h-2.5 text-slate-500" />
              )}
            </div>
            
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white leading-none truncate">{name}</span>
                <span className="text-[7px] font-mono font-bold bg-indigo-500/15 border border-indigo-500/20 text-indigo-300 px-1 rounded uppercase tracking-wider shrink-0">
                  {focus}
                </span>
              </div>
              <span className="text-[9px] text-slate-450 font-mono mt-0.5 leading-none truncate">{role}</span>
            </div>
          </div>

          {/* Cognitive psychological state caption */}
          <div className="hidden sm:block max-w-[45%] text-right bg-slate-950/80 backdrop-blur-sm border border-slate-800 px-2.5 py-1 rounded-lg shadow-sm">
            <span className="text-[8px] font-mono font-semibold text-slate-300 leading-tight block">
              {getExpressionText()}
            </span>
          </div>
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
// DYNAMIC AI COACHING ENGINE HELPER
// -------------------------------------------------------------
const getDynamicCoachFeedback = (questionText: string, roleName: string) => {
  const text = questionText.toLowerCase();
  let concepts = ["STAR response structure", "Concrete metrics of impact", "Core trade-offs", "Collaboration"];
  let starSituation = "Outline the project scope, business context, and the technical complexity.";
  let starAction = "Focus on your individual contributions, decision-making rationales, and design trade-offs.";
  let focusHint = "Sarah is looking for communication clarity. David Chen wants to hear deep-dive architectural trade-offs.";

  if (text.includes("conflict") || text.includes("disagree") || text.includes("team") || text.includes("collaborate")) {
    concepts = ["Empathy", "Active Listening", "Win-Win Resolution", "Post-mortem / Retrospective", "Constructive alignment"];
    starSituation = "Describe a team project where a critical disagreement occurred.";
    starAction = "Explain how you organized a data-backed discussion instead of an emotional debate.";
    focusHint = "Sarah Jenkins is focusing heavily on this behavioral prompt. Keep your tone highly constructive.";
  } else if (text.includes("design") || text.includes("architecture") || text.includes("system") || text.includes("scale") || text.includes("performance")) {
    concepts = ["Caching / CDN", "Database Sharding", "Load Balancing", "Single Point of Failure", "Horizontal scalability"];
    starSituation = "Set the scale target (e.g., 100k DAU) and the performance bottleneck.";
    starAction = "Detail your caching layers, architectural trade-offs, and failure mode mitigation.";
    focusHint = "David Chen is in technical deep-dive mode. Avoid superficial explanations and speak about exact protocols.";
  } else if (text.includes("prioritize") || text.includes("deadline") || text.includes("pressure") || text.includes("fail")) {
    concepts = ["Triage", "Stakeholder management", "Scope reduction", "Milestone tracking", "Post-mortem reflection"];
    starSituation = "Detail a mission-critical release that faced severe resource or timeline pressure.";
    starAction = "Explain your prioritization framework (e.g., Eisenhower Matrix) and scope-negotiation tactics.";
    focusHint = "Marcus Brody is measuring your project management, risk-assessment capacity, and professional maturity.";
  } else if (roleName.toLowerCase().includes("engineer") || roleName.toLowerCase().includes("developer")) {
    concepts = ["Scalability", "Maintainability", "Technical debt", "Unit testing", "CI/CD automation"];
    focusHint = "David Chen is monitoring your software engineering principles. Discuss architectural longevity.";
  }

  return { concepts, starSituation, starAction, focusHint };
};

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

  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [activeDeskTab, setActiveDeskTab] = useState<"type" | "mic">("type");
  const [showEmptyWarning, setShowEmptyWarning] = useState(false);

  const handleGenerateDraft = async () => {
    setIsGeneratingDraft(true);
    setShowEmptyWarning(false);
    try {
      const res = await apiFetch("/api/generate-draft-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: currentQuestion?.text,
          expectedFocus: currentQuestion?.expectedFocus,
          roleName: roleName,
          companyName: companyName,
          persona: persona
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.draftAnswer) {
          setAnswerText(data.draftAnswer);
        }
      }
    } catch (error) {
      console.error("Error generating draft answer:", error);
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  // Simulation State Controls (Part 15-17 Specification)
  const [isPaused, setIsPaused] = useState(false);
  const [activeShareTab, setActiveShareTab] = useState<'agenda' | 'case' | 'resume'>('agenda');
  const [isHandRaised, setIsHandRaised] = useState(false);

  const [isSimulatingSpeech, setIsSimulatingSpeech] = useState(false);
  const [isSimulatingCamera, setIsSimulatingCamera] = useState(false);
  const simulationIntervalRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, []);

  const startSimulatingSpeech = () => {
    setIsSimulatingSpeech(true);
    setIsListening(true);
    
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
    }

    const exemplaryText = `To optimize this high-concurrency systems architecture under 15,000 req/sec peak load, we will implement a multi-layered distributed cache topology using Redis Clusters with write-through caching. To scale database write throughput and prevent legacy locks, we will design a sharded database schema partitioning user records dynamically with consistent hashing. Additionally, to guarantee our target P99 latency SLA under 45ms and provide robust fault tolerance, we'll establish active-active database replication and automated circuit breakers across regions. This preserves transaction durability and scale mitigation.`;
    
    const words = exemplaryText.split(" ");
    let currentWordIdx = 0;
    setAnswerText("");

    simulationIntervalRef.current = setInterval(() => {
      if (currentWordIdx < words.length) {
        setAnswerText(prev => {
          const nextText = prev ? prev + " " + words[currentWordIdx] : words[currentWordIdx];
          return nextText;
        });
        currentWordIdx++;
      } else {
        if (simulationIntervalRef.current) {
          clearInterval(simulationIntervalRef.current);
        }
        setIsSimulatingSpeech(false);
        setIsListening(false);
      }
    }, 280);
  };

  const stopSimulatingSpeech = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
    }
    setIsSimulatingSpeech(false);
    setIsListening(false);
  };

  // AI Active state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  // Scratchpad globally stored
  const [scratchNotes, setScratchNotes] = useState(() => {
    return localStorage.getItem("recruiter_session_scratchpad") || "";
  });
  const [sidebarType, setSidebarType] = useState<"answer" | "coach" | "scorecard" | "notepad" | "participants" | null>("answer");
  const [searchTranscript, setSearchTranscript] = useState("");

  const handleScratchNotesChange = (val: string) => {
    setScratchNotes(val);
    localStorage.setItem("recruiter_session_scratchpad", val);
  };

  // Webcam States
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Manage browser camera acquisition at parent level for Google Meet integration
  useEffect(() => {
    if (cameraOn) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(s => {
          setCameraStream(s);
          setIsSimulatingCamera(false);
        })
        .catch(err => {
          console.warn("Camera permission denied or camera unavailable:", err);
          setIsSimulatingCamera(true);
        });
    } else {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      setIsSimulatingCamera(false);
    }
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraOn]);

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

  // Google Meet High-Fidelity Interactive States
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [pinnedParticipantId, setPinnedParticipantId] = useState<number | string | null>(null);
  const [reactions, setReactions] = useState<Array<{ id: string; emoji: string; left: number; delay: number; sender: string }>>([]);
  const [ccEnabled, setCcEnabled] = useState(true);
  const [showEmojiStrip, setShowEmojiStrip] = useState(false);

  // Start Elapsed session timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPaused) {
        setDuration(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused]);

  // Format Elapsed clock seconds
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Trigger interactive, floating emoji reactions
  const triggerEmojiReaction = (emoji: string, sender: string = "You") => {
    const id = Math.random().toString(36).substring(2, 9);
    const left = Math.floor(Math.random() * 60) + 20; // 20% to 80% to keep it centered
    const newReaction = { id, emoji, left, delay: 0, sender };
    
    setReactions(prev => [...prev, newReaction]);

    // Clean up after 4 seconds
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    }, 4000);

    // If it is the candidate reacting, simulate recruiter reactions
    if (sender === "You") {
      const recruiters = ["Sarah Jenkins", "David Chen", "Marcus Brody"];
      const randomRecruiter = recruiters[Math.floor(Math.random() * recruiters.length)];
      
      // 50% chance recruiter responds with a sympathetic emoji
      if (Math.random() < 0.5) {
        setTimeout(() => {
          const rId = Math.random().toString(36).substring(2, 9);
          const rLeft = Math.floor(Math.random() * 60) + 20;
          // Match with something encouraging
          let recruiterEmoji = emoji;
          if (emoji === "👍") recruiterEmoji = Math.random() < 0.6 ? "👍" : "👏";
          else if (emoji === "👏") recruiterEmoji = Math.random() < 0.6 ? "👏" : "👍";
          else if (emoji === "❤️") recruiterEmoji = "❤️";
          
          setReactions(prev => [...prev, { id: rId, emoji: recruiterEmoji, left: rLeft, delay: 0, sender: randomRecruiter }]);
          
          setTimeout(() => {
            setReactions(prev => prev.filter(r => r.id !== rId));
          }, 4000);
        }, Math.floor(Math.random() * 1000) + 600);
      }
    }
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

  // Custom simulation handlers (Part 15-17 Specification)
  const handleRepeatQuestion = () => {
    if (isPaused) {
      alert("The interview is paused. Please resume first before asking to repeat the question.");
      return;
    }
    if (currentQuestion) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsHandRaised(false); // reset hand-raise state when repeating
      speakText(currentQuestion.text);
    }
  };

  const handleTogglePause = () => {
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    if (nextPaused) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.pause();
      }
      if (isListening && recognition) {
        recognition.stop();
        setIsListening(false);
      }
    } else {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.resume();
      }
    }
  };

  const handleToggleHand = () => {
    if (isPaused) {
      alert("The interview is paused. Please resume first.");
      return;
    }
    const nextHand = !isHandRaised;
    setIsHandRaised(nextHand);
    if (nextHand) {
      // Set subtitles to show active speaker acknowledging the candidate raising hand
      const speakerPanel = currentPanel.find(p => p.id === activeSpeakerIdx) || currentPanel[0];
      setVisibleSubtitle(`${speakerPanel.name}: "Sure, go ahead! Let us know what you want to add or clarify."`);
    } else {
      if (currentQuestion) {
        setVisibleSubtitle(currentQuestion.text);
      }
    }
  };

  const handleEndInterviewEarly = () => {
    if (confirm("Are you sure you want to end the interview early? All completed answers will be evaluated to generate your scoreboard report.")) {
      // Kill playback and active recordings
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (isListening && recognition) {
        recognition.stop();
        setIsListening(false);
      }
      stopSimulatingSpeech();
      setIsSpeaking(false);

      const currentResponse = answerText.trim() || "[No written response provided. Answered via voice or skipped text typing.]";
      setAnswerText("");

      onFinishInterview(currentResponse);
    }
  };

  // Toggle voice streaming listeners
  const toggleListening = () => {
    if (!micOn) {
      alert("Microphone is currently disabled in your virtual interface. Toggle the mic button on your webcam console first!");
      return;
    }

    // Fallback gracefully inside sandbox environments/iframes where browser speech recognition is blocked
    if (micUnavailable || !recognition) {
      if (isSimulatingSpeech) {
        stopSimulatingSpeech();
      } else {
        startSimulatingSpeech();
      }
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
        console.error("Failed to acquire Speech Recognition, falling back to simulated dictation:", e);
        startSimulatingSpeech();
      }
    }
  };

  // Propagates active state answer forwards
  const handleAnswerSubmit = (forceSkip = false) => {
    // If the answer is blank/too short, show the warning first!
    if (!forceSkip && answerText.trim().length < 5) {
      setShowEmptyWarning(true);
      return;
    }

    setShowEmptyWarning(false);

    // Kill playback and active recordings
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (isListening && recognition) {
      recognition.stop();
      setIsListening(false);
    }
    stopSimulatingSpeech();
    setIsSpeaking(false);

    const currentResponse = answerText.trim() || "[No written response provided. Answered via voice or skipped text typing.]";
    setAnswerText("");

    if (isLastQuestion) {
      onFinishInterview(currentResponse);
    } else {
      onNextQuestion(currentResponse);
    }
  };

  const checkSituation = /bottleneck|challenge|problem|legacy|issue|situation|scale|incident|failure|bug/i.test(answerText);
  const checkTask = /task|goal|objective|required|responsibility|target|aimed|expected/i.test(answerText);
  const checkAction = /designed|implemented|sharded|cached|refactored|built|debugged|engineered|profiled|optimized/i.test(answerText);
  const checkResult = /reduced|improved|increased|%|percent|ms|latency|saved|throughput|down|up|speedup/i.test(answerText);

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
      <div className={`grid grid-cols-1 ${sidebarType !== null ? "lg:grid-cols-12" : ""} gap-6`}>
        
        {/* LEFT COMPONENT: The Boardroom Stage & Workdesk */}
        <div className={`${sidebarType !== null ? "lg:col-span-8" : "w-full"} space-y-6`}>
          
          {/* THE BOARDROOM STAGE (Avatars Video Conference Feed - Professional Google Meet Simulation) */}
          <div className="bg-[#0b0c10] border border-[#21232d] rounded-2xl p-4 relative overflow-hidden flex flex-col justify-between min-h-[580px] shadow-2xl">
            
            {/* Custom Keyframe Animations Injector */}
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes floatUp {
                0% {
                  transform: translateY(100%) scale(0.6) rotate(0deg);
                  opacity: 0;
                }
                10% {
                  opacity: 1;
                  transform: translateY(20px) scale(1.1) rotate(5deg);
                }
                90% {
                  opacity: 1;
                }
                100% {
                  transform: translateY(-420px) translateX(var(--drift-x, 25px)) scale(0.85) rotate(-10deg);
                  opacity: 0;
                }
              }
              .animate-float-up {
                animation: floatUp 4.2s cubic-bezier(0.12, 0.85, 0.38, 1) forwards;
              }
              @keyframes pulseRing {
                0% { transform: scale(0.95); opacity: 0.5; }
                50% { transform: scale(1.15); opacity: 0.2; }
                100% { transform: scale(1.35); opacity: 0; }
              }
              .animate-pulse-ring {
                animation: pulseRing 2s cubic-bezier(0.25, 0, 0, 1) infinite;
              }
              @keyframes soundHeight {
                0%, 100% { transform: scaleY(0.25); }
                50% { transform: scaleY(1); }
              }
              .sound-bar-meet {
                animation: soundHeight 0.75s ease-in-out infinite;
                transform-origin: bottom;
              }
              .sound-bar-meet:nth-child(2) { animation-delay: 0.12s; }
              .sound-bar-meet:nth-child(3) { animation-delay: 0.24s; }
              .sound-bar-meet:nth-child(4) { animation-delay: 0.08s; }
            `}} />

            {/* Simulation Paused Overlay */}
            {isPaused && (
              <div className="absolute inset-0 bg-[#09090B]/95 backdrop-blur-md z-40 flex flex-col items-center justify-center text-center p-6 rounded-2xl">
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400 shadow-lg shadow-indigo-500/5">
                  <Pause className="w-8 h-8 animate-pulse" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-wide">Interview Simulation Paused</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-2 font-sans leading-relaxed">
                  The boardroom panel has been temporarily suspended. Active timers, speech feeds, and recruiter breathing cycles are paused.
                </p>
                <button
                  onClick={handleTogglePause}
                  className="mt-6 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-indigo-600/15 border border-indigo-500/30"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume Live Simulation</span>
                </button>
              </div>
            )}

            {/* Google Meet Header Bar */}
            <div className="flex justify-between items-center border-b border-[#1e202b] pb-2.5 mb-3 z-10">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-[9px] font-mono text-rose-400 font-extrabold uppercase tracking-widest">Live Call</span>
                </div>
                <span className="text-slate-400 text-xs font-semibold select-none hidden sm:inline">|</span>
                <span className="text-[11px] font-sans font-bold text-slate-200 truncate max-w-[200px] sm:max-w-xs">
                  Recruiter Board Interview: <span className="text-indigo-400">{companyName}</span> • {roleName}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-[8.5px] font-mono bg-[#1c1e29] border border-[#2d3042] px-2.5 py-0.5 rounded-md text-slate-300 font-bold uppercase tracking-wider">
                  1080P Ultra HD
                </span>
                <span className="text-[8.5px] font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md text-emerald-400 font-bold uppercase">
                  Connected
                </span>
              </div>
            </div>

            {/* Floating Reactions overlay */}
            <div className="absolute inset-x-0 top-12 bottom-16 pointer-events-none z-30 overflow-hidden">
              {reactions.map((r) => (
                <div
                  key={r.id}
                  className="absolute bottom-4 animate-float-up flex flex-col items-center gap-1"
                  style={{ 
                    left: `${r.left}%`,
                    "--drift-x": `${r.left > 50 ? -30 : 30}px`
                  } as React.CSSProperties}
                >
                  <span className="text-4xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">{r.emoji}</span>
                  <div className="px-1.5 py-0.5 bg-black/70 backdrop-blur-sm border border-white/10 rounded-md text-[7px] font-bold text-white font-mono select-none uppercase tracking-wider">
                    {r.sender}
                  </div>
                </div>
              ))}
            </div>

            {/* Google Meet Unified Stage Row/Grid Layout */}
            {(() => {
              // Standard Boardroom Call participants
              const participants = [
                { id: 0, name: "Sarah Jenkins", role: "HR Director", focus: "Culture & EQ", type: "recruiter" as const, accentColor: "indigo" },
                { id: 1, name: "David Chen", role: "Principal Architect", focus: "System Scalability", type: "recruiter" as const, accentColor: "blue" },
                { id: 2, name: "Marcus Brody", role: "VP of Product", focus: "Business Alignment", type: "recruiter" as const, accentColor: "emerald" },
                { id: "candidate", name: "You", role: "Candidate", focus: "Verbal Delivery", type: "candidate" as const, accentColor: "violet" },
                ...(isSharingScreen ? [{ id: "screenshare", name: "You (Screen Presenting)", role: "Live Architecture Blueprint", focus: "System Topology", type: "screenshare" as const, accentColor: "sky" }] : [])
              ];

              const isPinned = pinnedParticipantId !== null;
              const pinnedParticipant = participants.find(p => p.id === pinnedParticipantId);
              const otherParticipants = participants.filter(p => p.id !== pinnedParticipantId);
              const gridClass = participants.length <= 2 
                ? "grid-cols-1 sm:grid-cols-2" 
                : participants.length <= 4 
                  ? "grid-cols-1 sm:grid-cols-2" 
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

              // Sub-renderer for cell items to keep code structured and modular
              const renderParticipantCell = (p: typeof participants[0], isCompact: boolean = false) => {
                const isSarahActive = p.id === 0 && activeSpeakerIdx === 0 && isSpeaking;
                const isDavidActive = p.id === 1 && activeSpeakerIdx === 1 && isSpeaking;
                const isMarcusActive = p.id === 2 && activeSpeakerIdx === 2 && isSpeaking;
                const isRecruiterActiveSpeaker = isSarahActive || isDavidActive || isMarcusActive;
                
                const isCandidateActiveSpeaker = p.id === "candidate" && isListening && micOn;
                const isCellSpeakerActive = isRecruiterActiveSpeaker || isCandidateActiveSpeaker;

                return (
                  <div 
                    key={p.id}
                    className={`relative rounded-2xl bg-[#14161f] border transition-all duration-300 overflow-hidden flex flex-col justify-between group h-full ${
                      isCellSpeakerActive 
                        ? p.id === "candidate" 
                          ? "border-emerald-500 ring-2 ring-emerald-500/30" 
                          : "border-[#6D5EF8] ring-2 ring-[#6D5EF8]/30"
                        : "border-[#1e202b] hover:border-[#35394d]"
                    }`}
                  >
                    {/* Simulated Camera Grain/Shadow overlay */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.01)_0%,rgba(0,0,0,0.15)_100%)] pointer-events-none z-10" />

                    {/* CELL CONTENTS */}
                    <div className="absolute inset-0 z-0">
                      {p.type === "recruiter" && (
                        <div className="w-full h-full scale-[0.98] origin-center">
                          <HumanAvatar
                            id={p.id as number}
                            name={p.name}
                            role={p.role}
                            focus={p.focus}
                            isActive={p.id === activeSpeakerIdx}
                            isSpeaking={p.id === activeSpeakerIdx && isSpeaking}
                            isThinking={p.id === activeSpeakerIdx && isThinking}
                            accentColor={p.id === 0 ? "indigo" : p.id === 1 ? "blue" : "emerald"}
                            activeSpeakerIdx={activeSpeakerIdx}
                            candidateIsSpeaking={isListening}
                            interviewerCount={currentPanel.length}
                          />
                        </div>
                      )}

                      {p.type === "candidate" && (
                        <div className="w-full h-full relative">
                          {cameraOn ? (
                            <CandidateVideoCard stream={cameraStream} />
                          ) : (
                            <div className="absolute inset-0 bg-[#0d0e14] flex flex-col items-center justify-center text-center p-4">
                              <div className="relative mb-3 flex items-center justify-center">
                                {/* Concetric pulsing vocal waves if speaking */}
                                {isListening && micOn && (
                                  <>
                                    <div className="absolute w-24 h-24 rounded-full border border-emerald-500/25 bg-emerald-500/5 animate-pulse-ring" />
                                    <div className="absolute w-32 h-32 rounded-full border border-emerald-500/10 bg-emerald-500/2 animate-pulse-ring" style={{ animationDelay: "0.6s" }} />
                                  </>
                                )}
                                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#1b2a26] to-[#121c19] border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-sans font-bold text-xl tracking-wider shadow-inner z-10">
                                  YOU
                                </div>
                              </div>
                              <span className="text-[10px] font-mono text-slate-400 tracking-wider font-semibold uppercase">Webcam Stream Disabled</span>
                              <span className="text-[8px] font-mono text-slate-500 mt-0.5 max-w-[140px]">Live Spectrometer active on mic feed</span>
                            </div>
                          )}
                        </div>
                      )}

                      {p.type === "screenshare" && (
                        <div className="absolute inset-0 bg-[#090b11] flex flex-col justify-between p-3 select-none">
                          {/* Inner Screen share toolbar */}
                          <div className="flex justify-between items-center bg-[#131722] border border-[#212738] p-1.5 rounded-lg z-10">
                            <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase tracking-wider">💻 Active Screen Presentation</span>
                            <div className="flex gap-1">
                              {(["agenda", "case", "resume"] as const).map((tab) => (
                                <button
                                  key={tab}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveShareTab(tab as any);
                                  }}
                                  className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase transition-all border ${
                                    activeShareTab === tab
                                      ? "bg-indigo-600 border-indigo-500 text-white shadow-sm"
                                      : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
                                  }`}
                                >
                                  {tab === "agenda" ? "Agenda" : tab === "case" ? "Case Scenario" : "Resume"}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Interactive Presentation Content Renderer */}
                          <div className="flex-1 mt-2 bg-[#0d0e15] border border-[#1a1c27] rounded-lg p-2.5 overflow-hidden flex flex-col justify-center text-left">
                            
                            {activeShareTab === "agenda" && (
                              <div className="space-y-3 font-sans h-full flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center gap-1 text-[8px] font-mono text-indigo-400 font-bold uppercase tracking-widest mb-1">
                                    <span>BOARD MEETING AGENDA</span>
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                  </div>
                                  <h3 className="text-sm font-extrabold text-white leading-tight">Executive Assessment Overview</h3>
                                  <p className="text-[10px] text-slate-400 mt-1">Evaluating candidate fit for the {roleName} role.</p>
                                </div>
                                
                                <div className="space-y-2 py-2 border-t border-b border-white/5 flex-1 flex flex-col justify-center">
                                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                                    <span className="font-semibold">1. Strategic fit & leadership potential</span>
                                    <span className="text-[9px] font-mono text-slate-500">Sarah Jenkins</span>
                                  </div>
                                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                                    <span className="font-semibold">2. High-concurrency systems design</span>
                                    <span className="text-[9px] font-mono text-slate-500">David Chen</span>
                                  </div>
                                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                                    <span className="font-semibold">3. Risk triage & SLA prioritization</span>
                                    <span className="text-[9px] font-mono text-slate-500">Marcus Brody</span>
                                  </div>
                                </div>
                                
                                <div className="text-[8px] font-mono text-slate-500 text-center uppercase tracking-wider">
                                  • CONFIDENTIAL • INTERNAL BOARD REVIEW ONLY •
                                </div>
                              </div>
                            )}

                            {activeShareTab === "case" && (
                              <div className="space-y-3 font-sans h-full flex flex-col justify-between">
                                <div>
                                  <div className="text-[8px] font-mono text-indigo-400 font-bold uppercase tracking-widest mb-1">
                                    TECHNICAL SYSTEM PROBE
                                  </div>
                                  <h3 className="text-sm font-extrabold text-white leading-tight">Case Scenario: High-Load Sync</h3>
                                  <p className="text-[9.5px] text-slate-400 mt-1 leading-relaxed">
                                    Let's discuss architectural scale mitigation:
                                  </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-left my-1 flex-1 items-center">
                                  <div className="p-2 bg-slate-900/60 border border-slate-800 rounded-lg">
                                    <span className="text-[7.5px] font-bold text-slate-500 block uppercase">Peak Load Scale</span>
                                    <span className="text-xs font-bold text-slate-200 block mt-0.5">15,000 req/sec</span>
                                  </div>
                                  <div className="p-2 bg-slate-900/60 border border-slate-800 rounded-lg">
                                    <span className="text-[7.5px] font-bold text-slate-500 block uppercase">Target Latency SLA</span>
                                    <span className="text-xs font-bold text-indigo-300 block mt-0.5">P99 &lt; 45ms</span>
                                  </div>
                                  <div className="p-2 bg-slate-900/60 border border-slate-800 rounded-lg">
                                    <span className="text-[7.5px] font-bold text-slate-500 block uppercase">Read vs Write Ratio</span>
                                    <span className="text-xs font-bold text-slate-200 block mt-0.5">90 : 10</span>
                                  </div>
                                  <div className="p-2 bg-slate-900/60 border border-slate-800 rounded-lg">
                                    <span className="text-[7.5px] font-bold text-slate-500 block uppercase">Fault Tolerance</span>
                                    <span className="text-xs font-bold text-rose-400 block mt-0.5">Active-Active Sync</span>
                                  </div>
                                </div>

                                <p className="text-[9px] text-slate-500 italic text-center">
                                  Note down key trade-offs in write durability vs partition availability.
                                </p>
                              </div>
                            )}

                            {activeShareTab === "resume" && (
                              <div className="space-y-2 font-sans h-full flex flex-col justify-between">
                                <div className="border-b border-white/5 pb-1.5">
                                  <div className="flex justify-between items-center text-[8px] font-mono text-indigo-400 font-bold uppercase tracking-widest">
                                    <span>RESUME PROFILE</span>
                                    <span className="text-slate-500">CANDIDATE_ID: 98412</span>
                                  </div>
                                  <h3 className="text-sm font-extrabold text-white leading-tight">Software Engineering Professional</h3>
                                </div>

                                <div className="space-y-1.5 flex-1 flex flex-col justify-center text-[10px] text-slate-300">
                                  <div>
                                    <span className="font-bold text-white uppercase text-[8.5px] tracking-wider text-indigo-300 block">PROFESSIONAL EXPERIENCE</span>
                                    <p className="font-semibold leading-tight">Senior Full-Stack Engineer • Tech Solutions Inc.</p>
                                    <p className="text-[9px] text-slate-400">Built high-concurrency Node/TypeScript APIs handling 5k+ concurrent users. Optimized SQL queries to reduce latencies by 40%.</p>
                                  </div>
                                  <div>
                                    <span className="font-bold text-white uppercase text-[8.5px] tracking-wider text-indigo-300 block mt-1">CORE TECHNICAL SKILLS</span>
                                    <p className="text-slate-400 font-mono text-[9px] leading-relaxed">TypeScript, Node.js, React, Distributed Systems, SQL/NoSQL Databases, Cloud Architectures</p>
                                  </div>
                                </div>

                                <div className="text-[8px] font-mono text-slate-500 border-t border-white/5 pt-1 text-center">
                                  Reviewing relevant credentials for {roleName} matching criteria.
                                </div>
                              </div>
                            )}

                          </div>
                        </div>
                      )}
                    </div>

                    {/* TOP-RIGHT INDICATORS CARD OVERLAY */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-20">
                      
                      {/* Speaker Volume/Mic active indicator */}
                      <div className="w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center select-none shadow-md">
                        {p.type === "recruiter" && (
                          (p.id === activeSpeakerIdx && isSpeaking) ? (
                            <div className="flex items-end gap-0.5 h-3">
                              <div className="w-0.5 h-full bg-indigo-400 sound-bar-meet" />
                              <div className="w-0.5 h-full bg-indigo-400 sound-bar-meet" />
                              <div className="w-0.5 h-full bg-indigo-400 sound-bar-meet" />
                              <div className="w-0.5 h-full bg-indigo-400 sound-bar-meet" />
                            </div>
                          ) : (
                            <Mic className="w-3 h-3 text-emerald-400" />
                          )
                        )}
                        {p.type === "candidate" && (
                          (!micOn) ? (
                            <MicOff className="w-3 h-3 text-rose-500" />
                          ) : isListening ? (
                            <div className="flex items-end gap-0.5 h-3">
                              <div className="w-0.5 h-full bg-emerald-400 sound-bar-meet" />
                              <div className="w-0.5 h-full bg-emerald-400 sound-bar-meet" />
                              <div className="w-0.5 h-full bg-emerald-400 sound-bar-meet" />
                              <div className="w-0.5 h-full bg-emerald-400 sound-bar-meet" />
                            </div>
                          ) : (
                            <Mic className="w-3 h-3 text-slate-400" />
                          )
                        )}
                        {p.type === "screenshare" && (
                          <MonitorUp className="w-3 h-3 text-indigo-400 animate-pulse" />
                        )}
                      </div>

                      {/* Google Meet Pin/Unpin circular action */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPinnedParticipantId(pinnedParticipantId === p.id ? null : p.id);
                        }}
                        title={pinnedParticipantId === p.id ? "Unpin participant from centerpiece" : "Pin participant as centerpiece"}
                        className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer border transition-all shadow-md ${
                          pinnedParticipantId === p.id
                            ? "bg-indigo-600 border-indigo-500 text-white"
                            : "bg-black/50 border-white/10 text-slate-400 hover:text-white hover:bg-black/70"
                        }`}
                      >
                        <Pin className="w-3 h-3" />
                      </button>

                    </div>

                    {/* BOTTOM-LEFT NAME/ROLE TRANSITIONAL OVERLAY */}
                    <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-sm border border-white/10 px-2.5 py-1 rounded-lg flex items-center gap-1.5 max-w-[85%] z-20 shadow-md">
                      {p.id === "candidate" && isHandRaised && (
                        <span className="text-[10px] animate-bounce shrink-0">✋</span>
                      )}
                      {p.id === activeSpeakerIdx && p.type === "recruiter" && isSpeaking && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping shrink-0" />
                      )}
                      <div className="truncate text-left">
                        <span className="text-[9.5px] font-sans font-bold text-white block leading-tight truncate">
                          {p.name}
                        </span>
                        <span className="text-[7.5px] font-mono text-slate-400 uppercase tracking-widest block leading-none mt-0.5 truncate">
                          {p.role} {p.focus ? `• ${p.focus}` : ""}
                        </span>
                      </div>
                    </div>

                  </div>
                );
              };

              // RENDERING MODE: 1. PINNED SPLIT SCREEN MODE
              if (isPinned && pinnedParticipant) {
                return (
                  <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-[460px] relative z-10">
                    {/* CENTER PIECE (Pinned Participant takes cinematic block) */}
                    <div className="flex-1 min-h-[360px] md:min-h-0 relative">
                      {renderParticipantCell(pinnedParticipant, false)}
                    </div>

                    {/* SIDEBAR STRIP (Horizontal on mobile, vertical column on desktop) */}
                    <div className="flex flex-row md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[140px] md:max-h-[460px] shrink-0 w-full md:w-[200px] p-0.5">
                      {otherParticipants.map((op) => (
                        <div key={op.id} className="w-[180px] md:w-full h-[105px] shrink-0">
                          {renderParticipantCell(op, true)}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              // RENDERING MODE: 2. STANDARD RESPONSIVE GRID MODE
              return (
                <div className={`grid gap-4 flex-1 min-h-[460px] relative z-10 ${gridClass}`}>
                  {participants.map((p) => (
                    <div key={p.id} className="min-h-[220px] h-full">
                      {renderParticipantCell(p, false)}
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Closed Captions Live Overlay (Google Meet Style CC Display) */}
            {ccEnabled && (
              <div className="px-5 py-3 mt-3 bg-slate-950/80 backdrop-blur-sm border border-[#1e202b] rounded-xl text-left z-20 mx-auto max-w-2xl w-full">
                <div className="flex items-center gap-1.5 mb-1 select-none">
                  <span className="text-[8px] font-mono text-[#6D5EF8] font-bold uppercase tracking-widest">Active Speaker CC:</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-[11.5px] text-slate-100 font-sans italic leading-relaxed">
                  "{visibleSubtitle || "Standing by for board conversation..."}"
                </p>
              </div>
            )}

            {/* GOOGLE MEET CENTRAL CONTROL CONSOLE (Professional Circular Button Tray) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 bg-[#202124] border border-white/5 p-3.5 rounded-xl z-20">
              
              {/* Left-hand Room details */}
              <div className="flex items-center gap-3 text-left select-none text-white text-xs font-sans font-medium">
                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-white/30">|</span>
                <span className="font-mono tracking-wider text-slate-300">meet-room-sfg</span>
              </div>

              {/* Central Round Buttons Tray */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                
                {/* Microphone Toggle */}
                <button
                  type="button"
                  onClick={() => setMicOn(!micOn)}
                  title={micOn ? "Mute Microphone" : "Unmute Microphone"}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
                    micOn 
                      ? "bg-[#3c4043] border-[#5f6368]/30 text-white hover:bg-[#4c5053]" 
                      : "bg-[#ea4335] border-transparent text-white hover:bg-[#f24e3e]"
                  }`}
                >
                  {micOn ? <Mic className="w-4.5 h-4.5" /> : <MicOff className="w-4.5 h-4.5" />}
                </button>

                {/* Camera Toggle */}
                <button
                  type="button"
                  onClick={() => setCameraOn(!cameraOn)}
                  title={cameraOn ? "Disable Camera Feed" : "Enable Camera Feed"}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
                    cameraOn 
                      ? "bg-[#3c4043] border-[#5f6368]/30 text-white hover:bg-[#4c5053]" 
                      : "bg-[#ea4335] border-transparent text-white hover:bg-[#f24e3e]"
                  }`}
                >
                  {cameraOn ? <Camera className="w-4.5 h-4.5" /> : <CameraOff className="w-4.5 h-4.5" />}
                </button>

                {/* Closed Captions CC Toggle */}
                <button
                  type="button"
                  onClick={() => setCcEnabled(!ccEnabled)}
                  title={ccEnabled ? "Disable Closed Captions" : "Enable Closed Captions"}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer border font-bold text-xs ${
                    ccEnabled 
                      ? "bg-[#8ab4f8] border-transparent text-[#202124] hover:bg-[#aecbfa]" 
                      : "bg-[#3c4043] border-[#5f6368]/30 text-white hover:bg-[#4c5053]"
                  }`}
                >
                  CC
                </button>

                {/* Raise Hand Toggle */}
                <button
                  type="button"
                  onClick={handleToggleHand}
                  title={isHandRaised ? "Lower Hand" : "Raise Hand"}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer border text-lg ${
                    isHandRaised 
                      ? "bg-[#fbbc04] border-transparent text-[#202124] hover:bg-[#fcd35c]" 
                      : "bg-[#3c4043] border-[#5f6368]/30 text-white hover:bg-[#4c5053]"
                  }`}
                >
                  ✋
                </button>

                {/* Present Screen Toggle */}
                <button
                  type="button"
                  onClick={() => setIsSharingScreen(!isSharingScreen)}
                  title={isSharingScreen ? "Stop Presenting Screen" : "Share/Present Desktop Screen"}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
                    isSharingScreen 
                      ? "bg-[#81c995] border-transparent text-[#202124] hover:bg-[#a8dab5]" 
                      : "bg-[#3c4043] border-[#5f6368]/30 text-white hover:bg-[#4c5053]"
                  }`}
                >
                  <MonitorUp className="w-4.5 h-4.5" />
                </button>

                {/* Reactions Pop-up Smile Switch */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEmojiStrip(!showEmojiStrip)}
                    title="Send Emoji Reaction"
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
                      showEmojiStrip 
                        ? "bg-[#8ab4f8] border-transparent text-[#202124]" 
                        : "bg-[#3c4043] border-[#5f6368]/30 text-white hover:bg-[#4c5053]"
                    }`}
                  >
                    <Smile className="w-4.5 h-4.5" />
                  </button>

                  {/* Emoji Reaction Strip */}
                  {showEmojiStrip && (
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-[#202124] border border-white/10 p-2 rounded-full flex gap-1.5 shadow-2xl z-50 animate-bounce-short">
                      {(["👍", "👏", "❤️", "😂", "😮", "🎉"] as const).map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            triggerEmojiReaction(emoji);
                            setShowEmojiStrip(false);
                          }}
                          className="w-8 h-8 text-base flex items-center justify-center hover:scale-125 hover:bg-white/10 rounded-full transition-all cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Voice Setting ellipse switch */}
                <button
                  type="button"
                  onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                  title="Calibrate Board Audio"
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
                    showVoiceSettings 
                      ? "bg-[#8ab4f8] border-transparent text-[#202124]" 
                      : "bg-[#3c4043] border-[#5f6368]/30 text-white hover:bg-[#4c5053]"
                  }`}
                >
                  <MoreVertical className="w-4.5 h-4.5" />
                </button>

                {/* Repeat voice prompt */}
                <button
                  type="button"
                  onClick={handleRepeatQuestion}
                  title="Repeat the board members last prompt"
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer border bg-[#3c4043] border-[#5f6368]/30 text-white hover:bg-[#4c5053]"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Hang-Up Red Leave Meeting Button */}
                <button
                  type="button"
                  onClick={handleEndInterviewEarly}
                  title="Hang Up and Terminate Meeting early"
                  className="w-14 h-10 rounded-full bg-[#ea4335] text-white hover:bg-[#f24e3e] transition-all cursor-pointer flex items-center justify-center shadow-lg shadow-rose-600/10 ml-1"
                >
                  <Phone className="w-5 h-5 rotate-[135deg]" />
                </button>

              </div>

              {/* Right-hand Sidebar selectors (Authentic Google Meet Sidebar Toggles) */}
              <div className="flex items-center gap-2">
                
                {/* Answer worksheet toggle */}
                <button
                  type="button"
                  onClick={() => setSidebarType(sidebarType === "answer" ? null : "answer")}
                  title="Toggle Answer Board Worksheet"
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer border relative ${
                    sidebarType === "answer" 
                      ? "bg-[#8ab4f8] border-transparent text-[#202124]" 
                      : "bg-transparent border-[#5f6368]/30 text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>

                {/* AI Coach tab toggle */}
                <button
                  type="button"
                  onClick={() => setSidebarType(sidebarType === "coach" ? null : "coach")}
                  title="Toggle AI Coach STAR Real-time Assistant"
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
                    sidebarType === "coach" 
                      ? "bg-[#8ab4f8] border-transparent text-[#202124]" 
                      : "bg-transparent border-[#5f6368]/30 text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Cpu className="w-4 h-4" />
                </button>

                {/* Private Notes Scratchpad toggle */}
                <button
                  type="button"
                  onClick={() => setSidebarType(sidebarType === "notepad" ? null : "notepad")}
                  title="Toggle Private Scratchpad Notepad"
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
                    sidebarType === "notepad" 
                      ? "bg-[#8ab4f8] border-transparent text-[#202124]" 
                      : "bg-transparent border-[#5f6368]/30 text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                </button>

                {/* Board members biography toggle */}
                <button
                  type="button"
                  onClick={() => setSidebarType(sidebarType === "participants" ? null : "participants")}
                  title="Toggle Board Member Profiles"
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer border relative ${
                    sidebarType === "participants" 
                      ? "bg-[#8ab4f8] border-transparent text-[#202124]" 
                      : "bg-transparent border-[#5f6368]/30 text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 bg-[#8ab4f8] text-[#202124] text-[8px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-[#202124]">
                    {currentPanel.length + 1}
                  </span>
                </button>

              </div>

            </div>

            {/* INTERACTIVE CANDIDATE DESK CONSOLE (Dual Answer Channel & AI Prompt Station) */}
            <div className="bg-[#18181B] border border-[#2A2F3A] rounded-2xl p-5 space-y-4 shadow-xl relative overflow-hidden text-left">
              
              {/* Subtle visual accent line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-[#6D5EF8] to-emerald-500" />
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1.5 border-b border-[#2A2F3A]/60">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6D5EF8]"></span>
                  </span>
                  <span className="text-[10px] font-bold font-mono text-slate-300 uppercase tracking-widest">
                    Candidate Desk Console • Active Workspace
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <span className="text-[9px] font-mono text-slate-500 uppercase">Question Format:</span>
                  <span className={`px-2 py-0.5 rounded text-[8.5px] font-bold font-mono uppercase tracking-wider ${
                    currentQuestion?.type === "technical" 
                      ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" 
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}>
                    {currentQuestion?.type}
                  </span>
                </div>
              </div>

              {/* Active Question Prompt */}
              <div className="bg-[#111827]/90 border border-[#2A2F3A] rounded-xl p-4 relative">
                <div className="absolute top-2 right-3 text-[8.5px] font-mono text-slate-500 font-semibold uppercase tracking-wider">
                  Prompt {currentQuestionIndex + 1} of {questions.length}
                </div>
                <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase tracking-wider block mb-1">
                  Active Interviewer Query
                </span>
                <p className="text-sm font-medium text-white leading-relaxed font-sans">
                  "{currentQuestion?.text}"
                </p>
                <div className="mt-2 text-[9.5px] font-mono text-slate-400 leading-relaxed">
                  <span className="text-[#6D5EF8] font-bold">Focus Area:</span> {currentQuestion?.expectedFocus}
                </div>
              </div>

              {/* Answering Controls Wrapper */}
              <div className="space-y-3">
                
                {/* Tabs to Choose Method & Auto-Draft Helper */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 p-1.5 rounded-xl border border-[#2A2F3A]/50">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDeskTab("type");
                        setShowEmptyWarning(false);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeDeskTab === "type"
                          ? "bg-[#6D5EF8] text-white shadow-md font-semibold"
                          : "bg-transparent text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Write / Edit Answer</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDeskTab("mic");
                        setShowEmptyWarning(false);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeDeskTab === "mic"
                          ? "bg-[#6D5EF8] text-white shadow-md font-semibold"
                          : "bg-transparent text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>Speak Answer (Mic)</span>
                    </button>
                  </div>

                  {/* Auto-Draft AI Answer Button */}
                  <button
                    type="button"
                    onClick={handleGenerateDraft}
                    disabled={isGeneratingDraft}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed shrink-0"
                    title="If you are unsure of the technical concepts, click to draft a polished expert-level answer to learn from or customize."
                  >
                    <Sparkles className={`w-3.5 h-3.5 text-indigo-300 ${isGeneratingDraft ? "animate-spin" : ""}`} />
                    <span>{isGeneratingDraft ? "Drafting with AI..." : "💡 Auto-Draft AI Answer"}</span>
                  </button>
                </div>

                {/* Tab Content 1: TYPE ANSWER */}
                {activeDeskTab === "type" && (
                  <div className="space-y-2 animate-fade-in">
                    <textarea
                      id="candidate-desk-text-answer"
                      rows={5}
                      placeholder="Type your structured answer here. Use STAR layout (Situation, Task, Action, Result) for behavioral, or list exact protocols and trade-offs for technical system questions..."
                      value={answerText}
                      onChange={(e) => {
                        setAnswerText(e.target.value);
                        if (e.target.value.trim().length >= 5) {
                          setShowEmptyWarning(false);
                        }
                      }}
                      className="w-full bg-slate-950 border border-[#2A2F3A] rounded-xl p-4 text-xs text-slate-100 placeholder-slate-600 leading-relaxed focus:outline-none focus:border-[#6D5EF8] focus:ring-1 focus:ring-[#6D5EF8]/30 transition-all font-mono"
                    />
                    
                    {/* Character and word counters */}
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono px-1">
                      <div className="flex gap-3">
                        <span>Words: {answerText.trim() === "" ? 0 : answerText.trim().split(/\s+/).length}</span>
                        <span>Characters: {answerText.length}</span>
                      </div>
                      
                      {/* Live Framework indicator checklist */}
                      <div className="flex gap-2">
                        <span className={`transition-all ${checkSituation ? "text-emerald-400 font-semibold" : "text-slate-600"}`}>[S] Situation</span>
                        <span className={`transition-all ${checkTask ? "text-emerald-400 font-semibold" : "text-slate-600"}`}>[T] Task</span>
                        <span className={`transition-all ${checkAction ? "text-emerald-400 font-semibold" : "text-slate-600"}`}>[A] Action</span>
                        <span className={`transition-all ${checkResult ? "text-[#6D5EF8] font-semibold" : "text-slate-600"}`}>[R] Result</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab Content 2: MIC VOICE ANSWER */}
                {activeDeskTab === "mic" && (
                  <div className="bg-slate-950 border border-[#2A2F3A] rounded-xl p-5 flex flex-col items-center justify-center space-y-4 animate-fade-in relative overflow-hidden min-h-[140px]">
                    
                    {/* Visual Spectrometer background overlay */}
                    {isListening && (
                      <div className="absolute inset-0 opacity-10 flex items-center justify-around select-none pointer-events-none">
                        {soundBars.map((val, idx) => (
                          <div
                            key={idx}
                            className="w-1.5 bg-[#6D5EF8] rounded-full transition-all duration-75"
                            style={{ height: `${val * 1.5}%` }}
                          />
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-5 z-10 w-full max-w-md text-left">
                      <button
                        type="button"
                        onClick={toggleListening}
                        className={`p-5 rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer shrink-0 border-2 ${
                          isListening
                            ? "bg-rose-500 border-rose-400 text-white animate-pulse scale-[1.05] shadow-lg shadow-rose-500/20"
                            : "bg-[#111827] border-[#2A2F3A] text-slate-300 hover:text-white hover:border-[#6D5EF8]"
                        }`}
                        title={isListening ? "Pause microphone recording" : "Record your vocal answer statement"}
                      >
                        {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-white">
                            {isListening ? "🔴 Live Microphone Capture" : "Speech-to-Text Terminal Mode"}
                          </h4>
                          {isListening && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                          {isListening 
                            ? "Streaming continuous verbal frames. Talk naturally. Your statement will transcribe below in real-time." 
                            : "Click the circle mic icon to start speaking. Ensure your hardware is active."}
                        </p>
                      </div>
                    </div>

                    {/* Continuous Live Transcript Box */}
                    <div className="w-full bg-[#111827] border border-[#2A2F3A]/70 rounded-lg p-3 text-left">
                      <span className="text-[8.5px] font-mono text-slate-500 block uppercase mb-1">
                        Live Speech Transcript
                      </span>
                      <p className="text-[11px] font-mono text-slate-300 min-h-[36px] max-h-[80px] overflow-y-auto leading-relaxed">
                        {answerText || (
                          <span className="text-slate-600 italic">No verbal stream received yet. Toggle mic to start speaking your answer.</span>
                        )}
                      </p>
                    </div>

                  </div>
                )}

              </div>

              {/* EMPTY ANSWER PREVENTATIVE WARNING SCREEN (Directly addresses empty-scoring concerns!) */}
              {showEmptyWarning && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-3 animate-fade-in text-left">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-rose-400">Empty Evaluation Warning</h4>
                      <p className="text-[10.5px] text-slate-350 leading-relaxed mt-0.5">
                        You have not typed or recorded an answer yet. Submitting a blank or very brief response will evaluate this question as <span className="text-rose-400 font-semibold">"Skipped" (0% score)</span> and lower your overall simulated hiring panel rating.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 pt-1.5 pl-6.5">
                    <button
                      type="button"
                      onClick={handleGenerateDraft}
                      disabled={isGeneratingDraft}
                      className="px-3 py-1 text-[10.5px] font-semibold bg-[#6D5EF8] text-white hover:bg-opacity-90 transition-all rounded-lg cursor-pointer flex items-center gap-1 shadow-md"
                    >
                      <Sparkles className="w-3 h-3 animate-pulse" />
                      <span>{isGeneratingDraft ? "Generating..." : "Generate AI Answer Suggestion"}</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleAnswerSubmit(true)}
                      className="px-3 py-1 text-[10.5px] font-medium bg-transparent text-slate-400 hover:text-rose-400 transition-all rounded-lg cursor-pointer hover:underline"
                    >
                      Submit Blank & Skip
                    </button>
                  </div>
                </div>
              )}

              {/* Footer Panel with Complete Action */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#2A2F3A]/60">
                <div className="text-[9.5px] text-slate-450 font-mono text-center sm:text-left leading-normal">
                  💡 <span className="text-slate-350 font-medium">Stuck?</span> Use the <span className="text-indigo-400 font-bold">Auto-Draft</span> helper to get an expert draft, customize it, and submit!
                </div>
                
                <button
                  type="button"
                  onClick={() => handleAnswerSubmit(false)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-[#6D5EF8] text-white hover:bg-[#5b4fe3] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#6D5EF8]/10 group shrink-0"
                >
                  <span>{isLastQuestion ? "Finish Interview & Run Evaluation" : "Submit Answer & Next Question"}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>

            </div>

            {/* BOTTOM DASHBOARD: Three Equal Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              
              {/* Card 1: Interview Progress */}
              <div className="bg-[#18181B] border border-[#2A2F3A] rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="text-[10px] font-bold font-mono text-[#FAFAFA] uppercase tracking-wider">Interview Progress</span>
                    <span className="text-[10px] font-mono text-indigo-400 font-bold">{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: "Board Introduction", idx: 0 },
                      { name: "Behavioral Calibration", idx: 1 },
                      { name: "Technical Architecture Deep-dive", idx: 2 },
                      { name: "SLA Risk & Scale Analysis", idx: 3 },
                      { name: "Consolidated Debrief", idx: 4 }
                    ].map((step, sIdx) => {
                      const isCompleted = currentQuestionIndex > step.idx;
                      const isActive = currentQuestionIndex === step.idx;
                      return (
                        <div key={sIdx} className="flex items-center gap-2.5">
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[8px] font-bold ${
                            isCompleted 
                              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" 
                              : isActive 
                                ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-400 animate-pulse" 
                                : "bg-slate-950 border-slate-800 text-slate-600"
                          }`}>
                            {isCompleted ? "✓" : sIdx + 1}
                          </span>
                          <span className={`text-[10px] truncate ${isActive ? "text-white font-semibold" : "text-slate-400 font-light"}`}>
                            {step.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800/60">
                    <div 
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Live Transcript */}
              <div className="bg-[#18181B] border border-[#2A2F3A] rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold font-mono text-[#FAFAFA] uppercase tracking-wider">Live Transcript</span>
                    <button
                      type="button"
                      onClick={() => {
                        const conversation = [
                          "Sarah Johnson: Welcome to your virtual boardroom simulation.",
                          ...questions.slice(0, currentQuestionIndex).map((q, idx) => `Interviewer: ${q.text}\nYou: Answer submitted.`),
                          `Interviewer: ${currentQuestion.text}`,
                          `You: ${answerText || "(Drafting...)"}`
                        ].join("\n\n");
                        navigator.clipboard.writeText(conversation);
                        alert("Conversation transcript copied to clipboard!");
                      }}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Copy full transcript"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="mb-2">
                    <input 
                      type="text" 
                      value={searchTranscript} 
                      onChange={(e) => setSearchTranscript(e.target.value)} 
                      placeholder="Search live conversation..." 
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1 px-2 text-[9px] text-slate-300 focus:outline-none focus:border-[#6D5EF8]" 
                    />
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto max-h-[110px] pr-1 space-y-2 text-[9.5px] leading-relaxed font-sans text-left mt-1 border-t border-slate-900 pt-2">
                  {[
                    { speaker: "Sarah Johnson", text: "Welcome to your virtual boardroom simulation. We are evaluating your strategic scalability under executive parameters." },
                    ...questions.slice(0, currentQuestionIndex).map((q, idx) => ({
                      speaker: idx === 1 ? "David Chen" : idx === 2 ? "Marcus Williams" : "Sarah Johnson",
                      text: q.text
                    })),
                    { speaker: currentQuestionIndex === 1 ? "David Chen" : currentQuestionIndex === 2 ? "Marcus Williams" : "Sarah Johnson", text: currentQuestion.text },
                    ...(answerText ? [{ speaker: "You (Candidate)", text: answerText }] : [])
                  ]
                    .filter(row => !searchTranscript || row.text.toLowerCase().includes(searchTranscript.toLowerCase()) || row.speaker.toLowerCase().includes(searchTranscript.toLowerCase()))
                    .map((msg, mIdx) => (
                      <div key={mIdx} className="space-y-0.5 border-b border-slate-900/40 pb-1.5 last:border-b-0">
                        <span className={`font-mono text-[8px] font-bold uppercase tracking-wider block ${
                          msg.speaker.includes("You") 
                            ? "text-emerald-400" 
                            : msg.speaker.includes("Sarah") 
                              ? "text-purple-400" 
                              : msg.speaker.includes("David") 
                                ? "text-blue-400" 
                                : "text-amber-400"
                        }`}>{msg.speaker}</span>
                        <p className="text-slate-300 italic">"{msg.text}"</p>
                      </div>
                    ))}
                </div>
              </div>

              {/* Card 3: Interview Insights */}
              <div className="bg-[#18181B] border border-[#2A2F3A] rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="text-[10px] font-bold font-mono text-[#FAFAFA] uppercase tracking-wider">Dynamic Evaluators</span>
                    <span className="text-[8px] font-mono text-slate-500 uppercase">Live Metrics</span>
                  </div>
                  
                  <div className="space-y-2.5">
                    {[
                      { name: "Clarity & Delivery", val: 88, color: "bg-indigo-500" },
                      { name: "Problem Solving Depth", val: 85, color: "bg-purple-500" },
                      { name: "Technical Precision", val: answerText.toLowerCase().includes("shard") || answerText.toLowerCase().includes("scale") ? 92 : 80, color: "bg-blue-500" },
                      { name: "Executive Confidence", val: Math.round(88 + Math.sin(duration * 0.05) * 4), color: "bg-emerald-500" }
                    ].map((metric, metIdx) => (
                      <div key={metIdx} className="space-y-1">
                        <div className="flex justify-between text-[9px] font-mono text-slate-400">
                          <span>{metric.name}</span>
                          <span className="font-bold text-white">{metric.val}%</span>
                        </div>
                        <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
                          <div 
                            className={`${metric.color} h-full rounded-full transition-all duration-500`} 
                            style={{ width: `${metric.val}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* RIGHT COMPONENT: Unified Multi-tab Sidebar */}
        {sidebarType !== null && (
          <div className="lg:col-span-4 bg-[#111827] border border-[#27272A] rounded-2xl p-5 space-y-4 flex flex-col h-full animate-fade-in">
            
            {/* Header Tabs switcher */}
            <div className="flex border-b border-[#27272A] pb-2.5 gap-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setSidebarType("answer")}
                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider font-mono flex items-center gap-1 transition-all cursor-pointer border shrink-0 ${
                  sidebarType === "answer"
                    ? "bg-[#6D5EF8]/10 text-[#6D5EF8] border-[#6D5EF8]/25"
                    : "bg-transparent text-slate-400 border-transparent hover:text-slate-200"
                }`}
              >
                <Send className="h-3 w-3" />
                <span>Worksheet</span>
              </button>

              <button
                type="button"
                onClick={() => setSidebarType("coach")}
                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider font-mono flex items-center gap-1 transition-all cursor-pointer border shrink-0 ${
                  sidebarType === "coach"
                    ? "bg-[#6D5EF8]/10 text-[#6D5EF8] border-[#6D5EF8]/25"
                    : "bg-transparent text-slate-400 border-transparent hover:text-slate-200"
                }`}
              >
                <Cpu className="h-3 w-3" />
                <span>AI Coach</span>
              </button>

              <button
                type="button"
                onClick={() => setSidebarType("scorecard")}
                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider font-mono flex items-center gap-1 transition-all cursor-pointer border shrink-0 ${
                  sidebarType === "scorecard"
                    ? "bg-[#6D5EF8]/10 text-[#6D5EF8] border-[#6D5EF8]/25"
                    : "bg-transparent text-slate-400 border-transparent hover:text-slate-200"
                }`}
              >
                <Award className="h-3 w-3" />
                <span>Scorecard</span>
              </button>

              <button
                type="button"
                onClick={() => setSidebarType("notepad")}
                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider font-mono flex items-center gap-1 transition-all cursor-pointer border shrink-0 ${
                  sidebarType === "notepad"
                    ? "bg-[#6D5EF8]/10 text-[#6D5EF8] border-[#6D5EF8]/25"
                    : "bg-transparent text-slate-400 border-transparent hover:text-slate-200"
                }`}
              >
                <FileText className="h-3 w-3" />
                <span>Scratchpad</span>
              </button>

              <button
                type="button"
                onClick={() => setSidebarType("participants")}
                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider font-mono flex items-center gap-1 transition-all cursor-pointer border shrink-0 ${
                  sidebarType === "participants"
                    ? "bg-[#6D5EF8]/10 text-[#6D5EF8] border-[#6D5EF8]/25"
                    : "bg-transparent text-slate-400 border-transparent hover:text-slate-200"
                }`}
              >
                <Users className="h-3 w-3" />
                <span>Board Members</span>
              </button>

              <button
                type="button"
                onClick={() => setSidebarType(null)}
                className="ml-auto p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Collapse Sidebar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Content rendering based on sidebarType */}
            {sidebarType === "answer" && (
              <div className="space-y-4 flex-1 flex flex-col justify-between animate-fade-in overflow-y-auto max-h-[500px] pr-1">
                <div className="space-y-4">
                  
                  {/* Verbal Capture interactor header */}
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
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
                    <div className="flex items-end gap-0.5 h-6 shrink-0 w-16 overflow-hidden select-none">
                      {soundBars.map((val, idx) => (
                        <span 
                          key={idx}
                          className={`w-0.5 rounded-full transition-all duration-75 ${isListening ? 'bg-[#6D5EF8]' : 'bg-slate-800'}`}
                          style={{ height: `${val}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Real-time STAR Diagnostics / Checklist inside Worksheet */}
                  <div className="p-3 bg-[#111827] border border-[#27272A] rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-sans font-bold text-slate-300">Live Answer Diagnostics</span>
                      <span className="text-[8px] font-mono text-slate-500 uppercase">Auto-scans draft</span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {/* S */}
                      <div className={`p-1.5 rounded-lg border text-center transition-all duration-300 ${
                        checkSituation 
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                          : "bg-slate-950 border-slate-800 text-slate-500"
                      }`}>
                        <span className="text-[10px] font-mono font-bold block">{checkSituation ? "✓" : "S"}</span>
                        <span className="text-[7px] font-sans block mt-0.5 truncate">Situation</span>
                      </div>
                      {/* T */}
                      <div className={`p-1.5 rounded-lg border text-center transition-all duration-300 ${
                        checkTask 
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                          : "bg-slate-950 border-slate-800 text-slate-500"
                      }`}>
                        <span className="text-[10px] font-mono font-bold block">{checkTask ? "✓" : "T"}</span>
                        <span className="text-[7px] font-sans block mt-0.5 truncate">Task</span>
                      </div>
                      {/* A */}
                      <div className={`p-1.5 rounded-lg border text-center transition-all duration-300 ${
                        checkAction 
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                          : "bg-slate-950 border-slate-800 text-slate-500"
                      }`}>
                        <span className="text-[10px] font-mono font-bold block">{checkAction ? "✓" : "A"}</span>
                        <span className="text-[7px] font-sans block mt-0.5 truncate">Action</span>
                      </div>
                      {/* R */}
                      <div className={`p-1.5 rounded-lg border text-center transition-all duration-300 ${
                        checkResult 
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                          : "bg-slate-950 border-slate-800 text-slate-500"
                      }`}>
                        <span className="text-[10px] font-mono font-bold block">{checkResult ? "✓" : "R"}</span>
                        <span className="text-[7px] font-sans block mt-0.5 truncate">Result</span>
                      </div>
                    </div>
                  </div>

                  {/* Evaluation goal tips */}
                  <div className="p-3 bg-[#6D5EF8]/5 rounded-xl border border-[#6D5EF8]/10 text-[10px] leading-relaxed text-slate-350 font-mono">
                    <span className="text-[#6D5EF8] font-bold">CRITICAL EVALUATION GOAL:</span> {currentQuestion.expectedFocus}
                  </div>

                  {/* Text Editor Area */}
                  <div className="space-y-1.5">
                    <label htmlFor="boardroom-response" className="block text-[9px] font-bold uppercase tracking-wider text-slate-450 font-mono">
                      Your Answer Statement
                    </label>
                    <textarea
                      id="boardroom-response"
                      rows={5}
                      placeholder="Draft your answer text or speak aloud to stream into this terminal field..."
                      className="w-full bg-slate-950 border border-[#27272A] rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 leading-relaxed focus:outline-none focus:border-[#6D5EF8]"
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                    />
                  </div>

                </div>

                {/* Submitting Actions Panel */}
                <div className="space-y-3.5 pt-3 border-t border-[#27272A]/80">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-[#27272A] rounded-xl text-[9px] font-bold uppercase tracking-wider font-mono flex items-center gap-1 cursor-pointer"
                    >
                      <Sliders className="h-3.5 w-3.5" />
                      <span>Audio Options</span>
                    </button>
                    <button
                      onClick={() => {
                        setVoiceEnabled(!voiceEnabled);
                        if (voiceEnabled) window.speechSynthesis.cancel();
                      }}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-xl border border-[#27272A] cursor-pointer"
                      title="Audio mute toggle"
                    >
                      {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Voice adjustments collapsible settings */}
                  {showVoiceSettings && (
                    <div className="p-3 bg-slate-950 border border-[#27272A] rounded-xl space-y-3 animate-slide-up text-left">
                      <h4 className="text-[8.5px] font-bold text-white uppercase font-mono tracking-wider">Voice Adjusters</h4>
                      <div className="space-y-2.5">
                        <div>
                          <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">Synthesizer Voice</label>
                          <select
                            value={selectedVoiceName}
                            onChange={(e) => setSelectedVoiceName(e.target.value)}
                            className="w-full bg-[#111827] border border-[#27272A] text-slate-300 rounded-lg p-2 text-[8.5px] focus:outline-none"
                          >
                            {voices.map(v => (
                              <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">Speed ({voiceRate}x)</label>
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
                            <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">Pitch ({voicePitch})</label>
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
                    </div>
                  )}

                  {/* Main submit button */}
                  <button
                    onClick={handleAnswerSubmit}
                    className="w-full py-2.5 bg-[#6D5EF8] hover:bg-[#6D5EF8]/90 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#6D5EF8]/10 animate-pulse-ring"
                  >
                    <span>{isLastQuestion ? "Consolidate & Finish" : "Submit Answer"}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

              </div>
            )}

            {sidebarType === "coach" && (() => {
              const coachFeedback = getDynamicCoachFeedback(currentQuestion.text, roleName);
              const wordCount = answerText.trim() === "" ? 0 : answerText.trim().split(/\s+/).length;
              const wpm = wordCount === 0 ? 0 : Math.min(160, Math.max(90, Math.round((wordCount / Math.max(1, duration)) * 60)));
              const fillerMatches = (answerText.match(/\b(um|uh|like|actually|basically|so)\b/gi) || []);
              const fillerCount = fillerMatches.length;
              const confidenceScore = wordCount < 5 ? 0 : Math.min(98, Math.max(72, Math.round(92 - (fillerCount * 1.5) + (checkAction ? 5 : 0))));

              const keywordsToInclude = [
                { word: "Sharding", matched: answerText.toLowerCase().includes("shard") },
                { word: "SLA / SLI", matched: answerText.toLowerCase().includes("sla") || answerText.toLowerCase().includes("sli") },
                { word: "Redis / Cache", matched: answerText.toLowerCase().includes("redis") || answerText.toLowerCase().includes("cach") },
                { word: "Write Throughput", matched: answerText.toLowerCase().includes("write") || answerText.toLowerCase().includes("throughput") },
                { word: "Scale Mitigation", matched: answerText.toLowerCase().includes("scale") || answerText.toLowerCase().includes("mitigat") },
                { word: "Fault Tolerance", matched: answerText.toLowerCase().includes("fault") || answerText.toLowerCase().includes("toleran") }
              ];

              return (
                <div className="space-y-4 flex-1 flex flex-col justify-between animate-fade-in overflow-y-auto max-h-[520px] pr-1">
                  <div className="space-y-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6D5EF8] animate-pulse" />
                      <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider">
                        Real-time AI Coach Assessment
                      </span>
                    </div>

                    {/* LIVE METRICS TRACKERS PANEL */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                      <div>
                        <span className="text-[8px] font-bold font-mono text-slate-500 uppercase block mb-0.5">Confidence</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-bold text-white">{confidenceScore === 0 ? "--" : `${confidenceScore}%`}</span>
                          <span className="text-[8px] text-slate-400">gaze adjusted</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold font-mono text-slate-500 uppercase block mb-0.5">Speech Pace</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-bold text-white">{wpm === 0 ? "Standby" : `${wpm} WPM`}</span>
                          <span className={`text-[8px] ${wpm === 0 ? "text-slate-500" : wpm < 110 ? "text-yellow-400" : wpm <= 145 ? "text-emerald-400" : "text-amber-400"}`}>
                            {wpm === 0 ? "idle" : wpm < 110 ? "slow" : wpm <= 145 ? "optimal" : "fast"}
                          </span>
                        </div>
                      </div>
                      <div className="col-span-2 border-t border-slate-900/60 pt-2 mt-1">
                        <span className="text-[8px] font-bold font-mono text-slate-500 uppercase block mb-0.5">Filler Words Scanned</span>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${fillerCount > 3 ? "text-rose-400 animate-pulse" : fillerCount > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                            {fillerCount} filler {fillerCount === 1 ? "word" : "words"} detected
                          </span>
                          {fillerCount > 3 && <span className="text-[7.5px] font-mono text-rose-500 uppercase font-semibold">Take a pause</span>}
                        </div>
                      </div>
                    </div>

                    {/* Focus hint card */}
                    <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                      <span className="text-[8px] font-bold font-mono text-[#6D5EF8] uppercase tracking-wider block mb-1">
                        Boardroom Calibration Hint
                      </span>
                      <p className="text-[11px] text-slate-350 leading-relaxed font-sans">
                        "{coachFeedback.focusHint}"
                      </p>
                    </div>

                    {/* Recommended STAR Response Structure */}
                    <div className="space-y-2">
                      <span className="text-[8.5px] font-bold font-mono text-slate-400 uppercase tracking-wider block">
                        Recommended STAR Response Architecture
                      </span>

                      <div className="space-y-2 text-left">
                        <div className="p-2.5 bg-slate-900/50 border border-slate-800/80 rounded-xl space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[8.5px] font-mono font-bold text-[#6D5EF8]">SITUATION / COMPLEXITY</span>
                            <span className={`text-[8px] font-mono font-bold ${checkSituation ? "text-emerald-400" : "text-slate-600"}`}>
                              {checkSituation ? "✓ DETECTED" : "MISSING"}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-300 leading-relaxed">{coachFeedback.starSituation}</p>
                        </div>

                        <div className="p-2.5 bg-slate-900/50 border border-slate-800/80 rounded-xl space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[8.5px] font-mono font-bold text-indigo-400">ACTION / RESOLUTION</span>
                            <span className={`text-[8px] font-mono font-bold ${checkAction ? "text-emerald-400" : "text-slate-600"}`}>
                              {checkAction ? "✓ DETECTED" : "MISSING"}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-300 leading-relaxed">{coachFeedback.starAction}</p>
                        </div>
                      </div>
                    </div>

                    {/* Target Concept Vocabulary Checklist */}
                    <div className="space-y-2">
                      <span className="text-[8.5px] font-bold font-mono text-slate-400 uppercase tracking-wider block">
                        Target Concept Vocabulary to Include
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {keywordsToInclude.map((kw, idx) => (
                          <div 
                            key={idx} 
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[9px] font-mono transition-all duration-300 ${
                              kw.matched 
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                                : "bg-slate-950 border-slate-900 text-slate-500"
                            }`}
                          >
                            <span className="font-bold">{kw.matched ? "✓" : "•"}</span>
                            <span className="truncate">{kw.word}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Speech / Delivery Tips */}
                    <div className="p-2.5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-1.5 text-left text-[9.5px]">
                      <span className="font-mono text-indigo-400 font-bold block uppercase tracking-wider text-[8px]">Communication Delivery Guidelines</span>
                      <ul className="list-disc pl-3 text-slate-400 space-y-1 leading-normal">
                        <li>Emphasize system peak metrics (e.g. throughput limit, P99 SLA metrics).</li>
                        <li>Maintain constant focal eye alignment to prevent drifting scores.</li>
                        <li>Take clean 1-2 second physical pauses before transitioning sections.</li>
                      </ul>
                    </div>

                  </div>

                  <div className="pt-2 border-t border-slate-900">
                    <span className="text-[8.5px] text-slate-500 font-mono leading-tight block text-center">
                      🤖 Live calibration parameters update as speech is processed.
                    </span>
                  </div>
                </div>
              );
            })()}

            {sidebarType === "scorecard" && (() => {
              const overallScore = 87;
              
              const ProgressRing = ({ percent, label, color }: { percent: number; label: string; color: string }) => {
                const radius = 20;
                const circumference = 2 * Math.PI * radius;
                const strokeDashoffset = circumference - (percent / 100) * circumference;
                return (
                  <div className="flex flex-col items-center justify-center bg-slate-950 border border-slate-900 p-2.5 rounded-xl">
                    <div className="relative flex items-center justify-center w-12 h-12">
                      <svg className="w-12 h-12 transform -rotate-90">
                        <circle cx="24" cy="24" r={radius} className="stroke-slate-900" strokeWidth="2.5" fill="transparent" />
                        <circle 
                          cx="24" 
                          cy="24" 
                          r={radius} 
                          className={color} 
                          strokeWidth="3" 
                          fill="transparent" 
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          style={{ transition: "stroke-dashoffset 0.8s ease" }}
                        />
                      </svg>
                      <span className="absolute text-[9px] font-bold font-mono text-white">{percent}%</span>
                    </div>
                    <span className="text-[7.5px] font-sans text-slate-400 font-medium text-center mt-2 uppercase tracking-wide leading-none">{label}</span>
                  </div>
                );
              };

              return (
                <div className="space-y-4 flex-1 flex flex-col justify-between animate-fade-in overflow-y-auto max-h-[520px] pr-1">
                  <div className="space-y-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                        Executive Competency Evaluators
                      </span>
                    </div>

                    {/* OVERALL SCORE DISPLAY CARD */}
                    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
                      <div className="text-left">
                        <span className="text-[8px] font-bold font-mono text-slate-500 uppercase block tracking-wider">Estimated Match Score</span>
                        <h4 className="text-xl font-extrabold text-white mt-1">87% <span className="text-[10px] text-emerald-400 font-mono font-medium">Excellent</span></h4>
                        <p className="text-[8.5px] text-slate-400 leading-normal mt-1">Matches senior SaaS engineer target bar requirements.</p>
                      </div>
                      
                      <div className="relative flex items-center justify-center w-16 h-16 shrink-0">
                        <svg className="w-16 h-16 transform -rotate-90">
                          <circle cx="32" cy="32" r={26} className="stroke-slate-900" strokeWidth="3" fill="transparent" />
                          <circle 
                            cx="32" 
                            cy="32" 
                            r={26} 
                            className="stroke-[#6D5EF8]" 
                            strokeWidth="3.5" 
                            fill="transparent" 
                            strokeDasharray={2 * Math.PI * 26}
                            strokeDashoffset={2 * Math.PI * 26 - (87 / 100) * (2 * Math.PI * 26)}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute text-xs font-bold font-mono text-white">87%</span>
                      </div>
                    </div>

                    {/* EVALUATION GRID OF PROGRESS RINGS */}
                    <div className="grid grid-cols-3 gap-2">
                      <ProgressRing percent={88} label="Delivery" color="stroke-indigo-500" />
                      <ProgressRing percent={85} label="Precision" color="stroke-blue-500" />
                      <ProgressRing percent={90} label="Topology" color="stroke-purple-500" />
                      <ProgressRing percent={82} label="Coding" color="stroke-emerald-500" />
                      <ProgressRing percent={94} label="Confidence" color="stroke-amber-500" />
                      <ProgressRing percent={89} label="Culture" color="stroke-rose-500" />
                    </div>

                    {/* SESSION OVERVIEW METADATA TAB */}
                    <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3 space-y-2 text-left">
                      <span className="text-[8px] font-bold font-mono text-slate-500 uppercase tracking-wider block">Executive Parameters Review</span>
                      <div className="space-y-1.5 text-[9.5px]">
                        <div className="flex justify-between border-b border-slate-900 pb-1.5">
                          <span className="text-slate-400">Questions Completed</span>
                          <span className="font-mono font-bold text-white">{currentQuestionIndex + 1} of {questions.length}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-900 pb-1.5">
                          <span className="text-slate-400">Time Limit Countdown</span>
                          <span className="font-mono font-bold text-slate-300">{formatTime(Math.max(0, 2700 - duration))}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-900 pb-1.5">
                          <span className="text-slate-400">Current Question Stage</span>
                          <span className="font-bold text-indigo-400">Architecture scale</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Assessment Evaluation Difficulty</span>
                          <span className="font-mono font-bold text-rose-400 uppercase text-[8px]">SaaS Staff Tier</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* View Detailed Report Action button */}
                  <button
                    onClick={handleAnswerSubmit}
                    className="w-full py-2.5 bg-gradient-to-r from-[#6D5EF8] to-indigo-600 hover:opacity-90 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#6D5EF8]/10"
                  >
                    <span>View Detailed Assessment Report</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })()}

            {sidebarType === "notepad" && (
              <div className="space-y-4 flex-1 flex flex-col justify-between animate-fade-in">
                <div className="space-y-3 flex-1 flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                      Private Board Notepad
                    </span>
                    <span className="text-[8px] text-slate-500 font-mono">Auto Persists</span>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-relaxed text-left">
                    Use this private text pad to outline STAR metrics, write complexity metrics ($O(N \log N)$), or list sharded db tables. It won't be evaluated.
                  </p>

                  <textarea
                    rows={12}
                    placeholder="✍️ private blueprint scratchpad...
- STAR: Saturation peaked under massive traffic load.
- Resolution: Integrated redis caching clusters."
                    className="w-full flex-1 bg-slate-950 border border-[#27272A] rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 font-mono leading-relaxed focus:outline-none focus:border-[#6D5EF8] resize-none min-h-[220px]"
                    value={scratchNotes}
                    onChange={(e) => handleScratchNotesChange(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
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

            {sidebarType === "participants" && (
              <div className="space-y-4 flex-1 flex flex-col animate-fade-in overflow-y-auto max-h-[500px] pr-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                    Board Recruiter Biographies ({currentPanel.length} Members)
                  </span>
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed text-left">
                  These recruiters are evaluating your answers. Calibrate your responses to hit their specific professional interests:
                </p>

                <div className="space-y-3.5">
                  {currentPanel.map((recruiter) => (
                    <div key={recruiter.id} className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-slate-900">
                          <img 
                            src={recruiter.id === 0 ? sarahImg : recruiter.id === 1 ? davidImg : marcusImg} 
                            alt={recruiter.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="text-left">
                          <h5 className="text-xs font-bold text-white leading-none">{recruiter.name}</h5>
                          <span className="text-[9px] text-slate-450 font-mono mt-0.5 block">{recruiter.role}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-[9px] pt-1">
                        <div className="p-1.5 bg-slate-900 rounded-lg text-left">
                          <span className="text-[8px] text-slate-500 font-mono uppercase block">FOCUS AREA</span>
                          <span className="text-indigo-300 font-bold font-mono">{recruiter.focus}</span>
                        </div>
                        <div className="p-1.5 bg-slate-900 rounded-lg text-left">
                          <span className="text-[8px] text-slate-500 font-mono uppercase block">CRITICAL CHECK</span>
                          <span className="text-amber-300 font-bold font-sans">
                            {recruiter.id === 0 ? "STAR clarity" : recruiter.id === 1 ? "Technical debt" : "Business impact"}
                          </span>
                        </div>
                      </div>

                      <p className="text-[10.5px] text-slate-350 leading-relaxed font-sans pt-1 text-left">
                        {recruiter.id === 0 && "Sarah values constructive conflict-resolution, strong team empathy, clear communication structure, and professional growth."}
                        {recruiter.id === 1 && "David listens for clean, scalable system architectural choices, concrete database schema designs, and thorough scaling mitigation."}
                        {recruiter.id === 2 && "Marcus weighs your operational performance under pressure, project triage capabilities, and organizational maturity."}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
