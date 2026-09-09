import { Request, Response, NextFunction } from "express";
import { ENV } from "../config/env";

export function centralErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = typeof err.statusCode === "number" ? err.statusCode : 500;
  const isProd = process.env.NODE_ENV === "production" || ENV.NODE_ENV === "production";
  const errorCode = err.code || (statusCode >= 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_FAILED");
  const rawMessage = err.message || "An unexpected system error occurred.";
  const errorMessage = (isProd && statusCode >= 500)
    ? "An unexpected system error occurred. Please try again later."
    : rawMessage;

  // Safe structured error logging (omitting tokens/passwords)
  console.error(`[SERVER ERROR] [${req.method} ${req.path}] Status: ${statusCode} Code: ${errorCode}`, {
    message: err.message,
    stack: !isProd ? err.stack : undefined
  });

  if (res.headersSent) {
    return next(err);
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: errorMessage,
      ...(!isProd ? { debug: err.stack } : {})
    }
  });
}
