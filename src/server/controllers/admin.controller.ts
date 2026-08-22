import { Response } from "express";
import bcrypt from "bcryptjs";
import { 
  listAllUsers, 
  findUserById, 
  updateUserById, 
  deleteUserById, 
  listAllActivities, 
  resetDatabaseState, 
  insertAuditLog, 
  insertActivity 
} from "../db/repository";
import { AuthenticatedRequest } from "../middleware/auth";
import { ENV } from "../config/env";

// 1. LIST ALL USERS
export async function adminListUsersHandler(req: AuthenticatedRequest, res: Response) {
  const users = await listAllUsers();

  return res.status(200).json({
    success: true,
    users: users.map(u => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      phoneNumber: u.phoneNumber,
      profilePhoto: u.profilePhoto,
      role: u.role,
      emailVerified: u.emailVerified,
      accountStatus: u.accountStatus,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin
    }))
  });
}

// 2. TOGGLE USER STATUS (DEACTIVATE / ACTIVATE)
export async function adminToggleUserStatusHandler(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { status } = req.body; // "active" | "inactive" | "blocked"

  const user = await findUserById(id);
  if (!user) {
    return res.status(404).json({ success: false, error: { code: "USER_NOT_FOUND", message: "User not found." } });
  }

  // Prevent admin self-deactivation
  if (user.id === req.user?.userId) {
    return res.status(400).json({
      success: false,
      error: { code: "CANNOT_DEACTIVATE_SELF", message: "You cannot deactivate your own administrative account." }
    });
  }

  const updated = await updateUserById(id, { accountStatus: status || "inactive" });

  await insertAuditLog({
    adminUserId: req.user!.userId,
    adminEmail: req.user!.email,
    action: "USER_STATUS_CHANGE",
    targetUserId: id,
    details: `Changed account status of ${user.email} to ${status || "inactive"}.`,
    ipAddress: req.ip || "127.0.0.1"
  });

  return res.status(200).json({
    success: true,
    message: `Account status updated to ${status}.`,
    user: updated
  });
}

// 3. ADMIN RESET USER PASSWORD
export async function adminResetUserPasswordHandler(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      error: { code: "INVALID_PASSWORD", message: "New password must be at least 8 characters." }
    });
  }

  const user = await findUserById(id);
  if (!user) {
    return res.status(404).json({ success: false, error: { code: "USER_NOT_FOUND", message: "User not found." } });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await updateUserById(id, { passwordHash });

  await insertAuditLog({
    adminUserId: req.user!.userId,
    adminEmail: req.user!.email,
    action: "ADMIN_RESET_PASSWORD",
    targetUserId: id,
    details: `Admin reset password for ${user.email}.`,
    ipAddress: req.ip || "127.0.0.1"
  });

  return res.status(200).json({
    success: true,
    message: `Password reset successfully for ${user.email}.`
  });
}

// 4. ADMIN DELETE USER
export async function adminDeleteUserHandler(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;

  if (id === req.user?.userId) {
    return res.status(400).json({
      success: false,
      error: { code: "CANNOT_DELETE_SELF", message: "You cannot delete your own administrative account." }
    });
  }

  const user = await findUserById(id);
  if (!user) {
    return res.status(404).json({ success: false, error: { code: "USER_NOT_FOUND", message: "User not found." } });
  }

  await deleteUserById(id);

  await insertAuditLog({
    adminUserId: req.user!.userId,
    adminEmail: req.user!.email,
    action: "ADMIN_DELETE_USER",
    targetUserId: id,
    details: `Deleted user ${user.email} (${user.id}).`,
    ipAddress: req.ip || "127.0.0.1"
  });

  return res.status(200).json({
    success: true,
    message: `User ${user.email} has been permanently deleted.`
  });
}

// 5. LIST SYSTEM AUDIT LOGS & ACTIVITIES
export async function adminListActivitiesHandler(req: AuthenticatedRequest, res: Response) {
  const activities = await listAllActivities();

  return res.status(200).json({
    success: true,
    activities
  });
}

// 6. RESET DEMO DATABASE
export async function adminResetDatabaseHandler(req: AuthenticatedRequest, res: Response) {
  await resetDatabaseState(req.user?.userId);

  await insertAuditLog({
    adminUserId: req.user!.userId,
    adminEmail: req.user!.email,
    action: "DATABASE_RESET",
    details: "Admin triggered complete test database reset.",
    ipAddress: req.ip || "127.0.0.1"
  });

  return res.status(200).json({
    success: true,
    message: "Test database reset successfully. Active admin account preserved."
  });
}

// 7. VERIFY ADMIN PASSCODE
export async function verifyAdminPasscodeHandler(req: AuthenticatedRequest, res: Response) {
  const { passcode } = req.body;
  if (!passcode || !ENV.ADMIN_PASSCODE) {
    return res.status(400).json({ success: false, error: { code: "PASSCODE_REQUIRED", message: "Passcode required." } });
  }

  if (passcode.trim() === ENV.ADMIN_PASSCODE.trim()) {
    if (req.user?.userId) {
      await updateUserById(req.user.userId, { role: "admin" });
    }
    return res.status(200).json({ success: true, message: "Administrative authorization confirmed." });
  }

  return res.status(403).json({ success: false, error: { code: "INVALID_PASSCODE", message: "Invalid administrator passcode." } });
}
