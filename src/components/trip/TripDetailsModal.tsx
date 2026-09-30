import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Trip } from '../../types/database';
import { Colors, Shadows } from '../../theme/colors';
import { PickMiButton } from '../common/PickMiButton';
import { FreeMapView } from '../map/FreeMapView';
import { getTripRouteTitle } from '../../utils/routeFormatting';

interface TripDetailsModalProps {
  trip: Trip | null;
  visible: boolean;
  onClose: () => void;
  onRequestTrip: (tripId: string) => void;
  onAcceptTrip?: (tripId: string) => void;
  onRejectTrip?: (tripId: string) => void;
}

interface TariffDetails {
  ratePerKm: number;
  tollStatus: 'INCLUDED' | 'EXTRA' | 'NOT_APPLICABLE';
  tollAmount: number;
  tollNote: string;
  permitStatus: 'INCLUDED' | 'EXTRA' | 'NOT_APPLICABLE';
  permitNote: string;
  driverAllowance: number;
  driverAllowanceStatus: 'INCLUDED' | 'EXTRA' | 'NOT_APPLICABLE';
  driverAllowanceNote: string;
  extraKmRate: number;
}

const getTariffDetails = (trip: Trip): TariffDetails => {
  const isAirport =
    trip.trip_type === 'Airport Transfer' ||
    trip.pickup_location.toLowerCase().includes('airport') ||
    trip.drop_location.toLowerCase().includes('airport');
  const isOutstation = trip.trip_type === 'Outstation';

  // Base km rate based on vehicle
  const defaultRate =
    trip.vehicle_type === 'SUV' ? 22 : trip.vehicle_type === 'Hatchback' ? 14 : 18;
  const ratePerKm = trip.rate_per_km ?? defaultRate;
  const extraKmRate = trip.extra_km_rate ?? ratePerKm;

  // Toll
  const tollStatus: 'INCLUDED' | 'EXTRA' | 'NOT_APPLICABLE' =
    trip.toll_status ??
    (isAirport ? 'INCLUDED' : isOutstation ? 'EXTRA' : 'NOT_APPLICABLE');
  const tollAmount = trip.toll_estimate ?? (isAirport ? 120 : isOutstation ? 80 : 0);
  let tollNote = '';
  if (tollStatus === 'INCLUDED') {
    tollNote = tollAmount > 0 ? `₹${tollAmount} Included in Fare` : 'Included in Total Fare';
  } else if (tollStatus === 'EXTRA') {
    tollNote = 'Extra as per FASTag receipts';
  } else {
    tollNote = 'No tolls on this route';
  }

  // Permit
  const permitStatus: 'INCLUDED' | 'EXTRA' | 'NOT_APPLICABLE' =
    trip.permit_status ?? (isOutstation ? 'EXTRA' : 'INCLUDED');
  let permitNote = '';
  if (permitStatus === 'INCLUDED') {
    permitNote = 'State RTO Permit Included';
  } else if (permitStatus === 'EXTRA') {
    permitNote = 'Interstate Border Tax Extra (Customer Pay)';
  } else {
    permitNote = 'Intra-city (Not Applicable)';
  }

  // Driver Allowance / Bata
  const driverAllowance = trip.driver_allowance ?? (isOutstation ? 300 : 0);
  const driverAllowanceStatus: 'INCLUDED' | 'EXTRA' | 'NOT_APPLICABLE' =
    trip.driver_allowance_status ??
    (isOutstation ? 'INCLUDED' : 'NOT_APPLICABLE');
  let driverAllowanceNote = '';
  if (isOutstation) {
    driverAllowanceNote = `₹${driverAllowance}/Day Bata Included`;
  } else {
    driverAllowanceNote = 'Standard Fare (No Driver Bata)';
  }

  return {
    ratePerKm,
    tollStatus,
    tollAmount,
    tollNote,
    permitStatus,
    permitNote,
    driverAllowance,
    driverAllowanceStatus,
    driverAllowanceNote,
    extraKmRate,
  };
};

export const TripDetailsModal: React.FC<TripDetailsModalProps> = ({
  trip,
  visible,
  onClose,
  onRequestTrip,
  onAcceptTrip,
  onRejectTrip,
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  if (!trip) return null;

  const tariff = getTariffDetails(trip);
  // Customer details should only be shown once the trip is requested and assigned to the driver
  const showCustomerDetails = [
    'ASSIGNED',
    'ACCEPTED',
    'ON_THE_WAY',
    'ARRIVED',
    'STARTED',
    'COMPLETED',
  ].includes(trip.status);

  const handleRequestClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmRequest = () => {
    setShowConfirmDialog(false);
    onRequestTrip(trip.id);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {getTripRouteTitle(trip.pickup_location, trip.drop_location)}
            </Text>
            <Text style={styles.tripIdText}>{trip.trip_number}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{trip.status}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Map Preview of Route */}
          <View style={[styles.mapContainer, Shadows.sm]}>
            <FreeMapView
              pickupCoords={{ latitude: trip.pickup_latitude, longitude: trip.pickup_longitude }}
              dropCoords={{ latitude: trip.drop_latitude, longitude: trip.drop_longitude }}
              pickupLabel={trip.pickup_location}
              dropLabel={trip.drop_location}
              style={styles.miniMap}
            />
            <View style={styles.mapOverlayPill}>
              <Ionicons name="navigate-circle" size={16} color={Colors.primary} />
              <Text style={styles.mapOverlayText}>{trip.distance} Route Preview</Text>
            </View>
          </View>

          {/* Fare Card */}
          <View style={[styles.fareCard, Shadows.sm]}>
            <View>
              <Text style={styles.fareLabel}>Total Driver Fare</Text>
              <Text style={styles.fareSubtitle}>
                {tariff.tollStatus === 'INCLUDED'
                  ? 'Includes base fare & tolls'
                  : 'Base fare • Tolls & permit extra on actuals'}
              </Text>
            </View>
            <Text style={styles.fareAmount}>₹{trip.fare.toLocaleString('en-IN')}</Text>
          </View>

          {/* Dedicated Tariff Breakdown Card */}
          <View style={[styles.sectionCard, Shadows.sm]}>
            <View style={styles.tariffCardHeader}>
              <View style={styles.tariffIconBox}>
                <Ionicons name="receipt-outline" size={18} color={Colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.tariffSectionTitle}>Tariff Breakdown</Text>
                <Text style={styles.tariffSectionSubtitle}>Standard rates & trip inclusions</Text>
              </View>
              <View style={styles.tariffRatePill}>
                <Text style={styles.tariffRatePillText}>₹{tariff.ratePerKm}/km</Text>
              </View>
            </View>

            <View style={styles.tariffDivider} />

            {/* Row 1: Per Km Rate */}
            <View style={styles.tariffRow}>
              <View style={styles.tariffRowLeft}>
                <View style={[styles.tariffRowIconCircle, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="speedometer-outline" size={16} color={Colors.primary} />
                </View>
                <View style={styles.tariffRowTextGroup}>
                  <Text style={styles.tariffRowLabel}>Per Kilometer Rate</Text>
                  <Text style={styles.tariffRowSublabel}>{trip.vehicle_type} standard slab</Text>
                </View>
              </View>
              <Text style={styles.tariffRowValue}>₹{tariff.ratePerKm} / km</Text>
            </View>

            {/* Row 2: Toll Charges */}
            <View style={styles.tariffRow}>
              <View style={styles.tariffRowLeft}>
                <View style={[styles.tariffRowIconCircle, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="cash-outline" size={16} color="#D97706" />
                </View>
                <View style={styles.tariffRowTextGroup}>
                  <Text style={styles.tariffRowLabel}>Toll Charges</Text>
                  <Text style={styles.tariffRowSublabel}>{tariff.tollNote}</Text>
                </View>
              </View>
              <View
                style={[
                  styles.tariffBadge,
                  tariff.tollStatus === 'INCLUDED'
                    ? styles.badgeIncluded
                    : tariff.tollStatus === 'EXTRA'
                    ? styles.badgeExtra
                    : styles.badgeNil,
                ]}
              >
                <Ionicons
                  name={
                    tariff.tollStatus === 'INCLUDED'
                      ? 'checkmark-circle'
                      : tariff.tollStatus === 'EXTRA'
                      ? 'add-circle'
                      : 'remove-circle-outline'
                  }
                  size={12}
                  color={
                    tariff.tollStatus === 'INCLUDED'
                      ? Colors.success
                      : tariff.tollStatus === 'EXTRA'
                      ? '#D97706'
                      : Colors.textMuted
                  }
                />
                <Text
                  style={[
                    styles.tariffBadgeText,
                    {
                      color:
                        tariff.tollStatus === 'INCLUDED'
                          ? Colors.successDark
                          : tariff.tollStatus === 'EXTRA'
                          ? '#B45309'
                          : Colors.textMuted,
                    },
                  ]}
                >
                  {tariff.tollStatus === 'INCLUDED'
                    ? tariff.tollAmount > 0
                      ? `₹${tariff.tollAmount} Included`
                      : 'Included'
                    : tariff.tollStatus === 'EXTRA'
                    ? 'Extra'
                    : 'N/A'}
                </Text>
              </View>
            </View>

            {/* Row 3: State / RTO Permit */}
            <View style={styles.tariffRow}>
              <View style={styles.tariffRowLeft}>
                <View style={[styles.tariffRowIconCircle, { backgroundColor: '#F3E8FF' }]}>
                  <Ionicons name="shield-checkmark-outline" size={16} color="#9333EA" />
                </View>
                <View style={styles.tariffRowTextGroup}>
                  <Text style={styles.tariffRowLabel}>State / RTO Permit</Text>
                  <Text style={styles.tariffRowSublabel}>{tariff.permitNote}</Text>
                </View>
              </View>
              <View
                style={[
                  styles.tariffBadge,
                  tariff.permitStatus === 'INCLUDED'
                    ? styles.badgeIncluded
                    : tariff.permitStatus === 'EXTRA'
                    ? styles.badgeExtra
                    : styles.badgeNil,
                ]}
              >
                <Ionicons
                  name={
                    tariff.permitStatus === 'INCLUDED'
                      ? 'checkmark-circle'
                      : tariff.permitStatus === 'EXTRA'
                      ? 'alert-circle'
                      : 'remove-circle-outline'
                  }
                  size={12}
                  color={
                    tariff.permitStatus === 'INCLUDED'
                      ? Colors.success
                      : tariff.permitStatus === 'EXTRA'
                      ? '#D97706'
                      : Colors.textMuted
                  }
                />
                <Text
                  style={[
                    styles.tariffBadgeText,
                    {
                      color:
                        tariff.permitStatus === 'INCLUDED'
                          ? Colors.successDark
                          : tariff.permitStatus === 'EXTRA'
                          ? '#B45309'
                          : Colors.textMuted,
                    },
                  ]}
                >
                  {tariff.permitStatus === 'INCLUDED'
                    ? 'Included'
                    : tariff.permitStatus === 'EXTRA'
                    ? 'Extra'
                    : 'N/A'}
                </Text>
              </View>
            </View>

            {/* Row 4: Driver Allowance / Bata */}
            <View style={styles.tariffRow}>
              <View style={styles.tariffRowLeft}>
                <View style={[styles.tariffRowIconCircle, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="wallet-outline" size={16} color="#059669" />
                </View>
                <View style={styles.tariffRowTextGroup}>
                  <Text style={styles.tariffRowLabel}>Driver Allowance (Bata)</Text>
                  <Text style={styles.tariffRowSublabel}>{tariff.driverAllowanceNote}</Text>
                </View>
              </View>
              <View
                style={[
                  styles.tariffBadge,
                  tariff.driverAllowanceStatus === 'INCLUDED'
                    ? styles.badgeIncluded
                    : styles.badgeNil,
                ]}
              >
                <Ionicons
                  name={
                    tariff.driverAllowanceStatus === 'INCLUDED'
                      ? 'checkmark-circle'
                      : 'remove-circle-outline'
                  }
                  size={12}
                  color={
                    tariff.driverAllowanceStatus === 'INCLUDED'
                      ? Colors.success
                      : Colors.textMuted
                  }
                />
                <Text
                  style={[
                    styles.tariffBadgeText,
                    {
                      color:
                        tariff.driverAllowanceStatus === 'INCLUDED'
                          ? Colors.successDark
                          : Colors.textMuted,
                    },
                  ]}
                >
                  {tariff.driverAllowanceStatus === 'INCLUDED'
                    ? tariff.driverAllowance > 0
                      ? `₹${tariff.driverAllowance} Included`
                      : 'Included'
                    : 'N/A'}
                </Text>
              </View>
            </View>

            {/* Row 5: Extra Km Charge Rate */}
            <View style={[styles.tariffRow, { borderBottomWidth: 0 }]}>
              <View style={styles.tariffRowLeft}>
                <View style={[styles.tariffRowIconCircle, { backgroundColor: '#FEF2F2' }]}>
                  <Ionicons name="add-circle-outline" size={16} color="#EF4444" />
                </View>
                <View style={styles.tariffRowTextGroup}>
                  <Text style={styles.tariffRowLabel}>Extra Km Charge</Text>
                  <Text style={styles.tariffRowSublabel}>Applied after booked distance</Text>
                </View>
              </View>
              <Text style={styles.tariffRowValue}>₹{tariff.extraKmRate} / km</Text>
            </View>

            {/* Tariff Footnote */}
            <View style={styles.tariffFooterNote}>
              <Ionicons name="information-circle-outline" size={15} color={Colors.textMuted} />
              <Text style={styles.tariffFooterNoteText}>
                {tariff.tollStatus === 'EXTRA' || tariff.permitStatus === 'EXTRA'
                  ? 'Extra toll & permit charges incurred during the trip are added to the final customer bill at actuals.'
                  : 'Tolls & permits on standard routes are included. Any deviations are billable at actuals.'}
              </Text>
            </View>
          </View>

          {/* Route Section */}
          <View style={[styles.sectionCard, Shadows.sm]}>
            <Text style={styles.sectionTitle}>Route Information</Text>

            <View style={styles.routeRow}>
              <View style={styles.timeline}>
                <View style={[styles.dot, styles.dotPickup]} />
                <View style={styles.line} />
                <View style={[styles.dot, styles.dotDrop]} />
              </View>

              <View style={styles.locationsContainer}>
                <View style={styles.locBlock}>
                  <Text style={styles.locType}>PICKUP LOCATION</Text>
                  <Text style={styles.locAddress}>{trip.pickup_location}</Text>
                </View>

                <View style={[styles.locBlock, { marginTop: 16 }]}>
                  <Text style={styles.locType}>DROP LOCATION</Text>
                  <Text style={styles.locAddress}>{trip.drop_location}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Trip Specifications */}
          <View style={[styles.sectionCard, Shadows.sm]}>
            <Text style={styles.sectionTitle}>Trip Specifications</Text>

            <View style={styles.specsGrid}>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Date</Text>
                <Text style={styles.specValue}>{trip.pickup_date}</Text>
              </View>

              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Pickup Time</Text>
                <Text style={styles.specValue}>{trip.pickup_time}</Text>
              </View>

              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Distance</Text>
                <Text style={styles.specValue}>{trip.distance}</Text>
              </View>

              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Vehicle Required</Text>
                <Text style={styles.specValue}>{trip.vehicle_type}</Text>
              </View>

              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Trip Category</Text>
                <Text style={styles.specValue}>{trip.trip_type || 'One-way'}</Text>
              </View>

              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Payment Mode</Text>
                <Text style={styles.specValue}>{trip.payment_method || 'Online'}</Text>
              </View>
            </View>

            {trip.additional_notes && (
              <View style={styles.notesBox}>
                <Ionicons name="information-circle" size={18} color={Colors.primary} />
                <Text style={styles.notesText}>{trip.additional_notes}</Text>
              </View>
            )}
          </View>

          {/* Customer Details - Only revealed once trip is requested and assigned/accepted */}
          {showCustomerDetails && (
            <View style={[styles.sectionCard, Shadows.sm]}>
              <Text style={styles.sectionTitle}>Customer Details</Text>
              <View style={styles.customerRow}>
                <View style={styles.customerAvatar}>
                  <Ionicons name="person" size={20} color={Colors.primary} />
                </View>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{trip.customer_name}</Text>
                  <Text style={styles.customerPhone}>{trip.customer_phone}</Text>
                </View>

                <TouchableOpacity
                  style={styles.callIconBtn}
                  onPress={() => Alert.alert('Customer Contact', `Calling ${trip.customer_phone}`)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="call" size={18} color={Colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom CTA */}
        <View style={[styles.bottomBar, Shadows.bottomSheet]}>
          {trip.status === 'AVAILABLE' && (
            <PickMiButton
              title="Request This Trip"
              onPress={handleRequestClick}
              variant="primary"
              size="lg"
              leftIcon={<Ionicons name="hand-right" size={20} color={Colors.white} />}
            />
          )}

          {trip.status === 'REQUESTED' && (
            <View style={styles.requestedStatusBox}>
              <Ionicons name="hourglass" size={20} color={Colors.warningDark} />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.requestedStatusTitle}>Trip Request Sent</Text>
                <Text style={styles.requestedStatusDesc}>
                  Waiting for dispatch assignment...
                </Text>
              </View>
            </View>
          )}

          {trip.status === 'ASSIGNED' && (
            <View>
              <View style={styles.assignedStatusBox}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.successDark} />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.assignedStatusTitle}>Trip Assigned to You</Text>
                  <Text style={styles.assignedStatusDesc}>
                    Confirmed by dispatch • Ready for passenger pickup
                  </Text>
                </View>
              </View>
              <PickMiButton
                title="Close Details"
                onPress={onClose}
                variant="primary"
                size="lg"
                style={{ marginTop: 10 }}
              />
            </View>
          )}

          {trip.status === 'COMPLETED' && (
            <PickMiButton
              title="Close Details"
              onPress={onClose}
              variant="secondary"
              size="lg"
            />
          )}
        </View>

        {/* Confirmation Dialog Modal */}
        <Modal
          visible={showConfirmDialog}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowConfirmDialog(false)}
        >
          <View style={styles.dialogOverlay}>
            <View style={[styles.dialogCard, Shadows.lg]}>
              <View style={styles.dialogIcon}>
                <Ionicons name="help-circle" size={36} color={Colors.primary} />
              </View>
              <Text style={styles.dialogTitle}>Request Trip?</Text>
              <Text style={styles.dialogMessage}>
                Are you sure you want to request this trip?
              </Text>
              <Text style={styles.dialogTripRoute}>
                {getTripRouteTitle(trip.pickup_location, trip.drop_location)}
              </Text>

              <View style={styles.dialogBtnRow}>
                <TouchableOpacity
                  style={styles.dialogCancelBtn}
                  onPress={() => setShowConfirmDialog(false)}
                >
                  <Text style={styles.dialogCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dialogConfirmBtn}
                  onPress={handleConfirmRequest}
                >
                  <Text style={styles.dialogConfirmText}>Request Trip</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
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
    paddingTop: 50,
    paddingBottom: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  tripIdText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  mapContainer: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    marginBottom: 14,
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  miniMap: {
    flex: 1,
  },
  mapOverlayPill: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mapOverlayText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginLeft: 6,
  },
  fareCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#C7D9FD',
  },
  fareLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  fareSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  fareAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.primary,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  routeRow: {
    flexDirection: 'row',
  },
  timeline: {
    alignItems: 'center',
    marginRight: 12,
    marginTop: 4,
    height: 70,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotPickup: {
    backgroundColor: Colors.success,
  },
  dotDrop: {
    backgroundColor: Colors.danger,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  locationsContainer: {
    flex: 1,
  },
  locBlock: {},
  locType: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  locAddress: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
    lineHeight: 19,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 14,
  },
  specItem: {
    width: '50%',
  },
  specLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  specValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  customerPhone: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  callIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tariffCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tariffIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tariffSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  tariffSectionSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  tariffRatePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  tariffRatePillText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  tariffDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginBottom: 6,
  },
  tariffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  tariffRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  tariffRowIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  tariffRowTextGroup: {
    flex: 1,
  },
  tariffRowLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  tariffRowSublabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  tariffRowValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  tariffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  badgeIncluded: {
    backgroundColor: Colors.successLight,
  },
  badgeExtra: {
    backgroundColor: '#FEF3C7',
  },
  badgeNil: {
    backgroundColor: '#F3F4F6',
  },
  tariffBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tariffFooterNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    gap: 6,
  },
  tariffFooterNoteText: {
    flex: 1,
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  notesText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 8,
    flex: 1,
    lineHeight: 17,
  },
  bottomBar: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  requestedStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningLight,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  requestedStatusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.warningDark,
  },
  requestedStatusDesc: {
    fontSize: 12,
    color: Colors.warningDark,
    marginTop: 1,
  },
  assignedStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  assignedStatusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.successDark,
  },
  assignedStatusDesc: {
    fontSize: 12,
    color: Colors.successDark,
    marginTop: 1,
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialogCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  dialogIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  dialogMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  dialogTripRoute: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 8,
    marginBottom: 20,
  },
  dialogBtnRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  dialogCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  dialogConfirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
});
