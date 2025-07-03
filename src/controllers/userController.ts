import { Request, Response } from "express";
import { User } from "../models";
import { AuthenticatedRequest } from "../types";
import logger from "../config/logger";
import { Op } from "sequelize";

// Get all users (Admin only)
export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { page = 1, limit = 10, search, role, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Build where clause
    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (role) {
      whereClause.role = role;
    }

    if (status) {
      whereClause.status = status;
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: [
        "id",
        "firstName",
        "lastName",
        "email",
        "role",
        "status",
        "phone",
        "lastLogin",
        "twoFactorEnabled",
        "createdAt",
        "updatedAt",
      ],
      order: [["createdAt", "DESC"]],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      message: "Users retrieved successfully",
      data: {
        users: users.map((user) => ({
          ...user.toJSON(),
          fullName: user.fullName,
        })),
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(count / Number(limit)),
          totalUsers: count,
          hasNext: offset + Number(limit) < count,
          hasPrev: Number(page) > 1,
        },
      },
    });
  } catch (error) {
    logger.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve users",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get user by ID (Admin only)
export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: [
        "id",
        "firstName",
        "lastName",
        "email",
        "role",
        "status",
        "phone",
        "emergencyContactName",
        "emergencyContactPhone",
        "lastLogin",
        "twoFactorEnabled",
        "failedLoginAttempts",
        "lockoutUntil",
        "createdAt",
        "updatedAt",
      ],
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.json({
      success: true,
      message: "User retrieved successfully",
      data: {
        user: {
          ...user.toJSON(),
          fullName: user.fullName,
          isLocked: user.isLocked(),
        },
      },
    });
  } catch (error) {
    logger.error("Get user by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Create user (Admin only)
export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      role,
      phone,
      emergencyContactName,
      emergencyContactPhone,
      status = "active",
    } = req.body;

    // Check if user already exists
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

    // Create user (password will be hashed automatically by the model hook)
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      role,
      phone,
      emergencyContactName,
      emergencyContactPhone,
      status,
    });

    logger.info(`User created by admin: ${email} (${role})`);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          role: user.role,
          status: user.status,
          phone: user.phone,
          emergencyContactName: user.emergencyContactName,
          emergencyContactPhone: user.emergencyContactPhone,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    logger.error("Create user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update user (Admin only)
export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      email,
      firstName,
      lastName,
      role,
      status,
      phone,
      emergencyContactName,
      emergencyContactPhone,
    } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Check if email already exists (if email is being changed)
    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({
        where: {
          email: email.toLowerCase(),
          id: { [Op.ne]: id },
        },
      });

      if (existingUser) {
        res.status(400).json({
          success: false,
          message: "Email already exists",
        });
        return;
      }
    }

    // Update user
    await user.update({
      email: email ? email.toLowerCase() : user.email,
      firstName: firstName !== undefined ? firstName : user.firstName,
      lastName: lastName !== undefined ? lastName : user.lastName,
      role: role !== undefined ? role : user.role,
      status: status !== undefined ? status : user.status,
      phone: phone !== undefined ? phone : user.phone,
      emergencyContactName:
        emergencyContactName !== undefined
          ? emergencyContactName
          : user.emergencyContactName,
      emergencyContactPhone:
        emergencyContactPhone !== undefined
          ? emergencyContactPhone
          : user.emergencyContactPhone,
    });

    logger.info(`User updated by admin: ${user.email}`);

    res.json({
      success: true,
      message: "User updated successfully",
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          role: user.role,
          status: user.status,
          phone: user.phone,
          emergencyContactName: user.emergencyContactName,
          emergencyContactPhone: user.emergencyContactPhone,
          lastLogin: user.lastLogin,
          twoFactorEnabled: user.twoFactorEnabled,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    logger.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Delete/Deactivate user (Admin only)
export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { permanent = false } = req.query;

    const user = await User.findByPk(id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Prevent admin from deleting themselves
    const authenticatedReq = req as AuthenticatedRequest;
    if (authenticatedReq.user && authenticatedReq.user.id === id) {
      res.status(400).json({
        success: false,
        message: "Cannot delete your own account",
      });
      return;
    }

    if (permanent === "true") {
      // Permanent deletion
      await user.destroy();
      logger.info(`User permanently deleted by admin: ${user.email}`);

      res.json({
        success: true,
        message: "User permanently deleted",
      });
    } else {
      // Soft deletion (deactivate)
      await user.update({ status: "deactivated" });
      logger.info(`User deactivated by admin: ${user.email}`);

      res.json({
        success: true,
        message: "User deactivated successfully",
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            status: user.status,
          },
        },
      });
    }
  } catch (error) {
    logger.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Reactivate user (Admin only)
export const reactivateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    await user.update({ status: "active" });

    logger.info(`User reactivated by admin: ${user.email}`);

    res.json({
      success: true,
      message: "User reactivated successfully",
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          status: user.status,
        },
      },
    });
  } catch (error) {
    logger.error("Reactivate user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reactivate user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Reset user password (Admin only)
export const resetUserPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Update password (will be hashed automatically by the model hook)
    await user.update({ password: newPassword });

    // Reset failed login attempts and lockout
    await user.update({
      failedLoginAttempts: 0,
      lockoutUntil: null,
    });

    logger.info(`Password reset by admin for user: ${user.email}`);

    res.json({
      success: true,
      message: "User password reset successfully",
    });
  } catch (error) {
    logger.error("Reset user password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset user password",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get user statistics (Admin only)
export const getUserStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const [totalUsers, activeUsers, landlords, tenants, admins, recentUsers] =
      await Promise.all([
        User.count(),
        User.count({ where: { status: "active" } }),
        User.count({ where: { role: "landlord", status: "active" } }),
        User.count({ where: { role: "tenant", status: "active" } }),
        User.count({ where: { role: "admin", status: "active" } }),
        User.count({
          where: {
            createdAt: {
              [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        }),
      ]);

    res.json({
      success: true,
      message: "User statistics retrieved successfully",
      data: {
        stats: {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          usersByRole: {
            admins,
            landlords,
            tenants,
          },
          recentRegistrations: recentUsers,
        },
      },
    });
  } catch (error) {
    logger.error("Get user stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user statistics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
