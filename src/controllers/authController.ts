import { Request, Response } from "express";
import { User } from "../models";
import {
  generateToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
} from "../utils/auth";
import { AuthenticatedRequest } from "../middleware/auth";
import logger from "../config/logger";
import twoFactorService from "../services/twoFactorService";
import { sendPasswordResetEmail } from "../services/emailService";
import crypto from "crypto";

// Register user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      email,
      password,
      role,
      phone,
      firstName,
      lastName,
      emergencyContactName,
      emergencyContactPhone,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email: email.toLowerCase() },
    });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
      return;
    }

    // Create user (password will be hashed automatically by the model hook)
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      role,
      phone,
      firstName,
      lastName,
      emergencyContactName,
      emergencyContactPhone,
      status: "active",
    });

    // Generate token
    const token = generateToken(user);

    logger.info(`User registered: ${email} (${role})`);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          role: user.role,
          status: user.status,
        },
        token,
      },
    });
  } catch (error) {
    logger.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, twoFactorCode } = req.body;

    // Find user
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    // Check if user is active
    if (user.status !== "active") {
      res.status(401).json({
        success: false,
        message: "Account is not active",
      });
      return;
    }

    // Check if account is locked
    if (user.isLocked()) {
      res.status(401).json({
        success: false,
        message:
          "Account is temporarily locked due to too many failed login attempts. Please try again later.",
      });
      return;
    }

    // Compare password using the model method
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment failed login attempts
      await user.incrementFailedLogins();
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    // Check if 2FA is enabled for this user
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        // 2FA is enabled but no code provided, indicate 2FA is required
        res.status(200).json({
          success: true,
          requires2FA: true,
          message: "Two-factor authentication code required",
        });
        return;
      }

      // Verify 2FA code
      const is2FAValid = await twoFactorService.verifyLogin2FA(
        user.id,
        twoFactorCode
      );
      if (!is2FAValid) {
        res.status(401).json({
          success: false,
          message: "Invalid two-factor authentication code",
        });
        return;
      }
    }

    // Reset failed login attempts on successful login
    await user.resetFailedLogins();

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate token
    const token = generateToken(user);

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          role: user.role,
          status: user.status,
          twoFactorEnabled: user.twoFactorEnabled,
        },
        token,
      },
    });
  } catch (error) {
    logger.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get current user profile
export const getProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;

    if (!authenticatedReq.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const user = authenticatedReq.user;

    res.json({
      success: true,
      message: "Profile retrieved successfully",
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          status: user.status,
          emergencyContactName: user.emergencyContactName,
          emergencyContactPhone: user.emergencyContactPhone,
          lastLogin: user.lastLogin,
          twoFactorEnabled: user.twoFactorEnabled,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    logger.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve profile",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Change password
export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;

    if (!authenticatedReq.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    const user = authenticatedReq.user;

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
      return;
    }

    // Update password (will be hashed automatically by the model hook)
    await user.update({ password: newPassword });

    logger.info(`Password changed for user: ${user.email}`);

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    logger.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update profile
export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;

    if (!authenticatedReq.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const {
      firstName,
      lastName,
      phone,
      emergencyContactName,
      emergencyContactPhone,
    } = req.body;
    const user = authenticatedReq.user;

    // Update user profile
    await user.update({
      firstName: firstName !== undefined ? firstName : user.firstName,
      lastName: lastName !== undefined ? lastName : user.lastName,
      phone: phone !== undefined ? phone : user.phone,
      emergencyContactName:
        emergencyContactName !== undefined
          ? emergencyContactName
          : user.emergencyContactName,
      emergencyContactPhone:
        emergencyContactPhone !== undefined
          ? emergencyContactPhone
          : user.emergencyContactPhone,
    });

    logger.info(`Profile updated for user: ${user.email}`);

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          status: user.status,
          emergencyContactName: user.emergencyContactName,
          emergencyContactPhone: user.emergencyContactPhone,
        },
      },
    });
  } catch (error) {
    logger.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Forgot password
export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    // Always return success message for security (don't reveal if email exists)
    if (!user) {
      res.status(200).json({
        success: true,
        message:
          "If an account with that email exists, you will receive a password reset link.",
      });
      return;
    }

    // Check if user is active
    if (user.status !== "active") {
      res.status(200).json({
        success: true,
        message:
          "If an account with that email exists, you will receive a password reset link.",
      });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Save reset token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Development logging for password reset token
    if (process.env.NODE_ENV === "development") {
      console.log("\n" + "🔐".repeat(40));
      console.log("🔑 PASSWORD RESET TOKEN GENERATED (Development Mode)");
      console.log("🔐".repeat(40));
      console.log(`📧 Email: ${user.email}`);
      console.log(`👤 User ID: ${user.id}`);
      console.log(`🎯 Token: ${resetToken}`);
      console.log(`⏰ Expires: ${resetTokenExpiry.toISOString()}`);
      console.log(`🕒 Local Time: ${resetTokenExpiry.toLocaleString()}`);
      console.log("🔐".repeat(40) + "\n");
    }

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken, user.firstName);
      logger.info(`Password reset email sent to: ${user.email}`);
    } catch (emailError) {
      logger.error("Error sending reset email:", emailError);
      // Clear the reset token if email fails
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      res.status(500).json({
        success: false,
        message: "Error sending reset email. Please try again later.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message:
        "If an account with that email exists, you will receive a password reset link.",
    });
  } catch (error) {
    logger.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error processing request",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Reset password
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    // Development logging for password reset attempt
    if (process.env.NODE_ENV === "development") {
      console.log("\n" + "🔄".repeat(40));
      console.log("🔄 PASSWORD RESET ATTEMPT (Development Mode)");
      console.log("🔄".repeat(40));
      console.log(`🎯 Token Received: ${token}`);
      console.log(`🕒 Attempt Time: ${new Date().toLocaleString()}`);
      console.log("🔄".repeat(40));
    }

    // Find user by reset token
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
      },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
      return;
    }

    // Check if token has expired
    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      // Clear expired token
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      res.status(400).json({
        success: false,
        message:
          "Reset token has expired. Please request a new password reset.",
      });
      return;
    }

    // Check if user is active
    if (user.status !== "active") {
      res.status(401).json({
        success: false,
        message: "Account is inactive. Please contact an administrator.",
      });
      return;
    }

    // Update password and clear reset token
    user.password = newPassword; // Will be hashed by model hooks
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    // Development logging for successful password reset
    if (process.env.NODE_ENV === "development") {
      console.log("\n" + "✅".repeat(40));
      console.log("✅ PASSWORD RESET SUCCESSFUL (Development Mode)");
      console.log("✅".repeat(40));
      console.log(`📧 Email: ${user.email}`);
      console.log(`👤 User ID: ${user.id}`);
      console.log(`🕒 Reset Time: ${new Date().toLocaleString()}`);
      console.log("💡 User can now login with new password!");
      console.log("✅".repeat(40) + "\n");
    }

    logger.info(`Password reset successful for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message:
        "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    logger.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error resetting password",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Setup 2FA
export const setup2FA = async (req: Request, res: Response): Promise<void> => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;

    if (!authenticatedReq.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const setupResult = await twoFactorService.setup2FA(
      authenticatedReq.user.id
    );

    res.status(200).json({
      success: true,
      message: "2FA setup initiated",
      data: setupResult,
    });
  } catch (error) {
    logger.error("Setup 2FA error:", error);
    res.status(500).json({
      success: false,
      message: "Server error setting up 2FA",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Enable 2FA
export const enable2FA = async (req: Request, res: Response): Promise<void> => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;

    if (!authenticatedReq.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const { token } = req.body;

    const result = await twoFactorService.enable2FA(
      authenticatedReq.user.id,
      token
    );

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
      return;
    }

    logger.info(`2FA enabled for user: ${authenticatedReq.user.email}`);

    res.status(200).json({
      success: true,
      message: "2FA enabled successfully",
      backupCodes: result.backupCodes,
    });
  } catch (error) {
    logger.error("Enable 2FA error:", error);
    res.status(500).json({
      success: false,
      message: "Server error enabling 2FA",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Disable 2FA
export const disable2FA = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;

    if (!authenticatedReq.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const { token } = req.body;

    const result = await twoFactorService.disable2FA(
      authenticatedReq.user.id,
      token
    );

    if (!result) {
      res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
      return;
    }

    logger.info(`2FA disabled for user: ${authenticatedReq.user.email}`);

    res.status(200).json({
      success: true,
      message: "2FA disabled successfully",
    });
  } catch (error) {
    logger.error("Disable 2FA error:", error);
    res.status(500).json({
      success: false,
      message: "Server error disabling 2FA",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get 2FA status
export const get2FAStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;

    if (!authenticatedReq.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const status = await twoFactorService.get2FAStatus(
      authenticatedReq.user.id
    );

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error("Get 2FA status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting 2FA status",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Logout (client-side token removal)
export const logout = async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    message: "Logout successful. Please remove the token from client storage.",
  });
};
