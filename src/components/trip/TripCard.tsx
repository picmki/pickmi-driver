import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Trip } from '../../types/database';
import { Colors, Shadows } from '../../theme/colors';
import { PickMiButton } from '../common/PickMiButton';
import { getTripRouteTitle } from '../../utils/routeFormatting';

interface TripCardProps {
  trip: Trip;
  onPress: () => void;
  onRequest?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
}

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  onPress,
  onRequest,
  onAccept,
  onReject,
}) => {
  const getStatusBadge = () => {
    switch (trip.status) {
      case 'AVAILABLE':
        return { label: 'Available', color: Colors.primary, bg: Colors.primaryLight };
      case 'REQUESTED':
        return { label: 'Requested', color: Colors.warningDark, bg: Colors.warningLight };
      case 'ASSIGNED':
        return { label: 'Assigned to You', color: Colors.successDark, bg: Colors.successLight };
      case 'ON_THE_WAY':
      case 'ARRIVED':
      case 'STARTED':
        return { label: 'Active', color: '#5856D6', bg: '#F0EFFF' };
      case 'COMPLETED':
        return { label: 'Completed', color: Colors.successDark, bg: Colors.successLight };
      case 'CANCELLED':
        return { label: 'Cancelled', color: Colors.danger, bg: Colors.dangerLight };
      default:
        return { label: trip.status, color: Colors.textSecondary, bg: Colors.borderLight };
    }
  };

  const badge = getStatusBadge();

  // City-based route title for card header (e.g. Bangalore to Airport)
  const routeTitle = getTripRouteTitle(trip.pickup_location, trip.drop_location);

  return (
    <View style={[styles.card, Shadows.sm]}>
      {/* Clickable Card Body to view full trip details */}
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        {/* Route Title & Status Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.routeHeader} numberOfLines={1}>
              {routeTitle}
            </Text>
            <Text style={styles.tripNumber}>{trip.trip_number}</Text>
          </View>

          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>

        {/* Visual Route with Pickup & Drop */}
        <View style={styles.routeSection}>
          <View style={styles.timeline}>
            <View style={[styles.dot, styles.pickupDot]} />
            <View style={styles.line} />
            <View style={[styles.dot, styles.dropDot]} />
          </View>

          <View style={styles.addressContainer}>
            <View style={styles.addressRow}>
              <Text style={styles.label}>Pickup</Text>
              <Text style={styles.addressText} numberOfLines={1}>
                {trip.pickup_location}
              </Text>
            </View>

            <View style={[styles.addressRow, { marginTop: 10 }]}>
              <Text style={styles.label}>Drop</Text>
              <Text style={styles.addressText} numberOfLines={1}>
                {trip.drop_location}
              </Text>
            </View>
          </View>
        </View>

        {/* Trip Metrics Row: Date, Time, Distance, Vehicle */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.metricText}>{trip.pickup_date}</Text>
          </View>

          <View style={styles.metricItem}>
            <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.metricText}>{trip.pickup_time}</Text>
          </View>

          <View style={styles.metricItem}>
            <Ionicons name="navigate-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.metricText}>{trip.distance}</Text>
          </View>

          <View style={styles.metricItem}>
            <Ionicons name="car-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.metricText}>{trip.vehicle_type}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Bottom Action Footer with Clean Independent Buttons */}
      <View style={styles.footer}>
        <View style={styles.fareBox}>
          <Text style={styles.fareLabel}>Est. Fare</Text>
          <Text style={styles.fareAmount}>₹{trip.fare.toLocaleString('en-IN')}</Text>
        </View>

        <View style={styles.buttonGroup}>
          {trip.status === 'AVAILABLE' && onRequest && (
            <PickMiButton
              title="Request Trip"
              onPress={onRequest}
              size="sm"
              variant="primary"
              style={styles.actionBtn}
            />
          )}

          {trip.status === 'REQUESTED' && (
            <View style={styles.requestedBadge}>
              <Ionicons name="time" size={14} color={Colors.warningDark} />
              <Text style={styles.requestedText}>Request Sent</Text>
            </View>
          )}

          {trip.status === 'ASSIGNED' && (
            <PickMiButton
              title="View Details"
              onPress={onPress}
              size="sm"
              variant="primary"
              style={styles.actionBtn}
              rightIcon={<Ionicons name="arrow-forward" size={14} color={Colors.white} />}
            />
          )}

          {trip.status === 'COMPLETED' && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.completedText}>Completed</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleRow: {
    flex: 1,
    marginRight: 8,
  },
  routeHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  tripNumber: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  routeSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  timeline: {
    alignItems: 'center',
    marginRight: 10,
    marginTop: 3,
    height: 50,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pickupDot: {
    backgroundColor: Colors.success,
  },
  dropDot: {
    backgroundColor: Colors.danger,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: 3,
  },
  addressContainer: {
    flex: 1,
  },
  addressRow: {
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  addressText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  metricText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  fareBox: {},
  fareLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  fareAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    paddingHorizontal: 16,
    width: 130,
  },
  requestedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  requestedText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.warningDark,
    marginLeft: 6,
  },
  assignedActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rejectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Colors.dangerLight,
  },
  rejectBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.danger,
  },
  acceptBtn: {
    paddingHorizontal: 16,
    width: 120,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.successDark,
    marginLeft: 4,
  },
});
