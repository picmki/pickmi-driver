import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../theme/colors';
import { PickMiButton } from '../components/common/PickMiButton';
import { useAuth } from '../context/AuthContext';

interface LoginScreenProps {
  onContinue: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onContinue }) => {
  const { pendingMobile, sendOtp } = useAuth();
  // Default to prompt's example +91 98765 43210
  const [phoneNumber, setPhoneNumber] = useState('98765 43210');
  const [countryCode, setCountryCode] = useState('+91');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleContinue = async () => {
    const rawDigits = phoneNumber.replace(/[^0-9]/g, '');
    if (rawDigits.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);

    const fullMobile = `${countryCode} ${phoneNumber.trim()}`;
    await sendOtp(fullMobile);
    setIsLoading(false);
    onContinue();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.inner}>
          {/* Top Brand Element */}
          <View style={styles.topSection}>
            <View style={styles.logoBadge}>
              <Ionicons name="car-sport" size={28} color={Colors.white} />
            </View>
            <Text style={styles.brandTitle}>
              Pick<Text style={styles.brandAccent}>Mi</Text>
            </Text>
          </View>

          {/* Form Content */}
          <View style={styles.contentSection}>
            <Text style={styles.title}>Welcome to PickMi</Text>
            <Text style={styles.subtitle}>
              Login to start managing your trips.
            </Text>

            {/* Input Label */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mobile Number</Text>
              <View style={[styles.inputRow, Shadows.sm, errorMsg ? styles.inputError : null]}>
                <View style={styles.countryCodeBox}>
                  <Text style={styles.flag}>🇮🇳</Text>
                  <Text style={styles.countryCodeText}>{countryCode}</Text>
                </View>
                <View style={styles.divider} />
                <TextInput
                  style={styles.textInput}
                  placeholder="98765 43210"
                  placeholderTextColor={Colors.textPlaceholder}
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text);
                    if (errorMsg) setErrorMsg('');
                  }}
                  maxLength={14}
                  autoFocus={true}
                />
              </View>
              {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
            </View>

            {/* Quick Helper Badge */}
            <View style={styles.infoBox}>
              <Ionicons name="shield-checkmark-outline" size={18} color={Colors.primary} />
              <Text style={styles.infoText}>
                We will send you a 6-digit OTP code to verify your mobile number.
              </Text>
            </View>
          </View>

          {/* Footer CTA */}
          <View style={styles.footerSection}>
            <PickMiButton
              title="Continue"
              onPress={handleContinue}
              loading={isLoading}
              variant="primary"
              size="lg"
              rightIcon={<Ionicons name="arrow-forward" size={20} color={Colors.white} />}
            />
            <Text style={styles.termsText}>
              By continuing, you agree to PickMi's{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> &{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  inner: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 36,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  brandAccent: {
    color: Colors.primary,
  },
  contentSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 32,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
    borderRadius: 14,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  countryCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
  },
  flag: {
    fontSize: 18,
    marginRight: 6,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  divider: {
    width: 1.5,
    height: 24,
    backgroundColor: Colors.border,
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: 6,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 10,
    flex: 1,
    lineHeight: 17,
  },
  footerSection: {
    width: '100%',
  },
  termsText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
