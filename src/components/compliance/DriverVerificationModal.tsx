import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';

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

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshDriverProfile();
    setTimeout(() => setIsRefreshing(false), 600);
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
              <View>
                <Text style={styles.title}>Driver Compliance Status</Text>
                <Text style={styles.subtitle}>
                  {isVerified
                    ? 'All documents & vehicle approved'
                    : 'Admin approval required before taking trips'}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

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
                    ? '⚠️ Action Required on Documents'
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
                  ? `One or more documents were rejected: "${rejectionReason || 'Please verify document image'}". Please re-submit.`
                  : 'PickMi Admin is currently reviewing your licence, RC, and insurance. Once accepted in the admin panel, your status will update automatically.'}
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
                {docList.map((doc: any, index) => (
                  <View
                    key={doc.id || index}
                    style={[
                      styles.docItem,
                      index < docList.length - 1 && styles.docItemBorder,
                    ]}
                  >
                    <View style={styles.docItemLeft}>
                      {getStatusIcon(doc.verification_status)}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.docName}>{doc.document_type}</Text>
                        {doc.document_number ? (
                          <Text style={styles.docSub}>{doc.document_number}</Text>
                        ) : null}
                        {doc.rejection_reason ? (
                          <Text style={styles.rejectionText}>
                            Reason: {doc.rejection_reason}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    {getStatusBadge(doc.verification_status)}
                  </View>
                ))}
              </View>
            </View>

            {/* Realtime Sync Info */}
            <View style={styles.infoBox}>
              <Ionicons name="sync-circle-outline" size={18} color="#0043DC" />
              <Text style={styles.infoText}>
                Live Supabase Sync active. Changes made by Admin in the web portal reflect here in real-time.
              </Text>
            </View>
          </ScrollView>

          {/* Footer Actions */}
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
        </View>
      </View>
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
    maxHeight: '88%',
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
    fontSize: 14,
    fontWeight: '800',
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
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 13,
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
  rejectionText: {
    fontSize: 11,
    color: '#DC2626',
    marginTop: 2,
    fontWeight: '600',
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
});
