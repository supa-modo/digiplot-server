# DigiPlot Property Management System - Backend Development Plan

## Project Overview

Building a Node.js/Express backend with TypeScript, PostgreSQL, and JWT authentication to support the React frontend for the multi-tenant property management system.

---

## Phase 1: Backend Foundation & Authentication (Week 1) ✅

### 1.1 Project Setup

- [x] Initialize Node.js project with TypeScript
- [x] Set up Express server with middleware
- [x] Configure PostgreSQL connection with Sequelize ORM
- [x] Set up environment configuration
- [x] Create project structure
- [x] Add logging with Winston
- [x] Configure CORS and security middleware

### 1.2 Database Setup

- [ ] Implement database schema from DbSchema.md
- [ ] Create Sequelize models for all entities
- [ ] Set up database migrations
- [ ] Create seed data based on frontend demo data
- [ ] Add database indexes for performance

### 1.3 Authentication System

- [ ] JWT authentication middleware
- [ ] Password hashing with bcrypt
- [ ] User registration endpoints
- [ ] Login/logout endpoints
- [ ] Password reset functionality
- [ ] Role-based access control (RBAC)
- [ ] Session management

### 1.4 API Foundation

- [ ] Set up API routing structure
- [ ] Error handling middleware
- [ ] Request validation with Joi
- [ ] Response formatting utilities
- [ ] API documentation setup with Swagger

**Deliverables:**

- Working authentication system
- Database with all tables and relationships
- Basic API structure
- User management endpoints

---

## Phase 2: Core Property & User Management (Week 2)

### 2.1 User Management APIs

- [ ] GET /api/users/profile - Get user profile
- [ ] PUT /api/users/profile - Update user profile
- [ ] POST /api/users/change-password - Change password
- [ ] GET /api/landlords - Admin: Get all landlords
- [ ] POST /api/landlords - Admin: Create landlord
- [ ] GET /api/tenants - Landlord: Get tenants

### 2.2 Property Management APIs

- [ ] GET /api/properties - Get landlord properties
- [ ] POST /api/properties - Create new property
- [ ] GET /api/properties/:id - Get property details
- [ ] PUT /api/properties/:id - Update property
- [ ] DELETE /api/properties/:id - Delete property

### 2.3 Unit Management APIs (Enhanced)

- [ ] GET /api/properties/:propertyId/units - Get units for property
- [ ] POST /api/properties/:propertyId/units - Create unit
- [ ] GET /api/units/:id - Get unit details with history
- [ ] PUT /api/units/:id - Update unit
- [ ] DELETE /api/units/:id - Delete unit
- [ ] GET /api/units/:id/tenants - Get tenant history for unit
- [ ] GET /api/units/:id/payments - Get payment history for unit
- [ ] GET /api/units/:id/maintenance - Get maintenance history for unit

### 2.4 Tenant Management APIs

- [ ] POST /api/tenants - Create/assign tenant to unit
- [ ] PUT /api/tenants/:id - Update tenant details
- [ ] DELETE /api/tenants/:id - Remove tenant
- [ ] POST /api/tenants/:id/assign-unit - Assign tenant to unit
- [ ] GET /api/tenants/:id/history - Get tenant lease history

**Deliverables:**

- Complete CRUD operations for properties, units, and tenants
- Enhanced unit management with history tracking
- Proper data relationships and validation

---

## Phase 3: Payment System & M-Pesa Integration (Week 3)

### 3.1 Payment Management APIs

- [ ] GET /api/payments - Get payments (filtered by user role)
- [ ] POST /api/payments - Create payment record
- [ ] GET /api/payments/:id - Get payment details
- [ ] PUT /api/payments/:id - Update payment status
- [ ] GET /api/tenants/:id/payments - Get tenant payment history
- [ ] GET /api/units/:id/payments - Get unit payment history

### 3.2 M-Pesa Integration (Daraja API)

- [ ] M-Pesa STK Push implementation
- [ ] Payment webhook handler
- [ ] Transaction verification
- [ ] Payment status updates
- [ ] Error handling for failed payments
- [ ] M-Pesa credential management per landlord

### 3.3 Receipt Generation

- [ ] PDF receipt generation with PDFKit
- [ ] Email receipt delivery
- [ ] Receipt storage and retrieval
- [ ] Custom receipt templates per landlord
- [ ] Receipt download endpoints

### 3.4 Financial Analytics

- [ ] Monthly revenue calculations
- [ ] Unit-level financial tracking
- [ ] Collection rate analytics
- [ ] Outstanding balance calculations
- [ ] Financial reporting endpoints

**Deliverables:**

- Working M-Pesa payment integration
- Automated receipt generation
- Payment tracking and analytics
- Financial reporting system

---

## Phase 4: Maintenance & Communication System (Week 4)

### 4.1 Maintenance Request APIs

- [ ] GET /api/maintenance - Get maintenance requests
- [ ] POST /api/maintenance - Create maintenance request
- [ ] GET /api/maintenance/:id - Get request details
- [ ] PUT /api/maintenance/:id - Update request status
- [ ] DELETE /api/maintenance/:id - Delete request
- [ ] GET /api/units/:id/maintenance - Unit maintenance history
- [ ] POST /api/maintenance/:id/response - Add response/notes

### 4.2 File Upload System

- [ ] Image upload for maintenance requests
- [ ] Document upload for tenants (ID documents)
- [ ] Property/unit image upload
- [ ] File storage with AWS S3 or local storage
- [ ] Image compression and optimization
- [ ] File validation and security

### 4.3 Notification System

- [ ] Email notification service
- [ ] Notification templates
- [ ] Event-driven notifications
- [ ] Notification preferences
- [ ] SMS integration (future)

### 4.4 Communication Features

- [ ] Maintenance request comments
- [ ] Status update notifications
- [ ] Email alerts for landlords/tenants

**Deliverables:**

- Complete maintenance request system
- File upload and management
- Email notification system
- Communication workflow

---

## Phase 5: Advanced Features & Analytics (Week 5)

### 5.1 Advanced Analytics APIs

- [ ] Dashboard analytics endpoints
- [ ] Revenue forecasting
- [ ] Occupancy rate tracking
- [ ] Tenant retention analysis
- [ ] Maintenance cost tracking
- [ ] Property performance metrics

### 5.2 Reporting System

- [ ] Monthly income reports
- [ ] Unit performance reports
- [ ] Tenant payment reports
- [ ] Maintenance summary reports
- [ ] Export to PDF/CSV
- [ ] Scheduled report generation

### 5.3 Admin Features

- [ ] System-wide analytics
- [ ] Landlord management
- [ ] System monitoring
- [ ] Audit logging
- [ ] Data backup and restore

### 5.4 Search & Filtering

- [ ] Advanced search functionality
- [ ] Multi-criteria filtering
- [ ] Pagination optimization
- [ ] Search indexing
- [ ] Full-text search

**Deliverables:**

- Advanced analytics and reporting
- Admin management system
- Optimized search and filtering
- Performance monitoring

---

## Phase 6: Security, Testing & Deployment (Week 6)

### 6.1 Security Enhancements

- [ ] API rate limiting
- [ ] Input sanitization
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] HTTPS enforcement
- [ ] Security headers
- [ ] API key management

### 6.2 Testing

- [ ] Unit tests with Jest
- [ ] Integration tests
- [ ] API endpoint testing
- [ ] Database testing
- [ ] Authentication testing
- [ ] Payment system testing

### 6.3 Performance Optimization

- [ ] Database query optimization
- [ ] Caching with Redis
- [ ] API response compression
- [ ] Image optimization
- [ ] Background job processing
- [ ] Connection pooling

### 6.4 Deployment & DevOps

- [ ] Docker containerization
- [ ] Environment configuration
- [ ] CI/CD pipeline with GitHub Actions
- [ ] Production deployment
- [ ] Database migrations in production
- [ ] Health check endpoints
- [ ] Monitoring and logging

**Deliverables:**

- Secure, tested backend system
- Production deployment
- Performance optimization
- Monitoring and maintenance

---

## Technology Stack

### Core Technologies

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL 14+
- **ORM:** Sequelize
- **Authentication:** JWT + bcrypt

### Additional Services

- **File Storage:** AWS S3 or local storage
- **Email:** Nodemailer + SendGrid/SMTP
- **PDF Generation:** PDFKit
- **Payment:** M-Pesa Daraja API
- **Validation:** Joi or express-validator
- **Documentation:** Swagger/OpenAPI
- **Testing:** Jest + Supertest
- **Logging:** Winston

### Development Tools

- **API Testing:** Postman/Insomnia
- **Database:** pgAdmin/DBeaver
- **Version Control:** Git
- **CI/CD:** GitHub Actions
- **Containerization:** Docker

---

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Custom middleware
│   ├── models/         # Sequelize models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   ├── types/          # TypeScript types
│   └── app.ts          # Express app setup
├── migrations/         # Database migrations
├── seeders/           # Database seeders
├── tests/             # Test files
├── uploads/           # File uploads (local)
├── docs/              # API documentation
└── docker/            # Docker configuration
```

---

## API Endpoints Overview

### Authentication

- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/refresh
- POST /api/auth/forgot-password
- POST /api/auth/reset-password

### Users

- GET /api/users/profile
- PUT /api/users/profile
- POST /api/users/change-password

### Properties & Units

- GET /api/properties
- POST /api/properties
- GET /api/properties/:id
- PUT /api/properties/:id
- DELETE /api/properties/:id
- GET /api/properties/:id/units
- POST /api/properties/:id/units
- GET /api/units/:id
- PUT /api/units/:id

### Tenants

- GET /api/tenants
- POST /api/tenants
- GET /api/tenants/:id
- PUT /api/tenants/:id
- DELETE /api/tenants/:id

### Payments

- GET /api/payments
- POST /api/payments
- GET /api/payments/:id
- POST /api/payments/mpesa/stk-push
- POST /api/payments/mpesa/callback

### Maintenance

- GET /api/maintenance
- POST /api/maintenance
- GET /api/maintenance/:id
- PUT /api/maintenance/:id

### Analytics & Reports

- GET /api/analytics/dashboard
- GET /api/reports/monthly-income
- GET /api/reports/unit-performance

---

## Success Criteria

✅ **Phase 1 Complete When:**

- Authentication works with frontend
- Database is fully set up
- Basic API structure is ready

✅ **Phase 2 Complete When:**

- All property and unit management works
- Tenant management is functional
- Frontend can manage properties/units

✅ **Phase 3 Complete When:**

- M-Pesa payments work end-to-end
- Receipts are generated and downloadable
- Payment tracking is accurate

✅ **Phase 4 Complete When:**

- Maintenance requests work completely
- File uploads work
- Email notifications are sent

✅ **Phase 5 Complete When:**

- Analytics and reports work
- Admin features are complete
- Search and filtering work

✅ **Phase 6 Complete When:**

- System is secure and tested
- Production deployment works
- Performance is optimized

---

## Next Steps

1. Start with Phase 1 - Backend Foundation
2. Set up development environment
3. Create backend project structure
4. Begin with authentication system

Let me know when you're ready to begin Phase 1!
