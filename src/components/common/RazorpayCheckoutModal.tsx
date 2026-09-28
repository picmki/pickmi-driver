import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../theme/colors';
import { playOnlineSound } from '../../utils/soundEffects';

interface RazorpayCheckoutModalProps {
  visible: boolean;
  amount?: number;
  title?: string;
  description?: string;
  driverName?: string;
  driverMobile?: string;
  driverEmail?: string;
  onSuccess: (paymentId: string) => void;
  onClose: () => void;
}

type PaymentMethod = 'UPI' | 'CARD' | 'NETBANKING';

export const RazorpayCheckoutModal: React.FC<RazorpayCheckoutModalProps> = ({
  visible,
  amount = 250,
  title = 'PickMi Driver Partner',
  description = '1-Year Mandatory Security Deposit',
  driverName = 'Karthik P',
  driverMobile = '+91 98765 43210',
  driverEmail = 'driver@pickmi.com',
  onSuccess,
  onClose,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('UPI');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'GPAY' | 'PHONEPE' | 'PAYTM'>('GPAY');
  const [paymentState, setPaymentState] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS'>('IDLE');
  const [generatedPaymentId, setGeneratedPaymentId] = useState('');

  const handlePay = async () => {
    setPaymentState('PROCESSING');

    // Simulate authentic Razorpay bank gateway processing
    await new Promise((resolve) => setTimeout(resolve, 1400));

    const paymentId = `pay_rzp_${Math.random().toString(36).substring(2, 9).toUpperCase()}${Date.now().toString().slice(-4)}`;
    setGeneratedPaymentId(paymentId);
    setPaymentState('SUCCESS');
    playOnlineSound();

    setTimeout(() => {
      setPaymentState('IDLE');
      onSuccess(paymentId);
    }, 1200);
  };

  const handleClose = () => {
    if (paymentState === 'PROCESSING') return;
    setPaymentState('IDLE');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, Shadows.lg]}>
          {/* Razorpay Authentic Branded Header */}
          <View style={styles.rzpHeader}>
            <View style={styles.rzpHeaderTop}>
              <View style={styles.brandRow}>
                <View style={styles.rzpBadge}>
                  <Text style={styles.rzpBadgeText}>Razorpay</Text>
                </View>
                <View style={styles.testModePill}>
                  <Text style={styles.testModeText}>TEST / DEMO</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleClose}
                disabled={paymentState === 'PROCESSING'}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color="rgba(255, 255, 255, 0.8)" />
              </TouchableOpacity>
            </View>

            <View style={styles.orderInfo}>
              <Text style={styles.merchantName}>{title}</Text>
              <Text style={styles.orderDescription}>{description}</Text>
              <View style={styles.amountRow}>
                <Text style={styles.amountCurrency}>₹</Text>
                <Text style={styles.amountValue}>{amount.toFixed(2)}</Text>
              </View>
            </View>

            {/* Customer Details Pill */}
            <View style={styles.customerPill}>
              <Ionicons name="person-circle-outline" size={16} color="rgba(255, 255, 255, 0.7)" />
              <Text style={styles.customerText} numberOfLines={1}>
                {driverName} • {driverMobile}
              </Text>
            </View>
          </View>

          {/* Body Content */}
          {paymentState === 'PROCESSING' ? (
            <View style={styles.statusBox}>
              <ActivityIndicator size="large" color="#0C2340" />
              <Text style={styles.statusTitle}>Processing Payment…</Text>
              <Text style={styles.statusSubtitle}>
                Connecting to Razorpay Banking Gateway & Authorizing ₹{amount.toFixed(2)}
              </Text>
              <View style={styles.secureNotice}>
                <Ionicons name="lock-closed" size={14} color={Colors.textMuted} />
                <Text style={styles.secureNoticeText}>256-bit SSL Encrypted Demo Transaction</Text>
              </View>
            </View>
          ) : paymentState === 'SUCCESS' ? (
            <View style={styles.statusBox}>
              <View style={styles.successCircle}>
                <Ionicons name="checkmark" size={38} color={Colors.white} />
              </View>
              <Text style={[styles.statusTitle, { color: Colors.successDark }]}>
                Payment Successful!
              </Text>
              <Text style={styles.paymentIdText}>ID: {generatedPaymentId}</Text>
              <Text style={styles.statusSubtitle}>
                ₹{amount.toFixed(2)} Security Deposit Paid • 1 Year Validity Activated
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
              {/* Payment Methods Tab */}
              <View style={styles.methodSelector}>
                <TouchableOpacity
                  style={[
                    styles.methodTab,
                    selectedMethod === 'UPI' && styles.methodTabActive,
                  ]}
                  onPress={() => setSelectedMethod('UPI')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="phone-portrait-outline"
                    size={16}
                    color={selectedMethod === 'UPI' ? '#0C2340' : Colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.methodTabText,
                      selectedMethod === 'UPI' && styles.methodTabTextActive,
                    ]}
                  >
                    UPI Apps
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.methodTab,
                    selectedMethod === 'CARD' && styles.methodTabActive,
                  ]}
                  onPress={() => setSelectedMethod('CARD')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="card-outline"
                    size={16}
                    color={selectedMethod === 'CARD' ? '#0C2340' : Colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.methodTabText,
                      selectedMethod === 'CARD' && styles.methodTabTextActive,
                    ]}
                  >
                    Cards
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.methodTab,
                    selectedMethod === 'NETBANKING' && styles.methodTabActive,
                  ]}
                  onPress={() => setSelectedMethod('NETBANKING')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="globe-outline"
                    size={16}
                    color={selectedMethod === 'NETBANKING' ? '#0C2340' : Colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.methodTabText,
                      selectedMethod === 'NETBANKING' && styles.methodTabTextActive,
                    ]}
                  >
                    Netbanking
                  </Text>
                </TouchableOpacity>
              </View>

              {/* UPI Option */}
              {selectedMethod === 'UPI' && (
                <View style={styles.optionSection}>
                  <Text style={styles.sectionHeaderTitle}>SELECT UPI APP</Text>

                  <TouchableOpacity
                    style={[
                      styles.upiOptionCard,
                      selectedUpiApp === 'GPAY' && styles.upiOptionCardActive,
                    ]}
                    onPress={() => setSelectedUpiApp('GPAY')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.upiIconWrap}>
                      <Ionicons name="logo-google" size={20} color="#EA4335" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.upiTitle}>Google Pay UPI</Text>
                      <Text style={styles.upiSub}>Instant 1-tap checkout</Text>
                    </View>
                    <Ionicons
                      name={
                        selectedUpiApp === 'GPAY'
                          ? 'radio-button-on'
                          : 'radio-button-off'
                      }
                      size={20}
                      color={selectedUpiApp === 'GPAY' ? '#0C2340' : Colors.textMuted}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.upiOptionCard,
                      selectedUpiApp === 'PHONEPE' && styles.upiOptionCardActive,
                    ]}
                    onPress={() => setSelectedUpiApp('PHONEPE')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.upiIconWrap}>
                      <Ionicons name="flash-outline" size={20} color="#5F259F" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.upiTitle}>PhonePe UPI</Text>
                      <Text style={styles.upiSub}>Fast bank-to-bank transfer</Text>
                    </View>
                    <Ionicons
                      name={
                        selectedUpiApp === 'PHONEPE'
                          ? 'radio-button-on'
                          : 'radio-button-off'
                      }
                      size={20}
                      color={selectedUpiApp === 'PHONEPE' ? '#0C2340' : Colors.textMuted}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.upiOptionCard,
                      selectedUpiApp === 'PAYTM' && styles.upiOptionCardActive,
                    ]}
                    onPress={() => setSelectedUpiApp('PAYTM')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.upiIconWrap}>
                      <Ionicons name="wallet-outline" size={20} color="#00BAF2" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.upiTitle}>Paytm / Any UPI ID</Text>
                      <Text style={styles.upiSub}>UPI handle or QR</Text>
                    </View>
                    <Ionicons
                      name={
                        selectedUpiApp === 'PAYTM'
                          ? 'radio-button-on'
                          : 'radio-button-off'
                      }
                      size={20}
                      color={selectedUpiApp === 'PAYTM' ? '#0C2340' : Colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              )}

              {/* CARD Option */}
              {selectedMethod === 'CARD' && (
                <View style={styles.optionSection}>
                  <Text style={styles.sectionHeaderTitle}>TEST CARD (PRE-FILLED)</Text>
                  <View style={styles.cardPreviewBox}>
                    <View style={styles.cardTopRow}>
                      <Text style={styles.cardBankText}>TEST BANK</Text>
                      <Ionicons name="card" size={24} color="#0C2340" />
                    </View>
                    <Text style={styles.cardNumberText}>4111 •••• •••• 1111</Text>
                    <View style={styles.cardBottomRow}>
                      <View>
                        <Text style={styles.cardLabel}>CARD HOLDER</Text>
                        <Text style={styles.cardValueText}>{driverName}</Text>
                      </View>
                      <View>
                        <Text style={styles.cardLabel}>EXPIRES</Text>
                        <Text style={styles.cardValueText}>12/28</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* NETBANKING Option */}
              {selectedMethod === 'NETBANKING' && (
                <View style={styles.optionSection}>
                  <Text style={styles.sectionHeaderTitle}>POPULAR INDIAN BANKS</Text>
                  <View style={styles.bankGrid}>
                    {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank'].map(
                      (bank, idx) => (
                        <View key={idx} style={styles.bankChip}>
                          <Ionicons name="business-outline" size={16} color="#0C2340" />
                          <Text style={styles.bankChipText}>{bank}</Text>
                        </View>
                      )
                    )}
                  </View>
                </View>
              )}

              {/* Security Policy Reminder */}
              <View style={styles.policyBox}>
                <Ionicons name="shield-checkmark" size={16} color="#0D9488" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.policyTitle}>₹250 Security Deposit Policy</Text>
                  <Text style={styles.policyDesc}>
                    • 1 Year validity from payment date.{'\n'}
                    • 100% refundable if requested within 1 year.{'\n'}
                    • Non-refundable after 1 year expiry.
                  </Text>
                </View>
              </View>

              {/* Pay Action Button */}
              <TouchableOpacity
                style={styles.payBtn}
                onPress={handlePay}
                activeOpacity={0.85}
              >
                <Ionicons name="lock-closed" size={16} color={Colors.white} />
                <Text style={styles.payBtnText}>Pay ₹{amount.toFixed(2)} via Razorpay</Text>
              </TouchableOpacity>

              <View style={styles.secureFooterRow}>
                <Ionicons name="shield" size={12} color={Colors.textMuted} />
                <Text style={styles.secureFooterText}>
                  Razorpay Verified Demo Gateway • PCI-DSS Compliant
                </Text>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  rzpHeader: {
    backgroundColor: '#0C2340',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
  },
  rzpHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rzpBadge: {
    backgroundColor: '#3395FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  rzpBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  testModePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  testModeText: {
    color: '#93C5FD',
    fontSize: 10,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  orderInfo: {
    marginBottom: 10,
  },
  merchantName: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  orderDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  amountCurrency: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
    marginRight: 2,
  },
  amountValue: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  customerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  customerText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '600',
  },
  bodyScroll: {
    padding: 16,
  },
  methodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  methodTabActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  methodTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  methodTabTextActive: {
    color: '#0C2340',
    fontWeight: '800',
  },
  optionSection: {
    marginBottom: 14,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  upiOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 8,
  },
  upiOptionCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  upiIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  upiTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  upiSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  cardPreviewBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardBankText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0C2340',
    letterSpacing: 1,
  },
  cardNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 2,
    marginBottom: 16,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  cardValueText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  bankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bankChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    width: '48%',
  },
  bankChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  policyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    padding: 12,
    marginBottom: 16,
  },
  policyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D9488',
    marginBottom: 2,
  },
  policyDesc: {
    fontSize: 11,
    color: '#115E59',
    lineHeight: 16,
  },
  payBtn: {
    backgroundColor: '#0C2340',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#0C2340',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  payBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  secureFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 10,
    marginBottom: 8,
  },
  secureFooterText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  statusBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 44,
    paddingHorizontal: 20,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 16,
    textAlign: 'center',
  },
  statusSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 280,
  },
  secureNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  secureNoticeText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  successCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  paymentIdText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
    color: Colors.textMuted,
    marginTop: 6,
  },
});
