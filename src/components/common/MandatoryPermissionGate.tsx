import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
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

  return (
    <View style={styles.blockOverlay}>
      <View style={styles.container}>
        {/* Shield / Lock Icon */}
        <View style={styles.iconCircle}>
          <View style={styles.iconPulseRing} />
          <Ionicons name="shield-half" size={44} color={Colors.primary} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Permissions Required to Drive</Text>

        {/* Mandate Notice */}
        <View style={styles.alertBanner}>
          <Ionicons name="alert-circle" size={18} color={Colors.danger} />
          <Text style={styles.alertBannerText}>
            First allow required permissions, then utilize the app. App access is currently blocked.
          </Text>
        </View>

        <Text style={styles.description}>
          PickMi Driver requires mandatory real-time Location and Notification permissions to dispatch trips, calculate routes, and deliver audible ride alerts.
        </Text>

        {/* Permission Item 1: Location */}
        <View style={[styles.permCard, Shadows.sm]}>
          <View style={styles.permIconBox}>
            <Ionicons name="location" size={24} color={Colors.primary} />
          </View>
          <View style={styles.permContent}>
            <View style={styles.permHeaderRow}>
              <Text style={styles.permTitle}>Live Location & GPS</Text>
              <View
                style={[
                  styles.statusBadge,
                  hasLocationPermission ? styles.statusBadgeActive : styles.statusBadgeRequired,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    hasLocationPermission
                      ? styles.statusBadgeTextActive
                      : styles.statusBadgeTextRequired,
                  ]}
                >
                  {hasLocationPermission ? 'Active' : 'Required'}
                </Text>
              </View>
            </View>
            <Text style={styles.permSubtitle}>
              Essential for pickup dispatch, live turn navigation, and rider safety.
            </Text>
          </View>
        </View>

        {/* Permission Item 2: Notification */}
        <View style={[styles.permCard, Shadows.sm]}>
          <View style={styles.permIconBox}>
            <Ionicons name="notifications" size={24} color={Colors.primary} />
          </View>
          <View style={styles.permContent}>
            <View style={styles.permHeaderRow}>
              <Text style={styles.permTitle}>Trip Notifications</Text>
              <View
                style={[
                  styles.statusBadge,
                  hasNotificationPermission ? styles.statusBadgeActive : styles.statusBadgeRequired,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    hasNotificationPermission
                      ? styles.statusBadgeTextActive
                      : styles.statusBadgeTextRequired,
                  ]}
                >
                  {hasNotificationPermission ? 'Active' : 'Required'}
                </Text>
              </View>
            </View>
            <Text style={styles.permSubtitle}>
              Required for instant incoming ride request sound alerts & trip assignments.
            </Text>
          </View>
        </View>

        {/* Explanatory Policy Footnote */}
        <View style={styles.policyRow}>
          <Ionicons name="lock-closed-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.policyText}>
            Permissions are always encrypted and strictly used during active driving shifts.
          </Text>
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleGrant}
          disabled={isRequesting}
          activeOpacity={0.85}
        >
          {isRequesting ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Ionicons name="checkmark-done-circle" size={20} color={Colors.white} />
              <Text style={styles.actionBtnText}>Allow Permissions & Start Driving</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconPulseRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: 'rgba(0, 67, 220, 0.25)',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  alertBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.dangerDark,
    lineHeight: 16,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  permCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  permIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permContent: {
    flex: 1,
  },
  permHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  permTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeActive: {
    backgroundColor: Colors.primaryLight,
  },
  statusBadgeRequired: {
    backgroundColor: '#FFECCC',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadgeTextActive: {
    color: Colors.primary,
  },
  statusBadgeTextRequired: {
    color: '#B45309',
  },
  permSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 18,
    paddingHorizontal: 6,
  },
  policyText: {
    flex: 1,
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 15,
  },
  actionBtn: {
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
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
});
