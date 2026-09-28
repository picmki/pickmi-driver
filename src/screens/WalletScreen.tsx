import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../theme/colors';
import { PickMiHeader } from '../components/common/PickMiHeader';
import { PickMiButton } from '../components/common/PickMiButton';
import { useWallet } from '../context/WalletContext';

type EarningsTab = 'TODAY' | 'WEEKLY' | 'MONTHLY';

export const WalletScreen: React.FC = () => {
  const { wallet, transactions, loadWalletAmount } = useWallet();
  const [earningsTab, setEarningsTab] = useState<EarningsTab>('TODAY');
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [loadAmountInput, setLoadAmountInput] = useState('1000');

  const handleLoadSubmit = () => {
    const num = parseFloat(loadAmountInput);
    if (isNaN(num) || num <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to load.');
      return;
    }
    const res = loadWalletAmount(num);
    if (res.success) {
      setShowLoadModal(false);
      setLoadAmountInput('1000');
    } else {
      Alert.alert('Notice', res.message);
    }
  };

  // Dynamic values based on selected earnings tab
  const getTabContent = () => {
    switch (earningsTab) {
      case 'TODAY':
        return {
          amount: wallet.today_earnings,
          dateRange: 'Today • 27 Sep 2026 • 06:00 AM - Now',
          tripsCount: '3 Trips',
          avgFare: '₹816 / trip',
          onlineHours: '4.5 hrs',
          badgeText: '+14% vs yesterday',
        };
      case 'WEEKLY':
        return {
          amount: wallet.this_week_earnings,
          dateRange: '21 Sep 2026 - 27 Sep 2026 (Mon - Sun)',
          tripsCount: '18 Trips',
          avgFare: '₹822 / trip',
          onlineHours: '29.4 hrs',
          badgeText: '+9% vs last week',
        };
      case 'MONTHLY':
        return {
          amount: wallet.this_month_earnings,
          dateRange: '01 Sep 2026 - 27 Sep 2026 (September 2026)',
          tripsCount: '82 Trips',
          avgFare: '₹710 / trip',
          onlineHours: '118 hrs',
          badgeText: 'Top 10% Partner',
        };
    }
  };

  const currentTabInfo = getTabContent();

  return (
    <View style={styles.container}>
      {/* Clean Header without bottom line and without avatar */}
      <PickMiHeader title="My Wallet" showLogo={false} showAvatar={false} />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. EARNINGS SUMMARY: SINGLE UNIFIED CARD (as requested) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>EARNINGS SUMMARY</Text>
        </View>

        <View style={[styles.singleEarningsCard, Shadows.sm]}>
          {/* Segmented Period Tabs at Top: Today | Weekly | Monthly */}
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
          </View>

          {/* Amount on Left & Badge on Right */}
          <View style={styles.earningsMainRow}>
            <View>
              <Text style={styles.earningsSubLabel}>Total Net Earnings</Text>
              <Text style={styles.earningsHeroAmount}>
                ₹{currentTabInfo.amount.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.trendBadgeBox}>
              <Ionicons name="trending-up" size={14} color={Colors.successDark} />
              <Text style={styles.trendBadgeText}>{currentTabInfo.badgeText}</Text>
            </View>
          </View>

          {/* Date & Time Range Info */}
          <View style={styles.dateRangeBox}>
            <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.dateRangeText}>{currentTabInfo.dateRange}</Text>
          </View>

          {/* Metrics Row Inside Card */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>TRIPS</Text>
              <Text style={styles.metricValue}>{currentTabInfo.tripsCount}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>AVG FARE</Text>
              <Text style={styles.metricValue}>{currentTabInfo.avgFare}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>HOURS</Text>
              <Text style={styles.metricValue}>{currentTabInfo.onlineHours}</Text>
            </View>
          </View>
        </View>

        {/* 2. AVAILABLE BALANCE CARD: LOAD AMOUNT ONLY (HDFC removed as requested) */}
        <View style={[styles.balanceCard, Shadows.md]}>
          <View style={styles.balanceHeader}>
            <View>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceAmount}>
                ₹{wallet.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
            </View>

            <View style={styles.walletIconCircle}>
              <Ionicons name="wallet" size={26} color={Colors.white} />
            </View>
          </View>

          <View style={styles.balanceActions}>
            {/* Load Amount Button */}
            <TouchableOpacity
              style={styles.loadAmountBtn}
              onPress={() => setShowLoadModal(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle" size={20} color={Colors.primary} />
              <Text style={styles.loadAmountBtnText}>Load Amount</Text>
            </TouchableOpacity>

            <View style={styles.balanceStatusTag}>
              <View style={styles.statusGreenDot} />
              <Text style={styles.balanceStatusText}>Instant Deposit Active</Text>
            </View>
          </View>
        </View>

        {/* 3. RECENT TRANSACTIONS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RECENT TRANSACTIONS</Text>
          <Text style={styles.transactionCount}>{transactions.length} items</Text>
        </View>

        <View style={styles.transactionsContainer}>
          {transactions.map((tx) => {
            const isCredit = tx.amount > 0;
            return (
              <View key={tx.id} style={[styles.txItem, Shadows.sm]}>
                <View
                  style={[
                    styles.txIconBox,
                    { backgroundColor: isCredit ? Colors.successLight : Colors.dangerLight },
                  ]}
                >
                  <Ionicons
                    name={
                      tx.type === 'TRIP_EARNING'
                        ? 'car'
                        : tx.type === 'BONUS'
                        ? 'gift'
                        : tx.type === 'DRIVER_DEPOSIT'
                        ? 'wallet'
                        : 'arrow-down'
                    }
                    size={20}
                    color={isCredit ? Colors.successDark : Colors.danger}
                  />
                </View>

                <View style={styles.txDetails}>
                  <Text style={styles.txDescription} numberOfLines={1}>
                    {tx.description}
                  </Text>
                  <Text style={styles.txDate}>
                    {new Date(tx.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>

                <View style={styles.txAmountContainer}>
                  <Text
                    style={[
                      styles.txAmount,
                      { color: isCredit ? Colors.successDark : Colors.danger },
                    ]}
                  >
                    {isCredit ? '+' : ''}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.txTypeTag}>
                    {tx.type === 'TRIP_EARNING'
                      ? 'Trip Fare'
                      : tx.type === 'DRIVER_DEPOSIT'
                      ? 'Wallet Load'
                      : 'Transfer'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Load Amount Modal */}
      <Modal
        visible={showLoadModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLoadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Load Wallet Balance</Text>
              <TouchableOpacity onPress={() => setShowLoadModal(false)}>
                <Ionicons name="close-circle" size={26} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Top up your driver balance via UPI, NetBanking or Debit Card.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Enter Amount (₹)</Text>
              <View style={styles.amountInputRow}>
                <Text style={styles.rupeeSymbol}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  value={loadAmountInput}
                  onChangeText={setLoadAmountInput}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.textPlaceholder}
                />
              </View>
              <Text style={styles.availableHelper}>
                Current Balance: ₹{wallet.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
            </View>

            {/* Quick Chips */}
            <View style={styles.quickChipsRow}>
              {['500', '1000', '2000', '5000'].map((chip) => (
                <TouchableOpacity
                  key={chip}
                  style={[
                    styles.chipBtn,
                    loadAmountInput === chip && styles.chipBtnActive,
                  ]}
                  onPress={() => setLoadAmountInput(chip)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      loadAmountInput === chip && styles.chipTextActive,
                    ]}
                  >
                    +₹{chip}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <PickMiButton
              title={`Load ₹${loadAmountInput || '0'} Instantly`}
              onPress={handleLoadSubmit}
              variant="primary"
              size="lg"
            />
          </View>
        </View>
      </Modal>
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
    fontSize: 12,
    fontWeight: '600',
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
  loadAmountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  loadAmountBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
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
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
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
  txDescription: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
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
  txTypeTag: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 18,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: Colors.background,
  },
  rupeeSymbol: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  availableHelper: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 6,
  },
  quickChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  chipBtn: {
    flex: 1,
    backgroundColor: Colors.borderLight,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  chipBtnActive: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  chipTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
});
