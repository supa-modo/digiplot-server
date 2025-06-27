import { User, Property, Unit } from "../models";
import logger from "../config/logger";

export const seedInitialData = async () => {
  try {
    // Check if users already exist
    const userCount = await User.count();
    if (userCount > 0) {
      logger.info("Database already contains users. Skipping seed data.");
      return;
    }

    logger.info("Seeding initial data...");

    // Create admin user (password will be hashed automatically)
    const admin = await User.create({
      email: "admin@digiplot.com",
      password: "admin123",
      firstName: "System",
      lastName: "Administrator",
      role: "admin",
      status: "active",
    });

    // Create test landlord
    const landlord = await User.create({
      email: "landlord@example.com",
      password: "landlord123",
      firstName: "John",
      lastName: "Landlord",
      phone: "+254700000001",
      role: "landlord",
      status: "active",
    });

    // Create test tenant
    const tenant = await User.create({
      email: "tenant@example.com",
      password: "tenant123",
      firstName: "Jane",
      lastName: "Tenant",
      phone: "+254700000002",
      role: "tenant",
      status: "active",
    });

    // Create test property
    const property = await Property.create({
      landlordId: landlord.id,
      name: "Sunset Apartments",
      address: "123 Sunset Boulevard, Nairobi, Kenya",
      description: "Modern apartment complex with excellent amenities",
    });

    // Create test units
    const units = await Unit.bulkCreate([
      {
        propertyId: property.id,
        name: "Unit A1",
        description: "2-bedroom apartment with balcony",
        type: "apartment",
        bedrooms: 2,
        bathrooms: 2,
        area: 1200,
        rentAmount: 50000,
        amenities: "Parking, Balcony, Internet",
        status: "vacant",
      },
      {
        propertyId: property.id,
        name: "Unit A2",
        description: "1-bedroom studio apartment",
        type: "studio",
        bedrooms: 1,
        bathrooms: 1,
        area: 800,
        rentAmount: 35000,
        amenities: "Parking, Internet",
        status: "vacant",
      },
      {
        propertyId: property.id,
        name: "Unit B1",
        description: "3-bedroom family apartment",
        type: "apartment",
        bedrooms: 3,
        bathrooms: 2,
        area: 1500,
        rentAmount: 75000,
        amenities: "Parking, Balcony, Garden View, Internet",
        status: "vacant",
      },
    ]);

    logger.info("✅ Initial data seeded successfully!");
    logger.info(`👤 Admin: admin@digiplot.com / admin123`);
    logger.info(`🏠 Landlord: landlord@example.com / landlord123`);
    logger.info(`🏡 Tenant: tenant@example.com / tenant123`);
    logger.info(`🏢 Created 1 property with ${units.length} units`);
  } catch (error) {
    logger.error("❌ Error seeding data:", error);
    throw error;
  }
};
