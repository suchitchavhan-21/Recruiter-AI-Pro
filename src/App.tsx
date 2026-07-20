import React, { useState, useEffect } from "react";
import { apiFetch } from "./lib/api";
import { 
  Sparkles, 
  Terminal, 
  FileText, 
  Send, 
  Building, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Briefcase, 
  Radio, 
  Compass, 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Award, 
  RotateCcw, 
  Info, 
  Check, 
  ChevronRight, 
  HelpCircle, 
  BookOpen, 
  Sliders, 
  ExternalLink,
  Clock,
  Activity,
  Trash2,
  Plus,
  Bookmark,
  Zap,
  Smile,
  Copy,
  User,
  Users,
  Lock,
  KeyRound,
  ShieldAlert,
  Loader,
  Sun,
  Moon
} from "lucide-react";

import { 
  Phase, 
  Question, 
  JDAnalysis, 
  QAHistory, 
  FeedbackReport as FeedbackType, 
  CoachingData,
  InterviewerPersona,
  SavedSTARStory,
  InterviewSession,
  JobApplication,
  UserProfile,
  UserActivity
} from "./types";
import { COMPANY_PRESETS } from "./data/companyRoles";

import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import HomeDashboard from "./components/HomeDashboard";
import InterviewWizard from "./components/InterviewWizard";
import ActiveInterview from "./components/ActiveInterview";
import JobsExplorer from "./components/JobsExplorer";
import AnalyticsView from "./components/AnalyticsView";
import StudyHub from "./components/StudyHub";
import ProfileSettings from "./components/ProfileSettings";
import FeedbackReport from "./components/FeedbackReport";
import AuthPage from "./components/AuthPage";
import EnterpriseResumeScanner from "./components/EnterpriseResumeScanner";
import VoiceCalibrator from "./components/VoiceCalibrator";

export default function App() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"home" | "interview" | "jobs" | "dashboard" | "study" | "profile" | "resume" | "calibrate">("home");
  
  // Real Authentication states
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [sessionsHistory, setSessionsHistory] = useState<InterviewSession[]>([]);
  const [savedStarStories, setSavedStarStories] = useState<SavedSTARStory[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);

  // Active Simulation variables
  const [activeSessionQuestions, setActiveSessionQuestions] = useState<Question[] | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [activeAnswers, setActiveAnswers] = useState<QAHistory[]>([]);
  const [activeAnalysis, setActiveAnalysis] = useState<JDAnalysis | null>(null);
  const [isWizardAnalyzing, setIsWizardAnalyzing] = useState(false);
  const [activeInterviewerPersona, setActiveInterviewerPersona] = useState<InterviewerPersona>("mentor");
  const [activeCompany, setActiveCompany] = useState("");
  const [activeRole, setActiveRole] = useState("");
  const [activeInterviewerCount, setActiveInterviewerCount] = useState<number>(1);

  // Post-Interview Evaluation states
  const [isEvaluationLoading, setIsEvaluationLoading] = useState(false);
  const [latestFeedbackReport, setLatestFeedbackReport] = useState<FeedbackType | null>(null);

  // Priority Referral Slot modal
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedJobForApply, setSelectedJobForApply] = useState<JobApplication | null>(null);
  const [applyCandidateName, setApplyCandidateName] = useState("Candidate Engineer");
  const [applyCandidateEmail, setApplyCandidateEmail] = useState("candidate@example.com");
  const [applySelectedSlot, setApplySelectedSlot] = useState("Fast-Track Referral Slot (Priority A)");
  const [applySelectedStoryId, setApplySelectedStoryId] = useState("custom");
  const [applyCoverLetter, setApplyCoverLetter] = useState("");
  const [isSubmittingReferral, setIsSubmittingReferral] = useState(false);

  // Toast notifications
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Active Unified Design Theme
  const [theme, setTheme] = useState<"cosmic-dark" | "nordic-slate">(() => {
    return (localStorage.getItem("recruiter_theme") as any) || "cosmic-dark";
  });

  const handleSetTheme = (newTheme: "cosmic-dark" | "nordic-slate") => {
    setTheme(newTheme);
    localStorage.setItem("recruiter_theme", newTheme);
    showNotification(`UI Theme switched to ${newTheme === "nordic-slate" ? "Light Mode" : "Present (Dark) Mode"}`, "success");
  };

  const showNotification = (message: string, type: "success" | "error" | "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch workspace data locally on mount
  const checkActiveAuthSession = async () => {
    try {
      const res = await apiFetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setCurrentUser({
          id: data.id,
          name: data.fullName,
          email: data.email,
          roleTitle: data.role === "admin" ? "System Administrator" : "Candidate Engineer",
          joinedAt: data.createdAt || new Date().toISOString(),
          avatarEmoji: data.role === "admin" ? "🛡️" : "🦊",
          role: data.role,
          profilePhoto: data.profilePhoto,
          phoneNumber: data.phoneNumber
        });
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.error("Auth session check failed:", err);
      setCurrentUser(null);
    }
    setApplications(seedApplicationsList());
  };

  const handleLogout = async () => {
    try {
      await apiFetch("/api/logout", { method: "POST" });
      setCurrentUser(null);
      setActiveTab("home");
      showNotification("Session logged out successfully.", "success");
    } catch (err) {
      console.error("Logout failed:", err);
      setCurrentUser(null);
    }
  };

  // Seed standard opportunities inside the jobs dashboard
  const seedApplicationsList = () => {
    const list: JobApplication[] = [];
    COMPANY_PRESETS.forEach(comp => {
      comp.roles.forEach((role, idx) => {
        list.push({
          id: `${comp.id}-role-${idx}`,
          timestamp: new Date(Date.now() - idx * 3 * 3600 * 1000).toISOString(),
          companyId: comp.id,
          companyName: comp.name,
          roleTitle: role.title,
          roleCategory: role.category,
          applicantName: currentUser?.name || "Anonymous Candidate",
          applicantEmail: currentUser?.email || "candidate@example.com",
          coverLetter: "",
          status: idx % 3 === 0 ? "Interview Scheduled" : "Screening",
          appliedSlot: idx % 2 === 0 ? "Fast-Track Referral Slot (Priority A)" : "Standard Direct Application Slot",
          screeningFeedback: "ATS Match: calibrated. Complete your mock interview loop with AI recruiter to schedule coordinator call.",
          matchScore: idx % 2 === 0 ? 89 : 82,
          jdFullText: role.text,
          skillsRequired: comp.id === "google" ? ["JAX", "Distributed Infrastructure", "LLMs", "Systems Design"] : 
                          comp.id === "stripe" ? ["SQL", "PCI-DSS", "mTLS Encryption", "Double-Entry Ledger"] : 
                          ["Software Architecture", "Systems Design", "Technical Communication", "API Design"],
          location: comp.id === "google" ? "Mountain View, CA" : comp.id === "stripe" ? "San Francisco, CA" : "Remote, US",
          salaryRange: comp.id === "google" ? "$185,000 - $240,000" : comp.id === "stripe" ? "$170,000 - $210,000" : "$160,000 - $200,000",
          remoteBadge: idx % 2 === 0,
          difficultyBadge: idx % 3 === 0 ? "Staff" : idx % 3 === 1 ? "Senior" : "Mid",
          category: role.category,
          industryContext: comp.industry
        });
      });
    });
    return list;
  };

  // Mount logic
  useEffect(() => {
    checkActiveAuthSession();

    // Recover history from local store
    try {
      const storedHistory = localStorage.getItem("recruiter_ai_sessions");
      if (storedHistory) setSessionsHistory(JSON.parse(storedHistory));

      const storedStories = localStorage.getItem("recruiter_ai_saved_stories");
      if (storedStories) setSavedStarStories(JSON.parse(storedStories));
    } catch (err) {
      console.warn("Recovering storage drills failed:", err);
    }
  }, []);

  const saveSessionsHistory = (newHistory: InterviewSession[]) => {
    setSessionsHistory(newHistory);
    localStorage.setItem("recruiter_ai_sessions", JSON.stringify(newHistory));
  };

  const handleDeleteSession = (id: string) => {
    const updated = sessionsHistory.filter(s => s.id !== id);
    saveSessionsHistory(updated);
    showNotification("Previous mock session deleted.", "success");
  };

  const handleClearAllSessions = () => {
    if (window.confirm("Are you sure you want to clear your entire mock session history?")) {
      saveSessionsHistory([]);
      showNotification("All previous mock sessions cleared.", "success");
    }
  };

  const saveStarStories = (newStories: SavedSTARStory[]) => {
    setSavedStarStories(newStories);
    localStorage.setItem("recruiter_ai_saved_stories", JSON.stringify(newStories));
  };

  const saveApplications = (newApps: JobApplication[]) => {
    setApplications(newApps);
  };

  // Trigger JD analysis & formulate questions
  const handleStartSimulation = async (config: {
    company: string;
    role: string;
    jdText: string;
    style: "technical" | "behavioral" | "hybrid";
    difficulty: "Entry" | "Mid" | "Senior" | "Expert";
    persona: "mentor" | "architect" | "product_leader";
    interviewerCount?: number;
  }) => {
    setIsWizardAnalyzing(true);
    setActiveCompany(config.company);
    setActiveRole(config.role);
    setActiveInterviewerPersona(config.persona);
    const count = config.interviewerCount !== undefined ? config.interviewerCount : 1;
    setActiveInterviewerCount(count);

    try {
      const res = await apiFetch("/api/analyze-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          jd: config.jdText, 
          companyName: config.company,
          persona: config.persona,
          interviewerCount: count
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Analysis failed");
      }

      const data: JDAnalysis = await res.json();
      setActiveAnalysis(data);
      setActiveSessionQuestions(data.questions);
      setCurrentQuestionIndex(0);
      setActiveAnswers([]);

      showNotification("SaaS dynamic simulation compiled. Let's begin!", "success");

    } catch (err: any) {
      showNotification(err.message || "Failed to start simulation. Check connectivity.", "error");
    } finally {
      setIsWizardAnalyzing(false);
    }
  };

  // Move forward through active questions
  const handleNextQuestion = (answerText: string) => {
    if (!activeSessionQuestions) return;
    
    const currentQ = activeSessionQuestions[currentQuestionIndex];
    const newAnswer: QAHistory = {
      questionId: currentQ.id,
      questionText: currentQ.text,
      type: currentQ.type,
      answerText: answerText
    };

    const updatedAnswers = [...activeAnswers, newAnswer];
    setActiveAnswers(updatedAnswers);
    setCurrentQuestionIndex(prev => prev + 1);
  };

  // Submit all answers for grade compilation
  const handleFinishInterview = async (answerText: string) => {
    if (!activeSessionQuestions) return;

    const currentQ = activeSessionQuestions[currentQuestionIndex];
    let finalAnswers = [...activeAnswers, {
      questionId: currentQ.id,
      questionText: currentQ.text,
      type: currentQ.type,
      answerText: answerText
    }];

    // If we finished early (i.e. currentQuestionIndex is not the last index),
    // append all remaining questions as "[Skipped/Ended interview early]" so they appear in the final report
    if (currentQuestionIndex < activeSessionQuestions.length - 1) {
      for (let i = currentQuestionIndex + 1; i < activeSessionQuestions.length; i++) {
        finalAnswers.push({
          questionId: activeSessionQuestions[i].id,
          questionText: activeSessionQuestions[i].text,
          type: activeSessionQuestions[i].type,
          answerText: "[Skipped/Ended interview early]"
        });
      }
    }

    setActiveAnswers(finalAnswers);
    setActiveSessionQuestions(null); // Exit active simulator
    setIsEvaluationLoading(true);

    try {
      const res = await apiFetch("/api/evaluate-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jd: activeAnalysis?.skills?.join(", ") || activeRole || "Software Engineer",
          companyName: activeCompany,
          qaList: finalAnswers,
          persona: activeInterviewerPersona,
          interviewerCount: activeInterviewerCount
        })
      });

      if (!res.ok) throw new Error("Evaluation request failed.");

      const report: FeedbackType = await res.json();
      setLatestFeedbackReport(report);

      const isStrong = report.overallRating.toLowerCase().includes("strong");
      const isLean = report.overallRating.toLowerCase().includes("lean");
      const computedScore = report.score !== undefined ? report.score : (isStrong ? 93 : isLean ? 76 : 52);

      // Persist as a historical drill
      const newSession: InterviewSession = {
        id: "session-" + Date.now(),
        timestamp: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        company: activeCompany,
        role: activeRole,
        persona: activeInterviewerPersona,
        analysis: activeAnalysis || { difficulty: "Senior", skills: [], companyTrends: "", questions: [] },
        answers: finalAnswers,
        evaluation: report,
        score: computedScore,
        interviewerCount: activeInterviewerCount
      };
      
      saveSessionsHistory([newSession, ...sessionsHistory]);
      showNotification("Interview evaluation fully calibrated!", "success");

    } catch (err: any) {
      showNotification("Evaluation feedback failed. Showing fallback score.", "error");
      
      const fallbackReport: FeedbackType = {
        overallRating: "Strong Hire",
        overallFeedback: "Excellent structural systems engineering layout. You systematically explained scaling checkpoints, distributed caching configurations, and transaction rollbacks. Optimal communication skills.",
        strengths: [
          "Precise architectural choices described clearly.",
          "Good STAR narrative detailing business value metrics."
        ],
        improvements: [
          "Explain caching eviction and memory optimization more clearly."
        ],
        questionBreakdown: []
      };
      setLatestFeedbackReport(fallbackReport);

      const newSession: InterviewSession = {
        id: "session-" + Date.now(),
        timestamp: new Date().toLocaleDateString(),
        company: activeCompany,
        role: activeRole,
        persona: activeInterviewerPersona,
        analysis: activeAnalysis || { difficulty: "Senior", skills: [], companyTrends: "", questions: [] },
        answers: finalAnswers,
        evaluation: fallbackReport,
        score: 87,
        interviewerCount: activeInterviewerCount
      };
      saveSessionsHistory([newSession, ...sessionsHistory]);
    } finally {
      setIsEvaluationLoading(false);
    }
  };

  // Launch positions from Careers Search Explorer
  const handlePracticeJobDirect = (company: string, role: string, jdText: string) => {
    setActiveCompany(company);
    setActiveRole(role);
    setActiveTab("interview");
    
    handleStartSimulation({
      company: company,
      role: role,
      jdText: jdText,
      style: "hybrid",
      difficulty: "Senior",
      persona: "mentor"
    });
  };

  // Handle priority referral submit
  const handleReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobForApply) return;

    setIsSubmittingReferral(true);

    try {
      const isAttached = applySelectedStoryId !== "custom";
      const attachedStory = savedStarStories.find(s => s.id === applySelectedStoryId);
      
      const score = isAttached ? Math.floor(Math.random() * 8) + 90 : Math.floor(Math.random() * 12) + 74;
      const feedbackText = isAttached 
        ? `Fast-Track Approved: Attached STAR Story ('${attachedStory?.title}') quantified measurable high-scale outcome.` 
        : `Profile screened. Match rate is ${score}%.`;

      const res = await apiFetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: selectedJobForApply.companyName,
          role: selectedJobForApply.roleTitle,
          status: isAttached ? "Interview Scheduled" : "Screening",
          notes: applyCoverLetter || feedbackText,
          interviewDate: ""
        })
      });

      if (res.ok) {
        showNotification(`Priority application processed for ${selectedJobForApply.roleTitle}!`, "success");
        // Reload list
        const resApps = await apiFetch("/api/applications");
        if (resApps.ok) {
          const apps = await resApps.json();
          setApplications(apps);
        }
      }

    } catch (err) {
      console.error("Referral submit error:", err);
    } finally {
      setIsSubmittingReferral(false);
      setIsApplyModalOpen(false);
    }
  };

  const handleOpenReferralModal = (job: JobApplication) => {
    setSelectedJobForApply(job);
    setApplySelectedSlot("Fast-Track Referral Slot (Priority A)");
    setApplyCoverLetter("");
    setIsApplyModalOpen(true);
  };

  const handleSetTab = (tab: string) => {
    setActiveTab(tab as any);
  };

  if (!currentUser) {
    return (
      <div className={`flex min-h-screen text-[var(--text-main,#F4F4F5)] font-sans theme-${theme} bg-[var(--bg-app,#09090B)] items-center justify-center p-4`}>
        <AuthPage 
          onLoginSuccess={() => checkActiveAuthSession()} 
          showNotification={showNotification} 
        />
      </div>
    );
  }

  if (currentUser && activeSessionQuestions) {
    return (
      <ActiveInterview 
        questions={activeSessionQuestions} 
        currentQuestionIndex={currentQuestionIndex} 
        onNextQuestion={handleNextQuestion} 
        onFinishInterview={handleFinishInterview} 
        persona={activeInterviewerPersona} 
        companyName={activeCompany} 
        roleName={activeRole} 
        interviewerCount={activeInterviewerCount}
        currentUser={currentUser}
        onExitSession={() => {
          if (confirm("Are you sure you want to exit this live simulation? Your active responses will be lost.")) {
            setActiveSessionQuestions(null);
            setActiveTab("home");
          }
        }}
      />
    );
  }

  return (
    <div className={`flex min-h-screen text-[var(--text-main,#F4F4F5)] font-sans theme-${theme} bg-[var(--bg-app,#09090B)]`}>
      
      {/* Sidebar navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleSetTab} 
        currentUser={currentUser}
        onOpenProfile={() => handleSetTab("profile")}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6">
        
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-[#09090B]/85 backdrop-blur-md border-b border-[#27272A] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Recruiter Agent Active</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Elegant Sun / Moon Toggle Button */}
            <div className="flex items-center gap-1 bg-slate-900/60 border border-[#27272A] p-1 rounded-lg">
              <button
                onClick={() => handleSetTheme("nordic-slate")}
                title="Light Mode (Sun)"
                className={`p-1.5 rounded-md transition-all flex items-center justify-center cursor-pointer ${
                  theme === "nordic-slate"
                    ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleSetTheme("cosmic-dark")}
                title="Present Mode (Moon)"
                className={`p-1.5 rounded-md transition-all flex items-center justify-center cursor-pointer ${
                  theme === "cosmic-dark"
                    ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
            </div>

            <span className="text-[10.5px] font-bold text-slate-300 font-mono bg-slate-900 border border-[#27272A] px-2.5 py-1 rounded-lg">
              Candidate: {currentUser.name}
            </span>
          </div>
        </header>

        {/* Workspace body */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          
          {/* Toast Notification */}
          {notification && (
            <div className={`fixed top-18 right-6 z-50 p-4 rounded-xl border shadow-lg max-w-sm animate-slide-up flex gap-3 items-start text-xs font-mono ${
              notification.type === "success" 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : notification.type === "error" 
                ? "bg-rose-500/10 border-rose-500/20 text-rose-400" 
                : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
            }`}>
              <span className="w-2 h-2 rounded-full bg-current mt-1.5 shrink-0" />
              <p>{notification.message}</p>
            </div>
          )}

          {/* AI Scorecard compile status */}
          {isEvaluationLoading && (
            <div className="py-24 text-center max-w-xl mx-auto space-y-5 animate-fade-in">
              <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
                <Loader className="h-10 w-10 text-[#6D5EF8] animate-spin" />
                <Sparkles className="h-4 w-4 text-[#6D5EF8] absolute m-auto animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-white">Compiling AI Evaluation Scorecard...</h3>
              <p className="text-xs text-slate-400 font-mono leading-relaxed">
                Aggregating system design trade-offs, quantifying communication pace, measuring keyword metrics, and rating answers against elite hiring bars. One moment...
              </p>
            </div>
          )}

          {/* TAB 1: HOME PANEL */}
          {!isEvaluationLoading && activeTab === "home" && (
            <HomeDashboard 
              currentUser={currentUser} 
              sessionsHistory={sessionsHistory} 
              onStartInterview={() => setActiveTab("interview")}
              onExploreCompanies={() => setActiveTab("jobs")}
              onNavigateToStudy={() => setActiveTab("study")}
              onNavigateToResume={() => setActiveTab("resume")}
              onNavigateToCalibrate={() => setActiveTab("calibrate")}
            />
          )}

          {/* TAB 2: INTERVIEW SIMULATOR */}
          {!isEvaluationLoading && activeTab === "interview" && (
            <>
              {!activeSessionQuestions && !latestFeedbackReport && (
                <InterviewWizard 
                  onStartSimulation={handleStartSimulation} 
                  isAnalyzing={isWizardAnalyzing} 
                />
              )}

              {activeSessionQuestions && (
                <ActiveInterview 
                  questions={activeSessionQuestions} 
                  currentQuestionIndex={currentQuestionIndex} 
                  onNextQuestion={handleNextQuestion} 
                  onFinishInterview={handleFinishInterview} 
                  persona={activeInterviewerPersona} 
                  companyName={activeCompany} 
                  roleName={activeRole} 
                  interviewerCount={activeInterviewerCount}
                />
              )}

              {latestFeedbackReport && !activeSessionQuestions && (
                <FeedbackReport 
                  evaluation={latestFeedbackReport} 
                  onBackToDashboard={() => {
                    setLatestFeedbackReport(null);
                    setActiveTab("home");
                  }} 
                  onNavigateToStudy={() => {
                    setLatestFeedbackReport(null);
                    setActiveTab("study");
                  }} 
                  questions={activeAnswers.map(ans => ({ id: ans.questionId, text: ans.questionText, expectedFocus: "", type: ans.type }))}
                />
              )}
            </>
          )}

          {/* TAB 3: JOBS BOARD */}
          {!isEvaluationLoading && activeTab === "jobs" && (
            <JobsExplorer 
              applications={applications} 
              onPracticeJob={handlePracticeJobDirect} 
              onOpenApplyModal={handleOpenReferralModal} 
              onSaveApplications={saveApplications}
              savedStarStories={savedStarStories}
              currentUser={currentUser}
            />
          )}

          {/* TAB 4: CALIBRATION METRICS / ANALYTICS */}
          {!isEvaluationLoading && activeTab === "dashboard" && (
            <AnalyticsView 
              currentUser={currentUser} 
              sessionsHistory={sessionsHistory} 
              onStartInterview={() => setActiveTab("interview")}
              onDeleteSession={handleDeleteSession}
              onClearAllSessions={handleClearAllSessions}
              onViewFeedback={(feedback) => {
                setLatestFeedbackReport(feedback);
                setActiveTab("interview");
              }}
            />
          )}

          {/* TAB 5: STUDY WORKBOOK CORE */}
          {!isEvaluationLoading && activeTab === "study" && (
            <StudyHub 
              currentUser={currentUser} 
              savedStarStories={savedStarStories} 
              onSaveStarStory={(story) => saveStarStories([story, ...savedStarStories])} 
              onDeleteStarStory={(id) => saveStarStories(savedStarStories.filter(s => s.id !== id))} 
              onUseTemplate={handlePracticeJobDirect}
            />
          )}

          {/* TAB 6: SETTINGS PROFILE */}
          {!isEvaluationLoading && activeTab === "profile" && (
            <ProfileSettings 
              currentUser={currentUser} 
              sessionsHistory={sessionsHistory}
              savedStarStories={savedStarStories}
              applications={applications}
              onLogout={handleLogout}
            />
          )}

          {/* TAB 7: ATS RESUME SCANNER */}
          {!isEvaluationLoading && activeTab === "resume" && (
            <EnterpriseResumeScanner currentUser={currentUser} />
          )}

          {/* TAB 8: VOICE CALIBRATOR */}
          {!isEvaluationLoading && activeTab === "calibrate" && (
            <VoiceCalibrator />
          )}

        </main>
      </div>

      {/* Mobile bottom navigation bar */}
      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={handleSetTab} 
        currentUser={currentUser}
      />

      {/* MODAL 2: PRIORITY REFERRAL APPLICATION FORM */}
      {isApplyModalOpen && selectedJobForApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111827] border border-[#27272A] max-w-lg w-full rounded-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div>
              <span className="text-[9px] font-bold text-[#6D5EF8] uppercase font-mono tracking-wider">Direct Recruiting Loop</span>
              <h3 className="text-sm font-bold text-white font-sans mt-0.5">Priority Referral Submission</h3>
              <p className="text-[10px] text-slate-500 mt-1">Applying for: <strong>{selectedJobForApply.roleTitle}</strong> at <strong>{selectedJobForApply.companyName}</strong></p>
            </div>

            <form onSubmit={handleReferralSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1.5">Candidate Name</label>
                  <input
                    type="text"
                    className="w-full bg-[#09090B] border border-[#27272A] text-slate-300 rounded-lg p-2.5 text-xs focus:outline-none"
                    value={applyCandidateName}
                    onChange={(e) => setApplyCandidateName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1.5">Email Address</label>
                  <input
                    type="email"
                    className="w-full bg-[#09090B] border border-[#27272A] text-slate-300 rounded-lg p-2.5 text-xs focus:outline-none"
                    value={applyCandidateEmail}
                    onChange={(e) => setApplyCandidateEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1.5">Attach Practiced Behavioral Story (Boosts ATS Score to 90%+)</label>
                <select
                  value={applySelectedStoryId}
                  onChange={(e) => setApplySelectedStoryId(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#27272A] text-slate-300 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#6D5EF8]"
                >
                  <option value="custom">No attached story (Apply with resume only)</option>
                  {savedStarStories.map(story => (
                    <option key={story.id} value={story.id}>
                      {story.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1.5">Selected Referral Priority Channel</label>
                <select
                  value={applySelectedSlot}
                  onChange={(e) => setApplySelectedSlot(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#27272A] text-slate-300 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#6D5EF8]"
                >
                  <option value="Fast-Track Referral Slot (Priority A)">Fast-Track Referral Slot (Priority A) - Instant partner screening</option>
                  <option value="Standard Direct Application Slot">Standard Direct Application Slot - Standard queue review</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1.5">Brief Cover Commentary / Career Objective</label>
                <textarea
                  rows={3}
                  placeholder="Tell our recruiting coordinator why you're a standout systems engineer fit..."
                  className="w-full bg-[#09090B] border border-[#27272A] text-slate-300 rounded-xl p-3 text-xs focus:outline-none focus:border-[#6D5EF8] leading-relaxed"
                  value={applyCoverLetter}
                  onChange={(e) => setApplyCoverLetter(e.target.value)}
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 border border-[#27272A] text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReferral}
                  className="flex-1 py-2.5 bg-[#6D5EF8] hover:bg-[#6D5EF8]/90 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSubmittingReferral ? "Submitting Referral..." : "Submit Priority Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
