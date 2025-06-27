-- Property Management System - PostgreSQL Schema (Enhanced)

-- 1. Users Table (Admin, Landlord, Tenant) - Enhanced
CREATE TABLE users (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
role VARCHAR(20) CHECK (role IN ('admin', 'landlord', 'tenant')) NOT NULL,
email VARCHAR(255) UNIQUE NOT NULL,
password_hash TEXT NOT NULL,
full_name VARCHAR(255) NOT NULL,
first_name VARCHAR(100),
last_name VARCHAR(100),
phone VARCHAR(20),
emergency_contact_name VARCHAR(255),
emergency_contact_phone VARCHAR(20),
status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'deactivated')),
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Landlord Profiles
CREATE TABLE landlords (
id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
business_name VARCHAR(255),
mpesa_short_code VARCHAR(20),
mpesa_consumer_key TEXT,
mpesa_consumer_secret TEXT,
mpesa_passkey TEXT,
mpesa_env VARCHAR(10) DEFAULT 'sandbox'
);

-- 3. Tenant Profiles - Enhanced
CREATE TABLE tenants (
id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
landlord_id UUID REFERENCES landlords(id) ON DELETE CASCADE,
unit_id UUID,
lease_start_date DATE,
lease_end_date DATE,
security_deposit DECIMAL(12,2),
id_document_url TEXT,
FOREIGN KEY (unit_id) REFERENCES units(id)
);

-- 4. Properties
CREATE TABLE properties (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
landlord_id UUID REFERENCES landlords(id) ON DELETE CASCADE,
name VARCHAR(255) NOT NULL,
address TEXT,
description TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Units - Enhanced
CREATE TABLE units (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
name VARCHAR(255) NOT NULL,
description TEXT,
type VARCHAR(50) DEFAULT 'apartment' CHECK (type IN ('apartment', 'villa', 'office', 'studio', 'penthouse', 'commercial')),
bedrooms INTEGER DEFAULT 0,
bathrooms INTEGER DEFAULT 0,
area INTEGER, -- Square feet or square meters
rent_amount DECIMAL(12,2) NOT NULL,
amenities TEXT,
status VARCHAR(20) DEFAULT 'vacant' CHECK (status IN ('vacant', 'occupied', 'maintenance', 'unavailable')),
image_urls TEXT[],
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Payments
CREATE TABLE payments (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
amount DECIMAL(12,2) NOT NULL,
payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
mpesa_transaction_id VARCHAR(100) UNIQUE NOT NULL,
status VARCHAR(20) CHECK (status IN ('successful', 'failed', 'pending')),
receipt_url TEXT,
notes TEXT
);

-- 7. Maintenance Requests - Enhanced
CREATE TABLE maintenance_requests (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
title VARCHAR(255) NOT NULL,
description TEXT,
category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('plumbing', 'electrical', 'hvac', 'security', 'general', 'appliances', 'flooring', 'painting', 'pool', 'garden')),
priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
image_url TEXT,
status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'cancelled')),
response_notes TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tenant History (For tracking tenant changes per unit)
CREATE TABLE tenant_history (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
lease_start_date DATE NOT NULL,
lease_end_date DATE,
security_deposit DECIMAL(12,2),
rent_amount DECIMAL(12,2),
move_in_condition TEXT,
move_out_condition TEXT,
termination_reason VARCHAR(255),
status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'terminated')),
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Unit Amenities (For better amenity management)
CREATE TABLE unit_amenities (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
amenity_name VARCHAR(100) NOT NULL,
amenity_type VARCHAR(50) DEFAULT 'feature' CHECK (amenity_type IN ('feature', 'utility', 'service', 'facility')),
description TEXT,
is_active BOOLEAN DEFAULT true
);

-- 10. Password Resets & Tokens
CREATE TABLE password_resets (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID REFERENCES users(id) ON DELETE CASCADE,
token TEXT NOT NULL,
expires_at TIMESTAMP NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Audit Logs (optional for admin)
CREATE TABLE audit_logs (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID REFERENCES users(id) ON DELETE SET NULL,
action VARCHAR(255),
target_table VARCHAR(50),
target_id UUID,
details JSONB,
timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Unit Financial Summary (For quick revenue calculations)
CREATE TABLE unit_financial_summary (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
month INTEGER NOT NULL,
year INTEGER NOT NULL,
total_rent_collected DECIMAL(12,2) DEFAULT 0,
total_payments INTEGER DEFAULT 0,
occupancy_days INTEGER DEFAULT 0,
maintenance_cost DECIMAL(12,2) DEFAULT 0,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
UNIQUE(unit_id, month, year)
);

-- Indexes for performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_properties_landlord ON properties(landlord_id);
CREATE INDEX idx_units_property ON units(property_id);
CREATE INDEX idx_units_status ON units(status);
CREATE INDEX idx_units_type ON units(type);
CREATE INDEX idx_tenants_landlord ON tenants(landlord_id);
CREATE INDEX idx_tenants_unit ON tenants(unit_id);
CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_payments_unit ON payments(unit_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_maintenance_unit ON maintenance_requests(unit_id);
CREATE INDEX idx_maintenance_status ON maintenance_requests(status);
CREATE INDEX idx_maintenance_category ON maintenance_requests(category);
CREATE INDEX idx_tenant_history_unit ON tenant_history(unit_id);
CREATE INDEX idx_tenant_history_tenant ON tenant_history(tenant_id);
CREATE INDEX idx_unit_financial_summary_unit_date ON unit_financial_summary(unit_id, year, month);

-- Views for common queries

-- 1. Current Unit Occupancy View
CREATE VIEW current_unit_occupancy AS
SELECT
u.id as unit_id,
u.name as unit_name,
u.status,
u.rent_amount,
p.name as property_name,
t.id as tenant_id,
us.full_name as tenant_name,
t.lease_start_date,
t.lease_end_date
FROM units u
LEFT JOIN properties p ON u.property_id = p.id
LEFT JOIN tenants t ON u.id = t.unit_id AND t.id IN (
SELECT DISTINCT ON (unit_id) id
FROM tenants
WHERE unit_id IS NOT NULL
ORDER BY unit_id, created_at DESC
)
LEFT JOIN users us ON t.id = us.id;

-- 2. Unit Payment Summary View
CREATE VIEW unit_payment_summary AS
SELECT
u.id as unit_id,
u.name as unit_name,
COUNT(pay.id) as total_payments,
COALESCE(SUM(pay.amount), 0) as total_collected,
COALESCE(AVG(pay.amount), 0) as average_payment,
MAX(pay.payment_date) as last_payment_date
FROM units u
LEFT JOIN payments pay ON u.id = pay.unit_id AND pay.status = 'successful'
GROUP BY u.id, u.name;

-- 3. Maintenance Summary View
CREATE VIEW unit_maintenance_summary AS
SELECT
u.id as unit_id,
u.name as unit_name,
COUNT(mr.id) as total_requests,
COUNT(CASE WHEN mr.status = 'pending' THEN 1 END) as pending_requests,
COUNT(CASE WHEN mr.status = 'in_progress' THEN 1 END) as in_progress_requests,
COUNT(CASE WHEN mr.status = 'resolved' THEN 1 END) as resolved_requests,
MAX(mr.created_at) as last_request_date
FROM units u
LEFT JOIN maintenance_requests mr ON u.id = mr.unit_id
GROUP BY u.id, u.name;

-- 4. Landlord Portfolio Overview
CREATE VIEW landlord_portfolio_overview AS
SELECT
l.id as landlord_id,
us.full_name as landlord_name,
COUNT(DISTINCT p.id) as total_properties,
COUNT(DISTINCT u.id) as total_units,
COUNT(DISTINCT CASE WHEN u.status = 'occupied' THEN u.id END) as occupied_units,
COUNT(DISTINCT CASE WHEN u.status = 'vacant' THEN u.id END) as vacant_units,
COALESCE(SUM(CASE WHEN u.status = 'occupied' THEN u.rent_amount ELSE 0 END), 0) as potential_monthly_revenue
FROM landlords l
LEFT JOIN users us ON l.id = us.id
LEFT JOIN properties p ON l.id = p.landlord_id
LEFT JOIN units u ON p.id = u.property_id
GROUP BY l.id, us.full_name;

-- Triggers for maintaining data consistency

-- Update tenant status when unit assignment changes
CREATE OR REPLACE FUNCTION update_unit_status()
RETURNS TRIGGER AS $$
BEGIN
-- When a tenant is assigned to a unit
IF NEW.unit_id IS NOT NULL AND (OLD.unit_id IS NULL OR OLD.unit_id != NEW.unit_id) THEN
UPDATE units SET status = 'occupied' WHERE id = NEW.unit_id;

        -- Mark previous unit as vacant if tenant moved
        IF OLD.unit_id IS NOT NULL AND OLD.unit_id != NEW.unit_id THEN
            UPDATE units SET status = 'vacant' WHERE id = OLD.unit_id;
        END IF;
    END IF;

    -- When a tenant is removed from a unit
    IF NEW.unit_id IS NULL AND OLD.unit_id IS NOT NULL THEN
        UPDATE units SET status = 'vacant' WHERE id = OLD.unit_id;
    END IF;

    RETURN NEW;

END;

$$
LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_unit_status
    AFTER UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_unit_status();

-- Create tenant history record when tenant assignment changes
CREATE OR REPLACE FUNCTION create_tenant_history()
RETURNS TRIGGER AS
$$

BEGIN
-- When a new tenant is assigned
IF NEW.unit_id IS NOT NULL AND NEW.lease_start_date IS NOT NULL THEN
INSERT INTO tenant_history (
unit_id,
tenant_id,
lease_start_date,
lease_end_date,
security_deposit,
rent_amount,
status
)
SELECT
NEW.unit_id,
NEW.id,
NEW.lease_start_date,
NEW.lease_end_date,
NEW.security_deposit,
u.rent_amount,
'active'
FROM units u WHERE u.id = NEW.unit_id
ON CONFLICT DO NOTHING;
END IF;

    -- When tenant lease ends or is removed
    IF (OLD.unit_id IS NOT NULL AND NEW.unit_id IS NULL) OR
       (OLD.lease_end_date IS NULL AND NEW.lease_end_date IS NOT NULL AND NEW.lease_end_date <= CURRENT_DATE) THEN
        UPDATE tenant_history
        SET status = 'completed', lease_end_date = COALESCE(NEW.lease_end_date, CURRENT_DATE)
        WHERE tenant_id = OLD.id AND unit_id = OLD.unit_id AND status = 'active';
    END IF;

    RETURN NEW;

END;

$$
LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_tenant_history
    AFTER INSERT OR UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION create_tenant_history();

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS
$$

BEGIN
NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;

$$
LANGUAGE plpgsql;

-- Apply timestamp triggers to relevant tables
CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_units_updated_at BEFORE UPDATE ON units FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_maintenance_updated_at BEFORE UPDATE ON maintenance_requests FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_tenant_history_updated_at BEFORE UPDATE ON tenant_history FOR EACH ROW EXECUTE FUNCTION update_timestamp();
$$
