import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Trip } from '../../types/database';
import { Colors, Shadows } from '../../theme/colors';
import { playNewTripSound } from '../../utils/soundEffects';
import { triggerPushNotification } from '../../utils/pushNotifications';
import { DistanceAndKmLimitCard } from './DistanceAndKmLimitCard';

const { width } = Dimensions.get('window');

interface IncomingTripAlertModalProps {
  trip: Trip | null;
  onAccept: (tripId: string) => void;
  onDecline: (tripId: string) => void;
}

export const IncomingTripAlertModal: React.FC<IncomingTripAlertModalProps> = ({
  trip,
  onAccept,
  onDecline,
}) => {
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (!trip) {
      setTimeLeft(30);
      return;
    }

    // Play chime sound and trigger OS push notification
    playNewTripSound();
    const pickupShort = (trip.pickup_location || 'Pickup').split(',')[0];
    const dropShort = (trip.drop_location || 'Drop').split(',')[0];
    triggerPushNotification(
      '🚨 New Ride Request Dispatched!',
      `Trip ${trip.trip_number} (₹${trip.fare}) • ${pickupShort} → ${dropShort}`,
      { tripId: trip.id, fare: trip.fare }
    );

    setTimeLeft(30);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDecline(trip.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [trip]);

  if (!trip) return null;

  const progressPercent = (timeLeft / 30) * 100;
  const pickupShort = (trip.pickup_location || 'Pickup').split(',')[0];
  const dropShort = (trip.drop_location || 'Drop').split(',')[0];

  return (
    <Modal visible={!!trip} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, Shadows.lg]}>
          {/* Explicit Top iOS / System Push Notification Alert Banner */}
          <View style={styles.pushNotificationCard}>
            <View style={styles.pushHeaderRow}>
              <View style={styles.appIconRow}>
                <View style={styles.appIconMini}>
                  <Ionicons name="car" size={13} color={Colors.white} />
                </View>
                <Text style={styles.appNameText}>PICKMI DRIVER PUSH</Text>
                <Text style={styles.nowBadgeText}>• NOW</Text>
              </View>
              <View style={styles.activeBellBadge}>
                <Ionicons name="notifications" size={13} color="#0043DC" />
              </View>
            </View>
            <Text style={styles.pushTitleText}>🚨 New Ride Request Dispatched!</Text>
            <Text style={styles.pushBodyText} numberOfLines={2}>
              Trip {trip.trip_number} • ₹{trip.fare} • {pickupShort} → {dropShort}
            </Text>
          </View>

          {/* Top Progress Countdown Bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>NEW RIDE REQUEST</Text>
              </View>
              <View style={styles.timerBadge}>
                <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.timerText}>{timeLeft}s</Text>
              </View>
            </View>

            {/* Big Fare Display */}
            <View style={styles.fareContainer}>
              <Text style={styles.fareSymbol}>₹</Text>
              <Text style={styles.fareAmount}>{trip.fare}</Text>
              <View style={styles.vehiclePill}>
                <Text style={styles.vehicleText}>{trip.vehicle_type || 'Sedan'}</Text>
              </View>
            </View>
            <Text style={styles.tripTypeSubtext}>
              {trip.trip_type || 'One-way'} • {trip.distance || '12 km'} • Cash to Driver
            </Text>
          </View>

          {/* Breakdown Badges & Cash to Collect Banner (User Requirement) */}
          <View style={styles.breakdownContainer}>
            {/* Cash to Collect Card */}
            <View style={styles.cashCollectCard}>
              <View style={styles.cashCollectLeft}>
                <Ionicons name="cash" size={16} color={Colors.successDark} />
                <Text style={styles.cashCollectLabel}>CASH TO COLLECT</Text>
              </View>
              <Text style={styles.cashCollectAmount}>₹{trip.cash_to_collect || trip.fare}</Text>
            </View>

            {/* Fee Inclusions / Exclusions Badges */}
            <View style={styles.feeTagsRow}>
              <View style={[styles.feeTag, trip.toll_included === 'INCLUDED' ? styles.feeTagIncluded : styles.feeTagExcluded]}>
                <Text style={[styles.feeTagText, trip.toll_included === 'INCLUDED' ? styles.feeTagTextIncluded : styles.feeTagTextExcluded]}>
                  Toll: {trip.toll_included || 'INCLUDED'}
                </Text>
              </View>

              <View style={[styles.feeTag, trip.permit_included === 'INCLUDED' ? styles.feeTagIncluded : styles.feeTagExcluded]}>
                <Text style={[styles.feeTagText, trip.permit_included === 'INCLUDED' ? styles.feeTagTextIncluded : styles.feeTagTextExcluded]}>
                  Permit: {trip.permit_included || 'EXCLUDED'}
                </Text>
              </View>

              <View style={[styles.feeTag, trip.batta_included === 'INCLUDED' ? styles.feeTagIncluded : styles.feeTagExcluded]}>
                <Text style={[styles.feeTagText, trip.batta_included === 'INCLUDED' ? styles.feeTagTextIncluded : styles.feeTagTextExcluded]}>
                  Batta: {trip.batta_included || 'INCLUDED'}
                </Text>
              </View>

              {trip.hill_charges_applicable === 'APPLICABLE' && (
                <View style={[styles.feeTag, styles.feeTagWarning]}>
                  <Text style={[styles.feeTagText, styles.feeTagTextWarning]}>
                    ⛰️ Hill Road
                  </Text>
                </View>
              )}
            </View>

            {/* Exact Admin Side-by-Side Pill: EST. DISTANCE & ALLOWED KM LIMIT */}
            <View style={{ marginTop: 8 }}>
              <DistanceAndKmLimitCard
                distance={trip.distance || '38.5 km'}
                allowedKm={trip.allowed_km || 45}
                extraKmRate={trip.extra_km_rate || 14}
                showExtraRateBanner={true}
                theme="light"
              />
            </View>
          </View>

          {/* Customer Summary */}
          <View style={styles.customerBox}>
            <View style={styles.customerAvatar}>
              <Ionicons name="person" size={18} color={Colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>{trip.customer_name || 'Passenger'}</Text>
              <Text style={styles.customerPhone}>{trip.customer_phone || '+91 98XXX XXXXX'}</Text>
            </View>
            <View style={styles.otpBox}>
              <Text style={styles.otpLabel}>START OTP</Text>
              <Text style={styles.otpValue}>{trip.otp || '4821'}</Text>
            </View>
          </View>

          {/* Route Section */}
          <View style={styles.routeBox}>
            {/* Pickup */}
            <View style={styles.routeItem}>
              <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.routeLabel}>PICKUP LOCATION</Text>
                <Text style={styles.routeAddress} numberOfLines={2}>
                  {trip.pickup_location}
                </Text>
              </View>
            </View>

            {/* Connecting Line */}
            <View style={styles.routeLine} />

            {/* Drop */}
            <View style={styles.routeItem}>
              <View style={[styles.routeDot, { backgroundColor: Colors.danger }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.routeLabel}>DROP DESTINATION</Text>
                <Text style={styles.routeAddress} numberOfLines={2}>
                  {trip.drop_location}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.declineButton}
              onPress={() => onDecline(trip.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.declineText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.acceptButton, Shadows.md]}
              onPress={() => onAccept(trip.id)}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle" size={22} color={Colors.white} />
              <Text style={styles.acceptText}>ACCEPT RIDE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 12, 20, 0.75)',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 24,
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
  },
  pushNotificationCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  pushHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  appIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appIconMini: {
    width: 20,
    height: 20,
    borderRadius: 5,
    backgroundColor: '#0043DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appNameText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  nowBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  activeBellBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 67, 220, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pushTitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  pushBodyText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
    lineHeight: 16,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.success,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    marginRight: 6,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.5,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  fareContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  fareSymbol: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.successDark,
  },
  fareAmount: {
    fontSize: 40,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  vehiclePill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  vehicleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  tripTypeSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  customerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  customerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  customerPhone: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  otpBox: {
    alignItems: 'flex-end',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  otpLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#065F46',
  },
  otpValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#065F46',
    fontFamily: 'monospace',
  },
  routeBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  routeLine: {
    width: 2,
    height: 18,
    backgroundColor: '#CBD5E1',
    marginLeft: 4,
    marginVertical: 2,
  },
  routeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  routeAddress: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  acceptButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  acceptText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  // Breakdown & Cash Collect styles
  breakdownContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cashCollectCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 8,
  },
  cashCollectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cashCollectLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.5,
  },
  cashCollectAmount: {
    fontSize: 17,
    fontWeight: '900',
    color: '#047857',
  },
  feeTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  feeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  feeTagIncluded: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  feeTagExcluded: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  feeTagWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  feeTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  feeTagTextIncluded: {
    color: '#1D4ED8',
  },
  feeTagTextExcluded: {
    color: '#64748B',
  },
  feeTagTextWarning: {
    color: '#B45309',
  },
  kmRuleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  kmRuleText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  kmRuleExtraText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
