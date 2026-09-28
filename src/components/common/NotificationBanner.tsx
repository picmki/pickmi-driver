import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../../context/NotificationContext';
import { Colors, Shadows } from '../../theme/colors';

export const NotificationBanner: React.FC = () => {
  const { currentBanner, dismissBanner } = useNotifications();

  if (!currentBanner) return null;

  const getIcon = () => {
    switch (currentBanner.type) {
      case 'trip_assigned':
        return <Ionicons name="car-sport" size={24} color={Colors.white} />;
      case 'trip_completed':
        return <Ionicons name="checkmark-circle" size={24} color={Colors.white} />;
      case 'wallet':
        return <Ionicons name="wallet" size={24} color={Colors.white} />;
      case 'trip_available':
        return <Ionicons name="radio" size={24} color={Colors.white} />;
      default:
        return <Ionicons name="notifications" size={24} color={Colors.white} />;
    }
  };

  const getBackgroundColor = () => {
    switch (currentBanner.type) {
      case 'trip_assigned':
        return Colors.primary;
      case 'trip_completed':
        return Colors.success;
      case 'wallet':
        return '#0D9488'; // Teal
      case 'trip_available':
        return '#4F46E5'; // Indigo
      default:
        return Colors.textPrimary;
    }
  };

  return (
    <View style={styles.outerContainer} pointerEvents="box-none">
      <View
        style={[
          styles.banner,
          { backgroundColor: getBackgroundColor() },
          Shadows.lg,
        ]}
      >
        <View style={styles.iconContainer}>{getIcon()}</View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{currentBanner.title}</Text>
          <Text style={styles.message} numberOfLines={2}>
            {currentBanner.message}
          </Text>
        </View>

        <TouchableOpacity
          onPress={dismissBanner}
          style={styles.closeButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={20} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 16,
  },
  closeButton: {
    padding: 4,
  },
});
