import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Driver, Vehicle, DriverDocument, OnlineStatus } from '../types/database';
import { INITIAL_DRIVER, INITIAL_VEHICLE, INITIAL_DOCUMENTS } from '../data/mockData';
import {
  getDriverByMobile,
  upsertDriverProfile,
  upsertVehicle,
  syncDriverDocuments,
  updateDriverOnlineStatusInSupabase,
  updateDriverDepositInSupabase,
} from '../services/supabaseService';
import { supabase } from '../lib/supabase';
import { registerForRemotePushNotificationsAsync } from '../utils/pushNotifications';

interface AuthContextType {
  driver: Driver;
  vehicle: Vehicle;
  documents: DriverDocument[];
  isLoggedIn: boolean;
  isLoading: boolean;
  isNewUser: boolean;
  pendingMobile: string;
  setPendingMobile: (mobile: string) => void;
  sendOtp: (mobile: string) => Promise<boolean>;
  verifyOtp: (enteredOtp: string) => Promise<{ success: boolean; message?: string }>;
  completeProfileSetup: (
    customDriver?: Driver,
    customVehicle?: Vehicle,
    customDocs?: DriverDocument[]
  ) => Promise<{ success: boolean; error?: string }>;
  toggleOnlineStatus: () => void;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Driver>) => void;
  updateVehicle: (data: Partial<Vehicle>) => void;
  updateDocuments: (docs: DriverDocument[]) => void;
  resetToNewUserForTesting: () => void;
  paySecurityDeposit: (paymentId?: string) => Promise<void>;
  refundSecurityDeposit: () => Promise<{ success: boolean; message: string }>;
  toggleDepositStatusForTesting: () => void;
  isVerified: boolean;
  verificationStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  rejectionReason: string | null;
  verifiedDocsCount: number;
  totalDocsCount: number;
  refreshDriverProfile: (targetDriverId?: string) => Promise<void>;
}

const STORAGE_KEY_AUTH = '@pickmi_driver_auth';
const STORAGE_KEY_DRIVER = '@pickmi_driver_data';
const STORAGE_KEY_VEHICLE = '@pickmi_driver_vehicle';
const STORAGE_KEY_DOCUMENTS = '@pickmi_driver_documents';
const STORAGE_KEY_PROFILE_DONE = '@pickmi_driver_profile_done';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const NEW_DRIVER_TEMPLATE: Driver = {
  id: `drv_${Date.now()}`,
  name: '',
  mobile: '',
  email: '',
  profile_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  status: 'active',
  online_status: 'OFFLINE',
  rating: 0,
  total_trips: 0,
  created_at: new Date().toISOString(),
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [driver, setDriver] = useState<Driver>(INITIAL_DRIVER);
  const [vehicle, setVehicle] = useState<Vehicle>(INITIAL_VEHICLE);
  const [documents, setDocuments] = useState<DriverDocument[]>(INITIAL_DOCUMENTS);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isNewUser, setIsNewUser] = useState<boolean>(false);
  const [pendingMobile, setPendingMobile] = useState<string>('+91 98765 43210');

  useEffect(() => {
    loadPersistedAuth();
  }, []);

  const loadPersistedAuth = async () => {
    try {
      const storedAuth = await AsyncStorage.getItem(STORAGE_KEY_AUTH);
      const storedDriver = await AsyncStorage.getItem(STORAGE_KEY_DRIVER);
      const storedVehicle = await AsyncStorage.getItem(STORAGE_KEY_VEHICLE);
      const storedDocs = await AsyncStorage.getItem(STORAGE_KEY_DOCUMENTS);
      const profileDone = await AsyncStorage.getItem(STORAGE_KEY_PROFILE_DONE);

      if (storedAuth === 'true') {
        setIsLoggedIn(true);
        // If no profile done flag, they still need setup
        if (!profileDone) {
          setIsNewUser(true);
        }
      }
      if (storedDriver) {
        const parsed = JSON.parse(storedDriver);
        setDriver(parsed);
        refreshDriverProfile(parsed.id);
        registerForRemotePushNotificationsAsync(parsed.id).catch(() => {});
      }
      if (storedVehicle) {
        setVehicle(JSON.parse(storedVehicle));
      }
      if (storedDocs) {
        setDocuments(JSON.parse(storedDocs));
      }
    } catch (e) {
      console.error('Error loading persisted auth:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshDriverProfile = async (targetDriverId?: string) => {
    const drvId = targetDriverId || driver?.id;
    if (!drvId) return;

    try {
      const { data: updatedDriver } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', drvId)
        .maybeSingle();

      const [vehRes, docRes] = await Promise.all([
        supabase.from('vehicles').select('*').eq('driver_id', drvId).maybeSingle(),
        supabase.from('driver_documents').select('*').eq('driver_id', drvId),
      ]);

      if (updatedDriver) {
        setDriver((prev) => {
          const merged = { ...prev, ...updatedDriver };
          AsyncStorage.setItem(STORAGE_KEY_DRIVER, JSON.stringify(merged)).catch(() => {});
          return merged;
        });
      }

      if (vehRes.data) {
        setVehicle(vehRes.data as Vehicle);
        AsyncStorage.setItem(STORAGE_KEY_VEHICLE, JSON.stringify(vehRes.data)).catch(() => {});
      }

      if (docRes.data && docRes.data.length > 0) {
        setDocuments(docRes.data as DriverDocument[]);
        AsyncStorage.setItem(STORAGE_KEY_DOCUMENTS, JSON.stringify(docRes.data)).catch(() => {});
      }
    } catch (err) {
      console.warn('refreshDriverProfile failed:', err);
    }
  };

  // Realtime Supabase Sync: Instantly reflect Admin document & vehicle approvals
  useEffect(() => {
    if (!driver?.id) return;

    const channelName = `driver_live_sync_${driver.id}_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_documents',
          filter: `driver_id=eq.${driver.id}`,
        },
        () => {
          console.log('⚡ Realtime: Document update from Admin detected!');
          refreshDriverProfile(driver.id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drivers',
          filter: `id=eq.${driver.id}`,
        },
        () => {
          console.log('⚡ Realtime: Driver status update from Admin detected!');
          refreshDriverProfile(driver.id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicles',
          filter: `driver_id=eq.${driver.id}`,
        },
        () => {
          console.log('⚡ Realtime: Vehicle update from Admin detected!');
          refreshDriverProfile(driver.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driver?.id]);

  const sendOtp = async (mobile: string): Promise<boolean> => {
    setPendingMobile(mobile);
    return true;
  };

  const verifyOtp = async (enteredOtp: string): Promise<{ success: boolean; message?: string }> => {
    if (enteredOtp.trim() === '123456') {
      try {
        // 1. Check Supabase first for this phone number
        const supabaseData = await getDriverByMobile(pendingMobile);

        if (supabaseData.driver) {
          // Existing user in Supabase!
          setDriver(supabaseData.driver);
          if (supabaseData.vehicle) setVehicle(supabaseData.vehicle);
          if (supabaseData.documents.length > 0) setDocuments(supabaseData.documents);
          setIsNewUser(false);
          registerForRemotePushNotificationsAsync(supabaseData.driver.id).catch(() => {});
          await AsyncStorage.setItem(STORAGE_KEY_PROFILE_DONE, 'true');
          await AsyncStorage.setItem(STORAGE_KEY_DRIVER, JSON.stringify(supabaseData.driver));
          if (supabaseData.vehicle) {
            await AsyncStorage.setItem(STORAGE_KEY_VEHICLE, JSON.stringify(supabaseData.vehicle));
          }
          if (supabaseData.documents.length > 0) {
            await AsyncStorage.setItem(STORAGE_KEY_DOCUMENTS, JSON.stringify(supabaseData.documents));
          }
        } else {
          // Check local storage fallback ONLY if the stored driver mobile matches pendingMobile!
          const storedDriver = await AsyncStorage.getItem(STORAGE_KEY_DRIVER);
          const profileDone = await AsyncStorage.getItem(STORAGE_KEY_PROFILE_DONE);

          let parsedDriver: Driver | null = null;
          if (storedDriver) {
            try {
              parsedDriver = JSON.parse(storedDriver);
            } catch {}
          }

          const cleanedPending = pendingMobile.replace(/\s+/g, '');
          const cleanedStored = parsedDriver?.mobile?.replace(/\s+/g, '');

          if (parsedDriver && profileDone && cleanedStored && cleanedStored === cleanedPending) {
            setDriver(parsedDriver);
            setIsNewUser(false);
          } else {
            // Brand-new driver registration
            const newDriverId = `drv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            const newDriver: Driver = {
              ...NEW_DRIVER_TEMPLATE,
              id: newDriverId,
              mobile: pendingMobile,
            };
            setDriver(newDriver);
            setVehicle({
              id: `veh_${newDriverId}`,
              driver_id: newDriverId,
              vehicle_type: 'Sedan',
              vehicle_model: '',
              vehicle_number: '',
              created_at: new Date().toISOString(),
            });
            setDocuments([]);
            setIsNewUser(true);
            await AsyncStorage.removeItem(STORAGE_KEY_PROFILE_DONE);
          }
        }
      } catch (err) {
        console.warn('Error verifying driver against Supabase:', err);
      }

      setIsLoggedIn(true);
      await AsyncStorage.setItem(STORAGE_KEY_AUTH, 'true');
      return { success: true };
    }
    return { success: false, message: 'Invalid OTP. Please enter 123456.' };
  };

  const completeProfileSetup = async (
    customDriver?: Driver,
    customVehicle?: Vehicle,
    customDocs?: DriverDocument[]
  ): Promise<{ success: boolean; error?: string }> => {
    const activeDriver = customDriver || driver;
    const activeVehicle = customVehicle || vehicle;
    const activeDocs = customDocs || documents;

    if (!activeDriver.id || !activeDriver.name) {
      return { success: false, error: 'Driver name and ID are required' };
    }

    // 1. Sync to Supabase Database
    try {
      console.log('Syncing driver profile to Supabase:', activeDriver.name, activeDriver.mobile);
      const driverRes = await upsertDriverProfile(activeDriver);
      if (!driverRes.success || !driverRes.data) {
        return { success: false, error: driverRes.error || 'Failed to save driver profile' };
      }

      const savedDriver = driverRes.data;

      // 2. Sync vehicle to Supabase
      let savedVehicle = activeVehicle;
      if (activeVehicle.vehicle_number) {
        console.log('Syncing vehicle to Supabase:', activeVehicle.vehicle_number);
        const vehRes = await upsertVehicle({
          ...activeVehicle,
          driver_id: savedDriver.id,
        });
        if (!vehRes.success) {
          return { success: false, error: vehRes.error || 'Failed to save vehicle details' };
        }
        if (vehRes.data) savedVehicle = vehRes.data;
      }

      // 3. Sync documents to Supabase
      if (activeDocs && activeDocs.length > 0) {
        console.log('Syncing driver documents to Supabase count:', activeDocs.length);
        const docsRes = await syncDriverDocuments(
          activeDocs.map((d) => ({
            ...d,
            driver_id: savedDriver.id,
          }))
        );
        if (!docsRes.success) {
          console.warn('Documents sync warning:', docsRes.error);
        }
      }

      // 4. Persist locally
      setDriver(savedDriver);
      setVehicle(savedVehicle);
      setDocuments(activeDocs);
      setIsNewUser(false);
      await AsyncStorage.setItem(STORAGE_KEY_PROFILE_DONE, 'true');
      await AsyncStorage.setItem(STORAGE_KEY_DRIVER, JSON.stringify(savedDriver));
      await AsyncStorage.setItem(STORAGE_KEY_VEHICLE, JSON.stringify(savedVehicle));
      await AsyncStorage.setItem(STORAGE_KEY_DOCUMENTS, JSON.stringify(activeDocs));
      registerForRemotePushNotificationsAsync(savedDriver.id).catch(() => {});

      return { success: true };
    } catch (err: any) {
      console.error('Error pushing driver setup to Supabase:', err);
      return { success: false, error: err?.message || 'Network error saving driver' };
    }
  };

  // Verification compliance status calculation
  const verifiedDocsCount = documents.filter((d) => d.verification_status === 'Verified').length;
  const totalDocsCount = documents.length > 0 ? documents.length : 5;
  const anyRejectedDoc = documents.find((d) => d.verification_status === 'Rejected');
  const allDocsVerified = documents.length >= 3 && documents.every((d) => d.verification_status === 'Verified');
  const isVerified = (driver.status === 'active' || allDocsVerified) && !anyRejectedDoc;

  const verificationStatus: 'VERIFIED' | 'PENDING' | 'REJECTED' = anyRejectedDoc
    ? 'REJECTED'
    : isVerified
    ? 'VERIFIED'
    : 'PENDING';

  const rejectionReason = anyRejectedDoc?.rejection_reason || null;

  const toggleOnlineStatus = () => {
    if (!isVerified) {
      console.warn('Cannot toggle online: Driver documents are not verified yet');
      return;
    }
    setDriver((prev) => {
      const newStatus: OnlineStatus = prev.online_status === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
      const updated = { ...prev, online_status: newStatus };
      AsyncStorage.setItem(STORAGE_KEY_DRIVER, JSON.stringify(updated)).catch(() => {});
      // Sync online status to Supabase in background
      updateDriverOnlineStatusInSupabase(prev.id, newStatus).catch(() => {});
      if (newStatus === 'ONLINE') {
        registerForRemotePushNotificationsAsync(prev.id).catch(() => {});
      }
      return updated;
    });
  };

  const logout = async () => {
    setIsLoggedIn(false);
    setIsNewUser(false);
    await AsyncStorage.removeItem(STORAGE_KEY_AUTH);
    await AsyncStorage.removeItem(STORAGE_KEY_PROFILE_DONE);
    await AsyncStorage.removeItem(STORAGE_KEY_DRIVER);
    await AsyncStorage.removeItem(STORAGE_KEY_VEHICLE);
    await AsyncStorage.removeItem(STORAGE_KEY_DOCUMENTS);
  };

  const updateProfile = (data: Partial<Driver>) => {
    setDriver((prev) => {
      const updated = { ...prev, ...data };
      AsyncStorage.setItem(STORAGE_KEY_DRIVER, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  };

  const updateVehicle = (data: Partial<Vehicle>) => {
    setVehicle((prev) => {
      const updated = { ...prev, ...data };
      AsyncStorage.setItem(STORAGE_KEY_VEHICLE, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  };

  const updateDocuments = (docs: DriverDocument[]) => {
    setDocuments(docs);
    AsyncStorage.setItem(STORAGE_KEY_DOCUMENTS, JSON.stringify(docs)).catch(() => {});
  };

  const resetToNewUserForTesting = async () => {
    const randomMobile = `+91 9${Math.floor(100000000 + Math.random() * 900000000)}`;
    const newDriverId = `drv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const freshDriver: Driver = {
      ...NEW_DRIVER_TEMPLATE,
      id: newDriverId,
      name: '',
      mobile: randomMobile,
    };
    setDriver(freshDriver);
    setPendingMobile(randomMobile);
    setVehicle({
      id: `veh_${newDriverId}`,
      driver_id: newDriverId,
      vehicle_type: 'Sedan',
      vehicle_model: '',
      vehicle_number: '',
      created_at: new Date().toISOString(),
    });
    setDocuments([]);
    setIsNewUser(true);
    await AsyncStorage.removeItem(STORAGE_KEY_PROFILE_DONE);
    await AsyncStorage.removeItem(STORAGE_KEY_DRIVER);
  };

  const paySecurityDeposit = async (paymentId?: string) => {
    const now = new Date();
    const expiry = new Date();
    expiry.setFullYear(now.getFullYear() + 1); // Exact 1-year validity

    const generatedPayId = paymentId || `pay_rzp_${Date.now()}`;
    const updatedDriver: Driver = {
      ...driver,
      deposit_status: 'PAID',
      deposit_amount: 250,
      deposit_paid_at: now.toISOString(),
      deposit_expires_at: expiry.toISOString(),
      deposit_payment_id: generatedPayId,
    };

    setDriver(updatedDriver);
    await AsyncStorage.setItem(STORAGE_KEY_DRIVER, JSON.stringify(updatedDriver)).catch(() => {});
    updateDriverDepositInSupabase(driver.id, 'PAID', generatedPayId).catch(() => {});
  };

  const refundSecurityDeposit = async (): Promise<{ success: boolean; message: string }> => {
    if (driver.deposit_status !== 'PAID') {
      return { success: false, message: 'No active deposit found to refund.' };
    }

    if (driver.deposit_expires_at) {
      const expiry = new Date(driver.deposit_expires_at);
      if (new Date() > expiry) {
        return {
          success: false,
          message: 'Deposit has expired (1-year validity period ended) and is non-refundable.',
        };
      }
    }

    const updatedDriver: Driver = {
      ...driver,
      deposit_status: 'PENDING',
      deposit_amount: 250,
      deposit_paid_at: undefined,
      deposit_expires_at: undefined,
      deposit_payment_id: undefined,
    };

    setDriver(updatedDriver);
    await AsyncStorage.setItem(STORAGE_KEY_DRIVER, JSON.stringify(updatedDriver)).catch(() => {});
    return {
      success: true,
      message: '₹250 deposit has been refunded to your original payment method.',
    };
  };

  const toggleDepositStatusForTesting = () => {
    if (driver.deposit_status === 'PAID') {
      const updated: Driver = {
        ...driver,
        deposit_status: 'PENDING',
        deposit_paid_at: undefined,
        deposit_expires_at: undefined,
        deposit_payment_id: undefined,
      };
      setDriver(updated);
      AsyncStorage.setItem(STORAGE_KEY_DRIVER, JSON.stringify(updated)).catch(() => {});
    } else {
      paySecurityDeposit();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        driver,
        vehicle,
        documents,
        isLoggedIn,
        isLoading,
        isNewUser,
        pendingMobile,
        setPendingMobile,
        sendOtp,
        verifyOtp,
        completeProfileSetup,
        toggleOnlineStatus,
        logout,
        updateProfile,
        updateVehicle,
        updateDocuments,
        resetToNewUserForTesting,
        paySecurityDeposit,
        refundSecurityDeposit,
        toggleDepositStatusForTesting,
        isVerified,
        verificationStatus,
        rejectionReason,
        verifiedDocsCount,
        totalDocsCount,
        refreshDriverProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
