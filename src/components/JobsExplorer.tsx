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
  ShieldAlert
} from "lucide-react";
import { JobApplication, SavedSTARStory, UserProfile } from "../types";
import { COMPANY_PRESETS } from "../data/companyRoles";

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
  // Navigation: "feed" (Live Jobs Board) vs "tracker" (My Application Tracker)
  const [activeSubTab, setActiveSubTab] = useState<"feed" | "tracker">("feed");
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("all");
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Custom application modal states (LinkedIn / Naukri Easy Apply)
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [applyPlatform, setApplyPlatform] = useState<"linkedin" | "naukri">("linkedin");
  
  // Multi-step form states
  const [applyStep, setApplyStep] = useState<1 | 2 | 3 | 4>(1);
  const [applicantPhone, setApplicantPhone] = useState("");
  const [selectedStoryId, setSelectedStoryId] = useState<string>("none");
  const [coverCommentary, setCoverCommentary] = useState("");
  const [applyConsent, setApplyConsent] = useState(true);
  
  // Simulated submission loader sequence
  const [submissionProgress, setSubmissionProgress] = useState(0);
  const [submissionStepMsg, setSubmissionStepMsg] = useState("");

  const sectors = [
    { id: "all", label: "All Sectors" },
    { id: "Engineering", label: "Engineering" },
    { id: "Product", label: "Product & Design" },
    { id: "Systems", label: "Systems & DevOps" },
    { id: "Security", label: "Security & Trust" }
  ];

  // Derive static list of live job opportunities directly from company presets
  const liveJobsList = React.useMemo(() => {
    return COMPANY_PRESETS.flatMap((comp) => {
      return comp.roles.map((role, idx) => {
        // Construct detailed skills and metadata based on presets
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
          department
        };
      });
    });
  }, []);

  const handleToggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Filtered live jobs list
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

  // Filtered applied tracker list (all applications actually applied by user or seeded)
  const submittedApplications = applications.filter(app => {
    // Treat any app starting with referral- or where applicant email matches user's active email,
    // or if the list has been seeded
    return app.id.startsWith("referral-") || app.applicantName !== "Anonymous Candidate";
  });

  // Calculate simulated ATS match score dynamically based on user context
  const getATSScoreInfo = (job: any) => {
    // Base score based on active profile matching
    let score = 75;
    let reasons: string[] = [];

    if (currentUser) {
      // Check if target role title matches some words
      const userRoleLower = currentUser.roleTitle?.toLowerCase() || "";
      const jobRoleLower = job.roleTitle.toLowerCase();
      
      const wordsMatch = userRoleLower.split(" ").some(w => w.length > 3 && jobRoleLower.includes(w));
      if (wordsMatch) {
        score += 10;
        reasons.push("Target job title matches profile specialization (+10%)");
      } else {
        reasons.push("Profile role specialized in separate category");
      }
    }

    // Story booster
    if (selectedStoryId !== "none") {
      score += 15;
      reasons.push("Verified STAR Story attached as quantified behavioral proof (+15% Priority ATS Booster!)");
    } else {
      reasons.push("No STAR story linked. Linking a behavioral proof increases rating by 15%.");
    }

    // Add small random but consistent seed to make it feel organic
    const charSum = job.roleTitle.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    score += (charSum % 8);

    score = Math.min(score, 99);

    return { score, reasons };
  };

  const handleOpenEasyApply = (job: any, platform: "linkedin" | "naukri") => {
    setSelectedJob(job);
    setApplyPlatform(platform);
    setApplyStep(1);
    setApplicantPhone("");
    setSelectedStoryId(savedStarStories.length > 0 ? savedStarStories[0].id : "none");
    setCoverCommentary("");
    setSubmissionProgress(0);
    setIsApplyModalOpen(true);
  };

  const handleExecuteEasyApply = () => {
    if (!selectedJob) return;

    // Advance to loading screen
    setApplyStep(4);
    setSubmissionProgress(5);
    setSubmissionStepMsg("Loading live credentials...");

    // Stage 1
    setTimeout(() => {
      setSubmissionProgress(35);
      setSubmissionStepMsg(`Syncing active profile: ${currentUser?.name || "Active Candidate"}...`);
    }, 600);

    // Stage 2
    setTimeout(() => {
      setSubmissionProgress(70);
      const hasStory = selectedStoryId !== "none";
      setSubmissionStepMsg(hasStory 
        ? "Parsing and calibrating attached behavioral STAR story against requirements..." 
        : "Checking competencies alignment matrices..."
      );
    }, 1300);

    // Stage 3
    setTimeout(() => {
      setSubmissionProgress(90);
      setSubmissionStepMsg(`Routing direct loop bypass to hiring coordinators at ${selectedJob.companyName}...`);
    }, 2000);

    // Completion
    setTimeout(() => {
      setSubmissionProgress(100);
      
      const hasStory = selectedStoryId !== "none";
      const linkedStory = savedStarStories.find(s => s.id === selectedStoryId);
      const scoreObj = getATSScoreInfo(selectedJob);

      // Construct a new application record
      const newApp: JobApplication = {
        id: "referral-" + Date.now(),
        timestamp: new Date().toISOString(),
        companyId: selectedJob.companyId,
        companyName: selectedJob.companyName,
        roleTitle: selectedJob.roleTitle,
        roleCategory: selectedJob.roleCategory,
        applicantName: currentUser?.name || "Active Candidate",
        applicantEmail: currentUser?.email || "candidate@example.com",
        coverLetter: coverCommentary || "",
        status: hasStory ? "Interview Scheduled" : "Screening",
        appliedSlot: applyPlatform === "linkedin" ? "LinkedIn Easy Apply" : "Naukri Fast-Track Apply",
        screeningFeedback: hasStory 
          ? `Fast-Track Approved! Linked behavioral case study ('${linkedStory?.title || "Behavioral Impact"}') successfully parsed our high-scale ATS filters with a verified score of ${scoreObj.score}%. A hiring recruiter will reach out directly.`
          : `Application received via ${applyPlatform === "linkedin" ? "LinkedIn" : "Naukri.com"}. Match rating is ${scoreObj.score}%. Practice technical simulation mock sessions to raise your rating to 90%+ and unlock direct referrals.`,
        matchScore: scoreObj.score,
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
        onSaveApplications([newApp, ...applications]);
      }

      setIsApplyModalOpen(false);
      setActiveSubTab("tracker");
      setExpandedId(newApp.id);
    }, 2600);
  };

  // Style helper for logos
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
      {/* Intro section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#27272A]/40 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#6D5EF8]/10 text-[#6D5EF8] text-[9px] font-bold font-mono uppercase tracking-wider border border-[#6D5EF8]/20">
              Live Recruiting Integrations
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase">Online & Synced</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight font-sans">
            Job Board & Application Center
          </h2>
          <p className="text-xs text-slate-400">
            Browse real positions mapped to premium recruitment pools. Submit direct applications mimicking LinkedIn Easy Apply and Naukri.com, then track response pipelines live!
          </p>
        </div>

        {/* Dual Tab sub-navigation */}
        <div className="bg-[#111827] border border-[#27272A] p-1.5 rounded-xl flex items-center gap-1 shrink-0 self-start md:self-center">
          <button
            onClick={() => setActiveSubTab("feed")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "feed" 
                ? "bg-[#6D5EF8] text-white shadow" 
                : "text-slate-400 hover:text-slate-200 hover:bg-[#1C1C1F]/40"
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>Live Job Openings</span>
            <span className="ml-1 text-[9px] font-mono font-extrabold bg-[#09090B]/40 px-1.5 py-0.5 rounded text-slate-300">
              {filteredLiveJobs.length}
            </span>
          </button>
          
          <button
            onClick={() => setActiveSubTab("tracker")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "tracker" 
                ? "bg-[#6D5EF8] text-white shadow" 
                : "text-slate-400 hover:text-slate-200 hover:bg-[#1C1C1F]/40"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Applications Tracker</span>
            {submittedApplications.length > 0 && (
              <span className={`ml-1 text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded ${
                activeSubTab === "tracker" ? "bg-white text-[#6D5EF8]" : "bg-[#6D5EF8]/20 text-[#6D5EF8]"
              }`}>
                {submittedApplications.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeSubTab === "feed" ? (
        <>
          {/* Filter and Search Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 bg-[#111827] border border-[#27272A] p-4 rounded-[18px] shadow-md">
            <div className="md:col-span-8 relative">
              <Search className="absolute inset-y-0 left-3 h-4 w-4 text-slate-500 my-auto pointer-events-none" />
              <input
                type="text"
                placeholder="Search live positions by company, role keyword, required stack, or location..."
                className="w-full bg-[#09090B] border border-[#27272A] rounded-xl py-2.5 pl-9 pr-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#6D5EF8] transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="md:col-span-4">
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full bg-[#09090B] border border-[#27272A] text-slate-300 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-[#6D5EF8] cursor-pointer transition-colors"
              >
                {sectors.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
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
                
                // Check if user already applied to this specific job
                const hasApplied = applications.some(
                  app => app.companyId === job.companyId && app.roleTitle === job.roleTitle && (app.id.startsWith("referral-") || app.applicantName !== "Anonymous Candidate")
                );

                return (
                  <div
                    key={job.id}
                    onClick={() => setExpandedId(isExpanded ? null : job.id)}
                    className={`bg-[#111827] border rounded-[18px] transition-all overflow-hidden ${
                      isExpanded ? "border-[#6D5EF8] shadow-lg ring-1 ring-[#6D5EF8]/10" : "border-[#27272A] hover:border-slate-700"
                    }`}
                  >
                    {/* Compact Content Grid */}
                    <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      {/* Left Column: Brand & Role Metadata */}
                      <div className="flex gap-4 items-center min-w-0 flex-1">
                        {/* Elegant Logo */}
                        <span className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${logoInfo.bg} flex items-center justify-center text-sm font-black shrink-0 select-none shadow-md`}>
                          {logoInfo.char}
                        </span>

                        <div className="min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                            <h4 className="text-xs font-bold text-white tracking-tight leading-none truncate max-w-[280px]">
                              {job.roleTitle}
                            </h4>
                            <span className="text-[10px] text-[#6D5EF8] font-mono font-bold bg-[#6D5EF8]/10 px-2 py-0.5 rounded border border-[#6D5EF8]/15">
                              {job.companyName}
                            </span>
                            {job.remoteBadge && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-[8px] font-mono font-bold uppercase tracking-wider">
                                Remote Eligible
                              </span>
                            )}
                            {hasApplied && (
                              <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[#6D5EF8] text-[8px] font-mono font-extrabold uppercase tracking-wider flex items-center gap-1">
                                <Check className="h-2 w-2" /> Applied
                              </span>
                            )}
                          </div>

                          {/* Info badges */}
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

                      {/* Right Column: Interactive apply triggers */}
                      <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start md:self-center" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Practice AI Interview direct */}
                        <button
                          onClick={() => onPracticeJob(job.companyName, job.roleTitle, job.jdFullText || "")}
                          className="px-3.5 py-2 bg-indigo-500/10 hover:bg-indigo-500/25 text-[#6D5EF8] border border-indigo-500/20 rounded-xl text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
                          title="Practice direct simulated questions calibrated to this role"
                        >
                          <Zap className="h-3.5 w-3.5" />
                          <span>Simulate</span>
                        </button>

                        {/* LinkedIn Easy Apply Trigger */}
                        <button
                          onClick={() => handleOpenEasyApply(job, "linkedin")}
                          disabled={hasApplied}
                          className={`px-3.5 py-2 text-[10.5px] font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                            hasApplied 
                              ? "bg-slate-900 border border-[#27272A] text-slate-500 cursor-not-allowed" 
                              : "bg-[#0A66C2] hover:bg-[#004182] text-white"
                          }`}
                        >
                          <span className="font-sans font-black text-xs">in</span>
                          <span>Easy Apply</span>
                        </button>

                        {/* Naukri Fast-Track Apply Trigger */}
                        <button
                          onClick={() => handleOpenEasyApply(job, "naukri")}
                          disabled={hasApplied}
                          className={`px-3.5 py-2 text-[10.5px] font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                            hasApplied 
                              ? "bg-slate-900 border border-[#27272A] text-slate-500 cursor-not-allowed" 
                              : "bg-amber-600 hover:bg-amber-700 text-white"
                          }`}
                        >
                          <Award className="h-3.5 w-3.5 text-white/90" />
                          <span>Fast Apply</span>
                        </button>

                        {/* Save Bookmark */}
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

                        {/* Toggle expand Details */}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : job.id)}
                          className="p-2 bg-[#09090B] border border-[#27272A] rounded-xl text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                        </button>
                      </div>

                    </div>

                    {/* Expanded Details Section */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-1 border-t border-[#27272A]/50 bg-[#09090B]/30 space-y-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-3">
                          
                          {/* Left Column: Requirements details */}
                          <div className="lg:col-span-2 space-y-3">
                            <div className="space-y-1">
                              <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Job Description & Core Scope</h5>
                              <p className="text-[11px] text-slate-300 leading-relaxed max-w-4xl whitespace-pre-line font-sans">
                                {job.jdFullText}
                              </p>
                            </div>

                            <div className="space-y-1.5 pt-1">
                              <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono font-sans">Required Core Competencies</h5>
                              <div className="flex flex-wrap gap-1.5">
                                {job.skillsRequired.map(skill => (
                                  <span key={skill} className="px-2.5 py-0.5 bg-[#111827] border border-[#27272A] rounded-lg text-[9.5px] text-indigo-300 font-mono">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Right Column: ATS Score Estimator */}
                          <div className="bg-[#111827]/80 border border-[#27272A] rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between border-b border-[#27272A]/55 pb-2.5">
                              <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">ATS Match Assessment</h5>
                              <span className="text-[9px] font-semibold text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded">Real-time</span>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-full border-2 border-emerald-500/30 flex items-center justify-center bg-emerald-500/5 select-none shrink-0">
                                <span className="text-xs font-mono font-extrabold text-emerald-400">{getATSScoreInfo(job).score}%</span>
                              </div>
                              <div>
                                <h6 className="text-[11px] font-bold text-white font-sans">High Probability Match</h6>
                                <p className="text-[9.5px] text-slate-400">Excellent target role alignment estimated.</p>
                              </div>
                            </div>

                            <div className="space-y-1.5 text-[9px] text-slate-400 font-mono leading-normal pt-1.5">
                              {getATSScoreInfo(job).reasons.map((reason, rIdx) => (
                                <p key={rIdx} className="flex items-start gap-1">
                                  <span className="text-[#6D5EF8] shrink-0">✔</span>
                                  <span>{reason}</span>
                                </p>
                              ))}
                            </div>

                            <div className="pt-2">
                              <p className="text-[9.5px] text-slate-500 leading-normal italic font-sans">
                                *Tip: Create or link your saved STAR story during application to trigger the Priority 1 ATS Fast-Track referral bypass.
                              </p>
                            </div>
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
                  We couldn't locate active roles matching your search string. Try clearing your filters or testing alternative keywords!
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
                <h4 className="text-xs font-bold text-white font-sans">Dynamic Response Pipeline</h4>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Track resume screening, executive referrals, and mock calibrations. Status updates auto-reflect live actions.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="text-center bg-[#09090B] border border-[#27272A] px-3 py-1.5 rounded-lg">
                <span className="text-slate-500 text-[9px] block">TOTAL SUBMISSIONS</span>
                <span className="text-sm font-extrabold text-white">{submittedApplications.length}</span>
              </div>
              <div className="text-center bg-[#09090B] border border-[#27272A] px-3 py-1.5 rounded-lg">
                <span className="text-slate-500 text-[9px] block">MEETING SCHEDULED</span>
                <span className="text-sm font-extrabold text-[#6D5EF8]">{submittedApplications.filter(a => a.status === "Interview Scheduled").length}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3.5">
            {submittedApplications.length > 0 ? (
              submittedApplications.map((app) => {
                const logoInfo = getCompanyLogo(app.companyName);
                const isExpanded = expandedId === app.id;

                // Define pipeline step active indices
                const statusSteps = ["Submitted", "Screening", "Interview Scheduled", "Offered"];
                const activeStepIndex = statusSteps.indexOf(app.status || "Submitted");

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
                        {/* Graded Company icon */}
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
                            <span className="text-slate-500">{app.appliedSlot || "Standard Direct Apply"}</span>
                            <span>•</span>
                            <span className="text-slate-500">
                              {app.timestamp ? new Date(app.timestamp).toLocaleDateString() : "Just now"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right info block: match score rating and dropdown */}
                      <div className="flex items-center justify-between md:justify-end gap-3 self-stretch md:self-center">
                        {/* ATS MATCH SCORE RADIAL PILL */}
                        <div className="flex items-center gap-1.5 bg-[#09090B] border border-[#27272A] px-2.5 py-1 rounded-xl">
                          <span className="text-[9px] font-bold text-slate-500 font-mono uppercase tracking-wider">ATS Score:</span>
                          <span className={`text-[10.5px] font-extrabold font-mono ${
                            app.matchScore >= 90 ? "text-emerald-400" : app.matchScore >= 80 ? "text-indigo-400" : "text-amber-400"
                          }`}>
                            {app.matchScore || 78}%
                          </span>
                        </div>

                        {/* STATUS PILL */}
                        <span className={`px-2.5 py-1 text-[9px] font-bold uppercase font-mono tracking-wider rounded-xl border ${
                          app.status === "Interview Scheduled" 
                            ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" 
                            : app.status === "Screening" 
                            ? "bg-[#6D5EF8]/10 border-[#6D5EF8]/25 text-[#6D5EF8]" 
                            : "bg-slate-900 border-[#27272A] text-slate-400"
                        }`}>
                          {app.status || "Submitted"}
                        </span>

                        {/* CHEVRON TOGGLE */}
                        <button className="p-1 text-slate-500 hover:text-slate-300">
                          <ChevronDown className={`h-4 w-4 transition-transform duration-150 ${isExpanded ? "rotate-180" : ""}`} />
                        </button>
                      </div>
                    </div>

                    {/* Expand Pipeline Progression Details */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-[#27272A]/40 bg-[#09090B]/30 space-y-5" onClick={(e) => e.stopPropagation()}>
                        
                        {/* DYNAMIC PIPELINE GRAPHICS */}
                        <div className="space-y-2 pt-2">
                          <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Live Application Stage Pipeline</h5>
                          
                          <div className="relative pt-1 pb-4">
                            {/* Connector Line backing */}
                            <div className="absolute top-[23px] left-[15%] right-[15%] h-0.5 bg-slate-800" />
                            {/* Active connection line overlay */}
                            <div 
                              className="absolute top-[23px] left-[15%] h-0.5 bg-gradient-to-r from-[#6D5EF8] to-emerald-400 transition-all duration-500"
                              style={{ width: `${Math.min(activeStepIndex * 23.3, 70)}%` }}
                            />

                            <div className="grid grid-cols-4 text-center relative z-10">
                              {statusSteps.map((stepName, stepIdx) => {
                                const isCompleted = stepIdx < activeStepIndex;
                                const isActive = stepIdx === activeStepIndex;
                                
                                return (
                                  <div key={stepName} className="flex flex-col items-center gap-1.5">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono transition-all ${
                                      isActive 
                                        ? "bg-[#6D5EF8] text-white border-4 border-[#6D5EF8]/25 scale-110 shadow"
                                        : isCompleted 
                                        ? "bg-emerald-500 text-white border-2 border-emerald-500/25" 
                                        : "bg-slate-900 text-slate-600 border border-[#27272A]"
                                    }`}>
                                      {isCompleted ? "✓" : stepIdx + 1}
                                    </div>
                                    <span className={`text-[10px] font-bold ${
                                      isActive ? "text-[#6D5EF8]" : isCompleted ? "text-emerald-400" : "text-slate-500"
                                    }`}>
                                      {stepName}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Recruiter comments and feedback bubble */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          
                          <div className="md:col-span-8 bg-[#111827] border border-[#27272A] rounded-xl p-4 space-y-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#6D5EF8]/30 flex items-center justify-center">
                                <span className="w-1 h-1 rounded-full bg-[#6D5EF8]" />
                              </span>
                              <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">ATS & Recruiter Direct Feedback</h5>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                              {app.screeningFeedback || "Your credentials have been logged in the direct hiring database. A calibration coordinator will check details shortly."}
                            </p>
                          </div>

                          <div className="md:col-span-4 bg-[#111827] border border-[#27272A]/60 rounded-xl p-4 flex flex-col justify-between gap-3">
                            <div>
                              <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Recommended Practice Action</h5>
                              <p className="text-[10px] text-slate-400 leading-normal mt-1">
                                Complete a targeted AI recruitment loop to increase your rating and lock in interview guarantees.
                              </p>
                            </div>
                            
                            <button
                              onClick={() => onPracticeJob(app.companyName, app.roleTitle, app.jdFullText || "")}
                              className="w-full py-2 bg-[#6D5EF8] hover:bg-[#6D5EF8]/90 text-white rounded-xl text-[10.5px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Zap className="h-3.5 w-3.5" />
                              <span>Simulate Loop Now</span>
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
                <h4 className="text-xs font-bold text-white">No Submitted Applications Yet</h4>
                <p className="text-[10.5px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                  You haven't applied to any live positions in this session yet. Explore our open positions feed and click "Easy Apply" to instantly submit your credentials!
                </p>
                <button
                  onClick={() => setActiveSubTab("feed")}
                  className="px-4 py-2 bg-[#6D5EF8] hover:bg-[#6D5EF8]/90 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Browse Available Openings
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DETAILED MODAL: LINKEDIN EASY APPLY & NAUKRI FAST-TRACK STEPPER DIALOG */}
      {isApplyModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111827] border border-[#27272A] max-w-lg w-full rounded-2xl p-6 space-y-5 shadow-2xl relative overflow-hidden">
            
            {/* Design header branding based on platform */}
            {applyPlatform === "linkedin" ? (
              <div className="flex items-center justify-between border-b border-[#27272A] pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-[#0A66C2] text-white flex items-center justify-center font-bold text-lg select-none">in</span>
                  <div>
                    <h3 className="text-xs font-extrabold text-white uppercase font-mono tracking-wider flex items-center gap-1.5">
                      <span>LinkedIn Easy Apply</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Instant Professional profile application</p>
                  </div>
                </div>
                <span className="text-[9px] font-mono font-bold text-slate-500 bg-[#09090B] px-2 py-0.5 border border-[#27272A] rounded-lg">
                  Premium Loop
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between border-b border-[#27272A] pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center select-none">
                    <Award className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <h3 className="text-xs font-extrabold text-white uppercase font-mono tracking-wider flex items-center gap-1.5">
                      <span>Naukri Fast-Track Apply</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Priority corporate referral matchmaker</p>
                  </div>
                </div>
                <span className="text-[9px] font-mono font-bold text-slate-500 bg-[#09090B] px-2 py-0.5 border border-[#27272A] rounded-lg">
                  Featured Candidate
                </span>
              </div>
            )}

            {/* Stepper progress headers */}
            {applyStep < 4 && (
              <div className="flex items-center justify-between bg-[#09090B] border border-[#27272A]/80 p-2 rounded-xl text-[9px] font-mono">
                <span className={`px-2 py-0.5 rounded ${applyStep === 1 ? "bg-[#6D5EF8] text-white font-bold" : "text-slate-500"}`}>1. Contact</span>
                <span className="text-slate-700">➔</span>
                <span className={`px-2 py-0.5 rounded ${applyStep === 2 ? "bg-[#6D5EF8] text-white font-bold" : "text-slate-500"}`}>2. STAR Story</span>
                <span className="text-slate-700">➔</span>
                <span className={`px-2 py-0.5 rounded ${applyStep === 3 ? "bg-[#6D5EF8] text-white font-bold" : "text-slate-500"}`}>3. Commentary</span>
              </div>
            )}

            {/* Step 1: Verification Form */}
            {applyStep === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-[#09090B]/50 border border-[#27272A]/60 p-3 rounded-xl">
                  <p className="text-[10px] text-slate-400 leading-normal">
                    You are applying for: <strong className="text-white">{selectedJob.roleTitle}</strong> at <strong className="text-white">{selectedJob.companyName}</strong>. Please confirm your linked credentials below.
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
                        value={currentUser?.name || "Active Candidate"}
                        className="w-full bg-[#09090B]/60 border border-[#27272A] text-slate-400 rounded-xl py-2.5 pl-9 pr-3 text-xs focus:outline-none cursor-not-allowed font-medium"
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
                        className="w-full bg-[#09090B]/60 border border-[#27272A] text-slate-400 rounded-xl py-2.5 pl-9 pr-3 text-xs focus:outline-none cursor-not-allowed font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono block">Contact Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute inset-y-0 left-3 h-3.5 w-3.5 text-slate-600 my-auto pointer-events-none" />
                    <input
                      type="tel"
                      placeholder="+91 XXXXX XXXXX or +1 (555) 019-2834"
                      className="w-full bg-[#09090B] border border-[#27272A] text-slate-300 rounded-xl py-2.5 pl-9 pr-3 text-xs focus:outline-none focus:border-[#6D5EF8] transition-colors"
                      value={applicantPhone}
                      onChange={(e) => setApplicantPhone(e.target.value)}
                      required
                    />
                  </div>
                  <p className="text-[9px] text-slate-500 font-mono">Will be verified by SMS on submission.</p>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-[#27272A]/40">
                  <button
                    onClick={() => setIsApplyModalOpen(false)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-[#27272A] text-slate-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setApplyStep(2)}
                    disabled={!applicantPhone.trim()}
                    className="px-5 py-2 bg-[#6D5EF8] disabled:bg-slate-900 disabled:border-[#27272A] disabled:text-slate-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>Next: Attach Story</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Attach STAR Story */}
            {applyStep === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">Linked Workbook STAR Stories</label>
                    <span className="text-[8px] font-mono text-indigo-400 uppercase font-bold bg-[#6D5EF8]/10 px-2 py-0.5 border border-[#6D5EF8]/15 rounded-full">
                      Bypasses ATS Screening
                    </span>
                  </div>
                  
                  <select
                    value={selectedStoryId}
                    onChange={(e) => setSelectedStoryId(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] text-slate-300 rounded-xl p-3 text-xs focus:outline-none focus:border-[#6D5EF8] cursor-pointer"
                  >
                    {savedStarStories.length > 0 ? (
                      <>
                        {savedStarStories.map(story => (
                          <option key={story.id} value={story.id}>
                            {story.title || "Untitled STAR story"} ({story.company || "General"})
                          </option>
                        ))}
                        <option value="none">Apply with general resume only (No STAR story attachment)</option>
                      </>
                    ) : (
                      <option value="none">No saved STAR stories in workbook (Applying via resume)</option>
                    )}
                  </select>
                </div>

                {/* Display active selection review */}
                {selectedStoryId !== "none" ? (
                  <div className="bg-[#09090B] border border-[#27272A] p-4 rounded-xl space-y-2 relative">
                    <span className="absolute top-2.5 right-2.5 text-[8.5px] font-bold text-emerald-400 font-mono flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/15 px-2 py-0.5 rounded-full select-none">
                      ✔ Match Boost +15%
                    </span>
                    <h4 className="text-xs font-bold text-white font-sans truncate max-w-[300px]">
                      {savedStarStories.find(s => s.id === selectedStoryId)?.title || "Selected STAR Story"}
                    </h4>
                    <p className="text-[10px] text-slate-400 line-clamp-3 leading-relaxed font-sans italic">
                      "{savedStarStories.find(s => s.id === selectedStoryId)?.result || "Attached behavioral case study."}"
                    </p>
                  </div>
                ) : (
                  <div className="bg-[#1C1917]/25 border border-[#44403C]/35 p-4 rounded-xl space-y-2 flex gap-3.5 items-start">
                    <span className="text-xl shrink-0 select-none">💡</span>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-200">Increase your matching probability!</h4>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Attaching a saved STAR behavioral study instantly increases your profile's parsing rating to 90%+ and flags you as high-priority inside hiring portals.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-[#27272A]/40">
                  <button
                    onClick={() => setApplyStep(1)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-[#27272A] text-slate-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  
                  <button
                    onClick={() => setApplyStep(3)}
                    className="px-5 py-2 bg-[#6D5EF8] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>Next: Commentary</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Brief Cover Commentary */}
            {applyStep === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">Cover Pitch / Commentary (Optional)</label>
                  <textarea
                    rows={4}
                    placeholder="Provide a brief statement explaining your architectural fit for this specific position..."
                    className="w-full bg-[#09090B] border border-[#27272A] text-slate-300 rounded-xl p-3 text-xs focus:outline-none focus:border-[#6D5EF8] leading-relaxed"
                    value={coverCommentary}
                    onChange={(e) => setCoverCommentary(e.target.value)}
                  />
                  <p className="text-[9px] text-slate-500 font-mono">Suggested focus: High scalability, distributed pipelines, and team leading.</p>
                </div>

                <div className="flex items-start gap-2.5 bg-[#09090B]/30 border border-[#27272A]/60 p-3 rounded-xl">
                  <input
                    id="apply-consent"
                    type="checkbox"
                    className="mt-0.5 rounded accent-[#6D5EF8] cursor-pointer"
                    checked={applyConsent}
                    onChange={(e) => setApplyConsent(e.target.checked)}
                  />
                  <label htmlFor="apply-consent" className="text-[9.5px] text-slate-400 leading-normal select-none cursor-pointer">
                    I consent to share my active profile details, workbook activity statistics, and attached STAR credentials directly with corporate hiring coordinators.
                  </label>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-[#27272A]/40">
                  <button
                    onClick={() => setApplyStep(2)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-[#27272A] text-slate-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  
                  <button
                    onClick={handleExecuteEasyApply}
                    disabled={!applyConsent}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#6D5EF8] to-indigo-600 disabled:from-slate-950 disabled:to-slate-950 disabled:text-slate-600 disabled:border-[#27272A] disabled:border text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-lg"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Submit Easy Application</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Submission progress loader */}
            {applyStep === 4 && (
              <div className="py-8 space-y-6 text-center animate-fade-in select-none">
                <div className="relative w-20 h-20 mx-auto">
                  {/* Glowing spinner */}
                  <div className="absolute inset-0 rounded-full border-4 border-[#27272A]" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-[#6D5EF8] border-r-indigo-500 animate-spin" />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold font-mono text-indigo-400">
                    {submissionProgress}%
                  </span>
                </div>

                <div className="space-y-1.5 max-w-xs mx-auto">
                  <h4 className="text-xs font-bold text-white font-sans">Processing Professional Application</h4>
                  <p className="text-[10px] text-slate-500 font-mono tracking-wide">{submissionStepMsg}</p>
                </div>

                <div className="w-full bg-[#09090B] border border-[#27272A] rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-[#6D5EF8] to-emerald-400 h-1.5 transition-all duration-300"
                    style={{ width: `${submissionProgress}%` }}
                  />
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
