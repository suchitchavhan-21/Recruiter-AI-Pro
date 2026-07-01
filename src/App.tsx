import React, { useState, useEffect, useRef } from "react";
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
  Users
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Phase, 
  Question, 
  JDAnalysis, 
  QAHistory, 
  FeedbackReport, 
  CoachingData,
  InterviewerPersona,
  SavedSTARStory,
  InterviewSession,
  JobApplication,
  UserProfile,
  UserActivity
} from "./types";
import { COMPANY_PRESETS } from "./data/companyRoles";
import AdminMonitor from "./components/AdminMonitor";

const DEFAULT_APPLICATIONS: JobApplication[] = [
  {
    id: "app-seed-1",
    timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    companyId: "google",
    companyName: "Google",
    roleTitle: "Software Engineer (AI & LLM Infrastructure)",
    roleCategory: "Engineering",
    applicantName: "Suchit Chavhan",
    applicantEmail: "suchitchavhan889@gmail.com",
    appliedSlot: "Fast-Track Referral Slot (Priority A)",
    coverLetter: "Highly motivated infrastructure engineer with core experience in high-performance computing, JAX optimization, and low-latency pipeline engineering. Ready to tackle scale issues.",
    status: "Interview Scheduled",
    screeningFeedback: "Recruiter Feedback: Profile matches core ML training specs. Technical screen scheduled with ML Platform Leads. Prepared behavioral examples were highly relevant.",
    matchScore: 96
  },
  {
    id: "app-seed-2",
    timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    companyId: "stripe",
    companyName: "Stripe",
    roleTitle: "Infrastructure Security Engineer",
    roleCategory: "Security",
    applicantName: "Suchit Chavhan",
    applicantEmail: "suchitchavhan889@gmail.com",
    appliedSlot: "Standard Direct Application Slot",
    coverLetter: "Focused on zero-trust architectures, TLS protocol layers, and hardware security modules (HSMs). Practice metrics show strong preparedness.",
    status: "Screening",
    screeningFeedback: "ATS Match: 88%. Security-focused background is a great fit for double-entry API security checks. Currently routing profile to hiring team manager.",
    matchScore: 88
  }
];

export default function App() {
  // Navigation / Phase States
  const [phase, setPhase] = useState<Phase>("PHASE1_INPUT");
  
  // Job Input States
  const [jdText, setJdText] = useState("");
  const [company, setCompany] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Recruiter Directory Filter States
  const [selectedDirectoryCompany, setSelectedDirectoryCompany] = useState<string>("all");
  const [directorySearchQuery, setDirectorySearchQuery] = useState<string>("");
  
  // Persisted History, Persona & Answer Bank States
  const [sessionsHistory, setSessionsHistory] = useState<InterviewSession[]>([]);
  const [savedStarStories, setSavedStarStories] = useState<SavedSTARStory[]>([]);
  const [interviewerPersona, setInterviewerPersona] = useState<InterviewerPersona>("mentor");
  const [currentFillerCount, setCurrentFillerCount] = useState(0);

  // Profile & Activity Tracker states
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");

  // Form registration states
  const [newProfileName, setNewProfileName] = useState("Suchit Chavhan");
  const [newProfileEmail, setNewProfileEmail] = useState("suchitchavhan889@gmail.com");
  const [newProfileRole, setNewProfileRole] = useState("Systems Architect & Tech Lead");
  const [newProfileEmoji, setNewProfileEmoji] = useState("⚡");

  // Job Application States
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isApplyingModalOpen, setIsApplyingModalOpen] = useState(false);
  const [applyingCompany, setApplyingCompany] = useState<{ id: string; name: string; logoColor: string; industry: string } | null>(null);
  const [applyingRole, setApplyingRole] = useState<{ title: string; category: "Engineering" | "Product" | "Security" | "Systems" | "Design"; text: string } | null>(null);
  const [appCandidateName, setAppCandidateName] = useState("Suchit Chavhan");
  const [appCandidateEmail, setAppCandidateEmail] = useState("suchitchavhan889@gmail.com");
  const [appSelectedSlot, setAppSelectedSlot] = useState("");
  const [appSelectedStoryId, setAppSelectedStoryId] = useState("custom");
  const [appCoverLetter, setAppCoverLetter] = useState("");
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);

  // Sync with backend API
  const fetchUsersAndActivities = async () => {
    try {
      const resUsers = await fetch("/api/users");
      if (resUsers.ok) {
        const uData: UserProfile[] = await resUsers.json();
        setAllUsers(uData);
        
        // Match default active user from local storage or use pre-seeded Suchit Chavhan
        const storedEmail = localStorage.getItem("recruiter_active_user_email") || "suchitchavhan889@gmail.com";
        const found = uData.find(u => u.email.toLowerCase() === storedEmail.toLowerCase());
        if (found) {
          setCurrentUser(found);
          setAppCandidateName(found.name);
          setAppCandidateEmail(found.email);
        } else if (uData.length > 0) {
          setCurrentUser(uData[0]);
          setAppCandidateName(uData[0].name);
          setAppCandidateEmail(uData[0].email);
        }
      }
      
      const resActivities = await fetch("/api/activities");
      if (resActivities.ok) {
        const aData = await resActivities.json();
        setActivities(aData);
      }
    } catch (e) {
      console.error("Backend fetch error: ", e);
    }
  };

  // Helper to log live activities to the server
  const logUserActivity = async (userId: string, type: string, details: string, metadata?: any) => {
    try {
      await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, type, details, metadata })
      });
      // reload logs
      const resActivities = await fetch("/api/activities");
      if (resActivities.ok) {
        const aData = await resActivities.json();
        setActivities(aData);
      }
    } catch (e) {
      console.error("Activity logging failed on server: ", e);
    }
  };

  // Register or edit a custom User profile on the backend
  const handleRegisterProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim() || !newProfileEmail.trim()) {
      showNotification("Please provide both name and email.", "error");
      return;
    }
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProfileName,
          email: newProfileEmail,
          roleTitle: newProfileRole || "Candidate",
          avatarEmoji: newProfileEmoji
        })
      });
      if (res.ok) {
        const updatedUser: UserProfile = await res.json();
        setCurrentUser(updatedUser);
        setAppCandidateName(updatedUser.name);
        setAppCandidateEmail(updatedUser.email);
        localStorage.setItem("recruiter_active_user_email", updatedUser.email);
        setIsProfileModalOpen(false);
        showNotification(`Welcome, ${updatedUser.name}! Profile set up successfully.`, "success");
        fetchUsersAndActivities();
      }
    } catch (e) {
      console.error(e);
      showNotification("Failed to register profile on server.", "error");
    }
  };

  // Switch between existing registered user profiles
  const handleSwitchUser = (user: UserProfile) => {
    setCurrentUser(user);
    setAppCandidateName(user.name);
    setAppCandidateEmail(user.email);
    localStorage.setItem("recruiter_active_user_email", user.email);
    showNotification(`Switched profile to ${user.name}!`, "info");
    
    // Log switch activity
    logUserActivity(
      user.id, 
      "profile_created", 
      `Switched workspace session to ${user.name} (${user.roleTitle}).`
    );
  };

  // Delete a candidate profile on the backend
  const handleDeleteUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        showNotification("Candidate profile permanently deleted.", "success");
        
        // If the admin deleted the active user, switch active session to any remaining candidate or guest
        const remainingUsers = allUsers.filter(u => u.id !== userId);
        if (currentUser?.id === userId) {
          if (remainingUsers.length > 0) {
            setCurrentUser(remainingUsers[0]);
            setAppCandidateName(remainingUsers[0].name);
            setAppCandidateEmail(remainingUsers[0].email);
            localStorage.setItem("recruiter_active_user_email", remainingUsers[0].email);
          } else {
            setCurrentUser(null);
            setAppCandidateName("Guest Candidate");
            setAppCandidateEmail("guest@example.com");
            localStorage.removeItem("recruiter_active_user_email");
          }
        }
        
        // Sync list and ledger
        await fetchUsersAndActivities();
      } else {
        const errorData = await res.json();
        showNotification(errorData.error || "Could not delete user profile.", "error");
      }
    } catch (e) {
      console.error("Delete user profile error:", e);
      showNotification("Error communicating with server to delete candidate profile.", "error");
    }
  };

  // Load persistent states on mount
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem("recruiter_ai_sessions");
      if (storedHistory) {
        setSessionsHistory(JSON.parse(storedHistory));
      }
      const storedStories = localStorage.getItem("recruiter_ai_saved_stories");
      if (storedStories) {
        setSavedStarStories(JSON.parse(storedStories));
      }
      const storedApps = localStorage.getItem("recruiter_ai_applications");
      if (storedApps) {
        setApplications(JSON.parse(storedApps));
      } else {
        setApplications(DEFAULT_APPLICATIONS);
      }
    } catch (e) {
      console.error("Failed to load persistent states:", e);
      setApplications(DEFAULT_APPLICATIONS);
    }
    
    // Fetch live users and activities from our custom server
    fetchUsersAndActivities();
  }, []);

  const saveSessionsHistory = (newHistory: InterviewSession[]) => {
    setSessionsHistory(newHistory);
    try {
      localStorage.setItem("recruiter_ai_sessions", JSON.stringify(newHistory));
    } catch (e) {
      console.error("Failed to persist session history:", e);
    }
  };

  const saveStarStories = (newStories: SavedSTARStory[]) => {
    setSavedStarStories(newStories);
    try {
      localStorage.setItem("recruiter_ai_saved_stories", JSON.stringify(newStories));
    } catch (e) {
      console.error("Failed to persist STAR stories:", e);
    }
  };

  const saveApplications = (newApps: JobApplication[]) => {
    setApplications(newApps);
    try {
      localStorage.setItem("recruiter_ai_applications", JSON.stringify(newApps));
    } catch (e) {
      console.error("Failed to persist job applications:", e);
    }
  };

  // Analysis results
  const [analysis, setAnalysis] = useState<JDAnalysis | null>(null);

  // Active interview progress
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QAHistory[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [interviewDuration, setInterviewDuration] = useState(0);
  const [timerIntervalId, setTimerIntervalId] = useState<NodeJS.Timeout | null>(null);

  // Voice States
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [micUnavailable, setMicUnavailable] = useState(false);
  const [speechTarget, _setSpeechTarget] = useState<"interview" | "coaching">("interview");
  const speechTargetRef = useRef<"interview" | "coaching">("interview");

  const setSpeechTarget = (val: "interview" | "coaching") => {
    _setSpeechTarget(val);
    speechTargetRef.current = val;
  };

  // Evaluation & Coaching
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<FeedbackReport | null>(null);
  const [isCoachingLoading, setIsCoachingLoading] = useState(false);
  const [coachingData, setCoachingData] = useState<CoachingData | null>(null);
  const [selectedCoachingQuestion, setSelectedCoachingQuestion] = useState<string>("");
  const [coachingInput, setCoachingInput] = useState("");
  const [coachingMode, setCoachingMode] = useState<"practice" | "tips">("tips");
  const [coachingSuccess, setCoachingSuccess] = useState(false);

  // STAR Worksheet Story Builder States
  const [starSituation, setStarSituation] = useState("");
  const [starTask, setStarTask] = useState("");
  const [starAction, setStarAction] = useState("");
  const [starResult, setStarResult] = useState("");
  const [isEvaluatingStar, setIsEvaluatingStar] = useState(false);
  const [starEvaluation, setStarEvaluation] = useState<{
    overallRating: string;
    critiqueSituation: string;
    critiqueTask: string;
    critiqueAction: string;
    critiqueResult: string;
    expertModelStory: string;
  } | null>(null);

  const [resourceActiveTab, setResourceActiveTab] = useState<"star_builder" | "roadmap" | "cheatsheets" | "answer_bank">("star_builder");

  // General Notification Banner
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Sound Wave and Sentiment Mock variables
  const [sentimentConfidence, setSentimentConfidence] = useState<"High" | "Medium" | "Developing">("High");
  const [bars, setBars] = useState<number[]>([40, 60, 85, 55, 30, 45, 75, 50, 90, 65, 35, 50, 70, 45, 60]);

  // Voice Customization States for Natural / Soft Human Modulation
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>("");
  const [voiceRate, setVoiceRate] = useState<number>(0.93); // slightly slower is soft and natural, avoids robot speed
  const [voicePitch, setVoicePitch] = useState<number>(0.98); // slightly lower/warmer is less metallic
  const [showVoiceSettings, setShowVoiceSettings] = useState<boolean>(false);

  // Fetch and update Speech Synthesis Voices reactively
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const updateVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        // Focus on English-speaking human models
        const englishVoices = availableVoices.filter(v => v.lang.startsWith("en"));
        setVoices(englishVoices);

        if (englishVoices.length > 0) {
          // Look for premium natural/Google or Microsoft soft voices
          const softDefault = englishVoices.find(v => 
            v.name.includes("Natural") || 
            v.name.includes("Google US English") || 
            v.name.includes("Aria") || 
            v.name.includes("Sonia") || 
            v.name.includes("Samantha") ||
            v.name.includes("Zira")
          );
          if (softDefault) {
            setSelectedVoiceName(softDefault.name);
          } else {
            // Find any Google voice or default to first
            const googleDefault = englishVoices.find(v => v.name.includes("Google"));
            setSelectedVoiceName(googleDefault ? googleDefault.name : englishVoices[0].name);
          }
        }
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  // Handle Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = false;
        rec.lang = "en-US";
        
        rec.onstart = () => {
          setIsListening(true);
        };

        rec.onresult = (event: any) => {
          let resultText = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            resultText += event.results[i][0].transcript + " ";
          }
          
          if (resultText.trim()) {
            const cleanText = resultText.trim();
            if (speechTargetRef.current === "coaching") {
              setCoachingInput(prev => {
                const separator = prev.trim() ? " " : "";
                return prev + separator + cleanText;
              });
            } else {
              setCurrentAnswer(prev => {
                const separator = prev.trim() ? " " : "";
                return prev + separator + cleanText;
              });
            }
            showNotification("Speech captured successfully!", "success");
          }
        };

        rec.onerror = (event: any) => {
          console.error("Speech Recognition Error", event);
          if (event.error === "not-allowed") {
            setMicUnavailable(true);
            showNotification("Microphone permission denied. Please allow mic access or type your response.", "error");
          } else {
            showNotification(`Speech recognition issue: ${event.error}`, "info");
          }
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        setRecognition(rec);
      } catch (e) {
        console.error("Failed to initialize speech recognition", e);
        setMicUnavailable(true);
      }
    } else {
      setMicUnavailable(true);
    }
  }, []);

  // Update mock active sentiment voice waves during recording/interview
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === "PHASE2_INTERVIEW") {
      interval = setInterval(() => {
        // Randomize bar heights a bit to simulate live audio or user activity
        setBars(prev => prev.map(b => Math.max(15, Math.min(100, b + (Math.random() * 30 - 15)))));
        
        // Randomize mock confidence levels occasionally
        const confidences: ("High" | "Medium" | "Developing")[] = ["High", "Medium", "Developing"];
        if (Math.random() > 0.85) {
          setSentimentConfidence(confidences[Math.floor(Math.random() * confidences.length)]);
        }
      }, 350);
    }
    return () => clearInterval(interval);
  }, [phase]);

  // Audit filler words in current answer dynamically
  useEffect(() => {
    const fillerRegex = /\b(um|uh|like|so|actually|basically|you\s+know)\b/gi;
    const matches = currentAnswer.match(fillerRegex);
    setCurrentFillerCount(matches ? matches.length : 0);
  }, [currentAnswer]);

  // Format Timer Duration
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Notification Toast Helper
  const showNotification = (message: string, type: "success" | "error" | "info") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Clipboard copy helper
  const handleCopyToClipboard = (text: string) => {
    try {
      navigator.clipboard.writeText(text);
      showNotification("Copied to clipboard! 📋", "success");
    } catch (err) {
      console.error("Failed to copy", err);
      showNotification("Could not copy automatically. Please select and copy.", "error");
    }
  };

  // Text-To-Speech function
  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      if (voiceEnabled) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = voiceRate;
        utterance.pitch = voicePitch;
        
        if (selectedVoiceName) {
          const matchedVoice = voices.find(v => v.name === selectedVoiceName);
          if (matchedVoice) {
            utterance.voice = matchedVoice;
          }
        } else {
          // Try to obtain a standard high-quality English voice
          const rawVoices = window.speechSynthesis.getVoices();
          const selectedVoice = rawVoices.find(
            v => v.lang.startsWith("en") && 
            (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Microsoft"))
          );
          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }
        }
        
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // Helper to demo/test voice settings
  const handleTestVoiceTone = () => {
    speakText("Hello there! This is my newly modulated soft, human-like voice. I hope this tone feels warm and conversational.");
    showNotification("Demo phrase spoken with customized voice modulation!", "success");
  };

  // Cancel any active Speech synthesis on voice toggle or phase changes
  useEffect(() => {
    if (!voiceEnabled && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [voiceEnabled]);

  // Start Speech Recognition
  const toggleListening = (target: "interview" | "coaching" | any = "interview") => {
    const cleanTarget = (typeof target === "string" && (target === "interview" || target === "coaching")) ? target : "interview";
    if (micUnavailable || !recognition) {
      showNotification("Speech-to-text is not available or mic permission is not granted.", "error");
      return;
    }
    setSpeechTarget(cleanTarget);
    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.error("Error starting speech recognition", err);
      }
    }
  };

  // Open Application Modal helper
  const openApplicationModal = (comp: { id: string; name: string; logoColor: string; industry: string }, role: { title: string; category: "Engineering" | "Product" | "Security" | "Systems" | "Design"; text: string }) => {
    setApplyingCompany(comp);
    setApplyingRole(role);
    setAppSelectedSlot("");
    setAppSelectedStoryId("custom");
    setAppCoverLetter("");
    setIsApplyingModalOpen(true);
  };

  // Submit Job Application helper
  const handleApplyForJobSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appCandidateName.trim() || !appCandidateEmail.trim() || !appSelectedSlot) {
      showNotification("Please fill in candidate details and select an available slot.", "error");
      return;
    }
    
    setIsSubmittingApp(true);
    
    setTimeout(() => {
      // Analyze selected story if any
      const selectedStory = savedStarStories.find(s => s.id === appSelectedStoryId);
      
      let score = 70;
      let feedback = "Awaiting manual review.";
      
      if (selectedStory) {
        // High score if a story is attached!
        score = Math.floor(Math.random() * 10) + 88; // 88% - 98%
        feedback = `ATS Score: ${score}% Match. Excellent! Your attached STAR behavioral scenario (${selectedStory.role} at ${selectedStory.company}) demonstrates strong, measurable impact. Our recruiting team has automated a fast-track invitation. Recruiter call scheduling link is active in your inbox.`;
      } else {
        // Average score
        score = Math.floor(Math.random() * 15) + 70; // 70% - 85%
        feedback = `ATS Score: ${score}% Match. Your contact details are filed. Attach a practiced behavioral STAR story from your Answer Bank to automatically fast-track your review to 90%+ and schedule a coordinator chat.`;
      }
      
      const newApp: JobApplication = {
        id: "app-" + Date.now(),
        timestamp: new Date().toISOString(),
        companyId: applyingCompany?.id || "custom",
        companyName: applyingCompany?.name || "Direct Partner",
        roleTitle: applyingRole?.title || "Staff Position",
        roleCategory: applyingRole?.category || "Engineering",
        applicantName: appCandidateName,
        applicantEmail: appCandidateEmail,
        selectedStoryId: appSelectedStoryId !== "custom" ? appSelectedStoryId : undefined,
        coverLetter: appCoverLetter,
        status: score >= 88 ? "Interview Scheduled" : "Screening",
        appliedSlot: appSelectedSlot,
        screeningFeedback: feedback,
        matchScore: score
      };
      
      const updated = [newApp, ...applications];
      saveApplications(updated);
      setIsSubmittingApp(false);
      setIsApplyingModalOpen(false);
      
      showNotification(`Successfully applied for ${applyingRole?.title} at ${applyingCompany?.name}!`, "success");

      // Log live activity
      logUserActivity(
        currentUser?.id || "guest", 
        "job_applied", 
        `Applied for ${applyingRole?.title} at ${applyingCompany?.name} (${appSelectedSlot}). Match Score: ${score}%.`, 
        { company: applyingCompany?.name, role: applyingRole?.title }
      );
    }, 1200);
  };

  // Trigger JD analysis (Phase 1 to Phase 1 Summary)
  const handleAnalyzeJD = async (selectedJdText: string, selectedCompany: string) => {
    setIsAnalyzing(true);
    setJdText(selectedJdText);
    setCompany(selectedCompany);
    try {
      const response = await fetch("/api/analyze-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          jd: selectedJdText, 
          companyName: selectedCompany,
          persona: interviewerPersona
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Analysis failed");
      }

      const data: JDAnalysis = await response.json();
      setAnalysis(data);
      setPhase("PHASE1_SUMMARY");
      showNotification("Job Description parsed successfully with dynamic live-search grounding!", "success");
      
      // Warm welcome speaking context
      const companyPhrase = selectedCompany ? `at ${selectedCompany}` : "for your desired role";
      speakText(`Analysis complete. I have formulated a specialized 5-question interview plan ${companyPhrase} with ${data.difficulty} level difficulty. Are you ready to begin?`);

    } catch (error: any) {
      console.error(error);
      showNotification(error.message || "Could not analyze the JD. Please check your network or try again.", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Trigger actual interview start (Phase 1 Summary to Phase 2 Live)
  const handleStartInterview = () => {
    if (!analysis || !analysis.questions || analysis.questions.length === 0) return;
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setCurrentAnswer("");
    setInterviewDuration(0);
    setPhase("PHASE2_INTERVIEW");

    // Start Timer
    const interval = setInterval(() => {
      setInterviewDuration(prev => prev + 1);
    }, 1000);
    setTimerIntervalId(interval);

    // Speak first question
    const firstQuestion = analysis.questions[0];
    setTimeout(() => {
      speakText(`Let's start the interview. Question 1, a ${firstQuestion.type} question: ${firstQuestion.text}`);
    }, 400);

    // Log live activity
    logUserActivity(
      currentUser?.id || "guest", 
      "interview_started", 
      `Started dynamic interview simulation for ${company || "General Industry Standard"} role.`
    );
  };

  // Move to next question or complete interview (Phase 2 to Phase 3)
  const handleNextQuestion = () => {
    if (!analysis) return;
    
    const isLast = currentQuestionIndex === analysis.questions.length - 1;
    const currentQ = analysis.questions[currentQuestionIndex];
    
    // Store current answer
    const newAnswerItem: QAHistory = {
      questionId: currentQ.id,
      questionText: currentQ.text,
      type: currentQ.type,
      answerText: currentAnswer.trim() || "[Candidate left response empty]"
    };

    const updatedAnswers = [...answers, newAnswerItem];
    setAnswers(updatedAnswers);
    setCurrentAnswer("");

    if (isListening) {
      try { recognition.stop(); } catch(e){}
    }

    if (isLast) {
      // End interview & trigger Phase 3
      if (timerIntervalId) clearInterval(timerIntervalId);
      setTimerIntervalId(null);
      setPhase("PHASE3_FEEDBACK");
      handleEvaluateInterview(updatedAnswers);
    } else {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      const nextQ = analysis.questions[nextIndex];
      
      // Neutral brief recruiter acknowledgments
      const acknowledgments = [
        "Acknowledged. Let's move to the next topic.",
        "Got it. Thank you for that response.",
        "Understood. Moving forward.",
        "Thanks for explaining. Let's look at the next prompt."
      ];
      const randomAck = acknowledgments[Math.floor(Math.random() * acknowledgments.length)];
      
      speakText(`${randomAck} Question ${nextIndex + 1}, a ${nextQ.type} question: ${nextQ.text}`);
    }
  };

  // Get full Evaluation (Phase 3)
  const handleEvaluateInterview = async (finalAnswers: QAHistory[]) => {
    setIsEvaluating(true);
    try {
      const response = await fetch("/api/evaluate-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jd: jdText,
          companyName: company,
          qaList: finalAnswers,
          persona: interviewerPersona
        })
      });

      if (!response.ok) {
        throw new Error("Evaluation request failed.");
      }

      const data: FeedbackReport = await response.json();
      setEvaluation(data);
      
      // Calculate score based on evaluation verdict
      let score = 75;
      const ratingLower = data.overallRating.toLowerCase();
      if (ratingLower.includes("strong")) score = 95;
      else if (ratingLower.includes("lean")) score = 74;
      else if (ratingLower.includes("no")) score = 48;

      // Extract a smart role title from JD
      const jdFirstLine = jdText.split("\n")[0] || "Target Professional Role";
      const cleanedRole = jdFirstLine.trim().replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "");
      const shortRole = cleanedRole.length > 35 ? cleanedRole.substring(0, 32) + "..." : cleanedRole || "Custom Engineering Role";

      const newSession: InterviewSession = {
        id: "session_" + Date.now(),
        timestamp: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }),
        role: shortRole,
        company: company || "General Industry Standard",
        persona: interviewerPersona,
        analysis: analysis!,
        answers: finalAnswers,
        evaluation: data,
        score: score
      };

      const updatedHistory = [newSession, ...sessionsHistory];
      saveSessionsHistory(updatedHistory);

      // Log live activity
      logUserActivity(
        currentUser?.id || "guest", 
        "interview_evaluated", 
        `Completed interview simulation for ${company || "General Industry Standard"}. Performance Grade: ${data.overallRating} (${score}% Proficiency).`, 
        { score, rating: data.overallRating }
      );

      // Speak evaluation verdict
      speakText(`The interview is complete. Your overall assessment is: ${data.overallRating}. Let's review your report.`);

    } catch (error: any) {
      console.error(error);
      showNotification("Could not generate a feedback report. Showing fallback evaluation options.", "error");
    } finally {
      setIsEvaluating(false);
    }
  };

  // Restore a past session from history dashboard
  const handleLoadSession = (session: InterviewSession) => {
    setCompany(session.company);
    setAnalysis(session.analysis);
    setAnswers(session.answers);
    setEvaluation(session.evaluation);
    setInterviewerPersona(session.persona);
    setPhase("PHASE3_FEEDBACK");
    showNotification(`Restored past interview session for ${session.role}!`, "success");
    speakText(`Restored past session report for ${session.role}.`);
  };

  // Remove a past session from history
  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent triggering load
    const updated = sessionsHistory.filter(s => s.id !== id);
    saveSessionsHistory(updated);
    showNotification("Interview session removed from history.", "info");
  };

  // Save Gemini polished STAR story to Answer Bank
  const handleSaveSTARStory = (storyText: string) => {
    if (!storyText.trim()) return;
    
    // Extract a neat role title
    const jdFirstLine = jdText.split("\n")[0] || "Target Professional Role";
    const cleanedRole = jdFirstLine.trim().replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "");
    const shortRole = cleanedRole.length > 30 ? cleanedRole.substring(0, 27) + "..." : cleanedRole || "Engineering Role";

    const newStory: SavedSTARStory = {
      id: "story_" + Date.now(),
      timestamp: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      }),
      role: shortRole,
      company: company || "General Industry",
      situation: starSituation,
      task: starTask,
      action: starAction,
      result: starResult,
      expertStory: storyText
    };

    const updated = [newStory, ...savedStarStories];
    saveStarStories(updated);
    showNotification("🏆 Polished STAR story saved to your Answer Bank!", "success");

    // Log live activity
    logUserActivity(
      currentUser?.id || "guest", 
      "star_story_saved", 
      `Saved polished high-impact STAR story for ${shortRole} at ${company || "General Industry Standard"} to Answer Bank.`
    );
  };

  // Delete a saved STAR story from Answer Bank
  const handleDeleteSTARStory = (id: string) => {
    const updated = savedStarStories.filter(s => s.id !== id);
    saveStarStories(updated);
    showNotification("STAR story removed from Answer Bank.", "info");
  };

  // Transition to Coaching (Phase 4)
  const handleGoToCoaching = (defaultQuestionText: string = "") => {
    setPhase("PHASE4_COACHING");
    setCoachingData(null);
    setCoachingInput("");
    setCoachingSuccess(false);
    
    if (defaultQuestionText) {
      setSelectedCoachingQuestion(defaultQuestionText);
      setCoachingMode("practice");
    } else if (analysis?.questions?.length) {
      setSelectedCoachingQuestion(analysis.questions[0].text);
      setCoachingMode("practice");
    } else {
      setCoachingMode("tips");
    }
  };

  // Submit coaching sandboxed retry or tip request
  const handleSubmitCoaching = async () => {
    if (!coachingInput.trim()) return;
    setIsCoachingLoading(true);
    setCoachingSuccess(false);
    
    // Find previous response if practicing
    let previousAnswer = "";
    if (coachingMode === "practice") {
      const matchedQA = answers.find(a => a.questionText === selectedCoachingQuestion);
      if (matchedQA) previousAnswer = matchedQA.answerText;
    }

    try {
      const response = await fetch("/api/coaching-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: coachingMode,
          jd: jdText,
          companyName: company,
          questionText: coachingMode === "practice" ? selectedCoachingQuestion : undefined,
          userInput: coachingInput,
          previousAnswer: previousAnswer || undefined
        })
      });

      if (!response.ok) throw new Error("Coaching assistance failed");
      const data: CoachingData = await response.json();
      setCoachingData(data);
      setCoachingSuccess(true);
      showNotification("Coaching guidelines generated successfully!", "success");
      speakText(`Review complete. I have compiled feedback on this response and formulated a highly polished model recommendation.`);
    } catch (e: any) {
      console.error(e);
      showNotification("Failed to fetch custom coaching response.", "error");
    } finally {
      setIsCoachingLoading(false);
    }
  };

  // Restart Interview Completely
  const handleReset = () => {
    if (timerIntervalId) clearInterval(timerIntervalId);
    setTimerIntervalId(null);
    setPhase("PHASE1_INPUT");
    setAnalysis(null);
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setCurrentAnswer("");
    setEvaluation(null);
    setCoachingData(null);
    setSelectedCoachingQuestion("");
    setCoachingInput("");
    setStarSituation("");
    setStarTask("");
    setStarAction("");
    setStarResult("");
    setStarEvaluation(null);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Submit and evaluate STAR behavioral story draft
  const handleEvaluateSTAR = async () => {
    if (!starSituation.trim() && !starTask.trim() && !starAction.trim() && !starResult.trim()) {
      showNotification("Please fill out some parts of the STAR worksheet first.", "info");
      return;
    }
    
    setIsEvaluatingStar(true);
    try {
      const response = await fetch("/api/evaluate-star", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          situation: starSituation,
          task: starTask,
          action: starAction,
          result: starResult,
          jd: jdText,
          companyName: company
        })
      });

      if (!response.ok) throw new Error("STAR evaluation failed");
      const data = await response.json();
      setStarEvaluation(data);
      showNotification("STAR story evaluated successfully!", "success");
      speakText(`Evaluation complete. Your story quality is rated as: ${data.overallRating}. Let's examine the critique below.`);
    } catch (e) {
      console.error(e);
      showNotification("Could not evaluate STAR story. Try again.", "error");
    } finally {
      setIsEvaluatingStar(false);
    }
  };

  // Retake the interview with the same set of questions to improve score
  const handleRetakeSameQuestions = () => {
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setCurrentAnswer("");
    setInterviewDuration(0);
    setPhase("PHASE2_INTERVIEW");
    
    // Stop any active narration
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    
    // Start Timer
    if (timerIntervalId) clearInterval(timerIntervalId);
    const interval = setInterval(() => {
      setInterviewDuration(prev => prev + 1);
    }, 1000);
    setTimerIntervalId(interval);

    // Speak first question
    const firstQuestion = analysis?.questions?.[0];
    if (firstQuestion) {
      setTimeout(() => {
        speakText(`Starting your retake session. Let's focus on improvement. Question 1: ${firstQuestion.text}`);
      }, 400);
    }
    showNotification("Retake started! Answer the questions again with your refined knowledge.", "success");
  };

  // Generate a brand new set of 5 questions for the same role and JD
  const handleRegenerateNewQuestions = async () => {
    if (!jdText.trim()) {
      showNotification("Please specify a job description first.", "error");
      return;
    }
    setIsAnalyzing(true);
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setCurrentAnswer("");
    setEvaluation(null);
    setCoachingData(null);
    setSelectedCoachingQuestion("");
    setCoachingInput("");
    
    if (timerIntervalId) clearInterval(timerIntervalId);
    setTimerIntervalId(null);
    
    try {
      const response = await fetch("/api/analyze-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd: jdText, companyName: company })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Analysis failed");
      }

      const data: JDAnalysis = await response.json();
      setAnalysis(data);
      setPhase("PHASE1_SUMMARY");
      showNotification("Successfully generated a completely new set of job-ready practice questions!", "success");
      
      const companyPhrase = company ? `at ${company}` : "for your target role";
      speakText(`I have created a brand-new set of 5 customized practice questions ${companyPhrase}. Let me know when you are ready to begin.`);
    } catch (error: any) {
      console.error(error);
      showNotification(error.message || "Could not generate new questions.", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Sample Templates
  const SAMPLE_TEMPLATES = [
    {
      title: "Senior Full Stack Dev",
      company: "Netflix",
      text: `We are looking for a Senior Full Stack Engineer specializing in React, Node.js, and scale infrastructure.
Requirements:
- Strong experience in rendering optimization and real-time streams.
- Relational database scaling and performance tuning.
- High standards of security, system resilience, and clean, modular architectures.`
    },
    {
      title: "Solutions Architect",
      company: "AWS",
      text: `Amazon Web Services is seeking a Solutions Architect to design resilient cloud architectures.
Requirements:
- Deep expertise in AWS Cloud services, microservices design, and network topologies.
- Experience mapping operational, compliance, and budget requirements to secure technical frameworks.
- Articulate speaker capable of leading workshops for C-level executives.`
    },
    {
      title: "SRE / Infrastructure Specialist",
      company: "Cloudflare",
      text: `Cloudflare is looking for an Infrastructure Specialist to join our Edge Networks division.
Requirements:
- Advanced knowledge of Linux systems engineering, eBPF, TCP/IP, and high-performance routing protocols.
- Experience deploying automated zero-trust security postures and global high-availability pipelines.`
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 flex items-center space-x-3 rounded-xl px-4 py-3 shadow-2xl border ${
              notification.type === "success" 
                ? "bg-slate-900 border-emerald-500/30 text-emerald-300" 
                : notification.type === "error" 
                ? "bg-slate-900 border-rose-500/30 text-rose-300" 
                : "bg-slate-900 border-indigo-500/30 text-indigo-300"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : notification.type === "error" ? (
              <AlertCircle className="h-5 w-5 text-rose-400" />
            ) : (
              <Info className="h-5 w-5 text-indigo-400" />
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header (Bento Styled Header) */}
      <header className="border-b border-slate-900 bg-slate-950 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-widest text-slate-400 uppercase font-display">Recruiter AI</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 uppercase tracking-widest">PRO</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white font-display">Expert Interview Coach</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Candidate Profile Widget */}
          <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-850 px-3 py-1.5 rounded-full shadow-sm hover:border-slate-700 transition-all">
            <button
              id="active-user-profile-btn"
              onClick={() => {
                setNewProfileName(currentUser?.name || "Suchit Chavhan");
                setNewProfileEmail(currentUser?.email || "suchitchavhan889@gmail.com");
                setNewProfileRole(currentUser?.roleTitle || "Systems Architect & Tech Lead");
                setNewProfileEmoji(currentUser?.avatarEmoji || "⚡");
                setIsProfileModalOpen(true);
              }}
              className="flex items-center gap-2 cursor-pointer text-left focus:outline-none"
              title="Click to register or switch profiles"
            >
              <div className="w-5.5 h-5.5 rounded-full bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30 text-xs">
                {currentUser?.avatarEmoji || "⚡"}
              </div>
              <div className="hidden md:block">
                <div className="text-[10px] font-bold text-white leading-tight truncate max-w-[120px]">{currentUser?.name || "Guest Candidate"}</div>
                <div className="text-[8px] text-slate-400 truncate max-w-[120px] font-mono leading-none">{currentUser?.roleTitle || "Systems Professional"}</div>
              </div>
            </button>
          </div>

          {/* Admin Monitor Toggle */}
          {(currentUser?.email.toLowerCase() === "suchitchavhan889@gmail.com" || isAdminMode) && (
            <button
              id="admin-monitor-toggle-btn"
              onClick={() => {
                if (isAdminMode) {
                  setIsAdminMode(false);
                  showNotification("Returned to Candidate Practice Workspace.", "success");
                } else {
                  // Verify if the active user profile is the pre-authorized master administrator
                  if (currentUser?.email.toLowerCase() === "suchitchavhan889@gmail.com") {
                    setIsAdminMode(true);
                    showNotification("Switched to Admin System Monitor Portal! Viewing active candidate logs.", "success");
                  } else {
                    setPasscodeInput("");
                    setIsPasscodeModalOpen(true);
                  }
                }
              }}
              className={`px-3 py-1.5 rounded-full border text-[11px] font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer focus:outline-none ${
                isAdminMode 
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25" 
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300 hover:bg-slate-850"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Admin Portal</span>
              {isAdminMode && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>
          )}

          {/* Active Phase Badge */}
          <div className="bg-slate-900 border border-slate-850 rounded-full px-4 py-1.5 flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-300 font-mono">
              {isAdminMode ? "Admin Monitoring System" : (
                <>
                  {phase === "PHASE1_INPUT" && "Phase 1: Configure Role"}
                  {phase === "PHASE1_SUMMARY" && "Phase 1: Industry Research"}
                  {phase === "PHASE2_INTERVIEW" && "Phase 2: Live Interview"}
                  {phase === "PHASE3_FEEDBACK" && "Phase 3: Assessment"}
                  {phase === "PHASE4_COACHING" && "Phase 4: Coaching Engine"}
                </>
              )}
            </span>
          </div>

          {/* Master Reset Button */}
          {phase !== "PHASE1_INPUT" && (
            <button 
              id="master-reset-btn"
              onClick={handleReset}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-full border border-slate-800 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
              <span>Reset</span>
            </button>
          )}

          {/* Voice Assistant Toggle */}
          <button
            id="voice-toggle-btn"
            onClick={() => {
              setVoiceEnabled(!voiceEnabled);
              showNotification(`Voice feedback is now ${!voiceEnabled ? "ENABLED" : "DISABLED"}`, "info");
            }}
            className={`p-2.5 rounded-full border transition-all ${
              voiceEnabled 
                ? "bg-indigo-600/15 border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/25" 
                : "bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-850"
            }`}
            title={voiceEnabled ? "Disable Voice Assistant Synthesis" : "Enable Voice Assistant Synthesis"}
          >
            {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          {/* Voice Modulation Panel Toggle */}
          <button
            id="voice-settings-toggle-btn"
            onClick={() => setShowVoiceSettings(!showVoiceSettings)}
            className={`p-2.5 rounded-full border transition-all ${
              showVoiceSettings 
                ? "bg-indigo-600 text-white border-indigo-500" 
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300 hover:bg-slate-850"
            }`}
            title="Configure Custom Soft Vocal Tone & Pitch"
          >
            <Sliders className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Voice Customization Panel Floating Dropdown */}
      <AnimatePresence>
        {showVoiceSettings && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 right-6 z-50 w-80 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-850">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-indigo-400" />
                <span>Soft Voice Modulation</span>
              </span>
              <button
                id="close-voice-settings-btn"
                onClick={() => setShowVoiceSettings(false)}
                className="text-[10px] text-slate-500 hover:text-slate-300 font-mono"
              >
                ✕ Close
              </button>
            </div>

            {/* Accent Presets */}
            <div className="space-y-1.5">
              <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold font-mono">Quick Modulator Presets</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="preset-soft-human-btn"
                  onClick={() => {
                    setVoiceRate(0.93);
                    setVoicePitch(0.98);
                    showNotification("Soft Human preset applied (Slower & Warmer)", "success");
                  }}
                  className="px-2 py-1 text-[10px] bg-slate-950 hover:bg-slate-850 rounded border border-slate-850 text-slate-300 text-center"
                >
                  🍃 Soft & Warm
                </button>
                <button
                  id="preset-professional-btn"
                  onClick={() => {
                    setVoiceRate(0.96);
                    setVoicePitch(1.02);
                    showNotification("Professional preset applied (Crisp & Balanced)", "success");
                  }}
                  className="px-2 py-1 text-[10px] bg-slate-950 hover:bg-slate-850 rounded border border-slate-850 text-slate-300 text-center"
                >
                  👔 Professional
                </button>
              </div>
            </div>

            {/* Voice Select */}
            <div className="space-y-1">
              <label htmlFor="voice-select-dropdown" className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold font-mono">Voice Accent / Engine</label>
              <select
                id="voice-select-dropdown"
                value={selectedVoiceName}
                onChange={(e) => setSelectedVoiceName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                {voices.length === 0 ? (
                  <option value="">Default System Engine</option>
                ) : (
                  voices.map((v, i) => (
                    <option key={i} value={v.name}>
                      {v.name.replace("Microsoft", "").replace("Google", "").trim()} ({v.lang})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Voice Rate Slider */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-500 font-bold uppercase font-sans">Speed (Rate)</span>
                <span className="text-indigo-400 font-bold">{voiceRate.toFixed(2)}x</span>
              </div>
              <input
                id="voice-rate-slider"
                type="range"
                min="0.75"
                max="1.25"
                step="0.01"
                value={voiceRate}
                onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer"
              />
              <span className="block text-[9px] text-slate-500">Slower rates (e.g. 0.90x - 0.95x) feel significantly more natural.</span>
            </div>

            {/* Voice Pitch Slider */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-500 font-bold uppercase font-sans">Tone (Pitch)</span>
                <span className="text-indigo-400 font-bold">{voicePitch.toFixed(2)}</span>
              </div>
              <input
                id="voice-pitch-slider"
                type="range"
                min="0.75"
                max="1.25"
                step="0.01"
                value={voicePitch}
                onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer"
              />
              <span className="block text-[9px] text-slate-500">Lower values create a warmer, less robotic acoustic profile.</span>
            </div>

            {/* Test Voice Control */}
            <button
              id="test-modulated-voice-btn"
              onClick={handleTestVoiceTone}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span>Test Tone & Modulation</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Candidate Profile Modal */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileModalOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-850">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white uppercase font-display tracking-wider">Configure Candidate Profile</h3>
                </div>
                <button
                  onClick={() => setIsProfileModalOpen(false)}
                  className="text-xs text-slate-500 hover:text-slate-300 font-mono"
                >
                  ✕ Close
                </button>
              </div>

              <form onSubmit={handleRegisterProfile} className="space-y-4">
                {/* Avatar Emoji Selector */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-bold text-slate-400 font-mono">Select Avatar Emoji</label>
                  <div className="flex gap-2 justify-between">
                    {["⚡", "📈", "🍃", "💼", "🛡️", "💻", "🎨", "🚀", "🦊", "👑"].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewProfileEmoji(emoji)}
                        className={`w-8 h-8 rounded-xl border flex items-center justify-center text-sm transition-all cursor-pointer ${
                          newProfileEmoji === emoji
                            ? "bg-indigo-600 border-indigo-500 text-white scale-110 shadow"
                            : "bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-900"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Candidate Name */}
                <div className="space-y-1.5">
                  <label htmlFor="modal-profile-name" className="block text-[10px] uppercase font-bold text-slate-400 font-mono">Full Name</label>
                  <input
                    id="modal-profile-name"
                    type="text"
                    required
                    placeholder="e.g. Suchit Chavhan"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Candidate Email */}
                <div className="space-y-1.5">
                  <label htmlFor="modal-profile-email" className="block text-[10px] uppercase font-bold text-slate-400 font-mono">Email Address</label>
                  <input
                    id="modal-profile-email"
                    type="email"
                    required
                    placeholder="suchitchavhan889@gmail.com"
                    value={newProfileEmail}
                    onChange={(e) => setNewProfileEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Role Title */}
                <div className="space-y-1.5">
                  <label htmlFor="modal-profile-role" className="block text-[10px] uppercase font-bold text-slate-400 font-mono">Target Role Title</label>
                  <input
                    id="modal-profile-role"
                    type="text"
                    placeholder="e.g. Systems Architect & Tech Lead"
                    value={newProfileRole}
                    onChange={(e) => setNewProfileRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Active user selection indicator */}
                <p className="text-[10px] text-slate-500 font-mono leading-normal bg-slate-950/50 p-2.5 rounded-xl border border-slate-850">
                  ⚡ Saving registers or updates your profile in our live backend system. All future activities, test history, and job submissions are tracked under this profile.
                </p>

                {/* Submit actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(false)}
                    className="flex-1 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 rounded-xl text-xs font-semibold cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow shadow-indigo-600/15 cursor-pointer"
                  >
                    Save & Set Active
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Passcode Challenge Modal */}
      <AnimatePresence>
        {isPasscodeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPasscodeModalOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-850">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase font-display tracking-wider">Admin Verification</h3>
                </div>
                <button
                  onClick={() => setIsPasscodeModalOpen(false)}
                  className="text-xs text-slate-500 hover:text-slate-300 font-mono"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Only designated administrators are authorized to access the live candidate ledger and tracking system. Please provide the admin passcode to unlock.
                </p>

                <div className="space-y-1.5">
                  <label htmlFor="admin-passcode-field" className="block text-[10px] uppercase font-bold text-slate-500 font-mono">System Passcode</label>
                  <input
                    id="admin-passcode-field"
                    type="password"
                    placeholder="Enter Admin Passcode"
                    value={passcodeInput}
                    onChange={(e) => setPasscodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (passcodeInput === "admin123") {
                          setIsAdminMode(true);
                          setIsPasscodeModalOpen(false);
                          showNotification("Verification successful! Welcome to the System Admin portal.", "success");
                        } else {
                          showNotification("Incorrect passcode. System access denied.", "error");
                        }
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3.5 text-xs text-slate-200 text-center tracking-widest font-mono focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsPasscodeModalOpen(false)}
                  className="flex-grow py-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 rounded-xl text-xs font-semibold cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (passcodeInput === "admin123") {
                      setIsAdminMode(true);
                      setIsPasscodeModalOpen(false);
                      showNotification("Verification successful! Welcome to the System Admin portal.", "success");
                    } else {
                      showNotification("Incorrect passcode. System access denied.", "error");
                    }
                  }}
                  className="flex-grow py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow shadow-emerald-600/15 cursor-pointer text-center"
                >
                  Verify Code
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive Job Slot Application Overlay Modal */}
      <AnimatePresence>
        {isApplyingModalOpen && applyingCompany && applyingRole && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsApplyingModalOpen(false)}
              className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
            />

            {/* Modal Body Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl overflow-hidden flex flex-col space-y-5 my-8 z-10"
            >
              {/* Highlight Background Flare */}
              <div className={`absolute -right-16 -top-16 w-36 h-36 bg-gradient-to-br ${applyingCompany.logoColor} opacity-[0.06] rounded-full blur-2xl pointer-events-none`} />

              {/* Modal Header */}
              <div className="space-y-1 text-left">
                <div className="flex justify-between items-start">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 uppercase font-mono tracking-widest">
                    <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-tr ${applyingCompany.logoColor}`} />
                    <span>{applyingCompany.name} Recruiting</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsApplyingModalOpen(false)}
                    className="text-slate-500 hover:text-slate-300 font-mono text-xs cursor-pointer bg-slate-950/50 hover:bg-slate-950 px-2 py-1 rounded-lg border border-slate-850"
                  >
                    ✕ Close
                  </button>
                </div>
                <h3 className="text-lg font-bold text-white font-display mt-1">Apply for Active Recruiting Slot</h3>
                <p className="text-xs text-slate-400">
                  {applyingRole.title} ({applyingCompany.name})
                </p>
              </div>

              {/* Form Body */}
              <form onSubmit={handleApplyForJobSubmit} className="space-y-4 text-left">
                
                {/* Applicant Info Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="app-candidate-name-field" className="block text-[10px] uppercase font-bold text-slate-400 font-mono">Your Full Name</label>
                    <input
                      id="app-candidate-name-field"
                      type="text"
                      required
                      placeholder="e.g. Alex Rivera"
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      value={appCandidateName}
                      onChange={(e) => setAppCandidateName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label htmlFor="app-candidate-email-field" className="block text-[10px] uppercase font-bold text-slate-400 font-mono">Email Address</label>
                    <input
                      id="app-candidate-email-field"
                      type="email"
                      required
                      placeholder="e.g. alex@example.com"
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      value={appCandidateEmail}
                      onChange={(e) => setAppCandidateEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Slot Selection Options */}
                <div className="space-y-2">
                  <span className="block text-[10px] uppercase font-bold text-slate-400 font-mono">Available Job Slot Options</span>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { name: "Fast-Track Referral Slot (Priority A)", meta: "1 slot left - Fast-tracked review", icon: "⚡" },
                      { name: "Direct Hiring Manager Queue", meta: "3 slots left - Direct pipeline", icon: "💼" },
                      { name: "Flexible Remote-First Screening", meta: "4 slots left - Rolling calendar", icon: "🌍" }
                    ].map((slot, sIdx) => {
                      const isSel = appSelectedSlot === slot.name;
                      return (
                        <button
                          key={sIdx}
                          type="button"
                          id={`select-form-slot-${sIdx}`}
                          onClick={() => setAppSelectedSlot(slot.name)}
                          className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSel 
                              ? "bg-indigo-950/40 border-indigo-500 text-white shadow-md shadow-indigo-600/10" 
                              : "bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-900/50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{slot.icon}</span>
                            <div>
                              <span className="text-xs font-semibold block">{slot.name}</span>
                              <span className="text-[9px] text-slate-500 font-mono">{slot.meta}</span>
                            </div>
                          </div>
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            isSel ? "border-indigo-500 bg-indigo-600" : "border-slate-700 bg-transparent"
                          }`}>
                            {isSel && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Answer Bank STAR Integration Selection */}
                <div className="space-y-1.5">
                  <label htmlFor="app-story-select" className="block text-[10px] uppercase font-bold text-slate-400 font-mono flex justify-between items-center">
                    <span>Attach Saved STAR Story from Answer Bank</span>
                    <span className="text-[9px] text-indigo-400 lowercase font-medium">boosts ATS matching to 90%+!</span>
                  </label>
                  <select
                    id="app-story-select"
                    value={appSelectedStoryId}
                    onChange={(e) => setAppSelectedStoryId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="custom">No Answer Bank Attachment (Write standard statement below)</option>
                    {savedStarStories.map((story) => (
                      <option key={story.id} value={story.id}>
                        📚 [{story.company}] {story.role} - Saved on {new Date(story.timestamp).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cover Letter Pitch */}
                <div className="space-y-1.5">
                  <label htmlFor="app-cover-letter" className="block text-[10px] uppercase font-bold text-slate-400 font-mono">Personal Pitch / Cover Statement</label>
                  <textarea
                    id="app-cover-letter"
                    rows={3}
                    placeholder="Briefly state why you are an exceptional match for this target position."
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 font-sans"
                    value={appCoverLetter}
                    onChange={(e) => setAppCoverLetter(e.target.value)}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsApplyingModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="submit-form-app-btn"
                    disabled={isSubmittingApp || !appSelectedSlot}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/15"
                  >
                    {isSubmittingApp ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Submit Application</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Elegant ambient glow background elements */}
      <div className="absolute top-[20%] left-[10%] w-[450px] h-[450px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[130px] pointer-events-none animate-pulse duration-[10000ms]" />

      {/* Main Content View with Bento Layouts */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto flex flex-col justify-center relative z-10">
        
        {isAdminMode ? (
          <AdminMonitor
            allUsers={allUsers}
            activities={activities}
            onRefresh={fetchUsersAndActivities}
            onSwitchUser={handleSwitchUser}
            currentUser={currentUser}
            onDeleteUser={handleDeleteUser}
            onCloseAdmin={() => setIsAdminMode(false)}
          />
        ) : (
          <>
            {/* Interactive Career Preparation Roadmap Stepper */}
        <div className="mb-8 bg-slate-900/40 border border-slate-900/80 backdrop-blur-md rounded-2xl p-4 md:p-5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Activity className="h-4 w-4 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white font-display">Interpreted Practice Lifecycle</h4>
                <p className="text-[10px] text-slate-400">Dynamic phase tracker for target corporate preparation</p>
              </div>
            </div>
            
            {/* Visual Step Nodes */}
            <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full md:w-auto justify-center">
              {[
                { label: "1. Configure", key: "PHASE1_INPUT", icon: "⚙️" },
                { label: "2. Industry Intel", key: "PHASE1_SUMMARY", icon: "🔍" },
                { label: "3. Live Sim", key: "PHASE2_INTERVIEW", icon: "🎙️" },
                { label: "4. Critique", key: "PHASE3_FEEDBACK", icon: "📊" },
                { label: "5. Study Hub", key: "PHASE4_COACHING", icon: "👑" },
              ].map((step, idx, arr) => {
                const stepPhases = {
                  PHASE1_INPUT: 1,
                  PHASE1_SUMMARY: 2,
                  PHASE2_INTERVIEW: 3,
                  PHASE3_FEEDBACK: 4,
                  PHASE4_COACHING: 5
                };
                const currentStepNum = stepPhases[phase] || 1;
                const nodeStepNum = stepPhases[step.key as keyof typeof stepPhases];
                const isCompleted = nodeStepNum < currentStepNum;
                const isActive = nodeStepNum === currentStepNum;

                return (
                  <React.Fragment key={step.key}>
                    <button
                      type="button"
                      id={`stepper-node-${step.key}`}
                      onClick={() => {
                        if (nodeStepNum <= currentStepNum || (phase !== "PHASE1_INPUT" && step.key === "PHASE4_COACHING" && evaluation)) {
                          setPhase(step.key as Phase);
                          showNotification(`Navigated to ${step.label.split(" ")[1]}`, "info");
                        }
                      }}
                      disabled={nodeStepNum > currentStepNum && !(step.key === "PHASE4_COACHING" && evaluation)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all border ${
                        isActive
                          ? "bg-indigo-600 border-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/20 scale-[1.03]"
                          : isCompleted
                          ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400 cursor-pointer hover:bg-emerald-950/40"
                          : "bg-slate-950/40 border-slate-900/60 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      <span className="font-mono text-xs">{step.icon}</span>
                      <span>{step.label}</span>
                    </button>
                    {idx < arr.length - 1 && (
                      <div className={`hidden lg:block h-0.5 w-6 ${isCompleted ? "bg-emerald-500/30" : "bg-slate-900"}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* PHASE 1: JOB DESCRIPTION INPUT */}
        {phase === "PHASE1_INPUT" && (
          <div className="space-y-6">
            {/* Top Hero Banner (Bento Style) */}
            <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-indigo-950/20 via-slate-900/60 to-slate-950 p-6 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                  <p className="text-xs font-mono font-bold tracking-widest text-indigo-400 uppercase">Interactive Recruiter Module</p>
                </div>
                <h2 className="text-2xl md:text-4xl font-bold font-display text-white tracking-tight leading-tight">
                  Supercharge your interview game.
                </h2>
                <p className="mt-3 text-slate-400 text-sm md:text-base leading-relaxed">
                  Provide a target Job Description. My server-side intelligence will execute Web Search on modern industry standard tracks, map the ideal candidate persona, and spin up an interactive voice-friendly behavioral and technical exam.
                </p>
              </div>
            </div>

            {/* Form Input + Sample Templates Bento Grid Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Form Input Card (Main Bento) */}
              <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 relative">
                <h3 className="text-white font-semibold text-lg font-display flex items-center gap-2 mb-6">
                  <Terminal className="h-5 w-5 text-indigo-400" />
                  <span>Configure Current Opportunity</span>
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label htmlFor="company-name" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Company / Organization Name <span className="text-slate-500 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                        <Building className="h-4.5 w-4.5 text-slate-500" />
                      </div>
                      <input
                        id="company-name"
                        type="text"
                        placeholder="e.g. Netflix, Amazon, Stripe, Google"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        disabled={isAnalyzing}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="jd-content" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Paste Target Job Description (JD) *
                    </label>
                    <textarea
                      id="jd-content"
                      rows={9}
                      placeholder="Paste the requirements, tech stack, responsibilities, or role details..."
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 leading-relaxed focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      value={jdText}
                      onChange={(e) => setJdText(e.target.value)}
                      disabled={isAnalyzing}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Select Interviewer Personality
                    </label>
                    <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                      Each interviewer evaluates your responses using a different professional lens, strictness standard, and coaching tone.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Mentor Card */}
                      <button
                        type="button"
                        id="persona-mentor-btn"
                        onClick={() => {
                          setInterviewerPersona("mentor");
                          showNotification("Interviewer persona: Encouraging Mentor", "info");
                        }}
                        className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                          interviewerPersona === "mentor"
                            ? "bg-indigo-950/40 border-indigo-500/60 shadow-md shadow-indigo-500/5"
                            : "bg-slate-950 border-slate-850 hover:bg-slate-900 hover:border-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-base">🍃</span>
                          <span className={`text-xs font-bold uppercase tracking-wider ${interviewerPersona === "mentor" ? "text-indigo-400" : "text-slate-300"}`}>
                            Mentor
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Supportive & growth-oriented. Focuses on standard competencies, STAR structures, and warm tips.
                        </p>
                      </button>

                      {/* Architect Card */}
                      <button
                        type="button"
                        id="persona-architect-btn"
                        onClick={() => {
                          setInterviewerPersona("architect");
                          showNotification("Interviewer persona: Strict Architect", "info");
                        }}
                        className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                          interviewerPersona === "architect"
                            ? "bg-indigo-950/40 border-indigo-500/60 shadow-md shadow-indigo-500/5"
                            : "bg-slate-950 border-slate-850 hover:bg-slate-900 hover:border-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-base">⚡</span>
                          <span className={`text-xs font-bold uppercase tracking-wider ${interviewerPersona === "architect" ? "text-indigo-400" : "text-slate-300"}`}>
                            Architect
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Highly technical. Evaluates scaling, concurrency bottlenecks, edge cases, and architectural trade-offs.
                        </p>
                      </button>

                      {/* Product Leader Card */}
                      <button
                        type="button"
                        id="persona-product-btn"
                        onClick={() => {
                          setInterviewerPersona("product_leader");
                          showNotification("Interviewer persona: Product Director", "info");
                        }}
                        className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                          interviewerPersona === "product_leader"
                            ? "bg-indigo-950/40 border-indigo-500/60 shadow-md shadow-indigo-500/5"
                            : "bg-slate-950 border-slate-850 hover:bg-slate-900 hover:border-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-base">📈</span>
                          <span className={`text-xs font-bold uppercase tracking-wider ${interviewerPersona === "product_leader" ? "text-indigo-400" : "text-slate-300"}`}>
                            Director
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          KPI & metric-driven. Focuses on customer impact, feature priority modeling, and leadership traits.
                        </p>
                      </button>
                    </div>
                  </div>

                  <button
                    id="analyze-jd-btn"
                    onClick={() => handleAnalyzeJD(jdText, company)}
                    disabled={isAnalyzing || !jdText.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/15 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="font-mono text-sm tracking-wider uppercase">Running Live Web Search & Analysis...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4.5 w-4.5" />
                        <span>Initiate Recruiter AI Scan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Side Bento Cards (Templates & Micro tips) */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                
                {/* Templates Bento Box */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col flex-grow">
                  <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-4">
                    <FileText className="h-4.5 w-4.5 text-indigo-400" />
                    <span>Quick Test Templates</span>
                  </h3>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    Select a curated enterprise requirement stack to test immediately without manual copying:
                  </p>
                  
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[320px] pr-1">
                    {SAMPLE_TEMPLATES.map((tpl, i) => (
                      <button
                        key={i}
                        id={`template-card-${i}`}
                        onClick={() => {
                          setJdText(tpl.text);
                          setCompany(tpl.company);
                          showNotification(`Loaded template for ${tpl.title}`, "info");
                        }}
                        className="w-full text-left bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-slate-700 transition-all rounded-xl p-3.5 group cursor-pointer"
                      >
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-semibold text-xs text-white group-hover:text-indigo-400 transition-colors font-display">
                            {tpl.title}
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-slate-800 text-slate-400">
                            {tpl.company}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2">
                          {tpl.text}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tech Standard Bento Box */}
                <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-6">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 mb-3">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                  </div>
                  <h4 className="font-semibold text-xs text-white uppercase tracking-wider mb-1.5 font-display">Search Grounded Engine</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Unlike standard offline LLM tools, Recruiter AI crawls current web sources dynamically to align queries to live tech stacks, modern framework updates, and company-specific culture benchmarks.
                  </p>
                </div>

              </div>

            </div>

            {/* RECRUITER PARTNER DIRECTORY & AVAILABLE ROLES EXPLORER */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850 pb-5">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 font-mono">Recruiter Partner Integration</span>
                  <h3 className="text-xl font-bold text-white font-display mt-0.5">Available Careers & Predefined Role Specifications</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Select a targeted tech company role below to instantly load its live-search compatible specifications and practice.
                  </p>
                </div>
                
                {/* Search Bar within Directory */}
                <div className="relative max-w-xs w-full">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    id="directory-search-input"
                    type="text"
                    placeholder="Search roles (e.g. LLM, Swift, Product)..."
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    value={directorySearchQuery}
                    onChange={(e) => setDirectorySearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Company Selection Tabs */}
              <div className="flex flex-wrap gap-2 pb-2">
                <button
                  id="filter-company-all-btn"
                  onClick={() => setSelectedDirectoryCompany("all")}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    selectedDirectoryCompany === "all"
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/10"
                      : "bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-900 hover:text-slate-200"
                  }`}
                >
                  🌐 All Companies
                </button>
                {COMPANY_PRESETS.map((companyPreset) => {
                  const isActive = selectedDirectoryCompany === companyPreset.id;
                  return (
                    <button
                      key={companyPreset.id}
                      id={`filter-company-${companyPreset.id}-btn`}
                      onClick={() => setSelectedDirectoryCompany(companyPreset.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border flex items-center gap-2 ${
                        isActive
                          ? "bg-slate-950 text-white border-indigo-500 shadow-lg shadow-indigo-500/5 font-bold"
                          : "bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-900 hover:text-slate-200"
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-tr ${companyPreset.logoColor}`} />
                      <span>{companyPreset.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Filtered Roles Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(() => {
                  let filteredList: { companyName: string; companyId: string; logoColor: string; industry: string; role: any }[] = [];
                  
                  COMPANY_PRESETS.forEach((comp) => {
                    if (selectedDirectoryCompany !== "all" && selectedDirectoryCompany !== comp.id) {
                      return;
                    }
                    comp.roles.forEach((r) => {
                      const matchesSearch = 
                        directorySearchQuery.trim() === "" ||
                        r.title.toLowerCase().includes(directorySearchQuery.toLowerCase()) ||
                        r.category.toLowerCase().includes(directorySearchQuery.toLowerCase()) ||
                        r.text.toLowerCase().includes(directorySearchQuery.toLowerCase()) ||
                        comp.name.toLowerCase().includes(directorySearchQuery.toLowerCase());
                        
                      if (matchesSearch) {
                        filteredList.push({
                          companyName: comp.name,
                          companyId: comp.id,
                          logoColor: comp.logoColor,
                          industry: comp.industry,
                          role: r
                        });
                      }
                    });
                  });

                  if (filteredList.length === 0) {
                    return (
                      <div className="col-span-full text-center py-12 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-2">
                        <span className="text-xl block">🔍</span>
                        <h4 className="text-slate-300 text-sm font-semibold">No available positions match your filters</h4>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto">Try typing a different keyword or selecting another recruiter company.</p>
                      </div>
                    );
                  }

                  return filteredList.map((item, index) => {
                    const badgeColor = 
                      item.role.category === "Engineering" 
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : item.role.category === "Product"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : item.role.category === "Security"
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        : item.role.category === "Design"
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

                    return (
                      <div
                        key={index}
                        className="bg-slate-950 border border-slate-850/70 rounded-2xl p-5 hover:border-slate-700/80 transition-all flex flex-col justify-between group h-full relative overflow-hidden"
                      >
                        <div className={`absolute -right-12 -top-12 w-24 h-24 bg-gradient-to-br ${item.logoColor} opacity-[0.03] rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-all duration-500`} />
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                              <span className={`w-2 h-2 rounded-full bg-gradient-to-tr ${item.logoColor}`} />
                              <span>{item.companyName}</span>
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${badgeColor}`}>
                              {item.role.category}
                            </span>
                          </div>

                          <div>
                            <h4 className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors font-display line-clamp-1">
                              {item.role.title}
                            </h4>
                            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{item.industry}</span>
                          </div>

                          <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3">
                            {item.role.text}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-slate-900 mt-4 flex flex-col sm:flex-row gap-2">
                          <button
                            type="button"
                            id={`load-directory-role-${item.companyId}-${index}`}
                            onClick={() => {
                              setJdText(item.role.text);
                              setCompany(item.companyName);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                              showNotification(`Successfully configured Recruiter specification for ${item.role.title} at ${item.companyName}!`, "success");
                            }}
                            className="flex-1 text-[11px] bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 text-indigo-400 hover:text-white px-2 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1 cursor-pointer justify-center group-hover:border-indigo-500"
                          >
                            <span>Practice Pitch</span>
                            <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                          
                          <button
                            type="button"
                            id={`apply-directory-role-${item.companyId}-${index}`}
                            onClick={() => {
                              openApplicationModal(
                                { id: item.companyId, name: item.companyName, logoColor: item.logoColor, industry: item.industry },
                                item.role
                              );
                            }}
                            className="flex-1 text-[11px] bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/20 text-emerald-400 hover:text-white px-2 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1 cursor-pointer justify-center hover:border-emerald-500"
                          >
                            <span>Apply to Slot ⚡</span>
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* ACTIVE JOB APPLICATIONS & SLOT LEDGER */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-850 pb-5 text-left">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 font-mono flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Real-time Applicant Tracking System (ATS)</span>
                  </span>
                  <h3 className="text-xl font-bold text-white font-display mt-0.5">My Active Job Slots & Application Trackers</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Monitor your screening statuses, ATS matching metrics, and fast-track interviews for roles applied to.
                  </p>
                </div>
                
                {applications.length > 0 && (
                  <button
                    id="clear-all-apps-btn"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to clear your application history? Seeds will be restored upon refreshing.")) {
                        saveApplications([]);
                        showNotification("Cleared job applications.", "info");
                      }
                    }}
                    className="text-xs text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1.5 cursor-pointer bg-transparent border-none"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clear Tracker</span>
                  </button>
                )}
              </div>

              {applications.length === 0 ? (
                <div className="text-center py-12 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-2">
                  <span className="text-2xl block">💼</span>
                  <h4 className="text-slate-300 text-sm font-semibold">No active applications</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Choose a role from the "Available Careers & Predefined Role Specifications" list above and click "Apply to Slot ⚡" to submit!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
                  {applications.map((app) => {
                    const companyPreset = COMPANY_PRESETS.find(c => c.id === app.companyId);
                    const logoColor = companyPreset?.logoColor || "from-slate-600 to-slate-800";
                    
                    const statusStyles = {
                      "Submitted": "bg-blue-500/10 text-blue-400 border-blue-500/20",
                      "Screening": "bg-amber-500/10 text-amber-400 border-amber-500/20",
                      "Interview Scheduled": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                      "Offered": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
                      "Closed": "bg-slate-500/10 text-slate-400 border-slate-500/20"
                    };
                    
                    const currentStatusStyle = statusStyles[app.status as keyof typeof statusStyles] || statusStyles["Submitted"];

                    return (
                      <div
                        key={app.id}
                        className="bg-slate-950 border border-slate-850/80 rounded-2xl p-5 hover:border-slate-750 transition-all space-y-4 relative overflow-hidden flex flex-col justify-between"
                      >
                        <div className={`absolute -right-16 -top-16 w-32 h-32 bg-gradient-to-br ${logoColor} opacity-[0.02] rounded-full blur-2xl pointer-events-none`} />
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <div className="space-y-1">
                              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 font-mono">
                                <span className={`w-2 h-2 rounded-full bg-gradient-to-tr ${logoColor}`} />
                                <span>{app.companyName}</span>
                              </span>
                              <h4 className="font-bold text-sm text-white font-display leading-snug">
                                {app.roleTitle}
                              </h4>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border whitespace-nowrap ${currentStatusStyle}`}>
                              {app.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 py-2 px-3 bg-slate-900/40 border border-slate-900/80 rounded-xl text-[10px] font-mono">
                            <div>
                              <span className="text-slate-500 block">Applied Slot</span>
                              <span className="text-slate-300 font-semibold truncate block">{app.appliedSlot}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">ATS Score Match</span>
                              <span className={`font-bold block ${app.matchScore >= 90 ? "text-emerald-400" : app.matchScore >= 80 ? "text-amber-400" : "text-indigo-400"}`}>
                                {app.matchScore}% Proficiency
                              </span>
                            </div>
                          </div>

                          {app.coverLetter && (
                            <div className="text-[11px] text-slate-400 line-clamp-2 italic bg-slate-900/20 px-3 py-2 rounded-lg border border-slate-900/40">
                              "{app.coverLetter}"
                            </div>
                          )}

                          <div className="space-y-1.5">
                            <span className="block text-[10px] text-indigo-400 uppercase tracking-wider font-mono font-bold">ATS Recruiter Commentary:</span>
                            <p className="text-[11px] text-slate-300 bg-slate-900/60 border border-slate-900 p-3 rounded-xl leading-relaxed">
                              {app.screeningFeedback}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-900 mt-2 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                          <span>Applied: {new Date(app.timestamp).toLocaleDateString()}</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm("Are you sure you want to withdraw this active application slot?")) {
                                const filtered = applications.filter(a => a.id !== app.id);
                                saveApplications(filtered);
                                showNotification("Withdrew application from slot.", "info");
                              }
                            }}
                            className="text-red-400/80 hover:text-red-400 transition-colors cursor-pointer bg-transparent border-none"
                          >
                            Withdraw Slot
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PAST SESSIONS HISTORY & PERFORMANCE DASHBOARD */}
            {sessionsHistory.length > 0 && (
              <div className="mt-12 pt-8 border-t border-slate-850 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 font-mono">Performance Analytics Ledger</span>
                    <h3 className="text-xl font-bold text-white font-display mt-0.5">Mock Interview Session Vault</h3>
                  </div>
                  <button
                    id="clear-all-sessions-btn"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to purge your entire interview session history? This cannot be undone.")) {
                        saveSessionsHistory([]);
                        showNotification("Purged all past interview sessions.", "info");
                      }
                    }}
                    className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-none"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clear All History</span>
                  </button>
                </div>

                {/* Score & Metric Cards Bento Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Metric Card 1 */}
                  <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Total Drills</span>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-2xl font-bold text-white font-mono">{sessionsHistory.length}</span>
                      <span className="text-xs text-emerald-400 font-mono">Completed</span>
                    </div>
                  </div>

                  {/* Metric Card 2 */}
                  <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Average Score</span>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-2xl font-bold text-indigo-400 font-mono">
                        {Math.round(sessionsHistory.reduce((acc, curr) => acc + curr.score, 0) / sessionsHistory.length)}%
                      </span>
                      <span className="text-xs text-slate-500 font-mono">Proficiency</span>
                    </div>
                  </div>

                  {/* Metric Card 3 */}
                  <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Interviewer Persona</span>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-sm font-bold text-slate-300 font-display">
                        {sessionsHistory.filter(s => s.persona === "architect").length > sessionsHistory.filter(s => s.persona === "mentor").length ? "Tough Architect" : "Helpful Mentor"}
                      </span>
                    </div>
                  </div>

                  {/* Metric Card 4 */}
                  <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">High Verdict</span>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-sm font-bold text-emerald-400 font-display">
                        {sessionsHistory.some(s => s.evaluation.overallRating.toLowerCase().includes("strong")) ? "Strong Hire ✨" : "Lean Hire 👍"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Session List Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-950/85 border-b border-slate-850 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="p-4">Target Role / Company</th>
                          <th className="p-4">Date & Time</th>
                          <th className="p-4">Persona</th>
                          <th className="p-4">Overall Verdict</th>
                          <th className="p-4 text-center">Score</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850/60">
                        {sessionsHistory.map((sess) => {
                          const isStrong = sess.evaluation.overallRating.toLowerCase().includes("strong");
                          const isNo = sess.evaluation.overallRating.toLowerCase().includes("no");
                          return (
                            <tr key={sess.id} className="hover:bg-slate-850/40 transition-colors group">
                              <td className="p-4">
                                <div className="font-semibold text-slate-200 font-display">{sess.role}</div>
                                <div className="text-slate-500 mt-0.5 text-[10px]">{sess.company}</div>
                              </td>
                              <td className="p-4 text-slate-400 font-mono">
                                {sess.timestamp}
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                  sess.persona === "architect" 
                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                                    : sess.persona === "product_leader"
                                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                }`}>
                                  {sess.persona === "architect" ? "Architect" : sess.persona === "product_leader" ? "Director" : "Mentor"}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`font-semibold ${
                                  isStrong ? "text-emerald-400" : isNo ? "text-rose-400" : "text-amber-400"
                                }`}>
                                  {sess.evaluation.overallRating}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <div className={`inline-flex items-center justify-center font-bold font-mono text-xs h-7 w-7 rounded-full ${
                                  sess.score >= 90 
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" 
                                    : sess.score >= 70
                                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                      : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                                }`}>
                                  {sess.score}
                                </div>
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    id={`review-session-${sess.id}`}
                                    onClick={() => handleLoadSession(sess)}
                                    className="px-2.5 py-1 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 rounded-md transition-all text-[11px] font-semibold cursor-pointer"
                                  >
                                    Review Report
                                  </button>
                                  <button
                                    id={`delete-session-${sess.id}`}
                                    onClick={(e) => handleDeleteSession(sess.id, e)}
                                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer bg-transparent border-none"
                                    title="Delete from history"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PHASE 1: RESEARCH SUMMARY & INTERVIEW PLAN */}
        {phase === "PHASE1_SUMMARY" && analysis && (
          <div className="space-y-6">
            {/* Top Title Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 font-mono">Dynamic Search Grounding Complete</span>
                <h2 className="text-xl md:text-2xl font-bold text-white font-display mt-0.5">Role Competency Framework</h2>
              </div>
              <div className="flex gap-2">
                <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  Difficulty: {analysis.difficulty}
                </span>
                {company && (
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold bg-slate-800 border border-slate-700 text-slate-300">
                    Company: {company}
                  </span>
                )}
              </div>
            </div>

            {/* Bento Grid Layout for Summary */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Core Competencies (Bento 1) */}
              <div className="md:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-4 font-mono">Core Competencies Identified</h3>
                  <div className="space-y-2.5">
                    {analysis.skills.map((skill, index) => (
                      <div key={index} className="flex items-center gap-3 bg-slate-950 border border-slate-850 px-4 py-3 rounded-xl">
                        <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                        <span className="text-xs font-medium text-slate-200">{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 bg-indigo-950/20 border border-indigo-500/25 rounded-xl p-4">
                  <h4 className="text-[10px] text-indigo-400 font-bold uppercase tracking-wide mb-1 font-mono">Assessed Seniority</h4>
                  <div className="flex gap-1.5 my-2">
                    <div className="h-2 w-full bg-indigo-500 rounded-full"></div>
                    <div className={`h-2 w-full rounded-full ${["Mid", "Senior", "Expert"].some(v => analysis.difficulty.includes(v)) ? "bg-indigo-500" : "bg-slate-800"}`}></div>
                    <div className={`h-2 w-full rounded-full ${["Senior", "Expert"].some(v => analysis.difficulty.includes(v)) ? "bg-indigo-500" : "bg-slate-800"}`}></div>
                    <div className={`h-2 w-full rounded-full ${["Expert"].some(v => analysis.difficulty.includes(v)) ? "bg-indigo-500" : "bg-slate-800"}`}></div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Adjusted candidate difficulty to <strong className="text-indigo-300">{analysis.difficulty} Level</strong> based on specific technical depth requirements.
                  </p>
                </div>
              </div>

              {/* Company & Industry Trends (Bento 2) */}
              <div className="md:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-3 font-mono">Market Intelligence & Trends</h3>
                  <p className="text-sm text-slate-300 leading-relaxed font-sans mt-3">
                    {analysis.companyTrends}
                  </p>
                </div>

                {analysis.searchSources && analysis.searchSources.length > 0 && (
                  <div className="mt-6 border-t border-slate-850 pt-4">
                    <h4 className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2 font-mono">Google Search Grounding Citations</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.searchSources.slice(0, 3).map((source, idx) => (
                        <a
                          key={idx}
                          href={source.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-850 text-[10px] text-indigo-400 hover:text-indigo-300 hover:border-slate-700 transition-all font-mono"
                        >
                          <Search className="h-2.5 w-2.5" />
                          <span className="truncate max-w-[120px]">{source.title}</span>
                          <ExternalLink className="h-2 w-2" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Interview Plan & Action (Bento 3) */}
              <div className="md:col-span-3 bg-gradient-to-br from-indigo-900/30 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-indigo-400 text-[10px] uppercase font-bold tracking-widest mb-4 font-mono">Structured Syllabus</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-slate-950/40 border border-slate-850 p-3 rounded-xl">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-white">Technical Questions</span>
                        <span className="text-[10px] text-slate-400">Algorithmic & System Design</span>
                      </div>
                      <span className="text-lg font-bold text-indigo-400 font-mono">3</span>
                    </div>

                    <div className="flex justify-between items-center bg-slate-950/40 border border-slate-850 p-3 rounded-xl">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-white">Behavioral Questions</span>
                        <span className="text-[10px] text-slate-400">STAR Method Criteria</span>
                      </div>
                      <span className="text-lg font-bold text-indigo-400 font-mono">2</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                    Ready to begin the live simulated conversation? The recruiter AI will read out of the core questions.
                  </p>
                  
                  <button
                    id="begin-interview-btn"
                    onClick={handleStartInterview}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <span>Begin Interview Session</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* PHASE 2: LIVE INTERACTIVE INTERVIEW */}
        {phase === "PHASE2_INTERVIEW" && analysis && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Job Spec Summary (Bento 1) */}
              <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-6">
                <div>
                  <h3 className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-3 font-mono">JD Reference</h3>
                  <div className="mb-4">
                    <p className="text-[10px] text-slate-500 uppercase font-bold font-mono">Company</p>
                    <p className="text-sm font-semibold text-white">{company || "General Tech Standard"}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-[10px] text-slate-500 uppercase font-bold font-mono">Expected Role Level</p>
                    <p className="text-sm font-semibold text-white">{analysis.difficulty} Track</p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-850">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide mb-2 font-mono">Target Competencies</p>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.skills.map((skill, index) => (
                        <span 
                          key={index} 
                          className="px-2 py-1 bg-slate-950 text-[9px] font-mono text-slate-400 border border-slate-800 rounded-md"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Volume2 className="h-4 w-4 text-indigo-400" />
                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300 font-mono">Synthesis Engine</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {voiceEnabled ? "The Recruiter AI speaks each question aloud. Keep your volume turned up!" : "Voice assistant is muted. Read the center question and write or speak your response."}
                  </p>
                </div>
              </div>

              {/* Center Column: Active Question & Input Card (Bento 2) */}
              <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col justify-between min-h-[460px] relative overflow-hidden">
                {/* Visual Top Bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-850">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-500" 
                    style={{ width: `${((currentQuestionIndex + 1) / analysis.questions.length) * 100}%` }}
                  />
                </div>

                {/* Question Info Header */}
                <div className="flex justify-between items-center mb-4">
                  <span className="text-indigo-400 text-xs font-mono uppercase tracking-widest font-semibold">
                    Question {String(currentQuestionIndex + 1).padStart(2, "0")} / {String(analysis.questions.length).padStart(2, "0")}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 border border-slate-700 text-slate-300 capitalize">
                    {analysis.questions[currentQuestionIndex].type} Focus
                  </span>
                </div>

                {/* Core Question Text with Custom Simulated Portrait Avatar */}
                <div className="flex-1 flex flex-col items-center justify-center py-4 space-y-4">
                  {/* Persona Indicator Bubble */}
                  <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-900 px-4 py-2 rounded-2xl">
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base border shadow-md ${
                        interviewerPersona === "mentor"
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : interviewerPersona === "architect"
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                          : "bg-blue-500/10 border-blue-500/30 text-blue-400"
                      }`}>
                        {interviewerPersona === "mentor" ? "🍃" : interviewerPersona === "architect" ? "⚡" : "📈"}
                      </div>
                      <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-950 flex items-center justify-center text-[8px] ${
                        voiceEnabled ? "bg-indigo-500" : "bg-slate-700"
                      }`} title={voiceEnabled ? "TTS Voice Active" : "Muted"}>
                        {voiceEnabled ? "🔊" : "✕"}
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-white uppercase font-display tracking-wide">
                          {interviewerPersona === "mentor" ? "Encouraging Mentor" : interviewerPersona === "architect" ? "Tough Architect" : "Product Director"}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <p className="text-[9px] text-slate-500">
                        {interviewerPersona === "mentor" 
                          ? "Evaluating behaviors & growth structures" 
                          : interviewerPersona === "architect" 
                          ? "Auditing core system depth & boundaries" 
                          : "Scanning KPI modeling & impact focus"}
                      </p>
                    </div>
                  </div>

                  <h2 className="text-xl md:text-2xl font-medium text-white leading-relaxed text-center max-w-lg mx-auto font-display italic">
                    "{analysis.questions[currentQuestionIndex].text}"
                  </h2>
                </div>

                {/* Dual Input: Voice & Text Response Panel */}
                <div className="w-full space-y-4 border-t border-slate-850/60 pt-4">
                  
                  {/* Mode Selector and Microphone Info */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                      {isListening && speechTarget === "interview" ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                          <span className="text-rose-400 font-bold">🎙️ Live Microphone Streaming</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                          <span>⌨️ Voice & Text Dual Input Active</span>
                        </>
                      )}
                    </span>
                    
                    {/* Live Word & Speech Clarity metrics */}
                    <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono">
                      {/* Word Count Indicator */}
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Word Count:</span>
                        <span className={`font-bold ${
                          (currentAnswer.trim() === "" ? 0 : currentAnswer.trim().split(/\s+/).length) >= 50
                            ? "text-emerald-400"
                            : (currentAnswer.trim() === "" ? 0 : currentAnswer.trim().split(/\s+/).length) >= 20
                            ? "text-amber-400"
                            : "text-slate-400"
                        }`}>
                          {currentAnswer.trim() === "" ? 0 : currentAnswer.trim().split(/\s+/).length} words
                        </span>
                        <span className="text-[9px] text-slate-500">(Target: 50+)</span>
                      </div>

                      {/* Live Filler word auditor */}
                      <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
                        <span className="text-slate-500">Filler Words:</span>
                        <span className={`font-bold px-1.5 py-0.5 rounded ${
                          currentFillerCount === 0
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : currentFillerCount < 3
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse"
                        }`}>
                          {currentFillerCount} matches
                        </span>
                      </div>

                      {/* Proximity / Verbal speed tracker */}
                      <div className="flex items-center gap-2 border-l border-slate-800 pl-4 hidden sm:flex">
                        <span className="text-slate-500">Speech Clarity:</span>
                        <span className={`font-bold ${
                          currentFillerCount === 0 
                            ? "text-emerald-400" 
                            : currentFillerCount < 3 
                              ? "text-amber-400" 
                              : "text-rose-400"
                        }`}>
                          {currentAnswer.trim() === "" ? "100" : Math.max(20, Math.round(100 - (currentFillerCount * 12)))}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Spacious Text Area for Professional Response */}
                  <div className="relative">
                    <textarea 
                      id="candidate-answer-textarea"
                      rows={5}
                      placeholder={isListening && speechTarget === "interview" ? "Listening continuously... Start speaking now. You can also edit your text directly in this box at any time." : "Type your detailed professional response or click the microphone button to dictate your answer..."}
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500/80 rounded-xl p-4 text-xs md:text-sm text-slate-200 placeholder-slate-600 leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all font-sans resize-none"
                    />
                    
                    {/* Microphone floating helper toggle */}
                    <div className="absolute bottom-3.5 right-3.5 flex items-center gap-2">
                      <button
                        id="mic-dictate-btn"
                        onClick={() => toggleListening("interview")}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[10px] font-bold uppercase transition-all tracking-wider shadow ${
                          isListening && speechTarget === "interview"
                            ? "bg-rose-600 text-white hover:bg-rose-700 animate-pulse" 
                            : micUnavailable 
                            ? "bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed opacity-50" 
                            : "bg-slate-900 hover:bg-slate-850 border border-slate-800 text-indigo-400 hover:text-indigo-300"
                        }`}
                        title={isListening && speechTarget === "interview" ? "Stop voice capture" : "Dictate response (Speech-to-Text)"}
                        disabled={micUnavailable}
                      >
                        {isListening && speechTarget === "interview" ? (
                          <>
                            <MicOff className="h-3.5 w-3.5" />
                            <span>Stop Mic</span>
                          </>
                        ) : (
                          <>
                            <Mic className="h-3.5 w-3.5" />
                            <span>Dictate</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Submission Row */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                    {micUnavailable ? (
                      <span className="text-[10px] text-slate-500 font-mono">
                        ⚠️ Mic restricted (Browser or Permission). Typing is fully supported.
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono leading-tight">
                        ✨ Pro Tip: Speak clearly. Speak as long as you'd like, then click "Submit Response" below.
                      </span>
                    )}

                    <button 
                      id="submit-current-answer-btn"
                      onClick={handleNextQuestion}
                      disabled={!currentAnswer.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-40 rounded-xl px-5 py-2.5 text-xs font-bold tracking-wide text-white transition-all flex items-center justify-center gap-2 shadow shadow-indigo-600/10 cursor-pointer"
                    >
                      <span>Submit Response & Continue</span>
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Market Standard & Live Tips (Bento 3 & Bento 6) */}
              <div className="lg:col-span-3 flex flex-col gap-6">
                {/* Industry Standards */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-3 font-mono">Live Guidance</h3>
                    <div className="space-y-3.5 mt-4">
                      <div>
                        <span className="block text-[10px] text-slate-500 uppercase font-mono">Expected Focus</span>
                        <p className="text-xs text-slate-200 font-medium leading-relaxed mt-1">
                          {analysis.questions[currentQuestionIndex].expectedFocus}
                        </p>
                      </div>
                      
                      <div className="pt-2 border-t border-slate-850">
                        <span className="block text-[10px] text-slate-500 uppercase font-mono">Industry Trend Target</span>
                        <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                          Our active search crawler confirms this role evaluates precision and clean architecture. Elaborate fully!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-slate-850 text-[11px] text-slate-500 leading-tight">
                    Tip: Be structure-oriented. Mention concrete technology and architecture strategies if applicable.
                  </div>
                </div>

                {/* Performance Signal Projections */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <h3 className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-3 font-mono">Voice Activity Wave</h3>
                  
                  {/* Live animated equalizer sound bars */}
                  <div className="flex items-end gap-1.5 h-16 my-4 px-2">
                    {bars.map((height, idx) => (
                      <div 
                        key={idx} 
                        className="w-full bg-indigo-500 rounded-t transition-all duration-300"
                        style={{ 
                          height: `${height}%`,
                          opacity: isListening ? 1.0 : 0.4
                        }}
                      />
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span>Sentiment Tracking</span>
                    <span className="text-indigo-400 font-bold uppercase">{sentimentConfidence}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Timeline Element (Bento 5) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
                {analysis.questions.map((q, idx) => {
                  const isCompleted = idx < currentQuestionIndex;
                  const isActive = idx === currentQuestionIndex;
                  return (
                    <div 
                      key={q.id} 
                      className={`flex items-center gap-2 ${
                        isCompleted ? "opacity-60" : isActive ? "border-l-2 border-indigo-500 pl-3" : "opacity-30"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 uppercase font-bold font-mono">Q{idx + 1}: {q.type}</span>
                        <span className={`text-xs font-semibold ${
                          isCompleted ? "text-emerald-400" : isActive ? "text-white" : "text-slate-500"
                        }`}>
                          {isCompleted ? "Completed ✓" : isActive ? "In Progress..." : "Pending"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-center sm:text-right border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-6">
                <p className="text-[10px] text-slate-500 uppercase font-bold font-mono">Active Duration</p>
                <p className="text-xl font-mono text-white tracking-widest font-bold">
                  {formatTime(interviewDuration)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PHASE 3: EVALUATION & REPORT FEEDBACK */}
        {phase === "PHASE3_FEEDBACK" && (
          <div className="space-y-6">
            
            {/* Loading Assessment Screen */}
            {isEvaluating ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <Sparkles className="h-6 w-6 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold font-display text-white">Assembling Expert Evaluation...</h2>
                  <p className="text-slate-400 text-sm mt-1.5 max-w-md mx-auto">
                    Comparing your session answers against strict industry standards, company benchmarks, and deep search documentation. One moment.
                  </p>
                </div>
              </div>
            ) : evaluation ? (
              <div className="space-y-6">
                {/* Score Card Header Bento */}
                {(() => {
                  const getNumericScoreAndDetails = () => {
                    const r = evaluation.overallRating.toLowerCase();
                    if (r.includes("strong")) {
                      return {
                        score: 95,
                        label: "Strong Hire",
                        colorHex: "#10b981",
                        metrics: [
                          { name: "Technical Precision", val: 96 },
                          { name: "Communication & STAR", val: 92 },
                          { name: "Architectural Foresight", val: 95 },
                          { name: "Clarity & Pace", val: 94 }
                        ]
                      };
                    } else if (r.includes("lean")) {
                      return {
                        score: 74,
                        label: "Lean Hire",
                        colorHex: "#f59e0b",
                        metrics: [
                          { name: "Technical Precision", val: 78 },
                          { name: "Communication & STAR", val: 72 },
                          { name: "Architectural Foresight", val: 75 },
                          { name: "Clarity & Pace", val: 74 }
                        ]
                      };
                    } else {
                      return {
                        score: 48,
                        label: "No Hire",
                        colorHex: "#ef4444",
                        metrics: [
                          { name: "Technical Precision", val: 52 },
                          { name: "Communication & STAR", val: 45 },
                          { name: "Architectural Foresight", val: 40 },
                          { name: "Clarity & Pace", val: 55 }
                        ]
                      };
                    }
                  };
                  const scoreDetails = getNumericScoreAndDetails();

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      
                      {/* Verdict Card (Bento 1 with SVG Radial Gauge) */}
                      <div className="md:col-span-4 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between items-stretch">
                        <div>
                          <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-widest font-mono">Expert Board Verdict</span>
                          <h3 className="text-lg font-bold text-slate-400 font-display mt-0.5 font-sans">Recruiter Assessment</h3>
                        </div>

                        {/* Interactive SVG Circular Gauge */}
                        <div className="flex flex-col items-center justify-center my-5 space-y-3">
                          <div className="relative w-28 h-28">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                              {/* Background Track */}
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                stroke="#1e293b"
                                strokeWidth="8"
                                fill="transparent"
                              />
                              {/* Glowing Active Track */}
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                stroke={scoreDetails.colorHex}
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={2 * Math.PI * 40}
                                strokeDashoffset={2 * Math.PI * 40 * (1 - scoreDetails.score / 100)}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-2xl font-black font-mono text-white">{scoreDetails.score}%</span>
                              <span className="text-[8px] uppercase tracking-wider font-bold text-slate-500">Proficiency</span>
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <span className={`text-xl font-extrabold tracking-tight font-display uppercase block ${
                              evaluation.overallRating.includes("Strong") 
                                ? "text-emerald-400" 
                                : evaluation.overallRating.includes("Lean") 
                                ? "text-amber-400" 
                                : "text-rose-400"
                            }`}>
                              {evaluation.overallRating}
                            </span>
                          </div>
                        </div>

                        <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl text-[10px] text-slate-400 leading-relaxed font-mono flex justify-between items-center">
                          <span>Target Level:</span>
                          <span className="font-bold text-white">{analysis?.difficulty || "Assessed Track"}</span>
                        </div>
                      </div>

                      {/* Summary Narrative (Bento 2 with Sub-Metrics Grid) */}
                      <div className="md:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="text-slate-400 text-[10px] uppercase font-bold tracking-widest font-mono">Performance Narrative</h3>
                            <span className="text-[10px] font-semibold text-indigo-400 font-mono">Verified Framework Match</span>
                          </div>
                          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                            {evaluation.overallFeedback}
                          </p>
                        </div>

                        {/* Beautiful Sub-Metrics Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-850/80">
                          {scoreDetails.metrics.map((m, i) => (
                            <div key={i} className="space-y-1.5">
                              <div className="flex justify-between text-[10px] font-mono">
                                <span className="text-slate-400 font-sans font-medium">{m.name}</span>
                                <span className="text-slate-200 font-bold">{m.val}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                                <div 
                                  className="h-full rounded-full transition-all duration-1000"
                                  style={{ 
                                    width: `${m.val}%`,
                                    backgroundColor: scoreDetails.colorHex 
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  );
                })()}

                {/* Strengths and Improvement Gaps Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Strengths Bento */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-emerald-400 text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 mb-4 font-mono">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                      <span>Identified Core Strengths</span>
                    </h3>
                    <ul className="space-y-3">
                      {evaluation.strengths.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-xs text-slate-300 leading-relaxed bg-slate-950 border border-slate-850/50 p-3 rounded-xl">
                          <span className="text-emerald-500 font-mono font-bold">✓</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Improvement Gaps Bento */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-indigo-400 text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 mb-4 font-mono">
                      <AlertCircle className="h-4.5 w-4.5 text-indigo-500" />
                      <span>Areas for Improvement & Gaps</span>
                    </h3>
                    <ul className="space-y-3">
                      {evaluation.improvements.map((imp, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-xs text-slate-300 leading-relaxed bg-slate-950 border border-slate-850/50 p-3 rounded-xl">
                          <span className="text-indigo-400 font-mono font-bold">!</span>
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Question-by-Question Breakdowns with Expander */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-6 font-mono">Detailed Question Critique</h3>
                  
                  <div className="space-y-4">
                    {evaluation.questionBreakdown.map((item, idx) => {
                      const matchedAnswer = answers.find(a => a.questionText === item.questionText);
                      return (
                        <div key={idx} className="bg-slate-950 border border-slate-850 rounded-xl p-5 space-y-4">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="text-xs font-semibold text-white leading-relaxed max-w-2xl font-display">
                              <span className="text-indigo-400 font-mono mr-2">Q{idx + 1}.</span>
                              "{item.questionText}"
                            </h4>
                            <button
                              id={`go-coaching-btn-${idx}`}
                              onClick={() => handleGoToCoaching(item.questionText)}
                              className="px-2.5 py-1 rounded bg-indigo-600/10 hover:bg-indigo-600/25 border border-indigo-500/20 hover:border-indigo-500/40 text-[10px] font-semibold text-indigo-300 transition-colors cursor-pointer"
                            >
                              Practice this Response
                            </button>
                          </div>

                          <div className="space-y-3.5 pt-3 border-t border-slate-900 text-xs">
                            <div>
                              <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold">Your Response:</span>
                              <p className="text-slate-300 italic mt-1 bg-slate-900/40 p-2.5 rounded-lg border border-slate-900 leading-relaxed font-mono text-[11px]">
                                {matchedAnswer ? `"${matchedAnswer.answerText}"` : "[No response recorded]"}
                              </p>
                            </div>

                            <div>
                              <span className="block text-[10px] text-indigo-400 uppercase tracking-wider font-mono font-bold">Critique & Analysis:</span>
                              <p className="text-slate-300 mt-1 leading-relaxed">
                                {item.critique}
                              </p>
                            </div>

                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="block text-[10px] text-emerald-400 uppercase tracking-wider font-mono font-bold">Model Answer Recommendation:</span>
                                <button
                                  type="button"
                                  id={`copy-model-ans-btn-${idx}`}
                                  onClick={() => handleCopyToClipboard(item.modelAnswer)}
                                  className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-slate-200 transition-colors py-1 px-2.5 bg-slate-900 hover:bg-slate-850 rounded-lg border border-slate-800/80 cursor-pointer"
                                  title="Copy refined response text to clipboard"
                                >
                                  <Copy className="h-3 w-3" />
                                  <span>Copy Answer</span>
                                </button>
                              </div>
                              <p className="text-slate-200 bg-emerald-950/10 border border-emerald-900/25 p-3 rounded-lg leading-relaxed font-sans">
                                {item.modelAnswer}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 📚 STUDY & PRACTICE RESOURCE HUB */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-850">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        <BookOpen className="h-5.5 w-5.5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white font-display">Study, Practice & Learn Hub</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Customized preparation resources, interactive exercises, and guides based on your JD.</p>
                      </div>
                    </div>

                    {/* Tabs Selector */}
                    <div className="flex flex-wrap bg-slate-950 p-1.5 rounded-xl border border-slate-850/60 max-w-lg gap-1">
                      <button
                        id="tab-star-builder-btn"
                        onClick={() => setResourceActiveTab("star_builder")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          resourceActiveTab === "star_builder"
                            ? "bg-indigo-600 text-white shadow"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        ✍️ STAR Story Builder
                      </button>
                      <button
                        id="tab-roadmap-btn"
                        onClick={() => setResourceActiveTab("roadmap")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          resourceActiveTab === "roadmap"
                            ? "bg-indigo-600 text-white shadow"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        🗺️ Skill Roadmaps
                      </button>
                      <button
                        id="tab-cheatsheets-btn"
                        onClick={() => setResourceActiveTab("cheatsheets")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          resourceActiveTab === "cheatsheets"
                            ? "bg-indigo-600 text-white shadow"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        📝 Cheat-Sheets
                      </button>
                      <button
                        id="tab-answer-bank-btn"
                        onClick={() => setResourceActiveTab("answer_bank")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          resourceActiveTab === "answer_bank"
                            ? "bg-indigo-600 text-white shadow"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        👑 My Answer Bank
                      </button>
                    </div>
                  </div>

                  {/* Tab Contents */}
                  <AnimatePresence mode="wait">
                    {resourceActiveTab === "star_builder" && (
                      <motion.div
                        key="star_builder"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                      >
                        <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-2">
                          <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                            <Sparkles className="h-4 w-4" />
                            <span>Interactive STAR behavioral Planner</span>
                          </h4>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            Draft your behavioral stories below using the <strong>STAR Method</strong> (Situation, Task, Action, Result). 
                            Click "Evaluate STAR Story" to let Gemini analyze your content, spot gaps, and write an expert polished draft for you to learn from.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3.5">
                            <div>
                              <label htmlFor="star-situation-input" className="block text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider mb-1">
                                [S] Situation — Set the Context
                              </label>
                              <textarea
                                id="star-situation-input"
                                value={starSituation}
                                onChange={(e) => setStarSituation(e.target.value)}
                                placeholder="E.g., Our billing system crashed during Black Friday, leading to a 35% dropout in checkout rates..."
                                rows={2}
                                className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none resize-none font-sans"
                              />
                            </div>

                            <div>
                              <label htmlFor="star-task-input" className="block text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider mb-1">
                                [T] Task — Define the Mission
                              </label>
                              <textarea
                                id="star-task-input"
                                value={starTask}
                                onChange={(e) => setStarTask(e.target.value)}
                                placeholder="E.g., As SRE Lead, my objective was to stabilize the DB cluster and configure high-throughput failover..."
                                rows={2}
                                className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none resize-none font-sans"
                              />
                            </div>

                            <div>
                              <label htmlFor="star-action-input" className="block text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider mb-1">
                                [A] Action — Describe what YOU did (use 'I')
                              </label>
                              <textarea
                                id="star-action-input"
                                value={starAction}
                                onChange={(e) => setStarAction(e.target.value)}
                                placeholder="E.g., I implemented standard exponential backoff retries, decoupled read queries using replicas, and..."
                                rows={2}
                                className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none resize-none font-sans"
                              />
                            </div>

                            <div>
                              <label htmlFor="star-result-input" className="block text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider mb-1">
                                [R] Result — Quantify the Outcome
                              </label>
                              <textarea
                                id="star-result-input"
                                value={starResult}
                                onChange={(e) => setStarResult(e.target.value)}
                                placeholder="E.g., Eliminated latency spikes, recovered DB within 4 minutes, and achieved 100% successful checkout..."
                                rows={2}
                                className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none resize-none font-sans"
                              />
                            </div>

                            <button
                              id="star-evaluate-submit-btn"
                              onClick={handleEvaluateSTAR}
                              disabled={isEvaluatingStar}
                              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                              {isEvaluatingStar ? (
                                <>
                                  <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin"></div>
                                  <span>Analyzing STAR Draft...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-3.5 w-3.5" />
                                  <span>Evaluate & Optimize STAR Story</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Evaluation Response Panel */}
                          <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 space-y-4 flex flex-col justify-between min-h-[300px]">
                            {starEvaluation ? (
                              <div className="space-y-4 text-xs">
                                <div>
                                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-indigo-400">Story Score/Verdict</span>
                                  <div className="text-white font-bold text-sm flex items-center gap-1.5 mt-0.5">
                                    <Award className="h-4.5 w-4.5 text-indigo-400" />
                                    <span>{starEvaluation.overallRating}</span>
                                  </div>
                                </div>

                                <div className="space-y-2.5 pt-2 border-t border-slate-900">
                                  <div>
                                    <span className="text-[9px] font-mono uppercase font-bold text-slate-500">S/T Components Feedback:</span>
                                    <p className="text-slate-300 mt-0.5 leading-relaxed">
                                      {starEvaluation.critiqueSituation} {starEvaluation.critiqueTask}
                                    </p>
                                  </div>

                                  <div>
                                    <span className="text-[9px] font-mono uppercase font-bold text-slate-500">Action (A) Feedback:</span>
                                    <p className="text-slate-300 mt-0.5 leading-relaxed">
                                      {starEvaluation.critiqueAction}
                                    </p>
                                  </div>

                                  <div>
                                    <span className="text-[9px] font-mono uppercase font-bold text-indigo-400">Result (R) Metrics Assessment:</span>
                                    <p className="text-slate-300 mt-0.5 leading-relaxed">
                                      {starEvaluation.critiqueResult}
                                    </p>
                                  </div>
                                </div>

                                <div className="pt-3 border-t border-slate-900 bg-slate-900/30 p-3 rounded-lg border border-slate-900/50">
                                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 block mb-1">👑 Premium Expert Story Rewrite:</span>
                                  <p className="text-slate-200 italic font-sans leading-relaxed text-[11px] mb-3">
                                    {starEvaluation.expertModelStory}
                                  </p>
                                  
                                  <div className="flex flex-col sm:flex-row gap-2">
                                    <button
                                      type="button"
                                      id="copy-star-story-builder-btn"
                                      onClick={() => handleCopyToClipboard(starEvaluation.expertModelStory)}
                                      className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-bold border border-slate-800/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                      <Copy className="h-3.5 w-3.5 text-slate-400" />
                                      <span>Copy Story</span>
                                    </button>
                                    
                                    <button
                                      type="button"
                                      id="save-story-to-bank-btn"
                                      onClick={() => handleSaveSTARStory(starEvaluation.expertModelStory)}
                                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-50 active:scale-[0.98] text-white hover:text-emerald-950 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950/25"
                                    >
                                      <Bookmark className="h-3.5 w-3.5" />
                                      <span>Save to Bank</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="my-auto text-center p-6 space-y-3">
                                <FileText className="h-10 w-10 text-slate-600 mx-auto opacity-50" />
                                <div>
                                  <h5 className="text-xs font-bold text-slate-300 font-display">Evaluation Waiting</h5>
                                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed mt-1">
                                    Fill out Situation, Task, Action, and Result on the left, then click submit to receive a constructive analysis and high-impact rewrite!
                                  </p>
                                </div>
                              </div>
                            )}

                            {starEvaluation && (
                              <button
                                id="clear-star-sheet-btn"
                                onClick={() => {
                                  setStarSituation("");
                                  setStarTask("");
                                  setStarAction("");
                                  setStarResult("");
                                  setStarEvaluation(null);
                                }}
                                className="text-[10px] text-slate-500 hover:text-slate-300 font-mono self-start cursor-pointer"
                              >
                                ✕ Reset Story Builder
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {resourceActiveTab === "roadmap" && (
                      <motion.div
                        key="roadmap"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <div className="bg-slate-950 border border-slate-850 rounded-xl p-4">
                          <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 font-mono uppercase tracking-wider mb-1">
                            <Compass className="h-4 w-4" />
                            <span>Targeted Skill Practice Roadmaps</span>
                          </h4>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            These tailored suggestions focus precisely on the core competencies extracted from your targeted role: 
                            <strong> {analysis?.skills?.join(", ") || "General Engineering"}</strong>. Follow the resources below to practice and master each area.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Skill Cards */}
                          {analysis?.skills?.map((skill, index) => {
                            let link = "https://roadmap.sh";
                            let description = "Review interactive paths and community learning guidelines for modern technology stacks.";
                            
                            const skLower = skill.toLowerCase();
                            if (skLower.includes("react")) {
                              link = "https://react.dev";
                              description = "Practice component life-cycle, rendering optimizations, state selectors, and concurrent React hooks.";
                            } else if (skLower.includes("typescript") || skLower.includes("javascript")) {
                              link = "https://developer.mozilla.org/en-US/docs/Web/JavaScript";
                              description = "Learn asynchronous patterns, prototypical scopes, memory profiling, closures, and structural interfaces.";
                            } else if (skLower.includes("system design") || skLower.includes("architecture")) {
                              link = "https://github.com/donnemartin/system-design-primer";
                              description = "Master database scaling, proxy caching, load balancing, CAP Theorem compromises, and consistency models.";
                            } else if (skLower.includes("node")) {
                              link = "https://nodejs.org/docs";
                              description = "Deep dive into Event Loop, thread pools, streams buffer handling, package dependencies, and cluster mode.";
                            } else if (skLower.includes("sql") || skLower.includes("postgres") || skLower.includes("nosql")) {
                              link = "https://roadmap.sh/postgresql-database";
                              description = "Practice transaction isolations, indexing strategies (B-Tree, GIN), query execution plans, and normalization.";
                            } else if (skLower.includes("aws") || skLower.includes("gcp") || skLower.includes("cloud") || skLower.includes("kubernetes") || skLower.includes("docker")) {
                              link = "https://roadmap.sh/devops";
                              description = "Focus on container lifecycles, load balancers, deployment targets, secure cloud architecture, and observability.";
                            } else if (skLower.includes("python")) {
                              link = "https://docs.python.org/3/";
                              description = "Explore generator pipelines, multi-threading GIL constraints, list comprehensions, and framework integrations.";
                            } else if (skLower.includes("agile") || skLower.includes("communication") || skLower.includes("product") || skLower.includes("behavioral")) {
                              link = "https://www.techinterviewhandbook.org/behavioral-interview/";
                              description = "Study standard leadership principles, collaborative conflict resolutions, and STAR-guided mock scenarios.";
                            }

                            return (
                              <div key={index} className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-3 hover:border-slate-800 transition-all">
                                <div className="flex justify-between items-center">
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/10 font-mono">
                                    {skill}
                                  </span>
                                  <a
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                                    title={`View verified official resources for ${skill}`}
                                  >
                                    <span>Learn Official Docs</span>
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                  {description}
                                </p>
                              </div>
                            );
                          })}
                        </div>

                        {/* Top General Practice platforms */}
                        <div className="bg-slate-950 border border-slate-850 rounded-xl p-4.5 space-y-3">
                          <h5 className="text-xs font-bold text-white font-display">🎖️ Universal Practice Foundations</h5>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <a
                              href="https://neetcode.io"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-slate-900 border border-slate-850 hover:border-indigo-500/35 p-3 rounded-lg text-center transition-all group cursor-pointer"
                            >
                              <span className="block text-[11px] font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">NeetCode Practice</span>
                              <span className="text-[9px] text-slate-500 block mt-0.5">Algorithm preparation</span>
                            </a>
                            <a
                              href="https://www.techinterviewhandbook.org"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-slate-900 border border-slate-850 hover:border-indigo-500/35 p-3 rounded-lg text-center transition-all group cursor-pointer"
                            >
                              <span className="block text-[11px] font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">Tech Interview Hb</span>
                              <span className="text-[9px] text-slate-500 block mt-0.5">Resume & Guide prep</span>
                            </a>
                            <a
                              href="https://roadmap.sh"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-slate-900 border border-slate-850 hover:border-indigo-500/35 p-3 rounded-lg text-center transition-all group cursor-pointer"
                            >
                              <span className="block text-[11px] font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">Roadmap.sh</span>
                              <span className="text-[9px] text-slate-500 block mt-0.5">Step-by-step tracks</span>
                            </a>
                            <a
                              href="https://leetcode.com"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-slate-900 border border-slate-850 hover:border-indigo-500/35 p-3 rounded-lg text-center transition-all group cursor-pointer"
                            >
                              <span className="block text-[11px] font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">LeetCode Code</span>
                              <span className="text-[9px] text-slate-500 block mt-0.5">Mock coding challenges</span>
                            </a>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {resourceActiveTab === "cheatsheets" && (
                      <motion.div
                        key="cheatsheets"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <div className="bg-slate-950 border border-slate-850 rounded-xl p-4">
                          <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 font-mono uppercase tracking-wider mb-1">
                            <FileText className="h-4 w-4" />
                            <span>Engineering Interview Quick Reference Cheat-Sheets</span>
                          </h4>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            These curated, high-density reference cards provide core technical structures and communication patterns needed to stand out during high-stakes evaluations.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Card 1: System Design Framework */}
                          <div className="bg-slate-950 border border-slate-850 rounded-xl p-4.5 space-y-3">
                            <h5 className="text-xs font-bold text-white flex items-center gap-1.5 font-display">
                              <span className="text-indigo-400 font-mono">01.</span>
                              <span>System Design Pattern</span>
                            </h5>
                            <div className="text-[11px] text-slate-400 space-y-2 font-mono">
                              <div>
                                <span className="text-indigo-300 block font-bold uppercase text-[9px] font-sans">Step A: Scope & Requirements</span>
                                <span>Define active users, peak QPS, ingress read-write ratio, and latency constraints.</span>
                              </div>
                              <div>
                                <span className="text-indigo-300 block font-bold uppercase text-[9px] font-sans">Step B: High-Level Diagram</span>
                                <span>DNS → Load Balancer → API Gateway → App Clusters → Cache Layer → Database.</span>
                              </div>
                              <div>
                                <span className="text-indigo-300 block font-bold uppercase text-[9px] font-sans">Step C: Core Scalability Deep-Dive</span>
                                <span>Address DB replication, sharding keys, cache stampede prevention, rate limiters, and queue decoupling.</span>
                              </div>
                            </div>
                          </div>

                          {/* Card 2: Behavioral STAR Formulary */}
                          <div className="bg-slate-950 border border-slate-850 rounded-xl p-4.5 space-y-3">
                            <h5 className="text-xs font-bold text-white flex items-center gap-1.5 font-display">
                              <span className="text-indigo-400 font-mono">02.</span>
                              <span>STAR Framework Rules</span>
                            </h5>
                            <div className="text-[11px] text-slate-400 space-y-2">
                              <div>
                                <span className="text-indigo-300 block font-bold uppercase text-[9px] font-mono">The Hook (15%)</span>
                                <span>Briefly introduce the high-impact problem (e.g. "We faced a $12k server overflow risk").</span>
                              </div>
                              <div>
                                <span className="text-indigo-300 block font-bold uppercase text-[9px] font-mono">My Action (65%)</span>
                                <span>Emphasize your individual task ownership. Discuss trade-offs and alternative choices.</span>
                              </div>
                              <div>
                                <span className="text-indigo-300 block font-bold uppercase text-[9px] font-mono">Quantifiable Results (20%)</span>
                                <span>Conclude with specific numbers (e.g. "which reduced latency by 35% and saved 120 engineering hours").</span>
                              </div>
                            </div>
                          </div>

                          {/* Card 3: Soft-skills & Presence Checklist */}
                          <div className="bg-slate-950 border border-slate-850 rounded-xl p-4.5 space-y-3">
                            <h5 className="text-xs font-bold text-white flex items-center gap-1.5 font-display">
                              <span className="text-indigo-400 font-mono">03.</span>
                              <span>Vocal & Presence Checklist</span>
                            </h5>
                            <div className="text-[11px] text-slate-400 space-y-2">
                              <div>
                                <span className="text-indigo-300 block font-bold uppercase text-[9px] font-mono">🍃 Human Tone Modulation</span>
                                <span>Maintain a slow, deliberate speed (0.90x-0.95x) with conversational pitches to avoid sounding robotic.</span>
                              </div>
                              <div>
                                <span className="text-indigo-300 block font-bold uppercase text-[9px] font-mono">🧠 Collaborative Reasoning</span>
                                <span>Think out loud. Engage the interviewer by saying "Let's first clarify constraints before we design".</span>
                              </div>
                              <div>
                                <span className="text-indigo-300 block font-bold uppercase text-[9px] font-mono">🚧 Humility & Trade-offs</span>
                                <span>Acknowledge that no solution is perfect. Always mention downsides, profiling costs, or alternate stacks.</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {resourceActiveTab === "answer_bank" && (
                      <motion.div
                        key="answer_bank"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <div className="bg-slate-950 border border-slate-850 rounded-xl p-4">
                          <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 font-mono uppercase tracking-wider mb-1">
                            <Award className="h-4 w-4" />
                            <span>My Polished STAR Story Answer Bank</span>
                          </h4>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            A curated locker of your personal behavioral interview stories, optimized using our server-side Gemini intelligence and structured for immediate recall.
                          </p>
                        </div>

                        {savedStarStories.length === 0 ? (
                          <div className="text-center py-12 bg-slate-950/40 border border-slate-850/60 rounded-xl space-y-3">
                            <span className="text-2xl block">👑</span>
                            <h5 className="text-sm font-semibold text-slate-300">Your Answer Bank is Empty</h5>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                              To save a story here, navigate to the <strong>STAR Story Builder</strong> tab above, write down your Situation, Task, Action, and Result, hit Evaluate, and click "Save to My Answer Bank"!
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-4">
                            {savedStarStories.map((story) => (
                              <div
                                key={story.id}
                                className="bg-slate-950 border border-slate-850 rounded-xl p-5 relative space-y-4 group animate-fade-in"
                              >
                                {/* Header with details & delete */}
                                <div className="flex justify-between items-start gap-4">
                                  <div>
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 font-mono">Saved Story</span>
                                    <h5 className="font-semibold text-sm text-white font-display mt-0.5">{story.role}</h5>
                                    <span className="text-[10px] text-slate-500 font-mono block mt-1">{story.company} • {story.timestamp}</span>
                                  </div>
                                  <button
                                    id={`delete-story-${story.id}`}
                                    onClick={() => handleDeleteSTARStory(story.id)}
                                    className="p-1.5 bg-slate-900 border border-slate-850 rounded-lg hover:border-red-500/20 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer bg-transparent"
                                    title="Delete story"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>

                                {/* Core fields grid */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900/40 p-3 rounded-lg border border-slate-850/40 text-[11px] leading-relaxed">
                                  <div>
                                    <span className="block font-bold text-indigo-300 font-mono uppercase text-[9px] mb-1">[S] Situation</span>
                                    <span className="text-slate-400 line-clamp-3">{story.situation}</span>
                                  </div>
                                  <div>
                                    <span className="block font-bold text-indigo-300 font-mono uppercase text-[9px] mb-1">[T] Task</span>
                                    <span className="text-slate-400 line-clamp-3">{story.task}</span>
                                  </div>
                                  <div>
                                    <span className="block font-bold text-indigo-300 font-mono uppercase text-[9px] mb-1">[A] Action</span>
                                    <span className="text-slate-400 line-clamp-3">{story.action}</span>
                                  </div>
                                  <div>
                                    <span className="block font-bold text-indigo-300 font-mono uppercase text-[9px] mb-1">[R] Result</span>
                                    <span className="text-slate-400 line-clamp-3">{story.result}</span>
                                  </div>
                                </div>

                                {/* Gemini Polished Story Block */}
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 font-mono">
                                      <Sparkles className="h-4 w-4 animate-pulse" />
                                      <span>Gemini Optimized Professional Answer:</span>
                                    </div>
                                    <button
                                      type="button"
                                      id={`copy-star-story-btn-${story.id}`}
                                      onClick={() => handleCopyToClipboard(story.expertStory)}
                                      className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-slate-200 transition-colors py-1 px-2.5 bg-slate-900 hover:bg-slate-850 rounded-lg border border-slate-800/80 cursor-pointer"
                                      title="Copy optimized text"
                                    >
                                      <Copy className="h-3 w-3" />
                                      <span>Copy Story</span>
                                    </button>
                                  </div>
                                  <div className="p-3.5 bg-emerald-950/15 border border-emerald-900/30 rounded-lg text-slate-200 text-xs leading-relaxed font-sans select-all whitespace-pre-wrap">
                                    {story.expertStory}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Continuous Practice Mastery Panel (Bento) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      <RotateCcw className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white font-display">Infinite Practice Sandbox</h4>
                      <p className="text-xs text-slate-400">Perfect your skills by retaking this exam or practicing with brand-new, dynamically generated questions.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
                    {/* Option 1: Retake same interview */}
                    <button
                      id="feedback-retake-btn"
                      onClick={handleRetakeSameQuestions}
                      className="group p-4 rounded-xl bg-slate-950 hover:bg-indigo-950/20 border border-slate-850 hover:border-indigo-500/40 text-left transition-all cursor-pointer"
                    >
                      <h5 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors flex items-center gap-1.5 font-display">
                        <span>🔄 Retake This Interview</span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                      </h5>
                      <p className="text-[11px] text-slate-400 mt-1">Keep the exact same 5 questions and attempt them again to implement critique feedback.</p>
                    </button>

                    {/* Option 2: Generate brand new questions */}
                    <button
                      id="feedback-regenerate-btn"
                      onClick={handleRegenerateNewQuestions}
                      disabled={isAnalyzing}
                      className="group p-4 rounded-xl bg-slate-950 hover:bg-indigo-950/20 border border-slate-850 hover:border-indigo-500/40 text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <h5 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors flex items-center gap-1.5 font-display">
                        {isAnalyzing ? (
                          <>
                            <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <span>✨ Fresh Job-Ready Questions</span>
                            <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                          </>
                        )}
                      </h5>
                      <p className="text-[11px] text-slate-400 mt-1">Generate a completely different set of 5 questions for this identical Job Description and role.</p>
                    </button>

                    {/* Option 3: Reset completely */}
                    <button
                      id="feedback-reset-different-btn"
                      onClick={handleReset}
                      className="group p-4 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-700 text-left transition-all cursor-pointer"
                    >
                      <h5 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors flex items-center gap-1.5 font-display">
                        <span>🏢 Configure New Role</span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                      </h5>
                      <p className="text-[11px] text-slate-400 mt-1">Go back to the start to paste a new Job Description or choose a different template.</p>
                    </button>
                  </div>
                </div>

                {/* Section Action Trigger */}
                <div className="bg-gradient-to-br from-indigo-900/30 via-indigo-950/20 to-slate-950 border border-indigo-500/20 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="text-center md:text-left">
                    <h4 className="text-sm font-bold text-white font-display">Ready for detailed mastery?</h4>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1">
                      Hop into our interactive Coaching Sandbox. You can practice individual questions again to see improved ratings, or ask for general tips on any technical/behavioral subject!
                    </p>
                  </div>
                  
                  <button
                    id="goto-coaching-main-btn"
                    onClick={() => handleGoToCoaching()}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Award className="h-4 w-4" />
                    <span>Open Coaching Engine</span>
                  </button>
                </div>

              </div>
            ) : (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
                Failed to obtain analysis report. Please reset and try again.
              </div>
            )}

          </div>
        )}

        {/* PHASE 4: COACHING ENGINE */}
        {phase === "PHASE4_COACHING" && (
          <div className="space-y-6">
            
            {/* Header / Intro Bento Box */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 font-mono">Expert Coach Sandboxing</span>
                <h2 className="text-xl md:text-2xl font-bold text-white font-display mt-0.5">Custom Coaching & Refinement</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {evaluation && (
                  <button
                    id="back-to-report-btn"
                    onClick={() => setPhase("PHASE3_FEEDBACK")}
                    className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/25 text-indigo-300 rounded-xl border border-indigo-500/20 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Back to Report</span>
                  </button>
                )}
                <button
                  id="coaching-retake-btn"
                  onClick={handleRetakeSameQuestions}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-850 text-slate-300 rounded-xl border border-slate-850 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Retake Interview</span>
                </button>
                <button
                  id="reset-coaching-flow-btn"
                  onClick={handleReset}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-850 text-slate-300 rounded-xl border border-slate-850 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>New Role / JD</span>
                </button>
              </div>
            </div>

            {/* Sandbox Setup Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Settings & Input Card (Bento 1) */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between gap-6">
                <div>
                  <h3 className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-4 font-mono">Coaching Dashboard</h3>
                  
                  {/* Select Mode */}
                  <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-950 p-1 rounded-xl border border-slate-850">
                    <button
                      id="mode-practice-btn"
                      onClick={() => {
                        setCoachingMode("practice");
                        setCoachingData(null);
                        setCoachingInput("");
                      }}
                      className={`py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        coachingMode === "practice" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Practice Question Again</span>
                    </button>
                    <button
                      id="mode-tips-btn"
                      onClick={() => {
                        setCoachingMode("tips");
                        setCoachingData(null);
                        setCoachingInput("");
                      }}
                      className={`py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        coachingMode === "tips" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                      <span>Get Subject Area Tips</span>
                    </button>
                  </div>

                  {/* Mode-specific configurations */}
                  {coachingMode === "practice" ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2 font-mono">Select Target Question to Retry</label>
                        <select
                          id="target-question-select"
                          value={selectedCoachingQuestion}
                          onChange={(e) => {
                            setSelectedCoachingQuestion(e.target.value);
                            setCoachingData(null);
                            setCoachingInput("");
                          }}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        >
                          {analysis?.questions?.map((q, idx) => (
                            <option key={idx} value={q.text}>
                              Q{idx + 1}: {q.text.slice(0, 65)}...
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedCoachingQuestion && (
                        <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-xs text-slate-400">
                          <span className="block font-bold text-slate-500 uppercase tracking-wide mb-1 font-mono">Original Question Details:</span>
                          "{selectedCoachingQuestion}"
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2 font-mono">Your New/Improved Response</label>
                        <div className="relative">
                          <textarea
                            id="coaching-practice-textarea"
                            rows={6}
                            placeholder={isListening && speechTarget === "coaching" ? "Listening continuously... Start speaking now. You can also edit your text directly in this box at any time." : "Re-write your response incorporating the critique and recommendation from before..."}
                            value={coachingInput}
                            onChange={(e) => setCoachingInput(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 pr-24 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed placeholder-slate-600 resize-none"
                          />
                          <div className="absolute bottom-3 right-3">
                            <button
                              id="mic-coaching-practice-btn"
                              type="button"
                              onClick={() => toggleListening("coaching")}
                              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-[9px] font-bold uppercase transition-all tracking-wider shadow ${
                                isListening && speechTarget === "coaching"
                                  ? "bg-rose-600 text-white hover:bg-rose-700 animate-pulse" 
                                  : micUnavailable 
                                  ? "bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed opacity-50" 
                                  : "bg-slate-900 hover:bg-slate-850 border border-slate-800 text-indigo-400 hover:text-indigo-300"
                              }`}
                              title={isListening && speechTarget === "coaching" ? "Stop voice capture" : "Dictate response (Speech-to-Text)"}
                              disabled={micUnavailable}
                            >
                              {isListening && speechTarget === "coaching" ? (
                                <>
                                  <MicOff className="h-3 w-3" />
                                  <span>Stop Mic</span>
                                </>
                              ) : (
                                <>
                                  <Mic className="h-3 w-3" />
                                  <span>Dictate</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2 font-mono">Specify Subject / Topic Area</label>
                        <div className="relative">
                          <textarea
                            id="coaching-tips-textarea"
                            rows={6}
                            placeholder={isListening && speechTarget === "coaching" ? "Listening continuously... Start speaking now. You can also edit your text directly in this box at any time." : "e.g. 'How should I structure my answer to highly critical security architecture questions?' or 'What are the main concepts to focus on for system design at Netflix?'"}
                            value={coachingInput}
                            onChange={(e) => setCoachingInput(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 pr-24 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed placeholder-slate-600 resize-none"
                          />
                          <div className="absolute bottom-3 right-3">
                            <button
                              id="mic-coaching-tips-btn"
                              type="button"
                              onClick={() => toggleListening("coaching")}
                              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-[9px] font-bold uppercase transition-all tracking-wider shadow ${
                                isListening && speechTarget === "coaching"
                                  ? "bg-rose-600 text-white hover:bg-rose-700 animate-pulse" 
                                  : micUnavailable 
                                  ? "bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed opacity-50" 
                                  : "bg-slate-900 hover:bg-slate-850 border border-slate-800 text-indigo-400 hover:text-indigo-300"
                              }`}
                              title={isListening && speechTarget === "coaching" ? "Stop voice capture" : "Dictate question (Speech-to-Text)"}
                              disabled={micUnavailable}
                            >
                              {isListening && speechTarget === "coaching" ? (
                                <>
                                  <MicOff className="h-3 w-3" />
                                  <span>Stop Mic</span>
                                </>
                              ) : (
                                <>
                                  <Mic className="h-3 w-3" />
                                  <span>Dictate</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  id="coaching-submit-btn"
                  onClick={handleSubmitCoaching}
                  disabled={isCoachingLoading || !coachingInput.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow shadow-indigo-600/15 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isCoachingLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-mono text-xs tracking-wider uppercase">Generating Custom Guidelines...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>{coachingMode === "practice" ? "Analyze New Answer" : "Get Topic Strategy"}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Right Output Card (Bento 2) */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between gap-6 relative min-h-[360px]">
                {isCoachingLoading ? (
                  <div className="flex-grow flex flex-col justify-center items-center text-center space-y-4 py-12">
                    <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs text-slate-500 font-mono">Retrieving optimal framework templates...</p>
                  </div>
                ) : coachingSuccess && coachingData ? (
                  <div className="space-y-4 flex-grow flex flex-col justify-between">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-emerald-400 text-[10px] uppercase font-bold tracking-widest mb-1.5 font-mono">Expert Coach Assessment</h4>
                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 border border-slate-850 p-4 rounded-xl font-mono text-[11px]">
                          {coachingData.feedback}
                        </p>
                      </div>

                      <div className="pt-2">
                        <h4 className="text-indigo-400 text-[10px] uppercase font-bold tracking-widest mb-1.5 font-mono">Template Framework Recommendation</h4>
                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 border border-slate-850 p-4 rounded-xl leading-relaxed">
                          {coachingData.modelAnswerSuggestion}
                        </p>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 border-t border-slate-850 pt-3 font-mono">
                      Feedback aligned dynamically to targeted JD spec standards.
                    </div>
                  </div>
                ) : (
                  <div className="flex-grow flex flex-col justify-center items-center text-center p-6 space-y-4">
                    <BookOpen className="h-12 w-12 text-slate-700" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 font-display">Sandbox Response Pending</h4>
                      <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-1 leading-normal">
                        Submit a response or question in the left panel. The Recruiter Coach will review it and generate structured feedback guidelines.
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-6 px-6 text-center text-xs text-slate-500 font-mono flex flex-col sm:flex-row justify-between items-center gap-4 max-w-7xl w-full mx-auto">
        <p>© 2026 Recruiter AI Coach. Grounded by suchit chavhan</p>
        <p className="text-[10px] uppercase tracking-wider text-indigo-500/80">Offline State Persistence Configured</p>
      </footer>
    </div>
  );
}
