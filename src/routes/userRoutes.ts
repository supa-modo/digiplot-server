import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  reactivateUser,
  resetUserPassword,
  getUserStats,
} from "../controllers/userController";
import { authenticateUser, adminOnly } from "../middleware/auth";
import { validate, userSchema } from "../middleware/validation";

const router = Router();

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filtering (Admin only)
 * @access  Private (Admin)
 * @query   page, limit, search, role, status
 */
router.get("/", authenticateUser, adminOnly, getAllUsers);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics (Admin only)
 * @access  Private (Admin)
 */
router.get("/stats", authenticateUser, adminOnly, getUserStats);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID (Admin only)
 * @access  Private (Admin)
 */
router.get("/:id", authenticateUser, adminOnly, getUserById);

/**
 * @route   POST /api/users
 * @desc    Create new user (Admin only)
 * @access  Private (Admin)
 */
router.post(
  "/",
  authenticateUser,
  adminOnly,
  validate(userSchema.createUser),
  createUser
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user by ID (Admin only)
 * @access  Private (Admin)
 */
router.put(
  "/:id",
  authenticateUser,
  adminOnly,
  validate(userSchema.updateUser),
  updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete/Deactivate user by ID (Admin only)
 * @access  Private (Admin)
 * @query   permanent (optional boolean for permanent deletion)
 */
router.delete("/:id", authenticateUser, adminOnly, deleteUser);

/**
 * @route   POST /api/users/:id/reactivate
 * @desc    Reactivate deactivated user (Admin only)
 * @access  Private (Admin)
 */
router.post("/:id/reactivate", authenticateUser, adminOnly, reactivateUser);

/**
 * @route   POST /api/users/:id/reset-password
 * @desc    Reset user password (Admin only)
 * @access  Private (Admin)
 */
router.post(
  "/:id/reset-password",
  authenticateUser,
  adminOnly,
  validate(userSchema.resetPassword),
  resetUserPassword
);

export default router;
