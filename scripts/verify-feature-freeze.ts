import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ProtectedArea {
  name: string;
  paths: string[];
  description: string;
}

export interface FeatureFreezeConfig {
  enabled: boolean;
  baselineCommit: string;
  frozenAt: string;
  version: number;
  schemaVersion: string;
  repository: string;
  strategy: {
    coreStack: string[];
    explicitlyExcluded: string[];
  };
  protectedAreas: ProtectedArea[];
  allowedChangeTypes: string[];
  overrideMechanism: {
    environmentVariable: string;
    requiredValue: string;
    description: string;
  };
}

const CONFIG_PATH = path.join(process.cwd(), "config", "feature-freeze.json");

export function loadConfig(): FeatureFreezeConfig {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error("❌ [FEATURE UPDATE LOCK ERROR]: Canonical lock definition 'config/feature-freeze.json' not found.");
    process.exit(1);
  }

  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    const config = JSON.parse(raw) as FeatureFreezeConfig;
    validateConfigSchema(config);
    return config;
  } catch (err: any) {
    console.error("❌ [FEATURE UPDATE LOCK ERROR]: Invalid 'config/feature-freeze.json':", err.message);
    process.exit(1);
  }
}

export function validateConfigSchema(config: FeatureFreezeConfig): void {
  if (typeof config.enabled !== "boolean") {
    throw new Error("Field 'enabled' must be a boolean.");
  }
  if (!config.baselineCommit || typeof config.baselineCommit !== "string" || !/^[a-f0-9]{40}$/i.test(config.baselineCommit)) {
    throw new Error(`Field 'baselineCommit' must be a 40-character hexadecimal SHA. Received: ${config.baselineCommit}`);
  }
  if (!Array.isArray(config.protectedAreas) || config.protectedAreas.length === 0) {
    throw new Error("Field 'protectedAreas' must be a non-empty array.");
  }
  for (const area of config.protectedAreas) {
    if (!area.name || !Array.isArray(area.paths) || area.paths.length === 0) {
      throw new Error(`Protected area '${area.name || "unknown"}' must define a non-empty 'paths' array.`);
    }
  }
}

export function cleanPath(rawPath: string): string {
  return path.normalize(rawPath).replace(/\\/g, "/").replace(/^\.\//, "").toLowerCase().trim();
}

export function isPathInProtectedArea(filePath: string, protectedPath: string): boolean {
  const normFile = cleanPath(filePath);
  const normTarget = cleanPath(protectedPath);

  // Exact file match
  if (normFile === normTarget) {
    return true;
  }

  // Directory prefix match
  const targetPrefix = normTarget.endsWith("/") ? normTarget : normTarget + "/";
  if (normFile.startsWith(targetPrefix)) {
    return true;
  }

  return false;
}

export function isAllowedNonFeatureFile(filePath: string): boolean {
  const norm = cleanPath(filePath);
  const allowedPrefixes = [
    ".github/",
    "scripts/",
    "tests/",
    "config/feature-freeze.json",
    "feature_freeze.md",
    "readme.md",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "vite.config.ts",
    ".gitignore",
    ".env.example"
  ];

  return allowedPrefixes.some(prefix => norm === cleanPath(prefix) || norm.startsWith(cleanPath(prefix) + "/") || (prefix.endsWith("/") && norm.startsWith(cleanPath(prefix))));
}

export function verifyCommitExists(commitSha: string): boolean {
  if (!commitSha || typeof commitSha !== "string" || !/^[a-f0-9]{40}$/i.test(commitSha)) {
    return false;
  }
  try {
    const objType = execSync(`git cat-file -t ${commitSha}`, { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] }).trim();
    return objType === "commit";
  } catch {
    return false;
  }
}

export function getChangedFilesAgainstBaseline(baselineCommit: string): string[] {
  const changedFiles = new Set<string>();

  // 1. Check all committed & uncommitted changes against baselineCommit
  try {
    const diffOutput = execSync(`git diff --name-only ${baselineCommit}`, { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] }).trim();
    if (diffOutput) {
      diffOutput.split(/\r?\n/).forEach(file => {
        const trimmed = file.trim();
        if (trimmed) changedFiles.add(trimmed);
      });
    }
  } catch (err: any) {
    console.warn(`⚠️ [FEATURE UPDATE LOCK]: Could not diff directly against ${baselineCommit}:`, err.message);
  }

  // 2. Check untracked and renamed files via git status
  try {
    const statusOutput = execSync("git status --porcelain", { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] }).trim();
    if (statusOutput) {
      statusOutput.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // Handle rename: R  old.ts -> new.ts
        if (trimmed.includes("->")) {
          const parts = trimmed.split("->");
          const oldFile = parts[0].slice(3).trim();
          const newFile = parts[1].trim();
          if (oldFile) changedFiles.add(oldFile);
          if (newFile) changedFiles.add(newFile);
        } else {
          // Slice status prefix (2 chars + space)
          const file = trimmed.slice(2).trim();
          if (file) changedFiles.add(file);
        }
      });
    }
  } catch (err: any) {
    console.warn("⚠️ [FEATURE UPDATE LOCK]: Warning checking git status:", err.message);
  }

  return Array.from(changedFiles);
}

export function checkViolations(
  changedFiles: string[],
  protectedAreas: ProtectedArea[]
): Array<{ file: string; area: string; reason: string }> {
  const violations: Array<{ file: string; area: string; reason: string }> = [];

  for (const file of changedFiles) {
    if (isAllowedNonFeatureFile(file)) {
      continue;
    }

    for (const area of protectedAreas) {
      const isMatch = area.paths.some(p => isPathInProtectedArea(file, p));
      if (isMatch) {
        violations.push({
          file,
          area: area.name,
          reason: `Protected area '${area.name}' modified in file '${file}'. Feature changes require explicit FEATURE_FREEZE_OVERRIDE=true.`
        });
      }
    }
  }

  return violations;
}

export function runVerification(): { passed: boolean; violations: Array<{ file: string; area: string; reason: string }> } {
  const config = loadConfig();

  console.log("=================================================================");
  console.log("🔒 RECRUITER AI PRO — FEATURE UPDATE LOCK VERIFICATION");
  console.log(`Baseline Commit: ${config.baselineCommit}`);
  console.log(`Lock Version: ${config.version} | Frozen At: ${config.frozenAt}`);
  console.log(`Lock Status: ${config.enabled ? "ENABLED" : "DISABLED"}`);
  console.log("=================================================================\n");

  // Validate baseline commit exists in Git repository
  if (!verifyCommitExists(config.baselineCommit)) {
    console.error(`❌ [FEATURE UPDATE LOCK FATAL]: Baseline commit '${config.baselineCommit}' was not found in git history.`);
    console.error("The frozen baseline must be a valid, existing commit in this repository.\n");
    return {
      passed: false,
      violations: [{
        file: "config/feature-freeze.json",
        area: "baseline-integrity",
        reason: `Baseline commit ${config.baselineCommit} does not exist in git history.`
      }]
    };
  }

  // Check explicit authorized override: strict exact match only
  const overrideVal = process.env[config.overrideMechanism.environmentVariable];
  if (overrideVal === "true") {
    console.log("=================================================================");
    console.log("⚠️ [FEATURE UPDATE LOCK OVERRIDE ACTIVE]");
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Environment Variable: ${config.overrideMechanism.environmentVariable}=${overrideVal}`);
    console.log(`Process ID: ${process.pid}`);
    console.log("AUDIT NOTICE: Protected feature lock has been explicitly overridden.");
    console.log("=================================================================\n");
    return { passed: true, violations: [] };
  }

  if (overrideVal !== undefined) {
    console.warn(`⚠️ [FEATURE UPDATE LOCK]: Invalid override value '${overrideVal}'. Only exact value 'true' is accepted.\n`);
  }

  if (!config.enabled) {
    console.log("⚠️ [FEATURE UPDATE LOCK]: Feature lock is disabled in configuration.\n");
    return { passed: true, violations: [] };
  }

  const changedFiles = getChangedFilesAgainstBaseline(config.baselineCommit);
  const violations = checkViolations(changedFiles, config.protectedAreas);

  if (violations.length > 0) {
    console.error("❌ [FEATURE UPDATE LOCK VIOLATION DETECTED]");
    console.error("Unauthorized modifications found in protected feature areas:\n");

    violations.forEach(v => {
      console.error(`  • File: ${v.file}`);
      console.error(`    Protected Area: ${v.area}`);
      console.error(`    Violation: ${v.reason}`);
      console.error(`    Status: BLOCKED\n`);
    });

    console.error("-----------------------------------------------------------------");
    console.error("To authorize an intentional feature modification:");
    console.error(`1. Run with explicit override: ${config.overrideMechanism.environmentVariable}=true`);
    console.error("2. Update baseline commit in 'config/feature-freeze.json' after approval.\n");

    return { passed: false, violations };
  }

  console.log("✅ [FEATURE UPDATE LOCK]: Verification passed. Zero unauthorized feature modifications detected.\n");
  return { passed: true, violations: [] };
}

// Standalone entrypoint (ESM-compatible)
async function main(): Promise<void> {
  const result = runVerification();
  if (!result.passed) {
    process.exit(1);
  }
}

const isDirectExecution = 
  Boolean(process.argv[1]) && 
  (path.resolve(process.argv[1]) === path.resolve(__filename) ||
   process.argv[1].endsWith("verify-feature-freeze.ts") ||
   process.argv[1].endsWith("verify-feature-freeze.js"));

if (isDirectExecution) {
  main().catch((err) => {
    console.error("❌ [FATAL UNCAUGHT ERROR]:", err);
    process.exit(1);
  });
}
