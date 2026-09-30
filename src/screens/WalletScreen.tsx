import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../theme/colors';
import { PickMiHeader } from '../components/common/PickMiHeader';
import { PickMiButton } from '../components/common/PickMiButton';
import { PickMiDatePickerModal } from '../components/common/PickMiDatePickerModal';
import { RazorpayCheckoutModal } from '../components/common/RazorpayCheckoutModal';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';

type EarningsTab = 'TODAY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';

export const WalletScreen: React.FC = () => {
  const { wallet, transactions, isLoading, refreshWallet, settleNegativeBalance, getEarningsForPeriod } = useWallet();
  const { driver } = useAuth();

  const [earningsTab, setEarningsTab] = useState<EarningsTab>('TODAY');
  const [selectedCustomDate, setSelectedCustomDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showRazorpayPayModal, setShowRazorpayPayModal] = useState<boolean>(false);

  // Automatically refresh wallet data whenever the screen is opened
  useEffect(() => {
    refreshWallet();
  }, []);

  // Dynamic calculations for current period
  const periodData = getEarningsForPeriod(earningsTab, selectedCustomDate);
  const isNegativeBalance = wallet.balance < 0;
  const negativeAmount = Math.abs(wallet.balance);

  // Format custom date for display
  const formatCustomDateLabel = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  const handleClearNegativeSuccess = async (paymentId: string) => {
    setShowRazorpayPayModal(false);
    await settleNegativeBalance(negativeAmount, paymentId);
  };

  return (
    <View style={styles.container}>
      <PickMiHeader title="My Wallet" showLogo={false} showAvatar={false} />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. NEGATIVE BALANCE ALERT CARD & RAZORPAY CTA ── */}
        {isNegativeBalance && (
          <View style={[styles.negativeCard, Shadows.md]}>
            <View style={styles.negativeTopRow}>
              <View style={styles.negativeIconBox}>
                <Ionicons name="warning" size={24} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.negativeTitle}>Outstanding Balance Due</Text>
                <Text style={styles.negativeSubtitle}>
                  Your wallet has a negative balance due to administrative penalties or fees.
                </Text>
              </View>
            </View>

            <View style={styles.negativeAmountBox}>
              <Text style={styles.negativeCurrency}>- ₹</Text>
              <Text style={styles.negativeValue}>{negativeAmount.toFixed(2)}</Text>
            </View>

            <TouchableOpacity
              style={styles.payRazorpayCta}
              onPress={() => setShowRazorpayPayModal(true)}
              activeOpacity={0.88}
            >
              <View style={styles.rzpPill}>
                <Text style={styles.rzpPillText}>Razorpay</Text>
              </View>
              <Text style={styles.payRazorpayCtaText}>
                Pay ₹{negativeAmount.toFixed(2)} Now
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* ── 2. WALLET BALANCE CARD (When positive or zero) ── */}
        {!isNegativeBalance && (
          <View style={[styles.balanceCard, Shadows.md]}>
            <View style={styles.balanceHeader}>
              <View>
                <Text style={styles.balanceLabel}>Net Wallet Balance</Text>
                <Text style={styles.balanceAmount}>₹{wallet.balance.toFixed(2)}</Text>
              </View>
              <View style={styles.walletIconCircle}>
                <Ionicons name="wallet-outline" size={24} color={Colors.white} />
              </View>
            </View>

            <View style={styles.balanceActions}>
              <View style={styles.balanceStatusTag}>
                <View style={styles.statusGreenDot} />
                <Text style={styles.balanceStatusText}>Account in Good Standing</Text>
              </View>
              <TouchableOpacity onPress={() => refreshWallet()} disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="refresh" size={18} color="rgba(255,255,255,0.85)" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── 3. DYNAMIC EARNINGS SUMMARY CARD ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>DYNAMIC EARNINGS SUMMARY</Text>
        </View>

        <View style={[styles.singleEarningsCard, Shadows.sm]}>
          {/* Segmented Period Tabs: Today | Weekly | Monthly | Select Date */}
          <View style={styles.segmentedTabWrapper}>
            <TouchableOpacity
              style={[
                styles.segmentTabItem,
                earningsTab === 'TODAY' && styles.segmentTabItemActive,
              ]}
              onPress={() => setEarningsTab('TODAY')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentTabText,
                  earningsTab === 'TODAY' && styles.segmentTabTextActive,
                ]}
              >
                Today
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentTabItem,
                earningsTab === 'WEEKLY' && styles.segmentTabItemActive,
              ]}
              onPress={() => setEarningsTab('WEEKLY')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentTabText,
                  earningsTab === 'WEEKLY' && styles.segmentTabTextActive,
                ]}
              >
                Weekly
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentTabItem,
                earningsTab === 'MONTHLY' && styles.segmentTabItemActive,
              ]}
              onPress={() => setEarningsTab('MONTHLY')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentTabText,
                  earningsTab === 'MONTHLY' && styles.segmentTabTextActive,
                ]}
              >
                Monthly
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentTabItem,
                earningsTab === 'CUSTOM' && styles.segmentTabItemActive,
              ]}
              onPress={() => {
                setEarningsTab('CUSTOM');
                setShowDatePicker(true);
              }}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Ionicons
                  name="calendar-outline"
                  size={12}
                  color={earningsTab === 'CUSTOM' ? Colors.primary : Colors.textSecondary}
                />
                <Text
                  style={[
                    styles.segmentTabText,
                    earningsTab === 'CUSTOM' && styles.segmentTabTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {earningsTab === 'CUSTOM' ? formatCustomDateLabel(selectedCustomDate) : 'Date'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Earnings Hero Row */}
          <View style={styles.earningsMainRow}>
            <View>
              <Text style={styles.earningsSubLabel}>Driver Trip Earnings</Text>
              <Text style={styles.earningsHeroAmount}>
                ₹{periodData.totalAmount.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.trendBadgeBox}>
              <Ionicons name="trending-up" size={14} color={Colors.successDark} />
              <Text style={styles.trendBadgeText}>
                {periodData.tripsCount} {periodData.tripsCount === 1 ? 'Trip' : 'Trips'}
              </Text>
            </View>
          </View>

          {/* Date Range Badge */}
          <View style={styles.dateRangeBox}>
            <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.dateRangeText}>{periodData.dateLabel}</Text>
          </View>

          {/* Dynamic Metrics: Avg Fare & Completed Trips */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>COMPLETED TRIPS</Text>
              <Text style={styles.metricValue}>{periodData.tripsCount} Rides</Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>AVERAGE FARE</Text>
              <Text style={styles.metricValue}>₹{periodData.avgFare.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>STATUS</Text>
              <Text style={[styles.metricValue, { color: Colors.successDark }]}>Earned</Text>
            </View>
          </View>
        </View>

        {/* ── 4. COMPLETED TRIPS ON THIS PERIOD / DATE ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {earningsTab === 'CUSTOM'
              ? `TRIPS ON ${formatCustomDateLabel(selectedCustomDate).toUpperCase()}`
              : `${earningsTab} COMPLETED TRIPS`}
          </Text>
          <Text style={styles.transactionCount}>{periodData.tripList.length} Trips</Text>
        </View>

        <View style={styles.transactionsContainer}>
          {periodData.tripList.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="car-sport-outline" size={32} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Completed Trips</Text>
              <Text style={styles.emptySubtitle}>
                No trips were completed during this period. Go online to start earning!
              </Text>
            </View>
          ) : (
            periodData.tripList.map((trip) => (
              <View key={trip.id} style={[styles.txItem, Shadows.sm]}>
                <View style={[styles.txIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="checkmark-circle" size={20} color="#059669" />
                </View>

                <View style={styles.txDetails}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.txTripNumber}>{trip.trip_number}</Text>
                    <View style={styles.tripTypeTag}>
                      <Text style={styles.tripTypeTagText}>{trip.type}</Text>
                    </View>
                  </View>
                  <Text style={styles.txDescription} numberOfLines={1}>
                    {trip.pickup} → {trip.drop}
                  </Text>
                  <Text style={styles.txDate}>{trip.date}</Text>
                </View>

                <View style={styles.txAmountContainer}>
                  <Text style={[styles.txAmount, { color: '#059669' }]}>
                    + ₹{trip.fare.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.txStatusLabel}>Cash / Online</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* ── 5. PENALTIES & DEDUCTIONS LEDGER ── */}
        {transactions.some((t) => t.type === 'PENALTY' || t.type === 'PLATFORM_FEE') && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <Text style={[styles.sectionTitle, { color: '#DC2626' }]}>
                PENALTIES & DEDUCTIONS
              </Text>
            </View>

            <View style={styles.transactionsContainer}>
              {transactions
                .filter((t) => t.type === 'PENALTY' || t.type === 'PLATFORM_FEE')
                .map((tx) => (
                  <View key={tx.id} style={[styles.txItem, styles.penaltyItem]}>
                    <View style={[styles.txIconBox, { backgroundColor: '#FEE2E2' }]}>
                      <Ionicons name="alert-circle" size={20} color="#DC2626" />
                    </View>

                    <View style={styles.txDetails}>
                      <Text style={[styles.txDescription, { color: '#991B1B' }]}>
                        {tx.description || 'Administrative Penalty / Fee'}
                      </Text>
                      <Text style={styles.txDate}>
                        {tx.created_at
                          ? new Date(tx.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Recent'}
                      </Text>
                    </View>

                    <View style={styles.txAmountContainer}>
                      <Text style={[styles.txAmount, { color: '#DC2626' }]}>
                        - ₹{Math.abs(Number(tx.amount)).toFixed(2)}
                      </Text>
                      <Text style={[styles.txStatusLabel, { color: '#DC2626' }]}>Deducted</Text>
                    </View>
                  </View>
                ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Date Picker Modal for "Select Date" option */}
      <PickMiDatePickerModal
        visible={showDatePicker}
        title="Select Date for Earnings"
        initialDate={selectedCustomDate}
        futureOnly={false}
        onConfirm={(formattedDate: string) => {
          try {
            const parsed = new Date(formattedDate);
            if (!isNaN(parsed.getTime())) {
              const yyyy = parsed.getFullYear();
              const mm = String(parsed.getMonth() + 1).padStart(2, "0");
              const dd = String(parsed.getDate()).padStart(2, "0");
              setSelectedCustomDate(`${yyyy}-${mm}-${dd}`);
            } else {
              setSelectedCustomDate(formattedDate);
            }
          } catch {
            setSelectedCustomDate(formattedDate);
          }
          setEarningsTab("CUSTOM");
          setShowDatePicker(false);
        }}
        onClose={() => setShowDatePicker(false)}
      />

      {/* Real Razorpay Checkout Modal for Negative Balance Clearance */}
      <RazorpayCheckoutModal
        visible={showRazorpayPayModal}
        amount={negativeAmount}
        title="PickMi Wallet Clearance"
        description="Clear Negative Wallet Balance & Platform Fees"
        driverName={driver?.name || 'PickMi Driver'}
        driverMobile={driver?.mobile || '+91 98765 43210'}
        driverEmail={driver?.email || 'driver@pickmi.com'}
        onSuccess={handleClearNegativeSuccess}
        onClose={() => setShowRazorpayPayModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 10,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  transactionCount: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  // Negative Balance Warning Card
  negativeCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 22,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: '#FECACA',
  },
  negativeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  negativeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  negativeTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#991B1B',
  },
  negativeSubtitle: {
    fontSize: 12,
    color: '#7F1D1D',
    marginTop: 2,
    lineHeight: 16,
  },
  negativeAmountBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginVertical: 10,
  },
  negativeCurrency: {
    fontSize: 24,
    fontWeight: '900',
    color: '#DC2626',
  },
  negativeValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: -0.5,
  },
  payRazorpayCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0043DC',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  rzpPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rzpPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  payRazorpayCtaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  // Normal Balance Card
  balanceCard: {
    backgroundColor: Colors.primary,
    borderRadius: 22,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  balanceLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.white,
    marginTop: 4,
    letterSpacing: -0.5,
  },
  walletIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
  balanceStatusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusGreenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#34C759',
  },
  balanceStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.95)',
  },
  singleEarningsCard: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  segmentedTabWrapper: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  segmentTabItem: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  segmentTabItemActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  segmentTabTextActive: {
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  earningsMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  earningsSubLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  earningsHeroAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  trendBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    marginTop: 6,
  },
  trendBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.successDark,
  },
  dateRangeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    marginBottom: 14,
  },
  dateRangeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.borderLight,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  transactionsContainer: {
    paddingHorizontal: 16,
    gap: 10,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  penaltyItem: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FED7D7',
  },
  txIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txDetails: {
    flex: 1,
    marginRight: 8,
  },
  txTripNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  tripTypeTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tripTypeTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  txDescription: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  txDate: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  txAmountContainer: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  txStatusLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 240,
  },
});
