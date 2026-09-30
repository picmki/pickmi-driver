import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Trip } from '../../types/database';
import { Colors, Shadows } from '../../theme/colors';
import { playNewTripSound } from '../../utils/soundEffects';
import { getTripRouteTitle } from '../../utils/routeFormatting';

const SERVER_COUNTDOWN_SECONDS = 20;

interface IncomingTripAlertModalProps {
  trip: Trip | null;
  onAccept: (tripId: string) => Promise<boolean | void> | void;
  onDecline: (tripId: string, reason?: 'EXPIRED' | 'DECLINED') => void;
  isAccepting?: boolean;
  unavailableError?: string | null;
}

export const IncomingTripAlertModal: React.FC<IncomingTripAlertModalProps> = ({
  trip,
  onAccept,
  onDecline,
  isAccepting = false,
  unavailableError = null,
}) => {
  const [timeLeft, setTimeLeft] = useState(SERVER_COUNTDOWN_SECONDS);
  const [isExpired, setIsExpired] = useState(false);
  const timerRef = useRef<any>(null);

  // Synchronize countdown with server creation timestamp
  useEffect(() => {
    if (!trip) {
      setTimeLeft(SERVER_COUNTDOWN_SECONDS);
      setIsExpired(false);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Play audible chime sound when modal appears
    playNewTripSound();
    setIsExpired(false);

    // Calculate server-synchronized remaining seconds
    const createdAtMs = trip.created_at ? new Date(trip.created_at).getTime() : Date.now();
    const expiresAtMs = createdAtMs + SERVER_COUNTDOWN_SECONDS * 1000;

    const calculateRemaining = () => {
      const remainingMs = expiresAtMs - Date.now();
      const remainingSec = Math.ceil(remainingMs / 1000);
      return Math.max(0, Math.min(SERVER_COUNTDOWN_SECONDS, remainingSec));
    };

    const initial = calculateRemaining();
    setTimeLeft(initial > 0 ? initial : SERVER_COUNTDOWN_SECONDS);

    timerRef.current = setInterval(() => {
      const remaining = calculateRemaining();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timerRef.current);
        setIsExpired(true);
        // Give driver 1.5 seconds to see "Trip Request Expired" before dismissing
        setTimeout(() => {
          onDecline(trip.id, 'EXPIRED');
        }, 1500);
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [trip?.id]);

  if (!trip) return null;

  const progressPercent = Math.max(0, (timeLeft / SERVER_COUNTDOWN_SECONDS) * 100);
  const progressColor =
    timeLeft <= 5 ? Colors.danger : timeLeft <= 10 ? Colors.warning : Colors.success;

  return (
    <Modal visible={!!trip} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Top Server Progress Countdown Bar */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                { width: `${progressPercent}%`, backgroundColor: progressColor },
              ]}
            />
          </View>

          {/* Header with Live Badge, Timer & Fare */}
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <View style={[styles.liveBadge, isExpired ? styles.liveBadgeExpired : null]}>
                <View
                  style={[
                    styles.liveDot,
                    { backgroundColor: isExpired ? Colors.danger : Colors.success },
                  ]}
                />
                <Text
                  style={[
                    styles.liveText,
                    isExpired ? { color: Colors.danger } : { color: '#065F46' },
                  ]}
                >
                  {isExpired ? 'TRIP REQUEST EXPIRED' : '🚕 NEW TRIP REQUEST'}
                </Text>
              </View>

              <View style={styles.timerBadge}>
                <Ionicons
                  name="time-outline"
                  size={13}
                  color={isExpired ? Colors.danger : Colors.textSecondary}
                />
                <Text
                  style={[
                    styles.timerText,
                    isExpired ? { color: Colors.danger, fontWeight: '900' } : null,
                  ]}
                >
                  {isExpired ? '0s' : `${timeLeft}s`}
                </Text>
              </View>
            </View>

            {/* Compact Fare Display */}
            <View style={styles.fareContainer}>
              <Text style={styles.fareSymbol}>₹</Text>
              <Text style={styles.fareAmount}>
                {Number(trip.fare).toLocaleString('en-IN')}
              </Text>
              <View style={styles.vehiclePill}>
                <Text style={styles.vehicleText}>{trip.vehicle_type || 'Sedan'}</Text>
              </View>
            </View>

            {/* City-based Route Title */}
            <Text style={styles.routeCityTitle} numberOfLines={1}>
              {getTripRouteTitle(trip.pickup_location, trip.drop_location)}
            </Text>

            {/* Service & Distance Info */}
            <Text style={styles.tripTypeSubtext}>
              {trip.trip_type || 'One-way'} • Trip Distance: {trip.distance || '12 km'}
            </Text>

            {/* Countdown notice line */}
            <Text
              style={[
                styles.countdownNotice,
                isExpired ? styles.countdownNoticeExpired : null,
              ]}
            >
              {isExpired ? '⚠️ Trip Request Expired' : `Request expires in ${timeLeft} sec`}
            </Text>
          </View>

          {/* Conflict / Unavailable Error Banner */}
          {unavailableError ? (
            <View style={styles.unavailableBanner}>
              <Ionicons name="alert-circle" size={16} color={Colors.danger} />
              <Text style={styles.unavailableBannerText}>{unavailableError}</Text>
            </View>
          ) : null}

          {/* Route Section: Pickup & Drop */}
          <View style={styles.routeBox}>
            {/* Pickup */}
            <View style={styles.routeItem}>
              <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
              <View style={{ flex: 1 }}>
                <View style={styles.routeHeaderRow}>
                  <Text style={styles.routeLabel}>PICKUP</Text>
                  <Text style={styles.pickupDistBadge}>📍 2.5 km away</Text>
                </View>
                <Text style={styles.routeAddress} numberOfLines={2}>
                  {trip.pickup_location}
                </Text>
              </View>
            </View>

            <View style={styles.routeLine} />

            {/* Drop */}
            <View style={styles.routeItem}>
              <View style={[styles.routeDot, { backgroundColor: Colors.danger }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.routeLabel}>DROP</Text>
                <Text style={styles.routeAddress} numberOfLines={2}>
                  {trip.drop_location}
                </Text>
              </View>
            </View>
          </View>

          {/* Passenger Details & Payment Mode */}
          <View style={styles.customerInfoRow}>
            <View style={styles.customerBadge}>
              <Ionicons name="person-circle" size={18} color={Colors.primary} />
              <Text style={styles.customerName}>
                {trip.customer_name || 'PickMi Passenger'}
              </Text>
            </View>
            <View style={styles.paymentBadge}>
              <Ionicons
                name={trip.payment_method?.includes('Cash') ? 'cash-outline' : 'card-outline'}
                size={14}
                color="#047857"
              />
              <Text style={styles.paymentBadgeText}>
                {trip.payment_method || 'Cash on Delivery'}
              </Text>
            </View>
          </View>

          {/* Fare Inclusions / Exclusions Badges */}
          <View style={styles.feeTagsRow}>
            <View
              style={[
                styles.feeTag,
                trip.toll_included === 'INCLUDED'
                  ? styles.feeTagIncluded
                  : styles.feeTagExcluded,
              ]}
            >
              <Text
                style={[
                  styles.feeTagText,
                  trip.toll_included === 'INCLUDED'
                    ? styles.feeTagTextIncluded
                    : styles.feeTagTextExcluded,
                ]}
              >
                Toll: {trip.toll_included || 'INCLUDED'}
              </Text>
            </View>

            <View
              style={[
                styles.feeTag,
                trip.permit_included === 'INCLUDED'
                  ? styles.feeTagIncluded
                  : styles.feeTagExcluded,
              ]}
            >
              <Text
                style={[
                  styles.feeTagText,
                  trip.permit_included === 'INCLUDED'
                    ? styles.feeTagTextIncluded
                    : styles.feeTagTextExcluded,
                ]}
              >
                Permit: {trip.permit_included || 'EXCLUDED'}
              </Text>
            </View>

            <View
              style={[
                styles.feeTag,
                trip.batta_included === 'INCLUDED'
                  ? styles.feeTagIncluded
                  : styles.feeTagExcluded,
              ]}
            >
              <Text
                style={[
                  styles.feeTagText,
                  trip.batta_included === 'INCLUDED'
                    ? styles.feeTagTextIncluded
                    : styles.feeTagTextExcluded,
                ]}
              >
                Batta: {trip.batta_included || 'INCLUDED'}
              </Text>
            </View>
          </View>

          {/* Action Buttons: Decline & Accept */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.declineButton}
              onPress={() => onDecline(trip.id, 'DECLINED')}
              disabled={isAccepting}
              activeOpacity={0.8}
            >
              <Text style={styles.declineText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.acceptButton,
                Shadows.sm,
                isExpired ? styles.acceptButtonDisabled : null,
              ]}
              onPress={() => onAccept(trip.id)}
              disabled={isExpired || isAccepting}
              activeOpacity={0.85}
            >
              {isAccepting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons
                    name={isExpired ? 'close-circle' : 'checkmark-circle'}
                    size={20}
                    color={Colors.white}
                  />
                  <Text style={styles.acceptText}>
                    {isExpired ? 'EXPIRED' : 'ACCEPT TRIP'}
                  </Text>
                </>
              )}
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
    backgroundColor: 'rgba(8, 12, 20, 0.72)',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 24,
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  liveBadgeExpired: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 4,
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
    gap: 4,
  },
  fareSymbol: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.successDark,
  },
  fareAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  vehiclePill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  vehicleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  routeCityTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginTop: 8,
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  tripTypeSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  countdownNotice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 4,
  },
  countdownNoticeExpired: {
    color: Colors.danger,
    fontWeight: '800',
  },
  unavailableBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    gap: 8,
  },
  unavailableBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.danger,
    flex: 1,
  },
  routeBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  routeDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    marginTop: 3,
  },
  routeLine: {
    width: 2,
    height: 14,
    backgroundColor: '#CBD5E1',
    marginLeft: 3.5,
    marginVertical: 2,
  },
  routeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  routeLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  pickupDistBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  routeAddress: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  customerInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  customerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  paymentBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
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
    gap: 6,
  },
  acceptButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  acceptText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  feeTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  feeTag: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
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
});
