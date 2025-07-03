import { Router } from "express";
import {
  createPayment,
  getAllPayments,
  getPaymentById,
  updatePaymentStatus,
  getPaymentStats,
  handleMpesaCallback,
} from "../controllers/paymentController";
import { authenticateUser } from "../middleware/auth";
import { validate } from "../middleware/validation";
import Joi from "joi";

const router = Router();

// Payment validation schemas
const paymentValidation = {
  create: Joi.object({
    tenantId: Joi.string().uuid().required(),
    unitId: Joi.string().uuid().required(),
    amount: Joi.number().positive().required(),
    paymentMethod: Joi.string()
      .valid("mpesa", "bank", "cash", "other")
      .required(),
    description: Joi.string().optional().allow(""),
    phoneNumber: Joi.string().when("paymentMethod", {
      is: "mpesa",
      then: Joi.string().required(),
      otherwise: Joi.string().optional(),
    }),
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid("successful", "failed", "pending").optional(),
    notes: Joi.string().optional().allow(""),
    receiptUrl: Joi.string().uri().optional().allow(""),
  }),
};

/**
 * @route   POST /api/payments
 * @desc    Create a new payment
 * @access  Private (Landlord/Tenant)
 */
router.post(
  "/",
  authenticateUser,
  validate(paymentValidation.create),
  createPayment
);

/**
 * @route   GET /api/payments
 * @desc    Get all payments for the authenticated user
 * @access  Private (Landlord/Tenant)
 */
router.get("/", authenticateUser, getAllPayments);

/**
 * @route   GET /api/payments/stats
 * @desc    Get payment statistics
 * @access  Private (Landlord only)
 */
router.get("/stats", authenticateUser, getPaymentStats);

/**
 * @route   GET /api/payments/:id
 * @desc    Get a specific payment by ID
 * @access  Private (Landlord/Tenant - access permissions verified in controller)
 */
router.get("/:id", authenticateUser, getPaymentById);

/**
 * @route   PUT /api/payments/:id
 * @desc    Update payment status
 * @access  Private (Landlord only - ownership verified in controller)
 */
router.put(
  "/:id",
  authenticateUser,
  validate(paymentValidation.updateStatus),
  updatePaymentStatus
);

/**
 * @route   POST /api/payments/mpesa/callback
 * @desc    Handle M-Pesa payment callback
 * @access  Public (M-Pesa service)
 */
router.post("/mpesa/callback", handleMpesaCallback);

export default router;
