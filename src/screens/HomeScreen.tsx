import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../theme/colors';
import { PickMiHeader } from '../components/common/PickMiHeader';
import { OnlineToggle } from '../components/home/OnlineToggle';
import { HomeTripCard } from '../components/home/HomeTripCard';
import { ActiveTripSheet } from '../components/trip/ActiveTripSheet';
import { TripCompletedModal } from '../components/trip/TripCompletedModal';
import { DriverVerificationModal } from '../components/compliance/DriverVerificationModal';
import { useAuth } from '../context/AuthContext';
import { useTrips } from '../context/TripContext';
import { useWallet } from '../context/WalletContext';
import { Trip } from '../types/database';

interface HomeScreenProps {
  onNavigateToTrips: () => void;
  onNavigateToNotifications?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToTrips,
  onNavigateToNotifications,
}) => {
  const {
    driver,
    isVerified,
    verificationStatus,
    rejectionReason,
    verifiedDocsCount,
    totalDocsCount,
  } = useAuth();
  const {
    activeTrip,
    activeTrips,
    availableTrips,
    acceptTrip,
    rejectTrip,
    advanceTripStatus,
    completedTripForModal,
    setCompletedTripForModal,
  } = useTrips();
  const { wallet } = useWallet();

  const [showActiveSheet, setShowActiveSheet] = useState(false);
  const [selectedActiveTrip, setSelectedActiveTrip] = useState<Trip | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const currentSheetTrip = selectedActiveTrip || activeTrip || (activeTrips && activeTrips[0]) || null;

  return (
    <View style={styles.container}>
      {/* Apple Style Top Header without bottom line and without avatar */}
      <PickMiHeader onNotificationPress={onNavigateToNotifications} />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Compliance Verification Banner if unverified */}
        {!isVerified && (
          <TouchableOpacity
            style={[
              styles.verificationBanner,
              verificationStatus === 'REJECTED'
                ? styles.bannerDanger
                : styles.bannerWarning,
            ]}
            onPress={() => setShowVerificationModal(true)}
            activeOpacity={0.88}
          >
            <View
              style={[
                styles.bannerIconBox,
                verificationStatus === 'REJECTED'
                  ? styles.bannerIconDanger
                  : styles.bannerIconWarning,
              ]}
            >
              <Ionicons
                name={
                  verificationStatus === 'REJECTED'
                    ? 'alert-circle'
                    : 'hourglass-outline'
                }
                size={20}
                color={
                  verificationStatus === 'REJECTED' ? '#DC2626' : '#D97706'
                }
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.bannerTitle,
                  {
                    color:
                      verificationStatus === 'REJECTED'
                        ? '#B91C1C'
                        : '#92400E',
                  },
                ]}
              >
                {verificationStatus === 'REJECTED'
                  ? 'Document Action Required'
                  : 'Document & Vehicle Under Review'}
              </Text>
              <Text style={styles.bannerSubtitle}>
                {verificationStatus === 'REJECTED'
                  ? rejectionReason || 'Tap to inspect rejected document details'
                  : `${verifiedDocsCount}/${totalDocsCount} approved • Tap to view compliance checklist`}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}

        {/* Effective Apple Style Online / Offline Status Card */}
        <OnlineToggle />

        {/* Current Active Trip(s) Card or Multi-trip Horizontal Carousel */}
        <View style={styles.tripCardContainer}>
          <HomeTripCard
            onViewTrip={(trip) => {
              if (trip) {
                setSelectedActiveTrip(trip);
                setShowActiveSheet(true);
              } else if (activeTrip) {
                setSelectedActiveTrip(activeTrip);
                setShowActiveSheet(true);
              } else {
                onNavigateToTrips();
              }
            }}
          />
        </View>

        {/* Driver Performance Stats: Clean Apple Widget Grid without Title/Date header */}
        <View style={styles.statsGrid}>
          {/* Today's Earnings */}
          <View style={[styles.statWidget, Shadows.sm]}>
            <View style={styles.statWidgetHeader}>
              <View style={[styles.statIconBox, { backgroundColor: Colors.successLight }]}>
                <Ionicons name="wallet-outline" size={18} color={Colors.successDark} />
              </View>
              <Text style={styles.trendBadge}>+14%</Text>
            </View>
            <Text style={styles.statLabel}>Today's Earnings</Text>
            <Text style={styles.statValue}>
              ₹{wallet.today_earnings.toLocaleString('en-IN')}
            </Text>
          </View>

          {/* Trips Completed */}
          <View style={[styles.statWidget, Shadows.sm]}>
            <View style={styles.statWidgetHeader}>
              <View style={[styles.statIconBox, { backgroundColor: Colors.primaryLight }]}>
                <Ionicons name="checkmark-done" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.statSubText}>Goal: 5</Text>
            </View>
            <Text style={styles.statLabel}>Completed Trips</Text>
            <Text style={styles.statValue}>3 Trips</Text>
          </View>

          {/* Online Hours */}
          <View style={[styles.statWidget, Shadows.sm]}>
            <View style={styles.statWidgetHeader}>
              <View style={[styles.statIconBox, { backgroundColor: '#F0EFFF' }]}>
                <Ionicons name="time-outline" size={18} color="#5856D6" />
              </View>
              <Text style={styles.statSubText}>Active</Text>
            </View>
            <Text style={styles.statLabel}>Hours Online</Text>
            <Text style={styles.statValue}>4.5 hrs</Text>
          </View>

          {/* Rating */}
          <View style={[styles.statWidget, Shadows.sm]}>
            <View style={styles.statWidgetHeader}>
              <View style={[styles.statIconBox, { backgroundColor: Colors.warningLight }]}>
                <Ionicons name="star" size={18} color={Colors.warningDark} />
              </View>
              <Text style={styles.statSubText}>Top 5%</Text>
            </View>
            <Text style={styles.statLabel}>Driver Rating</Text>
            <Text style={styles.statValue}>{driver.rating || 4.92} ★</Text>
          </View>
        </View>

        {/* ─── Available Trips Card — Clean Count Only ─── */}
        <TouchableOpacity
          style={[styles.availableCard, Shadows.md]}
          onPress={() => {
            if (!isVerified) {
              setShowVerificationModal(true);
            } else {
              onNavigateToTrips();
            }
          }}
          activeOpacity={0.85}
        >
          {/* Left: Icon + Label */}
          <View style={styles.availableCardLeft}>
            <View style={styles.availableIconBox}>
              <Ionicons name="car-sport-outline" size={22} color="#0043DC" />
              <View style={styles.radarPulseDot} />
            </View>
            <View>
              <Text style={styles.availableCardTitle}>Available Trips</Text>
              <Text style={styles.availableCardSubtitle}>
                {!isVerified ? 'Verification required' : 'Tap to view & accept'}
              </Text>
            </View>
          </View>

          {/* Right: Big Count Bubble */}
          <View style={[
            styles.countBubble,
            availableTrips.length === 0 && styles.countBubbleEmpty,
          ]}>
            <Text style={[
              styles.countNumber,
              availableTrips.length === 0 && styles.countNumberEmpty,
            ]}>
              {availableTrips.length}
            </Text>
            <Text style={[
              styles.countLabel,
              availableTrips.length === 0 && styles.countLabelEmpty,
            ]}>
              {availableTrips.length === 1 ? 'Trip' : 'Trips'}
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Active Trip Full Screen Sheet */}
      {currentSheetTrip && (
        <Modal
          visible={showActiveSheet}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowActiveSheet(false)}
        >
          <ActiveTripSheet
            trip={currentSheetTrip}
            onAccept={(id) => acceptTrip(id)}
            onReject={(id) => {
              rejectTrip(id);
              setShowActiveSheet(false);
            }}
            onAdvanceStatus={(id, status, extraData) => {
              advanceTripStatus(id, status, extraData);
              if (status === 'COMPLETED') {
                setShowActiveSheet(false);
                setSelectedActiveTrip(null);
                setCompletedTripForModal(null);
              }
            }}
            onClose={() => {
              setShowActiveSheet(false);
              setSelectedActiveTrip(null);
            }}
          />
        </Modal>
      )}

      {/* Trip Completed Success Modal */}
      <TripCompletedModal
        trip={completedTripForModal}
        visible={Boolean(completedTripForModal)}
        onBackToHome={() => setCompletedTripForModal(null)}
      />

      {/* Driver Compliance Verification Modal */}
      <DriverVerificationModal
        visible={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 4,
    paddingBottom: 32,
  },
  tripCardContainer: {
    marginBottom: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 4,
    marginBottom: 16,
  },
  statWidget: {
    width: '48.3%',
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  statWidgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.successDark,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statSubText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  // ─── Available Trips Card Styles ───
  availableCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  availableCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  availableIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  radarPulseDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  availableCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  availableCardSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  countBubble: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#0043DC',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0043DC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  countBubbleEmpty: {
    backgroundColor: '#F1F5F9',
    shadowOpacity: 0,
    elevation: 0,
  },
  countNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 26,
    letterSpacing: -0.5,
  },
  countNumberEmpty: {
    color: '#94A3B8',
  },
  countLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.2,
  },
  countLabelEmpty: {
    color: '#94A3B8',
  },
  verificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 4,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  bannerWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  bannerDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  bannerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerIconWarning: {
    backgroundColor: '#FEF3C7',
  },
  bannerIconDanger: {
    backgroundColor: '#FEE2E2',
  },
  bannerTitle: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  bannerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
});

