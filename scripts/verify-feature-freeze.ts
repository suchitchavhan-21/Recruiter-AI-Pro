import fs from "fs";
import path from "path";
import { execSync } from "child_process";

interface ProtectedArea {
  name: string;
  paths: string[];
  description: string;
}

interface FeatureFreezeConfig {
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

function loadConfig(): FeatureFreezeConfig {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error("❌ [FEATURE UPDATE LOCK ERROR]: Canonical lock definition 'config/feature-freeze.json' not found.");
    process.exit(1);
  }

  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    return JSON.parse(raw) as FeatureFreezeConfig;
  } catch (err: any) {
    console.error("❌ [FEATURE UPDATE LOCK ERROR]: Failed to parse 'config/feature-freeze.json':", err.message);
    process.exit(1);
  }
}

function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").toLowerCase();
}

function getChangedFiles(baselineCommit: string): string[] {
  const changedFiles = new Set<string>();

  try {
    // 1. Get working tree status
    const statusOutput = execSync("git status --porcelain", { encoding: "utf-8" }).trim();
    if (statusOutput) {
      statusOutput.split("\n").forEach(line => {
        const file = line.trim().slice(3).trim();
        if (file) changedFiles.add(file);
      });
    }

    // 2. Get diff against baseline commit if baselineCommit exists in git history
    try {
      const diffOutput = execSync(`git diff --name-only ${baselineCommit} HEAD`, { encoding: "utf-8" }).trim();
      if (diffOutput) {
        diffOutput.split("\n").forEach(file => {
          const trimmed = file.trim();
          if (trimmed) changedFiles.add(trimmed);
        });
      }
    } catch {
      // Baseline commit might be current or HEAD
    }
  } catch (err: any) {
    console.warn("⚠️ [FEATURE UPDATE LOCK]: Warning executing git commands:", err.message);
  }

  return Array.from(changedFiles);
}

function isAllowedNonFeatureFile(filePath: string): boolean {
  const normalized = normalizePath(filePath);
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
    "vite.config.ts"
  ];

  return allowedPrefixes.some(prefix => normalized.startsWith(prefix) || normalized === prefix);
}

export function runVerification(): { passed: boolean; violations: Array<{ file: string; area: string; reason: string }> } {
  const config = loadConfig();

  console.log("=================================================================");
  console.log("🔒 RECRUITER AI PRO — FEATURE UPDATE LOCK VERIFICATION");
  console.log(`Baseline Commit: ${config.baselineCommit}`);
  console.log(`Lock Version: ${config.version} | Frozen At: ${config.frozenAt}`);
  console.log(`Lock Status: ${config.enabled ? "ENABLED" : "DISABLED"}`);
  console.log("=================================================================\n");

  // Check explicit authorized override
  const overrideVal = process.env[config.overrideMechanism.environmentVariable]?.trim();
  if (overrideVal === config.overrideMechanism.requiredValue) {
    console.log("⚠️ [FEATURE UPDATE LOCK OVERRIDE ACTIVE]");
    console.log(`Explicit authorized override detected via ${config.overrideMechanism.environmentVariable}=${overrideVal}.`);
    console.log("Feature modification is authorized for this build/run.\n");
    return { passed: true, violations: [] };
  }

  if (!config.enabled) {
    console.log("⚠️ [FEATURE UPDATE LOCK]: Feature lock is disabled in configuration.");
    return { passed: true, violations: [] };
  }

  const changedFiles = getChangedFiles(config.baselineCommit);
  const violations: Array<{ file: string; area: string; reason: string }> = [];

  for (const file of changedFiles) {
    if (isAllowedNonFeatureFile(file)) {
      continue;
    }

    const normalizedFile = normalizePath(file);

    for (const area of config.protectedAreas) {
      const isMatch = area.paths.some(p => {
        const normalizedP = normalizePath(p);
        return normalizedFile === normalizedP || normalizedFile.startsWith(normalizedP + "/");
      });

      if (isMatch) {
        violations.push({
          file,
          area: area.name,
          reason: `Protected functional area '${area.name}' modified without authorized FEATURE_FREEZE_OVERRIDE.`
        });
      }
    }
  }

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
    console.error("To authorize a deliberate feature modification:");
    console.error(`1. Run with explicit override: ${config.overrideMechanism.environmentVariable}=${config.overrideMechanism.requiredValue}`);
    console.error("2. Update baseline commit in 'config/feature-freeze.json' after approval.\n");

    return { passed: false, violations };
  }

  console.log("✅ [FEATURE UPDATE LOCK]: Verification passed. No unauthorized feature modifications detected.\n");
  return { passed: true, violations: [] };
}

// Execute standalone if called directly
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const result = runVerification();
  if (!result.passed) {
    process.exit(1);
  }
}
