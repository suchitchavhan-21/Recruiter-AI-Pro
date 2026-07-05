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
        text: `--- ROLE OVERVIEW ---
We are looking for a Software Engineer to join our Core Machine Learning Infrastructure group, the team responsible for scaling training and inference for Google's Gemini models. You will design, build, and optimize the distributed training clusters and high-throughput inference frameworks that support our generative AI efforts.

--- CORE RESPONSIBILITIES ---
- Optimize low-latency, high-throughput model serving pipelines on custom TPU (Tensor Processing Unit) and GPU topologies.
- Design high-fidelity data ingestion and preprocessing pipelines that scale to petabytes of training dataset sequences.
- Author robust, deterministic distributed communication patterns to reduce inter-node gradient sync bottlenecks.
- Build resilient system-level utilities for state checkpointing, automated fault-recovery, and live model reloading.

--- REQUIRED TECHNICAL KNOWLEDGE & EXPERIENCE ---
- Expert-level programming in modern C++ and Python, with a strong emphasis on memory alignment and thread safety.
- Deep hands-on experience with parallel training paradigms (Pipeline, Tensor, and 3D Parallelism) using JAX, XLA, or PyTorch.
- Direct familiarity with distributed orchestration engines (Kubernetes, Borg) and collective communication primitives (NCCL, GLOO).
- Comprehensive understanding of compiler optimization strategies (XLA graph compilation, custom CUDA kernels).`
      },
      {
        title: "Senior Product Manager (Search & Intelligence)",
        category: "Product",
        text: `--- ROLE OVERVIEW ---
Google is seeking a Senior Product Manager to drive next-generation search innovations powered by conversational interfaces and neural retrieval. In this role, you will define the roadmap for Gemini-powered Search features, aligning deep research with user interface layouts to redefine how billions of users discover information online.

--- CORE RESPONSIBILITIES ---
- Lead the complete product lifecycle from core research breakthroughs to consumer feature deployment for Google Search.
- Collaborate with deep learning research scientists, engineers, and UX architects to build high-fidelity generative search responses.
- Define quantitative evaluation frameworks for conversational layouts, measuring latency, factual alignment, and relevance.
- Champion rigorous user-privacy policies, content moderation controls, and safety standards across all generative surfaces.

--- REQUIRED TECHNICAL KNOWLEDGE & EXPERIENCE ---
- Exceptional technical background in deep learning, neural rankers, Vector search, and LLM behavior metrics.
- Strong product management track record in search engines, conversational AI agents, or recommender systems.
- Mastery of analytical and query platforms (SQL, BigQuery, Pandas) to design and interpret multi-variate A/B experiments.
- Outstanding articulation skills to bridge high-level model capabilities with design details and executive roadmaps.`
      },
      {
        title: "Site Reliability Engineer (Google Cloud)",
        category: "Systems",
        text: `--- ROLE OVERVIEW ---
Join Google Cloud's core reliability division to design, implement, and maintain self-healing global compute infrastructure. As an SRE, you will apply software engineering principles to tackle infrastructure bottlenecks, manage complex cloud services, and guarantee low-latency uptime for Google Cloud Platform customers worldwide.

--- CORE RESPONSIBILITIES ---
- Build robust automation frameworks and custom operators to orchestrate global multi-region container clusters.
- Diagnose and debug intricate networking and kernel-level performance degradation across heterogeneous distributed systems.
- Design fault-tolerant system topologies incorporating strict SLA/SLO metrics, rate-limiters, and load-shedders.
- Orchestrate and refine post-incident investigation procedures to drive long-term platform resilience.

--- REQUIRED TECHNICAL KNOWLEDGE & EXPERIENCE ---
- Mastery of Linux systems administration, kernel internals, and high-performance network engineering (eBPF, BGP, TCP/IP).
- Extensive software development proficiency in Go, C, or Python with an emphasis on concurrent programming.
- Hands-on expertise with consensus protocols (Paxos, Raft) and distributed store architectures (Etcd, Bigtable).
- Deep experience in infrastructure-as-code paradigms and cluster telemetry frameworks (Prometheus, OpenTelemetry).`
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
        text: `--- ROLE OVERVIEW ---
Stripe is seeking a Staff Software Engineer to lead the technical design of our high-consistency Billing Core. This group builds the software ledger engines and double-entry mutation APIs that securely process hundreds of billions of dollars in global digital commerce every year.

--- CORE RESPONSIBILITIES ---
- Architect the next-generation microservices to power subscription lifecycles, ledger processing, and invoices.
- Guarantee strict transactional idempotency, high availability, and horizontal database scaling.
- Author clean, developer-centric public APIs and software development kits (SDKs) used by millions of teams globally.
- Guide engineering standardizations across teams, leading high-concurrency database optimizations and performance profiling.

--- REQUIRED TECHNICAL KNOWLEDGE & EXPERIENCE ---
- Expert-level engineering in Go, Ruby, or Java, writing highly testable, self-documenting code.
- Extensive background in double-entry bookkeeping schemas, transactional ledgers, and database concurrency isolation levels.
- Deep database proficiency (PostgreSQL, MySQL, CockroachDB) including custom lock tuning and partitioning schemas.
- Advanced understanding of distributed transaction models, saga patterns, and event-sourcing architectures.`
      },
      {
        title: "Infrastructure Security Engineer",
        category: "Security",
        text: `--- ROLE OVERVIEW ---
Protect the millions of online businesses that rely on Stripe by designing and building zero-trust cloud network architectures. In this security role, you will create automated tooling to detect vulnerability vectors and build hard protection boundaries around Stripe's tokenization and payment vaults.

--- CORE RESPONSIBILITIES ---
- Formulate threat models and conduct architecture security assessments on payment-tokenization microservices.
- Engineer secure service meshes, automated TLS certificate management, and hardware security module (HSM) integrations.
- Develop custom, high-throughput static and dynamic code analyzers to identify insecure code paths inside CI/CD pipelines.
- Investigate security alerts, design automated incident responses, and construct robust defense systems.

--- REQUIRED TECHNICAL KNOWLEDGE & EXPERIENCE ---
- Strong experience in cloud microservice security models, identity federation (OIDC, SAML), and mTLS protocols.
- Hands-on proficiency with network protection, container security (SecComp, AppArmor), and secrets engines (HashiCorp Vault).
- Proven ability to write security automation tools in Go, Python, or Rust.
- Deep familiarization with PCI-DSS compliance frameworks, secure hardware enclaves, and cryptographic primitives.`
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
        text: `--- ROLE OVERVIEW ---
Netflix is seeking an experienced Senior Full Stack Engineer to optimize our core playback orchestration and home-screen discovery interfaces. This cross-functional engineering team builds the high-scale Web engines and supporting node layers that serve our global base of over 250 million users.

--- CORE RESPONSIBILITIES ---
- Optimize responsive web architectures to render dynamically with sub-second core web vitals on heterogeneous device hardware.
- Engineer high-throughput backend-for-frontend (BFF) layers utilizing advanced graph-stitching and caching.
- Build reliable real-time server telemetry streams to track client playback bottlenecks and player crashes.
- Design seamless A/B experiment testing utilities that handle millions of client allocations concurrently.

--- REQUIRED TECHNICAL KNOWLEDGE & EXPERIENCE ---
- Exceptional mastery of React 18, modern TypeScript, and runtime browser optimization (rendering pipelines, V8 memory profiling).
- Production-grade backend experience building Node.js microservices, GraphQL federated graphs, and low-latency Redis caches.
- Mastery of CSS layout performance, responsive styling parameters, and touch interaction designs.
- Deep comprehension of CDNs, server-side rendering (SSR), and incremental static regeneration (ISR) methodologies.`
      },
      {
        title: "Streaming Protocols Architect",
        category: "Systems",
        text: `--- ROLE OVERVIEW ---
Develop the next generation of video delivery pipelines as part of Netflix's Open Connect CDN engineering team. You will lead the research and implementation of low-latency streaming systems, media encapsulation standards, and transport layer optimizations that minimize network buffering globally.

--- CORE RESPONSIBILITIES ---
- Lead protocol design for adaptive bitrate streaming, improving video start times and visual stability under degraded network environments.
- Optimize media packaging engines supporting diverse formats, closed captions, and multi-language audio alignment.
- Implement socket-level optimizations, network congestion algorithms, and custom TCP/UDP transport solutions.
- Evaluate emerging audio-visual compression frameworks to squeeze maximum visual quality into lower bitrates.

--- REQUIRED TECHNICAL KNOWLEDGE & EXPERIENCE ---
- Advanced expertise in adaptive bitrate protocols (HLS, MPEG-DASH) and video codecs (AV1, VP9, H.264/AVC, HEVC).
- Hands-on system-level development in C, C++, or Rust with direct socket programming and memory management.
- Deep knowledge of transport-layer mechanics (QUIC, HTTP/3, WebRTC) and custom Linux networking stacks.
- Proficiency using network analysis applications (Wireshark, tcpdump) to resolve complex packet loss scenarios.`
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
        text: `--- ROLE OVERVIEW ---
We are looking for a Systems Engineer to join our Azure Hypervisor and Virtualization Host core team. This engineering group owns the low-level firmware, kernel structures, and physical isolation frameworks that power Microsoft Azure's hyper-scale compute clusters globally.

--- CORE RESPONSIBILITIES ---
- Develop core virtual hypervisor drivers and kernel modules to handle physical memory allocations on modern CPU chips.
- Isolate and debug low-level hardware bottlenecks, device register access latency, and multi-tenant cache side-channels.
- Engineer secure, fast-path paravirtualization technologies for virtual storage, networks, and PCIe-passthrough equipment.
- Collaborate with silicone design architects to prototype next-generation server-grade hardware extensions.

--- REQUIRED TECHNICAL KNOWLEDGE & EXPERIENCE ---
- Mastery of x86-64 and ARM64 system architecture, virtualization extensions (Intel VT-x, AMD-V), and MMU page-table mechanics.
- Highly proficient in systems programming with C and Rust, custom bare-metal assembly, and kernel debug tools (Windbg, GDB).
- Comprehensive understanding of operating system kernel internals, CPU schedulers, lock-free data structures, and IRQ pathways.
- Solid experience in hardware-rooted security architectures, Secure Boot, TPMs, and confidential virtualization technologies.`
      },
      {
        title: "Lead UI Developer (Microsoft 365 Copilot)",
        category: "Engineering",
        text: `--- ROLE OVERVIEW ---
Join the engineering team bridging frontier natural language generative models to millions of users in Microsoft 365. You will design, develop, and scale the interactive UI components, conversational cards, and canvas interfaces that embed intelligent assistants inside Excel, Word, and Teams.

--- CORE RESPONSIBILITIES ---
- Deliver elegant, highly responsive UI canvases supporting multi-modal streaming responses, document embeds, and rich-text.
- Maintain micro-frontend platforms that bundle and serve custom modular tools to independent app canvases.
- Champion world-class web accessibility (WCAG 2.1 compliance) across screen-readers and visual configurations.
- Profile and fix complex React rendering cycles and memory leaks across long-lived application cycles.

--- REQUIRED TECHNICAL KNOWLEDGE & EXPERIENCE ---
- Masterful expertise in React, TypeScript, and high-performance design system styling (Tailwind CSS, Fluent UI, CSS-in-JS).
- Solid experience scaling front-end state management stores (Zustand, Redux Toolkit, or state machines) under frequent data updates.
- Deep acquaintance with client-side WebSocket connectivity, local offline caches, and progressive web application behaviors.
- Highly analytical designer, with strong proficiency using Chrome DevTools, performance profiles, and heap snapshot analyzers.`
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
        text: `--- ROLE OVERVIEW ---
Design high-availability, fault-tolerant, and secure enterprise architectures on AWS for our largest corporate clients. As a Solutions Architect, you will partner with technology teams to analyze business requirements and build scalable, secure cloud-native environments.

--- CORE RESPONSIBILITIES ---
- Translate multi-faceted enterprise IT workloads into highly reliable, auto-scaling AWS topologies.
- Champion AWS Well-Architected Framework implementations, guiding audits for cost, performance, and security.
- Standardize enterprise migration strategies incorporating hybrid cloud setups and secure multi-region databases.
- Develop reference architectures, automation runbooks, and software delivery pipelines.

--- REQUIRED TECHNICAL KNOWLEDGE & EXPERIENCE ---
- Deep expertise in AWS cloud services (VPC, IAM, EC2, ECS, EKS, RDS, DynamoDB, CloudFront).
- Advanced competency with Infrastructure as Code (IaC) engineering tools (Terraform, CloudFormation, or AWS CDK).
- Practical comprehension of networking structures (DNS, routing, BGP, VPN, secure firewalls) and hybrid transit gateways.
- Exceptional architectural drafting skills paired with confident stakeholder consulting. AWS Solutions Architect Professional certification is preferred.`
      },
      {
        title: "SDE II (Alexa Smart Home Platform)",
        category: "Engineering",
        text: `--- ROLE OVERVIEW ---
Help build the low-latency distributed telemetry and control platform that coordinates state for hundreds of millions of smart home IoT devices worldwide. You will solve scaling challenges and optimize latency for Alexa's core real-time message routing layer.

--- CORE RESPONSIBILITIES ---
- Build high-concurrency event ingestion pipelines to handle millions of persistent IoT client socket connections.
- Optimize distributed memory stores holding virtual device states with strict latency limits.
- Model resilient data routing layers to prevent packet cascades and system-wide service degradation during outages.
- Design fully testable, horizontal microservices using serverless and cluster compute infrastructure.

--- REQUIRED TECHNICAL KNOWLEDGE & EXPERIENCE ---
- Expert Java, Go, or C++ software engineering with strong design patterns, multi-threading, and network socket programming.
- Advanced background with live communication interfaces (WebSockets, gRPC, MQTT) and queueing fabrics (Kafka, SQS, Kinesis).
- Extensive experience designing large-scale AWS microservices (using DynamoDB, Redis, ECS, and Lambda).
- Mastery of analytical database systems and real-time metric analysis.`
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
        text: `--- ROLE OVERVIEW ---
Develop the highly interactive front-end monitoring interfaces and control panels used to manage Meta's massive global server fleet, custom hypervisors, and data centers. This role centers on crafting rich, performant UI grids that display real-time telemetry.

--- CORE RESPONSIBILITIES ---
- Build interactive data visualization panels and high-capacity grids to render live cluster telemetry.
- Optimize React rendering cycles to prevent CPU starvation when handling thousands of visual updates per second.
- Implement custom React rendering controls, graph components, and offline-first state synchronizers.
- Align tool sets with internal UI design standards, ensuring high utility and accessible navigation.

--- REQUIRED TECHNICAL KNOWLEDGE & EXPERIENCE ---
- Masterful expertise with React 18, concurrent features, custom hooks, and state hooks.
- Proven background utilizing GraphQL, Apollo or Relay query batching, local caches, and live WebSocket subscriptions.
- Advanced proficiency in layout technologies (Tailwind CSS, CSS performance) and Canvas/SVG visualization libraries.
- Strong knowledge of build bundlers (Vite, Webpack), ES module graphs, and runtime profiling.`
      },
      {
        title: "Production Engineer (Infrastructure Scale)",
        category: "Systems",
        text: `--- ROLE OVERVIEW ---
At Meta, Production Engineering bridges software design and systems engineering. In this role, you will work directly with our infrastructure codebases to ensure that Meta's core storage, caching, and serving frameworks scale reliably to billions of active users.

--- CORE RESPONSIBILITIES ---
- Design, deploy, and maintain automated tools to operate massive global bare-metal server structures.
- Profile and debug low-level memory, storage, and networking limits across our globally distributed centers.
- Implement reliable orchestration controllers to govern container deployments, health testing, and traffic routing.
- Participate in global on-call rotas, authoring self-healing recovery loops.

--- REQUIRED TECHNICAL KNOWLEDGE & EXPERIENCE ---
- Advanced mastery of Linux systems internals, network virtualization, and hardware diagnostic interfaces (eBPF, cgroups).
- High proficiency writing robust code in Python, C++, Go, or Rust to construct systems tools.
- Hands-on expertise with distributed database principles, consensus networks, and caching architectures (Memcached, Redis).
- Practical familiarity with virtualization software, hardware architectures, and container environments.`
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
        text: `--- ROLE OVERVIEW ---
Join the Frontier Alignment research group to advance the safety, truthfulness, and direct steerability of future language model architectures. You will develop distributed alignment training pipelines and synthetic data scoring systems to guide deep learning behavior.

--- CORE RESPONSIBILITIES ---
- Optimize and scale alignment processes (RLHF, DPO, PPO) to train models across thousands of high-performance GPUs.
- Build resilient high-throughput dataset generation tools that leverage models to evaluate other models.
- Conduct thorough research experiments on reward modeling, task generalization, and agent evaluation grids.
- Implement optimization features within core training codebases to decrease time-to-evaluate cycles.

--- REQUIRED TECHNICAL KNOWLEDGE & EXPERIENCE ---
- In-depth theoretical and practical comprehension of machine learning optimization, reinforcement learning, and neural networks.
- Extensive expertise engineering in PyTorch, using model parallel suites (Megatron-LM, DeepSpeed, or FSDP).
- Proven competency writing efficient CUDA kernels or using tensor compiler features to optimize execution.
- Strong analytical skills, with background managing large data pipelines and high-dimensional vector spaces.`
      },
      {
        title: "Senior Product Designer (Agentic Interfaces)",
        category: "Design",
        text: `--- ROLE OVERVIEW ---
OpenAI is seeking a Product Designer to design the interaction paradigms for collaborative AI agents. In this role, you will design highly interactive canvas workspaces, multi-modal chat features, and custom step-by-step dashboards that let humans control multi-agent workflows.

--- CORE RESPONSIBILITIES ---
- Design interactive UI layouts for LLM workspaces, multi-modal interfaces, and prompt engineering dashboards.
- Proactively construct high-fidelity interactive web prototypes to test core usability and prompt responsiveness.
- Formulate a cohesive design language that supports live LLM outputs, state displays, and interactive edits.
- Partner closely with research staff and front-end engineers to implement refined visual interfaces.

--- REQUIRED TECHNICAL KNOWLEDGE & EXPERIENCE ---
- Exceptional background designing digital products, specializing in data visualization, dashboards, or complex web software.
- High-level mastery of visual layouts, spacious typography pairings, color systems, and animation.
- Direct proficiency writing interactive web prototypes with React, HTML, and Tailwind CSS.
- Fascinated by generative models, conversational interface problems, and human-in-the-loop agent control mechanisms.`
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
        text: `--- ROLE OVERVIEW ---
Build the core runtimes and framework layers that power user experiences across iOS, macOS, watchOS, and visionOS. In this role, you will develop the system-level frameworks used by external and internal developers to construct performant, energy-efficient applications.

--- CORE RESPONSIBILITIES ---
- Develop high-efficiency Swift and Objective-C APIs that expose core OS services.
- Optimize system frameworks for minimal memory footprints, battery conservation, and speedy initialization.
- Engineer secure, asynchronous inter-process communication (IPC) frameworks to share services across the sandbox.
- Diagnose and debug intricate operating system issues, heap corruption, and multi-threaded race conditions.

--- REQUIRED TECHNICAL KNOWLEDGE & EXPERIENCE ---
- Exceptional expertise in Swift and Objective-C, including CoreFoundation, Grand Central Dispatch (GCD), and Combine.
- Deep, low-level familiarity with Mach-based Darwin kernel mechanics, memory maps, dynamic linkers, and virtual memory.
- Solid experience in system-level performance profiling (using Instruments, leaks, system trace, and heap diagnostics).
- Passion for designing APIs and maintaining backward-compatible developer frameworks.`
      }
    ]
  }
];
