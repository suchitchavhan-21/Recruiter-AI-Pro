import { UserProfile } from "../../types";

export interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  profilePhoto?: string;
  role: "candidate" | "admin";
  emailVerified: boolean;
  createdAt?: string;
  lastLogin?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  verificationLink?: string;
  resetLink?: string;
  resetToken?: string;
  unverifiedUser?: {
    email: string;
    verificationLink?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
  adminKey?: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  profilePhoto?: string;
  agreeTerms: boolean;
  adminKey?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface AuthError {
  code?: string;
  message: string;
}

export type AuthView = "login" | "register" | "forgot" | "reset" | "admin";
