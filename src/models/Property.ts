import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface PropertyAttributes {
  id: string;
  landlordId: string;
  name: string;
  address?: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PropertyCreationAttributes
  extends Optional<PropertyAttributes, "id" | "createdAt" | "updatedAt"> {}

class Property
  extends Model<PropertyAttributes, PropertyCreationAttributes>
  implements PropertyAttributes
{
  public id!: string;
  public landlordId!: string;
  public name!: string;
  public address?: string;
  public description?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Property.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    landlordId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "properties",
    modelName: "Property",
    timestamps: true,
    underscored: true,
  }
);

export default Property;
