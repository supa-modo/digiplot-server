**Product Requirements Document (PRD): Property Management System**

---

**1. Overview**

The Property Management System (PMS) is a multi-tenant web-based platform designed to enable landlords to manage their properties, tenants, payments (via M-Pesa), maintenance requests, and generate receipts. Each landlord operates independently with unique credentials and data. Tenants gain access to their portal upon being registered by a landlord, allowing them to manage their profile, submit maintenance requests, and make payments.

---

**2. User Roles**

- **System Administrator**

  - Full control over the system
  - Manage landlord accounts
  - View all system data for monitoring
  - Can activate/deactivate any account

- **Landlord**

  - Register and manage own properties and units
  - Add/remove tenants to/from units
  - View/manage tenant profiles, payments, receipts
  - View and respond to maintenance requests
  - Set unit availability status
  - Access financial reporting and analytics

- **Tenant**

  - Access tenant portal after registration by landlord
  - Login using system-sent default password
  - Update password and manage profile
  - View rental unit details
  - Make payments via M-Pesa
  - Download payment receipts
  - Submit and monitor maintenance requests

---

**3. Key Features and Modules**

### 3.1 Authentication & Account Management

- JWT-based authentication for all roles
- Email verification during landlord registration
- Default password setup for tenant (auto-generated and emailed)
- Password reset and update functionality
- Account status control: Active / Suspended / Deactivated

### 3.2 Landlord Dashboard

- Overview: unit occupancy, pending maintenance requests, recent payments
- Property Management:

  - Add/edit/remove property
  - Add/edit/remove rental units within property
  - Set unit rent, amenities, availability, and images

- **Unit Management (Enhanced):**

  - **Units List View:** View all units for a specific property with search, filter, and sort capabilities
  - **Unit Details View:** Comprehensive unit information including:
    - Unit specifications (bedrooms, bathrooms, area, amenities)
    - Current tenant information and lease details
    - Tenant history (all previous tenants with lease periods)
    - Complete payment history for the unit (all payments from all tenants)
    - Maintenance requests history for the unit
    - Unit images gallery
    - Status management (occupied, vacant, maintenance)
  - **Unit Status Tracking:** Real-time status updates and occupancy management
  - **Financial Analytics per Unit:** Revenue tracking, payment patterns, and profitability analysis

- Tenant Management:

  - Add tenant and assign to unit
  - Remove or reassign tenant
  - View tenant profile and payment history

- Maintenance Management:

  - View all maintenance requests
  - Update status: Pending, In Progress, Resolved
  - Add notes or communicate with tenant

- Payments & Receipts:

  - Integrate with M-Pesa Paybill/Till API (tenant initiated)
  - View payment logs per tenant/unit
  - Generate receipts automatically on successful payment
  - Share receipts via email or PDF download

- Financial Reports:

  - Monthly income reports per property
  - **Unit-level financial reporting:** Individual unit revenue, collection rates
  - Payment history, outstanding balances
  - **Tenant history analysis:** Payment patterns, lease duration trends
  - Export to PDF/CSV

- Settings:

  - Update profile, payment credentials (M-Pesa secret keys)
  - Enable/disable tenant access

### 3.3 Tenant Portal

- Login using credentials from landlord
- Prompt to change default password on first login
- Profile Management:

  - Update contact details
  - Upload ID or documentation (optional)

- Unit Info:

  - View unit rent, amenities, status

- Payment:

  - Pay via integrated M-Pesa form
  - View payment history
  - Download receipts

- Maintenance:

  - Submit maintenance request with issue type, description, optional photo
  - View request status updates
  - Communicate via in-app chat or comments per request

---

**4. Enhanced Data Structure Requirements**

### 4.1 Unit Data Model (Enhanced)

- **Basic Information:** Name, type, description, bedrooms, bathrooms, area
- **Financial:** Rent amount, security deposit requirements
- **Status Management:** Occupied, vacant, maintenance, unavailable
- **Amenities:** Detailed amenities list with icons
- **Media:** Multiple unit images, virtual tour links (future)
- **Specifications:** Floor level, orientation, parking allocation
- **History Tracking:** Creation date, last updated, status change history

### 4.2 Tenant History Tracking

- **Current Tenant:** Active lease information
- **Previous Tenants:** Complete historical record including:
  - Lease start and end dates
  - Security deposit amounts
  - Move-in/move-out conditions
  - Payment history during tenancy
  - Maintenance requests during tenancy
  - Lease termination reasons

### 4.3 Unit Financial Tracking

- **Payment History:** All payments made for the unit regardless of tenant
- **Revenue Analytics:** Monthly, quarterly, yearly revenue tracking
- **Collection Rates:** Payment timeliness and default tracking
- **Cost Analysis:** Maintenance costs, vacancy periods, ROI calculations

---

**5. M-Pesa Integration**

- Each landlord enters their own M-Pesa API credentials
- Daraja API v2 (STK Push) implementation
- Payment webhook to confirm payment success/failure
- Assign payment to correct tenant and unit
- Generate and send receipt upon success

---

**6. Enhanced User Interface Requirements**

### 6.1 Unit Management Interface

- **Property Dashboard:** Overview cards showing total units, occupancy rates, revenue
- **Units Grid/List View:** Toggle between card and table views with filtering
- **Unit Details Page:** Tabbed interface showing:
  - Overview (images, specifications, amenities)
  - Current Tenant (if occupied)
  - Tenant History (previous tenants)
  - Payment History (financial records)
  - Maintenance History (service requests)
- **Search & Filter:** By status, rent range, specifications, tenant status
- **Bulk Operations:** Status updates, rent adjustments for multiple units

### 6.2 Navigation Enhancement

- **Breadcrumb Navigation:** Property → Units → Unit Details
- **Quick Actions:** Jump between related entities (unit to tenant, tenant to payments)
- **Dashboard Widgets:** Quick stats and recent activity per property/unit

---

**7. Notifications & Communication**

- Email notifications:

  - Tenant account creation with credentials
  - Payment confirmation and receipt
  - Maintenance request status updates

- Optional SMS notifications (future enhancement)
- In-app notifications and messaging for maintenance requests

---

**8. Security & Permissions**

- Role-based access control
- Secure JWT tokens
- M-Pesa credential encryption
- Input validation and sanitation (backend and frontend)
- Activity logs for audit trail (admin + landlord level)

---

**9. Technical Stack (Suggested)**

- **Frontend:** React, TailwindCSS, Javascript (JSX)
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL + Sequelize ORM
- **Authentication:** JWT, bcrypt
- **Hosting:** Vercel (frontend), AWS Lightsail or VPS (backend)
- **Storage:** AWS S3 for receipts and optional documents

---

**10. Deployment & CI/CD**

- GitHub Actions for continuous integration and deployment
- Dockerized backend for ease of deployment
- Nginx + SSL for secure backend hosting

---

**11. Scalability & Multi-Tenant Architecture**

- Each landlord has isolated data (properties, tenants, payments)
- Use of `landlord_id` as a foreign key in all core tables
- Separate M-Pesa credentials stored per landlord

---

**12. Future Enhancements (Not in MVP)**

- SMS notifications (via Twilio or Africa's Talking)
- Mobile App (React Native)
- Lease agreement uploads and reminders
- Landlord-tenant in-app messaging/chat
- Analytics dashboard (charts for rent trends, occupancy rates)
- Multi-currency support
- **Advanced Unit Features:**
  - Virtual tours and 360° images
  - Smart meter integrations for utilities
  - Automated rent escalation rules
  - Lease renewal workflow automation
  - Predictive analytics for vacancy periods

---

**13. Deliverables**

- Fully functional multi-tenant PMS web application
- Admin interface
- Landlord and tenant portals
- **Enhanced unit management system with detailed tracking**
- M-Pesa payment system integrated
- PDF receipt generation
- Email notifications system
- PostgreSQL schema
- API documentation
- Deployment pipeline

---

**14. Acceptance Criteria**

- Landlord can register, log in, and manage properties/tenants
- **Landlord can view comprehensive unit details including tenant and payment history**
- **Seamless navigation between properties, units, and unit details**
- Tenant can access after being added and receive default login details
- Secure M-Pesa payments per landlord
- Receipts generated and accessible
- Maintenance workflow fully functional
- All portals are responsive and user-friendly
- Email notifications work end-to-end
- Data is secure and access-controlled
- **Unit management provides complete operational visibility**
