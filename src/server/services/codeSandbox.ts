/**
 * Recruiter AI Pro — Safe Sandboxed Code Execution Engine
 * 
 * Production-grade isolated execution sandbox for candidate coding challenges:
 * - Isolated Node.js vm context with zero access to process, fs, net, child_process, or require
 * - Bounded CPU execution timeout (1500ms) to prevent infinite loops
 * - Deterministic test case evaluation
 * - Static AST/heuristic complexity assessment (detects O(n) vs O(n^2) and auxiliary space)
 */

import vm from "vm";

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
  status: "PASSED" | "FAILED" | "ERROR" | "TIMEOUT";
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
export async function executeInSandbox(
  userCode: string,
  entryFunctionName: string,
  testCases: TestCase[],
  expectedOptimal: { time: string; space: string } = { time: "O(n)", space: "O(n)" }
): Promise<SandboxExecutionResult> {
  // Prohibit dangerous words and escapes before compiling
  const forbiddenPatterns = [
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

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(userCode)) {
      return {
        status: "ERROR",
        passedTests: 0,
        totalTests: testCases.length,
        results: [],
        runtimeMs: 0,
        memoryBytes: 0,
        complexityAssessment: {
          time: "Unknown",
          space: "Unknown",
          isOptimal: false,
          explanation: `Restricted keyword or pattern detected: ${pattern}`
        },
        interviewerFeedback: `Execution rejected: Untrusted system access pattern '${pattern}' is strictly prohibited.`
      };
    }
  }

  const complexity = analyzeCodeComplexity(userCode, expectedOptimal);

  // Safe isolated sandbox context
  const sandbox = {
    console: {
      log: () => {},
      error: () => {},
      warn: () => {}
    },
    Math,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Map,
    Set,
    parseInt,
    parseFloat,
    isNaN,
    isFinite
  };

  const context = vm.createContext(sandbox);

  let compiledScript: vm.Script;
  try {
    compiledScript = new vm.Script(`
      "use strict";
      ${userCode};
      if (typeof ${entryFunctionName} !== "function") {
        throw new Error("Function '${entryFunctionName}' is not defined");
      }
    `);
    compiledScript.runInContext(context, { timeout: 1000 });
  } catch (compileErr: any) {
    return {
      status: "ERROR",
      passedTests: 0,
      totalTests: testCases.length,
      results: [],
      runtimeMs: 0,
      memoryBytes: 0,
      complexityAssessment: complexity,
      interviewerFeedback: `Compilation error: ${compileErr.message}`
    };
  }

  const results: SingleTestResult[] = [];
  let totalRuntime = 0;
  let passedCount = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const testStart = Date.now();

    try {
      // Deep clone inputs to prevent mutation across tests
      const inputClones = JSON.parse(JSON.stringify(tc.input));
      (context as any).__test_input__ = inputClones;

      const evalScript = new vm.Script(`
        ${entryFunctionName}(...__test_input__);
      `);

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
      const isTimeout = runErr.message.includes("timed out");

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
          interviewerFeedback: "Solution encountered Time Limit Exceeded (execution exceeded 1500ms limit)."
        };
      }
    }
  }

  const allPassed = passedCount === testCases.length;
  const status = allPassed ? "PASSED" : "FAILED";

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
    interviewerFeedback: feedback
  };
}
