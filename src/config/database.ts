import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import winston from "winston";

dotenv.config();

const {
  DB_HOST = "localhost",
  DB_PORT = "5432",
  DB_NAME = "digiplot_property_management",
  DB_USER = "postgres",
  DB_PASSWORD = "",
  DB_SSL = "false",
  NODE_ENV = "development",
} = process.env;

// Validate required database configuration
if (!DB_PASSWORD && NODE_ENV === "production") {
  throw new Error("Database password is required in production environment");
}

if (!DB_NAME) {
  throw new Error("Database name (DB_NAME) is required");
}

// Create Sequelize instance
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD || "", {
  host: DB_HOST,
  port: parseInt(DB_PORT),
  dialect: "postgres",
  logging:
    NODE_ENV === "development" ? (msg: string) => winston.info(msg) : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    ssl:
      DB_SSL === "true"
        ? {
            require: true,
            rejectUnauthorized: false,
          }
        : false,
  },
  timezone: "+03:00", // East Africa Time
  retry: {
    match: [
      /ConnectionError/,
      /ConnectionRefusedError/,
      /ConnectionTimedOutError/,
      /TimeoutError/,
    ],
    max: 3,
  },
});

// Test connection function
export const testConnection = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    winston.info("✅ Database connection established successfully");
    return true;
  } catch (error) {
    winston.error("❌ Database connection failed:", error);

    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes("password authentication failed")) {
        winston.error("🔑 Please check your database password in .env file");
      } else if (
        error.message.includes("database") &&
        error.message.includes("does not exist")
      ) {
        winston.error("🗄️ Database does not exist. Please create it first:");
        winston.error(`   CREATE DATABASE ${DB_NAME};`);
      } else if (error.message.includes("connection refused")) {
        winston.error("🔌 PostgreSQL server is not running or not accessible");
      }
    }

    return false;
  }
};

export default sequelize;
