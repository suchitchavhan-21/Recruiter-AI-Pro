import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Response } from "express";
import { ENV } from "../server/config/env";
import { sendVerificationEmail as sendVerif, sendPasswordResetEmail as sendReset } from "../server/services/email.service";

// Hashes a password securely using bcryptjs
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Compares plain text password against hash
export async function comparePasswords(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// Generates access token
export function generateAccessToken(payload: { userId: string; email: string; role: string }): string {
  return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: "15m" });
}

// Generates refresh token
export function generateRefreshToken(payload: { userId: string }): string {
  return jwt.sign(payload, ENV.JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

// Verifies access token
export function verifyAccessToken(token: string): any {
  try {
    return jwt.verify(token, ENV.JWT_SECRET);
  } catch {
    return null;
  }
}

// Verifies refresh token
export function verifyRefreshToken(token: string): any {
  try {
    return jwt.verify(token, ENV.JWT_REFRESH_SECRET);
  } catch {
    return null;
  }
}

// Sets secure HTTP-only cookies
export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
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

// Clears auth cookies
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

export async function sendVerificationEmail(email: string, token: string, baseUrl: string) {
  return sendVerif(email, token, baseUrl);
}

export async function sendResetEmail(email: string, token: string, baseUrl: string) {
  return sendReset(email, token, baseUrl);
}
