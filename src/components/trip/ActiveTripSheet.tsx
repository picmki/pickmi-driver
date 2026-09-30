import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Linking,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Trip, TripStatus } from '../../types/database';
import { Colors, Shadows } from '../../theme/colors';
import { PickMiButton } from '../common/PickMiButton';
import { FreeMapView } from '../map/FreeMapView';
import { DistanceAndKmLimitCard } from './DistanceAndKmLimitCard';

interface ActiveTripSheetProps {
  trip: Trip;
  onAccept: (tripId: string) => void;
  onReject: (tripId: string) => void;
  onAdvanceStatus: (
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
  onClose?: () => void;
}

type TripFlowPage = 'TRIP_PREVIEW' | 'ENTER_OTP' | 'IN_TRANSIT' | 'CLOSE_CHARGES' | 'BILL_SUMMARY';

export const ActiveTripSheet: React.FC<ActiveTripSheetProps> = ({
  trip,
  onAccept,
  onReject,
  onAdvanceStatus,
  onClose,
}) => {
  // Determine initial page based on trip status
  const getInitialPage = (): TripFlowPage => {
    if (trip.status === 'STARTED') {
      return 'IN_TRANSIT';
    }
    return 'TRIP_PREVIEW';
  };

  const [currentPage, setCurrentPage] = useState<TripFlowPage>(getInitialPage());

  // Keep synced if trip status changes externally
  useEffect(() => {
    if (trip.status === 'STARTED' && (currentPage === 'TRIP_PREVIEW' || currentPage === 'ENTER_OTP')) {
      setCurrentPage('IN_TRANSIT');
    }
  }, [trip.status]);

  // OTP State
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const otpInputRef = useRef<TextInput>(null);
  const expectedOtp = trip.otp || '4821';

  // Settlement Inputs
  const [extraKmInput, setExtraKmInput] = useState('0');
  const [tollInput, setTollInput] = useState('0');
  const [parkingInput, setParkingInput] = useState('0');

  // Fare calculations
  const extraKm = Math.max(0, parseFloat(extraKmInput) || 0);
  const extraKmRate = trip.extra_km_rate || 14;
  const extraKmCharges = Math.round(extraKm * extraKmRate);
  const tollCharges = Math.max(0, parseFloat(tollInput) || 0);
  const parkingCharges = Math.max(0, parseFloat(parkingInput) || 0);
  const baseCash = trip.cash_to_collect !== undefined && trip.cash_to_collect !== null ? Number(trip.cash_to_collect) : trip.fare;
  const finalTotalFare = baseCash + extraKmCharges + tollCharges + parkingCharges;

  const handleCallCustomer = () => {
    Alert.alert('Calling Customer', `Dialing ${trip.customer_phone} (${trip.customer_name})`);
  };

  const handleSosEmergency = () => {
    Alert.alert(
      'PickMi Safety Support',
      'Contact PickMi 24/7 Driver Safety Response Team?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Connect Police (112)', style: 'destructive' },
        { text: 'PickMi Safety Line', onPress: () => Alert.alert('Safety', 'Dispatch alerted.') },
      ]
    );
  };

  const openInGoogleMaps = (locationName: string, lat?: number, lng?: number) => {
    let url = '';
    if (lat && lng) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(locationName)}`;
    }
    Linking.openURL(url).catch((err) => {
      console.warn('Could not launch maps URL:', err);
    });
  };

  // OTP Verification
  const handleVerifyOtp = () => {
    if (!enteredOtp || enteredOtp.trim().length !== 4) {
      setOtpError('Please enter a 4-digit verification code.');
      return;
    }
    if (enteredOtp.trim() !== expectedOtp) {
      setOtpError('Incorrect OTP. Please ask the customer for the 4-digit PIN shown on their PickMi app.');
      return;
    }

    setOtpError('');
    setEnteredOtp('');
    onAdvanceStatus(trip.id, 'STARTED');
    setCurrentPage('IN_TRANSIT');
  };

  // Final Trip Complete and Cash Collection
  const handleCompleteAndClose = () => {
    onAdvanceStatus(trip.id, 'COMPLETED', {
      extra_km: extraKm,
      extra_km_charges: extraKmCharges,
      toll_charges: tollCharges,
      parking_charges: parkingCharges,
      total_fare: finalTotalFare,
    });
    if (onClose) {
      onClose();
    }
  };

  // ==============================================================
  // STEP 1: TRIP PREVIEW & BASIC DETAILS (VIEW CLICKED FROM HOME)
  // ==============================================================
  if (currentPage === 'TRIP_PREVIEW') {
    return (
      <View style={styles.fullScreenPage}>
        {/* Top Map Display (Full-screen width at top) */}
        <View style={styles.mapArea}>
          <FreeMapView
            pickupCoords={{ latitude: trip.pickup_latitude, longitude: trip.pickup_longitude }}
            dropCoords={{ latitude: trip.drop_latitude, longitude: trip.drop_longitude }}
            pickupLabel={trip.pickup_location}
            dropLabel={trip.drop_location}
            style={styles.map}
          />

          {/* Back Arrow Button (LEFT SIDE) */}
          {onClose && (
            <TouchableOpacity
              style={[styles.backArrowMapButton, Shadows.md]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          )}

          {/* SOS Emergency button (RIGHT SIDE) */}
          <TouchableOpacity
            style={[styles.sosButton, Shadows.md]}
            onPress={handleSosEmergency}
            activeOpacity={0.8}
          >
            <Ionicons name="shield-checkmark" size={17} color={Colors.white} />
            <Text style={styles.sosText}>SOS</Text>
          </TouchableOpacity>

          {/* Google Maps floating shortcut (BOTTOM RIGHT) */}
          <TouchableOpacity
            style={[styles.gmapsFloatButton, Shadows.md]}
            onPress={() => {
              openInGoogleMaps(trip.pickup_location, trip.pickup_latitude, trip.pickup_longitude);
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="navigate-circle" size={18} color={Colors.white} />
            <Text style={styles.gmapsFloatText}>Navigate Pickup</Text>
          </TouchableOpacity>
        </View>

        {/* Sheet Content (Customer Details & Route underneath) */}
        <ScrollView
          style={styles.sheetContent}
          contentContainerStyle={styles.sheetScroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Status Header */}
          <View style={styles.statusHeader}>
            <View>
              <Text style={styles.tripId}>{trip.trip_number}</Text>
              <Text style={styles.statusTitle}>Trip Assigned</Text>
            </View>
            <View style={styles.fareTag}>
              <Text style={styles.fareTagText}>₹{trip.fare.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          {/* Notice Banner */}
          <View style={styles.startPromptBox}>
            <Ionicons name="information-circle" size={18} color={Colors.primary} />
            <Text style={styles.startPromptText}>
              Ready for pickup. When customer boards, tap Start Trip to verify customer OTP.
            </Text>
          </View>

          {/* Customer Information Card */}
          <View style={[styles.infoCard, Shadows.sm, { marginTop: 12 }]}>
            <View style={styles.customerRow}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={20} color={Colors.primary} />
              </View>
              <View style={styles.customerMeta}>
                <Text style={styles.customerName}>{trip.customer_name}</Text>
                <Text style={styles.customerPhone}>{trip.customer_phone}</Text>
              </View>
              <TouchableOpacity
                style={styles.callButton}
                onPress={handleCallCustomer}
                activeOpacity={0.8}
              >
                <Ionicons name="call" size={18} color={Colors.primary} />
                <Text style={styles.callButtonText}>Call</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Route Card: Pickup and Drop Locations */}
          <View style={[styles.infoCard, Shadows.sm]}>
            <Text style={styles.cardSectionTitle}>ROUTE DETAILS</Text>

            <View style={styles.routeRow}>
              <View style={styles.routeTimeline}>
                <View style={[styles.routeDot, styles.dotPickup]} />
                <View style={styles.routeLine} />
                <View style={[styles.routeDot, styles.dotDrop]} />
              </View>

              <View style={styles.routeAddresses}>
                <View style={styles.addressBlock}>
                  <Text style={styles.addressLabel}>PICKUP LOCATION</Text>
                  <Text style={[styles.addressText, { fontWeight: '700' }]} numberOfLines={2}>
                    {trip.pickup_location}
                  </Text>
                </View>

                <View style={[styles.addressBlock, { marginTop: 14 }]}>
                  <Text style={styles.addressLabel}>DESTINATION DROP</Text>
                  <Text style={[styles.addressText, { fontWeight: '700' }]} numberOfLines={2}>
                    {trip.drop_location}
                  </Text>
                </View>
              </View>
            </View>

            {/* Metrics: Distance, Duration, Fare */}
            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Ionicons name="speedometer-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.metricText}>{trip.distance || '14.5 km'}</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.metricText}>~35 mins</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Ionicons name="cash-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.metricText}>Cash on Drop</Text>
              </View>
            </View>
          </View>

          {/* Distance & Allowed KM Limit Card (Exact Admin Layout) */}
          <View style={[styles.infoCard, Shadows.sm, { marginTop: 12 }]}>
            <DistanceAndKmLimitCard
              distance={trip.distance || '38.5 km'}
              allowedKm={trip.allowed_km || 45}
              extraKmRate={trip.extra_km_rate || 14}
              showExtraRateBanner={true}
              theme="white"
            />
          </View>
        </ScrollView>

        {/* Primary Call To Action Button: Start Trip */}
        <View style={[styles.actionFooter, Shadows.bottomSheet]}>
          <PickMiButton
            title="Start Trip"
            onPress={() => setCurrentPage('ENTER_OTP')}
            variant="success"
            size="lg"
            leftIcon={<Ionicons name="play" size={22} color={Colors.white} />}
          />
        </View>
      </View>
    );
  }

  // ==============================================================
  // STEP 2: ENTER CUSTOMER OTP
  // ==============================================================
  if (currentPage === 'ENTER_OTP') {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.fullScreenPage}
      >
        {/* Top Header */}
        <View style={styles.pageHeader}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => setCurrentPage('TRIP_PREVIEW')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.pageTitle}>Start Trip Verification</Text>
            <Text style={styles.pageSubtitle}>{trip.trip_number} • Customer Boarded</Text>
          </View>
          <View style={styles.fareTagSmall}>
            <Text style={styles.fareTagSmallText}>₹{trip.fare}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.pageBody}
          contentContainerStyle={styles.pageScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Customer Summary Card */}
          <View style={[styles.cardBlock, Shadows.sm]}>
            <View style={styles.customerHeaderRow}>
              <View style={styles.customerAvatarCircle}>
                <Ionicons name="person" size={24} color={Colors.primary} />
              </View>
              <View style={styles.customerDetails}>
                <Text style={styles.customerName}>{trip.customer_name}</Text>
                <Text style={styles.customerPhone}>{trip.customer_phone}</Text>
              </View>
              <TouchableOpacity
                style={styles.callIconBtn}
                onPress={handleCallCustomer}
                activeOpacity={0.8}
              >
                <Ionicons name="call" size={18} color={Colors.primary} />
                <Text style={styles.callBtnText}>Call</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.innerDivider} />

            <View style={styles.locationPillRow}>
              <Ionicons name="pin" size={16} color={Colors.successDark} />
              <View style={{ flex: 1 }}>
                <Text style={styles.locationMicroLabel}>PICKUP LOCATION</Text>
                <Text style={styles.locationTextBold} numberOfLines={2}>
                  {trip.pickup_location}
                </Text>
              </View>
            </View>
          </View>

          {/* OTP Input Card */}
          <View style={[styles.cardBlock, Shadows.sm, { marginTop: 16 }]}>
            <View style={styles.otpHeader}>
              <View style={styles.otpIconBadge}>
                <Ionicons name="keypad" size={28} color={Colors.primary} />
              </View>
              <Text style={styles.otpCardTitle}>Enter Customer Ride OTP</Text>
              <Text style={styles.otpCardSubtitle}>
                Ask {trip.customer_name} for the 4-digit ride verification code shown on their PickMi app.
              </Text>
            </View>

            {/* Visual 4-Digit Boxes */}
            <TouchableOpacity
              style={styles.otpBoxesRow}
              activeOpacity={1}
              onPress={() => otpInputRef.current?.focus()}
            >
              {[0, 1, 2, 3].map((idx) => {
                const digit = enteredOtp[idx] || '';
                const isCurrent = enteredOtp.length === idx;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.otpBox,
                      digit ? styles.otpBoxFilled : null,
                      isCurrent ? styles.otpBoxCurrent : null,
                    ]}
                  >
                    <Text style={styles.otpDigitText}>{digit || ''}</Text>
                  </View>
                );
              })}
            </TouchableOpacity>

            {/* Hidden Input for reliable cross-platform typing */}
            <TextInput
              ref={otpInputRef}
              value={enteredOtp}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9]/g, '').slice(0, 4);
                setEnteredOtp(cleaned);
                if (otpError) setOtpError('');
              }}
              keyboardType="number-pad"
              maxLength={4}
              style={styles.hiddenOtpInput}
              autoFocus={true}
            />

            {/* Error Message */}
            {otpError ? (
              <View style={styles.otpErrorRow}>
                <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                <Text style={styles.otpErrorText}>{otpError}</Text>
              </View>
            ) : null}

            {/* Security Note */}
            <View style={styles.otpSecurityNote}>
              <Ionicons name="shield-checkmark" size={15} color={Colors.successDark} />
              <Text style={styles.otpSecurityText}>
                OTP verification guarantees safety insurance coverage for this ride.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Action Button: Verify OTP & Begin */}
        <View style={[styles.pageFooter, Shadows.bottomSheet]}>
          <PickMiButton
            title="Verify OTP & Start Trip"
            onPress={handleVerifyOtp}
            variant="success"
            size="lg"
            leftIcon={<Ionicons name="checkmark-circle" size={20} color={Colors.white} />}
          />
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ==============================================================
  // STEP 3: TRIP IN PROGRESS / TRANSIT DETAILS
  // ==============================================================
  if (currentPage === 'IN_TRANSIT') {
    return (
      <View style={styles.fullScreenPage}>
        {/* Top Map Display */}
        <View style={styles.mapArea}>
          <FreeMapView
            pickupCoords={{ latitude: trip.pickup_latitude, longitude: trip.pickup_longitude }}
            dropCoords={{ latitude: trip.drop_latitude, longitude: trip.drop_longitude }}
            pickupLabel={trip.pickup_location}
            dropLabel={trip.drop_location}
            style={styles.map}
          />

          {/* Back Arrow Button (LEFT SIDE) */}
          {onClose && (
            <TouchableOpacity
              style={[styles.backArrowMapButton, Shadows.md]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          )}

          {/* SOS Emergency button (RIGHT SIDE) */}
          <TouchableOpacity
            style={[styles.sosButton, Shadows.md]}
            onPress={handleSosEmergency}
            activeOpacity={0.8}
          >
            <Ionicons name="shield-checkmark" size={17} color={Colors.white} />
            <Text style={styles.sosText}>SOS</Text>
          </TouchableOpacity>

          {/* Google Maps floating shortcut (BOTTOM RIGHT) */}
          <TouchableOpacity
            style={[styles.gmapsFloatButton, Shadows.md]}
            onPress={() => {
              openInGoogleMaps(trip.drop_location, trip.drop_latitude, trip.drop_longitude);
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="navigate-circle" size={18} color={Colors.white} />
            <Text style={styles.gmapsFloatText}>Navigate Drop</Text>
          </TouchableOpacity>
        </View>

        {/* Sheet Content */}
        <ScrollView
          style={styles.sheetContent}
          contentContainerStyle={styles.sheetScroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Status Header */}
          <View style={styles.statusHeader}>
            <View>
              <Text style={styles.tripId}>{trip.trip_number}</Text>
              <Text style={styles.statusTitle}>Trip Started (In Transit)</Text>
            </View>
            <View style={styles.fareTag}>
              <Text style={styles.fareTagText}>₹{trip.fare.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          {/* Active Status Banner */}
          <View style={styles.inTransitBanner}>
            <View style={styles.pulseLiveDot} />
            <Text style={styles.inTransitBannerText}>
              Driving towards drop location. Customer OTP verified.
            </Text>
          </View>

          {/* Customer Info Card */}
          <View style={[styles.infoCard, Shadows.sm]}>
            <View style={styles.customerRow}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={20} color={Colors.primary} />
              </View>
              <View style={styles.customerMeta}>
                <Text style={styles.customerName}>{trip.customer_name}</Text>
                <Text style={styles.customerPhone}>{trip.customer_phone}</Text>
              </View>
              <TouchableOpacity
                style={styles.callButton}
                onPress={handleCallCustomer}
                activeOpacity={0.8}
              >
                <Ionicons name="call" size={18} color={Colors.primary} />
                <Text style={styles.callButtonText}>Call</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Route Card */}
          <View style={[styles.infoCard, Shadows.sm]}>
            <Text style={styles.cardSectionTitle}>ROUTE DETAILS</Text>

            <View style={styles.routeRow}>
              <View style={styles.routeTimeline}>
                <View style={[styles.routeDot, styles.dotPickup]} />
                <View style={styles.routeLine} />
                <View style={[styles.routeDot, styles.dotDrop]} />
              </View>

              <View style={styles.routeAddresses}>
                <View style={styles.addressBlock}>
                  <Text style={styles.addressLabel}>PICKUP</Text>
                  <Text style={styles.addressText} numberOfLines={2}>
                    {trip.pickup_location}
                  </Text>
                </View>

                <View style={[styles.addressBlock, { marginTop: 14 }]}>
                  <Text style={styles.addressLabel}>DESTINATION DROP</Text>
                  <Text style={[styles.addressText, { fontWeight: '700' }]} numberOfLines={2}>
                    {trip.drop_location}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Ionicons name="speedometer-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.metricText}>{trip.distance || '14.5 km'}</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.metricText}>~35 mins</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Ionicons name="cash-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.metricText}>Cash on Drop</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Action Footer: Prominent Close Trip Button */}
        <View style={[styles.actionFooter, Shadows.bottomSheet]}>
          <PickMiButton
            title="Close Trip"
            onPress={() => setCurrentPage('CLOSE_CHARGES')}
            variant="danger"
            size="lg"
            leftIcon={<Ionicons name="checkmark-done-circle" size={22} color={Colors.white} />}
          />
        </View>
      </View>
    );
  }

  // ==============================================================
  // STEP 4: ENTER EXTRA CHARGES (KM, TOLL, PARKING)
  // ==============================================================
  if (currentPage === 'CLOSE_CHARGES') {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.fullScreenPage}
      >
        {/* Header */}
        <View style={styles.pageHeader}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => setCurrentPage('IN_TRANSIT')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.pageTitle}>Close Trip Details</Text>
            <Text style={styles.pageSubtitle}>Enter additional journey expenses</Text>
          </View>
          <View style={styles.tripPill}>
            <Text style={styles.tripPillText}>{trip.trip_number}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.pageBody}
          contentContainerStyle={styles.pageScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Instructions Banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={20} color={Colors.primary} />
            <Text style={styles.infoBannerText}>
              Add any extra kilometers, toll plaza fees, or parking costs before finalizing the customer bill.
            </Text>
          </View>

          {/* Distance & Allowed KM Limit Reference Card */}
          <View style={[styles.chargeCard, Shadows.sm, { marginBottom: 14 }]}>
            <DistanceAndKmLimitCard
              distance={trip.distance || '38.5 km'}
              allowedKm={trip.allowed_km || 45}
              extraKmRate={trip.extra_km_rate || 14}
              showExtraRateBanner={true}
              theme="white"
            />
          </View>

          {/* 1. Extra Kilometers Input */}
          <View style={[styles.chargeCard, Shadows.sm]}>
            <View style={styles.chargeCardHeader}>
              <View style={[styles.chargeIconCircle, { backgroundColor: Colors.primaryLight }]}>
                <Ionicons name="speedometer" size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.chargeTitle}>Extra Distance</Text>
                <Text style={styles.chargeRateSubtitle}>Rate: ₹{extraKmRate}/km extra</Text>
              </View>
              {extraKm > 0 && (
                <View style={styles.chargeCalcBadge}>
                  <Text style={styles.chargeCalcText}>+₹{extraKmCharges}</Text>
                </View>
              )}
            </View>

            <View style={styles.inputSteppingRow}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => {
                  const val = Math.max(0, extraKm - 1);
                  setExtraKmInput(String(val));
                }}
              >
                <Ionicons name="remove" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>

              <View style={styles.inputFieldWrapper}>
                <TextInput
                  value={extraKmInput}
                  onChangeText={(val) => setExtraKmInput(val.replace(/[^0-9.]/g, ''))}
                  keyboardType="numeric"
                  style={styles.chargeNumberInput}
                  placeholder="0"
                />
                <Text style={styles.unitText}>km</Text>
              </View>

              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => {
                  const val = extraKm + 1;
                  setExtraKmInput(String(val));
                }}
              >
                <Ionicons name="add" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. Toll Plaza Amount Input */}
          <View style={[styles.chargeCard, Shadows.sm, { marginTop: 14 }]}>
            <View style={styles.chargeCardHeader}>
              <View style={[styles.chargeIconCircle, { backgroundColor: '#FFF4E5' }]}>
                <Ionicons name="car" size={20} color={Colors.warningDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.chargeTitle}>Toll Amount</Text>
                <Text style={styles.chargeRateSubtitle}>Fastag / Highway toll receipts</Text>
              </View>
            </View>

            <View style={styles.singleInputField}>
              <Text style={styles.rupeePrefix}>₹</Text>
              <TextInput
                value={tollInput}
                onChangeText={(val) => setTollInput(val.replace(/[^0-9.]/g, ''))}
                keyboardType="numeric"
                style={styles.fullAmountInput}
                placeholder="0"
              />
            </View>
          </View>

          {/* 3. Parking Amount Input */}
          <View style={[styles.chargeCard, Shadows.sm, { marginTop: 14 }]}>
            <View style={styles.chargeCardHeader}>
              <View style={[styles.chargeIconCircle, { backgroundColor: '#F0EFFF' }]}>
                <Ionicons name="business" size={20} color="#5856D6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.chargeTitle}>Parking Amount</Text>
                <Text style={styles.chargeRateSubtitle}>Airport, station, or mall parking</Text>
              </View>
            </View>

            <View style={styles.singleInputField}>
              <Text style={styles.rupeePrefix}>₹</Text>
              <TextInput
                value={parkingInput}
                onChangeText={(val) => setParkingInput(val.replace(/[^0-9.]/g, ''))}
                keyboardType="numeric"
                style={styles.fullAmountInput}
                placeholder="0"
              />
            </View>
          </View>

          {/* Live Bill Total Preview Card */}
          <View style={[styles.livePreviewCard, Shadows.sm]}>
            <View style={styles.livePreviewRow}>
              <Text style={styles.livePreviewLabel}>Base Cash to Collect</Text>
              <Text style={styles.livePreviewVal}>₹{baseCash}</Text>
            </View>
            {extraKmCharges > 0 && (
              <View style={styles.livePreviewRow}>
                <Text style={styles.livePreviewLabel}>Extra Distance ({extraKm} km × ₹{extraKmRate})</Text>
                <Text style={[styles.livePreviewVal, { color: Colors.primary, fontWeight: '700' }]}>+₹{extraKmCharges}</Text>
              </View>
            )}
            {tollCharges > 0 && (
              <View style={styles.livePreviewRow}>
                <Text style={styles.livePreviewLabel}>Toll Charges</Text>
                <Text style={styles.livePreviewVal}>+₹{tollCharges}</Text>
              </View>
            )}
            {parkingCharges > 0 && (
              <View style={styles.livePreviewRow}>
                <Text style={styles.livePreviewLabel}>Parking Charges</Text>
                <Text style={styles.livePreviewVal}>+₹{parkingCharges}</Text>
              </View>
            )}
            <View style={styles.previewDivider} />
            <View style={styles.livePreviewTotalRow}>
              <Text style={styles.livePreviewTotalLabel}>Final Cash to Collect</Text>
              <Text style={[styles.livePreviewTotalVal, { color: Colors.successDark }]}>₹{finalTotalFare}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Action Button: Generate Bill */}
        <View style={[styles.pageFooter, Shadows.bottomSheet]}>
          <PickMiButton
            title="Generate Customer Bill"
            onPress={() => setCurrentPage('BILL_SUMMARY')}
            variant="primary"
            size="lg"
            rightIcon={<Ionicons name="arrow-forward" size={20} color={Colors.white} />}
          />
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ==============================================================
  // STEP 5: FULL-SCREEN BILL SUMMARY PAGE (NOT A POPUP!)
  // ==============================================================
  return (
    <View style={styles.fullScreenPage}>
      {/* Top Header */}
      <View style={styles.pageHeader}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => setCurrentPage('CLOSE_CHARGES')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.pageTitle}>Trip Bill Summary</Text>
          <Text style={styles.pageSubtitle}>{trip.trip_number} • Completed</Text>
        </View>
        <View style={styles.statusPillGreen}>
          <Ionicons name="checkmark-circle" size={14} color={Colors.successDark} />
          <Text style={styles.statusPillGreenText}>Ready</Text>
        </View>
      </View>

      <ScrollView
        style={styles.pageBody}
        contentContainerStyle={styles.pageScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Massive Cash Collection Banner */}
        <View style={[styles.cashCollectBanner, Shadows.md]}>
          <View style={styles.cashIconPulse}>
            <Ionicons name="cash" size={32} color={Colors.white} />
          </View>
          <Text style={styles.cashBannerSubtitle}>COLLECT CASH FROM CUSTOMER</Text>
          <Text style={styles.cashBannerAmount}>₹{finalTotalFare.toLocaleString('en-IN')}</Text>
          <View style={styles.cashPill}>
            <Ionicons name="information-circle" size={14} color={Colors.white} />
            <Text style={styles.cashPillText}>Collect exact cash before ending ride</Text>
          </View>
        </View>

        {/* Itemized Receipt Breakdown */}
        <View style={[styles.cardBlock, Shadows.sm, { marginTop: 16 }]}>
          <View style={styles.billHeaderRow}>
            <Ionicons name="receipt-outline" size={20} color={Colors.primary} />
            <Text style={styles.cardSectionTitle}>FARE BREAKDOWN</Text>
          </View>

          <View style={styles.billItemRow}>
            <Text style={styles.billItemLabel}>Base Cash to Collect</Text>
            <Text style={styles.billItemVal}>₹{baseCash.toLocaleString('en-IN')}</Text>
          </View>

          <View style={styles.billItemRow}>
            <Text style={styles.billItemLabel}>
              Extra Distance ({extraKm} km × ₹{extraKmRate}/km)
            </Text>
            <Text style={styles.billItemVal}>+₹{extraKmCharges.toLocaleString('en-IN')}</Text>
          </View>

          <View style={styles.billItemRow}>
            <Text style={styles.billItemLabel}>Toll Charges</Text>
            <Text style={styles.billItemVal}>₹{tollCharges.toLocaleString('en-IN')}</Text>
          </View>

          <View style={styles.billItemRow}>
            <Text style={styles.billItemLabel}>Parking Charges</Text>
            <Text style={styles.billItemVal}>₹{parkingCharges.toLocaleString('en-IN')}</Text>
          </View>

          <View style={styles.innerDivider} />

          <View style={styles.billTotalRow}>
            <View>
              <Text style={styles.billTotalLabel}>Total Cash Amount</Text>
              <Text style={styles.billPaymentMode}>Payment Mode: CASH</Text>
            </View>
            <Text style={styles.billTotalVal}>₹{finalTotalFare.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* Ride & Customer Details Recap */}
        <View style={[styles.cardBlock, Shadows.sm, { marginTop: 14 }]}>
          <Text style={styles.cardSectionTitle}>RIDE INFORMATION</Text>

          <View style={styles.infoDetailRow}>
            <Text style={styles.infoDetailLabel}>Customer Name:</Text>
            <Text style={styles.infoDetailValue}>{trip.customer_name}</Text>
          </View>

          <View style={styles.infoDetailRow}>
            <Text style={styles.infoDetailLabel}>Phone Number:</Text>
            <Text style={styles.infoDetailValue}>{trip.customer_phone}</Text>
          </View>

          <View style={styles.infoDetailRow}>
            <Text style={styles.infoDetailLabel}>Pickup Location:</Text>
            <Text style={styles.infoDetailValue} numberOfLines={1}>
              {trip.pickup_location}
            </Text>
          </View>

          <View style={styles.infoDetailRow}>
            <Text style={styles.infoDetailLabel}>Drop Location:</Text>
            <Text style={styles.infoDetailValue} numberOfLines={1}>
              {trip.drop_location}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Footer: Cash Collected and Close Trip */}
      <View style={[styles.pageFooter, Shadows.bottomSheet]}>
        <PickMiButton
          title="Cash Collected • Close Trip"
          onPress={handleCompleteAndClose}
          variant="success"
          size="lg"
          leftIcon={<Ionicons name="checkmark-circle" size={22} color={Colors.white} />}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenPage: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    paddingBottom: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleGroup: {
    flex: 1,
    marginLeft: 12,
  },
  pageTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  fareTagSmall: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  fareTagSmallText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  statusPillGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  statusPillGreenText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.successDark,
  },
  tripPill: {
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tripPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  pageBody: {
    flex: 1,
  },
  pageScrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  pageFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  previewMapContainer: {
    height: 220,
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  cardBlock: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  customerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerDetails: {
    flex: 1,
    marginLeft: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  customerPhone: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  callIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 4,
  },
  callBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  innerDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 12,
  },
  locationPillRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  locationMicroLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  locationTextBold: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 2,
    lineHeight: 18,
  },
  otpHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  otpIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  otpCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  otpCardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  otpHelperChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8FF',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 6,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  otpHelperText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B21A8',
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  otpBox: {
    width: 58,
    height: 64,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  otpBoxCurrent: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  otpDigitText: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  hiddenOtpInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  otpErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  otpErrorText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.danger,
  },
  otpSecurityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.successLight,
    padding: 10,
    borderRadius: 10,
  },
  otpSecurityText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.successDark,
  },
  startPromptBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  startPromptText: {
    flex: 1,
    fontSize: 12,
    color: Colors.primaryDark,
    lineHeight: 16,
    fontWeight: '600',
  },

  // Map & In Transit Styles
  mapArea: {
    height: 260,
    width: '100%',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  backArrowMapButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 16,
    left: 16,
    backgroundColor: Colors.white,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  sosButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 16,
    right: 16,
    backgroundColor: Colors.danger,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 4,
    zIndex: 10,
  },
  sosText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  gmapsFloatButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 5,
    zIndex: 10,
  },
  gmapsFloatText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  sheetContent: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  sheetScroll: {
    padding: 16,
    paddingBottom: 24,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripId: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  fareTag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  fareTagText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  inTransitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  pulseLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.successDark,
  },
  inTransitBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.successDark,
    flex: 1,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerMeta: {
    flex: 1,
    marginLeft: 12,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 4,
  },
  callButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  cardSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  routeRow: {
    flexDirection: 'row',
  },
  routeTimeline: {
    width: 20,
    alignItems: 'center',
    paddingVertical: 4,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotPickup: {
    backgroundColor: Colors.successDark,
  },
  dotDrop: {
    backgroundColor: Colors.danger,
  },
  routeLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  routeAddresses: {
    flex: 1,
    marginLeft: 10,
  },
  addressBlock: {
    minHeight: 38,
  },
  addressLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  addressText: {
    fontSize: 13,
    color: Colors.textPrimary,
    marginTop: 2,
    lineHeight: 18,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  metricDivider: {
    width: 1,
    height: 12,
    backgroundColor: Colors.border,
  },
  actionFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },

  // Close Charges Screen
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    padding: 12,
    borderRadius: 14,
    gap: 10,
    marginBottom: 16,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: Colors.primaryDark,
    lineHeight: 17,
    fontWeight: '600',
  },
  chargeCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  chargeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chargeIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chargeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  chargeRateSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  chargeCalcBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chargeCalcText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  inputSteppingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    gap: 12,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputFieldWrapper: {
    flex: 1,
    height: 46,
    backgroundColor: Colors.background,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
  },
  chargeNumberInput: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    minWidth: 40,
  },
  unitText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  singleInputField: {
    height: 48,
    backgroundColor: Colors.background,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    marginTop: 12,
  },
  rupeePrefix: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginRight: 6,
  },
  fullAmountInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  livePreviewCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  livePreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  livePreviewLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  livePreviewVal: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  previewDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 10,
  },
  livePreviewTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  livePreviewTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  livePreviewTotalVal: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },

  // Bill Summary Page
  cashCollectBanner: {
    backgroundColor: '#0F172A',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
  },
  cashIconPulse: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cashBannerSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  cashBannerAmount: {
    fontSize: 38,
    fontWeight: '900',
    color: Colors.white,
    marginVertical: 8,
  },
  cashPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
  },
  cashPillText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
  },
  billHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  billItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  billItemLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  billItemVal: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  billTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
  },
  billTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  billPaymentMode: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.successDark,
    marginTop: 2,
  },
  billTotalVal: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.successDark,
  },
  infoDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoDetailLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  infoDetailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    maxWidth: '65%',
    textAlign: 'right',
  },
});
