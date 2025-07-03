import { Router } from "express";
import {
  createMaintenanceRequest,
  getAllMaintenanceRequests,
  getMaintenanceRequestById,
  updateMaintenanceRequest,
  deleteMaintenanceRequest,
  getMaintenanceStats,
} from "../controllers/maintenanceController";
import { authenticateUser } from "../middleware/auth";
import { validate } from "../middleware/validation";
import Joi from "joi";

const router = Router();

// Maintenance request validation schemas
const maintenanceValidation = {
  create: Joi.object({
    unitId: Joi.string().uuid().required(),
    title: Joi.string().required().min(5).max(255),
    description: Joi.string().optional().allow(""),
    category: Joi.string()
      .valid(
        "plumbing",
        "electrical",
        "hvac",
        "security",
        "general",
        "appliances",
        "flooring",
        "painting",
        "pool",
        "garden"
      )
      .optional(),
    priority: Joi.string().valid("low", "medium", "high", "urgent").optional(),
    imageUrl: Joi.string().uri().optional().allow(""),
    tenantId: Joi.string().uuid().optional(), // For landlords creating requests
  }),

  update: Joi.object({
    status: Joi.string()
      .valid("pending", "in_progress", "resolved", "cancelled")
      .optional(),
    responseNotes: Joi.string().optional().allow(""),
    priority: Joi.string().valid("low", "medium", "high", "urgent").optional(),
    description: Joi.string().optional().allow(""),
    category: Joi.string()
      .valid(
        "plumbing",
        "electrical",
        "hvac",
        "security",
        "general",
        "appliances",
        "flooring",
        "painting",
        "pool",
        "garden"
      )
      .optional(),
  }),
};

/**
 * @route   POST /api/maintenance
 * @desc    Create a new maintenance request
 * @access  Private (Tenant/Landlord)
 */
router.post(
  "/",
  authenticateUser,
  validate(maintenanceValidation.create),
  createMaintenanceRequest
);

/**
 * @route   GET /api/maintenance
 * @desc    Get all maintenance requests for the authenticated user
 * @access  Private (Tenant/Landlord)
 */
router.get("/", authenticateUser, getAllMaintenanceRequests);

/**
 * @route   GET /api/maintenance/stats
 * @desc    Get maintenance request statistics
 * @access  Private (Landlord only)
 */
router.get("/stats", authenticateUser, getMaintenanceStats);

/**
 * @route   GET /api/maintenance/:id
 * @desc    Get a specific maintenance request by ID
 * @access  Private (Tenant/Landlord - access permissions verified in controller)
 */
router.get("/:id", authenticateUser, getMaintenanceRequestById);

/**
 * @route   PUT /api/maintenance/:id
 * @desc    Update a maintenance request
 * @access  Private (Tenant/Landlord - different permissions verified in controller)
 */
router.put(
  "/:id",
  authenticateUser,
  validate(maintenanceValidation.update),
  updateMaintenanceRequest
);

/**
 * @route   DELETE /api/maintenance/:id
 * @desc    Delete a maintenance request
 * @access  Private (Tenant only for their own pending requests)
 */
router.delete("/:id", authenticateUser, deleteMaintenanceRequest);

export default router;
