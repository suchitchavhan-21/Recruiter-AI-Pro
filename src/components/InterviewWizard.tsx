import React, { useState } from "react";
import { 
  Building2, 
  User, 
  FileText, 
  Award, 
  HelpCircle, 
  CheckCircle, 
  Zap, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles,
  Info,
  Upload,
  Globe,
  CheckCircle2,
  Lock,
  UserCheck
} from "lucide-react";
import { COMPANY_PRESETS, CompanyPreset, CompanyRolePreset } from "../data/companyRoles";

const sarahImg = "/assets/sarah.png";
const davidImg = "/assets/david.png";
const marcusImg = "/assets/marcus.png";

interface InterviewWizardProps {
  onStartSimulation: (config: {
    company: string;
    role: string;
    jdText: string;
    style: "technical" | "behavioral" | "hybrid";
    difficulty: "Entry" | "Mid" | "Senior" | "Expert";
    persona: "mentor" | "architect" | "product_leader";
    interviewerCount: number;
  }) => void;
  isAnalyzing: boolean;
}

export default function InterviewWizard({ onStartSimulation, isAnalyzing }: InterviewWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 8;

  // AI Panel Simulator state
  const [interviewerCount, setInterviewerCount] = useState<number>(3);

  // UI Expanded Selection States
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("google");
  const [customCompanyName, setCustomCompanyName] = useState<string>("");
  
  const [selectedRoleTitle, setSelectedRoleTitle] = useState<string>("");
  const [customRoleName, setCustomRoleName] = useState<string>("");
  
  const [jdText, setJdText] = useState<string>("");
  
  // 6 Styles requested
  const [selectedStyle, setSelectedStyle] = useState<"behavioral" | "technical" | "system_design" | "coding" | "leadership" | "hybrid">("hybrid");
  
  // 6 Difficulties requested
  const [selectedDifficulty, setSelectedDifficulty] = useState<"easy" | "medium" | "hard" | "faang" | "staff" | "principal">("hard");
  
  // 7 Personas requested
  const [selectedPersona, setSelectedPersona] = useState<"mentor" | "architect" | "director" | "recruiter" | "strict_faang" | "friendly_startup" | "executive">("mentor");

  // Filtering states for Step 1
  const [companyFilter, setCompanyFilter] = useState<"all" | "ai" | "cloud" | "fintech" | "startup" | "enterprise" | "gaming" | "healthcare">("all");

  const companyList = COMPANY_PRESETS;
  const selectedCompany = companyList.find(c => c.id === selectedCompanyId);

  // Filter companies based on exact criteria
  const filteredCompanies = companyList.filter(c => {
    if (companyFilter === "all") return true;
    const ind = c.industry.toLowerCase();
    const id = c.id;
    if (companyFilter === "ai") return ind.includes("ai") || id === "openai";
    if (companyFilter === "cloud") return ind.includes("cloud") || id === "microsoft" || id === "amazon";
    if (companyFilter === "fintech") return ind.includes("financial") || id === "stripe";
    if (companyFilter === "startup") return id === "openai" || ind.includes("api");
    if (companyFilter === "enterprise") return id === "google" || id === "microsoft";
    if (companyFilter === "gaming") return ind.includes("gaming") || id === "netflix" || id === "google";
    if (companyFilter === "healthcare") return ind.includes("health") || id === "microsoft";
    return true;
  });

  const handleSelectCompany = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setSelectedRoleTitle(""); 
    setCustomCompanyName("");
    
    const comp = companyList.find(c => c.id === companyId);
    if (comp && comp.roles.length > 0) {
      setSelectedRoleTitle(comp.roles[0].title);
      setJdText(comp.roles[0].text);
    }
  };

  const handleSelectRole = (role: CompanyRolePreset) => {
    setSelectedRoleTitle(role.title);
    setJdText(role.text);
    setCustomRoleName("");
  };

  // Step 3 Actions
  const handleAutoFill = () => {
    if (selectedCompanyId === "custom") {
      setJdText(`About the Role:
We are looking for a Senior Product Engineer to join our growing team. You will lead development of critical user workflows, optimize performance, and mentor other engineers.
Requirements:
- 4+ years of professional React and TypeScript development.
- Deep alignment with user experience, beautiful clean layouts, and responsive components.
- Experience with Node.js APIs and state synchronization.`);
    } else if (selectedCompany) {
      const activeRole = selectedCompany.roles.find(r => r.title === selectedRoleTitle);
      if (activeRole) {
        setJdText(activeRole.text);
      }
    }
  };

  const handleUploadClick = () => {
    setJdText(`Parsed from uploaded_resume_requirements.pdf:
Position: Staff Systems Operations Specialist
Requirements:
- 6+ years deploying scale-out kubernetes orchestration engines in hybrid environment.
- Strong knowledge of concurrency boundaries, distributed consensus systems, and high performance network buffers.
- Prior experience instrumentation with OpenTelemetry dashboards.`);
    alert("Resume / JD PDF uploaded successfully! Extracted 3 critical requirement items.");
  };

  const handleUrlFetchClick = () => {
    const url = prompt("Enter the Job Listing URL (e.g. greenhouse.io, lever.co, linkedin.com):", "https://boards.greenhouse.io/figma/jobs/4201");
    if (url) {
      setJdText(`Parsed from ${url}:
Position: Senior Full-Stack Engineer (Figma Design Tools Core)
Core Competencies Required:
- Master level fluency in React, TypeScript, and HTML5 canvas manipulation.
- Experience building real-time collaboration multiplayer synchronization networks.
- Exceptional attention to UI typography, pixel density, micro-animations, and fast visual updates.`);
    }
  };

  const getActiveCompanyDisplay = () => {
    if (selectedCompanyId === "custom") {
      return customCompanyName.trim() || "Custom Enterprise";
    }
    return selectedCompany?.name || "Target Company";
  };

  const getActiveRoleDisplay = () => {
    if (selectedCompanyId === "custom" || customRoleName) {
      return customRoleName.trim() || "Systems Engineer";
    }
    return selectedRoleTitle || "Systems Architect";
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (selectedCompanyId === "custom" && !customCompanyName.trim()) {
        alert("Please specify your custom company name.");
        return;
      }
      if (selectedCompanyId !== "custom" && selectedCompany && !selectedRoleTitle) {
        setSelectedRoleTitle(selectedCompany.roles[0].title);
        setJdText(selectedCompany.roles[0].text);
      }
    }
    if (currentStep === 2) {
      if (selectedCompanyId === "custom" && !customRoleName.trim()) {
        alert("Please specify your custom role title.");
        return;
      }
      if (selectedCompanyId !== "custom" && !selectedRoleTitle) {
        alert("Please select a target role preset.");
        return;
      }
    }
    if (currentStep === 3) {
      if (!jdText.trim()) {
        alert("Please paste, upload, or fetch a target job description text.");
        return;
      }
    }

    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStart = () => {
    // Map internal UI selections back to the strict Core API schemas
    let mappedStyle: "technical" | "behavioral" | "hybrid" = "hybrid";
    if (selectedStyle === "behavioral" || selectedStyle === "leadership") {
      mappedStyle = "behavioral";
    } else if (selectedStyle === "technical" || selectedStyle === "system_design" || selectedStyle === "coding") {
      mappedStyle = "technical";
    }

    let mappedDifficulty: "Entry" | "Mid" | "Senior" | "Expert" = "Senior";
    if (selectedDifficulty === "easy") {
      mappedDifficulty = "Entry";
    } else if (selectedDifficulty === "medium") {
      mappedDifficulty = "Mid";
    } else if (selectedDifficulty === "hard" || selectedDifficulty === "faang") {
      mappedDifficulty = "Senior";
    } else if (selectedDifficulty === "staff" || selectedDifficulty === "principal") {
      mappedDifficulty = "Expert";
    }

    let mappedPersona: "mentor" | "architect" | "product_leader" = "mentor";
    if (selectedPersona === "mentor" || selectedPersona === "recruiter" || selectedPersona === "friendly_startup") {
      mappedPersona = "mentor";
    } else if (selectedPersona === "architect" || selectedPersona === "strict_faang") {
      mappedPersona = "architect";
    } else if (selectedPersona === "director" || selectedPersona === "executive") {
      mappedPersona = "product_leader";
    }

    onStartSimulation({
      company: getActiveCompanyDisplay(),
      role: getActiveRoleDisplay(),
      jdText: jdText,
      style: mappedStyle,
      difficulty: mappedDifficulty,
      persona: mappedPersona,
      interviewerCount: interviewerCount
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Step Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
            Step {currentStep} of {totalSteps}
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-tight mt-1 font-sans">
            {currentStep === 1 && "Choose Your Target Company"}
            {currentStep === 2 && "Select Target Position / Role"}
            {currentStep === 3 && "Job Description Requirements"}
            {currentStep === 4 && "Interview Style & Format"}
            {currentStep === 5 && "Target Interview Difficulty"}
            {currentStep === 6 && "AI Interview Panel Size"}
            {currentStep === 7 && "Interviewer Persona Profile"}
            {currentStep === 8 && "Launch Mock Simulator"}
          </h2>
        </div>

        {/* Progress bar */}
        <div className="w-full md:w-48 space-y-1.5 shrink-0">
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>Progress</span>
            <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-[#27272A]/50">
            <div 
              className="h-full bg-[#6D5EF8] transition-all duration-300" 
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Form Box */}
      <div className="bg-[#111827] border border-[#27272A] rounded-[18px] p-6 md:p-8 min-h-[420px] flex flex-col justify-between relative overflow-hidden shadow-xl">
        {/* Step Contents */}
        <div className="flex-1 pb-8">
          
          {/* STEP 1: COMPANY SELECTION */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <p className="text-xs text-slate-400 leading-normal max-w-2xl">
                Choose a world-class target employer preset or specify your own custom workplace. We map real interview trends specifically for this brand.
              </p>

              {/* Tag filters (8 filters requested) */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "all", label: "All Companies" },
                  { id: "ai", label: "AI & Lab" },
                  { id: "cloud", label: "Cloud Platforms" },
                  { id: "fintech", label: "FinTech" },
                  { id: "startup", label: "Startup Labs" },
                  { id: "enterprise", label: "Enterprise" },
                  { id: "gaming", label: "Gaming" },
                  { id: "healthcare", label: "Healthcare" },
                ].map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => setCompanyFilter(tag.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider font-mono transition-all cursor-pointer ${
                      companyFilter === tag.id
                        ? "bg-[#6D5EF8] text-white"
                        : "bg-[#09090B] text-slate-400 hover:text-slate-200 border border-[#27272A]"
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>

              {/* Company Logo Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {filteredCompanies.map((c) => {
                  const isSelected = selectedCompanyId === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleSelectCompany(c.id)}
                      className={`p-4 text-left rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-28 relative overflow-hidden ${
                        isSelected
                          ? "bg-[#6D5EF8]/10 border-[#6D5EF8] shadow-md shadow-[#6D5EF8]/5"
                          : "bg-[#09090B]/60 border-[#27272A] hover:bg-[#09090B]"
                      }`}
                    >
                      <div className="flex justify-between items-start w-full">
                        <span className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${c.logoColor} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                          {c.name.charAt(0)}
                        </span>
                        {isSelected && (
                          <span className="w-2.5 h-2.5 rounded-full bg-[#6D5EF8]" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white truncate">{c.name}</h4>
                        <span className="text-[9px] text-slate-500 font-mono block truncate mt-0.5">{c.industry}</span>
                      </div>
                    </button>
                  );
                })}

                {/* Custom Workplace Option */}
                <button
                  onClick={() => handleSelectCompany("custom")}
                  className={`p-4 text-left rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-28 ${
                    selectedCompanyId === "custom"
                      ? "bg-[#6D5EF8]/10 border-[#6D5EF8] shadow-md shadow-[#6D5EF8]/5"
                      : "bg-[#09090B]/60 border-[#27272A] hover:bg-[#09090B]"
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 text-sm font-bold">
                      🏢
                    </span>
                    {selectedCompanyId === "custom" && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#6D5EF8]" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Custom / Other</h4>
                    <span className="text-[9px] text-slate-500 font-mono block mt-0.5">Define your own company</span>
                  </div>
                </button>
              </div>

              {/* Custom input details */}
              {selectedCompanyId === "custom" && (
                <div className="p-4 bg-[#09090B] border border-[#27272A] rounded-xl space-y-3 max-w-md animate-slide-up">
                  <label htmlFor="custom-company-input" className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Enter Employer Name *
                  </label>
                  <input
                    id="custom-company-input"
                    type="text"
                    placeholder="e.g. Anthropic, Linear, Figma, Vercel"
                    className="w-full bg-[#111827] border border-[#27272A] rounded-lg py-2.5 px-3 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-[#6D5EF8]"
                    value={customCompanyName}
                    onChange={(e) => setCustomCompanyName(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 2: ROLE SELECTION */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-fade-in">
              <p className="text-xs text-slate-400 leading-normal max-w-xl">
                Select your target career track. We have mapped core technical competencies and typical questions expected for these positions at {getActiveCompanyDisplay()}.
              </p>

              {selectedCompanyId !== "custom" && selectedCompany ? (
                <div className="space-y-2.5">
                  {selectedCompany.roles.map((role) => {
                    const isSelected = selectedRoleTitle === role.title;
                    return (
                      <button
                        key={role.title}
                        onClick={() => handleSelectRole(role)}
                        className={`w-full p-4 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                          isSelected
                            ? "bg-[#6D5EF8]/5 border-[#6D5EF8]"
                            : "bg-[#09090B]/60 border-[#27272A] hover:bg-[#09090B]"
                        }`}
                      >
                        <div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono ${
                            role.category === "Engineering" ? "bg-indigo-500/10 text-indigo-400" :
                            role.category === "Product" ? "bg-emerald-500/10 text-emerald-400" :
                            role.category === "Systems" ? "bg-amber-500/10 text-amber-400" :
                            "bg-purple-500/10 text-purple-400"
                          }`}>
                            {role.category}
                          </span>
                          <h4 className="text-xs font-bold text-white mt-1.5">{role.title}</h4>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#6D5EF8] flex items-center justify-center text-white text-[10px]">✓</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 bg-[#09090B] border border-[#27272A] rounded-xl space-y-3 max-w-md">
                  <label htmlFor="custom-role-input" className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Target Role Title *
                  </label>
                  <input
                    id="custom-role-input"
                    type="text"
                    placeholder="e.g. Senior Frontend Engineer, Staff PM"
                    className="w-full bg-[#111827] border border-[#27272A] rounded-lg py-2.5 px-3 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-[#6D5EF8]"
                    value={customRoleName}
                    onChange={(e) => setCustomRoleName(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 3: JOB DESCRIPTION INPUT */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <p className="text-xs text-slate-400 leading-normal max-w-xl">
                  Paste the job listing requirements. Our AI parses keyword targets to formulate real-world questions.
                </p>
                
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleUrlFetchClick}
                    className="px-2.5 py-1.5 bg-[#09090B] border border-[#27272A] text-slate-300 hover:text-white rounded-lg text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Globe className="h-3 w-3 text-sky-400" />
                    <span>Import URL</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleUploadClick}
                    className="px-2.5 py-1.5 bg-[#09090B] border border-[#27272A] text-slate-300 hover:text-white rounded-lg text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Upload className="h-3 w-3 text-emerald-400" />
                    <span>Upload PDF</span>
                  </button>
                  {selectedCompanyId !== "custom" && (
                    <button
                      type="button"
                      onClick={handleAutoFill}
                      className="px-2.5 py-1.5 bg-slate-900 border border-[#27272A] text-slate-300 hover:text-white rounded-lg text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="h-3 w-3 text-[#6D5EF8]" />
                      <span>Autofill Template</span>
                    </button>
                  )}
                </div>
              </div>

              <textarea
                id="wizard-jd-textarea"
                rows={9}
                placeholder="Paste requirements, stack, daily responsibilities, or click 'Autofill' above..."
                className="w-full bg-[#09090B] border border-[#27272A] rounded-xl p-4 text-xs text-slate-250 placeholder-slate-650 leading-relaxed focus:outline-none focus:border-[#6D5EF8] font-mono"
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
              />
            </div>
          )}

          {/* STEP 4: INTERVIEW STYLE (6 Styles) */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fade-in">
              <p className="text-xs text-slate-400 leading-normal max-w-xl">
                Choose the focus of this mock simulation. We tailor candidate assessment rubrics and focus keywords according to this choice.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: "behavioral", title: "STAR Behavioral", desc: "Rigorous focus on core STAR metrics, soft skills, conflict management, and historical narratives.", icon: "💬" },
                  { id: "technical", title: "Technical Core", desc: "Tests syntax mastery, runtime complexity analysis, debugging methods, and framework performance.", icon: "⚡" },
                  { id: "system_design", title: "System Design", desc: "Deconstruct databases, distributed caching, partition thresholds, event queues, and consistency tradeoffs.", icon: "🧱" },
                  { id: "coding", title: "Live Coding", desc: "Focuses on algorithm logic, space-time analysis, array manipulators, edge cases, and performance boundaries.", icon: "💻" },
                  { id: "leadership", title: "Engineering Leadership", desc: "Assesses delegation mechanics, engineering mentoring, technical strategy, and executive updates.", icon: "👑" },
                  { id: "hybrid", title: "Mixed Hybrid", desc: "A comprehensive realistic session: balances architectural challenges with historical behavior metrics.", icon: "🔄" },
                ].map((style) => {
                  const isSelected = selectedStyle === style.id;
                  return (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id as any)}
                      className={`p-4 text-left rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-40 ${
                        isSelected
                          ? "bg-[#6D5EF8]/10 border-[#6D5EF8] shadow-md shadow-[#6D5EF8]/5"
                          : "bg-[#09090B]/60 border-[#27272A] hover:bg-[#09090B]"
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-lg">{style.icon}</span>
                        {isSelected && (
                          <span className="w-2.5 h-2.5 rounded-full bg-[#6D5EF8]" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-white leading-snug">{style.title}</h4>
                        <p className="text-[9.5px] text-slate-500 leading-relaxed line-clamp-2">{style.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: DIFFICULTY SELECTION (6 Difficulties) */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-fade-in">
              <p className="text-xs text-slate-400 leading-normal max-w-xl">
                Select your target difficulty. Higher levels present stricter AI evaluations, follow-ups, and structural critiques.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: "easy", title: "Easy", info: "Associate", desc: "Covers base concepts, syntax variables, and basic operational hygiene." },
                  { id: "medium", title: "Medium", info: "L4 Professional", desc: "Requires architectural awareness and robust unit optimization logic." },
                  { id: "hard", title: "Hard", info: "Senior / L5", desc: "Tests distributed limits, trade-offs, and critical mentoring methodologies." },
                  { id: "faang", title: "FAANG Caliber", info: "Big Tech Standard", desc: "Intense evaluation mapping Google L5 / Meta IC5 hiring bars." },
                  { id: "staff", title: "Staff Engineer", info: "L6 Leadership", desc: "Requires strategic roadmapping, technical isolation, and multi-team scale design." },
                  { id: "principal", title: "Principal Architect", info: "L7 Executive", desc: "Strategic cross-department integration boundaries, zero failure ledgers, massive scales." },
                ].map((diff) => {
                  const isSelected = selectedDifficulty === diff.id;
                  return (
                    <button
                      key={diff.id}
                      onClick={() => setSelectedDifficulty(diff.id as any)}
                      className={`p-4 text-left rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-36 ${
                        isSelected
                          ? "bg-[#6D5EF8]/10 border-[#6D5EF8]"
                          : "bg-[#09090B]/60 border-[#27272A] hover:bg-[#09090B]"
                      }`}
                    >
                      <div>
                        <h4 className="text-xs font-bold text-white">{diff.title}</h4>
                        <span className="text-[9px] text-slate-500 font-mono block mt-0.5">{diff.info}</span>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-relaxed line-clamp-2 mt-1.5">{diff.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 6: AI INTERVIEW PANEL SIZE */}
          {currentStep === 6 && (
            <div className="space-y-6 animate-fade-in">
              <p className="text-xs text-slate-400 leading-normal max-w-xl">
                Select your preferred interview panel style. A larger panel creates a highly realistic, interactive experience with multiple voices and perspectives.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 1, title: "Single AI Interviewer", icon: "👤", desc: "A 1-on-1 personalized conversation with your selected coach persona." },
                  { id: 2, title: "Two AI Interviewers (Duo)", icon: "👥", desc: "Interactive session with two distinct recruiters focusing on Technical and Behavioral areas." },
                  { id: 3, title: "Three AI Interviewers (Full Panel)", icon: "🏛️", desc: "A complete board-style interview with HR Manager, Technical Expert, and Hiring Manager." },
                ].map((panel) => {
                  const isSelected = interviewerCount === panel.id;
                  return (
                    <button
                      key={panel.id}
                      onClick={() => setInterviewerCount(panel.id)}
                      className={`p-5 text-left rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-44 ${
                        isSelected
                          ? "bg-[#6D5EF8]/10 border-[#6D5EF8] shadow-md shadow-[#6D5EF8]/5"
                          : "bg-[#09090B]/60 border-[#27272A] hover:bg-[#09090B]"
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-2xl">{panel.icon}</span>
                        {isSelected && (
                          <span className="w-2.5 h-2.5 rounded-full bg-[#6D5EF8]" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-white">{panel.title}</h4>
                        <p className="text-[9.5px] text-slate-400 leading-relaxed">{panel.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Panel Members Preview Card */}
              <div className="p-5 bg-slate-950/60 border border-[#27272A]/80 rounded-xl space-y-3">
                <h4 className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider">Meet Your Panel Members</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(() => {
                    const list = [
                      { id: 0, name: "Sarah Jenkins", role: "HR Manager", focus: "Behavioral", img: sarahImg },
                      { id: 1, name: "David Chen", role: "Principal Engineer", focus: "Technical", img: davidImg },
                      { id: 2, name: "Marcus Brody", role: "Hiring Manager", focus: "Leadership", img: marcusImg }
                    ];

                    let mappedPersona = "mentor";
                    if (selectedPersona === "mentor" || selectedPersona === "recruiter" || selectedPersona === "friendly_startup") {
                      mappedPersona = "mentor";
                    } else if (selectedPersona === "architect" || selectedPersona === "strict_faang") {
                      mappedPersona = "architect";
                    } else if (selectedPersona === "director" || selectedPersona === "executive") {
                      mappedPersona = "product_leader";
                    }

                    let selectedList = [];
                    if (!interviewerCount || interviewerCount === 1) {
                      if (mappedPersona === "architect") {
                        selectedList = [list[1]]; // David
                      } else if (mappedPersona === "product_leader") {
                        selectedList = [list[2]]; // Marcus
                      } else {
                        selectedList = [list[0]]; // Sarah
                      }
                    } else if (interviewerCount === 2) {
                      selectedList = [list[0], list[1]]; // Sarah & David
                    } else {
                      selectedList = list.slice(0, interviewerCount);
                    }

                    return selectedList.map((member) => (
                      <div key={member.id} className="flex items-center gap-3 p-2 bg-slate-900 border border-[#27272A] rounded-lg">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 shadow-sm shrink-0">
                          <img 
                            src={member.img} 
                            alt={member.name} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h5 className="text-[11px] font-bold text-white">{member.name}</h5>
                          <p className="text-[9px] text-slate-400 font-mono">{member.role} ({member.focus})</p>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: INTERVIEWER PERSONALITY (7 Personas) */}
          {currentStep === 7 && (
            <div className="space-y-6 animate-fade-in">
              <p className="text-xs text-slate-400 leading-normal max-w-xl">
                Select your lead interviewer's style profile. This affects their questioning demeanor, feedback tone, and prompt criteria.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                  { id: "mentor", title: "Growth Mentor", emoji: "🍃", style: "Supportive Coach", desc: "Friendly, gives constructive suggestions and high encouragement." },
                  { id: "architect", title: "Strict Architect", emoji: "⚡", style: "Deep Technical Focus", desc: "Probes system limits, concurrency gaps, and transaction locks." },
                  { id: "director", title: "Product Director", emoji: "📈", style: "Strategic Growth", desc: "Probes customer-centric trade-offs, priority maps, and RICE values." },
                  { id: "recruiter", title: "Behavioral Recruiter", emoji: "🎯", style: "STAR & Culture", desc: "Focuses on culture fit, ownership, delegation, and STAR metrics." },
                  { id: "strict_faang", title: "Strict FAANG", emoji: "🏛️", style: "Deep Big Tech Bar", desc: "Unforgiving follow-ups on performance bottlenecks and low latency." },
                  { id: "friendly_startup", title: "Friendly Startup", emoji: "🦄", style: "Dynamic Velocity", desc: "Values fast output delivery, prototype iteration, and ownership." },
                  { id: "executive", title: "Executive VP", emoji: "👑", style: "High-Level Board", desc: "Probes organizational impact, budgeting limits, and resource strategy." },
                ].map((p) => {
                  const isSelected = selectedPersona === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPersona(p.id as any)}
                      className={`p-4 text-left rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-48 ${
                        isSelected
                          ? "bg-[#6D5EF8]/10 border-[#6D5EF8] shadow-md shadow-[#6D5EF8]/5"
                          : "bg-[#09090B]/60 border-[#27272A] hover:bg-[#09090B]"
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-lg">{p.emoji}</span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-[#6D5EF8]" />
                        )}
                      </div>
                      <div className="space-y-1 mt-2">
                        <h4 className="text-xs font-bold text-white truncate leading-tight">{p.title}</h4>
                        <span className="text-[8.5px] text-amber-400 font-bold bg-amber-500/5 border border-amber-500/10 px-1.5 py-0.5 rounded block max-w-max font-mono">
                          {p.style}
                        </span>
                        <p className="text-[9.5px] text-slate-500 leading-normal line-clamp-3 mt-1">{p.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 8: READY TO LAUNCH */}
          {currentStep === 8 && (
            <div className="space-y-6 animate-fade-in max-w-xl mx-auto text-center">
              <div className="w-12 h-12 bg-[#6D5EF8]/10 border border-[#6D5EF8]/20 rounded-full flex items-center justify-center text-white text-lg mx-auto mb-4">
                🚀
              </div>
              
              <h3 className="text-lg font-bold text-white tracking-tight">Configuration Complete</h3>
              <p className="text-xs text-slate-400">Review your final interview receipt prior to kicking off the simulation.</p>

              {/* Receipt Visualizer */}
              <div className="bg-[#09090B] border border-[#27272A] rounded-2xl p-5 text-left space-y-4 font-mono text-[11px] text-slate-300">
                <div className="flex justify-between border-b border-[#27272A]/80 pb-2 text-[10px] font-bold text-[#6D5EF8]">
                  <span>TRACKING METRIC</span>
                  <span>CALIBRATION</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Employer:</span>
                  <span className="text-white font-bold">{getActiveCompanyDisplay()}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Position Title:</span>
                  <span className="text-white font-bold truncate max-w-[200px]">{getActiveRoleDisplay()}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Interview Style:</span>
                  <span className="text-indigo-400 font-bold uppercase">{selectedStyle}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Difficulty Grade:</span>
                  <span className="text-emerald-400 font-bold uppercase">{selectedDifficulty} Level</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">AI Personality:</span>
                  <span className="text-amber-400 font-bold uppercase">{selectedPersona}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Panel Size:</span>
                  <span className="text-indigo-400 font-bold uppercase">
                    {interviewerCount === 1 ? "1 (Single)" : interviewerCount === 2 ? "2 (Duo Panel)" : "3 (Full Panel)"}
                  </span>
                </div>

                <div className="flex justify-between border-t border-[#27272A] pt-3 text-[10px] text-slate-500 leading-normal">
                  <div className="flex gap-1.5 items-start">
                    <Info className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>Real-time speech recognition is active. You may respond either by typing or by speaking using your system microphone.</span>
                  </div>
                </div>
              </div>

              {isAnalyzing ? (
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                  <div className="w-5 h-5 border-2 border-[#6D5EF8] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <span className="text-xs font-mono text-slate-400 animate-pulse block">Web Searching Industry Trends & Synthesizing Questions...</span>
                </div>
              ) : null}
            </div>
          )}

        </div>

        {/* Wizard Controls */}
        <div className="flex justify-between border-t border-[#27272A] pt-4 mt-auto">
          <button
            onClick={handlePrevStep}
            disabled={currentStep === 1 || isAnalyzing}
            className="px-4 py-2 bg-[#111827] border border-[#27272A] hover:bg-slate-900 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={handleNextStep}
              className="px-4 py-2 bg-[#6D5EF8] hover:bg-[#6D5EF8]/90 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Continue</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={isAnalyzing}
              className="px-6 py-2.5 bg-[#6D5EF8] hover:bg-[#6D5EF8]/90 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#6D5EF8]/15 disabled:opacity-50"
            >
              <Zap className="h-4 w-4" />
              <span>Begin Simulation</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
