import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../theme/colors';
import { useTrips } from '../../context/TripContext';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { usePermission } from '../../context/PermissionContext';
import { registerForRemotePushNotificationsAsync, sendTestRemotePushNotification } from '../../utils/pushNotifications';

export const DevFloatingPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'customer' | 'actions'>('customer');
  const [copiedOtp, setCopiedOtp] = useState(false);

  const { simulateAdminAssignment, createNewTrip, resetDemoData, trips, activeTrip, activeTrips } = useTrips();
  const { toggleOnlineStatus, driver, vehicle, resetToNewUserForTesting, toggleDepositStatusForTesting } = useAuth();
  const { addTripEarnings } = useWallet();
  const { isBlocked, resetPermissionsForTesting, requestAllPermissions } = usePermission();

  const requestedCount = trips.filter((t) => t.status === 'REQUESTED').length;
  const assignedCount = trips.filter((t) => t.status === 'ASSIGNED').length;

  const currentTrip = activeTrip || activeTrips[0] || trips.find((t) => t.status === 'ASSIGNED' || t.status === 'ARRIVED' || t.status === 'STARTED') || null;
  const liveOtp = currentTrip?.otp || '4821';

  const handleCopyOtp = () => {
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
    Alert.alert('OTP Copied', `Ride Start OTP: ${liveOtp}\nNow enter this in the Driver App to start the ride.`);
  };

  const handleTestRemotePush = async () => {
    try {
      const token = await registerForRemotePushNotificationsAsync(driver.id);
      if (!token) {
        Alert.alert(
          'Push Notification Notice',
          'Could not retrieve Expo Push Token on this device.\n\nNote: If testing inside Expo Go on Android, push notifications require a development build (`npx expo run:android`) or standalone APK.'
        );
        return;
      }
      Alert.alert(
        '🚀 Remote Push Scheduled!',
        'Push notification will trigger in 4 seconds.\n\n👉 PLEASE LOCK YOUR PHONE SCREEN OR MINIMIZE THE APP NOW to test background notification delivery!',
        [
          {
            text: 'OK, Testing Now',
            onPress: () => {
              setIsOpen(false);
              setTimeout(() => {
                sendTestRemotePushNotification(token);
              }, 4000);
            },
          },
        ]
      );
    } catch (e: any) {
      Alert.alert('Push Error', e?.message || 'Failed to dispatch push notification');
    }
  };

  return (
    <>
      {/* Floating Dev Tool Pill */}
      <TouchableOpacity
        style={[styles.floatingPill, Shadows.md]}
        onPress={() => {
          setIsOpen(true);
          if (currentTrip) {
            setActiveTab('customer');
          }
        }}
        activeOpacity={0.85}
      >
        <Ionicons name="construct" size={15} color={Colors.white} />
        <Text style={styles.pillText}>DEV TOOLS</Text>
        {currentTrip && (
          <View style={styles.badgeOtp}>
            <Text style={styles.badgeOtpText}>OTP: {liveOtp}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Dev Controls & Customer View Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.overlay}>
          <View style={[styles.panel, Shadows.lg]}>
            {/* Modal Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Ionicons name="phone-portrait-outline" size={22} color={Colors.primary} />
                <Text style={styles.title}>Dev & Customer Simulator</Text>
              </View>
              <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeIconBtn}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Segmented Tab Switcher */}
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'customer' && styles.tabButtonActive]}
                onPress={() => setActiveTab('customer')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="person"
                  size={15}
                  color={activeTab === 'customer' ? Colors.primary : Colors.textMuted}
                />
                <Text
                  style={[styles.tabButtonText, activeTab === 'customer' && styles.tabButtonTextActive]}
                >
                  Customer View (Rider)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'actions' && styles.tabButtonActive]}
                onPress={() => setActiveTab('actions')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="settings-outline"
                  size={15}
                  color={activeTab === 'actions' ? Colors.primary : Colors.textMuted}
                />
                <Text
                  style={[styles.tabButtonText, activeTab === 'actions' && styles.tabButtonTextActive]}
                >
                  Dev Actions
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea}>
              {/* TAB 1: CUSTOMER VIEW */}
              {activeTab === 'customer' && (
                <View style={styles.customerViewContainer}>
                  {currentTrip ? (
                    <View style={styles.riderPhoneCard}>
                      {/* Passenger App Simulation Header */}
                      <View style={styles.riderAppHeader}>
                        <View style={styles.riderBrand}>
                          <Text style={styles.riderBrandPick}>Pick</Text>
                          <Text style={styles.riderBrandMi}>Mi</Text>
                          <Text style={styles.riderBrandApp}>RIDER</Text>
                        </View>
                        <View style={styles.riderStatusBadge}>
                          <View style={styles.greenPulse} />
                          <Text style={styles.riderStatusText}>
                            {currentTrip.status === 'ARRIVED'
                              ? 'Driver Arrived'
                              : currentTrip.status === 'STARTED'
                              ? 'Trip In Progress'
                              : 'Driver Assigned'}
                          </Text>
                        </View>
                      </View>

                      {/* Prominent Ride Start OTP Card */}
                      <View style={styles.otpHeroBox}>
                        <Text style={styles.otpHeroLabel}>YOUR RIDE START OTP</Text>
                        <View style={styles.otpDigitsContainer}>
                          {liveOtp.split('').map((digit, idx) => (
                            <View key={idx} style={styles.otpDigitBlock}>
                              <Text style={styles.otpDigitHero}>{digit}</Text>
                            </View>
                          ))}
                        </View>
                        <Text style={styles.otpHeroInstructions}>
                          Share this 4-digit code with driver <Text style={{ fontWeight: '800' }}>{driver.name}</Text> upon boarding
                        </Text>

                        <TouchableOpacity
                          style={styles.copyOtpButton}
                          onPress={handleCopyOtp}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name={copiedOtp ? 'checkmark-circle' : 'copy-outline'}
                            size={16}
                            color={Colors.primary}
                          />
                          <Text style={styles.copyOtpText}>
                            {copiedOtp ? 'OTP Copied!' : 'Copy OTP to Clipboard'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Driver & Vehicle Assigned Details */}
                      <View style={styles.driverInfoCard}>
                        <View style={styles.driverAvatar}>
                          <Ionicons name="person" size={22} color={Colors.white} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.assignedDriverName}>{driver.name}</Text>
                          <Text style={styles.assignedVehicle}>
                            {vehicle?.vehicle_model || 'Dzire Sedan'} • {vehicle?.vehicle_number || 'KA 05 MN 4821'}
                          </Text>
                        </View>
                        <View style={styles.ratingBadge}>
                          <Ionicons name="star" size={12} color="#D97706" />
                          <Text style={styles.ratingText}>{driver.rating || 4.92}</Text>
                        </View>
                      </View>

                      {/* Ride Route Preview */}
                      <View style={styles.routeCardSmall}>
                        <View style={styles.routeRowSmall}>
                          <Ionicons name="radio-button-on" size={14} color={Colors.success} />
                          <Text style={styles.routeLocSmall} numberOfLines={1}>
                            {currentTrip.pickup_location}
                          </Text>
                        </View>
                        <View style={styles.routeLineSmall} />
                        <View style={styles.routeRowSmall}>
                          <Ionicons name="location" size={14} color={Colors.danger} />
                          <Text style={styles.routeLocSmall} numberOfLines={1}>
                            {currentTrip.drop_location}
                          </Text>
                        </View>
                      </View>

                      {/* Fare Info */}
                      <View style={styles.riderFareRow}>
                        <Text style={styles.riderFareLabel}>Trip Fare ({currentTrip.trip_type || 'One-way'})</Text>
                        <Text style={styles.riderFareValue}>₹{currentTrip.fare.toLocaleString('en-IN')}</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.noTripBox}>
                      <Ionicons name="car-outline" size={44} color={Colors.textMuted} />
                      <Text style={styles.noTripTitle}>No Active Trip Assigned</Text>
                      <Text style={styles.noTripSub}>
                        Request or assign a trip from the Available Trips tab to view the customer's live OTP here.
                      </Text>
                      <TouchableOpacity
                        style={styles.assignCandidateBtn}
                        onPress={() => {
                          simulateAdminAssignment();
                          setActiveTab('customer');
                        }}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="flash" size={16} color={Colors.white} />
                        <Text style={styles.assignCandidateBtnText}>Auto-Assign First Trip</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {/* TAB 2: DEV ACTIONS */}
              {activeTab === 'actions' && (
                <View style={styles.actionsList}>
                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statNum}>{requestedCount}</Text>
                      <Text style={styles.statLabel}>Requested</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statNum}>{assignedCount}</Text>
                      <Text style={styles.statLabel}>Assigned</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statNum}>
                        {driver.online_status === 'ONLINE' ? 'ON' : 'OFF'}
                      </Text>
                      <Text style={styles.statLabel}>Status</Text>
                    </View>
                  </View>

                  {/* ── CREATE NEW TRIP & SEND PUSH NOTIFICATION ── */}
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor: '#EEF2FF',
                        borderWidth: 1.5,
                        borderColor: '#818CF8',
                      },
                    ]}
                    onPress={() => {
                      const newTrip = createNewTrip();
                      setIsOpen(false);
                      Alert.alert(
                        'New Trip Created! 🚗',
                        `Trip ${newTrip.trip_number} (₹${newTrip.fare})\nFrom: ${newTrip.pickup_location.split(',')[0]}\nTo: ${newTrip.drop_location.split(',')[0]}\n\nNotification "New trip received" dispatched with audio chime & push alert!`
                      );
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="notifications" size={22} color="#4F46E5" />
                    <View style={styles.actionBtnTexts}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.actionBtnTitle, { color: '#4338CA' }]}>
                          Create New Trip & Push Alert
                        </Text>
                        <View style={styles.pushBadge}>
                          <Text style={styles.pushBadgeText}>PUSH</Text>
                        </View>
                      </View>
                      <Text style={styles.actionBtnSubtitle}>
                        Dispatches new ride & triggers "New trip received" alert
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Create & Directly Assign Trip */}
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor: '#F0FDF4',
                        borderWidth: 1,
                        borderColor: '#86EFAC',
                      },
                    ]}
                    onPress={() => {
                      createNewTrip({ status: 'ASSIGNED' });
                      setActiveTab('customer');
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="flash" size={20} color={Colors.successDark} />
                    <View style={styles.actionBtnTexts}>
                      <Text style={[styles.actionBtnTitle, { color: Colors.successDark }]}>
                        Create & Auto-Assign to Me
                      </Text>
                      <Text style={styles.actionBtnSubtitle}>
                        Creates trip, assigns immediately & opens Rider OTP view
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Toggle ₹250 Security Deposit */}
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor:
                          driver.deposit_status === 'PAID' ? '#F0FDF4' : '#FEF3C7',
                        borderWidth: 1,
                        borderColor:
                          driver.deposit_status === 'PAID' ? '#86EFAC' : '#FDE68A',
                      },
                    ]}
                    onPress={() => {
                      toggleDepositStatusForTesting();
                    }}
                  >
                    <Ionicons
                      name={
                        driver.deposit_status === 'PAID'
                          ? 'shield-checkmark'
                          : 'shield-half'
                      }
                      size={20}
                      color={
                        driver.deposit_status === 'PAID'
                          ? Colors.successDark
                          : '#D97706'
                      }
                    />
                    <View style={styles.actionBtnTexts}>
                      <Text
                        style={[
                          styles.actionBtnTitle,
                          {
                            color:
                              driver.deposit_status === 'PAID'
                                ? Colors.successDark
                                : '#D97706',
                          },
                        ]}
                      >
                        Deposit: {driver.deposit_status === 'PAID' ? 'PAID (Active)' : 'PENDING (Required)'}
                      </Text>
                      <Text style={styles.actionBtnSubtitle}>
                        Tap to toggle ₹250 deposit to test trip request gating
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: Colors.primaryLight }]}
                    onPress={() => {
                      simulateAdminAssignment();
                      setActiveTab('customer');
                    }}
                  >
                    <Ionicons name="checkmark-done" size={20} color={Colors.primary} />
                    <View style={styles.actionBtnTexts}>
                      <Text style={[styles.actionBtnTitle, { color: Colors.primary }]}>
                        Simulate Admin Assignment
                      </Text>
                      <Text style={styles.actionBtnSubtitle}>
                        Assigns the first available trip to driver
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Test Remote Push Notification (Background / Screen Off) */}
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE' }]}
                    onPress={handleTestRemotePush}
                  >
                    <Ionicons name="notifications-circle" size={24} color="#4338CA" />
                    <View style={styles.actionBtnTexts}>
                      <Text style={[styles.actionBtnTitle, { color: '#4338CA' }]}>
                        Test Push (Lock Screen / Background)
                      </Text>
                      <Text style={styles.actionBtnSubtitle}>
                        Dispatches push in 4s so you can exit app & lock screen
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: Colors.successLight }]}
                    onPress={() => {
                      addTripEarnings(1000, '#PM-BONUS', 'PickMi Peak Hours', 'Driver Wallet');
                      setIsOpen(false);
                    }}
                  >
                    <Ionicons name="cash" size={20} color={Colors.successDark} />
                    <View style={styles.actionBtnTexts}>
                      <Text style={[styles.actionBtnTitle, { color: Colors.successDark }]}>
                        Credit +₹1,000 Bonus
                      </Text>
                      <Text style={styles.actionBtnSubtitle}>
                        Simulate instant wallet incentive deposit
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: Colors.background }]}
                    onPress={() => {
                      toggleOnlineStatus();
                    }}
                  >
                    <Ionicons
                      name={driver.online_status === 'ONLINE' ? 'power' : 'radio'}
                      size={20}
                      color={Colors.textPrimary}
                    />
                    <View style={styles.actionBtnTexts}>
                      <Text style={styles.actionBtnTitle}>Toggle Online / Offline</Text>
                      <Text style={styles.actionBtnSubtitle}>
                        Currently {driver.online_status}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Simulate Permissions Blocking Gate */}
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      { backgroundColor: isBlocked ? Colors.successLight : '#FFF4E5' },
                    ]}
                    onPress={async () => {
                      if (isBlocked) {
                        await requestAllPermissions();
                        Alert.alert('Permissions Restored', 'Location & Notifications are now Allowed.');
                      } else {
                        await resetPermissionsForTesting();
                        setIsOpen(false);
                      }
                    }}
                  >
                    <Ionicons
                      name={isBlocked ? 'shield-checkmark' : 'shield-half'}
                      size={20}
                      color={isBlocked ? Colors.successDark : Colors.warningDark}
                    />
                    <View style={styles.actionBtnTexts}>
                      <Text
                        style={[
                          styles.actionBtnTitle,
                          { color: isBlocked ? Colors.successDark : Colors.warningDark },
                        ]}
                      >
                        {isBlocked ? 'Restore App Permissions' : 'Simulate Revoke / Block App'}
                      </Text>
                      <Text style={styles.actionBtnSubtitle}>
                        {isBlocked
                          ? 'App is currently blocked. Tap to grant.'
                          : 'Test the mandatory permission blocking barrier.'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#F0EFFF' }]}
                    onPress={() => {
                      resetToNewUserForTesting();
                      setIsOpen(false);
                    }}
                  >
                    <Ionicons name="person-add" size={20} color="#5856D6" />
                    <View style={styles.actionBtnTexts}>
                      <Text style={[styles.actionBtnTitle, { color: '#5856D6' }]}>
                        Test New User Onboarding
                      </Text>
                      <Text style={styles.actionBtnSubtitle}>
                        Launch Profile, Driver License & Vehicle setup
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: Colors.dangerLight }]}
                    onPress={() => {
                      resetDemoData();
                      setIsOpen(false);
                    }}
                  >
                    <Ionicons name="refresh" size={20} color={Colors.danger} />
                    <View style={styles.actionBtnTexts}>
                      <Text style={[styles.actionBtnTitle, { color: Colors.danger }]}>
                        Reset Demo Trips
                      </Text>
                      <Text style={styles.actionBtnSubtitle}>
                        Restores all trips to original prototype state
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setIsOpen(false)}>
              <Text style={styles.closeBtnText}>Done / Close Dev Tools</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingPill: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    zIndex: 999,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.white,
    marginLeft: 5,
    letterSpacing: 0.5,
  },
  badgeOtp: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  badgeOtpText: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.white,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  closeIconBtn: {
    padding: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  tabButtonTextActive: {
    color: Colors.primary,
  },
  scrollArea: {
    maxHeight: 440,
  },
  customerViewContainer: {
    marginBottom: 16,
  },
  riderPhoneCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  riderAppHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  riderBrand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riderBrandPick: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.primary,
  },
  riderBrandMi: {
    fontSize: 16,
    fontWeight: '900',
    color: '#D97706',
  },
  riderBrandApp: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    marginLeft: 5,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  riderStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  greenPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.successDark,
  },
  riderStatusText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.successDark,
  },
  otpHeroBox: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginBottom: 14,
  },
  otpHeroLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: 10,
  },
  otpDigitsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  otpDigitBlock: {
    width: 44,
    height: 52,
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  otpDigitHero: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.primaryDark,
  },
  otpHeroInstructions: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 10,
  },
  copyOtpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  copyOtpText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  driverInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  driverAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  assignedDriverName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  assignedVehicle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  routeCardSmall: {
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  routeRowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeLocSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  routeLineSmall: {
    width: 1.5,
    height: 10,
    backgroundColor: Colors.border,
    marginLeft: 6,
    marginVertical: 2,
  },
  riderFareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  riderFareLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  riderFareValue: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.primary,
  },
  noTripBox: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noTripTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 10,
  },
  noTripSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    marginBottom: 16,
  },
  assignCandidateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  assignCandidateBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.white,
  },
  actionsList: {
    gap: 10,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
  },
  actionBtnTexts: {
    marginLeft: 12,
    flex: 1,
  },
  actionBtnTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  actionBtnSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: Colors.borderLight,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  pushBadge: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  pushBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },
});
