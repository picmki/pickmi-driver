import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from './theme';
import type { Reservation } from './types';

interface BookingConfirmedModalProps {
  visible: boolean;
  reservation: Reservation | null;
  onViewReservation: () => void;
  onGoHome: () => void;
}

export const BookingConfirmedModal: React.FC<BookingConfirmedModalProps> = ({
  visible,
  reservation,
  onViewReservation,
  onGoHome,
}) => {
  if (!visible || !reservation) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Top Success Badge */}
          <View style={styles.successIconOuter}>
            <View style={styles.successIconInner}>
              <Ionicons name="checkmark" size={38} color={COLORS.white} />
            </View>
          </View>

          <Text style={styles.title}>Reservation Confirmed</Text>
          <Text style={styles.subtitle}>
            Your PickMi ride has been reserved successfully.
          </Text>

          {/* Reservation Summary Card */}
          <View style={styles.receiptCard}>
            <View style={styles.bookingIdRow}>
              <Text style={styles.bookingIdLabel}>RESERVATION ID</Text>
              <Text style={styles.bookingIdValue}>{reservation.trip_number}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Scheduled Time:</Text>
              <Text style={styles.infoValue}>
                {reservation.pickup_date} at {reservation.pickup_time}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="car-sport-outline" size={16} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Vehicle Class:</Text>
              <Text style={styles.infoValue}>{reservation.vehicle_type}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="wallet-outline" size={16} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Calculated Fare:</Text>
              <Text style={[styles.infoValue, { color: COLORS.primary, fontWeight: '900' }]}>
                ₹{reservation.fare.toLocaleString()}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.routeBlock}>
              <View style={styles.routeRow}>
                <Ionicons name="radio-button-on" size={12} color={COLORS.primary} />
                <Text style={styles.routeText} numberOfLines={1}>
                  {reservation.pickup_location}
                </Text>
              </View>
              <View style={styles.routeRow}>
                <Ionicons name="location" size={12} color={COLORS.danger} />
                <Text style={styles.routeText} numberOfLines={1}>
                  {reservation.drop_location}
                </Text>
              </View>
            </View>

            {/* Chauffeur Notice */}
            <View style={styles.driverNoticeBox}>
              <Ionicons name="time" size={16} color={COLORS.primary} />
              <Text style={styles.driverNoticeText}>
                Your chauffeur will be assigned closer to your pickup time. Track live updates in My Reservations.
              </Text>
            </View>
          </View>

          {/* CTAs */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={onViewReservation}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryBtnText}>View Reservation</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={onGoHome}
              activeOpacity={0.88}
            >
              <Text style={styles.secondaryBtnText}>Go to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIconOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...SHADOWS.md,
  },
  successIconInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
  receiptCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 18,
    marginTop: 24,
    ...SHADOWS.sm,
  },
  bookingIdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingIdLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.6,
  },
  bookingIdValue: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  routeBlock: {
    gap: 8,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  driverNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: 10,
    borderRadius: 12,
    marginTop: 14,
    gap: 8,
  },
  driverNoticeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    flex: 1,
    lineHeight: 16,
  },
  actions: {
    width: '100%',
    marginTop: 28,
    gap: 12,
  },
  primaryBtn: {
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOWS.md,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  secondaryBtn: {
    height: 50,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
});
