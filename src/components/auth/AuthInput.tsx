import React, { forwardRef } from "react";
import { LucideIcon } from "lucide-react";

export interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label?: string;
  labelRight?: React.ReactNode;
  icon?: LucideIcon;
  rightAction?: React.ReactNode;
  error?: string;
  helperText?: string;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ id, label, labelRight, icon: Icon, rightAction, error, helperText, className = "", ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5 text-left">
        {(label || labelRight) && (
          <div className="flex items-center justify-between">
            {label && (
              <label 
                htmlFor={id} 
                className="block text-xs font-medium text-slate-300 tracking-wide uppercase"
              >
                {label}
              </label>
            )}
            {labelRight}
          </div>
        )}

        <div className="relative">
          {Icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
              <Icon className="h-4 w-4" />
            </div>
          )}

          <input
            ref={ref}
            id={id}
            className={`
              w-full h-[52px] bg-[#0c0f1a]/70 backdrop-blur-md border rounded-[10px] text-sm text-slate-100 placeholder-slate-500
              transition-all duration-150 focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/25
              ${Icon ? "pl-10" : "pl-3.5"}
              ${rightAction ? "pr-11" : "pr-3.5"}
              ${error ? "border-red-500/60 focus:border-red-400 focus:ring-red-500/20" : "border-white/12 border-t-white/20"}
              ${className}
            `}
            {...props}
          />

          {rightAction && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
              {rightAction}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-xs text-red-400 font-medium flex items-center gap-1" role="alert">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-slate-400">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

AuthInput.displayName = "AuthInput";
