import { Request, Response } from "express";
import { Op } from "sequelize";
import {
  User,
  Property,
  Unit,
  Payment,
  MaintenanceRequest,
  Lease,
} from "../models";
import { AuthenticatedRequest } from "../types";
import logger from "../config/logger";
import sequelize from "../config/database";

/**
 * Create a new lease (assign tenant to unit)
 * @route POST /api/leases
 * @access Private (Landlord only)
 */
export const createLease = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const transaction = await sequelize.transaction();

  try {
    const {
      tenantId,
      unitId,
      startDate,
      endDate,
      monthlyRent,
      securityDeposit,
      moveInDate,
      notes,
    } = req.body;

    if (req.user?.role !== "landlord") {
      res.status(403).json({
        success: false,
        message: "Access denied. Only landlords can create leases.",
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
      await transaction.rollback();
      res.status(404).json({
        success: false,
        message: "Unit not found or access denied.",
      });
      return;
    }

    // Verify tenant exists and is a tenant
    const tenant = await User.findOne({
      where: { id: tenantId, role: "tenant" },
    });

    if (!tenant) {
      await transaction.rollback();
      res.status(404).json({
        success: false,
        message: "Tenant not found or invalid role.",
      });
      return;
    }

    // Check for existing active lease on this unit
    const existingLease = await Lease.findOne({
      where: { unitId, status: "active" },
    });

    if (existingLease) {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message: "Unit already has an active lease.",
      });
      return;
    }

    // Create the lease
    const lease = await Lease.create(
      {
        tenantId,
        unitId,
        landlordId: req.user.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        monthlyRent,
        securityDeposit: securityDeposit || 0,
        moveInDate: moveInDate ? new Date(moveInDate) : undefined,
        notes,
        status: "active",
      },
      { transaction }
    );

    // Update unit status to occupied
    await Unit.update(
      { status: "occupied" },
      { where: { id: unitId }, transaction }
    );

    await transaction.commit();

    logger.info(`Lease created: ${lease.id} by landlord: ${req.user.id}`);

    // Fetch complete lease data with associations
    const completeLeaseData = await Lease.findByPk(lease.id, {
      include: [
        {
          model: User,
          as: "tenant",
          attributes: ["id", "firstName", "lastName", "email", "phone"],
        },
        {
          model: Unit,
          as: "unit",
          attributes: ["id", "name", "type", "rentAmount"],
          include: [
            {
              model: Property,
              as: "property",
              attributes: ["id", "name"],
            },
          ],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Lease created successfully",
      data: { lease: completeLeaseData },
    });
  } catch (error) {
    await transaction.rollback();
    logger.error("Error creating lease:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create lease",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
};

/**
 * Get all leases for a landlord
 * @route GET /api/leases
 * @access Private (Landlord only)
 */
export const getAllLeases = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (req.user?.role !== "landlord") {
      res.status(403).json({
        success: false,
        message: "Access denied. Only landlords can view leases.",
      });
      return;
    }

    const { status, unitId, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereClause: any = { landlordId: req.user.id };

    if (status) {
      whereClause.status = status;
    }

    if (unitId) {
      whereClause.unitId = unitId;
    }

    const { count, rows: leases } = await Lease.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "tenant",
          attributes: ["id", "firstName", "lastName", "email", "phone"],
        },
        {
          model: Unit,
          as: "unit",
          attributes: ["id", "name", "type", "rentAmount", "status"],
          include: [
            {
              model: Property,
              as: "property",
              attributes: ["id", "name"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: Number(limit),
      offset,
    });

    res.status(200).json({
      success: true,
      data: {
        leases,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count,
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching leases:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch leases",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
};

/**
 * Get lease history for a specific unit
 * @route GET /api/leases/unit/:unitId/history
 * @access Private (Landlord only)
 */
export const getUnitLeaseHistory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { unitId } = req.params;

    if (req.user?.role !== "landlord") {
      res.status(403).json({
        success: false,
        message: "Access denied. Only landlords can view lease history.",
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

    // Get all leases for this unit
    const leases = await Lease.findAll({
      where: { unitId },
      include: [
        {
          model: User,
          as: "tenant",
          attributes: ["id", "firstName", "lastName", "email", "phone"],
        },
        {
          model: Payment,
          as: "payments",
          attributes: ["id", "amount", "paymentDate", "status"],
          separate: true,
          order: [["paymentDate", "DESC"]],
        },
      ],
      order: [["startDate", "DESC"]],
    });

    // Calculate lease statistics
    const currentLease = leases.find((lease) => lease.status === "active");
    const totalRevenue = leases.reduce((sum, lease) => {
      const leasePayments = lease.payments || [];
      return (
        sum +
        leasePayments.reduce((leaseSum: number, payment: any) => {
          return payment.status === "successful"
            ? leaseSum + Number(payment.amount)
            : leaseSum;
        }, 0)
      );
    }, 0);

    const averageLeaseDuration =
      leases.length > 0
        ? leases.reduce((sum, lease) => sum + lease.duration, 0) / leases.length
        : 0;

    res.status(200).json({
      success: true,
      data: {
        unit: {
          id: unit.id,
          name: unit.name,
          type: unit.type,
          rentAmount: unit.rentAmount,
          status: unit.status,
          property: (unit as any).property,
        },
        currentLease,
        leaseHistory: leases,
        statistics: {
          totalLeases: leases.length,
          totalRevenue,
          averageLeaseDuration: Math.round(averageLeaseDuration),
          occupancyRate:
            leases.length > 0
              ? (leases.filter((l) => l.status === "active").length /
                  leases.length) *
                100
              : 0,
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching unit lease history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch unit lease history",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
};

/**
 * Get current lease for a tenant
 * @route GET /api/leases/tenant/current
 * @access Private (Tenant only)
 */
export const getCurrentTenantLease = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (req.user?.role !== "tenant") {
      res.status(403).json({
        success: false,
        message: "Access denied. Only tenants can view their lease.",
      });
      return;
    }

    const lease = await Lease.findOne({
      where: { tenantId: req.user.id, status: "active" },
      include: [
        {
          model: Unit,
          as: "unit",
          attributes: [
            "id",
            "name",
            "type",
            "rentAmount",
            "amenities",
            "imageUrls",
          ],
          include: [
            {
              model: Property,
              as: "property",
              attributes: ["id", "name", "address", "city"],
            },
          ],
        },
        {
          model: User,
          as: "landlord",
          attributes: ["id", "firstName", "lastName", "email", "phone"],
        },
      ],
    });

    if (!lease) {
      res.status(404).json({
        success: false,
        message: "No active lease found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { lease },
    });
  } catch (error) {
    logger.error("Error fetching tenant lease:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch lease",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
};

/**
 * Terminate a lease
 * @route PUT /api/leases/:id/terminate
 * @access Private (Landlord only)
 */
export const terminateLease = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { terminationReason, moveOutDate } = req.body;

    if (req.user?.role !== "landlord") {
      res.status(403).json({
        success: false,
        message: "Access denied. Only landlords can terminate leases.",
      });
      return;
    }

    // Find and verify lease ownership
    const lease = await Lease.findOne({
      where: { id, landlordId: req.user.id },
      include: [
        {
          model: Unit,
          as: "unit",
        },
      ],
    });

    if (!lease) {
      await transaction.rollback();
      res.status(404).json({
        success: false,
        message: "Lease not found or access denied.",
      });
      return;
    }

    if (lease.status !== "active") {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message: "Only active leases can be terminated.",
      });
      return;
    }

    // Terminate the lease
    await lease.update(
      {
        status: "terminated",
        moveOutDate: moveOutDate ? new Date(moveOutDate) : new Date(),
        terminationReason,
      },
      { transaction }
    );

    // Update unit status to vacant
    await Unit.update(
      { status: "vacant" },
      { where: { id: lease.unitId }, transaction }
    );

    await transaction.commit();

    logger.info(`Lease terminated: ${lease.id} by landlord: ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: "Lease terminated successfully",
      data: { lease },
    });
  } catch (error) {
    await transaction.rollback();
    logger.error("Error terminating lease:", error);
    res.status(500).json({
      success: false,
      message: "Failed to terminate lease",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
};

/**
 * Get lease statistics for landlord dashboard
 * @route GET /api/leases/stats
 * @access Private (Landlord only)
 */
export const getLeaseStats = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (req.user?.role !== "landlord") {
      res.status(403).json({
        success: false,
        message: "Access denied. Only landlords can view lease statistics.",
      });
      return;
    }

    const [
      totalLeases,
      activeLeases,
      expiredLeases,
      terminatedLeases,
      expiringLeases,
    ] = await Promise.all([
      Lease.count({ where: { landlordId: req.user.id } }),
      Lease.count({ where: { landlordId: req.user.id, status: "active" } }),
      Lease.count({ where: { landlordId: req.user.id, status: "expired" } }),
      Lease.count({ where: { landlordId: req.user.id, status: "terminated" } }),
      Lease.count({
        where: {
          landlordId: req.user.id,
          status: "active",
          endDate: {
            [Op.lte]: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
          },
        },
      }),
    ]);

    // Calculate total monthly revenue from active leases
    const activeLeasesList = await Lease.findAll({
      where: { landlordId: req.user.id, status: "active" },
      attributes: ["monthlyRent"],
    });

    const totalMonthlyRevenue = activeLeasesList.reduce(
      (sum, lease) => sum + Number(lease.monthlyRent),
      0
    );

    res.status(200).json({
      success: true,
      data: {
        totalLeases,
        activeLeases,
        expiredLeases,
        terminatedLeases,
        expiringLeases,
        totalMonthlyRevenue,
        occupancyRate: totalLeases > 0 ? (activeLeases / totalLeases) * 100 : 0,
      },
    });
  } catch (error) {
    logger.error("Error fetching lease stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch lease statistics",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
};
