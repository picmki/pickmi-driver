import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { playOnlineSound, playOfflineSound } from '../../utils/soundEffects';
import { requestNotificationPermission, registerForRemotePushNotificationsAsync } from '../../utils/pushNotifications';
import { DriverVerificationModal } from '../compliance/DriverVerificationModal';

export const OnlineToggle: React.FC = () => {
  const {
    driver,
    toggleOnlineStatus,
    isVerified,
    verificationStatus,
    verifiedDocsCount,
    totalDocsCount,
  } = useAuth();
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const isOnline = driver.online_status === 'ONLINE';

  const handleToggle = async () => {
    // Only block if a document was explicitly rejected by Admin
    if (verificationStatus === 'REJECTED') {
      playOfflineSound();
      setShowVerificationModal(true);
      return;
    }

    if (!isOnline) {
      playOnlineSound();
      // Prompt for OS / browser notification permission and register remote push token
      requestNotificationPermission()
        .then(() => registerForRemotePushNotificationsAsync(driver.id))
        .catch(() => {});
    } else {
      playOfflineSound();
    }
    toggleOnlineStatus();
  };

  return (
    <View style={[styles.card, Shadows.md]}>
      {/* Top Row: Driver Info & Toggle Switch */}
      <View style={styles.topRow}>
        <View style={styles.driverInfoContainer}>
          <Text style={styles.greetingText}>Good Day,</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.driverHeading}>{driver.name}</Text>
            {isVerified ? (
              <View style={styles.verifiedTag}>
                <Ionicons name="checkmark-circle" size={13} color="#16A34A" />
                <Text style={styles.verifiedTagText}>VERIFIED</Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setShowVerificationModal(true)}
                style={styles.pendingTag}
              >
                <Ionicons name="hourglass" size={11} color="#D97706" />
                <Text style={styles.pendingTagText}>PENDING DOCS</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Dynamic Island Apple Style Toggle */}
        <TouchableOpacity
          style={[
            styles.toggleButton,
            isOnline
              ? styles.toggleOnline
              : !isVerified
              ? styles.toggleLocked
              : styles.toggleOffline,
          ]}
          onPress={handleToggle}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.pulseCircleOuter,
              isOnline && styles.pulseCircleOuterOnline,
            ]}
          >
            <View
              style={[
                styles.pulseCircleInner,
                {
                  backgroundColor: isOnline
                    ? Colors.white
                    : !isVerified
                    ? '#F59E0B'
                    : Colors.offline,
                },
              ]}
            />
          </View>

          <Text
            style={[
              styles.toggleLabel,
              { color: isOnline ? Colors.white : Colors.textPrimary },
            ]}
          >
            {isOnline ? 'ONLINE' : !isVerified ? 'VERIFY' : 'OFFLINE'}
          </Text>

          <View
            style={[
              styles.toggleSliderCircle,
              isOnline ? styles.sliderRight : styles.sliderLeft,
            ]}
          >
            <Ionicons
              name={isOnline ? 'checkmark' : !isVerified ? 'lock-closed' : 'power'}
              size={13}
              color={
                isOnline
                  ? Colors.successDark
                  : !isVerified
                  ? '#D97706'
                  : Colors.textSecondary
              }
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Effective Status Sub-Bar */}
      {!isVerified ? (
        <TouchableOpacity
          style={[styles.statusBar, styles.statusBarLocked]}
          onPress={() => setShowVerificationModal(true)}
          activeOpacity={0.85}
        >
          <View style={styles.statusLeft}>
            <Ionicons
              name={verificationStatus === 'REJECTED' ? 'alert-circle' : 'hourglass-outline'}
              size={16}
              color={verificationStatus === 'REJECTED' ? '#DC2626' : '#D97706'}
            />
            <Text
              style={[
                styles.statusText,
                { color: verificationStatus === 'REJECTED' ? '#DC2626' : '#B45309' },
              ]}
            >
              {verificationStatus === 'REJECTED'
                ? 'Document Action Required • Tap to review'
                : `Docs Under Review (${verifiedDocsCount}/${totalDocsCount}) • Tap to inspect`}
            </Text>
          </View>

          <View style={styles.reviewBadge}>
            <Text style={styles.reviewBadgeText}>Inspect</Text>
            <Ionicons name="chevron-forward" size={12} color="#B45309" />
          </View>
        </TouchableOpacity>
      ) : (
        <View
          style={[
            styles.statusBar,
            isOnline ? styles.statusBarOnline : styles.statusBarOffline,
          ]}
        >
          <View style={styles.statusLeft}>
            <Ionicons
              name={isOnline ? 'radio' : 'pause-circle'}
              size={16}
              color={isOnline ? Colors.successDark : Colors.textSecondary}
            />
            <Text
              style={[
                styles.statusText,
                { color: isOnline ? Colors.successDark : Colors.textSecondary },
              ]}
            >
              {isOnline
                ? 'Dispatch Active • Ready to accept trips'
                : 'You are offline • Tap button above to go online'}
            </Text>
          </View>

          {isOnline && (
            <View style={styles.liveTag}>
              <View style={styles.liveDot} />
              <Text style={styles.liveTagText}>LIVE</Text>
            </View>
          )}
        </View>
      )}

      {/* Driver Compliance Modal */}
      <DriverVerificationModal
        visible={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  driverInfoContainer: {
    flex: 1,
    marginRight: 10,
  },
  greetingText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textMuted,
    letterSpacing: -0.2,
  },
  driverHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.4,
    marginTop: 1,
  },
  vehicleTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  vehiclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  vehiclePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  ratingMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  ratingMiniText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 26,
    borderWidth: 0,
    minWidth: 120,
    justifyContent: 'space-between',
  },
  toggleOnline: {
    backgroundColor: Colors.success,
  },
  toggleOffline: {
    backgroundColor: '#E5E5EA',
  },
  pulseCircleOuter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  pulseCircleOuterOnline: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  pulseCircleInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginHorizontal: 6,
  },
  toggleSliderCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  sliderRight: {},
  sliderLeft: {},
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusBarOnline: {
    backgroundColor: Colors.successLight,
  },
  statusBarOffline: {
    backgroundColor: '#F2F2F7',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  liveTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.successDark,
    letterSpacing: 0.5,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#15803D',
  },
  pendingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pendingTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#B45309',
  },
  toggleLocked: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusBarLocked: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  reviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FDE68A',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  reviewBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
});
