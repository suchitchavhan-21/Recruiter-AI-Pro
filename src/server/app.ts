import express from "express";
import cookieParser from "cookie-parser";
import { applySecurityHeaders, applyCorsMiddleware, ttsLimiter } from "./middleware/security";
import { getTTSProvider } from "./voice/ttsProvider";
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
import { resolveInterviewerVoice } from "./voice/interviewerVoices";
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
import { 
  matchJDEvidenceHandler, 
  calculateATSScoreHandler 
} from "./controllers/resume.controller";

export function createExpressApp(): express.Application {
  const app = express();

  // Cloud Run executes behind Google Cloud load balancers and reverse proxies
  app.set("trust proxy", true);

  // Basic Body Parsers (1mb default; file uploads handled by dedicated route-level multer) & Cookie Parser
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(cookieParser());

  // Security Headers Middleware
  app.use(applySecurityHeaders);
  app.use(applyCorsMiddleware);

  // Minimal Liveness Probe
  app.get("/api/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString()
    });
  });

  // Comprehensive Readiness Probe
  app.get("/api/ready", async (_req, res) => {
    const dbHealth = await checkPostgresHealth();
    let vectorStoreMode = "dev_vector_memory";
    try {
      const vs = await getVectorStore();
      vectorStoreMode = vs.mode;
    } catch {
      vectorStoreMode = "error";
    }

    const isReady = dbHealth.ready || process.env.NODE_ENV !== "production";

    res.status(isReady ? 200 : 503).json({
      status: isReady ? "ready" : "degraded",
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
  // Canonical REST routes with documented backward-compatible aliases
  // ----------------------------------------------------
  app.use("/api/auth", authRouter);
  app.use("/api/profile", profileRouter);

  // Interviews: /api/interviews is canonical; /api/interview is alias for legacy frontend callers
  app.use("/api/interviews", interviewRouter);
  app.use("/api/interview", interviewRouter);

  // Resumes: /api/resumes is canonical; /api/resume is alias for legacy frontend callers
  app.use("/api/resumes", resumeRouter);
  app.use("/api/resume", resumeRouter);

  // Jobs: /api/jobs is canonical; /api/applications is alias for legacy frontend callers
  app.use("/api/jobs", jobsRouter);
  app.use("/api/applications", jobsRouter);

  app.use("/api/analytics", analyticsRouter);
  app.use("/api/admin", adminRouter);

  // ----------------------------------------------------
  // AUTHORITATIVE PERSONA NEURAL TTS AUDIO STREAMING ENDPOINT
  // Strict persona-to-voice mapping:
  // - Sarah Jenkins (persona=0): Salli (Female, US Executive)
  // - David Chen (persona=1): Matthew (Male, US Technical Architect)
  // - Marcus Brody (persona=2): Brian (Male, UK Engineering Leadership)
  // ----------------------------------------------------
  app.get("/api/tts", ttsLimiter, async (req, res) => {
    try {
      const text = String(req.query.text || "").trim();
      if (!text) {
        return res.status(400).json({ error: "Text parameter is required" });
      }
      if (text.length > 1000) {
        return res.status(400).json({ 
          error: "OVERSIZED_TEXT", 
          message: "Text exceeds maximum allowed length of 1000 characters" 
        });
      }

      // 1. Authoritative Persona Resolution
      let personaConfig;
      try {
        personaConfig = resolveInterviewerVoice(req.query.persona);
      } catch (personaErr: any) {
        return res.status(400).json({ error: personaErr.message });
      }

      // 2. Reject conflicting client-provided voice parameters
      const voiceParam = req.query.voice ? String(req.query.voice).trim() : null;
      if (voiceParam && voiceParam.toLowerCase() !== personaConfig.voiceId.toLowerCase()) {
        return res.status(400).json({
          error: `VOICE_CONFLICT: Voice '${voiceParam}' conflicts with persona ${personaConfig.personaId} (${personaConfig.personaName}). Authoritative voice is '${personaConfig.voiceId}'`
        });
      }

      const selectedVoice = personaConfig.voiceId;
      const personaShortName = personaConfig.personaName.split(" ")[0]; // "Sarah" | "David" | "Marcus"

      // 3. Robust Synthesis via Active TTS Provider
      let audioBuffer: Buffer;
      try {
        const ttsProvider = getTTSProvider();
        audioBuffer = await ttsProvider.synthesizeSpeech(text, selectedVoice);
      } catch (synthErr: any) {
        console.error(`[TTS UNAVAILABLE]: Persona '${personaConfig.personaName}' voice '${selectedVoice}' failed:`, synthErr?.message);
        return res.status(503).json({
          error: "TTS_UNAVAILABLE",
          message: `Speech synthesis currently unavailable for ${personaConfig.personaName} (voice: ${selectedVoice})`
        });
      }

      // 4. Response with Authoritative Headers (private, no-cache to avoid leaking sensitive candidate interview Q/A)
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Length", audioBuffer.byteLength);
      res.setHeader("Cache-Control", "private, no-cache, no-store");
      res.setHeader("Access-Control-Expose-Headers", "X-TTS-Voice, X-TTS-Persona");
      res.setHeader("X-TTS-Voice", selectedVoice);
      res.setHeader("X-TTS-Persona", personaShortName);
      return res.status(200).send(audioBuffer);
    } catch (err: any) {
      console.error("[TTS FATAL ERROR]:", err);
      return res.status(500).json({ error: "Internal server error during speech synthesis" });
    }
  });

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
  app.get("/api/interview/history", requireAuth, listInterviewsHandler);
  app.post("/api/analyze-jd", requireAuth, validateBody(analyzeJdSchema), analyzeJdHandler);
  app.post("/api/evaluate-interview", requireAuth, validateBody(evaluateInterviewSchema), evaluateInterviewHandler);
  app.post("/api/generate-draft-answer", requireAuth, generateDraftAnswerHandler);
  app.post("/api/evaluate-star", requireAuth, validateBody(evaluateStarSchema), evaluateStarHandler);
  app.get("/api/star-stories", requireAuth, listStarStoriesHandler);
  app.post("/api/star-stories", requireAuth, validateBody(saveStarSchema), saveStarStoryHandler);
  app.delete("/api/star-stories/:id", requireAuth, deleteStarStoryHandler);
  app.get("/api/interview/star-stories", requireAuth, listStarStoriesHandler);
  app.post("/api/interview/star-stories", requireAuth, validateBody(saveStarSchema), saveStarStoryHandler);
  app.delete("/api/interview/star-stories/:id", requireAuth, deleteStarStoryHandler);

  // Adaptive Interview Bridges
  app.post("/api/interview/adaptive/start", requireAuth, validateBody(startAdaptiveSchema), startAdaptiveInterviewHandler);
  app.post("/api/interview/adaptive/turn", requireAuth, validateBody(processTurnSchema), processAdaptiveTurnHandler);
  app.get("/api/interview/adaptive/state/:sessionId", requireAuth, getAdaptiveInterviewStateHandler);

  // Resume Bridges
  app.post("/api/scan-resume", requireAuth, resumeUploadMiddleware, uploadAndScanResumeHandler);
  app.post("/api/resumes", requireAuth, resumeUploadMiddleware, uploadAndScanResumeHandler);
  app.post("/api/resumes/match-jd", requireAuth, matchJDEvidenceHandler);
  app.post("/api/resumes/ats-score", requireAuth, calculateATSScoreHandler);
  app.get("/api/resumes", requireAuth, listResumesHandler);
  app.delete("/api/resumes/:id", requireAuth, deleteResumeHandler);

  // Job Application Bridges
  app.post("/api/applications", requireAuth, validateBody(applyJobSchema), submitApplicationHandler);
  app.get("/api/applications", requireAuth, listApplicationsHandler);
  app.patch("/api/applications/:id/status", requireAuth, validateBody(updateStatusSchema), updateStatusHandler);
  app.post("/api/jobs", requireAuth, validateBody(applyJobSchema), submitApplicationHandler);
  app.get("/api/jobs", requireAuth, listApplicationsHandler);
  app.patch("/api/jobs/:id/status", requireAuth, validateBody(updateStatusSchema), updateStatusHandler);

  // Analytics Bridges
  app.get("/api/dashboard", requireAuth, getDashboardAnalyticsHandler);
  app.get("/api/analytics/dashboard", requireAuth, getDashboardAnalyticsHandler);

  // 404 handler for undefined API routes
  app.all("/api/*", (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: "API_NOT_FOUND",
        message: `API endpoint not found: ${req.method} ${req.path}`
      }
    });
  });

  // Centralized Error Handling Middleware
  app.use(centralErrorHandler);

  return app;
}
