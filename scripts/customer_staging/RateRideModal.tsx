import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from './theme';
import type { Reservation } from './types';

interface RateRideModalProps {
  visible: boolean;
  reservation: Reservation | null;
  onSubmitRating: (tripId: string, rating: number, feedback?: string) => Promise<void>;
  onClose: () => void;
}

export const RateRideModal: React.FC<RateRideModalProps> = ({
  visible,
  reservation,
  onSubmitRating,
  onClose,
}) => {
  const [stars, setStars] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!visible || !reservation) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmitRating(reservation.id, stars, feedback.trim());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <SafeAreaView>
            <View style={styles.header}>
              <Text style={styles.title}>Rate Your Chauffeur</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.driverInfo}>
              <View style={styles.avatarWrap}>
                <Ionicons name="person" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.driverName}>
                {reservation.driver?.name || 'Assigned Driver'}
              </Text>
              <Text style={styles.tripInfo}>
                {reservation.vehicle_type} • {reservation.trip_number}
              </Text>
            </View>

            {/* 5-Star Row */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setStars(s)}
                  style={styles.starBtn}
                >
                  <Ionicons
                    name={s <= stars ? 'star' : 'star-outline'}
                    size={36}
                    color={s <= stars ? '#F59E0B' : COLORS.border}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.ratingText}>
              {stars === 5
                ? '⭐ Excellent Ride Experience'
                : stars === 4
                ? 'Great Service'
                : stars === 3
                ? 'Average Trip'
                : 'Need Improvement'}
            </Text>

            {/* Comment Input */}
            <TextInput
              style={styles.input}
              placeholder="Tell us what you liked (car cleanliness, driving, courtesy)..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={3}
              value={feedback}
              onChangeText={setFeedback}
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.88}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.submitBtnText}>Submit Rating</Text>
              )}
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
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
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  closeBtn: {
    padding: 4,
  },
  driverInfo: {
    alignItems: 'center',
    marginTop: 16,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  tripInfo: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 18,
  },
  starBtn: {
    padding: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 14,
  },
  input: {
    height: 70,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    fontSize: 13,
    color: COLORS.text,
    textAlignVertical: 'top',
  },
  submitBtn: {
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    ...SHADOWS.md,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
});
