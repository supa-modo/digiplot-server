import { Request, Response } from "express";
import { Op } from "sequelize";
import { Unit, Property, User, Payment, MaintenanceRequest } from "../models";
import { AuthenticatedRequest } from "../types";
import logger from "../config/logger";

/**
 * Create a new unit
 * @route POST /api/units
 * @access Private (Landlord only)
 */
export const createUnit = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      propertyId,
      name,
      description,
      type,
      bedrooms,
      bathrooms,
      area,
      rentAmount,
      amenities,
    } = req.body;

    if (req.user?.role !== "landlord") {
      res.status(403).json({
        success: false,
        message: "Access denied. Only landlords can create units.",
      });
      return;
    }

    const user = req.user!; // Safe to assert non-null after role check

    // Verify property belongs to landlord
    const property = await Property.findOne({
      where: {
        id: propertyId,
        landlordId: user.id,
      },
    });

    if (!property) {
      res.status(404).json({
        success: false,
        message: "Property not found or access denied.",
      });
      return;
    }

    const unit = await Unit.create({
      propertyId,
      name,
      description,
      type,
      bedrooms,
      bathrooms,
      area,
      rentAmount,
      amenities: Array.isArray(amenities)
        ? JSON.stringify(amenities)
        : amenities,
      status: "vacant",
    });

    logger.info(
      `Unit created: ${unit.id} in property: ${propertyId} by landlord: ${user.id}`
    );

    res.status(201).json({
      success: true,
      message: "Unit created successfully",
      data: {
        unit: {
          id: unit.id,
          propertyId: unit.propertyId,
          name: unit.name,
          description: unit.description,
          type: unit.type,
          bedrooms: unit.bedrooms,
          bathrooms: unit.bathrooms,
          area: unit.area,
          rentAmount: unit.rentAmount,
          amenities: unit.amenities,
          status: unit.status,
          createdAt: unit.createdAt,
          updatedAt: unit.updatedAt,
        },
      },
    });
  } catch (error) {
    logger.error("Error creating unit:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create unit",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
};

/**
 * Get all units for a landlord
 * @route GET /api/units
 * @access Private (Landlord only)
 */
export const getAllUnits = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (req.user?.role !== "landlord") {
      res.status(403).json({
        success: false,
        message: "Access denied. Only landlords can view units.",
      });
      return;
    }

    const user = req.user!; // Safe to assert non-null after role check

    const { status, search } = req.query;

    // Build where clause for units
    const unitWhere: any = {};
    if (status) {
      unitWhere.status = status;
    }
    if (search) {
      unitWhere[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const units = await Unit.findAll({
      where: unitWhere,
      include: [
        {
          model: Property,
          as: "property",
          where: { landlordId: user.id },
          attributes: ["id", "name", "address"],
        },
        {
          model: Payment,
          as: "payments",
          limit: 3,
          order: [["createdAt", "DESC"]],
        },
        {
          model: MaintenanceRequest,
          as: "maintenanceRequests",
          where: { status: { [Op.ne]: "resolved" } },
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Calculate statistics for each unit
    const unitsWithStats = units.map((unit) => {
      const unitData = unit.toJSON() as any;
      const payments = unitData.payments || [];
      const maintenanceRequests = unitData.maintenanceRequests || [];

      const totalRevenue = payments.reduce(
        (sum: number, payment: any) => sum + (parseFloat(payment.amount) || 0),
        0
      );

      return {
        ...unitData,
        stats: {
          totalRevenue,
          recentPayments: payments.length,
          pendingMaintenance: maintenanceRequests.length,
        },
      };
    });

    res.json({
      success: true,
      message: "All units retrieved successfully",
      data: {
        units: unitsWithStats,
        count: units.length,
        filters: {
          status: status || null,
          search: search || null,
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching all units:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch units",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
};

/**
 * Get all units for a specific property
 * @route GET /api/units/property/:propertyId
 * @access Private (Landlord only)
 */
export const getUnitsByProperty = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { propertyId } = req.params;

    if (req.user?.role !== "landlord") {
      res.status(403).json({
        success: false,
        message: "Access denied. Only landlords can view units.",
      });
      return;
    }

    const user = req.user!; // Safe to assert non-null after role check

    // Verify property ownership
    const property = await Property.findOne({
      where: {
        id: propertyId,
        landlordId: user.id,
      },
    });

    if (!property) {
      res.status(404).json({
        success: false,
        message: "Property not found or access denied.",
      });
      return;
    }

    const units = await Unit.findAll({
      where: { propertyId },
      include: [
        {
          model: Payment,
          as: "payments",
          limit: 3,
          order: [["createdAt", "DESC"]],
        },
        {
          model: MaintenanceRequest,
          as: "maintenanceRequests",
          where: { status: { [Op.ne]: "resolved" } },
          required: false,
        },
      ],
      order: [["name", "ASC"]],
    });

    // Calculate statistics for each unit
    const unitsWithStats = units.map((unit) => {
      const unitData = unit.toJSON() as any;
      const payments = unitData.payments || [];
      const maintenanceRequests = unitData.maintenanceRequests || [];

      const totalRevenue = payments.reduce(
        (sum: number, payment: any) => sum + (parseFloat(payment.amount) || 0),
        0
      );

      return {
        ...unitData,
        stats: {
          totalRevenue,
          recentPayments: payments.length,
          pendingMaintenance: maintenanceRequests.length,
        },
      };
    });

    res.json({
      success: true,
      message: "Units retrieved successfully",
      data: {
        units: unitsWithStats,
        property: {
          id: property.id,
          name: property.name,
        },
        count: units.length,
      },
    });
  } catch (error) {
    logger.error("Error fetching units:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch units",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
};

/**
 * Get a specific unit by ID
 * @route GET /api/units/:id
 * @access Private (Landlord only)
 */
export const getUnitById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (req.user?.role !== "landlord") {
      res.status(403).json({
        success: false,
        message: "Access denied. Only landlords can view units.",
      });
      return;
    }

    const unit = await Unit.findOne({
      where: { id },
      include: [
        {
          model: Property,
          as: "property",
          where: { landlordId: req.user.id },
          attributes: ["id", "name", "address", "description"],
        },
        {
          model: Payment,
          as: "payments",
          order: [["createdAt", "DESC"]],
        },
        {
          model: MaintenanceRequest,
          as: "maintenanceRequests",
          order: [["createdAt", "DESC"]],
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

    // Calculate comprehensive statistics
    const unitData = unit.toJSON() as any;
    const payments = unitData.payments || [];
    const maintenanceRequests = unitData.maintenanceRequests || [];

    const totalRevenue = payments.reduce(
      (sum: number, payment: any) => sum + (parseFloat(payment.amount) || 0),
      0
    );
    const successfulPayments = payments.filter(
      (p: any) => p.status === "successful"
    ).length;
    const pendingMaintenance = maintenanceRequests.filter(
      (mr: any) => mr.status !== "resolved"
    ).length;
    const resolvedMaintenance = maintenanceRequests.filter(
      (mr: any) => mr.status === "resolved"
    ).length;

    const unitWithStats = {
      ...unitData,
      stats: {
        totalRevenue,
        totalPayments: payments.length,
        successfulPayments,
        pendingPayments: payments.length - successfulPayments,
        totalMaintenance: maintenanceRequests.length,
        pendingMaintenance,
        resolvedMaintenance,
        averagePayment:
          payments.length > 0 ? totalRevenue / payments.length : 0,
      },
    };

    res.json({
      success: true,
      message: "Unit retrieved successfully",
      data: {
        unit: unitWithStats,
      },
    });
  } catch (error) {
    logger.error("Error fetching unit:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch unit",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
};

/**
 * Update a unit
 * @route PUT /api/units/:id
 * @access Private (Landlord only)
 */
export const updateUnit = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (req.user?.role !== "landlord") {
      res.status(403).json({
        success: false,
        message: "Access denied. Only landlords can update units.",
      });
      return;
    }

    // Find the unit and verify ownership through property
    const unit = await Unit.findOne({
      where: { id },
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

    // Update the unit
    await unit.update(updateData);

    logger.info(`Unit updated: ${id} by landlord: ${req.user.id}`);

    res.json({
      success: true,
      message: "Unit updated successfully",
      data: {
        unit: {
          id: unit.id,
          propertyId: unit.propertyId,
          name: unit.name,
          description: unit.description,
          type: unit.type,
          bedrooms: unit.bedrooms,
          bathrooms: unit.bathrooms,
          area: unit.area,
          rentAmount: unit.rentAmount,
          amenities: unit.amenities,
          status: unit.status,
          createdAt: unit.createdAt,
          updatedAt: unit.updatedAt,
        },
      },
    });
  } catch (error) {
    logger.error("Error updating unit:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update unit",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
};

/**
 * Delete a unit
 * @route DELETE /api/units/:id
 * @access Private (Landlord only)
 */
export const deleteUnit = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (req.user?.role !== "landlord") {
      res.status(403).json({
        success: false,
        message: "Access denied. Only landlords can delete units.",
      });
      return;
    }

    // Find the unit and verify ownership through property
    const unit = await Unit.findOne({
      where: { id },
      include: [
        {
          model: Property,
          as: "property",
          where: { landlordId: req.user.id },
        },
        {
          model: Payment,
          as: "payments",
        },
        {
          model: MaintenanceRequest,
          as: "maintenanceRequests",
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

    // Check if unit is occupied
    if (unit.status === "occupied") {
      res.status(400).json({
        success: false,
        message:
          "Cannot delete occupied unit. Please move out the tenant first.",
      });
      return;
    }

    // Check for existing payments or maintenance requests
    const unitData = unit.toJSON() as any;
    if (unitData.payments && unitData.payments.length > 0) {
      res.status(400).json({
        success: false,
        message:
          "Cannot delete unit with payment history. Please archive instead.",
      });
      return;
    }

    if (
      unitData.maintenanceRequests &&
      unitData.maintenanceRequests.length > 0
    ) {
      res.status(400).json({
        success: false,
        message:
          "Cannot delete unit with maintenance request history. Please archive instead.",
      });
      return;
    }

    // Delete the unit
    await unit.destroy();

    logger.info(`Unit deleted: ${id} by landlord: ${req.user.id}`);

    res.json({
      success: true,
      message: "Unit deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting unit:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete unit",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
};

/**
 * Get unit statistics
 * @route GET /api/units/:id/stats
 * @access Private (Landlord only)
 */
export const getUnitStats = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    if (req.user?.role !== "landlord") {
      res.status(403).json({
        success: false,
        message: "Access denied. Only landlords can view unit statistics.",
      });
      return;
    }

    // Find the unit and verify ownership through property
    const unit = await Unit.findOne({
      where: { id },
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

    // Build date filters
    const dateFilter: any = {};
    if (startDate) {
      dateFilter[Op.gte] = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter[Op.lte] = new Date(endDate as string);
    }

    // Get payments and maintenance requests with date filtering
    const [payments, maintenanceRequests] = await Promise.all([
      Payment.findAll({
        where: {
          unitId: id,
          ...(Object.keys(dateFilter).length > 0
            ? { createdAt: dateFilter }
            : {}),
        },
        order: [["createdAt", "DESC"]],
      }),
      MaintenanceRequest.findAll({
        where: {
          unitId: id,
          ...(Object.keys(dateFilter).length > 0
            ? { createdAt: dateFilter }
            : {}),
        },
        order: [["createdAt", "DESC"]],
      }),
    ]);

    // Calculate comprehensive statistics
    const totalRevenue = payments.reduce(
      (sum, payment) => sum + (parseFloat(payment.amount.toString()) || 0),
      0
    );
    const successfulPayments = payments.filter(
      (p) => p.status === "successful"
    );
    const pendingPayments = payments.filter((p) => p.status === "pending");
    const pendingMaintenance = maintenanceRequests.filter(
      (mr) => mr.status !== "resolved"
    );
    const resolvedMaintenance = maintenanceRequests.filter(
      (mr) => mr.status === "resolved"
    );

    const stats = {
      revenue: {
        total: totalRevenue,
        average: payments.length > 0 ? totalRevenue / payments.length : 0,
        monthlyAverage: totalRevenue / 12, // Simplified calculation
      },
      payments: {
        total: payments.length,
        successful: successfulPayments.length,
        pending: pendingPayments.length,
        successRate:
          payments.length > 0
            ? Math.round((successfulPayments.length / payments.length) * 100)
            : 0,
      },
      maintenance: {
        total: maintenanceRequests.length,
        pending: pendingMaintenance.length,
        resolved: resolvedMaintenance.length,
        resolutionRate:
          maintenanceRequests.length > 0
            ? Math.round(
                (resolvedMaintenance.length / maintenanceRequests.length) * 100
              )
            : 0,
      },
      occupancy: {
        status: unit.status,
        isOccupied: unit.status === "occupied",
      },
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    };

    res.json({
      success: true,
      message: "Unit statistics retrieved successfully",
      data: {
        unit: {
          id: unit.id,
          name: unit.name,
          rentAmount: unit.rentAmount,
        },
        stats,
      },
    });
  } catch (error) {
    logger.error("Error fetching unit stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch unit statistics",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
};
