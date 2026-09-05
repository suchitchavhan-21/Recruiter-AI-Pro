/**
 * Recruiter AI Pro — Safe Sandboxed Code Execution Engine
 * 
 * ==============================================================================
 * ARCHITECTURAL CLASSIFICATION & SECURITY BOUNDARY NOTICE:
 * ==============================================================================
 * 1. RESTRICTED IN-PROCESS RUNNER (DEVELOPMENT/TESTING MODE):
 *    Utilizes Node.js vm.createContext() with AST/regex pattern restriction and
 *    execution timeouts. Node.js 'vm' is NOT a security boundary for arbitrary
 *    untrusted code and must never be represented as such in production.
 * 
 * 2. ISOLATED SUBPROCESS WORKER (RESTRICTED ENVIRONMENT MODE):
 *    Spawns an isolated ephemeral child process outside the primary Express process:
 *    - Stripped environment: zero application credentials, zero database credentials
 *    - Memory limits enforced via --max-old-space-size=64
 *    - Wall-clock execution timeout and maxBuffer output size limits
 *    - Ephemeral isolated temporary directory wiped immediately after execution
 *    - Process killed / destroyed immediately upon completion
 * 
 * 3. PRODUCTION MULTI-TENANT UNTRUSTED CODE REQUIREMENT:
 *    For arbitrary untrusted multi-tenant execution in production, deployment
 *    infrastructure must utilize containerized sandbox boundaries (such as
 *    gVisor runsc, nsjail, Firecracker microVMs, or hardened serverless workers)
 *    with disabled network egress, unprivileged user namespaces, and seccomp filters.
 * ==============================================================================
 */

import vm from "vm";
import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

export const RUNNER_CLASSIFICATIONS = {
  DEV_TEST: "Restricted In-Process Runner (Development/Testing Mode)",
  SUBPROCESS_RESTRICTED: "Isolated Subprocess Worker (Restricted Environment Mode)",
  PRODUCTION_REQUIREMENT: "Containerized gVisor/nsjail sandbox microVM (Production Untrusted Code Requirement)"
} as const;

export type ExecutionStatus = 
  | "PASSED"
  | "FAILED"
  | "TIMEOUT"
  | "MEMORY_LIMIT"
  | "RESOURCE_LIMIT"
  | "SANDBOX_ERROR"
  | "INVALID_SUBMISSION";

export interface TestCase {
  input: any[];
  expected: any;
  hidden?: boolean;
}

export interface SingleTestResult {
  index: number;
  passed: boolean;
  input: any[];
  expected: any;
  actual?: any;
  executionTimeMs: number;
  hidden?: boolean;
  error?: string;
}

export interface SandboxExecutionResult {
  status: ExecutionStatus;
  passedTests: number;
  totalTests: number;
  results: SingleTestResult[];
  runtimeMs: number;
  memoryBytes: number;
  complexityAssessment: {
    time: string;
    space: string;
    isOptimal: boolean;
    explanation: string;
  };
  interviewerFeedback: string;
  runnerMode?: "isolated_subprocess" | "restricted_dev_inprocess";
}

/**
 * Static Complexity Analyzer
 * Analyzes candidate code structure to estimate algorithmic time & space complexity.
 */
export function analyzeCodeComplexity(code: string, expectedOptimal: { time: string; space: string }): {
  time: string;
  space: string;
  isOptimal: boolean;
  explanation: string;
} {
  const clean = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, ""); // strip comments

  // Count nested loops
  const forMatches = (clean.match(/\bfor\s*\(/g) || []).length;
  const whileMatches = (clean.match(/\bwhile\s*\(/g) || []).length;
  const loopCount = forMatches + whileMatches;

  // Check for nested loop patterns: for(...) { ... for(...) }
  const nestedLoopPattern = /(for|while)\s*\([^)]*\)\s*\{[\s\S]*?(for|while)\s*\([^)]*\)/;
  const hasNestedLoops = nestedLoopPattern.test(clean);

  // Check for Map / Set / Object dictionary usage for O(n) lookups
  const usesMapOrSet = /\b(new\s+Map|new\s+Set|\bMap\(|\bSet\(|\{\s*\})/i.test(clean);
  const usesObjectHash = /\[\w+\]\s*=|in\s+\w+|has\s*\(/.test(clean);
  const usesHashTable = usesMapOrSet || usesObjectHash;

  let estimatedTime = "O(n)";
  let estimatedSpace = "O(1)";
  let explanation = "";

  if (hasNestedLoops || loopCount >= 2 && !usesHashTable) {
    estimatedTime = "O(n²)";
    explanation = "Detected nested iteration patterns indicative of quadratic time complexity.";
  } else if (loopCount === 1 || usesHashTable) {
    estimatedTime = "O(n)";
    explanation = "Single-pass traversal utilizing linear time.";
  } else if (loopCount === 0) {
    estimatedTime = "O(1)";
    explanation = "Constant-time direct computation.";
  }

  if (usesHashTable) {
    estimatedSpace = "O(n)";
    explanation += " Hash-based lookup table utilizes linear auxiliary space.";
  }

  const isOptimal = estimatedTime === expectedOptimal.time;

  return {
    time: estimatedTime,
    space: estimatedSpace,
    isOptimal,
    explanation
  };
}

/**
 * Deep Equality Comparison Helper
 */
function areDeeplyEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!areDeeplyEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (typeof a === "object" && typeof b === "object") {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!keysB.includes(key) || !areDeeplyEqual(a[key], b[key])) return false;
    }
    return true;
  }

  return false;
}

/**
 * Executes user JavaScript solution safely in a sandboxed vm.
 */
export const FORBIDDEN_EXECUTION_PATTERNS = [
  /\bprocess\b/,
  /\bchild_process\b/,
  /\bfs\b/,
  /\bnet\b/,
  /\bhttp\b/,
  /\bhttps\b/,
  /\bimport\b/,
  /\brequire\b/,
  /\bglobal\b/,
  /\b__proto__\b/,
  /\bconstructor\b/
];

/**
 * Validates candidate code against restricted system access patterns.
 */
export function checkRestrictedCodePatterns(code: string): { valid: boolean; violation?: string } {
  for (const pattern of FORBIDDEN_EXECUTION_PATTERNS) {
    if (pattern.test(code)) {
      return {
        valid: false,
        violation: `Restricted system access pattern '${pattern}' is prohibited.`
      };
    }
  }
  return { valid: true };
}

/**
 * Mode A: Restricted In-Process Runner (Development/Testing Mode)
 * Uses Node.js vm.createContext() with timeouts and restricted scopes.
 */
export async function executeInRestrictedDevRunner(
  userCode: string,
  entryFunctionName: string,
  testCases: TestCase[],
  expectedOptimal: { time: string; space: string } = { time: "O(n)", space: "O(n)" }
): Promise<SandboxExecutionResult> {
  const patternCheck = checkRestrictedCodePatterns(userCode);
  const complexity = analyzeCodeComplexity(userCode, expectedOptimal);

  if (!patternCheck.valid) {
    return {
      status: "INVALID_SUBMISSION",
      passedTests: 0,
      totalTests: testCases.length,
      results: [],
      runtimeMs: 0,
      memoryBytes: 0,
      complexityAssessment: complexity,
      interviewerFeedback: `Execution rejected: ${patternCheck.violation}`,
      runnerMode: "restricted_dev_inprocess"
    };
  }

  const sandbox = {
    console: { log: () => {}, error: () => {}, warn: () => {} },
    Math, Array, Object, String, Number, Boolean, Map, Set,
    parseInt, parseFloat, isNaN, isFinite
  };

  const context = vm.createContext(sandbox);

  try {
    const compiledScript = new vm.Script(`
      "use strict";
      ${userCode};
      if (typeof ${entryFunctionName} !== "function") {
        throw new Error("Function '${entryFunctionName}' is not defined");
      }
    `);
    compiledScript.runInContext(context, { timeout: 1000 });
  } catch (compileErr: any) {
    return {
      status: "INVALID_SUBMISSION",
      passedTests: 0,
      totalTests: testCases.length,
      results: [],
      runtimeMs: 0,
      memoryBytes: 0,
      complexityAssessment: complexity,
      interviewerFeedback: `Compilation error: ${compileErr.message}`,
      runnerMode: "restricted_dev_inprocess"
    };
  }

  const results: SingleTestResult[] = [];
  let totalRuntime = 0;
  let passedCount = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const testStart = Date.now();

    try {
      const inputClones = JSON.parse(JSON.stringify(tc.input));
      (context as any).__test_input__ = inputClones;

      const evalScript = new vm.Script(`${entryFunctionName}(...__test_input__);`);
      const actual = evalScript.runInContext(context, { timeout: 1500 });
      const elapsed = Date.now() - testStart;
      totalRuntime += elapsed;

      const passed = areDeeplyEqual(actual, tc.expected);
      if (passed) passedCount++;

      results.push({
        index: i + 1,
        passed,
        input: tc.hidden ? ["(hidden test input)"] : tc.input,
        expected: tc.hidden ? "(hidden expected output)" : tc.expected,
        actual: tc.hidden ? (passed ? "(passed)" : "(failed)") : actual,
        executionTimeMs: elapsed,
        hidden: tc.hidden
      });
    } catch (runErr: any) {
      const elapsed = Date.now() - testStart;
      totalRuntime += elapsed;
      const isTimeout = (runErr?.message || "").includes("timed out");

      results.push({
        index: i + 1,
        passed: false,
        input: tc.hidden ? ["(hidden test input)"] : tc.input,
        expected: tc.hidden ? "(hidden expected output)" : tc.expected,
        executionTimeMs: elapsed,
        hidden: tc.hidden,
        error: isTimeout ? "Time Limit Exceeded (1500ms)" : runErr.message
      });

      if (isTimeout) {
        return {
          status: "TIMEOUT",
          passedTests: passedCount,
          totalTests: testCases.length,
          results,
          runtimeMs: totalRuntime,
          memoryBytes: 0,
          complexityAssessment: complexity,
          interviewerFeedback: "Solution encountered Time Limit Exceeded (execution exceeded 1500ms limit).",
          runnerMode: "restricted_dev_inprocess"
        };
      }
    }
  }

  const allPassed = passedCount === testCases.length;
  const status: ExecutionStatus = allPassed ? "PASSED" : "FAILED";

  let feedback = "";
  if (allPassed) {
    feedback = `All ${testCases.length} test cases passed. Algorithm estimated at ${complexity.time} time and ${complexity.space} space.`;
    if (complexity.isOptimal) {
      feedback += " Solution achieves optimal theoretical complexity.";
    } else {
      feedback += ` Note: Problem allows an optimal ${expectedOptimal.time} solution. Consider optimizing further.`;
    }
  } else {
    feedback = `Passed ${passedCount}/${testCases.length} test cases. Review edge cases and expected return structures.`;
  }

  return {
    status,
    passedTests: passedCount,
    totalTests: testCases.length,
    results,
    runtimeMs: totalRuntime,
    memoryBytes: Math.round(process.memoryUsage().heapUsed / 1024),
    complexityAssessment: complexity,
    interviewerFeedback: feedback,
    runnerMode: "restricted_dev_inprocess"
  };
}

/**
 * Mode B: Isolated Subprocess Worker (Restricted Environment Mode)
 * Executes outside the Express server in an isolated child process with stripped credentials.
 */
export async function executeInIsolatedSubprocess(
  userCode: string,
  entryFunctionName: string,
  testCases: TestCase[],
  expectedOptimal: { time: string; space: string } = { time: "O(n)", space: "O(n)" }
): Promise<SandboxExecutionResult> {
  const patternCheck = checkRestrictedCodePatterns(userCode);
  const complexity = analyzeCodeComplexity(userCode, expectedOptimal);

  if (!patternCheck.valid) {
    return {
      status: "INVALID_SUBMISSION",
      passedTests: 0,
      totalTests: testCases.length,
      results: [],
      runtimeMs: 0,
      memoryBytes: 0,
      complexityAssessment: complexity,
      interviewerFeedback: `Execution rejected: ${patternCheck.violation}`,
      runnerMode: "isolated_subprocess"
    };
  }

  // Create isolated ephemeral temporary directory
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "recruiter-worker-"));
  const workerScriptPath = path.join(tempDir, "isolatedWorker.js");
  const payloadPath = path.join(tempDir, "payload.json");

  // Worker script to execute isolated from Express credentials
  const workerScriptContent = `
"use strict";
const fs = require("fs");
const vm = require("vm");

const areDeeplyEqual = ${areDeeplyEqual.toString()};

try {
  const rawPayload = fs.readFileSync(process.argv[2], "utf8");
  const payload = JSON.parse(rawPayload);
  const { userCode, entryFunctionName, testCases } = payload;

  const sandbox = {
    console: { log: () => {}, error: () => {}, warn: () => {} },
    Math, Array, Object, String, Number, Boolean, Map, Set,
    parseInt, parseFloat, isNaN, isFinite
  };

  const context = vm.createContext(sandbox);
  const compiledScript = new vm.Script(
    '"use strict";\\n' + userCode + ';\\nif (typeof ' + entryFunctionName + ' !== "function") { throw new Error("Function \\'' + entryFunctionName + '\\' is not defined"); }'
  );
  compiledScript.runInContext(context, { timeout: 1000 });

  const results = [];
  let totalRuntime = 0;
  let passedCount = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const testStart = Date.now();
    try {
      context.__test_input__ = tc.input;
      const evalScript = new vm.Script(entryFunctionName + '(...__test_input__);');
      const actual = evalScript.runInContext(context, { timeout: 1500 });
      const elapsed = Date.now() - testStart;
      totalRuntime += elapsed;

      const passed = areDeeplyEqual(actual, tc.expected);
      if (passed) passedCount++;

      results.push({
        index: i + 1,
        passed,
        input: tc.hidden ? ["(hidden test input)"] : tc.input,
        expected: tc.hidden ? "(hidden expected output)" : tc.expected,
        actual: tc.hidden ? (passed ? "(passed)" : "(failed)") : actual,
        executionTimeMs: elapsed,
        hidden: tc.hidden
      });
    } catch (runErr) {
      const elapsed = Date.now() - testStart;
      totalRuntime += elapsed;
      const isTimeout = (runErr?.message || "").includes("timed out");
      results.push({
        index: i + 1,
        passed: false,
        input: tc.hidden ? ["(hidden test input)"] : tc.input,
        expected: tc.hidden ? "(hidden expected output)" : tc.expected,
        executionTimeMs: elapsed,
        hidden: tc.hidden,
        error: isTimeout ? "Time Limit Exceeded (1500ms)" : (runErr.message || "Execution error")
      });
      if (isTimeout) {
        process.stdout.write(JSON.stringify({
          status: "TIMEOUT",
          passedTests: passedCount,
          totalTests: testCases.length,
          results,
          runtimeMs: totalRuntime,
          memoryBytes: Math.round(process.memoryUsage().heapUsed / 1024)
        }));
        process.exit(0);
      }
    }
  }

  const allPassed = passedCount === testCases.length;
  process.stdout.write(JSON.stringify({
    status: allPassed ? "PASSED" : "FAILED",
    passedTests: passedCount,
    totalTests: testCases.length,
    results,
    runtimeMs: totalRuntime,
    memoryBytes: Math.round(process.memoryUsage().heapUsed / 1024)
  }));
  process.exit(0);
} catch (err) {
  process.stdout.write(JSON.stringify({
    status: "INVALID_SUBMISSION",
    error: err.message || "Failed to execute worker"
  }));
  process.exit(0);
}
`;

  try {
    fs.writeFileSync(payloadPath, JSON.stringify({ userCode, entryFunctionName, testCases }));
    fs.writeFileSync(workerScriptPath, workerScriptContent);

    // Stripped environment: zero application or database credentials
    const strippedEnv: NodeJS.ProcessEnv = {
      PATH: process.env.PATH || "",
      NODE_ENV: "sandbox"
    };

    return await new Promise<SandboxExecutionResult>((resolve) => {
      execFile(
        process.execPath,
        ["--max-old-space-size=64", workerScriptPath, payloadPath],
        {
          cwd: tempDir,
          env: strippedEnv,
          timeout: 2500,
          maxBuffer: 512 * 1024 // 512 KB output cap
        },
        (error, stdout, stderr) => {
          if (error) {
            if (error.killed && (error.signal === "SIGTERM" || (error as any).code === "ETIMEDOUT")) {
              return resolve({
                status: "TIMEOUT",
                passedTests: 0,
                totalTests: testCases.length,
                results: [],
                runtimeMs: 2500,
                memoryBytes: 0,
                complexityAssessment: complexity,
                interviewerFeedback: "Solution terminated: Execution timed out.",
                runnerMode: "isolated_subprocess"
              });
            }
            if ((error as any).code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER") {
              return resolve({
                status: "RESOURCE_LIMIT",
                passedTests: 0,
                totalTests: testCases.length,
                results: [],
                runtimeMs: 0,
                memoryBytes: 0,
                complexityAssessment: complexity,
                interviewerFeedback: "Execution output exceeded resource limits.",
                runnerMode: "isolated_subprocess"
              });
            }
            if (stderr && stderr.includes("JavaScript heap out of memory")) {
              return resolve({
                status: "MEMORY_LIMIT",
                passedTests: 0,
                totalTests: testCases.length,
                results: [],
                runtimeMs: 0,
                memoryBytes: 64 * 1024,
                complexityAssessment: complexity,
                interviewerFeedback: "Solution exceeded memory limit (64MB heap quota).",
                runnerMode: "isolated_subprocess"
              });
            }
            return resolve({
              status: "SANDBOX_ERROR",
              passedTests: 0,
              totalTests: testCases.length,
              results: [],
              runtimeMs: 0,
              memoryBytes: 0,
              complexityAssessment: complexity,
              interviewerFeedback: `Sandbox execution error: ${error.message}`,
              runnerMode: "isolated_subprocess"
            });
          }

          try {
            const parsed = JSON.parse(stdout.trim());
            if (parsed.status === "INVALID_SUBMISSION") {
              return resolve({
                status: "INVALID_SUBMISSION",
                passedTests: 0,
                totalTests: testCases.length,
                results: [],
                runtimeMs: 0,
                memoryBytes: 0,
                complexityAssessment: complexity,
                interviewerFeedback: `Submission error: ${parsed.error || "Invalid code"}`,
                runnerMode: "isolated_subprocess"
              });
            }

            const allPassed = parsed.passedTests === testCases.length;
            let feedback = "";
            if (allPassed) {
              feedback = `All ${testCases.length} test cases passed. Algorithm estimated at ${complexity.time} time and ${complexity.space} space.`;
              if (complexity.isOptimal) {
                feedback += " Solution achieves optimal theoretical complexity.";
              } else {
                feedback += ` Note: Problem allows an optimal ${expectedOptimal.time} solution. Consider optimizing further.`;
              }
            } else {
              feedback = `Passed ${parsed.passedTests}/${testCases.length} test cases. Review edge cases and expected return structures.`;
            }

            resolve({
              status: parsed.status,
              passedTests: parsed.passedTests,
              totalTests: parsed.totalTests,
              results: parsed.results || [],
              runtimeMs: parsed.runtimeMs || 0,
              memoryBytes: parsed.memoryBytes || 0,
              complexityAssessment: complexity,
              interviewerFeedback: feedback,
              runnerMode: "isolated_subprocess"
            });
          } catch (parseErr: any) {
            resolve({
              status: "SANDBOX_ERROR",
              passedTests: 0,
              totalTests: testCases.length,
              results: [],
              runtimeMs: 0,
              memoryBytes: 0,
              complexityAssessment: complexity,
              interviewerFeedback: "Failed to parse worker output.",
              runnerMode: "isolated_subprocess"
            });
          }
        }
      );
    });
  } catch (outerErr: any) {
    return {
      status: "SANDBOX_ERROR",
      passedTests: 0,
      totalTests: testCases.length,
      results: [],
      runtimeMs: 0,
      memoryBytes: 0,
      complexityAssessment: complexity,
      interviewerFeedback: `Worker orchestration failure: ${outerErr.message}`,
      runnerMode: "isolated_subprocess"
    };
  } finally {
    // Destroy and clean up isolated ephemeral filesystem
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Best-effort cleanup
    }
  }
}

/**
 * Authoritative sandbox execution entry point.
 * By default executes via isolated subprocess worker outside the Express process.
 */
export async function executeInSandbox(
  userCode: string,
  entryFunctionName: string,
  testCases: TestCase[],
  expectedOptimal: { time: string; space: string } = { time: "O(n)", space: "O(n)" }
): Promise<SandboxExecutionResult> {
  const useInProcess = process.env.USE_IN_PROCESS_SANDBOX === "true";
  if (useInProcess) {
    return executeInRestrictedDevRunner(userCode, entryFunctionName, testCases, expectedOptimal);
  }
  return executeInIsolatedSubprocess(userCode, entryFunctionName, testCases, expectedOptimal);
}
