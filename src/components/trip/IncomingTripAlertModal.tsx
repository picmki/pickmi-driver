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
        <View style={styles.modalCard}>
          {/* Top Progress Countdown Bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
          </View>

          {/* Header with Live Badge, Timer & Fare */}
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>NEW RIDE REQUEST</Text>
              </View>
              <View style={styles.timerBadge}>
                <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
                <Text style={styles.timerText}>{timeLeft}s</Text>
              </View>
            </View>

            {/* Compact Fare Display */}
            <View style={styles.fareContainer}>
              <Text style={styles.fareSymbol}>₹</Text>
              <Text style={styles.fareAmount}>{trip.fare}</Text>
              <View style={styles.vehiclePill}>
                <Text style={styles.vehicleText}>{trip.vehicle_type || 'Sedan'}</Text>
              </View>
            </View>
            <Text style={styles.tripTypeSubtext}>
              {trip.trip_type || 'One-way'} • {trip.distance || '12 km'}
            </Text>
          </View>

          {/* Route Section (Compact Pickup & Drop) */}
          <View style={styles.routeBox}>
            <View style={styles.routeItem}>
              <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.routeLabel}>PICKUP</Text>
                <Text style={styles.routeAddress} numberOfLines={1}>
                  {trip.pickup_location}
                </Text>
              </View>
            </View>

            <View style={styles.routeLine} />

            <View style={styles.routeItem}>
              <View style={[styles.routeDot, { backgroundColor: Colors.danger }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.routeLabel}>DROP</Text>
                <Text style={styles.routeAddress} numberOfLines={1}>
                  {trip.drop_location}
                </Text>
              </View>
            </View>
          </View>

          {/* Breakdown & Cash to Collect Banner */}
          <View style={styles.breakdownContainer}>
            {/* Cash to Collect Card */}
            <View style={styles.cashCollectCard}>
              <View style={styles.cashCollectLeft}>
                <Ionicons name="cash" size={15} color={Colors.successDark} />
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

            {/* Distance & Km Limit Card */}
            <DistanceAndKmLimitCard
              distance={trip.distance || '38.5 km'}
              allowedKm={trip.allowed_km || 45}
              extraKmRate={trip.extra_km_rate || 14}
              showExtraRateBanner={false}
              theme="white"
            />
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
              style={[styles.acceptButton, Shadows.sm]}
              onPress={() => onAccept(trip.id)}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
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
    backgroundColor: 'rgba(8, 12, 20, 0.65)',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 24,
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.success,
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
    marginRight: 5,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.5,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
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
    gap: 3,
  },
  fareSymbol: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.successDark,
  },
  fareAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  vehiclePill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  vehicleText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  tripTypeSubtext: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  routeBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routeLine: {
    width: 2,
    height: 10,
    backgroundColor: '#CBD5E1',
    marginLeft: 3,
    marginVertical: 1,
  },
  routeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginRight: 4,
  },
  routeAddress: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  declineButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  acceptButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  acceptText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  // Breakdown & Cash Collect styles
  breakdownContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cashCollectCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 6,
  },
  cashCollectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cashCollectLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.5,
  },
  cashCollectAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: '#047857',
  },
  feeTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 6,
  },
  feeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
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
    fontSize: 9.5,
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
});
