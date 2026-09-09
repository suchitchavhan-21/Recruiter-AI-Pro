import React, { useState } from "react";
import { CheckCircle2, Loader2, Mail, RefreshCw } from "lucide-react";

export interface EmailVerificationProps {
  email: string;
  verificationLink?: string;
  isLoading: boolean;
  onVerifyAndLogin: () => void;
  onResendEmail?: (email: string) => Promise<string | void>;
  onDismiss?: () => void;
}

export function EmailVerification({
  email,
  verificationLink,
  isLoading,
  onVerifyAndLogin,
  onResendEmail,
  onDismiss
}: EmailVerificationProps) {
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const handleResend = async () => {
    if (!onResendEmail || isResending) return;
    setIsResending(true);
    setResendStatus(null);
    try {
      const msg = await onResendEmail(email);
      setResendStatus(typeof msg === "string" ? msg : "Verification email resent successfully! Check your inbox/spam folder.");
    } catch (err: any) {
      setResendStatus(err?.message || "Failed to resend email. Please try again in a moment.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-left space-y-2.5 shadow-lg shadow-emerald-950/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs sm:text-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Account Verification Required</span>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        )}
      </div>

      <p className="text-xs text-emerald-200/90 leading-relaxed">
        {verificationLink ? (
          <>
            A verification token was generated for <strong className="text-white">{email}</strong>. Since external SMTP mail delivery is not configured in this sandbox environment, click the button below to instantly verify your account and sign in.
          </>
        ) : (
          <>
            A verification message was sent to <strong className="text-white">{email}</strong>. Please check your inbox and spam folder, then click the link to activate your account.
          </>
        )}
      </p>

      {resendStatus && (
        <p className="text-[11px] text-emerald-300 bg-emerald-900/40 p-2 rounded-lg border border-emerald-500/20">
          {resendStatus}
        </p>
      )}

      <div className="pt-1 flex flex-wrap items-center gap-2">
        {verificationLink && (
          <button
            type="button"
            onClick={onVerifyAndLogin}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-60 shadow-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                <span>Verifying & Signing In...</span>
              </>
            ) : (
              <>
                <Mail className="h-3.5 w-3.5" />
                <span>Instant Verify & Sign In</span>
              </>
            )}
          </button>
        )}

        {onResendEmail && (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-emerald-300 text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 border border-emerald-500/30"
          >
            {isResending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                <span>Resending Email...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Resend Verification Email</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
