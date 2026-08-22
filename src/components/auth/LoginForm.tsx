import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Loader2, Shield, AlertCircle, Sparkles } from "lucide-react";
import { AuthInput } from "./AuthInput";
import { AdminLogin } from "./AdminLogin";
import { LoginRequest } from "../../features/auth/authTypes";

export interface LoginFormProps {
  isLoading: boolean;
  errorMessage?: string;
  onSubmit: (data: LoginRequest) => void;
  onNavigateRegister: () => void;
  onNavigateForgot: () => void;
}

export function LoginForm({
  isLoading,
  errorMessage,
  onSubmit,
  onNavigateRegister,
  onNavigateForgot
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [adminKey, setAdminKey] = useState("");
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    onSubmit({
      email,
      password,
      adminKey: showAdminLogin ? adminKey : undefined,
      rememberMe
    });
  };

  return (
    <div className="w-full max-w-[420px] mx-auto space-y-6 text-left relative z-10">
      
      {/* Heading & Subtitle */}
      <div className="space-y-1.5">
        <h2 className="text-[30px] sm:text-[32px] font-bold text-white tracking-tight leading-tight">
          Welcome back
        </h2>
        <p className="text-[14px] sm:text-[15px] text-slate-400">
          Sign in to continue to Recruiter AI Coach.
        </p>
      </div>

      {/* Error Announcement */}
      {errorMessage && (
        <div className="p-3.5 bg-red-950/40 backdrop-blur-md border border-red-500/30 rounded-xl flex items-start gap-2.5 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Email Address */}
        <AuthInput
          id="login-email"
          type="email"
          label="Email address"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={Mail}
        />

        {/* Password */}
        <AuthInput
          id="login-password"
          type={showPassword ? "text" : "password"}
          label="Password"
          labelRight={
            <button
              type="button"
              onClick={onNavigateForgot}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer transition-colors"
            >
              Forgot password?
            </button>
          }
          required
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={Lock}
          rightAction={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />

        {/* Options Row */}
        <div className="flex items-center justify-between pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-slate-900/60 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
            />
            <span className="text-xs text-slate-300">Remember me</span>
          </label>

          {/* Discrete Admin Link */}
          <button
            type="button"
            onClick={() => setShowAdminLogin(!showAdminLogin)}
            className="text-xs text-slate-400 hover:text-indigo-300 cursor-pointer transition-colors"
          >
            {showAdminLogin ? "Candidate access" : "Administrator access"}
          </button>
        </div>

        {/* Conditional Admin Key Entry */}
        {showAdminLogin && (
          <AdminLogin
            adminKey={adminKey}
            onAdminKeyChange={setAdminKey}
            onClose={() => {
              setShowAdminLogin(false);
              setAdminKey("");
            }}
          />
        )}

        {/* Primary CTA Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="glass-btn-auth-primary mt-2"
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
      <div className="text-center text-[13px] text-slate-400 pt-3 border-t border-white/10">
        <span>Don't have an account? </span>
        <button
          type="button"
          onClick={onNavigateRegister}
          className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer transition-colors ml-1"
        >
          Create account
        </button>
      </div>

      {/* Security Trust Indicator */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
        <Shield className="h-3.5 w-3.5 text-slate-500 shrink-0" />
        <span>Secure authentication and protected account access.</span>
      </div>

    </div>
  );
}
