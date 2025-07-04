import { Request, Response } from "express";
import { Op } from "sequelize";
import { Payment, User, Unit, Property, Lease } from "../models";
import { AuthenticatedRequest } from "../types";
import logger from "../config/logger";
import crypto from "crypto";
import MpesaService from "../services/mpesaService";

// Initialize M-Pesa service
const mpesaService = new MpesaService({
  consumerKey: process.env.MPESA_CONSUMER_KEY || "",
  consumerSecret: process.env.MPESA_CONSUMER_SECRET || "",
  shortCode: process.env.MPESA_SHORTCODE || "",
  passKey: process.env.MPESA_PASSKEY || "",
  environment: (process.env.MPESA_ENV || "sandbox") as "sandbox" | "production",
});

/**
 * Create a new payment record
 * @route POST /api/payments
 * @access Private (Landlord/Tenant)
 */
export const createPayment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      tenantId,
      unitId,
      amount,
      paymentMethod,
      description,
      phoneNumber,
    } = req.body;

    // Verify user permissions
    if (!["landlord", "tenant"].includes(req.user?.role || "")) {
      res.status(403).json({
        success: false,
        message:
          "Access denied. Only landlords and tenants can create payments.",
      });
      return;
    }

    // For tenants, ensure they can only create payments for themselves
    if (req.user?.role === "tenant" && tenantId !== req.user.id) {
      res.status(403).json({
        success: false,
        message: "Tenants can only create payments for themselves.",
      });
      return;
    }

    // For landlords, verify unit ownership
    if (req.user?.role === "landlord") {
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

    // Get unit details for reference
    const unit = await Unit.findOne({
      where: { id: unitId },
      include: [
        {
          model: Property,
          as: "property",
        },
      ],
    });

    if (!unit) {
      res.status(404).json({
        success: false,
        message: "Unit not found.",
      });
      return;
    }

    // Get property details
    const property = await Property.findByPk(unit.propertyId);
    if (!property) {
      res.status(404).json({
        success: false,
        message: "Property not found.",
      });
      return;
    }

    // Find current active lease for this tenant-unit combination
    const currentLease = await Lease.findOne({
      where: {
        tenantId,
        unitId,
        status: "active",
      },
    });

    if (!currentLease) {
      res.status(400).json({
        success: false,
        message: "No active lease found for this tenant-unit combination.",
      });
      return;
    }

    // Generate unique transaction ID
    const transactionId = `TDGP_${Date.now()}_${crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase()}`;

    // Create payment record with lease association
    const payment = await Payment.create({
      tenantId,
      unitId,
      leaseId: currentLease.id,
      amount,
      mpesaTransactionId: transactionId,
      status: "pending",
      notes: description,
    });

    // If M-Pesa payment, initiate STK push
    if (paymentMethod === "mpesa" && phoneNumber) {
      try {
        const stkPushResponse = await mpesaService.initiateSTKPush({
          amount: Number(amount),
          phoneNumber,
          accountReference: unit.name,
          transactionDesc: `Rent payment for ${unit.name} at ${property.name}`,
        });

        logger.info(
          `M-Pesa STK Push initiated for payment: ${payment.id}, phone: ${phoneNumber}`,
          stkPushResponse
        );

        res.status(201).json({
          success: true,
          message: "Payment initiated successfully",
          data: {
            payment: {
              id: payment.id,
              tenantId: payment.tenantId,
              unitId: payment.unitId,
              amount: payment.amount,
              transactionId: payment.mpesaTransactionId,
              status: payment.status,
              paymentDate: payment.paymentDate,
              notes: payment.notes,
            },
            mpesa: {
              merchantRequestId: stkPushResponse.MerchantRequestID,
              checkoutRequestId: stkPushResponse.CheckoutRequestID,
              responseDescription: stkPushResponse.ResponseDescription,
              customerMessage: stkPushResponse.CustomerMessage,
            },
            instructions:
              "Please complete the payment on your phone when prompted.",
          },
        });
        return;
      } catch (mpesaError) {
        // If M-Pesa initiation fails, update payment status
        await payment.update({
          status: "failed",
          notes: `M-Pesa initiation failed: ${(mpesaError as Error).message}`,
        });

        res.status(500).json({
          success: false,
          message: "Failed to initiate M-Pesa payment",
          error:
            process.env.NODE_ENV === "development"
              ? (mpesaError as Error).message
              : undefined,
        });
        return;
      }
    }

    // For non-M-Pesa payments
    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: {
        payment: {
          id: payment.id,
          tenantId: payment.tenantId,
          unitId: payment.unitId,
          amount: payment.amount,
          transactionId: payment.mpesaTransactionId,
          status: payment.status,
          paymentDate: payment.paymentDate,
          notes: payment.notes,
        },
        instructions:
          "Payment recorded. Please ensure payment is completed through the specified method.",
      },
    });
  } catch (error) {
    logger.error("Error creating payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
};

/**
 * Get all payments for a user
 * @route GET /api/payments
 * @access Private (Landlord/Tenant)
 */
export const getAllPayments = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!["landlord", "tenant"].includes(req.user?.role || "")) {
      res.status(403).json({
        success: false,
        message: "Access denied. Only landlords and tenants can view payments.",
      });
      return;
    }

    const {
      status,
      startDate,
      endDate,
      unitId,
      page = 1,
      limit = 10,
    } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Build where clause based on user role
    let whereClause: any = {};
    let includeClause: any[] = [];

    if (req.user?.role === "tenant") {
      // Tenants can only see their own payments
      whereClause.tenantId = req.user.id;
      includeClause = [
        {
          model: Unit,
          as: "unit",
          attributes: ["id", "name", "rentAmount"],
          include: [
            {
              model: Property,
              as: "property",
              attributes: ["id", "name", "address"],
            },
          ],
        },
        {
          model: Lease,
          as: "lease",
          attributes: ["id", "startDate", "endDate", "monthlyRent", "status"],
          required: false,
        },
      ];
    } else if (req.user?.role === "landlord") {
      // Landlords can see payments for their properties
      includeClause = [
        {
          model: User,
          as: "tenant",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: Unit,
          as: "unit",
          attributes: ["id", "name", "rentAmount"],
          include: [
            {
              model: Property,
              as: "property",
              where: { landlordId: req.user.id },
              attributes: ["id", "name", "address"],
            },
          ],
        },
        {
          model: Lease,
          as: "lease",
          attributes: ["id", "startDate", "endDate", "monthlyRent", "status"],
          required: false,
        },
      ];
    }

    // Add filters
    if (status) {
      whereClause.status = status;
    }

    if (unitId) {
      whereClause.unitId = unitId;
    }

    if (startDate || endDate) {
      whereClause.paymentDate = {};
      if (startDate) {
        whereClause.paymentDate[Op.gte] = new Date(startDate as string);
      }
      if (endDate) {
        whereClause.paymentDate[Op.lte] = new Date(endDate as string);
      }
    }

    const { count, rows: payments } = await Payment.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: [["paymentDate", "DESC"]],
      distinct: true,
      col: "Payment.id",
      limit: Number(limit),
      offset,
    });

    // Calculate summary statistics
    const totalAmount = payments.reduce(
      (sum, payment) => sum + parseFloat(payment.amount.toString()),
      0
    );
    const successfulPayments = payments.filter(
      (p) => p.status === "successful"
    ).length;
    const pendingPayments = payments.filter(
      (p) => p.status === "pending"
    ).length;

    res.json({
      success: true,
      message: "Payments retrieved successfully",
      data: {
        payments,
        summary: {
          totalPayments: count,
          totalAmount,
          successfulPayments,
          pendingPayments,
          failedPayments: count - successfulPayments - pendingPayments,
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count,
          totalPages: Math.ceil(count / Number(limit)),
        },
        filters: {
          status: status || null,
          startDate: startDate || null,
          endDate: endDate || null,
          unitId: unitId || null,
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching payments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
};

/**
 * Get a specific payment by ID
 * @route GET /api/payments/:id
 * @access Private (Landlord/Tenant)
 */
export const getPaymentById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!["landlord", "tenant"].includes(req.user?.role || "")) {
      res.status(403).json({
        success: false,
        message:
          "Access denied. Only landlords and tenants can view payment details.",
      });
      return;
    }

    const payment = await Payment.findOne({
      where: { id },
      include: [
        {
          model: User,
          as: "tenant",
          attributes: ["id", "firstName", "lastName", "email", "phone"],
        },
        {
          model: Unit,
          as: "unit",
          attributes: ["id", "name", "rentAmount", "type"],
          include: [
            {
              model: Property,
              as: "property",
              attributes: ["id", "name", "address"],
            },
          ],
        },
      ],
    });

    if (!payment) {
      res.status(404).json({
        success: false,
        message: "Payment not found.",
      });
      return;
    }

    // Verify access permissions
    const paymentData = payment.toJSON() as any;

    if (req.user?.role === "tenant" && paymentData.tenantId !== req.user.id) {
      res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own payments.",
      });
      return;
    }

    if (req.user?.role === "landlord") {
      // Verify landlord owns the property
      const unit = paymentData.unit;
      if (!unit || !unit.property) {
        res.status(403).json({
          success: false,
          message: "Access denied.",
        });
        return;
      }

      // Check property ownership separately since we can't filter in the query above
      const property = await Property.findOne({
        where: {
          id: unit.property.id,
          landlordId: req.user.id,
        },
      });

      if (!property) {
        res.status(403).json({
          success: false,
          message: "Access denied.",
        });
        return;
      }
    }

    res.json({
      success: true,
      message: "Payment retrieved successfully",
      data: {
        payment: paymentData,
      },
    });
  } catch (error) {
    logger.error("Error fetching payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
};

/**
 * Update payment status
 * @route PUT /api/payments/:id
 * @access Private (Landlord only)
 */
export const updatePaymentStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes, receiptUrl } = req.body;

    if (req.user?.role !== "landlord") {
      res.status(403).json({
        success: false,
        message: "Access denied. Only landlords can update payment status.",
      });
      return;
    }

    // Find payment and verify landlord ownership
    const payment = await Payment.findOne({
      where: { id },
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
    });

    if (!payment) {
      res.status(404).json({
        success: false,
        message: "Payment not found or access denied.",
      });
      return;
    }

    // Update payment
    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes) updateData.notes = notes;
    if (receiptUrl) updateData.receiptUrl = receiptUrl;

    await payment.update(updateData);

    logger.info(`Payment status updated: ${id} by landlord: ${req.user.id}`);

    res.json({
      success: true,
      message: "Payment status updated successfully",
      data: {
        payment: {
          id: payment.id,
          status: payment.status,
          notes: payment.notes,
          receiptUrl: payment.receiptUrl,
          updatedAt: new Date(),
        },
      },
    });
  } catch (error) {
    logger.error("Error updating payment status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update payment status",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
};

/**
 * Get payment statistics
 * @route GET /api/payments/stats
 * @access Private (Landlord only)
 */
export const getPaymentStats = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { startDate, endDate, propertyId } = req.query;

    if (req.user?.role !== "landlord") {
      res.status(403).json({
        success: false,
        message: "Access denied. Only landlords can view payment statistics.",
      });
      return;
    }

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter[Op.gte] = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter[Op.lte] = new Date(endDate as string);
    }

    // Build where clause
    const whereClause: any = {};
    if (Object.keys(dateFilter).length > 0) {
      whereClause.paymentDate = dateFilter;
    }

    // Build include clause with property filter
    const includeClause: any = {
      model: Unit,
      as: "unit",
      include: [
        {
          model: Property,
          as: "property",
          where: { landlordId: req.user.id },
        },
      ],
    };

    if (propertyId) {
      includeClause.include[0].where.id = propertyId;
    }

    const payments = await Payment.findAll({
      where: whereClause,
      include: [includeClause],
      order: [["paymentDate", "DESC"]],
    });

    // Calculate comprehensive statistics
    const totalPayments = payments.length;
    const successfulPayments = payments.filter(
      (p) => p.status === "successful"
    );
    const pendingPayments = payments.filter((p) => p.status === "pending");
    const failedPayments = payments.filter((p) => p.status === "failed");

    const totalRevenue = successfulPayments.reduce(
      (sum, payment) => sum + parseFloat(payment.amount.toString()),
      0
    );
    const averagePayment =
      successfulPayments.length > 0
        ? totalRevenue / successfulPayments.length
        : 0;

    // Group by month for revenue trends
    const monthlyRevenue: any = {};
    successfulPayments.forEach((payment) => {
      const month = payment.paymentDate.toISOString().substring(0, 7); // YYYY-MM
      monthlyRevenue[month] =
        (monthlyRevenue[month] || 0) + parseFloat(payment.amount.toString());
    });

    // Group by property for property-wise statistics
    const propertyStats: any = {};
    payments.forEach((payment) => {
      const paymentData = payment.toJSON() as any;
      const propertyId = paymentData.unit?.property?.id;
      const propertyName = paymentData.unit?.property?.name;

      if (propertyId) {
        if (!propertyStats[propertyId]) {
          propertyStats[propertyId] = {
            propertyName,
            totalPayments: 0,
            successfulPayments: 0,
            totalRevenue: 0,
          };
        }

        propertyStats[propertyId].totalPayments++;
        if (payment.status === "successful") {
          propertyStats[propertyId].successfulPayments++;
          propertyStats[propertyId].totalRevenue += parseFloat(
            payment.amount.toString()
          );
        }
      }
    });

    const stats = {
      overview: {
        totalPayments,
        successfulPayments: successfulPayments.length,
        pendingPayments: pendingPayments.length,
        failedPayments: failedPayments.length,
        successRate:
          totalPayments > 0
            ? Math.round((successfulPayments.length / totalPayments) * 100)
            : 0,
      },
      revenue: {
        totalRevenue,
        averagePayment,
        monthlyTrends: Object.entries(monthlyRevenue).map(
          ([month, revenue]) => ({
            month,
            revenue,
          })
        ),
      },
      properties: Object.entries(propertyStats).map(
        ([id, stats]: [string, any]) => ({
          propertyId: id,
          ...stats,
        })
      ),
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    };

    res.json({
      success: true,
      message: "Payment statistics retrieved successfully",
      data: { stats },
    });
  } catch (error) {
    logger.error("Error fetching payment stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment statistics",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
};

/**
 * Handle M-Pesa callback
 * @route POST /api/payments/mpesa/callback
 * @access Public (M-Pesa service)
 */
export const handleMpesaCallback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Validate callback signature
    if (!mpesaService.validateCallback(req.headers, JSON.stringify(req.body))) {
      logger.warn("Invalid M-Pesa callback signature");
      res.status(400).json({
        ResultCode: 1,
        ResultDesc: "Invalid signature",
      });
      return;
    }

    const callbackResult = mpesaService.processCallback(req.body);
    logger.info("M-Pesa callback processed:", callbackResult);

    if (callbackResult.success && callbackResult.transactionId) {
      // Find payment by transaction ID pattern
      const payments = await Payment.findAll({
        where: {
          status: "pending",
          mpesaTransactionId: {
            [Op.like]: "TDGP_%",
          },
        },
        order: [["paymentDate", "DESC"]],
        limit: 1,
      });

      if (payments.length > 0) {
        const payment = payments[0];
        await payment.update({
          status: "successful",
          mpesaTransactionId: callbackResult.transactionId,
          notes: `M-Pesa payment completed. Receipt: ${callbackResult.transactionId}`,
        });

        logger.info(`Payment ${payment.id} marked as successful`);
      } else {
        logger.warn(
          `No pending payment found for M-Pesa transaction: ${callbackResult.transactionId}`
        );
      }
    } else {
      logger.warn(`M-Pesa payment failed: ${callbackResult.resultDesc}`);
    }

    // Always respond with success to M-Pesa
    res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Success",
    });
  } catch (error) {
    logger.error("Error handling M-Pesa callback:", error);
    // Still return success to M-Pesa to prevent retries
    res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Success",
    });
  }
};
