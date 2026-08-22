import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message
        }));

        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: issues[0]?.message || "Invalid request payload parameters.",
            details: issues
          }
        });
      }
      return res.status(400).json({
        success: false,
        error: {
          code: "MALFORMED_REQUEST",
          message: "Request payload could not be validated."
        }
      });
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: "QUERY_VALIDATION_ERROR",
            message: error.issues[0]?.message || "Invalid query parameters.",
            details: error.issues
          }
        });
      }
      return res.status(400).json({
        success: false,
        error: {
          code: "MALFORMED_QUERY",
          message: "Query parameters could not be validated."
        }
      });
    }
  };
}
