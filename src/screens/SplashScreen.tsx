import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { WhiteLogoSvg } from '../components/common/WhiteLogoSvg';

interface SplashScreenProps {
  onFinish: (isLoggedIn: boolean) => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { isLoggedIn, isLoading } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Smooth splash animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 750,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // After short delay, check login state
    const timer = setTimeout(() => {
      if (!isLoading) {
        onFinish(isLoggedIn);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isLoading, isLoggedIn]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0043DC" />

      {/* Centered PickMi Logo Only */}
      <Animated.View
        style={[
          styles.centerContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <WhiteLogoSvg width={160} height={56} />
      </Animated.View>

      {/* Bottom Copyright Text */}
      <View style={styles.footerContainer}>
        <Text style={styles.copyrightText}>Copyright © 2025 Pickmi</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0043DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 34,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  copyrightText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
    opacity: 0.9,
    letterSpacing: 0.2,
  },
});
