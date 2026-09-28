import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../theme/colors';
import { PickMiButton } from '../components/common/PickMiButton';
import { useAuth } from '../context/AuthContext';

interface OtpScreenProps {
  onSuccess: () => void;
  onChangeNumber: () => void;
}

export const OtpScreen: React.FC<OtpScreenProps> = ({
  onSuccess,
  onChangeNumber,
}) => {
  const { pendingMobile, verifyOtp } = useAuth();
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleOtpChange = (value: string, index: number) => {
    if (errorMessage) setErrorMessage('');
    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);

    // Auto advance to next box
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (codeOverride?: string) => {
    const fullCode = codeOverride || otpValues.join('');
    if (fullCode.length < 6) {
      setErrorMessage('Please enter all 6 digits of the OTP');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    const result = await verifyOtp(fullCode);
    setIsLoading(false);

    if (result.success) {
      onSuccess();
    } else {
      setErrorMessage(result.message || 'Invalid OTP code.');
    }
  };

  const fillDummyOtp = () => {
    const dummy = ['1', '2', '3', '4', '5', '6'];
    setOtpValues(dummy);
    setErrorMessage('');
    handleVerify('123456');
  };

  const handleResend = () => {
    if (resendTimer === 0) {
      setResendTimer(30);
      setErrorMessage('');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.inner}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onChangeNumber}
              style={styles.backBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>Step 2 of 2</Text>
            </View>
          </View>

          {/* Body */}
          <View style={styles.content}>
            <Text style={styles.title}>Verify Your Number</Text>
            <Text style={styles.subtitle}>
              Enter the OTP sent to your mobile number.
            </Text>

            {/* Mobile Number Row with Change link */}
            <View style={styles.mobileRow}>
              <Ionicons name="call-outline" size={16} color={Colors.primary} />
              <Text style={styles.mobileText}>{pendingMobile}</Text>
              <TouchableOpacity onPress={onChangeNumber}>
                <Text style={styles.changeLink}>Change</Text>
              </TouchableOpacity>
            </View>

            {/* 6-Digit OTP Boxes */}
            <View style={styles.otpGrid}>
              {otpValues.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.otpBox,
                    Shadows.sm,
                    digit ? styles.otpBoxFilled : null,
                    errorMessage ? styles.otpBoxError : null,
                  ]}
                  value={digit}
                  onChangeText={(val) => handleOtpChange(val.slice(-1), index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus={true}
                  autoFocus={index === 0}
                />
              ))}
            </View>

            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Development Mode Dummy OTP Helper */}
            <TouchableOpacity
              style={styles.devOtpBanner}
              onPress={fillDummyOtp}
              activeOpacity={0.8}
            >
              <Ionicons name="key" size={16} color={Colors.primary} />
              <Text style={styles.devOtpText}>
                Dev Mode: Tap to Autofill OTP{' '}
                <Text style={styles.devOtpCode}>123456</Text>
              </Text>
            </TouchableOpacity>

            {/* Resend OTP Row */}
            <View style={styles.resendRow}>
              <Text style={styles.resendLabel}>Didn't receive the OTP?</Text>
              {resendTimer > 0 ? (
                <Text style={styles.resendCountdown}>Resend in {resendTimer}s</Text>
              ) : (
                <TouchableOpacity onPress={handleResend}>
                  <Text style={styles.resendButtonText}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Footer Action */}
          <View style={styles.footer}>
            <PickMiButton
              title="Verify & Proceed"
              onPress={() => handleVerify()}
              loading={isLoading}
              variant="primary"
              size="lg"
            />
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
    paddingTop: 54,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  content: {
    marginTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 22,
  },
  mobileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 28,
    alignSelf: 'flex-start',
  },
  mobileText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginLeft: 8,
    marginRight: 12,
  },
  changeLink: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 14,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  otpBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  otpBoxError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    color: Colors.danger,
    fontWeight: '600',
    marginLeft: 6,
  },
  devOtpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  devOtpText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginLeft: 8,
  },
  devOtpCode: {
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 1,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  resendLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 6,
  },
  resendCountdown: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  footer: {
    width: '100%',
  },
});
