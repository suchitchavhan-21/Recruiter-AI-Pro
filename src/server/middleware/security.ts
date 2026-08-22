import { Request, Response, NextFunction } from "express";
import { ENV } from "../config/env";

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up stale rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    const validTimestamps = record.timestamps.filter(t => now - t < 300000);
    if (validTimestamps.length === 0) {
      rateLimitStore.delete(ip);
    } else {
      record.timestamps = validTimestamps;
    }
  }
}, 300000);

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message: string;
}

export function createRateLimiter(options: RateLimitOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    const forwarded = req.headers["x-forwarded-for"];
    const ip = (typeof forwarded === "string" ? forwarded.split(",")[0] : req.socket.remoteAddress) || "unknown_ip";

    const now = Date.now();
    let record = rateLimitStore.get(ip);

    if (!record) {
      record = { timestamps: [] };
      rateLimitStore.set(ip, record);
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
