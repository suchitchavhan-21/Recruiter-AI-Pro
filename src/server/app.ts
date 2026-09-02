import express from "express";
import cookieParser from "cookie-parser";
import { applySecurityHeaders } from "./middleware/security";
import { centralErrorHandler } from "./middleware/errorHandler";
import { authRouter } from "./routes/auth.routes";
import { profileRouter } from "./routes/profile.routes";
import { interviewRouter } from "./routes/interview.routes";
import { resumeRouter } from "./routes/resume.routes";
import { jobsRouter } from "./routes/jobs.routes";
import { analyticsRouter } from "./routes/analytics.routes";
import { adminRouter } from "./routes/admin.routes";

// Import legacy handler bridges for 100% backward compatibility with all client components
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
} from "./controllers/auth.controller";
import { 
  analyzeJdHandler, 
  evaluateInterviewHandler, 
  generateDraftAnswerHandler, 
  evaluateStarHandler, 
  listInterviewsHandler,
  listStarStoriesHandler, 
  saveStarStoryHandler, 
  deleteStarStoryHandler,
  analyzeJdSchema,
  evaluateInterviewSchema,
  evaluateStarSchema,
  saveStarSchema
} from "./controllers/interview.controller";
import { 
  uploadAndScanResumeHandler, 
  listResumesHandler, 
  deleteResumeHandler, 
  resumeUploadMiddleware 
} from "./controllers/resume.controller";
import { 
  submitApplicationHandler, 
  listApplicationsHandler, 
  updateStatusHandler,
  applyJobSchema,
  updateStatusSchema
} from "./controllers/jobs.controller";
import { getDashboardAnalyticsHandler } from "./controllers/analytics.controller";
import { 
  getProfileHandler, 
  updateProfileHandler, 
  deleteAccountHandler, 
  getActivityHandler, 
  getSessionsHandler, 
  revokeSessionHandler,
  updateProfileSchema
} from "./controllers/profile.controller";
import { requireAuth } from "./middleware/auth";
import { validateBody } from "./middleware/validate";
import { checkPostgresHealth } from "./db/postgres";
import { getVectorStore } from "./ai/vectorStore";
import { getActiveEmbeddingModel } from "./ai/embeddings/provider";
import { ENV } from "./config/env";
import { 
  startAdaptiveInterviewHandler, 
  processAdaptiveTurnHandler, 
  getAdaptiveInterviewStateHandler,
  startAdaptiveSchema,
  processTurnSchema
} from "./controllers/interview.controller";
import { matchJDEvidenceHandler } from "./controllers/resume.controller";

export function createExpressApp(): express.Application {
  const app = express();

  // Basic Body Parsers & Cookie Parser
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ extended: true, limit: "20mb" }));
  app.use(cookieParser());

  // Security Headers Middleware
  app.use(applySecurityHeaders);

  // Comprehensive Health Check Endpoint
  app.get("/api/health", async (req, res) => {
    const dbHealth = await checkPostgresHealth();
    let vectorStoreMode = "dev_vector_memory";
    try {
      const vs = await getVectorStore();
      vectorStoreMode = vs.mode;
    } catch {
      vectorStoreMode = "error";
    }

    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "Recruiter AI Pro Engine",
      environment: process.env.NODE_ENV || ENV.NODE_ENV || "development",
      persistence: {
        database: dbHealth.ready ? "postgresql" : "file_json",
        pgvector: dbHealth.pgvector,
        vectorStore: vectorStoreMode
      },
      ai: {
        geminiConfigured: !!ENV.GEMINI_API_KEY,
        embeddingModel: getActiveEmbeddingModel()
      }
    });
  });

  // ----------------------------------------------------
  // PRIMARY MODULAR ROUTERS
  // ----------------------------------------------------
  app.use("/api/auth", authRouter);
  app.use("/api/profile", profileRouter);
  app.use("/api/interviews", interviewRouter);
  app.use("/api/interview", interviewRouter);
  app.use("/api/resumes", resumeRouter);
  app.use("/api/resume", resumeRouter);
  app.use("/api/applications", jobsRouter);
  app.use("/api/analytics", analyticsRouter);
  app.use("/api/admin", adminRouter);

  // ----------------------------------------------------
  // DIRECT BACKWARD-COMPATIBLE API BRIDGES
  // (Guarantees every frontend button & fetch url continues working instantly)
  // ----------------------------------------------------
  // Auth Bridges
  app.post("/api/register", validateBody(registerSchema), registerHandler);
  app.post("/api/login", validateBody(loginSchema), loginHandler);
  app.post("/api/logout", requireAuth, logoutHandler);
  app.post("/api/refresh-token", refreshTokenHandler);
  app.get("/api/verify-email", verifyEmailHandler);
  app.post("/api/forgot-password", validateBody(forgotPasswordSchema), forgotPasswordHandler);
  app.post("/api/reset-password", validateBody(resetPasswordSchema), resetPasswordHandler);
  app.get("/api/me", requireAuth, getMeHandler);

  // Profile Bridges
  app.get("/api/profile", requireAuth, getProfileHandler);
  app.put("/api/profile", requireAuth, validateBody(updateProfileSchema), updateProfileHandler);
  app.delete("/api/account", requireAuth, deleteAccountHandler);
  app.get("/api/activity", requireAuth, getActivityHandler);
  app.get("/api/sessions", requireAuth, getSessionsHandler);
  app.delete("/api/sessions/:id", requireAuth, revokeSessionHandler);

  // Interview & AI Bridges
  app.get("/api/interviews", requireAuth, listInterviewsHandler);
  app.get("/api/interviews/history", requireAuth, listInterviewsHandler);
  app.post("/api/analyze-jd", requireAuth, validateBody(analyzeJdSchema), analyzeJdHandler);
  app.post("/api/evaluate-interview", requireAuth, validateBody(evaluateInterviewSchema), evaluateInterviewHandler);
  app.post("/api/generate-draft-answer", requireAuth, generateDraftAnswerHandler);
  app.post("/api/evaluate-star", requireAuth, validateBody(evaluateStarSchema), evaluateStarHandler);
  app.get("/api/star-stories", requireAuth, listStarStoriesHandler);
  app.post("/api/star-stories", requireAuth, validateBody(saveStarSchema), saveStarStoryHandler);
  app.delete("/api/star-stories/:id", requireAuth, deleteStarStoryHandler);

  // Adaptive Interview Bridges
  app.post("/api/interview/adaptive/start", requireAuth, validateBody(startAdaptiveSchema), startAdaptiveInterviewHandler);
  app.post("/api/interview/adaptive/turn", requireAuth, validateBody(processTurnSchema), processAdaptiveTurnHandler);
  app.get("/api/interview/adaptive/state/:sessionId", requireAuth, getAdaptiveInterviewStateHandler);

  // Resume Bridges
  app.post("/api/scan-resume", requireAuth, resumeUploadMiddleware, uploadAndScanResumeHandler);
  app.post("/api/resumes", requireAuth, resumeUploadMiddleware, uploadAndScanResumeHandler);
  app.post("/api/resumes/match-jd", requireAuth, matchJDEvidenceHandler);
  app.get("/api/resumes", requireAuth, listResumesHandler);
  app.get("/api/resumes", requireAuth, listResumesHandler);
  app.delete("/api/resumes/:id", requireAuth, deleteResumeHandler);

  // Job Application Bridges
  app.post("/api/applications", requireAuth, validateBody(applyJobSchema), submitApplicationHandler);
  app.get("/api/applications", requireAuth, listApplicationsHandler);
  app.patch("/api/applications/:id/status", requireAuth, validateBody(updateStatusSchema), updateStatusHandler);

  // Analytics Bridges
  app.get("/api/dashboard", requireAuth, getDashboardAnalyticsHandler);

  // Centralized Error Handling Middleware
  app.use(centralErrorHandler);

  return app;
}
