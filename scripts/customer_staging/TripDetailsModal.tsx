import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from './theme';
import type { Reservation } from './types';

interface TripDetailsModalProps {
  visible: boolean;
  reservation: Reservation | null;
  onCancelReservation: (tripId: string) => Promise<void>;
  onOpenRateModal: (reservation: Reservation) => void;
  onClose: () => void;
}

export const TripDetailsModal: React.FC<TripDetailsModalProps> = ({
  visible,
  reservation,
  onCancelReservation,
  onOpenRateModal,
  onClose,
}) => {
  if (!visible || !reservation) return null;

  const isPending = reservation.status === 'AVAILABLE' || reservation.status === 'REQUESTED';
  const isDriverAssigned =
    reservation.status === 'ASSIGNED' ||
    reservation.status === 'ACCEPTED' ||
    reservation.status === 'ON_THE_WAY';
  const isDriverArrived = reservation.status === 'ARRIVED';
  const isTripActive = reservation.status === 'STARTED';
  const isCompleted = reservation.status === 'COMPLETED';
  const isCancelled = reservation.status === 'CANCELLED';

  const handleCallDriver = () => {
    if (reservation.driver?.mobile) {
      Linking.openURL(`tel:${reservation.driver.mobile}`);
    } else {
      Alert.alert('Chauffeur Contact', 'Your chauffeur contact will be active once assigned.');
    }
  };

  const handleConfirmCancel = () => {
    Alert.alert(
      'Cancel Reservation?',
      'Are you sure you want to cancel this scheduled reservation? There are no cancellation fees.',
      [
        { text: 'Keep Reservation', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            await onCancelReservation(reservation.id);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          <SafeAreaView>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={styles.tripNumber}>{reservation.trip_number}</Text>
                  <View
                    style={[
                      styles.statusPill,
                      isCompleted
                        ? styles.statusPillSuccess
                        : isCancelled
                        ? styles.statusPillDanger
                        : isTripActive
                        ? styles.statusPillActive
                        : styles.statusPillPrimary,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        isCompleted
                          ? styles.statusTextSuccess
                          : isCancelled
                          ? styles.statusTextDanger
                          : isTripActive
                          ? styles.statusTextActive
                          : styles.statusTextPrimary,
                      ]}
                    >
                      {isPending
                        ? 'WAITING DRIVER'
                        : isDriverAssigned
                        ? 'DRIVER ASSIGNED'
                        : isDriverArrived
                        ? 'DRIVER ARRIVED'
                        : isTripActive
                        ? 'TRIP IN PROGRESS'
                        : isCompleted
                        ? 'COMPLETED'
                        : 'CANCELLED'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.headerSubtitle}>
                  Scheduled for {reservation.pickup_date} at {reservation.pickup_time}
                </Text>
              </View>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
              {/* TRIP START OTP CARD (When driver is arrived or assigned) */}
              {(isDriverArrived || isDriverAssigned || isTripActive) && (
                <View style={styles.otpCard}>
                  <View style={styles.otpHeader}>
                    <Ionicons name="key" size={18} color={COLORS.primary} />
                    <Text style={styles.otpCardTitle}>TRIP START OTP</Text>
                  </View>
                  <Text style={styles.otpInstruction}>
                    Share this 4-digit code with your chauffeur to start the ride:
                  </Text>
                  <View style={styles.otpBox}>
                    <Text style={styles.otpDigits}>{reservation.otp || '4826'}</Text>
                  </View>
                  <Text style={styles.otpSecurityNote}>
                    🔒 Driver will enter this in their PickMi Driver App to start the meter.
                  </Text>
                </View>
              )}

              {/* ACTIVE TRIP ALERT */}
              {isTripActive && (
                <View style={styles.activeTripBanner}>
                  <Ionicons name="navigate-circle" size={20} color={COLORS.white} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activeTripTitle}>Your Trip is Active</Text>
                    <Text style={styles.activeTripDesc}>
                      En route to destination. Have a smooth and safe drive!
                    </Text>
                  </View>
                </View>
              )}

              {/* CHAUFFEUR & VEHICLE SECTION */}
              <View style={styles.card}>
                <Text style={styles.cardSectionLabel}>ASSIGNED CHAUFFEUR & VEHICLE</Text>
                {reservation.driver ? (
                  <View style={styles.driverRow}>
                    <View style={styles.driverAvatar}>
                      <Ionicons name="person" size={24} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.driverName}>{reservation.driver.name}</Text>
                      <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={12} color="#F59E0B" />
                        <Text style={styles.ratingText}>
                          {reservation.driver.rating.toFixed(1)} ({reservation.driver.total_trips} trips)
                        </Text>
                      </View>
                      <Text style={styles.driverVehicleInfo}>
                        {reservation.driver.vehicle?.vehicle_number} •{' '}
                        {reservation.driver.vehicle?.vehicle_model || reservation.vehicle_type}
                      </Text>
                    </View>

                    <TouchableOpacity style={styles.callBtn} onPress={handleCallDriver}>
                      <Ionicons name="call" size={18} color={COLORS.white} />
                      <Text style={styles.callBtnText}>Call</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.unassignedBox}>
                    <Ionicons name="time" size={20} color={COLORS.warning} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.unassignedTitle}>Driver Not Assigned Yet</Text>
                      <Text style={styles.unassignedDesc}>
                        Your dedicated chauffeur is scheduled and will be assigned closer to your pickup time.
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* ROUTE SECTION */}
              <View style={styles.card}>
                <Text style={styles.cardSectionLabel}>ROUTE & TIMINGS</Text>
                <View style={styles.routeBox}>
                  <View style={styles.routePoint}>
                    <Ionicons name="radio-button-on" size={14} color={COLORS.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pointLabel}>PICKUP LOCATION</Text>
                      <Text style={styles.pointAddress}>{reservation.pickup_location}</Text>
                    </View>
                  </View>

                  <View style={styles.routeDivider}>
                    <View style={styles.routeLine} />
                    <Text style={styles.distanceBadge}>{reservation.distance}</Text>
                  </View>

                  <View style={styles.routePoint}>
                    <Ionicons name="location" size={14} color={COLORS.danger} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pointLabel}>DROP LOCATION</Text>
                      <Text style={styles.pointAddress}>{reservation.drop_location}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* FARE & PAYMENT DETAILS */}
              <View style={styles.card}>
                <Text style={styles.cardSectionLabel}>BILLING & FARE BREAKDOWN</Text>
                <View style={styles.billingRow}>
                  <Text style={styles.billingLabel}>Package Price</Text>
                  <Text style={styles.billingVal}>₹{reservation.fare.toLocaleString()}</Text>
                </View>
                <View style={styles.billingRow}>
                  <Text style={styles.billingLabel}>Payment Mode</Text>
                  <Text style={styles.billingVal}>{reservation.payment_method}</Text>
                </View>
                <View style={styles.billingRow}>
                  <Text style={styles.billingLabel}>Tolls & Airport Fee</Text>
                  <Text style={styles.billingVal}>
                    {reservation.toll_included === 'INCLUDED' ? 'Included' : 'Extra FASTag'}
                  </Text>
                </View>
                <View style={[styles.billingRow, styles.billingTotalRow]}>
                  <Text style={styles.billingTotalLabel}>Total Fare to Pay</Text>
                  <Text style={styles.billingTotalVal}>₹{reservation.fare.toLocaleString()}</Text>
                </View>
              </View>
            </ScrollView>

            {/* ACTION FOOTER */}
            <View style={styles.footer}>
              {isCompleted && (
                <TouchableOpacity
                  style={styles.rateBtn}
                  onPress={() => onOpenRateModal(reservation)}
                  activeOpacity={0.88}
                >
                  <Ionicons name="star" size={18} color={COLORS.white} />
                  <Text style={styles.rateBtnText}>
                    {reservation.rating ? `Update Rating (★${reservation.rating})` : 'Rate Your Ride'}
                  </Text>
                </TouchableOpacity>
              )}

              {isPending && (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={handleConfirmCancel}
                  activeOpacity={0.88}
                >
                  <Ionicons name="close-circle-outline" size={18} color={COLORS.danger} />
                  <Text style={styles.cancelBtnText}>Cancel Reservation</Text>
                </TouchableOpacity>
              )}
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    ...SHADOWS.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tripNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPillPrimary: {
    backgroundColor: COLORS.primaryLight,
  },
  statusPillSuccess: {
    backgroundColor: COLORS.successLight,
  },
  statusPillDanger: {
    backgroundColor: COLORS.dangerLight,
  },
  statusPillActive: {
    backgroundColor: '#EEF2FF',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusTextPrimary: {
    color: COLORS.primary,
  },
  statusTextSuccess: {
    color: COLORS.success,
  },
  statusTextDanger: {
    color: COLORS.danger,
  },
  statusTextActive: {
    color: '#4F46E5',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  otpCard: {
    backgroundColor: COLORS.primaryLight,
    padding: 16,
    borderRadius: 18,
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 99, 247, 0.2)',
    alignItems: 'center',
  },
  otpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  otpCardTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  otpInstruction: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  otpBox: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 10,
    ...SHADOWS.md,
  },
  otpDigits: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 8,
  },
  otpSecurityNote: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.textMuted,
    marginTop: 8,
  },
  activeTripBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    padding: 14,
    borderRadius: 16,
    marginTop: 12,
    gap: 10,
    ...SHADOWS.md,
  },
  activeTripTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
  },
  activeTripDesc: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginTop: 12,
  },
  cardSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  driverVehicleInfo: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  callBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    ...SHADOWS.sm,
  },
  callBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
  unassignedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningLight,
    padding: 12,
    borderRadius: 14,
    gap: 10,
  },
  unassignedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  unassignedDesc: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  routeBox: {
    gap: 8,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  pointLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  pointAddress: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 1,
  },
  routeDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
    gap: 8,
  },
  routeLine: {
    width: 2,
    height: 12,
    backgroundColor: COLORS.border,
  },
  distanceBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  billingLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  billingVal: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  billingTotalRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 4,
  },
  billingTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  billingTotalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
  },
  footer: {
    marginTop: 14,
    paddingTop: 10,
  },
  rateBtn: {
    height: 50,
    backgroundColor: '#F59E0B',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOWS.md,
  },
  rateBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  cancelBtn: {
    height: 48,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.danger,
  },
});
