import React, { useState, useEffect } from "react";
import { 
  Search, 
  MapPin, 
  DollarSign, 
  Briefcase, 
  Award, 
  Clock, 
  CheckCircle2, 
  ExternalLink, 
  ChevronDown, 
  Bookmark, 
  Building2, 
  Sparkles, 
  Zap, 
  Info,
  ArrowRight,
  ChevronRight,
  User,
  Mail,
  Phone,
  Check,
  FileCheck,
  Shield,
  ShieldAlert,
  Loader2,
  AlertTriangle,
  HelpCircle
} from "lucide-react";
import { JobApplication, SavedSTARStory, UserProfile } from "../types";
import { COMPANY_PRESETS } from "../data/companyRoles";
import { apiFetch } from "../lib/api";

interface RequirementMatch {
  requirementId: string;
  requirementText: string;
  category: "must_have" | "preferred" | "responsibility";
  status: "strong_match" | "partial_match" | "missing";
  confidence: number;
  evidence: Array<{
    text: string;
    sourceType: string;
    sourceSection?: string;
    similarity: number;
  }>;
}

interface ATSScoreData {
  score: number;
  confidence: number;
  breakdown: {
    mustHave: number;
    preferred: number;
    responsibilities: number;
  };
  matchedRequirements: RequirementMatch[];
  partialRequirements: RequirementMatch[];
  missingRequirements: RequirementMatch[];
  limitations: string[];
}

interface JobsExplorerProps {
  applications: JobApplication[];
  onPracticeJob: (company: string, role: string, jdText: string) => void;
  onOpenApplyModal: (job: JobApplication) => void;
  onSaveApplications?: (newApps: JobApplication[]) => void;
  savedStarStories?: SavedSTARStory[];
  currentUser?: UserProfile | null;
}

export default function JobsExplorer({
  applications,
  onPracticeJob,
  onOpenApplyModal,
  onSaveApplications,
  savedStarStories = [],
  currentUser = null
}: JobsExplorerProps) {
  // Navigation: "feed" (Job Openings) vs "tracker" (Application Tracker)
  const [activeSubTab, setActiveSubTab] = useState<"feed" | "tracker">("feed");
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("all");
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("recruiter_ai_saved_job_bookmarks");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Evidence-based ATS Score state per job
  const [atsScores, setAtsScores] = useState<Record<string, ATSScoreData>>({});
  const [atsLoading, setAtsLoading] = useState<Record<string, boolean>>({});

  // Record Application modal states
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  
  // Form states
  const [applicantPhone, setApplicantPhone] = useState("");
  const [selectedStoryId, setSelectedStoryId] = useState<string>("none");
  const [coverCommentary, setCoverCommentary] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

  // Status updating state in tracker
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const sectors = [
    { id: "all", label: "All Sectors" },
    { id: "Engineering", label: "Engineering" },
    { id: "Product", label: "Product & Design" },
    { id: "Systems", label: "Systems & DevOps" },
    { id: "Security", label: "Security & Trust" }
  ];

  // Derive static list of practice job opportunities directly from company presets
  const liveJobsList = React.useMemo(() => {
    return COMPANY_PRESETS.flatMap((comp) => {
      return comp.roles.map((role, idx) => {
        let skills = ["Systems Design", "Software Architecture", "API Engineering"];
        let location = "Remote, US";
        let salary = "$140,000 - $190,000";
        let department = "Product Engineering";

        if (comp.id === "google") {
          skills = ["JAX / TensorFlow", "Distributed Systems", "GPU/TPU Scaling", "XLA Compilation"];
          location = "Mountain View, CA (Hybrid)";
          salary = "$185,000 - $240,000";
          department = "Core ML Infrastructure";
        } else if (comp.id === "stripe") {
          skills = ["Double-Entry Ledgers", "mTLS Security", "PCI Compliance", "Go / Ruby"];
          location = "San Francisco, CA (Hybrid)";
          salary = "$175,000 - $220,000";
          department = "Core Billings Platform";
        } else if (comp.id === "netflix") {
          skills = ["React 18 Architecture", "GraphQL Federation", "HLS / DASH Protocols", "Video Codecs"];
          location = "Los Gatos, CA";
          salary = "$210,000 - $295,000";
          department = "Media Streaming Platforms";
        } else if (comp.id === "microsoft") {
          skills = ["Hyper-V / Kernel", "Rust Systems", "Virtualization mmUnit", "Device Drivers"];
          location = "Redmond, WA";
          salary = "$160,000 - $215,000";
          department = "Azure Virtual Compute";
        } else if (comp.id === "amazon") {
          skills = ["AWS Architect", "Infrastructure-as-Code", "Kafka", "SQS Queuing"];
          location = "Seattle, WA (Hybrid)";
          salary = "$150,000 - $210,000";
          department = "Alexa Smart IoT Edge";
        } else if (comp.id === "meta") {
          skills = ["React Transitions", "Relay / Apollo", "eBPF / cgroups", "Linux Core Performance"];
          location = "Menlo Park, CA (Hybrid)";
          salary = "$180,000 - $235,000";
          department = "Operations Infrastructure";
        } else if (comp.id === "openai") {
          skills = ["RLHF Fine-tuning", "DeepSpeed / PyTorch", "UX Prototyping", "Agentic Workspaces"];
          location = "San Francisco, CA";
          salary = "$220,000 - $310,000";
          department = "Frontier Safety & UX Design";
        } else if (comp.id === "apple") {
          skills = ["Swift / Objective-C", "Darwin Kernel", "Grand Central Dispatch", "battery-efficiency"];
          location = "Cupertino, CA";
          salary = "$195,000 - $255,000";
          department = "iOS Core Runtimes";
        }

        return {
          id: `${comp.id}-role-${idx}`,
          companyId: comp.id,
          companyName: comp.name,
          logoColor: comp.logoColor,
          roleTitle: role.title,
          roleCategory: role.category,
          jdFullText: role.text,
          skillsRequired: skills,
          location,
          salaryRange: salary,
          remoteBadge: idx % 2 === 0,
          difficultyBadge: idx % 3 === 0 ? "Expert" : idx % 3 === 1 ? "Senior" : "Mid",
          category: role.category,
          industryContext: comp.industry,
          department,
          isPreset: true
        };
      });
    });
  }, []);

  // Fetch evidence-based ATS score for a job description
  const loadATSScoreForJob = async (jobId: string, jdText: string, roleTitle: string) => {
    if (atsScores[jobId] || atsLoading[jobId]) return;

    setAtsLoading(prev => ({ ...prev, [jobId]: true }));

    try {
      const res = await apiFetch("/api/resumes/ats-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription: jdText,
          jobId,
          role: roleTitle
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAtsScores(prev => ({ ...prev, [jobId]: data }));
      }
    } catch (err) {
      console.error("Failed to load evidence-based ATS score:", err);
    } finally {
      setAtsLoading(prev => ({ ...prev, [jobId]: false }));
    }
  };

  const handleToggleExpand = (job: any) => {
    const nextId = expandedId === job.id ? null : job.id;
    setExpandedId(nextId);
    if (nextId) {
      loadATSScoreForJob(job.id, job.jdFullText, job.roleTitle);
    }
  };

  const handleToggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedIds(prev => {
      const next = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      try {
        localStorage.setItem("recruiter_ai_saved_job_bookmarks", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Filtered job list
  const filteredLiveJobs = liveJobsList.filter((job) => {
    const matchesSearch = 
      job.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.skillsRequired.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSector = 
      selectedSector === "all" ||
      job.category.toLowerCase() === selectedSector.toLowerCase();

    return matchesSearch && matchesSector;
  });

  // Open real application recording dialog
  const handleOpenRecordModal = (job: any) => {
    setSelectedJob(job);
    setApplicantPhone(currentUser?.phoneNumber || "");
    setSelectedStoryId(savedStarStories.length > 0 ? savedStarStories[0].id : "none");
    setCoverCommentary("");
    setSubmitError(null);
    setSubmitSuccessMsg(null);
    setIsApplyModalOpen(true);
    loadATSScoreForJob(job.id, job.jdFullText, job.roleTitle);
  };

  // Execute authenticated application creation in PostgreSQL
  const handleExecuteRecordApplication = async () => {
    if (!selectedJob) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const matchScore = atsScores[selectedJob.id]?.score || undefined;

      const res = await apiFetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: selectedJob.companyName,
          role: selectedJob.roleTitle,
          roleCategory: selectedJob.category || "Engineering",
          applicantName: currentUser?.name || currentUser?.fullName || "Candidate",
          applicantEmail: currentUser?.email || "candidate@example.com",
          coverLetter: coverCommentary || undefined,
          matchScore,
          notes: selectedJob.jdFullText
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to record application in database.");
      }

      const data = await res.json();
      const appRecord = data.application;

      const newApp: JobApplication = {
        id: appRecord.id,
        timestamp: appRecord.appliedAt || new Date().toISOString(),
        companyId: selectedJob.companyId,
        companyName: appRecord.company,
        roleTitle: appRecord.role,
        roleCategory: appRecord.roleCategory || "Engineering",
        applicantName: appRecord.applicantName,
        applicantEmail: appRecord.applicantEmail,
        coverLetter: appRecord.coverLetter || "",
        status: appRecord.status || "Submitted",
        appliedSlot: "Recorded Application",
        screeningFeedback: `Application recorded for ${appRecord.role} at ${appRecord.company}. Status: ${appRecord.status}.`,
        matchScore: typeof appRecord.matchScore === "number" ? appRecord.matchScore : 0,
        jdFullText: selectedJob.jdFullText,
        skillsRequired: selectedJob.skillsRequired,
        location: selectedJob.location,
        salaryRange: selectedJob.salaryRange,
        remoteBadge: selectedJob.remoteBadge,
        difficultyBadge: selectedJob.difficultyBadge,
        category: selectedJob.category,
        industryContext: selectedJob.industryContext,
        department: selectedJob.department
      };

      if (onSaveApplications) {
        onSaveApplications([newApp, ...applications.filter(a => a.id !== newApp.id)]);
      }

      setIsApplyModalOpen(false);
      setActiveSubTab("tracker");
      setExpandedId(newApp.id);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to record application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update application status via authenticated PATCH API
  const handleUpdateApplicationStatus = async (appId: string, newStatus: JobApplication["status"]) => {
    setUpdatingStatusId(appId);
    try {
      const res = await apiFetch(`/api/jobs/${appId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        const data = await res.json();
        const updatedRecord = data.application;
        const updatedList = applications.map(a => {
          if (a.id === appId) {
            return {
              ...a,
              status: updatedRecord?.status || newStatus
            };
          }
          return a;
        });

        if (onSaveApplications) {
          onSaveApplications(updatedList);
        }
      }
    } catch (err) {
      console.error("Failed to update application status:", err);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Style helper for company logos
  const getCompanyLogo = (companyName: string) => {
    const logos: Record<string, { char: string; bg: string }> = {
      "Google": { char: "G", bg: "from-blue-500 via-red-500 to-yellow-500 text-white" },
      "Stripe": { char: "S", bg: "from-indigo-500 to-purple-600 text-white" },
      "Netflix": { char: "N", bg: "from-red-600 to-red-800 text-white" },
      "Meta": { char: "M", bg: "from-blue-600 to-indigo-500 text-white" },
      "OpenAI": { char: "O", bg: "from-teal-600 to-emerald-500 text-white" },
      "Amazon": { char: "A", bg: "from-amber-500 to-orange-600 text-white" },
      "Apple": { char: "A", bg: "from-stone-700 to-stone-900 text-slate-100" },
      "Microsoft": { char: "M", bg: "from-sky-500 to-blue-600 text-white" }
    };
    return logos[companyName] || { char: companyName.charAt(0) || "J", bg: "from-slate-700 to-slate-800 text-slate-300" };
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Intro header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/60 dark:border-white/10 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="glass-pill px-2.5 py-0.5 text-[#6D5EF8] text-[9px] font-bold font-mono uppercase tracking-wider">
              Practice Presets & Scenarios
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold uppercase">PostgreSQL Backed</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight font-sans">
            Job Explorer & Application Tracker
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Explore practice role scenarios and track applications recorded in your private Recruiter AI Pro workspace.
          </p>
        </div>

        {/* Dual Tab sub-navigation */}
        <div className="glass-dock p-1.5 rounded-2xl flex items-center gap-1 shrink-0 self-start md:self-center">
          <button
            onClick={() => setActiveSubTab("feed")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "feed" 
                ? "bg-[#6D5EF8] text-white shadow-md" 
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>Practice Job Scenarios</span>
            <span className="ml-1 text-[9px] font-mono font-extrabold bg-black/20 dark:bg-white/10 px-1.5 py-0.5 rounded-md text-inherit">
              {filteredLiveJobs.length}
            </span>
          </button>
          
          <button
            onClick={() => setActiveSubTab("tracker")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "tracker" 
                ? "bg-[#6D5EF8] text-white shadow-md" 
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>My Application Tracker</span>
            {applications.length > 0 && (
              <span className={`ml-1 text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded-md ${
                activeSubTab === "tracker" ? "bg-white text-[#6D5EF8]" : "bg-[#6D5EF8]/20 text-[#6D5EF8]"
              }`}>
                {applications.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeSubTab === "feed" ? (
        <>
          {/* Filter and Search Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 glass-panel p-4 rounded-2xl shadow-md">
            <div className="md:col-span-8 relative">
              <Search className="absolute inset-y-0 left-3 h-4 w-4 text-slate-400 my-auto pointer-events-none" />
              <input
                type="text"
                placeholder="Search practice scenarios by company, role title, required stack, or location..."
                className="w-full glass-input rounded-xl py-2.5 pl-9 pr-4 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="md:col-span-4">
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full glass-input text-slate-800 dark:text-slate-200 rounded-xl py-2.5 px-3 text-xs cursor-pointer"
              >
                {sectors.map(s => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-white">{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Jobs Feed Grid */}
          <div className="space-y-4">
            {filteredLiveJobs.length > 0 ? (
              filteredLiveJobs.map((job) => {
                const isBookmarked = bookmarkedIds.includes(job.id);
                const isExpanded = expandedId === job.id;
                const logoInfo = getCompanyLogo(job.companyName);
                
                // Check if user already recorded an application for this role
                const hasApplied = applications.some(
                  app => app.companyName.toLowerCase() === job.companyName.toLowerCase() && 
                         app.roleTitle.toLowerCase() === job.roleTitle.toLowerCase()
                );

                const atsData = atsScores[job.id];
                const isAtsLoading = atsLoading[job.id];

                return (
                  <div
                    key={job.id}
                    onClick={() => handleToggleExpand(job)}
                    className={`glass-card-hover rounded-2xl transition-all overflow-hidden cursor-pointer ${
                      isExpanded ? "ring-2 ring-[#6D5EF8]/50 shadow-xl" : ""
                    }`}
                  >
                    {/* Compact Content Grid */}
                    <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      {/* Left Column: Brand & Role Metadata */}
                      <div className="flex gap-4 items-center min-w-0 flex-1">
                        <span className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${logoInfo.bg} flex items-center justify-center text-sm font-black text-white shrink-0 select-none shadow-md`}>
                          {logoInfo.char}
                        </span>

                        <div className="min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight leading-none truncate max-w-[280px]">
                              {job.roleTitle}
                            </h4>
                            <span className="text-[10px] text-[#6D5EF8] font-mono font-bold glass-pill px-2 py-0.5">
                              {job.companyName}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400 text-[8px] font-mono font-bold uppercase tracking-wider">
                              Practice Preset
                            </span>
                            {job.remoteBadge && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[8px] font-mono font-bold uppercase tracking-wider">
                                Remote Eligible
                              </span>
                            )}
                            {hasApplied && (
                              <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[#6D5EF8] text-[8px] font-mono font-extrabold uppercase tracking-wider flex items-center gap-1">
                                <Check className="h-2 w-2" /> Application Recorded
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 font-mono">
                            <span className="text-slate-500 font-medium">{job.department}</span>
                            <span className="text-slate-700">•</span>
                            <span className="flex items-center gap-1 text-slate-400">
                              <MapPin className="h-3 w-3 text-slate-500" />
                              {job.location}
                            </span>
                            <span className="text-slate-700">•</span>
                            <span className="flex items-center gap-1 text-emerald-400/90 font-medium">
                              <DollarSign className="h-3 w-3 text-emerald-500" />
                              {job.salaryRange}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Actions */}
                      <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start md:self-center" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Simulate Interview Loop */}
                        <button
                          onClick={() => onPracticeJob(job.companyName, job.roleTitle, job.jdFullText || "")}
                          className="px-3.5 py-2 bg-indigo-500/10 hover:bg-indigo-500/25 text-[#6D5EF8] border border-indigo-500/20 rounded-xl text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
                          title="Practice direct simulated questions calibrated to this role"
                        >
                          <Zap className="h-3.5 w-3.5" />
                          <span>Simulate Loop</span>
                        </button>

                        {/* Record Application Trigger */}
                        <button
                          onClick={() => handleOpenRecordModal(job)}
                          disabled={hasApplied}
                          className={`px-3.5 py-2 text-[10.5px] font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                            hasApplied 
                              ? "bg-slate-900 border border-[#27272A] text-slate-500 cursor-not-allowed" 
                              : "bg-[#6D5EF8] hover:bg-[#5B4DF0] text-white shadow-md"
                          }`}
                        >
                          <FileCheck className="h-3.5 w-3.5" />
                          <span>{hasApplied ? "Recorded" : "Record Application"}</span>
                        </button>

                        {/* Bookmark */}
                        <button
                          onClick={(e) => handleToggleBookmark(job.id, e)}
                          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                            isBookmarked 
                              ? "bg-[#6D5EF8]/10 border-[#6D5EF8] text-[#6D5EF8]" 
                              : "bg-[#09090B] border-[#27272A] text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          <Bookmark className="h-3.5 w-3.5" fill={isBookmarked ? "currentColor" : "none"} />
                        </button>

                        {/* Toggle expand */}
                        <button
                          onClick={() => handleToggleExpand(job)}
                          className="p-2 bg-[#09090B] border border-[#27272A] rounded-xl text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                        </button>
                      </div>

                    </div>

                    {/* Expanded Details Section: Evidence-Based ATS Breakdown */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-1 border-t border-[#27272A]/50 bg-[#09090B]/30 space-y-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-3">
                          
                          {/* Left Column: Job Description Text */}
                          <div className="lg:col-span-6 space-y-3">
                            <div className="space-y-1">
                              <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Job Description Scope</h5>
                              <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-line font-sans max-h-72 overflow-y-auto pr-2">
                                {job.jdFullText}
                              </p>
                            </div>

                            <div className="space-y-1.5 pt-1">
                              <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Key Stack Focus</h5>
                              <div className="flex flex-wrap gap-1.5">
                                {job.skillsRequired.map(skill => (
                                  <span key={skill} className="px-2.5 py-0.5 bg-[#111827] border border-[#27272A] rounded-lg text-[9.5px] text-indigo-300 font-mono">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Right Column: Evidence-Based ATS Breakdown */}
                          <div className="lg:col-span-6 bg-[#111827]/90 border border-[#27272A] rounded-2xl p-4 space-y-3.5">
                            <div className="flex items-center justify-between border-b border-[#27272A]/55 pb-2.5">
                              <div className="flex items-center gap-1.5">
                                <Shield className="h-3.5 w-3.5 text-[#6D5EF8]" />
                                <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-300 font-mono">Evidence-Based ATS Match</h5>
                              </div>
                              <span className="text-[9px] font-semibold text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                Grounded RAG
                              </span>
                            </div>

                            {isAtsLoading ? (
                              <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
                                <Loader2 className="h-6 w-6 animate-spin text-[#6D5EF8]" />
                                <span className="text-[10px] font-mono">Evaluating candidate vector embeddings...</span>
                              </div>
                            ) : atsData ? (
                              <div className="space-y-3 animate-fade-in">
                                {/* Overall Match Score Radial */}
                                <div className="flex items-center gap-4 bg-[#09090B]/60 p-3 rounded-xl border border-[#27272A]/60">
                                  <div className="w-12 h-12 rounded-full border-2 border-indigo-500/40 flex items-center justify-center bg-indigo-500/10 select-none shrink-0">
                                    <span className="text-sm font-mono font-black text-indigo-400">{atsData.score}%</span>
                                  </div>
                                  <div>
                                    <h6 className="text-xs font-bold text-white font-sans">
                                      {atsData.score >= 80 ? "Strong Candidate Evidence Match" : atsData.score >= 50 ? "Moderate Evidence Coverage" : "Requires Additional Experience Evidence"}
                                    </h6>
                                    <p className="text-[9.5px] text-slate-400 font-mono mt-0.5">
                                      Confidence: {Math.round(atsData.confidence * 100)}% • Grounded in candidate private index
                                    </p>
                                  </div>
                                </div>

                                {/* Category Breakdown */}
                                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                                  <div className="bg-[#09090B] p-2 rounded-xl border border-[#27272A]/60">
                                    <span className="text-[8.5px] text-slate-500 block uppercase">Must-Have</span>
                                    <span className="text-xs font-bold text-indigo-300">{atsData.breakdown.mustHave}%</span>
                                  </div>
                                  <div className="bg-[#09090B] p-2 rounded-xl border border-[#27272A]/60">
                                    <span className="text-[8.5px] text-slate-500 block uppercase">Preferred</span>
                                    <span className="text-xs font-bold text-indigo-300">{atsData.breakdown.preferred}%</span>
                                  </div>
                                  <div className="bg-[#09090B] p-2 rounded-xl border border-[#27272A]/60">
                                    <span className="text-[8.5px] text-slate-500 block uppercase">Duties</span>
                                    <span className="text-xs font-bold text-indigo-300">{atsData.breakdown.responsibilities}%</span>
                                  </div>
                                </div>

                                {/* Matched Requirements with Provenance */}
                                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                  {atsData.matchedRequirements.slice(0, 3).map((match, mIdx) => (
                                    <div key={mIdx} className="text-[9.5px] p-2 rounded-lg bg-[#09090B]/40 border border-emerald-500/15 text-slate-300 space-y-1">
                                      <div className="flex items-center justify-between text-emerald-400 font-mono">
                                        <span className="font-bold flex items-center gap-1">
                                          <span>✔</span>
                                          <span>{match.requirementText}</span>
                                        </span>
                                        <span className="text-[8.5px] opacity-80">{Math.round(match.confidence * 100)}% match</span>
                                      </div>
                                      {match.evidence[0] && (
                                        <p className="text-[9px] text-slate-400 italic pl-3 border-l border-emerald-500/30">
                                          "{match.evidence[0].text.substring(0, 120)}..."
                                        </p>
                                      )}
                                    </div>
                                  ))}

                                  {/* Missing Requirements */}
                                  {atsData.missingRequirements.slice(0, 2).map((missing, msIdx) => (
                                    <div key={msIdx} className="text-[9.5px] p-2 rounded-lg bg-[#09090B]/40 border border-amber-500/15 text-slate-400 flex items-start gap-1.5">
                                      <span className="text-amber-400 shrink-0 font-bold">⚠</span>
                                      <span className="font-mono text-[9px]">{missing.requirementText} (No direct indexed evidence)</span>
                                    </div>
                                  ))}
                                </div>

                                {/* Honesty Disclaimer */}
                                <p className="text-[8.5px] text-slate-500 italic leading-normal border-t border-[#27272A]/40 pt-2 font-mono">
                                  {atsData.limitations[0]}
                                </p>
                              </div>
                            ) : (
                              <div className="p-4 text-center text-slate-500 text-[10px] font-mono">
                                Expand this scenario to analyze candidate evidence alignment.
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center bg-[#111827] border border-[#27272A] rounded-[24px] space-y-3">
                <span className="text-3xl block select-none">🔍</span>
                <h4 className="text-xs font-bold text-white">No Matching Openings Found</h4>
                <p className="text-[10.5px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                  We couldn't locate practice roles matching your search string. Try clearing your filters or testing alternative keywords!
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* My Applications Tracker Dashboard */
        <div className="space-y-5 animate-fade-in">
          <div className="bg-[#111827] border border-[#27272A] p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-indigo-500/10 text-[#6D5EF8] border border-indigo-500/20 flex items-center justify-center select-none shrink-0">
                <FileCheck className="h-5 w-5" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-white font-sans">Authoritative Application Tracker</h4>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Persisted directly to your PostgreSQL workspace database. Manage real-world interview progression below.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="text-center bg-[#09090B] border border-[#27272A] px-3 py-1.5 rounded-lg">
                <span className="text-slate-500 text-[9px] block">RECORDED APPLICATIONS</span>
                <span className="text-sm font-extrabold text-white">{applications.length}</span>
              </div>
              <div className="text-center bg-[#09090B] border border-[#27272A] px-3 py-1.5 rounded-lg">
                <span className="text-slate-500 text-[9px] block">INTERVIEW SCHEDULED</span>
                <span className="text-sm font-extrabold text-[#6D5EF8]">
                  {applications.filter(a => a.status === "Interview Scheduled").length}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3.5">
            {applications.length > 0 ? (
              applications.map((app) => {
                const logoInfo = getCompanyLogo(app.companyName);
                const isExpanded = expandedId === app.id;
                const isUpdating = updatingStatusId === app.id;

                const statusOptions: Array<JobApplication["status"]> = [
                  "Submitted",
                  "Screening",
                  "Interview Scheduled",
                  "Offered",
                  "Closed"
                ];

                return (
                  <div
                    key={app.id}
                    onClick={() => setExpandedId(isExpanded ? null : app.id)}
                    className={`bg-[#111827] border rounded-[18px] transition-all overflow-hidden cursor-pointer ${
                      isExpanded ? "border-[#6D5EF8]" : "border-[#27272A] hover:border-slate-800"
                    }`}
                  >
                    {/* Header bar of application tracking card */}
                    <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex gap-4 items-center min-w-0">
                        <span className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${logoInfo.bg} flex items-center justify-center text-xs font-black shrink-0 select-none shadow-md`}>
                          {logoInfo.char}
                        </span>

                        <div className="min-w-0 space-y-1">
                          <h4 className="text-xs font-bold text-white truncate max-w-[250px] font-sans">
                            {app.roleTitle}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                            <span className="font-semibold text-indigo-400">{app.companyName}</span>
                            <span>•</span>
                            <span className="text-slate-500">Recorded Application</span>
                            <span>•</span>
                            <span className="text-slate-500">
                              {app.timestamp ? new Date(app.timestamp).toLocaleDateString() : "Just now"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right info block: match score rating and status editor */}
                      <div className="flex items-center justify-between md:justify-end gap-3 self-stretch md:self-center" onClick={(e) => e.stopPropagation()}>
                        {/* ATS MATCH SCORE RADIAL PILL */}
                        {typeof app.matchScore === "number" && app.matchScore > 0 && (
                          <div className="flex items-center gap-1.5 bg-[#09090B] border border-[#27272A] px-2.5 py-1 rounded-xl">
                            <span className="text-[9px] font-bold text-slate-500 font-mono uppercase tracking-wider">ATS Score:</span>
                            <span className={`text-[10.5px] font-extrabold font-mono ${
                              app.matchScore >= 80 ? "text-emerald-400" : app.matchScore >= 60 ? "text-indigo-400" : "text-amber-400"
                            }`}>
                              {app.matchScore}%
                            </span>
                          </div>
                        )}

                        {/* STATUS DROPDOWN SELECTOR */}
                        <div className="relative">
                          <select
                            disabled={isUpdating}
                            value={app.status || "Submitted"}
                            onChange={(e) => handleUpdateApplicationStatus(app.id, e.target.value as any)}
                            className="bg-[#09090B] border border-[#27272A] text-slate-300 rounded-xl py-1 px-2.5 text-[10px] font-bold font-mono focus:outline-none focus:border-[#6D5EF8] cursor-pointer"
                          >
                            {statusOptions.map(opt => (
                              <option key={opt} value={opt} className="bg-slate-900 text-white">
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* CHEVRON TOGGLE */}
                        <button 
                          onClick={() => setExpandedId(isExpanded ? null : app.id)}
                          className="p-1 text-slate-500 hover:text-slate-300"
                        >
                          <ChevronDown className={`h-4 w-4 transition-transform duration-150 ${isExpanded ? "rotate-180" : ""}`} />
                        </button>
                      </div>
                    </div>

                    {/* Expand Pipeline Details */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-[#27272A]/40 bg-[#09090B]/30 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
                          <div className="md:col-span-8 bg-[#111827] border border-[#27272A] rounded-xl p-4 space-y-2">
                            <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Application Notes & Record Details</h5>
                            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                              {app.coverLetter ? `Cover Letter / Notes: ${app.coverLetter}` : "No additional pitch notes attached to this application."}
                            </p>
                            <p className="text-[9.5px] text-slate-500 font-mono">
                              Applicant: {app.applicantName} ({app.applicantEmail})
                            </p>
                          </div>

                          <div className="md:col-span-4 bg-[#111827] border border-[#27272A] rounded-xl p-4 flex flex-col justify-between gap-3">
                            <div>
                              <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Prepare Interview</h5>
                              <p className="text-[10px] text-slate-400 leading-normal mt-1">
                                Launch an adaptive mock interview calibrated to {app.companyName} requirements.
                              </p>
                            </div>
                            
                            <button
                              onClick={() => onPracticeJob(app.companyName, app.roleTitle, app.jdFullText || "")}
                              className="w-full py-2 bg-[#6D5EF8] hover:bg-[#5B4DF0] text-white rounded-xl text-[10.5px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Zap className="h-3.5 w-3.5" />
                              <span>Simulate Interview</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center bg-[#111827] border border-[#27272A] rounded-[24px] space-y-3">
                <span className="text-3xl block select-none">📁</span>
                <h4 className="text-xs font-bold text-white">No Recorded Applications Yet</h4>
                <p className="text-[10.5px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                  You haven't recorded any job applications in your database yet. Explore the practice scenarios feed and click "Record Application" to log a submission!
                </p>
                <button
                  onClick={() => setActiveSubTab("feed")}
                  className="px-4 py-2 bg-[#6D5EF8] hover:bg-[#5B4DF0] text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Browse Practice Roles
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RECORD APPLICATION MODAL */}
      {isApplyModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111827] border border-[#27272A] max-w-lg w-full rounded-2xl p-6 space-y-5 shadow-2xl relative overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#27272A] pb-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[#6D5EF8] text-white flex items-center justify-center font-bold text-sm select-none">
                  <FileCheck className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-xs font-extrabold text-white uppercase font-mono tracking-wider">
                    Record Application
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Save application metadata to your private workspace database
                  </p>
                </div>
              </div>
              <span className="text-[9px] font-mono font-bold text-slate-400 bg-[#09090B] px-2 py-0.5 border border-[#27272A] rounded-lg">
                PostgreSQL Tracker
              </span>
            </div>

            {/* Error notice if submission failed */}
            {submitError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-mono flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Form details */}
            <div className="space-y-4">
              <div className="bg-[#09090B]/50 border border-[#27272A]/60 p-3 rounded-xl">
                <p className="text-[10px] text-slate-400 leading-normal">
                  Recording application for: <strong className="text-white">{selectedJob.roleTitle}</strong> at <strong className="text-white">{selectedJob.companyName}</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">Applicant Name</label>
                  <div className="relative">
                    <User className="absolute inset-y-0 left-3 h-3.5 w-3.5 text-slate-600 my-auto pointer-events-none" />
                    <input
                      type="text"
                      disabled
                      value={currentUser?.name || currentUser?.fullName || "Active Candidate"}
                      className="w-full bg-[#09090B]/60 border border-[#27272A] text-slate-400 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none cursor-not-allowed font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute inset-y-0 left-3 h-3.5 w-3.5 text-slate-600 my-auto pointer-events-none" />
                    <input
                      type="email"
                      disabled
                      value={currentUser?.email || "candidate@example.com"}
                      className="w-full bg-[#09090B]/60 border border-[#27272A] text-slate-400 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none cursor-not-allowed font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono block">Contact Phone Number (Optional)</label>
                <div className="relative">
                  <Phone className="absolute inset-y-0 left-3 h-3.5 w-3.5 text-slate-600 my-auto pointer-events-none" />
                  <input
                    type="tel"
                    placeholder="+1 (555) 019-2834"
                    className="w-full bg-[#09090B] border border-[#27272A] text-slate-300 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-[#6D5EF8] transition-colors"
                    value={applicantPhone}
                    onChange={(e) => setApplicantPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">Cover Pitch / Application Notes (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Record your application pitch, referral details, or submission notes..."
                  className="w-full bg-[#09090B] border border-[#27272A] text-slate-300 rounded-xl p-3 text-xs focus:outline-none focus:border-[#6D5EF8] leading-relaxed"
                  value={coverCommentary}
                  onChange={(e) => setCoverCommentary(e.target.value)}
                />
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-[#27272A]/40">
                <button
                  onClick={() => setIsApplyModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-[#27272A] text-slate-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleExecuteRecordApplication}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-[#6D5EF8] hover:bg-[#5B4DF0] disabled:bg-slate-900 disabled:text-slate-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Record Application</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
