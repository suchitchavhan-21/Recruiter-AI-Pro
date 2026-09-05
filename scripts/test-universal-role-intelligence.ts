/**
 * Test Suite: Universal Role Intelligence & Profession-Agnostic Interview Engine
 * 
 * Verifies:
 * 1. Role Family Classification across 10 diverse professions
 * 2. Dynamic Competency Blueprint generation with strictly normalized weights (sum === 1.0)
 * 3. Zero coding / zero system design weights for non-technical roles
 * 4. Practical Assessment Assignment (CODING, DATA_ANALYSIS, CASE_STUDY, ROLE_PLAY, SCENARIO, DOMAIN_EXERCISE)
 * 5. Dynamic Interviewer Personas (Sarah, David, Marcus) tailored to domain depth
 * 6. Seniority scaling (Entry, Mid, Senior, Expert) with zero penalty for junior leadership
 * 7. Career Switcher Transferable Evidence recognition (DIRECT vs TRANSFERABLE vs INSUFFICIENT)
 * 8. End-to-end integration with InterviewOrchestrator and GeminiService
 * 9. Domain-specific post-interview scoring report & recommendations
 */

import { 
  classifyRole, 
  generateInterviewBlueprint, 
  JobFamily, 
  PracticalAssessmentType,
  RoleClassificationInput 
} from "../src/server/ai/orchestrator/roleIntelligence";
import { 
  COMPETENCY_DEFINITIONS, 
  normalizeCompetencyScore, 
  CompetencyScore 
} from "../src/server/ai/orchestrator/competencyModel";
import { 
  calculateWeightedInterviewScore, 
  generateScoringReport 
} from "../src/server/ai/orchestrator/scoringModel";
import { 
  InterviewOrchestrator 
} from "../src/server/ai/orchestrator/interviewOrchestrator";
import { 
  deriveCompetencyBreakdown, 
  analyzeJobDescription,
  evaluateInterviewSession
} from "../src/server/services/gemini.service";
import { 
  initPostgresSchema, 
  closePostgresPool 
} from "../src/server/db/postgres";
import { 
  insertUser, 
  generateUUID 
} from "../src/server/db/repository";

async function runUniversalRoleIntelligenceTests() {
  console.log("================================================================================");
  console.log("RUNNING UNIVERSAL ROLE INTELLIGENCE & PROFESSION-AGNOSTIC INTERVIEW TEST SUITE");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, description: string) {
    if (condition) {
      console.log(`  [PASS] ${description}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${description}`);
      failed++;
    }
  }

  // ============================================================================
  // Test Matrix: 10 Roles
  // ============================================================================

  // 1. Software Engineer
  console.log("Scenario 1: Software Engineer (Technical / Engineering)");
  const sweInput: RoleClassificationInput = {
    targetRole: "Senior Backend Engineer",
    jobDescription: "Build distributed microservices with Go, Kafka, PostgreSQL, and Kubernetes.",
    candidateResume: "5 years building cloud backend services in Go and AWS.",
    seniority: "Senior"
  };
  const sweBlueprint = generateInterviewBlueprint(sweInput);
  assert(sweBlueprint.jobFamily === "engineering", `SWE classified as engineering (got: ${sweBlueprint.jobFamily})`);
  assert(sweBlueprint.codingRequired === true, "SWE requires coding assessment");
  assert(sweBlueprint.practicalAssessmentType === "CODING", `SWE practical assessment is CODING (got: ${sweBlueprint.practicalAssessmentType})`);
  const sweWeightSum = sweBlueprint.competencies.reduce((s, c) => s + c.weight, 0);
  assert(Math.abs(sweWeightSum - 1.0) < 0.0001, `SWE weights sum to exactly 1.0 (got: ${sweWeightSum})`);
  const sweCodingComp = sweBlueprint.competencies.find(c => c.id === "coding" || c.name.toLowerCase().includes("coding"));
  assert(!!sweCodingComp && sweCodingComp.weight > 0, "SWE includes positive coding competency weight");
  assert(sweBlueprint.interviewers.domain.title.toLowerCase().includes("architect") || sweBlueprint.interviewers.domain.title.toLowerCase().includes("engineer"), `David is technical architect for SWE: ${sweBlueprint.interviewers.domain.title}`);

  // 2. Data Analyst
  console.log("\nScenario 2: Data Analyst (Data Analytics)");
  const daInput: RoleClassificationInput = {
    targetRole: "Senior Data Analyst",
    jobDescription: "Extract insights using SQL, Tableau, statistical analysis, and build executive dashboards.",
    candidateResume: "3 years querying data warehouses with SQL and designing PowerBI dashboards.",
    seniority: "Senior"
  };
  const daBlueprint = generateInterviewBlueprint(daInput);
  assert(daBlueprint.jobFamily === "data_analytics", `Data Analyst classified as data_analytics (got: ${daBlueprint.jobFamily})`);
  assert(daBlueprint.practicalAssessmentType === "DATA_ANALYSIS", `Data Analyst practical assessment is DATA_ANALYSIS (got: ${daBlueprint.practicalAssessmentType})`);
  const daWeightSum = daBlueprint.competencies.reduce((s, c) => s + c.weight, 0);
  assert(Math.abs(daWeightSum - 1.0) < 0.0001, `Data Analyst weights sum to 1.0 (got: ${daWeightSum})`);
  assert(daBlueprint.stages.some(s => s.toLowerCase().includes("data") || s.toLowerCase().includes("practical")), "Data Analyst has practical data analysis stage");

  // 3. Marketing Manager
  console.log("\nScenario 3: Marketing Manager (Marketing & Growth)");
  const mktInput: RoleClassificationInput = {
    targetRole: "Growth Marketing Manager",
    jobDescription: "Lead performance marketing, CAC/LTV optimization, paid acquisition funnels, and brand campaigns.",
    candidateResume: "4 years managing paid search, Meta ads, and conversion rate optimization in B2B SaaS.",
    seniority: "Senior"
  };
  const mktBlueprint = generateInterviewBlueprint(mktInput);
  assert(mktBlueprint.jobFamily === "marketing", `Marketing Manager classified as marketing (got: ${mktBlueprint.jobFamily})`);
  assert(mktBlueprint.codingRequired === false, "Marketing Manager does NOT require coding");
  assert(mktBlueprint.practicalAssessmentType === "CASE_STUDY", `Marketing practical assessment is CASE_STUDY (got: ${mktBlueprint.practicalAssessmentType})`);
  const mktWeightSum = mktBlueprint.competencies.reduce((s, c) => s + c.weight, 0);
  assert(Math.abs(mktWeightSum - 1.0) < 0.0001, `Marketing weights sum to 1.0 (got: ${mktWeightSum})`);
  assert(!mktBlueprint.competencies.some(c => c.id === "coding" && c.weight > 0), "Marketing has 0% coding weight");
  assert(!mktBlueprint.competencies.some(c => c.id === "system_design" && c.weight > 0), "Marketing has 0% software system design weight");
  assert(mktBlueprint.interviewers.domain.title.toLowerCase().includes("marketing") || mktBlueprint.interviewers.domain.title.toLowerCase().includes("growth"), `David is marketing specialist: ${mktBlueprint.interviewers.domain.title}`);
  assert(mktBlueprint.interviewers.hiringManager.title.toLowerCase().includes("marketing") || mktBlueprint.interviewers.hiringManager.title.toLowerCase().includes("cmo"), `Marcus is marketing executive: ${mktBlueprint.interviewers.hiringManager.title}`);

  // 4. Sales Executive
  console.log("\nScenario 4: Sales Executive (Sales & Commercial)");
  const salesInput: RoleClassificationInput = {
    targetRole: "Enterprise Account Executive",
    jobDescription: "Close $100k+ ARR enterprise deals, conduct MEDDIC discovery, and handle executive objections.",
    candidateResume: "5 years enterprise SaaS sales hitting 120% quota.",
    seniority: "Senior"
  };
  const salesBlueprint = generateInterviewBlueprint(salesInput);
  assert(salesBlueprint.jobFamily === "sales", `Sales Executive classified as sales (got: ${salesBlueprint.jobFamily})`);
  assert(salesBlueprint.codingRequired === false, "Sales Executive does NOT require coding");
  assert(salesBlueprint.practicalAssessmentType === "ROLE_PLAY", `Sales practical assessment is ROLE_PLAY (got: ${salesBlueprint.practicalAssessmentType})`);
  const salesWeightSum = salesBlueprint.competencies.reduce((s, c) => s + c.weight, 0);
  assert(Math.abs(salesWeightSum - 1.0) < 0.0001, `Sales weights sum to 1.0 (got: ${salesWeightSum})`);
  assert(salesBlueprint.competencies.some(c => c.id.includes("objection") || c.name.toLowerCase().includes("objection") || c.name.toLowerCase().includes("deal")), "Sales includes objection handling / deal execution competency");

  // 5. HR Executive
  console.log("\nScenario 5: Human Resources Executive (HR & People Operations)");
  const hrInput: RoleClassificationInput = {
    targetRole: "People Operations & HRBP Lead",
    jobDescription: "Manage employee relations, compensation banding, compliance, and organizational talent strategy.",
    candidateResume: "6 years HR business partnering and conflict resolution in fast-growing tech companies.",
    seniority: "Senior"
  };
  const hrBlueprint = generateInterviewBlueprint(hrInput);
  assert(hrBlueprint.jobFamily === "human_resources", `HR classified as human_resources (got: ${hrBlueprint.jobFamily})`);
  assert(hrBlueprint.codingRequired === false, "HR does NOT require coding");
  assert(hrBlueprint.practicalAssessmentType === "SCENARIO", `HR practical assessment is SCENARIO (got: ${hrBlueprint.practicalAssessmentType})`);
  const hrWeightSum = hrBlueprint.competencies.reduce((s, c) => s + c.weight, 0);
  assert(Math.abs(hrWeightSum - 1.0) < 0.0001, `HR weights sum to 1.0 (got: ${hrWeightSum})`);
  assert(hrBlueprint.competencies.some(c => c.id.includes("relations") || c.name.toLowerCase().includes("people") || c.name.toLowerCase().includes("relations")), "HR includes employee relations / talent competency");

  // 6. Product Manager
  console.log("\nScenario 6: Product Manager (Product Strategy & Execution)");
  const pmInput: RoleClassificationInput = {
    targetRole: "Senior Technical Product Manager",
    jobDescription: "Define product roadmap, prioritize features using RICE, synthesize user research, and drive GTM.",
    candidateResume: "5 years building B2B SaaS analytics products from 0 to 1.",
    seniority: "Senior"
  };
  const pmBlueprint = generateInterviewBlueprint(pmInput);
  assert(pmBlueprint.jobFamily === "product", `Product Manager classified as product (got: ${pmBlueprint.jobFamily})`);
  assert(pmBlueprint.codingRequired === false, "Product Manager does NOT require coding execution");
  assert(pmBlueprint.practicalAssessmentType === "CASE_STUDY", `PM practical assessment is CASE_STUDY (got: ${pmBlueprint.practicalAssessmentType})`);
  const pmWeightSum = pmBlueprint.competencies.reduce((s, c) => s + c.weight, 0);
  assert(Math.abs(pmWeightSum - 1.0) < 0.0001, `PM weights sum to 1.0 (got: ${pmWeightSum})`);
  assert(pmBlueprint.competencies.some(c => c.name.toLowerCase().includes("product") || c.name.toLowerCase().includes("prioritization")), "PM includes product strategy / prioritization competency");

  // 7. Teacher / Educator
  console.log("\nScenario 7: Teacher / Educator (Education & Instruction)");
  const eduInput: RoleClassificationInput = {
    targetRole: "High School STEM Teacher",
    jobDescription: "Deliver engaging math and science curriculum, differentiate instruction for diverse learners, and maintain classroom culture.",
    candidateResume: "3 years secondary school teaching and curriculum development.",
    seniority: "Mid"
  };
  const eduBlueprint = generateInterviewBlueprint(eduInput);
  assert(eduBlueprint.jobFamily === "education", `Teacher classified as education (got: ${eduBlueprint.jobFamily})`);
  assert(eduBlueprint.codingRequired === false, "Teacher does NOT require coding");
  assert(eduBlueprint.practicalAssessmentType === "DOMAIN_EXERCISE", `Teacher practical assessment is DOMAIN_EXERCISE (got: ${eduBlueprint.practicalAssessmentType})`);
  const eduWeightSum = eduBlueprint.competencies.reduce((s, c) => s + c.weight, 0);
  assert(Math.abs(eduWeightSum - 1.0) < 0.0001, `Teacher weights sum to 1.0 (got: ${eduWeightSum})`);
  assert(eduBlueprint.competencies.some(c => c.name.toLowerCase().includes("pedagogy") || c.name.toLowerCase().includes("classroom") || c.name.toLowerCase().includes("learning")), "Teacher includes pedagogy / classroom management competency");
  assert(eduBlueprint.interviewers.domain.title.toLowerCase().includes("curriculum") || eduBlueprint.interviewers.domain.title.toLowerCase().includes("instruction"), `David is curriculum dean: ${eduBlueprint.interviewers.domain.title}`);

  // 8. Finance Analyst
  console.log("\nScenario 8: Finance Analyst (Finance & Accounting)");
  const finInput: RoleClassificationInput = {
    targetRole: "Senior Financial Analyst",
    jobDescription: "Build DCF models, forecast quarterly revenues, analyze variances, and assist in capital allocation.",
    candidateResume: "4 years corporate FP&A modeling and financial statement forecasting.",
    seniority: "Senior"
  };
  const finBlueprint = generateInterviewBlueprint(finInput);
  assert(finBlueprint.jobFamily === "finance", `Finance Analyst classified as finance (got: ${finBlueprint.jobFamily})`);
  assert(finBlueprint.practicalAssessmentType === "DATA_ANALYSIS", `Finance practical assessment is DATA_ANALYSIS (got: ${finBlueprint.practicalAssessmentType})`);
  const finWeightSum = finBlueprint.competencies.reduce((s, c) => s + c.weight, 0);
  assert(Math.abs(finWeightSum - 1.0) < 0.0001, `Finance weights sum to 1.0 (got: ${finWeightSum})`);
  assert(finBlueprint.competencies.some(c => c.name.toLowerCase().includes("financial") || c.name.toLowerCase().includes("modeling") || c.name.toLowerCase().includes("valuation")), "Finance includes financial modeling competency");

  // 9. Entry-Level Candidate (Seniority Scaling)
  console.log("\nScenario 9: Entry-Level Candidate (Junior / Associate)");
  const entryInput: RoleClassificationInput = {
    targetRole: "Junior Marketing Associate",
    jobDescription: "Support social media campaigns, draft copy, and assist with event marketing.",
    candidateResume: "Recent college graduate in Communications with 1 summer internship at an agency.",
    seniority: "Entry"
  };
  const entryBlueprint = generateInterviewBlueprint(entryInput);
  assert(entryBlueprint.seniority === "Entry", `Blueprint recognizes Entry seniority: ${entryBlueprint.seniority}`);
  assert(entryBlueprint.scoringWeights["leadership"] === undefined || entryBlueprint.scoringWeights["leadership"] <= 0.05, "Entry level has zero or minimal leadership penalty weight");
  assert(entryBlueprint.firstQuestion !== undefined, "Entry level has customized first question");
  assert(entryBlueprint.firstQuestion.text.length > 10, `Entry question is defined: "${entryBlueprint.firstQuestion.text}"`);

  // 10. Career Switcher (Transferable Evidence Recognition)
  console.log("\nScenario 10: Career Switcher (Hospitality -> Customer Success / Sales)");
  const switcherInput: RoleClassificationInput = {
    targetRole: "Customer Success Manager",
    jobDescription: "Manage client relationships, resolve client escalations, ensure product adoption, and drive renewals.",
    candidateResume: "5 years Hotel Operations and Guest Services Manager resolving high-stakes customer escalations.",
    seniority: "Mid"
  };
  const switcherBlueprint = generateInterviewBlueprint(switcherInput);
  assert(switcherBlueprint.isCareerSwitcher === true, "Career switcher successfully detected from resume background vs target role");
  assert(switcherBlueprint.transferableDomains?.length! > 0, `Detected transferable domains: ${switcherBlueprint.transferableDomains?.join(", ")}`);

  // Verify evidence classification for career switcher
  console.log("\nTest Group 2: Career Switcher Transferable Evidence Classification");
  const switcherTranscript = [
    {
      questionId: 1,
      questionText: "How do you handle difficult customer escalations and prevent churn?",
      type: "problem_solving",
      answerText: "As hotel manager, when VIP guests faced overbooked suites, I immediately listened, de-escalated tension, arranged alternative luxury accommodations, and provided complimentary experiences, turning 90% of disgruntled guests into repeat visitors."
    }
  ];

  const switcherDerivation = deriveCompetencyBreakdown(switcherTranscript, 82, switcherBlueprint);
  const commComp = switcherDerivation.competencyScores["communication"] || switcherDerivation.competencyScores["problem_solving"];
  assert(commComp.evidenceClassification === "TRANSFERABLE_EVIDENCE" || commComp.score >= 70, `Career switcher received transferable evidence credit: ${commComp.evidenceClassification} (score: ${commComp.score})`);
  assert(switcherDerivation.scoringReport.overallScore > 0, `Career switcher computed valid overall score: ${switcherDerivation.scoringReport.overallScore}`);

  // ============================================================================
  // Test Group 3: Domain-Specific Post-Interview Scoring Report
  // ============================================================================
  console.log("\nTest Group 3: Domain-Specific Post-Interview Scoring Report");
  const mktCustomScores: Record<string, CompetencyScore> = {
    marketing_strategy: normalizeCompetencyScore("marketing_strategy", 85, "Demonstrated clear CAC/LTV payback model.", ["CAC/LTV", "Funnel"]),
    campaign_analytics: normalizeCompetencyScore("campaign_analytics", 82, "Explained A/B testing and attribution models.", ["Attribution", "A/B testing"]),
    communication: normalizeCompetencyScore("communication", 90, "Articulate presentation of quarterly campaign plan.", ["Clarity"]),
    problem_solving: normalizeCompetencyScore("problem_solving", 82, "Resolved underperforming Google Search campaigns.", ["Optimization"]),
    leadership: normalizeCompetencyScore("leadership", 80, "Aligned agency partners with brand priorities.", ["Agency alignment"]),
    behavioral: normalizeCompetencyScore("behavioral", 85, "Took personal agency during a product launch delay.", ["Ownership"]),
    role_fit: normalizeCompetencyScore("role_fit", 88, "Deep experience in B2B SaaS growth.", ["B2B SaaS"])
  };

  const mktReport = generateScoringReport(
    mktCustomScores, 
    mktBlueprint.scoringWeights, 
    {
      jobFamily: mktBlueprint.jobFamily,
      practicalAssessmentType: mktBlueprint.practicalAssessmentType,
      codingRequired: false,
      learningFocus: "Growth Marketing & CAC Optimization"
    }
  );

  assert(mktReport.overallScore >= 80, `Marketing overall score computed correctly: ${mktReport.overallScore}`);
  assert(mktReport.actionableRecommendations.some(r => r.toLowerCase().includes("marketing") || r.toLowerCase().includes("campaign") || r.toLowerCase().includes("cac") || r.toLowerCase().includes("growth")), `Recommendations are domain-specific for marketing (e.g. CAC/campaign): "${mktReport.actionableRecommendations.join(" | ")}"`);
  assert(!mktReport.actionableRecommendations.some(r => r.toLowerCase().includes("distributed systems") || r.toLowerCase().includes("circuit breaker")), "No irrelevant software architecture recommendations in marketing report");

  // ============================================================================
  // Test Group 4: Interview Orchestrator End-to-End Blueprint Lifecycle
  // ============================================================================
  console.log("\nTest Group 4: Interview Orchestrator End-to-End Blueprint Lifecycle");
  await initPostgresSchema();

  const testUserId = generateUUID();
  await insertUser({
    id: testUserId,
    fullName: "Sales Candidate",
    email: `sales_candidate_${Date.now()}@example.com`,
    passwordHash: "hash_sales",
    role: "candidate",
    provider: "local",
    emailVerified: true,
    accountStatus: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Start session for a Sales Executive role
  const orchestratorSession = await InterviewOrchestrator.startSession({
    userId: testUserId,
    targetRole: "Enterprise Account Executive",
    company: "Salesforce Partner",
    difficulty: "Senior",
    interviewerCount: 3
  });

  assert(orchestratorSession.blueprint !== undefined, "Orchestrator session generated and retained interview blueprint");
  assert(orchestratorSession.blueprint?.jobFamily === "sales", `Orchestrator session classified as sales (got: ${orchestratorSession.blueprint?.jobFamily})`);
  assert(orchestratorSession.history.length === 1, "Session initialized with turn 1");
  const turn1Interviewer = orchestratorSession.history[0].interviewerName;
  assert(turn1Interviewer === "Sarah Jenkins" || turn1Interviewer === "David Chen", `Turn 1 assigned appropriate persona: ${turn1Interviewer}`);

  // Progress turn 1
  const turn2Result = await InterviewOrchestrator.submitAnswerAndProgress({
    sessionId: orchestratorSession.sessionId,
    userId: testUserId,
    candidateAnswer: "I use MEDDIC to identify economic buyers and uncover quantifiable business metrics before presenting solutions."
  });

  assert(!turn2Result.isCompleted, "Session is not prematurely completed after turn 1");
  assert(turn2Result.nextTurn !== undefined, "Next turn generated");
  assert(turn2Result.state.history.length === 2, "Session history advanced to 2 turns");

  // Evaluate interview session using the blueprint
  const evalResult = await evaluateInterviewSession({
    sessionId: orchestratorSession.sessionId,
    targetRole: "Enterprise Account Executive",
    company: "Salesforce Partner",
    difficulty: "Senior",
    transcript: turn2Result.state.history.map(h => ({
      turnIndex: h.turnIndex,
      interviewerRole: h.interviewerRole,
      interviewerName: h.interviewerName,
      questionText: h.questionText,
      candidateAnswer: h.candidateAnswer || "N/A",
      expectedCompetency: h.expectedCompetency
    })),
    blueprint: turn2Result.state.blueprint
  });

  assert(evalResult.competencyScores !== undefined, "Evaluation generated competency breakdown");
  assert(evalResult.panelFeedback.david !== undefined, "David Chen domain feedback generated");
  assert(evalResult.panelFeedback.marcus !== undefined, "Marcus Brody executive feedback generated");
  assert(!evalResult.panelFeedback.david.text.toLowerCase().includes("compiler") && !evalResult.panelFeedback.david.text.toLowerCase().includes("database sharding"), "David's feedback for sales does not hallucinate software compiler/sharding feedback");

  // ============================================================================
  // Test Group 5: Gemini Service analyzeJobDescription Blueprint Integration
  // ============================================================================
  console.log("\nTest Group 5: Gemini Service analyzeJobDescription Blueprint Integration");
  const jdAnalysis = await analyzeJobDescription(
    "We are seeking a Head of People Operations to oversee HR strategy, culture, compliance, and employee onboarding.",
    "People Operations Director",
    "Acme Health"
  );
  assert(jdAnalysis.jobFamily === "human_resources", `JD Analysis accurately classifies HR family: ${jdAnalysis.jobFamily}`);
  assert(jdAnalysis.practicalAssessmentType === "SCENARIO", `JD Analysis selects SCENARIO practical assessment: ${jdAnalysis.practicalAssessmentType}`);
  assert(jdAnalysis.codingRequired === false, "JD Analysis recognizes coding is not required for HR Director");
  assert(jdAnalysis.interviewBlueprint !== undefined, "JD Analysis returns complete InterviewBlueprint");
  assert(jdAnalysis.interviewBlueprint?.interviewers.domain.title.toLowerCase().includes("people"), `David titled correctly in JD analysis: ${jdAnalysis.interviewBlueprint?.interviewers.domain.title}`);

  console.log("\n================================================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");

  await closePostgresPool();

  if (failed > 0) {
    process.exit(1);
  }
}

runUniversalRoleIntelligenceTests().catch(async (err) => {
  console.error("Fatal error in universal role intelligence test:", err);
  await closePostgresPool();
  process.exit(1);
});
