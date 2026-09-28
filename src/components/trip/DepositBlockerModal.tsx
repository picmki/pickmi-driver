import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { RazorpayCheckoutModal } from '../common/RazorpayCheckoutModal';

interface DepositBlockerModalProps {
  visible: boolean;
  onSuccessPay: () => void;
  onClose: () => void;
}

export const DepositBlockerModal: React.FC<DepositBlockerModalProps> = ({
  visible,
  onSuccessPay,
  onClose,
}) => {
  const { driver, paySecurityDeposit } = useAuth();
  const [showRazorpay, setShowRazorpay] = useState(false);

  const handleRazorpaySuccess = async (paymentId: string) => {
    setShowRazorpay(false);
    await paySecurityDeposit(paymentId);
    Alert.alert(
      'Deposit Activated! 🎉',
      `Your ₹250 security deposit has been paid via Razorpay (Ref: ${paymentId}). Trip requests are now unlocked for 1 year!`
    );
    onSuccessPay();
  };

  return (
    <>
      <Modal
        visible={visible && !showRazorpay}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={[styles.card, Shadows.lg]}>
            {/* Warning Shield Icon */}
            <View style={styles.iconCircleOuter}>
              <View style={styles.iconCircleInner}>
                <Ionicons name="shield-half" size={36} color="#D97706" />
              </View>
            </View>

            {/* Title & Badge */}
            <View style={styles.mandatoryPill}>
              <Ionicons name="lock-closed" size={12} color="#DC2626" />
              <Text style={styles.mandatoryPillText}>Mandatory Requirement</Text>
            </View>

            <Text style={styles.title}>Security Deposit Required</Text>
            <Text style={styles.subtitle}>
              You must pay the mandatory ₹250 security deposit before you can request or accept customer rides on PickMi.
            </Text>

            {/* Feature Highlights */}
            <View style={styles.benefitsCard}>
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.successDark} />
                <Text style={styles.benefitText}>
                  <Text style={{ fontWeight: '700' }}>1 Year Validity:</Text> Valid for 365 days
                </Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.successDark} />
                <Text style={styles.benefitText}>
                  <Text style={{ fontWeight: '700' }}>100% Refundable:</Text> Refundable within 1 year
                </Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons name="alert-circle" size={16} color="#D97706" />
                <Text style={styles.benefitText}>
                  <Text style={{ fontWeight: '700' }}>Non-Refundable:</Text> After 1-year expiry
                </Text>
              </View>
            </View>

            {/* Amount Callout */}
            <View style={styles.amountCallout}>
              <Text style={styles.amountCalloutLabel}>Deposit Amount</Text>
              <Text style={styles.amountCalloutValue}>₹250.00</Text>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={styles.payBtn}
              onPress={() => setShowRazorpay(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="shield-checkmark" size={18} color={Colors.white} />
              <Text style={styles.payBtnText}>Pay ₹250 via Razorpay Now</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Razorpay Demo Checkout Modal */}
      <RazorpayCheckoutModal
        visible={showRazorpay}
        amount={250}
        title="PickMi Driver Partner"
        description="Mandatory ₹250 Security Deposit"
        driverName={driver.name}
        driverMobile={driver.mobile}
        driverEmail={driver.email}
        onSuccess={handleRazorpaySuccess}
        onClose={() => setShowRazorpay(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
  },
  iconCircleOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconCircleInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mandatoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  mandatoryPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  benefitsCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    gap: 8,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontSize: 12,
    color: Colors.textPrimary,
    flex: 1,
  },
  amountCallout: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 18,
  },
  amountCalloutLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  amountCalloutValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#166534',
  },
  payBtn: {
    width: '100%',
    backgroundColor: '#0C2340',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: '#0C2340',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  payBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.white,
  },
  cancelBtn: {
    paddingVertical: 8,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
