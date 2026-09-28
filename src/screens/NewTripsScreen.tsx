import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../theme/colors';
import { PickMiHeader } from '../components/common/PickMiHeader';
import { TripCard } from '../components/trip/TripCard';
import { TripDetailsModal } from '../components/trip/TripDetailsModal';
import { TripCompletedModal } from '../components/trip/TripCompletedModal';
import { DepositBlockerModal } from '../components/trip/DepositBlockerModal';
import { DriverVerificationModal } from '../components/compliance/DriverVerificationModal';
import { useTrips } from '../context/TripContext';
import { useAuth } from '../context/AuthContext';
import { Trip } from '../types/database';

export const NewTripsScreen: React.FC = () => {
  const {
    availableTrips,
    requestedTrips,
    assignedTrips,
    requestTrip,
    acceptTrip,
    rejectTrip,
    selectedTripForDetails,
    setSelectedTripForDetails,
    completedTripForModal,
    setCompletedTripForModal,
  } = useTrips();
  const { driver, isVerified } = useAuth();

  // Exactly 3 tabs as requested: available, requested, assigned (history removed)
  const [activeTab, setActiveTab] = useState<'available' | 'requested' | 'assigned'>('available');
  const [tripToConfirm, setTripToConfirm] = useState<Trip | null>(null);

  // Verification Blocker Modal State
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Security Deposit Blocker Modal State
  const [showDepositBlocker, setShowDepositBlocker] = useState(false);
  const [pendingTripAfterDeposit, setPendingTripAfterDeposit] = useState<Trip | null>(null);

  const getFilteredTrips = (): Trip[] => {
    switch (activeTab) {
      case 'available':
        return availableTrips;
      case 'requested':
        return requestedTrips;
      case 'assigned':
        return assignedTrips;
      default:
        return availableTrips;
    }
  };

  const tripsToDisplay = getFilteredTrips();

  const handleInitiateRequest = (trip: Trip) => {
    // 1. Check if Driver Documents & Vehicle are verified by Admin
    if (!isVerified) {
      setShowVerificationModal(true);
      return;
    }

    // 2. Check if ₹250 Security Deposit is paid
    if (driver.deposit_status !== 'PAID') {
      setPendingTripAfterDeposit(trip);
      setShowDepositBlocker(true);
      return;
    }
    setTripToConfirm(trip);
  };

  const handleConfirmRequest = () => {
    if (tripToConfirm) {
      requestTrip(tripToConfirm.id);
      setTripToConfirm(null);
      // Automatically navigate to Requested tab so driver immediately sees their request!
      setActiveTab('requested');
    }
  };

  const handleDepositSuccess = () => {
    setShowDepositBlocker(false);
    if (pendingTripAfterDeposit) {
      requestTrip(pendingTripAfterDeposit.id);
      setPendingTripAfterDeposit(null);
      setActiveTab('requested');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header: Clean title only on the left, NO logo and NO profile photo */}
      <PickMiHeader title="New Trips" showLogo={false} showAvatar={false} />

      {/* Apple iOS Native Style 3-Tab Segmented Control (Available, Requested, Assigned) */}
      <View style={styles.segmentedContainer}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentTab, activeTab === 'available' && styles.segmentTabActive]}
            onPress={() => setActiveTab('available')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, activeTab === 'available' && styles.segmentTextActive]}>
              Available ({availableTrips.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentTab, activeTab === 'requested' && styles.segmentTabActive]}
            onPress={() => setActiveTab('requested')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, activeTab === 'requested' && styles.segmentTextActive]}>
              Requested ({requestedTrips.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentTab, activeTab === 'assigned' && styles.segmentTabActive]}
            onPress={() => setActiveTab('assigned')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, activeTab === 'assigned' && styles.segmentTextActive]}>
              Assigned ({assignedTrips.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main List */}
      {tripsToDisplay.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Ionicons
              name={
                activeTab === 'available'
                  ? 'car-outline'
                  : activeTab === 'requested'
                  ? 'time-outline'
                  : 'checkmark-circle-outline'
              }
              size={32}
              color={Colors.primary}
            />
          </View>
          <Text style={styles.emptyTitle}>
            {activeTab === 'available' && 'No Available Trips'}
            {activeTab === 'requested' && 'No Pending Requests'}
            {activeTab === 'assigned' && 'No Assigned Trips'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'available' &&
              'Trips near Bangalore will show up here. Stay online to get instant alerts.'}
            {activeTab === 'requested' &&
              'Trips you request appear here while dispatch reviews them.'}
            {activeTab === 'assigned' &&
              'Trips assigned to you by dispatch will appear here.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={tripsToDisplay}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TripCard
              trip={item}
              onPress={() => setSelectedTripForDetails(item)}
              onRequest={() => handleInitiateRequest(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Confirmation Dialog for Requesting Trip directly from card */}
      {tripToConfirm && (
        <Modal
          visible={Boolean(tripToConfirm)}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setTripToConfirm(null)}
        >
          <View style={styles.dialogOverlay}>
            <View style={[styles.dialogCard, Shadows.lg]}>
              <View style={styles.dialogIcon}>
                <Ionicons name="car" size={32} color={Colors.primary} />
              </View>
              <Text style={styles.dialogTitle}>Request Trip?</Text>
              <Text style={styles.dialogMessage}>
                Are you sure you want to request this trip?
              </Text>
              <Text style={styles.dialogTripRoute}>
                {tripToConfirm.pickup_location.split(',')[0]} → {tripToConfirm.drop_location.split(',')[0]}
              </Text>
              <Text style={styles.dialogFare}>₹{tripToConfirm.fare.toLocaleString('en-IN')}</Text>

              <View style={styles.dialogBtnRow}>
                <TouchableOpacity
                  style={styles.dialogCancelBtn}
                  onPress={() => setTripToConfirm(null)}
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
      )}

      {/* Trip Details Modal */}
      <TripDetailsModal
        trip={selectedTripForDetails}
        visible={Boolean(selectedTripForDetails)}
        onClose={() => setSelectedTripForDetails(null)}
        onRequestTrip={(id) => {
          if (!isVerified) {
            setSelectedTripForDetails(null);
            setShowVerificationModal(true);
            return;
          }
          if (driver.deposit_status !== 'PAID') {
            const t = availableTrips.find((item) => item.id === id);
            setPendingTripAfterDeposit(t || null);
            setSelectedTripForDetails(null);
            setShowDepositBlocker(true);
            return;
          }
          requestTrip(id);
          setSelectedTripForDetails(null);
          setActiveTab('requested');
        }}
        onAcceptTrip={(id) => acceptTrip(id)}
        onRejectTrip={(id) => rejectTrip(id)}
      />

      {/* Trip Completed Modal */}
      <TripCompletedModal
        trip={completedTripForModal}
        visible={Boolean(completedTripForModal)}
        onBackToHome={() => setCompletedTripForModal(null)}
      />

      {/* ₹250 Security Deposit Blocker Modal */}
      <DepositBlockerModal
        visible={showDepositBlocker}
        onSuccessPay={handleDepositSuccess}
        onClose={() => {
          setShowDepositBlocker(false);
          setPendingTripAfterDeposit(null);
        }}
      />

      {/* Driver Compliance & Verification Modal */}
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
  segmentedContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.white,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 12,
    padding: 3,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  segmentTabActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  listContent: {
    paddingTop: 14,
    paddingBottom: 24,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  dialogMessage: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  dialogTripRoute: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  dialogFare: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.primary,
    marginTop: 4,
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
    borderRadius: 14,
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
    borderRadius: 14,
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
