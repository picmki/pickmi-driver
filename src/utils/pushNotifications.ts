import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

export const ONLINE_SEARCH_NOTIFICATION_ID = 'pickmi_online_searching_card';

// ── Configure notification handler for foreground notifications ─────────────
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const isOnlineSearchCard = notification?.request?.identifier === ONLINE_SEARCH_NOTIFICATION_ID;
    return {
      shouldShowAlert: !isOnlineSearchCard,
      shouldPlaySound: !isOnlineSearchCard,
      shouldSetBadge: !isOnlineSearchCard,
      shouldShowBanner: !isOnlineSearchCard,
      shouldShowList: true, // Always keep card visible in system notification tray
    };
  },
});

// Configure Android High-Priority & Background Status Notification Channels
export async function setupAndroidNotificationChannel() {
  if (Platform.OS === 'android') {
    try {
      // 1. High-priority channel for incoming trip offers & dispatched rides
      await Notifications.setNotificationChannelAsync('pickmi_rides', {
        name: 'PickMi Ride Alerts',
        description: 'Urgent incoming ride offers and passenger updates',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#0043DC',
        sound: undefined,
        enableVibrate: true,
        showBadge: true,
        bypassDnd: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });

      // Fallback default high-priority channel
      await Notifications.setNotificationChannelAsync('default', {
        name: 'PickMi Alerts',
        description: 'PickMi notifications and updates',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#0043DC',
        sound: undefined,
        enableVibrate: true,
        showBadge: true,
      });

      // 2. Ongoing status channel for "Searching trips for you" card
      await Notifications.setNotificationChannelAsync('pickmi_online_service', {
        name: "PickMi Online Status",
        description: "Status notification shown while driver is online",
        importance: Notifications.AndroidImportance.LOW,
        sound: null,
        enableVibrate: false,
        showBadge: false,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });

      console.log('✅ Android notification channels "pickmi_rides", "default", & "pickmi_online_service" ready');
    } catch (e) {
      console.warn('Could not set notification channel:', e);
    }
  }
}

// Immediately run channel setup
setupAndroidNotificationChannel();

/**
 * Explicitly request notification permissions from the OS / Browser
 */
export async function requestNotificationPermission(): Promise<boolean> {
  console.log('🔔 Requesting notification permissions...');

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'granted') return true;
        const perm = await Notification.requestPermission();
        return perm === 'granted';
      } catch (e) {
        console.warn('Web notification permission error:', e);
        return false;
      }
    }
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowDisplayInCarPlay: true,
          allowCriticalAlerts: true,
        },
      });
      finalStatus = status;
    }
    console.log('Native notification permission status:', finalStatus);
    return finalStatus === 'granted';
  } catch (error) {
    console.warn('Error requesting notification permission:', error);
    return false;
  }
}

/**
 * Triggers a local OS push notification (works when app is in foreground or background)
 */
export async function triggerPushNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<boolean> {
  try {
    if (Platform.OS !== 'web') {
      await requestNotificationPermission();
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: 'default',
          badge: 1,
          vibrate: [0, 500, 250, 500],
          priority: 'max',
          color: '#0043DC',
        },
        trigger: Platform.OS === 'android' ? ({ channelId: 'pickmi_rides' } as any) : null,
      });
      return true;
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        const notif = new Notification(title, {
          body,
          data,
          tag: data?.tripId || 'pickmi_ride',
          requireInteraction: true,
        });
        notif.onclick = () => {
          window.focus();
          if (data?.tripId) {
            window.dispatchEvent(new CustomEvent('pickmi_open_incoming_trip', { detail: data.tripId }));
          }
        };
        return true;
      } else if (Notification.permission !== 'denied') {
        const res = await Notification.requestPermission();
        if (res === 'granted') {
          new Notification(title, { body, data, requireInteraction: true });
          return true;
        }
      }
    }
  } catch (error) {
    console.warn('Could not trigger system push notification:', error);
  }
  return false;
}

/**
 * Displays persistent ongoing notification card: "PickMi is searching trips for you"
 * Shown ONLY when driver is ONLINE. Sticky so user knows app is actively ready.
 */
export async function showOnlineSearchingNotification(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const hasPerm = await requestNotificationPermission();
    if (!hasPerm) return;

    await setupAndroidNotificationChannel();

    await Notifications.scheduleNotificationAsync({
      identifier: ONLINE_SEARCH_NOTIFICATION_ID,
      content: {
        title: "🚕 PickMi Driver",
        body: "Online • Ready for ride requests",
        sticky: false,
        autoDismiss: true,
        priority: 'low',
        sound: false,
        vibrate: [],
        color: '#0043DC',
        data: { type: 'online_searching_status' },
      },
      trigger: Platform.OS === 'android' ? ({ channelId: 'pickmi_online_service' } as any) : null,
    });
    console.log('🟢 Ongoing "Searching trips for you" notification card displayed');
  } catch (err) {
    console.warn('Could not display online searching notification:', err);
  }
}

/**
 * Dismisses the persistent ongoing "Searching trips for you" notification card.
 * Called immediately when driver switches to OFFLINE or logs out.
 */
export async function hideOnlineSearchingNotification(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.dismissNotificationAsync(ONLINE_SEARCH_NOTIFICATION_ID).catch(() => {});
    await Notifications.cancelScheduledNotificationAsync(ONLINE_SEARCH_NOTIFICATION_ID).catch(() => {});
    console.log('⚪ Ongoing online searching notification card dismissed');
  } catch (err) {
    console.warn('Could not dismiss online searching notification:', err);
  }
}

/**
 * Register notification tap listener — fires when driver taps a notification
 * from the lock screen / notification tray (background or killed state)
 */
export function registerNotificationClickListener(onSelectTrip: (tripId: string) => void) {
// Check cold-start notification response (when app is opened from killed state by tapping notification)
Notifications.getLastNotificationResponseAsync().then((response) => {
  if (response) {
    const tripId = response.notification.request.content.data?.tripId;
    if (tripId && typeof tripId === "string") {
      console.log("📲 App cold-started from notification tap for trip:", tripId);
      setTimeout(() => onSelectTrip(tripId), 500);
    }
  }
}).catch(() => {});

  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const tripId = response.notification.request.content.data?.tripId;
    console.log('📲 Driver tapped notification for trip:', tripId);
    if (tripId && typeof tripId === 'string') {
      onSelectTrip(tripId);
    }
  });

  let webHandler: any = null;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    webHandler = (e: any) => {
      if (e.detail) onSelectTrip(e.detail);
    };
    window.addEventListener('pickmi_open_incoming_trip', webHandler);
  }

  return () => {
    subscription.remove();
    if (webHandler && typeof window !== 'undefined') {
      window.removeEventListener('pickmi_open_incoming_trip', webHandler);
    }
  };
}

/**
 * Registers this device for Expo Remote Push Notifications (FCM / APNs).
 * Saves the push_token to Supabase so the admin can send notifications
 * even when the app is CLOSED or the phone screen is OFF.
 *
 * ⚠️  SDK 53+ requires projectId — read from EAS config or app.json extra.
 *     Without projectId, getExpoPushTokenAsync() will throw an error.
 *     You must run `eas init` and link the project, OR add projectId manually
 *     to app.json under expo.extra.eas.projectId
 */
export async function registerForRemotePushNotificationsAsync(driverId?: string): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    const hasPerm = await requestNotificationPermission();
    if (!hasPerm) {
      console.warn('⚠️ Push notification permission not granted — cannot register push token.');
      return null;
    }

    await setupAndroidNotificationChannel();

    // Resolve Expo projectId from EAS config or app.json extra, with linked project fallback
    const projectId: string =
      Constants.easConfig?.projectId ||
      (Constants.expoConfig?.extra as any)?.eas?.projectId ||
      (Constants.expoConfig?.extra as any)?.projectId ||
      '13fe6dc0-ca34-419b-9d8c-de3b788bdcb0';

    // ⚠️ CRITICAL: Expo Go SDK 53+ removed remote Android push notifications from Expo Go.
    // Calling getExpoPushTokenAsync inside Expo Go throws an explicit runtime exception.
    // In standalone APK and development builds, native FCM is active and works properly.
    const isExpoGo =
      Constants.appOwnership === 'expo' ||
      (Constants as any).executionEnvironment === 'storeClient';

    if (isExpoGo) {
      console.log('ℹ️ Running in Expo Go: Remote push token bypassed (requires standalone APK on Android SDK 53+). Local alerts are active.');
      if (driverId) {
        const mockExpoGoToken = `ExponentPushToken[expo_go_${driverId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 15)}]`;
        const { updateDriverPushTokenInSupabase } = require('../services/supabaseService');
        await updateDriverPushTokenInSupabase(driverId, mockExpoGoToken).catch(() => {});
      }
      return null;
    }

    // Standalone APK / Development build: Fetch real native Expo/FCM push token
    let tokenData = null;
    try {
      tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
    } catch (err: any) {
      console.warn('⚠️ getExpoPushTokenAsync failed:', err?.message);
      return null;
    }

    const token = tokenData?.data;
    if (token) {
      console.log('📱 Expo Push Token obtained:', token.substring(0, 30) + '...');
      if (driverId) {
        const { updateDriverPushTokenInSupabase } = require('../services/supabaseService');
        await updateDriverPushTokenInSupabase(driverId, token);
        console.log('✅ Push token saved to Supabase for driver:', driverId);
      }
      return token;
    }

    console.warn('⚠️ Push token was empty — driver will not receive remote notifications.');
    return null;
  } catch (error) {
    console.warn('Error in registerForRemotePushNotificationsAsync:', error);
    return null;
  }
}

/**
 * Sends a self-test remote push notification via Expo Push API.
 * Tests if the phone receives notifications when in background or locked.
 */
export async function sendTestRemotePushNotification(token: string): Promise<boolean> {
  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        title: '🚨 Test Trip Offer - PickMi Driver',
        body: 'New trip request: Indiranagar to Koramangala (₹480). Tap to open!',
        data: { test: true },
        sound: 'default',
        priority: 'high',
        channelId: 'pickmi_rides',
      }),
    });
    const result = await res.json();
    console.log('Test remote push result:', result);
    return result?.data?.status === 'ok';
  } catch (e) {
    console.warn('Test remote push failed:', e);
    return false;
  }
}
