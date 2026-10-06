import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../theme/colors';
import { usePermission } from '../../context/PermissionContext';

export const MandatoryPermissionGate: React.FC = () => {
  const {
    hasLocationPermission,
    hasNotificationPermission,
    requestAllPermissions,
    isBlocked,
    isLoading,
  } = usePermission();

  const [isRequesting, setIsRequesting] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  if (isLoading || !isBlocked) {
    return null;
  }

  const handleGrant = async () => {
    setIsRequesting(true);
    try {
      await requestAllPermissions();
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDeny = () => {
    Alert.alert(
      'Location Permission Required',
      'Pickmi Driver requires Location permissions to dispatch nearby trips and track routes. Without location access, you cannot receive ride requests. You can grant permissions at any time.',
      [{ text: 'I Understand', style: 'cancel' }]
    );
  };

  const openPrivacyPolicyWeb = async () => {
    const url = 'https://www.pickmicabs.com/privacy-policy.html';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        setShowPrivacyModal(true);
      }
    } catch {
      setShowPrivacyModal(true);
    }
  };

  return (
    <View style={styles.blockOverlay}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Shield / Lock Icon */}
          <View style={styles.iconCircle}>
            <View style={styles.iconPulseRing} />
            <Ionicons name="location" size={40} color={Colors.primary} />
          </View>

          {/* Main Title */}
          <Text style={styles.title}>Prominent Location Disclosure</Text>
          <Text style={styles.subtitle}>Driver Partner Data & Permission Consent</Text>

          {/* Mandatory Google Play Background Location Disclosure Banner */}
          <View style={styles.prominentDisclosureBox}>
            <View style={styles.disclosureHeaderRow}>
              <Ionicons name="navigate-circle" size={24} color="#1E40AF" />
              <Text style={styles.disclosureTitle}>Background Location Collection</Text>
            </View>
            <Text style={styles.disclosureBodyText}>
              <Text style={styles.boldText}>Pickmi Driver collects location data</Text> (precise GPS coordinates) to enable real-time trip matching, pickup dispatching, turn-by-turn navigation, fare calculation, and rider safety{' '}
              <Text style={styles.highlightText}>EVEN WHEN THE APP IS CLOSED OR NOT IN USE.</Text>
            </Text>
          </View>

          {/* Functional Purpose Breakdown */}
          <View style={styles.purposesContainer}>
            <Text style={styles.sectionHeader}>Why Pickmi Needs Location Data:</Text>

            <View style={styles.purposeItem}>
              <Ionicons name="car-sport" size={20} color={Colors.primary} style={styles.purposeIcon} />
              <View style={styles.purposeTextGroup}>
                <Text style={styles.purposeTitle}>Trip Dispatching & Matching</Text>
                <Text style={styles.purposeDesc}>
                  Matches you with nearby rider requests continuous when your status is ONLINE, even if the app is in the background or screen is off.
                </Text>
              </View>
            </View>

            <View style={styles.purposeItem}>
              <Ionicons name="map" size={20} color={Colors.primary} style={styles.purposeIcon} />
              <View style={styles.purposeTextGroup}>
                <Text style={styles.purposeTitle}>Turn-by-Turn Navigation</Text>
                <Text style={styles.purposeDesc}>
                  Guides you to passenger pickup points and destination drop-offs accurately.
                </Text>
              </View>
            </View>

            <View style={styles.purposeItem}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.primary} style={styles.purposeIcon} />
              <View style={styles.purposeTextGroup}>
                <Text style={styles.purposeTitle}>Rider & Driver Safety Tracking</Text>
                <Text style={styles.purposeDesc}>
                  Shares real-time trip status with passengers and emergency services for safety monitoring during active rides.
                </Text>
              </View>
            </View>
          </View>

          {/* Status Indicators for Required Permissions */}
          <View style={styles.permCardsContainer}>
            {/* Location */}
            <View style={[styles.permCard, Shadows.sm]}>
              <Ionicons name="location" size={22} color={Colors.primary} />
              <View style={styles.permCardContent}>
                <Text style={styles.permCardTitle}>Location Services (Foreground & Background)</Text>
                <Text style={styles.permCardSubtitle}>Required for trip dispatching & live tracking</Text>
              </View>
              <View style={[styles.badge, hasLocationPermission ? styles.badgeActive : styles.badgeRequired]}>
                <Text style={[styles.badgeText, hasLocationPermission ? styles.badgeTextActive : styles.badgeTextRequired]}>
                  {hasLocationPermission ? 'Active' : 'Required'}
                </Text>
              </View>
            </View>

            {/* Notifications */}
            <View style={[styles.permCard, Shadows.sm]}>
              <Ionicons name="notifications" size={22} color={Colors.primary} />
              <View style={styles.permCardContent}>
                <Text style={styles.permCardTitle}>Push & Sound Notifications</Text>
                <Text style={styles.permCardSubtitle}>Required for audible ride alerts & instant trip requests</Text>
              </View>
              <View style={[styles.badge, hasNotificationPermission ? styles.badgeActive : styles.badgeRequired]}>
                <Text style={[styles.badgeText, hasNotificationPermission ? styles.badgeTextActive : styles.badgeTextRequired]}>
                  {hasNotificationPermission ? 'Active' : 'Required'}
                </Text>
              </View>
            </View>
          </View>

          {/* Privacy Policy Link */}
          <TouchableOpacity style={styles.privacyLinkBtn} onPress={openPrivacyPolicyWeb} activeOpacity={0.7}>
            <Ionicons name="document-text-outline" size={16} color={Colors.primary} />
            <Text style={styles.privacyLinkText}>Read Full Privacy Policy</Text>
            <Ionicons name="open-outline" size={14} color={Colors.primary} />
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.actionButtonsCol}>
            <TouchableOpacity
              style={styles.agreeBtn}
              onPress={handleGrant}
              disabled={isRequesting}
              activeOpacity={0.85}
            >
              {isRequesting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color={Colors.white} />
                  <Text style={styles.agreeBtnText}>Agree & Turn On Permissions</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.denyBtn} onPress={handleDeny} activeOpacity={0.7}>
              <Text style={styles.denyBtnText}>Deny / Not Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Fallback In-App Privacy Policy Modal */}
      <Modal visible={showPrivacyModal} animationType="slide" transparent={false} onRequestClose={() => setShowPrivacyModal(false)}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalHeaderTitle}>Pickmi Privacy Policy</Text>
          <TouchableOpacity onPress={() => setShowPrivacyModal(false)} style={styles.modalCloseBtn}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalBody}>
          <Text style={styles.modalH1}>Location Data Collection & Usage Policy</Text>
          <Text style={styles.modalP}>
            Pickmi Driver collects precise location data (GPS & network) to enable real-time trip dispatching, fare calculation, route navigation, and driver/passenger safety monitoring EVEN WHEN THE APP IS CLOSED OR NOT IN USE.
          </Text>
          <Text style={styles.modalH2}>1. Foreground & Background GPS Access</Text>
          <Text style={styles.modalP}>
            When online, background location access allows the server to send nearby trip alerts to your device while navigating or with screen off. Location collection stops immediately when driver switches to OFFLINE status.
          </Text>
          <Text style={styles.modalH2}>2. Data Privacy & Security</Text>
          <Text style={styles.modalP}>
            Your location data is encrypted during transmission and never sold or rented to third parties.
          </Text>
        </ScrollView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  blockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    zIndex: 99999,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  container: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    ...Shadows.lg,
  },
  iconCircle: {
    position: 'relative',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  iconPulseRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: 'rgba(0, 67, 220, 0.25)',
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  prominentDisclosureBox: {
    width: '100%',
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  disclosureHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  disclosureTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E40AF',
  },
  disclosureBodyText: {
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 19,
  },
  boldText: {
    fontWeight: '700',
  },
  highlightText: {
    fontWeight: '800',
    color: '#0043DC',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  purposesContainer: {
    width: '100%',
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  purposeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  purposeIcon: {
    marginTop: 2,
  },
  purposeTextGroup: {
    flex: 1,
  },
  purposeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  purposeDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  permCardsContainer: {
    width: '100%',
    gap: 10,
    marginBottom: 16,
  },
  permCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  permCardContent: {
    flex: 1,
  },
  permCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  permCardSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeActive: {
    backgroundColor: Colors.primaryLight,
  },
  badgeRequired: {
    backgroundColor: '#FFECCC',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextActive: {
    color: Colors.primary,
  },
  badgeTextRequired: {
    color: '#B45309',
  },
  privacyLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  privacyLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  actionButtonsCol: {
    width: '100%',
    gap: 10,
  },
  agreeBtn: {
    width: '100%',
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.md,
  },
  agreeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  denyBtn: {
    width: '100%',
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  denyBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  modalH1: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  modalH2: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 18,
    marginBottom: 8,
  },
  modalP: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
});
