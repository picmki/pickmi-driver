export type TabType = 'home' | 'reservations' | 'history' | 'profile';

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

export type VehicleType = 'Sedan' | 'Prime Sedan' | 'SUV' | 'EV' | 'Hatchback';

export interface UserProfile {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  avatar?: string;
  savedLocations?: SavedLocation[];
}

export interface SavedLocation {
  id: string;
  label: 'Home' | 'Work' | 'Airport' | 'Other';
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface VehicleOption {
  id: string;
  name: string;
  type: VehicleType;
  models: string;
  seating: string;
  luggage: string;
  ratePerKm: number;
  baseFare: number;
  allowedKm: number;
  tag?: string;
  isPopular?: boolean;
  isEco?: boolean;
  amenities: string[];
  description: string;
  iconName: string;
}

export interface LocationItem {
  id: string;
  title: string;
  address: string;
  latitude: number;
  longitude: number;
  category: 'airport' | 'railway' | 'hub' | 'city' | 'outstation';
  subtext?: string;
}

export interface Reservation {
  id: string;
  trip_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
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
  assigned_driver_id: string | null;
  otp: string;
  trip_type: string;
  payment_method: string;
  toll_included?: 'INCLUDED' | 'EXCLUDED';
  permit_included?: 'INCLUDED' | 'EXCLUDED';
  batta_included?: 'INCLUDED' | 'EXCLUDED';
  hill_charges_applicable?: 'APPLICABLE' | 'NOT_APPLICABLE';
  toll_charges?: number;
  extra_km_rate?: number;
  allowed_km?: number;
  cash_to_collect?: number;
  rating?: number;
  rating_feedback?: string;
  created_at: string;
  completed_at?: string | null;
  driver?: AssignedDriver;
}

export interface AssignedDriver {
  id: string;
  name: string;
  mobile: string;
  rating: number;
  total_trips: number;
  profile_image?: string | null;
  vehicle?: {
    vehicle_number: string;
    vehicle_type: string;
    vehicle_model: string;
  };
}
