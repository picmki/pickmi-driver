import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Wallet, WalletTransaction } from '../types/database';
import { INITIAL_WALLET, INITIAL_TRANSACTIONS } from '../data/mockData';
import { useNotifications } from './NotificationContext';

interface WalletContextType {
  wallet: Wallet;
  transactions: WalletTransaction[];
  addTripEarnings: (fare: number, tripNumber: string, pickup: string, drop: string) => void;
  requestPayout: (amount: number) => { success: boolean; message: string };
  loadWalletAmount: (amount: number) => { success: boolean; message: string };
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [wallet, setWallet] = useState<Wallet>(INITIAL_WALLET);
  const [transactions, setTransactions] = useState<WalletTransaction[]>(INITIAL_TRANSACTIONS);
  const { showToast } = useNotifications();

  const addTripEarnings = (fare: number, tripNumber: string, pickup: string, drop: string) => {
    const newTransaction: WalletTransaction = {
      id: `tx_${Date.now()}`,
      driver_id: wallet.driver_id,
      trip_id: tripNumber,
      type: 'TRIP_EARNING',
      amount: fare,
      description: `Trip Earnings (${tripNumber}) ${pickup.split(',')[0]} → ${drop.split(',')[0]}`,
      created_at: new Date().toISOString(),
    };

    setWallet((prev) => ({
      ...prev,
      balance: prev.balance + fare,
      today_earnings: prev.today_earnings + fare,
      this_week_earnings: prev.this_week_earnings + fare,
      this_month_earnings: prev.this_month_earnings + fare,
      updated_at: new Date().toISOString(),
    }));

    setTransactions((prev) => [newTransaction, ...prev]);

    showToast(
      'Wallet Credited',
      `₹${fare.toLocaleString('en-IN')} added to wallet for trip ${tripNumber}`,
      'wallet'
    );
  };

  const requestPayout = (amount: number): { success: boolean; message: string } => {
    if (amount <= 0) {
      return { success: false, message: 'Please enter a valid payout amount.' };
    }
    if (amount > wallet.balance) {
      return { success: false, message: 'Requested amount exceeds current available balance.' };
    }

    const newTransaction: WalletTransaction = {
      id: `tx_payout_${Date.now()}`,
      driver_id: wallet.driver_id,
      type: 'WITHDRAWAL',
      amount: -amount,
      description: `Bank Payout Transfer (HDFC Bank •• 4912)`,
      created_at: new Date().toISOString(),
    };

    setWallet((prev) => ({
      ...prev,
      balance: prev.balance - amount,
      updated_at: new Date().toISOString(),
    }));

    setTransactions((prev) => [newTransaction, ...prev]);

    showToast(
      'Payout Initiated',
      `₹${amount.toLocaleString('en-IN')} will be credited to your bank account within 2 hours.`,
      'wallet'
    );

    return { success: true, message: 'Payout requested successfully.' };
  };

  const loadWalletAmount = (amount: number): { success: boolean; message: string } => {
    if (amount <= 0) {
      return { success: false, message: 'Please enter a valid amount to load.' };
    }

    const newTransaction: WalletTransaction = {
      id: `tx_load_${Date.now()}`,
      driver_id: wallet.driver_id,
      type: 'DRIVER_DEPOSIT',
      amount: amount,
      description: `Wallet Loaded via UPI / Card`,
      created_at: new Date().toISOString(),
    };

    setWallet((prev) => ({
      ...prev,
      balance: prev.balance + amount,
      updated_at: new Date().toISOString(),
    }));

    setTransactions((prev) => [newTransaction, ...prev]);

    showToast(
      'Wallet Loaded',
      `₹${amount.toLocaleString('en-IN')} added to your wallet balance.`,
      'wallet'
    );

    return { success: true, message: 'Wallet balance loaded successfully.' };
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        transactions,
        addTripEarnings,
        requestPayout,
        loadWalletAmount,
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
