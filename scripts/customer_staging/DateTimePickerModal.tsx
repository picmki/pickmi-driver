import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from './theme';

interface DateTimePickerModalProps {
  visible: boolean;
  selectedDate: string;
  selectedTime: string;
  onConfirm: (date: string, time: string) => void;
  onClose: () => void;
}

export const DateTimePickerModal: React.FC<DateTimePickerModalProps> = ({
  visible,
  selectedDate,
  selectedTime,
  onConfirm,
  onClose,
}) => {
  // Generate next 7 days
  const today = new Date();
  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const formatted = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    const fullDate = `${dayName}, ${formatted}`;
    return {
      index: i,
      dayName,
      formatted,
      fullDate,
      isToday: i === 0,
    };
  });

  const [pickedDate, setPickedDate] = useState(selectedDate || dateOptions[1].fullDate); // Default to Tomorrow
  const [pickedTime, setPickedTime] = useState(selectedTime || '06:00 AM');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick time slot presets
  const timeSlots = [
    { label: 'Early Morning', time: '05:30 AM', icon: 'sunny-outline' },
    { label: 'Morning Flight', time: '06:30 AM', icon: 'airplane-outline' },
    { label: 'Morning Office', time: '08:30 AM', icon: 'briefcase-outline' },
    { label: 'Mid-Day', time: '11:30 AM', icon: 'time-outline' },
    { label: 'Afternoon', time: '02:30 PM', icon: 'partly-sunny-outline' },
    { label: 'Evening', time: '06:00 PM', icon: 'sunset-outline' },
    { label: 'Night Shift', time: '08:30 PM', icon: 'moon-outline' },
    { label: 'Late Night', time: '11:00 PM', icon: 'cloudy-night-outline' },
  ];

  const handleApply = () => {
    setErrorMsg(null);
    const isToday = pickedDate.includes('Today');

    if (isToday) {
      // Check if selected time is in the future (minimum 1 hour ahead)
      const currentHour = today.getHours();
      // Rough parse
      const [timePart, modifier] = pickedTime.split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;

      if (hours <= currentHour) {
        setErrorMsg('PickMi requires at least 1 hour advance notice for today. Please select a later time slot or book for tomorrow.');
        return;
      }
    }

    onConfirm(pickedDate, pickedTime);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          <SafeAreaView>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>When Are You Travelling?</Text>
                <Text style={styles.headerSubtitle}>
                  Scheduled future reservations guarantee zero cancellations
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Business Rule Notice Banner */}
            <View style={styles.noticeBanner}>
              <Ionicons name="shield-checkmark" size={16} color={COLORS.primary} />
              <Text style={styles.noticeText}>
                No immediate/instant rides. Chauffeurs are reserved strictly in advance.
              </Text>
            </View>

            {errorMsg && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {/* 1. Date Selector */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>1. SELECT TRAVEL DATE</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.dateScroll}
                >
                  {dateOptions.map((item) => {
                    const isSelected = pickedDate === item.fullDate;
                    return (
                      <TouchableOpacity
                        key={item.index}
                        style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                        onPress={() => {
                          setPickedDate(item.fullDate);
                          setErrorMsg(null);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.dateDayName,
                            isSelected && styles.dateDayNameSelected,
                          ]}
                        >
                          {item.dayName}
                        </Text>
                        <Text
                          style={[
                            styles.dateFormatted,
                            isSelected && styles.dateFormattedSelected,
                          ]}
                        >
                          {item.formatted}
                        </Text>
                        {item.isToday && (
                          <View style={styles.todayPill}>
                            <Text style={styles.todayPillText}>Tonight</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* 2. Pickup Time Selector */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>2. SELECT PICKUP TIME</Text>
                <View style={styles.timeGrid}>
                  {timeSlots.map((slot) => {
                    const isSelected = pickedTime === slot.time;
                    return (
                      <TouchableOpacity
                        key={slot.time}
                        style={[styles.timeSlot, isSelected && styles.timeSlotSelected]}
                        onPress={() => {
                          setPickedTime(slot.time);
                          setErrorMsg(null);
                        }}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={slot.icon as any}
                          size={16}
                          color={isSelected ? COLORS.white : COLORS.primary}
                        />
                        <View>
                          <Text
                            style={[
                              styles.timeSlotTime,
                              isSelected && styles.timeSlotTimeSelected,
                            ]}
                          >
                            {slot.time}
                          </Text>
                          <Text
                            style={[
                              styles.timeSlotLabel,
                              isSelected && styles.timeSlotLabelSelected,
                            ]}
                          >
                            {slot.label}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Footer Summary & Confirm CTA */}
            <View style={styles.footer}>
              <View style={styles.summaryRow}>
                <View>
                  <Text style={styles.summaryLabel}>Scheduled Pickup</Text>
                  <Text style={styles.summaryValue}>
                    {pickedDate} at {pickedTime}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={handleApply}
                  activeOpacity={0.88}
                >
                  <Text style={styles.confirmBtnText}>Save Time</Text>
                  <Ionicons name="checkmark" size={18} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    ...SHADOWS.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: 10,
    borderRadius: 12,
    marginTop: 10,
    gap: 8,
  },
  noticeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    flex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerLight,
    padding: 10,
    borderRadius: 12,
    marginTop: 10,
    gap: 8,
  },
  errorText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.danger,
    flex: 1,
  },
  section: {
    marginTop: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  dateScroll: {
    gap: 10,
    paddingVertical: 2,
  },
  dateCard: {
    width: 86,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  dateCardSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.md,
  },
  dateDayName: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  dateDayNameSelected: {
    color: COLORS.white,
  },
  dateFormatted: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  dateFormattedSelected: {
    color: COLORS.white,
  },
  todayPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  todayPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeSlot: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 10,
  },
  timeSlotSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  timeSlotTime: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  timeSlotTimeSelected: {
    color: COLORS.white,
  },
  timeSlotLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 1,
  },
  timeSlotLabelSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  footer: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...SHADOWS.md,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
});
