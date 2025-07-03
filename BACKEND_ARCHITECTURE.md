# DigiPlot Backend Architecture Documentation

## 🏗️ Overview

The DigiPlot Property Management System backend is a robust Node.js/Express application built with TypeScript and PostgreSQL, designed to handle multi-tenant property management operations.

## 📂 Project Structure

```
backend/
├── src/
│   ├── app.ts                 # Main application entry point
│   ├── config/               # Configuration files
│   │   ├── database.ts       # Sequelize database configuration
│   │   └── logger.ts         # Winston logging configuration
│   ├── controllers/          # Route handlers and business logic
│   │   ├── authController.ts         # Authentication & user management
│   │   ├── userController.ts         # User CRUD operations (Admin)
│   │   ├── propertyController.ts     # Property management
│   │   ├── unitController.ts         # Unit management  
│   │   ├── tenantController.ts       # Tenant management
│   │   ├── paymentController.ts      # Payment & M-Pesa integration
│   │   └── maintenanceController.ts  # Maintenance requests
│   ├── middleware/           # Custom middleware
│   │   ├── auth.ts          # JWT authentication middleware
│   │   ├── errorHandler.ts  # Global error handling
│   │   └── validation.ts    # Joi request validation
│   ├── models/              # Sequelize ORM models
│   │   ├── index.ts         # Model associations
│   │   ├── User.ts          # User model (Admin/Landlord/Tenant)
│   │   ├── Property.ts      # Property model
│   │   ├── Unit.ts          # Unit model
│   │   ├── Payment.ts       # Payment model
│   │   └── MaintenanceRequest.ts # Maintenance request model
│   ├── routes/              # Express route definitions
│   │   ├── authRoutes.ts    # Authentication routes
│   │   ├── userRoutes.ts    # User management routes
│   │   ├── propertyRoutes.ts # Property routes
│   │   ├── unitRoutes.ts    # Unit routes
│   │   ├── tenantRoutes.ts  # Tenant routes
│   │   ├── paymentRoutes.ts # Payment routes
│   │   └── maintenanceRoutes.ts # Maintenance routes
│   ├── services/            # Business logic services
│   │   ├── emailService.ts  # Email notifications
│   │   ├── ServiceMap.ts    # Service registry
│   │   └── twoFactorService.ts # 2FA implementation
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts         # Custom types and interfaces
│   └── utils/               # Utility functions
│       ├── auth.ts          # Auth utility functions
│       └── seedData.ts      # Database seeding utilities
├── uploads/                 # File upload directory
├── logs/                    # Application logs
├── migrations/              # Database migrations
├── seeders/                 # Database seeders
└── docs/                    # API documentation
```

## 🔧 Core Technologies

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT with bcryptjs
- **Validation**: Joi
- **Logging**: Winston
- **Payment**: M-Pesa STK Push Integration

## 🗄️ Database Models & Relationships

### **User Model**
```typescript
interface UserAttributes {
  id: string (UUID)
  role: "admin" | "landlord" | "tenant"
  email: string (unique)
  password: string (hashed)
  firstName: string
  lastName: string
  phone?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  status: "active" | "inactive" | "suspended" | "deactivated"
  lastLogin?: Date
  twoFactorEnabled?: boolean
  // ... additional security fields
}
```

### **Property Model**
```typescript
interface PropertyAttributes {
  id: string (UUID)
  landlordId: string (FK -> User)
  name: string
  description?: string
  address: string
  city: string
  state: string
  zipCode: string
  propertyType: "apartment" | "house" | "condo" | "commercial"
  totalUnits: number
  amenities?: string[]
  images?: string[]
}
```

### **Unit Model**
```typescript
interface UnitAttributes {
  id: string (UUID)
  propertyId: string (FK -> Property)
  name: string
  description?: string
  type: "studio" | "1br" | "2br" | "3br" | "4br+" | "commercial"
  bedrooms?: number
  bathrooms?: number
  area?: number (sq ft)
  rentAmount: number
  amenities?: string[]
  status: "vacant" | "occupied" | "maintenance" | "unavailable"
}
```

### **Payment Model**
```typescript
interface PaymentAttributes {
  id: string (UUID)
  tenantId?: string (FK -> User)
  unitId?: string (FK -> Unit)
  amount: number
  paymentDate: Date
  mpesaTransactionId: string (unique)
  status: "successful" | "failed" | "pending"
  receiptUrl?: string
  notes?: string
}
```

### **MaintenanceRequest Model**
```typescript
interface MaintenanceRequestAttributes {
  id: string (UUID)
  tenantId?: string (FK -> User)
  unitId?: string (FK -> Unit)
  title: string
  description?: string
  category: "plumbing" | "electrical" | "hvac" | "security" | "general" | "appliances" | "flooring" | "painting" | "pool" | "garden"
  priority: "low" | "medium" | "high" | "urgent"
  imageUrl?: string
  status: "pending" | "in_progress" | "resolved" | "cancelled"
  responseNotes?: string
}
```

### **Model Relationships**
```
User (Landlord) ──┐
                  ├─ hasMany ──> Property ──┬─ hasMany ──> Unit
User (Tenant) ────┼─ hasMany ──> Payment ───┤
                  └─ hasMany ──> MaintenanceRequest ─┘
```

## 🛣️ API Routes & Endpoints

### **Authentication Routes** (`/api/auth`)
```
POST   /login              # User login with 2FA support
POST   /register           # User registration  
POST   /forgot-password    # Password reset request
POST   /reset-password     # Password reset confirmation
POST   /refresh-token      # JWT token refresh
POST   /logout             # User logout
POST   /verify-2fa         # 2FA verification
```

### **User Management Routes** (`/api/users`) - Admin Only
```
POST   /               # Create user (Admin only)
GET    /               # Get all users with filtering
GET    /:id            # Get user by ID
PUT    /:id            # Update user
DELETE /:id            # Delete/deactivate user
POST   /:id/reset-password  # Admin password reset
```

### **Property Management Routes** (`/api/properties`) - Landlord
```
POST   /               # Create property
GET    /               # Get landlord's properties
GET    /:id            # Get property details
PUT    /:id            # Update property
DELETE /:id            # Delete property
GET    /:id/stats      # Property statistics
```

### **Unit Management Routes** (`/api/units`) - Landlord
```
POST   /                      # Create unit
GET    /                      # Get all units for landlord
GET    /property/:propertyId  # Get units by property
GET    /:id                   # Get unit details
PUT    /:id                   # Update unit
DELETE /:id                   # Delete unit
GET    /:id/stats             # Unit statistics
```

### **Tenant Management Routes** (`/api/tenants`) - Landlord
```
POST   /                    # Create tenant
GET    /                    # Get all tenants for landlord
GET    /:id                 # Get tenant details
PUT    /:id                 # Update tenant
POST   /:id/assign-unit     # Assign tenant to unit
POST   /:id/remove-unit     # Remove tenant from unit
```

### **Payment Routes** (`/api/payments`) - Landlord/Tenant
```
POST   /                 # Create payment (initiate M-Pesa)
GET    /                 # Get payments (role-based filtering)
GET    /:id              # Get payment details
PUT    /:id              # Update payment status (Landlord only)
GET    /stats            # Payment statistics (Landlord only)
POST   /mpesa/callback   # M-Pesa callback handler (Public)
```

### **Maintenance Routes** (`/api/maintenance`) - Tenant/Landlord
```
POST   /          # Create maintenance request
GET    /          # Get maintenance requests (role-based)
GET    /:id       # Get specific request
PUT    /:id       # Update request (different permissions)
DELETE /:id       # Delete request (Tenant only, pending)
GET    /stats     # Maintenance statistics (Landlord only)
```

## 🔐 Authentication & Authorization

### **JWT Authentication**
- JWT tokens with 1-hour expiration
- Refresh tokens for session management
- 2FA support with time-based tokens
- Password hashing with bcryptjs

### **Role-Based Access Control**
```typescript
Roles: "admin" | "landlord" | "tenant"

Admin:    Full system access, user management
Landlord: Property/unit/tenant/payment management for owned properties
Tenant:   View own data, create payments/maintenance requests
```

### **Security Middleware**
- `authenticateUser()`: JWT verification
- `validate()`: Joi request validation
- Property ownership verification in controllers
- Rate limiting and CORS protection

## 📊 Business Logic & Features

### **Multi-Tenant Architecture**
- Complete data isolation between landlords
- Property ownership verification on all operations
- Tenant-landlord relationship management

### **Payment System**
- M-Pesa STK Push integration framework
- Payment status tracking (pending → successful/failed)
- Automatic receipt generation
- Payment history and analytics

### **Maintenance Management**
- Category-based request system (plumbing, electrical, etc.)
- Priority levels (low, medium, high, urgent)
- Status workflow (pending → in_progress → resolved)
- Image upload support for requests

### **Analytics & Reporting**
- Property-wise revenue tracking
- Payment success rates and trends
- Maintenance resolution metrics
- Unit occupancy statistics

## 🔧 Key Controllers & Their Functions

### **AuthController**
- User authentication with 2FA
- Password reset functionality
- Token management
- Security logging

### **PropertyController**
- CRUD operations for properties
- Landlord-specific filtering
- Property statistics calculation
- Ownership verification

### **UnitController**
- Unit management with property association
- Occupancy status tracking
- Payment/maintenance history integration
- Comprehensive statistics

### **TenantController**
- Tenant lifecycle management
- Unit assignment/removal
- Tenant-specific data access
- Payment history tracking

### **PaymentController**
- Payment initiation and tracking
- M-Pesa integration and callbacks
- Revenue analytics
- Receipt management

### **MaintenanceController**
- Request creation and management
- Role-based update permissions
- Status tracking and analytics
- Image upload handling

## 🛡️ Error Handling & Validation

### **Global Error Handling**
```typescript
// Standardized error responses
{
  success: false,
  message: "Error description",
  error?: "Development details" // Only in dev mode
}
```

### **Validation Schemas**
- Joi validation for all input data
- Custom validation rules for business logic
- Type-safe validation with TypeScript

### **Logging Strategy**
- Winston logger with multiple transports
- Structured logging for debugging
- Security event logging
- Performance monitoring

## 🚀 Performance & Scalability

### **Database Optimization**
- Proper indexing on foreign keys
- Optimized queries with includes
- Pagination for large datasets
- Query result caching opportunities

### **API Performance**
- Efficient filtering and searching
- Minimal data transfer
- Compression middleware
- Response optimization

## 📝 Configuration & Environment

### **Environment Variables**
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=digiplot
DB_USER=postgres
DB_PASSWORD=password

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRE=1h
REFRESH_TOKEN_SECRET=refresh-secret

# Server
PORT=5000
NODE_ENV=development

# M-Pesa Integration
MPESA_CONSUMER_KEY=your-key
MPESA_CONSUMER_SECRET=your-secret
MPESA_SHORTCODE=your-shortcode
MPESA_PASSKEY=your-passkey
```

## 🔄 Development Workflow

### **Code Structure**
- TypeScript strict mode enabled
- ESLint for code quality
- Consistent error handling patterns
- Modular architecture with clear separation

### **Testing Strategy**
- Unit tests for controllers
- Integration tests for API endpoints
- Database transaction rollback in tests
- Mock external services (M-Pesa)

## 🚦 Status & Completeness

### **✅ Completed Features**
- Authentication system with 2FA
- Complete CRUD operations for all entities
- Role-based access control
- M-Pesa integration framework
- Comprehensive error handling
- Logging and monitoring
- API documentation
- Database relationships and constraints

### **🔧 Ready for Enhancement**
- File upload system for maintenance images
- Advanced reporting and analytics
- Email notification system
- Audit logging for admin actions
- API rate limiting
- Caching layer implementation

## 🎯 Quick Reference for Development

### **Adding New Features**
1. Create model in `/models/` with proper associations
2. Add controller in `/controllers/` following auth pattern
3. Create routes in `/routes/` with validation
4. Add to main app.ts routing
5. Update this documentation

### **Common Patterns**
- All controllers use `AuthenticatedRequest` type
- Consistent error response format
- Property ownership verification for landlords
- Pagination support with `page` and `limit` params
- Logging for all major operations

### **Database Queries**
- Use Sequelize includes for relationships
- Always verify ownership in landlord operations
- Filter by user role in data access
- Use transactions for multi-table operations

---

This architecture provides a solid foundation for a production-ready property management system with room for future enhancements and scaling. 