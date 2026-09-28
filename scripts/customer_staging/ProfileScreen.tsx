import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from './theme';
import type { UserProfile } from './types';

interface ProfileScreenProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onNavigateTab: (tab: 'home' | 'reservations' | 'history') => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  onOpenAuth,
  onLogout,
  onNavigateTab,
}) => {
  const handleCallSupport = () => {
    Linking.openURL('tel:+919900088000');
  };

  const handleOpenWhatsApp = () => {
    Linking.openURL('https://wa.me/919900088000?text=Hi%20PickMi%20Support,%20I%20need%20help%20with%20my%20cab%20reservation.');
  };

  const handleConfirmLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out of PickMi?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: onLogout },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Profile Card */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarWrap}>
            <Ionicons name="person" size={32} color={COLORS.primary} />
          </View>

          {user ? (
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userPhone}>{user.mobile}</Text>
              {user.email && <Text style={styles.userEmail}>{user.email}</Text>}
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>Guest Rider</Text>
              <Text style={styles.userPhone}>Sign in to save your trip reservations</Text>
              <TouchableOpacity style={styles.loginBtnSmall} onPress={onOpenAuth}>
                <Text style={styles.loginBtnSmallText}>Login / Sign Up</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Trips Shortcut */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>MY TRIPS & RESERVATIONS</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => onNavigateTab('reservations')}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Upcoming Reservations</Text>
              <Text style={styles.menuDesc}>View scheduled future rides & assigned chauffeurs</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => onNavigateTab('history')}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="receipt-outline" size={18} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Trip History & Invoices</Text>
              <Text style={styles.menuDesc}>Previous journeys, receipts, and driver feedback</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
          </TouchableOpacity>
        </View>

        {/* Saved Addresses */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>SAVED FAVORITES</Text>

          <View style={styles.menuItem}>
            <View style={[styles.menuIconWrap, { backgroundColor: COLORS.surfaceAlt }]}>
              <Ionicons name="home-outline" size={18} color={COLORS.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Home</Text>
              <Text style={styles.menuDesc}>Koramangala 5th Block, Bengaluru</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
          </View>

          <View style={styles.menuDivider} />

          <View style={styles.menuItem}>
            <View style={[styles.menuIconWrap, { backgroundColor: COLORS.surfaceAlt }]}>
              <Ionicons name="briefcase-outline" size={18} color={COLORS.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Work</Text>
              <Text style={styles.menuDesc}>ITPL Main Gate, Whitefield, Bengaluru</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
          </View>

          <View style={styles.menuDivider} />

          <View style={styles.menuItem}>
            <View style={[styles.menuIconWrap, { backgroundColor: COLORS.surfaceAlt }]}>
              <Ionicons name="airplane-outline" size={18} color={COLORS.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Airport</Text>
              <Text style={styles.menuDesc}>Kempegowda Int. Airport (BLR) T1 / T2</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
          </View>
        </View>

        {/* Help & 24x7 Support */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>HELP & SAFETY (24x7)</Text>

          <TouchableOpacity style={styles.menuItem} onPress={handleCallSupport}>
            <View style={[styles.menuIconWrap, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="call-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>24x7 Customer Helpline</Text>
              <Text style={styles.menuDesc}>+91 99000 88000 • Immediate assistance</Text>
            </View>
            <Ionicons name="call" size={16} color={COLORS.primary} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity style={styles.menuItem} onPress={handleOpenWhatsApp}>
            <View style={[styles.menuIconWrap, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="logo-whatsapp" size={18} color="#16A34A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>WhatsApp Chat Support</Text>
              <Text style={styles.menuDesc}>Quick questions & flight delay updates</Text>
            </View>
            <Ionicons name="open-outline" size={16} color="#16A34A" />
          </TouchableOpacity>
        </View>

        {/* App Info & Logout */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>ABOUT PICKMI</Text>
          <View style={styles.menuItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Version 2.0 (Stable)</Text>
              <Text style={styles.menuDesc}>PickMi Customer Mobility Platform • Expo 57</Text>
            </View>
            <View style={styles.appTag}>
              <Text style={styles.appTagText}>Production</Text>
            </View>
          </View>

          {user && (
            <>
              <View style={styles.menuDivider} />
              <TouchableOpacity style={styles.menuItem} onPress={handleConfirmLogout}>
                <View style={[styles.menuIconWrap, { backgroundColor: COLORS.dangerLight }]}>
                  <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuTitle, { color: COLORS.danger }]}>Sign Out</Text>
                  <Text style={styles.menuDesc}>Sign out of your PickMi account</Text>
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 16,
  },
  profileHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 14,
    ...SHADOWS.sm,
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  userPhone: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  userEmail: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
    marginTop: 1,
  },
  loginBtnSmall: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  loginBtnSmallText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  menuDesc: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 4,
  },
  appTag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  appTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
});
