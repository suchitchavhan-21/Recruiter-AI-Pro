export interface CompanyRolePreset {
  title: string;
  category: "Engineering" | "Product" | "Security" | "Systems" | "Design";
  text: string;
}

export interface CompanyPreset {
  id: string;
  name: string;
  logoColor: string;
  industry: string;
  roles: CompanyRolePreset[];
}

export const COMPANY_PRESETS: CompanyPreset[] = [
  {
    id: "google",
    name: "Google",
    logoColor: "from-blue-500 via-red-500 to-yellow-500",
    industry: "AI, Search & Cloud Infrastructure",
    roles: [
      {
        title: "Software Engineer (AI & LLM Infrastructure)",
        category: "Engineering",
        text: `We are looking for a Software Engineer to join our Core Machine Learning Infrastructure group.
Requirements:
- Deep expertise in high-performance distributed systems, GPU/TPU compilation, and memory alignment.
- Experience with parallel training paradigms (Pipeline, Tensor, and Data Parallelism) using JAX, XLA, or PyTorch.
- Proven record optimizing low-latency serving pipelines for large language models (LLMs) with focus on high throughput.`
      },
      {
        title: "Senior Product Manager (Search & Intelligence)",
        category: "Product",
        text: `Google is seeking a Senior Product Manager to drive AI search innovation.
Requirements:
- Strong experience managing consumer-facing or enterprise products powered by deep learning and neural retrieval.
- Exceptional analytical background with ability to define metrics for generative models and conversational layouts.
- Excellent cross-functional leadership across ML researchers, engineering teams, and privacy specialists.`
      },
      {
        title: "Site Reliability Engineer (Google Cloud)",
        category: "Systems",
        text: `Join Google Cloud's reliability division to build self-healing global infrastructure.
Requirements:
- Deep familiarity with Linux kernel engineering, BGP routing, and distributed synchronization algorithms (Paxos/Raft).
- Mastery of modern automation frameworks, container runtimes, and large-scale storage orchestration.
- Passion for incident response automation and post-mortem analysis.`
      }
    ]
  },
  {
    id: "stripe",
    name: "Stripe",
    logoColor: "from-indigo-500 via-purple-500 to-indigo-600",
    industry: "Financial Infrastructure & APIs",
    roles: [
      {
        title: "Staff Software Engineer (Core Billing Engines)",
        category: "Engineering",
        text: `Stripe is looking for a Staff Engineer to lead high-consistency billing APIs.
Requirements:
- Expert-level knowledge of ledger systems, strict double-entry transaction modeling, and idempotency guarantees.
- Hands-on experience scaling databases with strict acid compliance and handling high-concurrency mutation storms.
- Focus on clean SDK architecture and developer-friendly public API design.`
      },
      {
        title: "Infrastructure Security Engineer",
        category: "Security",
        text: `Protect millions of businesses using Stripe by designing zero-trust networks.
Requirements:
- Strong background in cloud microservices authorization protocols, mTLS, and hardware security modules (HSMs).
- Experience performing architectural threat modeling on critical payment tokenization services.
- Proficiency in high-level languages (Go, Ruby, or Rust) to build automated threat-detection controls.`
      }
    ]
  },
  {
    id: "netflix",
    name: "Netflix",
    logoColor: "from-red-600 via-red-700 to-slate-900",
    industry: "High-Scale Streaming & Content",
    roles: [
      {
        title: "Senior Full Stack Engineer (Core Experience)",
        category: "Engineering",
        text: `Netflix is seeking an engineer to optimize our playback orchestration and member experience.
Requirements:
- In-depth mastery of modern React architectures, server-side rendering (SSR) optimization, and client-side memory management.
- Experience building highly resilient microservices using Node.js, GraphQL federation, and high-throughput caching.
- Focus on rendering performance, core web vitals, and smart progressive loading strategies.`
      },
      {
        title: "Streaming Protocols Architect",
        category: "Systems",
        text: `Develop next-generation video encoding and content delivery network (CDN) capabilities.
Requirements:
- Advanced expertise in adaptive bitrate streaming algorithms (HLS, DASH), video codecs (AV1, HEVC), and WebRTC.
- Experience optimizing congestion control networks, TCP/UDP sockets, and server edge architectures.
- Strong systems programming experience (C, C++, or Rust) for performance-critical engines.`
      }
    ]
  },
  {
    id: "microsoft",
    name: "Microsoft",
    logoColor: "from-teal-500 via-blue-600 to-indigo-500",
    industry: "Enterprise, Cloud & Productivity",
    roles: [
      {
        title: "Azure Virtualization Kernel Engineer",
        category: "Systems",
        text: `We are looking for a Systems Engineer to advance Hyper-V and Azure host systems.
Requirements:
- Extensive knowledge of x86/ARM virtualization extension sets, hypervisors, and memory management units.
- Highly skilled in native C and Rust systems engineering, device drivers, and low-level kernel debugging.
- Experience profiling bare-metal execution bottlenecks to achieve sub-millisecond hypervisor overhead.`
      },
      {
        title: "Lead UI Developer (Microsoft 365 Copilot)",
        category: "Engineering",
        text: `Join the team bridging natural language AI to daily productivity interfaces.
Requirements:
- Exceptional mastery of React, TypeScript, and fluid fluid-layout systems (Fluent UI, CSS-in-JS, Tailwind).
- Mastery of state management (Zustand, Redux, Signal-based reactivity) and micro-frontend scaling.
- Focus on high accessibility standards (WCAG, ARIA) and screen-reader optimizations.`
      }
    ]
  },
  {
    id: "amazon",
    name: "Amazon",
    logoColor: "from-yellow-500 via-orange-500 to-amber-600",
    industry: "E-Commerce & Cloud Web Services",
    roles: [
      {
        title: "Solutions Architect (Enterprise Cloud)",
        category: "Systems",
        text: `Design secure, resilient, and optimized enterprise systems on AWS.
Requirements:
- Comprehensive knowledge of AWS well-architected framework, network topologies, multi-region database replication, and VPC peering.
- Excellent communication skills to align technical architecture recommendations with C-suite business goals.
- Experience with infrastructure-as-code (IaC) tooling such as Terraform, CloudFormation, or AWS CDK.`
      },
      {
        title: "SDE II (Alexa Smart Home Platform)",
        category: "Engineering",
        text: `Help build the low-latency distributed platform controlling millions of IoT devices.
Requirements:
- Strong experience in asynchronous event-driven architectures, WebSockets, and queueing models (SQS, Kafka).
- Competence with high-concurrency languages (Java, Go, or C++) and AWS Lambda serverless execution limits.
- Background in real-time telemetry processing, telemetry filters, and device state synchronization.`
      }
    ]
  },
  {
    id: "meta",
    name: "Meta",
    logoColor: "from-blue-600 via-indigo-600 to-slate-900",
    industry: "Social Technology & Metaverse Platforms",
    roles: [
      {
        title: "Frontend Systems Specialist (Internal Tooling)",
        category: "Engineering",
        text: `Develop highly interactive frontend systems to manage Meta's global server fleet.
Requirements:
- Advanced expertise with custom React state mechanics, React-v18 transitions, and high-frequency data grid optimization.
- Experience with GraphQL query batching, local caches (Apollo/Relay), and real-time push protocols.
- Aesthetic eye for design system consistency and custom visual layout performance.`
      },
      {
        title: "Production Engineer (Infrastructure Scale)",
        category: "Systems",
        text: `Bridge software development and systems engineering to manage massive computing clusters.
Requirements:
- Extensive knowledge of Linux performance analysis, memory subsystems (eBPF, cgroups), and hardware profiling.
- Proficiency writing high-quality automation frameworks in Python, Go, or C++.
- Experience operating container orchestration runtimes at hyper-scale (Kubernetes, internal scheduling schedulers).`
      }
    ]
  },
  {
    id: "openai",
    name: "OpenAI",
    logoColor: "from-slate-800 via-stone-900 to-slate-950",
    industry: "Frontier Artificial Intelligence",
    roles: [
      {
        title: "Research Engineer (AI Model Alignment)",
        category: "Engineering",
        text: `Advance the safety, truthfulness, and alignment of frontier language model architectures.
Requirements:
- Strong familiarity with Reinforcement Learning from Human Feedback (RLHF), DPO, and direct policy fine-tuning.
- Advanced expertise optimizing distributed training loops for massive scale using PyTorch, Megatron-LM, or DeepSpeed.
- Analytical mindset to formulate safety alignment metrics, evaluation boards, and synthetic data generation frameworks.`
      },
      {
        title: "Senior Product Designer (Agentic Interfaces)",
        category: "Design",
        text: `OpenAI is seeking a Product Designer to establish the UX paradigms for collaborative AI agents.
Requirements:
- Proven history designing fluid, highly interactive canvas layouts, multi-modal chat workspaces, and complex step-by-step dashboards.
- Mastery of visual hierarchy, elegant negative space, typography pairings, and micro-animations using Figma or code.
- Strong interest in natural language interfaces and interactive human-in-the-loop workflows.`
      }
    ]
  },
  {
    id: "apple",
    name: "Apple",
    logoColor: "from-slate-700 via-slate-800 to-stone-950",
    industry: "Consumer Electronics & OS Engines",
    roles: [
      {
        title: "iOS Systems Framework Engineer",
        category: "Engineering",
        text: `Build core runtime frameworks that power applications across iOS, macOS, and visionOS.
Requirements:
- Deep expertise in Swift, Objective-C, and Apple SDK frameworks (CoreFoundation, Grand Central Dispatch, Combine).
- Advanced understanding of Unix-based kernel mechanics, Darwin runtime, and system-level IPC mechanisms.
- Focus on memory performance, background execution profiles, and battery-efficiency diagnostics.`
      }
    ]
  }
];
