import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from './theme';
import { POPULAR_LOCATIONS } from './locations';
import type { LocationItem } from './types';

interface LocationPickerModalProps {
  visible: boolean;
  type: 'pickup' | 'drop';
  currentValue: string;
  onSelectLocation: (location: LocationItem) => void;
  onClose: () => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  visible,
  type,
  currentValue,
  onSelectLocation,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'airport' | 'hub' | 'railway' | 'outstation'>('all');

  const filteredLocations = POPULAR_LOCATIONS.filter((loc) => {
    const matchesSearch =
      loc.title.toLowerCase().includes(search.toLowerCase()) ||
      loc.address.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (activeCategory === 'all') return true;
    return loc.category === activeCategory;
  });

  const handleCustomManualSelect = () => {
    if (!search.trim()) return;
    onSelectLocation({
      id: 'custom_' + Date.now().toString(36),
      title: search.trim(),
      address: search.trim() + ', Karnataka, India',
      latitude: type === 'pickup' ? 12.9352 : 13.1989,
      longitude: type === 'pickup' ? 77.6245 : 77.7068,
      category: 'city',
    });
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>
                {type === 'pickup' ? 'Select Pickup Location' : 'Select Drop Destination'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {type === 'pickup'
                  ? 'Where should your chauffeur pick you up?'
                  : 'Where is your final travel stop?'}
              </Text>
            </View>
          </View>

          {/* Search Box */}
          <View style={styles.searchSection}>
            <View style={styles.searchBox}>
              <Ionicons
                name={type === 'pickup' ? 'radio-button-on' : 'location'}
                size={20}
                color={type === 'pickup' ? COLORS.primary : COLORS.danger}
              />
              <TextInput
                style={styles.searchInput}
                placeholder={
                  type === 'pickup'
                    ? 'Search pickup address, airport, hotel...'
                    : 'Search drop point, city, landmark...'
                }
                placeholderTextColor={COLORS.textMuted}
                value={search}
                onChangeText={setSearch}
                autoFocus
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* If user typed a custom place not in list */}
            {search.length > 3 && (
              <TouchableOpacity
                style={styles.customAddBtn}
                onPress={handleCustomManualSelect}
              >
                <Ionicons name="navigate-circle" size={20} color={COLORS.primary} />
                <Text style={styles.customAddText} numberOfLines={1}>
                  Use exact location: <Text style={{ fontWeight: '800' }}>"{search}"</Text>
                </Text>
                <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Category Chips */}
          <View style={styles.categoryScroll}>
            {[
              { id: 'all', label: 'All Places' },
              { id: 'airport', label: '✈️ Airports' },
              { id: 'hub', label: '🏢 Tech & City' },
              { id: 'railway', label: '🚆 Rail Stations' },
              { id: 'outstation', label: '🌄 Outstation' },
            ].map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                  onPress={() => setActiveCategory(cat.id as any)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      isActive && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Locations List */}
          <FlatList
            data={filteredLocations}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = item.title === currentValue;
              let iconName: any = 'location-outline';
              let iconBg = COLORS.surfaceAlt;
              let iconColor = COLORS.textSecondary;

              if (item.category === 'airport') {
                iconName = 'airplane';
                iconBg = COLORS.primaryLight;
                iconColor = COLORS.primary;
              } else if (item.category === 'railway') {
                iconName = 'train';
                iconBg = '#FEF3C7';
                iconColor = '#D97706';
              } else if (item.category === 'outstation') {
                iconName = 'map';
                iconBg = '#E0E7FF';
                iconColor = '#4F46E5';
              }

              return (
                <TouchableOpacity
                  style={[styles.locationItem, isSelected && styles.locationItemSelected]}
                  onPress={() => onSelectLocation(item)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.itemIconWrap, { backgroundColor: iconBg }]}>
                    <Ionicons name={iconName} size={18} color={iconColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.itemTitleRow}>
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      {item.category === 'airport' && (
                        <View style={styles.airportTag}>
                          <Text style={styles.airportTagText}>Tolls Incl.</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.itemAddress} numberOfLines={2}>
                      {item.address}
                    </Text>
                    {item.subtext && (
                      <Text style={styles.itemSubtext}>{item.subtext}</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
                </TouchableOpacity>
              );
            }}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: 12,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
    gap: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  customAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  customAddText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    flex: 1,
  },
  categoryScroll: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
    flexWrap: 'wrap',
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  categoryChipTextActive: {
    color: COLORS.white,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 10,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 12,
  },
  locationItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  itemIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  airportTag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  airportTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  itemAddress: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  itemSubtext: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 3,
  },
});
