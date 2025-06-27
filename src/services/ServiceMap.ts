/**
 * DigiPlot Backend Service Map
 *
 * This file provides a comprehensive map of all backend services, files, and functions
 * to help developers understand the system architecture and locate functionality.
 */

export interface ServiceEndpoint {
  method: string;
  path: string;
  description: string;
  middleware: string[];
  controller: string;
  validation?: string;
}

export interface ServiceModule {
  name: string;
  description: string;
  file: string;
  functions: string[];
  dependencies: string[];
}

// ===========================================
// API ENDPOINTS MAP
// ===========================================

export const API_ENDPOINTS: Record<string, ServiceEndpoint[]> = {
  // Authentication Endpoints
  AUTH: [
    {
      method: "POST",
      path: "/api/auth/register",
      description: "Register a new user (landlord/tenant)",
      middleware: ["validate(authSchema.register)"],
      controller: "authController.register",
      validation: "authSchema.register",
    },
    {
      method: "POST",
      path: "/api/auth/login",
      description: "Login user and get JWT token (supports 2FA)",
      middleware: ["validate(authSchema.login)"],
      controller: "authController.login",
      validation: "authSchema.login",
    },
    {
      method: "POST",
      path: "/api/auth/forgot-password",
      description: "Request password reset email",
      middleware: ["validate(authSchema.forgotPassword)"],
      controller: "authController.forgotPassword",
      validation: "authSchema.forgotPassword",
    },
    {
      method: "POST",
      path: "/api/auth/reset-password",
      description: "Reset password with token from email",
      middleware: ["validate(authSchema.resetPassword)"],
      controller: "authController.resetPassword",
      validation: "authSchema.resetPassword",
    },
    {
      method: "GET",
      path: "/api/auth/profile",
      description: "Get current user profile",
      middleware: ["authenticateUser"],
      controller: "authController.getProfile",
    },
    {
      method: "PUT",
      path: "/api/auth/profile",
      description: "Update user profile",
      middleware: ["authenticateUser", "validate(authSchema.updateProfile)"],
      controller: "authController.updateProfile",
      validation: "authSchema.updateProfile",
    },
    {
      method: "POST",
      path: "/api/auth/change-password",
      description: "Change user password",
      middleware: ["authenticateUser", "validate(authSchema.changePassword)"],
      controller: "authController.changePassword",
      validation: "authSchema.changePassword",
    },
    {
      method: "POST",
      path: "/api/auth/2fa/setup",
      description: "Setup 2FA (generate QR code and secret)",
      middleware: ["authenticateUser"],
      controller: "authController.setup2FA",
    },
    {
      method: "POST",
      path: "/api/auth/2fa/enable",
      description: "Enable 2FA with verification code",
      middleware: ["authenticateUser", "validate(authSchema.enable2FA)"],
      controller: "authController.enable2FA",
      validation: "authSchema.enable2FA",
    },
    {
      method: "POST",
      path: "/api/auth/2fa/disable",
      description: "Disable 2FA with verification code",
      middleware: ["authenticateUser", "validate(authSchema.disable2FA)"],
      controller: "authController.disable2FA",
      validation: "authSchema.disable2FA",
    },
    {
      method: "GET",
      path: "/api/auth/2fa/status",
      description: "Get 2FA status for current user",
      middleware: ["authenticateUser"],
      controller: "authController.get2FAStatus",
    },
    {
      method: "POST",
      path: "/api/auth/logout",
      description: "Logout user (client-side token removal)",
      middleware: ["authenticateUser"],
      controller: "authController.logout",
    },
  ],

  // User Management Endpoints (Admin Only)
  USERS: [
    {
      method: "GET",
      path: "/api/users",
      description: "Get all users with pagination and filtering",
      middleware: ["authenticateUser", "adminOnly"],
      controller: "userController.getAllUsers",
    },
    {
      method: "GET",
      path: "/api/users/stats",
      description: "Get user statistics and counts",
      middleware: ["authenticateUser", "adminOnly"],
      controller: "userController.getUserStats",
    },
    {
      method: "GET",
      path: "/api/users/:id",
      description: "Get user by ID with full details",
      middleware: ["authenticateUser", "adminOnly"],
      controller: "userController.getUserById",
    },
    {
      method: "POST",
      path: "/api/users",
      description: "Create new user (admin can create any role)",
      middleware: [
        "authenticateUser",
        "adminOnly",
        "validate(userSchema.createUser)",
      ],
      controller: "userController.createUser",
      validation: "userSchema.createUser",
    },
    {
      method: "PUT",
      path: "/api/users/:id",
      description: "Update user by ID (admin can update any user)",
      middleware: [
        "authenticateUser",
        "adminOnly",
        "validate(userSchema.updateUser)",
      ],
      controller: "userController.updateUser",
      validation: "userSchema.updateUser",
    },
    {
      method: "DELETE",
      path: "/api/users/:id",
      description: "Delete/deactivate user by ID",
      middleware: ["authenticateUser", "adminOnly"],
      controller: "userController.deleteUser",
    },
    {
      method: "POST",
      path: "/api/users/:id/reactivate",
      description: "Reactivate deactivated user",
      middleware: ["authenticateUser", "adminOnly"],
      controller: "userController.reactivateUser",
    },
    {
      method: "POST",
      path: "/api/users/:id/reset-password",
      description: "Reset user password (admin operation)",
      middleware: [
        "authenticateUser",
        "adminOnly",
        "validate(userSchema.resetPassword)",
      ],
      controller: "userController.resetUserPassword",
      validation: "userSchema.resetPassword",
    },
  ],

  // Health & System Endpoints
  SYSTEM: [
    {
      method: "GET",
      path: "/health",
      description: "Health check endpoint",
      middleware: [],
      controller: "built-in",
    },
    {
      method: "GET",
      path: "/api/test",
      description: "API test endpoint",
      middleware: [],
      controller: "built-in",
    },
  ],
};

// ===========================================
// SERVICE MODULES MAP
// ===========================================

export const SERVICE_MODULES: Record<string, ServiceModule> = {
  // Models
  USER_MODEL: {
    name: "User Model",
    description:
      "Enhanced user model with 2FA, password reset, and account lockout",
    file: "src/models/User.ts",
    functions: [
      "comparePassword",
      "searchUsers",
      "isLocked",
      "incrementFailedLogins",
      "resetFailedLogins",
    ],
    dependencies: ["bcryptjs", "sequelize"],
  },

  PROPERTY_MODEL: {
    name: "Property Model",
    description: "Property data model for managing rental properties",
    file: "src/models/Property.ts",
    functions: [],
    dependencies: ["sequelize"],
  },

  UNIT_MODEL: {
    name: "Unit Model",
    description: "Rental unit data model with enhanced features",
    file: "src/models/Unit.ts",
    functions: [],
    dependencies: ["sequelize"],
  },

  PAYMENT_MODEL: {
    name: "Payment Model",
    description: "Payment tracking and M-Pesa integration model",
    file: "src/models/Payment.ts",
    functions: [],
    dependencies: ["sequelize"],
  },

  MAINTENANCE_MODEL: {
    name: "Maintenance Request Model",
    description: "Property maintenance request tracking",
    file: "src/models/MaintenanceRequest.ts",
    functions: [],
    dependencies: ["sequelize"],
  },

  // Controllers
  AUTH_CONTROLLER: {
    name: "Authentication Controller",
    description: "Complete authentication with 2FA and password reset",
    file: "src/controllers/authController.ts",
    functions: [
      "register",
      "login",
      "getProfile",
      "updateProfile",
      "changePassword",
      "logout",
      "forgotPassword",
      "resetPassword",
      "setup2FA",
      "enable2FA",
      "disable2FA",
      "get2FAStatus",
    ],
    dependencies: [
      "User model",
      "generateToken",
      "logger",
      "twoFactorService",
      "emailService",
    ],
  },

  // Services
  TWO_FACTOR_SERVICE: {
    name: "Two-Factor Authentication Service",
    description: "TOTP-based 2FA with QR code generation and verification",
    file: "src/services/twoFactorService.ts",
    functions: [
      "setup2FA",
      "enable2FA",
      "disable2FA",
      "verifyLogin2FA",
      "get2FAStatus",
      "adminDisable2FA",
      "verifyToken",
    ],
    dependencies: ["speakeasy", "qrcode", "User model", "crypto"],
  },

  EMAIL_SERVICE: {
    name: "Email Service",
    description: "Email notifications for password reset and 2FA",
    file: "src/services/emailService.ts",
    functions: [
      "sendPasswordResetEmail",
      "sendWelcomeEmail",
      "send2FAEnabledEmail",
      "testEmailConfiguration",
    ],
    dependencies: ["nodemailer", "logger"],
  },

  // Middleware
  AUTH_MIDDLEWARE: {
    name: "Authentication Middleware",
    description: "JWT authentication and role-based authorization",
    file: "src/middleware/auth.ts",
    functions: [
      "authenticateUser",
      "authorizeRoles",
      "adminOnly",
      "landlordOrAdmin",
      "authenticatedUser",
      "optionalAuth",
    ],
    dependencies: ["jsonwebtoken", "User model"],
  },

  VALIDATION_MIDDLEWARE: {
    name: "Validation Middleware",
    description: "Joi-based request validation including 2FA schemas",
    file: "src/middleware/validation.ts",
    functions: [
      "validate",
      "authSchema",
      "propertySchema",
      "unitSchema",
      "maintenanceSchema",
    ],
    dependencies: ["joi"],
  },

  ERROR_MIDDLEWARE: {
    name: "Error Handling Middleware",
    description: "Centralized error handling and logging",
    file: "src/middleware/errorHandler.ts",
    functions: ["errorHandler", "notFoundHandler", "ApiError"],
    dependencies: ["logger"],
  },

  // Utilities
  AUTH_UTILS: {
    name: "Authentication Utilities",
    description: "JWT token generation and verification utilities",
    file: "src/utils/auth.ts",
    functions: [
      "generateToken",
      "verifyToken",
      "generatePasswordResetToken",
      "verifyPasswordResetToken",
    ],
    dependencies: ["jsonwebtoken"],
  },

  SEED_DATA: {
    name: "Database Seeding",
    description: "Initial data seeding for development",
    file: "src/utils/seedData.ts",
    functions: ["seedInitialData"],
    dependencies: ["User model", "Property model", "Unit model", "logger"],
  },

  // Configuration
  DATABASE_CONFIG: {
    name: "Database Configuration",
    description: "PostgreSQL connection with enhanced error handling",
    file: "src/config/database.ts",
    functions: ["testConnection"],
    dependencies: ["sequelize", "pg", "winston"],
  },

  LOGGER_CONFIG: {
    name: "Logger Configuration",
    description: "Winston logging setup",
    file: "src/config/logger.ts",
    functions: [],
    dependencies: ["winston"],
  },

  // Routes
  AUTH_ROUTES: {
    name: "Authentication Routes",
    description:
      "Complete authentication routes including 2FA and password reset",
    file: "src/routes/authRoutes.ts",
    functions: [],
    dependencies: ["authController", "authMiddleware", "validation"],
  },
};

// ===========================================
// DATABASE SCHEMA MAP
// ===========================================

export const DATABASE_TABLES = {
  users: {
    description: "Enhanced user accounts with 2FA and security features",
    model: "User",
    fields: [
      "id",
      "role",
      "email",
      "password",
      "firstName",
      "lastName",
      "phone",
      "emergencyContactName",
      "emergencyContactPhone",
      "status",
      "lastLogin",
      "resetPasswordToken",
      "resetPasswordExpires",
      "twoFactorSecret",
      "twoFactorEnabled",
      "failedLoginAttempts",
      "lockoutUntil",
      "createdAt",
      "updatedAt",
    ],
    relationships: [
      "hasMany: properties",
      "hasMany: payments",
      "hasMany: maintenanceRequests",
    ],
  },
  properties: {
    description: "Rental properties",
    model: "Property",
    relationships: ["belongsTo: User (landlord)", "hasMany: units"],
  },
  units: {
    description: "Individual rental units",
    model: "Unit",
    relationships: [
      "belongsTo: Property",
      "hasMany: payments",
      "hasMany: maintenanceRequests",
    ],
  },
  payments: {
    description: "Payment records and M-Pesa transactions",
    model: "Payment",
    relationships: ["belongsTo: User (tenant)", "belongsTo: Unit"],
  },
  maintenance_requests: {
    description: "Property maintenance requests",
    model: "MaintenanceRequest",
    relationships: ["belongsTo: User (tenant)", "belongsTo: Unit"],
  },
};

// ===========================================
// SECURITY FEATURES MAP
// ===========================================

export const SECURITY_FEATURES = {
  PASSWORD_SECURITY: {
    hashing: "bcrypt with 12 salt rounds",
    validation: "Minimum 6 characters",
    reset: "Secure token-based with 1-hour expiry",
  },
  TWO_FACTOR_AUTH: {
    method: "TOTP (Time-based One-Time Password)",
    provider: "speakeasy library",
    qrCode: "Generated for easy setup",
    backupCodes: "8 backup codes generated (future feature)",
  },
  ACCOUNT_LOCKOUT: {
    maxAttempts: 5,
    lockoutDuration: "30 minutes",
    autoReset: "On successful login",
  },
  JWT_TOKENS: {
    algorithm: "HS256",
    expiry: "24 hours (configurable)",
    claims: ["userId", "email", "role"],
  },
};

// ===========================================
// MIDDLEWARE CHAIN MAP
// ===========================================

export const MIDDLEWARE_CHAINS = {
  PUBLIC_ENDPOINTS: ["helmet", "cors", "compression", "morgan", "express.json"],
  AUTHENTICATED_ENDPOINTS: ["...PUBLIC_ENDPOINTS", "authenticateUser"],
  VALIDATED_ENDPOINTS: ["...PUBLIC_ENDPOINTS", "validate(schema)"],
  PROTECTED_ENDPOINTS: [
    "...PUBLIC_ENDPOINTS",
    "authenticateUser",
    "authorizeRoles",
  ],
  TWO_FA_ENDPOINTS: ["...AUTHENTICATED_ENDPOINTS", "validate(2FA_schema)"],
};

// ===========================================
// DEVELOPMENT HELPERS
// ===========================================

export const DEV_HELPERS = {
  TEST_USERS: {
    admin: { email: "admin@digiplot.com", password: "admin123", role: "admin" },
    landlord: {
      email: "landlord@example.com",
      password: "landlord123",
      role: "landlord",
    },
    tenant: {
      email: "tenant@example.com",
      password: "tenant123",
      role: "tenant",
    },
  },

  TEST_2FA_FLOW: [
    "1. Login with test user",
    "2. POST /api/auth/2fa/setup - Get QR code",
    "3. Scan QR code with authenticator app",
    "4. POST /api/auth/2fa/enable with 6-digit code",
    "5. Logout and login again with 2FA code",
  ],

  TEST_PASSWORD_RESET: [
    "1. POST /api/auth/forgot-password with email",
    "2. Check logs for reset token (email not configured)",
    "3. POST /api/auth/reset-password with token and new password",
  ],

  COMMON_TASKS: {
    "Add new endpoint": [
      "1. Create controller function",
      "2. Add validation schema (if needed)",
      "3. Add route with middleware",
      "4. Update this service map",
      "5. Test endpoint",
    ],
    "Enable email service": [
      "1. Configure EMAIL_* variables in .env",
      "2. Test with /api/auth/forgot-password",
      "3. Check email delivery",
    ],
    "Add new 2FA method": [
      "1. Extend twoFactorService",
      "2. Add validation schemas",
      "3. Update User model if needed",
      "4. Add controller endpoints",
    ],
  },
};

// ===========================================
// USAGE EXAMPLES
// ===========================================

export const USAGE_EXAMPLES = {
  AUTHENTICATION: {
    register: `
      POST /api/auth/register
      {
        "email": "user@example.com",
        "password": "password123", 
        "firstName": "John",
        "lastName": "Doe",
        "role": "landlord"
      }
    `,
    login: `
      POST /api/auth/login
      {
        "email": "user@example.com",
        "password": "password123"
      }
    `,
    loginWith2FA: `
      POST /api/auth/login
      {
        "email": "user@example.com",
        "password": "password123",
        "twoFactorCode": "123456"
      }
    `,
    profile: `
      GET /api/auth/profile
      Headers: { Authorization: "Bearer <token>" }
    `,
  },

  PASSWORD_RESET: {
    forgot: `
      POST /api/auth/forgot-password
      {
        "email": "user@example.com"
      }
    `,
    reset: `
      POST /api/auth/reset-password
      {
        "token": "reset_token_from_email",
        "newPassword": "newPassword123"
      }
    `,
  },

  TWO_FACTOR_AUTH: {
    setup: `
      POST /api/auth/2fa/setup
      Headers: { Authorization: "Bearer <token>" }
      Response: { qrCodeUrl, manualEntryKey }
    `,
    enable: `
      POST /api/auth/2fa/enable
      Headers: { Authorization: "Bearer <token>" }
      {
        "token": "123456"
      }
    `,
    disable: `
      POST /api/auth/2fa/disable
      Headers: { Authorization: "Bearer <token>" }
      {
        "token": "123456"
      }
    `,
    status: `
      GET /api/auth/2fa/status
      Headers: { Authorization: "Bearer <token>" }
    `,
  },
};

export default {
  API_ENDPOINTS,
  SERVICE_MODULES,
  DATABASE_TABLES,
  SECURITY_FEATURES,
  MIDDLEWARE_CHAINS,
  DEV_HELPERS,
  USAGE_EXAMPLES,
};
