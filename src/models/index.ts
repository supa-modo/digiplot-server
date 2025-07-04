import User from "./User";
import Property from "./Property";
import Unit from "./Unit";
import Payment from "./Payment";
import MaintenanceRequest from "./MaintenanceRequest";
import Lease from "./Lease";

// Define associations

// User associations
User.hasMany(Property, { foreignKey: "landlordId", as: "properties" });
User.hasMany(Payment, { foreignKey: "tenantId", as: "payments" });
User.hasMany(MaintenanceRequest, {
  foreignKey: "tenantId",
  as: "maintenanceRequests",
});
User.hasMany(Lease, { foreignKey: "tenantId", as: "tenantLeases" });
User.hasMany(Lease, { foreignKey: "landlordId", as: "landlordLeases" });

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
Unit.hasMany(Lease, { foreignKey: "unitId", as: "leases" });
Unit.hasOne(Lease, {
  foreignKey: "unitId",
  as: "currentLease",
  scope: { status: "active" },
});

// Payment associations
Payment.belongsTo(User, { foreignKey: "tenantId", as: "tenant" });
Payment.belongsTo(Unit, { foreignKey: "unitId", as: "unit" });
Payment.belongsTo(Lease, { foreignKey: "leaseId", as: "lease" });

// MaintenanceRequest associations
MaintenanceRequest.belongsTo(User, { foreignKey: "tenantId", as: "tenant" });
MaintenanceRequest.belongsTo(Unit, { foreignKey: "unitId", as: "unit" });

// Lease associations
Lease.belongsTo(User, { foreignKey: "tenantId", as: "tenant" });
Lease.belongsTo(User, { foreignKey: "landlordId", as: "landlord" });
Lease.belongsTo(Unit, { foreignKey: "unitId", as: "unit" });
Lease.hasMany(Payment, { foreignKey: "leaseId", as: "payments" });

export { User, Property, Unit, Payment, MaintenanceRequest, Lease };

export default {
  User,
  Property,
  Unit,
  Payment,
  MaintenanceRequest,
  Lease,
};
