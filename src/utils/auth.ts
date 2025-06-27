import jwt from "jsonwebtoken";
import { UserAttributes } from "../models/User";

// JWT payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Generate JWT token
export const generateToken = (user: Partial<UserAttributes>): string => {
  const payload: JWTPayload = {
    userId: user.id!,
    email: user.email!,
    role: user.role!,
  };

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  return jwt.sign(payload, secret, { expiresIn: "24h" });
};

// Verify JWT token
export const verifyToken = (token: string): JWTPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  try {
    return jwt.verify(token, secret) as JWTPayload;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

// Generate password reset token
export const generatePasswordResetToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  return jwt.sign(
    { type: "password_reset", userId, timestamp: Date.now() },
    secret,
    { expiresIn: "1h" }
  );
};

// Verify password reset token
export const verifyPasswordResetToken = (
  token: string
): { userId: string } | null => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, secret) as any;
    if (decoded.type === "password_reset" && decoded.userId) {
      return { userId: decoded.userId };
    }
    return null;
  } catch (error) {
    return null;
  }
};
