import { Router } from "express";
import { 
  adminListUsersHandler, 
  adminToggleUserStatusHandler, 
  adminResetUserPasswordHandler, 
  adminDeleteUserHandler, 
  adminListActivitiesHandler, 
  adminResetDatabaseHandler,
  verifyAdminPasscodeHandler
} from "../controllers/admin.controller";
import { requireAuth, requireAdmin } from "../middleware/auth";

export const adminRouter = Router();

// Password check endpoint can be called by any authenticated user trying to elevate
adminRouter.post("/passcode", requireAuth, verifyAdminPasscodeHandler);

// All other admin routes require explicit admin role
adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/users", adminListUsersHandler);
adminRouter.post("/users/:id/status", adminToggleUserStatusHandler);
adminRouter.post("/users/:id/reset-password", adminResetUserPasswordHandler);
adminRouter.delete("/users/:id", adminDeleteUserHandler);
adminRouter.get("/activities", adminListActivitiesHandler);
adminRouter.post("/reset", adminResetDatabaseHandler);
