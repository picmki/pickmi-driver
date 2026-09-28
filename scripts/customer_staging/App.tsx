import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from './src/theme';
import { POPULAR_LOCATIONS } from './src/locations';
import {
  getLocalUser,
  saveLocalUser,
  clearLocalUser,
  fetchCustomerReservations,
  createReservationInBackend,
  cancelReservationInBackend,
  rateTripInBackend,
  subscribeToCustomerTrips,
} from './src/supabase';
import { HomeScreen } from './src/HomeScreen';
import { MyReservationsScreen } from './src/MyReservationsScreen';
import { TripHistoryScreen } from './src/TripHistoryScreen';
import { ProfileScreen } from './src/ProfileScreen';
import { WelcomeAuthModal } from './src/WelcomeAuthModal';
import { LocationPickerModal } from './src/LocationPickerModal';
import { DateTimePickerModal } from './src/DateTimePickerModal';
import { VehicleDetailsModal } from './src/VehicleDetailsModal';
import { ReservationReviewModal } from './src/ReservationReviewModal';
import { BookingConfirmedModal } from './src/BookingConfirmedModal';
import { TripDetailsModal } from './src/TripDetailsModal';
import { RateRideModal } from './src/RateRideModal';
import type {
  TabType,
  UserProfile,
  LocationItem,
  VehicleOption,
  Reservation,
} from './src/types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [user, setUser] = useState<UserProfile | null>(null);

  // Default Locations (Koramangala to Airport BLR Terminal 2)
  const [pickupLocation, setPickupLocation] = useState<LocationItem>(POPULAR_LOCATIONS[2]); // Koramangala
  const [dropLocation, setDropLocation] = useState<LocationItem>(POPULAR_LOCATIONS[1]); // Airport T2

  // Default Future Travel Schedule (Tomorrow 06:00 AM)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = `Tomorrow, ${tomorrow.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`;
  const [travelDate, setTravelDate] = useState<string>(defaultDateStr);
  const [travelTime, setTravelTime] = useState<string>('06:00 AM');

  // Reservations Data
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState<boolean>(false);

  // Modal Control States
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);
  const [locationPickerType, setLocationPickerType] = useState<'pickup' | 'drop' | null>(null);
  const [isDateTimePickerVisible, setIsDateTimePickerVisible] = useState(false);

  // Booking Flow States
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption | null>(null);
  const [calculatedFare, setCalculatedFare] = useState<number>(0);
  const [routeDistance, setRouteDistance] = useState<string>('42.5 km');
  const [isVehicleDetailsVisible, setIsVehicleDetailsVisible] = useState(false);
  const [isReservationReviewVisible, setIsReservationReviewVisible] = useState(false);
  const [confirmedReservation, setConfirmedReservation] = useState<Reservation | null>(null);

  // Inspection / Rating Modal States
  const [inspectingReservation, setInspectingReservation] = useState<Reservation | null>(null);
  const [ratingReservation, setRatingReservation] = useState<Reservation | null>(null);

  // 1. Initial Load of User & Reservations
  const loadData = useCallback(async () => {
    setIsLoadingReservations(true);
    try {
      const localUser = await getLocalUser();
      if (localUser) {
        setUser(localUser);
      } else {
        // Default guest profile
        const guest: UserProfile = {
          id: 'usr_guest',
          name: 'Priya Sharma',
          mobile: '+91 97410 88291',
          email: 'priya.sharma@example.com',
        };
        setUser(guest);
      }

      const activeMobile = localUser?.mobile || '+91 97410 88291';
      const fetched = await fetchCustomerReservations(activeMobile);
      setReservations(fetched);
    } finally {
      setIsLoadingReservations(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // 2. Realtime listener for trip updates (driver assignment, trip start OTP verification, completion)
    const unsubscribe = subscribeToCustomerTrips(() => {
      if (user?.mobile) {
        fetchCustomerReservations(user.mobile).then(setReservations).catch(() => {});
      }
    });

    return () => {
      unsubscribe();
    };
  }, [loadData, user?.mobile]);

  // Auth Handlers
  const handleLoginSuccess = async (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    await saveLocalUser(loggedInUser);
    setIsAuthModalVisible(false);
    const fetched = await fetchCustomerReservations(loggedInUser.mobile);
    setReservations(fetched);
  };

  const handleLogout = async () => {
    await clearLocalUser();
    setUser(null);
    setCurrentTab('home');
    setIsAuthModalVisible(true);
  };

  // Location Handlers
  const handleSelectLocation = (loc: LocationItem) => {
    if (locationPickerType === 'pickup') {
      setPickupLocation(loc);
    } else if (locationPickerType === 'drop') {
      setDropLocation(loc);
    }
    setLocationPickerType(null);
  };

  // Booking Flow Handlers
  const handleSelectVehicle = (vehicle: VehicleOption, fare: number, distance: string) => {
    setSelectedVehicle(vehicle);
    setCalculatedFare(fare);
    setRouteDistance(distance);
    setIsVehicleDetailsVisible(true);
  };

  const handleContinueToReview = () => {
    setIsVehicleDetailsVisible(false);
    setIsReservationReviewVisible(true);
  };

  const handleConfirmReservation = async (paymentMethod: string) => {
    if (!selectedVehicle) return;

    const newRes = await createReservationInBackend({
      customer_name: user?.name || 'Customer',
      customer_phone: user?.mobile || '+91 99000 88000',
      customer_email: user?.email,
      pickup_location: pickupLocation.title,
      pickup_latitude: pickupLocation.latitude,
      pickup_longitude: pickupLocation.longitude,
      drop_location: dropLocation.title,
      drop_latitude: dropLocation.latitude,
      drop_longitude: dropLocation.longitude,
      pickup_date: travelDate,
      pickup_time: travelTime,
      fare: calculatedFare,
      distance: routeDistance,
      vehicle_type: selectedVehicle.type,
      trip_type:
        pickupLocation.category === 'airport' || dropLocation.category === 'airport'
          ? 'Airport Transfer'
          : pickupLocation.category === 'outstation' || dropLocation.category === 'outstation'
          ? 'Outstation'
          : 'One-way',
      payment_method: paymentMethod,
    });

    setReservations((prev) => [newRes, ...prev]);
    setIsReservationReviewVisible(false);
    setConfirmedReservation(newRes);
  };

  const handleCancelReservation = async (tripId: string) => {
    await cancelReservationInBackend(tripId);
    setReservations((prev) =>
      prev.map((r) => (r.id === tripId ? { ...r, status: 'CANCELLED' as const } : r))
    );
  };

  const handleSubmitRating = async (tripId: string, rating: number, feedback?: string) => {
    await rateTripInBackend(tripId, rating, feedback);
    setReservations((prev) =>
      prev.map((r) => (r.id === tripId ? { ...r, rating, rating_feedback: feedback } : r))
    );
  };

  // Count active/upcoming reservations for badge
  const upcomingCount = reservations.filter(
    (r) => r.status === 'AVAILABLE' || r.status === 'ASSIGNED' || r.status === 'ARRIVED' || r.status === 'STARTED'
  ).length;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Main Tab Content */}
      <View style={styles.mainContainer}>
        {currentTab === 'home' && (
          <HomeScreen
            user={user}
            pickupLocation={pickupLocation}
            dropLocation={dropLocation}
            travelDate={travelDate}
            travelTime={travelTime}
            onOpenLocationPicker={(type) => setLocationPickerType(type)}
            onOpenDateTimePicker={() => setIsDateTimePickerVisible(true)}
            onSelectVehicle={handleSelectVehicle}
            onOpenAuth={() => setIsAuthModalVisible(true)}
          />
        )}

        {currentTab === 'reservations' && (
          <MyReservationsScreen
            reservations={reservations}
            isLoading={isLoadingReservations}
            onRefresh={loadData}
            onSelectReservation={(res) => setInspectingReservation(res)}
            onNavigateHome={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'history' && (
          <TripHistoryScreen
            reservations={reservations}
            onSelectTrip={(trip) => setInspectingReservation(trip)}
            onOpenRateModal={(trip) => setRatingReservation(trip)}
            onNavigateHome={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileScreen
            user={user}
            onOpenAuth={() => setIsAuthModalVisible(true)}
            onLogout={handleLogout}
            onNavigateTab={(tab) => setCurrentTab(tab)}
          />
        )}
      </View>

      {/* Modern Apple-style Bottom Navigation Bar */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setCurrentTab('home')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={currentTab === 'home' ? 'home' : 'home-outline'}
            size={22}
            color={currentTab === 'home' ? COLORS.primary : COLORS.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'home' && styles.tabLabelActive,
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setCurrentTab('reservations')}
          activeOpacity={0.7}
        >
          <View style={styles.tabIconBadgeWrap}>
            <Ionicons
              name={currentTab === 'reservations' ? 'calendar' : 'calendar-outline'}
              size={22}
              color={currentTab === 'reservations' ? COLORS.primary : COLORS.textMuted}
            />
            {upcomingCount > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{upcomingCount}</Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'reservations' && styles.tabLabelActive,
            ]}
          >
            Reservations
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setCurrentTab('history')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={currentTab === 'history' ? 'receipt' : 'receipt-outline'}
            size={22}
            color={currentTab === 'history' ? COLORS.primary : COLORS.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'history' && styles.tabLabelActive,
            ]}
          >
            History
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setCurrentTab('profile')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={currentTab === 'profile' ? 'person' : 'person-outline'}
            size={22}
            color={currentTab === 'profile' ? COLORS.primary : COLORS.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'profile' && styles.tabLabelActive,
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* ALL MODAL MANAGERS */}
      {/* 1. Welcome & Login/Signup Modal */}
      <WelcomeAuthModal
        visible={isAuthModalVisible}
        onLoginSuccess={handleLoginSuccess}
        onClose={() => setIsAuthModalVisible(false)}
      />

      {/* 2. Location Picker Modal */}
      <LocationPickerModal
        visible={locationPickerType !== null}
        type={locationPickerType || 'pickup'}
        currentValue={locationPickerType === 'pickup' ? pickupLocation.title : dropLocation.title}
        onSelectLocation={handleSelectLocation}
        onClose={() => setLocationPickerType(null)}
      />

      {/* 3. Date & Time Future Scheduler Modal */}
      <DateTimePickerModal
        visible={isDateTimePickerVisible}
        selectedDate={travelDate}
        selectedTime={travelTime}
        onConfirm={(date, time) => {
          setTravelDate(date);
          setTravelTime(time);
        }}
        onClose={() => setIsDateTimePickerVisible(false)}
      />

      {/* 4. Vehicle Details Modal */}
      <VehicleDetailsModal
        visible={isVehicleDetailsVisible}
        vehicle={selectedVehicle}
        fare={calculatedFare}
        pickupLocation={pickupLocation.title}
        dropLocation={dropLocation.title}
        travelDate={travelDate}
        travelTime={travelTime}
        onContinue={handleContinueToReview}
        onClose={() => setIsVehicleDetailsVisible(false)}
      />

      {/* 5. Reservation Review & Lock Modal */}
      <ReservationReviewModal
        visible={isReservationReviewVisible}
        vehicle={selectedVehicle}
        fare={calculatedFare}
        distance={routeDistance}
        pickupLocation={pickupLocation.title}
        dropLocation={dropLocation.title}
        travelDate={travelDate}
        travelTime={travelTime}
        user={user}
        onConfirmReservation={handleConfirmReservation}
        onClose={() => setIsReservationReviewVisible(false)}
      />

      {/* 6. Booking Confirmed Success Modal */}
      <BookingConfirmedModal
        visible={confirmedReservation !== null}
        reservation={confirmedReservation}
        onViewReservation={() => {
          setConfirmedReservation(null);
          setCurrentTab('reservations');
        }}
        onGoHome={() => {
          setConfirmedReservation(null);
          setCurrentTab('home');
        }}
      />

      {/* 7. Trip Details & Live OTP Modal */}
      <TripDetailsModal
        visible={inspectingReservation !== null}
        reservation={inspectingReservation}
        onCancelReservation={handleCancelReservation}
        onOpenRateModal={(res) => {
          setInspectingReservation(null);
          setRatingReservation(res);
        }}
        onClose={() => setInspectingReservation(null)}
      />

      {/* 8. Rate Ride Modal */}
      <RateRideModal
        visible={ratingReservation !== null}
        reservation={ratingReservation}
        onSubmitRating={handleSubmitRating}
        onClose={() => setRatingReservation(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  mainContainer: {
    flex: 1,
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 14 : 10,
    ...SHADOWS.md,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabIconBadgeWrap: {
    position: 'relative',
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.white,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
});
