import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Trip } from '../../types/database';
import { Colors, Shadows } from '../../theme/colors';
import { PickMiButton } from '../common/PickMiButton';

interface TripCompletedModalProps {
  trip: Trip | null;
  visible: boolean;
  onBackToHome: () => void;
}

export const TripCompletedModal: React.FC<TripCompletedModalProps> = ({
  trip,
  visible,
  onBackToHome,
}) => {
  if (!trip) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.overlay}>
        <View style={[styles.card, Shadows.lg]}>
          {/* Success Checkmark Circle */}
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark" size={44} color={Colors.white} />
          </View>

          <Text style={styles.title}>Trip Completed</Text>
          <Text style={styles.subtitle}>
            Great job! Fare has been credited to your wallet balance.
          </Text>

          {/* Fare Highlight */}
          <View style={styles.fareContainer}>
            <Text style={styles.fareLabel}>Total Fare Earned</Text>
            <Text style={styles.fareValue}>
              ₹{(trip.total_fare || trip.fare).toLocaleString('en-IN')}
            </Text>
          </View>

          {/* Trip Summary Details */}
          <View style={styles.detailsContainer}>
            {((trip.extra_km ?? 0) > 0 || (trip.toll_charges ?? 0) > 0 || (trip.parking_charges ?? 0) > 0) && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Settlement Charges</Text>
                  <Text style={[styles.detailValue, { color: Colors.primary, fontWeight: '700' }]}>
                    {(trip.extra_km ?? 0) > 0 ? `+${trip.extra_km}km ` : ''}
                    {(trip.toll_charges ?? 0) > 0 ? `Toll: ₹${trip.toll_charges} ` : ''}
                    {(trip.parking_charges ?? 0) > 0 ? `Parking: ₹${trip.parking_charges}` : ''}
                  </Text>
                </View>
                <View style={styles.divider} />
              </>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Trip ID</Text>
              <Text style={styles.detailValue}>{trip.trip_number}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pickup</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {trip.pickup_location.split(',')[0]}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Drop</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {trip.drop_location.split(',')[0]}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Trip Date</Text>
              <Text style={styles.detailValue}>{trip.pickup_date}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Completion Time</Text>
              <Text style={styles.detailValue}>
                {trip.completed_at || 'Just now'}
              </Text>
            </View>
          </View>

          {/* Back to Home CTA */}
          <PickMiButton
            title="Back to Home"
            onPress={onBackToHome}
            variant="primary"
            size="lg"
            rightIcon={<Ionicons name="home" size={20} color={Colors.white} />}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  fareContainer: {
    backgroundColor: Colors.successLight,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  fareLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.successDark,
    textTransform: 'uppercase',
  },
  fareValue: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.successDark,
    marginTop: 2,
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 14,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    maxWidth: '65%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 6,
  },
});
