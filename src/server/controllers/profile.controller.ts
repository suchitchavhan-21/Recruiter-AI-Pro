import { Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { 
  findUserById, 
  updateUserById, 
  deleteUserById, 
  listActivitiesByUserId, 
  listActiveSessionsByUserId, 
  revokeSessionById, 
  insertActivity 
} from "../db/repository";
import { AuthenticatedRequest, clearAuthCookies } from "../middleware/auth";

export const updateProfileSchema = z.object({
  fullName: z.string().min(1, "Full name must not be empty").optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  profilePhoto: z.string().optional().nullable(),
  currentPassword: z.string().optional().nullable(),
  newPassword: z.string().min(6, "New password must be at least 6 characters").optional().nullable()
});

export async function getProfileHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
  }

  const user = await findUserById(req.user.userId);
  if (!user) {
    return res.status(404).json({ success: false, error: { code: "USER_NOT_FOUND", message: "User not found." } });
  }

  const userObj = {
    id: user.id,
    fullName: user.fullName,
    name: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber || "",
    profilePhoto: user.profilePhoto,
    role: user.role,
    roleTitle: user.role === "admin" ? "System Administrator" : "Candidate Engineer",
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin
  };

  return res.status(200).json({
    success: true,
    user: userObj,
    ...userObj
  });
}

export async function updateProfileHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
  }

  const user = await findUserById(req.user.userId);
  if (!user) {
    return res.status(404).json({ success: false, error: { code: "USER_NOT_FOUND", message: "User not found." } });
  }

  const { fullName, phoneNumber, profilePhoto, currentPassword, newPassword } = req.body;
  const updates: Partial<typeof user> = {};

  if (typeof fullName === "string" && fullName.trim().length > 0) {
    updates.fullName = fullName.trim();
  }
  if (typeof phoneNumber === "string") {
    updates.phoneNumber = phoneNumber.trim();
  }
  if (typeof profilePhoto === "string" && profilePhoto.trim().length > 0) {
    updates.profilePhoto = profilePhoto.trim();
  }

  if (newPassword && typeof newPassword === "string" && newPassword.trim().length > 0) {
    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        error: { code: "PASSWORD_REQUIRED", message: "Current password is required to change password." }
      });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_CURRENT_PASSWORD", message: "Current password is incorrect." }
      });
    }

    updates.passwordHash = await bcrypt.hash(newPassword.trim(), 10);
  }

  const updatedUser = await updateUserById(user.id, updates);

  await insertActivity({
    userId: user.id,
    activityType: "PROFILE_UPDATED",
    activityName: "Profile Update",
    description: "User profile settings updated."
  });

  const finalUser = updatedUser || user;
  const userObj = {
    id: finalUser.id,
    fullName: finalUser.fullName,
    name: finalUser.fullName,
    email: finalUser.email,
    phoneNumber: finalUser.phoneNumber || "",
    profilePhoto: finalUser.profilePhoto,
    role: finalUser.role,
    roleTitle: finalUser.role === "admin" ? "System Administrator" : "Candidate Engineer",
    emailVerified: finalUser.emailVerified,
    updatedAt: finalUser.updatedAt
  };

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    user: userObj,
    ...userObj
  });
}

export async function deleteAccountHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
  }

  const userId = req.user.userId;
  await deleteUserById(userId);
  clearAuthCookies(res);

  return res.status(200).json({
    success: true,
    message: "Account and associated data deleted successfully."
  });
}

export async function getActivityHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
  }

  const activities = await listActivitiesByUserId(req.user.userId);
  return res.status(200).json({
    success: true,
    activities
  });
}

export async function getSessionsHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
  }

  const sessions = await listActiveSessionsByUserId(req.user.userId);
  return res.status(200).json({
    success: true,
    sessions: sessions.map(s => ({
      id: s.id,
      device: s.device,
      browser: s.browser,
      operatingSystem: s.operatingSystem,
      ipAddress: s.ipAddress,
      loginTime: s.loginTime,
      isActive: s.isActive
    }))
  });
}

export async function revokeSessionHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
  }

  const sessionId = req.params.id;
  if (!sessionId) {
    return res.status(400).json({ success: false, error: { code: "INVALID_ID", message: "Session ID is required." } });
  }

  const revoked = await revokeSessionById(sessionId, req.user.userId);
  if (!revoked) {
    return res.status(404).json({ success: false, error: { code: "SESSION_NOT_FOUND", message: "Session not found or already revoked." } });
  }

  return res.status(200).json({ success: true, message: "Session revoked." });
}
