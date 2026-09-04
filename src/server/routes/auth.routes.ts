import { Router } from "express";
import { 
  registerHandler, 
  loginHandler, 
  logoutHandler, 
  refreshTokenHandler, 
  verifyEmailHandler, 
  forgotPasswordHandler, 
  resetPasswordHandler, 
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
authRouter.post("/register", authLimiter, validateBody(registerSchema), registerHandler);
authRouter.post("/login", authLimiter, validateBody(loginSchema), loginHandler);
authRouter.post("/logout", requireAuth, logoutHandler);
authRouter.post("/refresh", authLimiter, refreshTokenHandler);
authRouter.get("/verify-email", verifyEmailHandler);
authRouter.post("/forgot-password", authLimiter, validateBody(forgotPasswordSchema), forgotPasswordHandler);
authRouter.post("/reset-password", authLimiter, validateBody(resetPasswordSchema), resetPasswordHandler);
authRouter.get("/me", requireAuth, getMeHandler);
