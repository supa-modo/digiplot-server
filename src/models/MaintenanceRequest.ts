import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface MaintenanceRequestAttributes {
  id: string;
  tenantId?: string;
  unitId?: string;
  title: string;
  description?: string;
  category:
    | "plumbing"
    | "electrical"
    | "hvac"
    | "security"
    | "general"
    | "appliances"
    | "flooring"
    | "painting"
    | "pool"
    | "garden";
  priority: "low" | "medium" | "high" | "urgent";
  imageUrl?: string;
  status: "pending" | "in_progress" | "resolved" | "cancelled";
  responseNotes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MaintenanceRequestCreationAttributes
  extends Optional<
    MaintenanceRequestAttributes,
    "id" | "category" | "priority" | "status" | "createdAt" | "updatedAt"
  > {}

class MaintenanceRequest
  extends Model<
    MaintenanceRequestAttributes,
    MaintenanceRequestCreationAttributes
  >
  implements MaintenanceRequestAttributes
{
  public id!: string;
  public tenantId?: string;
  public unitId?: string;
  public title!: string;
  public description?: string;
  public category!:
    | "plumbing"
    | "electrical"
    | "hvac"
    | "security"
    | "general"
    | "appliances"
    | "flooring"
    | "painting"
    | "pool"
    | "garden";
  public priority!: "low" | "medium" | "high" | "urgent";
  public imageUrl?: string;
  public status!: "pending" | "in_progress" | "resolved" | "cancelled";
  public responseNotes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

MaintenanceRequest.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
    unitId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "units",
        key: "id",
      },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.ENUM(
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
      ),
      defaultValue: "general",
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM("low", "medium", "high", "urgent"),
      defaultValue: "medium",
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "in_progress", "resolved", "cancelled"),
      defaultValue: "pending",
      allowNull: false,
    },
    responseNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "maintenance_requests",
    modelName: "MaintenanceRequest",
    timestamps: true,
    underscored: true,
  }
);

export default MaintenanceRequest;
