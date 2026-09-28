import { createClient } from '@supabase/supabase-js';
import type { Reservation, UserProfile } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://awwrbgwpzgtbunrvsmyu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_MVv7fXTjS6R79oXLOHuCLA_ij0lDSRE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const STORAGE_KEY_USER = '@pickmi_customer_user_v2';
const STORAGE_KEY_RESERVATIONS = '@pickmi_customer_reservations_cache_v2';

// USER STORAGE API
export async function getLocalUser(): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveLocalUser(user: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  } catch (e) {
    console.warn('Failed to save user locally:', e);
  }
}

export async function clearLocalUser(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY_USER);
  } catch (e) {
    console.warn('Failed to clear user:', e);
  }
}

// RESERVATIONS API
export async function fetchCustomerReservations(customerPhone: string): Promise<Reservation[]> {
  try {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        driver:drivers(
          id,
          name,
          mobile,
          rating,
          total_trips,
          profile_image,
          vehicle:vehicles(vehicle_number, vehicle_type, vehicle_model)
        )
      `)
      .eq('customer_phone', customerPhone)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch error, fallback to cached:', error.message);
      return getCachedReservations();
    }

    if (data && data.length > 0) {
      const formatted: Reservation[] = data.map((t: any) => {
        const driverRecord = Array.isArray(t.driver) ? t.driver[0] : t.driver;
        const vehicleRecord = driverRecord?.vehicle
          ? Array.isArray(driverRecord.vehicle)
            ? driverRecord.vehicle[0]
            : driverRecord.vehicle
          : undefined;

        return {
          id: t.id,
          trip_number: t.trip_number || `#PM-${t.id.substring(0, 6)}`,
          customer_name: t.customer_name,
          customer_phone: t.customer_phone,
          customer_email: t.customer_email || undefined,
          pickup_location: t.pickup_location,
          pickup_latitude: Number(t.pickup_latitude) || 12.9352,
          pickup_longitude: Number(t.pickup_longitude) || 77.6245,
          drop_location: t.drop_location,
          drop_latitude: Number(t.drop_latitude) || 13.1989,
          drop_longitude: Number(t.drop_longitude) || 77.7068,
          pickup_date: t.pickup_date || 'Future Date',
          pickup_time: t.pickup_time || 'Future Time',
          fare: Number(t.fare) || 0,
          distance: t.distance || '0 km',
          vehicle_type: t.vehicle_type || 'Sedan',
          status: t.status || 'AVAILABLE',
          assigned_driver_id: t.assigned_driver_id || null,
          otp: t.otp || '4826',
          trip_type: t.trip_type || 'One-way',
          payment_method: t.payment_method || 'Cash',
          toll_included: t.toll_included,
          permit_included: t.permit_included,
          batta_included: t.batta_included,
          hill_charges_applicable: t.hill_charges_applicable,
          toll_charges: Number(t.toll_charges) || 0,
          extra_km_rate: Number(t.extra_km_rate) || 14,
          allowed_km: Number(t.allowed_km) || 50,
          cash_to_collect: Number(t.cash_to_collect) || Number(t.fare) || 0,
          rating: t.rating || undefined,
          rating_feedback: t.rating_feedback || undefined,
          created_at: t.created_at || new Date().toISOString(),
          completed_at: t.completed_at || null,
          driver: driverRecord
            ? {
                id: driverRecord.id,
                name: driverRecord.name,
                mobile: driverRecord.mobile,
                rating: Number(driverRecord.rating) || 4.9,
                total_trips: Number(driverRecord.total_trips) || 100,
                profile_image: driverRecord.profile_image,
                vehicle: vehicleRecord
                  ? {
                      vehicle_number: vehicleRecord.vehicle_number || 'KA 01 MJ 4821',
                      vehicle_type: vehicleRecord.vehicle_type || t.vehicle_type,
                      vehicle_model: vehicleRecord.vehicle_model || 'Dzire',
                    }
                  : undefined,
              }
            : undefined,
        };
      });

      await AsyncStorage.setItem(STORAGE_KEY_RESERVATIONS, JSON.stringify(formatted));
      return formatted;
    }

    return getCachedReservations();
  } catch (err) {
    console.warn('Network error fetching reservations:', err);
    return getCachedReservations();
  }
}

export async function createReservationInBackend(payload: {
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
  vehicle_type: string;
  trip_type?: string;
  payment_method?: string;
}): Promise<Reservation> {
  const tripNum = 'PM-' + Math.floor(100000 + Math.random() * 900000);
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  const insertPayload = {
    trip_number: tripNum,
    customer_name: payload.customer_name,
    customer_phone: payload.customer_phone,
    pickup_location: payload.pickup_location,
    pickup_latitude: payload.pickup_latitude,
    pickup_longitude: payload.pickup_longitude,
    drop_location: payload.drop_location,
    drop_latitude: payload.drop_latitude,
    drop_longitude: payload.drop_longitude,
    pickup_date: payload.pickup_date,
    pickup_time: payload.pickup_time,
    fare: payload.fare,
    distance: payload.distance,
    vehicle_type: payload.vehicle_type,
    trip_type: payload.trip_type || 'One-way',
    payment_method: payload.payment_method || 'Cash',
    status: 'AVAILABLE',
    assigned_driver_id: null,
    otp: otp,
    toll_included: 'INCLUDED' as const,
    permit_included: 'EXCLUDED' as const,
    batta_included: 'INCLUDED' as const,
    hill_charges_applicable: 'NOT_APPLICABLE' as const,
    cash_to_collect: payload.fare,
    allowed_km: 50,
    extra_km_rate: 14,
    created_at: new Date().toISOString(),
  };

  let createdReservation: Reservation = {
    id: 'res_' + Date.now().toString(36),
    ...insertPayload,
    vehicle_type: payload.vehicle_type as any,
    status: 'AVAILABLE',
  };

  try {
    const { data, error } = await supabase
      .from('trips')
      .insert([insertPayload])
      .select()
      .single();

    if (!error && data) {
      createdReservation = {
        ...createdReservation,
        id: data.id,
        trip_number: data.trip_number || tripNum,
        otp: data.otp || otp,
      };
    }
  } catch (e) {
    console.warn('Backend insert exception, saved locally:', e);
  }

  const existing = await getCachedReservations();
  const updated = [createdReservation, ...existing];
  await AsyncStorage.setItem(STORAGE_KEY_RESERVATIONS, JSON.stringify(updated));

  return createdReservation;
}

export async function cancelReservationInBackend(tripId: string): Promise<void> {
  try {
    await supabase
      .from('trips')
      .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
      .eq('id', tripId);
  } catch (e) {
    console.warn('Cancel reservation network warning:', e);
  }

  const existing = await getCachedReservations();
  const updated = existing.map((r) => (r.id === tripId ? { ...r, status: 'CANCELLED' as const } : r));
  await AsyncStorage.setItem(STORAGE_KEY_RESERVATIONS, JSON.stringify(updated));
}

export async function rateTripInBackend(tripId: string, rating: number, feedback?: string): Promise<void> {
  try {
    await supabase
      .from('trips')
      .update({ rating, rating_feedback: feedback || null, updated_at: new Date().toISOString() })
      .eq('id', tripId);
  } catch (e) {
    console.warn('Rating trip network warning:', e);
  }

  const existing = await getCachedReservations();
  const updated = existing.map((r) =>
    r.id === tripId ? { ...r, rating, rating_feedback: feedback } : r
  );
  await AsyncStorage.setItem(STORAGE_KEY_RESERVATIONS, JSON.stringify(updated));
}

async function getCachedReservations(): Promise<Reservation[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_RESERVATIONS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// REALTIME SUBSCRIPTION
export function subscribeToCustomerTrips(onUpdate: () => void) {
  const channel = supabase
    .channel('pickmi_customer_realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => {
      onUpdate();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
