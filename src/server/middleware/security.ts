import { Request, Response, NextFunction } from "express";
import { ENV } from "../config/env";
import { isPostgresActive, queryPostgres } from "../db/postgres";

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up stale rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [entryKey, record] of rateLimitStore.entries()) {
    const validTimestamps = record.timestamps.filter(t => now - t < 300000);
    if (validTimestamps.length === 0) {
      rateLimitStore.delete(entryKey);
    } else {
      record.timestamps = validTimestamps;
    }
  }
}, 300000);

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message: string;
  keyPrefix?: string;
  userAware?: boolean;
}

export function createRateLimiter(options: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const forwarded = req.headers["x-forwarded-for"];
    const ip = (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.socket.remoteAddress) || "unknown_ip";
    const prefix = options.keyPrefix || "rl";
    const userId = options.userAware ? (req as any).user?.userId : undefined;
    const key = userId ? `${prefix}:u:${userId}` : `${prefix}:${ip}`;
    const now = Date.now();

    // 1. Shared PostgreSQL rate limiter for multi-instance Cloud Run deployment
    if (isPostgresActive()) {
      try {
        const resetAt = now + options.windowMs;
        const resDb = await queryPostgres(
          `INSERT INTO rate_limits (key, count, reset_at)
           VALUES ($1, 1, $2)
           ON CONFLICT (key) DO UPDATE
           SET count = CASE WHEN rate_limits.reset_at < $3 THEN 1 ELSE rate_limits.count + 1 END,
               reset_at = CASE WHEN rate_limits.reset_at < $3 THEN $2 ELSE rate_limits.reset_at END
           RETURNING count, reset_at;`,
          [key, resetAt, now]
        );

        if (resDb.rows.length > 0) {
          const currentCount = parseInt(resDb.rows[0].count, 10);
          const currentResetAt = Number(resDb.rows[0].reset_at);

          if (currentCount > options.max) {
            const retryAfterSeconds = Math.max(1, Math.ceil((currentResetAt - now) / 1000));
            res.setHeader("Retry-After", retryAfterSeconds);
            res.setHeader("X-RateLimit-Limit", options.max);
            res.setHeader("X-RateLimit-Remaining", 0);
            res.setHeader("X-RateLimit-Reset", Math.ceil(currentResetAt / 1000));

            return res.status(429).json({
              success: false,
              error: {
                code: "RATE_LIMIT_EXCEEDED",
                message: options.message,
                retryAfter: retryAfterSeconds,
                resetTime: new Date(currentResetAt).toISOString()
              }
            });
          }

          const remaining = Math.max(0, options.max - currentCount);
          res.setHeader("X-RateLimit-Limit", options.max);
          res.setHeader("X-RateLimit-Remaining", remaining);
          res.setHeader("X-RateLimit-Reset", Math.ceil(currentResetAt / 1000));
          return next();
        }
      } catch {
        // Safe fallback to in-memory store if DB query encounters transient error
      }
    }

    // 2. In-memory fallback for local dev / non-DB operation
    let record = rateLimitStore.get(key);
    if (!record) {
      record = { timestamps: [] };
      rateLimitStore.set(key, record);
    }

    record.timestamps = record.timestamps.filter(t => now - t < options.windowMs);

    if (record.timestamps.length >= options.max) {
      const oldestTimestamp = record.timestamps[0];
      const resetTime = oldestTimestamp + options.windowMs;
      const retryAfterSeconds = Math.ceil((resetTime - now) / 1000);

      res.setHeader("Retry-After", retryAfterSeconds);
      res.setHeader("X-RateLimit-Limit", options.max);
      res.setHeader("X-RateLimit-Remaining", 0);
      res.setHeader("X-RateLimit-Reset", Math.ceil(resetTime / 1000));

      return res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: options.message,
          retryAfter: retryAfterSeconds,
          resetTime: new Date(resetTime).toISOString()
        }
      });
    }

    record.timestamps.push(now);

    const remaining = options.max - record.timestamps.length;
    res.setHeader("X-RateLimit-Limit", options.max);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil((now + options.windowMs) / 1000));

    next();
  };
}

export function applySecurityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent browsers from MIME sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Clickjacking protection compatible with preview environment
  res.setHeader("X-Frame-Options", "SAMEORIGIN");

  // XSS protection filter
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions policy for camera & microphone access
  res.setHeader("Permissions-Policy", "camera=(self), microphone=(self), display-capture=(self)");

  // HSTS in production
  if (ENV.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  next();
}

export function applyCorsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  const isProd = process.env.NODE_ENV === "production" || ENV.NODE_ENV === "production";

  const configuredExtra = (process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  const allowedOrigins = [
    ENV.APP_URL,
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    ...configuredExtra
  ].filter(Boolean);

  if (origin) {
    const isLocalDev = !isProd && (origin.includes("localhost") || origin.includes("127.0.0.1"));
    const isGoogleCloudRun = origin.endsWith(".run.app") || origin.includes("run.app");
    const isGoogleAIStudio = origin.endsWith(".google.com") || origin.endsWith(".googleusercontent.com");
    const isSameHost = Boolean(req.headers.host && origin.includes(req.headers.host));

    const isAllowed = allowedOrigins.includes(origin) || isLocalDev || isGoogleCloudRun || isGoogleAIStudio || isSameHost;

    if (isAllowed) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-Refresh-Token");
    } else if (isProd && req.method === "OPTIONS") {
      return res.status(403).json({ error: "CORS_FORBIDDEN", message: "Origin not allowed by CORS policy." });
    }
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
}

export const authLimiter = createRateLimiter({
  windowMs: ENV.RATE_LIMIT_WINDOW_MS || 60000,
  max: ENV.RATE_LIMIT_MAX_AUTH || 30,
  keyPrefix: "auth",
  message: "Too many authentication attempts. Please wait before trying again."
});

export const aiLimiter = createRateLimiter({
  windowMs: ENV.RATE_LIMIT_WINDOW_MS || 60000,
  max: ENV.RATE_LIMIT_MAX_AI || 50,
  keyPrefix: "ai",
  message: "AI request quota exceeded. Please slow down your requests."
});

export const ttsLimiter = createRateLimiter({
  windowMs: ENV.RATE_LIMIT_WINDOW_MS || 60000,
  max: 60,
  keyPrefix: "tts",
  userAware: true,
  message: "Speech synthesis rate limit exceeded. Please wait a moment."
});

export const generalLimiter = createRateLimiter({
  windowMs: ENV.RATE_LIMIT_WINDOW_MS || 60000,
  max: ENV.RATE_LIMIT_MAX_GENERAL || 300,
  keyPrefix: "gen",
  message: "Request rate limit exceeded."
});

export const codingLimiter = createRateLimiter({
  windowMs: ENV.RATE_LIMIT_WINDOW_MS || 60000,
  max: 30,
  keyPrefix: "coding",
  userAware: true,
  message: "Coding execution rate limit exceeded. Please wait a moment before submitting again."
});

