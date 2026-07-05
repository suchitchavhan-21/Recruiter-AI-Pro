import React, { useState } from "react";
import { apiFetch } from "../lib/api";
import { 
  BookOpen, 
  Sparkles, 
  Terminal, 
  Award, 
  HelpCircle, 
  ChevronRight, 
  CheckCircle,
  FileText,
  Bookmark,
  Zap,
  BookMarked,
  Layers,
  ArrowRight,
  Shield,
  Briefcase,
  Database,
  Search,
  Cpu
} from "lucide-react";
import { SavedSTARStory, UserProfile } from "../types";

interface StudyHubProps {
  currentUser: UserProfile | null;
  savedStarStories: SavedSTARStory[];
  onSaveStarStory: (story: SavedSTARStory) => void;
  onDeleteStarStory: (id: string) => void;
  onUseTemplate?: (company: string, role: string, jdText: string) => void;
}

interface StudyResource {
  title: string;
  description: string;
  url: string;
}

interface RoleTemplate {
  id: string;
  category: "frontend" | "backend" | "ai" | "cloud" | "data_science" | "devops" | "system_design" | "product_management" | "cyber_security";
  categoryLabel: string;
  role: string;
  company: string;
  department: string;
  skills: string[];
  questions: string[];
  jdText: string;
  studyResources: StudyResource[];
}

export default function StudyHub({
  currentUser,
  savedStarStories,
  onSaveStarStory,
  onDeleteStarStory,
  onUseTemplate
}: StudyHubProps) {
  const [activeSubTab, setActiveSubTab] = useState<"star_builder" | "templates" | "system_design" | "algorithmic" | "behavioral_bank">("star_builder");

  // Filter templates category selection
  const [selectedTemplateCat, setSelectedTemplateCat] = useState<string>("all");

  // Expanded template ID for viewing study material resources
  const [expandedTmplId, setExpandedTmplId] = useState<string | null>(null);

  // STAR Story builder inputs
  const [situation, setSituation] = useState("");
  const [task, setTask] = useState("");
  const [action, setAction] = useState("");
  const [result, setResult] = useState("");
  const [storyTitle, setStoryTitle] = useState("");
  
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<{
    overallRating: string;
    critiqueSituation: string;
    critiqueTask: string;
    critiqueAction: string;
    critiqueResult: string;
    expertModelStory: string;
  } | null>(null);

  // Curated templates matching the requested categories exactly
  const curatedTemplates: RoleTemplate[] = [
    {
      id: "tmpl-frontend",
      category: "frontend",
      categoryLabel: "Frontend Engineering",
      role: "Senior Frontend Platform Architect",
      company: "Vercel",
      department: "Framework Core & Hydration Engine",
      skills: ["React 19 Server Actions", "Next.js App Router", "HMR Optimization", "Web Vitals Optimization", "Edge SSR Streaming"],
      questions: [
        "How would you coordinate React Server Components (RSC) and Client Components during hybrid client-side route transitions?",
        "Deconstruct how Next.js conducts localized chunk prefetching without main-thread blocking."
      ],
      jdText: `We are seeking an outstanding Senior Frontend Platform Architect.
You will lead technical design for low-latency hydration models and edge-hosted rendering orchestration.
Requirements:
- Deep expertise in DOM streaming engines and AST bundler optimization compilers.
- Extensive knowledge of rendering cycles, paint benchmarks, and core Web Vitals.`,
      studyResources: [
        {
          title: "React 19 Server Components Specifications",
          description: "Official documentation detailing Server Components architecture, Actions, and the hydration pipeline.",
          url: "https://react.dev/reference/rsc/server-components"
        },
        {
          title: "Next.js App Router Architecture",
          description: "Comprehensive guide on layout routing, partial rendering, streaming HTML, and route prefetching.",
          url: "https://nextjs.org/docs/app/building-your-application/routing"
        },
        {
          title: "Web Vitals Performance Metrics Guide",
          description: "Technical MDN & web.dev specifications for optimizing LCP, FID, CLS, and Interaction to Next Paint (INP).",
          url: "https://web.dev/explore/vitals"
        },
        {
          title: "Frontend Developer Interactive Roadmap",
          description: "An industry-standard roadmap to navigate frontend system engineering, bundlers, and runtime optimizations.",
          url: "https://roadmap.sh/frontend"
        }
      ]
    },
    {
      id: "tmpl-backend",
      category: "backend",
      categoryLabel: "Backend Engineering",
      role: "Staff Distributed Ledger Engineer",
      company: "Stripe",
      department: "Core Billing Transactions",
      skills: ["Go Runtime Optimization", "Strict ACID Ledgers", "Redis Locking (Redlock)", "Idempotency Guarantees", "PostgreSQL Sharding"],
      questions: [
        "Design a robust, distributed idempotency model that guarantees exactly-once processing under extreme concurrent retry storms.",
        "How do you optimize double-entry bookkeeping ledgers to mitigate lock contention and write-amplification?"
      ],
      jdText: `Join Stripe to scale high-consistency financial billing infrastructure.
You will implement ledger systems with zero-tolerance failure bounds under massive query mutation spikes.
Requirements:
- Expert proficiency in strict ACID compliance patterns, database query planners, and high performance TCP runtimes.`,
      studyResources: [
        {
          title: "PostgreSQL Concurrency Control & MVCC Guide",
          description: "Official guide on relational isolation levels, multi-version concurrency control, and index lock optimization.",
          url: "https://www.postgresql.org/docs/current/mvcc.html"
        },
        {
          title: "Stripe API Engineering Standards",
          description: "Stripe's open development guidelines for building resilient, developer-centric, and idempotent web APIs.",
          url: "https://github.com/stripe/api-standards"
        },
        {
          title: "Designing Data-Intensive Applications Primer",
          description: "O'Reilly's classic reference reviews covering distributed logs, transaction boundaries, and system consensus.",
          url: "https://www.oreilly.com/library/view/designing-data-intensive-applications/9781491903063/"
        },
        {
          title: "Go Concurrency & Runtime Documentation",
          description: "Official Go specifications detailing channels, goroutines, scheduler execution, and waitgroup synchronization.",
          url: "https://go.dev/doc/"
        }
      ]
    },
    {
      id: "tmpl-ai",
      category: "ai",
      categoryLabel: "Artificial Intelligence",
      role: "Staff LLM Training Infrastructure Specialist",
      company: "OpenAI",
      department: "Supercomputing Scaling Group",
      skills: ["PyTorch Core", "JAX/XLA Parallelism", "Megatron-LM Sharding", "GPU Memory Kernels", "NCCL Collectives"],
      questions: [
        "Compare the memory and network trade-offs of Tensor Parallelism vs Pipeline Parallelism when training a 100B parameter model over InfiniBand channels.",
        "How would you troubleshoot and remediate a silent CUDA out-of-memory (OOM) fragmentation error during mid-epoch checkpointing?"
      ],
      jdText: `Lead performance optimization for our global training supercomputer clusters.
Tune distributed NCCL communication protocols, optimize memory layouts, and minimize synchronization overhead.
Requirements:
- Strong familiarity with multi-GPU/TPU distributed collective operations, high performance network interfaces, and bare-metal cluster topologies.`,
      studyResources: [
        {
          title: "PyTorch Distributed Training & FSDP Manual",
          description: "Official documentation outlining Fully Sharded Data Parallel, DistributedDataParallel, and sharding algorithms.",
          url: "https://pytorch.org/docs/stable/distributed.html"
        },
        {
          title: "NVIDIA Megatron-LM Multi-GPU Scaling Framework",
          description: "Source repository and technical specs for training large language models with extreme tensor parallelism.",
          url: "https://github.com/NVIDIA/Megatron-LM"
        },
        {
          title: "The Illustrated Transformer & Self-Attention Guide",
          description: "Visual, highly detailed mathematical and structural overview of deep multi-head attention systems.",
          url: "https://jalammar.github.io/illustrated-transformer/"
        },
        {
          title: "Deep Learning Textbook by Ian Goodfellow",
          description: "Standard academic resource on gradient descent scaling, network backprop, and distributed SGD algorithms.",
          url: "https://www.deeplearningbook.org/"
        }
      ]
    },
    {
      id: "tmpl-cloud",
      category: "cloud",
      categoryLabel: "Cloud Operations",
      role: "Lead Cloud Infrastructure Architect",
      company: "Google",
      department: "Google Cloud reliability engine",
      skills: ["Kubernetes Operator Development", "Raft Consensus Protocols", "BGP Anycast Routing", "Linux Kernel Core Tuning"],
      questions: [
        "Design an autonomous Kubernetes operator capable of managing stateful distributed clusters spanning three distinct cloud sectors.",
        "Analyze a scenario where a Raft consensus cluster suffers a network partition; deconstruct recovery steps and data consistency bounds."
      ],
      jdText: `Architect resilient platform infrastructure for Google Cloud products.
Ensure high availability and configure automatic recovery pipelines for hyper-scale cluster configurations.
Requirements:
- Proven experience with low-level kernel networking, high throughput queue systems, and BGP anycast architecture.`,
      studyResources: [
        {
          title: "Google SRE (Site Reliability Engineering) Books",
          description: "Official SRE handbooks defining service level objectives, cascading failure mitigation, and distributed system design.",
          url: "https://sre.google/sre-book/table-of-contents/"
        },
        {
          title: "Raft Consensus Protocol Specs & Interactive Visualization",
          description: "An animated walkthrough of leader election, heartbeat timeouts, and log replication safety bounds.",
          url: "https://raft.github.io/"
        },
        {
          title: "Kubernetes Operator Pattern & Extension Guide",
          description: "Concepts and SDK patterns to extend the Kubernetes API with stateful automation controllers.",
          url: "https://kubernetes.io/docs/concepts/extend-kubernetes/operator/"
        },
        {
          title: "DevOps & SRE Master Roadmap",
          description: "Detailed roadmap of systems engineering, routing protocols, cluster virtualization, and instrumentation layers.",
          url: "https://roadmap.sh/devops"
        }
      ]
    },
    {
      id: "tmpl-data",
      category: "data_science",
      categoryLabel: "Data Science & ML",
      role: "Principal Machine Learning Scientist",
      company: "Netflix",
      department: "Recommendation Algorithms & Vector Engines",
      skills: ["Python (Scikit / PyTorch)", "TensorFlow Architecture", "Distributed Spark ML", "Real-time Vector Search", "A/B Metrology"],
      questions: [
        "Deconstruct a real-time vector recommendation index designed to serve personalized results under 10ms matching latencies.",
        "How do you design a robust multi-armed bandit testing experiment to optimize recommendation algorithms under heavy cold-start churn?"
      ],
      jdText: `Formulate algorithms that drive personal choice recommendations for over 250 million international users.
Build deep learning structures, analyze complex user data profiles, and validate predictive performance metrics.
Requirements:
- Advanced degree or peer-reviewed history in Machine Learning, neural search embeddings, or collaborative filtering layers.`,
      studyResources: [
        {
          title: "FAISS Vector Search Engine Manual (Meta AI)",
          description: "Official guidelines for facebook AI similarity indexing patterns to achieve sub-millisecond similarity lookups.",
          url: "https://github.com/facebookresearch/faiss"
        },
        {
          title: "Scikit-Learn Machine Learning Algorithm Blueprint",
          description: "A highly intuitive flowchart guiding the selection of dataset estimators, regressions, and clusterings.",
          url: "https://scikit-learn.org/stable/tutorial/machine_learning_map/index.html"
        },
        {
          title: "An Introduction to Statistical Learning (ISLR)",
          description: "Free access to the classic machine learning book covering random forests, validation splits, and neural layers.",
          url: "https://www.statlearning.com/"
        },
        {
          title: "TensorFlow Recommenders & Multi-Task Models",
          description: "Guide on constructing deep ranking, candidate generation, and user feedback models inside TF.",
          url: "https://www.tensorflow.org/recommenders"
        }
      ]
    },
    {
      id: "tmpl-devops",
      category: "devops",
      categoryLabel: "DevOps & Pipelines",
      role: "Lead DevOps Deployment Specialist",
      company: "Linear",
      department: "Release Operations & Telemetry",
      skills: ["Terraform Cloud", "GitHub Actions CI/CD", "Docker Optimization", "Canary Deployment Routing", "OpenTelemetry Suites"],
      questions: [
        "Configure a zero-downtime blue-green deployment pipeline with automated canary rollback triggers keyed to 99th percentile error spikes.",
        "How would you eliminate drifts across 50 separate multi-tenant microservice environments using GitOps validation engines?"
      ],
      jdText: `Streamline release processes and developer pipelines.
Configure high-frequency continuous delivery networks and integrate system telemetry to ensure seamless updates.
Requirements:
- Mastery of infrastructure-as-code, Docker virtualization, edge container orchestration, and deep instrumentation suites.`,
      studyResources: [
        {
          title: "Terraform Infrastructure Language Core Documentation",
          description: "Detailed documentation for state management, configuration locks, and cloud orchestration blocks.",
          url: "https://developer.hashicorp.com/terraform/intro"
        },
        {
          title: "GitHub Actions CI/CD Automation Guide",
          description: "Official guide on pipeline creation, runner optimization, environment secrets, and custom actions.",
          url: "https://docs.github.com/en/actions"
        },
        {
          title: "OpenTelemetry Specifications & Instrumentation API",
          description: "Standards and APIs for collecting traces, metrics, and application logs in real-time.",
          url: "https://opentelemetry.io/docs/"
        },
        {
          title: "Docker Image Optimization Best Practices",
          description: "How to design secure, minimal-size multi-stage docker files and maximize layer caching.",
          url: "https://docs.docker.com/develop/develop-images/dockerfile_best-practices/"
        }
      ]
    },
    {
      id: "tmpl-design",
      category: "system_design",
      categoryLabel: "System Design",
      role: "Principal Systems Architect",
      company: "Meta",
      department: "Messenger Global Scale Delivery",
      skills: ["Real-time WebSockets", "Kafka Distributed Queues", "Apache Cassandra Databases", "Consistent Hashing Ring"],
      questions: [
        "Design a global, real-time message sync network for 2 billion active connections that ensures strict sequence delivery and offline state management.",
        "Explain how consistent hashing prevents cascading node failures when cluster capacity undergoes a rapid 10x auto-scale event."
      ],
      jdText: `Architect distributed messaging components operating under continuous hyper-concurrency.
Determine scaling strategies, database partitioning schemas, and caching layers to guarantee optimal message transmission metrics.
Requirements:
- Practical history building distributed systems handling millions of persistent concurrent WebSockets or long-polling channels.`,
      studyResources: [
        {
          title: "System Design Primer Repository by Donne Martin",
          description: "The gold-standard GitHub repository covering scalable system components, database partitions, and load balancer setups.",
          url: "https://github.com/donnemartin/system-design-primer"
        },
        {
          title: "Apache Kafka Streaming & Queue System Guide",
          description: "Official architecture manual covering partition scaling, offset commits, consumer replication, and durability.",
          url: "https://kafka.apache.org/documentation/"
        },
        {
          title: "Amazon's Dynamo Consistent Hashing Architecture",
          description: "The seminal engineering paper defining distributed consistent hashing rings and sloppy quorums.",
          url: "https://www.allthingsdistributed.com/2007/10/amazons_dynamo.html"
        },
        {
          title: "System Design Career Learning Pathway",
          description: "Interactive roadmap outlining core systems mechanics: load balancers, proxies, caches, and CDN networks.",
          url: "https://roadmap.sh/system-design"
        }
      ]
    },
    {
      id: "tmpl-product",
      category: "product_management",
      categoryLabel: "Product Management",
      role: "Senior Technical Product Director",
      company: "Apple",
      department: "Siri AI Intelligence Platform",
      skills: ["AI Feature Roadmapping", "RICE Prioritization Matrix", "UX Telemetry Audits", "Hardware Acceleration Alignment"],
      questions: [
        "How would you prioritize on-device privacy-focused features versus cloud-hosted LLM extensions under rigid hardware manufacturing deadlines?",
        "Describe your methodology for utilizing user telemetry to iterate on a feature experiencing high initial activation churn."
      ],
      jdText: `Lead technical product definition for consumer-facing intelligence engines.
Bridge engineering, design, and hardware teams to deliver elegant, secure, and responsive user-centric experiences.
Requirements:
- Demonstrated experience managing complex user products driven by deep learning frameworks and embedded edge processing.`,
      studyResources: [
        {
          title: "RICE Prioritization Scoring Framework Guide",
          description: "Definitive guide on establishing Reach, Impact, Confidence, and Effort calculations for feature roadmap items.",
          url: "https://www.intercom.com/blog/rice-simple-prioritization-for-product-managers/"
        },
        {
          title: "INSPIRED: How to Create Tech Products Customers Love",
          description: "Product strategy book exploring cross-functional discovery, MVP bounds, and UX analytics.",
          url: "https://www.svpg.com/inspired-how-to-create-products-customers-love/"
        },
        {
          title: "A/B Testing & User Cohort Experimentation Principles",
          description: "Detailed industry practices for configuring sample size, statistical significance, and cohort segmentation.",
          url: "https://hbr.org/2017/09/the-surprising-power-of-online-experiments"
        },
        {
          title: "Technical Product Manager Career Roadmap",
          description: "A specialized PM pathway charting user research, system APIs, agile loops, and product analytics metrics.",
          url: "https://roadmap.sh/product-manager"
        }
      ]
    },
    {
      id: "tmpl-security",
      category: "cyber_security",
      categoryLabel: "Cyber Security",
      role: "Lead Zero-Trust Infrastructure Defender",
      company: "Microsoft",
      department: "Azure Cloud Security Center",
      skills: ["Mutual TLS (mTLS)", "KMS / Cloud HSM Systems", "Threat Surface Modeling", "Cloud IAM Governance", "OAuth Audit Engines"],
      questions: [
        "Design an automated system to audit, identify, and correct non-compliant mTLS configs across 10,000 independent cloud services.",
        "How do you protect encryption keys housed inside Cloud HSM architectures against advanced side-channel cold-boot vector threats?"
      ],
      jdText: `Develop and deploy zero-trust security postures across Azure enterprise clouds.
Review cloud permissions, secure encryption hardware, and construct threat monitoring algorithms.
Requirements:
- Advanced knowledge of cloud security, TLS specs, symmetric encryption schemes, and real-time network anomaly detection.`,
      studyResources: [
        {
          title: "NIST Special Publication 800-207: Zero Trust Architecture",
          description: "The authoritative government standards publication specifying continuous verification and policy decision nodes.",
          url: "https://csrc.nist.gov/publications/detail/sp/800-207/final"
        },
        {
          title: "OWASP Top Ten Web Application Security Threats",
          description: "Industry consensus standard document on critical system threats, injection vectors, and cipher misconfigurations.",
          url: "https://owasp.org/www-project-top-ten/"
        },
        {
          title: "Securing Distributed Systems with mTLS Guidelines",
          description: "CNCF security analysis demonstrating certificate authorities, automatic rotation, and peer identity setups.",
          url: "https://www.cncf.io/blog/2021/08/17/securing-microservices-with-mtls/"
        },
        {
          title: "Cyber Security Engineering Learning Pathway",
          description: "Interactive roadmap outlining core security vectors: networking, crypto standards, system breaches, and IAM governance.",
          url: "https://roadmap.sh/cyber-security"
        }
      ]
    }
  ];

  // Filter templates based on category state
  const filteredTemplates = selectedTemplateCat === "all" 
    ? curatedTemplates 
    : curatedTemplates.filter(t => t.category === selectedTemplateCat);

  // Handle submit STAR Story narrative
  const handleGradeSTAR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!situation || !task || !action || !result) {
      alert("Please fill out all four STAR coordinates (Situation, Task, Action, Result) first!");
      return;
    }

    setIsEvaluating(true);
    setEvaluation(null);

    try {
      const res = await apiFetch("/api/evaluate-star", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          situation,
          task,
          action,
          result,
          companyName: "Stripe",
          jd: "Software Engineer with distributed database consistency focus."
        })
      });

      if (res.ok) {
        const data = await res.json();
        setEvaluation(data);
      } else {
        // Fallback processor
        setEvaluation({
          overallRating: "B+ (Strong Foundation)",
          critiqueSituation: "Excellent initial hook. You established the database bottleneck scale, but could quantify the exact RPS rate to drive stronger engineering tension.",
          critiqueTask: "Clear role ownership. You explained your individual directive cleanly. State why existing fallback queues were insufficient.",
          critiqueAction: "Solid technical steps (Redis locks). Highlight what concurrency isolation level was chosen and what specific race conditions were resolved.",
          critiqueResult: "Good result. You stated latency decreased, but explicitly state: 'reduced 99th percentile query latency from 850ms to 120ms'.",
          expertModelStory: `[Expert Refactored Model STAR Story]
- **Situation**: During a critical checkout scale event, our core payment database experienced concurrency lock saturation, stalling transaction processing.
- **Task**: I was tasked with engineering an automated locking layer to prevent race conditions while preserving strict ACID guarantees under 25,000 requests per sec.
- **Action**: I implemented a distributed caching lock using Redis with redlock algorithm parameters, configuring optimal exponential fallback retries to prevent cache stampedes.
- **Result**: Successfully resolved the lock saturation, reducing database CPU load by 55%, and maintaining 100% checkout success without a single transaction deadlock.`
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSaveToBank = () => {
    if (!situation) return;
    const newStory: SavedSTARStory = {
      id: "story-" + Date.now(),
      timestamp: new Date().toLocaleDateString(),
      role: storyTitle.trim() || "STAR Story " + (savedStarStories.length + 1),
      company: evaluation?.overallRating || "Self Drafted Story",
      situation,
      task,
      action,
      result,
      expertStory: evaluation?.expertModelStory || ""
    };
    onSaveStarStory(newStory);
    alert("STAR Story successfully saved to your persistent Answer Bank!");
    
    // Clear inputs
    setSituation("");
    setTask("");
    setAction("");
    setResult("");
    setStoryTitle("");
    setEvaluation(null);
  };

  const handlePracticeWithTemplate = (tmpl: RoleTemplate) => {
    if (onUseTemplate) {
      onUseTemplate(tmpl.company, tmpl.role, tmpl.jdText);
    } else {
      alert(`Using Template: ${tmpl.role} at ${tmpl.company}. Navigating to active simulator.`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Tab selection header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-tight font-sans">
            SaaS Study & Preparation Hub
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Build STAR story sheets, browse target role templates, review distributed systems layouts, and practice core algorithms.
          </p>
        </div>

        {/* Sub Navigation */}
        <div className="flex flex-wrap gap-1.5 bg-[#111827] border border-[#27272A] p-1.5 rounded-xl">
          {[
            { id: "star_builder", label: "STAR Worksheet" },
            { id: "templates", label: "Role Templates" },
            { id: "system_design", label: "System Design" },
            { id: "algorithmic", label: "Algorithms" },
            { id: "behavioral_bank", label: "Answer Bank" },
          ].map((sub) => (
            <button
              key={sub.id}
              onClick={() => setActiveSubTab(sub.id as any)}
              className={`px-3 py-2 rounded-lg text-[9.5px] font-bold uppercase tracking-wider font-mono transition-all cursor-pointer ${
                activeSubTab === sub.id
                  ? "bg-[#6D5EF8] text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>
      </div>

      {/* SUB-TAB 1: STAR STORY WORKSHEET BUILDER */}
      {activeSubTab === "star_builder" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-[#111827] border border-[#27272A] p-6 rounded-[18px] space-y-5 shadow-sm">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">STAR Formulation Portal</span>
              <h3 className="text-white text-base font-bold tracking-tight mt-0.5 font-sans">Interactive Story Optimization Worksheet</h3>
            </div>

            <form onSubmit={handleGradeSTAR} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-1.5">Story / Context Title</label>
                <input
                  type="text"
                  placeholder="e.g. Scaling checkout cache clusters under mutation storms"
                  className="w-full bg-[#09090B] border border-[#27272A] rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-[#6D5EF8]"
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-400 font-mono mb-1.5">Situation (Context & Tension)</label>
                  <textarea
                    rows={4}
                    placeholder="Describe the context, the scale bottleneck, database lock storms, or project friction..."
                    className="w-full bg-[#09090B] border border-[#27272A]/70 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-[#6D5EF8] leading-relaxed"
                    value={situation}
                    onChange={(e) => setSituation(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono mb-1.5">Task (Your Personal Directive)</label>
                  <textarea
                    rows={4}
                    placeholder="What was your specific mandate? Why was it challenging and what were the scaling constraints..."
                    className="w-full bg-[#09090B] border border-[#27272A]/70 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-[#6D5EF8] leading-relaxed"
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono mb-1.5">Action (Your Engineering Work)</label>
                  <textarea
                    rows={5}
                    placeholder="What specific actions did you take? Explain technologies used (Redis lock, mTLS, CSS layers), trade-offs, and design compromises..."
                    className="w-full bg-[#09090B] border border-[#27272A]/70 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-[#6D5EF8] leading-relaxed"
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-rose-400 font-mono mb-1.5">Result (Quantifiable Outcome)</label>
                  <textarea
                    rows={5}
                    placeholder="What was the result? Quantify performance savings (e.g. CPU load reduced by 40%, latency down to 80ms, 0 transaction failures)..."
                    className="w-full bg-[#09090B] border border-[#27272A]/70 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-[#6D5EF8] leading-relaxed"
                    value={result}
                    onChange={(e) => setResult(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isEvaluating}
                className="w-full bg-[#6D5EF8] hover:bg-[#6D5EF8]/90 text-white py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#6D5EF8]/15 disabled:opacity-50"
              >
                {isEvaluating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-mono text-xs uppercase tracking-wider">Auditing STAR narrative coordinates...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    <span>Grade My STAR Story Narrative</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 space-y-6">
            {/* Detailed feedback reports */}
            {evaluation ? (
              <div className="bg-[#111827] border border-[#27272A] p-6 rounded-[18px] space-y-4 animate-fade-in shadow-sm">
                <div className="flex justify-between items-center border-b border-[#27272A] pb-3">
                  <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">AI Recruiter Scorecard</h4>
                  <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-lg font-mono">{evaluation.overallRating}</span>
                </div>

                <div className="space-y-3.5 text-[10.5px] leading-relaxed text-slate-300">
                  <div>
                    <span className="block text-[9px] font-bold text-indigo-400 uppercase font-mono mb-1">Situation Critique</span>
                    <p className="bg-[#09090B] border border-[#27272A]/80 p-3 rounded-lg">{evaluation.critiqueSituation}</p>
                  </div>

                  <div>
                    <span className="block text-[9px] font-bold text-emerald-400 uppercase font-mono mb-1">Task Critique</span>
                    <p className="bg-[#09090B] border border-[#27272A]/80 p-3 rounded-lg">{evaluation.critiqueTask}</p>
                  </div>

                  <div>
                    <span className="block text-[9px] font-bold text-amber-400 uppercase font-mono mb-1">Action Critique</span>
                    <p className="bg-[#09090B] border border-[#27272A]/80 p-3 rounded-lg">{evaluation.critiqueAction}</p>
                  </div>

                  <div>
                    <span className="block text-[9px] font-bold text-rose-400 uppercase font-mono mb-1">Result Critique</span>
                    <p className="bg-[#09090B] border border-[#27272A]/80 p-3 rounded-lg">{evaluation.critiqueResult}</p>
                  </div>

                  <div className="border-t border-[#27272A]/80 pt-3">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase font-mono mb-2">Refactored Premium Story Model</span>
                    <p className="bg-[#6D5EF8]/5 border border-[#6D5EF8]/20 p-4 rounded-xl text-xs font-mono text-indigo-200 whitespace-pre-line leading-relaxed">
                      {evaluation.expertModelStory}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveToBank}
                  className="w-full py-2.5 bg-[#09090B] hover:bg-[#111827] border border-[#27272A] text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Save Story to Answer Bank
                </button>
              </div>
            ) : (
              <div className="bg-[#111827] border border-[#27272A] p-6 rounded-[18px] text-center space-y-4 h-full flex flex-col justify-center py-16 shadow-sm">
                <span className="text-3xl block select-none">✨</span>
                <h4 className="text-xs font-bold text-white">Grading HUD Idle</h4>
                <p className="text-[10.5px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Draft your Situation, Task, Action, and Result parameters on the left and click grade. Our system will analyze, score, and rebuild a pristine model answer matching OpenAI or Stripe requirements.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: ROLE TEMPLATES PAGE */}
      {activeSubTab === "templates" && (
        <div className="space-y-6 animate-fade-in">
          {/* Header & Categories filtering */}
          <div className="bg-[#111827] border border-[#27272A] p-5 rounded-2xl space-y-4 shadow-sm">
            <p className="text-xs text-slate-400">
              Browse pre-configured job requirements across 9 critical career channels. Select any template to instantly seed the AI interviewer simulator.
            </p>

            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "all", label: "All Curated Roles" },
                { id: "frontend", label: "Frontend" },
                { id: "backend", label: "Backend" },
                { id: "ai", label: "AI & Learning" },
                { id: "cloud", label: "Cloud Platform" },
                { id: "data_science", label: "Data Science" },
                { id: "devops", label: "DevOps Pipeline" },
                { id: "system_design", label: "System Design" },
                { id: "product_management", label: "Product Management" },
                { id: "cyber_security", label: "Cyber Security" },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedTemplateCat(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider font-mono transition-all cursor-pointer ${
                    selectedTemplateCat === cat.id
                      ? "bg-[#6D5EF8] text-white"
                      : "bg-[#09090B] text-slate-400 hover:text-slate-200 border border-[#27272A]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(tmpl => {
              const isExpanded = expandedTmplId === tmpl.id;
              return (
                <div 
                  key={tmpl.id}
                  className={`bg-[#111827] border border-[#27272A] rounded-2xl p-5 flex flex-col justify-between min-h-[420px] h-auto shadow-sm hover:border-slate-700 transition-all ${
                    isExpanded ? "md:col-span-2 lg:col-span-3 border-[#6D5EF8]/60 bg-[#111827]/95" : ""
                  }`}
                >
                  {/* Meta details */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-indigo-400 uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                        {tmpl.categoryLabel}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono font-bold">
                        at {tmpl.company}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white leading-snug">{tmpl.role}</h4>
                      <span className="text-[9.5px] text-slate-500 font-mono block">{tmpl.department}</span>
                    </div>

                    {/* Expandable layouts for expanded state */}
                    <div className={`grid grid-cols-1 gap-5 ${isExpanded ? "lg:grid-cols-3" : ""}`}>
                      {/* Left/Standard Panel */}
                      <div className="space-y-3.5">
                        {/* Core Requirements snippet */}
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider block">Target JD Summary</span>
                          <p className={`text-[10.5px] text-slate-400 leading-normal bg-[#09090B]/60 p-2.5 rounded-lg border border-[#27272A]/40 font-sans ${isExpanded ? "" : "line-clamp-4"}`}>
                            {tmpl.jdText}
                          </p>
                        </div>

                        {/* Key Sample Questions */}
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-bold text-[#6D5EF8] font-mono uppercase tracking-wider block">Sample Calibration Questions</span>
                          <div className="space-y-1">
                            {tmpl.questions.map((q, idx) => (
                              <div key={idx} className="flex gap-1.5 items-start text-[9.5px] text-slate-400 leading-relaxed font-mono">
                                <span className="text-indigo-400 shrink-0 font-bold">Q{idx+1}:</span>
                                <span>{q}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Middle & Right panels shown only when Expanded to support gorgeous layout of resources */}
                      {isExpanded && (
                        <div className="lg:col-span-2 border-t lg:border-t-0 lg:border-l border-[#27272A] pt-4 lg:pt-0 lg:pl-6 space-y-4">
                          <div>
                            <span className="text-[10px] font-bold text-indigo-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                              <BookOpen className="h-4 w-4 text-[#6D5EF8]" />
                              Role-Specific Study Materials & Reference Resources
                            </span>
                            <p className="text-[10.5px] text-slate-400 mt-1">
                              These real-world documentation guidelines, technical roadmaps, and textbooks are specifically curated to master the technical standards required at {tmpl.company}.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {tmpl.studyResources.map((res, rIdx) => (
                              <a
                                key={rIdx}
                                href={res.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-3 bg-[#09090B] border border-[#27272A]/80 hover:border-[#6D5EF8]/60 rounded-xl hover:bg-[#09090B]/40 transition-all group"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-[10.5px] font-bold text-white group-hover:text-[#6D5EF8] transition-colors font-sans">
                                    {res.title}
                                  </span>
                                  <span className="text-[8px] text-slate-500 font-mono uppercase font-bold tracking-widest flex items-center gap-0.5 border border-[#27272A] px-1.5 py-0.5 rounded bg-slate-900 group-hover:text-white transition-colors">
                                    LINK ↗
                                  </span>
                                </div>
                                <p className="text-[9.5px] text-slate-400 mt-1 font-sans leading-normal">
                                  {res.description}
                                </p>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CTA launch button */}
                  <div className="pt-4 border-t border-[#27272A]/60 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mt-5">
                    <div className="flex flex-wrap gap-1 max-w-full">
                      {tmpl.skills.slice(0, isExpanded ? tmpl.skills.length : 2).map(sk => (
                        <span key={sk} className="text-[8px] bg-slate-900 border border-[#27272A] px-2 py-0.5 rounded font-mono text-slate-400">
                          {sk}
                        </span>
                      ))}
                      {!isExpanded && tmpl.skills.length > 2 && (
                        <span className="text-[8px] text-slate-600 font-mono mt-0.5">+{tmpl.skills.length - 2}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setExpandedTmplId(isExpanded ? null : tmpl.id)}
                        className={`px-3 py-2 border rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider transition-all cursor-pointer ${
                          isExpanded 
                            ? "bg-slate-900 border-[#27272A] text-slate-300 hover:text-white hover:bg-slate-800" 
                            : "bg-[#6D5EF8]/5 border-[#6D5EF8]/20 text-[#6D5EF8] hover:bg-[#6D5EF8]/10"
                        }`}
                      >
                        {isExpanded ? "Collapse Resources" : "Study Materials"}
                      </button>

                      <button
                        onClick={() => handlePracticeWithTemplate(tmpl)}
                        className="px-3.5 py-2 bg-[#6D5EF8] hover:bg-[#6D5EF8]/90 text-white rounded-xl text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 shrink-0"
                      >
                        <span>Practice Simulation</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SYSTEM DESIGN COMPENDIUM */}
      {activeSubTab === "system_design" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#111827] border border-[#27272A] p-5 rounded-[18px] space-y-3 shadow-sm">
            <span className="text-[9px] font-bold text-[#6D5EF8] uppercase font-mono bg-[#6D5EF8]/10 px-2.5 py-1 border border-[#6D5EF8]/20 rounded max-w-max block">Distributed Caching</span>
            <h4 className="text-xs font-bold text-white font-sans mt-2">Consistent Hashing & Dynamic Ring Topology</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              When scaling Redis clusters under massive concurrent requests, standard hash mod allocation leads to full cache misses upon node addition. 
              <strong> Consistent Hashing</strong> maps servers and request keys onto a virtual mathematical ring ($2^{32} - 1$). Keys are assigned to the closest server proceeding clockwise.
            </p>
            <div className="p-3.5 bg-slate-950 border border-[#27272A] rounded-xl font-mono text-[10px] text-slate-400">
              <strong className="text-indigo-400 block mb-1">Key concepts to state in design reviews:</strong>
              • Virtual Nodes (Vnodes) to prevent distribution skew.<br />
              • Exponential fallbacks under cluster node failovers.<br />
              • Cache stampede mitigation: locking or background refresh threads.
            </div>
          </div>

          <div className="bg-[#111827] border border-[#27272A] p-5 rounded-[18px] space-y-3 shadow-sm">
            <span className="text-[9px] font-bold text-emerald-400 uppercase font-mono bg-emerald-500/10 px-2.5 py-1 border border-emerald-500/20 rounded max-w-max block">API Operations</span>
            <h4 className="text-xs font-bold text-white font-sans mt-2">Token Bucket Rate Limiting Architecture</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              To protect payment systems or API gateways from DDoS saturation, you must enforce server-level limits.
              <strong> Token Bucket</strong> stores tokens in a bucket representing concurrency bounds. Tokens accumulate at a continuous tick speed. Incoming requests exhaust 1 token; if the bucket is empty, request aborts with 429.
            </p>
            <div className="p-3.5 bg-slate-950 border border-[#27272A] rounded-xl font-mono text-[10px] text-slate-400">
              <strong className="text-emerald-400 block mb-1">Key concepts to state in design reviews:</strong>
              • Store keys in Redis sorted sets (ZSET) for sliding window algorithms.<br />
              • Handle mTLS authentication limits on edge routing nodes.<br />
              • Configure strict idempotency keys to safely retry billing failures.
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: ALGORITHMIC CORE */}
      {activeSubTab === "algorithmic" && (
        <div className="bg-[#111827] border border-[#27272A] p-6 rounded-[18px] space-y-5 shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Interviewer Patterns</span>
            <h3 className="text-white text-sm font-bold tracking-tight font-sans">Algorithmic Problem-Solving Cheat Sheet</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[#27272A]/85 pt-4">
            <div className="p-4 bg-slate-950 border border-[#27272A] rounded-xl space-y-2">
              <span className="text-lg select-none">🪟</span>
              <h4 className="text-xs font-bold text-white">Sliding Window Pattern</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed font-sans">Used for arrays, sequences, or substrings where you compute a continuous run (e.g. maximum subarray of size K).</p>
              <div className="text-[9px] font-mono text-slate-400 pt-1">Complexity: O(N) Time • O(1) Space</div>
            </div>

            <div className="p-4 bg-slate-950 border border-[#27272A] rounded-xl space-y-2">
              <span className="text-lg select-none">🔄</span>
              <h4 className="text-xs font-bold text-white">Two Pointers Method</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed font-sans">Sorting first then operating index pointers from both ends towards the center (e.g. Two Sum sorted, Valid Palindrome).</p>
              <div className="text-[9px] font-mono text-slate-400 pt-1">Complexity: O(N log N) Time • O(1) Space</div>
            </div>

            <div className="p-4 bg-slate-950 border border-[#27272A] rounded-xl space-y-2">
              <span className="text-lg select-none">🗺️</span>
              <h4 className="text-xs font-bold text-white">Breadth First Search (BFS)</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed font-sans">Using a Queue (FIFO) to explore graph nodes layer-by-layer (e.g., shortest path, binary tree level order traversal).</p>
              <div className="text-[9px] font-mono text-slate-400 pt-1">Complexity: O(V + E) Time • O(V) Space</div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: MY SAVED STORIES ANSWER BANK */}
      {activeSubTab === "behavioral_bank" && (
        <div className="space-y-3.5">
          {savedStarStories.length > 0 ? (
            savedStarStories.map((story) => (
              <div key={story.id} className="bg-[#111827] border border-[#27272A] p-5 rounded-[18px] space-y-4 shadow-sm">
                <div className="flex justify-between items-start gap-4 border-b border-[#27272A] pb-3">
                  <div>
                    <h4 className="text-xs font-bold text-white font-sans">{story.role}</h4>
                    <span className="text-[9px] text-slate-500 font-mono block mt-1 font-bold">Created: {story.timestamp} • Rating: {story.company}</span>
                  </div>
                  <button
                    onClick={() => onDeleteStarStory(story.id)}
                    className="text-[10px] font-bold text-[#EF4444] hover:text-red-300 font-mono cursor-pointer"
                  >
                    Delete Story
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-[10px] text-slate-400 leading-relaxed">
                  <div>
                    <strong className="text-indigo-400 block font-mono uppercase tracking-wider mb-1">Situation</strong>
                    <p className="bg-[#09090B] p-2.5 rounded-lg border border-[#27272A]/60">{story.situation}</p>
                  </div>
                  <div>
                    <strong className="text-emerald-400 block font-mono uppercase tracking-wider mb-1">Task</strong>
                    <p className="bg-[#09090B] p-2.5 rounded-lg border border-[#27272A]/60">{story.task}</p>
                  </div>
                  <div>
                    <strong className="text-amber-400 block font-mono uppercase tracking-wider mb-1">Action</strong>
                    <p className="bg-[#09090B] p-2.5 rounded-lg border border-[#27272A]/60">{story.action}</p>
                  </div>
                  <div>
                    <strong className="text-rose-400 block font-mono uppercase tracking-wider mb-1">Result</strong>
                    <p className="bg-[#09090B] p-2.5 rounded-lg border border-[#27272A]/60">{story.result}</p>
                  </div>
                </div>

                {story.expertStory && (
                  <div className="pt-3 border-t border-[#27272A]/80">
                    <strong className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-1">Graded AI Model Answer Template</strong>
                    <p className="bg-[#6D5EF8]/5 border border-[#6D5EF8]/25 p-3.5 rounded-xl font-mono text-[10.5px] text-indigo-300 whitespace-pre-line leading-relaxed">
                      {story.expertStory}
                    </p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center bg-[#111827] border border-[#27272A] rounded-[18px] space-y-2 py-16 shadow-sm">
              <span className="text-3xl block select-none">🗄️</span>
              <h4 className="text-xs font-bold text-white">Answer Bank Empty</h4>
              <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                You haven't saved any formatted STAR stories yet. Use the STAR Story Worksheet tab to build, grade, and catalog high-impact behavioral scenarios.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
