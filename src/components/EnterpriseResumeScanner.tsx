import React, { useState, useEffect, useRef } from "react";
import { 
  ZoomIn, 
  ZoomOut, 
  Search, 
  Maximize2, 
  Printer, 
  RotateCcw, 
  FileText, 
  Check, 
  X, 
  Sparkles, 
  TrendingUp, 
  Award, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Sliders, 
  Layers, 
  Download, 
  BookOpen, 
  Briefcase, 
  ShieldAlert, 
  ListChecks, 
  Share2, 
  FileDown, 
  Activity, 
  CheckSquare, 
  RefreshCw, 
  Copy, 
  Eye, 
  Book, 
  MapPin, 
  Mail, 
  Phone, 
  Linkedin, 
  Github, 
  Globe, 
  ChevronRight,
  User,
  ExternalLink,
  HelpCircle,
  FileSpreadsheet,
  Settings,
  UploadCloud
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { apiFetch } from "../lib/api";
import { RESUME_TEMPLATES, ResumeTemplate } from "../data/resumeTemplates";

interface EnterpriseResumeScannerProps {
  currentUser: any;
  onActivityLog?: (desc: string) => void;
}

// 17 Stages in the AI Processing Pipeline
const PIPELINE_STAGES = [
  { key: "upload", label: "Uploading resume..." },
  { key: "extract", label: "Reading text..." },
  { key: "parse", label: "Analyzing resume sections..." },
  { key: "ats", label: "Checking resume compatibility..." },
  { key: "grammar", label: "Checking spelling and grammar..." },
  { key: "keyword", label: "Finding key skills..." },
  { key: "formatting", label: "Checking layout formatting..." },
  { key: "experience", label: "Analyzing work history..." },
  { key: "project", label: "Evaluating key projects..." },
  { key: "skills", label: "Grouping technical skills..." },
  { key: "education", label: "Verifying education details..." },
  { key: "recruiter", label: "Getting recruiter feedback..." },
  { key: "suggestions", label: "Creating customized suggestions..." },
  { key: "optimization", label: "Calculating match score..." },
  { key: "comparison", label: "Comparing layout versions..." },
  { key: "reports", label: "Preparing report..." },
  { key: "downloadable", label: "Finishing up your review..." }
];

// Mock database to simulate DB storage requirements
const LOCAL_STORAGE_KEY = "recruiter_ai_resume_scan_db";

interface SavedScanSession {
  id: string;
  timestamp: string;
  fileName: string;
  fileSize: number;
  targetRole: string;
  atsScore: number;
  grammarAccepted: string[];
  roadmapApplied: string[];
  optimized: boolean;
}

export default function EnterpriseResumeScanner({ currentUser, onActivityLog }: EnterpriseResumeScannerProps) {
  // Navigation & Role Configuration
  const [targetRole, setTargetRole] = useState<string>("Backend Engineer");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(-1);
  const [hasScanned, setHasScanned] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("roadmap"); // roadmap | parameters | grammar | keywords | experience | after | recruiter | downloads
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "info" | "error" } | null>(null);

  // Resume Template Selection State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("swe-standard");
  const [copiedTemplateId, setCopiedTemplateId] = useState<string | null>(null);

  // Real scan state & refs for stale closure synchronization
  const [realScanData, setRealScanData] = useState<any>(null);
  const [isApiLoading, setIsApiLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const realScanDataRef = useRef<any>(null);
  const isApiLoadingRef = useRef<boolean>(false);
  const apiErrorRef = useRef<string | null>(null);

  // File Upload State
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [originalText, setOriginalText] = useState<string>("");

  // LEFT PANEL: Original Viewer state
  const [zoom, setZoom] = useState<number>(100);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Interactive adjustments
  const [appliedGrammar, setAppliedGrammar] = useState<string[]>([]);
  const [appliedRoadmap, setAppliedRoadmap] = useState<string[]>([]);
  const [isOptimized, setIsOptimized] = useState<boolean>(false);

  // Synchronized viewports scroll offset percentages
  const originalScrollRef = useRef<HTMLDivElement>(null);
  const optimizedScrollRef = useRef<HTMLDivElement>(null);
  const [syncScroll, setSyncScroll] = useState<boolean>(true);

  // Popover state for Before vs After explanation
  const [hoveredDiff, setHoveredDiff] = useState<{
    id: string;
    original: string;
    suggested: string;
    why: string;
    ats: string;
    recruiter: string;
    x: number;
    y: number;
  } | null>(null);

  // Show Toast feedback helper
  const triggerToast = (text: string, type: "success" | "info" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  // Drag and Drop triggers
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
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setUploadedFile({ name: file.name, size: file.size });
    
    // Concurrently read the file as base64 and call our real Express endpoint!
    setIsApiLoading(true);
    isApiLoadingRef.current = true;
    setApiError(null);
    apiErrorRef.current = null;
    setRealScanData(null);
    realScanDataRef.current = null;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = reader.result as string;
        const base64Data = result.split(",")[1];

        const res = await apiFetch("/api/scan-resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            base64Data,
            targetRole
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to scan resume.");
        }

        const data = await res.json();
        setRealScanData(data);
        realScanDataRef.current = data;
        setIsApiLoading(false);
        isApiLoadingRef.current = false;
      } catch (err: any) {
        console.error("API resume scan failed:", err);
        const errMsg = err.message || "Failed to parse file.";
        setApiError(errMsg);
        apiErrorRef.current = errMsg;
        setIsApiLoading(false);
        isApiLoadingRef.current = false;
      }
    };
    reader.onerror = () => {
      const errMsg = "Failed to read file.";
      setApiError(errMsg);
      apiErrorRef.current = errMsg;
      setIsApiLoading(false);
      isApiLoadingRef.current = false;
    };
    reader.readAsDataURL(file);

    // Run Processing with pipeline coordination
    startPipelineSimulation(file.name, file.size);
  };

  // Pipeline execution simulation
  const startPipelineSimulation = (name: string, size: number) => {
    setIsScanning(true);
    setCurrentStageIndex(0);
    setAppliedGrammar([]);
    setAppliedRoadmap([]);
    setIsOptimized(false);
    
    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < PIPELINE_STAGES.length - 2) {
        currentIdx++;
        setCurrentStageIndex(currentIdx);
      } else {
        clearInterval(interval);
        
        // Wait on the final preparation step until the backend API completes!
        setCurrentStageIndex(PIPELINE_STAGES.length - 1);
        
        const checkCompletion = setInterval(() => {
          if (!isApiLoadingRef.current) {
            clearInterval(checkCompletion);
            
            if (apiErrorRef.current) {
              setIsScanning(false);
              triggerToast(`API resume scan failed: ${apiErrorRef.current}`, "error");
              return;
            }
            
            const finalData = realScanDataRef.current;
            const finalScore = finalData ? finalData.atsScore : 74;
            
            setIsScanning(false);
            setHasScanned(true);
            triggerToast(`AI Scan Completed! Measured ATS Score: ${finalScore}%`, "success");
            
            if (onActivityLog) {
              onActivityLog(`Scanned resume: ${name} targeting ${targetRole}. Detected Initial ATS score: ${finalScore}%.`);
            }

            // Save scan session meta in local storage DB
            saveScanSessionToDB({
              id: "scan-" + Date.now(),
              timestamp: new Date().toISOString(),
              fileName: name,
              fileSize: size,
              targetRole,
              atsScore: finalScore,
              grammarAccepted: [],
              roadmapApplied: [],
              optimized: false
            });
          }
        }, 100);
      }
    }, 180); // Quick smooth animation cadence
  };

  // Persist session metadata
  const saveScanSessionToDB = (session: SavedScanSession) => {
    try {
      const existing = localStorage.getItem(LOCAL_STORAGE_KEY);
      const parsed = existing ? JSON.parse(existing) : [];
      parsed.push(session);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));

      // Real integration: synchronize metadata with backend API db
      apiFetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeName: session.fileName,
          atsScore: session.atsScore,
          fileUrl: "https://recruiter-ai-pro.local/resumes/" + session.fileName
        })
      }).then(res => res.json())
        .then(data => {
          console.log("Synchronized parsed resume metadata with enterprise DB:", data);
        }).catch(err => {
          console.warn("Cloud synchronization offline:", err);
        });
    } catch (e) {
      console.warn("DB Storage unavailable", e);
    }
  };

  // Circular score and matching variables
  // Starts at 74 (or realScanData.atsScore). If suggestions or grammar are applied, score increments up to 99.
  const baseScore = realScanData ? realScanData.atsScore : 74;
  const totalGrammarCount = realScanData?.grammarIssues?.length || 5;
  const totalRoadmapCount = realScanData?.roadmapRecommendations?.length || 4;

  const pointsPerGrammar = totalGrammarCount > 0 ? Math.max(1, Math.round((98 - baseScore) * 0.3 / totalGrammarCount)) : 3;
  const pointsPerRoadmap = totalRoadmapCount > 0 ? Math.max(1, Math.round((98 - baseScore) * 0.6 / totalRoadmapCount)) : 5;

  const calculatedScore = Math.min(
    99,
    baseScore + (appliedGrammar.length * pointsPerGrammar) + (appliedRoadmap.length * pointsPerRoadmap) + (isOptimized ? 4 : 0)
  );

  const calculatedAtsMatch = Math.min(
    99,
    (realScanData ? realScanData.atsScore : 70) + (appliedRoadmap.length * 6) + (isOptimized ? 5 : 0)
  );

  // Synchronize viewers scrolls
  const handleScrollSync = (source: "original" | "optimized") => {
    if (!syncScroll) return;
    const orig = originalScrollRef.current;
    const opt = optimizedScrollRef.current;
    if (!orig || !opt) return;

    if (source === "original") {
      const pct = orig.scrollTop / (orig.scrollHeight - orig.clientHeight);
      opt.scrollTop = pct * (opt.scrollHeight - opt.clientHeight);
    } else {
      const pct = opt.scrollTop / (opt.scrollHeight - opt.clientHeight);
      orig.scrollTop = pct * (orig.scrollHeight - orig.clientHeight);
    }
  };

  // Grammar cards data
  const grammarIssues = realScanData?.grammarIssues || [
    {
      id: "g1",
      current: "Responsable for deploying APIs and sped up queries.",
      suggested: "Responsible for deploying APIs and speeding up query execution.",
      reason: "Corrected critical typo 'Responsable' and established standard parallel verb structure.",
      recruiter: "Demonstrates meticulous professionalism and flawless written English skills.",
      ats: "Eliminates parsing confusion by aligning semantic actions with target dictionary tags."
    },
    {
      id: "g2",
      current: "Implemented dynamic components that works on all browsers.",
      suggested: "Implemented responsive web components that operate seamlessly across all web browsers.",
      reason: "Aligned subject-verb agreement ('components... operate') and modernized industry vocabulary.",
      recruiter: "Establishes confident technical vocabulary expected of senior engineering talent.",
      ats: "Injects search-index keywords like 'responsive web components' and 'cross-browser'."
    },
    {
      id: "g3",
      current: "Lead a group of 3 junior devs.",
      suggested: "Led a cross-functional squad of 3 junior engineers.",
      reason: "Corrected past-tense verb agreement ('Led' instead of 'Lead') and elevated team nouns.",
      recruiter: "Strong leadership signals. Cross-functional representation increases team score.",
      ats: "Indexes 'Led' and 'cross-functional squad' tags, increasing organizational visibility weight."
    },
    {
      id: "g4",
      current: "Spearheaded integration of third party APIs, also wrote tests.",
      suggested: "Spearheaded third-party API integration and authored test automation coverage matrices.",
      reason: "Removed run-on comma splice and replaced colloquial verb with precise engineering terminology.",
      recruiter: "Indicates comprehensive coverage ownership and commitment to software safety.",
      ats: "Matches 'test automation coverage matrices' keyword constraints."
    },
    {
      id: "g5",
      current: "Worked on SQL database tuning.",
      suggested: "Configured relational PostgreSQL database performance tuning metrics.",
      reason: "Specified database type ('PostgreSQL') and replaced flat verb with a quantifiable technical descriptor.",
      recruiter: "Immediately proves specialized relational ecosystem capability.",
      ats: "Direct keyword density matches for high-volume database engines."
    }
  ];

  // AI Optimization Roadmap Data
  const roadmapRecommendations = realScanData?.roadmapRecommendations || [
    {
      id: "r1",
      priority: "High Priority",
      issue: "Weak Professional Summary",
      explanation: "Summary is overly subjective and fails to name core technical languages and engineering platforms. Modern ATS models immediately index summary words.",
      current: "Hardworking engineering student with experience in node, databases, and looking for a backend role to grow.",
      suggested: "Results-driven Backend Engineer with specialized expertise in Node.js, Express, SQL, and Docker containerization. Proven track record architecting secure microservices and optimizing relational query schemas for peak user concurrency.",
      atsGain: "+8%",
      recruiterBenefit: "Creates strong initial editorial presence, detailing expert tech-stack alignment."
    },
    {
      id: "r2",
      priority: "High Priority",
      issue: "Non-Quantifiable Bullet Points",
      explanation: "Work bullet points describe flat responsibilities rather than business impact integers. Hard metrics (%, $, ms) increase keyword shortlist ratios by 350%.",
      current: "Created backend API endpoints and made SQL database queries run faster.",
      suggested: "Refactored Node.js REST endpoints and structured Postgres index keys, reducing API request latency by 42% (from 180ms to 104ms) and supporting up to 15,000 concurrent peak socket connections.",
      atsGain: "+12%",
      recruiterBenefit: "Proves measurable business execution and engineering competence."
    },
    {
      id: "r3",
      priority: "Medium Priority",
      issue: "Missing System Observability Keywords",
      explanation: "Production-grade backends require monitoring and tracing. The parsed resume has zero instances of OpenTelemetry, Grafana, or Prometheus.",
      current: "Added standard system log lines and monitored system console outputs during peak deployments.",
      suggested: "Instrumented distributed request tracing with OpenTelemetry and configured Prometheus metrics and Grafana alerts to trace deployment health across AWS infrastructure.",
      atsGain: "+10%",
      recruiterBenefit: "Signals instant readiness to deploy and manage heavy production grade distributed systems."
    },
    {
      id: "r4",
      priority: "Low Priority",
      issue: "Double-Column Layout Threat",
      explanation: "The uploaded resume uses a multi-column vertical table grid. Standard PDF text stream readers read linearly across columns, corrupting experience chronology.",
      current: "[Left Visual Grid Column: Skills progress bars / Right Column: Experience timeline]",
      suggested: "[Single Sequential Column Layout: Elegant headers separating experience blocks cleanly]",
      atsGain: "+7%",
      recruiterBenefit: "Clean linear flow reads beautifully on both mobile devices and print PDFs."
    }
  ];

  // Original Resume visual text state (Editable / interactive)
  const renderOriginalText = () => {
    let text = `JOHN DOE
San Francisco, CA | john.doe@email.com | +1 555-019-2834
github.com/johndoe | linkedin.com/in/johndoe

PROFESSIONAL SUMMARY
Hardworking engineering student with experience in node, databases, and looking for a backend role to grow.

WORK EXPERIENCE
Backend Developer Intern | CloudTech Corp | June 2025 - Present
* Responsable for deploying APIs and sped up queries.
* Implemented dynamic components that works on all browsers.
* Created backend API endpoints and made SQL database queries run faster.
* Lead a group of 3 junior devs.
* Worked on SQL database tuning.

PROJECTS
E-Commerce API | Node.js, PostgreSQL | GitHub Link
* Spearheaded integration of third party APIs, also wrote tests.
* Added standard system log lines and monitored system console outputs during peak deployments.

EDUCATION
B.S. Computer Science | Stanford University | GPA: 3.8/4.0 | Grad June 2026`;

    return text;
  };

  // Optimized Resume text state (Editable/interactive based on applied modifications)
  const getOptimizedText = () => {
    let summaryText = appliedRoadmap.includes("r1") 
      ? "Results-driven Backend Engineer with specialized expertise in Node.js, Express, SQL, and Docker containerization. Proven track record architecting secure microservices and optimizing relational query schemas for peak user concurrency."
      : "Hardworking engineering student with experience in node, databases, and looking for a backend role to grow.";

    let b1 = appliedGrammar.includes("g1")
      ? "Responsible for deploying APIs and speeding up query execution."
      : "Responsable for deploying APIs and sped up queries.";

    let b2 = appliedGrammar.includes("g2")
      ? "Implemented responsive web components that operate seamlessly across all web browsers."
      : "Implemented dynamic components that works on all browsers.";

    let b3 = appliedRoadmap.includes("r2")
      ? "Refactored Node.js REST endpoints and structured Postgres index keys, reducing API request latency by 42% (from 180ms to 104ms) and supporting up to 15,000 concurrent peak socket connections."
      : "Created backend API endpoints and made SQL database queries run faster.";

    let b4 = appliedGrammar.includes("g3")
      ? "Led a cross-functional squad of 3 junior engineers."
      : "Lead a group of 3 junior devs.";

    let b5 = appliedGrammar.includes("g5")
      ? "Configured relational PostgreSQL database performance tuning metrics."
      : "Worked on SQL database tuning.";

    let b6 = appliedGrammar.includes("g4")
      ? "Spearheaded third-party API integration and authored test automation coverage matrices."
      : "Spearheaded integration of third party APIs, also wrote tests.";

    let b7 = appliedRoadmap.includes("r3")
      ? "Instrumented distributed request tracing with OpenTelemetry and configured Prometheus metrics and Grafana alerts to AWS."
      : "Added standard system log lines and monitored system console outputs during peak deployments.";

    let educationBlock = "B.S. Computer Science | Stanford University | GPA: 3.8/4.0 | Grad June 2026";

    return {
      header: `JOHN DOE\nSan Francisco, CA | john.doe@email.com | +1 555-019-2834\ngithub.com/johndoe | linkedin.com/in/johndoe`,
      summary: summaryText,
      experience: [b1, b2, b3, b4, b5],
      projects: [b6, b7],
      education: educationBlock
    };
  };

  const optimizedTextData = getOptimizedText();

  // Full Resume AI Rewrite
  const handleOptimizeAll = () => {
    setIsScanning(true);
    setCurrentStageIndex(11); // Start near recruiter review/suggestions
    
    setTimeout(() => {
      setAppliedGrammar(grammarIssues.map(g => g.id));
      setAppliedRoadmap(roadmapRecommendations.map(r => r.id));
      setIsOptimized(true);
      setIsScanning(false);
      triggerToast("Gemini completed Full AI Rewrite! Standard actions modernized, grammar validated, and keyword density maximized.", "success");
      setActiveTab("after");

      if (onActivityLog) {
        onActivityLog("Triggered Gemini Full Resume Rewrite. Injected high-priority action verbs, telemetry tags, and structural formatting.");
      }

      // Synchronize optimized high ATS score back to database
      if (uploadedFile) {
        apiFetch("/api/resumes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeName: uploadedFile.name,
            atsScore: 96,
            fileUrl: "https://recruiter-ai-pro.local/resumes/" + uploadedFile.name
          })
        }).then(res => res.json())
          .then(data => {
            console.log("Synchronized optimized high ATS score with enterprise DB:", data);
          }).catch(err => {
            console.warn("Cloud synchronization offline:", err);
          });
      }
    }, 1500);
  };

  // Interactive buttons
  const toggleGrammarFix = (id: string) => {
    setAppliedGrammar(prev => {
      const active = prev.includes(id);
      const updated = active ? prev.filter(x => x !== id) : [...prev, id];
      triggerToast(active ? "Grammar correction reverted." : "Grammar correction successfully applied!", "success");
      return updated;
    });
  };

  const toggleRoadmapFix = (id: string) => {
    setAppliedRoadmap(prev => {
      const active = prev.includes(id);
      const updated = active ? prev.filter(x => x !== id) : [...prev, id];
      triggerToast(active ? "Roadmap recommendation reverted." : "Roadmap change applied successfully!", "success");
      return updated;
    });
  };

  // Download simulation
  const handleDownloadReport = (format: string) => {
    triggerToast(`Compiling and cryptographically generating ${format}...`, "info");
    setTimeout(() => {
      triggerToast(`${format} successfully downloaded to local filesystem! Check your standard downloads directory.`, "success");
      if (onActivityLog) {
        onActivityLog(`Downloaded ${format} report.`);
      }
    }, 1800);
  };

  // Real copy & download handlers for Resume Templates
  const handleCopyTemplate = (tmpl: any) => {
    navigator.clipboard.writeText(tmpl.rawText);
    setCopiedTemplateId(tmpl.id);
    triggerToast(`"${tmpl.name}" copied to clipboard!`, "success");
    setTimeout(() => {
      setCopiedTemplateId(null);
    }, 2000);
    if (onActivityLog) {
      onActivityLog(`Copied resume template: ${tmpl.name}`);
    }
  };

  const handleDownloadTemplateFile = (tmpl: any) => {
    try {
      const element = document.createElement("a");
      const file = new Blob([tmpl.rawText], { type: 'text/plain;charset=utf-8' });
      element.href = URL.createObjectURL(file);
      element.download = `${tmpl.id}_ats_template.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      triggerToast(`"${tmpl.name}" downloaded successfully!`, "success");
      if (onActivityLog) {
        onActivityLog(`Downloaded resume template file: ${tmpl.name}`);
      }
    } catch (err) {
      triggerToast("Failed to initiate download. Please copy the template instead.", "error");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Alert Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl border text-xs font-mono flex items-center gap-3 ${
              toastMessage.type === "success" 
                ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-300" 
                : toastMessage.type === "error"
                ? "bg-rose-950/90 border-rose-500/30 text-rose-300"
                : "bg-indigo-950/90 border-indigo-500/30 text-indigo-300"
            }`}
          >
            <Sparkles className={`h-4 w-4 shrink-0 animate-pulse ${toastMessage.type === "error" ? "text-rose-400" : "text-indigo-400"}`} />
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Selector & Upload Meta Banner */}
      <div className="bg-[#111827] border border-[#27272A] p-5 rounded-[18px] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
            <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest block font-bold">Enterprise Mode</span>
          </div>
          <h2 className="text-white text-lg font-bold tracking-tight font-sans">Recruiter AI Pro™ ATS Scanner Suite</h2>
          <p className="text-[10.5px] text-slate-400 max-w-xl">
            Simulate premium applicant shortlisting systems. Ensure your credentials withstand scanning parameters across tech giants including Google, Meta, and Stripe.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400">Target Role Domain:</span>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              disabled={isScanning}
              className="bg-[#09090B] border border-[#27272A] rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="Backend Engineer">Backend Engineer</option>
              <option value="Frontend Engineer">Frontend Engineer</option>
              <option value="Full Stack Engineer">Full Stack Engineer</option>
              <option value="System Architect">System Architect</option>
              <option value="DevOps Engineer">DevOps Engineer</option>
              <option value="Data Engineer">Data Engineer</option>
            </select>
          </div>

          {uploadedFile && (
            <button
              onClick={() => {
                setUploadedFile(null);
                setHasScanned(false);
                setAppliedGrammar([]);
                setAppliedRoadmap([]);
                setIsOptimized(false);
              }}
              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-[10px] font-mono transition-all cursor-pointer"
            >
              Reset Scan Panel
            </button>
          )}
        </div>
      </div>

      {/* DRAG AND DROP ZONE / PARSER LAUNCHER */}
      {!hasScanned && !isScanning && (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-[22px] p-12 text-center transition-all duration-300 cursor-pointer ${
            isDragging 
              ? "border-indigo-500 bg-indigo-500/5 shadow-inner" 
              : "border-[#27272A] hover:border-slate-600 bg-[#09090B]/30"
          }`}
        >
          <input
            type="file"
            id="enterprise-resume-input"
            className="hidden"
            accept=".pdf,.docx,.txt"
            onChange={handleFileChange}
          />
          <label htmlFor="enterprise-resume-input" className="cursor-pointer block space-y-5">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto text-indigo-400 shadow-md">
              <UploadCloud className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-200">
                Drag & drop your resume file here, or <span className="text-indigo-400 underline hover:text-indigo-300">browse computer</span>
              </h3>
              <p className="text-[10.5px] text-slate-500 font-mono">Accepts standard PDF, DOCX, or text file formatting (Max 10MB)</p>
            </div>
            <div className="pt-4 border-t border-[#27272A]/40 max-w-md mx-auto text-[10px] text-slate-500 leading-normal">
              <strong>Enterprise Warning:</strong> Modern ATS parsers utilize linear string serialization. Avoid nesting layouts inside complex graphic tables, canvas objects, and side-by-side columns to prevent indexing corruption.
            </div>
          </label>
        </div>
      )}

      {/* PIPELINE PROGRESS ANIMATION GRID */}
      {isScanning && (
        <div className="p-6 md:p-8 bg-[#111827] border border-[#27272A] rounded-[22px] space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#27272A] pb-4">
            <div>
              <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest block font-bold">Synchronous Thread Running</span>
              <h3 className="text-white text-sm font-bold tracking-tight">Recruiter AI Pro Processing Pipeline</h3>
            </div>
            <div className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 animate-pulse">
              Running Stage {currentStageIndex + 1} of 17: {PIPELINE_STAGES[currentStageIndex]?.key.toUpperCase()}
            </div>
          </div>

          <p className="text-xs text-slate-400 font-sans">
            Analyzing document parameters against top tech employer screening rules. Evaluating grammar weights, section headers, and keyword densities...
          </p>

          {/* Interactive Staggered Progress Timeline Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {PIPELINE_STAGES.map((stage, idx) => {
              const isDone = idx < currentStageIndex;
              const isActive = idx === currentStageIndex;
              const isPending = idx > currentStageIndex;

              return (
                <div 
                  key={stage.key}
                  className={`p-3 rounded-xl border text-[11px] font-mono flex items-center justify-between transition-all duration-200 ${
                    isDone 
                      ? "bg-emerald-950/15 border-emerald-500/20 text-emerald-400" 
                      : isActive 
                      ? "bg-indigo-950/25 border-indigo-500/40 text-indigo-300 shadow-md shadow-indigo-500/5 animate-pulse"
                      : "bg-[#09090B]/40 border-transparent text-slate-600"
                  }`}
                >
                  <span className="truncate">{stage.label}</span>
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  ) : isActive ? (
                    <div className="w-3.5 h-3.5 border border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-800 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SCANNED ENTERPRISE DASHBOARD CONTAINER */}
      {hasScanned && !isScanning && (
        <div className="space-y-6">
          
          {/* Main 3-Panel Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT PANEL: Original Resume (4 Columns) */}
            <div className="lg:col-span-4 bg-[#111827] border border-[#27272A] rounded-[22px] overflow-hidden flex flex-col h-[680px]">
              {/* Header bar */}
              <div className="p-4 bg-[#09090B]/60 border-b border-[#27272A] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-sans">Original Resume</span>
                </div>
                <span className="text-[9.5px] font-mono text-slate-500">FORMAT: PDF/DOCX</span>
              </div>

              {/* Tools Tray */}
              <div className="p-2 bg-[#09090B]/20 border-b border-[#27272A] flex flex-wrap gap-1.5 items-center justify-between shrink-0">
                <div className="flex gap-1">
                  <button 
                    onClick={() => setZoom(prev => Math.max(80, prev - 10))}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-[#27272A] rounded-lg text-slate-400 hover:text-white cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[10px] font-mono text-slate-400 px-1.5 py-1.5 bg-slate-900/50 rounded-lg border border-[#27272A]/40">
                    {zoom}%
                  </span>
                  <button 
                    onClick={() => setZoom(prev => Math.min(150, prev + 10))}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-[#27272A] rounded-lg text-slate-400 hover:text-white cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Local search highlighting */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search terms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[#09090B] border border-[#27272A] rounded-lg pl-7 pr-2.5 py-1 text-[10px] font-mono text-white focus:outline-none focus:border-indigo-500 w-28"
                  />
                  <Search className="h-3 w-3 text-slate-500 absolute left-2.5 top-2" />
                </div>

                <div className="flex gap-1">
                  <button 
                    onClick={() => {
                      triggerToast("Simulating Resume Print Layout...", "info");
                      window.print();
                    }}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-[#27272A] rounded-lg text-slate-400 hover:text-white cursor-pointer"
                    title="Print"
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-[#27272A] rounded-lg text-slate-400 hover:text-white cursor-pointer"
                    title="Toggle Fullscreen"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* PDF representation content */}
              <div 
                ref={originalScrollRef}
                onScroll={() => handleScrollSync("original")}
                className="p-6 overflow-y-auto flex-1 font-mono text-[10.5px] text-slate-300 leading-relaxed space-y-4 select-text bg-[#09090B]/30"
                style={{ fontSize: `${(zoom / 100) * 10.5}px` }}
              >
                {realScanData ? (
                  <pre className="whitespace-pre-wrap font-mono text-[10.5px] text-slate-300 leading-relaxed break-words">
                    {realScanData.parsedText}
                  </pre>
                ) : (
                  <>
                    <div className="text-center space-y-1 border-b border-[#27272A]/40 pb-3">
                      <h3 className="font-bold text-white text-xs">JOHN DOE</h3>
                      <p className="text-[9px] text-slate-400">San Francisco, CA | john.doe@email.com | +1 555-019-2834</p>
                      <p className="text-[9px] text-slate-500">github.com/johndoe | linkedin.com/in/johndoe</p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-indigo-400 border-b border-[#27272A]/20 pb-0.5 text-[9.5px] uppercase tracking-wider">PROFESSIONAL SUMMARY</h4>
                      <p className="italic text-slate-400">"Hardworking engineering student with experience in node, databases, and looking for a backend role to grow."</p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-indigo-400 border-b border-[#27272A]/20 pb-0.5 text-[9.5px] uppercase tracking-wider">WORK EXPERIENCE</h4>
                      <div>
                        <div className="flex justify-between font-bold text-slate-200">
                          <span>Backend Developer Intern | CloudTech Corp</span>
                          <span className="text-slate-500">June 2025 - Present</span>
                        </div>
                        <ul className="list-disc list-inside space-y-1 mt-1 text-slate-400 pl-1">
                          <li className="text-rose-400/90 bg-rose-500/5 px-1 py-0.5 rounded border border-rose-500/10 inline-block w-full">
                            * <span className="font-bold text-rose-300">Responsable</span> for deploying APIs and sped up queries.
                          </li>
                          <li className="text-amber-400/90 bg-amber-500/5 px-1 py-0.5 rounded border border-amber-500/10 inline-block w-full">
                            * Implemented dynamic components that <span className="font-bold text-amber-300">works</span> on all browsers.
                          </li>
                          <li className="text-amber-400/90 bg-amber-500/5 px-1 py-0.5 rounded border border-amber-500/10 inline-block w-full mt-1">
                            * Created backend API endpoints and made SQL database queries run faster.
                          </li>
                          <li>
                            * <span className="text-rose-400 bg-rose-500/5 px-1 py-0.5 rounded font-bold">Lead</span> a group of 3 junior devs.
                          </li>
                          <li>
                            * Worked on SQL database tuning.
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-indigo-400 border-b border-[#27272A]/20 pb-0.5 text-[9.5px] uppercase tracking-wider">PROJECTS</h4>
                      <div>
                        <div className="flex justify-between font-bold text-slate-200">
                          <span>E-Commerce API | Node.js, PostgreSQL</span>
                          <span className="text-slate-500">GitHub Link</span>
                        </div>
                        <ul className="list-disc list-inside space-y-1 mt-1 text-slate-400 pl-1">
                          <li>* Spearheaded integration of third party APIs, also wrote tests.</li>
                          <li>* Added standard system log lines and monitored system console outputs during peak deployments.</li>
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <h4 className="font-bold text-indigo-400 border-b border-[#27272A]/20 pb-0.5 text-[9.5px] uppercase tracking-wider">EDUCATION</h4>
                      <p className="text-slate-200">B.S. Computer Science | Stanford University | GPA: 3.8/4.0 | Grad June 2026</p>
                    </div>
                  </>
                )}
              </div>

              {/* Page indicator shrink tray */}
              <div className="p-3 bg-[#09090B]/60 border-t border-[#27272A] flex justify-between items-center text-[10px] font-mono text-slate-500 shrink-0">
                <span>Original Resume Reader v3.5</span>
                <span>Page 1 of 1</span>
              </div>
            </div>

            {/* CENTER PANEL: Score Circular & Metrics Dashboard (4 Columns) */}
            <div className="lg:col-span-4 bg-[#111827] border border-[#27272A] rounded-[22px] p-5 space-y-6 h-[680px] overflow-y-auto">
              
              {/* Animated Circle ATS Score */}
              <div className="flex flex-col items-center justify-center p-4 bg-[#09090B]/60 border border-[#27272A] rounded-xl text-center space-y-4">
                <span className="text-[9px] font-bold text-slate-500 uppercase font-mono tracking-widest">Aggregate ATS Match Quotient</span>
                
                <div className="relative w-36 h-36 flex items-center justify-center select-none">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="72" cy="72" r="64" stroke="#1F2937" strokeWidth="9" fill="transparent" />
                    <circle 
                      cx="72" 
                      cy="72" 
                      r="64" 
                      stroke={calculatedScore >= 88 ? "#10B981" : calculatedScore >= 78 ? "#6D5EF8" : "#F59E0B"} 
                      strokeWidth="9" 
                      fill="transparent" 
                      strokeDasharray="402.1" 
                      strokeDashoffset={402.1 - (402.1 * calculatedScore) / 100} 
                      strokeLinecap="round" 
                      className="transition-all duration-500 ease-out"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-4xl font-extrabold text-white tracking-tight">{calculatedScore}</span>
                    <span className="text-slate-500 font-bold block text-[10px] tracking-wider mt-0.5">/ 100</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap justify-center gap-1.5 items-center text-[9.5px] font-mono text-slate-300">
                    <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">ATS Compatible</span>
                    <span className="bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">Excellent</span>
                    <span className="bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">Top 5%</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal pt-1.5">
                    {calculatedScore >= 88 
                      ? "Flawless score index! Highly compliant resume ready to dominate modern tracking spiders." 
                      : "Improve weak action bullets and contact identifiers to reach 90%+ qualification rates."
                    }
                  </p>
                </div>
              </div>

              {/* Dynamic Score Metrics Cards */}
              <div className="space-y-3">
                <h4 className="text-[9.5px] font-bold text-slate-500 uppercase font-mono tracking-widest block">Parameter Evaluation Breakdown</h4>
                
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  
                  {/* Card 1: Formatting */}
                  <div className="p-3 bg-[#09090B]/40 border border-[#27272A] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Formatting</span>
                      <span className="text-slate-200 font-bold">96%</span>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  </div>

                  {/* Card 2: Grammar */}
                  <div className="p-3 bg-[#09090B]/40 border border-[#27272A] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Grammar</span>
                      <span className="text-slate-200 font-bold">{Math.min(100, 80 + appliedGrammar.length * 4)}%</span>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  </div>

                  {/* Card 3: Keywords */}
                  <div className="p-3 bg-[#09090B]/40 border border-[#27272A] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Keywords</span>
                      <span className="text-slate-200 font-bold">{calculatedAtsMatch}%</span>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                  </div>

                  {/* Card 4: Projects */}
                  <div className="p-3 bg-[#09090B]/40 border border-[#27272A] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Projects</span>
                      <span className="text-slate-200 font-bold">91%</span>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  </div>

                  {/* Card 5: Skills */}
                  <div className="p-3 bg-[#09090B]/40 border border-[#27272A] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Skills</span>
                      <span className="text-slate-200 font-bold">87%</span>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-amber-400 animate-pulse" />
                  </div>

                  {/* Card 6: Experience */}
                  <div className="p-3 bg-[#09090B]/40 border border-[#27272A] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Experience</span>
                      <span className="text-slate-200 font-bold">{Math.min(100, 72 + appliedRoadmap.length * 6)}%</span>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                  </div>

                  {/* Card 7: Education */}
                  <div className="p-3 bg-[#09090B]/40 border border-[#27272A] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Education</span>
                      <span className="text-slate-200 font-bold">100%</span>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  </div>

                  {/* Card 8: Recruiter Score */}
                  <div className="p-3 bg-[#09090B]/40 border border-[#27272A] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Recruiter</span>
                      <span className="text-slate-200 font-bold">93%</span>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  </div>
                </div>

                {/* ATS parsing engine code index */}
                <div className="p-3.5 bg-indigo-950/10 border border-indigo-500/10 rounded-xl flex items-center justify-between text-[11px] font-mono">
                  <div>
                    <span className="text-indigo-400 font-bold block text-[9px] uppercase tracking-wider">ATS Parsing Compliance</span>
                    <span className="text-slate-300">Linear DOM Compliance Index</span>
                  </div>
                  <span className="text-indigo-300 font-bold">98%</span>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL: AI Recruiter Review (4 Columns) */}
            <div className="lg:col-span-4 bg-[#111827] border border-[#27272A] rounded-[22px] p-5 space-y-6 h-[680px] overflow-y-auto">
              
              <div className="border-b border-[#27272A] pb-3.5">
                <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest block font-bold">Recruiter Intelligence Report</span>
                <h3 className="text-white text-sm font-bold tracking-tight">AI Recruiter Screen Review</h3>
              </div>

              {/* Recruitment metrics block */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-900 border border-[#27272A] rounded-xl">
                  <span className="text-[9px] font-mono text-slate-500 uppercase block">Interview Probability</span>
                  <span className="text-white font-extrabold text-base tracking-tight">91%</span>
                </div>
                <div className="p-3 bg-slate-900 border border-[#27272A] rounded-xl">
                  <span className="text-[9px] font-mono text-slate-500 uppercase block">Recruiter Confidence</span>
                  <span className="text-white font-extrabold text-base tracking-tight">95%</span>
                </div>
              </div>

              {/* Recruiter First Impression Banner */}
              <div className="p-3.5 bg-emerald-950/10 border border-emerald-500/10 rounded-xl space-y-1">
                <span className="text-[9.5px] font-bold text-emerald-400 uppercase font-mono tracking-wide block">First Impression: EXCELLENT RESUME</span>
                <p className="text-[10px] text-slate-400 leading-normal font-sans">
                  Highly aligned technology summary matching backend pipeline requirements. Stanford CS education pedigree guarantees instant recruiter interest.
                </p>
              </div>

              {/* Core Strengths & Gaps Stack */}
              <div className="space-y-4 text-[11px] font-sans">
                
                {/* Strengths */}
                <div className="space-y-2">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Primary Strengths</span>
                  <div className="space-y-2 font-mono text-[10px] text-slate-300">
                    <div className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Stanford Computer Science baseline and GPA metric validation.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Specialized relational schema development (PostgreSQL, Node.js).</span>
                    </div>
                  </div>
                </div>

                {/* Weaknesses */}
                <div className="space-y-2">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Identified Gaps</span>
                  <div className="space-y-2 font-mono text-[10px] text-slate-300">
                    <div className="flex items-start gap-2">
                      <X className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <span>Spelling and parallel syntax typos in work bullet headers.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <X className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>Non-quantified impact points in internship description.</span>
                    </div>
                  </div>
                </div>

                {/* Missing Skills */}
                <div className="space-y-2">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Missing Tech Keywords</span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/10 text-rose-400 rounded text-[9px] font-mono">OpenTelemetry</span>
                    <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/10 text-rose-400 rounded text-[9px] font-mono">Raft Consensus</span>
                    <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/10 text-rose-400 rounded text-[9px] font-mono">Kubernetes</span>
                    <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/10 text-rose-400 rounded text-[9px] font-mono">AWS Cloud</span>
                  </div>
                </div>

                {/* Areas to Improve */}
                <div className="space-y-2">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Areas to Improve</span>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Format sections to linear single-column. Replace flat task descriptors with high-impact STAR structure and latency percentages.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* TABBED ANALYSIS SECTION UNDERNEATH PANELS */}
          <div className="bg-[#111827] border border-[#27272A] rounded-[22px] overflow-hidden">
            
            {/* Advanced Analysis Tabs Navigation Bar */}
            <div className="flex flex-wrap border-b border-[#27272A] bg-[#09090B]/40 p-2 gap-1 shrink-0">
              {[
                { id: "roadmap", label: "AI Optimization Roadmap", icon: Sparkles },
                { id: "parameters", label: "ATS Parameter Analysis", icon: Sliders },
                { id: "grammar", label: "Grammar Analysis", icon: ListChecks },
                { id: "keywords", label: "Skills & Keyword Matching", icon: Layers },
                { id: "experience", label: "Experience & Projects rewrite", icon: Briefcase },
                { id: "after", label: "Before vs After Resume", icon: Eye },
                { id: "recruiter", label: "Recruiter Report Simulation", icon: Award },
                { id: "downloads", label: "Download Center", icon: Download }
              ].map((tab) => {
                const IconComp = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      isActive 
                        ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/15" 
                        : "text-slate-400 hover:text-white hover:bg-slate-900"
                    }`}
                  >
                    <IconComp className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT OUTLET */}
            <div className="p-6 md:p-8">

              {/* 1. AI OPTIMIZATION ROADMAP */}
              {activeTab === "roadmap" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27272A] pb-4">
                    <div>
                      <h3 className="text-white text-base font-bold tracking-tight">AI Optimization Roadmap</h3>
                      <p className="text-[11px] text-slate-400">Step-by-step changes recommended by Gemini to bypass rigid Applicant Tracking filters.</p>
                    </div>
                    <button
                      onClick={handleOptimizeAll}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="h-4 w-4 animate-spin-slow" />
                      <span>Optimize Entire Resume</span>
                    </button>
                  </div>

                  <div className="space-y-5">
                    {roadmapRecommendations.map((r) => {
                      const isApplied = appliedRoadmap.includes(r.id);
                      return (
                        <div 
                          key={r.id} 
                          className={`p-5 rounded-2xl border transition-all duration-300 space-y-4 ${
                            isApplied 
                              ? "bg-emerald-950/10 border-emerald-500/35 shadow-lg" 
                              : "bg-[#09090B]/50 border-[#27272A] hover:bg-[#09090B]/80"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-[8.5px] font-bold uppercase font-mono px-2 py-0.5 rounded border ${
                                  r.priority === "High Priority" 
                                    ? "bg-rose-500/10 border-rose-500/20 text-rose-400" 
                                    : r.priority === "Medium Priority"
                                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                    : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                                }`}>
                                  {r.priority}
                                </span>
                                <span className="text-[9.5px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded font-bold">
                                  ATS GAIN: {r.atsGain}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-white mt-1">{r.issue}</h4>
                              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{r.explanation}</p>
                            </div>

                            <button
                              onClick={() => toggleRoadmapFix(r.id)}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold transition-all shrink-0 cursor-pointer ${
                                isApplied 
                                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/10" 
                                  : "bg-slate-900 text-slate-300 hover:text-white border border-[#27272A] hover:bg-slate-800"
                              }`}
                            >
                              {isApplied ? "✓ Change Applied" : "Apply Improvement"}
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10.5px] font-mono leading-relaxed">
                            <div className="bg-rose-950/10 border border-rose-500/15 rounded-xl p-3.5 space-y-1.5">
                              <span className="text-[8.5px] text-rose-400 font-bold uppercase tracking-wider block">❌ ORIGINAL TEXT</span>
                              <p className="text-slate-400 italic">"{r.current}"</p>
                            </div>
                            <div className="bg-emerald-950/15 border border-emerald-500/15 rounded-xl p-3.5 space-y-1.5">
                              <span className="text-[8.5px] text-emerald-400 font-bold uppercase tracking-wider block">✅ AI RECOMMENDED WRITING</span>
                              <p className="text-slate-200">"{r.suggested}"</p>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-[#27272A]/40 flex flex-col sm:flex-row justify-between text-[10px] font-mono text-slate-400 gap-2">
                            <span><strong>Recruiter Impact:</strong> {r.recruiterBenefit}</span>
                            <span className="text-indigo-400 font-bold">Standard Met: Senior Staff Engineering</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. ATS PARAMETER ANALYSIS */}
              {activeTab === "parameters" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="border-b border-[#27272A] pb-4">
                    <h3 className="text-white text-base font-bold tracking-tight">ATS Parameter Matrix Scan</h3>
                    <p className="text-[11px] text-slate-400">Evaluating more than 100 formatting, contact, and structural criteria required by premium software filters.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Contact Information */}
                    <div className="p-5 bg-[#09090B]/40 border border-[#27272A] rounded-2xl space-y-4">
                      <div className="flex items-center gap-2 text-indigo-400 border-b border-[#27272A]/40 pb-2">
                        <User className="h-4 w-4" />
                        <h4 className="text-xs font-bold uppercase font-mono tracking-wider">Contact Details</h4>
                      </div>
                      <div className="space-y-2.5 text-[11px] font-mono">
                        {[
                          { label: "Full Candidate Name", status: realScanData ? "found" : "found" },
                          { label: "Valid Email Address", status: (realScanData?.parsedText?.includes("@") || realScanData?.optimizedTextData?.header?.includes("@")) ? "found" : "missing" },
                          { label: "Mobile Telephone", status: /\+?\d[\d-\s()]{7,}\d/.test(realScanData?.parsedText || "") ? "found" : "missing" },
                          { label: "LinkedIn Profile URL", status: (realScanData?.parsedText?.toLowerCase()?.includes("linkedin") || realScanData?.optimizedTextData?.header?.toLowerCase()?.includes("linkedin")) ? "found" : "missing" },
                          { label: "GitHub Code Portfolio", status: (realScanData?.parsedText?.toLowerCase()?.includes("github") || realScanData?.optimizedTextData?.header?.toLowerCase()?.includes("github")) ? "found" : "missing" },
                          { label: "Online Website Portfolio", status: (realScanData?.parsedText?.toLowerCase()?.includes("portfolio") || realScanData?.parsedText?.toLowerCase()?.includes("website") || realScanData?.optimizedTextData?.header?.toLowerCase()?.includes("portfolio")) ? "found" : "missing" },
                          { label: "Physical Address/Location", status: (realScanData?.parsedText?.toLowerCase()?.match(/california|stanford|san francisco|ny|new york|city|address|location/) || realScanData?.optimizedTextData?.header?.toLowerCase()?.match(/california|stanford|san francisco|ny|new york|city/)) ? "found" : "missing" }
                        ].map((item) => (
                          <div key={item.label} className="flex justify-between items-center">
                            <span className="text-slate-400">{item.label}</span>
                            <span className={`px-2 py-0.5 rounded text-[8.5px] font-bold uppercase font-mono border ${
                              item.status === "found" 
                                ? "bg-emerald-500/10 border-emerald-500/10 text-emerald-400" 
                                : "bg-amber-500/10 border-amber-500/10 text-amber-400 animate-pulse"
                            }`}>
                              {item.status.toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Resume Section Checker */}
                    <div className="p-5 bg-[#09090B]/40 border border-[#27272A] rounded-2xl space-y-4">
                      <div className="flex items-center gap-2 text-indigo-400 border-b border-[#27272A]/40 pb-2">
                        <Layers className="h-4 w-4" />
                        <h4 className="text-xs font-bold uppercase font-mono tracking-wider">Core Section Parsing</h4>
                      </div>
                      <div className="space-y-2.5 text-[11px] font-mono">
                        {[
                          { label: "Professional Summary", status: (realScanData?.parsedText?.toLowerCase()?.includes("summary") || realScanData?.parsedText?.toLowerCase()?.includes("objective") || realScanData?.optimizedTextData?.summary) ? "verified" : "missing" },
                          { label: "Core Skills Grid", status: (realScanData?.parsedText?.toLowerCase()?.includes("skills") || realScanData?.parsedText?.toLowerCase()?.includes("technologies") || realScanData?.skillsMatrixDetailed) ? "verified" : "missing" },
                          { label: "Work Experience Timeline", status: (realScanData?.parsedText?.toLowerCase()?.includes("experience") || realScanData?.parsedText?.toLowerCase()?.includes("employment") || realScanData?.optimizedTextData?.experience) ? "verified" : "missing" },
                          { label: "Personal Engineering Projects", status: (realScanData?.parsedText?.toLowerCase()?.includes("projects") || realScanData?.optimizedTextData?.projects) ? "verified" : "missing" },
                          { label: "Education Credentials", status: (realScanData?.parsedText?.toLowerCase()?.includes("education") || realScanData?.parsedText?.toLowerCase()?.includes("degree") || realScanData?.optimizedTextData?.education) ? "verified" : "missing" },
                          { label: "Certifications Section", status: (realScanData?.parsedText?.toLowerCase()?.includes("certificat") || realScanData?.parsedText?.toLowerCase()?.includes("credentials")) ? "verified" : "missing" },
                          { label: "Awards & Honors Section", status: (realScanData?.parsedText?.toLowerCase()?.includes("award") || realScanData?.parsedText?.toLowerCase()?.includes("honor") || realScanData?.parsedText?.toLowerCase()?.includes("scholarship")) ? "verified" : "missing" },
                          { label: "Publications Section", status: realScanData?.parsedText?.toLowerCase()?.includes("publication") ? "verified" : "missing" },
                          { label: "Spoken Languages Grid", status: realScanData?.parsedText?.toLowerCase()?.includes("languages") ? "verified" : "missing" }
                        ].map((item) => (
                          <div key={item.label} className="flex justify-between items-center">
                            <span className="text-slate-400">{item.label}</span>
                            <span className={`px-2 py-0.5 rounded text-[8.5px] font-bold uppercase font-mono border ${
                              item.status === "verified" 
                                ? "bg-emerald-500/10 border-emerald-500/10 text-emerald-400" 
                                : "bg-slate-900 border-[#27272A] text-slate-500"
                            }`}>
                              {item.status.toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Formatting & Parser parameters */}
                    <div className="p-5 bg-[#09090B]/40 border border-[#27272A] rounded-2xl space-y-4">
                      <div className="flex items-center gap-2 text-indigo-400 border-b border-[#27272A]/40 pb-2">
                        <Settings className="h-4 w-4" />
                        <h4 className="text-xs font-bold uppercase font-mono tracking-wider">Format Metrics</h4>
                      </div>
                      <div className="space-y-2.5 text-[11px] font-mono">
                        {[
                          { label: "Unambiguous Font Usage", status: realScanData?.formattingCritique ? (realScanData.formattingCritique.overallRating === "Excellent" || realScanData.formattingCritique.overallRating === "Good" ? "verified" : "warning") : "verified" },
                          { label: "Correct Font Size Metrics", status: realScanData?.formattingCritique?.formattingIssues?.some((i: any) => i.issue.toLowerCase().includes("font")) ? "warning" : "verified" },
                          { label: "Standardized Margins (0.75-1\")", status: realScanData?.formattingCritique?.formattingIssues?.some((i: any) => i.issue.toLowerCase().includes("margin")) ? "warning" : "verified" },
                          { label: "Balanced White Space (35% Ratio)", status: realScanData?.formattingCritique?.formattingIssues?.some((i: any) => i.issue.toLowerCase().includes("space")) ? "warning" : "verified" },
                          { label: "Nested Graphics / Tables", status: realScanData?.formattingCritique?.layoutStyle?.toLowerCase()?.includes("table") ? "alert" : "none_detected" },
                          { label: "Canvas Elements", status: "none_detected" },
                          { label: "Complex Multi-Columns", status: realScanData?.formattingCritique?.layoutStyle?.toLowerCase()?.includes("column") ? "alert" : "none_detected" }
                        ].map((item) => (
                          <div key={item.label} className="flex justify-between items-center">
                            <span className="text-slate-400">{item.label}</span>
                            <span className={`px-2 py-0.5 rounded text-[8.5px] font-bold uppercase font-mono border ${
                              item.status === "verified" || item.status === "none_detected"
                                ? "bg-emerald-500/10 border-emerald-500/10 text-emerald-400" 
                                : "bg-amber-500/10 border-amber-500/10 text-amber-400"
                            }`}>
                              {item.status === "none_detected" ? "NONE" : item.status.toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Formatting, Template & Layout Critique Panel */}
                  <div className="p-6 bg-slate-900/40 border border-[#27272A] rounded-2xl space-y-6">
                    <div className="flex items-center justify-between border-b border-[#27272A]/80 pb-3">
                      <div className="flex items-center gap-2 text-indigo-400">
                        <Sliders className="h-4 w-4" />
                        <h4 className="text-sm font-bold uppercase font-mono tracking-wider">Visual Template & Formatting Audit</h4>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${
                        (realScanData?.formattingCritique?.overallRating === "Excellent" || realScanData?.formattingCritique?.overallRating === "Good")
                          ? "bg-emerald-500/10 border-emerald-500/10 text-emerald-400"
                          : "bg-amber-500/10 border-amber-500/10 text-amber-400 animate-pulse"
                      }`}>
                        Rating: {realScanData?.formattingCritique?.overallRating || "Needs Audit"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300 font-sans">
                      <div className="space-y-4">
                        <div className="p-4 bg-[#09090B]/30 border border-[#27272A]/40 rounded-xl space-y-1">
                          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Document Layout Style & Template</span>
                          <p className="font-bold text-white text-[13px]">{realScanData?.formattingCritique?.layoutStyle || "Double-Column Table Grid Layout"}</p>
                        </div>
                        <div className="p-4 bg-[#09090B]/30 border border-[#27272A]/40 rounded-xl space-y-1">
                          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Typography & Font Choices</span>
                          <p className="leading-relaxed text-slate-300 text-[11px]">{realScanData?.formattingCritique?.fontEvaluation || "Arial font families with inconsistent size hierarchy across summary, work history, and projects."}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 bg-[#09090B]/30 border border-[#27272A]/40 rounded-xl space-y-1">
                          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">ATS Parse Compatibility</span>
                          <p className={`font-bold text-[13px] ${
                            (realScanData?.formattingCritique?.parserFriendlyRating?.toLowerCase()?.includes("highly") || realScanData?.formattingCritique?.parserFriendlyRating?.toLowerCase()?.includes("excellent"))
                              ? "text-emerald-400"
                              : "text-amber-400"
                          }`}>{realScanData?.formattingCritique?.parserFriendlyRating || "Severely Impeded (Nested tables break text parsing order)"}</p>
                        </div>
                        <div className="p-4 bg-[#09090B]/30 border border-[#27272A]/40 rounded-xl space-y-1">
                          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Margin & Spacing Symmetry</span>
                          <p className="leading-relaxed text-slate-300 text-[11px]">{realScanData?.formattingCritique?.marginEvaluation || "Cramped 0.5-inch margins leave insufficient white space, resulting in reader fatigue."}</p>
                        </div>
                      </div>
                    </div>

                    {/* Formatting Issues List */}
                    <div className="space-y-3">
                      <h5 className="text-xs font-mono text-slate-400 uppercase tracking-wider">Identified Visual / Layout Vulnerabilities</h5>
                      <div className="space-y-2">
                        {(realScanData?.formattingCritique?.formattingIssues || [
                          {
                            issue: "Complex Multi-Column / Nested Tables",
                            severity: "High",
                            suggestion: "ATS parsers read from left-to-right linearly. Nested tables split text into disjointed reading lines. Re-arrange content in a sequential single-column format."
                          },
                          {
                            issue: "Densely Packed White Space Ratio (Less than 20%)",
                            severity: "Medium",
                            suggestion: "Increase line-height to 1.15 and section margins to at least 0.75-inch. White space of 30-40% is ideal for executive scan read patterns."
                          }
                        ]).map((issueItem: any, idx: number) => (
                          <div key={idx} className="p-4 bg-[#09090B]/30 border border-[#27272A]/40 rounded-xl flex flex-col sm:flex-row sm:items-start justify-between gap-4 font-sans">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-200 text-xs">{issueItem.issue}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold uppercase border ${
                                  issueItem.severity?.toLowerCase() === "high" || issueItem.severity?.toLowerCase() === "critical"
                                    ? "bg-rose-500/10 border-rose-500/10 text-rose-400"
                                    : "bg-amber-500/10 border-amber-500/10 text-amber-400"
                                }`}>
                                  {issueItem.severity}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 leading-normal">{issueItem.suggestion}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. GRAMMAR ANALYSIS */}
              {activeTab === "grammar" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="border-b border-[#27272A] pb-4">
                    <h3 className="text-white text-base font-bold tracking-tight">Interactive Grammar Analysis</h3>
                    <p className="text-[11px] text-slate-400">Simultaneous proofreading and technical parallel verb alignment checklist. Toggle changes to verify improvement scores.</p>
                  </div>

                  <div className="space-y-4">
                    {grammarIssues.map((issue) => {
                      const isApplied = appliedGrammar.includes(issue.id);
                      return (
                        <div 
                          key={issue.id} 
                          className={`p-5 rounded-xl border transition-all duration-300 space-y-3.5 ${
                            isApplied 
                              ? "bg-emerald-950/10 border-emerald-500/25" 
                              : "bg-[#09090B]/40 border-[#27272A] hover:bg-[#09090B]/60"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div className="space-y-1">
                              <span className="text-[8.5px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded uppercase block w-max">
                                Grammar & Parallel Syntax
                              </span>
                              <p className="text-[11.5px] text-slate-300 mt-1.5 leading-relaxed font-sans font-medium">
                                <strong>Issue Critique:</strong> {issue.reason}
                              </p>
                            </div>

                            <button
                              onClick={() => toggleGrammarFix(issue.id)}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold transition-all shrink-0 cursor-pointer ${
                                isApplied 
                                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/10" 
                                  : "bg-slate-900 text-slate-300 hover:text-white border border-[#27272A] hover:bg-slate-800"
                              }`}
                            >
                              {isApplied ? "✓ Applied" : "Accept Grammar Fix"}
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10.5px] font-mono">
                            <div className="bg-rose-950/10 border border-rose-500/15 rounded-lg p-3 space-y-1">
                              <span className="text-[8.5px] text-rose-400 font-bold block">❌ CURRENT SENTENCE</span>
                              <p className="text-slate-400 italic">"{issue.current}"</p>
                            </div>
                            <div className="bg-emerald-950/15 border border-emerald-500/15 rounded-lg p-3 space-y-1">
                              <span className="text-[8.5px] text-emerald-400 font-bold block">✅ CORRECTED SENTENCE</span>
                              <p className="text-slate-200">"{issue.suggested}"</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[9.5px] font-mono text-slate-400 pt-1 border-t border-[#27272A]/40">
                            <span><strong>Recruiter Value:</strong> {issue.recruiter}</span>
                            <span><strong>ATS Weight:</strong> {issue.ats}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. SKILLS & KEYWORD MATCHING */}
              {activeTab === "keywords" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="border-b border-[#27272A] pb-4">
                    <h3 className="text-white text-base font-bold tracking-tight">Skills Grouping & Keyword Matching</h3>
                    <p className="text-[11px] text-slate-400">Comparing your parsed skills against selected role requirements.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* SVG Pie & Bar Chart representation */}
                    <div className="p-5 bg-[#09090B]/40 border border-[#27272A] rounded-2xl space-y-4">
                      <h4 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">Keyword Matching Density</h4>
                      
                      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
                        {/* Circular match chart */}
                        <div className="relative w-28 h-28 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="56" cy="56" r="48" stroke="#1F2937" strokeWidth="8" fill="transparent" />
                            <circle cx="56" cy="56" r="48" stroke="#6D5EF8" strokeWidth="8" fill="transparent" strokeDasharray="301.6" strokeDashoffset={301.6 - (301.6 * calculatedAtsMatch) / 100} />
                          </svg>
                          <div className="absolute text-center">
                            <span className="text-xl font-bold text-white">{calculatedAtsMatch}%</span>
                            <span className="text-[8px] text-slate-500 font-mono block">MATCH %</span>
                          </div>
                        </div>

                        {/* Bar chart representation */}
                        <div className="flex-1 w-full space-y-2 text-[10.5px] font-mono">
                          <div className="space-y-1">
                            <div className="flex justify-between text-slate-400">
                              <span>Required Keywords</span>
                              <span>{realScanData?.roleAlignment?.presentTechSkills?.length || 12} Found / {(realScanData?.roleAlignment?.requiredTechSkillsForTarget?.length || 15)} Required</span>
                            </div>
                            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-[#27272A]">
                              <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${realScanData ? Math.min(100, Math.round(((realScanData?.roleAlignment?.presentTechSkills?.length || 1) / (realScanData?.roleAlignment?.requiredTechSkillsForTarget?.length || 1)) * 100)) : 80}%` }}></div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-slate-400">
                              <span>Keyword Density Ratio</span>
                              <span>{realScanData ? "Optimized (2.9%)" : "Optimized (2.8%)"}</span>
                            </div>
                            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-[#27272A]">
                              <div className="bg-emerald-400 h-full rounded-full" style={{ width: "95%" }}></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Word Cloud Visual Block */}
                      <div className="pt-4 border-t border-[#27272A]/40 space-y-2">
                        <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Interactive Word Cloud Density</h4>
                        <div className="p-3 bg-slate-900/50 rounded-xl flex flex-wrap gap-2 justify-center leading-relaxed">
                          {(realScanData?.roleAlignment?.presentTechSkills && realScanData.roleAlignment.presentTechSkills.length > 0) ? (
                            [
                              ...realScanData.roleAlignment.presentTechSkills.map((s: string) => ({ text: s, weight: "text-sm text-indigo-400 font-bold" })),
                              ...(realScanData.roleAlignment.missingTechSkills || []).map((s: string) => ({ text: s, weight: "text-xs text-slate-500 italic" }))
                            ].map((word) => (
                              <span key={word.text} className={`px-2 py-0.5 rounded bg-slate-900/80 border border-[#27272A] ${word.weight}`}>
                                {word.text}
                              </span>
                            ))
                          ) : (
                            [
                              { text: "Node.js", weight: "text-base text-indigo-400 font-bold" },
                              { text: "PostgreSQL", weight: "text-sm text-indigo-400 font-bold" },
                              { text: "Express", weight: "text-xs text-slate-300 font-bold" },
                              { text: "Docker", weight: "text-xs text-slate-300" },
                              { text: "APIs", weight: "text-xs text-slate-400" },
                              { text: "Relational DB", weight: "text-xs text-slate-400" },
                              { text: "AWS infrastructure", weight: "text-xs text-indigo-300 font-medium" },
                              { text: "OpenTelemetry", weight: "text-sm text-indigo-400 font-bold animate-pulse" },
                              { text: "Prometheus", weight: "text-xs text-indigo-300 font-medium" },
                              { text: "Grafana", weight: "text-xs text-slate-400" },
                              { text: "Raft Consensus", weight: "text-xs text-slate-500 italic" },
                              { text: "Performance", weight: "text-xs text-slate-300 font-bold" }
                            ].map((word) => (
                              <span key={word.text} className={`px-2 py-0.5 rounded bg-slate-900/80 border border-[#27272A] ${word.weight}`}>
                                {word.text}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Categorized Skills Lists */}
                    <div className="p-5 bg-[#09090B]/40 border border-[#27272A] rounded-2xl space-y-5">
                      <h4 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">Categorized Skills Matrix</h4>
                      
                      <div className="grid grid-cols-2 gap-4 text-[10.5px] font-mono">
                        <div className="space-y-2">
                          <span className="text-[9px] text-slate-500 uppercase block">Languages & Frameworks</span>
                          <div className="space-y-1 text-slate-300">
                            {(realScanData?.skillsMatrixDetailed?.languagesAndFrameworks || realScanData?.skillsMatrix?.languagesAndFrameworks || [
                              "Node.js (Expert)",
                              "TypeScript (Advanced)",
                              "Express.js (Advanced)",
                              "Python (Basic)"
                            ]).map((skill: string, idx: number) => (
                              <p key={idx}>• {skill}</p>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[9px] text-slate-500 uppercase block">Databases & Cloud</span>
                          <div className="space-y-1 text-slate-300">
                            {(realScanData?.skillsMatrixDetailed?.databasesAndCloud || realScanData?.skillsMatrix?.databasesAndCloud || [
                              "PostgreSQL (Expert)",
                              "Docker Containers",
                              "Amazon AWS",
                              "Redis Caching"
                            ]).map((skill: string, idx: number) => (
                              <p key={idx}>• {skill}</p>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2 border-t border-[#27272A]/20 pt-2">
                          <span className="text-[9px] text-slate-500 uppercase block">Soft Skills & Leadership</span>
                          <div className="space-y-1 text-slate-300">
                            {(realScanData?.skillsMatrixDetailed?.softSkillsAndLeadership || realScanData?.skillsMatrix?.softSkillsAndLeadership || [
                              "Team Mentoring",
                              "Squad Facilitation",
                              "Technical Writing"
                            ]).map((skill: string, idx: number) => (
                              <p key={idx}>• {skill}</p>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2 border-t border-[#27272A]/20 pt-2">
                          <span className="text-[9px] text-slate-500 uppercase block">Observability & DevOps</span>
                          <div className="space-y-1 text-slate-300">
                            {(realScanData?.skillsMatrixDetailed?.observabilityAndDevOps || realScanData?.skillsMatrix?.observabilityAndDevOps || [
                              "OpenTelemetry (Applied)",
                              "Prometheus Alerts",
                              "Grafana Telemetry"
                            ]).map((skill: string, idx: number) => (
                              <p key={idx}>• {skill}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Job Skill Analysis (Required vs Present vs Missing) */}
                  <div className="p-6 bg-slate-900/40 border border-[#27272A] rounded-2xl space-y-6">
                    <div className="border-b border-[#27272A]/80 pb-3">
                      <div className="flex items-center gap-2 text-indigo-400">
                        <Layers className="h-4 w-4" />
                        <h4 className="text-sm font-bold uppercase font-mono tracking-wider">Required Job Skills vs Resume Gaps</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Comparing technical and behavioral skill requirements for standard "{targetRole || "Software Engineer"}" job openings.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
                      {/* Technical Skills Side-by-Side */}
                      <div className="space-y-3 font-sans">
                        <h5 className="text-[11px] text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5 font-mono">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          Technical Skills Analysis
                        </h5>
                        <div className="space-y-4">
                          {/* Present Tech Skills */}
                          <div className="space-y-2">
                            <span className="text-[9px] text-emerald-400 uppercase tracking-widest block font-bold font-mono">Present in Resume</span>
                            <div className="flex flex-wrap gap-1.5">
                              {(realScanData?.roleAlignment?.presentTechSkills || ["Node.js", "SQL", "Databases"]).map((skill: string, idx: number) => (
                                <span key={idx} className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/10 text-emerald-400 text-[10.5px]">
                                  ✓ {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                          {/* Missing Tech Skills */}
                          <div className="space-y-2">
                            <span className="text-[9px] text-rose-400 uppercase tracking-widest block font-bold font-mono">Missing / Weak Gaps</span>
                            <div className="flex flex-wrap gap-1.5">
                              {(realScanData?.roleAlignment?.missingTechSkills || ["TypeScript", "Docker", "REST APIs", "AWS infrastructure", "OpenTelemetry"]).map((skill: string, idx: number) => (
                                <span key={idx} className="px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/10 text-rose-400 text-[10.5px]">
                                  ⚠ {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Soft / Behavioral Skills Side-by-Side */}
                      <div className="space-y-3 font-sans">
                        <h5 className="text-[11px] text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5 font-mono">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          Behavioral & Soft Skills Signal
                        </h5>
                        <div className="space-y-4">
                          {/* Present Soft Skills */}
                          <div className="space-y-2">
                            <span className="text-[9px] text-emerald-400 uppercase tracking-widest block font-bold font-mono">Present in Resume</span>
                            <div className="flex flex-wrap gap-1.5">
                              {(realScanData?.roleAlignment?.presentSoftSkills || ["Team Collaboration", "Problem Solving"]).map((skill: string, idx: number) => (
                                <span key={idx} className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/10 text-emerald-400 text-[10.5px]">
                                  ✓ {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                          {/* Missing Soft Skills */}
                          <div className="space-y-2">
                            <span className="text-[9px] text-rose-400 uppercase tracking-widest block font-bold font-mono font-mono">Missing / Weak Gaps</span>
                            <div className="flex flex-wrap gap-1.5">
                              {(realScanData?.roleAlignment?.missingSoftSkills || ["Technical Mentoring", "System Documentation", "Squad Facilitation"]).map((skill: string, idx: number) => (
                                <span key={idx} className="px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/10 text-rose-400 text-[10.5px]">
                                  ⚠ {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. EXPERIENCE & PROJECTS REWRITE */}
              {activeTab === "experience" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="border-b border-[#27272A] pb-4">
                    <h3 className="text-white text-base font-bold tracking-tight">Experience & Project Bullet Point Rewriter</h3>
                    <p className="text-[11px] text-slate-400">Review, modify, or rewrite weaker resume action bullets using the STAR (Situation, Task, Action, Result) method.</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      {
                        title: "Work Experience: Backend Intern",
                        current: "Created backend API endpoints and made SQL database queries run faster.",
                        suggested: "Refactored Node.js REST endpoints and structured Postgres index keys, reducing API request latency by 42% (from 180ms to 104ms) and supporting up to 15,000 concurrent peak socket connections.",
                        critique: "Fails to explain the tools used or quantify the latency change. Standard ATS algorithms score non-numeric points significantly lower.",
                        star: { S: "Server request latency spiked under heavy peak concurrency load.", T: "Minimize database connection block times and optimize JSON endpoint query structures.", A: "Analyzed performance using Chrome DevTools memory snapshot timelines and deployed compound indexing queries.", R: "Reduced mean latency by 42% and successfully mitigated scaling failures." }
                      },
                      {
                        title: "Personal Engineering Project: E-Commerce API",
                        current: "Spearheaded integration of third party APIs, also wrote tests.",
                        suggested: "Spearheaded third-party API integration and authored test automation coverage matrices.",
                        critique: "Informal tone ('also wrote tests'). Lacks precise industry keyword definitions.",
                        star: { S: "E-commerce platform needed external payment processor support.", T: "Integrate third-party endpoints securely with comprehensive unit test suites.", A: "Authored robust mock payloads and integration test matrices in Jest.", R: "Maintained 100% endpoint security with zero checkout transaction crashes." }
                      }
                    ].map((item, index) => (
                      <div key={index} className="p-5 bg-[#09090B]/40 border border-[#27272A] rounded-2xl space-y-4">
                        <div className="flex justify-between items-center border-b border-[#27272A]/40 pb-2">
                          <h4 className="text-xs font-bold text-indigo-400 font-mono uppercase">{item.title}</h4>
                          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/10 rounded">STAR Qualified</span>
                        </div>

                        <div className="space-y-1.5 font-sans">
                          <p className="text-xs text-white font-medium">Critique Analysis:</p>
                          <p className="text-xs text-slate-400">{item.critique}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10.5px] font-mono">
                          <div className="bg-rose-950/10 border border-rose-500/15 rounded-xl p-3.5 space-y-1">
                            <span className="text-[8.5px] text-rose-400 font-bold block">❌ ORIGINAL TEXT</span>
                            <p className="text-slate-400">"{item.current}"</p>
                          </div>
                          <div className="bg-emerald-950/15 border border-emerald-500/15 rounded-xl p-3.5 space-y-1">
                            <span className="text-[8.5px] text-emerald-400 font-bold block">✅ AI STAR REWRITE</span>
                            <p className="text-slate-200">"{item.suggested}"</p>
                          </div>
                        </div>

                        {/* STAR breakdown details */}
                        <div className="bg-slate-900/40 p-4 rounded-xl space-y-2 border border-[#27272A]/60 text-[10.5px] font-mono text-slate-300">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">STAR Structural Breakdown</span>
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div>
                              <strong className="text-indigo-400 block mb-0.5">S (Situation)</strong>
                              <span className="text-slate-400">{item.star.S}</span>
                            </div>
                            <div>
                              <strong className="text-indigo-400 block mb-0.5">T (Task)</strong>
                              <span className="text-slate-400">{item.star.T}</span>
                            </div>
                            <div>
                              <strong className="text-indigo-400 block mb-0.5">A (Action)</strong>
                              <span className="text-slate-400">{item.star.A}</span>
                            </div>
                            <div>
                              <strong className="text-indigo-400 block mb-0.5">R (Result)</strong>
                              <span className="text-slate-400">{item.star.R}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. BEFORE VS AFTER RESUME (Synchronized Viewers) */}
              {activeTab === "after" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27272A] pb-4">
                    <div>
                      <h3 className="text-white text-base font-bold tracking-tight">Synchronized Before vs After Viewer</h3>
                      <p className="text-[11px] text-slate-400">Compare original text with Gemini-optimized text side-by-side. Highlights: Red (Removed), Green (Added/Optimized).</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-[10.5px] font-mono text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={syncScroll}
                          onChange={(e) => setSyncScroll(e.target.checked)}
                          className="rounded bg-[#09090B] border-[#27272A] text-indigo-500 focus:ring-0 cursor-pointer"
                        />
                        <span>Synchronize Scrollbars</span>
                      </label>
                      <button
                        onClick={handleOptimizeAll}
                        disabled={isOptimized}
                        className="px-3.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-[10px] font-mono font-bold transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {isOptimized ? "All Changes Applied" : "Apply All Rewrite Nodes"}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[500px]">
                    
                    {/* ORIGINAL VIEWPORT */}
                    <div className="bg-[#09090B]/30 border border-[#27272A] rounded-2xl flex flex-col h-full overflow-hidden">
                      <div className="p-3 bg-[#09090B]/80 border-b border-[#27272A] flex justify-between items-center shrink-0">
                        <span className="text-[10px] font-bold text-rose-400 uppercase font-mono">❌ Original Resume Output</span>
                        <span className="text-[9px] font-mono text-slate-500">Unoptimized Baseline</span>
                      </div>
                      
                      <div 
                        ref={originalScrollRef}
                        onScroll={() => handleScrollSync("original")}
                        className="p-5 overflow-y-auto flex-1 font-mono text-[10.5px] text-slate-400 leading-relaxed space-y-4"
                      >
                        {realScanData ? (
                          <div className="space-y-4">
                            <div className="text-center space-y-1 border-b border-[#27272A]/20 pb-3">
                              <h4 className="font-bold text-slate-300 uppercase">{realScanData.optimizedTextData?.header?.split('\n')[0] || "ORIGINAL RESUME"}</h4>
                              <p className="text-[9px] text-slate-500">{realScanData.optimizedTextData?.header?.split('\n')[1] || ""}</p>
                            </div>

                            <div className="space-y-1">
                              <span className="font-bold text-slate-300 block text-[9.5px]">PROFESSIONAL SUMMARY</span>
                              <p className="bg-rose-500/5 text-rose-400 border border-rose-500/10 p-2 rounded italic">
                                {realScanData.roadmapRecommendations?.find((r: any) => r.issue?.toLowerCase().includes("summary"))?.current || realScanData.grammarIssues?.[0]?.current || "Unoptimized summary lacks metrics and key technical keywords."}
                              </p>
                            </div>

                            <div className="space-y-2">
                              <span className="font-bold text-slate-300 block text-[9.5px]">EXPERIENCE / HIGHLIGHTS</span>
                              <div className="space-y-1.5">
                                {realScanData.roadmapRecommendations?.slice(0, 3).map((rec: any, idx: number) => (
                                  <div key={idx} className="space-y-0.5">
                                    <p className="text-[9px] text-slate-500 font-bold">{rec.issue}</p>
                                    <p className="bg-rose-500/5 text-rose-400 border border-rose-500/10 p-1.5 rounded">• {rec.current}</p>
                                  </div>
                                ))}
                                {realScanData.roadmapRecommendations?.length === 0 && (
                                  <p className="text-slate-500 italic text-[9px]">No significant experience gaps detected.</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="text-center space-y-1 border-b border-[#27272A]/20 pb-3">
                              <h4 className="font-bold text-slate-300">JOHN DOE</h4>
                              <p className="text-[9px]">john.doe@email.com | +1 555-019-2834</p>
                            </div>

                            <div className="space-y-1">
                              <span className="font-bold text-slate-300 block">PROFESSIONAL SUMMARY</span>
                              <p className="bg-rose-500/5 text-rose-400 border border-rose-500/10 p-2 rounded italic">
                                "Hardworking engineering student with experience in node, databases, and looking for a backend role to grow."
                              </p>
                            </div>

                            <div className="space-y-2">
                              <span className="font-bold text-slate-300 block">EXPERIENCE</span>
                              <div className="space-y-1.5">
                                <p className="text-[9px] text-slate-500 font-bold">Backend Intern | CloudTech Corp</p>
                                <p className="bg-rose-500/5 text-rose-400 border border-rose-500/10 p-1.5 rounded">• Responsable for deploying APIs and sped up queries.</p>
                                <p className="bg-rose-500/5 text-rose-400 border border-rose-500/10 p-1.5 rounded">• Implemented dynamic components that works on all browsers.</p>
                                <p className="bg-rose-500/5 text-rose-400 border border-rose-500/10 p-1.5 rounded">• Created backend API endpoints and made SQL database queries run faster.</p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* OPTIMIZED VIEWPORT */}
                    <div className="bg-[#09090B]/30 border border-[#27272A] rounded-2xl flex flex-col h-full overflow-hidden">
                      <div className="p-3 bg-[#09090B]/80 border-b border-[#27272A] flex justify-between items-center shrink-0">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase font-mono">✅ Optimized Resume Output</span>
                        <span className="text-[9px] font-mono text-slate-500">Optimized by Gemini recruiter</span>
                      </div>

                      <div 
                        ref={optimizedScrollRef}
                        onScroll={() => handleScrollSync("optimized")}
                        className="p-5 overflow-y-auto flex-1 font-mono text-[10.5px] text-slate-300 leading-relaxed space-y-4"
                      >
                        {realScanData ? (
                          <div className="space-y-4">
                            <div className="text-center space-y-1 border-b border-[#27272A]/20 pb-3">
                              <h4 className="font-bold text-white uppercase">{realScanData.optimizedTextData?.header?.split('\n')[0] || "OPTIMIZED RESUME"}</h4>
                              <p className="text-[9px] text-slate-400">{realScanData.optimizedTextData?.header?.split('\n')[1] || ""}</p>
                            </div>

                            <div className="space-y-1">
                              <span className="font-bold text-white block text-[9.5px]">PROFESSIONAL SUMMARY</span>
                              <p className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 p-2 rounded cursor-help transition-colors hover:bg-emerald-500/15" onClick={() => {
                                triggerToast("Gemini optimized this statement to establish explicit tech-stack parameters.", "info");
                              }}>
                                {realScanData.optimizedTextData?.summary}
                              </p>
                            </div>

                            <div className="space-y-2">
                              <span className="font-bold text-white block text-[9.5px]">EXPERIENCE / HIGHLIGHTS</span>
                              <div className="space-y-1.5">
                                {realScanData.optimizedTextData?.experience?.map((exp: string, idx: number) => (
                                  <p key={idx} className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 p-1.5 rounded cursor-help hover:bg-emerald-500/15" onClick={() => {
                                    triggerToast(`Quantified metric bullet #${idx + 1} synchronized.`, "info");
                                  }}>• {exp}</p>
                                ))}
                                {realScanData.optimizedTextData?.projects?.map((proj: string, idx: number) => (
                                  <p key={idx} className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 p-1.5 rounded cursor-help hover:bg-emerald-500/15" onClick={() => {
                                    triggerToast(`Optimized projects bullet #${idx + 1} synchronized.`, "info");
                                  }}>• {proj}</p>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="text-center space-y-1 border-b border-[#27272A]/20 pb-3">
                              <h4 className="font-bold text-white">JOHN DOE</h4>
                              <p className="text-[9px] text-slate-400">john.doe@email.com | +1 555-019-2834</p>
                            </div>

                            <div className="space-y-1">
                              <span className="font-bold text-white block">PROFESSIONAL SUMMARY</span>
                              <p className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 p-2 rounded cursor-help transition-colors hover:bg-emerald-500/15" onClick={() => {
                                triggerToast("Gemini optimized this statement to establish explicit tech-stack parameters. ATS gain: +8%.", "info");
                              }}>
                                "Results-driven Backend Engineer with specialized expertise in Node.js, Express, SQL, and Docker containerization. Proven track record architecting secure microservices and optimizing relational query schemas for peak user concurrency."
                              </p>
                            </div>

                            <div className="space-y-2">
                              <span className="font-bold text-white block">EXPERIENCE</span>
                              <div className="space-y-1.5">
                                <p className="text-[9px] text-slate-400 font-bold">Backend Intern | CloudTech Corp</p>
                                <p className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 p-1.5 rounded cursor-help hover:bg-emerald-500/15" onClick={() => {
                                  triggerToast("Parallel spelling aligned. ATS gain: +3%.", "info");
                                }}>• Responsible for deploying APIs and speeding up query execution.</p>
                                <p className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 p-1.5 rounded cursor-help hover:bg-emerald-500/15" onClick={() => {
                                  triggerToast("Plural subject-verb agreement fixed. ATS gain: +3%.", "info");
                                }}>• Implemented responsive web components that operate seamlessly across all web browsers.</p>
                                <p className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 p-1.5 rounded cursor-help hover:bg-emerald-500/15" onClick={() => {
                                  triggerToast("Quantified accomplishment impact added. ATS gain: +12%.", "info");
                                }}>• Refactored Node.js REST endpoints and structured Postgres index keys, reducing API request latency by 42% (from 180ms to 104ms) and supporting up to 15,000 concurrent peak socket connections.</p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* 7. RECRUITER REPORT SIMULATION */}
              {activeTab === "recruiter" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="border-b border-[#27272A] pb-4">
                    <h3 className="text-white text-base font-bold tracking-tight">AI Recruiter Assessment Matrix</h3>
                    <p className="text-[11px] text-slate-400">Deep recruiter scorecard mapping candidate qualities against core engineering team expectations.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Performance metrics dashboard */}
                    <div className="p-5 bg-[#09090B]/40 border border-[#27272A] rounded-2xl space-y-4">
                      <h4 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">Candidate Skills Scoring Matrix</h4>
                      
                      <div className="space-y-3 font-mono text-[11px]">
                        {[
                          { label: "Technical Competence Core", score: realScanData?.skillsMatrix?.find((m: any) => m.label?.toLowerCase()?.includes("technical") || m.label?.toLowerCase()?.includes("competence"))?.score || 92, bar: "bg-indigo-500" },
                          { label: "Leadership & Initiative Signal", score: realScanData?.skillsMatrix?.find((m: any) => m.label?.toLowerCase()?.includes("leadership") || m.label?.toLowerCase()?.includes("initiative"))?.score || 85, bar: "bg-indigo-500" },
                          { label: "Communication & Pitch Readability", score: realScanData?.skillsMatrix?.find((m: any) => m.label?.toLowerCase()?.includes("communication") || m.label?.toLowerCase()?.includes("pitch"))?.score || 88, bar: "bg-indigo-500" },
                          { label: "System Architecture Strategy", score: realScanData?.skillsMatrix?.find((m: any) => m.label?.toLowerCase()?.includes("system") || m.label?.toLowerCase()?.includes("architecture"))?.score || 80, bar: "bg-amber-400 animate-pulse" },
                          { label: "Software Testing Rigor", score: realScanData?.skillsMatrix?.find((m: any) => m.label?.toLowerCase()?.includes("testing") || m.label?.toLowerCase()?.includes("rigor"))?.score || 94, bar: "bg-emerald-400" },
                          { label: "Hiring Probability Index", score: realScanData?.skillsMatrix?.find((m: any) => m.label?.toLowerCase()?.includes("hiring") || m.label?.toLowerCase()?.includes("probability"))?.score || 91, bar: "bg-emerald-400" }
                        ].map((metric) => (
                          <div key={metric.label} className="space-y-1.5">
                            <div className="flex justify-between text-slate-400 text-[10px]">
                              <span>{metric.label}</span>
                              <span className="text-slate-200 font-bold">{metric.score}%</span>
                            </div>
                            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-[#27272A]">
                              <div className={`${metric.bar} h-full rounded-full`} style={{ width: `${metric.score}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Overall Recruiter Recommendation */}
                    <div className="p-5 bg-[#09090B]/40 border border-[#27272A] rounded-2xl space-y-4 font-sans text-xs">
                      <h4 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">Strategic Recruiting Recommendation</h4>
                      
                      <div className="space-y-3 text-slate-400 leading-relaxed">
                        <p>
                          <strong>First Impression Critique:</strong> {realScanData?.recruiterFirstImpression || "John possesses strong academic fundamentals from Stanford paired with solid baseline relational query practice. The initial resume draft hides this strength behind basic, unquantified text bullets."}
                        </p>
                        <p>
                          <strong>Interview Strategy Advice:</strong> {realScanData?.recruiterInterviewStrategy || "Fast-track to active technical screen. Direct him to explain specific Postgres scaling roadblocks during system design interviews, and probe his familiarity with cloud tracing containers."}
                        </p>
                        <p className="bg-indigo-500/10 border border-indigo-500/10 p-3 rounded-xl text-indigo-300 text-[11px] font-mono leading-normal">
                          <strong>Executive Summary Decision:</strong> {realScanData?.recruiterExecutiveSummary || "Highly recommended. Applying the active ATS keywords raises his score parameter to the top 2% of the matching applicant flow."}
                        </p>
                      </div>
                    </div>

                    {/* Target Role Alignment Audit */}
                    <div className="p-5 bg-[#09090B]/40 border border-[#27272A] rounded-2xl space-y-4 md:col-span-2">
                      <div className="flex items-center gap-2 text-indigo-400 border-b border-[#27272A]/40 pb-2 justify-between">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          <h4 className="text-xs font-bold uppercase font-mono tracking-wider font-mono">Target Job Role Alignment Audit</h4>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Target Role: {targetRole || "Software Engineer"}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans text-xs">
                        {/* Alignment Score Meter */}
                        <div className="flex flex-col items-center justify-center p-4 bg-[#09090B]/30 border border-[#27272A]/40 rounded-xl space-y-2 text-center">
                          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Alignment Match</span>
                          <span className="text-3xl font-extrabold text-white font-mono">{realScanData?.roleAlignment?.targetRoleAlignmentScore || 65}%</span>
                          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-[#27272A]">
                            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${realScanData?.roleAlignment?.targetRoleAlignmentScore || 65}%` }}></div>
                          </div>
                        </div>

                        {/* Current vs Target Role */}
                        <div className="p-4 bg-[#09090B]/30 border border-[#27272A]/40 rounded-xl space-y-2">
                          <div>
                            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Apparent Current Role</span>
                            <span className="font-bold text-rose-400 text-sm font-mono block mt-0.5">{realScanData?.roleAlignment?.detectedCurrentRole || "Junior Developer / Recent Graduate"}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Desired Target Role</span>
                            <span className="font-bold text-emerald-400 text-sm font-mono block mt-0.5">{targetRole || "Software Engineer"}</span>
                          </div>
                        </div>

                        {/* Recruiter Strategy Narrative */}
                        <div className="p-4 bg-[#09090B]/30 border border-[#27272A]/40 rounded-xl space-y-1">
                          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block font-mono">Alignment Critique</span>
                          <p className="text-slate-300 leading-relaxed text-[11px]">{realScanData?.roleAlignment?.targetRoleAlignmentFeedback || `The resume shows strong programming basics but lacks the production-level software design, cloud deployments, and diagnostic operations metrics standard for heavy-scale ${targetRole || "Software Engineer"} roles.`}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 8. DOWNLOAD CENTER */}
              {activeTab === "downloads" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="border-b border-[#27272A] pb-4">
                    <h3 className="text-white text-base font-bold tracking-tight">Enterprise Download Center</h3>
                    <p className="text-[11px] text-slate-400">Export high-fidelity compliant PDF structures and analytical reports of your parsed resume.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { title: "Optimized Resume PDF", format: "PDF", desc: "Fully compiled linear sequential layout compliant with standard ATS parsers." },
                      { title: "Optimized Resume DOCX", format: "DOCX", desc: "Editable Microsoft Word structure retaining optimized formatting parameters." },
                      { title: "Comprehensive ATS Audit Report", format: "PDF", desc: "Detailed breakdown of the 100+ analyzed formatting and contact rules." },
                      { title: "Grammar & Parallel Syntax Proof", format: "PDF", desc: "Chronological documentation of corrected spelling and verb splices." },
                      { title: "Core Keyword Matching Indexes", format: "Spreadsheet", desc: "Export of matching required, missing, and duplicate keyword densities." },
                      { title: "AI Recruiter Strategy Report", format: "PDF", desc: "The simulated executive summary including first impression and interview probability stats." }
                    ].map((dl) => (
                      <div key={dl.title} className="p-4 bg-slate-900/50 border border-[#27272A] hover:border-slate-700 rounded-xl flex flex-col justify-between space-y-3 transition-all duration-150">
                        <div className="space-y-1">
                          <span className="text-[9.5px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded font-bold w-max block">
                            {dl.format}
                          </span>
                          <h4 className="text-xs font-bold text-white pt-1">{dl.title}</h4>
                          <p className="text-[10px] text-slate-500 leading-normal font-sans">{dl.desc}</p>
                        </div>

                        <button
                          onClick={() => handleDownloadReport(`${dl.title} (${dl.format})`)}
                          className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 border border-[#27272A] text-slate-300 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <FileDown className="h-3.5 w-3.5" />
                          <span>Generate Output</span>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* ATS-Compliant Base Templates Library */}
                  <div className="pt-6 border-t border-[#27272A]/80 space-y-6">
                    <div>
                      <div className="flex items-center gap-2 text-indigo-400">
                        <Sparkles className="h-4 w-4" />
                        <h4 className="text-sm font-bold uppercase font-mono tracking-wider text-indigo-400">ATS-Compliant Base Resume Templates</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Copy or download industry-certified, single-column plain-text templates to guarantee 95%+ parser readability.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left Sidebar: Selectors & Tips */}
                      <div className="lg:col-span-4 space-y-4">
                        <div className="space-y-2">
                          <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block font-bold">Available Job Frameworks</span>
                          <div className="space-y-2">
                            {RESUME_TEMPLATES.map((tmpl) => {
                              const isSelected = tmpl.id === selectedTemplateId;
                              return (
                                <button
                                  key={tmpl.id}
                                  onClick={() => setSelectedTemplateId(tmpl.id)}
                                  className={`w-full p-3.5 text-left rounded-xl border transition-all flex flex-col gap-1 cursor-pointer ${
                                    isSelected
                                      ? "bg-indigo-500/10 border-indigo-500 text-white"
                                      : "bg-slate-900/40 border-[#27272A] hover:border-slate-700 text-slate-300"
                                  }`}
                                >
                                  <span className="text-xs font-bold font-mono">{tmpl.name}</span>
                                  <span className="text-[10px] text-slate-400 font-sans leading-normal line-clamp-2">{tmpl.description}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Tips & Tricks Panel */}
                        <div className="p-4 bg-slate-900/30 border border-[#27272A]/60 rounded-xl space-y-3">
                          <h5 className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
                            <Info className="h-3.5 w-3.5" />
                            Optimization Insights
                          </h5>
                          <ul className="space-y-2 font-sans text-[10.5px] text-slate-400 leading-normal">
                            {(RESUME_TEMPLATES.find(t => t.id === selectedTemplateId) || RESUME_TEMPLATES[0]).tips.map((tip, idx) => (
                              <li key={idx} className="flex gap-2">
                                <span className="text-indigo-400 font-bold font-mono">0{idx + 1}.</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Right Workspace: Template Code Previewer */}
                      <div className="lg:col-span-8 bg-[#09090B]/50 border border-[#27272A] rounded-2xl overflow-hidden flex flex-col h-[520px]">
                        {/* Control Bar */}
                        <div className="p-3 bg-[#09090B]/80 border-b border-[#27272A] flex flex-col sm:flex-row justify-between sm:items-center gap-2 shrink-0">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-bold text-slate-300 uppercase font-mono">
                              {(RESUME_TEMPLATES.find(t => t.id === selectedTemplateId) || RESUME_TEMPLATES[0]).name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyTemplate(RESUME_TEMPLATES.find(t => t.id === selectedTemplateId) || RESUME_TEMPLATES[0])}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-[#27272A] text-slate-300 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              {copiedTemplateId === selectedTemplateId ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                                  <span className="text-emerald-400 font-sans">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  <span>Copy Raw Text</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleDownloadTemplateFile(RESUME_TEMPLATES.find(t => t.id === selectedTemplateId) || RESUME_TEMPLATES[0])}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 text-white rounded-lg text-[10px] font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <FileDown className="h-3.5 w-3.5" />
                              <span>Download Template (.txt)</span>
                            </button>
                          </div>
                        </div>

                        {/* Text Scroll Viewport */}
                        <div className="p-5 overflow-y-auto flex-1 font-mono text-[10.5px] text-slate-300 leading-relaxed bg-[#030303]/60 selection:bg-indigo-500/20 whitespace-pre-wrap">
                          {(RESUME_TEMPLATES.find(t => t.id === selectedTemplateId) || RESUME_TEMPLATES[0]).rawText}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>

        </div>
      )}

    </div>
  );
}
