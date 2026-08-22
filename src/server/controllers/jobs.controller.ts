import { Response } from "express";
import { z } from "zod";
import { 
  insertApplication, 
  listApplicationsByUserId, 
  updateApplicationStatus, 
  insertActivity, 
  generateUUID 
} from "../db/repository";
import { JobApplicationRecord } from "../db/schema";
import { AuthenticatedRequest } from "../middleware/auth";

export const applyJobSchema = z.object({
  company: z.string().min(1, "Company name is required."),
  role: z.string().min(1, "Role title is required."),
  roleCategory: z.string().optional(),
  applicantName: z.string().min(1, "Applicant name is required."),
  applicantEmail: z.string().email("Valid applicant email is required."),
  coverLetter: z.string().optional(),
  matchScore: z.number().optional(),
  notes: z.string().optional()
});

export const updateStatusSchema = z.object({
  status: z.enum(["Screening", "Interview Scheduled", "Rejected", "Offer Extended", "Submitted", "Offered", "Closed"])
});

export async function submitApplicationHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user?.userId) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
  }

  const { company, role, roleCategory, applicantName, applicantEmail, coverLetter, matchScore, notes } = req.body;

  const appRecord: JobApplicationRecord = {
    id: generateUUID(),
    userId: req.user.userId,
    company,
    role,
    roleCategory: roleCategory || "Engineering",
    applicantName,
    applicantEmail,
    status: "Submitted",
    coverLetter,
    matchScore: matchScore || 85,
    notes,
    appliedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await insertApplication(appRecord);

  await insertActivity({
    userId: req.user.userId,
    activityType: "JOB_APPLIED",
    activityName: "Job Application Submitted",
    description: `Submitted application for ${role} at ${company}.`,
    metadata: { company, role }
  });

  return res.status(201).json({
    success: true,
    message: "Application submitted successfully.",
    application: appRecord
  });
}

export async function listApplicationsHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user?.userId) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
  }

  const applications = await listApplicationsByUserId(req.user.userId);
  return res.status(200).json({
    success: true,
    applications
  });
}

export async function updateStatusHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user?.userId) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
  }

  const { id } = req.params;
  const { status } = req.body;

  const updated = await updateApplicationStatus(id, req.user.userId, status);
  if (!updated) {
    return res.status(404).json({
      success: false,
      error: { code: "APPLICATION_NOT_FOUND", message: "Application not found or unauthorized." }
    });
  }

  await insertActivity({
    userId: req.user.userId,
    activityType: "APPLICATION_STATUS_UPDATED",
    activityName: "Application Status Changed",
    description: `Application status updated to ${status}.`,
    metadata: { applicationId: id, newStatus: status }
  });

  return res.status(200).json({
    success: true,
    message: `Application status updated to ${status}.`
  });
}
