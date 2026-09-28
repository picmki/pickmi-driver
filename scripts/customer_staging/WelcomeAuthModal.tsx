import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from './theme';
import type { UserProfile } from './types';

interface WelcomeAuthModalProps {
  visible: boolean;
  onLoginSuccess: (user: UserProfile) => void;
  onClose?: () => void;
}

export const WelcomeAuthModal: React.FC<WelcomeAuthModalProps> = ({
  visible,
  onLoginSuccess,
  onClose,
}) => {
  const [screen, setScreen] = useState<'welcome' | 'auth'>('welcome');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let interval: any;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleSendOtp = () => {
    setErrorMsg(null);
    const cleanedMobile = mobile.replace(/[^0-9]/g, '');
    if (cleanedMobile.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
      setTimer(30);
      setOtp('4826'); // Pre-fill sample OTP for convenient mobile testing
    }, 600);
  };

  const handleVerifyOtp = () => {
    setErrorMsg(null);
    if (otp.length < 4) {
      setErrorMsg('Please enter the 4-digit code.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const userProfile: UserProfile = {
        id: 'usr_' + Date.now().toString(36),
        name: name.trim() || 'Karthik Prabhu',
        mobile: mobile.startsWith('+91') ? mobile : `+91 ${mobile.trim()}`,
        email: email.trim() || undefined,
      };
      onLoginSuccess(userProfile);
    }, 500);
  };

  const handleQuickDemoLogin = (demoName: string, demoMobile: string) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess({
        id: 'usr_demo_1',
        name: demoName,
        mobile: demoMobile,
        email: 'rider@pickmi.in',
      });
    }, 300);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {screen === 'welcome' ? (
              // WELCOME SCREEN
              <View style={styles.welcomeContainer}>
                {/* Brand Logo & Name */}
                <View style={styles.brandHero}>
                  <View style={styles.logoBadge}>
                    <Text style={styles.logoText}>PM</Text>
                  </View>
                  <Text style={styles.brandTitle}>PickMi</Text>
                  <Text style={styles.brandTagline}>
                    Enjoy a Smooth Drive. Go With Us.
                  </Text>
                  <View style={styles.futureBadge}>
                    <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.futureBadgeText}>PLANNED FUTURE RESERVATIONS ONLY</Text>
                  </View>
                </View>

                {/* Value Propositions */}
                <View style={styles.featureCards}>
                  <View style={styles.featureCard}>
                    <View style={styles.featureIconWrap}>
                      <Ionicons name="time" size={20} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.featureTitle}>Guaranteed On-Time Chauffeur</Text>
                      <Text style={styles.featureDesc}>
                        Book for tonight, tomorrow, or next week. Zero last-minute cancellations.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.featureCard}>
                    <View style={styles.featureIconWrap}>
                      <Ionicons name="cash-outline" size={20} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.featureTitle}>Fixed Transparent Fares</Text>
                      <Text style={styles.featureDesc}>
                        No surge pricing during rains or peak rush. All toll options clearly itemized.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.featureCard}>
                    <View style={styles.featureIconWrap}>
                      <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.featureTitle}>Safe & Verified Fleet</Text>
                      <Text style={styles.featureDesc}>
                        Police-verified drivers, clean AC cabins, and secure Trip-Start OTP protection.
                      </Text>
                    </View>
                  </View>
                </View>

                {/* CTAs */}
                <View style={styles.welcomeActions}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => {
                      setMode('signup');
                      setStep('phone');
                      setScreen('auth');
                    }}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.primaryButtonText}>Get Started</Text>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => {
                      setMode('login');
                      setStep('phone');
                      setScreen('auth');
                    }}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.secondaryButtonText}>Login with Mobile</Text>
                  </TouchableOpacity>

                  {/* Fast Demo Access */}
                  <TouchableOpacity
                    style={styles.demoLink}
                    onPress={() => handleQuickDemoLogin('Priya Sharma', '+91 97410 88291')}
                  >
                    <Text style={styles.demoLinkText}>
                      ⚡ Instant Demo Mode (Priya Sharma)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // AUTH SCREEN (LOGIN / SIGN UP)
              <View style={styles.authContainer}>
                {/* Back to Welcome */}
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    if (step === 'otp') {
                      setStep('phone');
                    } else {
                      setScreen('welcome');
                    }
                  }}
                >
                  <Ionicons name="chevron-back" size={24} color={COLORS.text} />
                  <Text style={styles.backText}>
                    {step === 'otp' ? 'Change Number' : 'Back'}
                  </Text>
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.authHeader}>
                  <Text style={styles.authTitle}>
                    {step === 'otp'
                      ? 'Verify Mobile Number'
                      : mode === 'signup'
                      ? 'Create Your Account'
                      : 'Welcome Back'}
                  </Text>
                  <Text style={styles.authSubtitle}>
                    {step === 'otp'
                      ? `Enter the 4-digit verification code sent to ${mobile}`
                      : 'Reserve your comfortable cabs ahead of time'}
                  </Text>
                </View>

                {/* Mode Selector (Login / Sign Up) only on Phone step */}
                {step === 'phone' && (
                  <View style={styles.modeTabs}>
                    <TouchableOpacity
                      style={[styles.modeTab, mode === 'login' && styles.modeTabActive]}
                      onPress={() => {
                        setMode('login');
                        setErrorMsg(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.modeTabText,
                          mode === 'login' && styles.modeTabTextActive,
                        ]}
                      >
                        Login
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modeTab, mode === 'signup' && styles.modeTabActive]}
                      onPress={() => {
                        setMode('signup');
                        setErrorMsg(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.modeTabText,
                          mode === 'signup' && styles.modeTabTextActive,
                        ]}
                      >
                        Sign Up
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Form Fields */}
                <View style={styles.formCard}>
                  {errorMsg && (
                    <View style={styles.errorBox}>
                      <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
                      <Text style={styles.errorText}>{errorMsg}</Text>
                    </View>
                  )}

                  {step === 'phone' ? (
                    <>
                      {mode === 'signup' && (
                        <View style={styles.fieldGroup}>
                          <Text style={styles.label}>FULL NAME *</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="e.g. Ramesh Kumar"
                            placeholderTextColor={COLORS.textMuted}
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                          />
                        </View>
                      )}

                      <View style={styles.fieldGroup}>
                        <Text style={styles.label}>MOBILE NUMBER *</Text>
                        <View style={styles.phoneInputWrap}>
                          <View style={styles.countryCodeBadge}>
                            <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                          </View>
                          <TextInput
                            style={styles.phoneInput}
                            placeholder="98765 43210"
                            placeholderTextColor={COLORS.textMuted}
                            keyboardType="phone-pad"
                            maxLength={10}
                            value={mobile}
                            onChangeText={setMobile}
                          />
                        </View>
                      </View>

                      {mode === 'signup' && (
                        <View style={styles.fieldGroup}>
                          <Text style={styles.label}>EMAIL ADDRESS (OPTIONAL)</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="e.g. ramesh@example.com"
                            placeholderTextColor={COLORS.textMuted}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                          />
                        </View>
                      )}

                      <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleSendOtp}
                        disabled={isLoading}
                        activeOpacity={0.88}
                      >
                        {isLoading ? (
                          <ActivityIndicator color={COLORS.white} />
                        ) : (
                          <>
                            <Text style={styles.primaryButtonText}>Send OTP Code</Text>
                            <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                          </>
                        )}
                      </TouchableOpacity>
                    </>
                  ) : (
                    // OTP Verification Step
                    <>
                      <View style={styles.fieldGroup}>
                        <Text style={styles.label}>ENTER 4-DIGIT CODE</Text>
                        <TextInput
                          style={styles.otpInput}
                          placeholder="• • • •"
                          placeholderTextColor={COLORS.textMuted}
                          keyboardType="number-pad"
                          maxLength={4}
                          value={otp}
                          onChangeText={setOtp}
                          autoFocus
                        />
                        <Text style={styles.otpHint}>
                          💡 For demo convenience, sample code is pre-filled as 4826
                        </Text>
                      </View>

                      <View style={styles.resendRow}>
                        {timer > 0 ? (
                          <Text style={styles.resendTimerText}>
                            Resend code in {timer}s
                          </Text>
                        ) : (
                          <TouchableOpacity onPress={handleSendOtp}>
                            <Text style={styles.resendLinkText}>Resend OTP Code</Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity onPress={() => setStep('phone')}>
                          <Text style={styles.changeNumberText}>Change Number</Text>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleVerifyOtp}
                        disabled={isLoading}
                        activeOpacity={0.88}
                      >
                        {isLoading ? (
                          <ActivityIndicator color={COLORS.white} />
                        ) : (
                          <>
                            <Text style={styles.primaryButtonText}>
                              Verify & Continue
                            </Text>
                            <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
                          </>
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                {/* Quick Skip for testing */}
                <TouchableOpacity
                  style={styles.demoLoginFooter}
                  onPress={() => handleQuickDemoLogin('Vikram Mehta', '+91 91234 56789')}
                >
                  <Text style={styles.demoFooterText}>
                    Skip and continue as Guest / Demo Rider
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  brandHero: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...SHADOWS.lg,
  },
  logoText: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -1,
  },
  brandTagline: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  futureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    marginTop: 14,
    gap: 6,
  },
  futureBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  featureCards: {
    gap: 12,
    marginVertical: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 14,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  featureDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  welcomeActions: {
    gap: 12,
    marginTop: 20,
  },
  primaryButton: {
    height: 54,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOWS.md,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  secondaryButton: {
    height: 52,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  demoLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  demoLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  authContainer: {
    flex: 1,
    paddingTop: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 4,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  authHeader: {
    marginBottom: 20,
  },
  authTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  authSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 6,
    lineHeight: 20,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  modeTabActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  modeTabText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  modeTabTextActive: {
    color: COLORS.primary,
  },
  formCard: {
    gap: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerLight,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.danger,
    flex: 1,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.6,
  },
  input: {
    height: 52,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  phoneInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    overflow: 'hidden',
  },
  countryCodeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  phoneInput: {
    flex: 1,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  otpInput: {
    height: 60,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 16,
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 8,
  },
  otpHint: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  resendTimerText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  resendLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  changeNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
  },
  demoLoginFooter: {
    alignItems: 'center',
    marginTop: 28,
    paddingVertical: 12,
  },
  demoFooterText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
});
