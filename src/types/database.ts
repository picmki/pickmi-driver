export type TripStatus =
  | 'AVAILABLE'
  | 'REQUESTED'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'ON_THE_WAY'
  | 'ARRIVED'
  | 'STARTED'
  | 'COMPLETED'
  | 'CANCELLED';

export type DriverStatus = 'active' | 'inactive' | 'suspended';
export type OnlineStatus = 'ONLINE' | 'OFFLINE';
export type DocumentVerificationStatus = 'Verified' | 'Pending' | 'Rejected';
export type VehicleType = 'Sedan' | 'SUV' | 'Hatchback' | 'Prime Sedan' | 'EV';
export type TransactionType = 'TRIP_EARNING' | 'DRIVER_DEPOSIT' | 'WITHDRAWAL' | 'PLATFORM_FEE' | 'BONUS';

// 1. drivers entity
export interface Driver {
  id: string;
  name: string;
  mobile: string;
  email: string;
  profile_image: string;
  status: DriverStatus;
  online_status: OnlineStatus;
  rating?: number;
  total_trips?: number;
  deposit_status?: 'PAID' | 'PENDING';
  deposit_amount?: number;
  deposit_paid_at?: string;
  deposit_expires_at?: string;
  deposit_payment_id?: string;
  push_token?: string | null;
  current_latitude?: number | null;
  current_longitude?: number | null;
  current_city?: string | null;
  last_location_update?: string | null;
  speed?: number | null;
  created_at: string;
}

// 2. vehicles entity
export interface Vehicle {
  id: string;
  driver_id: string;
  vehicle_number: string;
  vehicle_type: VehicleType;
  vehicle_model: string;
  vehicle_image?: string;
  created_at: string;
}

// 3. trips entity
export interface Trip {
  id: string;
  trip_number: string;
  pickup_location: string;
  pickup_latitude: number;
  pickup_longitude: number;
  drop_location: string;
  drop_latitude: number;
  drop_longitude: number;
  pickup_date: string;
  pickup_time: string;
  fare: number;
  distance: string;
  vehicle_type: VehicleType;
  status: TripStatus;
  customer_name: string;
  customer_phone: string;
  trip_type?: 'One-way' | 'Round-trip' | 'Airport Transfer' | 'Outstation';
  additional_notes?: string;
  payment_method?: 'Online (UPI / Card)' | 'Cash on Delivery';
  assigned_driver_id?: string;
  otp?: string;
  rate_per_km?: number;
  toll_included?: 'INCLUDED' | 'EXCLUDED';
  permit_included?: 'INCLUDED' | 'EXCLUDED';
  batta_included?: 'INCLUDED' | 'EXCLUDED';
  hill_charges_applicable?: 'APPLICABLE' | 'NOT_APPLICABLE';
  cash_to_collect?: number;
  allowed_km?: number;
  toll_status?: 'INCLUDED' | 'EXTRA' | 'NOT_APPLICABLE';
  toll_estimate?: number;
  permit_status?: 'INCLUDED' | 'EXTRA' | 'NOT_APPLICABLE';
  permit_amount?: number;
  driver_allowance?: number;
  driver_allowance_status?: 'INCLUDED' | 'EXTRA' | 'NOT_APPLICABLE';
  extra_km_rate?: number;
  toll_charges?: number;
  parking_charges?: number;
  extra_km?: number;
  extra_km_charges?: number;
  total_fare?: number;
  completed_at?: string;
  created_at: string;
}

// 4. trip_requests entity
export interface TripRequest {
  id: string;
  trip_id: string;
  driver_id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  requested_at: string;
  assigned_at?: string;
  created_at: string;
}

// 5. trip_status_history entity
export interface TripStatusHistory {
  id: string;
  trip_id: string;
  driver_id: string;
  status: TripStatus;
  note?: string;
  created_at: string;
}

// 6. wallets entity
export interface Wallet {
  id: string;
  driver_id: string;
  balance: number;
  today_earnings: number;
  this_week_earnings: number;
  this_month_earnings: number;
  updated_at: string;
}

// 7. wallet_transactions entity
export interface WalletTransaction {
  id: string;
  driver_id: string;
  trip_id?: string;
  type: TransactionType;
  amount: number;
  description: string;
  created_at: string;
}

// 8. driver_documents entity
export interface DriverDocument {
  id: string;
  driver_id: string;
  document_type:
    | 'Driving Licence'
    | 'Driving Licence (Front)'
    | 'Driving Licence (Back)'
    | 'RC'
    | 'Insurance'
    | 'Permit';
  document_url: string;
  document_number?: string;
  valid_until?: string;
  verification_status: DocumentVerificationStatus;
  rejection_reason?: string | null;
  created_at: string;
}

// In-app Notification entity
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'trip_assigned' | 'trip_available' | 'trip_completed' | 'system' | 'wallet';
  trip_id?: string;
  read: boolean;
  created_at: string;
}
