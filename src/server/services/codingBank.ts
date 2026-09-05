/**
 * Recruiter AI Pro — Extensible Coding Question Catalog
 * 
 * Curated question bank with structured test cases, expected complexity, and starter code.
 */

import { CodingQuestionRecord } from "../db/schema";
import { upsertCodingQuestion, findCodingQuestionById } from "../db/repository";

export const INITIAL_CODING_QUESTIONS: CodingQuestionRecord[] = [
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Mid",
    category: "arrays",
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

Return the answer as an array of two indices [i, j].`,
    starterCode: {
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  // Implement optimal O(n) hash map solution here
}
`
    },
    testCases: [
      { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { input: [[3, 2, 4], 6], expected: [1, 2] },
      { input: [[3, 3], 6], expected: [0, 1] },
      // Hidden test cases (negatives, large numbers)
      { input: [[-1, -2, -3, -4, -5], -8], expected: [2, 4], hidden: true },
      { input: [[0, 4, 3, 0], 0], expected: [0, 3], hidden: true },
      { input: [[1000, 2000, 3000, 4000], 7000], expected: [2, 3], hidden: true }
    ],
    expectedComplexity: {
      time: "O(n)",
      space: "O(n)"
    },
    hints: [
      "Can you use a hash map to look up if the complement (target - current) already exists in O(1) time?",
      "Be careful to store the number's index as the map value, not the other way around."
    ],
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-01T00:00:00Z"
  },
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "Entry",
    category: "strings",
    description: `Given a string \`s\` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    starterCode: {
      javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
  // Implement stack solution here
}
`
    },
    testCases: [
      { input: ["()"], expected: true },
      { input: ["()[]{}"], expected: true },
      { input: ["(]"], expected: false },
      { input: ["([)]"], expected: false, hidden: true },
      { input: ["{[]}"], expected: true, hidden: true },
      { input: [""], expected: true, hidden: true }
    ],
    expectedComplexity: {
      time: "O(n)",
      space: "O(n)"
    },
    hints: [
      "Use a stack to keep track of expected closing brackets."
    ],
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-01T00:00:00Z"
  },
  {
    id: "binary-search",
    title: "Binary Search",
    difficulty: "Entry",
    category: "binary search",
    description: `Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`. If \`target\` exists, then return its index. Otherwise, return -1.

You must write an algorithm with O(log n) runtime complexity.`,
    starterCode: {
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
function search(nums, target) {
  // Implement O(log n) binary search
}
`
    },
    testCases: [
      { input: [[-1, 0, 3, 5, 9, 12], 9], expected: 4 },
      { input: [[-1, 0, 3, 5, 9, 12], 2], expected: -1 },
      { input: [[5], 5], expected: 0, hidden: true },
      { input: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 1], expected: 0, hidden: true },
      { input: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 10], expected: 9, hidden: true }
    ],
    expectedComplexity: {
      time: "O(log n)",
      space: "O(1)"
    },
    hints: [
      "Maintain left and right pointers and compute mid = Math.floor((left + right) / 2)."
    ],
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-01T00:00:00Z"
  }
];

/**
 * Initializes default coding questions in the database if not present.
 */
export async function seedCodingQuestionsIfEmpty(): Promise<void> {
  for (const q of INITIAL_CODING_QUESTIONS) {
    const existing = await findCodingQuestionById(q.id);
    if (!existing) {
      await upsertCodingQuestion(q);
    }
  }
}
