import { Request, Response, NextFunction } from "express";
import { ENV } from "../config/env";

export function centralErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = typeof err.statusCode === "number" ? err.statusCode : 500;
  const errorCode = err.code || "INTERNAL_SERVER_ERROR";
  const errorMessage = err.message || "An unexpected system error occurred.";

  // Safe structured error logging (omitting tokens/passwords)
  console.error(`[SERVER ERROR] [${req.method} ${req.path}] Status: ${statusCode} Code: ${errorCode}`, {
    message: err.message,
    stack: ENV.NODE_ENV === "development" ? err.stack : undefined
  });

  if (res.headersSent) {
    return next(err);
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: errorMessage,
      ...(ENV.NODE_ENV === "development" ? { debug: err.stack } : {})
    }
  });
}
