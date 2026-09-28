import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useNotifications } from '../context/NotificationContext';

interface NotificationScreenProps {
  onBack: () => void;
  onNavigateToTrips?: () => void;
  onNavigateToWallet?: () => void;
}

type FilterCategory = 'ALL' | 'TRIPS' | 'WALLET' | 'SYSTEM';

export const NotificationScreen: React.FC<NotificationScreenProps> = ({
  onBack,
  onNavigateToTrips,
  onNavigateToWallet,
}) => {
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('ALL');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((item) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'TRIPS')
      return (
        item.type === 'trip_assigned' ||
        item.type === 'trip_available' ||
        item.type === 'trip_completed'
      );
    if (selectedFilter === 'WALLET') return item.type === 'wallet';
    if (selectedFilter === 'SYSTEM') return item.type === 'system';
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'trip_assigned':
      case 'trip_available':
        return { name: 'car-sport', color: '#0043DC', bg: '#EFF6FF' };
      case 'trip_completed':
        return { name: 'checkmark-circle', color: '#10B981', bg: '#ECFDF5' };
      case 'wallet':
        return { name: 'wallet', color: '#0D9488', bg: '#F0FDFA' };
      case 'system':
      default:
        return { name: 'notifications', color: '#4F46E5', bg: '#EEF2FF' };
    }
  };

  const formatTimestamp = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recent';
    }
  };

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    Alert.alert('Clear All Notifications', 'Are you sure you want to clear all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: clearAll },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Navigation Header — flush to safe area */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.headerTitle}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadChip}>
                  <Text style={styles.unreadChipText}>{unreadCount} New</Text>
                </View>
              )}
            </View>
            <Text style={styles.headerSubtitle}>Alerts, Dispatches & Updates</Text>
          </View>
        </View>

        {notifications.length > 0 && (
          <View style={styles.headerRight}>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.markReadBtn}
                onPress={markAllAsRead}
                activeOpacity={0.7}
              >
                <Text style={styles.markReadText}>Mark read</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={handleClearAll}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Filter Category Tabs */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterPill, selectedFilter === 'ALL' && styles.filterPillActive]}
            onPress={() => setSelectedFilter('ALL')}
          >
            <Text style={[styles.filterText, selectedFilter === 'ALL' && styles.filterTextActive]}>
              All ({notifications.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, selectedFilter === 'TRIPS' && styles.filterPillActive]}
            onPress={() => setSelectedFilter('TRIPS')}
          >
            <Text style={[styles.filterText, selectedFilter === 'TRIPS' && styles.filterTextActive]}>
              Trips
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, selectedFilter === 'WALLET' && styles.filterPillActive]}
            onPress={() => setSelectedFilter('WALLET')}
          >
            <Text style={[styles.filterText, selectedFilter === 'WALLET' && styles.filterTextActive]}>
              Wallet
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, selectedFilter === 'SYSTEM' && styles.filterPillActive]}
            onPress={() => setSelectedFilter('SYSTEM')}
          >
            <Text style={[styles.filterText, selectedFilter === 'SYSTEM' && styles.filterTextActive]}>
              System
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main Notifications List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="notifications-outline" size={48} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>No Notifications Here</Text>
            <Text style={styles.emptySubtitle}>
              You're all caught up! New reservation dispatches, passenger alerts, and system notices will show up here.
            </Text>
          </View>
        ) : (
          filteredNotifications.map((item) => {
            const iconConfig = getNotificationIcon(item.type);
            const isUnread = !item.read;

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.notifCard, isUnread && styles.notifCardUnread]}
                onPress={() => {
                  markAsRead(item.id);
                  if (item.type.includes('trip') && onNavigateToTrips) {
                    onNavigateToTrips();
                  } else if (item.type === 'wallet' && onNavigateToWallet) {
                    onNavigateToWallet();
                  }
                }}
                activeOpacity={0.88}
              >
                {/* Icon Circle */}
                <View style={[styles.iconCircle, { backgroundColor: iconConfig.bg }]}>
                  <Ionicons name={iconConfig.name as any} size={22} color={iconConfig.color} />
                </View>

                {/* Body Content */}
                <View style={{ flex: 1 }}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={[styles.cardTitle, isUnread && styles.cardTitleUnread]}>
                      {item.title}
                    </Text>
                    {isUnread && <View style={styles.unreadDot} />}
                  </View>

                  <Text style={styles.cardMessage}>{item.message}</Text>

                  <View style={styles.cardFooterRow}>
                    <Text style={styles.cardTime}>{formatTimestamp(item.created_at)}</Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>
                        {item.type.toUpperCase().replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  unreadChip: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  unreadChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0043DC',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markReadBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  markReadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0043DC',
  },
  clearBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  filterRow: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  filterScroll: {
    paddingHorizontal: 16,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  notifCardUnread: {
    backgroundColor: '#FFFFFF',
    borderColor: '#93C5FD',
    borderLeftWidth: 4,
    borderLeftColor: '#0043DC',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    flex: 1,
  },
  cardTitleUnread: {
    color: '#0F172A',
    fontWeight: '900',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0043DC',
    marginLeft: 6,
  },
  cardMessage: {
    fontSize: 13,
    color: '#475569',
    marginTop: 3,
    lineHeight: 18,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cardTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  categoryBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
  },
});
