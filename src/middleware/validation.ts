import { Request, Response, NextFunction } from "express";
import Joi from "joi";

// Validation middleware generator
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown properties
    });

    if (error) {
      // Create a structured error object with field-level errors
      const fieldErrors: { [key: string]: string } = {};

      error.details.forEach((detail) => {
        const fieldName = detail.path.join(".");
        fieldErrors[fieldName] = detail.message.replace(/"/g, ""); // Remove quotes from message
      });

      res.status(400).json({
        success: false,
        message:
          "Validation failed. Please check the highlighted fields and correct the errors.",
        errors: fieldErrors,
        errorType: "validation",
      });
      return;
    }

    next();
  };
};

// Auth validation schemas
export const authSchema = {
  register: Joi.object({
    firstName: Joi.string().required().min(2).max(50),
    lastName: Joi.string().required().min(2).max(50),
    email: Joi.string().email().required(),
    password: Joi.string().required().min(6).max(100),
    role: Joi.string().valid("admin", "landlord", "tenant").required(),
    phone: Joi.string().optional(),
    emergencyContactName: Joi.string().optional(),
    emergencyContactPhone: Joi.string().optional(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    twoFactorToken: Joi.string().length(6).pattern(/^\d+$/).optional(),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().required().min(6).max(100),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required(),
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().required().min(6).max(100),
  }),

  updateProfile: Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    phone: Joi.string().optional().allow(""),
    emergencyContactName: Joi.string().optional().allow(""),
    emergencyContactPhone: Joi.string().optional().allow(""),
  }),

  enable2FA: Joi.object({
    token: Joi.string().required().length(6).pattern(/^\d+$/),
  }),

  disable2FA: Joi.object({
    token: Joi.string().required().length(6).pattern(/^\d+$/),
  }),

  verify2FA: Joi.object({
    token: Joi.string().required().length(6).pattern(/^\d+$/),
  }),
};

// User management validation schemas (Admin operations)
export const userSchema = {
  createUser: Joi.object({
    firstName: Joi.string().required().min(2).max(50),
    lastName: Joi.string().required().min(2).max(50),
    email: Joi.string().email().required(),
    password: Joi.string().required().min(6).max(100),
    role: Joi.string().valid("admin", "landlord", "tenant").required(),
    status: Joi.string()
      .valid("active", "inactive", "suspended", "deactivated")
      .optional(),
    phone: Joi.string().optional(),
    emergencyContactName: Joi.string().optional(),
    emergencyContactPhone: Joi.string().optional(),
  }),

  updateUser: Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    email: Joi.string().email().optional(),
    role: Joi.string().valid("admin", "landlord", "tenant").optional(),
    status: Joi.string()
      .valid("active", "inactive", "suspended", "deactivated")
      .optional(),
    phone: Joi.string().optional().allow(""),
    emergencyContactName: Joi.string().optional().allow(""),
    emergencyContactPhone: Joi.string().optional().allow(""),
  }),

  resetPassword: Joi.object({
    newPassword: Joi.string().required().min(6).max(100),
  }),
};

// Property validation schemas
export const propertySchema = {
  create: Joi.object({
    name: Joi.string().required().min(2).max(255),
    address: Joi.string().optional().allow(""),
    description: Joi.string().optional().allow(""),
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(255).optional(),
    address: Joi.string().optional().allow(""),
    description: Joi.string().optional().allow(""),
  }),
};

// Unit validation schemas
export const unitSchema = {
  create: Joi.object({
    name: Joi.string().required().min(1).max(255),
    description: Joi.string().optional().allow(""),
    type: Joi.string()
      .valid(
        "apartment",
        "villa",
        "office",
        "studio",
        "penthouse",
        "commercial"
      )
      .default("apartment"),
    bedrooms: Joi.number().integer().min(0).default(0),
    bathrooms: Joi.number().integer().min(0).default(0),
    area: Joi.number().integer().min(0).optional(),
    rentAmount: Joi.number().positive().required(),
    amenities: Joi.string().optional().allow(""),
    status: Joi.string()
      .valid("vacant", "occupied", "maintenance", "unavailable")
      .default("vacant"),
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    description: Joi.string().optional().allow(""),
    type: Joi.string()
      .valid(
        "apartment",
        "villa",
        "office",
        "studio",
        "penthouse",
        "commercial"
      )
      .optional(),
    bedrooms: Joi.number().integer().min(0).optional(),
    bathrooms: Joi.number().integer().min(0).optional(),
    area: Joi.number().integer().min(0).optional(),
    rentAmount: Joi.number().positive().optional(),
    amenities: Joi.string().optional().allow(""),
    status: Joi.string()
      .valid("vacant", "occupied", "maintenance", "unavailable")
      .optional(),
  }),
};

// Maintenance request validation schemas
export const maintenanceSchema = {
  create: Joi.object({
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
      .default("general"),
    priority: Joi.string()
      .valid("low", "medium", "high", "urgent")
      .default("medium"),
    unitId: Joi.string().required(),
  }),

  update: Joi.object({
    title: Joi.string().min(5).max(255).optional(),
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
    status: Joi.string()
      .valid("pending", "in_progress", "resolved", "cancelled")
      .optional(),
  }),
};

// Payment validation schemas
export const paymentSchema = {
  create: Joi.object({
    amount: Joi.number().positive().required(),
    paymentMethod: Joi.string()
      .valid("mpesa", "bank_transfer", "cash", "cheque")
      .required(),
    unitId: Joi.string().required(),
    tenantId: Joi.string().required(),
    description: Joi.string().optional().allow(""),
    paymentDate: Joi.date().optional(),
  }),

  update: Joi.object({
    status: Joi.string()
      .valid("pending", "completed", "failed", "cancelled")
      .optional(),
    transactionId: Joi.string().optional(),
    description: Joi.string().optional().allow(""),
  }),
};
