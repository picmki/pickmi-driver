import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from './theme';
import type { Reservation } from './types';

interface MyReservationsScreenProps {
  reservations: Reservation[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectReservation: (res: Reservation) => void;
  onNavigateHome: () => void;
}

export const MyReservationsScreen: React.FC<MyReservationsScreenProps> = ({
  reservations,
  isLoading,
  onRefresh,
  onSelectReservation,
  onNavigateHome,
}) => {
  const [tab, setTab] = useState<'UPCOMING' | 'ACTIVE' | 'ALL'>('UPCOMING');

  const upcomingReservations = reservations.filter(
    (r) =>
      r.status === 'AVAILABLE' ||
      r.status === 'ASSIGNED' ||
      r.status === 'ACCEPTED' ||
      r.status === 'ARRIVED'
  );

  const activeReservations = reservations.filter((r) => r.status === 'STARTED');

  const displayedReservations =
    tab === 'UPCOMING'
      ? upcomingReservations
      : tab === 'ACTIVE'
      ? activeReservations
      : reservations;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Reservations</Text>
          <Text style={styles.subtitle}>
            Manage scheduled rides & track assigned chauffeurs
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, tab === 'UPCOMING' && styles.tabActive]}
          onPress={() => setTab('UPCOMING')}
        >
          <Text style={[styles.tabText, tab === 'UPCOMING' && styles.tabTextActive]}>
            Upcoming ({upcomingReservations.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, tab === 'ACTIVE' && styles.tabActive]}
          onPress={() => setTab('ACTIVE')}
        >
          <Text style={[styles.tabText, tab === 'ACTIVE' && styles.tabTextActive]}>
            Active ({activeReservations.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, tab === 'ALL' && styles.tabActive]}
          onPress={() => setTab('ALL')}
        >
          <Text style={[styles.tabText, tab === 'ALL' && styles.tabTextActive]}>
            All ({reservations.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {displayedReservations.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="calendar-outline" size={44} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>
              {tab === 'ACTIVE' ? 'No Trip Currently Active' : 'No Upcoming Reservations'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {tab === 'ACTIVE'
                ? 'When your chauffeur verifies your OTP and starts the ride, live trip tracking appears here.'
                : 'Plan your next trip ahead. PickMi guarantees on-time chauffeurs for your flights and meetings.'}
            </Text>
            <TouchableOpacity style={styles.planRideBtn} onPress={onNavigateHome} activeOpacity={0.88}>
              <Text style={styles.planRideBtnText}>Plan a Ride Ahead</Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.reservationsList}>
            {displayedReservations.map((res: Reservation) => {
              const isPending = res.status === 'AVAILABLE';
              const isAssigned = res.status === 'ASSIGNED' || res.status === 'ACCEPTED';
              const isArrived = res.status === 'ARRIVED';
              const isStarted = res.status === 'STARTED';
              const isCompleted = res.status === 'COMPLETED';

              return (
                <TouchableOpacity
                  key={res.id}
                  style={styles.card}
                  onPress={() => onSelectReservation(res)}
                  activeOpacity={0.85}
                >
                  {/* Top Bar */}
                  <View style={styles.cardTopRow}>
                    <View style={styles.tripIdWrap}>
                      <Text style={styles.tripId}>{res.trip_number}</Text>
                      <Text style={styles.vehicleType}>{res.vehicle_type}</Text>
                    </View>

                    {/* Status Pill */}
                    <View
                      style={[
                        styles.statusPill,
                        isCompleted
                          ? styles.statusSuccess
                          : isStarted
                          ? styles.statusActive
                          : isArrived || isAssigned
                          ? styles.statusAssigned
                          : styles.statusPending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          isCompleted
                            ? styles.statusTextSuccess
                            : isStarted
                            ? styles.statusTextActive
                            : isArrived || isAssigned
                            ? styles.statusTextAssigned
                            : styles.statusTextPending,
                        ]}
                      >
                        {isPending
                          ? 'CHAUFFEUR PENDING'
                          : isAssigned
                          ? 'DRIVER ASSIGNED'
                          : isArrived
                          ? 'DRIVER ARRIVED'
                          : isStarted
                          ? 'IN PROGRESS'
                          : isCompleted
                          ? 'COMPLETED'
                          : res.status}
                      </Text>
                    </View>
                  </View>

                  {/* Scheduled Date/Time Badge */}
                  <View style={styles.dateBadgeRow}>
                    <Ionicons name="time" size={14} color={COLORS.primary} />
                    <Text style={styles.dateBadgeText}>
                      {res.pickup_date} at {res.pickup_time}
                    </Text>
                  </View>

                  {/* Route */}
                  <View style={styles.routeBox}>
                    <View style={styles.routeRow}>
                      <View style={styles.dotPickup} />
                      <Text style={styles.routeText} numberOfLines={1}>
                        {res.pickup_location}
                      </Text>
                    </View>
                    <View style={styles.routeRow}>
                      <View style={styles.squareDrop} />
                      <Text style={styles.routeText} numberOfLines={1}>
                        {res.drop_location}
                      </Text>
                    </View>
                  </View>

                  {/* Driver Section or Pending Notice */}
                  {res.driver ? (
                    <View style={styles.driverSection}>
                      <View style={styles.driverInfoLeft}>
                        <View style={styles.driverIcon}>
                          <Ionicons name="person" size={16} color={COLORS.primary} />
                        </View>
                        <View>
                          <Text style={styles.driverName}>{res.driver.name}</Text>
                          <Text style={styles.driverVehicle}>
                            {res.driver.vehicle?.vehicle_number} • {res.driver.vehicle?.vehicle_model || res.vehicle_type}
                          </Text>
                        </View>
                      </View>

                      {/* Prominent OTP display */}
                      <View style={styles.otpBadgeSmall}>
                        <Text style={styles.otpLabelSmall}>START OTP</Text>
                        <Text style={styles.otpValueSmall}>{res.otp || '4826'}</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.pendingNotice}>
                      <Ionicons name="time-outline" size={14} color={COLORS.warning} />
                      <Text style={styles.pendingNoticeText}>
                        Chauffeur assignment in progress for {res.pickup_time}.
                      </Text>
                    </View>
                  )}

                  {/* Bottom Fare & Action Row */}
                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.fareLabel}>Fixed Fare</Text>
                      <Text style={styles.fareAmount}>₹{res.fare.toLocaleString()}</Text>
                    </View>

                    <View style={styles.viewDetailsRow}>
                      <Text style={styles.viewDetailsText}>View Details & OTP</Text>
                      <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
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
    paddingBottom: 8,
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 100,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
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
  },
  planRideBtn: {
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
  planRideBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  reservationsList: {
    gap: 14,
    paddingTop: 4,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tripIdWrap: {
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
  vehicleType: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusAssigned: {
    backgroundColor: COLORS.primaryLight,
  },
  statusActive: {
    backgroundColor: '#EEF2FF',
  },
  statusSuccess: {
    backgroundColor: COLORS.successLight,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusTextPending: {
    color: '#92400E',
  },
  statusTextAssigned: {
    color: COLORS.primary,
  },
  statusTextActive: {
    color: '#4F46E5',
  },
  statusTextSuccess: {
    color: COLORS.success,
  },
  dateBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  dateBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  routeBox: {
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 14,
    marginTop: 10,
    gap: 8,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dotPickup: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  squareDrop: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: COLORS.danger,
  },
  routeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  driverSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceAlt,
    padding: 10,
    borderRadius: 12,
    marginTop: 10,
  },
  driverInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  driverIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  driverVehicle: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  otpBadgeSmall: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    alignItems: 'center',
  },
  otpLabelSmall: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  otpValueSmall: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  pendingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningLight,
    padding: 10,
    borderRadius: 12,
    marginTop: 10,
    gap: 6,
  },
  pendingNoticeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  fareLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  fareAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
