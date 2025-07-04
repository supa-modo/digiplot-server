# DigiPlot Property Management System - Backend API

A modern REST API built with Node.js, Express, TypeScript, and PostgreSQL for managing properties, tenants, and maintenance requests.

## 🚀 Features

- **Multi-tenant architecture** with role-based access control (Admin, Landlord, Tenant)
- **Property & Unit Management** with comprehensive tracking
- **Tenant Management** with lease history
- **Payment Processing** with M-Pesa integration
- **Maintenance Request System** with file uploads
- **JWT Authentication** with refresh tokens
- **File Upload Support** for images and documents
- **Email Notifications** for important events
- **Rate Limiting** and security middleware
- **Comprehensive Logging** with Winston
- **API Documentation** with Swagger

## 📋 Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14
- npm >= 8.0.0

## 🛠️ Installation

1. **Clone and navigate to backend directory:**

   ```bash
   cd backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Environment setup:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration values.

4. **Database setup:**

   ```bash
   # Create PostgreSQL database
   createdb digiplot_property_management

   # Run migrations (when implemented)
   npm run migrate

   # Seed database (when implemented)
   npm run seed
   ```

## 🏃‍♂️ Running the Application

### Development Mode

```bash
npm run dev
```

The server will start on http://localhost:5000 with auto-reload on file changes.

### Production Mode

```bash
npm run build
npm start
```

### Health Check

Visit http://localhost:5000/health to verify the API is running.

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.ts  # Database connection
│   │   └── logger.ts    # Winston logger setup
│   ├── controllers/     # Request handlers (TODO)
│   ├── middleware/      # Custom middleware (TODO)
│   ├── models/         # Sequelize models (TODO)
│   ├── routes/         # API routes (TODO)
│   ├── services/       # Business logic (TODO)
│   ├── utils/          # Utility functions (TODO)
│   ├── types/          # TypeScript type definitions
│   │   └── index.ts    # Main type definitions
│   └── app.ts          # Express app setup
├── migrations/         # Database migrations (TODO)
├── seeders/           # Database seeders (TODO)
├── uploads/           # File uploads directory
├── logs/              # Application logs
└── docs/              # API documentation (TODO)
```

## 🔧 Configuration

### Environment Variables

| Variable         | Description         | Default                        |
| ---------------- | ------------------- | ------------------------------ |
| `NODE_ENV`       | Environment mode    | `development`                  |
| `PORT`           | Server port         | `5000`                         |
| `DB_HOST`        | PostgreSQL host     | `localhost`                    |
| `DB_PORT`        | PostgreSQL port     | `5432`                         |
| `DB_NAME`        | Database name       | `digiplot_property_management` |
| `DB_USER`        | Database user       | `postgres`                     |
| `DB_PASSWORD`    | Database password   | -                              |
| `JWT_SECRET`     | JWT signing secret  | -                              |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d`                           |
| `CORS_ORIGIN`    | Allowed CORS origin | `http://localhost:3000`        |

See `.env.example` for all available environment variables.

## 🏗️ Architecture

### Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL + Sequelize ORM
- **Authentication:** JWT + bcrypt
- **Logging:** Winston
- **Security:** Helmet, CORS, Rate Limiting
- **File Upload:** Multer
- **Email:** Nodemailer

### Security Features

- **JWT Authentication** with refresh tokens
- **Password Hashing** with bcrypt
- **Rate Limiting** to prevent abuse
- **CORS Protection** with configurable origins
- **Input Validation** with express-validator
- **Security Headers** with Helmet
- **SQL Injection Protection** via Sequelize ORM

## 📊 Database Schema

The system uses PostgreSQL with the following main entities:

- **Users** (Admin, Landlord, Tenant)
- **Landlords** (Extended landlord profiles)
- **Tenants** (Extended tenant profiles)
- **Properties** (Landlord-owned properties)
- **Units** (Individual rental units)
- **Payments** (Payment records with M-Pesa integration)
- **Maintenance Requests** (Tenant-submitted requests)
- **Tenant History** (Historical tenant assignments)

See `../DbSchema.md` for the complete database schema.

## 🎯 Development Status

### ✅ Phase 1: Foundation (COMPLETED)

- [x] Project setup with TypeScript
- [x] Express server with middleware
- [x] Database connection configuration
- [x] Logging system with Winston
- [x] TypeScript type definitions
- [x] Basic project structure

### 🔄 Phase 2: Authentication & Models (IN PROGRESS)

- [ ] Sequelize models for all entities
- [ ] JWT authentication middleware
- [ ] User registration/login endpoints
- [ ] Password reset functionality
- [ ] Role-based access control

### 📋 Upcoming Phases

- Phase 3: Property & Unit Management APIs
- Phase 4: Payment System & M-Pesa Integration
- Phase 5: Maintenance & Communication System
- Phase 6: Advanced Features & Analytics
- Phase 7: Security, Testing & Deployment

## 🔗 API Endpoints (Planned)

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Properties & Units

- `GET /api/properties` - Get landlord properties
- `POST /api/properties` - Create new property
- `GET /api/properties/:id/units` - Get units for property
- `GET /api/units/:id` - Get unit details with history

### Tenants & Payments

- `GET /api/tenants` - Get tenants (landlord view)
- `POST /api/payments/mpesa/stk-push` - Initiate M-Pesa payment
- `GET /api/payments` - Get payment history

### Maintenance

- `GET /api/maintenance` - Get maintenance requests
- `POST /api/maintenance` - Create maintenance request
- `PUT /api/maintenance/:id` - Update request status

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📚 API Documentation

When implemented, API documentation will be available at:

- Development: http://localhost:5000/api-docs
- Production: https://your-domain.com/api-docs

## 🚀 Deployment

### Docker (Planned)

```bash
# Build Docker image
docker build -t digiplot-backend .

# Run container
docker run -p 5000:5000 --env-file .env digiplot-backend
```

### Environment Setup

1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Start the application

## 🤝 Contributing

1. Follow TypeScript best practices
2. Use ESLint and Prettier for code formatting
3. Write tests for new features
4. Update documentation for API changes
5. Follow semantic versioning for releases

## 📝 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:

- Create an issue in the repository
- Contact the development team

---

**Current Status:** Phase 1 Complete - Backend foundation is ready for authentication and model implementation.

## Setup Instructions

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the backend directory with the following variables:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=digiplot
DB_USER=postgres
DB_PASSWORD=your_password

# Server
PORT=5000
NODE_ENV=development
API_BASE_URL=http://localhost:5000

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=1h
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# M-Pesa Integration
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
MPESA_ENV=sandbox # or production
MPESA_WEBHOOK_SECRET=your_webhook_secret # Optional, for callback validation
```

3. Create the database:

```bash
createdb digiplot
```

4. Run migrations:

```bash
npx sequelize-cli db:migrate
```

5. Seed initial data:

```bash
npm run seed
```

6. Start the development server:

```bash
npm run dev
```

## M-Pesa Integration

The system uses M-Pesa's STK Push API for payment processing. To set up M-Pesa integration:

1. Register for a Safaricom Developer Account at https://developer.safaricom.co.ke/

2. Create a new app and get your credentials:

   - Consumer Key
   - Consumer Secret
   - Shortcode (test shortcode for sandbox)
   - Passkey

3. Configure your callback URL in the Safaricom developer portal:

   - For development: `http://localhost:5000/api/payments/mpesa/callback`
   - For production: `https://your-domain.com/api/payments/mpesa/callback`

4. Update your `.env` file with the M-Pesa credentials

### Testing M-Pesa Integration

1. In sandbox mode, use the following test credentials:

   - Phone number: 254708374149
   - Test amount: Any amount
   - PIN: 12345

2. Make a test payment:

```bash
curl -X POST http://localhost:5000/api/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token" \
  -d '{
    "tenantId": "tenant_id",
    "unitId": "unit_id",
    "amount": 1000,
    "paymentMethod": "mpesa",
    "phoneNumber": "254708374149",
    "description": "Test payment"
  }'
```

3. Monitor the logs for callback processing

## Available Scripts

- `npm run build`: Build the TypeScript code
- `npm start`: Start the production server
- `npm run dev`: Start the development server with hot reload
- `npm run seed`: Seed the database with initial data

## API Documentation

See the [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md) file for detailed API documentation.

## Security Notes

1. Always use HTTPS in production
2. Keep your M-Pesa credentials secure
3. Validate all M-Pesa callbacks using the webhook secret
4. Monitor payment reconciliation logs
5. Implement proper error handling for failed payments

## Troubleshooting

1. **M-Pesa Callback Issues**

   - Check the callback URL is correctly configured
   - Ensure the server is accessible from the internet
   - Verify webhook secret if configured
   - Check server logs for detailed error messages

2. **Payment Status Issues**

   - Check the payment logs
   - Verify M-Pesa transaction ID
   - Check callback processing status
   - Ensure database connection is stable

3. **Database Issues**
   - Verify database connection settings
   - Check if migrations are up to date
   - Ensure proper permissions for the database user

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
