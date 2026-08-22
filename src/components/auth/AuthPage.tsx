import React, { useState } from "react";
import { AuthBrandPanel } from "./AuthBrandPanel";
import { LoginForm } from "./LoginForm";
import { RegisterForm, COUNTRY_CODES } from "./RegisterForm";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { EmailVerification } from "./EmailVerification";
import { AuthService } from "../../features/auth/authService";
import { 
  AuthView, 
  LoginRequest, 
  RegisterRequest, 
  ForgotPasswordRequest, 
  ResetPasswordRequest,
  User 
} from "../../features/auth/authTypes";

export { COUNTRY_CODES };

export interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
  showNotification: (msg: string, type: "success" | "error" | "info") => void;
}

export function AuthPage({ onLoginSuccess, showNotification }: AuthPageProps) {
  const [view, setView] = useState<AuthView>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [registerErrors, setRegisterErrors] = useState<string[]>([]);
  const [forgotError, setForgotError] = useState("");
  const [resetError, setResetError] = useState("");
  
  // Recovery & verification state
  const [resetToken, setResetToken] = useState("");
  const [forgotSuccessNotice, setForgotSuccessNotice] = useState("");
  const [unverifiedUser, setUnverifiedUser] = useState<{ email: string; verificationLink?: string } | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState("");

  // 1. Handle Login
  const handleLogin = async (data: LoginRequest) => {
    setLoginError("");
    setIsLoading(true);
    try {
      const res = await AuthService.login(data);
      if (res.user) {
        showNotification(`Welcome back, ${res.user.fullName}!`, "success");
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      if (err.unverifiedUser) {
        setUnverifiedUser(err.unverifiedUser);
      }
      setLoginError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle Register
  const handleRegister = async (data: RegisterRequest) => {
    setRegisterErrors([]);
    setIsLoading(true);
    try {
      const res = await AuthService.register(data);
      showNotification("Account created successfully! Please verify your email.", "success");
      setTemporaryPassword(data.password);
      if (res.verificationLink) {
        setUnverifiedUser({
          email: data.email,
          verificationLink: res.verificationLink
        });
      }
      setView("login");
    } catch (err: any) {
      const msg = err.message || "Registration failed.";
      setRegisterErrors([msg]);
      showNotification(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Handle Instant Verify & Login
  const handleInstantVerifyAndLogin = async () => {
    if (!unverifiedUser?.verificationLink) return;
    setIsLoading(true);
    try {
      const url = new URL(unverifiedUser.verificationLink, window.location.origin);
      const token = url.searchParams.get("token");
      if (!token) throw new Error("Invalid verification token link.");

      const verified = await AuthService.verifyEmail(token);
      if (!verified) throw new Error("Email verification failed. Please log in manually.");

      showNotification("Email verified successfully! Logging you in...", "success");

      const loginRes = await AuthService.login({
        email: unverifiedUser.email,
        password: temporaryPassword || ""
      });

      if (loginRes.user) {
        setUnverifiedUser(null);
        onLoginSuccess(loginRes.user);
      }
    } catch (err: any) {
      showNotification(err.message || "Verification failed. Please sign in manually.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Handle Forgot Password
  const handleForgotPassword = async (data: ForgotPasswordRequest) => {
    setForgotError("");
    setIsLoading(true);
    try {
      const res = await AuthService.forgotPassword(data);
      if (res.resetToken) {
        setResetToken(res.resetToken);
        setForgotSuccessNotice("A password reset token has been issued and pre-filled below for your convenience.");
      } else {
        setForgotSuccessNotice("Password reset instructions have been dispatched to your email address.");
      }
      showNotification("Reset instructions generated.", "success");
      setView("reset");
    } catch (err: any) {
      setForgotError(err.message || "Failed to process password reset request.");
      showNotification(err.message || "Password reset failed.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Handle Reset Password
  const handleResetPassword = async (data: ResetPasswordRequest) => {
    setResetError("");
    if (data.password !== data.confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.resetPassword(data);
      showNotification("Password updated successfully. You can now sign in with your new password.", "success");
      setView("login");
    } catch (err: any) {
      setResetError(err.message || "Failed to update password.");
      showNotification(err.message || "Password update failed.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full glass-auth-root flex flex-col justify-center items-center p-3 sm:p-5 md:p-6 lg:p-8 xl:p-10 font-sans relative">
      
      {/* Ambient Lighting Orbs */}
      <div className="glass-auth-glow-1" />
      <div className="glass-auth-glow-2" />
      <div className="glass-auth-glow-3" />

      {/* Master Centered Glass Card */}
      <div className="w-full max-w-[1200px] my-auto glass-auth-container overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
        
        {/* Left Side: Brand Panel */}
        <div className="lg:col-span-5 flex flex-col">
          <AuthBrandPanel />
        </div>

        {/* Right Side: Dynamic Form Area */}
        <div className="lg:col-span-7 p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 flex flex-col justify-center items-center glass-form-panel">
          
          <div className="w-full max-w-[420px] space-y-6">
            
            {/* Unverified Email Action Banner */}
            {unverifiedUser && (
              <EmailVerification
                email={unverifiedUser.email}
                verificationLink={unverifiedUser.verificationLink}
                isLoading={isLoading}
                onVerifyAndLogin={handleInstantVerifyAndLogin}
                onDismiss={() => setUnverifiedUser(null)}
              />
            )}

            {/* View 1: Sign In Form */}
            {view === "login" && (
              <LoginForm
                isLoading={isLoading}
                errorMessage={loginError}
                onSubmit={handleLogin}
                onNavigateRegister={() => {
                  setLoginError("");
                  setView("register");
                }}
                onNavigateForgot={() => {
                  setLoginError("");
                  setView("forgot");
                }}
              />
            )}

            {/* View 2: Register Form */}
            {view === "register" && (
              <RegisterForm
                isLoading={isLoading}
                errors={registerErrors}
                onSubmit={handleRegister}
                onNavigateLogin={() => {
                  setRegisterErrors([]);
                  setView("login");
                }}
                onShowNotification={showNotification}
              />
            )}

            {/* View 3: Forgot Password Form */}
            {view === "forgot" && (
              <ForgotPasswordForm
                isLoading={isLoading}
                errorMessage={forgotError}
                onSubmit={handleForgotPassword}
                onNavigateLogin={() => {
                  setForgotError("");
                  setView("login");
                }}
              />
            )}

            {/* View 4: Reset Password Form */}
            {view === "reset" && (
              <ResetPasswordForm
                initialToken={resetToken}
                successNotice={forgotSuccessNotice}
                isLoading={isLoading}
                errorMessage={resetError}
                onSubmit={handleResetPassword}
                onNavigateLogin={() => {
                  setResetError("");
                  setView("login");
                }}
              />
            )}

          </div>

        </div>

      </div>

    </div>
  );
}

export default AuthPage;
