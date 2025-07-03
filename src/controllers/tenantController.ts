import { Request, Response } from "express";
import { Op } from "sequelize";
import { User, Property, Unit, Payment, MaintenanceRequest } from "../models";
import { AuthenticatedRequest } from "../types";
import logger from "../config/logger";
import bcrypt from "bcryptjs";

/**
 * Create a new tenant
 * @route POST /api/tenants
 * @access Private (Landlord only)
 */
export const createTenant = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      emergencyContactName,
      emergencyContactPhone,
      unitId,
    } = req.body;

    if (req.user?.role !== "landlord") {
      res.status(403).json({
        success: false,
        message: "Access denied. Only landlords can create tenants.",
      });
      return;
    }

    // Check if email already exists
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

    // If unitId is provided, verify unit ownership and availability
    if (unitId) {
      const unit = await Unit.findOne({
        where: { id: unitId },
        include: [
          {
            model: Property,
            as: "property",
            where: { landlordId: req.user.id },
          },
        ],
      });

      if (!unit) {
        res.status(404).json({
          success: false,
          message: "Unit not found or access denied.",
        });
        return;
      }

      if (unit.status === "occupied") {
        res.status(400).json({
          success: false,
          message: "Unit is already occupied.",
        });
        return;
      }
    }

    // Create tenant
    const tenant = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password, // Will be hashed by model hooks
      phone,
      emergencyContactName,
      emergencyContactPhone,
      role: "tenant",
      status: "active",
    });

    // If unit is assigned, update unit status
    if (unitId) {
      await Unit.update(
        { status: "occupied" },
        { where: { id: unitId } }
      );
    }

    logger.info(`Tenant created: ${tenant.id} by landlord: ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: "Tenant created successfully",
      data: {
        tenant: {
          id: tenant.id,
          firstName: tenant.firstName,
          lastName: tenant.lastName,
          fullName: tenant.fullName,
          email: tenant.email,
          phone: tenant.phone,
          emergencyContactName: tenant.emergencyContactName,
          emergencyContactPhone: tenant.emergencyContactPhone,
          role: tenant.role,
          status: tenant.status,
          createdAt: tenant.createdAt,
          assignedUnit: unitId || null,
        },
      },
    });
  } catch (error) {
    logger.error("Error creating tenant:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create tenant",
      error: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
    });
  }
};

/**
 * Get all tenants for a landlord
 * @route GET /api/tenants
 * @access Private (Landlord only)
 */
export const getAllTenants = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (req.user?.role !== "landlord") {
      res.status(403).json({
        success: false,
        message: "Access denied. Only landlords can view tenants.",
      });
      return;
    }

    const { status, search } = req.query;

    // Build where clause for tenant filtering
    const tenantWhere: any = {
      role: "tenant",
    };

    if (status) {
      tenantWhere.status = status;
    }

    if (search) {
      tenantWhere[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Get tenants with their units, payments, and maintenance requests
    const tenants = await User.findAll({
      where: tenantWhere,
      include: [
        {
          model: Payment,
          as: "payments",
          include: [
            {
              model: Unit,
              as: "unit",
              include: [
                {
                  model: Property,
                  as: "property",
                  where: { landlordId: req.user.id },
                  attributes: ["id", "name"],
                },
              ],
            },
          ],
          limit: 5,
          order: [["createdAt", "DESC"]],
        },
        {
          model: MaintenanceRequest,
          as: "maintenanceRequests",
          include: [
            {
              model: Unit,
              as: "unit",
              include: [
                {
                  model: Property,
                  as: "property",
                  where: { landlordId: req.user.id },
                  attributes: ["id", "name"],
                },
              ],
            },
          ],
          where: { status: { [Op.ne]: "resolved" } },
          required: false,
          limit: 3,
          order: [["createdAt", "DESC"]],
        },
      ],
      attributes: [
        "id",
        "firstName",
        "lastName",
        "email",
        "phone",
        "emergencyContactName",
        "emergencyContactPhone",
        "status",
        "lastLogin",
        "createdAt",
      ],
      order: [["createdAt", "DESC"]],
    });

    // Calculate statistics for each tenant
    const tenantsWithStats = tenants.map((tenant) => {
      const tenantData = tenant.toJSON() as any;
      const payments = tenantData.payments || [];
      const maintenanceRequests = tenantData.maintenanceRequests || [];

      // Get current unit from recent payments
      const currentUnit = payments.length > 0 ? payments[0].unit : null;
      
      const totalPayments = payments.reduce((sum: number, payment: any) => 
        sum + (parseFloat(payment.amount) || 0), 0);

      return {
        ...tenantData,
        fullName: `${tenantData.firstName} ${tenantData.lastName}`,
        currentUnit: currentUnit ? {
          id: currentUnit.id,
          name: currentUnit.name,
          property: currentUnit.property,
        } : null,
        stats: {
          totalPayments,
          recentPayments: payments.length,
          pendingMaintenance: maintenanceRequests.length,
        },
      };
    });

    res.json({
      success: true,
      message: "Tenants retrieved successfully",
      data: {
        tenants: tenantsWithStats,
        count: tenants.length,
        filters: {
          status: status || null,
          search: search || null,
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching tenants:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tenants",
      error: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
    });
  }
};

/**
 * Get a specific tenant by ID
 * @route GET /api/tenants/:id
 * @access Private (Landlord only)
 */
export const getTenantById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (req.user?.role !== "landlord") {
      res.status(403).json({
        success: false,
        message: "Access denied. Only landlords can view tenant details.",
      });
      return;
    }

    const tenant = await User.findOne({
      where: {
        id,
        role: "tenant",
      },
      include: [
        {
          model: Payment,
          as: "payments",
          include: [
            {
              model: Unit,
              as: "unit",
              include: [
                {
                  model: Property,
                  as: "property",
                  where: { landlordId: req.user.id },
                },
              ],
            },
          ],
          order: [["createdAt", "DESC"]],
        },
        {
          model: MaintenanceRequest,
          as: "maintenanceRequests",
          include: [
            {
              model: Unit,
              as: "unit",
              include: [
                {
                  model: Property,
                  as: "property",
                  where: { landlordId: req.user.id },
                },
              ],
            },
          ],
          order: [["createdAt", "DESC"]],
        },
      ],
      attributes: [
        "id",
        "firstName",
        "lastName",
        "email",
        "phone",
        "emergencyContactName",
        "emergencyContactPhone",
        "status",
        "lastLogin",
        "createdAt",
        "updatedAt",
      ],
    });

    if (!tenant) {
      res.status(404).json({
        success: false,
        message: "Tenant not found or access denied.",
      });
      return;
    }

    // Calculate comprehensive statistics
    const tenantData = tenant.toJSON() as any;
    const payments = tenantData.payments || [];
    const maintenanceRequests = tenantData.maintenanceRequests || [];

    // Get current unit and lease information
    const currentUnit = payments.length > 0 ? payments[0].unit : null;
    const totalPayments = payments.reduce((sum: number, payment: any) => 
      sum + (parseFloat(payment.amount) || 0), 0);
    const successfulPayments = payments.filter((p: any) => p.status === "successful").length;
    const pendingMaintenance = maintenanceRequests.filter((mr: any) => mr.status !== "resolved").length;
    const resolvedMaintenance = maintenanceRequests.filter((mr: any) => mr.status === "resolved").length;

    const tenantWithStats = {
      ...tenantData,
      fullName: `${tenantData.firstName} ${tenantData.lastName}`,
      currentUnit: currentUnit ? {
        id: currentUnit.id,
        name: currentUnit.name,
        rentAmount: currentUnit.rentAmount,
        property: currentUnit.property,
      } : null,
      stats: {
        totalPayments,
        successfulPayments,
        pendingPayments: payments.length - successfulPayments,
        averagePayment: payments.length > 0 ? totalPayments / payments.length : 0,
        totalMaintenance: maintenanceRequests.length,
        pendingMaintenance,
        resolvedMaintenance,
        paymentHistory: payments.slice(0, 10), // Recent 10 payments
      },
    };

    res.json({
      success: true,
      message: "Tenant retrieved successfully",
      data: {
        tenant: tenantWithStats,
      },
    });
  } catch (error) {
    logger.error("Error fetching tenant:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tenant",
      error: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
    });
  }
};

/**
 * Update a tenant
 * @route PUT /api/tenants/:id
 * @access Private (Landlord only)
 */
export const updateTenant = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (req.user?.role !== "landlord") {
      res.status(403).json({
        success: false,
        message: "Access denied. Only landlords can update tenants.",
      });
      return;
    }

    // Find tenant and verify they are associated with landlord's properties
    const tenant = await User.findOne({
      where: {
        id,
        role: "tenant",
      },
      include: [
        {
          model: Payment,
          as: "payments",
          include: [
            {
              model: Unit,
              as: "unit",
              include: [
                {
                  model: Property,
                  as: "property",
                  where: { landlordId: req.user.id },
                },
              ],
            },
          ],
          limit: 1,
        },
      ],
    });

    if (!tenant) {
      res.status(404).json({
        success: false,
        message: "Tenant not found or access denied.",
      });
      return;
    }

    // Remove sensitive fields from update data
    delete updateData.password;
    delete updateData.role;
    delete updateData.email; // Email updates should be handled separately

    // Update the tenant
    await tenant.update(updateData);

    logger.info(`Tenant updated: ${id} by landlord: ${req.user.id}`);

    res.json({
      success: true,
      message: "Tenant updated successfully",
      data: {
        tenant: {
          id: tenant.id,
          firstName: tenant.firstName,
          lastName: tenant.lastName,
          fullName: tenant.fullName,
          email: tenant.email,
          phone: tenant.phone,
          emergencyContactName: tenant.emergencyContactName,
          emergencyContactPhone: tenant.emergencyContactPhone,
          status: tenant.status,
          createdAt: tenant.createdAt,
          updatedAt: tenant.updatedAt,
        },
      },
    });
  } catch (error) {
    logger.error("Error updating tenant:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update tenant",
      error: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
    });
  }
};

/**
 * Assign tenant to unit
 * @route POST /api/tenants/:id/assign-unit
 * @access Private (Landlord only)
 */
export const assignTenantToUnit = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id: tenantId } = req.params;
    const { unitId } = req.body;

    if (req.user?.role !== "landlord") {
      res.status(403).json({
        success: false,
        message: "Access denied. Only landlords can assign tenants to units.",
      });
      return;
    }

    // Verify tenant exists
    const tenant = await User.findOne({
      where: {
        id: tenantId,
        role: "tenant",
      },
    });

    if (!tenant) {
      res.status(404).json({
        success: false,
        message: "Tenant not found.",
      });
      return;
    }

    // Verify unit ownership and availability
    const unit = await Unit.findOne({
      where: { id: unitId },
      include: [
        {
          model: Property,
          as: "property",
          where: { landlordId: req.user.id },
        },
      ],
    });

    if (!unit) {
      res.status(404).json({
        success: false,
        message: "Unit not found or access denied.",
      });
      return;
    }

    if (unit.status === "occupied") {
      res.status(400).json({
        success: false,
        message: "Unit is already occupied.",
      });
      return;
    }

    // Update unit status to occupied
    await unit.update({ status: "occupied" });

    logger.info(`Tenant ${tenantId} assigned to unit ${unitId} by landlord: ${req.user.id}`);

    res.json({
      success: true,
      message: "Tenant assigned to unit successfully",
      data: {
        tenant: {
          id: tenant.id,
          fullName: tenant.fullName,
        },
        unit: {
          id: unit.id,
          name: unit.name,
          rentAmount: unit.rentAmount,
        },
      },
    });
  } catch (error) {
    logger.error("Error assigning tenant to unit:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign tenant to unit",
      error: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
    });
  }
};

/**
 * Remove tenant from unit
 * @route POST /api/tenants/:id/remove-unit
 * @access Private (Landlord only)
 */
export const removeTenantFromUnit = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id: tenantId } = req.params;
    const { unitId } = req.body;

    if (req.user?.role !== "landlord") {
      res.status(403).json({
        success: false,
        message: "Access denied. Only landlords can remove tenants from units.",
      });
      return;
    }

    // Verify unit ownership
    const unit = await Unit.findOne({
      where: { id: unitId },
      include: [
        {
          model: Property,
          as: "property",
          where: { landlordId: req.user.id },
        },
      ],
    });

    if (!unit) {
      res.status(404).json({
        success: false,
        message: "Unit not found or access denied.",
      });
      return;
    }

    // Update unit status to vacant
    await unit.update({ status: "vacant" });

    logger.info(`Tenant ${tenantId} removed from unit ${unitId} by landlord: ${req.user.id}`);

    res.json({
      success: true,
      message: "Tenant removed from unit successfully",
      data: {
        unit: {
          id: unit.id,
          name: unit.name,
          status: unit.status,
        },
      },
    });
  } catch (error) {
    logger.error("Error removing tenant from unit:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove tenant from unit",
      error: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
    });
  }
};

/**
 * Reset tenant password
 * @route POST /api/tenants/:id/reset-password
 * @access Private (Landlord only)
 */
export const resetTenantPassword = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (req.user?.role !== "landlord") {
      res.status(403).json({
        success: false,
        message: "Access denied. Only landlords can reset tenant passwords.",
      });
      return;
    }

    // Find tenant and verify association with landlord
    const tenant = await User.findOne({
      where: {
        id,
        role: "tenant",
      },
      include: [
        {
          model: Payment,
          as: "payments",
          include: [
            {
              model: Unit,
              as: "unit",
              include: [
                {
                  model: Property,
                  as: "property",
                  where: { landlordId: req.user.id },
                },
              ],
            },
          ],
          limit: 1,
        },
      ],
    });

    if (!tenant) {
      res.status(404).json({
        success: false,
        message: "Tenant not found or access denied.",
      });
      return;
    }

    // Update password (will be hashed by model hooks)
    await tenant.update({ password: newPassword });

    logger.info(`Password reset for tenant: ${id} by landlord: ${req.user.id}`);

    res.json({
      success: true,
      message: "Tenant password reset successfully",
    });
  } catch (error) {
    logger.error("Error resetting tenant password:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset tenant password",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
};
