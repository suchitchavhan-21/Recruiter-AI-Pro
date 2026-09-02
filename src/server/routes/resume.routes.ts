import { Router } from "express";
import { 
  uploadAndScanResumeHandler, 
  listResumesHandler, 
  deleteResumeHandler,
  matchJDEvidenceHandler,
  parseJDDocumentHandler,
  resumeUploadMiddleware 
} from "../controllers/resume.controller";
import { requireAuth } from "../middleware/auth";
import { createRateLimiter } from "../middleware/security";
import { ENV } from "../config/env";

const aiLimiter = createRateLimiter({
  windowMs: ENV.RATE_LIMIT_WINDOW_MS,
  max: ENV.RATE_LIMIT_MAX_AI,
  message: "Resume scan rate limit reached. Please wait a moment before trying again."
});

export const resumeRouter = Router();

resumeRouter.use(requireAuth);

resumeRouter.post("/scan", aiLimiter, resumeUploadMiddleware, uploadAndScanResumeHandler);
resumeRouter.post("/upload", aiLimiter, resumeUploadMiddleware, uploadAndScanResumeHandler);
resumeRouter.post("/parse-jd", aiLimiter, resumeUploadMiddleware, parseJDDocumentHandler);
resumeRouter.post("/match-jd", aiLimiter, matchJDEvidenceHandler);
resumeRouter.get("/", listResumesHandler);
resumeRouter.delete("/:id", deleteResumeHandler);

