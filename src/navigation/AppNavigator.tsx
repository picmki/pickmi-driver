import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useTrips } from '../context/TripContext';
import { SplashScreen } from '../screens/SplashScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { OtpScreen } from '../screens/OtpScreen';
import { ProfileSetupScreen } from '../screens/ProfileSetupScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { NewTripsScreen } from '../screens/NewTripsScreen';
import { WalletScreen } from '../screens/WalletScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { NotificationScreen } from '../screens/NotificationScreen';
import { NotificationBanner } from '../components/common/NotificationBanner';
import { IncomingTripAlertModal } from '../components/trip/IncomingTripAlertModal';
import { MandatoryPermissionGate } from '../components/common/MandatoryPermissionGate';

export type TabType = 'home' | 'trips' | 'wallet' | 'profile' | 'notifications';
export type AuthScreenType = 'login' | 'otp';

export const AppNavigator: React.FC = () => {
  const { isLoggedIn, isLoading, isNewUser, completeProfileSetup } = useAuth();
  const {
    availableTrips,
    assignedTrips,
    incomingAlertTrip,
    isAcceptingIncoming,
    unavailableTripError,
    acceptTrip,
    rejectTrip,
  } = useTrips();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Navigation state
  const [isSplash, setIsSplash] = useState(true);
  const [authScreen, setAuthScreen] = useState<AuthScreenType>('login');
  const [activeTab, setActiveTab] = useState<TabType>('home');



  // On Web with large screens, frame the app inside a realistic mobile container
  const isWebDesktop = Platform.OS === 'web' && width > 500;

  const renderCurrentScreen = () => {
    if (isSplash) {
      return (
        <SplashScreen
          onFinish={(loggedIn) => {
            setIsSplash(false);
            if (!loggedIn) {
              setAuthScreen('login');
            }
          }}
        />
      );
    }

    if (!isLoggedIn) {
      if (authScreen === 'login') {
        return <LoginScreen onContinue={() => setAuthScreen('otp')} />;
      }
      return (
        <OtpScreen
          onSuccess={() => {
            setActiveTab('home');
          }}
          onChangeNumber={() => setAuthScreen('login')}
        />
      );
    }

    // New user must complete profile setup before accessing main app
    if (isNewUser) {
      return (
        <ProfileSetupScreen
          onComplete={() => {
            setActiveTab('home');
          }}
        />
      );
    }

    // Main 4 Bottom Tabs + Dedicated Sub-pages
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            onNavigateToTrips={() => setActiveTab('trips')}
            onNavigateToNotifications={() => setActiveTab('notifications')}
          />
        );
      case 'notifications':
        return (
          <NotificationScreen
            onBack={() => setActiveTab('home')}
            onNavigateToTrips={() => setActiveTab('trips')}
            onNavigateToWallet={() => setActiveTab('wallet')}
          />
        );
      case 'trips':
        return <NewTripsScreen />;
      case 'wallet':
        return <WalletScreen />;
      case 'profile':
        return <ProfileScreen onLogoutSuccess={() => setAuthScreen('login')} />;
      default:
        return (
          <HomeScreen
            onNavigateToTrips={() => setActiveTab('trips')}
            onNavigateToNotifications={() => setActiveTab('notifications')}
          />
        );
    }
  };

  const appContent = (
    <View style={styles.appContainer}>
      <StatusBar
        barStyle={isSplash ? 'light-content' : 'dark-content'}
        backgroundColor={isSplash ? Colors.primary : Colors.white}
      />

      {/* Real-time In-App Notification Banner */}
      <NotificationBanner />

      {/* Real-time Incoming Trip Alert Modal (Pop up on new dispatch) */}
      <IncomingTripAlertModal
        trip={incomingAlertTrip}
        isAccepting={isAcceptingIncoming}
        unavailableError={unavailableTripError}
        onAccept={async (id) => {
          const success = await acceptTrip(id);
          if (success) {
            setActiveTab("home");
          }
        }}
        onDecline={(id, reason) => {
          rejectTrip(id, reason);
        }}
      />

      {/* Mandatory Driver Permissions Gate (Blocks app until permissions are allowed) */}
      {!isSplash && <MandatoryPermissionGate />}

      {/* Main Screen Content */}
      <View style={styles.screenWrapper}>{renderCurrentScreen()}</View>

      {/* Bottom Tab Bar — hidden on notifications screen */}
      {isLoggedIn && !isSplash && !isNewUser && activeTab !== 'notifications' && (
        <View
          style={[
            styles.bottomTabBar,
            Shadows.bottomSheet,
            { paddingBottom: Math.max(insets.bottom, 6), height: 60 + Math.max(insets.bottom, 6) },
          ]}
        >
          {/* Home Tab */}
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => setActiveTab('home')}
            activeOpacity={0.8}
          >
            <View style={styles.tabIconWrapper}>
              <Ionicons
                name={activeTab === 'home' ? 'map' : 'map-outline'}
                size={24}
                color={activeTab === 'home' ? Colors.primary : Colors.textMuted}
              />
            </View>
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === 'home' ? Colors.primary : Colors.textMuted },
              ]}
            >
              Home
            </Text>

          </TouchableOpacity>

          {/* New Trips Tab */}
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => setActiveTab('trips')}
            activeOpacity={0.8}
          >
            <View style={styles.tabIconWrapper}>
              <Ionicons
                name={activeTab === 'trips' ? 'car-sport' : 'car-sport-outline'}
                size={25}
                color={activeTab === 'trips' ? Colors.primary : Colors.textMuted}
              />
            </View>
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === 'trips' ? Colors.primary : Colors.textMuted },
              ]}
            >
              New Trips
            </Text>

          </TouchableOpacity>

          {/* Wallet Tab */}
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => setActiveTab('wallet')}
            activeOpacity={0.8}
          >
            <View style={styles.tabIconWrapper}>
              <Ionicons
                name={activeTab === 'wallet' ? 'wallet' : 'wallet-outline'}
                size={24}
                color={activeTab === 'wallet' ? Colors.primary : Colors.textMuted}
              />
            </View>
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === 'wallet' ? Colors.primary : Colors.textMuted },
              ]}
            >
              Wallet
            </Text>

          </TouchableOpacity>

          {/* Profile Tab */}
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => setActiveTab('profile')}
            activeOpacity={0.8}
          >
            <View style={styles.tabIconWrapper}>
              <Ionicons
                name={activeTab === 'profile' ? 'person' : 'person-outline'}
                size={24}
                color={activeTab === 'profile' ? Colors.primary : Colors.textMuted}
              />
            </View>
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === 'profile' ? Colors.primary : Colors.textMuted },
              ]}
            >
              Profile
            </Text>

          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // If viewed on desktop web browser, render inside an authentic Mobile Device Shell
  if (isWebDesktop) {
    return (
      <View style={styles.desktopWrapper}>
        <View style={styles.desktopBackgroundNotice}>
          <Text style={styles.desktopNoticeTitle}>PickMi Driver Mobile App</Text>
          <Text style={styles.desktopNoticeSubtitle}>
            Mobile-only React Native + Expo Application
          </Text>
          <Text style={styles.desktopNoticeHint}>
            iPhone / Android Mobile Viewport Active
          </Text>
        </View>

        <View style={[styles.mobileDeviceFrame, Shadows.lg]}>
          {/* Mobile Speaker / Camera Notch */}
          <View style={styles.deviceSpeakerBar}>
            <View style={styles.deviceSpeaker} />
            <View style={styles.deviceCamera} />
          </View>

          {/* Device Screen */}
          <View style={styles.deviceScreenInner}>{appContent}</View>

          {/* Mobile Home Indicator bar */}
          <View style={styles.homeIndicatorBar}>
            <View style={styles.homeIndicator} />
          </View>
        </View>
      </View>
    );
  }

  return <View style={styles.safeAreaContainer}>{appContent}</View>;
};

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  appContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  screenWrapper: {
    flex: 1,
  },
  bottomTabBar: {
    flexDirection: 'row',
    height: 72,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingBottom: 8,
    paddingTop: 6,
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabIconWrapper: {
    position: 'relative',
    height: 28,
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  tabBadge: {
    position: 'absolute',
    top: -3,
    right: -10,
    backgroundColor: Colors.primary,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  tabBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  // Desktop Mobile Device Mockup Wrapper
  desktopWrapper: {
    flex: 1,
    backgroundColor: '#090D16',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  desktopBackgroundNotice: {
    position: 'absolute',
    top: 24,
    alignItems: 'center',
  },
  desktopNoticeTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  desktopNoticeSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  desktopNoticeHint: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mobileDeviceFrame: {
    width: 412,
    height: 840,
    backgroundColor: '#1E293B',
    borderRadius: 50,
    padding: 12,
    borderWidth: 4,
    borderColor: '#334155',
    overflow: 'hidden',
    position: 'relative',
    marginTop: 40,
  },
  deviceSpeakerBar: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  deviceSpeaker: {
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#475569',
  },
  deviceCamera: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0F172A',
    marginLeft: 12,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  deviceScreenInner: {
    flex: 1,
    borderRadius: 38,
    overflow: 'hidden',
    backgroundColor: Colors.background,
  },
  homeIndicatorBar: {
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeIndicator: {
    width: 134,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#64748B',
  },
});
