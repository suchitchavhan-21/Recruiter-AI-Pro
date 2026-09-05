/**
 * Test Suite: Coding Practice & Safe Sandbox Isolation
 * 
 * Verifies:
 * 1. Safe Node.js VM sandbox execution with forbidden primitives (process, require, fs)
 * 2. Infinite loop timeout protection (1500ms limit)
 * 3. Two Sum optimal solution O(n) vs suboptimal O(n^2) complexity detection
 * 4. Deep equality test runner for public and hidden test cases
 * 5. Seeding and retrieval of coding challenges
 */

import { executeInSandbox, RUNNER_CLASSIFICATIONS } from "../src/server/services/codeSandbox";
import { seedCodingQuestionsIfEmpty } from "../src/server/services/codingBank";
import { findCodingQuestionById } from "../src/server/db/repository";
import { initPostgresSchema, closePostgresPool } from "../src/server/db/postgres";

async function runCodingSandboxTests() {
  console.log("==================================================");
  console.log("RUNNING CODING PRACTICE & SANDBOX TEST SUITE");
  console.log("==================================================\n");

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

  // 1. Question Bank Seeding
  console.log("Test Group 1: Question Bank Integrity");
  await initPostgresSchema();
  await seedCodingQuestionsIfEmpty();
  const twoSumQ = await findCodingQuestionById("two-sum");
  assert(!!twoSumQ, "Two Sum question seeded and retrievable");
  assert(twoSumQ?.testCases.length === 6, "Two Sum contains 6 test cases (public + hidden)");
  assert(twoSumQ?.testCases.some(tc => tc.hidden) === true, "Two Sum contains hidden edge cases");

  const validParenQ = await findCodingQuestionById("valid-parentheses");
  assert(!!validParenQ, "Valid Parentheses question seeded");

  const binarySearchQ = await findCodingQuestionById("binary-search");
  assert(!!binarySearchQ, "Binary Search question seeded");

  // 2. Optimal Two Sum Solution (O(n) with Map)
  console.log("\nTest Group 2: Optimal Two Sum Solution Evaluation");
  const optimalTwoSumCode = `
    function twoSum(nums, target) {
      const map = new Map();
      for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
          return [map.get(complement), i];
        }
        map.set(nums[i], i);
      }
      return [];
    }
  `;

  const optResult = await executeInSandbox(
    optimalTwoSumCode,
    "twoSum",
    twoSumQ!.testCases,
    twoSumQ!.expectedComplexity
  );

  assert(optResult.status === "PASSED", "Optimal Two Sum solution passed all test cases");
  assert(optResult.passedTests === optResult.totalTests, `Passed ${optResult.passedTests}/${optResult.totalTests} tests`);
  assert(optResult.complexityAssessment.time.includes("O(n)"), `Detected time complexity: ${optResult.complexityAssessment.time}`);
  assert(optResult.complexityAssessment.space.includes("O(n)"), `Detected space complexity: ${optResult.complexityAssessment.space}`);
  assert(optResult.complexityAssessment.isOptimal === true, "Marked as optimal solution");

  // 3. Suboptimal Two Sum Solution (O(n^2) nested loops)
  console.log("\nTest Group 3: Suboptimal Two Sum Solution Evaluation");
  const nestedTwoSumCode = `
    function twoSum(nums, target) {
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
          if (nums[i] + nums[j] === target) {
            return [i, j];
          }
        }
      }
      return [];
    }
  `;

  const subResult = await executeInSandbox(
    nestedTwoSumCode,
    "twoSum",
    twoSumQ!.testCases,
    twoSumQ!.expectedComplexity
  );

  assert(subResult.status === "PASSED", "Brute-force Two Sum solution passes functional tests");
  assert(subResult.complexityAssessment.time.includes("O(n²)") || subResult.complexityAssessment.time.includes("O(n^2)"), `Detected nested loops time complexity: ${subResult.complexityAssessment.time}`);
  assert(subResult.complexityAssessment.isOptimal === false, "Correctly identified as suboptimal time complexity");
  assert(subResult.interviewerFeedback.toLowerCase().includes("optimal") || subResult.interviewerFeedback.toLowerCase().includes("hash map") || subResult.interviewerFeedback.toLowerCase().includes("o(n)"), "Feedback provides actionable guidance to improve to hash map");

  // 4. Sandbox Security & Escape Prevention
  console.log("\nTest Group 4: Sandbox Isolation & Security Defenses");

  // 4a. Process access
  const processEscapeCode = `
    function solution() {
      process.exit(1);
    }
  `;
  const processRes = await executeInSandbox(processEscapeCode, "solution", [{ input: [], expected: 1 }]);
  assert(processRes.status === "INVALID_SUBMISSION", `Attempt to access 'process' is blocked with status: ${processRes.status}`);

  // 4b. Require / fs access
  const fsEscapeCode = `
    function solution() {
      const fs = require('fs');
      return fs.readdirSync('.');
    }
  `;
  const fsRes = await executeInSandbox(fsEscapeCode, "solution", [{ input: [], expected: 1 }]);
  assert(fsRes.status === "INVALID_SUBMISSION", `Attempt to access 'require' is blocked with status: ${fsRes.status}`);

  // 4c. Global / eval tampering
  const evalTamperCode = `
    function solution() {
      return (function() { return this; })().constructor.constructor("return process")();
    }
  `;
  const evalRes = await executeInSandbox(evalTamperCode, "solution", [{ input: [], expected: 1 }]);
  assert(evalRes.status === "INVALID_SUBMISSION" || evalRes.status === "FAILED" || evalRes.status === "SANDBOX_ERROR", `Constructor prototype escape is neutralized with status: ${evalRes.status}`);

  // 4d. Timeout protection (infinite loop)
  console.log("  Running timeout protection test (expecting ~1500ms)...");
  const infiniteLoopCode = `
    function solution() {
      while(true) {}
    }
  `;
  const timeoutRes = await executeInSandbox(infiniteLoopCode, "solution", [{ input: [], expected: 1 }]);
  assert(timeoutRes.status === "TIMEOUT", `Infinite loop correctly terminated with timeout status: ${timeoutRes.status}`);

  // 5. Valid Parentheses Test
  console.log("\nTest Group 5: Valid Parentheses Problem Evaluation");
  const validParenSolution = `
    function isValid(s) {
      const stack = [];
      const map = { ')': '(', '}': '{', ']': '[' };
      for (let i = 0; i < s.length; i++) {
        const char = s[i];
        if (char === '(' || char === '{' || char === '[') {
          stack.push(char);
        } else if (map[char]) {
          if (stack.pop() !== map[char]) return false;
        }
      }
      return stack.length === 0;
    }
  `;
  const parenRes = await executeInSandbox(
    validParenSolution,
    "isValid",
    validParenQ!.testCases,
    validParenQ!.expectedComplexity
  );
  assert(parenRes.status === "PASSED", `Valid Parentheses passed ${parenRes.passedTests}/${parenRes.totalTests} test cases`);
  assert(parenRes.complexityAssessment.isOptimal === true, "Valid Parentheses optimal stack solution recognized");

  // 6. Security Boundary Classification Invariants
  console.log("\nTest Group 6: Security Boundary Classification Invariants");
  assert(RUNNER_CLASSIFICATIONS.DEV_TEST.includes("Restricted In-Process Runner"), "Mode A documents Restricted In-Process Runner (Development/Testing Mode)");
  assert(RUNNER_CLASSIFICATIONS.SUBPROCESS_RESTRICTED.includes("Isolated Subprocess Worker"), "Mode B documents Isolated Subprocess Worker (Restricted Environment Mode)");
  assert(RUNNER_CLASSIFICATIONS.PRODUCTION_REQUIREMENT.includes("gVisor/nsjail"), "Production boundary explicitly mandates containerized gVisor/nsjail microVMs");


  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  await closePostgresPool();

  if (failed > 0) {
    process.exit(1);
  }
}


runCodingSandboxTests().catch(err => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
