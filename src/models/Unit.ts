import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface UnitAttributes {
  id: string;
  propertyId: string;
  name: string;
  description?: string;
  type:
    | "apartment"
    | "villa"
    | "office"
    | "studio"
    | "penthouse"
    | "commercial";
  bedrooms: number;
  bathrooms: number;
  area?: number;
  rentAmount: number;
  amenities?: string;
  status: "vacant" | "occupied" | "maintenance" | "unavailable";
  imageUrls?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface UnitCreationAttributes
  extends Optional<
    UnitAttributes,
    | "id"
    | "type"
    | "bedrooms"
    | "bathrooms"
    | "status"
    | "createdAt"
    | "updatedAt"
  > {}

class Unit
  extends Model<UnitAttributes, UnitCreationAttributes>
  implements UnitAttributes
{
  public id!: string;
  public propertyId!: string;
  public name!: string;
  public description?: string;
  public type!:
    | "apartment"
    | "villa"
    | "office"
    | "studio"
    | "penthouse"
    | "commercial";
  public bedrooms!: number;
  public bathrooms!: number;
  public area?: number;
  public rentAmount!: number;
  public amenities?: string;
  public status!: "vacant" | "occupied" | "maintenance" | "unavailable";
  public imageUrls?: string[];
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Unit.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "properties",
        key: "id",
      },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM(
        "apartment",
        "villa",
        "office",
        "studio",
        "penthouse",
        "commercial"
      ),
      defaultValue: "apartment",
      allowNull: false,
    },
    bedrooms: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    bathrooms: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    area: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rentAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    amenities: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("vacant", "occupied", "maintenance", "unavailable"),
      defaultValue: "vacant",
      allowNull: false,
    },
    imageUrls: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "units",
    modelName: "Unit",
    timestamps: true,
    underscored: true,
  }
);

export default Unit;
