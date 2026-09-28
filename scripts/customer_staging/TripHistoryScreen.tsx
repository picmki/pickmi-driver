import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from './theme';
import type { Reservation } from './types';

interface TripHistoryScreenProps {
  reservations: Reservation[];
  onSelectTrip: (trip: Reservation) => void;
  onOpenRateModal: (trip: Reservation) => void;
  onNavigateHome: () => void;
}

export const TripHistoryScreen: React.FC<TripHistoryScreenProps> = ({
  reservations,
  onSelectTrip,
  onOpenRateModal,
  onNavigateHome,
}) => {
  const completedTrips = reservations.filter(
    (r) => r.status === 'COMPLETED' || r.completed_at
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={styles.header}>
        <Text style={styles.title}>Trip History</Text>
        <Text style={styles.subtitle}>
          Review completed journeys, receipts, and ratings
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {completedTrips.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="receipt-outline" size={44} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Trip History Yet</Text>
            <Text style={styles.emptySubtitle}>
              You haven't completed any PickMi rides yet. All completed journeys and downloadable invoices will appear here.
            </Text>
            <TouchableOpacity style={styles.bookBtn} onPress={onNavigateHome} activeOpacity={0.88}>
              <Text style={styles.bookBtnText}>Book a Ride</Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.tripsList}>
            {completedTrips.map((trip: Reservation) => (
              <TouchableOpacity
                key={trip.id}
                style={styles.card}
                onPress={() => onSelectTrip(trip)}
                activeOpacity={0.85}
              >
                {/* Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.tripIdRow}>
                    <Text style={styles.tripId}>{trip.trip_number}</Text>
                    <View style={styles.vehicleBadge}>
                      <Text style={styles.vehicleBadgeText}>{trip.vehicle_type}</Text>
                    </View>
                  </View>

                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
                    <Text style={styles.completedText}>Completed</Text>
                  </View>
                </View>

                {/* Date & Time */}
                <Text style={styles.dateText}>
                  {trip.pickup_date} at {trip.pickup_time} • {trip.distance}
                </Text>

                {/* Route */}
                <View style={styles.routeBox}>
                  <View style={styles.routeRow}>
                    <View style={styles.dotPickup} />
                    <Text style={styles.routeText} numberOfLines={1}>
                      {trip.pickup_location}
                    </Text>
                  </View>
                  <View style={styles.routeRow}>
                    <View style={styles.squareDrop} />
                    <Text style={styles.routeText} numberOfLines={1}>
                      {trip.drop_location}
                    </Text>
                  </View>
                </View>

                {/* Driver & Rating row */}
                <View style={styles.driverRatingRow}>
                  <View style={styles.driverInfo}>
                    <Ionicons name="person-circle-outline" size={24} color={COLORS.primary} />
                    <View>
                      <Text style={styles.driverName}>
                        {trip.driver?.name || 'Verified Chauffeur'}
                      </Text>
                      <Text style={styles.paymentMethodText}>
                        Paid via {trip.payment_method}
                      </Text>
                    </View>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.fareAmount}>₹{trip.fare.toLocaleString()}</Text>
                    {trip.rating ? (
                      <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={12} color="#F59E0B" />
                        <Text style={styles.ratingText}>Rated ★{trip.rating}</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.rateRideBtn}
                        onPress={() => onOpenRateModal(trip)}
                      >
                        <Ionicons name="star-outline" size={12} color="#D97706" />
                        <Text style={styles.rateRideBtnText}>Rate Ride</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 280,
  },
  bookBtn: {
    height: 48,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 22,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 6,
    ...SHADOWS.md,
  },
  bookBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  tripsList: {
    gap: 14,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tripIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tripId: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  vehicleBadge: {
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  vehicleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  completedText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.success,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 6,
  },
  routeBox: {
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 14,
    marginTop: 10,
    gap: 6,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dotPickup: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.primary,
  },
  squareDrop: {
    width: 7,
    height: 7,
    borderRadius: 2,
    backgroundColor: COLORS.danger,
  },
  routeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  driverRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  driverName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  paymentMethodText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  fareAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  rateRideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
    marginTop: 2,
  },
  rateRideBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
});
