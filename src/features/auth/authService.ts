import { apiFetch } from "../../lib/api";
import { 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  ForgotPasswordRequest, 
  ResetPasswordRequest 
} from "./authTypes";

export class AuthService {
  /**
   * Log in user with email & password (optional adminKey)
   */
  static async login(data: LoginRequest): Promise<AuthResponse> {
    const res = await apiFetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.email.trim(),
        password: data.password,
        adminKey: data.adminKey?.trim() || undefined
      })
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = body?.error?.message || body?.message || "Invalid email or password.";
      const errorObj = new Error(message) as Error & { code?: string; unverifiedUser?: any };
      errorObj.code = body?.error?.code;
      if (body?.unverifiedUser) {
        errorObj.unverifiedUser = body.unverifiedUser;
      }
      throw errorObj;
    }

    return body as AuthResponse;
  }

  /**
   * Register candidate or administrator account
   */
  static async register(data: RegisterRequest): Promise<AuthResponse> {
    const res = await apiFetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: data.fullName.trim(),
        email: data.email.toLowerCase().trim(),
        phoneNumber: data.phoneNumber.trim(),
        password: data.password,
        confirmPassword: data.confirmPassword,
        profilePhoto: data.profilePhoto,
        agreeTerms: data.agreeTerms,
        adminKey: data.adminKey?.trim() || undefined
      })
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = body?.error?.message || body?.message || "Registration failed.";
      const errorObj = new Error(message) as Error & { code?: string };
      errorObj.code = body?.error?.code;
      throw errorObj;
    }

    return body as AuthResponse;
  }

  /**
   * Request password reset instructions
   */
  static async forgotPassword(data: ForgotPasswordRequest): Promise<AuthResponse> {
    const res = await apiFetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.email.toLowerCase().trim()
      })
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = body?.error?.message || body?.message || "Failed to process password reset.";
      throw new Error(message);
    }

    return body as AuthResponse;
  }

  /**
   * Reset password with issued verification token
   */
  static async resetPassword(data: ResetPasswordRequest): Promise<AuthResponse> {
    const res = await apiFetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: data.token.trim(),
        password: data.password,
        confirmPassword: data.confirmPassword
      })
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = body?.error?.message || body?.message || "Failed to update password.";
      throw new Error(message);
    }

    return body as AuthResponse;
  }

  /**
   * Verify email address with token
   */
  static async verifyEmail(token: string): Promise<boolean> {
    const res = await apiFetch(`/api/verify-email?token=${encodeURIComponent(token)}`);
    return res.ok;
  }

  /**
   * Log out active session
   */
  static async logout(): Promise<void> {
    await apiFetch("/api/logout", { method: "POST" });
  }
}
