import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';

interface DistanceAndKmLimitCardProps {
  distance?: string;
  allowedKm?: number;
  extraKmRate?: number;
  showExtraRateBanner?: boolean;
  theme?: 'light' | 'white';
}

/**
 * DistanceAndKmLimitCard
 * Unified ALLOWED KM LIMIT card:
 * Merges EST. DISTANCE and ALLOWED KM LIMIT into one cohesive, modern card.
 * Left:  Allowed Limit (e.g. "45 KM")
 * Right: Estimated Route Distance badge (e.g. "Est. 38.5 km")
 * Bottom: Extra KM surcharge info banner
 */
export const DistanceAndKmLimitCard: React.FC<DistanceAndKmLimitCardProps> = ({
  distance = '38.5 km',
  allowedKm = 45,
  extraKmRate = 14,
  showExtraRateBanner = true,
  theme = 'light',
}) => {
  // Format distance cleanly (e.g. if passed "38.5" without "km")
  const formattedDistance = distance.toLowerCase().includes('km')
    ? distance
    : `${distance} km`;

  const isWhite = theme === 'white';

  return (
    <View style={styles.wrapper}>
      {/* ALLOWED KM LIMIT Card */}
      <View style={styles.container}>
        <Text style={styles.label}>ALLOWED KM LIMIT</Text>
        <View style={[styles.pillBox, isWhite ? styles.pillBoxWhite : styles.pillBoxLight]}>
          {/* Main Allowed KM limit */}
          <View style={styles.limitGroup}>
            <Text style={styles.valueText}>{allowedKm}</Text>
            <Text style={styles.unitSuffix}>KM</Text>
          </View>
        </View>
      </View>

      {/* Extra KM Surcharge Banner */}
      {showExtraRateBanner && (
        <View style={styles.extraRateBanner}>
          <Ionicons name="speedometer-outline" size={14} color="#0043DC" />
          <Text style={styles.extraRateText}>
            Extra Distance:{' '}
            <Text style={styles.extraRateHighlight}>₹{extraKmRate} / km</Text> beyond{' '}
            {allowedKm} KM
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  container: {
    width: '100%',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569', // Slate-600 uppercase label
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  pillBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0', // Sleek Slate-200 border
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 46,
  },
  pillBoxLight: {
    backgroundColor: '#FFFFFF',
  },
  pillBoxWhite: {
    backgroundColor: '#F8FAFC',
  },
  limitGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  valueText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A', // Slate-900 bold text
  },
  unitSuffix: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8', // Slate-400 suffix
    letterSpacing: 0.5,
  },
  extraRateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 67, 220, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0, 67, 220, 0.15)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 8,
  },
  extraRateText: {
    fontSize: 11.5,
    color: '#334155',
    fontWeight: '500',
    flex: 1,
  },
  extraRateHighlight: {
    fontWeight: '800',
    color: '#0043DC',
  },
});
