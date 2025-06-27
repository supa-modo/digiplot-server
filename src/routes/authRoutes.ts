import { Router } from "express";
import {
  register,
  login,
  getProfile,
  changePassword,
  updateProfile,
  logout,
  forgotPassword,
  resetPassword,
  setup2FA,
  enable2FA,
  disable2FA,
  get2FAStatus,
} from "../controllers/authController";
import { authenticateUser } from "../middleware/auth";
import { validate, authSchema } from "../middleware/validation";

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (landlord or tenant)
 * @access  Public
 */
router.post("/register", validate(authSchema.register), register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post("/login", validate(authSchema.login), login);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  "/forgot-password",
  validate(authSchema.forgotPassword),
  forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  "/reset-password",
  validate(authSchema.resetPassword),
  resetPassword
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/profile", authenticateUser, getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  "/profile",
  authenticateUser,
  validate(authSchema.updateProfile),
  updateProfile
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post(
  "/change-password",
  authenticateUser,
  validate(authSchema.changePassword),
  changePassword
);

/**
 * @route   POST /api/auth/2fa/setup
 * @desc    Setup 2FA (generate QR code)
 * @access  Private
 */
router.post("/2fa/setup", authenticateUser, setup2FA);

/**
 * @route   POST /api/auth/2fa/enable
 * @desc    Enable 2FA with verification
 * @access  Private
 */
router.post(
  "/2fa/enable",
  authenticateUser,
  validate(authSchema.enable2FA),
  enable2FA
);

/**
 * @route   POST /api/auth/2fa/disable
 * @desc    Disable 2FA with verification
 * @access  Private
 */
router.post(
  "/2fa/disable",
  authenticateUser,
  validate(authSchema.disable2FA),
  disable2FA
);

/**
 * @route   GET /api/auth/2fa/status
 * @desc    Get 2FA status for current user
 * @access  Private
 */
router.get("/2fa/status", authenticateUser, get2FAStatus);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post("/logout", authenticateUser, logout);

export default router;
