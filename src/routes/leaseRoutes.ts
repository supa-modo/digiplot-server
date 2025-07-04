import express from "express";
import {
  createLease,
  getAllLeases,
  getUnitLeaseHistory,
  getCurrentTenantLease,
  terminateLease,
  getLeaseStats,
} from "../controllers/leaseController";
import { authenticateUser } from "../middleware/auth";
import { validate } from "../middleware/validation";
import Joi from "joi";

const router = express.Router();

// Validation schemas
const createLeaseSchema = Joi.object({
  tenantId: Joi.string().uuid().required(),
  unitId: Joi.string().uuid().required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().greater(Joi.ref("startDate")).required(),
  monthlyRent: Joi.number().positive().required(),
  securityDeposit: Joi.number().min(0).optional(),
  moveInDate: Joi.date().iso().optional(),
  notes: Joi.string().max(1000).optional(),
});

const terminateLeaseSchema = Joi.object({
  terminationReason: Joi.string().max(500).optional(),
  moveOutDate: Joi.date().iso().optional(),
});

// Routes

/**
 * @route POST /api/leases
 * @desc Create a new lease (assign tenant to unit)
 * @access Private (Landlord only)
 */
router.post("/", authenticateUser, validate(createLeaseSchema), createLease);

/**
 * @route GET /api/leases
 * @desc Get all leases for a landlord
 * @access Private (Landlord only)
 */
router.get("/", authenticateUser, getAllLeases);

/**
 * @route GET /api/leases/stats
 * @desc Get lease statistics for landlord dashboard
 * @access Private (Landlord only)
 */
router.get("/stats", authenticateUser, getLeaseStats);

/**
 * @route GET /api/leases/tenant/current
 * @desc Get current lease for a tenant
 * @access Private (Tenant only)
 */
router.get("/tenant/current", authenticateUser, getCurrentTenantLease);

/**
 * @route GET /api/leases/unit/:unitId/history
 * @desc Get lease history for a specific unit
 * @access Private (Landlord only)
 */
router.get("/unit/:unitId/history", authenticateUser, getUnitLeaseHistory);

/**
 * @route PUT /api/leases/:id/terminate
 * @desc Terminate a lease
 * @access Private (Landlord only)
 */
router.put(
  "/:id/terminate",
  authenticateUser,
  validate(terminateLeaseSchema),
  terminateLease
);

export default router;
