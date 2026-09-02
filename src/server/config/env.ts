import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

function getOrGenerateSecret(envVarName: string): string {
  const value = process.env[envVarName];
  if (value && value.trim().length >= 16) {
    return value.trim();
  }
  
  if (isProduction) {
    // In production, ephemeral secrets cause token invalidation across instances.
    // However, during container cold boot before user configures secrets, we warn and provide an instance key.
    console.warn(`[SECURITY WARNING] Mandatory ${envVarName} is not configured in production environment! Using generated instance key.`);
  }

  // Generates 256-bit cryptographic random key for local development
  return crypto.randomBytes(32).toString("hex");
}

export const ENV = {
  PORT: parseInt(process.env.PORT || "3000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  APP_URL: process.env.APP_URL || "http://localhost:3000",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  
  // Database & Persistence
  DATABASE_URL: process.env.DATABASE_URL || "",
  
  // AI & Embeddings Model
  EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || "gemini-embedding-2",
  EMBEDDING_DIMENSION: 768,
  
  // JWT & Security Secrets
  JWT_SECRET: getOrGenerateSecret("JWT_SECRET"),
  JWT_REFRESH_SECRET: getOrGenerateSecret("JWT_REFRESH_SECRET"),
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

export function validateEnvironment(): { valid: boolean; warnings: string[]; errors: string[] } {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!ENV.GEMINI_API_KEY) {
    warnings.push("GEMINI_API_KEY is not configured. Live Gemini generation will use structured fallback responses.");
  }

  if (isProduction) {
    if (!process.env.JWT_SECRET) {
      warnings.push("JWT_SECRET is missing from production environment. User sessions may invalidate on container restart.");
    }
    if (!process.env.JWT_REFRESH_SECRET) {
      warnings.push("JWT_REFRESH_SECRET is missing from production environment.");
    }
    if (!ENV.DATABASE_URL) {
      warnings.push("DATABASE_URL is not set in production. Operating in file-backed persistence mode.");
    }
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors
  };
}
