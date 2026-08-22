import React from "react";
import { CheckCircle2, Loader2, Mail } from "lucide-react";

export interface EmailVerificationProps {
  email: string;
  verificationLink?: string;
  isLoading: boolean;
  onVerifyAndLogin: () => void;
  onDismiss?: () => void;
}

export function EmailVerification({
  email,
  verificationLink,
  isLoading,
  onVerifyAndLogin,
  onDismiss
}: EmailVerificationProps) {
  return (
    <div className="p-4 bg-emerald-950/40 backdrop-blur-md border border-emerald-500/30 rounded-xl text-left space-y-2.5 shadow-lg shadow-emerald-950/30">
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
        A verification link was generated for <strong className="text-white">{email}</strong>.
      </p>

      {verificationLink && (
        <div className="pt-1">
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
                <span>Verify Email & Sign In</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
