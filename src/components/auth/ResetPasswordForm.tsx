import React, { useState } from "react";
import { KeyRound, Lock, Eye, EyeOff, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { AuthInput } from "./AuthInput";
import { ResetPasswordRequest } from "../../features/auth/authTypes";

export interface ResetPasswordFormProps {
  initialToken?: string;
  successNotice?: string;
  isLoading: boolean;
  errorMessage?: string;
  onSubmit: (data: ResetPasswordRequest) => void;
  onNavigateLogin: () => void;
}

export function ResetPasswordForm({
  initialToken = "",
  successNotice,
  isLoading,
  errorMessage,
  onSubmit,
  onNavigateLogin
}: ResetPasswordFormProps) {
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    onSubmit({
      token,
      password,
      confirmPassword
    });
  };

  return (
    <div className="w-full max-w-[420px] mx-auto space-y-5 text-left relative z-10">
      
      {/* Header */}
      <div className="space-y-1.5">
        <h2 className="text-[30px] sm:text-[32px] font-bold text-white tracking-tight leading-tight">
          Set new password
        </h2>
        <p className="text-[14px] sm:text-[15px] text-slate-400">
          Enter your verification token and select a new secure password.
        </p>
      </div>

      {/* Optional Success Information Notice */}
      {successNotice && (
        <div className="p-3.5 bg-indigo-950/40 backdrop-blur-md border border-indigo-500/30 text-xs text-indigo-300 rounded-xl leading-relaxed">
          {successNotice}
        </div>
      )}

      {/* Error Announcement */}
      {errorMessage && (
        <div className="p-3.5 bg-red-950/40 backdrop-blur-md border border-red-500/30 rounded-xl flex items-start gap-2.5 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        
        {/* Token Input */}
        <AuthInput
          id="reset-token"
          label="Reset token"
          required
          placeholder="Paste security reset token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          icon={KeyRound}
        />

        {/* New Password */}
        <AuthInput
          id="reset-new-password"
          type={showPassword ? "text" : "password"}
          label="New password"
          required
          placeholder="Min. 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={Lock}
        />

        {/* Confirm Password */}
        <AuthInput
          id="reset-confirm-password"
          type={showPassword ? "text" : "password"}
          label="Confirm new password"
          required
          placeholder="Re-enter new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          icon={Lock}
          rightAction={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />

        <button
          type="submit"
          disabled={isLoading}
          className="glass-btn-auth-primary mt-2"
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

      {/* Return to Sign In */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onNavigateLogin}
          className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white font-medium cursor-pointer transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Cancel and return to sign in</span>
        </button>
      </div>

    </div>
  );
}
