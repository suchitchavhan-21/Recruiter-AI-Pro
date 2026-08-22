import { Router } from "express";
import { getDashboardAnalyticsHandler } from "../controllers/analytics.controller";
import { requireAuth } from "../middleware/auth";

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth);

analyticsRouter.get("/dashboard", getDashboardAnalyticsHandler);
analyticsRouter.get("/", getDashboardAnalyticsHandler);
