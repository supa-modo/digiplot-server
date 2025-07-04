import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface PaymentAttributes {
  id: string;
  tenantId?: string;
  unitId?: string;
  leaseId?: string;
  amount: number;
  paymentDate: Date;
  mpesaTransactionId: string;
  status: "successful" | "failed" | "pending";
  receiptUrl?: string;
  notes?: string;
}

interface PaymentCreationAttributes
  extends Optional<PaymentAttributes, "id" | "paymentDate"> {}

class Payment
  extends Model<PaymentAttributes, PaymentCreationAttributes>
  implements PaymentAttributes
{
  public id!: string;
  public tenantId?: string;
  public unitId?: string;
  public leaseId?: string;
  public amount!: number;
  public paymentDate!: Date;
  public mpesaTransactionId!: string;
  public status!: "successful" | "failed" | "pending";
  public receiptUrl?: string;
  public notes?: string;
}

Payment.init(
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
    leaseId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "leases",
        key: "id",
      },
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    paymentDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    mpesaTransactionId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM("successful", "failed", "pending"),
      allowNull: false,
    },
    receiptUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "payments",
    modelName: "Payment",
    timestamps: false,
    underscored: true,
  }
);

export default Payment;
