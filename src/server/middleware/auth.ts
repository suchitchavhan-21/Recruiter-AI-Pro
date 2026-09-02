import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import { findUserById } from "../db/repository";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: "candidate" | "admin";
  };
}

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: "candidate" | "admin";
  iat?: number;
  exp?: number;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim() || ENV.JWT_SECRET;
  if (!secret) {
    throw new Error("[AUTH FATAL] JWT_SECRET is not configured.");
  }
  return secret;
}

function getJwtRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET?.trim() || ENV.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error("[AUTH FATAL] JWT_REFRESH_SECRET is not configured.");
  }
  return secret;
}

export function signAccessToken(payload: { userId: string; email: string; role: "candidate" | "admin" }): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "15m" });
}

export function signRefreshToken(payload: { userId: string }): string {
  return jwt.sign(payload, getJwtRefreshSecret(), { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as AccessTokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, getJwtRefreshSecret()) as { userId: string };
  } catch {
    return null;
  }
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  // In modern browsers and iframe sandboxes, SameSite=None and Secure=true are needed for cookies to function reliably
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 15 * 60 * 1000 // 15 mins
  });

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: true,
    sameSite: "none"
  });
  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: true,
    sameSite: "none"
  });
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token: string | undefined = req.cookies?.access_token;

  // Header fallback for programmatic clients / iframe isolation
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      token = parts[1];
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required. Please sign in to proceed."
      }
    });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      error: {
        code: "TOKEN_EXPIRED",
        message: "Your session token has expired. Please refresh or log in again."
      }
    });
  }

  try {
    const user = await findUserById(payload.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "The authenticated user account no longer exists."
        }
      });
    }

    if (user.accountStatus !== "active") {
      return res.status(403).json({
        success: false,
        error: {
          code: "ACCOUNT_SUSPENDED",
          message: "This account has been deactivated or suspended."
        }
      });
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (err) {
    console.error("[AUTH ERROR] Verification failure:", err);
    return res.status(500).json({
      success: false,
      error: {
        code: "AUTH_SYSTEM_ERROR",
        message: "Internal authentication verification failure."
      }
    });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Access denied. Administrative privileges required."
      }
    });
  }
  next();
}
