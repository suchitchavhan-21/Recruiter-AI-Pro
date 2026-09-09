import { Router } from "express";
import { 
  registerHandler, 
  getRegisterHandler,
  loginHandler, 
  getLoginHandler,
  logoutHandler, 
  refreshTokenHandler, 
  verifyEmailHandler,
  resendVerificationHandler, 
  forgotPasswordHandler, 
  getForgotPasswordHandler,
  resetPasswordHandler, 
  getResetPasswordHandler,
  getMeHandler,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { createRateLimiter } from "../middleware/security";
import { ENV } from "../config/env";

const authLimiter = createRateLimiter({
  windowMs: ENV.RATE_LIMIT_WINDOW_MS,
  max: ENV.RATE_LIMIT_MAX_AUTH,
  message: "Too many authentication attempts. Please wait 1 minute before trying again."
});

export const authRouter = Router();

// Modular /api/auth routes
authRouter.get("/register", getRegisterHandler);
authRouter.post("/register", authLimiter, validateBody(registerSchema), registerHandler);
authRouter.get("/login", getLoginHandler);
authRouter.post("/login", authLimiter, validateBody(loginSchema), loginHandler);
authRouter.post("/logout", requireAuth, logoutHandler);
authRouter.post("/refresh", authLimiter, refreshTokenHandler);
authRouter.get("/verify-email", verifyEmailHandler);
authRouter.get("/resend-verification", (req, res) => res.json({ success: true, message: "Use POST with { email } to resend verification email." }));
authRouter.post("/resend-verification", authLimiter, resendVerificationHandler);
authRouter.get("/forgot-password", getForgotPasswordHandler);
authRouter.post("/forgot-password", authLimiter, validateBody(forgotPasswordSchema), forgotPasswordHandler);
authRouter.get("/reset-password", getResetPasswordHandler);
authRouter.post("/reset-password", authLimiter, validateBody(resetPasswordSchema), resetPasswordHandler);
authRouter.get("/me", requireAuth, getMeHandler);
