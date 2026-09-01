import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// Ensure strong cryptographically random keys if not provided in environment
function getOrGenerateSecret(envVarName: string, fallbackName: string): string {
  const value = process.env[envVarName];
  if (value && value.trim().length >= 16) {
    return value.trim();
  }
  
  if (process.env.NODE_ENV === "production" && !value) {
    console.warn(`[SECURITY WARNING] ${envVarName} is not configured in production! Generating secure ephemeral key.`);
  }

  // Generates 256-bit cryptographic random key for this runtime instance
  return crypto.randomBytes(32).toString("hex");
}

export const ENV = {
  PORT: parseInt(process.env.PORT || "3000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  APP_URL: process.env.APP_URL || "http://localhost:3000",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  
  // JWT & Security Secrets
  JWT_SECRET: getOrGenerateSecret("JWT_SECRET", "jwt_secret"),
  JWT_REFRESH_SECRET: getOrGenerateSecret("JWT_REFRESH_SECRET", "jwt_refresh_secret"),
  ADMIN_PASSCODE: process.env.ADMIN_PASSCODE || "",
  
  // SMTP Email Server (Optional)
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "2525", 10),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",

  // Rate Limiting Config
  RATE_LIMIT_WINDOW_MS: 60 * 1000, // 1 minute
  RATE_LIMIT_MAX_GENERAL: 300,
  RATE_LIMIT_MAX_AUTH: 30,
  RATE_LIMIT_MAX_AI: 50,
  
  // File Upload Config
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10 MB
  ALLOWED_MIME_TYPES: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "text/plain"
  ]
};
