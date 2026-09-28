-- =====================================================================
-- PickMi Driver & Admin Unified Supabase Database Schema
-- Version: 2.0
-- Compatible with: PickMi Driver Mobile App & PickMi Web Admin Panel
-- =====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE driver_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE online_status AS ENUM ('ONLINE', 'OFFLINE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE document_verification_status AS ENUM ('Verified', 'Pending', 'Rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE vehicle_type AS ENUM ('Sedan', 'SUV', 'Hatchback', 'Prime Sedan', 'EV');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE trip_status AS ENUM (
    'AVAILABLE',
    'REQUESTED',
    'ASSIGNED',
    'ACCEPTED',
    'ON_THE_WAY',
    'ARRIVED',
    'STARTED',
    'COMPLETED',
    'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE trip_type AS ENUM ('One-way', 'Round-trip', 'Airport Transfer', 'Outstation');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE deposit_status AS ENUM ('PAID', 'PENDING');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =====================================================================
-- 3. TABLES
-- =====================================================================

-- TABLE: drivers
CREATE TABLE IF NOT EXISTS public.drivers (
  id TEXT PRIMARY KEY DEFAULT ('drv_' || substr(md5(random()::text), 1, 12)),
  name TEXT NOT NULL,
  mobile TEXT NOT NULL UNIQUE,
  email TEXT,
  profile_image TEXT,
  status driver_status DEFAULT 'active',
  online_status online_status DEFAULT 'OFFLINE',
  rating NUMERIC(3, 2) DEFAULT 4.90,
  total_trips INTEGER DEFAULT 0,
  deposit_status deposit_status DEFAULT 'PENDING',
  deposit_amount NUMERIC(10, 2) DEFAULT 250.00,
  deposit_paid_at TIMESTAMPTZ,
  deposit_expires_at TIMESTAMPTZ,
  deposit_payment_id TEXT,
  push_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration safety for existing installations
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS push_token TEXT;

-- TABLE: vehicles
CREATE TABLE IF NOT EXISTS public.vehicles (
  id TEXT PRIMARY KEY DEFAULT ('veh_' || substr(md5(random()::text), 1, 12)),
  driver_id TEXT REFERENCES public.drivers(id) ON DELETE CASCADE,
  vehicle_number TEXT NOT NULL UNIQUE,
  vehicle_type vehicle_type DEFAULT 'Sedan',
  vehicle_model TEXT NOT NULL,
  vehicle_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: driver_documents
CREATE TABLE IF NOT EXISTS public.driver_documents (
  id TEXT PRIMARY KEY DEFAULT ('doc_' || substr(md5(random()::text), 1, 12)),
  driver_id TEXT REFERENCES public.drivers(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'Driving Licence (Front)', 'Driving Licence (Back)', 'RC', 'Insurance', 'Permit'
  document_url TEXT NOT NULL,
  document_number TEXT,
  valid_until TEXT,
  verification_status document_verification_status DEFAULT 'Pending',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: trips
CREATE TABLE IF NOT EXISTS public.trips (
  id TEXT PRIMARY KEY DEFAULT ('trip_' || substr(md5(random()::text), 1, 12)),
  trip_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  pickup_location TEXT NOT NULL,
  pickup_latitude NUMERIC(10, 7) NOT NULL,
  pickup_longitude NUMERIC(10, 7) NOT NULL,
  drop_location TEXT NOT NULL,
  drop_latitude NUMERIC(10, 7) NOT NULL,
  drop_longitude NUMERIC(10, 7) NOT NULL,
  pickup_date TEXT NOT NULL DEFAULT 'Today',
  pickup_time TEXT NOT NULL DEFAULT 'Now',
  fare NUMERIC(10, 2) NOT NULL,
  distance TEXT NOT NULL,
  vehicle_type vehicle_type DEFAULT 'Sedan',
  status trip_status DEFAULT 'AVAILABLE',
  assigned_driver_id TEXT REFERENCES public.drivers(id) ON DELETE SET NULL,
  otp TEXT DEFAULT '4821',
  trip_type trip_type DEFAULT 'One-way',
  payment_method TEXT DEFAULT 'Cash',
  extra_km_rate NUMERIC(10, 2) DEFAULT 14.00,
  allowed_km NUMERIC(10, 2) DEFAULT 50.00,
  cash_to_collect NUMERIC(10, 2),
  toll_included TEXT DEFAULT 'INCLUDED', -- 'INCLUDED', 'EXCLUDED'
  permit_included TEXT DEFAULT 'EXCLUDED', -- 'INCLUDED', 'EXCLUDED'
  batta_included TEXT DEFAULT 'INCLUDED', -- 'INCLUDED', 'EXCLUDED'
  hill_charges_applicable TEXT DEFAULT 'NOT_APPLICABLE', -- 'APPLICABLE', 'NOT_APPLICABLE'
  toll_status TEXT DEFAULT 'INCLUDED',
  toll_estimate NUMERIC(10, 2) DEFAULT 0,
  toll_charges NUMERIC(10, 2) DEFAULT 0,
  parking_charges NUMERIC(10, 2) DEFAULT 0,
  extra_km NUMERIC(10, 2) DEFAULT 0,
  extra_km_charges NUMERIC(10, 2) DEFAULT 0,
  total_fare NUMERIC(10, 2),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration safety for existing installations
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS toll_included TEXT DEFAULT 'INCLUDED';
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS permit_included TEXT DEFAULT 'EXCLUDED';
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS batta_included TEXT DEFAULT 'INCLUDED';
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS hill_charges_applicable TEXT DEFAULT 'NOT_APPLICABLE';
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS cash_to_collect NUMERIC(10, 2);
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS allowed_km NUMERIC(10, 2) DEFAULT 50.00;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS extra_km_rate NUMERIC(10, 2) DEFAULT 14.00;

-- TABLE: trip_requests
CREATE TABLE IF NOT EXISTS public.trip_requests (
  id TEXT PRIMARY KEY DEFAULT ('req_' || substr(md5(random()::text), 1, 12)),
  trip_id TEXT REFERENCES public.trips(id) ON DELETE CASCADE,
  driver_id TEXT REFERENCES public.drivers(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'REJECTED'
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_at TIMESTAMPTZ
);

-- TABLE: wallet_transactions
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id TEXT PRIMARY KEY DEFAULT ('txn_' || substr(md5(random()::text), 1, 12)),
  driver_id TEXT REFERENCES public.drivers(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  type TEXT NOT NULL, -- 'TRIP_EARNING', 'DRIVER_DEPOSIT', 'WITHDRAWAL', 'BONUS'
  description TEXT,
  trip_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY DEFAULT ('notif_' || substr(md5(random()::text), 1, 12)),
  driver_id TEXT REFERENCES public.drivers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'system',
  trip_id TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- Permissive for Driver App & Admin Panel (Development & Production)
-- =====================================================================

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated and anonymous roles (controlled by API key)
CREATE POLICY "Public full access to drivers" ON public.drivers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to vehicles" ON public.vehicles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to driver_documents" ON public.driver_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to trips" ON public.trips FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to trip_requests" ON public.trip_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to wallet_transactions" ON public.wallet_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- =====================================================================
-- 5. REALTIME PUBLICATION (WebSocket Live Updates)
-- =====================================================================
-- Enable realtime for tables so Driver App and Admin Panel get live sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- =====================================================================
-- 6. SEED / DEMO DATA
-- =====================================================================

-- Insert Demo Driver (Karthik P)
INSERT INTO public.drivers (
  id, name, mobile, email, profile_image, status, online_status, rating, total_trips, deposit_status, deposit_amount
) VALUES (
  'drv_karthik_01',
  'Karthik P',
  '+91 98765 43210',
  'karthik.driver@pickmi.com',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'active',
  'ONLINE',
  4.92,
  342,
  'PENDING',
  250.00
) ON CONFLICT (id) DO NOTHING;

-- Insert Vehicle for Demo Driver
INSERT INTO public.vehicles (
  id, driver_id, vehicle_number, vehicle_type, vehicle_model, vehicle_image
) VALUES (
  'veh_01',
  'drv_karthik_01',
  'KA 05 MN 4821',
  'Sedan',
  'Maruti Suzuki Dzire VXI (2024)',
  'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'
) ON CONFLICT (id) DO NOTHING;

-- Insert Initial Sample Trips
INSERT INTO public.trips (
  id, trip_number, customer_name, customer_phone, pickup_location, pickup_latitude, pickup_longitude,
  drop_location, drop_latitude, drop_longitude, pickup_date, pickup_time, fare, distance, vehicle_type, status, otp, trip_type
) VALUES 
(
  'trip_101', '#PM10245', 'Ananya Sharma', '+91 98765 43210',
  'Kempegowda Int. Airport (BLR), Terminal 2', 13.1989, 77.7068,
  'Indiranagar 100ft Road, Bengaluru', 12.9784, 77.6408,
  'Today', '02:30 PM', 1150.00, '38.5 km', 'Sedan', 'AVAILABLE', '4821', 'Airport Transfer'
),
(
  'trip_102', '#PM10246', 'Rajesh Kumar', '+91 98765 43211',
  'MG Road Metro Station, Bengaluru', 12.9756, 77.6066,
  'Electronic City Phase 1, Toll Gate', 12.8452, 77.6602,
  'Today', '03:15 PM', 640.00, '22.0 km', 'Sedan', 'AVAILABLE', '3910', 'One-way'
),
(
  'trip_103', '#PM10247', 'Sneha Patel', '+91 98765 43212',
  'Whitefield ITPL Main Gate', 12.9863, 77.7378,
  'Koramangala Sony World Junction', 12.9352, 77.6245,
  'Today', '04:00 PM', 580.00, '19.4 km', 'Sedan', 'AVAILABLE', '6274', 'One-way'
),
(
  'trip_104', '#PM10248', 'Vikram Malhotra', '+91 98765 43213',
  'Bangalore City Railway Station (SBC)', 12.9781, 77.5696,
  'Mysore Palace, Sayyaji Rao Road, Mysuru', 12.3052, 76.6552,
  'Tomorrow', '06:00 AM', 2850.00, '145.0 km', 'Sedan', 'AVAILABLE', '1893', 'Outstation'
)
ON CONFLICT (id) DO NOTHING;
