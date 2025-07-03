import { Request, Response } from "express";
import { Op } from "sequelize";
import { Property, Unit, User, Payment, MaintenanceRequest } from "../models";
import { AuthenticatedRequest } from "../types";
import logger from "../config/logger";

/**
 * Create a new property
 * @route POST /api/properties
 * @access Private (Landlord only)
 */
export const createProperty = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, address, description } = req.body;

    if (req.user?.role !== "landlord") {
      res.status(403).json({
        success: false,
        message: "Access denied. Only landlords can create properties.",
      });
      return;
    }

    const user = req.user!; // We know user exists because we just checked above

    const property = await Property.create({
      landlordId: user.id,
      name,
      address,
      description,
    });

    logger.info(`Property created: ${property.id} by landlord: ${user.id}`);

    res.status(201).json({
      success: true,
      message: "Property created successfully",
      data: {
        property: {
          id: property.id,
          landlordId: property.landlordId,
          name: property.name,
          address: property.address,
          description: property.description,
          createdAt: property.createdAt,
          updatedAt: property.updatedAt,
        },
      },
    });
  } catch (error) {
    logger.error("Error creating property:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create property",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
};

/**
 * Get all properties for a landlord
 * @route GET /api/properties
 * @access Private (Landlord only)
 */
export const getProperties = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (req.user?.role !== "landlord") {
      res.status(403).json({
        success: false,
        message: "Access denied. Only landlords can view properties.",
      });
      return;
    }

    const user = req.user!; // We know user exists because we just checked above

    const properties = await Property.findAll({
      where: { landlordId: user.id },
      include: [
        {
          model: Unit,
          as: "units",
          attributes: ["id", "name", "status", "rentAmount"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Calculate summary statistics for each property
    const propertiesWithStats = properties.map((property) => {
      const propertyData = property.toJSON() as any;
      const units = propertyData.units || [];
      const totalUnits = units.length;
      const occupiedUnits = units.filter(
        (unit: any) => unit.status === "occupied"
      ).length;
      const totalRevenue = units.reduce(
        (sum: number, unit: any) => sum + (parseFloat(unit.rentAmount) || 0),
        0
      );

      return {
        ...propertyData,
        stats: {
          totalUnits,
          occupiedUnits,
          vacantUnits: totalUnits - occupiedUnits,
          occupancyRate:
            totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0,
          totalRevenue,
        },
      };
    });

    res.json({
      success: true,
      message: "Properties retrieved successfully",
      data: {
        properties: propertiesWithStats,
        count: properties.length,
      },
    });
  } catch (error) {
    logger.error("Error fetching properties:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch properties",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
};

/**
 * Get a specific property by ID
 * @route GET /api/properties/:id
 * @access Private (Landlord only)
 */
export const getPropertyById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (req.user?.role !== "landlord") {
      res.status(403).json({
        success: false,
        message: "Access denied. Only landlords can view property details.",
      });
      return;
    }

    const user = req.user!; // We know user exists because we just checked above

    const property = await Property.findOne({
      where: {
        id,
        landlordId: user.id, // Ensure landlord can only access their properties
      },
      include: [
        {
          model: Unit,
          as: "units",
          include: [
            {
              model: Payment,
              as: "payments",
              limit: 5,
              order: [["createdAt", "DESC"]],
            },
            {
              model: MaintenanceRequest,
              as: "maintenanceRequests",
              where: { status: { [Op.ne]: "resolved" } },
              required: false,
            },
          ],
        },
      ],
    });

    if (!property) {
      res.status(404).json({
        success: false,
        message: "Property not found",
      });
      return;
    }

    // Calculate property statistics
    const propertyData = property.toJSON() as any;
    const units = propertyData.units || [];
    const totalUnits = units.length;
    const occupiedUnits = units.filter(
      (unit: any) => unit.status === "occupied"
    ).length;
    const totalRevenue = units.reduce((sum: number, unit: any) => {
      const unitPayments = unit.payments || [];
      return (
        sum +
        unitPayments.reduce(
          (unitSum: number, payment: any) =>
            unitSum + (parseFloat(payment.amount) || 0),
          0
        )
      );
    }, 0);
    const totalMaintenanceRequests = units.reduce((sum: number, unit: any) => {
      return sum + (unit.maintenanceRequests?.length || 0);
    }, 0);
    const averageRent =
      totalUnits > 0
        ? units.reduce(
            (sum: number, unit: any) =>
              sum + (parseFloat(unit.rentAmount) || 0),
            0
          ) / totalUnits
        : 0;

    const propertyWithStats = {
      ...propertyData,
      stats: {
        totalUnits,
        occupiedUnits,
        vacantUnits: totalUnits - occupiedUnits,
        occupancyRate:
          totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0,
        totalRevenue,
        averageRent,
        pendingMaintenanceRequests: totalMaintenanceRequests,
      },
    };

    res.json({
      success: true,
      message: "Property retrieved successfully",
      data: {
        property: propertyWithStats,
      },
    });
  } catch (error) {
    logger.error("Error fetching property:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch property",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
};

/**
 * Update a property
 * @route PUT /api/properties/:id
 * @access Private (Landlord only)
 */
export const updateProperty = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (req.user?.role !== "landlord") {
      res.status(403).json({
        success: false,
        message: "Access denied. Only landlords can update properties.",
      });
      return;
    }

    // Find the property and verify ownership
    const property = await Property.findOne({
      where: {
        id,
        landlordId: req.user.id,
      },
    });

    if (!property) {
      res.status(404).json({
        success: false,
        message: "Property not found",
      });
      return;
    }

    // Update the property
    await property.update(updateData);

    logger.info(`Property updated: ${id} by landlord: ${req.user.id}`);

    res.json({
      success: true,
      message: "Property updated successfully",
      data: {
        property: {
          id: property.id,
          landlordId: property.landlordId,
          name: property.name,
          address: property.address,
          description: property.description,
          createdAt: property.createdAt,
          updatedAt: property.updatedAt,
        },
      },
    });
  } catch (error) {
    logger.error("Error updating property:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update property",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
};

/**
 * Delete a property
 * @route DELETE /api/properties/:id
 * @access Private (Landlord only)
 */
export const deleteProperty = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (req.user?.role !== "landlord") {
      res.status(403).json({
        success: false,
        message: "Access denied. Only landlords can delete properties.",
      });
      return;
    }

    // Find the property and verify ownership
    const property = await Property.findOne({
      where: {
        id,
        landlordId: req.user.id,
      },
      include: [
        {
          model: Unit,
          as: "units",
        },
      ],
    });

    if (!property) {
      res.status(404).json({
        success: false,
        message: "Property not found",
      });
      return;
    }

    // Check if property has units
    const propertyData = property.toJSON() as any;
    if (propertyData.units && propertyData.units.length > 0) {
      res.status(400).json({
        success: false,
        message:
          "Cannot delete property with existing units. Please delete all units first.",
      });
      return;
    }

    // Delete the property
    await property.destroy();

    logger.info(`Property deleted: ${id} by landlord: ${req.user.id}`);

    res.json({
      success: true,
      message: "Property deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting property:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete property",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
};

/**
 * Get property statistics
 * @route GET /api/properties/:id/stats
 * @access Private (Landlord only)
 */
export const getPropertyStats = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    if (req.user?.role !== "landlord") {
      res.status(403).json({
        success: false,
        message: "Access denied. Only landlords can view property statistics.",
      });
      return;
    }

    // Find the property and verify ownership
    const property = await Property.findOne({
      where: {
        id,
        landlordId: req.user.id,
      },
    });

    if (!property) {
      res.status(404).json({
        success: false,
        message: "Property not found",
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

    // Get property with detailed stats
    const propertyWithData = await Property.findByPk(id, {
      include: [
        {
          model: Unit,
          as: "units",
          include: [
            {
              model: Payment,
              as: "payments",
              where:
                Object.keys(dateFilter).length > 0
                  ? { createdAt: dateFilter }
                  : undefined,
              required: false,
            },
            {
              model: MaintenanceRequest,
              as: "maintenanceRequests",
              where:
                Object.keys(dateFilter).length > 0
                  ? { createdAt: dateFilter }
                  : undefined,
              required: false,
            },
          ],
        },
      ],
    });

    const propertyData = propertyWithData!.toJSON() as any;
    const units = propertyData.units || [];

    // Calculate comprehensive statistics
    const occupiedUnits = units.filter(
      (unit: any) => unit.status === "occupied"
    ).length;
    const totalRevenue = units.reduce((sum: number, unit: any) => {
      const unitPayments = unit.payments || [];
      return (
        sum +
        unitPayments.reduce(
          (unitSum: number, payment: any) =>
            unitSum + (parseFloat(payment.amount) || 0),
          0
        )
      );
    }, 0);
    const totalMaintenanceRequests = units.reduce((sum: number, unit: any) => {
      return sum + (unit.maintenanceRequests?.length || 0);
    }, 0);
    const averageRent =
      units.length > 0
        ? units.reduce(
            (sum: number, unit: any) =>
              sum + (parseFloat(unit.rentAmount) || 0),
            0
          ) / units.length
        : 0;

    const stats = {
      totalUnits: units.length,
      occupiedUnits,
      vacantUnits: units.length - occupiedUnits,
      occupancyRate:
        units.length > 0 ? Math.round((occupiedUnits / units.length) * 100) : 0,
      totalRevenue,
      averageRent,
      totalMaintenanceRequests,
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    };

    res.json({
      success: true,
      message: "Property statistics retrieved successfully",
      data: {
        property: {
          id: property.id,
          name: property.name,
        },
        stats,
      },
    });
  } catch (error) {
    logger.error("Error fetching property stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch property statistics",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
};

/**
 * Get all properties for admin view
 * @route GET /api/properties/admin/all
 * @access Private (Admin only)
 */
export const getAllPropertiesAdmin = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        message: "Access denied. Admin access required.",
      });
      return;
    }

    const { page = 1, limit = 10, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Build search filter
    const whereClause: any = {};
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows: properties } = await Property.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "landlord",
          attributes: ["id", "email", "firstName", "lastName"],
        },
        {
          model: Unit,
          as: "units",
          attributes: ["id", "name", "status", "rentAmount"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: Number(limit),
      offset,
    });

    // Calculate statistics for each property
    const propertiesWithStats = properties.map((property) => {
      const propertyData = property.toJSON() as any;
      const units = propertyData.units || [];
      const totalUnits = units.length;
      const occupiedUnits = units.filter(
        (unit: any) => unit.status === "occupied"
      ).length;
      const totalRevenue = units.reduce(
        (sum: number, unit: any) => sum + (parseFloat(unit.rentAmount) || 0),
        0
      );

      return {
        ...propertyData,
        stats: {
          totalUnits,
          occupiedUnits,
          vacantUnits: totalUnits - occupiedUnits,
          occupancyRate:
            totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0,
          totalRevenue,
        },
      };
    });

    res.json({
      success: true,
      message: "All properties retrieved successfully",
      data: {
        properties: propertiesWithStats,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count,
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching all properties (admin):", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch properties",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
};
