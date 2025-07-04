import { DataTypes, Model, Optional, Association } from "sequelize";
import sequelize from "../config/database";

export interface LeaseAttributes {
  id: string;
  tenantId: string;
  unitId: string;
  landlordId: string;
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  securityDeposit: number;
  status: "active" | "expired" | "terminated" | "pending";
  moveInDate?: Date;
  moveOutDate?: Date;
  renewalTerms?: string;
  notes?: string;
  terminationReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface LeaseCreationAttributes
  extends Optional<
    LeaseAttributes,
    | "id"
    | "status"
    | "moveInDate"
    | "moveOutDate"
    | "renewalTerms"
    | "notes"
    | "terminationReason"
    | "createdAt"
    | "updatedAt"
  > {}

class Lease
  extends Model<LeaseAttributes, LeaseCreationAttributes>
  implements LeaseAttributes
{
  public id!: string;
  public tenantId!: string;
  public unitId!: string;
  public landlordId!: string;
  public startDate!: Date;
  public endDate!: Date;
  public monthlyRent!: number;
  public securityDeposit!: number;
  public status!: "active" | "expired" | "terminated" | "pending";
  public moveInDate?: Date;
  public moveOutDate?: Date;
  public renewalTerms?: string;
  public notes?: string;
  public terminationReason?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association properties (populated by includes)
  public tenant?: any;
  public landlord?: any;
  public unit?: any;
  public payments?: any[];

  // Static associations
  public static associations: {
    tenant: Association<Lease, any>;
    landlord: Association<Lease, any>;
    unit: Association<Lease, any>;
    payments: Association<Lease, any>;
  };

  // Helper methods
  public get isActive(): boolean {
    return this.status === "active";
  }

  public get duration(): number {
    return Math.ceil(
      (this.endDate.getTime() - this.startDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }

  public isExpiring(daysFromNow: number = 30): boolean {
    const now = new Date();
    const expiryThreshold = new Date(
      now.getTime() + daysFromNow * 24 * 60 * 60 * 1000
    );
    return this.endDate <= expiryThreshold && this.status === "active";
  }

  public async terminate(reason?: string): Promise<void> {
    this.status = "terminated";
    this.moveOutDate = new Date();
    this.terminationReason = reason;
    await this.save();
  }
}

Lease.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    unitId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "units",
        key: "id",
      },
    },
    landlordId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    monthlyRent: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    securityDeposit: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM("active", "expired", "terminated", "pending"),
      defaultValue: "pending",
      allowNull: false,
    },
    moveInDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    moveOutDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    renewalTerms: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    terminationReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "leases",
    modelName: "Lease",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["tenant_id"],
      },
      {
        fields: ["unit_id"],
      },
      {
        fields: ["landlord_id"],
      },
      {
        fields: ["status"],
      },
      {
        unique: true,
        fields: ["unit_id", "status"],
        where: {
          status: "active",
        },
        name: "one_active_lease_per_unit",
      },
    ],
  }
);

export default Lease;
