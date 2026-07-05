import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { Response } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "enterprise_super_secret_jwt_sign_key_98765";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "enterprise_super_secret_refresh_sign_key_12345";

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
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" }); // short-lived access token
}

// Generates refresh token
export function generateRefreshToken(payload: { userId: string }): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" }); // long-lived refresh token
}

// Verifies access token
export function verifyAccessToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// Verifies refresh token
export function verifyRefreshToken(token: string): any {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (err) {
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

// Transporter lazy loader to avoid crashes
let transporter: nodemailer.Transporter | null = null;

function getEmailTransporter(): nodemailer.Transporter {
  if (!transporter) {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "2525");
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      transporter = nodemailer.createTransport({
        host,
        port,
        auth: { user, pass }
      });
    } else {
      // Return a mock console logger transporter if not configured
      transporter = {
        sendMail: async (mailOptions: any) => {
          console.log("\n==============================================");
          console.log("📨 [CONSOLE EMAIL CARRIER OUTBOX]");
          console.log(`FROM: ${mailOptions.from}`);
          console.log(`TO: ${mailOptions.to}`);
          console.log(`SUBJECT: ${mailOptions.subject}`);
          console.log(`CONTENT LINK:`);
          console.log(mailOptions.text || mailOptions.html);
          console.log("==============================================\n");
          return { messageId: "console-fallback-" + Date.now() };
        }
      } as any;
    }
  }
  return transporter!;
}

// Sends account activation / email verification email
export async function sendVerificationEmail(email: string, token: string, appUrl: string) {
  const carrier = getEmailTransporter();
  const verifyLink = `${appUrl}/api/verify-email?token=${token}`;

  await carrier.sendMail({
    from: '"Recruiter AI Coach Support" <support@recruiter-ai-coach.local>',
    to: email,
    subject: "Verify Your Email Address - Recruiter AI Coach",
    text: `Welcome to Recruiter AI Coach!\n\nPlease click the following link to verify your email address:\n${verifyLink}\n\nThis link will expire in 24 hours.`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; rounded: 12px;">
        <h2 style="color: #6D5EF8;">Welcome to Recruiter AI Coach!</h2>
        <p>Please click the button below to verify your email address and activate your enterprise-grade account:</p>
        <div style="margin: 24px 0;">
          <a href="${verifyLink}" style="background-color: #6D5EF8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email Address</a>
        </div>
        <p style="font-size: 12px; color: #6b7280;">If you did not sign up for this account, please ignore this email.</p>
      </div>
    `
  });
}

// Sends password reset email
export async function sendResetEmail(email: string, token: string, appUrl: string) {
  const carrier = getEmailTransporter();
  const resetLink = `${appUrl}/reset-password?token=${token}`;

  await carrier.sendMail({
    from: '"Recruiter AI Coach Support" <support@recruiter-ai-coach.local>',
    to: email,
    subject: "Reset Your Password - Recruiter AI Coach",
    text: `You requested a password reset.\n\nPlease click the following link to choose a new password:\n${resetLink}\n\nThis link will expire in 1 hour.`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; rounded: 12px;">
        <h2 style="color: #6D5EF8;">Reset Your Password</h2>
        <p>You requested a password reset. Please click the button below to choose a new password for your account:</p>
        <div style="margin: 24px 0;">
          <a href="${resetLink}" style="background-color: #6D5EF8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 12px; color: #6b7280;">If you did not request this reset, please ignore this email.</p>
      </div>
    `
  });
}
