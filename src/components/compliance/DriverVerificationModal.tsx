import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Shadows } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { PickMiDatePickerModal } from '../common/PickMiDatePickerModal';
import { supabase } from '../../lib/supabase';

interface DriverVerificationModalProps {
  visible: boolean;
  onClose: () => void;
}

export const DriverVerificationModal: React.FC<DriverVerificationModalProps> = ({
  visible,
  onClose,
}) => {
  const {
    driver,
    vehicle,
    documents,
    isVerified,
    verificationStatus,
    rejectionReason,
    verifiedDocsCount,
    totalDocsCount,
    refreshDriverProfile,
  } = useAuth();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Re-upload state
  const [activeReuploadDoc, setActiveReuploadDoc] = useState<any | null>(null);
  const [reuploadPhotoUri, setReuploadPhotoUri] = useState<string>('');
  const [reuploadValidUntil, setReuploadValidUntil] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [isSubmittingReupload, setIsSubmittingReupload] = useState<boolean>(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshDriverProfile();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const isDateInFuture = (dateStr: string): boolean => {
    if (!dateStr || !dateStr.trim()) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parts = dateStr.trim().split(' ');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(parts[1]);
      const y = parseInt(parts[2], 10);
      if (!isNaN(d) && m !== -1 && !isNaN(y)) {
        const parsedCheck = new Date(y, m, d);
        parsedCheck.setHours(0, 0, 0, 0);
        return parsedCheck >= today;
      }
    }
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      parsed.setHours(0, 0, 0, 0);
      return parsed >= today;
    }
    return true;
  };

  const startReupload = (doc: any) => {
    setActiveReuploadDoc(doc);
    setReuploadPhotoUri(doc.document_url || '');

    // Default expiry date to future date (2 years from now or existing if in future)
    const today = new Date();
    const defaultFuture = `15 Jun ${today.getFullYear() + 2}`;
    if (doc.valid_until && isDateInFuture(doc.valid_until)) {
      setReuploadValidUntil(doc.valid_until);
    } else {
      setReuploadValidUntil(defaultFuture);
    }
  };

  const handlePickPhoto = () => {
    Alert.alert(
      'Document Photo',
      'Choose image source for document photo:',
      [
        {
          text: 'Take Photo (Camera)',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Needed', 'Camera access is required to take a document photo.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              quality: 0.5,
              base64: true,
            });
            if (!result.canceled && result.assets[0]) {
              const asset = result.assets[0];
              const finalUri = asset.base64
                ? `data:image/jpeg;base64,${asset.base64}`
                : asset.uri;
              setReuploadPhotoUri(finalUri);
            }
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Needed', 'Photo gallery access is required.');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              quality: 0.5,
              base64: true,
            });
            if (!result.canceled && result.assets[0]) {
              const asset = result.assets[0];
              const finalUri = asset.base64
                ? `data:image/jpeg;base64,${asset.base64}`
                : asset.uri;
              setReuploadPhotoUri(finalUri);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSubmitReupload = async () => {
    if (!activeReuploadDoc) return;

    if (!reuploadPhotoUri) {
      Alert.alert('Photo Required', 'Please take or choose a clear photo of your document.');
      return;
    }

    if (!reuploadValidUntil.trim()) {
      Alert.alert('Expiry Date Required', 'Please select the validity / expiry date.');
      return;
    }

    if (!isDateInFuture(reuploadValidUntil)) {
      Alert.alert('Invalid Expiry Date', 'Document expiry date must be in the future (not past).');
      return;
    }

    setIsSubmittingReupload(true);
    try {
      let query = supabase.from('driver_documents').update({
        document_url: reuploadPhotoUri,
        verification_status: 'Pending',
        rejection_reason: null,
        valid_until: reuploadValidUntil,
        updated_at: new Date().toISOString(),
      });

      if (activeReuploadDoc.id && !activeReuploadDoc.id.startsWith('1') && !activeReuploadDoc.id.startsWith('2') && !activeReuploadDoc.id.startsWith('3')) {
        query = query.eq('id', activeReuploadDoc.id);
      } else {
        query = query.eq('driver_id', driver.id).eq('document_type', activeReuploadDoc.document_type);
      }

      const { error } = await query;
      if (error) {
        Alert.alert('Submission Error', error.message || 'Failed to update document. Please retry.');
        setIsSubmittingReupload(false);
        return;
      }

      // If driver was suspended due to rejection, reset to inactive for admin review
      if (driver?.id) {
        await supabase
          .from('drivers')
          .update({
            status: 'inactive',
            updated_at: new Date().toISOString(),
          })
          .eq('id', driver.id);
      }

      await refreshDriverProfile();
      setActiveReuploadDoc(null);
      setReuploadPhotoUri('');
      Alert.alert(
        'Document Submitted! ✓',
        'Your document has been re-uploaded and submitted to PickMi Admin. Once verified, you will be able to take trips immediately.'
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Something went wrong during re-upload.');
    } finally {
      setIsSubmittingReupload(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Verified':
        return <Ionicons name="checkmark-circle" size={20} color="#16A34A" />;
      case 'Rejected':
        return <Ionicons name="close-circle" size={20} color="#DC2626" />;
      default:
        return <Ionicons name="time" size={20} color="#D97706" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Verified':
        return (
          <View style={[styles.badge, styles.badgeVerified]}>
            <Text style={styles.badgeVerifiedText}>Approved</Text>
          </View>
        );
      case 'Rejected':
        return (
          <View style={[styles.badge, styles.badgeRejected]}>
            <Text style={styles.badgeRejectedText}>Rejected</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.badge, styles.badgePending]}>
            <Text style={styles.badgePendingText}>Under Review</Text>
          </View>
        );
    }
  };

  const docList =
    documents && documents.length > 0
      ? documents
      : [
          { id: '1', document_type: 'Driving Licence (Front)', verification_status: 'Pending' },
          { id: '2', document_type: 'Driving Licence (Back)', verification_status: 'Pending' },
          { id: '3', document_type: 'RC (Registration Certificate)', verification_status: 'Pending' },
          { id: '4', document_type: 'Insurance Policy', verification_status: 'Pending' },
          { id: '5', document_type: 'Commercial Permit', verification_status: 'Pending' },
        ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, Shadows.lg]}>
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.headerIconBox,
                  isVerified
                    ? styles.iconBoxSuccess
                    : verificationStatus === 'REJECTED'
                    ? styles.iconBoxDanger
                    : styles.iconBoxWarning,
                ]}
              >
                <Ionicons
                  name={
                    isVerified
                      ? 'shield-checkmark'
                      : verificationStatus === 'REJECTED'
                      ? 'alert-circle'
                      : 'hourglass'
                  }
                  size={22}
                  color={
                    isVerified
                      ? '#16A34A'
                      : verificationStatus === 'REJECTED'
                      ? '#DC2626'
                      : '#D97706'
                  }
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>
                  {activeReuploadDoc ? 'Re-upload Document' : 'Driver Compliance Status'}
                </Text>
                <Text style={styles.subtitle}>
                  {activeReuploadDoc
                    ? `Update ${activeReuploadDoc.document_type}`
                    : isVerified
                    ? 'All documents & vehicle approved'
                    : verificationStatus === 'REJECTED'
                    ? 'Action required: Re-upload rejected document(s)'
                    : 'Admin approval required before taking trips'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => {
                if (activeReuploadDoc) {
                  setActiveReuploadDoc(null);
                } else {
                  onClose();
                }
              }}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {activeReuploadDoc ? (
            /* ─────────────────────────────────────────────────────────────
               RE-UPLOAD FORM VIEW
            ────────────────────────────────────────────────────────────── */
            <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
              {/* Rejection Alert Callout */}
              <View style={styles.reuploadAlertBanner}>
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.reuploadAlertTitle}>Admin Rejection Reason</Text>
                  <Text style={styles.reuploadAlertDesc}>
                    {activeReuploadDoc.rejection_reason ||
                      'Document photo was not clear or valid. Please capture a clear image and confirm future validity date.'}
                  </Text>
                </View>
              </View>

              {/* Photo Upload Card */}
              <Text style={styles.formSectionLabel}>DOCUMENT PHOTO</Text>
              {reuploadPhotoUri ? (
                <View style={styles.photoPreviewCard}>
                  <Image
                    source={{ uri: reuploadPhotoUri }}
                    style={styles.photoPreviewImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.changePhotoBtn}
                    onPress={handlePickPhoto}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="camera-reverse" size={16} color="#0043DC" />
                    <Text style={styles.changePhotoText}>Retake / Change Photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadPlaceholder}
                  onPress={handlePickPhoto}
                  activeOpacity={0.8}
                >
                  <View style={styles.uploadIconCircle}>
                    <Ionicons name="camera" size={26} color="#0043DC" />
                  </View>
                  <Text style={styles.uploadPlaceholderTitle}>Capture or Upload Photo</Text>
                  <Text style={styles.uploadPlaceholderSub}>
                    Take a clear photo with camera or choose from gallery
                  </Text>
                </TouchableOpacity>
              )}

              {/* Validity / Expiry Date Picker Trigger */}
              <Text style={[styles.formSectionLabel, { marginTop: 18 }]}>
                VALIDITY / EXPIRY DATE (FUTURE ONLY)
              </Text>
              <TouchableOpacity
                style={styles.datePickerTrigger}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
              >
                <View style={styles.dateTriggerLeft}>
                  <Ionicons name="calendar" size={20} color="#0043DC" />
                  <View>
                    <Text style={styles.dateTriggerSub}>Valid Until Date</Text>
                    <Text style={styles.dateTriggerVal}>
                      {reuploadValidUntil || 'Tap to choose future expiry date'}
                    </Text>
                  </View>
                </View>
                <View style={styles.futureBadge}>
                  <Text style={styles.futureBadgeText}>Future Only</Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.dateHelperText}>
                ⚠️ Expired or past dates cannot be selected. Ensure the date matches your document.
              </Text>

              {/* Action Buttons */}
              <View style={styles.reuploadActionsRow}>
                <TouchableOpacity
                  style={styles.cancelReuploadBtn}
                  onPress={() => setActiveReuploadDoc(null)}
                  disabled={isSubmittingReupload}
                >
                  <Text style={styles.cancelReuploadText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitReuploadBtn, isSubmittingReupload && { opacity: 0.7 }]}
                  onPress={handleSubmitReupload}
                  disabled={isSubmittingReupload}
                >
                  {isSubmittingReupload ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload" size={18} color="#FFFFFF" />
                      <Text style={styles.submitReuploadText}>Submit for Review</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            /* ─────────────────────────────────────────────────────────────
               MAIN COMPLIANCE CHECKLIST VIEW
            ────────────────────────────────────────────────────────────── */
            <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
              {/* Status Summary Banner */}
              <View
                style={[
                  styles.summaryBanner,
                  isVerified
                    ? styles.summarySuccess
                    : verificationStatus === 'REJECTED'
                    ? styles.summaryDanger
                    : styles.summaryWarning,
                ]}
              >
                <View style={styles.summaryTop}>
                  <Text
                    style={[
                      styles.summaryTitle,
                      {
                        color: isVerified
                          ? '#15803D'
                          : verificationStatus === 'REJECTED'
                          ? '#B91C1C'
                          : '#B45309',
                      },
                    ]}
                  >
                    {isVerified
                      ? '🎉 Verification Complete'
                      : verificationStatus === 'REJECTED'
                      ? '🚨 Action Required: Document Rejected'
                      : '⏳ Documents Under Review'}
                  </Text>
                  <Text
                    style={[
                      styles.summaryCount,
                      {
                        color: isVerified
                          ? '#15803D'
                          : verificationStatus === 'REJECTED'
                          ? '#B91C1C'
                          : '#B45309',
                      },
                    ]}
                  >
                    {verifiedDocsCount} / {totalDocsCount} Approved
                  </Text>
                </View>

                <Text style={styles.summaryDesc}>
                  {isVerified
                    ? 'Your account is fully active. You can go online anytime to accept ride dispatches.'
                    : verificationStatus === 'REJECTED'
                    ? `One or more documents were rejected by admin: "${rejectionReason || 'Please verify document image'}". You must re-upload before you can continue using the app.`
                    : 'PickMi Admin is currently reviewing your documents. Once accepted in the admin panel, your status will update automatically.'}
                </Text>
              </View>

              {/* Vehicle Details Overview */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>REGISTERED VEHICLE</Text>
                <View style={styles.vehicleCard}>
                  <View style={styles.vehicleIconBox}>
                    <Ionicons name="car" size={20} color="#0043DC" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vehicleNumber}>
                      {vehicle.vehicle_number || 'Vehicle Number Pending'}
                    </Text>
                    <Text style={styles.vehicleMeta}>
                      {vehicle.vehicle_type || 'Sedan'} • {vehicle.vehicle_model || 'Commercial'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.badge,
                      isVerified ? styles.badgeVerified : styles.badgePending,
                    ]}
                  >
                    <Text
                      style={
                        isVerified ? styles.badgeVerifiedText : styles.badgePendingText
                      }
                    >
                      {isVerified ? 'Vehicle Approved' : 'Review Pending'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Document Verification Checklist */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>DOCUMENTS CHECKLIST</Text>
                <View style={styles.docListContainer}>
                  {docList.map((doc: any, index) => {
                    const isDocRejected = doc.verification_status === 'Rejected';
                    return (
                      <View
                        key={doc.id || index}
                        style={[
                          styles.docItemWrapper,
                          isDocRejected && styles.docItemWrapperRejected,
                          index < docList.length - 1 && styles.docItemBorder,
                        ]}
                      >
                        <View style={styles.docItem}>
                          <View style={styles.docItemLeft}>
                            {getStatusIcon(doc.verification_status)}
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.docName, isDocRejected && { color: '#B91C1C' }]}>
                                {doc.document_type}
                              </Text>
                              {doc.document_number ? (
                                <Text style={styles.docSub}>{doc.document_number}</Text>
                              ) : null}
                              {doc.valid_until ? (
                                <Text style={styles.docExpiry}>Valid until: {doc.valid_until}</Text>
                              ) : null}
                            </View>
                          </View>
                          {getStatusBadge(doc.verification_status)}
                        </View>

                        {/* If Rejected: Show Rejection Notice & Re-upload Trigger */}
                        {isDocRejected && (
                          <View style={styles.rejectedActionCard}>
                            <View style={styles.rejectedReasonRow}>
                              <Ionicons name="warning" size={15} color="#DC2626" />
                              <Text style={styles.rejectedReasonLabel}>Admin Reason:</Text>
                            </View>
                            <Text style={styles.rejectedReasonText}>
                              {doc.rejection_reason || 'Document was rejected. Please re-upload a clear copy.'}
                            </Text>

                            <TouchableOpacity
                              style={styles.reuploadBtn}
                              onPress={() => startReupload(doc)}
                              activeOpacity={0.85}
                            >
                              <Ionicons name="camera" size={15} color="#FFFFFF" />
                              <Text style={styles.reuploadBtnText}>Re-upload Document Now</Text>
                              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Realtime Sync Info */}
              <View style={styles.infoBox}>
                <Ionicons name="sync-circle-outline" size={18} color="#0043DC" />
                <Text style={styles.infoText}>
                  Live Supabase Sync active. Admin updates in the web portal reflect here in real-time.
                </Text>
              </View>
            </ScrollView>
          )}

          {/* Footer Actions (Only in main view) */}
          {!activeReuploadDoc && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <ActivityIndicator size="small" color="#0043DC" />
                ) : (
                  <>
                    <Ionicons name="refresh" size={16} color="#0043DC" />
                    <Text style={styles.refreshButtonText}>Check Status Now</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.doneButton} onPress={onClose}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Date Picker Modal for Document Re-upload (Future Only) */}
      <PickMiDatePickerModal
        visible={showDatePicker}
        futureOnly={true}
        title={`${activeReuploadDoc?.document_type || 'Document'} Expiry`}
        subtitle="Select the future validity date printed on document"
        initialDate={reuploadValidUntil}
        onConfirm={(pickedDate) => {
          setReuploadValidUntil(pickedDate);
          setShowDatePicker(false);
        }}
        onClose={() => setShowDatePicker(false)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  headerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxSuccess: {
    backgroundColor: '#DCFCE7',
  },
  iconBoxWarning: {
    backgroundColor: '#FEF3C7',
  },
  iconBoxDanger: {
    backgroundColor: '#FEE2E2',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  summaryBanner: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  summarySuccess: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  summaryWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  summaryDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    flex: 1,
  },
  summaryCount: {
    fontSize: 12,
    fontWeight: '700',
  },
  summaryDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vehicleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 67, 220, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  vehicleMeta: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  docListContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  docItemWrapper: {
    padding: 13,
  },
  docItemWrapperRejected: {
    backgroundColor: '#FFF5F5',
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  docItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  docItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  docName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  docSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
    fontFamily: 'monospace',
  },
  docExpiry: {
    fontSize: 10.5,
    color: '#059669',
    marginTop: 1.5,
    fontWeight: '600',
  },
  rejectedActionCard: {
    marginTop: 10,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectedReasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  rejectedReasonLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
  rejectedReasonText: {
    fontSize: 11.5,
    color: '#991B1B',
    lineHeight: 16,
    marginBottom: 10,
  },
  reuploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  reuploadBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  badgeVerified: {
    backgroundColor: '#DCFCE7',
  },
  badgeVerifiedText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#15803D',
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  badgePendingText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#B45309',
  },
  badgeRejected: {
    backgroundColor: '#FEE2E2',
  },
  badgeRejectedText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#B91C1C',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 67, 220, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 67, 220, 0.12)',
  },
  infoText: {
    fontSize: 11.5,
    color: '#334155',
    flex: 1,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  refreshButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  refreshButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0043DC',
  },
  doneButton: {
    flex: 1,
    backgroundColor: '#0043DC',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Re-upload View Styles */
  reuploadAlertBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  reuploadAlertTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: 2,
  },
  reuploadAlertDesc: {
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 17,
  },
  formSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  photoPreviewCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  photoPreviewImage: {
    width: '100%',
    height: 180,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#EFF6FF',
    borderTopWidth: 1,
    borderTopColor: '#DBEAFE',
  },
  changePhotoText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0043DC',
  },
  uploadPlaceholder: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#0043DC',
    backgroundColor: 'rgba(0, 67, 220, 0.04)',
    paddingVertical: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0, 67, 220, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  uploadPlaceholderTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  uploadPlaceholderSub: {
    fontSize: 11.5,
    color: '#64748B',
  },
  datePickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  dateTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateTriggerSub: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  dateTriggerVal: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  futureBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  futureBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  dateHelperText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
    marginLeft: 4,
  },
  reuploadActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
    marginBottom: 10,
  },
  cancelReuploadBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelReuploadText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  submitReuploadBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#0043DC',
  },
  submitReuploadText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
