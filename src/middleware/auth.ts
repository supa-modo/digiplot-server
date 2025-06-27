import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models";

// Define interface for authenticated request
export interface AuthenticatedRequest extends Request {
  user: any;
}

// Middleware to authenticate user using JWT
export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({
        success: false,
        message: "No auth token, access denied",
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId?: string;
      id?: string;
      role: string;
    };

    // Find user (handle both userId and id for compatibility)
    const userId = decoded.userId || decoded.id;
    const user = await User.findByPk(userId);

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    if (user.status !== "active") {
      res.status(401).json({
        success: false,
        message: "User account is inactive",
      });
      return;
    }

    // Set user in request
    (req as AuthenticatedRequest).user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Token is invalid or expired",
    });
  }
};

// Middleware to check user roles
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!(req as AuthenticatedRequest).user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
      return;
    }

    if (!roles.includes((req as AuthenticatedRequest).user.role)) {
      res.status(403).json({
        success: false,
        message: "Forbidden: Insufficient permissions",
      });
      return;
    }

    next();
  };
};

// Specific role middleware shortcuts
export const adminOnly = authorizeRoles("admin");
export const landlordOrAdmin = authorizeRoles("landlord", "admin");
export const authenticatedUser = authorizeRoles("tenant", "landlord", "admin");

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
          userId?: string;
          id?: string;
        };

        const userId = decoded.userId || decoded.id;
        const user = await User.findByPk(userId);

        if (user && user.status === "active") {
          (req as AuthenticatedRequest).user = user;
        }
      } catch (error) {
        // Ignore errors for optional auth
      }
    }

    next();
  } catch (error) {
    next(); // Continue without authentication for optional auth
  }
};
