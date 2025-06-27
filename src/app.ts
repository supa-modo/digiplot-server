import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import path from "path";
import dotenv from "dotenv";

import logger from "./config/logger";
import sequelize, { testConnection } from "./config/database";

// Import models to ensure they are initialized
import "./models";

// Import routes
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";

// Import middleware
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

// Import seeding utility
import { seedInitialData } from "./utils/seedData";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan("combined"));

// Static file serving for uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "DigiPlot Property Management API is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
  });
});

// API routes base
app.use("/api", (req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  next();
});

// Test API endpoint
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "API is working!",
    timestamp: new Date().toISOString(),
  });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// User management routes (Admin only)
app.use("/api/users", userRoutes);

// TODO: Add more API routes here
// app.use('/api/properties', propertyRoutes);
// app.use('/api/units', unitRoutes);
// app.use('/api/payments', paymentRoutes);
// app.use('/api/maintenance', maintenanceRoutes);

// 404 handler for unknown routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Database connection and server startup
const startServer = async () => {
  try {
    // Test database connection with better error handling
    const isDbConnected = await testConnection();

    if (!isDbConnected) {
      logger.error("🚫 Skipping database operations due to connection failure");
      logger.info(
        "💡 You can still test the API endpoints that don't require database"
      );

      // Start server without database operations
      app.listen(PORT, () => {
        logger.info(
          `🚀 DigiPlot API is running on port ${PORT} (Database: Disconnected)`
        );
        logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
        logger.info(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
        logger.warn(
          "⚠️ Database-dependent endpoints will not work until database is properly configured"
        );
      });
      return;
    }

    // Sync database (only in development)
    if (process.env.NODE_ENV === "development") {
      await sequelize.sync({ alter: true });
      logger.info("Database synchronized successfully.");

      // Seed initial data in development
      await seedInitialData();
    }

    // Start server with full functionality
    app.listen(PORT, () => {
      logger.info(
        `🚀 DigiPlot Property Management API is running on port ${PORT}`
      );
      logger.info(`📖 Environment: ${process.env.NODE_ENV || "development"}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
      logger.info(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
      logger.info(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
      logger.info(`📊 Database: Connected & Synchronized`);
    });
  } catch (error) {
    logger.error("Unable to start server:", error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  await sequelize.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received. Shutting down gracefully...");
  await sequelize.close();
  process.exit(0);
});

// Start the server
startServer();

export default app;
