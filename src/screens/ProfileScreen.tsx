import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../theme/colors';
import { PickMiButton } from '../components/common/PickMiButton';
import { PickMiBottomSheet } from '../components/common/PickMiBottomSheet';
import { useAuth } from '../context/AuthContext';
import { useTrips } from '../context/TripContext';
import { usePermission } from '../context/PermissionContext';
import { DriverDocument } from '../types/database';
import { TripHistoryScreen } from './TripHistoryScreen';
import { SecurityDepositModal } from '../components/profile/SecurityDepositModal';

interface ProfileScreenProps {
  onLogoutSuccess: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onLogoutSuccess }) => {
  const { driver, vehicle, documents, logout } = useAuth();
  const { completedTrips } = useTrips();
  const { hasLocationPermission, hasNotificationPermission } = usePermission();

  // Bottom sheets for the 3 cards (Driver, Vehicle, Documents)
  const [activeSheet, setActiveSheet] = useState<'driver' | 'vehicle' | 'documents' | null>(null);

  // Dedicated Full-Screen Trip History Page
  const [showHistoryPage, setShowHistoryPage] = useState(false);

  // Security Deposit Modal State
  const [showDepositModal, setShowDepositModal] = useState(false);
  const isDepositPaid = driver.deposit_status === 'PAID';

  const formatDepositExpiry = (isoString?: string | null) => {
    if (!isoString) return '1 Year';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '1 Year';
    }
  };

  // Dialog & preview modals
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DriverDocument | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    onLogoutSuccess();
  };

  const handleOpenDocPreview = (doc: DriverDocument) => {
    setActiveSheet(null);
    setTimeout(() => {
      setSelectedDoc(doc);
    }, 280);
  };

  const handleClosePreviewCompletely = () => {
    setSelectedDoc(null);
  };

  const handleBackToDocuments = () => {
    setSelectedDoc(null);
    setTimeout(() => {
      setActiveSheet('documents');
    }, 280);
  };

  const insets = useSafeAreaInsets();
  const topPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 20
  );

  return (
    <View style={styles.container}>
      {/* FIXED TOP PROFILE HERO CARD (stays fixed when scrolling as requested) */}
      <View style={[styles.fixedProfileHero, Shadows.sm, { paddingTop: topPadding + 6 }]}>
        <View style={styles.avatarRow}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: driver.profile_image }} style={styles.avatar} />
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-sharp" size={14} color={Colors.white} />
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.driverName}>{driver.name}</Text>
            <Text style={styles.driverMobile}>{driver.mobile}</Text>

            <View style={styles.ratingRow}>
              <View style={styles.starBadge}>
                <Ionicons name="star" size={12} color="#D97706" />
                <Text style={styles.ratingText}>{driver.rating || 4.92}</Text>
              </View>
              <Text style={styles.tripsCountText}>
                • {driver.total_trips || 342} trips completed
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 3 SEPARATE CARDS: Driver Details, Vehicle Details, Documents (Click opens bottom sheet) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>PARTNER INFORMATION</Text>
        </View>

        <View style={styles.cardsContainer}>
          {/* Card 1: Driver Details */}
          <TouchableOpacity
            style={[styles.tileCard, Shadows.sm]}
            onPress={() => setActiveSheet('driver')}
            activeOpacity={0.75}
          >
            <View style={[styles.tileIconCircle, { backgroundColor: Colors.primaryLight }]}>
              <Ionicons name="person" size={22} color={Colors.primary} />
            </View>
            <View style={styles.tileTextContainer}>
              <Text style={styles.tileTitle}>Driver Details</Text>
              <Text style={styles.tileSubtitle}>
                {driver.name} • ID: #DRV-8942
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* Card 2: Vehicle Details */}
          <TouchableOpacity
            style={[styles.tileCard, Shadows.sm]}
            onPress={() => setActiveSheet('vehicle')}
            activeOpacity={0.75}
          >
            <View style={[styles.tileIconCircle, { backgroundColor: Colors.successLight }]}>
              <Ionicons name="car-sport" size={22} color={Colors.successDark} />
            </View>
            <View style={styles.tileTextContainer}>
              <Text style={styles.tileTitle}>Vehicle Details</Text>
              <Text style={styles.tileSubtitle}>
                {vehicle.vehicle_model} • {vehicle.vehicle_number}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* Card 3: Documents */}
          <TouchableOpacity
            style={[styles.tileCard, Shadows.sm]}
            onPress={() => setActiveSheet('documents')}
            activeOpacity={0.75}
          >
            <View style={[styles.tileIconCircle, { backgroundColor: Colors.warningLight }]}>
              <Ionicons name="document-text" size={22} color={Colors.warningDark} />
            </View>
            <View style={styles.tileTextContainer}>
              <Text style={styles.tileTitle}>Documents</Text>
              <Text style={styles.tileSubtitle}>
                {documents.length} Documents • 4/4 Verified
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* Card: Security Deposit (Compulsory ₹250 Deposit) */}
          <TouchableOpacity
            style={[styles.tileCard, Shadows.sm]}
            onPress={() => setShowDepositModal(true)}
            activeOpacity={0.75}
          >
            <View
              style={[
                styles.tileIconCircle,
                { backgroundColor: isDepositPaid ? '#F0FDF4' : '#FEF3C7' },
              ]}
            >
              <Ionicons
                name={isDepositPaid ? 'shield-checkmark' : 'shield-half'}
                size={22}
                color={isDepositPaid ? Colors.successDark : '#D97706'}
              />
            </View>
            <View style={styles.tileTextContainer}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.tileTitle}>Security Deposit</Text>
                <View
                  style={[
                    styles.depositStatusBadge,
                    isDepositPaid
                      ? styles.depositStatusBadgePaid
                      : styles.depositStatusBadgePending,
                  ]}
                >
                  <Text
                    style={[
                      styles.depositStatusBadgeText,
                      isDepositPaid
                        ? { color: Colors.successDark }
                        : { color: '#B45309' },
                    ]}
                  >
                    {isDepositPaid ? 'Paid • 1 Yr' : 'Required'}
                  </Text>
                </View>
              </View>
              <Text style={styles.tileSubtitle}>
                {isDepositPaid
                  ? `₹250 Paid • Valid until ${formatDepositExpiry(driver.deposit_expires_at)}`
                  : '₹250 Compulsory Deposit • Required to Request Trips'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* Card 4: Trip History (Opens dedicated full-screen page) */}
          <TouchableOpacity
            style={[styles.tileCard, Shadows.sm]}
            onPress={() => setShowHistoryPage(true)}
            activeOpacity={0.75}
          >
            <View style={[styles.tileIconCircle, { backgroundColor: '#F0EFFF' }]}>
              <Ionicons name="time" size={22} color="#5856D6" />
            </View>
            <View style={styles.tileTextContainer}>
              <Text style={styles.tileTitle}>Trip History</Text>
              <Text style={styles.tileSubtitle}>
                {completedTrips.length} Completed Trips • View past rides
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Settings Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SETTINGS</Text>
        </View>

        <View style={[styles.infoBlock, Shadows.sm]}>
          {/* Notifications - Mandatory Always Active */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIconBox}>
                <Ionicons name="notifications" size={18} color={Colors.primary} />
              </View>
              <View style={styles.settingTextGroup}>
                <Text style={styles.settingTitle}>Notifications</Text>
                <Text style={styles.settingSubtitle}>Mandatory for instant ride alerts</Text>
              </View>
            </View>
            <View style={styles.activeBluePill}>
              <View style={styles.activeDot} />
              <Text style={styles.activeBluePillText}>Active</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Location Permission - Mandatory Always Active */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIconBox}>
                <Ionicons name="location" size={18} color={Colors.primary} />
              </View>
              <View style={styles.settingTextGroup}>
                <Text style={styles.settingTitle}>Location Permission</Text>
                <Text style={styles.settingSubtitle}>Mandatory for live GPS & navigation</Text>
              </View>
            </View>
            <View style={styles.activeBluePill}>
              <View style={styles.activeDot} />
              <Text style={styles.activeBluePillText}>Active</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Privacy */}
          <TouchableOpacity
            style={styles.settingClickRow}
            onPress={() => setShowTermsModal(true)}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textPrimary} />
              <Text style={styles.settingTitle}>Privacy</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Terms & Conditions */}
          <TouchableOpacity
            style={styles.settingClickRow}
            onPress={() => setShowTermsModal(true)}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="newspaper-outline" size={20} color={Colors.textPrimary} />
              <Text style={styles.settingTitle}>Terms & Conditions</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Help & Support */}
          <TouchableOpacity
            style={styles.settingClickRow}
            onPress={() => setShowHelpModal(true)}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="help-buoy-outline" size={20} color={Colors.textPrimary} />
              <Text style={styles.settingTitle}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Logout */}
          <TouchableOpacity
            style={styles.settingClickRow}
            onPress={() => setShowLogoutConfirm(true)}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
              <Text style={[styles.settingTitle, { color: Colors.danger }]}>Logout</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.danger} />
          </TouchableOpacity>
        </View>

        {/* App Version Info */}
        <View style={styles.footerAppInfo}>
          <Text style={styles.footerVersion}>PickMi Driver v1.0.0 • Mobile Only</Text>
          <Text style={styles.footerCopyright}>Engineered for iOS & Android</Text>
        </View>
      </ScrollView>

      {/* BOTTOM SHEET 1: DRIVER DETAILS */}
      <PickMiBottomSheet
        visible={activeSheet === 'driver'}
        onClose={() => setActiveSheet(null)}
        title="Driver Details"
      >
        <View style={styles.sheetInfoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Driver Name</Text>
            <Text style={styles.infoValue}>{driver.name}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mobile Number</Text>
            <Text style={styles.infoValue}>{driver.mobile}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email Address</Text>
            <Text style={styles.infoValue}>{driver.email}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Driver ID</Text>
            <Text style={[styles.infoValue, { color: Colors.primary }]}>#DRV-8942</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Status</Text>
            <View style={styles.statusPillVerified}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.successDark} />
              <Text style={styles.statusPillTextVerified}>Active & Verified</Text>
            </View>
          </View>
        </View>

        <PickMiButton
          title="Close"
          onPress={() => setActiveSheet(null)}
          variant="primary"
          size="md"
        />
      </PickMiBottomSheet>

      {/* BOTTOM SHEET 2: VEHICLE DETAILS */}
      <PickMiBottomSheet
        visible={activeSheet === 'vehicle'}
        onClose={() => setActiveSheet(null)}
        title="Vehicle Details"
      >
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
          {/* Vehicle Front Photo Card */}
          <View style={styles.vehiclePhotoCard}>
            <Image
              source={{
                uri:
                  vehicle.vehicle_image ||
                  'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
              }}
              style={styles.vehicleFrontImage}
              resizeMode="cover"
            />
            <View style={styles.vehiclePhotoBadge}>
              <Ionicons name="camera" size={13} color={Colors.white} />
              <Text style={styles.vehiclePhotoBadgeText}>FRONT VIEW PHOTO</Text>
            </View>
            <View style={styles.vehicleModelOverlayPill}>
              <Text style={styles.vehicleModelOverlayText}>{vehicle.vehicle_model}</Text>
            </View>
          </View>

          <View style={styles.sheetInfoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Vehicle Number</Text>
              <Text style={[styles.infoValue, styles.regPlate]}>{vehicle.vehicle_number}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Vehicle Type</Text>
              <Text style={styles.infoValue}>{vehicle.vehicle_type}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Vehicle Model</Text>
              <Text style={styles.infoValue}>{vehicle.vehicle_model}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Registration Status</Text>
              <View style={styles.statusPillVerified}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.successDark} />
                <Text style={styles.statusPillTextVerified}>Verified & Active</Text>
              </View>
            </View>
          </View>

          <PickMiButton
            title="Close"
            onPress={() => setActiveSheet(null)}
            variant="primary"
            size="md"
          />
        </ScrollView>
      </PickMiBottomSheet>

      {/* BOTTOM SHEET 3: DOCUMENTS */}
      <PickMiBottomSheet
        visible={activeSheet === 'documents'}
        onClose={() => setActiveSheet(null)}
        title="Driver Documents"
      >
        <View style={styles.sheetDocGrid}>
          {documents.map((doc) => (
            <TouchableOpacity
              key={doc.id}
              style={styles.sheetDocItem}
              onPress={() => handleOpenDocPreview(doc)}
              activeOpacity={0.8}
            >
              <View style={styles.docLeft}>
                <View style={styles.docIconCircle}>
                  <Ionicons name="document-text" size={20} color={Colors.primary} />
                </View>
                <View style={styles.docTexts}>
                  <Text style={styles.docType}>{doc.document_type}</Text>
                  <Text style={styles.docNumber}>{doc.document_number || 'Valid & On file'}</Text>
                </View>
              </View>

              <View style={styles.docItemActions}>
                <View style={styles.docStatusBadge}>
                  <Ionicons name="checkmark-circle" size={13} color={Colors.successDark} />
                  <Text style={styles.docStatusText}>{doc.verification_status}</Text>
                </View>
                <TouchableOpacity
                  style={styles.sheetPreviewBtn}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    handleOpenDocPreview(doc);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="eye-outline" size={13} color={Colors.primary} />
                  <Text style={styles.sheetPreviewBtnText}>Preview</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <PickMiButton
          title="Close"
          onPress={() => setActiveSheet(null)}
          variant="primary"
          size="md"
        />
      </PickMiBottomSheet>

      {/* Document Image Preview Bottom Sheet */}
      <PickMiBottomSheet
        visible={Boolean(selectedDoc)}
        onClose={handleClosePreviewCompletely}
        title={selectedDoc ? `${selectedDoc.document_type} Preview` : 'Document Preview'}
      >
        {selectedDoc && (
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
            {/* Document Switcher Tabs */}
            <View style={styles.docTabsRow}>
              {documents.map((d) => {
                const isSelected = d.id === selectedDoc.id;
                return (
                  <TouchableOpacity
                    key={d.id}
                    style={[styles.docTabPill, isSelected && styles.docTabPillActive]}
                    onPress={() => setSelectedDoc(d)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.docTabPillText,
                        isSelected && styles.docTabPillTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {d.document_type.replace('Driving ', '')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Document Image with Watermark */}
            <View style={styles.docPreviewImageWrapper}>
              <Image
                source={{ uri: selectedDoc.document_url }}
                style={styles.docPreviewImage}
                resizeMode="cover"
              />
              <View style={styles.docWatermarkBadge}>
                <Ionicons name="shield-checkmark" size={13} color={Colors.white} />
                <Text style={styles.docWatermarkText}>VERIFIED TRANSPORT RECORD</Text>
              </View>
            </View>

            {/* Metadata Details */}
            <View style={styles.docMetaBox}>
              <View style={styles.docMetaRow}>
                <Text style={styles.docMetaLabel}>Document Type:</Text>
                <Text style={styles.docMetaValue}>{selectedDoc.document_type}</Text>
              </View>
              <View style={styles.docMetaRow}>
                <Text style={styles.docMetaLabel}>Document No:</Text>
                <Text style={[styles.docMetaValue, { color: Colors.primary }]}>
                  {selectedDoc.document_number || 'N/A'}
                </Text>
              </View>
              <View style={styles.docMetaRow}>
                <Text style={styles.docMetaLabel}>Validity:</Text>
                <Text style={styles.docMetaValue}>{selectedDoc.valid_until || 'Active'}</Text>
              </View>
              <View style={styles.docMetaRow}>
                <Text style={styles.docMetaLabel}>Status:</Text>
                <View style={styles.docMetaStatusBadge}>
                  <Ionicons name="checkmark-circle" size={13} color={Colors.successDark} />
                  <Text style={styles.docMetaStatusText}>
                    {selectedDoc.verification_status} & Approved
                  </Text>
                </View>
              </View>
            </View>

            {/* Previous / Next Browsing Actions */}
            {(() => {
              const currentIdx = documents.findIndex((d) => d.id === selectedDoc.id);
              return (
                <View style={styles.docNavRow}>
                  <TouchableOpacity
                    style={[styles.docNavBtn, currentIdx <= 0 && styles.docNavBtnDisabled]}
                    onPress={() => {
                      if (currentIdx > 0) setSelectedDoc(documents[currentIdx - 1]);
                    }}
                    disabled={currentIdx <= 0}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={16}
                      color={currentIdx <= 0 ? Colors.border : Colors.textPrimary}
                    />
                    <Text
                      style={[
                        styles.docNavBtnText,
                        currentIdx <= 0 && styles.docNavBtnTextDisabled,
                      ]}
                    >
                      Previous
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.docNavBtn,
                      currentIdx >= documents.length - 1 && styles.docNavBtnDisabled,
                    ]}
                    onPress={() => {
                      if (currentIdx < documents.length - 1) setSelectedDoc(documents[currentIdx + 1]);
                    }}
                    disabled={currentIdx >= documents.length - 1}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.docNavBtnText,
                        currentIdx >= documents.length - 1 && styles.docNavBtnTextDisabled,
                      ]}
                    >
                      Next
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={currentIdx >= documents.length - 1 ? Colors.border : Colors.textPrimary}
                    />
                  </TouchableOpacity>
                </View>
              );
            })()}

            {/* Action Buttons Row */}
            <View style={styles.docActionBtnsRow}>
              <TouchableOpacity
                style={styles.backToDocsBtn}
                onPress={handleBackToDocuments}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={16} color={Colors.textPrimary} />
                <Text style={styles.backToDocsBtnText}>Back to List</Text>
              </TouchableOpacity>

              <PickMiButton
                title="Done"
                onPress={handleClosePreviewCompletely}
                variant="primary"
                size="md"
                style={{ flex: 1 }}
              />
            </View>
          </ScrollView>
        )}
      </PickMiBottomSheet>

      {/* FULL-SCREEN TRIP HISTORY SCREEN (List & Drilldown Bill Page) */}
      <Modal
        visible={showHistoryPage}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowHistoryPage(false)}
      >
        <TripHistoryScreen
          trips={completedTrips}
          onBack={() => setShowHistoryPage(false)}
        />
      </Modal>

      {/* Security Deposit Details & Razorpay Payment Modal */}
      <SecurityDepositModal
        visible={showDepositModal}
        onClose={() => setShowDepositModal(false)}
      />

      {/* Logout Confirmation Dialog Modal */}
      <Modal
        visible={showLogoutConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <View style={styles.dialogOverlay}>
          <View style={[styles.dialogCard, Shadows.lg]}>
            <View style={styles.dialogIconBox}>
              <Ionicons name="log-out" size={32} color={Colors.danger} />
            </View>
            <Text style={styles.dialogTitle}>Are you sure you want to logout?</Text>
            <Text style={styles.dialogSubtitle}>
              You will need to verify your phone number and OTP again to log in.
            </Text>

            <View style={styles.dialogBtnRow}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => setShowLogoutConfirm(false)}
              >
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dialogLogoutBtn}
                onPress={handleLogout}
              >
                <Text style={styles.dialogLogoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Help & Support Modal */}
      <PickMiBottomSheet
        visible={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        title="Help & Support"
      >
        <Text style={styles.modalSubtitle}>
          PickMi 24/7 Driver Support is available anytime you need assistance.
        </Text>

        <TouchableOpacity
          style={styles.supportOption}
          onPress={() => Alert.alert('PickMi Hotline', 'Calling Driver Helpline: 1800-PICKMI-DRV')}
        >
          <Ionicons name="call" size={20} color={Colors.primary} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.supportOptionTitle}>24/7 Driver Helpline</Text>
            <Text style={styles.supportOptionDesc}>Toll-free voice support for drivers</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.supportOption}
          onPress={() => Alert.alert('Safety Emergency', 'Calling Emergency Dispatcher')}
        >
          <Ionicons name="shield" size={20} color={Colors.danger} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.supportOptionTitle}>Emergency Safety Center</Text>
            <Text style={styles.supportOptionDesc}>Instant on-road emergency response</Text>
          </View>
        </TouchableOpacity>

        <PickMiButton
          title="Close"
          onPress={() => setShowHelpModal(false)}
          variant="primary"
          size="md"
        />
      </PickMiBottomSheet>

      {/* Terms Modal */}
      <PickMiBottomSheet
        visible={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="Terms & Privacy"
      >
        <ScrollView style={{ maxHeight: 220, marginBottom: 20 }}>
          <Text style={styles.termsBody}>
            PickMi Driver Partner Agreement:{

}
            1. Driver Conduct: As a verified PickMi partner, you agree to maintain professional courtesy, safe driving standards, and uphold vehicle safety regulations.{

}
            2. Fares & Payouts: Fares are calculated dynamically based on trip distance, duration, and tolls. Completed trips are instantly credited to your wallet balance.
          </Text>
        </ScrollView>

        <PickMiButton
          title="Close"
          onPress={() => setShowTermsModal(false)}
          variant="primary"
          size="md"
        />
      </PickMiBottomSheet>
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
    padding: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  fixedProfileHero: {
    backgroundColor: Colors.white,
    paddingTop: 24,
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    zIndex: 10,
  },
  profileCard: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  driverMobile: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  starBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
    marginLeft: 3,
  },
  tripsCountText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  sectionHeader: {
    marginBottom: 10,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  cardsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  tileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  tileIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tileTextContainer: {
    flex: 1,
  },
  tileTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  tileSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  depositStatusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  depositStatusBadgePaid: {
    backgroundColor: Colors.successLight,
  },
  depositStatusBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  depositStatusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  infoBlock: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  settingClickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  settingIconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTextGroup: {
    marginLeft: 10,
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  settingSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  activeBluePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 67, 220, 0.2)',
    gap: 5,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  activeBluePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginRight: 6,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 6,
  },
  footerAppInfo: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  footerVersion: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  footerCopyright: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheetCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 22,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  sheetInfoBox: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  regPlate: {
    backgroundColor: '#FEF08A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EAB308',
  },
  statusPillVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusPillTextVerified: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.successDark,
    marginLeft: 4,
  },
  sheetDocGrid: {
    gap: 8,
    marginBottom: 20,
  },
  sheetDocItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    backgroundColor: Colors.background,
  },
  docLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  docIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  docTexts: {
    flex: 1,
  },
  docType: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  docNumber: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  docStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  docStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.successDark,
    marginLeft: 4,
  },
  sheetPreviewBody: {
    paddingBottom: 24,
  },
  docItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetPreviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  sheetPreviewBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  docModalCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 380,
  },
  docModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docVerifiedTag: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.successDark,
    marginTop: 1,
  },
  closeModalBtn: {
    padding: 4,
  },
  docTabsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 3,
    marginVertical: 12,
  },
  docTabPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 9,
  },
  docTabPillActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  docTabPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  docTabPillTextActive: {
    color: Colors.primary,
  },
  docPreviewImageWrapper: {
    position: 'relative',
    width: '100%',
    height: 190,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    marginBottom: 14,
  },
  docPreviewImage: {
    width: '100%',
    height: '100%',
  },
  docWatermarkBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  docWatermarkText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.4,
  },
  docMetaBox: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  docMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  docMetaLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  docMetaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  docMetaStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  docMetaStatusText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.successDark,
  },
  docNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 4,
  },
  docNavBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.background,
    gap: 4,
  },
  docNavBtnDisabled: {
    opacity: 0.4,
  },
  docNavBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  docNavBtnTextDisabled: {
    color: Colors.textMuted,
  },
  vehiclePhotoCard: {
    position: 'relative',
    width: '100%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    marginBottom: 16,
  },
  vehicleFrontImage: {
    width: '100%',
    height: '100%',
  },
  vehiclePhotoBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  vehiclePhotoBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  vehicleModelOverlayPill: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  vehicleModelOverlayText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  docActionBtnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingBottom: 20,
  },
  backToDocsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.background,
    gap: 6,
  },
  backToDocsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  dialogIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  dialogSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  dialogBtnRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  dialogCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  dialogLogoutBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogLogoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  supportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  supportOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  supportOptionDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  termsBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // Trip History Sheet Styles
  emptyHistoryBox: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  emptyHistoryIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0EFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyHistoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptyHistorySub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  historyTripCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyTripNumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyTripNum: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.successDark,
  },
  historyFareText: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  historyMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  historyMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyMetaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  historyRouteBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyRouteLineCol: {
    width: 14,
    alignItems: 'center',
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  historyLine: {
    width: 2,
    height: 16,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  historyLocationsCol: {
    flex: 1,
    marginLeft: 8,
  },
  historyLocText: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  historyExtrasRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  historyExtraPill: {
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyExtraPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
});
