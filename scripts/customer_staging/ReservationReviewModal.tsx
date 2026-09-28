import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from './theme';
import type { VehicleOption, UserProfile } from './types';

interface ReservationReviewModalProps {
  visible: boolean;
  vehicle: VehicleOption | null;
  fare: number;
  distance: string;
  pickupLocation: string;
  dropLocation: string;
  travelDate: string;
  travelTime: string;
  user: UserProfile | null;
  onConfirmReservation: (paymentMethod: string) => Promise<void>;
  onClose: () => void;
}

export const ReservationReviewModal: React.FC<ReservationReviewModalProps> = ({
  visible,
  vehicle,
  fare,
  distance,
  pickupLocation,
  dropLocation,
  travelDate,
  travelTime,
  user,
  onConfirmReservation,
  onClose,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Online'>('Cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!visible || !vehicle) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirmReservation(paymentMethod);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          <SafeAreaView>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>Review & Confirm Reservation</Text>
                <Text style={styles.headerSubtitle}>
                  Inspect all trip details before locking your chauffeur booking
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
              {/* Scheduled Date & Time Pill */}
              <View style={styles.scheduleBadge}>
                <Ionicons name="calendar" size={16} color={COLORS.primary} />
                <Text style={styles.scheduleText}>
                  Scheduled for: <Text style={{ fontWeight: '900' }}>{travelDate} at {travelTime}</Text>
                </Text>
              </View>

              {/* Route Card */}
              <View style={styles.card}>
                <Text style={styles.cardLabel}>ITINERARY ROUTE</Text>
                <View style={styles.routeBox}>
                  <View style={styles.pointRow}>
                    <Ionicons name="radio-button-on" size={16} color={COLORS.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pointType}>PICKUP</Text>
                      <Text style={styles.pointLocation}>{pickupLocation}</Text>
                    </View>
                  </View>

                  <View style={styles.routeDivider}>
                    <View style={styles.routeLine} />
                    <Text style={styles.distanceBadge}>~{distance}</Text>
                  </View>

                  <View style={styles.pointRow}>
                    <Ionicons name="location" size={16} color={COLORS.danger} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pointType}>DESTINATION</Text>
                      <Text style={styles.pointLocation}>{dropLocation}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Vehicle Selected */}
              <View style={styles.card}>
                <Text style={styles.cardLabel}>SELECTED VEHICLE</Text>
                <View style={styles.vehicleRow}>
                  <View style={styles.vehicleIconWrap}>
                    <Ionicons name="car-sport" size={22} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vehicleName}>{vehicle.name}</Text>
                    <Text style={styles.vehicleModels}>{vehicle.models}</Text>
                  </View>
                  <View style={styles.vehicleSpecs}>
                    <Text style={styles.specsText}>{vehicle.seating}</Text>
                    <Text style={styles.specsText}>{vehicle.luggage}</Text>
                  </View>
                </View>
              </View>

              {/* Passenger Contact */}
              <View style={styles.card}>
                <Text style={styles.cardLabel}>PASSENGER DETAILS</Text>
                <View style={styles.passengerRow}>
                  <Ionicons name="person-circle-outline" size={32} color={COLORS.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.passengerName}>{user?.name || 'Customer'}</Text>
                    <Text style={styles.passengerPhone}>{user?.mobile || '+91 99000 00000'}</Text>
                  </View>
                </View>
              </View>

              {/* Payment Method Selector */}
              <View style={styles.card}>
                <Text style={styles.cardLabel}>PAYMENT METHOD</Text>
                <View style={styles.paymentOptions}>
                  <TouchableOpacity
                    style={[
                      styles.paymentOption,
                      paymentMethod === 'Cash' && styles.paymentOptionActive,
                    ]}
                    onPress={() => setPaymentMethod('Cash')}
                  >
                    <Ionicons
                      name="cash-outline"
                      size={18}
                      color={paymentMethod === 'Cash' ? COLORS.primary : COLORS.textSecondary}
                    />
                    <Text
                      style={[
                        styles.paymentText,
                        paymentMethod === 'Cash' && styles.paymentTextActive,
                      ]}
                    >
                      Cash to Chauffeur
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.paymentOption,
                      paymentMethod === 'Online' && styles.paymentOptionActive,
                    ]}
                    onPress={() => setPaymentMethod('Online')}
                  >
                    <Ionicons
                      name="card-outline"
                      size={18}
                      color={paymentMethod === 'Online' ? COLORS.primary : COLORS.textSecondary}
                    />
                    <Text
                      style={[
                        styles.paymentText,
                        paymentMethod === 'Online' && styles.paymentTextActive,
                      ]}
                    >
                      UPI / Online Pay
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Fare Breakdown Summary */}
              <View style={styles.fareBreakdownCard}>
                <View style={styles.fareRow}>
                  <Text style={styles.fareRowLabel}>Package Fare ({vehicle.allowedKm} km)</Text>
                  <Text style={styles.fareRowValue}>₹{vehicle.baseFare}</Text>
                </View>
                <View style={styles.fareRow}>
                  <Text style={styles.fareRowLabel}>Extra KM Rate</Text>
                  <Text style={styles.fareRowValue}>₹{vehicle.ratePerKm}/km</Text>
                </View>
                <View style={styles.fareRow}>
                  <Text style={styles.fareRowLabel}>Tolls & Airport Taxes</Text>
                  <Text style={styles.fareRowValue}>Included</Text>
                </View>
                <View style={[styles.fareRow, styles.fareTotalRow]}>
                  <Text style={styles.fareTotalLabel}>Total Reservation Price</Text>
                  <Text style={styles.fareTotalAmount}>₹{fare.toLocaleString()}</Text>
                </View>
              </View>
            </ScrollView>

            {/* Bottom Confirm Action */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirm}
                disabled={isSubmitting}
                activeOpacity={0.88}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Text style={styles.confirmBtnText}>Confirm Reservation</Text>
                    <Ionicons name="checkmark-done" size={20} color={COLORS.white} />
                  </>
                )}
              </TouchableOpacity>
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  scheduleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 12,
    gap: 8,
  },
  scheduleText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginTop: 10,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  routeBox: {
    gap: 8,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  pointType: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  pointLocation: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 1,
  },
  routeDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 7,
    marginVertical: 2,
    gap: 8,
  },
  routeLine: {
    width: 2,
    height: 14,
    backgroundColor: COLORS.border,
  },
  distanceBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  vehicleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  vehicleModels: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  vehicleSpecs: {
    alignItems: 'flex-end',
  },
  specsText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  passengerName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  passengerPhone: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  paymentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 6,
  },
  paymentOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  paymentText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  paymentTextActive: {
    color: COLORS.primary,
  },
  fareBreakdownCard: {
    backgroundColor: COLORS.surfaceAlt,
    padding: 14,
    borderRadius: 16,
    marginTop: 10,
    gap: 6,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fareRowLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  fareRowValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  fareTotalRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 4,
  },
  fareTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  fareTotalAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  footer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  confirmBtn: {
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOWS.md,
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});
