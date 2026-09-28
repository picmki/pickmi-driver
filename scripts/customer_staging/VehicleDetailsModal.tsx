import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from './theme';
import type { VehicleOption } from './types';

interface VehicleDetailsModalProps {
  visible: boolean;
  vehicle: VehicleOption | null;
  fare: number;
  pickupLocation: string;
  dropLocation: string;
  travelDate: string;
  travelTime: string;
  onContinue: () => void;
  onClose: () => void;
}

export const VehicleDetailsModal: React.FC<VehicleDetailsModalProps> = ({
  visible,
  vehicle,
  fare,
  pickupLocation,
  dropLocation,
  travelDate,
  travelTime,
  onContinue,
  onClose,
}) => {
  if (!visible || !vehicle) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          <SafeAreaView>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={styles.vehicleName}>{vehicle.name}</Text>
                  {vehicle.tag && (
                    <View style={styles.tagBadge}>
                      <Text style={styles.tagText}>{vehicle.tag}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.vehicleModels}>{vehicle.models}</Text>
              </View>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              {/* Fare Banner */}
              <View style={styles.fareCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fareLabel}>Total Calculated Reservation Fare</Text>
                  <Text style={styles.fareAmount}>₹{fare.toLocaleString()}</Text>
                  <Text style={styles.fareSubtext}>Fixed package price • No surge during peak</Text>
                </View>
                <View style={styles.fareIconWrap}>
                  <Ionicons name="shield-checkmark" size={24} color={COLORS.primary} />
                </View>
              </View>

              {/* Capacity Specs */}
              <View style={styles.specsRow}>
                <View style={styles.specCard}>
                  <Ionicons name="people" size={18} color={COLORS.primary} />
                  <Text style={styles.specTitle}>Capacity</Text>
                  <Text style={styles.specValue}>{vehicle.seating}</Text>
                </View>
                <View style={styles.specCard}>
                  <Ionicons name="briefcase" size={18} color={COLORS.primary} />
                  <Text style={styles.specTitle}>Luggage</Text>
                  <Text style={styles.specValue}>{vehicle.luggage}</Text>
                </View>
                <View style={styles.specCard}>
                  <Ionicons name="speedometer" size={18} color={COLORS.primary} />
                  <Text style={styles.specTitle}>Extra KM</Text>
                  <Text style={styles.specValue}>₹{vehicle.ratePerKm}/km</Text>
                </View>
              </View>

              {/* Route Summary */}
              <View style={styles.routeCard}>
                <View style={styles.routeHeader}>
                  <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.routeDateText}>
                    {travelDate} • {travelTime}
                  </Text>
                </View>
                <View style={styles.routePoints}>
                  <View style={styles.pointRow}>
                    <Ionicons name="radio-button-on" size={14} color={COLORS.primary} />
                    <Text style={styles.pointText} numberOfLines={1}>
                      {pickupLocation}
                    </Text>
                  </View>
                  <View style={styles.pointLine} />
                  <View style={styles.pointRow}>
                    <Ionicons name="location" size={14} color={COLORS.danger} />
                    <Text style={styles.pointText} numberOfLines={1}>
                      {dropLocation}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Amenities */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Included Amenities & Features</Text>
                <View style={styles.amenitiesGrid}>
                  {vehicle.amenities.map((item, index) => (
                    <View key={index} style={styles.amenityItem}>
                      <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                      <Text style={styles.amenityText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* PickMi Quality Guarantee */}
              <View style={styles.guaranteeCard}>
                <Text style={styles.guaranteeTitle}>🛡️ PickMi Chauffeur Commitment</Text>
                <Text style={styles.guaranteeDesc}>
                  Your assigned chauffeur will arrive 10 minutes prior to scheduled pickup time. Chauffeur details and contact info will be updated in your Reservations tab.
                </Text>
              </View>
            </ScrollView>

            {/* Bottom CTA */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.continueBtn}
                onPress={onContinue}
                activeOpacity={0.88}
              >
                <Text style={styles.continueBtnText}>Continue to Reservation</Text>
                <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
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
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vehicleName: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
  },
  tagBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  vehicleModels: {
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
  fareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginTop: 14,
  },
  fareLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  fareAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: 2,
  },
  fareSubtext: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.success,
    marginTop: 2,
  },
  fareIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  specCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
  },
  specTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  specValue: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2,
  },
  routeCard: {
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginTop: 12,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    marginBottom: 8,
  },
  routeDateText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  routePoints: {
    gap: 4,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointLine: {
    width: 2,
    height: 10,
    backgroundColor: COLORS.border,
    marginLeft: 6,
  },
  pointText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  section: {
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 6,
  },
  amenityText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  guaranteeCard: {
    backgroundColor: COLORS.primaryLight,
    padding: 14,
    borderRadius: 16,
    marginTop: 14,
  },
  guaranteeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  guaranteeDesc: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  footer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  continueBtn: {
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOWS.md,
  },
  continueBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
});
