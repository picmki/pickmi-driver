import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppNotification } from '../types/database';
import { INITIAL_NOTIFICATIONS } from '../data/mockData';


interface NotificationContextType {
  notifications: AppNotification[];
  currentBanner: AppNotification | null;
  showToast: (
    title: string,
    message: string,
    type?: AppNotification['type'],
    tripId?: string
  ) => void;
  dismissBanner: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [currentBanner, setCurrentBanner] = useState<AppNotification | null>(null);

  const showToast = (
    title: string,
    message: string,
    type: AppNotification['type'] = 'system',
    tripId?: string
  ) => {
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      title,
      message,
      type,
      trip_id: tripId,
      read: false,
      created_at: new Date().toISOString(),
    };

    setNotifications((prev) => [newNotif, ...prev]);
    setCurrentBanner(newNotif);

    // Auto dismiss banner after 6 seconds
    setTimeout(() => {
      setCurrentBanner((current) => (current?.id === newNotif.id ? null : current));
    }, 6000);
  };

  const dismissBanner = () => {
    setCurrentBanner(null);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        currentBanner,
        showToast,
        dismissBanner,
        markAsRead,
        markAllAsRead,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
