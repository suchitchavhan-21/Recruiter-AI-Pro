import React, { useState } from "react";
import { User, Mail, Phone, Lock, Eye, EyeOff, Loader2, Upload, AlertCircle } from "lucide-react";
import { AuthInput } from "./AuthInput";
import { RegisterRequest } from "../../features/auth/authTypes";
import { validatePassword } from "../../features/auth/authValidation";

export const COUNTRY_CODES = [
  { code: "+1", country: "US/CA", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+91", country: "IN", flag: "🇮🇳" },
  { code: "+61", country: "AU", flag: "🇦🇺" },
  { code: "+49", country: "DE", flag: "🇩🇪" },
  { code: "+33", country: "FR", flag: "🇫🇷" },
  { code: "+81", country: "JP", flag: "🇯🇵" },
  { code: "+86", country: "CN", flag: "🇨🇳" },
  { code: "+65", country: "SG", flag: "🇸🇬" },
  { code: "+971", country: "AE", flag: "🇦🇪" }
];

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120"
];

export interface RegisterFormProps {
  isLoading: boolean;
  errors: string[];
  onSubmit: (data: RegisterRequest) => void;
  onNavigateLogin: () => void;
  onShowNotification: (msg: string, type: "success" | "error" | "info") => void;
}

export function RegisterForm({
  isLoading,
  errors: externalErrors,
  onSubmit,
  onNavigateLogin,
  onShowNotification
}: RegisterFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(PRESET_AVATARS[0]);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [showAdminField, setShowAdminField] = useState(false);
  const [localErrors, setLocalErrors] = useState<string[]>([]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        onShowNotification("Image size must be less than 2MB.", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setProfilePhoto(reader.result);
          onShowNotification("Profile picture updated.", "success");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErrors([]);

    const pwdIssues = validatePassword(password);
    if (pwdIssues.length > 0) {
      setLocalErrors(pwdIssues);
      onShowNotification("Please satisfy all password security requirements.", "error");
      return;
    }

    if (password !== confirmPassword) {
      setLocalErrors(["Passwords do not match."]);
      onShowNotification("Passwords must match.", "error");
      return;
    }

    if (!agreeTerms) {
      setLocalErrors(["You must agree to the Terms of Service."]);
      onShowNotification("Agreement to terms is required.", "error");
      return;
    }

    onSubmit({
      fullName,
      email,
      phoneNumber: `${countryCode} ${phoneNumber}`.trim(),
      password,
      confirmPassword,
      profilePhoto,
      agreeTerms,
      adminKey: showAdminField ? adminKey : undefined
    });
  };

  const combinedErrors = [...localErrors, ...externalErrors];

  return (
    <div className="w-full max-w-[440px] mx-auto space-y-5 text-left relative z-10">
      
      {/* Heading */}
      <div className="space-y-1">
        <h2 className="text-[28px] sm:text-[32px] font-bold text-white tracking-tight leading-tight">
          Create account
        </h2>
        <p className="text-sm text-slate-400">
          Start preparing with personalized AI interview coaching.
        </p>
      </div>

      {/* Validation Errors */}
      {combinedErrors.length > 0 && (
        <div className="p-3.5 bg-red-950/40 backdrop-blur-md border border-red-500/30 rounded-xl space-y-1 text-xs text-red-300">
          {combinedErrors.map((err, idx) => (
            <div key={idx} className="flex items-start gap-1.5">
              <span className="text-red-400 font-bold">•</span>
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        
        {/* Full Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AuthInput
            id="register-fullname"
            label="Full name"
            required
            placeholder="Alex Mercer"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            icon={User}
          />
          <AuthInput
            id="register-email"
            type="email"
            label="Email address"
            required
            placeholder="alex@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={Mail}
          />
        </div>

        {/* Phone & Avatar Picker */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Phone Field */}
          <div className="space-y-1.5">
            <label htmlFor="register-phone" className="block text-xs font-medium text-slate-300 tracking-wide uppercase">
              Phone number
            </label>
            <div className="flex gap-1.5">
              <select
                aria-label="Country Code"
                className="h-[52px] bg-[#0c0f1a]/70 backdrop-blur-md border border-white/12 rounded-[10px] px-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 shrink-0"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
              >
                {COUNTRY_CODES.map((item) => (
                  <option key={item.code} value={item.code} className="bg-slate-900 text-white">
                    {item.flag} {item.code}
                  </option>
                ))}
              </select>
              <input
                id="register-phone"
                type="tel"
                required
                placeholder="(555) 019-2834"
                className="flex-1 min-w-0 h-[52px] bg-[#0c0f1a]/70 backdrop-blur-md border border-white/12 border-t-white/20 rounded-[10px] px-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/25"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          </div>

          {/* Profile Photo */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300 tracking-wide uppercase">
              Profile photo
            </label>
            <div className="flex items-center gap-2 h-[52px] glass-sub-panel px-3">
              <img
                src={profilePhoto}
                alt="Selected profile"
                className="w-7 h-7 rounded-full object-cover bg-slate-800 shrink-0 border border-white/20"
                referrerPolicy="no-referrer"
              />
              <div className="flex gap-1.5 items-center overflow-x-auto py-0.5">
                {PRESET_AVATARS.map((av, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setProfilePhoto(av)}
                    className={`w-6 h-6 rounded-full overflow-hidden border cursor-pointer shrink-0 transition-transform ${
                      profilePhoto === av ? "border-indigo-400 ring-2 ring-indigo-500/30 scale-105" : "border-white/10"
                    }`}
                  >
                    <img src={av} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
                <label className="w-6 h-6 rounded-full border border-dashed border-slate-500 hover:border-indigo-400 flex items-center justify-center cursor-pointer transition-colors shrink-0">
                  <Upload className="h-2.5 w-2.5 text-slate-400" />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
            </div>
          </div>

        </div>

        {/* Password & Confirm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AuthInput
            id="register-password"
            type={showPassword ? "text" : "password"}
            label="Password"
            required
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={Lock}
          />
          <AuthInput
            id="register-confirm-password"
            type={showPassword ? "text" : "password"}
            label="Confirm password"
            required
            placeholder="Re-enter password"
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
        </div>

        {/* Optional Admin Key */}
        <div className="pt-0.5">
          {!showAdminField ? (
            <button
              type="button"
              onClick={() => setShowAdminField(true)}
              className="text-xs text-slate-400 hover:text-indigo-300 cursor-pointer transition-colors"
            >
              + Add administrator access key (optional)
            </button>
          ) : (
            <div className="p-3 glass-sub-panel space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="reg-admin-key" className="text-xs font-medium text-slate-300">
                  Administrator Key
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminField(false);
                    setAdminKey("");
                  }}
                  className="text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Remove
                </button>
              </div>
              <input
                id="reg-admin-key"
                type="password"
                placeholder="Enter admin passkey"
                className="w-full h-[40px] bg-slate-900/80 border border-white/10 rounded-lg px-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Agree Terms */}
        <label className="flex items-start gap-2 cursor-pointer py-1 select-none">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-slate-900/60 text-indigo-500 focus:ring-indigo-500 mt-0.5 cursor-pointer"
          />
          <span className="text-xs text-slate-300 leading-normal">
            I agree to the Terms of Service and Privacy Policy.
          </span>
        </label>

        {/* Primary CTA */}
        <button
          type="submit"
          disabled={isLoading}
          className="glass-btn-auth-primary mt-2"
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
      <div className="text-center text-[13px] text-slate-400 pt-3 border-t border-white/10">
        <span>Already have an account? </span>
        <button
          type="button"
          onClick={onNavigateLogin}
          className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer transition-colors ml-1"
        >
          Sign in
        </button>
      </div>

    </div>
  );
}
