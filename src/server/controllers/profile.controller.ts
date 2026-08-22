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
  fullName: z.string().min(2).optional(),
  phoneNumber: z.string().min(6).optional(),
  profilePhoto: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional()
});

export async function getProfileHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
  }

  const user = await findUserById(req.user.userId);
  if (!user) {
    return res.status(404).json({ success: false, error: { code: "USER_NOT_FOUND", message: "User not found." } });
  }

  return res.status(200).json({
    success: true,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      profilePhoto: user.profilePhoto,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    }
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

  if (fullName && fullName.trim()) {
    updates.fullName = fullName.trim();
  }
  if (phoneNumber && phoneNumber.trim()) {
    updates.phoneNumber = phoneNumber.trim();
  }
  if (profilePhoto && profilePhoto.trim()) {
    updates.profilePhoto = profilePhoto.trim();
  }

  if (newPassword) {
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

    updates.passwordHash = await bcrypt.hash(newPassword, 10);
  }

  const updatedUser = await updateUserById(user.id, updates);

  await insertActivity({
    userId: user.id,
    activityType: "PROFILE_UPDATED",
    activityName: "Profile Update",
    description: "User profile settings updated."
  });

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    user: {
      id: updatedUser?.id,
      fullName: updatedUser?.fullName,
      email: updatedUser?.email,
      phoneNumber: updatedUser?.phoneNumber,
      profilePhoto: updatedUser?.profilePhoto,
      role: updatedUser?.role,
      emailVerified: updatedUser?.emailVerified,
      updatedAt: updatedUser?.updatedAt
    }
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
  const sessionId = req.params.id;
  if (!sessionId) {
    return res.status(400).json({ success: false, error: { code: "INVALID_ID", message: "Session ID is required." } });
  }

  await revokeSessionById(sessionId);
  return res.status(200).json({ success: true, message: "Session revoked." });
}
