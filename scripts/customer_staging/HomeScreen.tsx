import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from './theme';
import { VEHICLE_OPTIONS, calculateEstimatedFare } from './vehicles';
import { estimateDistanceKm } from './locations';
import type { LocationItem, VehicleOption, UserProfile } from './types';

interface HomeScreenProps {
  user: UserProfile | null;
  pickupLocation: LocationItem;
  dropLocation: LocationItem;
  travelDate: string;
  travelTime: string;
  onOpenLocationPicker: (type: 'pickup' | 'drop') => void;
  onOpenDateTimePicker: () => void;
  onSelectVehicle: (vehicle: VehicleOption, fare: number, distance: string) => void;
  onOpenAuth: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  pickupLocation,
  dropLocation,
  travelDate,
  travelTime,
  onOpenLocationPicker,
  onOpenDateTimePicker,
  onSelectVehicle,
  onOpenAuth,
}) => {
  const [hasSearched, setHasSearched] = useState(false);

  // Compute road distance between pickup and drop
  const distanceKm = estimateDistanceKm(
    pickupLocation.latitude,
    pickupLocation.longitude,
    dropLocation.latitude,
    dropLocation.longitude
  );
  const distanceStr = `${distanceKm} km`;
  const isAirportTrip =
    pickupLocation.category === 'airport' || dropLocation.category === 'airport';

  const handleSearchVehicles = () => {
    setHasSearched(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top App Header */}
        <View style={styles.topHeader}>
          <View>
            <View style={styles.logoRow}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoBadgeText}>PM</Text>
              </View>
              <Text style={styles.brandTitle}>PickMi</Text>
            </View>
            <Text style={styles.userGreeting}>
              {user ? `Hello, ${user.name.split(' ')[0]} 👋` : 'Welcome to PickMi Cabs'}
            </Text>
          </View>

          {user ? (
            <View style={styles.profileBadge}>
              <Ionicons name="person-circle" size={32} color={COLORS.primary} />
            </View>
          ) : (
            <TouchableOpacity style={styles.loginChip} onPress={onOpenAuth}>
              <Text style={styles.loginChipText}>Login</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Hero Banner: FUTURE RESERVATIONS ONLY */}
        <View style={styles.heroCard}>
          <View style={styles.badgeRow}>
            <View style={styles.ruleBadge}>
              <Ionicons name="calendar-outline" size={13} color={COLORS.primary} />
              <Text style={styles.ruleBadgeText}>FUTURE RESERVATIONS ONLY</Text>
            </View>
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={11} color="#F59E0B" />
              <Text style={styles.ratingPillText}>4.9/5</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>Plan Your Ride Ahead</Text>
          <Text style={styles.heroSubtitle}>
            Reserve a comfortable ride for your upcoming journey. Professional chauffeurs guaranteed on-time with zero cancellations.
          </Text>
        </View>

        {/* Primary Booking Card */}
        <View style={styles.bookingCard}>
          <Text style={styles.bookingCardTitle}>WHERE ARE YOU GOING?</Text>

          {/* Route Section */}
          <View style={styles.routeContainer}>
            {/* Pickup */}
            <TouchableOpacity
              style={styles.locationSelector}
              onPress={() => onOpenLocationPicker('pickup')}
              activeOpacity={0.8}
            >
              <View style={styles.pickupDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.locationTypeLabel}>PICKUP LOCATION</Text>
                <Text style={styles.locationText} numberOfLines={1}>
                  {pickupLocation.title}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>

            <View style={styles.connectorRow}>
              <View style={styles.connectorLine} />
              <View style={styles.swapBtn}>
                <Ionicons name="swap-vertical" size={14} color={COLORS.primary} />
              </View>
            </View>

            {/* Drop */}
            <TouchableOpacity
              style={styles.locationSelector}
              onPress={() => onOpenLocationPicker('drop')}
              activeOpacity={0.8}
            >
              <View style={styles.dropSquare} />
              <View style={{ flex: 1 }}>
                <Text style={styles.locationTypeLabel}>DESTINATION DROP</Text>
                <Text style={styles.locationText} numberOfLines={1}>
                  {dropLocation.title}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* When Are You Travelling? */}
          <View style={styles.dateTimeContainer}>
            <Text style={styles.bookingCardTitle}>WHEN ARE YOU TRAVELLING?</Text>
            <TouchableOpacity
              style={styles.dateTimeSelector}
              onPress={onOpenDateTimePicker}
              activeOpacity={0.8}
            >
              <View style={styles.dateTimeIconWrap}>
                <Ionicons name="time" size={18} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.locationTypeLabel}>FUTURE PICKUP SCHEDULE</Text>
                <Text style={styles.dateTimeValue}>
                  {travelDate} • {travelTime}
                </Text>
              </View>
              <View style={styles.changeBadge}>
                <Text style={styles.changeBadgeText}>Change</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Primary Find Vehicles CTA */}
          <TouchableOpacity
            style={styles.findVehiclesBtn}
            onPress={handleSearchVehicles}
            activeOpacity={0.88}
          >
            <Ionicons name="search" size={18} color={COLORS.white} />
            <Text style={styles.findVehiclesText}>Find Available Vehicles</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Travel Hub Shortcuts */}
        <View style={styles.quickHubsSection}>
          <Text style={styles.sectionHeader}>POPULAR TRANSIT HUBS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hubScroll}>
            {[
              { title: 'Airport BLR T1/T2', cat: 'airport', icon: 'airplane' },
              { title: 'Mysuru Outstation', cat: 'outstation', icon: 'map' },
              { title: 'Whitefield IT Park', cat: 'hub', icon: 'business' },
              { title: 'KSR City Railway', cat: 'railway', icon: 'train' },
            ].map((hub, i) => (
              <TouchableOpacity
                key={i}
                style={styles.hubChip}
                onPress={() => onOpenLocationPicker('drop')}
              >
                <Ionicons name={hub.icon as any} size={14} color={COLORS.primary} />
                <Text style={styles.hubChipText}>{hub.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Available Vehicles Section */}
        <View style={styles.vehiclesSection}>
          <View style={styles.vehiclesHeader}>
            <View>
              <Text style={styles.sectionHeader}>AVAILABLE VEHICLE CLASSES</Text>
              <Text style={styles.distanceSubtext}>
                Estimated Route: ~{distanceStr} • {isAirportTrip ? 'FASTag Airport Toll Included' : 'No Surge Pricing'}
              </Text>
            </View>
            <View style={styles.verifiedCountBadge}>
              <Text style={styles.verifiedCountText}>5 Classes</Text>
            </View>
          </View>

          <View style={styles.vehiclesList}>
            {VEHICLE_OPTIONS.map((veh: VehicleOption) => {
              const fareCalc = calculateEstimatedFare(veh, distanceKm, isAirportTrip);

              return (
                <View key={veh.id} style={styles.vehicleCard}>
                  {veh.tag && (
                    <View
                      style={[
                        styles.vehicleTagPill,
                        veh.isPopular ? styles.tagPopular : veh.isEco ? styles.tagEco : styles.tagDefault,
                      ]}
                    >
                      <Text
                        style={[
                          styles.vehicleTagText,
                          veh.isPopular ? styles.textPopular : veh.isEco ? styles.textEco : styles.textDefault,
                        ]}
                      >
                        {veh.tag}
                      </Text>
                    </View>
                  )}

                  <View style={styles.vehicleTopRow}>
                    <View style={styles.vehicleIconBadge}>
                      <Ionicons name={veh.iconName as any} size={28} color={COLORS.primary} />
                    </View>

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.cardVehicleName}>{veh.name}</Text>
                      <Text style={styles.cardVehicleModels}>{veh.models}</Text>
                      <View style={styles.capacityRow}>
                        <View style={styles.capacityBadge}>
                          <Ionicons name="people-outline" size={12} color={COLORS.textSecondary} />
                          <Text style={styles.capacityText}>{veh.seating}</Text>
                        </View>
                        <View style={styles.capacityBadge}>
                          <Ionicons name="briefcase-outline" size={12} color={COLORS.textSecondary} />
                          <Text style={styles.capacityText}>{veh.luggage}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Price and Select */}
                    <View style={styles.priceCol}>
                      <Text style={styles.cardFareAmount}>₹{fareCalc.totalFare.toLocaleString()}</Text>
                      <Text style={styles.packageKmText}>
                        Incl. {veh.allowedKm} km
                      </Text>
                    </View>
                  </View>

                  {/* Amenities Preview */}
                  <View style={styles.amenitiesRow}>
                    {veh.amenities.slice(0, 3).map((am: string, idx: number) => (
                      <View key={idx} style={styles.amenityChip}>
                        <Ionicons name="checkmark" size={11} color={COLORS.primary} />
                        <Text style={styles.amenityChipText}>{am}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Select CTA */}
                  <TouchableOpacity
                    style={styles.selectVehicleBtn}
                    onPress={() => onSelectVehicle(veh, fareCalc.totalFare, distanceStr)}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.selectVehicleText}>Select {veh.name}</Text>
                    <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {/* Safety & Trust Footer */}
        <View style={styles.trustSection}>
          <Text style={styles.trustTitle}>The PickMi Promise</Text>
          <View style={styles.trustGrid}>
            <View style={styles.trustItem}>
              <Ionicons name="shield-checkmark" size={18} color={COLORS.primary} />
              <Text style={styles.trustText}>Zero Driver Cancellations</Text>
            </View>
            <View style={styles.trustItem}>
              <Ionicons name="snow" size={18} color={COLORS.primary} />
              <Text style={styles.trustText}>100% Guaranteed Chilled AC</Text>
            </View>
            <View style={styles.trustItem}>
              <Ionicons name="key" size={18} color={COLORS.primary} />
              <Text style={styles.trustText}>Secure OTP Start Security</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.white,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  userGreeting: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  profileBadge: {
    padding: 2,
  },
  loginChip: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
  },
  loginChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  ruleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    gap: 5,
  },
  ruleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  ratingPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  bookingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 18,
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primaryGhost || '#E2E8F0',
    ...SHADOWS.md,
  },
  bookingCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  routeContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  dropSquare: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: COLORS.danger,
  },
  locationTypeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  connectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 5,
    marginVertical: 1,
  },
  connectorLine: {
    width: 2,
    height: 14,
    backgroundColor: COLORS.border,
  },
  swapBtn: {
    marginLeft: 12,
    padding: 4,
  },
  dateTimeContainer: {
    marginTop: 14,
  },
  dateTimeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 12,
  },
  dateTimeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateTimeValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
  },
  changeBadge: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  changeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  findVehiclesBtn: {
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
    ...SHADOWS.md,
  },
  findVehiclesText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
  },
  quickHubsSection: {
    marginTop: 18,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.6,
  },
  distanceSubtext: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  hubScroll: {
    gap: 8,
    paddingTop: 8,
  },
  hubChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 6,
  },
  hubChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  vehiclesSection: {
    marginTop: 20,
  },
  vehiclesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  verifiedCountBadge: {
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  vehiclesList: {
    gap: 12,
  },
  vehicleCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
    position: 'relative',
  },
  vehicleTagPill: {
    position: 'absolute',
    top: -1,
    right: 16,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  tagPopular: {
    backgroundColor: '#FEF3C7',
  },
  tagEco: {
    backgroundColor: '#ECFDF5',
  },
  tagDefault: {
    backgroundColor: COLORS.primaryLight,
  },
  vehicleTagText: {
    fontSize: 9,
    fontWeight: '800',
  },
  textPopular: {
    color: '#B45309',
  },
  textEco: {
    color: '#065F46',
  },
  textDefault: {
    color: COLORS.primary,
  },
  vehicleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardVehicleName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  cardVehicleModels: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  capacityRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  capacityText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  cardFareAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
  },
  packageKmText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 1,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  amenityChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  selectVehicleBtn: {
    height: 44,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
    ...SHADOWS.sm,
  },
  selectVehicleText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  trustSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  trustTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  trustGrid: {
    gap: 8,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trustText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
