import {
  Driver,
  Vehicle,
  DriverDocument,
  Wallet,
  WalletTransaction,
  Trip,
  AppNotification,
} from '../types/database';

export const INITIAL_DRIVER: Driver = {
  id: 'drv_karthik_01',
  name: 'Karthik P',
  mobile: '+91 98765 43210',
  email: 'karthik.p@pickmi.com',
  profile_image:
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  status: 'active',
  online_status: 'ONLINE',
  rating: 4.9,
  total_trips: 0,
  created_at: '2025-01-15T10:00:00Z',
  deposit_status: 'PENDING',
  deposit_amount: 250,
};

export const INITIAL_VEHICLE: Vehicle = {
  id: 'veh_01',
  driver_id: 'drv_karthik_01',
  vehicle_type: 'Sedan',
  vehicle_model: 'Maruti Suzuki Dzire (White)',
  vehicle_number: 'KA 01 MJ 4821',
  vehicle_image:
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
  created_at: '2025-01-15T10:30:00Z',
};

export const INITIAL_DOCUMENTS: DriverDocument[] = [];

export const INITIAL_WALLET: Wallet = {
  id: 'wal_01',
  driver_id: 'drv_karthik_01',
  balance: 0.0,
  today_earnings: 0.0,
  this_week_earnings: 0.0,
  this_month_earnings: 0.0,
  updated_at: new Date().toISOString(),
};

export const INITIAL_TRANSACTIONS: WalletTransaction[] = [];

export const INITIAL_TRIPS: Trip[] = [];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];
