import { Request } from "express";

// User roles
export type UserRole = "admin" | "landlord" | "tenant";

// User status
export type UserStatus = "active" | "inactive" | "suspended" | "deactivated";

// Unit types
export type UnitType =
  | "apartment"
  | "villa"
  | "office"
  | "studio"
  | "penthouse"
  | "commercial";

// Unit status
export type UnitStatus = "vacant" | "occupied" | "maintenance" | "unavailable";

// Payment status
export type PaymentStatus = "successful" | "failed" | "pending";

// Maintenance categories
export type MaintenanceCategory =
  | "plumbing"
  | "electrical"
  | "hvac"
  | "security"
  | "general"
  | "appliances"
  | "flooring"
  | "painting"
  | "pool"
  | "garden";

// Maintenance priority
export type MaintenancePriority = "low" | "medium" | "high" | "urgent";

// Maintenance status
export type MaintenanceStatus =
  | "pending"
  | "in_progress"
  | "resolved"
  | "cancelled";

// Tenant history status
export type TenantHistoryStatus = "active" | "completed" | "terminated";

// Base User interface
export interface IUser {
  id: string;
  role: UserRole;
  email: string;
  password_hash: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  status: UserStatus;
  created_at: Date;
  updated_at: Date;
}

// Landlord interface
export interface ILandlord {
  id: string;
  business_name?: string;
  mpesa_short_code?: string;
  mpesa_consumer_key?: string;
  mpesa_consumer_secret?: string;
  mpesa_passkey?: string;
  mpesa_env: string;
}

// Tenant interface
export interface ITenant {
  id: string;
  landlord_id: string;
  unit_id?: string;
  lease_start_date?: Date;
  lease_end_date?: Date;
  security_deposit?: number;
  id_document_url?: string;
}

// Property interface
export interface IProperty {
  id: string;
  landlord_id: string;
  name: string;
  address?: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

// Unit interface
export interface IUnit {
  id: string;
  property_id: string;
  name: string;
  description?: string;
  type: UnitType;
  bedrooms: number;
  bathrooms: number;
  area?: number;
  rent_amount: number;
  amenities?: string;
  status: UnitStatus;
  image_urls?: string[];
  created_at: Date;
  updated_at: Date;
}

// Payment interface
export interface IPayment {
  id: string;
  tenant_id?: string;
  unit_id?: string;
  amount: number;
  payment_date: Date;
  mpesa_transaction_id: string;
  status: PaymentStatus;
  receipt_url?: string;
  notes?: string;
}

// Maintenance Request interface
export interface IMaintenanceRequest {
  id: string;
  tenant_id?: string;
  unit_id?: string;
  title: string;
  description?: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  image_url?: string;
  status: MaintenanceStatus;
  response_notes?: string;
  created_at: Date;
  updated_at: Date;
}

// Tenant History interface
export interface ITenantHistory {
  id: string;
  unit_id: string;
  tenant_id?: string;
  lease_start_date: Date;
  lease_end_date?: Date;
  security_deposit?: number;
  rent_amount?: number;
  move_in_condition?: string;
  move_out_condition?: string;
  termination_reason?: string;
  status: TenantHistoryStatus;
  created_at: Date;
  updated_at: Date;
}

// Extended Request interface with user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    email: string;
    full_name: string;
  };
}

// API Response interface
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Login request/response interfaces
export interface LoginRequest {
  email: string;
  password: string;
  userType: UserRole;
}

export interface LoginResponse {
  user: {
    id: string;
    role: UserRole;
    email: string;
    full_name: string;
  };
  token: string;
  refreshToken: string;
}

// Dashboard stats interfaces
export interface LandlordDashboardStats {
  totalProperties: number;
  totalTenants: number;
  monthlyRevenue: number;
  pendingMaintenance: number;
  occupancyRate: number;
  totalUnits: number;
  occupiedUnits: number;
}

export interface TenantDashboardStats {
  currentRent: number;
  lastPaymentDate: Date | null;
  pendingMaintenance: number;
  leaseEndDate: Date | null;
}

// M-Pesa interfaces
export interface MpesaSTKPushRequest {
  BusinessShortCode: string;
  Password: string;
  Timestamp: string;
  TransactionType: string;
  Amount: string;
  PartyA: string;
  PartyB: string;
  PhoneNumber: string;
  CallBackURL: string;
  AccountReference: string;
  TransactionDesc: string;
}

export interface MpesaCallbackRequest {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
}
