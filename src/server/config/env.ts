import crypto from "crypto";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

function getOrGenerateSecret(envVarName: string): string {
  const value = process.env[envVarName];
  if (value && value.trim().length >= 16) {
    return value.trim();
  }
  
  if (process.env.NODE_ENV === "production" || isProduction || process.env.STRICT_FAIL_FAST === "true") {
    // Under production or explicit strict fail-fast testing, ephemeral random keys are strictly forbidden.
    // Cloud Run containers are horizontally scaled; instance-local ephemeral keys cause immediate
    // authentication failures across replicas.
    return "";
  }

  // In containerized deployments (like Cloud Run) or local environments without explicit secrets,
  // load or persist a stable 256-bit instance secret so auth tokens remain valid across requests.
  try {
    const dataDir = path.join(process.cwd(), "data");
    const secretsPath = path.join(dataDir, ".jwt_secrets.json");
    if (fs.existsSync(secretsPath)) {
      const stored = JSON.parse(fs.readFileSync(secretsPath, "utf-8"));
      if (stored[envVarName] && stored[envVarName].length >= 16) {
        return stored[envVarName];
      }
    }
  } catch {}

  const generated = crypto.randomBytes(32).toString("hex");
  try {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const secretsPath = path.join(dataDir, ".jwt_secrets.json");
    let existing: Record<string, string> = {};
    if (fs.existsSync(secretsPath)) {
      try { existing = JSON.parse(fs.readFileSync(secretsPath, "utf-8")); } catch {}
    }
    existing[envVarName] = generated;
    fs.writeFileSync(secretsPath, JSON.stringify(existing, null, 2), "utf-8");
  } catch {}

  return generated;
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
    const jwtSecret = (process.env.JWT_SECRET || "").trim();
    if (!jwtSecret || jwtSecret.length < 16) {
      errors.push("Mandatory JWT_SECRET is missing or too short (minimum 16 characters required in production). Ephemeral secrets are strictly prohibited.");
    }
    
    const jwtRefreshSecret = (process.env.JWT_REFRESH_SECRET || "").trim();
    if (!jwtRefreshSecret || jwtRefreshSecret.length < 16) {
      errors.push("Mandatory JWT_REFRESH_SECRET is missing or too short (minimum 16 characters required in production). Ephemeral secrets are strictly prohibited.");
    }

    const dbUrl = (process.env.DATABASE_URL || "").trim();
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
