import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../theme/colors';
import { useTrips } from '../../context/TripContext';
import { PickMiButton } from '../common/PickMiButton';
import { Trip } from '../../types/database';
import { DistanceAndKmLimitCard } from '../trip/DistanceAndKmLimitCard';
import { getTripRouteTitle } from '../../utils/routeFormatting';

interface HomeTripCardProps {
  onViewTrip: (trip?: Trip) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 32, 420);

export const HomeTripCard: React.FC<HomeTripCardProps> = ({ onViewTrip }) => {
  const { activeTrips, activeTrip } = useTrips();
  const [activeIndex, setActiveIndex] = useState(0);

  // Trips to display: activeTrips if available, else activeTrip wrapped, else empty
  const displayTrips = activeTrips && activeTrips.length > 0 ? activeTrips : activeTrip ? [activeTrip] : [];

  if (displayTrips.length === 0) {
    return (
      <View style={[styles.card, Shadows.sm]}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="car-outline" size={24} color={Colors.primary} />
          </View>
          <View style={styles.emptyTextContainer}>
            <Text style={styles.emptyTitle}>No Active Trip</Text>
            <Text style={styles.emptySubtitle}>
              New trips will appear here when you're online.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const getStatusBadge = (status: Trip['status']) => {
    switch (status) {
      case 'ASSIGNED':
        return { text: 'New Trip Assigned', color: Colors.primary, bg: Colors.primaryLight };
      case 'ACCEPTED':
      case 'ON_THE_WAY':
        return { text: 'On The Way to Pickup', color: '#5856D6', bg: '#F0EFFF' };
      case 'ARRIVED':
        return { text: 'Arrived at Pickup', color: Colors.warningDark, bg: Colors.warningLight };
      case 'STARTED':
        return { text: 'Trip In Progress', color: Colors.successDark, bg: Colors.successLight };
      default:
        return { text: 'Active Trip', color: Colors.primary, bg: Colors.primaryLight };
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + 12));
    if (index >= 0 && index < displayTrips.length) {
      setActiveIndex(index);
    }
  };

  const renderTripCard = (trip: Trip, isMulti: boolean) => {
    const statusBadge = getStatusBadge(trip.status);

    return (
      <View
        key={trip.id}
        style={[
          styles.card,
          Shadows.md,
          isMulti && { width: CARD_WIDTH, marginHorizontal: 0, marginRight: 12 },
        ]}
      >
        {/* Apple Card Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: statusBadge.bg }]}>
            <View style={[styles.badgeDot, { backgroundColor: statusBadge.color }]} />
            <Text style={[styles.badgeText, { color: statusBadge.color }]}>
              {statusBadge.text}
            </Text>
          </View>
          <Text style={styles.tripId}>{trip.trip_number}</Text>
        </View>

        {/* City Route Title */}
        <View style={styles.routeTitleRow}>
          <Text style={styles.routeTitleText} numberOfLines={1}>
            {getTripRouteTitle(trip.pickup_location, trip.drop_location)}
          </Text>
        </View>

        {/* Route Timeline */}
        <View style={styles.routeContainer}>
          <View style={styles.timeline}>
            <View style={[styles.timelineDot, styles.dotPickup]} />
            <View style={styles.timelineLine} />
            <View style={[styles.timelineDot, styles.dotDrop]} />
          </View>

          <View style={styles.routeDetails}>
            <View style={styles.locationBlock}>
              <Text style={styles.locationLabel}>PICKUP</Text>
              <Text style={styles.locationValue} numberOfLines={1}>
                {trip.pickup_location}
              </Text>
            </View>

            <View style={[styles.locationBlock, { marginTop: 12 }]}>
              <Text style={styles.locationLabel}>DROP</Text>
              <Text style={styles.locationValue} numberOfLines={1}>
                {trip.drop_location}
              </Text>
            </View>
          </View>
        </View>

        {/* Apple Metrics Bar */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Date</Text>
            <Text style={styles.metaValue}>{trip.pickup_date}</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Time</Text>
            <Text style={styles.metaValue}>{trip.pickup_time}</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Fare</Text>
            <Text style={styles.fareValue}>₹{trip.fare.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* Distance & Allowed KM Limit Cards */}
        <View style={{ marginBottom: 14 }}>
          <DistanceAndKmLimitCard
            distance={trip.distance || '38.5 km'}
            allowedKm={trip.allowed_km || 45}
            extraKmRate={trip.extra_km_rate || 14}
            showExtraRateBanner={false}
            theme="white"
          />
        </View>

        {/* Apple iOS Primary Action Button */}
        <PickMiButton
          title={
            trip.status === 'ASSIGNED' || trip.status === 'ACCEPTED' || trip.status === 'ARRIVED'
              ? 'View Details'
              : 'Trip In Progress • View'
          }
          onPress={() => onViewTrip(trip)}
          variant="primary"
          size="md"
          leftIcon={
            <Ionicons
              name={
                trip.status === 'ASSIGNED' || trip.status === 'ACCEPTED' || trip.status === 'ARRIVED'
                  ? 'eye-outline'
                  : 'navigate'
              }
              size={18}
              color={Colors.white}
            />
          }
          rightIcon={<Ionicons name="arrow-forward" size={17} color={Colors.white} />}
        />
      </View>
    );
  };

  // If multiple active trips exist, show horizontal swipeable carousel
  if (displayTrips.length > 1) {
    return (
      <View style={styles.multiTripContainer}>
        {/* Carousel Pagination Header */}
        <View style={styles.carouselHeaderRow}>
          <View style={styles.carouselIndicatorPill}>
            <Ionicons name="layers" size={14} color={Colors.primary} />
            <Text style={styles.carouselIndicatorText}>
              Active Trips ({activeIndex + 1} of {displayTrips.length})
            </Text>
          </View>

          <View style={styles.paginationDots}>
            {displayTrips.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  activeIndex === i ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Horizontal Scrollable Trips Carousel */}
        <ScrollView
          horizontal
          pagingEnabled={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
          snapToInterval={CARD_WIDTH + 12}
          decelerationRate="fast"
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {displayTrips.map((trip) => renderTripCard(trip, true))}
        </ScrollView>
      </View>
    );
  }

  // Single active trip
  return renderTripCard(displayTrips[0], false);
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  multiTripContainer: {
    marginBottom: 4,
  },
  carouselHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  carouselIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  carouselIndicatorText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  paginationDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 18,
    backgroundColor: Colors.primary,
  },
  dotInactive: {
    width: 6,
    backgroundColor: '#D1D5DB',
  },
  carouselContent: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  emptyTextContainer: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  routeTitleRow: {
    marginBottom: 12,
  },
  routeTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  tripId: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  timeline: {
    alignItems: 'center',
    marginRight: 12,
    marginTop: 4,
    height: 56,
  },
  timelineDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  dotPickup: {
    backgroundColor: Colors.success,
  },
  dotDrop: {
    backgroundColor: Colors.danger,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  routeDetails: {
    flex: 1,
  },
  locationBlock: {
    justifyContent: 'center',
  },
  locationLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  locationValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 1,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  metaItem: {
    alignItems: 'center',
  },
  metaDivider: {
    width: 1,
    height: 22,
    backgroundColor: Colors.border,
  },
  metaLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  fareValue: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.primary,
    marginTop: 2,
  },
});
