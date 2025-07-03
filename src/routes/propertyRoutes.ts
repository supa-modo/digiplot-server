import { Router } from "express";
import {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  getPropertyStats,
  getAllPropertiesAdmin,
} from "../controllers/propertyController";
import { authenticateUser } from "../middleware/auth";
import { validate, propertySchema } from "../middleware/validation";

const router = Router();

/**
 * @route   POST /api/properties
 * @desc    Create a new property
 * @access  Private (Landlord only)
 */
router.post(
  "/",
  authenticateUser,
  validate(propertySchema.create),
  createProperty
);

/**
 * @route   GET /api/properties
 * @desc    Get all properties for the authenticated landlord
 * @access  Private (Landlord only)
 */
router.get("/", authenticateUser, getProperties);

/**
 * @route   GET /api/properties/admin/all
 * @desc    Get all properties (admin view with pagination)
 * @access  Private (Admin only)
 */
router.get("/admin/all", authenticateUser, getAllPropertiesAdmin);

/**
 * @route   GET /api/properties/:id
 * @desc    Get a specific property by ID
 * @access  Private (Landlord only - owner verification in controller)
 */
router.get("/:id", authenticateUser, getPropertyById);

/**
 * @route   PUT /api/properties/:id
 * @desc    Update a property
 * @access  Private (Landlord only - owner verification in controller)
 */
router.put(
  "/:id",
  authenticateUser,
  validate(propertySchema.update),
  updateProperty
);

/**
 * @route   DELETE /api/properties/:id
 * @desc    Delete a property
 * @access  Private (Landlord only - owner verification in controller)
 */
router.delete("/:id", authenticateUser, deleteProperty);

/**
 * @route   GET /api/properties/:id/stats
 * @desc    Get property statistics with optional date range
 * @access  Private (Landlord only - owner verification in controller)
 */
router.get("/:id/stats", authenticateUser, getPropertyStats);

export default router;
