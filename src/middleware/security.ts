import { Request, Response, NextFunction } from "express";

/**
 * Sliding Window In-Memory Rate Limiter
 * Highly performant, zero dependencies, and resilient to concurrency.
 */
interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up stale rate limit entries from memory every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    // Keep only timestamps within the last 5 minutes
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

/**
 * Creates an Express rate limiter middleware
 */
export function createRateLimiter(options: RateLimitOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Use x-forwarded-for if behind proxies (like Cloud Run), fallback to remoteAddress
    const forwarded = req.headers["x-forwarded-for"];
    const ip = (typeof forwarded === "string" ? forwarded.split(",")[0] : req.socket.remoteAddress) || "unknown_ip";

    const now = Date.now();
    let record = rateLimitStore.get(ip);

    if (!record) {
      record = { timestamps: [] };
      rateLimitStore.set(ip, record);
    }

    // Filter out timestamps older than the sliding window
    record.timestamps = record.timestamps.filter(t => now - t < options.windowMs);

    if (record.timestamps.length >= options.max) {
      const oldestTimestamp = record.timestamps[0];
      const resetTime = oldestTimestamp + options.windowMs;
      const retryAfterSeconds = Math.ceil((resetTime - now) / 1000);

      // Standard Rate-Limiting Headers
      res.setHeader("Retry-After", retryAfterSeconds);
      res.setHeader("X-RateLimit-Limit", options.max);
      res.setHeader("X-RateLimit-Remaining", 0);
      res.setHeader("X-RateLimit-Reset", Math.ceil(resetTime / 1000));

      return res.status(429).json({
        error: options.message,
        retryAfter: retryAfterSeconds,
        limit: options.max,
        remaining: 0,
        resetTime: new Date(resetTime).toISOString()
      });
    }

    // Record the current request timestamp
    record.timestamps.push(now);

    // Set standard rate limit headers for successful requests
    const remaining = options.max - record.timestamps.length;
    res.setHeader("X-RateLimit-Limit", options.max);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil((now + options.windowMs) / 1000));

    next();
  };
}

/**
 * Standard Application-Level Network Security Headers Middleware
 * Custom tailored to support running inside the Google AI Studio iframe context.
 */
export function applySecurityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent browsers from sniffing MIME types (prevents XSS attacks via file uploads)
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Protect against Clickjacking attacks while supporting AI Studio's preview iframe
  // SameOrigin is perfect here because it allows the site to be framed by its own origin 
  // or relaxed boundaries in sandbox context.
  res.setHeader("X-Frame-Options", "SAMEORIGIN");

  // Enable standard cross-site scripting (XSS) filters built into browsers
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Protect referrer leakage
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Force HTTPS for production environments (Strict-Transport-Security)
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  next();
}
