import nodemailer from "nodemailer";
import { ENV } from "../config/env";

let transporter: nodemailer.Transporter | null = null;

function getEmailTransporter(): nodemailer.Transporter {
  if (!transporter) {
    if (ENV.SMTP_HOST && ENV.SMTP_USER && ENV.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: ENV.SMTP_HOST,
        port: ENV.SMTP_PORT,
        auth: {
          user: ENV.SMTP_USER,
          pass: ENV.SMTP_PASS
        }
      });
    } else {
      // Safe fallback console transporter for development / testing
      transporter = {
        sendMail: async (mailOptions: any) => {
          console.log("\n==============================================");
          console.log("📨 [SECURE EMAIL DISPATCH OUTBOX]");
          console.log(`FROM: ${mailOptions.from}`);
          console.log(`TO: ${mailOptions.to}`);
          console.log(`SUBJECT: ${mailOptions.subject}`);
          console.log(`CONTENT LINK:`);
          console.log(mailOptions.text || mailOptions.html);
          console.log("==============================================\n");
          return { messageId: "console-dispatch-" + Date.now() };
        }
      } as any;
    }
  }
  return transporter!;
}

export async function sendVerificationEmail(email: string, token: string, appUrl: string): Promise<void> {
  const carrier = getEmailTransporter();
  const verifyLink = `${appUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

  await carrier.sendMail({
    from: '"Recruiter AI Coach" <noreply@recruiter-ai-pro.local>',
    to: email,
    subject: "Verify Your Email Address - Recruiter AI Pro",
    text: `Welcome to Recruiter AI Pro!\n\nPlease click the following link to verify your email address:\n${verifyLink}\n\nThis verification link will expire in 24 hours.`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #334155; border-radius: 16px; background-color: #0f172a; color: #f8fafc;">
        <h2 style="color: #6366f1; margin-bottom: 12px;">Welcome to Recruiter AI Pro</h2>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">Please confirm your email address to activate full access to your personalized AI interview boardroom and ATS resume optimization engine:</p>
        <div style="margin: 24px 0;">
          <a href="${verifyLink}" style="background-color: #6366f1; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Verify Email Address</a>
        </div>
        <p style="font-size: 12px; color: #64748b;">If you did not create this account, you can safely disregard this message.</p>
      </div>
    `
  });
}

export async function sendPasswordResetEmail(email: string, token: string, appUrl: string): Promise<void> {
  const carrier = getEmailTransporter();
  const resetLink = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;

  await carrier.sendMail({
    from: '"Recruiter AI Coach" <noreply@recruiter-ai-pro.local>',
    to: email,
    subject: "Password Reset Request - Recruiter AI Pro",
    text: `You requested a password reset.\n\nPlease click the following link to choose a new password:\n${resetLink}\n\nThis reset link will expire in 1 hour.`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #334155; border-radius: 16px; background-color: #0f172a; color: #f8fafc;">
        <h2 style="color: #6366f1; margin-bottom: 12px;">Reset Your Password</h2>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">We received a request to reset your password. Click the button below to establish your new secure credentials:</p>
        <div style="margin: 24px 0;">
          <a href="${resetLink}" style="background-color: #6366f1; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 12px; color: #64748b;">If you did not request a password reset, please contact security immediately.</p>
      </div>
    `
  });
}
