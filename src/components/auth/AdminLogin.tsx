import React from "react";
import { KeyRound } from "lucide-react";
import { AuthInput } from "./AuthInput";

export interface AdminLoginProps {
  adminKey: string;
  onAdminKeyChange: (val: string) => void;
  onClose: () => void;
}

export function AdminLogin({ adminKey, onAdminKeyChange, onClose }: AdminLoginProps) {
  return (
    <div className="p-4 glass-sub-panel space-y-3 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
          <KeyRound className="h-3.5 w-3.5 text-indigo-400" />
          <span>Administrator Access</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
        >
          Hide
        </button>
      </div>

      <AuthInput
        id="login-admin-key"
        type="password"
        placeholder="Enter administrator passkey"
        value={adminKey}
        onChange={(e) => onAdminKeyChange(e.target.value)}
        icon={KeyRound}
        helperText="Elevates role to administrator upon successful password verification."
      />
    </div>
  );
}
