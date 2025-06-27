import User from "./User";
import Property from "./Property";
import Unit from "./Unit";
import Payment from "./Payment";
import MaintenanceRequest from "./MaintenanceRequest";

// Define associations

// User associations
User.hasMany(Property, { foreignKey: "landlordId", as: "properties" });
User.hasMany(Payment, { foreignKey: "tenantId", as: "payments" });
User.hasMany(MaintenanceRequest, {
  foreignKey: "tenantId",
  as: "maintenanceRequests",
});

// Property associations
Property.belongsTo(User, { foreignKey: "landlordId", as: "landlord" });
Property.hasMany(Unit, { foreignKey: "propertyId", as: "units" });

// Unit associations
Unit.belongsTo(Property, { foreignKey: "propertyId", as: "property" });
Unit.hasMany(Payment, { foreignKey: "unitId", as: "payments" });
Unit.hasMany(MaintenanceRequest, {
  foreignKey: "unitId",
  as: "maintenanceRequests",
});

// Payment associations
Payment.belongsTo(User, { foreignKey: "tenantId", as: "tenant" });
Payment.belongsTo(Unit, { foreignKey: "unitId", as: "unit" });

// MaintenanceRequest associations
MaintenanceRequest.belongsTo(User, { foreignKey: "tenantId", as: "tenant" });
MaintenanceRequest.belongsTo(Unit, { foreignKey: "unitId", as: "unit" });

export { User, Property, Unit, Payment, MaintenanceRequest };

export default {
  User,
  Property,
  Unit,
  Payment,
  MaintenanceRequest,
};
