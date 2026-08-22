import { Router } from "express";
import { 
  getProfileHandler, 
  updateProfileHandler, 
  deleteAccountHandler, 
  getActivityHandler, 
  getSessionsHandler, 
  revokeSessionHandler,
  updateProfileSchema
} from "../controllers/profile.controller";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

export const profileRouter = Router();

profileRouter.use(requireAuth);

profileRouter.get("/", getProfileHandler);
profileRouter.put("/", validateBody(updateProfileSchema), updateProfileHandler);
profileRouter.delete("/account", deleteAccountHandler);
profileRouter.get("/activity", getActivityHandler);
profileRouter.get("/sessions", getSessionsHandler);
profileRouter.delete("/sessions/:id", revokeSessionHandler);
