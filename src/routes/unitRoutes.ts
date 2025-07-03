import { Router } from "express";
import {
  createUnit,
  getAllUnits,
  getUnitsByProperty,
  getUnitById,
  updateUnit,
  deleteUnit,
  getUnitStats,
} from "../controllers/unitController";
import { authenticateUser } from "../middleware/auth";
import { validate, unitSchema } from "../middleware/validation";

const router = Router();

/**
 * @route   POST /api/units
 * @desc    Create a new unit
 * @access  Private (Landlord only)
 */
router.post("/", authenticateUser, validate(unitSchema.create), createUnit);

/**
 * @route   GET /api/units
 * @desc    Get all units for the authenticated landlord
 * @access  Private (Landlord only)
 */
router.get("/", authenticateUser, getAllUnits);

/**
 * @route   GET /api/units/property/:propertyId
 * @desc    Get all units for a specific property
 * @access  Private (Landlord only - property ownership verified in controller)
 */
router.get("/property/:propertyId", authenticateUser, getUnitsByProperty);

/**
 * @route   GET /api/units/:id
 * @desc    Get a specific unit by ID
 * @access  Private (Landlord only - property ownership verified in controller)
 */
router.get("/:id", authenticateUser, getUnitById);

/**
 * @route   PUT /api/units/:id
 * @desc    Update a unit
 * @access  Private (Landlord only - property ownership verified in controller)
 */
router.put("/:id", authenticateUser, validate(unitSchema.update), updateUnit);

/**
 * @route   DELETE /api/units/:id
 * @desc    Delete a unit
 * @access  Private (Landlord only - property ownership verified in controller)
 */
router.delete("/:id", authenticateUser, deleteUnit);

/**
 * @route   GET /api/units/:id/stats
 * @desc    Get unit statistics with optional date range
 * @access  Private (Landlord only - property ownership verified in controller)
 */
router.get("/:id/stats", authenticateUser, getUnitStats);

export default router;
