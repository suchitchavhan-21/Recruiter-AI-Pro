import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { 
  findUserByEmail, 
  findUserById, 
  findUserByPhone, 
  findUserByVerificationToken, 
  findUserByResetToken, 
  insertUser, 
  updateUserById, 
  insertSession, 
  findSessionByTokenHash, 
  revokeSessionById, 
  revokeAllUserSessions,
  rotateSessionAtomically,
  hashToken, 
  generateUUID, 
  insertActivity 
} from "../db/repository";
import { User, UserSession } from "../db/schema";
import { 
  signAccessToken, 
  signRefreshToken, 
  verifyRefreshToken, 
  setAuthCookies, 
  clearAuthCookies, 
  AuthenticatedRequest 
} from "../middleware/auth";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/email.service";
import { ENV } from "../config/env";

export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Please provide a valid email address."),
  phoneNumber: z.string().min(6, "Please provide a valid phone number."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string().min(8, "Confirm password is required."),
  profilePhoto: z.string().optional(),
  agreeTerms: z.boolean().refine(val => val === true, { message: "You must accept the terms of service." }),
  adminKey: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
  password: z.string().min(1, "Password is required."),
  adminKey: z.string().optional()
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please provide a valid email address.")
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string().min(8, "Confirm password is required.")
});

export function parseClientAgent(req: Request) {
  const ua = req.headers["user-agent"] || "";
  let browser = "Chrome";
  let operatingSystem = "macOS";
  let device = "Desktop";

  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edge")) browser = "Edge";

  if (ua.includes("Windows")) operatingSystem = "Windows";
  else if (ua.includes("Linux")) operatingSystem = "Linux";
  else if (ua.includes("Android")) operatingSystem = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) operatingSystem = "iOS";

  if (ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone")) {
    device = "Mobile";
  } else if (ua.includes("iPad") || ua.includes("Tablet")) {
    device = "Tablet";
  }

  const forwarded = req.headers["x-forwarded-for"];
  const ipAddress = (typeof forwarded === "string" ? forwarded.split(",")[0] : req.socket.remoteAddress) || "127.0.0.1";

  return { browser, operatingSystem, device, ipAddress };
}

// 1. REGISTER
export async function registerHandler(req: Request, res: Response) {
  const { fullName, email, phoneNumber, password, confirmPassword, profilePhoto, adminKey } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      error: { code: "PASSWORD_MISMATCH", message: "Passwords do not match." }
    });
  }

  const existingEmail = await findUserByEmail(email);
  if (existingEmail) {
    return res.status(409).json({
      success: false,
      error: { code: "EMAIL_EXISTS", message: "An account with this email address already exists." }
    });
  }

  const existingPhone = await findUserByPhone(phoneNumber);
  if (existingPhone) {
    return res.status(409).json({
      success: false,
      error: { code: "PHONE_EXISTS", message: "An account with this phone number already exists." }
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const verificationToken = crypto.randomBytes(32).toString("hex");

  // Determine role safely
  let role: "candidate" | "admin" = "candidate";
  if (adminKey && ENV.ADMIN_PASSCODE && adminKey.trim() === ENV.ADMIN_PASSCODE.trim()) {
    role = "admin";
  }

  const newUser: User = {
    id: generateUUID(),
    fullName: fullName.trim(),
    email: email.toLowerCase().trim(),
    phoneNumber: phoneNumber.trim(),
    passwordHash,
    profilePhoto: profilePhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120",
    role,
    provider: "local",
    emailVerified: false,
    verificationToken,
    accountStatus: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await insertUser(newUser);

  await insertActivity({
    userId: newUser.id,
    activityType: "ACCOUNT_REGISTERED",
    activityName: "User Registration",
    description: `New ${role} account registered for ${newUser.email}.`,
    metadata: { role }
  });

  const appUrl = `${req.protocol}://${req.get("host") || "localhost:3000"}`;
  try {
    await sendVerificationEmail(newUser.email, verificationToken, appUrl);
  } catch (mailErr) {
    console.warn("[MAIL WARNING] Failed to deliver verification email:", mailErr);
  }

  return res.status(201).json({
    success: true,
    message: "Registration successful. Please verify your email address to complete activation.",
    user: {
      id: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      role: newUser.role,
      emailVerified: false
    },
    verificationLink: `${appUrl}/api/auth/verify-email?token=${verificationToken}`
  });
}

// 2. LOGIN
export async function loginHandler(req: Request, res: Response) {
  const { email, password, adminKey } = req.body;

  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password." }
    });
  }

  if (user.accountStatus !== "active") {
    return res.status(403).json({
      success: false,
      error: { code: "ACCOUNT_LOCKED", message: "Your account is currently inactive or suspended." }
    });
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    return res.status(401).json({
      success: false,
      error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password." }
    });
  }

  if (!user.emailVerified) {
    const appUrl = `${req.protocol}://${req.get("host") || "localhost:3000"}`;
    return res.status(403).json({
      success: false,
      error: { code: "EMAIL_NOT_VERIFIED", message: "Please verify your email address before logging in." },
      unverifiedUser: {
        email: user.email,
        verificationLink: `${appUrl}/api/auth/verify-email?token=${user.verificationToken || ""}`
      }
    });
  }

  // Elevate to admin role if authorized (DEVELOPMENT ONLY; prohibited in production)
  if (process.env.NODE_ENV !== "production" && adminKey && ENV.ADMIN_PASSCODE && adminKey.trim() === ENV.ADMIN_PASSCODE.trim() && user.role !== "admin") {
    await updateUserById(user.id, { role: "admin" });
    user.role = "admin";
  }

  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role
  });

  const refreshToken = signRefreshToken({ userId: user.id });
  const refreshTokenHash = hashToken(refreshToken);

  const clientInfo = parseClientAgent(req);

  const newSession: UserSession = {
    id: generateUUID(),
    userId: user.id,
    device: clientInfo.device,
    browser: clientInfo.browser,
    operatingSystem: clientInfo.operatingSystem,
    ipAddress: clientInfo.ipAddress,
    country: "US",
    loginTime: new Date().toISOString(),
    refreshTokenHash,
    isActive: true,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };

  await insertSession(newSession);
  await updateUserById(user.id, { lastLogin: new Date().toISOString() });

  setAuthCookies(res, accessToken, refreshToken);

  await insertActivity({
    userId: user.id,
    activityType: "USER_LOGIN",
    activityName: "Account Login",
    description: `User logged in from ${clientInfo.browser} on ${clientInfo.operatingSystem}.`,
    metadata: { ip: clientInfo.ipAddress, device: clientInfo.device }
  });

  return res.status(200).json({
    success: true,
    message: "Login successful.",
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      profilePhoto: user.profilePhoto,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt
    }
  });
}

// 3. LOGOUT
export async function logoutHandler(req: AuthenticatedRequest, res: Response) {
  const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
  if (refreshToken) {
    const hash = hashToken(refreshToken);
    const session = await findSessionByTokenHash(hash);
    if (session) {
      await revokeSessionById(session.id);
    }
  }

  if (req.user?.userId) {
    await insertActivity({
      userId: req.user.userId,
      activityType: "USER_LOGOUT",
      activityName: "Account Logout",
      description: "User session closed."
    });
  }

  clearAuthCookies(res);

  return res.status(200).json({
    success: true,
    message: "Successfully logged out."
  });
}

// 4. REFRESH TOKEN
export async function refreshTokenHandler(req: Request, res: Response) {
  const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken || req.headers["x-refresh-token"];

  if (!refreshToken || typeof refreshToken !== "string") {
    return res.status(401).json({
      success: false,
      error: { code: "NO_REFRESH_TOKEN", message: "Refresh token missing." }
    });
  }

  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    return res.status(401).json({
      success: false,
      error: { code: "INVALID_REFRESH_TOKEN", message: "Refresh token expired or invalid." }
    });
  }

  const user = await findUserById(payload.userId);
  if (!user || user.accountStatus !== "active") {
    return res.status(403).json({
      success: false,
      error: { code: "USER_INVALID", message: "User account unavailable." }
    });
  }

  // Generate fresh token pair (Token Rotation)
  const newAccessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role
  });
  const newRefreshToken = signRefreshToken({ userId: user.id });

  const clientInfo = parseClientAgent(req);
  const rotatedSession: UserSession = {
    id: generateUUID(),
    userId: user.id,
    device: clientInfo.device,
    browser: clientInfo.browser,
    operatingSystem: clientInfo.operatingSystem,
    ipAddress: clientInfo.ipAddress,
    country: "US",
    loginTime: new Date().toISOString(),
    refreshTokenHash: hashToken(newRefreshToken),
    isActive: true,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };

  // Atomically invalidate old session and persist new rotated session
  const tokenHash = hashToken(refreshToken);
  const rotateResult = await rotateSessionAtomically(tokenHash, rotatedSession);

  if (!rotateResult.success) {
    return res.status(401).json({
      success: false,
      error: { code: "SESSION_REVOKED", message: "Session is inactive or refresh token has already been consumed." }
    });
  }

  setAuthCookies(res, newAccessToken, newRefreshToken);

  return res.status(200).json({
    success: true,
    message: "Tokens successfully refreshed.",
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    }
  });
}


// 5. VERIFY EMAIL
export async function verifyEmailHandler(req: Request, res: Response) {
  const token = req.query.token as string;
  if (!token) {
    return res.status(400).send("Verification token is required.");
  }

  const user = await findUserByVerificationToken(token);
  if (!user) {
    return res.status(400).send("Invalid or expired email verification token.");
  }

  await updateUserById(user.id, {
    emailVerified: true,
    verificationToken: undefined
  });

  await insertActivity({
    userId: user.id,
    activityType: "EMAIL_VERIFIED",
    activityName: "Email Verified",
    description: `Email address verified for ${user.email}.`
  });

  const redirectUrl = `/?verified=true&email=${encodeURIComponent(user.email)}`;
  return res.redirect(redirectUrl);
}

// 6. FORGOT PASSWORD
export async function forgotPasswordHandler(req: Request, res: Response) {
  const { email } = req.body;
  const user = await findUserByEmail(email);

  // Always respond with success to prevent user enumeration attacks
  if (!user) {
    return res.status(200).json({
      success: true,
      message: "If an account exists with this email address, password reset instructions have been sent."
    });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  await updateUserById(user.id, {
    resetPasswordToken: resetToken,
    resetPasswordExpires: expiresAt
  });

  const appUrl = `${req.protocol}://${req.get("host") || "localhost:3000"}`;
  try {
    await sendPasswordResetEmail(user.email, resetToken, appUrl);
  } catch (err) {
    console.warn("[MAIL WARNING] Failed to deliver password reset email:", err);
  }

  return res.status(200).json({
    success: true,
    message: "If an account exists with this email address, password reset instructions have been sent.",
    resetLink: `${appUrl}/reset-password?token=${resetToken}`
  });
}

// 7. RESET PASSWORD
export async function resetPasswordHandler(req: Request, res: Response) {
  const { token, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      error: { code: "PASSWORD_MISMATCH", message: "Passwords do not match." }
    });
  }

  const user = await findUserByResetToken(token);
  if (!user) {
    return res.status(400).json({
      success: false,
      error: { code: "INVALID_RESET_TOKEN", message: "Reset token is invalid or has expired." }
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await updateUserById(user.id, {
    passwordHash,
    resetPasswordToken: undefined,
    resetPasswordExpires: undefined
  });

  // Invalidate all existing sessions on password reset for security
  await revokeAllUserSessions(user.id);

  await insertActivity({
    userId: user.id,
    activityType: "PASSWORD_RESET",
    activityName: "Password Changed",
    description: "User successfully reset account password."
  });

  return res.status(200).json({
    success: true,
    message: "Password reset successfully. You can now log in with your new password."
  });
}

// 8. GET ME / CURRENT USER
export async function getMeHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
  }

  const user = await findUserById(req.user.userId);
  if (!user) {
    return res.status(404).json({ success: false, error: { code: "USER_NOT_FOUND", message: "User not found" } });
  }

  return res.status(200).json({
    success: true,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      profilePhoto: user.profilePhoto,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    }
  });
}
