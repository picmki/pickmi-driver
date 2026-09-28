import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

interface PermissionContextType {
  hasLocationPermission: boolean;
  hasNotificationPermission: boolean;
  isBlocked: boolean;
  isLoading: boolean;
  requestAllPermissions: () => Promise<boolean>;
  setPermissionsState: (location: boolean, notification: boolean) => Promise<void>;
  resetPermissionsForTesting: () => Promise<void>;
}

const STORAGE_KEY_PERMISSIONS = '@pickmi_permissions_status_v1';

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean>(true);
  const [hasNotificationPermission, setHasNotificationPermission] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check saved permission status on mount
  useEffect(() => {
    const loadStoredPermissions = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY_PERMISSIONS);
        if (stored) {
          const parsed = JSON.parse(stored);
          setHasLocationPermission(Boolean(parsed.location));
          setHasNotificationPermission(Boolean(parsed.notification));
        } else {
          // Check system location permission if available
          try {
            const locStatus = await Location.getForegroundPermissionsAsync();
            const isLocGranted = locStatus.status === 'granted';
            setHasLocationPermission(isLocGranted);
            setHasNotificationPermission(true);
            await AsyncStorage.setItem(
              STORAGE_KEY_PERMISSIONS,
              JSON.stringify({ location: isLocGranted, notification: true })
            );
          } catch {
            // Default to true if permission check is unavailable
            setHasLocationPermission(true);
            setHasNotificationPermission(true);
          }
        }
      } catch (e) {
        console.warn('Error reading permissions:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredPermissions();
  }, []);

  const requestAllPermissions = async (): Promise<boolean> => {
    let locGranted = false;
    let notifGranted = true;

    try {
      if (Platform.OS !== 'web') {
        const locRes = await Location.requestForegroundPermissionsAsync();
        locGranted = locRes.status === 'granted';
      } else {
        // Web fallback
        if (navigator.geolocation) {
          locGranted = true;
        } else {
          locGranted = true;
        }
        if (typeof window !== 'undefined' && 'Notification' in window) {
          try {
            const perm = await Notification.requestPermission();
            notifGranted = perm === 'granted' || perm === 'default';
          } catch {
            notifGranted = true;
          }
        }
      }
    } catch {
      locGranted = true;
      notifGranted = true;
    }

    // Mark both active
    setHasLocationPermission(true);
    setHasNotificationPermission(true);

    try {
      await AsyncStorage.setItem(
        STORAGE_KEY_PERMISSIONS,
        JSON.stringify({ location: true, notification: true })
      );
    } catch (e) {
      console.warn('Error saving permissions:', e);
    }

    return true;
  };

  const setPermissionsState = async (location: boolean, notification: boolean) => {
    setHasLocationPermission(location);
    setHasNotificationPermission(notification);
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY_PERMISSIONS,
        JSON.stringify({ location, notification })
      );
    } catch (e) {
      console.warn('Error persisting permission change:', e);
    }
  };

  const resetPermissionsForTesting = async () => {
    setHasLocationPermission(false);
    setHasNotificationPermission(false);
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY_PERMISSIONS,
        JSON.stringify({ location: false, notification: false })
      );
    } catch (e) {
      console.warn('Error resetting permissions:', e);
    }
  };

  const isBlocked = !hasLocationPermission || !hasNotificationPermission;

  return (
    <PermissionContext.Provider
      value={{
        hasLocationPermission,
        hasNotificationPermission,
        isBlocked,
        isLoading,
        requestAllPermissions,
        setPermissionsState,
        resetPermissionsForTesting,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermission = (): PermissionContextType => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermission must be used within a PermissionProvider');
  }
  return context;
};
