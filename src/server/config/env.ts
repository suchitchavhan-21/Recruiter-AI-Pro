import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

function getOrGenerateSecret(envVarName: string): string {
  const value = process.env[envVarName];
  if (value && value.trim().length >= 16) {
    return value.trim();
  }
  
  if (process.env.NODE_ENV === "production") {
    // In production, ephemeral random keys are strictly forbidden.
    return "";
  }

  // Generates 256-bit cryptographic random key for local development/test environments
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
  GEMINI_PRIMARY_MODEL: process.env.GEMINI_PRIMARY_MODEL || "gemini-2.5-flash",
  GEMINI_FALLBACK_MODEL: process.env.GEMINI_FALLBACK_MODEL || "gemini-flash-latest",
  GEMINI_LIGHT_MODEL: process.env.GEMINI_LIGHT_MODEL || "gemini-flash-lite-latest",
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
  const isProd = (process.env.NODE_ENV === "production") || (ENV.NODE_ENV === "production");

  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY?.trim() || ENV.GEMINI_API_KEY?.trim());
  if (!hasGeminiKey) {
    if (isProd) {
      warnings.push("READINESS_FAILURE: GEMINI_API_KEY is not configured in production. Live Gemini API credentials are required; synthetic/fake AI fallbacks are strictly prohibited. AI features will return HTTP 503 AI_PROVIDER_UNAVAILABLE.");
    } else {
      warnings.push("GEMINI_API_KEY is not configured. Live AI endpoints will return HTTP 503 AI_PROVIDER_UNAVAILABLE until valid credentials are provided.");
    }
  }

  if (isProd) {
    const jwtSecret = process.env.JWT_SECRET?.trim() || "";
    if (!jwtSecret || jwtSecret.length < 16) {
      errors.push("Mandatory JWT_SECRET is missing or too short (minimum 16 characters required in production). Ephemeral secrets are strictly prohibited.");
    }
    
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET?.trim() || "";
    if (!jwtRefreshSecret || jwtRefreshSecret.length < 16) {
      errors.push("Mandatory JWT_REFRESH_SECRET is missing or too short (minimum 16 characters required in production). Ephemeral secrets are strictly prohibited.");
    }

    const dbUrl = process.env.DATABASE_URL?.trim() || ENV.DATABASE_URL;
    if (!dbUrl) {
      errors.push("Mandatory DATABASE_URL is missing in production. External PostgreSQL with pgvector is strictly required; file-backed persistence is prohibited.");
    } else if (dbUrl.includes("embedded") || dbUrl.includes("postgres_data")) {
      errors.push("In production mode, an external persistent PostgreSQL DATABASE_URL is required. Embedded container-local database storage is strictly prohibited.");
    } else if (!dbUrl.startsWith("postgres://") && !dbUrl.startsWith("postgresql://")) {
      errors.push("DATABASE_URL must be a valid PostgreSQL connection string starting with 'postgres://' or 'postgresql://'.");
    }
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors
  };
}
