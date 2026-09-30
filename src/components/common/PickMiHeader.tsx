import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, ScrollView, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { DarkLogoSvg } from './DarkLogoSvg';

interface PickMiHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  showLogo?: boolean;
  showAvatar?: boolean;
  showNotification?: boolean;
  onNotificationPress?: () => void;
  rightAction?: React.ReactNode;
}

export const PickMiHeader: React.FC<PickMiHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  showLogo,
  showAvatar,
  showNotification,
  onNotificationPress,
  rightAction,
}) => {
  const { driver } = useAuth();
  const { notifications, markAsRead } = useNotifications();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // If title is given, default showLogo to false and showAvatar to false unless explicitly specified
  const shouldShowLogo = showLogo !== undefined ? showLogo : !title;
  // Remove top right profile avatar as requested by the user
  const shouldShowAvatar = Boolean(showAvatar);
  // Show notification icon on left side by default when logo is visible (e.g., home page)
  const shouldShowNotification = showNotification !== undefined ? showNotification : (shouldShowLogo && !showBack);
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 20
  );
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={[styles.container, { paddingTop: topPadding + 6 }]}>
      <View style={styles.left}>
        {showBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        ) : null}

        {shouldShowLogo ? (
          <View style={styles.brandRow}>
            <DarkLogoSvg width={95} height={36} />
          </View>
        ) : null}

        {title && (
          <View style={[styles.titleContainer, !shouldShowLogo && styles.titleContainerNoLogo]}>
            <Text style={styles.titleText}>{title}</Text>
            {subtitle && <Text style={styles.subtitleText}>{subtitle}</Text>}
          </View>
        )}
      </View>

      <View style={styles.right}>
        {rightAction ? (
          rightAction
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {shouldShowNotification ? (
              <TouchableOpacity
                style={styles.notificationBtn}
                onPress={() => {
                  if (onNotificationPress) {
                    onNotificationPress();
                  } else {
                    setIsModalOpen(true);
                  }
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
                {unreadCount > 0 && <View style={styles.notificationBadge} />}
              </TouchableOpacity>
            ) : null}

            {shouldShowAvatar ? (
              <View style={styles.driverProfileMini}>
                <View
                  style={[
                    styles.onlineIndicator,
                    { backgroundColor: driver.online_status === 'ONLINE' ? Colors.online : Colors.offline },
                  ]}
                />
                <Image source={{ uri: driver.profile_image }} style={styles.avatar} />
              </View>
            ) : null}
          </View>
        )}
      </View>

      {/* Driver Notifications Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.modalHeaderIcon}>
                  <Ionicons name="notifications" size={20} color={Colors.primary} />
                </View>
                <Text style={styles.modalTitle}>Notifications</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {notifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="notifications-off-outline" size={48} color={Colors.textMuted} />
                  <Text style={styles.emptyTitle}>No New Notifications</Text>
                  <Text style={styles.emptySub}>
                    You're all caught up! New dispatch alerts and updates will appear here.
                  </Text>
                </View>
              ) : (
                notifications.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.notificationItem, !item.read && styles.notificationItemUnread]}
                    onPress={() => markAsRead(item.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.notifIconCircle}>
                      <Ionicons
                        name={
                          item.type === 'trip_assigned' || item.type === 'trip_available'
                            ? 'car-sport'
                            : item.type === 'wallet'
                            ? 'wallet'
                            : 'notifications'
                        }
                        size={18}
                        color={Colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notifTitle}>{item.title}</Text>
                      <Text style={styles.notifMessage}>{item.message}</Text>
                      <Text style={styles.notifTime}>
                        {new Date(item.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: Colors.white,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogoImage: {
    width: 95,
    height: 36,
  },
  titleContainer: {
    marginLeft: 12,
  },
  titleContainerNoLogo: {
    marginLeft: 0,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  subtitleText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.borderLight,
    marginRight: 12,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverProfileMini: {
    position: 'relative',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.white,
    zIndex: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  modalList: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notificationItemUnread: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  notifIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  notifMessage: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  notifTime: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 6,
    fontWeight: '500',
  },
});
