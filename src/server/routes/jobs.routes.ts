import { Router } from "express";
import { 
  submitApplicationHandler, 
  listApplicationsHandler, 
  updateStatusHandler,
  applyJobSchema,
  updateStatusSchema
} from "../controllers/jobs.controller";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

export const jobsRouter = Router();

jobsRouter.use(requireAuth);

jobsRouter.post("/", validateBody(applyJobSchema), submitApplicationHandler);
jobsRouter.get("/", listApplicationsHandler);
jobsRouter.patch("/:id/status", validateBody(updateStatusSchema), updateStatusHandler);
