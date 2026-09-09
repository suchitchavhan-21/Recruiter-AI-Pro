import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "build/**",
      "node_modules/**",
      "data/**",
      "coverage/**",
      "*.log",
      ".antigravity/**"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}", "server.ts", "scripts/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ],
      "no-useless-assignment": "off",
      "preserve-caught-error": "off",
      "no-control-regex": "off",
      "no-console": "off",
      "no-constant-condition": "warn",
      "no-empty": ["error", { "allowEmptyCatch": true }],
      "no-debugger": "error",
      "no-eval": "error"
    }
  }
);
