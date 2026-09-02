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
  const [activeAdaptiveSessionId, setActiveAdaptiveSessionId] = useState<string | null>(null);

  // Post-Interview Evaluation states
  const [isEvaluationLoading, setIsEvaluationLoading] = useState(false);
  const [latestFeedbackReport, setLatestFeedbackReport] = useState<FeedbackType | null>(null);

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

  const fetchUserApplications = async () => {
    try {
      const res = await apiFetch("/api/jobs");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.applications)) {
          setApplications(data.applications.map((app: any) => ({
            id: app.id,
            timestamp: app.appliedAt || app.timestamp || new Date().toISOString(),
            companyId: app.company?.toLowerCase().replace(/[^a-z0-9]/g, "") || "company",
            companyName: app.company,
            roleTitle: app.role,
            roleCategory: app.roleCategory || "Engineering",
            applicantName: app.applicantName,
            applicantEmail: app.applicantEmail,
            coverLetter: app.coverLetter || "",
            status: app.status || "Submitted",
            appliedSlot: "Recorded Application",
            screeningFeedback: `Application recorded for ${app.role} at ${app.company}. Current status: ${app.status || "Submitted"}.`,
            matchScore: typeof app.matchScore === "number" ? app.matchScore : 0,
            jdFullText: app.notes || "",
            skillsRequired: [],
            location: "Remote / Hybrid",
            salaryRange: "$140,000 - $200,000",
            remoteBadge: true,
            difficultyBadge: "Senior",
            category: app.roleCategory || "Engineering",
            industryContext: "Technology"
          })));
          return;
        }
      }
      setApplications([]);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
      setApplications([]);
    }
  };

  const fetchUserHistory = async () => {
    try {
      const res = await apiFetch("/api/interviews");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.interviews)) {
          setSessionsHistory(data.interviews.map((i: any) => ({
            id: i.id,
            timestamp: new Date(i.createdAt).toLocaleString(),
            company: i.company,
            role: i.role,
            persona: i.persona || "mentor",
            analysis: { difficulty: i.difficulty || "Senior", skills: [], companyTrends: "", questions: i.questions || [] },
            answers: i.answers || [],
            evaluation: i.evaluation,
            score: typeof i.score === "number" ? i.score : 0,
            interviewerCount: i.interviewerCount || 1
          })));
        }
      }
    } catch (err) {
      console.warn("Failed to fetch interview history from server:", err);
    }
  };

  const fetchStarStories = async () => {
    try {
      const res = await apiFetch("/api/star-stories");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.stories)) {
          setSavedStarStories(data.stories.map((s: any) => ({
            id: s.id,
            timestamp: new Date(s.createdAt).toLocaleDateString(),
            role: s.role,
            company: s.company,
            situation: s.situation,
            task: s.task,
            action: s.action,
            result: s.result,
            expertStory: s.expertStory || ""
          })));
        }
      }
    } catch (err) {
      console.warn("Failed to fetch STAR stories from server:", err);
    }
  };

  // Fetch workspace data locally on mount
  const checkActiveAuthSession = async () => {
    try {
      const res = await apiFetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        const userObj = data.user || data;
        if (userObj && (userObj.id || userObj.email || userObj.fullName || userObj.name)) {
          setCurrentUser({
            id: userObj.id,
            name: userObj.fullName || userObj.name || "Candidate",
            fullName: userObj.fullName || userObj.name || "Candidate",
            email: userObj.email || "",
            roleTitle: userObj.role === "admin" ? "System Administrator" : "Candidate Engineer",
            joinedAt: userObj.createdAt || userObj.joinedAt || new Date().toISOString(),
            avatarEmoji: userObj.role === "admin" ? "🛡️" : "🦊",
            role: userObj.role || "candidate",
            profilePhoto: userObj.profilePhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120",
            phoneNumber: userObj.phoneNumber || ""
          });
          await Promise.all([
            fetchUserApplications(),
            fetchUserHistory(),
            fetchStarStories()
          ]);
        } else {
          setCurrentUser(null);
          setApplications([]);
          setSessionsHistory([]);
          setSavedStarStories([]);
        }
      } else {
        setCurrentUser(null);
        setApplications([]);
        setSessionsHistory([]);
        setSavedStarStories([]);
      }
    } catch (err) {
      console.error("Auth session check failed:", err);
      setCurrentUser(null);
      setApplications([]);
      setSessionsHistory([]);
      setSavedStarStories([]);
    }
  };

  const handleUpdateCurrentUser = (updated: any) => {
    const userObj = updated.user || updated;
    setCurrentUser((prev: any) => ({
      ...prev,
      ...userObj,
      name: userObj.fullName || userObj.name || prev?.name || "Candidate",
      fullName: userObj.fullName || userObj.name || prev?.fullName || "Candidate",
      phoneNumber: typeof userObj.phoneNumber !== "undefined" ? userObj.phoneNumber : prev?.phoneNumber,
      profilePhoto: userObj.profilePhoto || prev?.profilePhoto
    }));
  };

  const handleLogout = async () => {
    try {
      await apiFetch("/api/logout", { method: "POST" });
      setCurrentUser(null);
      setApplications([]);
      setSessionsHistory([]);
      setSavedStarStories([]);
      setActiveTab("home");
      showNotification("Session logged out successfully.", "success");
    } catch (err) {
      console.error("Logout failed:", err);
      setCurrentUser(null);
      setApplications([]);
      setSessionsHistory([]);
      setSavedStarStories([]);
    }
  };

  // Mount logic
  useEffect(() => {
    checkActiveAuthSession();
  }, []);

  const handleDeleteSession = (id: string) => {
    setSessionsHistory(prev => prev.filter(s => s.id !== id));
    showNotification("Previous mock session removed from view.", "success");
  };

  const handleClearAllSessions = () => {
    setSessionsHistory([]);
    showNotification("Mock session history cleared from view.", "success");
  };

  const handleSaveStarStory = async (story: SavedSTARStory) => {
    try {
      const res = await apiFetch("/api/star-stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: story.role,
          company: story.company,
          situation: story.situation,
          task: story.task,
          action: story.action,
          result: story.result,
          expertStory: story.expertStory || story.result,
          title: story.role
        })
      });
      if (res.ok) {
        const data = await res.json();
        const saved = data.story ? {
          id: data.story.id,
          timestamp: new Date(data.story.createdAt).toLocaleDateString(),
          role: data.story.role,
          company: data.story.company,
          situation: data.story.situation,
          task: data.story.task,
          action: data.story.action,
          result: data.story.result,
          expertStory: data.story.expertStory
        } : story;
        setSavedStarStories(prev => [saved, ...prev.filter(s => s.id !== saved.id)]);
        showNotification("STAR narrative saved to your Answer Bank.", "success");
      }
    } catch (err) {
      showNotification("Failed to save STAR narrative.", "error");
    }
  };

  const handleDeleteStarStory = async (id: string) => {
    try {
      const res = await apiFetch(`/api/star-stories/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSavedStarStories(prev => prev.filter(s => s.id !== id));
        showNotification("STAR narrative deleted.", "success");
      }
    } catch (err) {
      showNotification("Failed to delete STAR narrative.", "error");
    }
  };

  const saveApplications = (newApps: JobApplication[]) => {
    setApplications(newApps);
  };

  // Trigger JD analysis & formulate questions with Bounded Adaptive Orchestrator
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
        const errorData = await res.json().catch(() => ({}));
        const errMsg = errorData?.error?.message || errorData?.error || errorData?.message || "Analysis failed";
        throw new Error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg));
      }

      const data: JDAnalysis = await res.json();
      setActiveAnalysis(data);

      // Start Bounded Adaptive Session in PostgreSQL
      try {
        const adaptiveRes = await apiFetch("/api/interview/adaptive/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: config.role,
            company: config.company,
            difficulty: config.difficulty || "Senior",
            interviewerCount: count,
            questions: data.questions
          })
        });

        if (adaptiveRes.ok) {
          const adaptiveData = await adaptiveRes.json();
          if (adaptiveData?.state?.sessionId) {
            setActiveAdaptiveSessionId(adaptiveData.state.sessionId);
          }
        }
      } catch (adaptErr) {
        console.warn("Adaptive orchestrator session start warning:", adaptErr);
      }

      setActiveSessionQuestions(data.questions);
      setCurrentQuestionIndex(0);
      setActiveAnswers([]);

      showNotification("Adaptive interview session initialized. Let's begin!", "success");

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

    // Process adaptive turn in backend orchestrator if session is active
    if (activeAdaptiveSessionId) {
      apiFetch("/api/interview/adaptive/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeAdaptiveSessionId,
          answer: answerText,
          timeTaken: "2m"
        })
      }).catch(err => console.warn("Adaptive turn progression:", err));
    }
  };

  // Submit all answers for real evaluation compilation
  const handleFinishInterview = async (answerText: string) => {
    if (!activeSessionQuestions) return;

    const currentQ = activeSessionQuestions[currentQuestionIndex];
    let finalAnswers = [...activeAnswers, {
      questionId: currentQ.id,
      questionText: currentQ.text,
      type: currentQ.type,
      answerText: answerText
    }];

    // If finished early, append remaining questions
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
    setActiveSessionQuestions(null);
    setIsEvaluationLoading(true);

    try {
      const res = await apiFetch("/api/evaluate-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: activeRole || "Software Engineer",
          company: activeCompany || "Target Company",
          jd: activeAnalysis?.skills?.join(", ") || activeRole || "Software Engineer",
          companyName: activeCompany,
          qaPairs: finalAnswers,
          qaList: finalAnswers,
          persona: activeInterviewerPersona,
          interviewerCount: activeInterviewerCount
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errMsg = errorData?.error?.message || errorData?.error || errorData?.message || "Evaluation request failed.";
        throw new Error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg));
      }

      const report: FeedbackType = await res.json();
      setLatestFeedbackReport(report);

      // Refresh authoritative database history
      await fetchUserHistory();
      showNotification("Interview evaluation fully completed and saved.", "success");

    } catch (err: any) {
      showNotification("Interview evaluation failed: " + (err.message || "Please check connectivity."), "error");
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

  const handleSetTab = (tab: string) => {
    setActiveTab(tab as any);
  };

  if (!currentUser) {
    return (
      <AuthPage 
        onLoginSuccess={() => checkActiveAuthSession()} 
        showNotification={showNotification} 
      />
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
          setActiveSessionQuestions(null);
          setActiveTab("home");
          showNotification("Exited live simulation session.", "info");
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
        <header className="sticky top-0 z-40 bg-[#09090B]/70 backdrop-blur-xl border-b border-white/10 px-6 py-3.5 flex items-center justify-between shadow-[0_4px_20px_0_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-2 glass-pill px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span className="text-[10px] font-bold text-slate-300 uppercase font-mono tracking-wider">Recruiter Agent Active</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Elegant Sun / Moon Toggle Button */}
            <div className="flex items-center gap-1 glass-pill p-1 rounded-xl">
              <button
                onClick={() => handleSetTheme("nordic-slate")}
                title="Light Mode (Sun)"
                className={`p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                  theme === "nordic-slate"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleSetTheme("cosmic-dark")}
                title="Present Mode (Moon)"
                className={`p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                  theme === "cosmic-dark"
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2 glass-pill px-3 py-1 rounded-xl">
              <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-800 border border-white/20 flex items-center justify-center shrink-0">
                {currentUser?.profilePhoto ? (
                  <img src={currentUser.profilePhoto} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-[10px]">{currentUser?.avatarEmoji || "🦊"}</span>
                )}
              </div>
              <span className="text-[10.5px] font-bold text-slate-200 font-mono">
                Candidate: {currentUser.name}
              </span>
            </div>
          </div>
        </header>

        {/* Workspace body */}
        <main className="flex-1 flex flex-col p-6 max-w-7xl w-full mx-auto space-y-6">
          
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
              onOpenApplyModal={() => {}} 
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
              onSaveStarStory={handleSaveStarStory} 
              onDeleteStarStory={handleDeleteStarStory} 
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
              onUpdateUser={handleUpdateCurrentUser}
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

          {/* Copyright Footer */}
          {activeTab === "profile" && (
            <footer id="recruiter-footer" className="mt-auto pt-6 pb-2 border-t border-[#1F2937]/40 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-mono tracking-wide gap-2">
              <span>&copy; {new Date().getFullYear()} Recruiter AI Pro. All rights reserved.</span>
              <div className="flex gap-3 text-[10px] text-slate-600">
                <span>Security Shield Active</span>
                <span>•</span>
                <span>v2.5 Production</span>
              </div>
            </footer>
          )}

        </main>
      </div>

      {/* Mobile bottom navigation bar */}
      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={handleSetTab} 
        currentUser={currentUser}
      />
    </div>
  );
}
