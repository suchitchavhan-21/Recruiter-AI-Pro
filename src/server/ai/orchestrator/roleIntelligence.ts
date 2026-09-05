/**
 * Recruiter AI Pro — Universal Role Intelligence & Interview Blueprint Engine
 * 
 * Truly profession-agnostic interview planning:
 * InterviewPlan = f(job, JD, candidate, seniority, evidence, time)
 * 
 * Selects role-appropriate competencies, practical assessments, interviewer specializations,
 * scoring weights (normalized to 1.0), and career-switching transferable evidence pathways.
 */

export type JobFamily =
  | "engineering"
  | "data_analytics"
  | "product"
  | "marketing"
  | "sales"
  | "human_resources"
  | "finance"
  | "education"
  | "operations"
  | "design"
  | "general";

export type SeniorityLevel = "Entry" | "Mid" | "Senior" | "Expert";

export type IntensityLevel = "low" | "medium" | "high";

export type PracticalAssessmentType =
  | "NONE"
  | "CODING"
  | "CASE_STUDY"
  | "ROLE_PLAY"
  | "WRITING"
  | "PRESENTATION"
  | "DATA_ANALYSIS"
  | "SCENARIO"
  | "DOMAIN_EXERCISE"
  | "TECHNICAL_TASK";

export interface RoleClassificationInput {
  targetRole: string;
  jobDescription?: string;
  candidateResume?: string;
  seniority?: SeniorityLevel;
  industry?: string;
  company?: string;
}

export interface RoleClassificationResult {
  jobFamily: JobFamily;
  subFamily: string;
  industry: string;
  seniority: SeniorityLevel;
  technicalIntensity: IntensityLevel;
  domainIntensity: IntensityLevel;
  behavioralIntensity: IntensityLevel;
  leadershipIntensity: IntensityLevel;
  practicalAssessmentType: PracticalAssessmentType;
  codingRequired: boolean;
  assessmentRequired: boolean;
  confidence: number;
}

export interface BlueprintCompetency {
  id: string;
  name: string;
  weight: number; // Normalized (sum of all weights = 1.0)
  description: string;
  category: "universal" | "domain" | "leadership" | "practical";
  positiveSignals: string[];
  negativeSignals: string[];
  sampleQuestion: string;
}

export interface InterviewerSpecialization {
  role: "HR" | "Technical" | "HiringManager";
  name: string;
  title: string;
  focus: string;
  rubric: string;
}

export interface InterviewBlueprint {
  jobFamily: JobFamily;
  subFamily: string;
  seniority: SeniorityLevel;
  practicalAssessmentType: PracticalAssessmentType;
  codingRequired: boolean;
  competencies: BlueprintCompetency[];
  scoringWeights: Record<string, number>; // Strictly sums to 1.0
  interviewers: {
    hr: InterviewerSpecialization;
    domain: InterviewerSpecialization; // David Chen (specialized by domain)
    hiringManager: InterviewerSpecialization; // Marcus Brody (specialized by leadership/impact)
  };
  stages: string[];
  firstQuestion: {
    id: number;
    text: string;
    type: "behavioral" | "technical";
    expectedFocus: string;
    interviewerRole: "HR" | "Technical" | "HiringManager";
  };
  recommendedDurationMinutes: number;
  isCareerSwitcher: boolean;
  transferableDomains?: string[];
  recommendedLearningFocus: string;
}

/**
 * Deterministically classifies any job based on role title, JD, and industry.
 */
export function classifyRole(input: RoleClassificationInput): RoleClassificationResult {
  const roleLower = (input.targetRole || "").toLowerCase();
  const jdLower = (input.jobDescription || "").toLowerCase();
  const text = `${roleLower} ${jdLower} ${(input.industry || "").toLowerCase()}`;

  let seniority: SeniorityLevel = input.seniority || "Mid";
  if (!input.seniority) {
    if (/\b(principal|staff|lead|director|head of|vp|architect|chief|senior director)\b/i.test(roleLower)) {
      seniority = "Expert";
    } else if (/\b(senior|sr\.|lead|team lead)\b/i.test(roleLower)) {
      seniority = "Senior";
    } else if (/\b(junior|jr\.|entry|intern|associate|graduate|trainee|apprentice)\b/i.test(roleLower)) {
      seniority = "Entry";
    }
  }

  // 1. Engineering / Software Development
  if (
    /\b(software|developer|frontend|backend|fullstack|devops|sre|cloud engineer|embedded|firmware|infrastructure engineer|systems engineer)\b/i.test(roleLower) ||
    (/\b(engineer|architect)\b/i.test(roleLower) && !/\b(sales engineer|solutions architect|support)\b/i.test(roleLower))
  ) {
    return {
      jobFamily: "engineering",
      subFamily: /\b(frontend|react|ui|web)\b/i.test(text) ? "frontend" :
                 /\b(devops|sre|platform|infrastructure)\b/i.test(text) ? "infrastructure" : "backend",
      industry: input.industry || "technology",
      seniority,
      technicalIntensity: "high",
      domainIntensity: "high",
      behavioralIntensity: seniority === "Entry" ? "medium" : "high",
      leadershipIntensity: seniority === "Expert" || seniority === "Senior" ? "high" : "low",
      practicalAssessmentType: "CODING",
      codingRequired: true,
      assessmentRequired: true,
      confidence: 0.95
    };
  }

  // 2. Data Analytics & Data Science
  if (/\b(data analyst|bi analyst|business intelligence|data analytics|analytics engineer|data scientist|machine learning|tableau|power bi)\b/i.test(roleLower)) {
    const isMLorEng = /\b(machine learning|data engineer|ml engineer)\b/i.test(roleLower);
    return {
      jobFamily: "data_analytics",
      subFamily: isMLorEng ? "data_science" : "business_intelligence",
      industry: input.industry || "technology",
      seniority,
      technicalIntensity: "high",
      domainIntensity: "high",
      behavioralIntensity: "medium",
      leadershipIntensity: seniority === "Expert" ? "high" : "low",
      practicalAssessmentType: "DATA_ANALYSIS",
      codingRequired: isMLorEng, // ML / Data Engineers code; pure BI Analysts do data analysis / SQL
      assessmentRequired: true,
      confidence: 0.92
    };
  }

  // 3. Marketing & Brand Strategy
  if (/\b(marketing|growth|content|seo|copywriter|brand|social media|demand gen|campaign manager|cmo|digital marketing)\b/i.test(roleLower)) {
    return {
      jobFamily: "marketing",
      subFamily: /\b(growth|performance|seo|sem)\b/i.test(text) ? "growth_marketing" : "brand_strategy",
      industry: input.industry || "commerce",
      seniority,
      technicalIntensity: "low",
      domainIntensity: "high",
      behavioralIntensity: "high",
      leadershipIntensity: seniority === "Senior" || seniority === "Expert" ? "high" : "medium",
      practicalAssessmentType: "CASE_STUDY",
      codingRequired: false,
      assessmentRequired: true,
      confidence: 0.94
    };
  }

  // 4. Sales, Business Development & Account Management
  if (/\b(sales|account executive|bdr|sdr|business development|account manager|client executive|commercial|sales director)\b/i.test(roleLower)) {
    return {
      jobFamily: "sales",
      subFamily: /\b(enterprise|strategic|corporate)\b/i.test(text) ? "enterprise_sales" : "inside_sales",
      industry: input.industry || "business",
      seniority,
      technicalIntensity: "low",
      domainIntensity: "high",
      behavioralIntensity: "high",
      leadershipIntensity: seniority === "Senior" || seniority === "Expert" ? "high" : "low",
      practicalAssessmentType: "ROLE_PLAY",
      codingRequired: false,
      assessmentRequired: true,
      confidence: 0.95
    };
  }

  // 5. Human Resources & People Operations
  if (/\b(hr|human resources|people operations|recruiter|talent acquisition|people partner|hrbp|compensation|people director)\b/i.test(roleLower)) {
    return {
      jobFamily: "human_resources",
      subFamily: /\b(recruiting|talent)\b/i.test(text) ? "talent_acquisition" : "people_partner",
      industry: input.industry || "corporate",
      seniority,
      technicalIntensity: "low",
      domainIntensity: "high",
      behavioralIntensity: "high",
      leadershipIntensity: seniority === "Senior" || seniority === "Expert" ? "high" : "medium",
      practicalAssessmentType: "SCENARIO",
      codingRequired: false,
      assessmentRequired: true,
      confidence: 0.93
    };
  }

  // 6. Product Management
  if (/\b(product manager|group product manager|vp product|chief product officer|product lead|technical product manager)\b/i.test(roleLower)) {
    return {
      jobFamily: "product",
      subFamily: /\b(technical|platform)\b/i.test(text) ? "technical_product" : "growth_product",
      industry: input.industry || "technology",
      seniority,
      technicalIntensity: "medium",
      domainIntensity: "high",
      behavioralIntensity: "high",
      leadershipIntensity: "high",
      practicalAssessmentType: "CASE_STUDY",
      codingRequired: false,
      assessmentRequired: true,
      confidence: 0.94
    };
  }

  // 7. Finance, Accounting & Banking
  if (/\b(finance|financial analyst|accountant|controller|cfo|investment|fp&a|banking|auditor|treasury|underwriter)\b/i.test(roleLower)) {
    return {
      jobFamily: "finance",
      subFamily: /\b(fp&a|forecasting)\b/i.test(text) ? "fp_and_a" : "accounting",
      industry: input.industry || "financial_services",
      seniority,
      technicalIntensity: "medium",
      domainIntensity: "high",
      behavioralIntensity: "medium",
      leadershipIntensity: seniority === "Senior" || seniority === "Expert" ? "high" : "low",
      practicalAssessmentType: "DATA_ANALYSIS",
      codingRequired: false,
      assessmentRequired: true,
      confidence: 0.91
    };
  }

  // 8. Education & Teaching
  if (/\b(teacher|educator|professor|instructor|tutor|faculty|lecturer|pedagogy|curriculum developer|principal)\b/i.test(roleLower)) {
    return {
      jobFamily: "education",
      subFamily: /\b(higher ed|university|college)\b/i.test(text) ? "higher_education" : "k12_education",
      industry: input.industry || "education",
      seniority,
      technicalIntensity: "low",
      domainIntensity: "high",
      behavioralIntensity: "high",
      leadershipIntensity: seniority === "Expert" ? "high" : "medium",
      practicalAssessmentType: "DOMAIN_EXERCISE",
      codingRequired: false,
      assessmentRequired: true,
      confidence: 0.95
    };
  }

  // 9. Operations, Logistics & Supply Chain
  if (/\b(operations|supply chain|logistics|warehouse|procurement|inventory|operations manager|coo)\b/i.test(roleLower)) {
    return {
      jobFamily: "operations",
      subFamily: "supply_chain_operations",
      industry: input.industry || "operations",
      seniority,
      technicalIntensity: "low",
      domainIntensity: "high",
      behavioralIntensity: "high",
      leadershipIntensity: seniority === "Senior" || seniority === "Expert" ? "high" : "medium",
      practicalAssessmentType: "SCENARIO",
      codingRequired: false,
      assessmentRequired: true,
      confidence: 0.88
    };
  }

  // Default General Professional
  return {
    jobFamily: "general",
    subFamily: "general_professional",
    industry: input.industry || "business",
    seniority,
    technicalIntensity: "low",
    domainIntensity: "medium",
    behavioralIntensity: "high",
    leadershipIntensity: "medium",
    practicalAssessmentType: "NONE",
    codingRequired: false,
    assessmentRequired: false,
    confidence: 0.75
  };
}

/**
 * Detects whether the candidate is a career switcher and identifies transferable domains.
 */
function analyzeCareerTransition(
  candidateResume: string | undefined,
  targetFamily: JobFamily,
  targetRole: string
): { isCareerSwitcher: boolean; transferableDomains: string[] } {
  if (!candidateResume || candidateResume.length < 50) {
    return { isCareerSwitcher: false, transferableDomains: [] };
  }

  const resLower = candidateResume.toLowerCase();

  // Examples of common transitions:
  // Hospitality / Retail -> Customer Success / Support / Sales
  const hasHospitality = /\b(hospitality|hotel|restaurant|guest relations|server|bartender|retail|store manager)\b/i.test(resLower);
  if (hasHospitality && (targetFamily === "sales" || targetFamily === "human_resources" || targetRole.toLowerCase().includes("customer success"))) {
    return {
      isCareerSwitcher: true,
      transferableDomains: [
        "High-volume customer communication under pressure",
        "De-escalation and conflict resolution",
        "Operational empathy and relationship building",
        "Stakeholder and guest service excellence"
      ]
    };
  }

  // Education / Teaching -> Corporate Training / Instructional Design / HR / PM
  const hasEducation = /\b(teacher|classroom|curriculum|lesson plan|students|school|pedagogy)\b/i.test(resLower);
  if (hasEducation && (targetFamily === "product" || targetFamily === "human_resources" || targetFamily === "marketing")) {
    return {
      isCareerSwitcher: true,
      transferableDomains: [
        "Structured stakeholder presentation & pedagogical clarity",
        "Translating complex concepts for diverse audiences",
        "Multi-stakeholder project coordination & planning",
        "Continuous feedback and iterative improvement"
      ]
    };
  }

  // Non-tech -> Tech / Engineering
  const hasTechResume = /\b(git|github|python|javascript|react|sql|java|c\+\+|api|database)\b/i.test(resLower);
  if (targetFamily === "engineering" && !hasTechResume) {
    return {
      isCareerSwitcher: true,
      transferableDomains: [
        "Systematic problem solving and analytical thinking",
        "Fast learning agility and self-directed study",
        "Cross-functional communication"
      ]
    };
  }

  return { isCareerSwitcher: false, transferableDomains: [] };
}

/**
 * Generates dynamic, profession-agnostic interview blueprint.
 */
export function generateInterviewBlueprint(input: RoleClassificationInput): InterviewBlueprint {
  const classification = classifyRole(input);
  const transition = analyzeCareerTransition(input.candidateResume, classification.jobFamily, input.targetRole);

  const { jobFamily, seniority, practicalAssessmentType, codingRequired } = classification;

  // 1. Configure Universal & Dynamic Competencies with Normalized Weights
  let competencies: BlueprintCompetency[] = [];

  switch (jobFamily) {
    case "engineering":
      competencies = [
        {
          id: "technical",
          name: "Technical Depth & Engineering Fundamentals",
          weight: 0.30,
          description: "Deep understanding of programming fundamentals, language semantics, frameworks, and architecture.",
          category: "domain",
          positiveSignals: ["Explains exact memory or execution trade-offs", "Demonstrates language internals knowledge"],
          negativeSignals: ["Vague buzzwords without technical grounding", "Conflates library usage with fundamentals"],
          sampleQuestion: `Can you explain the core architectural trade-offs you made in a recent system built for ${input.targetRole}?`
        },
        {
          id: "problem_solving",
          name: "Algorithmic & Analytical Problem Solving",
          weight: 0.20,
          description: "Systematic decomposition of complex problems and edge-case awareness.",
          category: "universal",
          positiveSignals: ["Clarifies constraints first", "Breaks problems into modular sub-problems"],
          negativeSignals: ["Jumps prematurely to code without plan", "Ignores boundary cases"],
          sampleQuestion: "How do you systematically identify bottlenecks when an API suffers sudden latency spikes?"
        },
        {
          id: "system_design",
          name: "System Architecture & Scalability",
          weight: 0.15,
          description: "Distributed systems, fault tolerance, horizontal scaling, and data consistency.",
          category: "domain",
          positiveSignals: ["Defines clear system boundaries and data flows", "Weighs consistency vs availability trade-offs"],
          negativeSignals: ["Treats third-party components as magic", "Ignores database indexing or sharding"],
          sampleQuestion: "How would you design a resilient distributed queue that guarantees at-least-once delivery?"
        },
        {
          id: "communication",
          name: "Communication & Collaboration",
          weight: 0.10,
          description: "Clear delivery and cross-functional technical communication.",
          category: "universal",
          positiveSignals: ["Clear logical structure", "Explains complex ideas simply"],
          negativeSignals: ["Rambles without conclusion", "Uses opaque jargon"],
          sampleQuestion: "How do you explain technical debt to a non-technical product manager?"
        },
        {
          id: "behavioral",
          name: "Behavioral (STAR) & Team Leadership",
          weight: 0.10,
          description: "Personal agency, conflict resolution, and ownership of outcomes.",
          category: "universal",
          positiveSignals: ["Uses personal agency verbs ('I did')", "Shares quantifiable business results"],
          negativeSignals: ["Passive language ('we did')", "Shifts blame for failures"],
          sampleQuestion: "Tell me about a time an engineering release failed in production. What personal steps did you take?"
        },
        {
          id: "role_fit",
          name: "Role & Seniority Fit",
          weight: 0.10,
          description: "Alignment with engineering level and organizational standards.",
          category: "universal",
          positiveSignals: ["Scope matches target seniority", "Business impact awareness"],
          negativeSignals: ["Misaligned expectations", "Disregard for team velocity"],
          sampleQuestion: `What makes you uniquely prepared for this ${seniority} ${input.targetRole} role?`
        },
        {
          id: "coding",
          name: "Hands-on Coding & Execution",
          weight: 0.05,
          description: "Clean code structure, correctness, and edge-case handling.",
          category: "practical",
          positiveSignals: ["Optimal time and space complexity", "Modular code structure"],
          negativeSignals: ["Syntax errors", "Neglects input validation"],
          sampleQuestion: "Demonstrate an optimal algorithm for processing structured streaming data."
        }
      ];
      break;

    case "marketing":
      competencies = [
        {
          id: "marketing_strategy",
          name: "Marketing Strategy & Brand Vision",
          weight: 0.25,
          description: "Comprehensive go-to-market strategy, brand positioning, and channel orchestration.",
          category: "domain",
          positiveSignals: ["Articulates clear value proposition and target audience", "Balances short-term acquisition with long-term brand equity"],
          negativeSignals: ["Lacks cohesive strategy beyond random tactics", "Unfamiliar with core customer segmentation"],
          sampleQuestion: `How would you build and execute a 6-month go-to-market strategy for our flagship product as ${input.targetRole}?`
        },
        {
          id: "campaign_analytics",
          name: "Campaign Analytics & Measurement",
          weight: 0.20,
          description: "Data-driven campaign optimization, CAC/LTV economics, and attribution modeling.",
          category: "domain",
          positiveSignals: ["Quotes concrete conversion and ROI metrics", "Understands multi-touch attribution limitations"],
          negativeSignals: ["Focuses exclusively on vanity metrics (impressions/likes)", "Cannot explain CAC or payback period"],
          sampleQuestion: "Walk me through how you evaluate whether a paid acquisition campaign is truly incremental."
        },
        {
          id: "problem_solving",
          name: "Creative Problem Solving & Experimentation",
          weight: 0.15,
          description: "Iterative testing, creative differentiation, and growth loops.",
          category: "universal",
          positiveSignals: ["Designs structured A/B hypothesis tests", "Iterates rapidly based on qualitative and quantitative feedback"],
          negativeSignals: ["Resistant to changing underperforming creative", "Lacks rigorous test-and-learn mindset"],
          sampleQuestion: "Tell me about a creative campaign experiment that failed. What hypothesis did you test and what did you learn?"
        },
        {
          id: "communication",
          name: "Communication & Stakeholder Storytelling",
          weight: 0.15,
          description: "Compelling narrative development, executive buy-in, and cross-functional leadership.",
          category: "universal",
          positiveSignals: ["Crisp executive summaries", "Inspires confidence with clear messaging"],
          negativeSignals: ["Unfocused presentations", "Fails to tailor narrative to executive stakeholders"],
          sampleQuestion: "How do you present marketing spend and ROI to a skeptical finance partner?"
        },
        {
          id: "leadership",
          name: "Team Leadership & Prioritization",
          weight: 0.10,
          description: "Agency management, resource allocation, and cross-functional alignment with sales and product.",
          category: "leadership",
          positiveSignals: ["Pragmatic prioritization of high-leverage initiatives", "Proven track record collaborating with sales and product"],
          negativeSignals: ["Spreads budget too thinly across too many channels", "Siloed mindset"],
          sampleQuestion: "How do you resolve conflicting priority requests between sales lead generation and brand awareness?"
        },
        {
          id: "behavioral",
          name: "Behavioral Effectiveness (STAR)",
          weight: 0.10,
          description: "Resilience, personal ownership, adaptability, and high standards.",
          category: "universal",
          positiveSignals: ["Takes ownership of campaign misses", "Demonstrates collaborative win-win attitude"],
          negativeSignals: ["Blames creative agency or product for missed goals", "Inflexible to market shifts"],
          sampleQuestion: "Describe a high-stakes campaign launch that faced sudden disruptions. How did you personally steer it?"
        },
        {
          id: "role_fit",
          name: "Role & Industry Alignment",
          weight: 0.05,
          description: "Deep understanding of industry dynamics, competitors, and growth opportunities.",
          category: "universal",
          positiveSignals: ["Incisive knowledge of competitor positioning", "Enthusiastic about customer persona"],
          negativeSignals: ["Generic answers applicable to any company", "No research on our market"],
          sampleQuestion: `What is the biggest untapped marketing opportunity you see in our industry today?`
        }
      ];
      break;

    case "sales":
      competencies = [
        {
          id: "discovery_and_prospecting",
          name: "Prospecting & Rigorous Discovery",
          weight: 0.25,
          description: "Identifying ICP buyers, mapping pain points, and uncovering budget and decision authority.",
          category: "domain",
          positiveSignals: ["Asks deep diagnostic questions before pitching", "Uncovers latent business pain and economic buyers"],
          negativeSignals: ["Launches into feature pitch without understanding client needs", "Fails to identify decision criteria"],
          sampleQuestion: "Walk me through your first discovery call with a skeptical VP-level prospect."
        },
        {
          id: "objection_handling_negotiation",
          name: "Objection Handling & Commercial Negotiation",
          weight: 0.20,
          description: "Navigating price objections, security reviews, and competitive trade-offs to close win-win deals.",
          category: "domain",
          positiveSignals: ["Validates client concerns and reframes value", "Protects margins without compromising relationship"],
          negativeSignals: ["Discounts price immediately when challenged", "Becomes defensive with objections"],
          sampleQuestion: "When a prospect says 'Your competitor offers this for 30% less', how do you respond?"
        },
        {
          id: "communication",
          name: "Persuasive Communication & Active Listening",
          weight: 0.15,
          description: "Concise executive delivery, active listening, and relationship rapport.",
          category: "universal",
          positiveSignals: ["Listens more than speaks (80/20 rule)", "Mirrors customer language and builds trust"],
          negativeSignals: ["Talks over prospect", "Uses aggressive or pushy sales jargon"],
          sampleQuestion: "How do you tailor your communication between a CFO and a technical end-user during a deal cycle?"
        },
        {
          id: "problem_solving",
          name: "Commercial Problem Solving & Deal Strategy",
          weight: 0.15,
          description: "Multi-threading accounts, building business cases, and calculating ROI for stakeholders.",
          category: "universal",
          positiveSignals: ["Builds defensible ROI business cases with the champion", "Navigates complex procurement and legal hurdles"],
          negativeSignals: ["Relies on single champion without multi-threading", "Surprised by procurement blockers"],
          sampleQuestion: "How do you resurrect a stalled enterprise deal where the original champion went silent?"
        },
        {
          id: "behavioral",
          name: "Grit, Resilience & Behavioral STAR",
          weight: 0.15,
          description: "Quota achievement under pressure, personal accountability, and coachability.",
          category: "universal",
          positiveSignals: ["Demonstrates consistent quota attainment", "Analyzes lost deals with radical candor"],
          negativeSignals: ["Blames territory or product for missed quotas", "Lacks proactive pipeline generation habits"],
          sampleQuestion: "Tell me about a quarter when you were behind on quota. What specific actions did you take to recover?"
        },
        {
          id: "role_fit",
          name: "Sales Methodology & Culture Fit",
          weight: 0.10,
          description: "Adherence to structured sales methodology (MEDDPICC, Challenger, Command of the Message).",
          category: "domain",
          positiveSignals: ["Fluent in structured qualification frameworks", "Customer-first advisory mindset"],
          negativeSignals: ["Wing-it approach without qualification rigor", "Unstructured deal management"],
          sampleQuestion: `Which sales methodology (e.g. MEDDPICC) do you rely on, and how has it improved your close rate?`
        }
      ];
      break;

    case "human_resources":
      competencies = [
        {
          id: "people_operations_and_policy",
          name: "HR Knowledge, Employment Policy & Compliance",
          weight: 0.25,
          description: "Labor laws, fair employment practices, workplace safety, and organizational policies.",
          category: "domain",
          positiveSignals: ["Accurate legal and ethical compliance awareness", "Fair, objective, and unbiased approach"],
          negativeSignals: ["Casual disregard for labor regulations", "Exposes company to legal liabilities"],
          sampleQuestion: "How do you handle a sensitive workplace grievance involving a high-performing senior manager?"
        },
        {
          id: "conflict_resolution",
          name: "Conflict Management & Employee Relations",
          weight: 0.20,
          description: "De-escalating interpersonal disputes, facilitating difficult conversations, and restoring trust.",
          category: "domain",
          positiveSignals: ["Impartial empathetic listening", "Finds constructive solutions that align with policy and empathy"],
          negativeSignals: ["Takes sides prematurely", "Avoids difficult confrontations"],
          sampleQuestion: "Walk me through how you mediated a severe dispute between two leadership team members."
        },
        {
          id: "communication",
          name: "Empathetic & Structured Communication",
          weight: 0.15,
          description: "Compassionate, transparent, and authoritative communication across all organizational levels.",
          category: "universal",
          positiveSignals: ["High emotional intelligence and calm demeanor", "Articulates sensitive news clearly and respectfully"],
          negativeSignals: ["Cold, robotic policy regurgitation", "Indiscreet handling of confidential matters"],
          sampleQuestion: "How do you deliver difficult organization-wide news, such as restructuring, with clarity and compassion?"
        },
        {
          id: "problem_solving",
          name: "Organizational Problem Solving & Strategy",
          weight: 0.15,
          description: "Talent retention, workforce planning, performance management, and organizational design.",
          category: "universal",
          positiveSignals: ["Data-driven retention and turnover analysis", "Aligns talent initiatives with business objectives"],
          negativeSignals: ["Treats HR purely as administrative rather than strategic", "Ignores retention metrics"],
          sampleQuestion: "When a critical department experiences high voluntary turnover, how do you diagnose the root cause?"
        },
        {
          id: "behavioral",
          name: "Integrity, Discretion & Behavioral STAR",
          weight: 0.15,
          description: "Unwavering ethical standards, confidentiality, and dependable follow-through.",
          category: "universal",
          positiveSignals: ["Guards confidential data rigorously", "Models organizational values"],
          negativeSignals: ["Gossips or breaches confidentiality", "Inconsistent application of company rules"],
          sampleQuestion: "Describe a situation where executive pressure conflicted with employee fairness or labor guidelines. How did you stand your ground?"
        },
        {
          id: "role_fit",
          name: "Talent Strategy & Culture Alignment",
          weight: 0.10,
          description: "Fostering inclusive, high-performing culture and aligning recruitment with future business needs.",
          category: "domain",
          positiveSignals: ["Champion of diversity, equity, and inclusion", "Partners seamlessly with department heads"],
          negativeSignals: ["Lacks vision for organizational culture", "Reactive rather than proactive in talent planning"],
          sampleQuestion: `What is your blueprint for improving employer brand and employee engagement in this role?`
        }
      ];
      break;

    case "education":
      competencies = [
        {
          id: "pedagogy_and_instruction",
          name: "Pedagogy, Curriculum Design & Instruction",
          weight: 0.25,
          description: "Evidence-based teaching methodologies, differentiated instruction, and curriculum alignment.",
          category: "domain",
          positiveSignals: ["Differentiates instruction for diverse learning styles", "Employs active learning and formative assessment"],
          negativeSignals: ["Relies solely on passive rote lecturing", "Unable to explain pedagogical choices"],
          sampleQuestion: "How do you design a unit lesson plan that supports both struggling students and accelerated learners?"
        },
        {
          id: "classroom_management",
          name: "Classroom Management & Culture",
          weight: 0.20,
          description: "Establishing safe, respectful, inclusive, and engaging learning environments.",
          category: "domain",
          positiveSignals: ["Proactive positive behavioral interventions", "Creates an atmosphere of mutual respect and high expectations"],
          negativeSignals: ["Relies on punitive measures without building rapport", "Loses control of classroom pacing"],
          sampleQuestion: "How do you de-escalate a disruptive situation while keeping the rest of the class engaged?"
        },
        {
          id: "communication",
          name: "Communication with Students, Parents & Staff",
          weight: 0.15,
          description: "Clear, encouraging, and constructive communication with learners, guardians, and colleagues.",
          category: "universal",
          positiveSignals: ["Partnering constructively with parents", "Clear, compassionate feedback to students"],
          negativeSignals: ["Defensive communication with parents", "Discouraging tone with struggling students"],
          sampleQuestion: "How do you approach a difficult conversation with a parent whose child is consistently disengaged?"
        },
        {
          id: "student_assessment",
          name: "Assessment, Feedback & Student Growth",
          weight: 0.15,
          description: "Using formative and summative data to measure learning and adapt instructional strategies.",
          category: "domain",
          positiveSignals: ["Uses data to refine teaching in real time", "Provides timely, actionable student feedback"],
          negativeSignals: ["Uses tests purely for grading without learning feedback", "Ignores student comprehension gaps"],
          sampleQuestion: "When half your students fail a mid-unit assessment, what is your immediate pedagogical next step?"
        },
        {
          id: "behavioral",
          name: "Empathy, Patience & Behavioral STAR",
          weight: 0.15,
          description: "Dedication to student wellbeing, resilience under pressure, and continuous professional reflection.",
          category: "universal",
          positiveSignals: ["Reflects candidly on lesson outcomes", "Demonstrates tireless advocacy for every student"],
          negativeSignals: ["Gives up on difficult students", "Blames students or families for lack of progress"],
          sampleQuestion: "Tell me about a student who initially refused to participate in your class. How did you personally connect with them?"
        },
        {
          id: "role_fit",
          name: "Subject Mastery & Educational Philosophy",
          weight: 0.10,
          description: "Deep command of subject matter and commitment to school community values.",
          category: "domain",
          positiveSignals: ["Contagious passion for the subject matter", "Eager to contribute to extracurriculars and school community"],
          negativeSignals: ["Superficial subject knowledge", "Reluctance to collaborate with grade-level teams"],
          sampleQuestion: `What is the core educational philosophy that guides your daily teaching practice?`
        }
      ];
      break;

    case "finance":
      competencies = [
        {
          id: "financial_analysis_and_modeling",
          name: "Financial Analysis, Modeling & Quantitative Reasoning",
          weight: 0.25,
          description: "Financial statement analysis, DCF modeling, variance analysis, and scenario planning.",
          category: "domain",
          positiveSignals: ["Demonstrates rigorous quantitative precision", "Identifies key unit economics drivers"],
          negativeSignals: ["Superficial understanding of cash flow vs accrual accounting", "Cannot explain model sensitivities"],
          sampleQuestion: "Walk me through how you build a three-statement forecast model and audit for circular references."
        },
        {
          id: "forecasting_and_risk",
          name: "Forecasting, Budgeting & Risk Management",
          weight: 0.20,
          description: "Planning, forecasting under uncertainty, capital allocation, and stress testing.",
          category: "domain",
          positiveSignals: ["Accounts for macroeconomic and industry risk factors", "Stress-tests downside scenarios rigorously"],
          negativeSignals: ["Projects linear hockey-stick growth without justification", "Ignores working capital constraints"],
          sampleQuestion: "How do you forecast revenue and cash burn when entering an unproven market?"
        },
        {
          id: "communication",
          name: "Executive Financial Storytelling & Presentation",
          weight: 0.15,
          description: "Translating complex numerical tables into clear strategic insights for executive leadership.",
          category: "universal",
          positiveSignals: ["Distills complex variances into 2-3 key strategic takeaways", "Provides clear actionable recommendations"],
          negativeSignals: ["Dumps spreadsheets without synthesizing insight", "Cannot answer 'so what?' for the CEO"],
          sampleQuestion: "How do you present an unexpected quarterly margin compression to the executive committee?"
        },
        {
          id: "problem_solving",
          name: "Analytical Problem Solving & Business Acumen",
          weight: 0.15,
          description: "Uncovering operational inefficiencies, evaluating M&A or capital investments, and cost optimization.",
          category: "universal",
          positiveSignals: ["Balances financial prudence with strategic growth", "Identifies hidden cost drivers"],
          negativeSignals: ["Penny-wise and pound-foolish recommendations", "Lacks strategic business context"],
          sampleQuestion: "If a business unit reports high revenue growth but declining cash flow, what is your diagnostic process?"
        },
        {
          id: "behavioral",
          name: "Fiduciary Integrity, Rigor & Behavioral STAR",
          weight: 0.15,
          description: "Meticulous accuracy, compliance with regulatory standards, and ethical fortitude.",
          category: "universal",
          positiveSignals: ["Zero tolerance for sloppy errors", "Maintains ethical backbone under stakeholder pressure"],
          negativeSignals: ["Careless calculation mistakes", "Willing to bend accounting rules to hit targets"],
          sampleQuestion: "Tell me about a time a business leader pressured you to adjust a financial forecast to look more favorable. How did you handle it?"
        },
        {
          id: "role_fit",
          name: "Regulatory Knowledge & Corporate Strategy Fit",
          weight: 0.10,
          description: "Knowledge of GAAP/IFRS, tax/audit compliance, and industry capital structure.",
          category: "domain",
          positiveSignals: ["Fluent in corporate finance fundamentals", "Understands industry-specific KPIs"],
          negativeSignals: ["Unfamiliar with standard accounting principles", "Lacks enthusiasm for industry economics"],
          sampleQuestion: `What key financial metrics matter most for our industry, and why?`
        }
      ];
      break;

    case "data_analytics":
      competencies = [
        {
          id: "sql_and_data_interpretation",
          name: "SQL, Data Modeling & Interpretation",
          weight: 0.25,
          description: "Complex relational queries, dimensional modeling, and extracting factual data insights.",
          category: "domain",
          positiveSignals: ["Optimal query design and index awareness", "Accurately interprets subtle data discrepancies"],
          negativeSignals: ["Relies on inefficient nested subqueries", "Accepts dirty data without validation"],
          sampleQuestion: "How do you structure a complex window function to calculate rolling retention cohorts in SQL?"
        },
        {
          id: "statistical_and_analytical_reasoning",
          name: "Statistical Rigor & Analytical Reasoning",
          weight: 0.20,
          description: "Hypothesis testing, significance, distributions, and preventing confirmation bias.",
          category: "domain",
          positiveSignals: ["Understands statistical significance vs sample size", "Guards against Simpson's paradox and bias"],
          negativeSignals: ["Confuses correlation with causation", "Fails to test for distribution normality or outliers"],
          sampleQuestion: "How do you determine if a 2% lift in conversion during an A/B test is statistically significant and practically meaningful?"
        },
        {
          id: "visualization_and_communication",
          name: "Data Visualization & Stakeholder Communication",
          weight: 0.20,
          description: "Translating data insights into intuitive executive dashboards and strategic recommendations.",
          category: "universal",
          positiveSignals: ["Designs uncluttered, self-explanatory charts", "Tailors narrative to business decision-makers"],
          negativeSignals: ["Overcrowded, confusing visual charts", "Unable to articulate business impact"],
          sampleQuestion: "How do you design an executive KPI dashboard that prevents information overload?"
        },
        {
          id: "problem_solving",
          name: "Business Problem Solving & Root Cause Diagnosis",
          weight: 0.15,
          description: "Decomposing high-level business queries into measurable data questions.",
          category: "universal",
          positiveSignals: ["Asks clarifying business questions before querying", "Identifies root causes rather than symptoms"],
          negativeSignals: ["Runs queries aimlessly without hypothesis", "Fails to connect metrics to revenue or retention"],
          sampleQuestion: "Daily active users dropped by 15% over the weekend. How do you systematically isolate the cause?"
        },
        {
          id: "behavioral",
          name: "Data Integrity, Curiosity & Behavioral STAR",
          weight: 0.10,
          description: "Intellectual honesty, passion for data cleanliness, and cross-functional empathy.",
          category: "universal",
          positiveSignals: ["Proactively flags data quality anomalies", "Shares personal responsibility for model accuracy"],
          negativeSignals: ["Hides contradictory findings", "Disregards data governance standards"],
          sampleQuestion: "Tell me about a time your data analysis directly contradicted what the leadership team expected. How did you present your findings?"
        },
        {
          id: "role_fit",
          name: "Analytics Stack & Domain Alignment",
          weight: 0.10,
          description: "Proficiency in modern analytics stack (dbt, Snowflake, BigQuery, Tableau, Python) and industry context.",
          category: "domain",
          positiveSignals: ["Deep familiarity with warehouse and BI architecture", "Understands product and marketing funnels"],
          negativeSignals: ["Stuck on legacy proprietary tools", "No interest in data engineering best practices"],
          sampleQuestion: `Which tools in the modern data stack do you find most reliable for automated reporting?`
        }
      ];
      break;

    case "product":
      competencies = [
        {
          id: "product_strategy_and_vision",
          name: "Product Strategy, Vision & Market Discovery",
          weight: 0.25,
          description: "Product market fit, user segmentation, competitive positioning, and 3-year vision.",
          category: "domain",
          positiveSignals: ["Customer-obsessed problem framing", "Articulates clear differentiated value proposition"],
          negativeSignals: ["Feature factory mindset without vision", "Unaware of competitive moat"],
          sampleQuestion: "How do you evaluate whether a new feature opportunity aligns with our long-term product strategy?"
        },
        {
          id: "prioritization_and_roadmapping",
          name: "Prioritization & Roadmapping Under Ambiguity",
          weight: 0.20,
          description: "Frameworks (RICE, Kano), trade-offs between technical debt and growth, and execution pacing.",
          category: "domain",
          positiveSignals: ["Defends hard trade-offs with data and customer empathy", "Manages technical debt proactively"],
          negativeSignals: ["Says 'yes' to every executive request", "Roadmap lacks clear measurable milestones"],
          sampleQuestion: "When engineering insists on paying down tech debt and sales demands a deal-closing feature, how do you decide?"
        },
        {
          id: "user_research_and_metrics",
          name: "User Research & Product Metrics (North Star)",
          weight: 0.15,
          description: "Qualitative customer discovery, defining North Star metrics, and tracking funnel health.",
          category: "domain",
          positiveSignals: ["Validates assumptions through user interviews", "Selects leading indicators over lagging vanity metrics"],
          negativeSignals: ["Builds features without talking to real users", "Cannot define success criteria for a release"],
          sampleQuestion: "How do you establish the North Star metric for a brand new product initiative?"
        },
        {
          id: "communication_and_stakeholders",
          name: "Cross-Functional Influence & Leadership",
          weight: 0.15,
          description: "Leading without authority across engineering, design, sales, marketing, and executives.",
          category: "universal",
          positiveSignals: ["Builds genuine team consensus", "Translates customer vision into clear engineering user stories"],
          negativeSignals: ["Dictatorial approach", "Struggles to align conflicting departmental agendas"],
          sampleQuestion: "How do you motivate an engineering team when leadership changes product direction abruptly?"
        },
        {
          id: "problem_solving",
          name: "First-Principles Problem Solving & Adaptability",
          weight: 0.15,
          description: "Iterating through MVPs, hypothesis testing, and navigating ambiguous market shifts.",
          category: "universal",
          positiveSignals: ["Focuses on root problem rather than superficial solutions", "Scrappy MVP validation"],
          negativeSignals: ["Over-engineers initial release", "Reluctant to kill failing features"],
          sampleQuestion: "Describe an MVP you launched that failed to gain traction. How did you pivot?"
        },
        {
          id: "behavioral",
          name: "Ownership Mindset & Behavioral STAR",
          weight: 0.10,
          description: "Extreme ownership of product outcomes, radical candor, and team resilience.",
          category: "universal",
          positiveSignals: ["Takes full responsibility for product misses", "Celebrates team achievements"],
          negativeSignals: ["Blames engineering or design for poor adoption", "Defensive against critical feedback"],
          sampleQuestion: "Tell me about a product decision you made that turned out to be wrong. What was the impact and what did you change?"
        }
      ];
      break;

    default: // General Professional
      competencies = [
        {
          id: "communication",
          name: "Professional Communication & Clarity",
          weight: 0.25,
          description: "Clear verbal and written delivery, executive presence, and active listening.",
          category: "universal",
          positiveSignals: ["Concise, structured answers", "Active listening and responsive answers"],
          negativeSignals: ["Disorganized thoughts", "Opaque or evasive language"],
          sampleQuestion: "How do you ensure critical information is accurately communicated across team members?"
        },
        {
          id: "problem_solving",
          name: "Analytical Problem Solving & Judgment",
          weight: 0.25,
          description: "Decomposing operational challenges, evaluating options, and executing solutions.",
          category: "universal",
          positiveSignals: ["Structured approach to unfamiliar problems", "Considers secondary consequences"],
          negativeSignals: ["Paralysis by analysis", "Impulsive decision-making without evidence"],
          sampleQuestion: "Walk me through how you solve an ambiguous problem where you have incomplete data."
        },
        {
          id: "behavioral",
          name: "Ownership, Resilience & Behavioral STAR",
          weight: 0.20,
          description: "Personal accountability, grit, teamwork, and continuous improvement.",
          category: "universal",
          positiveSignals: ["Uses 'I' verbs to describe actions", "Demonstrates measurable business results"],
          negativeSignals: ["Passive or blaming attitude", "Unable to give concrete examples"],
          sampleQuestion: "Describe a project where deadlines were tight and unexpected obstacles arose. How did you deliver?"
        },
        {
          id: "collaboration",
          name: "Team Collaboration & Adaptability",
          weight: 0.15,
          description: "Working effectively with diverse colleagues, managing conflict, and adapting to change.",
          category: "universal",
          positiveSignals: ["Encourages peer contributions", "Flexible when plans change"],
          negativeSignals: ["Rigid and resistant to feedback", "Creates interpersonal friction"],
          sampleQuestion: "Tell me about a disagreement you had with a teammate and how you resolved it constructively."
        },
        {
          id: "role_fit",
          name: "Role Motivation & Professional Growth",
          weight: 0.15,
          description: "Alignment with job expectations, enthusiasm for company mission, and learning potential.",
          category: "universal",
          positiveSignals: ["Clear career trajectory rationale", "Demonstrated eagerness to learn"],
          negativeSignals: ["Apathetic attitude", "No knowledge of our organization"],
          sampleQuestion: `Why are you interested in this ${input.targetRole} role at our organization?`
        }
      ];
      break;
  }

  // Adjust competencies for Seniority (e.g. Entry level should not be scored or penalized on senior leadership)
  if (seniority === "Entry") {
    competencies = competencies.map(c => {
      if (c.id === "leadership" || c.category === "leadership") {
        return {
          ...c,
          id: "learning_agility",
          name: "Learning Agility & Foundational Potential",
          description: "Curiosity, speed of skill acquisition, receptiveness to feedback, and foundational preparation.",
          category: "universal" as const,
          sampleQuestion: "Tell me about a new topic, tool, or skill you had to learn quickly on your own. How did you master it?"
        };
      }
      return c;
    });
  }

  // 2. Strict Normalization of Weights so sum === 1.0
  const rawSum = competencies.reduce((acc, c) => acc + c.weight, 0);
  const scoringWeights: Record<string, number> = {};
  
  for (let i = 0; i < competencies.length; i++) {
    const comp = competencies[i];
    const normalized = Math.round((comp.weight / rawSum) * 1000) / 1000;
    comp.weight = normalized;
    scoringWeights[comp.id] = normalized;
  }
  
  // Ensure exact 1.0 sum by adjusting first item for any minor rounding difference
  const normalizedSum = Object.values(scoringWeights).reduce((a, b) => a + b, 0);
  const roundingDelta = Math.round((1.0 - normalizedSum) * 1000) / 1000;
  if (roundingDelta !== 0 && competencies.length > 0) {
    competencies[0].weight = Math.round((competencies[0].weight + roundingDelta) * 1000) / 1000;
    scoringWeights[competencies[0].id] = competencies[0].weight;
  }

  // 3. Configure Universal Interviewer Specialization (Sarah, David, Marcus)
  const hrSpecialist: InterviewerSpecialization = {
    role: "HR",
    name: "Sarah Jenkins",
    title: "Senior People Partner & Behavioral Assessor",
    focus: "Motivation, communication, ownership, collaboration, STAR methodology, conflict resolution, and behavioral evidence.",
    rubric: "Evaluate candidate behavioral evidence using STAR (Situation, Task, Action, Result), personal agency, cross-functional empathy, and core values alignment."
  };

  let domainSpecialist: InterviewerSpecialization;
  switch (jobFamily) {
    case "marketing":
      domainSpecialist = {
        role: "Technical",
        name: "David Chen",
        title: "Head of Marketing Strategy & Growth",
        focus: "Marketing strategy, go-to-market execution, campaign analytics, CAC/LTV payback, and customer segmentation.",
        rubric: "Evaluate strategic clarity, analytical rigor in measurement, customer empathy, and channel scalability."
      };
      break;
    case "sales":
      domainSpecialist = {
        role: "Technical",
        name: "David Chen",
        title: "Director of Enterprise Sales & Revenue Enablement",
        focus: "Sales discovery methodology, objection handling, commercial negotiation, pipeline qualification, and deal closing.",
        rubric: "Evaluate qualification rigor (MEDDPICC), active listening, value reframing, and consultative closing ability."
      };
      break;
    case "human_resources":
      domainSpecialist = {
        role: "Technical",
        name: "David Chen",
        title: "VP of People Operations & Talent Strategy",
        focus: "HR compliance, employment law, employee relations, workplace conflict mediation, and organizational design.",
        rubric: "Evaluate knowledge of employment standards, objectivity in dispute mediation, and strategic talent retention."
      };
      break;
    case "education":
      domainSpecialist = {
        role: "Technical",
        name: "David Chen",
        title: "Dean of Curriculum, Instruction & Pedagogy",
        focus: "Pedagogical methodology, differentiated instruction, classroom culture, and student learning assessment.",
        rubric: "Evaluate instructional design soundness, empathy for diverse learners, proactive classroom management, and formative feedback."
      };
      break;
    case "finance":
      domainSpecialist = {
        role: "Technical",
        name: "David Chen",
        title: "Principal Financial Analyst & Quantitative Modeler",
        focus: "Financial modeling, forecasting, variance analysis, capital allocation, cash burn analysis, and valuation.",
        rubric: "Evaluate quantitative precision, analytical sanity checks, accounting fundamentals (GAAP), and scenario planning."
      };
      break;
    case "data_analytics":
      domainSpecialist = {
        role: "Technical",
        name: "David Chen",
        title: "Lead Analytics Architect & Data Modeler",
        focus: "SQL query optimization, data warehouse modeling, statistical inference, visualization, and metric definition.",
        rubric: "Evaluate data modeling logic, statistical validity, dashboard readability, and business problem translation."
      };
      break;
    case "product":
      domainSpecialist = {
        role: "Technical",
        name: "David Chen",
        title: "Director of Product Architecture & Strategy",
        focus: "Product discovery, roadmapping under ambiguity, feature prioritization trade-offs, and user experience.",
        rubric: "Evaluate first-principles problem definition, customer empathy, prioritization frameworks, and business acumen."
      };
      break;
    case "engineering":
    default:
      domainSpecialist = {
        role: "Technical",
        name: "David Chen",
        title: "Principal Software Architect",
        focus: "System architecture, fault tolerance, trade-offs, scalability, distributed systems, and technical depth.",
        rubric: "Evaluate architectural soundness, failure domain isolation, concurrency trade-offs, and concrete technology choices."
      };
      break;
  }

  let hmSpecialist: InterviewerSpecialization;
  switch (jobFamily) {
    case "marketing":
      hmSpecialist = {
        role: "HiringManager",
        name: "Marcus Brody",
        title: "Chief Marketing Officer",
        focus: "Commercial business growth, brand equity, cross-functional sales alignment, and organizational leadership.",
        rubric: "Evaluate commercial judgment, delivery velocity, cross-departmental influence, and long-term brand stewardship."
      };
      break;
    case "sales":
      hmSpecialist = {
        role: "HiringManager",
        name: "Marcus Brody",
        title: "Chief Revenue Officer",
        focus: "Revenue ownership, territory execution, quota predictability, team leadership, and strategic customer relationships.",
        rubric: "Evaluate quota track record, executive presence, forecast reliability, and business impact under pressure."
      };
      break;
    case "human_resources":
      hmSpecialist = {
        role: "HiringManager",
        name: "Marcus Brody",
        title: "Chief People Officer",
        focus: "Executive partnership, company culture preservation, strategic talent planning, and high-stakes dispute resolution.",
        rubric: "Evaluate executive judgment, ethical fortitude, organizational empathy, and alignment with company trajectory."
      };
      break;
    case "education":
      hmSpecialist = {
        role: "HiringManager",
        name: "Marcus Brody",
        title: "Superintendent & Head of School",
        focus: "Community trust, educational vision, faculty development, student outcomes, and school culture.",
        rubric: "Evaluate dedication to educational equity, stakeholder communication with families, and institutional leadership."
      };
      break;
    case "finance":
      hmSpecialist = {
        role: "HiringManager",
        name: "Marcus Brody",
        title: "Chief Financial Officer",
        focus: "Fiduciary stewardship, investor relations, resource allocation, risk management, and commercial strategy.",
        rubric: "Evaluate strategic finance judgment, integrity, executive presentation, and risk-adjusted decision making."
      };
      break;
    case "product":
      hmSpecialist = {
        role: "HiringManager",
        name: "Marcus Brody",
        title: "Chief Product Officer",
        focus: "Product vision, market impact, cross-functional organizational alignment, and engineering synergy.",
        rubric: "Evaluate strategic judgment, customer outcomes, organizational influence, and business impact."
      };
      break;
    case "data_analytics":
      hmSpecialist = {
        role: "HiringManager",
        name: "Marcus Brody",
        title: "VP of Business Intelligence & Data Strategy",
        focus: "Data-driven business decision support, strategic metrics, organizational literacy, and high-impact analytics delivery.",
        rubric: "Evaluate ability to translate data into top-line growth, executive stakeholder influence, and delivery ownership."
      };
      break;
    case "engineering":
    default:
      hmSpecialist = {
        role: "HiringManager",
        name: "Marcus Brody",
        title: "VP of Engineering",
        focus: "Execution velocity, strategic roadmapping, technical debt management, delivery ownership, and business impact.",
        rubric: "Evaluate business impact, pragmatic trade-offs between speed and perfection, and delivery ownership."
      };
      break;
  }

  let firstQuestionText = "";
  let firstQuestionFocus = "";
  let firstInterviewer: "HR" | "Technical" | "HiringManager" = "HR";

  if (transition.isCareerSwitcher) {
    firstQuestionText = `I noticed you bring a strong background in your prior field and are transitioning into ${input.targetRole}. Can you share what inspired this transition and how your core skills will transfer to this role?`;
    firstQuestionFocus = "Transferable skills, career motivation, adaptability";
    firstInterviewer = "HR";
  } else if (seniority === "Entry") {
    firstQuestionText = `Welcome! To start off, can you walk me through your foundational preparation for ${input.targetRole}, and tell me about a project or coursework that best illustrates your problem-solving approach?`;
    firstQuestionFocus = "Foundational skills, learning agility, structured thinking";
    firstInterviewer = "HR";
  } else {
    switch (jobFamily) {
      case "marketing":
        firstQuestionText = `Can you walk me through your background in marketing and describe the most successful, measurable campaign or go-to-market strategy you owned for ${input.targetRole}?`;
        firstQuestionFocus = "Marketing strategy, campaign metrics, customer segmentation";
        firstInterviewer = "Technical";
        break;
      case "sales":
        firstQuestionText = `Can you walk me through your commercial background and describe a complex deal or account where you uncovered high-value pain and closed the business?`;
        firstQuestionFocus = "Discovery methodology, objection handling, commercial impact";
        firstInterviewer = "Technical";
        break;
      case "human_resources":
        firstQuestionText = `Can you walk me through your background and describe how you successfully managed a sensitive employee relations issue or transformed a talent program for ${input.targetRole}?`;
        firstQuestionFocus = "Employee relations, compliance, organizational empathy";
        firstInterviewer = "Technical";
        break;
      case "education":
        firstQuestionText = `Can you walk me through your educational background and share an example of how you designed and delivered an engaging lesson unit that accommodated diverse learner needs?`;
        firstQuestionFocus = "Pedagogy, differentiated instruction, student engagement";
        firstInterviewer = "Technical";
        break;
      case "finance":
        firstQuestionText = `Can you walk me through your financial background and describe a complex financial model, forecast, or business case you developed to inform an executive decision?`;
        firstQuestionFocus = "Financial modeling, variance analysis, executive insight";
        firstInterviewer = "Technical";
        break;
      case "data_analytics":
        firstQuestionText = `Can you walk me through your background and share an example where your data analysis or SQL modeling directly influenced a major business decision?`;
        firstQuestionFocus = "SQL analysis, metric definition, business impact";
        firstInterviewer = "Technical";
        break;
      case "product":
        firstQuestionText = `Can you walk me through your product background and describe how you took a major feature or product from initial user discovery to successful launch?`;
        firstQuestionFocus = "Product strategy, user research, roadmap prioritization";
        firstInterviewer = "Technical";
        break;
      case "engineering":
      default:
        firstQuestionText = `Can you walk me through your background and the most complex architecture you designed for ${input.targetRole}?`;
        firstQuestionFocus = "System architecture, trade-offs, ownership";
        firstInterviewer = "Technical";
        break;
    }
  }

  let recommendedLearningFocus = "";
  switch (jobFamily) {
    case "marketing":
      recommendedLearningFocus = "Practice campaign measurement, CAC/LTV economics, and customer segmentation.";
      break;
    case "sales":
      recommendedLearningFocus = "Practice diagnostic discovery questions, MEDDPICC qualification, and objection handling.";
      break;
    case "human_resources":
      recommendedLearningFocus = "Practice employment policy scenarios, dispute mediation, and structured grievance interviews.";
      break;
    case "education":
      recommendedLearningFocus = "Practice classroom-management scenarios, lesson differentiation, and formative assessment design.";
      break;
    case "finance":
      recommendedLearningFocus = "Practice variance analysis, discounted cash flow modeling, and financial reasoning.";
      break;
    case "data_analytics":
      recommendedLearningFocus = "Practice complex SQL window functions, statistical hypothesis testing, and executive dashboard storytelling.";
      break;
    case "product":
      recommendedLearningFocus = "Practice North Star metric framing, RICE prioritization under technical debt, and customer discovery.";
      break;
    case "engineering":
    default:
      recommendedLearningFocus = "Practice algorithms, debugging, distributed systems trade-offs, and failure recovery.";
      break;
  }

  return {
    jobFamily,
    subFamily: classification.subFamily,
    seniority,
    practicalAssessmentType,
    codingRequired,
    competencies,
    scoringWeights,
    interviewers: {
      hr: hrSpecialist,
      domain: domainSpecialist,
      hiringManager: hmSpecialist
    },
    stages: [
      "Behavioral & Values Alignment (Sarah Jenkins)",
      "Domain Deep Dive & Practical Assessment (David Chen)",
      "Strategic Impact & Leadership Alignment (Marcus Brody)"
    ],
    firstQuestion: {
      id: 1,
      text: firstQuestionText,
      type: firstInterviewer === "HR" ? "behavioral" : "technical",
      expectedFocus: firstQuestionFocus,
      interviewerRole: firstInterviewer
    },
    recommendedDurationMinutes: seniority === "Entry" ? 30 : seniority === "Senior" ? 45 : 60,
    isCareerSwitcher: transition.isCareerSwitcher,
    transferableDomains: transition.transferableDomains,
    recommendedLearningFocus
  };
}
