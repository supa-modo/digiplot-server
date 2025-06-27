import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";

// Custom error class for API errors
export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Centralized error handling middleware
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default error values
  let statusCode = 500;
  let message = "Internal Server Error";
  let errorDetails = null;

  // Check if this is a known API error
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else {
    // For unknown errors, hide details in production
    message = err.message || "Internal Server Error";
    if (process.env.NODE_ENV === "development") {
      errorDetails = {
        stack: err.stack,
        name: err.name,
      };
    }
  }

  // Log the error
  logger.error(`[ERROR] ${statusCode} - ${message}`, err.stack || "");

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    error: errorDetails,
  });
};

// Not Found error handler
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};
