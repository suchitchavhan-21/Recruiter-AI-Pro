import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/authHelpers";
import { getUserById } from "../lib/dbHelpers";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: "candidate" | "admin";
  };
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token = req.cookies.access_token;

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      token = parts[1];
    }
  }
  
  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Please log in first." });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Session expired. Please log in again." });
  }

  try {
    const user = await getUserById(payload.userId);
    if (!user) {
      return res.status(401).json({ error: "User session invalid." });
    }
    
    if (user.accountStatus !== "active") {
      return res.status(403).json({ error: "User is deactivated or blocked." });
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role
    };
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(500).json({ error: "Authentication system failure." });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Administrative privileges required." });
  }
  next();
}
