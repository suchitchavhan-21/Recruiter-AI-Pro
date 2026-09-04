import { Router } from "express";
import { 
  analyzeJdHandler, 
  evaluateInterviewHandler, 
  generateDraftAnswerHandler, 
  evaluateStarHandler, 
  listInterviewsHandler, 
  getInterviewByIdHandler, 
  listStarStoriesHandler, 
  saveStarStoryHandler, 
  deleteStarStoryHandler,
  startAdaptiveInterviewHandler,
  processAdaptiveTurnHandler,
  getAdaptiveInterviewStateHandler,
  getCandidateMemoryHandler,
  analyzeJdSchema,
  evaluateInterviewSchema,
  evaluateStarSchema,
  saveStarSchema,
  startAdaptiveSchema,
  processTurnSchema
} from "../controllers/interview.controller";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { createRateLimiter } from "../middleware/security";
import { ENV } from "../config/env";

const aiLimiter = createRateLimiter({
  windowMs: ENV.RATE_LIMIT_WINDOW_MS,
  max: ENV.RATE_LIMIT_MAX_AI,
  message: "AI rate limit reached. Please wait a moment before sending additional requests."
});

export const interviewRouter = Router();

interviewRouter.use(requireAuth);

interviewRouter.post("/analyze-jd", aiLimiter, validateBody(analyzeJdSchema), analyzeJdHandler);
interviewRouter.post("/evaluate", aiLimiter, validateBody(evaluateInterviewSchema), evaluateInterviewHandler);
interviewRouter.post("/generate-draft-answer", aiLimiter, generateDraftAnswerHandler);
interviewRouter.post("/draft-answer", aiLimiter, generateDraftAnswerHandler);
interviewRouter.post("/evaluate-star", aiLimiter, validateBody(evaluateStarSchema), evaluateStarHandler);

// Adaptive Interview Orchestrator Endpoints
interviewRouter.post("/adaptive/start", aiLimiter, validateBody(startAdaptiveSchema), startAdaptiveInterviewHandler);
interviewRouter.post("/adaptive/turn", aiLimiter, validateBody(processTurnSchema), processAdaptiveTurnHandler);
interviewRouter.get("/adaptive/state/:sessionId", getAdaptiveInterviewStateHandler);
interviewRouter.get("/adaptive/session/:sessionId", getAdaptiveInterviewStateHandler);

// Static collection routes must precede parameterized /:id route to prevent route shadowing
interviewRouter.get("/candidate-memory", getCandidateMemoryHandler);
interviewRouter.get("/star-stories", listStarStoriesHandler);
interviewRouter.post("/star-stories", validateBody(saveStarSchema), saveStarStoryHandler);
interviewRouter.delete("/star-stories/:id", deleteStarStoryHandler);

interviewRouter.get("/", listInterviewsHandler);
interviewRouter.get("/history", listInterviewsHandler);
interviewRouter.get("/history/:id", getInterviewByIdHandler);
interviewRouter.get("/:id", getInterviewByIdHandler);

