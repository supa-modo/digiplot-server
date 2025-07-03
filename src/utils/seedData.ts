import { User, Property, Unit, Payment, MaintenanceRequest } from "../models";
import logger from "../config/logger";
import bcrypt from "bcryptjs";
import sequelize from "../config/database";

export const seedInitialData = async () => {
  try {
    // Check if database is already populated
    const userCount = await User.count().catch(() => 0);
    if (userCount > 0) {
      logger.info("Database already contains users. Skipping seed data.");
      return;
    }

    // Initialize models and sync database
    logger.info("Initializing models and syncing database...");

    try {
      // First, sync with force to recreate all tables
      await sequelize.sync({ force: true });
      logger.info("Database synced successfully!");
    } catch (syncError) {
      logger.error("Failed to sync database:", syncError);
      throw new Error("Database synchronization failed");
    }

    logger.info("Seeding initial data...");

    // Create admin user
    const admin = await User.create({
      email: "admin@digiplot.com",
      password: "admin123",
      firstName: "System",
      lastName: "Administrator",
      role: "admin",
      status: "active",
      phone: "+254700000000",
      twoFactorEnabled: false, // Disabled for easier development testing
    });

    // Create test landlords
    const landlord1 = await User.create({
      email: "john.doe@digiplot.com",
      password: "landlord123",
      firstName: "John",
      lastName: "Doe",
      phone: "+254700000001",
      role: "landlord",
      status: "active",
      twoFactorEnabled: false, // Disabled for easier development testing
    });

    const landlord2 = await User.create({
      email: "jane.smith@digiplot.com",
      password: "landlord123",
      firstName: "Jane",
      lastName: "Smith",
      phone: "+254700000002",
      role: "landlord",
      status: "active",
      twoFactorEnabled: false,
    });

    const landlords = [landlord1, landlord2];

    // Create test tenants
    const tenant1 = await User.create({
      email: "alice.johnson@digiplot.com",
      password: "tenant123",
      firstName: "Alice",
      lastName: "Johnson",
      phone: "+254700000003",
      role: "tenant",
      status: "active",
      emergencyContactName: "Bob Johnson",
      emergencyContactPhone: "+254700000004",
      twoFactorEnabled: false,
    });

    const tenant2 = await User.create({
      email: "bob.wilson@digiplot.com",
      password: "tenant123",
      firstName: "Bob",
      lastName: "Wilson",
      phone: "+254700000005",
      role: "tenant",
      status: "active",
      emergencyContactName: "Carol Wilson",
      emergencyContactPhone: "+254700000006",
      twoFactorEnabled: false, // Disabled for easier development testing
    });

    const tenant3 = await User.create({
      email: "carol.brown@digiplot.com",
      password: "tenant123",
      firstName: "Carol",
      lastName: "Brown",
      phone: "+254700000007",
      role: "tenant",
      status: "active",
      emergencyContactName: "David Brown",
      emergencyContactPhone: "+254700000008",
      twoFactorEnabled: false,
    });

    const tenants = [tenant1, tenant2, tenant3];

    // Create properties for first landlord
    const properties = await Property.bulkCreate([
      {
        landlordId: landlords[0].id,
        name: "Sunset Apartments",
        address: "123 Sunset Boulevard, Westlands, Nairobi",
        description: "Modern apartment complex with excellent amenities",
      },
      {
        landlordId: landlords[0].id,
        name: "Garden View Estate",
        address: "456 Garden Road, Karen, Nairobi",
        description: "Luxury estate with beautiful garden views",
      },
    ]);

    // Create units for the properties
    const units = await Unit.bulkCreate([
      {
        propertyId: properties[0].id,
        name: "Unit A1",
        description: "2-bedroom apartment with balcony",
        type: "apartment",
        bedrooms: 2,
        bathrooms: 2,
        area: 1200,
        rentAmount: 50000,
        amenities: "Parking, Balcony, Internet",
        status: "occupied",
        imageUrls: ["/appartment-1.png", "/appartment-2.png"],
      },
      {
        propertyId: properties[0].id,
        name: "Unit A2",
        description: "1-bedroom studio apartment",
        type: "studio",
        bedrooms: 1,
        bathrooms: 1,
        area: 800,
        rentAmount: 35000,
        amenities: "Parking, Internet",
        status: "vacant",
        imageUrls: ["/appartment-2.png"],
      },
      {
        propertyId: properties[1].id,
        name: "House 1",
        description: "3-bedroom family house",
        type: "villa",
        bedrooms: 3,
        bathrooms: 2,
        area: 1800,
        rentAmount: 75000,
        amenities: "Parking, Garden, Security",
        status: "occupied",
        imageUrls: ["/appartment-3.png"],
      },
    ]);

    // Create payments
    await Payment.bulkCreate([
      {
        tenantId: tenants[0].id,
        unitId: units[0].id,
        amount: 50000,
        paymentDate: new Date(),
        mpesaTransactionId: "MPESA123456",
        status: "successful",
        notes: "Rent payment for January 2024",
      },
      {
        tenantId: tenants[1].id,
        unitId: units[2].id,
        amount: 75000,
        paymentDate: new Date(),
        mpesaTransactionId: "MPESA789012",
        status: "successful",
        notes: "Rent payment for January 2024",
      },
    ]);

    // Create maintenance requests
    await MaintenanceRequest.bulkCreate([
      {
        tenantId: tenants[0].id,
        unitId: units[0].id,
        title: "Leaking Faucet",
        description: "Kitchen sink faucet is leaking",
        category: "plumbing",
        priority: "medium",
        status: "pending",
      },
      {
        tenantId: tenants[1].id,
        unitId: units[2].id,
        title: "AC Not Working",
        description: "Air conditioner not cooling properly",
        category: "hvac",
        priority: "high",
        status: "in_progress",
        responseNotes: "Technician scheduled for tomorrow",
      },
    ]);

    logger.info("✅ Initial data seeded successfully!");
    logger.info(`Created:`);
    logger.info(`- 1 Admin user (admin@digiplot.com / admin123)`);
    logger.info(`- ${landlords.length} Landlords`);
    logger.info(`- ${tenants.length} Tenants`);
    logger.info(`- ${properties.length} Properties`);
    logger.info(`- ${units.length} Units`);
    logger.info(`- 2 Payments`);
    logger.info(`- 2 Maintenance Requests`);
  } catch (error) {
    logger.error("❌ Error seeding data:", error);
    throw error;
  }
};

// Execute the seed function
seedInitialData()
  .then(() => {
    logger.info("Seeding completed");
    process.exit(0);
  })
  .catch((error) => {
    logger.error("Seeding failed:", error);
    process.exit(1);
  });
