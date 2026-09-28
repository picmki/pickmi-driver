import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Trip } from '../types/database';
import { Colors, Shadows } from '../theme/colors';
import { PickMiButton } from '../components/common/PickMiButton';

interface TripHistoryScreenProps {
  trips: Trip[];
  onBack: () => void;
}

export const TripHistoryScreen: React.FC<TripHistoryScreenProps> = ({ trips, onBack }) => {
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  // ==========================================
  // VIEW 2: FULL TRIP DETAILS & BILL PAGE
  // ==========================================
  if (selectedTrip) {
    const extraKm = selectedTrip.extra_km || 0;
    const extraKmCharges = selectedTrip.extra_km_charges || extraKm * 18;
    const tollCharges = selectedTrip.toll_charges || 0;
    const parkingCharges = selectedTrip.parking_charges || 0;
    const totalFare = selectedTrip.total_fare || selectedTrip.fare;

    return (
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedTrip(null)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Trip Details & Bill</Text>
            <Text style={styles.headerSubtitle}>{selectedTrip.trip_number} • Completed</Text>
          </View>
          <View style={styles.statusPill}>
            <Ionicons name="checkmark-circle" size={13} color={Colors.successDark} />
            <Text style={styles.statusPillText}>Completed</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Bill Generated Card */}
          <View style={[styles.billSummaryCard, Shadows.md]}>
            <View style={styles.cashIconCircle}>
              <Ionicons name="receipt" size={32} color={Colors.white} />
            </View>
            <Text style={styles.billCardLabel}>TOTAL BILL GENERATED</Text>
            <Text style={styles.billCardAmount}>₹{totalFare.toLocaleString('en-IN')}</Text>
            <View style={styles.cashPill}>
              <Ionicons name="cash" size={14} color={Colors.white} />
              <Text style={styles.cashPillText}>Cash Collected from Customer</Text>
            </View>
          </View>

          {/* Itemized Fare Breakdown */}
          <View style={[styles.cardBlock, Shadows.sm, { marginTop: 16 }]}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="calculator-outline" size={18} color={Colors.primary} />
              <Text style={styles.cardSectionTitle}>FARE BREAKDOWN</Text>
            </View>

            <View style={styles.fareItemRow}>
              <Text style={styles.fareItemLabel}>Base Ride Fare</Text>
              <Text style={styles.fareItemVal}>₹{selectedTrip.fare.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.fareItemRow}>
              <Text style={styles.fareItemLabel}>
                Extra Kilometers ({extraKm} km @ ₹18/km)
              </Text>
              <Text style={styles.fareItemVal}>₹{extraKmCharges.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.fareItemRow}>
              <Text style={styles.fareItemLabel}>Toll Charges</Text>
              <Text style={styles.fareItemVal}>₹{tollCharges.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.fareItemRow}>
              <Text style={styles.fareItemLabel}>Parking Charges</Text>
              <Text style={styles.fareItemVal}>₹{parkingCharges.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.innerDivider} />

            <View style={styles.fareTotalRow}>
              <View>
                <Text style={styles.fareTotalLabel}>Total Cash Amount</Text>
                <Text style={styles.paymentMethodText}>Payment Mode: CASH</Text>
              </View>
              <Text style={styles.fareTotalVal}>₹{totalFare.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          {/* Customer & Route Details (NO mobile number shown as requested) */}
          <View style={[styles.cardBlock, Shadows.sm, { marginTop: 14 }]}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
              <Text style={styles.cardSectionTitle}>RIDE & CUSTOMER DETAILS</Text>
            </View>

            {/* Customer Name */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Customer Name:</Text>
              <Text style={styles.detailValueBold}>{selectedTrip.customer_name}</Text>
            </View>

            {/* Privacy protected note */}
            <View style={styles.privacyNoteRow}>
              <Ionicons name="shield-checkmark" size={13} color={Colors.primary} />
              <Text style={styles.privacyNoteText}>Customer phone number hidden for privacy protection</Text>
            </View>

            <View style={styles.innerDivider} />

            {/* Pickup & Drop */}
            <View style={styles.routeBox}>
              <View style={styles.routeTimeline}>
                <View style={[styles.routeDot, { backgroundColor: Colors.successDark }]} />
                <View style={styles.routeLine} />
                <View style={[styles.routeDot, { backgroundColor: Colors.danger }]} />
              </View>
              <View style={styles.routeTexts}>
                <View>
                  <Text style={styles.routeMicroLabel}>PICKUP LOCATION</Text>
                  <Text style={styles.routeAddressText}>{selectedTrip.pickup_location}</Text>
                </View>
                <View style={{ marginTop: 14 }}>
                  <Text style={styles.routeMicroLabel}>DROP DESTINATION</Text>
                  <Text style={styles.routeAddressText}>{selectedTrip.drop_location}</Text>
                </View>
              </View>
            </View>

            <View style={styles.innerDivider} />

            {/* Metrics */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.metricVal}>{selectedTrip.pickup_date}</Text>
                <Text style={styles.metricSub}>{selectedTrip.pickup_time}</Text>
              </View>

              <View style={styles.metricCard}>
                <Ionicons name="speedometer-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.metricVal}>{selectedTrip.distance || '18 km'}</Text>
                <Text style={styles.metricSub}>Distance</Text>
              </View>

              <View style={styles.metricCard}>
                <Ionicons name="car-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.metricVal}>{selectedTrip.vehicle_type || 'Sedan'}</Text>
                <Text style={styles.metricSub}>Vehicle</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, Shadows.bottomSheet]}>
          <PickMiButton
            title="Back to Trip History"
            onPress={() => setSelectedTrip(null)}
            variant="secondary"
            size="lg"
            leftIcon={<Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />}
          />
        </View>
      </View>
    );
  }

  // ==========================================
  // VIEW 1: COMPLETED TRIPS LIST PAGE
  // ==========================================
  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Trip History</Text>
          <Text style={styles.headerSubtitle}>{trips.length} Completed Rides</Text>
        </View>
        <View style={styles.tripCountBadge}>
          <Text style={styles.tripCountText}>{trips.length}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {trips.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="time-outline" size={44} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No Completed Trips Yet</Text>
            <Text style={styles.emptySubtitle}>
              Trips you complete will appear here with full bill breakdowns and route receipts.
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {trips.map((item, index) => {
              const totalFare = item.total_fare || item.fare;
              const hasExtras =
                (item.extra_km ?? 0) > 0 ||
                (item.toll_charges ?? 0) > 0 ||
                (item.parking_charges ?? 0) > 0;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.tripItemCard, Shadows.sm]}
                  onPress={() => setSelectedTrip(item)}
                  activeOpacity={0.8}
                >
                  {/* Card Header Row */}
                  <View style={styles.tripItemHeader}>
                    <View style={styles.tripItemNumberGroup}>
                      <View style={styles.indexCircle}>
                        <Text style={styles.indexText}>{index + 1}</Text>
                      </View>
                      <View>
                        <Text style={styles.tripNumberText}>{item.trip_number}</Text>
                        <Text style={styles.tripDateText}>
                          {item.pickup_date} • {item.completed_at || item.pickup_time}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.tripItemRight}>
                      <Text style={styles.tripFareText}>₹{totalFare.toLocaleString('en-IN')}</Text>
                      <View style={styles.statusPillSmall}>
                        <Ionicons name="checkmark-circle" size={11} color={Colors.successDark} />
                        <Text style={styles.statusPillSmallText}>Completed</Text>
                      </View>
                    </View>
                  </View>

                  {/* Customer name (no phone number) */}
                  <View style={styles.tripCustomerRow}>
                    <Ionicons name="person" size={14} color={Colors.primary} />
                    <Text style={styles.tripCustomerName}>{item.customer_name}</Text>
                  </View>

                  {/* Route Timeline */}
                  <View style={styles.routeItemBox}>
                    <View style={styles.routeItemLineCol}>
                      <View style={[styles.routeItemDot, { backgroundColor: Colors.successDark }]} />
                      <View style={styles.routeItemLine} />
                      <View style={[styles.routeItemDot, { backgroundColor: Colors.danger }]} />
                    </View>
                    <View style={styles.routeItemTextsCol}>
                      <Text style={styles.routeItemLocText} numberOfLines={1}>
                        {item.pickup_location}
                      </Text>
                      <Text style={[styles.routeItemLocText, { marginTop: 8 }]} numberOfLines={1}>
                        {item.drop_location}
                      </Text>
                    </View>
                  </View>

                  {/* Extras Tags if extra km or toll */}
                  {hasExtras && (
                    <View style={styles.extrasTagsRow}>
                      {(item.extra_km ?? 0) > 0 && (
                        <View style={styles.extraTagPill}>
                          <Text style={styles.extraTagText}>+{item.extra_km} km extra</Text>
                        </View>
                      )}
                      {(item.toll_charges ?? 0) > 0 && (
                        <View style={styles.extraTagPill}>
                          <Text style={styles.extraTagText}>Toll: ₹{item.toll_charges}</Text>
                        </View>
                      )}
                      {(item.parking_charges ?? 0) > 0 && (
                        <View style={styles.extraTagPill}>
                          <Text style={styles.extraTagText}>Parking: ₹{item.parking_charges}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* View Details Prompt */}
                  <View style={styles.cardFooterAction}>
                    <Text style={styles.cardFooterText}>Tap to view full bill & details</Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    paddingBottom: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  tripCountBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tripCountText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.successDark,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F0EFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  listContainer: {
    gap: 12,
  },
  tripItemCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  tripItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripItemNumberGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  indexCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  tripNumberText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  tripDateText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  tripItemRight: {
    alignItems: 'flex-end',
  },
  tripFareText: {
    fontSize: 17,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  statusPillSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
    marginTop: 3,
  },
  statusPillSmallText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.successDark,
  },
  tripCustomerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 10,
  },
  tripCustomerName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  routeItemBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  routeItemLineCol: {
    width: 14,
    alignItems: 'center',
  },
  routeItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routeItemLine: {
    width: 2,
    height: 18,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  routeItemTextsCol: {
    flex: 1,
    marginLeft: 8,
  },
  routeItemLocText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  extrasTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  extraTagPill: {
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  extraTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  cardFooterAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  cardFooterText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Detail View Styles
  billSummaryCard: {
    backgroundColor: '#0F172A',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
  },
  cashIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  billCardLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  billCardAmount: {
    fontSize: 38,
    fontWeight: '900',
    color: Colors.white,
    marginVertical: 6,
  },
  cashPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
  },
  cashPillText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
  },
  cardBlock: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  fareItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  fareItemLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  fareItemVal: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  innerDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 12,
  },
  fareTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fareTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  paymentMethodText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.successDark,
    marginTop: 2,
  },
  fareTotalVal: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.successDark,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  detailValueBold: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  privacyNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  privacyNoteText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  routeBox: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  routeTimeline: {
    width: 16,
    alignItems: 'center',
    paddingVertical: 4,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routeLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  routeTexts: {
    flex: 1,
    marginLeft: 10,
  },
  routeMicroLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  routeAddressText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricVal: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 4,
    textAlign: 'center',
  },
  metricSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
