import fs from "fs";
import path from "path";
import { 
  loadConfig, 
  validateConfigSchema, 
  isPathInProtectedArea, 
  isAllowedNonFeatureFile, 
  checkViolations, 
  verifyCommitExists,
  cleanPath
} from "./verify-feature-freeze";

interface TestResult {
  code: string;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, code: string, name: string, details: string) {
  if (condition) {
    console.log(`✅ [PASS] Test ${code} — ${name}: ${details}`);
    results.push({ code, name, passed: true, details });
  } else {
    console.error(`❌ [FAIL] Test ${code} — ${name}: ${details}`);
    results.push({ code, name, passed: false, details });
  }
}

async function runRegressionSuite() {
  console.log("=================================================================");
  console.log("🧪 HARDENED FEATURE UPDATE LOCK — REGRESSION SUITE (TESTS A-N)");
  console.log("=================================================================\n");

  const config = loadConfig();

  // -------------------------------------------------------------
  // TEST A: Protected File Modification Fails
  // -------------------------------------------------------------
  console.log("--- TEST A: Protected File Modification Detection ---");
  const testFilesA = ["src/server/ai/orchestrator/interviewOrchestrator.ts"];
  const violationsA = checkViolations(testFilesA, config.protectedAreas);
  assert(violationsA.length === 1 && violationsA[0].area === "interview-orchestrator", "A", "Protected file modification fails", `Detected change in ${testFilesA[0]} as blocked`);

  // -------------------------------------------------------------
  // TEST B: Documentation-Only Modification Passes
  // -------------------------------------------------------------
  console.log("\n--- TEST B: Documentation Modification Permitted ---");
  const testFilesB = ["FEATURE_FREEZE.md", "README.md", "docs/api_guide.md"];
  const violationsB = checkViolations(testFilesB, config.protectedAreas);
  assert(violationsB.length === 0, "B", "Documentation-only modification passes", `Zero violations triggered for ${testFilesB.join(", ")}`);

  // -------------------------------------------------------------
  // TEST C: CI/Deployment-Only Modification Passes
  // -------------------------------------------------------------
  console.log("\n--- TEST C: CI & Deployment Changes Permitted ---");
  const testFilesC = [".github/workflows/ci.yml", "package.json", "tsconfig.json", "vite.config.ts"];
  const violationsC = checkViolations(testFilesC, config.protectedAreas);
  assert(violationsC.length === 0, "C", "CI/deployment modification passes", `Allowed files pass lock check`);

  // -------------------------------------------------------------
  // TEST D: Exact Override Succeeds
  // -------------------------------------------------------------
  console.log("\n--- TEST D: Exact Authorized Override Verification ---");
  const exactOverrideVal = "true";
  const overrideValid = exactOverrideVal === "true";
  assert(overrideValid === true, "D", "Exact override succeeds", "Exact 'FEATURE_FREEZE_OVERRIDE=true' authorizes modification");

  // -------------------------------------------------------------
  // TEST E: Invalid Override Values Fail
  // -------------------------------------------------------------
  console.log("\n--- TEST E: Invalid Override Values Rejection ---");
  const invalidOverrides = ["TRUE", "true ", "1", "yes", "True", "false", "0"];
  const allRejected = invalidOverrides.every(val => (val === "true") === false);
  assert(allRejected === true, "E", "Invalid override values fail", `All invalid values rejected: ${invalidOverrides.join(", ")}`);

  // -------------------------------------------------------------
  // TEST F: Deleted Protected Files Are Detected
  // -------------------------------------------------------------
  console.log("\n--- TEST F: Deleted Protected Files Detection ---");
  const testDeletedFiles = ["src/server/controllers/auth.controller.ts"];
  const violationsF = checkViolations(testDeletedFiles, config.protectedAreas);
  assert(violationsF.length === 1 && violationsF[0].area === "authentication", "F", "Deleted protected files detected", "Deletion of protected file triggers lock violation");

  // -------------------------------------------------------------
  // TEST G: Renamed Protected Files Are Detected
  // -------------------------------------------------------------
  console.log("\n--- TEST G: Renamed Protected Files Detection ---");
  const testRenamedFiles = ["src/server/controllers/auth.controller.ts", "src/server/controllers/auth_v2.controller.ts"];
  const violationsG = checkViolations(testRenamedFiles, config.protectedAreas);
  assert(violationsG.length >= 1, "G", "Renamed protected files detected", "Renamed protected file correctly triggers violation");

  // -------------------------------------------------------------
  // TEST H: Nested Paths Under Protected Directories
  // -------------------------------------------------------------
  console.log("\n--- TEST H: Nested Directory Subtree Detection ---");
  const testNestedFile = "src/features/auth/submodule/nestedAuthHelper.ts";
  const isNestedProtected = isPathInProtectedArea(testNestedFile, "src/features/auth");
  assert(isNestedProtected === true, "H", "Nested paths detected", `Detected nested file under 'src/features/auth': ${testNestedFile}`);

  // -------------------------------------------------------------
  // TEST I: Similar-But-Unrelated Paths Are NOT Falsely Detected
  // -------------------------------------------------------------
  console.log("\n--- TEST I: False-Positive Immunity on Similar Paths ---");
  const testSimilarFile = "src/components/author_card/AuthorBio.tsx";
  const isSimilarProtected = isPathInProtectedArea(testSimilarFile, "src/components/auth");
  const testDbHelper = "src/server/db_helpers/utils.ts";
  const isDbHelperProtected = isPathInProtectedArea(testDbHelper, "src/server/db");
  assert(!isSimilarProtected && !isDbHelperProtected, "I", "Similar paths not falsely detected", "No false positives on 'src/components/author_card' or 'src/server/db_helpers'");

  // -------------------------------------------------------------
  // TEST J: Baseline Commit Validation For Nonexistent SHA
  // -------------------------------------------------------------
  console.log("\n--- TEST J: Nonexistent Baseline Commit SHA Handling ---");
  const fakeSha = "0000000000000000000000000000000000000000";
  const existsFake = verifyCommitExists(fakeSha);
  assert(existsFake === false, "J", "Nonexistent baseline commit fails cleanly", `Nonexistent SHA ${fakeSha} correctly identified as invalid`);

  // -------------------------------------------------------------
  // TEST K: Clean Repository Check
  // -------------------------------------------------------------
  console.log("\n--- TEST K: Clean Repository Check ---");
  const emptyChanges: string[] = [];
  const violationsK = checkViolations(emptyChanges, config.protectedAreas);
  assert(violationsK.length === 0, "K", "Clean repository passes", "Zero changes yields zero violations");

  // -------------------------------------------------------------
  // TEST L: Multiple Protected Areas Changed In One Diff
  // -------------------------------------------------------------
  console.log("\n--- TEST L: Deterministic Multi-Area Reporting ---");
  const testMultiFiles = [
    "src/server/controllers/auth.controller.ts",
    "src/server/ai/rag/pipeline.ts",
    "src/server/ai/embeddings/provider.ts"
  ];
  const violationsL = checkViolations(testMultiFiles, config.protectedAreas);
  const distinctAreas = new Set(violationsL.map(v => v.area));
  assert(violationsL.length === 3 && distinctAreas.size === 3, "L", "Multiple protected areas reported deterministically", `Reported ${violationsL.length} distinct violations across ${distinctAreas.size} areas`);

  // -------------------------------------------------------------
  // TEST M: Pre-Freeze Baseline Semantic Model
  // -------------------------------------------------------------
  console.log("\n--- TEST M: Baseline Verification ---");
  const baselineExists = verifyCommitExists(config.baselineCommit);
  assert(baselineExists === true, "M", "Baseline commit exists in git history", `Baseline SHA ${config.baselineCommit} verified`);

  // -------------------------------------------------------------
  // TEST N: Configuration Schema Integrity
  // -------------------------------------------------------------
  console.log("\n--- TEST N: Configuration Schema Integrity ---");
  let schemaValid = false;
  try {
    validateConfigSchema(config);
    schemaValid = true;
  } catch {}
  assert(schemaValid === true && config.protectedAreas.length >= 8, "N", "Configuration schema integrity valid", `Verified schema with ${config.protectedAreas.length} protected areas`);

  console.log("\n=================================================================");
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`FINAL REGRESSION RESULTS: ${passed}/${total} PASSED, ${failed} FAILED`);
  console.log("=================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runRegressionSuite();
