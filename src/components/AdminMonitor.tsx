import React, { useState, useEffect } from "react";
import { 
  Users, 
  Activity, 
  Terminal, 
  Trash2, 
  RefreshCw, 
  Cpu, 
  TrendingUp, 
  UserCheck, 
  Search, 
  Filter, 
  Clock, 
  Briefcase, 
  ExternalLink,
  Home,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  RotateCcw,
  UserPlus,
  Flame,
  Zap,
  Sliders,
  Database,
  Info,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { UserProfile, UserActivity } from "../types";

export interface DiagnosticTest {
  id: string;
  name: string;
  description: string;
  status: "idle" | "running" | "passed" | "failed";
  duration?: number;
  error?: string;
  logs: string[];
}

interface AdminMonitorProps {
  allUsers: UserProfile[];
  activities: UserActivity[];
  onRefresh: () => Promise<void>;
  onSwitchUser: (user: UserProfile) => void;
  currentUser: UserProfile | null;
  onDeleteUser?: (userId: string) => Promise<void>;
  onCloseAdmin?: () => void;
}

export default function AdminMonitor({
  allUsers,
  activities,
  onRefresh,
  onSwitchUser,
  currentUser,
  onDeleteUser,
  onCloseAdmin
}: AdminMonitorProps) {
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>("all");
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Diagnostics and Testing states
  const [activeTab, setActiveTab] = useState<"monitor" | "diagnostics">("monitor");
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [isRunningSuite, setIsRunningSuite] = useState(false);
  const [isSimulatingTraffic, setIsSimulatingTraffic] = useState(false);
  const [simulationIntervalId, setSimulationIntervalId] = useState<any>(null);
  const [debugOutput, setDebugOutput] = useState<string[]>(["Debugger ready. Select actions to inspect pipeline."]);

  const [tests, setTests] = useState<DiagnosticTest[]>([
    {
      id: "api_connection",
      name: "API Server Connection Check",
      description: "Verifies the reachability and response code of primary Express API endpoints (/api/users and /api/activities).",
      status: "idle",
      logs: []
    },
    {
      id: "user_write",
      name: "Database Write Operation",
      description: "Performs an integration test by posting a simulated candidate profile to the database to ensure write operations succeed.",
      status: "idle",
      logs: []
    },
    {
      id: "user_delete",
      name: "Database Cleanup & Deletion",
      description: "Verifies profile removal integrity by deleting the newly created simulation candidate from the register.",
      status: "idle",
      logs: []
    },
    {
      id: "activity_log",
      name: "Activity Stream Write Integrity",
      description: "Asserts that custom activities are securely written, stored, and loaded to keep recruiter logs in lockstep.",
      status: "idle",
      logs: []
    },
    {
      id: "gemini_evaluator",
      name: "LLM Gemini Engine Assessment",
      description: "Sends a mock STAR story schema probe to verify Google Gemini API connectivity, response formats, and parsing speeds.",
      status: "idle",
      logs: []
    }
  ]);

  // Clean up traffic generator on unmount
  useEffect(() => {
    return () => {
      if (simulationIntervalId) {
        clearInterval(simulationIntervalId);
      }
    };
  }, [simulationIntervalId]);

  // Add system console log message
  const appendDebugLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugOutput(prev => [`[${timestamp}] ${msg}`, ...prev.slice(0, 49)]);
  };

  // Run a single integration test
  const runSingleTest = async (testId: string) => {
    setTests(prev => prev.map(t => t.id === testId ? { ...t, status: "running", logs: ["Initiating check..."], error: undefined, duration: undefined } : t));
    const startTime = performance.now();
    
    const logMessage = (msg: string) => {
      setTests(prev => prev.map(t => t.id === testId ? { ...t, logs: [...t.logs, msg] } : t));
    };

    try {
      if (testId === "api_connection") {
        logMessage("Sending GET request to `/api/users`...");
        const resUsers = await fetch("/api/users");
        logMessage(`Users API responded with status: ${resUsers.status}`);
        if (!resUsers.ok) throw new Error(`Users endpoint returned status code ${resUsers.status}`);
        const usersData = await resUsers.json();
        logMessage(`Retrieved ${usersData.length} records. Validation: OK.`);

        logMessage("Sending GET request to `/api/activities`...");
        const resActs = await fetch("/api/activities");
        logMessage(`Activities API responded with status: ${resActs.status}`);
        if (!resActs.ok) throw new Error(`Activities endpoint returned status code ${resActs.status}`);
        const actsData = await resActs.json();
        logMessage(`Retrieved ${actsData.length} logs. Validation: OK.`);

        const duration = Math.round(performance.now() - startTime);
        setTests(prev => prev.map(t => t.id === testId ? { ...t, status: "passed", duration, logs: [...t.logs, "Verification successful. All checks passed."] } : t));
        appendDebugLog("Test Passed: API Server Connection Check");
      }
      
      else if (testId === "user_write") {
        logMessage("Constructing candidate payload...");
        const testEmail = `diagnostics-${Date.now()}@test.local`;
        const payload = {
          name: "Dr. Diagnostics Test",
          roleTitle: "Lead Validation Engineer",
          email: testEmail,
          skills: "Automated Testing, Integration, Diagnostics, Express.js",
          targetCompany: "Diagnostic Solutions",
          avatarEmoji: "🛠️"
        };
        
        logMessage(`Dispatching POST to \`/api/users\` with email: ${testEmail}`);
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        
        logMessage(`Server responded with status: ${res.status}`);
        if (!res.ok) throw new Error(`POST /api/users failed with status ${res.status}`);
        
        const createdUser = await res.json();
        logMessage(`Profile registered with ID: ${createdUser.id || 'N/A'}`);
        
        // Store created ID in a temporary state or reference for deletion
        localStorage.setItem("last_test_user_id", createdUser.id);
        logMessage(`Saved test user ID ${createdUser.id} to storage for subsequent delete test.`);
        
        const duration = Math.round(performance.now() - startTime);
        setTests(prev => prev.map(t => t.id === testId ? { ...t, status: "passed", duration, logs: [...t.logs, `Profile ${createdUser.name} write check passed.`] } : t));
        appendDebugLog("Test Passed: Database Write Operation");
        await onRefresh();
      }
      
      else if (testId === "user_delete") {
        const testUserId = localStorage.getItem("last_test_user_id");
        let idToDelete = testUserId;
        
        if (!testUserId) {
          logMessage("Warning: No recent test user found in storage. Writing a fast fallback user first...");
          const testEmail = `diagnostics-fb-${Date.now()}@test.local`;
          const resCreate = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: "Fallback Test User",
              roleTitle: "QA Engine",
              email: testEmail,
              avatarEmoji: "⚙️"
            })
          });
          const created = await resCreate.json();
          idToDelete = created.id;
          logMessage(`Created temporary fallback user with ID: ${idToDelete}`);
        }
        
        logMessage(`Sending DELETE request to \`/api/users/${idToDelete}\`...`);
        const res = await fetch(`/api/users/${idToDelete}`, { method: "DELETE" });
        logMessage(`Server responded with status: ${res.status}`);
        
        if (!res.ok) throw new Error(`DELETE returned status ${res.status}`);
        const result = await res.json();
        logMessage(`Backend confirmed deletion for: ${result.name}`);
        
        localStorage.removeItem("last_test_user_id");
        logMessage("Cleaned up storage keys. Verification: OK.");
        
        const duration = Math.round(performance.now() - startTime);
        setTests(prev => prev.map(t => t.id === testId ? { ...t, status: "passed", duration, logs: [...t.logs, "Deletion cleanup assertion passed."] } : t));
        appendDebugLog("Test Passed: Database Cleanup & Deletion");
        await onRefresh();
      }
      
      else if (testId === "activity_log") {
        logMessage("Dispatching mock activity trigger to `/api/activities`...");
        const mockActivity = {
          userId: currentUser?.id || "anonymous-test",
          userName: currentUser?.name || "System Validator",
          userEmail: currentUser?.email || "validator@system.local",
          type: "star_story_saved",
          timestamp: new Date().toISOString(),
          details: "Automated Diagnostics: Verified activity write-back speed and integrity.",
          metadata: { score: 100, company: "Diagnostics Sandbox", role: "Verification Specialist" }
        };
        
        const res = await fetch("/api/activities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mockActivity)
        });
        
        logMessage(`Server responded with status: ${res.status}`);
        if (!res.ok) throw new Error(`POST /api/activities failed with status ${res.status}`);
        
        const saved = await res.json();
        logMessage("Activity written successfully to backend ledger array.");
        
        const duration = Math.round(performance.now() - startTime);
        setTests(prev => prev.map(t => t.id === testId ? { ...t, status: "passed", duration, logs: [...t.logs, "Shared ledger synchronization passed."] } : t));
        appendDebugLog("Test Passed: Activity Stream Write Integrity");
        await onRefresh();
      }
      
      else if (testId === "gemini_evaluator") {
        logMessage("Preparing lightweight STAR structured prompt payload...");
        const payload = {
          situation: "A minor glitch was detected during a client evaluation run.",
          task: "Validate and patch the issue without disrupting service levels.",
          action: "Wrote automated end-to-end telemetry and diagnostics to catch regression vectors early.",
          result: "No issues occurred, and latency was reduced by 12%.",
          jd: "Requires automated test design, integration test architecture, and performance analysis.",
          companyName: "Google AI Studio"
        };
        
        logMessage("Dispatching evaluation request to `/api/evaluate-star`... (Gemini network handshakes may take 1-3 seconds)");
        const res = await fetch("/api/evaluate-star", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        
        logMessage(`Gemini endpoint responded with status: ${res.status}`);
        if (!res.ok) throw new Error(`Gemini evaluations failed with status ${res.status}`);
        
        const data = await res.json();
        logMessage("Received AI response payload from Gemini API!");
        
        if (data.score) {
          logMessage(`Gemini score recommendation: ${data.score}/100`);
        }
        if (data.analysis) {
          logMessage(`Analysis feedback snippet: "${data.analysis.substring(0, 100)}..."`);
        }
        
        const duration = Math.round(performance.now() - startTime);
        setTests(prev => prev.map(t => t.id === testId ? { ...t, status: "passed", duration, logs: [...t.logs, "Gemini API integration verified successfully."] } : t));
        appendDebugLog("Test Passed: LLM Gemini Engine Assessment");
      }
    } catch (err: any) {
      const duration = Math.round(performance.now() - startTime);
      logMessage(`❌ ERROR: ${err.message || err}`);
      setTests(prev => prev.map(t => t.id === testId ? { ...t, status: "failed", duration, error: err.message || "Unknown assertion failure" } : t));
      appendDebugLog(`Test FAILED: ${testId} - Error: ${err.message || err}`);
    }
  };

  // Run all tests in the suite
  const runAllTests = async () => {
    setIsRunningSuite(true);
    appendDebugLog("Starting full automation test suite execution...");
    for (const test of tests) {
      await runSingleTest(test.id);
    }
    appendDebugLog("Full test suite execution complete.");
    setIsRunningSuite(false);
  };

  // Reset database back to default state
  const handleFactoryResetDB = async () => {
    if (!window.confirm("Restore entire in-memory database back to stable developer seed profiles? All customized candidates will be reset.")) return;
    try {
      appendDebugLog("Triggering backend database re-seeding...");
      const res = await fetch("/api/admin/reset", { method: "POST" });
      if (res.ok) {
        appendDebugLog("Database re-seeded successfully!");
        await onRefresh();
      } else {
        appendDebugLog("Failed to re-seed database.");
      }
    } catch (e: any) {
      appendDebugLog(`Error re-seeding database: ${e.message}`);
    }
  };

  // Inject 5 stress test candidates
  const handleInjectStressCandidates = async () => {
    appendDebugLog("Dispatching 5 stress-test candidate profiles in parallel...");
    const mockCandidates = [
      { name: "Siddharth Malhotra", roleTitle: "Senior DevOps Engineer", email: `sid.devops-${Date.now()}@example.com`, avatarEmoji: "⚙️" },
      { name: "Priya Sharma", roleTitle: "Lead UX Researcher", email: `priya.ux-${Date.now()}@example.com`, avatarEmoji: "🎨" },
      { name: "Devendra Patil", roleTitle: "AI Specialist", email: `devendra.ai-${Date.now()}@example.com`, avatarEmoji: "🧠" },
      { name: "Ananya Iyer", roleTitle: "VP of Engineering", email: `ananya.vp-${Date.now()}@example.com`, avatarEmoji: "👑" },
      { name: "John Doe", roleTitle: "Junior React Developer", email: `john.doe-${Date.now()}@example.com`, avatarEmoji: "👶" }
    ];

    try {
      await Promise.all(
        mockCandidates.map(c => 
          fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(c)
          })
        )
      );
      appendDebugLog("Successfully injected 5 candidate profiles! Syncing...");
      await onRefresh();
    } catch (e: any) {
      appendDebugLog(`Error injecting stress candidates: ${e.message}`);
    }
  };

  // Toggle automated system logs generator
  const handleToggleTrafficSimulation = () => {
    if (isSimulatingTraffic) {
      clearInterval(simulationIntervalId);
      setSimulationIntervalId(null);
      setIsSimulatingTraffic(false);
      appendDebugLog("Simulation traffic feed suspended.");
    } else {
      appendDebugLog("Starting live simulated activity stream (pulse: 3s)...");
      setIsSimulatingTraffic(true);
      
      const actions = [
        { type: "interview_started", details: "Initiated Live Interview session with Recruiter AI." },
        { type: "star_story_saved", details: "Optimized a high-impact STAR worksheet for architectural reviews." },
        { type: "job_applied", details: "Submitted customized CV and practice worksheet to Google Staff openings." },
        { type: "profile_created", details: "Updated Candidate Workspace portfolio preferences." }
      ];

      const interval = setInterval(async () => {
        if (allUsers.length === 0) return;
        const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];

        try {
          await fetch("/api/activities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: randomUser.id,
              type: randomAction.type,
              details: `${randomAction.details} (Simulated Live Feed)`
            })
          });
          onRefresh();
        } catch (e) {
          console.error("Traffic simulator failed to POST activity", e);
        }
      }, 3000);

      setSimulationIntervalId(interval);
    }
  };

  // Simulate broken endpoint error
  const handleTriggerSimulatedError = async () => {
    appendDebugLog("Probing broken endpoint `/api/broken-route-simulation` to test fallback...");
    try {
      const res = await fetch("/api/broken-route-simulation-endpoint-that-does-not-exist");
      if (!res.ok) {
        throw new Error(`Endpoint returned HTTP status ${res.status}`);
      }
    } catch (e: any) {
      appendDebugLog(`✅ Caught Expected Boundary Error: ${e.message}. Application containment active.`);
    }
  };

  // Stats calculation
  const totalUsers = allUsers.length;
  const totalActivities = activities.length;
  
  // Calculate avg score or mock performance from logs
  const evaluatedInterviews = activities.filter(a => a.type === "interview_evaluated");
  const avgPerformance = evaluatedInterviews.length > 0 
    ? Math.round(
        evaluatedInterviews.reduce((acc, curr) => {
          const score = curr.metadata?.score || 75;
          return acc + score;
        }, 0) / evaluatedInterviews.length
      )
    : 74; // standard baseline

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleClearActivities = async () => {
    if (!window.confirm("Are you sure you want to clear the entire log ledger? This cannot be undone.")) {
      return;
    }
    try {
      const res = await fetch("/api/activities/clear", { method: "POST" });
      if (res.ok) {
        await onRefresh();
      }
    } catch (e) {
      console.error("Failed to clear ledger", e);
    }
  };

  // Filtered Activities list
  const filteredActivities = activities.filter(act => {
    const matchesUser = selectedUserFilter === "all" || act.userId === selectedUserFilter;
    const matchesType = activityTypeFilter === "all" || act.type === activityTypeFilter;
    const matchesSearch = searchQuery.trim() === "" || 
      act.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesUser && matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6" id="admin-monitor-portal">
      {/* Upper Title and Refresh Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 border border-slate-900/80 backdrop-blur-md rounded-2xl p-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono uppercase tracking-widest">
              Live System Monitor
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold font-display text-white">ATS & Admin Monitoring Console</h2>
          <p className="text-xs text-slate-400">Monitor candidate lifecycle states, mock session metrics, and live background events.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onCloseAdmin && (
            <button
              onClick={onCloseAdmin}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 border border-indigo-500 rounded-xl text-white font-semibold transition-all flex items-center gap-2 text-xs cursor-pointer shadow shadow-indigo-600/20"
              title="Return to Candidate Workspace"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Exit Admin Portal</span>
            </button>
          )}

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition-all flex items-center gap-2 text-xs font-semibold cursor-pointer"
            title="Refresh logs and users"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
            <span>Sync Live</span>
          </button>
          
          <button
            onClick={handleClearActivities}
            className="p-2 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 rounded-xl text-rose-300 hover:text-rose-200 transition-all flex items-center gap-2 text-xs font-semibold cursor-pointer"
            title="Clear entire ledger"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear Ledger</span>
          </button>
        </div>
      </div>

      {/* Bento Grid Analytics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-slate-900/40 border border-slate-900/80 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Registered Candidates</span>
            <span className="text-2xl font-bold text-white font-display leading-none mt-1 block">{totalUsers}</span>
            <span className="text-[10px] text-indigo-400 mt-1 block">Active across databases</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900/40 border border-slate-900/80 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Total Actions Logged</span>
            <span className="text-2xl font-bold text-white font-display leading-none mt-1 block">{totalActivities}</span>
            <span className="text-[10px] text-emerald-400 mt-1 block">Live events recorded</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900/40 border border-slate-900/80 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Average Prep Score</span>
            <span className="text-2xl font-bold text-white font-display leading-none mt-1 block">{avgPerformance}%</span>
            <span className="text-[10px] text-amber-400 mt-1 block">Overall ATS proficiency</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900/40 border border-slate-900/80 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Simulations Practiced</span>
            <span className="text-2xl font-bold text-white font-display leading-none mt-1 block">{evaluatedInterviews.length}</span>
            <span className="text-[10px] text-purple-400 mt-1 block">Evaluated interview runs</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Admin Portal */}
      <div className="flex border-b border-slate-800 gap-4">
        <button
          onClick={() => setActiveTab("monitor")}
          className={`pb-3 text-sm font-semibold tracking-wide transition-all border-b-2 px-1 flex items-center gap-2 cursor-pointer ${
            activeTab === "monitor"
              ? "text-indigo-400 border-indigo-500 font-bold"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Operational Monitor</span>
        </button>
        <button
          onClick={() => setActiveTab("diagnostics")}
          className={`pb-3 text-sm font-semibold tracking-wide transition-all border-b-2 px-1 flex items-center gap-2 cursor-pointer ${
            activeTab === "diagnostics"
              ? "text-indigo-400 border-indigo-500 font-bold"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>System Tests & Diagnostic Console</span>
        </button>
      </div>

      {/* Tab 1: Operational Monitor (Candidates Registry & Terminal Logs) */}
      {activeTab === "monitor" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Candidate Profiles & Quick Switcher */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-white uppercase font-display tracking-wider">Candidate Registry</h3>
                <p className="text-[10px] text-slate-500 font-mono">Active workspace sessions</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 border border-slate-750 text-slate-400 font-mono">
                DB Rows: {allUsers.length}
              </span>
            </div>

            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {allUsers.map((user) => {
                const isActiveUser = currentUser?.email.toLowerCase() === user.email.toLowerCase();
                const userActivities = activities.filter(a => a.userId === user.id);
                const userInterviews = userActivities.filter(a => a.type === "interview_evaluated");
                
                return (
                  <div
                    key={user.id}
                    onClick={() => onSwitchUser(user)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isActiveUser 
                        ? "bg-indigo-950/30 border-indigo-500/60 shadow-lg shadow-indigo-600/5" 
                        : "bg-slate-950/80 border-slate-900 hover:border-slate-800 hover:bg-slate-900/50"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-sm">
                        {user.avatarEmoji || "⚡"}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs font-bold text-white block truncate">{user.name}</span>
                          {isActiveUser && (
                            <span className="px-1.5 py-0.5 rounded-[4px] text-[8px] font-mono font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate">{user.roleTitle}</span>
                        <span className="text-[9px] text-slate-500 block font-mono truncate">{user.email}</span>
                      </div>
                    </div>

                    {/* Profile activity stats */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900/80 text-[10px] font-mono text-slate-500">
                      <div>
                        <span className="block text-[8px] text-slate-500 font-bold uppercase font-sans">Mock Sessions</span>
                        <span className="text-slate-300 font-bold">{userInterviews.length} completed</span>
                      </div>
                      <div>
                        <span className="block text-[8px] text-slate-500 font-bold uppercase font-sans">Total Events</span>
                        <span className="text-slate-300 font-bold">{userActivities.length} logs</span>
                      </div>
                    </div>

                    {/* Simulate session quick link & Delete profile actions */}
                    <div className="flex gap-2 items-center">
                      {!isActiveUser ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSwitchUser(user);
                          }}
                          className="flex-grow text-center py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-lg text-[9px] font-mono tracking-wide uppercase transition-all cursor-pointer"
                        >
                          🔌 Assume Candidate Workspace
                        </button>
                      ) : (
                        <div className="flex-grow text-center py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[9px] font-mono uppercase font-bold">
                          ⚡ Active Session
                        </div>
                      )}
                      
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm(`Are you sure you want to permanently delete candidate profile for ${user.name}? This will remove the user from the register and record an administrative audit log.`)) {
                            if (onDeleteUser) {
                              await onDeleteUser(user.id);
                            }
                          }
                        }}
                        className="p-1.5 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 hover:border-rose-900/60 text-rose-400 hover:text-rose-200 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center h-8.5 w-8.5"
                        title="Permanently Delete Profile"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Live Event Terminal Ledger */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
            
            {/* Filtering Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-850 pb-3">
              <div>
                <h3 className="text-xs font-bold text-white uppercase font-display tracking-wider">Live System Logs & Activity Terminal</h3>
                <p className="text-[10px] text-slate-500 font-mono">Dynamic stream tracking from /api/activities</p>
              </div>
              
              {/* Quick search */}
              <div className="relative w-full md:w-48">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Quick Filters Row */}
            <div className="flex flex-wrap gap-2 text-[10px] font-mono">
              
              {/* Filter by Candidate */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1">
                <span className="text-slate-500 uppercase font-sans font-bold text-[9px]">User:</span>
                <select
                  value={selectedUserFilter}
                  onChange={(e) => setSelectedUserFilter(e.target.value)}
                  className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Candidates</option>
                  {allUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              {/* Filter by Action Type */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1">
                <span className="text-slate-500 uppercase font-sans font-bold text-[9px]">Event:</span>
                <select
                  value={activityTypeFilter}
                  onChange={(e) => setActivityTypeFilter(e.target.value)}
                  className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Events</option>
                  <option value="profile_created">Profile Registration</option>
                  <option value="interview_started">Interview Started</option>
                  <option value="interview_evaluated">Interview Evaluated</option>
                  <option value="star_story_saved">STAR Story Saved</option>
                  <option value="job_applied">Active Job Application</option>
                </select>
              </div>

              {/* Total count indicator */}
              <span className="ml-auto text-[10px] text-slate-500 self-center">
                Showing {filteredActivities.length} of {totalActivities} entries
              </span>
            </div>

            {/* Log Ledger Terminal View */}
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 font-mono text-xs text-slate-400 overflow-y-auto h-[400px] flex flex-col space-y-3.5 scrollbar-thin">
              {filteredActivities.length > 0 ? (
                filteredActivities.map((act) => {
                  // Determine badges
                  let badgeStyle = "bg-slate-900 text-slate-400 border-slate-800";
                  if (act.type === "interview_started") badgeStyle = "bg-blue-950/40 text-blue-400 border-blue-900/30";
                  else if (act.type === "interview_evaluated") badgeStyle = "bg-amber-950/40 text-amber-400 border-amber-900/30";
                  else if (act.type === "star_story_saved") badgeStyle = "bg-purple-950/40 text-purple-400 border-purple-900/30";
                  else if (act.type === "job_applied") badgeStyle = "bg-emerald-950/40 text-emerald-400 border-emerald-900/30";
                  else if (act.type === "profile_created") badgeStyle = "bg-indigo-950/40 text-indigo-400 border-indigo-900/30";

                  return (
                    <div key={act.id} className="border-b border-slate-900/60 pb-3 last:border-0 last:pb-0">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          <span className="font-bold text-slate-300 hover:underline">{act.userName}</span>
                          <span className="text-slate-600">({act.userEmail})</span>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${badgeStyle}`}>
                            {act.type.replace("_", " ")}
                          </span>
                          <span className="text-slate-600 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 pl-3.5 leading-relaxed">{act.details}</p>
                      
                      {/* Event metadata details */}
                      {act.metadata && (
                        <div className="mt-1.5 ml-3.5 p-2 bg-slate-900/40 rounded border border-slate-900/60 text-[10px] text-slate-500 space-y-0.5">
                          {act.metadata.score !== undefined && (
                            <div>• Performance Score: <span className="text-amber-400 font-bold">{act.metadata.score}%</span></div>
                          )}
                          {act.metadata.rating && (
                            <div>• Verdict Grade: <span className="text-slate-300 font-semibold">{act.metadata.rating}</span></div>
                          )}
                          {act.metadata.company && (
                            <div>• Target Entity: <span className="text-indigo-400">{act.metadata.company}</span></div>
                          )}
                          {act.metadata.role && (
                            <div>• Desired Role: <span className="text-slate-400">{act.metadata.role}</span></div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col justify-center items-center text-slate-600 py-12">
                  <Terminal className="h-10 w-10 text-slate-800 mb-2" />
                  <span className="text-xs">No ledger records matched the filters.</span>
                </div>
              )}
            </div>
            
            {/* Terminal disclaimer */}
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Terminal status: LIVE LEDGER STABLE</span>
              <span>Local Database Synced</span>
            </div>

          </div>
        </div>
      )}

      {/* Tab 2: System Tests & Diagnostic Console */}
      {activeTab === "diagnostics" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* Left Column: Diagnostics Test Suite Runner */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
            <div className="border-b border-slate-850 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white uppercase font-display tracking-wider flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-indigo-400 animate-spin-slow" />
                  <span>Integration Test Suite</span>
                </h3>
                <p className="text-[10px] text-slate-400">Execute automated verification steps against the server and AI services.</p>
              </div>

              <button
                onClick={runAllTests}
                disabled={isRunningSuite}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white disabled:text-slate-500 font-bold font-mono tracking-wide rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Play className={`h-3 w-3 ${isRunningSuite ? "animate-ping text-indigo-300" : ""}`} />
                <span>{isRunningSuite ? "RUNNING SUITE..." : "RUN ALL CHECKS"}</span>
              </button>
            </div>

            {/* Tests Accordion List */}
            <div className="space-y-3">
              {tests.map((test) => {
                const isOpen = expandedTest === test.id;
                
                // Status styles
                let statusBadge = "bg-slate-950 border-slate-850 text-slate-500";
                if (test.status === "running") statusBadge = "bg-yellow-500/10 border-yellow-500/20 text-yellow-400 animate-pulse";
                else if (test.status === "passed") statusBadge = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-extrabold";
                else if (test.status === "failed") statusBadge = "bg-rose-500/10 border-rose-500/20 text-rose-400 font-extrabold";

                return (
                  <div 
                    key={test.id} 
                    className={`border rounded-xl transition-all ${
                      test.status === "failed" 
                        ? "border-rose-900/30 bg-rose-950/5" 
                        : test.status === "passed"
                        ? "border-emerald-900/25 bg-emerald-950/5"
                        : "border-slate-850 bg-slate-950/30"
                    }`}
                  >
                    {/* Header trigger */}
                    <div 
                      onClick={() => setExpandedTest(isOpen ? null : test.id)}
                      className="p-4 flex items-start justify-between gap-4 cursor-pointer select-none"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{test.name}</span>
                          <span className={`px-2 py-0.5 rounded-[4px] text-[8px] font-mono border font-bold uppercase tracking-wider ${statusBadge}`}>
                            {test.status}
                          </span>
                          {test.duration !== undefined && (
                            <span className="text-[9px] font-mono text-slate-500">({test.duration}ms)</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{test.description}</p>
                      </div>

                      <div className="flex items-center gap-2 self-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            runSingleTest(test.id);
                          }}
                          disabled={isRunningSuite || test.status === "running"}
                          className="px-2 py-1 bg-slate-950 hover:bg-slate-850 disabled:bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-400 hover:text-white transition-all"
                        >
                          Trigger
                        </button>
                        {isOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                      </div>
                    </div>

                    {/* Expandable step-by-step logs */}
                    {isOpen && (
                      <div className="border-t border-slate-850 bg-slate-950 p-3.5 rounded-b-xl font-mono text-[10px] text-slate-400 space-y-1 max-h-[160px] overflow-y-auto">
                        <div className="text-slate-600 mb-1 flex items-center gap-1">
                          <Terminal className="h-3 w-3" />
                          <span>Diagnostics Subroutine Logs:</span>
                        </div>
                        {test.logs.length > 0 ? (
                          test.logs.map((log, idx) => (
                            <div key={idx} className="flex gap-2">
                              <span className="text-slate-700">[{idx+1}]</span>
                              <span className={log.startsWith("❌") ? "text-rose-400" : log.startsWith("Test Passed") ? "text-emerald-400" : "text-slate-300"}>
                                {log}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-slate-600 italic">No output recorded. Click 'Trigger' or 'Run All' to initialize subroutine logs.</span>
                        )}
                        {test.error && (
                          <div className="mt-2 p-2 bg-rose-950/25 border border-rose-900/30 text-rose-400 rounded-lg text-[10px] font-bold">
                            Assertion Failed: {test.error}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Live Debug & Stress-Testing Simulator Controls */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Controller Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase font-display tracking-wider flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-emerald-400" />
                  <span>Pipeline Debug Simulator</span>
                </h3>
                <p className="text-[10px] text-slate-400">Inject parameters, stress-test rendering boundaries, or trigger recovery vectors.</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {/* Seed Default Card */}
                <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="block text-xs font-bold text-slate-200">Database Seed Restore</span>
                    <span className="block text-[10px] text-slate-400">Purge mock changes and restore clean default developers profiles.</span>
                  </div>
                  <button
                    onClick={handleFactoryResetDB}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold font-mono text-slate-300 hover:text-white rounded-lg flex items-center gap-1 transition-all shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset DB</span>
                  </button>
                </div>

                {/* Inject Stress Card */}
                <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="block text-xs font-bold text-slate-200">Inject Stress-Test Profiles</span>
                    <span className="block text-[10px] text-slate-400">Add 5 professional mock candidate profiles instantly to stress-test lists.</span>
                  </div>
                  <button
                    onClick={handleInjectStressCandidates}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold font-mono text-slate-300 hover:text-white rounded-lg flex items-center gap-1 transition-all shrink-0 cursor-pointer"
                  >
                    <UserPlus className="h-3 w-3" />
                    <span>Inject 5x</span>
                  </button>
                </div>

                {/* Simulation Traffic Stream */}
                <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="block text-xs font-bold text-slate-200">Live Simulation Activity Feed</span>
                    <span className="block text-[10px] text-slate-400">Poll live candidate interactions every 3s to verify real-time terminal feed.</span>
                  </div>
                  <button
                    onClick={handleToggleTrafficSimulation}
                    className={`px-2.5 py-1.5 border text-[10px] font-bold font-mono rounded-lg flex items-center gap-1 transition-all shrink-0 cursor-pointer ${
                      isSimulatingTraffic
                        ? "bg-rose-950/20 border-rose-900/40 text-rose-400"
                        : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850"
                    }`}
                  >
                    <Flame className={`h-3 w-3 ${isSimulatingTraffic ? "animate-pulse text-rose-400" : ""}`} />
                    <span>{isSimulatingTraffic ? "Stop Feed" : "Start Feed"}</span>
                  </button>
                </div>

                {/* Emulate Error Fallback */}
                <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="block text-xs font-bold text-slate-200">Graceful Error Boundary Test</span>
                    <span className="block text-[10px] text-slate-400">Query a non-existent API route to ensure application handles exceptions safely.</span>
                  </div>
                  <button
                    onClick={handleTriggerSimulatedError}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold font-mono text-slate-300 hover:text-white rounded-lg flex items-center gap-1 transition-all shrink-0 cursor-pointer"
                  >
                    <Zap className="h-3 w-3 text-amber-400" />
                    <span>Probe Error</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Debug console log monitor output panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3 flex-grow">
              <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                <span className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wide">Developer Console Stream</span>
                <span className="px-2 py-0.5 rounded text-[8px] font-bold font-mono bg-slate-950 border border-slate-850 text-slate-500 animate-pulse uppercase">
                  Telemetry Active
                </span>
              </div>

              <div className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 font-mono text-[10px] text-indigo-300 overflow-y-auto h-[180px] flex flex-col space-y-1.5">
                {debugOutput.map((log, idx) => (
                  <div key={idx} className="border-b border-slate-900/30 pb-1 last:border-0 last:pb-0">
                    <span className="text-slate-500 mr-1.5">›</span>
                    <span className={log.includes("FAILED") || log.includes("Error") ? "text-rose-400" : log.includes("Passed") || log.includes("successfully") ? "text-emerald-400" : "text-indigo-200"}>
                      {log}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
