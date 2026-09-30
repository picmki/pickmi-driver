import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Trip, TripStatus } from '../types/database';
import { INITIAL_TRIPS } from '../data/mockData';
import { useNotifications } from './NotificationContext';
import { useAuth } from './AuthContext';
import { playNewTripSound } from '../utils/soundEffects';
import { triggerPushNotification, registerNotificationClickListener } from '../utils/pushNotifications';
import {
  fetchTripsFromSupabase,
  subscribeToTripsRealtime,
  acceptTripInSupabase,
  declineTripInSupabase,
  updateTripStatusInSupabase,
  requestTripInSupabase,
} from '../services/supabaseService';
import { useWallet } from './WalletContext';

interface TripContextType {
  trips: Trip[];
  activeTrip: Trip | null;
  activeTrips: Trip[];
  selectedTripForDetails: Trip | null;
  completedTripForModal: Trip | null;
  incomingAlertTrip: Trip | null;
  isAcceptingIncoming: boolean;
  unavailableTripError: string | null;
  availableTrips: Trip[];
  requestedTrips: Trip[];
  assignedTrips: Trip[];
  completedTrips: Trip[];
  requestTrip: (tripId: string) => void;
  simulateAdminAssignment: (tripId?: string) => void;
  createNewTrip: (customTrip?: Partial<Trip>) => Trip;
  acceptTrip: (tripId: string) => Promise<boolean>;
  rejectTrip: (tripId: string, reason?: "EXPIRED" | "DECLINED") => void;
  advanceTripStatus: (
    tripId: string,
    nextStatus: TripStatus,
    extraData?: {
      extra_km?: number;
      extra_km_charges?: number;
      toll_charges?: number;
      parking_charges?: number;
      total_fare?: number;
    }
  ) => void;
  setSelectedTripForDetails: (trip: Trip | null) => void;
  setCompletedTripForModal: (trip: Trip | null) => void;
  setIncomingAlertTrip: (trip: Trip | null) => void;
  resetDemoData: () => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider = ({ children }: { children: ReactNode }) => {
  const [trips, setTrips] = useState<Trip[]>(INITIAL_TRIPS);
  const [selectedTripForDetails, setSelectedTripForDetails] = useState<Trip | null>(null);
  const [completedTripForModal, setCompletedTripForModal] = useState<Trip | null>(null);
  const [incomingAlertTrip, setIncomingAlertTrip] = useState<Trip | null>(null);
  const [isAcceptingIncoming, setIsAcceptingIncoming] = useState(false);
  const [unavailableTripError, setUnavailableTripError] = useState<string | null>(null);
  const tripQueueRef = useRef<Trip[]>([]);

  const showNextQueuedTrip = () => {
    setUnavailableTripError(null);
    setIsAcceptingIncoming(false);
    while (tripQueueRef.current.length > 0) {
      const next = tripQueueRef.current.shift();
      if (next && (next.status === "AVAILABLE" || next.status === "ASSIGNED")) {
        setIncomingAlertTrip(next);
        return;
      }
    }
    setIncomingAlertTrip(null);
  };

  const { showToast } = useNotifications();
  const { driver, isVerified } = useAuth();
  const { refreshWallet, recordCompletedTrip } = useWallet();
  const driverRef = useRef(driver);
  // Strict deduplication tracker: guarantees exactly ONE notification per trip!
  const notifiedTripIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    driverRef.current = driver;
  }, [driver]);

  // Automatically register for Expo Push Token whenever driver is authenticated
  useEffect(() => {
    if (driver?.id) {
      const { registerForRemotePushNotificationsAsync } = require('../utils/pushNotifications');
      registerForRemotePushNotificationsAsync(driver.id).catch(() => {});
    }
  }, [driver?.id]);

  const availableTrips = trips.filter((t) => t.status === 'AVAILABLE');
  const requestedTrips = trips.filter((t) => t.status === 'REQUESTED');
  const assignedTrips = trips.filter((t) => t.status === 'ASSIGNED');
  const completedTrips = trips.filter((t) => t.status === 'COMPLETED');

  // Active trips list (supports multi-trips)
  const activeTrips = trips.filter(
    (t) =>
      t.status === 'ASSIGNED' ||
      t.status === 'ACCEPTED' ||
      t.status === 'ON_THE_WAY' ||
      t.status === 'ARRIVED' ||
      t.status === 'STARTED'
  );
  const activeTrip = activeTrips[0] || null;

  // ── Sync with Supabase Database & Realtime Push Notifications ──
  useEffect(() => {
    // 1. Fetch live trips from Supabase on mount
    fetchTripsFromSupabase().then((liveTrips) => {
      setTrips(liveTrips || []);
      // Pre-populate already existing trips so old trips don't re-trigger alerts
      (liveTrips || []).forEach((t) => notifiedTripIdsRef.current.add(t.id));
    });

    // 2. Setup Notification Click / Tap Listener (when tapped from background/lockscreen)
    const cleanupClickListener = registerNotificationClickListener((tripId) => {
      console.log('📲 Notification tapped! Opening incoming trip modal for:', tripId);
      setTrips((currentTrips) => {
        const matchingTrip = currentTrips.find((t) => t.id === tripId);
        if (matchingTrip && (matchingTrip.status === 'AVAILABLE' || matchingTrip.status === 'ASSIGNED')) {
          setIncomingAlertTrip(matchingTrip);
        } else {
          fetchTripsFromSupabase().then((latest) => {
            const found = latest.find((t) => t.id === tripId);
            if (found && (found.status === 'AVAILABLE' || found.status === 'ASSIGNED')) {
              setIncomingAlertTrip(found);
            }
          });
        }
        return currentTrips;
      });
    });

    // 3. Setup AppState listener (when returning to app from background or another screen)
    const appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const curDriver = driverRef.current;
        if (curDriver?.online_status === 'ONLINE') {
          // Silently sync latest trips data into state without popping fake alerts on open
          fetchTripsFromSupabase().then((latestTrips) => {
            if (latestTrips && latestTrips.length > 0) {
              setTrips(latestTrips);
              // Ensure all currently fetched trips are marked as seen
              latestTrips.forEach((t) => notifiedTripIdsRef.current.add(t.id));
            }
          });
        }
      }
    });

    // 4. Subscribe to Realtime Trips stream
    const unsubscribe = subscribeToTripsRealtime((payload) => {
      console.log('Realtime trip notification event:', payload.eventType, payload.new?.id);

      if (payload.eventType === 'INSERT' && payload.new) {
        const raw = payload.new;
        const tripId = raw.id;

        const newTrip: Trip = {
          id: tripId,
          trip_number: raw.trip_number || `#PM${tripId.substring(0, 5)}`,
          customer_name: raw.customer_name || 'Passenger',
          customer_phone: raw.customer_phone || '+91 98450 12345',
          pickup_location: raw.pickup_location,
          pickup_latitude: Number(raw.pickup_latitude) || 12.9716,
          pickup_longitude: Number(raw.pickup_longitude) || 77.5946,
          drop_location: raw.drop_location,
          drop_latitude: Number(raw.drop_latitude) || 12.9279,
          drop_longitude: Number(raw.drop_longitude) || 77.6271,
          fare: Number(raw.fare) || 500,
          distance: raw.distance || '15 km',
          vehicle_type: raw.vehicle_type || 'Sedan',
          trip_type: raw.trip_type || 'One-way',
          status: raw.status || 'AVAILABLE',
          otp: raw.otp || '4821',
          pickup_date: raw.pickup_date || 'Today',
          pickup_time: raw.pickup_time || 'Just now',
          payment_method: raw.payment_method || 'Cash',
          toll_charges: Number(raw.toll_charges) || 0,
          parking_charges: Number(raw.parking_charges) || 0,
          extra_km_rate: Number(raw.extra_km_rate) || 12,
          allowed_km: Number(raw.allowed_km) || 50,
          cash_to_collect: raw.cash_to_collect ? Number(raw.cash_to_collect) : Number(raw.fare) || 500,
          toll_included: raw.toll_included || 'INCLUDED',
          permit_included: raw.permit_included || 'EXCLUDED',
          batta_included: raw.batta_included || 'INCLUDED',
          hill_charges_applicable: raw.hill_charges_applicable || 'NOT_APPLICABLE',
          created_at: raw.created_at || new Date().toISOString(),
        };

        // Add to state
        setTrips((prev) => [newTrip, ...prev.filter((t) => t.id !== newTrip.id)]);

        // ── ONLINE / OFFLINE & ASSIGNMENT LOGIC ─────────────────────────────
        const curDriver = driverRef.current;
        const isOnline = (curDriver?.online_status || '').toString().toUpperCase() === 'ONLINE';
        const isDirectlyAssignedToMe = Boolean(
          newTrip.assigned_driver_id &&
          curDriver?.id &&
          newTrip.assigned_driver_id.toString().trim() === curDriver.id.toString().trim()
        );

        // If trip is explicitly assigned to a DIFFERENT driver, skip alert
        if (newTrip.assigned_driver_id && curDriver?.id && newTrip.assigned_driver_id.toString().trim() !== curDriver.id.toString().trim()) {
          console.log('Trip assigned to different driver, skipping alert.');
          return;
        }

        // If driver is OFFLINE and trip is not directly assigned to them: skip
        if (!isOnline && !isDirectlyAssignedToMe) {
          console.log('🔇 Driver is OFFLINE. Silently synced trip without disturbing driver.');
          return;
        }

        // ── STRICT DEDUPLICATION: PREVENT DUPLICATE NOTIFICATIONS ───────
        if (notifiedTripIdsRef.current.has(tripId)) {
          console.log('🔇 Trip already notified once. Skipping duplicate notification:', tripId);
          return;
        }
        notifiedTripIdsRef.current.add(tripId);

        // 1. Play audible 4-note bell chime & haptic feedback
        playNewTripSound();

        // 2. Trigger In-App Notification Banner Toast
        const pickupShort = (newTrip.pickup_location || 'Pickup').split(',')[0];
        const dropShort = (newTrip.drop_location || 'Drop').split(',')[0];
        showToast(
          isDirectlyAssignedToMe ? '🚨 Trip Assigned to You!' : '🚨 New Trip Dispatched!',
          `Trip ${newTrip.trip_number} • ₹${newTrip.fare} • ${pickupShort} → ${dropShort}`,
          isDirectlyAssignedToMe ? 'trip_assigned' : 'trip_available',
          newTrip.id
        );

        // 3. Trigger Native / OS Push Notification
        triggerPushNotification(
          "🚕 New Trip Request",
          `Pickup: ${pickupShort}\nDrop: ${dropShort}\n₹${Number(newTrip.fare).toLocaleString("en-IN")}\nTap to view trip`,
          { tripId: newTrip.id, type: "incoming_trip_request" }
        );

        // 4. Mount prominent Incoming Trip Alert Card Modal or Queue
        if (incomingAlertTrip) {
          console.log("Incoming modal already active, queueing trip:", newTrip.id);
          tripQueueRef.current.push(newTrip);
        } else {
          setIncomingAlertTrip(newTrip);
        }
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        const raw = payload.new;
        setTrips((prev) =>
          prev.map((t) => {
            if (t.id === raw.id) {
              return {
                ...t,
                status: raw.status || t.status,
                assigned_driver_id: raw.assigned_driver_id ?? t.assigned_driver_id,
                fare: raw.fare ? Number(raw.fare) : t.fare,
                toll_charges: raw.toll_charges ? Number(raw.toll_charges) : t.toll_charges,
                parking_charges: raw.parking_charges ? Number(raw.parking_charges) : t.parking_charges,
                total_fare: raw.total_fare ? Number(raw.total_fare) : t.total_fare,
                completed_at: raw.completed_at || t.completed_at,
              };
            }
            return t;
          })
        );

        if (raw.status === 'ASSIGNED') {
          const curDriver = driverRef.current;
          const isAssignedToMe = Boolean(
            raw.assigned_driver_id &&
            curDriver?.id &&
            raw.assigned_driver_id.toString().trim() === curDriver.id.toString().trim()
          );
          const assignmentKey = `assigned_${raw.id}_${raw.assigned_driver_id}`;

          if (isAssignedToMe && !notifiedTripIdsRef.current.has(assignmentKey)) {
            notifiedTripIdsRef.current.add(assignmentKey);

            playNewTripSound();

            const pickupShort = (raw.pickup_location || 'Pickup').split(',')[0];
            const dropShort = (raw.drop_location || 'Drop').split(',')[0];

            showToast(
              '🚨 Trip Assigned to You!',
              `Trip ${raw.trip_number || ''} • ₹${raw.fare || 500} • ${pickupShort} → ${dropShort}`,
              'trip_assigned',
              raw.id
            );

            triggerPushNotification(
              '🚨 Trip Assigned to You! - PickMi Driver',
              `Trip ${raw.trip_number || ''} (₹${raw.fare || 500})\nFrom: ${pickupShort}\nTo: ${dropShort}`,
              { tripId: raw.id, fare: raw.fare }
            );

            // Construct full Trip and mount incoming trip sheet
            const fullTrip: Trip = {
              id: raw.id,
              trip_number: raw.trip_number || `#PM${raw.id.substring(0, 5)}`,
              customer_name: raw.customer_name || 'Passenger',
              customer_phone: raw.customer_phone || '+91 98450 12345',
              pickup_location: raw.pickup_location || 'Pickup',
              pickup_latitude: Number(raw.pickup_latitude) || 12.9716,
              pickup_longitude: Number(raw.pickup_longitude) || 77.5946,
              drop_location: raw.drop_location || 'Drop',
              drop_latitude: Number(raw.drop_latitude) || 12.9279,
              drop_longitude: Number(raw.drop_longitude) || 77.6271,
              fare: Number(raw.fare) || 500,
              distance: raw.distance || '15 km',
              vehicle_type: raw.vehicle_type || 'Sedan',
              trip_type: raw.trip_type || 'One-way',
              status: 'ASSIGNED',
              assigned_driver_id: raw.assigned_driver_id,
              otp: raw.otp || '4821',
              pickup_date: raw.pickup_date || 'Today',
              pickup_time: raw.pickup_time || 'Just now',
              payment_method: raw.payment_method || 'Cash',
              toll_charges: Number(raw.toll_charges) || 0,
              parking_charges: Number(raw.parking_charges) || 0,
              extra_km_rate: Number(raw.extra_km_rate) || 12,
              allowed_km: Number(raw.allowed_km) || 50,
              cash_to_collect: raw.cash_to_collect ? Number(raw.cash_to_collect) : Number(raw.fare) || 500,
              toll_included: raw.toll_included || 'INCLUDED',
              permit_included: raw.permit_included || 'EXCLUDED',
              batta_included: raw.batta_included || 'INCLUDED',
              hill_charges_applicable: raw.hill_charges_applicable || 'NOT_APPLICABLE',
              created_at: raw.created_at || new Date().toISOString(),
            };
            setIncomingAlertTrip(fullTrip);
          }
        } else if (raw.status === 'CANCELLED') {
          showToast(
            'Trip Cancelled',
            `Trip ${raw.trip_number || ''} was cancelled.`,
            'system',
            raw.id
          );
          setIncomingAlertTrip((current: Trip | null) => (current?.id === raw.id ? null : current));
        }
      } else if (payload.eventType === 'DELETE') {
        const deletedId = payload.old?.id;
        if (deletedId) {
          console.log('🗑️ Realtime: Trip deleted from Admin:', deletedId);
          setTrips((prev) => prev.filter((t) => t.id !== deletedId));
          setIncomingAlertTrip((current: Trip | null) => (current?.id === deletedId ? null : current));
          setSelectedTripForDetails((current) => (current?.id === deletedId ? null : current));
        }
      }
    });

    return () => {
      unsubscribe();
      cleanupClickListener();
      appStateSubscription.remove();
    };
  }, []);

  const requestTrip = (tripId: string) => {
    if (!isVerified) {
      showToast(
        'Verification Required',
        'Your documents are under review. You can request trips once verified by Admin.',
        'system'
      );
      return;
    }

    setTrips((prev) =>
      prev.map((t) => {
        if (t.id === tripId) {
          return { ...t, status: 'REQUESTED' };
        }
        return t;
      })
    );

    // Persist trip request to Supabase so Admin panel sees the requested driver
    if (driver?.id) {
      requestTripInSupabase(tripId, driver.id).catch((e) =>
        console.warn('requestTripInSupabase error:', e)
      );
    }

    showToast(
      'Trip Request Sent',
      'Your request has been sent to Admin Dispatch. The trip will be assigned once Admin approves.',
      'trip_available',
      tripId
    );
  };

  const simulateAdminAssignment = (tripId?: string) => {
    let targetId = tripId;
    if (!targetId) {
      // Find the first requested or available trip
      const candidate = trips.find((t) => t.status === 'REQUESTED') || trips.find((t) => t.status === 'AVAILABLE');
      if (candidate) {
        targetId = candidate.id;
      }
    }

    if (!targetId) return;

    let assignedTripNumber = '';
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id === targetId) {
          assignedTripNumber = t.trip_number;
          return { ...t, status: 'ASSIGNED' };
        }
        return t;
      })
    );

    showToast(
      'Trip Assigned',
      `Your trip ${assignedTripNumber || '#PM10245'} has been assigned to you.`,
      'trip_assigned',
      targetId
    );
  };

  const createNewTrip = (customTrip?: Partial<Trip>): Trip => {
    const sampleRoutes = [
      {
        pickup: 'Kempegowda Int. Airport (BLR), Terminal 2',
        drop: '100ft Road, Indiranagar, Bengaluru',
        fare: 1150,
        distance: 38.2,
        duration: 52,
        customer_name: 'Priya Sharma',
        customer_phone: '+91 98451 23456',
        trip_type: 'Outstation' as const,
      },
      {
        pickup: 'Phoenix Marketcity, Whitefield Road',
        drop: 'Electronic City Phase 1, Bengaluru',
        fare: 680,
        distance: 24.5,
        duration: 45,
        customer_name: 'Rahul Verma',
        customer_phone: '+91 98452 34567',
        trip_type: 'One-way' as const,
      },
      {
        pickup: 'Forum Mall, Koramangala 7th Block',
        drop: 'Manyata Tech Park, Nagavara',
        fare: 540,
        distance: 18.0,
        duration: 38,
        customer_name: 'Ananya Rao',
        customer_phone: '+91 98453 45678',
        trip_type: 'Round-trip' as const,
      },
      {
        pickup: 'MG Road Metro Station, Bengaluru',
        drop: 'Sarjapur Road, Wipro Gate, Bengaluru',
        fare: 420,
        distance: 16.4,
        duration: 35,
        customer_name: 'Vikram Mehta',
        customer_phone: '+91 98454 56789',
        trip_type: 'One-way' as const,
      },
      {
        pickup: 'Jayanagar 4th Block Complex',
        drop: 'Hebbal Flyover, Bellary Road',
        fare: 490,
        distance: 21.0,
        duration: 40,
        customer_name: 'Suresh Kumar',
        customer_phone: '+91 98455 67890',
        trip_type: 'One-way' as const,
      },
    ];

    const route = sampleRoutes[Math.floor(Math.random() * sampleRoutes.length)];
    const tripNum = `#PM${Math.floor(10000 + Math.random() * 90000)}`;
    const randomOtp = `${Math.floor(1000 + Math.random() * 9000)}`;

    const newTrip: Trip = {
      id: `trip_${Date.now()}`,
      trip_number: tripNum,
      customer_name: route.customer_name,
      customer_phone: route.customer_phone,
      pickup_location: route.pickup,
      pickup_latitude: 12.9716,
      pickup_longitude: 77.5946,
      drop_location: route.drop,
      drop_latitude: 12.9279,
      drop_longitude: 77.6271,
      pickup_date: 'Today',
      pickup_time: 'Just now',
      distance: `${route.distance} km`,
      fare: route.fare,
      extra_km_rate: 14,
      trip_type: route.trip_type,
      vehicle_type: 'Sedan',
      status: customTrip?.status || 'AVAILABLE',
      otp: randomOtp,
      toll_charges: 0,
      parking_charges: 0,
      created_at: new Date().toISOString(),
      ...customTrip,
    };

    setTrips((prev) => [newTrip, ...prev]);

    // Audible 4-note bell chime & haptic pulse
    playNewTripSound();

    // Trigger in-app notification banner & web push notification
    showToast(
      'New trip received',
      `Trip ${newTrip.trip_number} • ₹${newTrip.fare} • ${newTrip.pickup_location.split(',')[0]} → ${newTrip.drop_location.split(',')[0]}`,
      newTrip.status === 'ASSIGNED' ? 'trip_assigned' : 'trip_available',
      newTrip.id
    );

    return newTrip;
  };

    const acceptTrip = async (tripId: string): Promise<boolean> => {
    if (!isVerified) {
      showToast(
        "Verification Required",
        "Your documents are under review. You can accept trips once verified by Admin.",
        "system"
      );
      return false;
    }

    const curDriver = driverRef.current;
    if (!curDriver?.id) return false;

    setIsAcceptingIncoming(true);
    setUnavailableTripError(null);

    try {
      const result = await acceptTripInSupabase(tripId, curDriver.id);

      if (result.success) {
        setTrips((prev) =>
          prev.map((t) => {
            if (t.id === tripId) {
              return { ...t, status: "ON_THE_WAY", assigned_driver_id: curDriver.id };
            }
            return t;
          })
        );

        tripQueueRef.current = [];
        setIncomingAlertTrip(null);
        setIsAcceptingIncoming(false);

        // 🚕 Uber-style Trip Accepted Notification
        triggerPushNotification(
          "✅ Trip Accepted",
          "Your trip details are ready."
        );

        showToast(
          "Trip Accepted",
          "You are now on the way to pickup location.",
          "trip_assigned",
          tripId
        );
        return true;
      } else if (result.reason === "ALREADY_TAKEN") {
        setIsAcceptingIncoming(false);
        setUnavailableTripError("Trip no longer available");
        showToast(
          "Trip no longer available",
          "Another driver has accepted this trip.",
          "system"
        );
        setTimeout(() => {
          showNextQueuedTrip();
        }, 1500);
        return false;
      } else {
        setIsAcceptingIncoming(false);
        setUnavailableTripError("Unable to accept trip. Please try again.");
        setTimeout(() => {
          showNextQueuedTrip();
        }, 1500);
        return false;
      }
    } catch (err) {
      setIsAcceptingIncoming(false);
      console.warn("acceptTrip error:", err);
      return false;
    }
  };

    const rejectTrip = (tripId: string, reason?: "EXPIRED" | "DECLINED") => {
    const curDriver = driverRef.current;
    if (curDriver?.id) {
      declineTripInSupabase(tripId, curDriver.id).catch(() => {});
    }

    notifiedTripIdsRef.current.add(tripId);

    if (reason === "EXPIRED") {
      showToast(
        "Trip Request Expired",
        "The trip request timed out and was returned to pool.",
        "system"
      );
    } else {
      showToast(
        "Trip Declined",
        "Continuing to search for other eligible trips...",
        "system"
      );
    }

    showNextQueuedTrip();
  };

  const advanceTripStatus = (
    tripId: string,
    nextStatus: TripStatus,
    extraData?: {
      extra_km?: number;
      extra_km_charges?: number;
      toll_charges?: number;
      parking_charges?: number;
      total_fare?: number;
    }
  ) => {
    let completedTrip: Trip | null = null;

    setTrips((prev) =>
      prev.map((t) => {
        if (t.id === tripId) {
          const updated: Trip = {
            ...t,
            status: nextStatus,
            ...(extraData || {}),
            completed_at: nextStatus === 'COMPLETED' ? new Date().toISOString() : t.completed_at,
          };
          if (nextStatus === 'COMPLETED') {
            completedTrip = updated;
          }
          return updated;
        }
        return t;
      })
    );

    // Sync status change to Supabase
    updateTripStatusInSupabase(tripId, nextStatus, extraData).catch((e) =>
      console.warn('Supabase advanceTripStatus sync error:', e)
    );

    if (nextStatus === 'ARRIVED') {
      showToast('Arrived at Pickup', 'Customer has been notified of your arrival.', 'trip_assigned', tripId);
    } else if (nextStatus === 'STARTED') {
      showToast('Trip Started', 'Navigate safely to drop location.', 'trip_assigned', tripId);
    } else if (nextStatus === 'COMPLETED') {
      const trip = trips.find((t) => t.id === tripId);
      if (trip) {
        const finalEarnedFare = extraData?.total_fare ?? trip.fare;
        const compTrip: Trip = {
          ...trip,
          ...(extraData || {}),
          status: 'COMPLETED',
          fare: finalEarnedFare,
          total_fare: finalEarnedFare,
          completed_at: new Date().toISOString(),
        };
        setCompletedTripForModal(compTrip);
        // Immediately record in dynamic wallet for 0ms UI reflection
        recordCompletedTrip(compTrip);
        refreshWallet().catch(() => {});
        showToast('Trip Completed', `Trip ${trip.trip_number} completed: ₹${finalEarnedFare.toLocaleString('en-IN')}`, 'trip_completed', tripId);
      }
    }
  };

  const resetDemoData = () => {
    fetchTripsFromSupabase().then((liveTrips) => {
      setTrips(liveTrips || []);
    });
    setSelectedTripForDetails(null);
    setCompletedTripForModal(null);
    setIncomingAlertTrip(null);
    showToast('Trips Refreshed', 'Synced live trips from Supabase database.', 'system');
  };

  return (
    <TripContext.Provider
      value={{
        trips,
        activeTrip,
        activeTrips,
        selectedTripForDetails,
        completedTripForModal,
        incomingAlertTrip,
        isAcceptingIncoming,
        unavailableTripError,
        availableTrips,
        requestedTrips,
        assignedTrips,
        completedTrips,
        requestTrip,
        simulateAdminAssignment,
        createNewTrip,
        acceptTrip,
        rejectTrip,
        advanceTripStatus,
        setSelectedTripForDetails,
        setCompletedTripForModal,
        setIncomingAlertTrip,
        resetDemoData,
      }}
    >
      {children}
    </TripContext.Provider>
  );
};

export const useTrips = () => {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrips must be used within a TripProvider');
  }
  return context;
};
