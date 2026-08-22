import React, { useState } from "react";
import { 
  X, 
  Monitor, 
  Server, 
  Database, 
  ShieldAlert, 
  Layers, 
  CheckCircle2, 
  FileText, 
  Cpu, 
  GitBranch,
  Terminal
} from "lucide-react";

interface PresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleName: string;
  companyName: string;
}

export function PresentationModal({
  isOpen,
  onClose,
  roleName,
  companyName
}: PresentationModalProps) {
  const [activeTab, setActiveTab] = useState<"architecture" | "whiteboard" | "resume" | "rubric">("architecture");

  if (!isOpen) return null;

  return (
    <div 
      id="modal-boardroom-presentation"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-fade-in"
    >
      <div className="w-full max-w-4xl liquid-glass-strong rounded-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <Monitor className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-white font-display">Executive Boardroom Screen Share</h3>
              <p className="text-[10px] text-slate-400 font-mono">
                {companyName ? `${companyName} • ` : ""}Target Architecture Case Study
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Presentation Tabs */}
            <div className="flex items-center gap-1 liquid-glass-subtle p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab("architecture")}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer ${
                  activeTab === "architecture" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                }`}
              >
                Architecture Spec
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("whiteboard")}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer ${
                  activeTab === "whiteboard" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                }`}
              >
                System Flow
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("rubric")}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer ${
                  activeTab === "rubric" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                }`}
              >
                Rubric
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 liquid-glass-subtle hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-left flex-1">
          {activeTab === "architecture" && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 liquid-glass-medium border border-indigo-500/20 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">System Parameters</span>
                  <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                    High Throughput SLA
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Design a fault-tolerant, horizontally scalable real-time dispatch service capable of processing 250,000 requests per second under peak event traffic with sub-45ms P99 latency.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 liquid-glass-medium rounded-xl border border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold">
                    <Server className="w-3.5 h-3.5" />
                    <span>Ingress Tier</span>
                  </div>
                  <p className="text-[10.5px] text-slate-400 leading-normal">
                    Geo-distributed Envoy proxy mesh with rate-limiting and JWT edge validation.
                  </p>
                </div>

                <div className="p-3.5 liquid-glass-medium rounded-xl border border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Event Stream</span>
                  </div>
                  <p className="text-[10.5px] text-slate-400 leading-normal">
                    Partitioned Apache Kafka clusters with idempotent consumers and dead-letter queues.
                  </p>
                </div>

                <div className="p-3.5 liquid-glass-medium rounded-xl border border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                    <Database className="w-3.5 h-3.5" />
                    <span>Persistence Layer</span>
                  </div>
                  <p className="text-[10.5px] text-slate-400 leading-normal">
                    Sharded PostgreSQL + Redis distributed caching cluster with multi-region replication.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "whiteboard" && (
            <div className="p-6 liquid-glass-medium rounded-2xl border border-white/10 space-y-4 animate-fade-in text-center">
              <div className="flex items-center justify-center gap-2 text-slate-300 font-mono text-xs mb-2">
                <GitBranch className="w-4 h-4 text-indigo-400" />
                <span>Distributed Pipeline Topology</span>
              </div>
              
              {/* Visual ASCII / SVG Node Flow */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-4">
                <div className="px-4 py-3 liquid-glass-subtle rounded-xl border border-white/20 text-xs font-mono text-white">
                  Client Request (HTTPS)
                </div>
                <span className="text-indigo-400 font-bold">➔</span>
                <div className="px-4 py-3 liquid-glass-subtle rounded-xl border border-indigo-400/40 text-xs font-mono text-indigo-200">
                  Global Load Balancer
                </div>
                <span className="text-indigo-400 font-bold">➔</span>
                <div className="px-4 py-3 liquid-glass-subtle rounded-xl border border-emerald-400/40 text-xs font-mono text-emerald-200">
                  Stateless Worker Nodes
                </div>
                <span className="text-indigo-400 font-bold">➔</span>
                <div className="px-4 py-3 liquid-glass-subtle rounded-xl border border-amber-400/40 text-xs font-mono text-amber-200">
                  Distributed Cache & DB
                </div>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                💡 Reference this topology when answering David Chen's system scalability questions.
              </p>
            </div>
          )}

          {activeTab === "rubric" && (
            <div className="space-y-3 animate-fade-in">
              <div className="p-3.5 liquid-glass-medium rounded-xl border border-white/10 space-y-1">
                <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase">1. Architectural Rigor (40%)</span>
                <p className="text-xs text-slate-300">Clear trade-off analysis between latency, throughput, consistency, and operational cost.</p>
              </div>
              <div className="p-3.5 liquid-glass-medium rounded-xl border border-white/10 space-y-1">
                <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase">2. STAR Structural Clarity (30%)</span>
                <p className="text-xs text-slate-300">Concise presentation of Situation, Task, Action, and quantifiable business Result.</p>
              </div>
              <div className="p-3.5 liquid-glass-medium rounded-xl border border-white/10 space-y-1">
                <span className="text-[9px] font-mono font-bold text-amber-400 uppercase">3. Executive Communication (30%)</span>
                <p className="text-xs text-slate-300">Composed delivery pace, zero defensive reactions, structured stakeholder prioritization.</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md shadow-indigo-600/30"
          >
            Close Presentation
          </button>
        </div>
      </div>
    </div>
  );
}
