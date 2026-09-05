import { Router } from "express";
import {
  listCodingQuestionsHandler,
  getCodingQuestionByIdHandler,
  submitCodingSolutionHandler,
  getCodingAnalyticsHandler,
  submitCodeSchema
} from "../controllers/coding.controller";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { codingLimiter } from "../middleware/security";

export const codingRouter = Router();

codingRouter.use(requireAuth);

codingRouter.get("/questions", listCodingQuestionsHandler);
codingRouter.get("/questions/:id", getCodingQuestionByIdHandler);
codingRouter.post("/submit", codingLimiter, validateBody(submitCodeSchema), submitCodingSolutionHandler);
codingRouter.get("/analytics", getCodingAnalyticsHandler);
