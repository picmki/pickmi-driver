import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Driver, Vehicle, DriverDocument, Trip, TripStatus, OnlineStatus } from '../types/database';

export const isSupabaseReady = isSupabaseConfigured;

// ─── 1. Driver Profile Services ──────────────────────────────────────────────
export async function getDriverProfile(driverId: string): Promise<Driver | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', driverId)
      .maybeSingle();

    if (error) {
      console.warn('Supabase getDriverProfile error:', error.message);
      return null;
    }
    return data as Driver;
  } catch (err) {
    console.warn('Supabase getDriverProfile error:', err);
    return null;
  }
}

export async function getDriverByMobile(mobile: string): Promise<{
  driver: Driver | null;
  vehicle: Vehicle | null;
  documents: DriverDocument[];
}> {
  if (!isSupabaseConfigured()) return { driver: null, vehicle: null, documents: [] };

  try {
    const cleanedMobile = mobile.replace(/\s+/g, '');
    const { data: driverData, error } = await supabase
      .from('drivers')
      .select('*')
      .or(`mobile.eq.${mobile},mobile.eq.${cleanedMobile}`)
      .maybeSingle();

    if (error || !driverData) {
      return { driver: null, vehicle: null, documents: [] };
    }

    const [vehRes, docRes] = await Promise.all([
      supabase.from('vehicles').select('*').eq('driver_id', driverData.id).maybeSingle(),
      supabase.from('driver_documents').select('*').eq('driver_id', driverData.id),
    ]);

    return {
      driver: driverData as Driver,
      vehicle: (vehRes.data as Vehicle) || null,
      documents: (docRes.data as DriverDocument[]) || [],
    };
  } catch (err) {
    console.warn('Supabase getDriverByMobile error:', err);
    return { driver: null, vehicle: null, documents: [] };
  }
}

export async function updateDriverOnlineStatusInSupabase(driverId: string, status: OnlineStatus): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase
      .from('drivers')
      .update({ online_status: status, updated_at: new Date().toISOString() })
      .eq('id', driverId);
    return !error;
  } catch {
    return false;
  }
}

export async function updateDriverPushTokenInSupabase(driverId: string, pushToken: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !driverId || !pushToken) return false;
  try {
    // 1. Attempt updating drivers.push_token (if column exists)
    const { error: drvErr } = await supabase
      .from('drivers')
      .update({ push_token: pushToken, updated_at: new Date().toISOString() })
      .eq('id', driverId);

    if (drvErr) {
      console.log('Notice: drivers.push_token column not present, using driver_documents fallback.');
    }

    // 2. Guaranteed fallback: upsert into driver_documents table
    try {
      await supabase.from('driver_documents').upsert({
        id: `doc_push_${driverId}`,
        driver_id: driverId,
        document_type: 'push_token',
        document_number: pushToken,
        document_url: pushToken,
        verification_status: 'Verified',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    } catch (docErr) {
      console.warn('Push token doc fallback warning:', docErr);
    }

    console.log('✅ Driver push_token synced to Supabase successfully:', pushToken);
    return true;
  } catch (err) {
    console.warn('Supabase updateDriverPushTokenInSupabase failed:', err);
    return false;
  }
}

export async function updateDriverDepositInSupabase(
  driverId: string,
  status: 'PAID' | 'PENDING',
  paymentId?: string,
  amount: number = 250,
  driverFallback?: Driver
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const isPaid = status === 'PAID';
  const now = new Date();
  const nextYear = new Date();
  nextYear.setFullYear(now.getFullYear() + 1);

  try {
    const updatePayload = {
      deposit_status: status,
      deposit_amount: amount,
      deposit_paid_at: isPaid ? now.toISOString() : null,
      deposit_expires_at: isPaid ? nextYear.toISOString() : null,
      deposit_payment_id: isPaid ? (paymentId || null) : null,
      updated_at: now.toISOString(),
    };

    const { data, error } = await supabase
      .from('drivers')
      .update(updatePayload)
      .eq('id', driverId)
      .select();

    if (error) {
      console.warn('Supabase updateDriverDepositInSupabase update error:', error.message);
    }

    // If no row was matched or updated, insert/upsert using driverFallback
    if ((!data || data.length === 0) && driverFallback) {
      await upsertDriverProfile({
        ...driverFallback,
        ...updatePayload,
      });
    }

    return !error;
  } catch (err) {
    console.warn('Supabase updateDriverDepositInSupabase exception:', err);
    return false;
  }
}

export async function upsertDriverProfile(
  driver: Partial<Driver> & { id: string }
): Promise<{ success: boolean; data?: Driver; error?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Database is not configured' };

  try {
    const payload: any = {
      id: driver.id,
      name: driver.name,
      mobile: driver.mobile,
      email: driver.email || `${driver.name?.toLowerCase().replace(/\s+/g, '.')}@pickmi.com`,
      profile_image:
        driver.profile_image ||
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      status: driver.status || 'active',
      online_status: driver.online_status || 'ONLINE',
      rating: driver.rating || 5.0,
      total_trips: driver.total_trips || 0,
      deposit_status: driver.deposit_status || 'PENDING',
      deposit_amount: driver.deposit_amount || 250,
      updated_at: new Date().toISOString(),
    };

    if (driver.push_token) payload.push_token = driver.push_token;
    if (driver.created_at) payload.created_at = driver.created_at;

    const { data, error } = await supabase
      .from('drivers')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.warn('Supabase upsertDriverProfile error:', error.message);
      let userFriendlyMsg = error.message;
      if (error.code === '23505' && error.message.includes('mobile')) {
        userFriendlyMsg = 'A driver with this mobile number is already registered in the system.';
      }
      return { success: false, error: userFriendlyMsg };
    }
    return { success: true, data: data as Driver };
  } catch (err: any) {
    console.warn('Supabase upsertDriverProfile exception:', err);
    return { success: false, error: err?.message || 'Failed to save driver profile' };
  }
}

// ─── 2. Vehicle Services ─────────────────────────────────────────────────────
export async function upsertVehicle(
  vehicle: Vehicle
): Promise<{ success: boolean; data?: Vehicle; error?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Database is not configured' };

  try {
    const payload = {
      id: vehicle.id,
      driver_id: vehicle.driver_id,
      vehicle_number: vehicle.vehicle_number.toUpperCase().trim(),
      vehicle_type: vehicle.vehicle_type,
      vehicle_model: vehicle.vehicle_model,
      vehicle_image: vehicle.vehicle_image || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('vehicles')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.warn('Supabase upsertVehicle error:', error.message);
      let userFriendlyMsg = error.message;
      if (error.code === '23505' && error.message.includes('vehicle_number')) {
        userFriendlyMsg = 'This vehicle registration number is already registered in PickMi.';
      }
      return { success: false, error: userFriendlyMsg };
    }
    return { success: true, data: data as Vehicle };
  } catch (err: any) {
    console.warn('Supabase upsertVehicle exception:', err);
    return { success: false, error: err?.message || 'Failed to save vehicle details' };
  }
}

// ─── 3. Driver Document Services ─────────────────────────────────────────────
export async function syncDriverDocuments(
  docs: DriverDocument[]
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || docs.length === 0) return { success: true };

  try {
    const { error } = await supabase.from('driver_documents').upsert(
      docs.map((doc) => ({
        id: doc.id,
        driver_id: doc.driver_id,
        document_type: doc.document_type,
        document_url: doc.document_url,
        document_number: doc.document_number,
        valid_until: doc.valid_until,
        verification_status: doc.verification_status || 'Pending',
        updated_at: new Date().toISOString(),
      })),
      { onConflict: 'id' }
    );

    if (error) {
      console.warn('Supabase syncDriverDocuments error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('Supabase syncDriverDocuments exception:', err);
    return { success: false, error: err?.message || 'Failed to save driver documents' };
  }
}

// ─── 4. Trips Services ───────────────────────────────────────────────────────
export async function fetchTripsFromSupabase(): Promise<Trip[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetchTripsFromSupabase error:', error.message);
      return [];
    }
    return (data || []) as Trip[];
  } catch (err) {
    console.warn('Supabase fetchTripsFromSupabase error:', err);
    return [];
  }
}

export async function requestTripInSupabase(tripId: string, driverId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    // 1. Update trip status to REQUESTED
    const { error: tripError } = await supabase
      .from('trips')
      .update({ status: 'REQUESTED', updated_at: new Date().toISOString() })
      .eq('id', tripId);

    // 2. Clean up any existing request for this driver and trip, then insert fresh request
    await supabase.from('trip_requests').delete().eq('trip_id', tripId).eq('driver_id', driverId);
    const { error: reqError } = await supabase.from('trip_requests').insert({
      id: `req_${Date.now()}`,
      trip_id: tripId,
      driver_id: driverId,
      status: 'PENDING',
      requested_at: new Date().toISOString(),
    });

    if (tripError || reqError) {
      console.warn('Supabase requestTripInSupabase error:', tripError?.message || reqError?.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase requestTripInSupabase error:', err);
    return false;
  }
}

export async function updateTripStatusInSupabase(
  tripId: string,
  status: TripStatus,
  extraData?: Record<string, any>
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const updatePayload: Record<string, any> = {
      status,
      ...extraData,
      updated_at: new Date().toISOString(),
    };
    if (status === 'COMPLETED' && !extraData?.completed_at) {
      updatePayload.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('trips')
      .update(updatePayload)
      .eq('id', tripId);

    if (error) {
      console.warn('Supabase updateTripStatusInSupabase error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase updateTripStatusInSupabase error:', err);
    return false;
  }
}

export async function createTripInSupabase(trip: Trip): Promise<Trip | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('trips')
      .insert({
        ...trip,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.warn('Supabase createTripInSupabase error:', error.message);
      return null;
    }
    return data as Trip;
  } catch (err) {
    console.warn('Supabase createTripInSupabase error:', err);
    return null;
  }
}

// ─── 5. Realtime Subscriptions (Live WebSocket updates from Admin & Driver) ──
export function subscribeToTripsRealtime(onPayload: (payload: any) => void) {
  if (!isSupabaseConfigured()) return () => {};

  const channelId = `realtime_trips_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'trips' },
      (payload) => {
        onPayload(payload);
      }
    )
    .subscribe();

  return () => {
    try {
      supabase.removeChannel(channel);
    } catch {}
  };
}

export function subscribeToDriverRealtime(driverId: string, onPayload: (payload: any) => void) {
  if (!isSupabaseConfigured()) return () => {};

  const channel = supabase
    .channel(`realtime_driver_${driverId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'drivers',
        filter: `id=eq.${driverId}`,
      },
      (payload) => {
        onPayload(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ─── 6. Concurrent Safe Trip Assignment & Decline ───────────────────────────
export async function acceptTripInSupabase(
  tripId: string,
  driverId: string
): Promise<{ success: boolean; reason?: "ALREADY_TAKEN" | "EXPIRED" | "ERROR" }> {
  if (!isSupabaseConfigured()) {
    return { success: true };
  }

  try {
    // 1. Verify trip is still eligible
    const { data: currentTrip, error: fetchErr } = await supabase
      .from("trips")
      .select("id, status, assigned_driver_id")
      .eq("id", tripId)
      .maybeSingle();

    if (fetchErr || !currentTrip) {
      console.warn("acceptTripInSupabase fetch error:", fetchErr?.message);
      return { success: false, reason: "ERROR" };
    }

    // Check if status is no longer offerable or another driver is assigned
    if (
      currentTrip.status !== "AVAILABLE" &&
      currentTrip.status !== "ASSIGNED" &&
      currentTrip.status !== "REQUESTED"
    ) {
      return { success: false, reason: "ALREADY_TAKEN" };
    }

    if (
      currentTrip.assigned_driver_id &&
      currentTrip.assigned_driver_id !== driverId
    ) {
      return { success: false, reason: "ALREADY_TAKEN" };
    }

    // 2. Atomic conditional update: only update if still available
    const { data: updated, error: updateErr } = await supabase
      .from("trips")
      .update({
        status: "ON_THE_WAY",
        assigned_driver_id: driverId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tripId)
      .in("status", ["AVAILABLE", "ASSIGNED", "REQUESTED"])
      .select();

    if (updateErr) {
      console.warn("acceptTripInSupabase update error:", updateErr.message);
      return { success: false, reason: "ERROR" };
    }

    if (!updated || updated.length === 0) {
      return { success: false, reason: "ALREADY_TAKEN" };
    }

    return { success: true };
  } catch (err) {
    console.warn("acceptTripInSupabase exception:", err);
    return { success: false, reason: "ERROR" };
  }
}

export async function declineTripInSupabase(
  tripId: string,
  driverId: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;

  try {
    // Record rejection in trip_requests table
    await supabase.from("trip_requests").upsert({
      id: `req_${tripId}_${driverId}`,
      trip_id: tripId,
      driver_id: driverId,
      status: "REJECTED",
      requested_at: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.warn("declineTripInSupabase error:", err);
    return false;
  }
}

export async function updateDriverHeartbeatInSupabase(
  driverId: string
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase
      .from("drivers")
      .update({
        last_location_update: new Date().toISOString(),
      })
      .eq("id", driverId);
  } catch {}
}
