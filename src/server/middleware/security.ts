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
    const ip = req.ip || req.socket.remoteAddress || "unknown_ip";
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
  // NOTE: The application is embedded within an iframe in Google AI Studio (ai.studio / aistudio.google.com).
  // X-Frame-Options: SAMEORIGIN blocks cross-origin iframe embedding and triggers "refused to connect" in Chrome.
  // Modern CSP frame-ancestors is used instead to securely restrict embedding to self and Google AI Studio origins.

  // XSS protection filter
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions policy for camera & microphone access
  res.setHeader("Permissions-Policy", "camera=(self), microphone=(self), display-capture=(self)");

  // Content-Security-Policy (allows local self, fonts, wasm, AI Studio embedding, and required API assets)
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com data:; " +
    "img-src 'self' data: blob: https:; " +
    "media-src 'self' blob: data:; " +
    "connect-src 'self' https://generativelanguage.googleapis.com https://cdn.jsdelivr.net https://storage.googleapis.com; " +
    "frame-ancestors 'self' https://*.google.com https://ai.studio https://aistudio.google.com https://*.run.app https://localhost.corp.google.com:26001;"
  );

  // HSTS in production
  if (ENV.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  next();
}

export function applyCorsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  const isProd = process.env.NODE_ENV === "production" || ENV.NODE_ENV === "production";

  const configuredOrigins = [
    ...(process.env.CORS_ALLOWED_ORIGINS || "").split(","),
    ...(process.env.ALLOWED_ORIGINS || "").split(",")
  ].map(s => s.trim()).filter(Boolean);

  const allowedOriginsSet = new Set<string>();
  if (ENV.APP_URL) {
    allowedOriginsSet.add(ENV.APP_URL);
  }
  for (const o of configuredOrigins) {
    allowedOriginsSet.add(o);
  }

  // In non-production, allow common local development origins
  if (!isProd) {
    allowedOriginsSet.add("http://localhost:3000");
    allowedOriginsSet.add("http://localhost:5173");
    allowedOriginsSet.add("http://127.0.0.1:3000");
    allowedOriginsSet.add("http://127.0.0.1:5173");
  }

  const host = req.get("host");
  if (host) {
    allowedOriginsSet.add(`http://${host}`);
    allowedOriginsSet.add(`https://${host}`);
  }

  if (origin) {
    const isGoogleOrAiStudio = 
      origin === "https://ai.studio" ||
      origin.endsWith(".google.com") ||
      origin.endsWith(".run.app");

    const isAllowed = allowedOriginsSet.has(origin) || isGoogleOrAiStudio;

    if (isAllowed) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-Refresh-Token, X-CSRF-Token");
      if (req.method === "OPTIONS") {
        return res.sendStatus(204);
      }
    } else {
      if (req.method === "OPTIONS") {
        return res.status(403).json({ success: false, error: { code: "CORS_FORBIDDEN", message: "Origin not allowed by CORS policy." } });
      }
      // For simple/actual cross-origin requests that are not allowed, omit Access-Control-Allow-Origin so browser blocks response
    }
  } else if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
}

/**
 * Enterprise CSRF Defense Middleware
 * 1. Validates Origin/Referer against allowed origins on all state-changing requests.
 * 2. Enforces presence of custom anti-CSRF header (X-Requested-With / X-CSRF-Token)
 *    on ambient cookie-authenticated mutating requests to eliminate cross-site forgeability.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Safe idempotent methods do not alter state
  const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);
  if (safeMethods.has(req.method)) {
    return next();
  }

  const origin = req.headers.origin;
  const isProd = process.env.NODE_ENV === "production" || ENV.NODE_ENV === "production";
  const host = req.get("host");

  // 1. Origin verification when Origin header is provided by browser
  if (origin) {
    const configuredOrigins = [
      ...(process.env.CORS_ALLOWED_ORIGINS || "").split(","),
      ...(process.env.ALLOWED_ORIGINS || "").split(",")
    ].map(s => s.trim()).filter(Boolean);

    const allowedOriginsSet = new Set<string>();
    if (ENV.APP_URL) allowedOriginsSet.add(ENV.APP_URL);
    for (const o of configuredOrigins) allowedOriginsSet.add(o);
    if (!isProd) {
      allowedOriginsSet.add("http://localhost:3000");
      allowedOriginsSet.add("http://localhost:5173");
      allowedOriginsSet.add("http://127.0.0.1:3000");
      allowedOriginsSet.add("http://127.0.0.1:5173");
    }
    if (host) {
      allowedOriginsSet.add(`http://${host}`);
      allowedOriginsSet.add(`https://${host}`);
    }

    if (!allowedOriginsSet.has(origin)) {
      return res.status(403).json({
        success: false,
        error: { code: "CSRF_ORIGIN_DENIED", message: "Cross-site request forgery protection: Origin not allowed." }
      });
    }
  }

  // 2. Custom header verification on cookie-authenticated mutating requests
  const hasCookieAuth = !!(req.cookies?.access_token || req.cookies?.refresh_token);
  const hasAuthHeader = !!req.headers.authorization;
  const hasExplicitBodyToken = Boolean(req.body && (req.body.refreshToken || req.body.token));

  // If request relies solely on ambient cookie credentials rather than explicit Authorization header or explicit payload token
  if (hasCookieAuth && !hasAuthHeader && !hasExplicitBodyToken) {
    const customHeader = req.headers["x-requested-with"] || req.headers["x-csrf-token"];
    if (!customHeader) {
      return res.status(403).json({
        success: false,
        error: {
          code: "CSRF_TOKEN_MISSING",
          message: "Cross-site request forgery protection: Missing required anti-CSRF header."
        }
      });
    }
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

