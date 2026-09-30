import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Wallet, WalletTransaction, Trip } from '../types/database';
import { INITIAL_WALLET, INITIAL_TRANSACTIONS } from '../data/mockData';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';

export interface DynamicPeriodEarnings {
  totalAmount: number;
  tripsCount: number;
  avgFare: number;
  dateLabel: string;
  tripList: Array<{
    id: string;
    trip_number: string;
    pickup: string;
    drop: string;
    fare: number;
    date: string;
    type?: string;
  }>;
}

interface WalletContextType {
  wallet: Wallet;
  transactions: WalletTransaction[];
  isLoading: boolean;
  refreshWallet: () => Promise<void>;
  settleNegativeBalance: (amount: number, paymentId: string) => Promise<boolean>;
  addTripEarnings: (fare: number, tripNumber: string, pickup: string, drop: string) => void;
  recordCompletedTrip: (trip: Trip) => void;
  getEarningsForPeriod: (
    period: 'TODAY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM',
    customDate?: string // YYYY-MM-DD
  ) => DynamicPeriodEarnings;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Helper for local calendar date "YYYY-MM-DD"
const getLocalDateString = (d: Date = new Date()): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Safely extracts the local date from a trip's completion/update/creation timestamp
const getTripDateInfo = (t: Trip): { date: Date; dateStr: string } => {
  const raw = t.completed_at || t.updated_at || t.created_at;
  if (!raw) {
    const now = new Date();
    return { date: now, dateStr: getLocalDateString(now) };
  }
  const parsed = new Date(raw);
  if (isNaN(parsed.getTime())) {
    // If it's a formatted time string like "06:30 PM", it was completed TODAY
    const now = new Date();
    return { date: now, dateStr: getLocalDateString(now) };
  }
  return { date: parsed, dateStr: getLocalDateString(parsed) };
};

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { driver } = useAuth();
  const { showToast } = useNotifications();
  const [wallet, setWallet] = useState<Wallet>(INITIAL_WALLET);
  const [transactions, setTransactions] = useState<WalletTransaction[]>(INITIAL_TRANSACTIONS);
  const [driverTrips, setDriverTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const driverId = driver?.id || 'drv_karthik_01';

  // 1. Fetch real-time transactions & completed trips from Supabase
  const refreshWallet = async () => {
    setIsLoading(true);
    try {
      // Fetch all trips from Supabase
      const { data: tripsData } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch wallet transactions for this driver
      const { data: txData } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false });

      let currentTrips = driverTrips;
      if (tripsData && tripsData.length > 0) {
        // Relevant trips: assigned to this driver or unassigned
        const relevantTrips = (tripsData as Trip[]).filter((t) => {
          return !t.assigned_driver_id || t.assigned_driver_id === driverId;
        });
        currentTrips = relevantTrips;
        setDriverTrips(relevantTrips);
      }

      let currentTxs = transactions;
      const remoteTransactions = (txData || []) as WalletTransaction[];
      if (remoteTransactions.length > 0) {
        currentTxs = remoteTransactions;
        setTransactions(remoteTransactions);
      }

      // Calculate dynamic totals immediately
      calculateDynamicWallet(currentTrips, currentTxs);
    } catch (err) {
      console.warn('refreshWallet error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to calculate wallet balance & earnings
  const calculateDynamicWallet = (trips: Trip[], txs: WalletTransaction[]) => {
    const now = new Date();
    const todayStr = getLocalDateString(now);

    // Week start (Monday at 00:00:00 local time)
    const dayOfWeek = (now.getDay() + 6) % 7; // Mon=0
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek, 0, 0, 0, 0);

    // Month start (1st of month at 00:00:00 local time)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    // Completed trips for this driver
    const completed = trips.filter(
      (t) => t.status === 'COMPLETED' || Boolean(t.completed_at)
    );

    let todayTotal = 0;
    let weekTotal = 0;
    let monthTotal = 0;
    let allTripsTotal = 0;

    completed.forEach((t) => {
      const fare = Number(t.total_fare || t.fare || 0);
      const { date: tripDate, dateStr: tripDateStr } = getTripDateInfo(t);
      allTripsTotal += fare;

      if (tripDateStr === todayStr) {
        todayTotal += fare;
      }
      if (tripDate >= weekStart) {
        weekTotal += fare;
      }
      if (tripDate >= monthStart) {
        monthTotal += fare;
      }
    });

    // Sum penalty / fee transactions
    let penaltyDeductions = 0;
    let settlements = 0;

    txs.forEach((tx) => {
      const amt = Number(tx.amount || 0);
      if (tx.type === 'PENALTY' || tx.type === 'PLATFORM_FEE') {
        penaltyDeductions += Math.abs(amt);
      } else if (tx.type === 'WALLET_SETTLEMENT') {
        settlements += Math.abs(amt);
      }
    });

    // Balance = settlements or net balance (can be negative if penalties exceed settlements)
    const netBalance = settlements - penaltyDeductions;

    setWallet({
      id: `wal_${driverId}`,
      driver_id: driverId,
      balance: netBalance,
      today_earnings: todayTotal,
      this_week_earnings: weekTotal,
      this_month_earnings: monthTotal,
      updated_at: new Date().toISOString(),
    });
  };

  // Immediate in-memory completed trip recorder (0ms latency for driver)
  const recordCompletedTrip = (trip: Trip) => {
    setDriverTrips((prev) => {
      const exists = prev.some((t) => t.id === trip.id);
      const updated = exists ? prev.map((t) => (t.id === trip.id ? trip : t)) : [trip, ...prev];
      calculateDynamicWallet(updated, transactions);
      return updated;
    });
    // Also trigger background sync with Supabase
    refreshWallet().catch(() => {});
  };

  // Load on mount and on driver change, with Realtime subscriptions
  useEffect(() => {
    refreshWallet();

    // 1. Supabase Realtime Subscription to wallet_transactions (live penalties from Admin!)
    const txChannel = supabase
      .channel(`driver_wallet_tx_${driverId}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet_transactions',
          filter: `driver_id=eq.${driverId}`,
        },
        () => {
          refreshWallet();
        }
      )
      .subscribe();

    // 2. Supabase Realtime Subscription to trips (instant refresh when ANY trip completes!)
    const tripsChannel = supabase
      .channel(`driver_wallet_trips_${driverId}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips',
        },
        () => {
          refreshWallet();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(txChannel);
      supabase.removeChannel(tripsChannel);
    };
  }, [driverId]);

  // Dynamic filter for Today, Weekly, Monthly, or Custom Date
  const getEarningsForPeriod = (
    period: 'TODAY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM',
    customDate?: string
  ): DynamicPeriodEarnings => {
    const now = new Date();
    const todayStr = getLocalDateString(now);

    const dayOfWeek = (now.getDay() + 6) % 7;
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek, 0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    const completed = driverTrips.filter(
      (t) => t.status === 'COMPLETED' || Boolean(t.completed_at)
    );

    let filteredTrips: Trip[] = [];
    let dateLabel = '';

    if (period === 'TODAY') {
      filteredTrips = completed.filter((t) => {
        const { dateStr } = getTripDateInfo(t);
        return dateStr === todayStr;
      });
      dateLabel = `Today • ${now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else if (period === 'WEEKLY') {
      filteredTrips = completed.filter((t) => {
        const { date } = getTripDateInfo(t);
        return date >= weekStart;
      });
      dateLabel = `This Week (Mon - Sun)`;
    } else if (period === 'MONTHLY') {
      filteredTrips = completed.filter((t) => {
        const { date } = getTripDateInfo(t);
        return date >= monthStart;
      });
      dateLabel = `${now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`;
    } else if (period === 'CUSTOM' && customDate) {
      filteredTrips = completed.filter((t) => {
        const { dateStr } = getTripDateInfo(t);
        return dateStr === customDate;
      });
      const parsed = new Date(customDate);
      dateLabel = isNaN(parsed.getTime())
        ? customDate
        : parsed.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });
    }

    const totalAmount = filteredTrips.reduce(
      (acc, t) => acc + Number(t.total_fare || t.fare || 0),
      0
    );
    const tripsCount = filteredTrips.length;
    const avgFare = tripsCount > 0 ? Math.round(totalAmount / tripsCount) : 0;

    const tripList = filteredTrips.map((t) => {
      const { date: tripDate } = getTripDateInfo(t);
      return {
        id: t.id,
        trip_number: t.trip_number || `#PM${t.id.slice(0, 5)}`,
        pickup: (t.pickup_location || 'Pickup Location').split(',')[0],
        drop: (t.drop_location || 'Drop Location').split(',')[0],
        fare: Number(t.total_fare || t.fare || 0),
        date: tripDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: t.trip_type || 'One-way',
      };
    });

    return {
      totalAmount,
      tripsCount,
      avgFare,
      dateLabel,
      tripList,
    };
  };

  // Settle Negative Balance via Razorpay
  const settleNegativeBalance = async (amount: number, paymentId: string): Promise<boolean> => {
    try {
      const newTx: WalletTransaction = {
        id: `tx_settle_${Date.now()}`,
        driver_id: driverId,
        amount: Math.abs(amount),
        type: 'WALLET_SETTLEMENT',
        description: `Negative Balance Cleared via Razorpay (Ref: ${paymentId})`,
        created_at: new Date().toISOString(),
      };

      // Insert to Supabase
      await supabase.from('wallet_transactions').insert({
        id: newTx.id,
        driver_id: newTx.driver_id,
        amount: newTx.amount,
        type: newTx.type,
        description: newTx.description,
        created_at: newTx.created_at,
      });

      setTransactions((prev) => [newTx, ...prev]);

      // Restore wallet balance
      setWallet((prev) => ({
        ...prev,
        balance: prev.balance + Math.abs(amount),
        updated_at: new Date().toISOString(),
      }));

      showToast(
        'Balance Cleared!',
        `₹${amount.toLocaleString('en-IN')} paid successfully via Razorpay. Your account is in good standing.`,
        'wallet'
      );
      return true;
    } catch (err) {
      console.warn('settleNegativeBalance error:', err);
      return false;
    }
  };

  
  const addTripEarnings = (fare: number, tripNumber: string, pickup: string, drop: string) => {
    const newTx: WalletTransaction = {
      id: `tx_${Date.now()}`,
      driver_id: driverId,
      amount: fare,
      type: "TRIP_EARNING",
      description: `Trip Earnings (${tripNumber}) ${pickup.split(",")[0]} → ${drop.split(",")[0]}`,
      created_at: new Date().toISOString(),
    };
    setTransactions((prev) => [newTx, ...prev]);
    setWallet((prev) => ({
      ...prev,
      balance: prev.balance + fare,
      today_earnings: prev.today_earnings + fare,
      this_week_earnings: prev.this_week_earnings + fare,
      this_month_earnings: prev.this_month_earnings + fare,
    }));
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        transactions,
        isLoading,
        refreshWallet,
        settleNegativeBalance,
        addTripEarnings,
        recordCompletedTrip,
        getEarningsForPeriod,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
