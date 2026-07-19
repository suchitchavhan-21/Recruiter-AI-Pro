import React, { useState } from "react";
import { 
  Award, 
  CheckCircle2, 
  TrendingUp, 
  Flame, 
  Zap, 
  Calendar, 
  BookOpen, 
  AlertCircle, 
  UploadCloud, 
  Check, 
  BarChart3, 
  FileText, 
  Download, 
  ChevronRight,
  Sparkles,
  ArrowRight,
  Compass,
  Cpu,
  Trash2
} from "lucide-react";
import { UserProfile, InterviewSession } from "../types";
import EnterpriseResumeScanner from "./EnterpriseResumeScanner";

const suggestionsData = [
  {
    id: "metrics",
    category: "Quantifiable Metrics",
    points: 12,
    title: "Quantify Technical Accomplishments with Hard Data",
    short: "ATS algorithms favor bullet points containing metric integers (%, $, ms, key indicators).",
    before: "Created new APIs and sped up SQL database queries.",
    after: "Refactored Node.js endpoints and structured Drizzle indexing, reducing API latency by 42% (from 180ms to 104ms) and supporting 15,000 parallel concurrent users."
  },
  {
    id: "consensus",
    category: "High-Priority Keywords",
    points: 10,
    title: "Integrate Distributed Consistency Keywords",
    short: "Modern architectures require consensus validation. Include terms like Raft, Paxos, or replication mechanics.",
    before: "Configured backend servers to handle backups and load sync.",
    after: "Deployed 3-node fault-tolerant clusters using Raft consensus to manage zero-data-loss database failovers."
  },
  {
    id: "observability",
    category: "Keyword Optimization",
    points: 8,
    title: "Mention System Observability & Tracing Infrastructure",
    short: "Production systems rely on tracing. Keywords like OpenTelemetry, Prometheus, and Grafana increase ATS keyword weights.",
    before: "Added log lines and monitor states to server console.",
    after: "Instrumented full-stack distributed request tracing with OpenTelemetry and configured Prometheus alert configurations."
  },
  {
    id: "layout",
    category: "Format & Structure",
    points: 7,
    title: "Eliminate Complex Double-Columns & Graphical Assets",
    short: "Double column layouts confuse PDF parser readers. Keep a sequential single-column format.",
    before: "[Visual Sidebar with Skill Level progress circles: React 90%, PostgreSQL 85%]",
    after: "Skills Section: React.js (Expert), Node.js (Advanced), PostgreSQL (Advanced), Distributed Systems."
  },
  {
    id: "headings",
    category: "Parsing Mechanics",
    points: 6,
    title: "Standardize Section Titles to Industry Conventions",
    short: "Creative headers (e.g., 'My Journey', 'Hacking History') block ATS category grouping.",
    before: "Hacking & Code Adventures, My Narrative",
    after: "Professional Work Experience, Core Professional Technical Skills"
  }
];

interface AnalyticsViewProps {
  currentUser: UserProfile | null;
  sessionsHistory: InterviewSession[];
  onStartInterview: () => void;
  onDeleteSession?: (id: string) => void;
  onClearAllSessions?: () => void;
  onViewFeedback?: (feedback: any) => void;
}

export default function AnalyticsView({ 
  currentUser, 
  sessionsHistory, 
  onStartInterview,
  onDeleteSession,
  onClearAllSessions,
  onViewFeedback
}: AnalyticsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "performance" | "ats">("overview");
  const [isScanning, setIsScanning] = useState(false);
  const [showScanSuccess, setShowScanSuccess] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  
  // Custom resume state variables
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);
  const [targetRole, setTargetRole] = useState<string>("Backend Engineer");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [appliedSuggestions, setAppliedSuggestions] = useState<string[]>([]);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStage, setScanStage] = useState<string>("");

  // Helper to calculate daily consecutive streaks dynamically from session histories
  const calculateStreak = (history: InterviewSession[]): number => {
    if (!history || history.length === 0) return 0;
    try {
      const dates = Array.from(new Set(history.map(s => {
        const d = new Date(s.timestamp);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      }))).sort((a, b) => b - a); // newest first

      if (dates.length === 0) return 0;

      const today = new Date();
      const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      const oneDayMs = 24 * 60 * 60 * 1000;

      // If last practice was more than 1 day ago, streak is broken
      if (todayMidnight - dates[0] > oneDayMs) {
        return 0;
      }

      let streak = 1;
      for (let i = 0; i < dates.length - 1; i++) {
        if (dates[i] - dates[i+1] === oneDayMs) {
          streak++;
        } else if (dates[i] - dates[i+1] > oneDayMs) {
          break;
        }
      }
      return streak;
    } catch (e) {
      return history.length > 0 ? 1 : 0;
    }
  };

  const totalInterviews = sessionsHistory.length;
  const averageScore = sessionsHistory.length > 0 
    ? Math.round(sessionsHistory.reduce((acc, s) => acc + (s.score || 0), 0) / sessionsHistory.length) 
    : 0;

  // Personalized greeting details
  const userFirstName = currentUser?.name?.split(" ")[0] || "Suchit";
  const currentStreak = calculateStreak(sessionsHistory);
  
  // Dynamic ATS calculations from suggestions checked/applied
  const resumeScore = hasScanned 
    ? Math.min(98, 63 + suggestionsData.filter(s => appliedSuggestions.includes(s.id)).reduce((acc, s) => acc + s.points, 0))
    : 0;

  const atsMatch = hasScanned 
    ? Math.min(99, 70 + suggestionsData.filter(s => appliedSuggestions.includes(s.id)).reduce((acc, s) => acc + Math.round(s.points * 0.8), 0))
    : 0;

  // Dynamic weak area identifier based on the lowest scoring completed simulation
  let weakArea = "None (No sessions)";
  if (sessionsHistory.length > 0) {
    const sortedByScore = [...sessionsHistory].sort((a, b) => (a.score || 0) - (b.score || 0));
    const lowestSession = sortedByScore[0];
    if (lowestSession) {
      const persona = lowestSession.persona;
      if (persona === "architect") {
        weakArea = "System Design";
      } else if (persona === "mentor") {
        weakArea = "Behavioral Pitch";
      } else if (persona === "product_leader") {
        weakArea = "Product Strategy";
      } else {
        weakArea = "Technical Depth";
      }
    }
  }

  // Dynamic competencies mapping (grows based on averageScore and session metrics)
  let behavioralVal = 0;
  let systemDesignVal = 0;
  let distributedVal = 0;
  let codingVal = 0;
  let productVal = 0;

  if (sessionsHistory.length > 0) {
    const avg = averageScore;
    
    const behavioralSessions = sessionsHistory.filter(s => s.persona === "mentor");
    const systemDesignSessions = sessionsHistory.filter(s => s.persona === "architect");
    const productSessions = sessionsHistory.filter(s => s.persona === "product_leader");
    
    behavioralVal = behavioralSessions.length > 0
      ? Math.round(behavioralSessions.reduce((acc, s) => acc + (s.score || 0), 0) / behavioralSessions.length)
      : Math.max(0, Math.round(avg * 0.85));

    systemDesignVal = systemDesignSessions.length > 0
      ? Math.round(systemDesignSessions.reduce((acc, s) => acc + (s.score || 0), 0) / systemDesignSessions.length)
      : Math.max(0, Math.round(avg * 0.70));

    distributedVal = systemDesignSessions.length > 0
      ? Math.round(systemDesignSessions.reduce((acc, s) => acc + (s.score || 0), 0) / systemDesignSessions.length)
      : Math.max(0, Math.round(avg * 0.75));

    codingVal = sessionsHistory.length > 0
      ? Math.min(100, Math.max(0, Math.round(avg * 0.80 + Math.min(sessionsHistory.length * 2, 15))))
      : 0;

    productVal = productSessions.length > 0
      ? Math.round(productSessions.reduce((acc, s) => acc + (s.score || 0), 0) / productSessions.length)
      : Math.max(0, Math.round(avg * 0.74));
  }

  const competencies = [
    { label: "Behavioral", value: behavioralVal, x: 150, y: 35 },
    { label: "System Design", value: systemDesignVal, x: 260, y: 110 },
    { label: "Distributed Systems", value: distributedVal, x: 220, y: 220 },
    { label: "Coding Accuracy", value: codingVal, x: 80, y: 220 },
    { label: "Product & Metrics", value: productVal, x: 40, y: 110 }
  ];

  // Recommended topics selection based on weak area
  const getRecommendedTopics = () => {
    if (sessionsHistory.length === 0) {
      return [
        {
          category: "Behavioral",
          color: "text-emerald-400 border-emerald-500/10 bg-emerald-500/5",
          title: "STAR Framework Foundations",
          desc: "Learn how to structure behavioral responses to maximize rubric metrics."
        },
        {
          category: "System Design",
          color: "text-rose-400 border-rose-500/10 bg-rose-500/5",
          title: "High-Level System Architecture",
          desc: "Understand load-balancing, caching, and network protocol layers."
        }
      ];
    }
    
    if (weakArea === "System Design") {
      return [
        {
          category: "System Design",
          color: "text-rose-400 border-rose-500/10 bg-rose-500/5",
          title: "Distributed Consistency & CAP",
          desc: "Review distributed synchronization algorithms (Paxos, Raft)."
        },
        {
          category: "Infrastructure",
          color: "text-blue-400 border-blue-500/10 bg-blue-500/5",
          title: "Scalable Cache Strategies",
          desc: "Understand Redis clustering, key-eviction policies, and data synchronization."
        }
      ];
    }

    if (weakArea === "Behavioral Pitch") {
      return [
        {
          category: "Behavioral",
          color: "text-emerald-400 border-emerald-500/10 bg-emerald-500/5",
          title: "STAR Metrics Storyboards",
          desc: "Ensure historical project outcomes quantify engineering performance metrics."
        },
        {
          category: "Leadership",
          color: "text-amber-400 border-amber-500/10 bg-amber-500/5",
          title: "Conflict Resolution Signals",
          desc: "Master constructive disagreement and positive feedback loop responses."
        }
      ];
    }

    if (weakArea === "Product Strategy") {
      return [
        {
          category: "Product",
          color: "text-violet-400 border-violet-500/10 bg-violet-500/5",
          title: "Metrics Frameworks (HEART/AARRR)",
          desc: "Formulate strategic metric tracking for complex software product rollouts."
        },
        {
          category: "Design",
          color: "text-teal-400 border-teal-500/10 bg-teal-500/5",
          title: "Target User Personas",
          desc: "Deconstruct product utility gaps to pitch feature prioritizations."
        }
      ];
    }

    return [
      {
        category: "Technical",
        color: "text-sky-400 border-sky-500/10 bg-sky-500/5",
        title: "Walkthrough Systematics",
        desc: "Step through your algorithms line-by-line prior to coding."
      },
      {
        category: "Complexity",
        color: "text-indigo-400 border-indigo-500/10 bg-indigo-500/5",
        title: "Big O Analysis Calibration",
        desc: "Accurately pitch time and space trade-offs in real-time."
      }
    ];
  };

  const recommendedTopics = getRecommendedTopics();

  // Center is 150, 130
  const cx = 150;
  const cy = 130;
  const r = 80;
  const angles = [0, 72, 144, 216, 288];

  const getCoordinates = (index: number, value: number) => {
    const angleRad = (angles[index] * Math.PI) / 180 - Math.PI / 2;
    const currentRadius = (value / 100) * r;
    const x = cx + currentRadius * Math.cos(angleRad);
    const y = cy + currentRadius * Math.sin(angleRad);
    return { x, y };
  };

  const polyPoints = angles.map((_, idx) => {
    const val = competencies[idx].value;
    const coords = getCoordinates(idx, val);
    return `${coords.x},${coords.y}`;
  }).join(" ");

  const triggerScanSimulation = (file: { name: string; size: number }) => {
    setUploadedFile(file);
    setIsScanning(true);
    setScanProgress(0);
    setScanStage("Loading file payload & checking extension format...");
    setAppliedSuggestions([]); // Reset on new scan
    
    // Simulate real multi-stage progress
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      if (currentProgress >= 100) {
        clearInterval(interval);
        setScanProgress(100);
        setScanStage("Compiling final ATS compatibility index...");
        setTimeout(() => {
          setIsScanning(false);
          setShowScanSuccess(true);
          setHasScanned(true);
          setTimeout(() => setShowScanSuccess(false), 5000);
        }, 600);
      } else {
        setScanProgress(currentProgress);
        if (currentProgress < 25) {
          setScanStage("Parsing document structure & identifying contact headers...");
        } else if (currentProgress < 50) {
          setScanStage(`Analyzing semantic token weights against target role: ${targetRole}...`);
        } else if (currentProgress < 75) {
          setScanStage("Checking industry keyword densities (observability, distributed clusters)...");
        } else {
          setScanStage("Calculating layout single-column parsing score...");
        }
      }
    }, 120);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      triggerScanSimulation({ name: file.name, size: file.size });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      triggerScanSimulation({ name: file.name, size: file.size });
    }
  };

  const handleTriggerResumeScan = () => {
    if (!uploadedFile) {
      alert("Please upload a resume file first by dragging or clicking on the upload area.");
      return;
    }
    triggerScanSimulation(uploadedFile);
  };

  const toggleSuggestionFix = (id: string) => {
    setAppliedSuggestions(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleDownloadReport = () => {
    alert("Downloading your comprehensive ATS compatibility report & skill gaps checklist PDF...");
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-tight font-sans">
            Candidate Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track evaluation histories, optimize keyword matches, and schedule personalized practice mocks.
          </p>
        </div>

        {/* Dashboard Sub-Segment Selectors */}
        <div className="flex bg-[#111827] border border-[#27272A] p-1.5 rounded-xl gap-1">
          <button
            onClick={() => setActiveSubTab("overview")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === "overview"
                ? "bg-[#6D5EF8] text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveSubTab("performance")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === "performance"
                ? "bg-[#6D5EF8] text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Performance</span>
          </button>
          <button
            onClick={() => setActiveSubTab("ats")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === "ats"
                ? "bg-[#6D5EF8] text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Resume Scan</span>
          </button>
        </div>
      </div>

      {/* 1. OVERVIEW SUBTAB (HERO DASHBOARD) */}
      {activeSubTab === "overview" && (
        <div className="space-y-6 animate-fade-in">
          {/* Personalized Greeting Card */}
          <div className="rounded-[18px] border border-[#27272A] bg-gradient-to-br from-[#111827] via-[#09090B] to-[#111827] p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#6D5EF8]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6D5EF8]" />
                <span className="text-[9px] font-mono tracking-wider text-slate-400 uppercase font-bold">Preparation Summary</span>
              </div>
              
              <h1 className="text-xl md:text-3xl font-bold text-white tracking-tight">
                Welcome back, {userFirstName} 👋
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                <div className="bg-[#09090B]/60 border border-[#27272A]/80 p-4 rounded-xl space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Today's Goal</span>
                  <span className="text-xs font-bold text-white block">Practice Interviews</span>
                </div>
                <div className="bg-[#09090B]/60 border border-[#27272A]/80 p-4 rounded-xl space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Average Score</span>
                  <span className="text-xs font-bold text-emerald-400 block">{averageScore}% Proficiency</span>
                </div>
                <div className="bg-[#09090B]/60 border border-[#27272A]/80 p-4 rounded-xl space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Current Streak</span>
                  <span className="text-xs font-bold text-amber-400 block">{currentStreak} Days Consistent</span>
                </div>
                <div className="bg-[#09090B]/60 border border-[#27272A]/80 p-4 rounded-xl space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Weak Area</span>
                  <span className="text-xs font-bold text-rose-400 block">{weakArea}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#27272A]/40">
                <button
                  onClick={onStartInterview}
                  className="px-5 py-2.5 bg-[#6D5EF8] hover:bg-[#6D5EF8]/90 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-[#6D5EF8]/15 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Practice Google Behavioral Interview</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setActiveSubTab("performance")}
                  className="px-5 py-2.5 bg-[#111827] hover:bg-slate-900 border border-[#27272A] text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer text-center"
                >
                  Explore Weak Areas
                </button>
              </div>
            </div>
          </div>

          {/* Info Columns: Mocks & Guides */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Upcoming Schedule & History */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-[#111827] border border-[#27272A] p-6 rounded-[18px] space-y-4">
                <h3 className="text-white text-xs font-bold tracking-wider uppercase font-mono text-slate-400 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#6D5EF8]" />
                  Upcoming Mock Sessions
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 bg-[#09090B]/50 rounded-xl border border-[#27272A] hover:border-slate-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🤖</span>
                      <div>
                        <h4 className="text-xs font-bold text-white">OpenAI Lead SRE Simulation</h4>
                        <p className="text-[10px] text-slate-500">Scheduled: Today, 3:00 PM (15 mins)</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-[#6D5EF8] bg-[#6D5EF8]/10 px-2 py-0.5 rounded border border-[#6D5EF8]/20">Priority A</span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-[#09090B]/50 rounded-xl border border-[#27272A] hover:border-slate-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">💳</span>
                      <div>
                        <h4 className="text-xs font-bold text-white">Stripe Staff Backend Challenge</h4>
                        <p className="text-[10px] text-slate-500">Scheduled: Tomorrow, 11:00 AM (25 mins)</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700/85">Setup Ready</span>
                  </div>
                </div>
              </div>

              {/* ATS Quick Score Card */}
              <div className="bg-[#111827] border border-[#27272A] p-6 rounded-[18px] flex items-center justify-between gap-6">
                <div className="space-y-2">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Resume Calibration Index</span>
                  <h4 className="text-xs font-bold text-white">Resume Compatibility Index</h4>
                  <p className="text-[10px] text-slate-400 leading-normal max-w-md">
                    {resumeScore > 0 ? (
                      <>
                        Your resume has <strong className="text-white">{resumeScore}% ATS compatibility</strong> with an outstanding <strong className="text-emerald-400">{atsMatch}% semantic match</strong> for engineering positions.
                      </>
                    ) : (
                      <>
                        No resume scan history. Upload or sync your resume under the "ATS Audit" tab to calculate your compatibility index.
                      </>
                    )}
                  </p>
                  <button 
                    onClick={() => setActiveSubTab("ats")}
                    className="text-xs font-bold text-[#6D5EF8] hover:underline flex items-center gap-1 cursor-pointer pt-1"
                  >
                    <span>Analyze resume keywords</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-[#6D5EF8]/20 flex flex-col items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-white">{resumeScore}</span>
                  <span className="text-[7px] text-[#6D5EF8] font-bold font-mono">INDEX SCORE</span>
                </div>
              </div>
            </div>

            {/* Right Column: Recommendations */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#111827] border border-[#27272A] p-6 rounded-[18px] space-y-4 h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-white text-xs font-bold tracking-wider uppercase font-mono text-slate-400 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[#22C55E]" />
                    Recommended Study Topics
                  </h3>

                  <div className="space-y-3.5">
                    {recommendedTopics.map((topic, i) => (
                      <div key={i} className="p-3.5 bg-[#09090B]/30 rounded-xl border border-[#27272A] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-bold uppercase font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/10 ${topic.color}`}>
                            {topic.category}
                          </span>
                          <span className="text-[9px] font-mono text-slate-500">
                            {sessionsHistory.length > 0 ? "Target Focus" : "Fundamentals"}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-200">{topic.title}</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed">{topic.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#09090B] p-3.5 rounded-xl border border-[#27272A] flex gap-2.5 items-start mt-4">
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-300">Action Recommended</h4>
                    <p className="text-[9.5px] text-slate-400 mt-1 leading-relaxed">
                      {sessionsHistory.length > 0 
                        ? `Practicing consistent mock interviews on your weak ${weakArea.toLowerCase()} topics yields 40% higher recall speeds.`
                        : "Launch a simulation practice session to let Recruiter AI analyze your profile and construct tailored recommendations."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PERFORMANCE TAB (ANALYTICS DASHBOARD) */}
      {activeSubTab === "performance" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Radar / Competency Chart */}
            <div className="lg:col-span-5 bg-[#111827] border border-[#27272A] p-6 rounded-[18px] flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-bold text-slate-500 uppercase font-mono tracking-wider">Skill Index Radar</span>
                <h3 className="text-white text-sm font-bold tracking-tight font-sans mt-1">Competency Profile Map</h3>
              </div>

              {/* SVG Radar Spider Render */}
              <div className="flex items-center justify-center py-4 select-none">
                <svg viewBox="0 0 300 260" className="w-full max-w-[280px] h-auto">
                  {/* Grid circles */}
                  {[20, 40, 60, 80, 100].map((level) => (
                    <circle
                      key={level}
                      cx={cx}
                      cy={cy}
                      r={(level / 100) * r}
                      fill="none"
                      stroke="#27272A"
                      strokeWidth="0.8"
                      strokeDasharray={level === 100 ? "0" : "2,2"}
                    />
                  ))}

                  {/* Grid spokes */}
                  {angles.map((angle, idx) => {
                    const angleRad = (angle * Math.PI) / 180 - Math.PI / 2;
                    const endX = cx + r * Math.cos(angleRad);
                    const endY = cy + r * Math.sin(angleRad);
                    return (
                      <line
                        key={idx}
                        x1={cx}
                        y1={cy}
                        x2={endX}
                        y2={endY}
                        stroke="#27272A"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* Data polygon */}
                  <polygon
                    points={polyPoints}
                    fill="rgba(109, 94, 248, 0.15)"
                    stroke="#6D5EF8"
                    strokeWidth="2"
                  />

                  {/* Competency markers / circles */}
                  {angles.map((_, idx) => {
                    const val = competencies[idx].value;
                    const coords = getCoordinates(idx, val);
                    return (
                      <circle
                        key={idx}
                        cx={coords.x}
                        cy={coords.y}
                        r="4"
                        fill="#6D5EF8"
                        stroke="#FFFFFF"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* Labels */}
                  <text x={cx} y={cy - r - 12} textAnchor="middle" fill="#94A3B8" fontSize="8" fontWeight="bold" fontFamily="monospace">BEHAVIORAL</text>
                  <text x={cx + r + 30} y={cy - r / 2 + 10} textAnchor="start" fill="#94A3B8" fontSize="8" fontWeight="bold" fontFamily="monospace">SYSTEM DESIGN</text>
                  <text x={cx + r - 10} y={cy + r + 15} textAnchor="start" fill="#94A3B8" fontSize="8" fontWeight="bold" fontFamily="monospace">DISTRIBUTED</text>
                  <text x={cx - r + 10} y={cy + r + 15} textAnchor="end" fill="#94A3B8" fontSize="8" fontWeight="bold" fontFamily="monospace">CODING ACCURACY</text>
                  <text x={cx - r - 30} y={cy - r / 2 + 10} textAnchor="end" fill="#94A3B8" fontSize="8" fontWeight="bold" fontFamily="monospace">PRODUCT STRAT</text>
                </svg>
              </div>

              <div className="text-[9px] text-slate-500 font-mono text-center border-t border-[#27272A] pt-3 mt-2">
                Recalibrated automatically from last 5 simulation records
              </div>
            </div>

            {/* Right Panel: Metrics & Unlocked Badges */}
            <div className="lg:col-span-7 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#111827] border border-[#27272A] p-5 rounded-[18px]">
                  <span className="text-[9px] font-bold text-slate-500 uppercase font-mono tracking-wider">Hiring Calibration</span>
                  <div className="flex items-baseline gap-2.5 mt-2">
                    <span className="text-xl font-bold text-white">
                      {averageScore >= 90 ? "Strong Hire" :
                       averageScore >= 80 ? "Lean Hire" :
                       averageScore >= 60 ? "Needs Practice" :
                       averageScore > 0 ? "No Hire" : "Not Calibrated"}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold font-mono">
                      {averageScore >= 90 ? "Top 5%" :
                       averageScore >= 80 ? "Top 20%" :
                       averageScore >= 60 ? "Top 55%" :
                       averageScore > 0 ? "Bottom 40%" : "N/A"}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                    {averageScore >= 90 ? "Highly competitive scores. Excellent candidates align with active referrals." :
                     averageScore >= 80 ? "Solid competencies shown. Recommended for next-round hiring pipelines." :
                     averageScore >= 60 ? "Basic skills verified. Increase practice repetitions to master harder rubrics." :
                     averageScore > 0 ? "Requires deliberate prep focus. Practice custom tracks to build familiarity." :
                     "Simulations required. Complete your first practice session to calculate hiring eligibility."}
                  </p>
                </div>

                <div className="bg-[#111827] border border-[#27272A] p-5 rounded-[18px]">
                  <span className="text-[9px] font-bold text-slate-500 uppercase font-mono tracking-wider">Simulations Completed</span>
                  <div className="flex items-baseline gap-2.5 mt-2">
                    <span className="text-xl font-bold text-white">{totalInterviews} Mock Runs</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">Constant practice patterns help develop high communication speeds under pressure.</p>
                </div>
              </div>

              {/* Achievements Card */}
              <div className="bg-[#111827] border border-[#27272A] p-6 rounded-[18px] space-y-4">
                <h3 className="text-white text-xs font-bold tracking-wider uppercase font-mono text-slate-400 flex items-center gap-2">
                  <Award className="h-4 w-4 text-[#6D5EF8]" />
                  Unlocked Achievements & Badges
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Streak Badge */}
                  <div className={`p-3 bg-[#09090B] border border-[#27272A] rounded-xl flex items-center gap-3 transition-all duration-200 ${currentStreak >= 1 ? "opacity-100 border-amber-500/30" : "opacity-40"}`}>
                    <span className="text-xl shrink-0 select-none">🔥</span>
                    <div>
                      <h4 className="text-[10px] font-bold text-white">
                        {currentStreak >= 1 ? "Consistent Prep" : "Consistent Prep"}
                      </h4>
                      <p className="text-[8px] text-slate-500">
                        {currentStreak >= 1 ? `${currentStreak} Days Completed` : "Locked (0/1 sessions)"}
                      </p>
                    </div>
                  </div>

                  {/* Score Badge */}
                  <div className={`p-3 bg-[#09090B] border border-[#27272A] rounded-xl flex items-center gap-3 transition-all duration-200 ${averageScore >= 80 ? "opacity-100 border-violet-500/30" : "opacity-40"}`}>
                    <span className="text-xl shrink-0 select-none">🎯</span>
                    <div>
                      <h4 className="text-[10px] font-bold text-white">
                        {averageScore >= 80 ? "Elite STAR Story" : "Elite STAR Story"}
                      </h4>
                      <p className="text-[8px] text-slate-500">
                        {averageScore >= 80 ? "Perfect rubric grading" : "Locked (Score >= 80)"}
                      </p>
                    </div>
                  </div>

                  {/* Target Readiness Badge */}
                  <div className={`p-3 bg-[#09090B] border border-[#27272A] rounded-xl flex items-center gap-3 transition-all duration-200 ${totalInterviews >= 3 && averageScore >= 80 ? "opacity-100 border-emerald-500/30" : "opacity-40"}`}>
                    <span className="text-xl shrink-0 select-none">💎</span>
                    <div>
                      <h4 className="text-[10px] font-bold text-white">
                        {totalInterviews >= 3 && averageScore >= 80 ? "Google Ready" : "Google Ready"}
                      </h4>
                      <p className="text-[8px] text-slate-500">
                        {totalInterviews >= 3 && averageScore >= 80 ? "Met high grading" : "Locked (3 mocks >= 80)"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Historical Logs List */}
          <div className="bg-[#111827] border border-[#27272A] p-6 rounded-[18px] space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-white text-xs font-bold tracking-wider uppercase font-mono text-slate-400">
                Mock Simulation History
              </h3>
              {sessionsHistory.length > 0 && onClearAllSessions && (
                <button
                  onClick={onClearAllSessions}
                  className="px-2.5 py-1 text-[10px] font-mono text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/30 border border-rose-500/20 rounded-md transition-all cursor-pointer"
                >
                  Clear History
                </button>
              )}
            </div>

            {sessionsHistory.length === 0 ? (
              <div className="text-center py-8 bg-[#09090B]/30 rounded-xl border border-dashed border-[#27272A] space-y-2">
                <span className="text-2xl block">📁</span>
                <h4 className="text-xs font-bold text-white">No active histories</h4>
                <p className="text-[10px] text-slate-500 max-w-xs mx-auto">Complete your first 7-step guided interview wizard practice to start plotting analytics.</p>
                <button 
                  onClick={onStartInterview}
                  className="px-3.5 py-1.5 bg-[#6D5EF8] text-white rounded-lg text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Practice Session</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#27272A]">
                {sessionsHistory.map((s, idx) => {
                  const hasFeedback = !!s.evaluation;
                  return (
                    <div 
                      key={s.id || idx} 
                      onClick={() => {
                        if (hasFeedback && onViewFeedback) {
                          onViewFeedback(s.evaluation);
                        }
                      }}
                      className={`flex items-center justify-between py-3 px-3 rounded-xl transition-all ${
                        hasFeedback 
                          ? "cursor-pointer hover:bg-slate-900/60 hover:translate-x-1" 
                          : ""
                      } gap-4`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 border border-[#27272A] flex items-center justify-center text-xs text-[#6D5EF8] font-bold shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{s.role} at {s.company}</h4>
                          <span className="text-[9px] text-slate-500 font-mono">
                            Date: {new Date(s.timestamp).toLocaleDateString()} • {hasFeedback ? "Scorecard Unlocked" : "Active Practice"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono ${
                          (s.score || 85) >= 85 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                        }`}>
                          {s.score || 85}% Score
                        </span>
                        {onDeleteSession && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent launching scorecard when deleting
                              onDeleteSession(s.id);
                            }}
                            className="p-1 hover:text-rose-400 text-slate-500 transition-colors cursor-pointer"
                            title="Delete Session"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. RESUME SCAN TAB (ATS DASHBOARD) */}
      {activeSubTab === "ats" && (
        <div className="space-y-6 animate-fade-in">
          <EnterpriseResumeScanner 
            currentUser={currentUser} 
            onActivityLog={(desc) => {
              console.log("[ResumeScanActivity]:", desc);
            }}
          />
        </div>
      )}
    </div>
  );
}
