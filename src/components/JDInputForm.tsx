import React, { useState } from "react";
import { Sparkles, Terminal, FileText, Send, Building } from "lucide-react";
import { motion } from "motion/react";

interface JDInputFormProps {
  onSubmit: (jd: string, companyName: string) => void;
  isLoading: boolean;
}

const SAMPLE_JDS = [
  {
    title: "Senior React Engineer",
    company: "Airbnb",
    text: `About the Role:
We are looking for a Senior React Engineer to join our core guest experience team. In this role, you will lead the architecture of core frontend modules, focus on server-side rendering (SSR), optimize performance, and design elegant user workflows.

Requirements:
- 5+ years of experience with React, Next.js, and TypeScript.
- Strong knowledge of modern browser performance, caching, and state management.
- Experience writing clean, reusable components and mentorship of junior engineers.
- Excellent communication skills and user-centric design approach.`
  },
  {
    title: "Staff Backend Engineer",
    company: "Google",
    text: `About the Role:
Google is seeking a Staff Backend Engineer for Cloud Spanner development. You will build highly scalable, distributed storage engines, write concurrent transaction management algorithms, and optimize database queries.

Requirements:
- Strong experience with C++, Java, or Go.
- Profound knowledge of distributed systems, database internals, and concurrency controls.
- Experience designing large-scale cloud services with millions of requests per second.
- Exceptional analytical, problem-solving, and system design expertise.`
  },
  {
    title: "Technical Product Manager",
    company: "Stripe",
    text: `About the Role:
Stripe is hiring a Technical Product Manager for our global APIs team. You will drive the roadmap for billing infrastructures, developer tools, and merchant API onboarding.

Requirements:
- Technical background; experience as a software engineer or architect is a plus.
- Proven track record of launching developer-facing APIs or checkout platforms.
- Strong ability to coordinate with cross-functional stakeholders (sales, legal, security, eng).
- Customer empathy and analytical skills using SQL or business intelligence dashboards.`
  }
];

export default function JDInputForm({ onSubmit, isLoading }: JDInputFormProps) {
  const [jdText, setJdText] = useState("");
  const [company, setCompany] = useState("");

  const handleSelectSample = (sample: typeof SAMPLE_JDS[0]) => {
    setJdText(sample.text);
    setCompany(sample.company);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (jdText.trim() && !isLoading) {
      onSubmit(jdText, company);
    }
  };

  return (
    <div className="w-full">
      {/* Welcome Hero Card */}
      <div className="mb-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 text-white shadow-xl md:p-8">
        <div className="flex items-center space-x-2 rounded-full bg-white/10 px-3 py-1 text-slate-200 text-xs font-mono max-w-fit mb-4">
          <Sparkles className="h-3.5 w-3.5 text-amber-300" />
          <span>Professional Interview Simulator v1.4</span>
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight md:text-3.5xl">
          Hi! I am your Technical Recruiter & Coach.
        </h2>
        <p className="mt-3 text-sm text-slate-300 leading-relaxed max-w-2xl">
          Provide any Job Description below. I will search the web for recent industry standards,
          analyze the required competencies, assess the target difficulty, and construct a realistic,
          live interview session tailored specifically to that role and company.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Main Form Panel */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Name */}
            <div>
              <label htmlFor="company-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Company Name <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Building className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="company-input"
                  type="text"
                  className="block w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 font-sans text-sm placeholder-slate-400 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
                  placeholder="e.g., Google, Airbnb, Stripe"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Job Description Textarea */}
            <div>
              <label htmlFor="jd-textarea" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Paste Job Description (JD) *
              </label>
              <div className="relative rounded-lg shadow-sm">
                <textarea
                  id="jd-textarea"
                  rows={8}
                  className="block w-full rounded-lg border border-slate-200 p-4 font-sans text-sm leading-relaxed placeholder-slate-400 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
                  placeholder="Paste the full job description text here, including requirements, responsibilities, and technologies..."
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* CTA Button */}
            <button
              id="submit-jd-btn"
              type="submit"
              disabled={isLoading || !jdText.trim()}
              className="flex w-full items-center justify-center space-x-2 rounded-lg bg-slate-900 py-3.5 font-medium text-white shadow-md transition-all hover:bg-slate-850 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span className="font-mono text-sm tracking-wider uppercase">Running Deep Search & Analysis...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Analyze JD & Build Interview Plan</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Sidebar Sample Templates */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
              <FileText className="h-4 w-4 text-slate-400" />
              <span>Quick Test Templates</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Don't have a JD on hand? Click any template below to load real-world criteria automatically:
            </p>
            <div className="space-y-3">
              {SAMPLE_JDS.map((sample, idx) => (
                <button
                  key={idx}
                  id={`sample-jd-${idx}`}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className="w-full text-left rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-slate-400 transition-colors cursor-pointer group"
                >
                  <div className="font-display text-sm font-semibold text-slate-850 group-hover:text-slate-950">
                    {sample.title}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {sample.company}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-slate-300 p-5 font-mono text-[11px] text-slate-500 leading-relaxed bg-slate-50/50">
            <div className="flex items-center space-x-1.5 mb-2 font-semibold text-slate-600 uppercase tracking-wider">
              <Terminal className="h-3.5 w-3.5" />
              <span>Real-Time Engine</span>
            </div>
            We utilize advanced Google Search grounding, mapping live company hiring profiles and stack changes to curate questions.
          </div>
        </div>
      </div>
    </div>
  );
}
