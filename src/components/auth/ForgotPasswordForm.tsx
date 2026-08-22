import React, { useState } from "react";
import { Mail, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { AuthInput } from "./AuthInput";
import { ForgotPasswordRequest } from "../../features/auth/authTypes";

export interface ForgotPasswordFormProps {
  isLoading: boolean;
  errorMessage?: string;
  onSubmit: (data: ForgotPasswordRequest) => void;
  onNavigateLogin: () => void;
}

export function ForgotPasswordForm({
  isLoading,
  errorMessage,
  onSubmit,
  onNavigateLogin
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    onSubmit({ email });
  };

  return (
    <div className="w-full max-w-[420px] mx-auto space-y-6 text-left relative z-10">
      
      {/* Header */}
      <div className="space-y-1.5">
        <h2 className="text-[30px] sm:text-[32px] font-bold text-white tracking-tight leading-tight">
          Reset password
        </h2>
        <p className="text-[14px] sm:text-[15px] text-slate-400">
          Enter your email address and we'll send you instructions to reset your password.
        </p>
      </div>

      {/* Error Announcement */}
      {errorMessage && (
        <div className="p-3.5 bg-red-950/40 backdrop-blur-md border border-red-500/30 rounded-xl flex items-start gap-2.5 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <AuthInput
          id="forgot-email"
          type="email"
          label="Email address"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={Mail}
        />

        <button
          type="submit"
          disabled={isLoading}
          className="glass-btn-auth-primary mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              <span>Sending instructions...</span>
            </>
          ) : (
            <span>Send reset token</span>
          )}
        </button>

      </form>

      {/* Back to Sign In */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onNavigateLogin}
          className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white font-medium cursor-pointer transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to sign in</span>
        </button>
      </div>

    </div>
  );
}
