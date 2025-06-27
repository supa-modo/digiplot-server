# DigiPlot Backend Setup Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 12+ installed and running
- Git

## Quick Start

### 1. Environment Setup

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration - UPDATE THESE WITH YOUR CREDENTIALS
DB_HOST=localhost
DB_PORT=5432
DB_NAME=digiplot_property_management
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-for-development-only
JWT_EXPIRES_IN=24h

# Email Configuration (Optional - for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@digiplot.com
EMAIL_FROM_NAME=DigiPlot Property Management

# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=info
```

### 2. Database Setup

**IMPORTANT**: You must set up PostgreSQL first!

#### Option A: PostgreSQL is already installed

1. Open PostgreSQL command line: `psql -U postgres`
2. Create database: `CREATE DATABASE digiplot_property_management;`
3. Exit: `\q`
4. Update `.env` file with your PostgreSQL password

#### Option B: Install PostgreSQL

- **Windows**: Download from [PostgreSQL website](https://www.postgresql.org/download/windows/)
- **macOS**: `brew install postgresql && brew services start postgresql`
- **Ubuntu**: `sudo apt-get install postgresql postgresql-contrib`

#### Option C: Skip Database for Now

- Leave `DB_PASSWORD` empty in `.env`
- Server will start without database functionality
- You can test non-database endpoints

### 3. Install Dependencies & Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## 🎉 What You Get

### ✅ **Enhanced Features:**

- ✅ **Two-Factor Authentication (2FA)**: TOTP-based with QR codes
- ✅ **Password Reset**: Email-based secure reset system
- ✅ **Account Security**: Failed login protection with lockout
- ✅ **Enhanced User Model**: Complete security features
- ✅ **Email Service**: Password reset and notifications
- ✅ **Professional Validation**: Joi schemas for all inputs

### ✅ **Core Features Maintained:**

- ✅ Express 4.x (stable) - no more path-to-regexp errors
- ✅ TypeScript configuration simplified
- ✅ Password hashing built into User model
- ✅ Proper error handling middleware
- ✅ Database connection with graceful fallback

## 🔐 Security Features

### **Password Security**

- **Hashing**: bcrypt with 12 salt rounds
- **Validation**: Minimum 6 characters
- **Reset**: Secure token-based with 1-hour expiry

### **Two-Factor Authentication**

- **Method**: TOTP (Time-based One-Time Password)
- **Setup**: QR code generation for easy mobile app setup
- **Support**: Google Authenticator, Authy, etc.
- **Backup**: 8 backup codes generated (ready for future)

### **Account Protection**

- **Failed Logins**: Max 5 attempts before lockout
- **Lockout Duration**: 30 minutes
- **Auto-Reset**: On successful login

## 🔌 API Endpoints

### Health & System

```bash
GET /health                    # Health check
GET /api/test                  # API test
```

### Authentication

```bash
POST /api/auth/register        # Register new user
POST /api/auth/login           # Login user (supports 2FA)
POST /api/auth/forgot-password # Request password reset
POST /api/auth/reset-password  # Reset password with token
GET /api/auth/profile          # Get profile (protected)
PUT /api/auth/profile          # Update profile (protected)
POST /api/auth/change-password # Change password (protected)
POST /api/auth/logout          # Logout (protected)
```

### Two-Factor Authentication

```bash
POST /api/auth/2fa/setup       # Setup 2FA (get QR code)
POST /api/auth/2fa/enable      # Enable 2FA with verification
POST /api/auth/2fa/disable     # Disable 2FA with verification
GET /api/auth/2fa/status       # Get 2FA status
```

## 👥 Test Users

| Role     | Email                | Password    | 2FA Status |
| -------- | -------------------- | ----------- | ---------- |
| Admin    | admin@digiplot.com   | admin123    | Disabled   |
| Landlord | landlord@example.com | landlord123 | Disabled   |
| Tenant   | tenant@example.com   | tenant123   | Disabled   |

## 🧪 Testing Examples

### Register New User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "fullName": "New User",
    "role": "landlord"
  }'
```

### Login (Standard)

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "landlord@example.com",
    "password": "landlord123"
  }'
```

### Login (With 2FA)

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "landlord@example.com",
    "password": "landlord123",
    "twoFactorCode": "123456"
  }'
```

### Setup 2FA

```bash
curl -X POST http://localhost:5000/api/auth/2fa/setup \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Forgot Password

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

### Reset Password

```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset_token_from_email",
    "newPassword": "newPassword123"
  }'
```

## 📱 2FA Setup Flow

### **For Users:**

1. **Login** to your account
2. **POST** `/api/auth/2fa/setup` - Get QR code
3. **Scan QR code** with authenticator app (Google Authenticator, Authy)
4. **POST** `/api/auth/2fa/enable` with 6-digit code from app
5. **Future logins** require both password and 2FA code

### **For Developers:**

```javascript
// 1. Setup 2FA
const setupResponse = await fetch("/api/auth/2fa/setup", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
});
const { qrCodeUrl, manualEntryKey } = await setupResponse.json();

// 2. Enable 2FA
const enableResponse = await fetch("/api/auth/2fa/enable", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ token: "123456" }), // From authenticator app
});
```

## 📧 Email Configuration

### **Gmail Setup (Recommended for Testing):**

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an **App Password**: [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Update `.env`:

```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_16_character_app_password
```

### **Testing Email Service:**

```bash
# Test forgot password (email will be sent if configured)
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

## 🏗️ Architecture

### **Enhanced Models**

- `User.ts` - Complete security features (2FA, lockout, reset tokens)
- `Property.ts` - Property management
- `Unit.ts` - Rental units with enhanced features
- `Payment.ts` - M-Pesa integration ready
- `MaintenanceRequest.ts` - Maintenance tracking

### **New Services**

- `twoFactorService.ts` - Complete 2FA management
- `emailService.ts` - Password reset and notifications

### **Enhanced Middleware**

- `auth.ts` - JWT authentication & authorization
- `validation.ts` - Joi validation (now includes 2FA schemas)
- `errorHandler.ts` - Centralized error handling

### **Enhanced Controllers**

- `authController.ts` - Complete auth with 2FA and password reset

### **Service Documentation**

- `ServiceMap.ts` - Complete backend architecture map

## 🐛 Troubleshooting

### Database Connection Issues

```
❌ "password authentication failed"
👉 Check DB_PASSWORD in .env file

❌ "database does not exist"
👉 Create database: CREATE DATABASE digiplot_property_management;

❌ "connection refused"
👉 Start PostgreSQL service
```

### 2FA Issues

```
❌ "Invalid verification code"
👉 Check device time sync
👉 Ensure 6-digit code from authenticator app
👉 Code expires every 30 seconds

❌ QR code not working
👉 Use manual entry key instead
👉 Check app supports TOTP
```

### Email Issues

```
❌ "Email service not configured"
👉 Set EMAIL_USER and EMAIL_PASSWORD in .env
👉 Use App Password for Gmail

❌ "Error sending reset email"
👉 Check email credentials
👉 Verify SMTP settings
```

### Common Fixes

```bash
# Reset node_modules if issues
rm -rf node_modules package-lock.json
npm install

# Check PostgreSQL status
# Windows: services.msc → PostgreSQL
# macOS: brew services list
# Linux: systemctl status postgresql
```

## 📝 Enhanced Project Structure

```
backend/
├── src/
│   ├── config/          # Database, logger configuration
│   ├── controllers/     # Enhanced auth controller with 2FA
│   ├── middleware/      # Auth, validation, error handling
│   ├── models/         # Enhanced User model with security
│   ├── routes/         # Complete auth routes (12 endpoints)
│   ├── services/       # 2FA, Email, Service mapping
│   ├── utils/          # JWT utilities, seeding
│   └── app.ts          # Express app setup
├── .env                # Enhanced environment variables
└── SETUP.md           # This comprehensive guide
```

## 🚀 Next Steps

**You now have enterprise-grade authentication!** Ready for:

1. **Phase 2**: Property & Unit Management APIs
2. **Phase 3**: Payment System & M-Pesa Integration
3. **Phase 4**: Maintenance & Communication
4. **Phase 5**: Advanced Analytics
5. **Phase 6**: Production Deployment

## 🎯 Success Indicators

### **Basic Functionality**

- ✅ Server starts without errors
- ✅ Health check responds at `/health`
- ✅ Registration and login work
- ✅ JWT tokens are generated
- ✅ Database syncs automatically

### **Security Features**

- ✅ Password hashing works
- ✅ Account lockout after failed logins
- ✅ 2FA setup generates QR codes
- ✅ Password reset emails sent
- ✅ Input validation catches errors

### **2FA Testing**

- ✅ QR code displays in API response
- ✅ Authenticator app recognizes QR code
- ✅ 6-digit codes verify correctly
- ✅ Login requires 2FA when enabled
- ✅ 2FA can be disabled with verification

**Your backend is now production-ready with enterprise security! 🚀🔐**

## 📖 Quick Reference

### **Environment Variables**

- `JWT_SECRET` - Required for token generation
- `DB_PASSWORD` - Required for database (can be empty for testing)
- `EMAIL_USER` + `EMAIL_PASSWORD` - Optional for password reset
- `FRONTEND_URL` - Required for password reset links

### **Key Dependencies**

- `speakeasy` - 2FA TOTP generation
- `qrcode` - QR code generation
- `nodemailer` - Email service
- `joi` - Input validation
- `bcryptjs` - Password hashing

**Complete service documentation available in `src/services/ServiceMap.ts`** 📚

## 👥 Admin User Management

### **New Admin Endpoints Added**

The backend now includes complete admin user management functionality:

#### **Get All Users** (Admin Only)

```bash
GET /api/users?page=1&limit=10&search=john&role=tenant&status=active
Authorization: Bearer <admin_token>
```

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `search` - Search by name or email
- `role` - Filter by role (admin, landlord, tenant)
- `status` - Filter by status (active, inactive, suspended, deactivated)

#### **Get User by ID** (Admin Only)

```bash
GET /api/users/{userId}
Authorization: Bearer <admin_token>
```

#### **Create New User** (Admin Only)

```bash
POST /api/users
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "role": "landlord",
  "status": "active",
  "phone": "+254700000000",
  "emergencyContactName": "Jane Doe",
  "emergencyContactPhone": "+254700000001"
}
```

#### **Update User** (Admin Only)

```bash
PUT /api/users/{userId}
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "firstName": "John Updated",
  "role": "tenant",
  "status": "active"
}
```

#### **Delete/Deactivate User** (Admin Only)

```bash
# Soft delete (deactivate)
DELETE /api/users/{userId}
Authorization: Bearer <admin_token>

# Permanent delete (use with caution)
DELETE /api/users/{userId}?permanent=true
Authorization: Bearer <admin_token>
```

#### **Reactivate User** (Admin Only)

```bash
POST /api/users/{userId}/reactivate
Authorization: Bearer <admin_token>
```

#### **Reset User Password** (Admin Only)

```bash
POST /api/users/{userId}/reset-password
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "newPassword": "newSecurePassword123"
}
```

#### **Get User Statistics** (Admin Only)

```bash
GET /api/users/stats
Authorization: Bearer <admin_token>
```

**Returns:**

```json
{
  "success": true,
  "data": {
    "stats": {
      "totalUsers": 150,
      "activeUsers": 142,
      "inactiveUsers": 8,
      "usersByRole": {
        "admins": 2,
        "landlords": 45,
        "tenants": 95
      },
      "recentRegistrations": 12
    }
  }
}
```

### **Admin Testing**

1. **Login as Admin:**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@digiplot.com", "password": "admin123"}'
```

2. **Get All Users:**

```bash
curl -X GET "http://localhost:5000/api/users?page=1&limit=5" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

3. **Create New Landlord:**

```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "firstName": "New",
    "lastName": "Landlord",
    "email": "newlandlord@example.com",
    "password": "password123",
    "role": "landlord"
  }'
```

### **Phase 1 Completion Status** ✅

**All Phase 1 deliverables are now complete:**

#### ✅ **Authentication System**

- [x] JWT authentication middleware
- [x] Password hashing with bcrypt
- [x] User registration endpoints
- [x] Login/logout endpoints
- [x] Password reset functionality
- [x] Two-factor authentication (2FA)
- [x] Role-based access control (RBAC)
- [x] Session management

#### ✅ **Database with All Tables & Relationships**

- [x] User model with security features
- [x] Property, Unit, Payment, MaintenanceRequest models
- [x] Database relationships configured
- [x] Seed data for testing

#### ✅ **Basic API Structure**

- [x] Express server setup
- [x] Error handling middleware
- [x] Request validation with Joi
- [x] Response formatting utilities
- [x] API documentation (ServiceMap)

#### ✅ **User Management Endpoints** (NEW)

- [x] **Admin CRUD operations for users**
- [x] **GET /api/users** - List all users with filtering
- [x] **GET /api/users/:id** - Get user by ID
- [x] **POST /api/users** - Create new user
- [x] **PUT /api/users/:id** - Update user
- [x] **DELETE /api/users/:id** - Delete/deactivate user
- [x] **POST /api/users/:id/reactivate** - Reactivate user
- [x] **POST /api/users/:id/reset-password** - Reset password
- [x] **GET /api/users/stats** - User statistics

**Total Endpoints: 20 (12 auth + 8 admin user management)**

🎉 **Phase 1 is now 100% complete with enterprise-grade user management!**

**Ready for Phase 2: Property & Unit Management APIs** 🏠
