import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { RazorpayCheckoutModal } from '../common/RazorpayCheckoutModal';

interface SecurityDepositModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SecurityDepositModal: React.FC<SecurityDepositModalProps> = ({
  visible,
  onClose,
}) => {
  const { driver, paySecurityDeposit } = useAuth();
  const [showRazorpay, setShowRazorpay] = useState(false);

  const isPaid = driver.deposit_status === 'PAID';

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    setShowRazorpay(false);
    await paySecurityDeposit(paymentId);
    Alert.alert(
      'Deposit Successful! 🎉',
      `₹250 Security Deposit paid successfully.\nRazorpay Ref: ${paymentId}\n\nYour 1-year deposit validity is now active! You can now request trips.`
    );
  };

  return (
    <>
      <Modal
        visible={visible && !showRazorpay}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={[styles.sheet, Shadows.lg]}>
            {/* Sheet Handle */}
            <View style={styles.handleBar} />

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.iconCircle}>
                  <Ionicons name="shield-checkmark" size={22} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.title}>Security Deposit</Text>
                  <Text style={styles.subtitle}>1-Year Mandatory Partner Security</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.contentScroll}>
              {/* Deposit Hero Card */}
              <View
                style={[
                  styles.heroCard,
                  isPaid ? styles.heroCardPaid : styles.heroCardPending,
                ]}
              >
                <View style={styles.heroTop}>
                  <Text style={styles.heroLabel}>COMPULSORY DEPOSIT</Text>
                  <View
                    style={[
                      styles.statusPill,
                      isPaid ? styles.statusPillPaid : styles.statusPillPending,
                    ]}
                  >
                    <Ionicons
                      name={isPaid ? 'checkmark-circle' : 'alert-circle'}
                      size={13}
                      color={isPaid ? Colors.successDark : '#B45309'}
                    />
                    <Text
                      style={[
                        styles.statusPillText,
                        isPaid ? { color: Colors.successDark } : { color: '#B45309' },
                      ]}
                    >
                      {isPaid ? 'Active & Paid' : 'Payment Required'}
                    </Text>
                  </View>
                </View>

                <View style={styles.amountDisplay}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <Text style={styles.amountNum}>250</Text>
                  <Text style={styles.validityTag}>/ 1 Year</Text>
                </View>

                <Text style={styles.heroDescription}>
                  {isPaid
                    ? `Valid until ${formatDate(driver.deposit_expires_at)}. 100% refundable within this period.`
                    : 'Compulsory one-time annual deposit required to request and accept rides.'}
                </Text>
              </View>

              {/* Deposit Details Table */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>DEPOSIT DETAILS</Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Deposit Amount</Text>
                  <Text style={styles.detailValue}>₹250.00</Text>
                </View>

                <View style={styles.detailDivider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Validity Period</Text>
                  <Text style={styles.detailValue}>1 Year (365 Days)</Text>
                </View>

                <View style={styles.detailDivider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment Status</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: isPaid ? Colors.successDark : '#D97706', fontWeight: '800' },
                    ]}
                  >
                    {isPaid ? 'PAID' : 'PENDING'}
                  </Text>
                </View>

                {isPaid && (
                  <>
                    <View style={styles.detailDivider} />
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Payment Date</Text>
                      <Text style={styles.detailValue}>{formatDate(driver.deposit_paid_at)}</Text>
                    </View>

                    <View style={styles.detailDivider} />
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Valid Until (Expiry)</Text>
                      <Text style={styles.detailValue}>{formatDate(driver.deposit_expires_at)}</Text>
                    </View>

                    {driver.deposit_payment_id && (
                      <>
                        <View style={styles.detailDivider} />
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Razorpay Ref</Text>
                          <Text style={styles.detailValueCode}>{driver.deposit_payment_id}</Text>
                        </View>
                      </>
                    )}
                  </>
                )}
              </View>

              {/* Refund Policy Information Box */}
              <View style={styles.policyCard}>
                <View style={styles.policyHeader}>
                  <Ionicons name="information-circle" size={18} color="#0D9488" />
                  <Text style={styles.policyTitle}>Mandatory Deposit & Refund Policy</Text>
                </View>

                <View style={styles.policyBullet}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.policyBulletText}>
                    <Text style={{ fontWeight: '700' }}>Compulsory for Trips:</Text> Only drivers who have paid the ₹250 security deposit can request and accept customer rides.
                  </Text>
                </View>

                <View style={styles.policyBullet}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.policyBulletText}>
                    <Text style={{ fontWeight: '700' }}>1 Year Validity:</Text> The deposit remains active for exactly 365 days from the time of Razorpay payment.
                  </Text>
                </View>

                <View style={styles.policyBullet}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.policyBulletText}>
                    <Text style={{ fontWeight: '700' }}>365 Days Only Refundable:</Text> The ₹250 amount is{' '}
                    <Text style={{ fontWeight: '700', color: Colors.successDark }}>
                      strictly refundable only within 365 days
                    </Text>{' '}
                    from the payment date.
                  </Text>
                </View>

                <View style={styles.policyBullet}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.policyBulletText}>
                    <Text style={{ fontWeight: '700' }}>After 365 Days Non-Refundable:</Text> Once the 365-day validity period expires, the deposit is{' '}
                    <Text style={{ fontWeight: '700', color: Colors.danger }}>
                      strictly non-refundable
                    </Text>.
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionContainer}>
                {!isPaid ? (
                  <TouchableOpacity
                    style={styles.payRazorpayBtn}
                    onPress={() => setShowRazorpay(true)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="shield-checkmark" size={18} color={Colors.white} />
                    <Text style={styles.payRazorpayBtnText}>Pay ₹250 via Razorpay</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.depositActiveBadgeBox}>
                    <Ionicons name="checkmark-circle" size={18} color={Colors.successDark} />
                    <Text style={styles.depositActiveBadgeText}>
                      Security Deposit Active • Valid for 365 Days
                    </Text>
                  </View>
                )}

                <TouchableOpacity style={styles.dismissBtn} onPress={onClose} activeOpacity={0.8}>
                  <Text style={styles.dismissBtnText}>{isPaid ? 'Done' : 'Close'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Razorpay Demo Checkout Modal */}
      <RazorpayCheckoutModal
        visible={showRazorpay}
        amount={250}
        title="PickMi Driver Security Deposit"
        description="1-Year Compulsory Partner Security Deposit"
        driverName={driver.name}
        driverMobile={driver.mobile}
        driverEmail={driver.email}
        onSuccess={handlePaymentSuccess}
        onClose={() => setShowRazorpay(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: 24,
  },
  handleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  contentScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  heroCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
  },
  heroCardPaid: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  heroCardPending: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPillPaid: {
    backgroundColor: Colors.successLight,
  },
  statusPillPending: {
    backgroundColor: '#FEF3C7',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  amountDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  currencySymbol: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginRight: 2,
  },
  amountNum: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  validityTag: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  heroDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  infoSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  detailValueCode: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: 'monospace',
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  policyCard: {
    backgroundColor: '#F0FDFA',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginBottom: 20,
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  policyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F766E',
  },
  policyBullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletDot: {
    fontSize: 14,
    color: '#0F766E',
    marginRight: 6,
    lineHeight: 18,
  },
  policyBulletText: {
    fontSize: 12,
    color: '#134E4A',
    flex: 1,
    lineHeight: 17,
  },
  actionContainer: {
    gap: 10,
    marginBottom: 20,
  },
  payRazorpayBtn: {
    backgroundColor: '#0C2340',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  payRazorpayBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.white,
  },
  depositActiveBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingVertical: 13,
    borderRadius: 14,
  },
  depositActiveBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.successDark,
  },
  dismissBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  dismissBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
