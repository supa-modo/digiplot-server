import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import bcrypt from "bcryptjs";

// User attributes interface
export interface UserAttributes {
  id: string;
  role: "admin" | "landlord" | "tenant";
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  status: "active" | "inactive" | "suspended" | "deactivated";
  lastLogin?: Date;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
  twoFactorSecret?: string | null;
  twoFactorEnabled?: boolean;
  failedLoginAttempts?: number;
  lockoutUntil?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Optional fields for creation
interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    | "id"
    | "createdAt"
    | "updatedAt"
    | "status"
    | "lastLogin"
    | "resetPasswordToken"
    | "resetPasswordExpires"
    | "twoFactorSecret"
    | "twoFactorEnabled"
    | "failedLoginAttempts"
    | "lockoutUntil"
  > {}

// User model class
class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: string;
  public role!: "admin" | "landlord" | "tenant";
  public email!: string;
  public password!: string;
  public firstName!: string;
  public lastName!: string;
  public phone?: string;
  public emergencyContactName?: string;
  public emergencyContactPhone?: string;
  public status!: "active" | "inactive" | "suspended" | "deactivated";
  public lastLogin?: Date;
  public resetPasswordToken?: string | null;
  public resetPasswordExpires?: Date | null;
  public twoFactorSecret?: string | null;
  public twoFactorEnabled?: boolean;
  public failedLoginAttempts?: number;
  public lockoutUntil?: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Computed property to get full name
  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Instance method to compare password
  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  // Method to check if account is locked
  public isLocked(): boolean {
    if (!this.lockoutUntil) return false;
    return this.lockoutUntil > new Date();
  }

  // Method to increment failed login attempts
  public async incrementFailedLogins(): Promise<void> {
    const maxAttempts = 5;
    const lockoutTime = 30 * 60 * 1000; // 30 minutes

    // Increment failed attempts
    this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;

    // If max attempts reached, set lockout
    if (this.failedLoginAttempts >= maxAttempts) {
      this.lockoutUntil = new Date(Date.now() + lockoutTime);
    }

    await this.save();
  }

  // Method to reset failed login attempts
  public async resetFailedLogins(): Promise<void> {
    if (this.failedLoginAttempts || this.lockoutUntil) {
      this.failedLoginAttempts = 0;
      this.lockoutUntil = null;
      await this.save();
    }
  }

  // Static method to search users
  public static async searchUsers(query: string, limit: number = 10) {
    const { Op } = require("sequelize");
    return this.findAll({
      where: {
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${query}%` } },
          { lastName: { [Op.iLike]: `%${query}%` } },
          { email: { [Op.iLike]: `%${query}%` } },
        ],
        status: "active",
      },
      attributes: ["id", "firstName", "lastName", "email", "role", "status"],
      limit,
    });
  }
}

// Initialize User model
User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    role: {
      type: DataTypes.ENUM("admin", "landlord", "tenant"),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    emergencyContactName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    emergencyContactPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive", "suspended", "deactivated"),
      defaultValue: "active",
      allowNull: false,
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    twoFactorSecret: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    twoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    failedLoginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    lockoutUntil: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "users",
    modelName: "User",
    timestamps: true,
    underscored: true,
    hooks: {
      // Hash password before creating user
      beforeCreate: async (user: User) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      // Hash password before updating if password field changed
      beforeUpdate: async (user: User) => {
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

export default User;
