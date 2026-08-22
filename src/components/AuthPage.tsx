import React, { useState } from "react";
import { apiFetch } from "../lib/api";
import { 
  Sparkles, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Bot, 
  FileText, 
  TrendingUp, 
  AlertCircle,
  KeyRound,
  Upload,
  CheckCircle2,
  Shield,
  ArrowLeft,
  Loader2,
  Check
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
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regPhoto, setRegPhoto] = useState("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [regErrors, setRegErrors] = useState<string[]>([]);
  const [regAdminKey, setRegAdminKey] = useState("");
  const [showRegAdminKey, setShowRegAdminKey] = useState(false);

  // Login States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState("");
  const [loginAdminKey, setLoginAdminKey] = useState("");
  const [showAdminLogin, setShowAdminLogin] = useState(false);

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
          showNotification("Profile picture updated.", "success");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Instant verify & log in helper
  const handleInstantVerifyAndLogin = async () => {
    if (!unverifiedUser || !unverifiedUser.verificationLink) return;
    setIsLoading(true);
    try {
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

      showNotification("Email verified successfully! Logging you in...", "success");

      // 2. Perform auto-login using saved credentials
      const loginRes = await apiFetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: unverifiedUser.email,
          password: registeredPassword || loginPassword,
          adminKey: loginAdminKey
        })
      });

      const data = await loginRes.json().catch(() => ({}));
      if (!loginRes.ok) {
        const errMsg = data?.error?.message || data?.error || data?.message || "Auto-login failed. Please enter password manually.";
        throw new Error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg));
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

  // Password validation helper
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
      showNotification("Please satisfy all password security requirements.", "error");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegErrors(["Passwords do not match."]);
      showNotification("Passwords must match.", "error");
      return;
    }

    if (!agreeTerms) {
      setRegErrors(["You must agree to the Terms of Service and Privacy Policy."]);
      showNotification("Agreement to terms is required.", "error");
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

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg = data?.error?.message || data?.error || data?.message || "Registration failed.";
        throw new Error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg));
      }

      showNotification("Account created successfully! Verification link sent.", "success");
      setRegisteredPassword(regPassword);
      setUnverifiedUser({ email: regEmail, name: regName, verificationLink: data.verificationLink });
      setView("login");
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

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.unverified) {
          setUnverifiedUser({ email: loginEmail });
          throw new Error("Your email is unverified. Please verify your email before logging in.");
        }
        const errMsg = data?.error?.message || data?.error || data?.message || "Incorrect email or password.";
        throw new Error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg));
      }

      showNotification(`Welcome back, ${data.user.fullName}!`, "success");
      onLoginSuccess(data.user);

    } catch (err: any) {
      setLoginError(err.message);
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

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg = data?.error?.message || data?.error || data?.message || "Password reset request failed.";
        throw new Error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg));
      }

      if (data.resetToken) {
        setResetToken(data.resetToken);
        setForgotSuccessMsg("A password reset token has been issued. We have pre-filled it below for your convenience.");
      } else {
        setForgotSuccessMsg("Reset instructions have been sent to your email address.");
      }
      showNotification("Reset instructions generated.", "success");
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

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg = data?.error?.message || data?.error || data?.message || "Failed to reset password.";
        throw new Error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg));
      }

      showNotification("Password updated successfully. You can now sign in.", "success");
      setView("login");
      setLoginPassword("");

    } catch (err: any) {
      showNotification(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const presetAvatars = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120",
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120"
  ];

  return (
    <div className="min-h-screen w-full enterprise-auth-bg text-slate-900 flex flex-col justify-center items-center p-3 sm:p-5 md:p-6 lg:p-8 xl:p-10 font-sans antialiased">
      
      {/* Centered Master Layout: Auto-fitting responsive container */}
      <div className="w-full max-w-[1180px] my-auto enterprise-card overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* ========================================================================= */}
        {/* LEFT PANEL: ADAPTIVE BRAND & PRODUCT BENEFITS                             */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 enterprise-left-panel p-6 sm:p-8 md:p-10 lg:p-10 xl:p-12 flex flex-col justify-between border-b lg:border-b-0">
          
          {/* Top Branding & Main Headlines */}
          <div className="space-y-6 sm:space-y-8">
            
            {/* Logo & Product Badge */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="leading-tight">
                <div className="text-[12px] sm:text-[13px] font-bold tracking-wider text-slate-900 uppercase">
                  Recruiter AI
                </div>
                <div className="text-[10px] sm:text-[11px] font-semibold text-blue-600 tracking-widest uppercase">
                  Coach
                </div>
              </div>
            </div>

            {/* Main Headline */}
            <div className="space-y-2.5">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight leading-[1.15]">
                Prepare for your{" "}
                <span className="text-blue-600">Dream Job.</span>
              </h1>
              <p className="text-slate-600 text-sm sm:text-[15px] leading-relaxed max-w-[420px]">
                AI-powered interviews, resume intelligence, and personalized preparation built to help you perform at your best.
              </p>
            </div>

            {/* Product Benefits (3 Clean Rows) - Hidden on very compact mobile, visible on tablet/desktop */}
            <div className="space-y-4 pt-1 sm:pt-2">
              
              {/* Benefit 1 */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100/80 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900">
                    AI Interview Practice
                  </h3>
                  <p className="text-[12px] sm:text-[13px] text-slate-500 leading-snug">
                    Practice realistic technical and behavioral interviews.
                  </p>
                </div>
              </div>

              {/* Benefit 2 */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100/80 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900">
                    Resume Intelligence
                  </h3>
                  <p className="text-[12px] sm:text-[13px] text-slate-500 leading-snug">
                    Analyze your resume and improve ATS compatibility.
                  </p>
                </div>
              </div>

              {/* Benefit 3 */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100/80 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900">
                    Personalized Growth
                  </h3>
                  <p className="text-[12px] sm:text-[13px] text-slate-500 leading-snug">
                    Identify weak areas and build a focused preparation plan.
                  </p>
                </div>
              </div>

            </div>

          </div>

          {/* Bottom Trust Element */}
          <div className="pt-6 border-t border-slate-200/80 mt-6 lg:mt-8">
            <p className="text-xs text-slate-500 font-medium">
              Built for serious interview preparation.
            </p>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* RIGHT PANEL: PRIMARY AUTHENTICATION AREA                                  */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 p-6 sm:p-8 md:p-10 lg:p-10 xl:p-14 flex flex-col justify-center items-center bg-white">
          
          <div className="w-full max-w-[420px] space-y-5 sm:space-y-6">
            
            {/* Sandbox Verification Alert (If candidate registered) */}
            {unverifiedUser && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between text-amber-900 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Account Verification</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
                    Action Required
                  </span>
                </div>
                <p className="text-amber-800">
                  Verification link generated for <strong>{unverifiedUser.email}</strong>.
                </p>
                {unverifiedUser.verificationLink && (
                  <button
                    type="button"
                    onClick={handleInstantVerifyAndLogin}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    <span>Verify & Sign In</span>
                  </button>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* VIEW 1: SIGN IN (Default Form)                                */}
            {/* ------------------------------------------------------------- */}
            {view === "login" && (
              <div className="space-y-5 sm:space-y-6">
                
                {/* Header */}
                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    Welcome back
                  </h2>
                  <p className="text-sm sm:text-[15px] text-slate-500">
                    Sign in to continue to Recruiter AI Coach.
                  </p>
                </div>

                {/* Inline Error Message */}
                {loginError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
                    <span>{loginError}</span>
                  </div>
                )}

                {/* Main Login Form */}
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  
                  {/* Email Address */}
                  <div className="space-y-1.5">
                    <label 
                      htmlFor="login-email" 
                      className="block text-[13px] font-medium text-slate-700"
                    >
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-[16px] sm:top-[17px] h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        id="login-email"
                        type="email"
                        required
                        placeholder="you@example.com"
                        className="w-full enterprise-input h-[48px] sm:h-[50px] pl-10 pr-4 text-sm"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label 
                        htmlFor="login-password" 
                        className="block text-[13px] font-medium text-slate-700"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => { setView("forgot"); setLoginError(""); }}
                        className="text-[13px] text-blue-600 hover:text-blue-700 font-medium cursor-pointer transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-[16px] sm:top-[17px] h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Enter your password"
                        className="w-full enterprise-input h-[48px] sm:h-[50px] pl-10 pr-11 text-sm"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3.5 top-[15px] sm:top-[16px] text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center justify-between pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-[13px] text-slate-600">Remember me</span>
                    </label>

                    {/* Discrete Administrator Toggle */}
                    <button
                      type="button"
                      onClick={() => setShowAdminLogin(!showAdminLogin)}
                      className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                    >
                      {showAdminLogin ? "Candidate mode" : "Administrator login"}
                    </button>
                  </div>

                  {/* Optional Admin Key (Only revealed when explicitly requested) */}
                  {showAdminLogin && (
                    <div className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <label 
                        htmlFor="login-admin-key" 
                        className="block text-xs font-medium text-slate-700 flex items-center gap-1.5"
                      >
                        <KeyRound className="h-3.5 w-3.5 text-slate-500" />
                        <span>Administrator access key</span>
                      </label>
                      <input
                        id="login-admin-key"
                        type="password"
                        placeholder="Enter administrator key"
                        className="w-full enterprise-input h-[42px] px-3.5 text-xs"
                        value={loginAdminKey}
                        onChange={(e) => setLoginAdminKey(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Primary CTA Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full enterprise-primary-btn h-[48px] sm:h-[50px] text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-1 sm:mt-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <span>Sign in</span>
                    )}
                  </button>

                </form>

                {/* Bottom Registration Link */}
                <div className="text-center text-[13px] text-slate-600 pt-2 border-t border-slate-100">
                  <span>Don't have an account? </span>
                  <button
                    type="button"
                    onClick={() => { setView("register"); setLoginError(""); }}
                    className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer transition-colors"
                  >
                    Create account
                  </button>
                </div>

                {/* Security Trust Note */}
                <div className="flex items-center justify-center gap-1.5 pt-1 text-slate-400 text-xs text-center">
                  <Shield className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Your account is protected with secure authentication.</span>
                </div>

              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* VIEW 2: REGISTER                                              */}
            {/* ------------------------------------------------------------- */}
            {view === "register" && (
              <div className="space-y-4 sm:space-y-5">
                
                {/* Header */}
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Create your account
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Start preparing with personalized AI interview coaching.
                  </p>
                </div>

                {/* Registration Errors */}
                {regErrors.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-1 text-xs text-red-700">
                    {regErrors.map((err, idx) => (
                      <div key={idx} className="flex gap-1.5 items-start">
                        <span className="text-red-500 font-bold">•</span>
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  
                  {/* Full Name & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-slate-700">Full name</label>
                      <input
                        type="text"
                        required
                        placeholder="Alex Mercer"
                        className="w-full enterprise-input h-[44px] px-3.5 text-sm"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-slate-700">Email address</label>
                      <input
                        type="email"
                        required
                        placeholder="alex@example.com"
                        className="w-full enterprise-input h-[44px] px-3.5 text-sm"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Phone & Avatar Picker */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-slate-700">Phone number</label>
                      <div className="flex gap-1.5">
                        <select
                          className="enterprise-input text-slate-800 h-[44px] px-2 text-xs w-[76px] shrink-0"
                          value={regCountryCode}
                          onChange={(e) => setRegCountryCode(e.target.value)}
                        >
                          {COUNTRY_CODES.map((item) => (
                            <option key={item.code} value={item.code}>
                              {item.flag} {item.code}
                            </option>
                          ))}
                        </select>
                        <input
                          type="tel"
                          required
                          placeholder="(555) 019-2834"
                          className="flex-1 min-w-0 enterprise-input h-[44px] px-3 text-sm"
                          value={regPhoneNo}
                          onChange={(e) => setRegPhoneNo(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-slate-700">Profile photo</label>
                      <div className="flex items-center gap-2 enterprise-subtle-box h-[44px] px-2.5">
                        <img 
                          src={regPhoto} 
                          alt="Avatar preview" 
                          className="w-7 h-7 rounded-full object-cover bg-slate-200 shrink-0" 
                          referrerPolicy="no-referrer" 
                        />
                        <div className="flex gap-1.5 items-center overflow-x-auto py-0.5">
                          {presetAvatars.map((av, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setRegPhoto(av)}
                              className={`w-6 h-6 rounded-full overflow-hidden border cursor-pointer shrink-0 ${regPhoto === av ? "border-blue-600 ring-2 ring-blue-500/20" : "border-slate-200"}`}
                            >
                              <img src={av} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </button>
                          ))}
                          <label className="w-6 h-6 rounded-full border border-dashed border-slate-300 hover:border-blue-500 flex items-center justify-center cursor-pointer transition-colors shrink-0">
                            <Upload className="h-2.5 w-2.5 text-slate-500" />
                            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Password & Confirm */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-slate-700">Password</label>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••••••"
                        className="w-full enterprise-input h-[44px] px-3.5 text-sm"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-slate-700">Confirm password</label>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••••••"
                        className="w-full enterprise-input h-[44px] px-3.5 text-sm"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Optional Admin Key Toggle in Register */}
                  <div className="pt-0.5">
                    {!showRegAdminKey ? (
                      <button
                        type="button"
                        onClick={() => setShowRegAdminKey(true)}
                        className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                      >
                        + Add administrator access key (optional)
                      </button>
                    ) : (
                      <div className="space-y-1 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                        <label className="block text-xs font-medium text-slate-700">Administrator access key</label>
                        <input
                          type="password"
                          placeholder="Optional admin key"
                          className="w-full enterprise-input h-[38px] px-3 text-xs"
                          value={regAdminKey}
                          onChange={(e) => setRegAdminKey(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Terms Checkbox */}
                  <label className="flex items-start gap-2 cursor-pointer py-0.5 select-none">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 mt-0.5 cursor-pointer"
                    />
                    <span className="text-xs text-slate-600 leading-normal">
                      I agree to the Terms of Service and Privacy Policy.
                    </span>
                  </label>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full enterprise-primary-btn h-[48px] text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        <span>Creating account...</span>
                      </>
                    ) : (
                      <span>Create account</span>
                    )}
                  </button>

                </form>

                {/* Back to Sign In */}
                <div className="text-center text-[13px] text-slate-600 pt-1.5 border-t border-slate-100">
                  <span>Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => { setView("login"); setRegErrors([]); }}
                    className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer transition-colors"
                  >
                    Sign in
                  </button>
                </div>

              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* VIEW 3: FORGOT PASSWORD                                       */}
            {/* ------------------------------------------------------------- */}
            {view === "forgot" && (
              <div className="space-y-5 sm:space-y-6">
                
                <div className="space-y-1.5">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Reset your password
                  </h2>
                  <p className="text-sm text-slate-500">
                    Enter your email address to receive password reset instructions.
                  </p>
                </div>

                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-slate-700">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-[16px] h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        className="w-full enterprise-input h-[48px] sm:h-[50px] pl-10 pr-4 text-sm"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full enterprise-primary-btn h-[48px] sm:h-[50px] text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <span>Send reset token</span>
                    )}
                  </button>
                </form>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setView("login")}
                    className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 font-medium cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to sign in</span>
                  </button>
                </div>

              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* VIEW 4: RESET PASSWORD                                        */}
            {/* ------------------------------------------------------------- */}
            {view === "reset" && (
              <div className="space-y-5 sm:space-y-6">
                
                <div className="space-y-1.5">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Set new password
                  </h2>
                  <p className="text-sm text-slate-500">
                    Enter the reset token and choose a new password.
                  </p>
                </div>

                {forgotSuccessMsg && (
                  <div className="p-3.5 bg-blue-50 border border-blue-200 text-xs text-blue-800 rounded-xl leading-relaxed">
                    {forgotSuccessMsg}
                  </div>
                )}

                <form onSubmit={handleResetSubmit} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-700">
                      Reset token
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="reset-xxxxxxx"
                      className="w-full enterprise-input h-[46px] px-3.5 text-sm font-mono"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-slate-700">New password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••••••"
                        className="w-full enterprise-input h-[46px] px-3.5 text-sm"
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-slate-700">Confirm new password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••••••"
                        className="w-full enterprise-input h-[46px] px-3.5 text-sm"
                        value={resetConfirmPassword}
                        onChange={(e) => setResetConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full enterprise-primary-btn h-[48px] sm:h-[50px] text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        <span>Updating password...</span>
                      </>
                    ) : (
                      <span>Update password</span>
                    )}
                  </button>
                </form>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setView("login")}
                    className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 font-medium cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Cancel and return to sign in</span>
                  </button>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
