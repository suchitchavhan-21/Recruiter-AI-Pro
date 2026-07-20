import React, { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";
import { 
  User, 
  Trash2, 
  Users, 
  Settings, 
  ShieldAlert, 
  Lock, 
  Eye, 
  EyeOff, 
  Plus, 
  KeyRound,
  CheckCircle2,
  Info,
  Calendar,
  Mail,
  Award,
  BookOpen,
  Briefcase,
  LogOut,
  Phone,
  RefreshCw,
  Camera,
  Upload,
  X
} from "lucide-react";
import VoiceCalibrator from "./VoiceCalibrator";
import { COUNTRY_CODES } from "./AuthPage";

function parsePhoneNumber(phone: string) {
  if (!phone) return { countryCode: "+1", nationalNumber: "" };
  const matched = COUNTRY_CODES.find(item => phone.startsWith(item.code));
  if (matched) {
    return {
      countryCode: matched.code,
      nationalNumber: phone.substring(matched.code.length).trim()
    };
  }
  return {
    countryCode: "+1",
    nationalNumber: phone
  };
}

interface ProfileSettingsProps {
  currentUser: any;
  sessionsHistory?: any[];
  savedStarStories?: any[];
  applications?: any[];
  onLogout?: () => void;
}

export default function ProfileSettings({
  currentUser,
  sessionsHistory = [],
  savedStarStories = [],
  applications = [],
  onLogout
}: ProfileSettingsProps) {
  // Input states for current user profile edits
  const [fullName, setFullName] = useState(currentUser?.name || currentUser?.fullName || "");
  const [countryCode, setCountryCode] = useState("+1");
  const [nationalNumber, setNationalNumber] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(currentUser?.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80");
  const [editStatus, setEditStatus] = useState<{ message: string; type: "success" | "error" | "" }>({ message: "", type: "" });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.name || currentUser.fullName || "");
      const { countryCode: c, nationalNumber: n } = parsePhoneNumber(currentUser.phoneNumber || "");
      setCountryCode(c);
      setNationalNumber(n);
      setProfilePhoto(currentUser.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80");
    }
  }, [currentUser]);

  // Custom photo upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setEditStatus({ message: "Image size must be less than 2MB.", type: "error" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setProfilePhoto(reader.result);
          setEditStatus({ message: "Custom profile picture selected. Click 'Save Profile' to apply.", type: "success" });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditStatus({ message: "", type: "" });
    setIsUpdating(true);

    if (!fullName.trim()) {
      setEditStatus({ message: "Full Name is required.", type: "error" });
      setIsUpdating(false);
      return;
    }

    try {
      const finalPhone = `${countryCode} ${nationalNumber}`.trim();
      const res = await apiFetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phoneNumber: finalPhone,
          profilePhoto
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile details.");
      }

      setEditStatus({ message: "Your profile has been updated successfully!", type: "success" });
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (err: any) {
      setEditStatus({ message: err.message || "Failed to update.", type: "error" });
    } finally {
      setIsUpdating(false);
    }
  };

  const presetPhotos = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"
  ];

  return (
    <div className="space-y-8 animate-fade-in font-sans select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-tight">Candidate Profile</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Update personal information, calibrate speech parameters, and manage candidate details.
          </p>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full sm:w-auto py-2 px-3.5 bg-rose-500/10 hover:bg-rose-500/15 text-rose-400 hover:text-rose-300 border border-rose-500/20 hover:border-rose-500/30 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-500/5"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Log Out Session</span>
          </button>
        )}
      </div>

      {/* ACTIVE CANDIDATE PROFILE CARD */}
      {currentUser && (
        <div className="bg-gradient-to-r from-[#111827] via-[#111827] to-indigo-950/20 border border-[#27272A] rounded-[18px] p-6 relative overflow-hidden flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[90px] pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div 
              onClick={() => setIsPreviewOpen(true)}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-[#6D5EF8] relative shrink-0 select-none shadow-lg hover:scale-105 hover:border-violet-400 active:scale-95 cursor-pointer transition-all duration-200 group/avatar bg-[#09090B]"
              title="Click to view full size"
            >
              <img src={profilePhoto} alt="Candidate Avatar" className="w-full h-full object-cover transition-all duration-300 group-hover/avatar:scale-110" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold tracking-wider uppercase transition-opacity duration-200">
                <Camera className="h-4 w-4 mb-1 text-violet-400" />
                View Large
              </div>
              <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#111827] rounded-full shadow-md z-10" />
            </div>
            
            <div className="text-center sm:text-left space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight font-sans">{currentUser.name || currentUser.fullName}</h3>
                <span className="text-[9px] font-bold text-emerald-400 uppercase font-mono bg-emerald-500/10 px-2.5 py-0.5 border border-emerald-500/20 rounded-full">
                  Verified
                </span>
              </div>
              
              <div className="space-y-1 text-slate-300">
                <p className="text-xs font-semibold flex items-center justify-center sm:justify-start gap-1.5 text-slate-300">
                  <Award className="h-3.5 w-3.5 text-[#6D5EF8]" />
                  <span>Track: <strong className="text-[#6D5EF8]">{currentUser.role === "admin" ? "System Administrator" : "Candidate Engineer"}</strong></span>
                </p>
                <p className="text-[11px] text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                  <span>{currentUser.email}</span>
                </p>
              </div>

              <div className="pt-2 text-[10px] text-slate-500 flex items-center justify-center sm:justify-start gap-1.5 font-mono">
                <Calendar className="h-3.5 w-3.5 text-slate-600" />
                <span>Joined Workspace: {currentUser.joinedAt ? new Date(currentUser.joinedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : "Recently"}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto md:border-l md:border-[#27272A]/80 md:pl-8 pt-4 md:pt-0">
            <div className="bg-[#09090B]/40 border border-[#27272A]/60 p-3 rounded-xl text-center md:text-left min-w-[90px]">
              <span className="text-[8.5px] font-bold font-mono text-slate-500 uppercase block tracking-wider">Simulations</span>
              <span className="text-base font-extrabold text-white font-mono mt-0.5 block">{sessionsHistory?.length || 0}</span>
            </div>
            
            <div className="bg-[#09090B]/40 border border-[#27272A]/60 p-3 rounded-xl text-center md:text-left min-w-[90px]">
              <span className="text-[8.5px] font-bold font-mono text-slate-500 uppercase block tracking-wider">Avg Score</span>
              <span className="text-base font-extrabold text-emerald-400 font-mono mt-0.5 block">
                {sessionsHistory && sessionsHistory.length > 0 
                  ? `${Math.round(sessionsHistory.reduce((acc, curr) => acc + (curr.score || 0), 0) / sessionsHistory.length)}%`
                  : "N/A"
                }
              </span>
            </div>

            <div className="bg-[#09090B]/40 border border-[#27272A]/60 p-3 rounded-xl text-center md:text-left min-w-[90px]">
              <span className="text-[8.5px] font-bold font-mono text-slate-500 uppercase block tracking-wider">STAR Stories</span>
              <span className="text-base font-extrabold text-[#6D5EF8] font-mono mt-0.5 block">{savedStarStories?.length || 0}</span>
            </div>

            <div className="bg-[#09090B]/40 border border-[#27272A]/60 p-3 rounded-xl text-center md:text-left min-w-[90px]">
              <span className="text-[8.5px] font-bold font-mono text-slate-500 uppercase block tracking-wider">Applications</span>
              <span className="text-base font-extrabold text-amber-500 font-mono mt-0.5 block">{applications?.length || 0}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Edit Profile Forms */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Edit Profile Form */}
          <div className="bg-[#111827] border border-[#27272A] p-6 rounded-[18px] space-y-5 shadow-xl">
            <h3 className="text-white text-xs font-bold tracking-wider uppercase font-mono text-slate-400 flex items-center gap-2">
              <Settings className="h-4 w-4 text-[#6D5EF8]" />
              Manage Candidate Profile Settings
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      className="w-full bg-[#09090B] border border-[#27272A] text-slate-200 rounded-lg py-2.5 pl-9 pr-4 text-xs focus:outline-none focus:border-[#6D5EF8]"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Phone Number</label>
                  <div className="flex gap-2">
                    <div className="relative w-24 shrink-0">
                      <select
                        className="w-full h-full bg-[#09090B] border border-[#27272A] text-slate-200 rounded-lg py-2 px-2 text-xs focus:outline-none focus:border-[#6D5EF8] appearance-none font-sans cursor-pointer"
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
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
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="(555) 019-2834"
                        className="w-full bg-[#09090B] border border-[#27272A] text-slate-200 rounded-lg py-2.5 pl-9 pr-4 text-xs focus:outline-none focus:border-[#6D5EF8]"
                        value={nationalNumber}
                        onChange={(e) => setNationalNumber(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Avatar Selector */}
              <div className="space-y-2">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Profile Avatar Selection</label>
                <div className="flex items-center gap-4 bg-[#09090B] border border-[#27272A] rounded-xl p-3 w-fit">
                  <div 
                    onClick={() => setIsPreviewOpen(true)}
                    className="w-14 h-14 rounded-xl overflow-hidden border border-[#27272A] hover:border-violet-400 cursor-pointer active:scale-95 transition-all relative group/preview shrink-0 bg-slate-900 shadow-inner"
                    title="Click to view full size"
                  >
                    <img src={profilePhoto} alt="Selection Preview" className="w-full h-full object-cover transition-transform duration-250 group-hover/preview:scale-110" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/preview:opacity-100 flex items-center justify-center transition-opacity duration-200">
                      <Camera className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="flex gap-2 items-center flex-wrap">
                    {presetPhotos.map((photo, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setProfilePhoto(photo)}
                        className={`w-9 h-9 rounded-lg overflow-hidden border transition-all cursor-pointer ${profilePhoto === photo ? "border-violet-500 scale-105" : "border-[#27272A] hover:border-slate-500"}`}
                      >
                        <img src={photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                    <label className="w-9 h-9 rounded-lg border border-dashed border-violet-500 hover:border-violet-400 bg-violet-600/10 hover:bg-violet-600/20 flex items-center justify-center cursor-pointer transition-all shrink-0">
                      <Upload className="h-4.5 w-4.5 text-violet-400" />
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

              {editStatus.message && (
                <div className={`p-3 rounded-lg border text-[10px] font-mono leading-relaxed flex gap-2 items-start ${
                  editStatus.type === "success" 
                    ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" 
                    : "bg-rose-500/5 border-rose-500/20 text-rose-400"
                }`}>
                  {editStatus.type === "success" ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" /> : <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />}
                  <span>{editStatus.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full py-2.5 bg-[#6D5EF8] hover:bg-[#6D5EF8]/90 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isUpdating ? "Saving workspace changes..." : "Save Profile Settings"}
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Voice Settings */}
        <div className="lg:col-span-5 space-y-6">
          {/* Voice Calibration suite */}
          <VoiceCalibrator />
        </div>

      </div>

      {/* PHOTO PREVIEW LIGHTBOX MODAL */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md transition-all p-4">
          <div className="absolute inset-0 cursor-zoom-out" onClick={() => setIsPreviewOpen(false)} />
          <div className="relative bg-[#111827] border border-[#27272A] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col z-10">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#27272A] bg-[#09090B]/80">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Profile Photo Inspection</span>
              <button 
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 flex justify-center items-center bg-[#09090B]/30">
              <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-2xl overflow-hidden border border-[#27272A] shadow-inner bg-slate-950">
                <img src={profilePhoto} alt="Large Profile Pic" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            </div>
            <div className="px-5 py-3 border-t border-[#27272A] bg-[#09090B]/60 text-center">
              <p className="text-[10px] text-slate-500 font-sans leading-normal">
                High-definition avatar rendering synced to your active executive profile.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
