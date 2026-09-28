import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../theme/colors';
import { PickMiButton } from './PickMiButton';

interface PickMiDatePickerModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  initialDate?: string; // Formatted e.g. "15 Jun 2030" or ISO
  onConfirm: (formattedDate: string) => void;
  onClose: () => void;
  minYear?: number;
  maxYear?: number;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const MONTH_FULL_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const PickMiDatePickerModal: React.FC<PickMiDatePickerModalProps> = ({
  visible,
  title,
  subtitle = 'Choose document validity date',
  initialDate,
  onConfirm,
  onClose,
  minYear = 2024,
  maxYear = 2045,
}) => {
  // Parse initial date
  const parseInitial = () => {
    if (initialDate) {
      const parts = initialDate.trim().split(' ');
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = MONTH_NAMES.indexOf(parts[1]);
        const y = parseInt(parts[2], 10);
        if (!isNaN(d) && m !== -1 && !isNaN(y)) {
          return { day: d, month: m, year: y };
        }
      }
      const parsed = new Date(initialDate);
      if (!isNaN(parsed.getTime())) {
        return {
          day: parsed.getDate(),
          month: parsed.getMonth(),
          year: parsed.getFullYear(),
        };
      }
    }
    const today = new Date();
    return {
      day: today.getDate(),
      month: today.getMonth(),
      year: today.getFullYear() + 1, // Default to next year for validity
    };
  };

  const initial = parseInitial();
  const [selectedYear, setSelectedYear] = useState<number>(initial.year);
  const [selectedMonth, setSelectedMonth] = useState<number>(initial.month);
  const [selectedDay, setSelectedDay] = useState<number>(initial.day);
  const [showYearPicker, setShowYearPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      const init = parseInitial();
      setSelectedYear(init.year);
      setSelectedMonth(init.month);
      setSelectedDay(init.day);
      setShowYearPicker(false);
    }
  }, [visible, initialDate]);

  // Compute calendar days for selected year & month
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayIndex = new Date(selectedYear, selectedMonth, 1).getDay();

  // Adjust day if selectedDay exceeds daysInMonth
  const safeDay = Math.min(selectedDay, daysInMonth);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((prev) => Math.max(minYear, prev - 1));
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((prev) => Math.min(maxYear, prev + 1));
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleQuickAddYears = (yearsToAdd: number) => {
    const currentYear = new Date().getFullYear();
    setSelectedYear(currentYear + yearsToAdd);
  };

  const handleConfirm = () => {
    const dayStr = safeDay < 10 ? `0${safeDay}` : `${safeDay}`;
    const monthStr = MONTH_NAMES[selectedMonth];
    const formatted = `${dayStr} ${monthStr} ${selectedYear}`;
    onConfirm(formatted);
    onClose();
  };

  const yearsList: number[] = [];
  for (let y = minYear; y <= maxYear; y++) {
    yearsList.push(y);
  }

  const formattedPreview = `${safeDay < 10 ? '0' : ''}${safeDay} ${
    MONTH_NAMES[selectedMonth]
  } ${selectedYear}`;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.dialogCard, Shadows.lg]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Selected Date Preview Banner */}
          <View style={styles.datePreviewBanner}>
            <Ionicons name="calendar" size={22} color={Colors.primary} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.datePreviewLabel}>Selected Validity Date</Text>
              <Text style={styles.datePreviewText}>{formattedPreview}</Text>
            </View>
            <TouchableOpacity
              style={styles.yearToggleBtn}
              onPress={() => setShowYearPicker((prev) => !prev)}
            >
              <Text style={styles.yearToggleText}>{selectedYear}</Text>
              <Ionicons
                name={showYearPicker ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={Colors.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Quick Validity Shortcuts */}
          <View style={styles.quickShortcutsRow}>
            <Text style={styles.quickShortcutsLabel}>Quick Valid Until:</Text>
            <TouchableOpacity
              style={styles.quickPill}
              onPress={() => handleQuickAddYears(1)}
            >
              <Text style={styles.quickPillText}>+1 Year</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickPill}
              onPress={() => handleQuickAddYears(2)}
            >
              <Text style={styles.quickPillText}>+2 Yrs</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickPill}
              onPress={() => handleQuickAddYears(5)}
            >
              <Text style={styles.quickPillText}>+5 Yrs</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickPill}
              onPress={() => handleQuickAddYears(10)}
            >
              <Text style={styles.quickPillText}>+10 Yrs</Text>
            </TouchableOpacity>
          </View>

          {showYearPicker ? (
            /* Year Grid View */
            <View style={styles.yearGridContainer}>
              <Text style={styles.sectionHeading}>Select Year</Text>
              <ScrollView
                style={{ maxHeight: 220 }}
                contentContainerStyle={styles.yearGrid}
                showsVerticalScrollIndicator={true}
              >
                {yearsList.map((y) => (
                  <TouchableOpacity
                    key={y}
                    style={[
                      styles.yearChip,
                      selectedYear === y && styles.yearChipActive,
                    ]}
                    onPress={() => {
                      setSelectedYear(y);
                      setShowYearPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.yearChipText,
                        selectedYear === y && styles.yearChipTextActive,
                      ]}
                    >
                      {y}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : (
            /* Month & Day Calendar View */
            <View style={styles.calendarContainer}>
              {/* Month Navigation Row */}
              <View style={styles.monthNavRow}>
                <TouchableOpacity
                  style={styles.monthNavBtn}
                  onPress={handlePrevMonth}
                >
                  <Ionicons name="chevron-back" size={18} color={Colors.textPrimary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.monthTitleBtn}
                  onPress={() => setShowYearPicker(true)}
                >
                  <Text style={styles.monthTitleText}>
                    {MONTH_FULL_NAMES[selectedMonth]} {selectedYear}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.monthNavBtn}
                  onPress={handleNextMonth}
                >
                  <Ionicons name="chevron-forward" size={18} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Days of Week Header */}
              <View style={styles.weekHeader}>
                {DAYS_OF_WEEK.map((d, index) => (
                  <Text key={index} style={styles.weekDayText}>
                    {d}
                  </Text>
                ))}
              </View>

              {/* Days Grid */}
              <View style={styles.daysGrid}>
                {/* Empty slots before first day of month */}
                {Array.from({ length: firstDayIndex }).map((_, index) => (
                  <View key={`empty-${index}`} style={styles.daySlot} />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const dayNum = index + 1;
                  const isSelected = dayNum === safeDay;
                  return (
                    <TouchableOpacity
                      key={`day-${dayNum}`}
                      style={[styles.daySlot, isSelected && styles.daySlotSelected]}
                      onPress={() => setSelectedDay(dayNum)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isSelected && styles.dayTextSelected,
                        ]}
                      >
                        {dayNum}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <PickMiButton
              title="Confirm Date"
              onPress={handleConfirm}
              variant="primary"
              size="md"
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  dialogCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 380,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePreviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#C7D9FD',
  },
  datePreviewLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  datePreviewText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 1,
  },
  yearToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  yearToggleText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  quickShortcutsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  quickShortcutsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  quickPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  calendarContainer: {
    marginBottom: 14,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginBottom: 8,
  },
  monthNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  monthTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: 6,
  },
  weekDayText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    width: 36,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  daySlot: {
    width: '14.28%',
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    marginVertical: 2,
  },
  daySlotSelected: {
    backgroundColor: Colors.primary,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  dayTextSelected: {
    color: Colors.white,
    fontWeight: '800',
  },
  yearGridContainer: {
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
  },
  yearChip: {
    width: '30%',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  yearChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  yearChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  yearChipTextActive: {
    color: Colors.white,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
});
