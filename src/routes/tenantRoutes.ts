import { Router } from "express";
import {
  createTenant,
  getAllTenants,
  getTenantById,
  updateTenant,
  assignTenantToUnit,
  removeTenantFromUnit,
} from "../controllers/tenantController";
import { authenticateUser } from "../middleware/auth";
import { validate, userSchema } from "../middleware/validation";
import Joi from "joi";

const router = Router();

// Additional validation schemas for tenant-specific operations
const tenantValidation = {
  create: Joi.object({
    firstName: Joi.string().required().min(2).max(50),
    lastName: Joi.string().required().min(2).max(50),
    email: Joi.string().email().required(),
    password: Joi.string().required().min(6).max(100),
    phone: Joi.string().optional().allow(""),
    emergencyContactName: Joi.string().optional().allow(""),
    emergencyContactPhone: Joi.string().optional().allow(""),
    unitId: Joi.string().uuid().optional(),
  }),

  update: Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    phone: Joi.string().optional().allow(""),
    emergencyContactName: Joi.string().optional().allow(""),
    emergencyContactPhone: Joi.string().optional().allow(""),
    status: Joi.string()
      .valid("active", "inactive", "suspended", "deactivated")
      .optional(),
  }),

  assignUnit: Joi.object({
    unitId: Joi.string().uuid().required(),
  }),

  removeUnit: Joi.object({
    unitId: Joi.string().uuid().required(),
  }),
};

/**
 * @route   POST /api/tenants
 * @desc    Create a new tenant
 * @access  Private (Landlord only)
 */
router.post(
  "/",
  authenticateUser,
  validate(tenantValidation.create),
  createTenant
);

/**
 * @route   GET /api/tenants
 * @desc    Get all tenants for the authenticated landlord
 * @access  Private (Landlord only)
 */
router.get("/", authenticateUser, getAllTenants);

/**
 * @route   GET /api/tenants/:id
 * @desc    Get a specific tenant by ID
 * @access  Private (Landlord only - tenant association verified in controller)
 */
router.get("/:id", authenticateUser, getTenantById);

/**
 * @route   PUT /api/tenants/:id
 * @desc    Update a tenant
 * @access  Private (Landlord only - tenant association verified in controller)
 */
router.put(
  "/:id",
  authenticateUser,
  validate(tenantValidation.update),
  updateTenant
);

/**
 * @route   POST /api/tenants/:id/assign-unit
 * @desc    Assign a tenant to a unit
 * @access  Private (Landlord only - unit ownership verified in controller)
 */
router.post(
  "/:id/assign-unit",
  authenticateUser,
  validate(tenantValidation.assignUnit),
  assignTenantToUnit
);

/**
 * @route   POST /api/tenants/:id/remove-unit
 * @desc    Remove a tenant from a unit
 * @access  Private (Landlord only - unit ownership verified in controller)
 */
router.post(
  "/:id/remove-unit",
  authenticateUser,
  validate(tenantValidation.removeUnit),
  removeTenantFromUnit
);

export default router;
