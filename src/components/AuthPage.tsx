import React, { useState } from "react";
import { apiFetch } from "../lib/api";
import { 
  Sparkles, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Check, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Briefcase, 
  Cpu, 
  FileCheck, 
  Award, 
  TrendingUp, 
  AlertCircle,
  Chrome,
  Github,
  Linkedin,
  ArrowRight,
  Inbox,
  KeyRound,
  Upload
} from "lucide-react";

export const COUNTRY_CODES = [
  { code: "+1", country: "US/CA", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+91", country: "IN", flag: "🇮🇳" },
  { code: "+61", country: "AU", flag: "🇦🇺" },
  { code: "+49", country: "DE", flag: "🇩🇪" },
  { code: "+33", country: "FR", flag: "🇫🇷" },
  { code: "+81", country: "JP", flag: "🇯🇵" },
  { code: "+86", country: "CN", flag: "🇨🇳" },
  { code: "+55", country: "BR", flag: "🇧🇷" },
  { code: "+27", country: "ZA", flag: "🇿🇦" },
  { code: "+7", country: "RU", flag: "🇷🇺" },
  { code: "+65", country: "SG", flag: "🇸🇬" },
  { code: "+971", country: "AE", flag: "🇦🇪" }
];

interface AuthPageProps {
  onLoginSuccess: (user: any) => void;
  showNotification: (msg: string, type: "success" | "error" | "info") => void;
}

export default function AuthPage({ onLoginSuccess, showNotification }: AuthPageProps) {
  const [view, setView] = useState<"login" | "register" | "forgot" | "reset">("login");
  
  // Registration States
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regCountryCode, setRegCountryCode] = useState("+1");
  const [regPhoneNo, setRegPhoneNo] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // Custom photo upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showNotification("Image size must be less than 2MB.", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setRegPhoto(reader.result);
          showNotification("Custom profile picture uploaded successfully!", "success");
        }
      };
      reader.readAsDataURL(file);
    }
  };
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regPhoto, setRegPhoto] = useState("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [regErrors, setRegErrors] = useState<string[]>([]);
  const [regAdminKey, setRegAdminKey] = useState("");

  // Login States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginAdminKey, setLoginAdminKey] = useState("");

  // Forgot / Reset States
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState("");

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unverifiedUser, setUnverifiedUser] = useState<any>(null);
  const [registeredPassword, setRegisteredPassword] = useState("");

  // Instant verify & log in helper
  const handleInstantVerifyAndLogin = async () => {
    if (!unverifiedUser || !unverifiedUser.verificationLink) return;
    setIsLoading(true);
    try {
      // Extract token from verification link (e.g., /api/verify-email?token=...)
      const url = new URL(unverifiedUser.verificationLink, window.location.origin);
      const token = url.searchParams.get("token");
      
      if (!token) {
        throw new Error("Could not extract verification token.");
      }

      // 1. Silent background verification
      const verifyRes = await apiFetch(`/api/verify-email?token=${token}`);
      if (!verifyRes.ok) {
        throw new Error("Verification failed. Please try manual log in.");
      }

      showNotification("Email verified instantly! Logging you in...", "success");

      // 2. Perform auto-login using the saved password
      const loginRes = await apiFetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: unverifiedUser.email,
          password: registeredPassword || loginPassword,
          adminKey: loginAdminKey
        })
      });

      const data = await loginRes.json();
      if (!loginRes.ok) {
        throw new Error(data.error || "Auto-login failed. Please enter password manually.");
      }

      setUnverifiedUser(null);
      showNotification(`Welcome back, ${data.user.fullName}!`, "success");
      onLoginSuccess(data.user);

    } catch (err: any) {
      showNotification(err.message || "Instant verification failed.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Password rules validation
  const validatePasswordStrength = (pwd: string) => {
    const errors: string[] = [];
    if (pwd.length < 8) errors.push("Minimum 8 characters required");
    if (!/[A-Z]/.test(pwd)) errors.push("At least one uppercase letter (A-Z) required");
    if (!/[a-z]/.test(pwd)) errors.push("At least one lowercase letter (a-z) required");
    if (!/[0-9]/.test(pwd)) errors.push("At least one numerical digit (0-9) required");
    if (!/[^A-Za-z0-9]/.test(pwd)) errors.push("At least one special character (@, $, !, %, etc.) required");
    return errors;
  };

  // Submit Handler: Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegErrors([]);

    const pwdErrors = validatePasswordStrength(regPassword);
    if (pwdErrors.length > 0) {
      setRegErrors(pwdErrors);
      showNotification("Please satisfy all password safety requirements.", "error");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegErrors(["Passwords do not match."]);
      showNotification("Passwords must match.", "error");
      return;
    }

    if (!agreeTerms) {
      setRegErrors(["You must agree to the Terms and Conditions."]);
      showNotification("Agreement to terms is mandatory.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiFetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: regName,
          email: regEmail,
          phoneNumber: `${regCountryCode} ${regPhoneNo}`.trim(),
          password: regPassword,
          confirmPassword: regConfirmPassword,
          profilePhoto: regPhoto,
          agreeTerms,
          adminKey: regAdminKey
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed.");
      }

      showNotification("Account created successfully! Verification sent to inbox.", "success");
      setRegisteredPassword(regPassword);
      setUnverifiedUser({ email: regEmail, name: regName, verificationLink: data.verificationLink });
      setView("login");
      // Pre-fill login
      setLoginEmail(regEmail);
      setLoginPassword(regPassword);

    } catch (err: any) {
      setRegErrors([err.message || "An unexpected error occurred."]);
      showNotification(err.message || "Registration failed.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Handler: Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoading(true);

    try {
      const res = await apiFetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
          adminKey: loginAdminKey
        })
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.unverified) {
          setUnverifiedUser({ email: loginEmail });
          throw new Error("Unverified Email. Please complete registration by verifying your email first.");
        }
        throw new Error(data.error || "Invalid credentials.");
      }

      showNotification(`Welcome back, ${data.user.fullName}!`, "success");
      onLoginSuccess(data.user);

    } catch (err: any) {
      setLoginError(err.message);
      showNotification(err.message || "Login failed.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Handler: Forgot
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSuccessMsg("");
    setIsLoading(true);

    try {
      const res = await apiFetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset request failed.");

      if (data.resetToken) {
        setResetToken(data.resetToken);
        setForgotSuccessMsg("A password reset token has been processed. Since you are in a sandbox environment, we have automatically pre-filled the Reset Token for you below!");
      } else {
        setForgotSuccessMsg("A password reset token has been processed. Copy verification details from server console if in local sandbox.");
      }
      showNotification("Reset instructions compiled.", "success");
      setView("reset");

    } catch (err: any) {
      showNotification(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Handler: Reset
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetPassword !== resetConfirmPassword) {
      showNotification("Passwords do not match.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiFetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: resetToken,
          password: resetPassword,
          confirmPassword: resetConfirmPassword
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password.");

      showNotification("Password updated successfully! Please log in.", "success");
      setView("login");
      setLoginPassword("");

    } catch (err: any) {
      showNotification(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Pre-configured avatar emojis/photos
  const avatars = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120",
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120"
  ];

  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-4 sm:p-6 lg:p-8 select-none font-sans overflow-x-hidden">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 bg-[#111827]/40 border border-[#27272A] rounded-[32px] overflow-hidden backdrop-blur-xl shadow-2xl p-4 sm:p-8">
        
        {/* Left Column: Visual Illustration and Features SaaS Column */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-8 p-6 lg:p-8 bg-gradient-to-br from-[#1E1B4B]/70 to-[#0F172A]/80 border border-[#27272A]/50 rounded-[24px]">
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
                <Sparkles className="h-4.5 w-4.5 animate-pulse" />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest font-mono text-violet-400">Recruiter AI Coach</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
                Prepare for your <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">Dream Job</span>
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Enterprise-grade technical simulations, custom mock assessments, and interactive coaching loops validated by real FAANG hiring standards.
              </p>
            </div>

            {/* Feature lists */}
            <div className="space-y-4 pt-2">
              <div className="flex gap-3 items-start">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                  <Cpu className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">AI Interviews</h4>
                  <p className="text-[10.5px] text-slate-400 leading-relaxed mt-0.5">Interactive speech-to-text live chat simulated by expert technical personas.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <span className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
                  <FileCheck className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">ATS Scanner & Resume Review</h4>
                  <p className="text-[10.5px] text-slate-400 leading-relaxed mt-0.5">Instantly evaluate and score resume match rates with tailored improvements.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <span className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
                  <Award className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Mock Interviews & Progress Tracking</h4>
                  <p className="text-[10.5px] text-slate-400 leading-relaxed mt-0.5">Log every simulation scorecard and behavioral Answer Bank securely.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#27272A]/60 pt-6">
            <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-[#27272A]/30">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Enterprise Security Layer</span>
              </div>
              <span className="text-[9px] font-mono text-violet-400 uppercase">JWT + HTTP Only</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Registration & Login Panels */}
        <div className="lg:col-span-7 flex flex-col justify-center p-2 sm:p-6">
          
          {/* VERIFICATION SPECIAL ASSISTANCE BANNER */}
          {unverifiedUser && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3.5 text-xs font-sans">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Inbox className="h-4 w-4" />
                <span>Verification Assistance Outbox</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                We processed a registration token for <strong>{unverifiedUser.email}</strong>. 
                Since this application is running in an AI Studio sandboxed container environment, 
                you can verify your email address immediately by clicking the button below!
              </p>
              {unverifiedUser.verificationLink ? (
                <div className="pt-0.5 flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={handleInstantVerifyAndLogin}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all text-xs cursor-pointer shadow-md shadow-violet-500/10 hover:shadow-violet-500/20 disabled:opacity-50"
                  >
                    <span>Verify & Log In Instantly</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <a
                    href={unverifiedUser.verificationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#27272A] hover:bg-[#3F3F46] text-slate-300 font-bold rounded-xl transition-all text-xs cursor-pointer border border-[#3F3F46]"
                  >
                    <span>Open Link in New Tab</span>
                  </a>
                </div>
              ) : (
                <p className="text-slate-400 text-[10px] italic">
                  Note: You can also inspect the server console logs to find the link.
                </p>
              )}
            </div>
          )}

          {/* VIEW 1: LOGIN */}
          {view === "login" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Access Your Suite</h2>
                <p className="text-xs text-slate-400 mt-1">Provide your credentials below or continue with enterprise federations.</p>
              </div>

              {loginError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex gap-2.5 items-start text-[11px] text-rose-400 font-mono">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      className="w-full bg-[#09090B] border border-[#27272A] text-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs focus:outline-none focus:border-violet-500 font-sans"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Password</label>
                    <button
                      type="button"
                      onClick={() => setView("forgot")}
                      className="text-[10px] text-violet-400 hover:text-violet-300 uppercase font-mono tracking-wider focus:outline-none cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      className="w-full bg-[#09090B] border border-[#27272A] text-slate-200 rounded-xl py-3 pl-10 pr-10 text-xs focus:outline-none focus:border-violet-500 font-sans"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-violet-400" />
                    <span>Admin Access Key (Optional)</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="password"
                      placeholder="Required only for administrator role"
                      className="w-full bg-[#09090B] border border-[#27272A] text-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs focus:outline-none focus:border-violet-500 font-sans"
                      value={loginAdminKey}
                      onChange={(e) => setLoginAdminKey(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-[#27272A] bg-[#09090B] text-violet-600 focus:ring-violet-500 focus:ring-offset-0 h-4 w-4"
                    />
                    <span className="text-[11px] text-slate-400 font-sans">Remember me for 30 days</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-violet-500/15 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? "Validating Session..." : "Sign In to Dashboard"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-[#27272A]"></div>
                <span className="flex-shrink mx-4 text-[10px] text-slate-500 uppercase font-mono tracking-widest">or continue with</span>
                <div className="flex-grow border-t border-[#27272A]"></div>
              </div>

              {/* Social Login buttons */}
              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => showNotification("Social Login integrated securely in development.", "info")}
                  className="flex justify-center items-center py-2.5 border border-[#27272A] bg-[#09090B] rounded-xl hover:bg-slate-900 transition-colors cursor-pointer text-slate-300"
                >
                  <Chrome className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => showNotification("Social Login integrated securely in development.", "info")}
                  className="flex justify-center items-center py-2.5 border border-[#27272A] bg-[#09090B] rounded-xl hover:bg-slate-900 transition-colors cursor-pointer text-slate-300"
                >
                  <Github className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => showNotification("Social Login integrated securely in development.", "info")}
                  className="flex justify-center items-center py-2.5 border border-[#27272A] bg-[#09090B] rounded-xl hover:bg-slate-900 transition-colors cursor-pointer text-slate-300"
                >
                  <Linkedin className="h-4 w-4" />
                </button>
              </div>

              <div className="text-center text-xs">
                <span className="text-slate-500">Don't have an account? </span>
                <button
                  onClick={() => { setView("register"); setLoginError(""); }}
                  className="text-violet-400 hover:text-violet-300 font-bold focus:outline-none cursor-pointer"
                >
                  Register
                </button>
              </div>
            </div>
          )}

          {/* VIEW 2: REGISTER */}
          {view === "register" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Create Enterprise Account</h2>
                <p className="text-xs text-slate-400 mt-1">Prepare your technical assessments with robust Cloud backup.</p>
              </div>

              {regErrors.length > 0 && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1 text-[11px] text-rose-400 font-mono">
                  {regErrors.map((err, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        className="w-full bg-[#09090B] border border-[#27272A] text-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs focus:outline-none focus:border-violet-500 font-sans"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        className="w-full bg-[#09090B] border border-[#27272A] text-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs focus:outline-none focus:border-violet-500 font-sans"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Phone Number</label>
                    <div className="flex gap-2">
                      <div className="relative w-28 shrink-0">
                        <select
                          className="w-full h-full bg-[#09090B] border border-[#27272A] text-slate-200 rounded-xl py-3 px-2 text-xs focus:outline-none focus:border-violet-500 appearance-none font-sans cursor-pointer"
                          value={regCountryCode}
                          onChange={(e) => setRegCountryCode(e.target.value)}
                        >
                          {COUNTRY_CODES.map((item) => (
                            <option key={item.code} value={item.code} className="bg-[#09090B] text-slate-200">
                              {item.flag} {item.code}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-500">
                          <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                          </svg>
                        </div>
                      </div>
                      <div className="relative flex-1">
                        <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                        <input
                          type="text"
                          required
                          placeholder="(555) 019-2834"
                          className="w-full bg-[#09090B] border border-[#27272A] text-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs focus:outline-none focus:border-violet-500 font-sans"
                          value={regPhoneNo}
                          onChange={(e) => setRegPhoneNo(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Profile Picture Avatar</label>
                    <div className="flex items-center gap-3 bg-[#09090B] border border-[#27272A] rounded-xl p-1.5">
                      <img src={regPhoto} alt="Avatar" className="w-9 h-9 rounded-lg object-cover bg-slate-800" />
                      <div className="flex gap-1.5 items-center flex-wrap">
                        {avatars.map((av, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setRegPhoto(av)}
                            className={`w-7.5 h-7.5 rounded-lg overflow-hidden border cursor-pointer transition-all ${regPhoto === av ? "border-violet-500 scale-105" : "border-[#27272A] hover:border-slate-500"}`}
                          >
                            <img src={av} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                        <label className="w-7.5 h-7.5 rounded-lg border border-dashed border-violet-500 hover:border-violet-400 bg-violet-600/10 hover:bg-violet-600/20 flex items-center justify-center cursor-pointer transition-all shrink-0">
                          <Upload className="h-3.5 w-3.5 text-violet-400" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoUpload}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        className="w-full bg-[#09090B] border border-[#27272A] text-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs focus:outline-none focus:border-violet-500 font-sans"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        className="w-full bg-[#09090B] border border-[#27272A] text-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs focus:outline-none focus:border-violet-500 font-sans"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-violet-400" />
                    <span>Admin Access Key (Optional)</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="password"
                      placeholder="Required only for administrator role"
                      className="w-full bg-[#09090B] border border-[#27272A] text-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs focus:outline-none focus:border-violet-500 font-sans"
                      value={regAdminKey}
                      onChange={(e) => setRegAdminKey(e.target.value)}
                    />
                  </div>
                </div>

                {/* Requirements check dynamically */}
                <div className="bg-[#09090B]/50 border border-[#27272A] rounded-xl p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[9px] font-mono">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className={`w-1.5 h-1.5 rounded-full ${regPassword.length >= 8 ? "bg-emerald-400" : "bg-slate-700"}`} />
                    <span>8+ Characters</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(regPassword) ? "bg-emerald-400" : "bg-slate-700"}`} />
                    <span>Uppercase (A-Z)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className={`w-1.5 h-1.5 rounded-full ${/[a-z]/.test(regPassword) ? "bg-emerald-400" : "bg-slate-700"}`} />
                    <span>Lowercase (a-z)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(regPassword) ? "bg-emerald-400" : "bg-slate-700"}`} />
                    <span>Numerical Digit</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className={`w-1.5 h-1.5 rounded-full ${/[^A-Za-z0-9]/.test(regPassword) ? "bg-emerald-400" : "bg-slate-700"}`} />
                    <span>Special Character</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className={`w-1.5 h-1.5 rounded-full ${regPassword && regPassword === regConfirmPassword ? "bg-emerald-400" : "bg-slate-700"}`} />
                    <span>Passwords Match</span>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="rounded border-[#27272A] bg-[#09090B] text-violet-600 focus:ring-violet-500 focus:ring-offset-0 h-4 w-4"
                  />
                  <span className="text-[10.5px] text-slate-400 font-sans">
                    I agree to terms, conditions, and strict data telemetry logs.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors shadow-lg shadow-violet-500/15 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? "Creating Account..." : "Create Free Coach Account"}
                </button>
              </form>

              <div className="text-center text-xs border-t border-[#27272A]/50 pt-3">
                <span className="text-slate-500">Already have an account? </span>
                <button
                  onClick={() => { setView("login"); setRegErrors([]); }}
                  className="text-violet-400 hover:text-violet-300 font-bold focus:outline-none cursor-pointer"
                >
                  Login
                </button>
              </div>
            </div>
          )}

          {/* VIEW 3: FORGOT PASSWORD */}
          {view === "forgot" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Forgot Password</h2>
                <p className="text-xs text-slate-400 mt-1">Provide your registered email to process reset instructions.</p>
              </div>

              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      className="w-full bg-[#09090B] border border-[#27272A] text-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs focus:outline-none"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  {isLoading ? "Processing..." : "Generate Reset Token"}
                </button>
              </form>

              <div className="text-center text-xs">
                <button
                  onClick={() => setView("login")}
                  className="text-slate-400 hover:text-slate-200 font-bold focus:outline-none cursor-pointer"
                >
                  Back to Login
                </button>
              </div>
            </div>
          )}

          {/* VIEW 4: RESET PASSWORD */}
          {view === "reset" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Set New Password</h2>
                <p className="text-xs text-slate-400 mt-1">Verify your token and configure your new secure credentials.</p>
              </div>

              {forgotSuccessMsg && (
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-400 font-mono rounded-xl leading-relaxed">
                  {forgotSuccessMsg}
                </div>
              )}

              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Reset Token</label>
                  <input
                    type="text"
                    required
                    placeholder="reset-xxxxxxx"
                    className="w-full bg-[#09090B] border border-[#27272A] text-slate-200 rounded-xl py-3 px-4 text-xs focus:outline-none focus:border-violet-500 font-mono"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">New Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      className="w-full bg-[#09090B] border border-[#27272A] text-slate-200 rounded-xl py-3 px-4 text-xs focus:outline-none focus:border-violet-500"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      className="w-full bg-[#09090B] border border-[#27272A] text-slate-200 rounded-xl py-3 px-4 text-xs focus:outline-none focus:border-violet-500"
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  {isLoading ? "Saving Credentials..." : "Reset Password & Login"}
                </button>
              </form>

              <div className="text-center text-xs">
                <button
                  onClick={() => setView("login")}
                  className="text-slate-400 hover:text-slate-200 font-bold focus:outline-none cursor-pointer"
                >
                  Cancel and Back to Login
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
