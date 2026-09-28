import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../theme/colors';
import { PickMiButton } from '../components/common/PickMiButton';
import { PickMiDatePickerModal } from '../components/common/PickMiDatePickerModal';
import { playOnlineSound } from '../utils/soundEffects';
import { useAuth } from '../context/AuthContext';
import { Driver, Vehicle, DriverDocument, VehicleType } from '../types/database';

type Gender = 'Male' | 'Female' | 'Other' | null;
type OnboardingStep = 'PROFILE' | 'DRIVER_DOCS' | 'VEHICLE_DOCS';

interface ProfileSetupScreenProps {
  onComplete: () => void;
}

const GENDER_ICONS: Record<string, any> = {
  Male: 'male',
  Female: 'female',
  Other: 'transgender',
};

// High-quality sample images for one-tap demo testing
const SAMPLE_AVATAR =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80';
const SAMPLE_DL_FRONT =
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80';
const SAMPLE_DL_BACK =
  'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80';
const SAMPLE_VEHICLE =
  'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80';
const SAMPLE_RC =
  'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=600&q=80';
const SAMPLE_INSURANCE =
  'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80';
const SAMPLE_PERMIT =
  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80';

const VEHICLE_TYPES: { type: VehicleType; icon: any }[] = [
  { type: 'Sedan', icon: 'car' },
  { type: 'SUV', icon: 'car-sport' },
  { type: 'Hatchback', icon: 'car-outline' },
  { type: 'Prime Sedan', icon: 'ribbon' },
  { type: 'EV', icon: 'flash' },
];

export const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({ onComplete }) => {
  const {
    driver,
    updateProfile,
    updateVehicle,
    updateDocuments,
    pendingMobile,
    completeProfileSetup,
  } = useAuth();

  // Current onboarding stage
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('PROFILE');

  // ─── Step 0: Profile Info ──────────────────────────────────────────────────
  const [name, setName] = useState(driver.name || '');
  const [driverMobile, setDriverMobile] = useState(pendingMobile || driver.mobile || '');
  const [gender, setGender] = useState<Gender>('Male');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [nameError, setNameError] = useState('');
  const [genderError, setGenderError] = useState('');

  // ─── Step 1: Driver License Details (Front & Back) ─────────────────────────
  const [dlNumber, setDlNumber] = useState('');
  const [dlValidUntil, setDlValidUntil] = useState('');
  const [dlFrontPhotoUri, setDlFrontPhotoUri] = useState<string | null>(null);
  const [dlBackPhotoUri, setDlBackPhotoUri] = useState<string | null>(null);
  const [dlError, setDlError] = useState('');
  const [dlValidError, setDlValidError] = useState('');

  // ─── Step 2: Vehicle & Documents ───────────────────────────────────────────
  const [vehicleType, setVehicleType] = useState<VehicleType>('Sedan');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehiclePhotoUri, setVehiclePhotoUri] = useState<string | null>(null);
  const [rcPhotoUri, setRcPhotoUri] = useState<string | null>(null);
  const [fcValidUntil, setFcValidUntil] = useState('');
  const [fcValidError, setFcValidError] = useState('');
  const [insurancePhotoUri, setInsurancePhotoUri] = useState<string | null>(null);
  const [insuranceValidUntil, setInsuranceValidUntil] = useState('');
  const [insuranceValidError, setInsuranceValidError] = useState('');
  const [permitPhotoUri, setPermitPhotoUri] = useState<string | null>(null);
  const [permitValidUntil, setPermitValidUntil] = useState('');
  const [permitValidError, setPermitValidError] = useState('');

  const [vehicleModelError, setVehicleModelError] = useState('');
  const [vehicleNumberError, setVehicleNumberError] = useState('');

  // ─── Interactive Date Picker Modal State ───────────────────────────────────
  const [datePickerTarget, setDatePickerTarget] = useState<
    'DL' | 'RC_FC' | 'INSURANCE' | 'PERMIT' | null
  >(null);

  // ─── Account Created Success Popup Modal State ─────────────────────────────
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Image Picker Handler ───────────────────────────────────────────────────
  const pickImage = (
    title: string,
    onSuccess: (uri: string) => void,
    aspect: [number, number] = [4, 3]
  ) => {
    Alert.alert(`Upload ${title}`, 'Select source', [
      {
        text: 'Take Photo (Camera)',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Needed', 'Camera access is required to capture photos.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect,
            quality: 0.5,
            base64: true,
          });
          if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            const finalUri = asset.base64
              ? `data:image/jpeg;base64,${asset.base64}`
              : asset.uri;
            onSuccess(finalUri);
          }
        },
      },
      {
        text: 'Choose from Gallery',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Needed', 'Photo gallery access is required to pick photos.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect,
            quality: 0.5,
            base64: true,
          });
          if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            const finalUri = asset.base64
              ? `data:image/jpeg;base64,${asset.base64}`
              : asset.uri;
            onSuccess(finalUri);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // ─── Step Navigation Handlers ───────────────────────────────────────────────
  const handleProfileNext = () => {
    let valid = true;
    if (!name.trim()) {
      setNameError('Please enter your full legal name');
      valid = false;
    } else {
      setNameError('');
    }

    if (!gender) {
      setGenderError('Please select your gender');
      valid = false;
    } else {
      setGenderError('');
    }

    if (!photoUri) {
      Alert.alert(
        'Profile Photo Required',
        'Please upload or take a clear selfie photo before continuing.'
      );
      return;
    }

    if (!valid) return;
    setCurrentStep('DRIVER_DOCS');
  };

  const isDateInFuture = (dateStr: string): boolean => {
    if (!dateStr || !dateStr.trim()) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parts = dateStr.trim().split(' ');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(parts[1]);
      const y = parseInt(parts[2], 10);
      if (!isNaN(d) && m !== -1 && !isNaN(y)) {
        const check = new Date(y, m, d);
        check.setHours(0, 0, 0, 0);
        return check >= today;
      }
    }
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      parsed.setHours(0, 0, 0, 0);
      return parsed >= today;
    }
    return true;
  };

  const handleDriverDocsNext = () => {
    let valid = true;
    if (!dlNumber.trim()) {
      setDlError('Please enter your Driving License number');
      valid = false;
    } else {
      setDlError('');
    }

    if (!dlValidUntil.trim()) {
      setDlValidError('Please select license expiry date');
      valid = false;
    } else if (!isDateInFuture(dlValidUntil)) {
      setDlValidError('License expiry date must be in the future (not past)');
      valid = false;
    } else {
      setDlValidError('');
    }

    if (!dlFrontPhotoUri) {
      Alert.alert(
        'DL Front Photo Required',
        'Please upload the Front Side photo of your Driving License.'
      );
      return;
    }

    if (!dlBackPhotoUri) {
      Alert.alert(
        'DL Back Photo Required',
        'Please upload the Back Side photo of your Driving License.'
      );
      return;
    }

    if (!valid) return;
    setCurrentStep('VEHICLE_DOCS');
  };

  const handleFinalSubmit = async () => {
    let valid = true;
    if (!vehicleModel.trim()) {
      setVehicleModelError('Please enter vehicle model (e.g. Maruti Dzire)');
      valid = false;
    } else {
      setVehicleModelError('');
    }

    if (!vehicleNumber.trim()) {
      setVehicleNumberError('Please enter vehicle registration number (e.g. KA 05 MN 4821)');
      valid = false;
    } else {
      setVehicleNumberError('');
    }

    if (!vehiclePhotoUri) {
      Alert.alert('Vehicle Photo Required', 'Please upload a photo of your vehicle exterior.');
      return;
    }

    if (!rcPhotoUri) {
      Alert.alert('RC Document Required', 'Please upload your vehicle Registration Certificate (RC).');
      return;
    }

    if (!fcValidUntil.trim()) {
      setFcValidError('Please select RC / FC validity date');
      valid = false;
    } else if (!isDateInFuture(fcValidUntil)) {
      setFcValidError('RC / FC validity date must be in the future (not past)');
      valid = false;
    } else {
      setFcValidError('');
    }

    if (!insurancePhotoUri) {
      Alert.alert('Insurance Photo Required', 'Please upload your vehicle Insurance policy document.');
      return;
    }

    if (!insuranceValidUntil.trim()) {
      setInsuranceValidError('Please select insurance expiry date');
      valid = false;
    } else if (!isDateInFuture(insuranceValidUntil)) {
      setInsuranceValidError('Insurance expiry date must be in the future (not past)');
      valid = false;
    } else {
      setInsuranceValidError('');
    }

    if (!permitPhotoUri) {
      Alert.alert('Permit Photo Required', 'Please upload your vehicle Commercial / State Permit document.');
      return;
    }

    if (!permitValidUntil.trim()) {
      setPermitValidError('Please select permit expiry date');
      valid = false;
    } else if (!isDateInFuture(permitValidUntil)) {
      setPermitValidError('Permit expiry date must be in the future (not past)');
      valid = false;
    } else {
      setPermitValidError('');
    }

    if (!valid) return;

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));

    // Ensure a unique driver ID for new registration
    const targetDriverId =
      driver.id && driver.id !== 'drv_karthik_01'
        ? driver.id
        : `drv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const effectiveMobile = (driverMobile || pendingMobile || driver.mobile).trim();

    // Helper: Ensure photo is always a web-renderable URI (base64 data URI or HTTP URL)
    const sanitizePhoto = (uri: string | null, fallback: string): string => {
      if (!uri) return fallback;
      if (uri.startsWith('data:') || uri.startsWith('http://') || uri.startsWith('https://')) {
        return uri;
      }
      return fallback;
    };

    const updatedDriver: Driver = {
      ...driver,
      id: targetDriverId,
      name: name.trim(),
      profile_image: sanitizePhoto(photoUri, SAMPLE_AVATAR),
      mobile: effectiveMobile,
      email: `${name.trim().toLowerCase().replace(/\s+/g, '.')}@pickmi.com`,
      online_status: 'ONLINE',
      status: 'active',
      rating: 5.0,
      total_trips: 0,
      deposit_status: 'PENDING',
      deposit_amount: 250,
      created_at: new Date().toISOString(),
    };

    const updatedVehicle: Vehicle = {
      id: `veh_${targetDriverId}`,
      driver_id: targetDriverId,
      vehicle_type: vehicleType,
      vehicle_model: vehicleModel.trim(),
      vehicle_number: vehicleNumber.trim().toUpperCase(),
      vehicle_image: sanitizePhoto(vehiclePhotoUri, SAMPLE_VEHICLE),
      created_at: new Date().toISOString(),
    };

    updateProfile(updatedDriver);
    updateVehicle(updatedVehicle);

    const newDocs: DriverDocument[] = [
      {
        id: `doc_dl_front_${Date.now()}`,
        driver_id: targetDriverId,
        document_type: 'Driving Licence (Front)',
        document_url: sanitizePhoto(dlFrontPhotoUri, SAMPLE_DL_FRONT),
        document_number: dlNumber.trim().toUpperCase(),
        valid_until: dlValidUntil.trim() || '15 Jun 2035',
        verification_status: 'Pending',
        created_at: new Date().toISOString(),
      },
      {
        id: `doc_dl_back_${Date.now()}`,
        driver_id: targetDriverId,
        document_type: 'Driving Licence (Back)',
        document_url: sanitizePhoto(dlBackPhotoUri, SAMPLE_DL_BACK),
        document_number: dlNumber.trim().toUpperCase(),
        valid_until: dlValidUntil.trim() || '15 Jun 2035',
        verification_status: 'Pending',
        created_at: new Date().toISOString(),
      },
      {
        id: `doc_rc_${Date.now()}`,
        driver_id: targetDriverId,
        document_type: 'RC',
        document_url: sanitizePhoto(rcPhotoUri, SAMPLE_RC),
        document_number: `${vehicleNumber.trim().toUpperCase().replace(/\s+/g, '')}-REG`,
        valid_until: fcValidUntil.trim() || '18 Nov 2038',
        verification_status: 'Pending',
        created_at: new Date().toISOString(),
      },
      {
        id: `doc_ins_${Date.now()}`,
        driver_id: targetDriverId,
        document_type: 'Insurance',
        document_url: sanitizePhoto(insurancePhotoUri, SAMPLE_INSURANCE),
        document_number: 'BAJAJ-ALLIANZ-7821',
        valid_until: insuranceValidUntil.trim() || '24 Oct 2027',
        verification_status: 'Pending',
        created_at: new Date().toISOString(),
      },
      {
        id: `doc_pmt_${Date.now()}`,
        driver_id: targetDriverId,
        document_type: 'Permit',
        document_url: sanitizePhoto(permitPhotoUri, SAMPLE_PERMIT),
        document_number: 'KA-COMM-CAB-9102',
        valid_until: permitValidUntil.trim() || '31 Dec 2026',
        verification_status: 'Pending',
        created_at: new Date().toISOString(),
      },
    ];
    updateDocuments(newDocs);

    const result = await completeProfileSetup(updatedDriver, updatedVehicle, newDocs);

    setIsSubmitting(false);

    if (!result.success) {
      Alert.alert(
        'Registration Failed',
        result.error || 'Failed to create driver in database. Please check mobile and vehicle numbers.'
      );
      return;
    }

    playOnlineSound();
    setShowSuccessModal(true);
  };

  const handleProceedToHome = () => {
    setShowSuccessModal(false);
    onComplete();
  };

  // ─── Render Document Upload Card Helper ─────────────────────────────────────
  const renderDocCard = (
    title: string,
    subtitle: string,
    photoUrl: string | null,
    onUpload: () => void,
    onRemove: () => void,
    iconName: any = 'document-text-outline',
    datePicker?: {
      label: string;
      value: string;
      error?: string;
      onPress: () => void;
    }
  ) => {
    return (
      <View style={styles.card}>
        <View style={styles.docHeader}>
          <View style={styles.docIconBox}>
            <Ionicons name={iconName} size={18} color={Colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.docTitle}>{title}</Text>
            <Text style={styles.docSubtitle}>{subtitle}</Text>
          </View>
          {photoUrl ? (
            <View style={styles.uploadedBadge}>
              <Ionicons name="checkmark-circle" size={13} color={Colors.successDark} />
              <Text style={styles.uploadedBadgeText}>Uploaded</Text>
            </View>
          ) : (
            <View style={styles.mandatoryPill}>
              <Text style={styles.mandatoryPillText}>Mandatory</Text>
            </View>
          )}
        </View>

        {photoUrl ? (
          <View style={styles.docPreviewContainer}>
            <Image source={{ uri: photoUrl }} style={styles.docImagePreview} resizeMode="cover" />
            <View style={styles.docPreviewOverlay}>
              <TouchableOpacity style={styles.docActionBtn} onPress={onUpload} activeOpacity={0.8}>
                <Ionicons name="camera-reverse" size={13} color={Colors.textPrimary} />
                <Text style={styles.docActionBtnText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.docActionBtn, styles.docRemoveBtn]}
                onPress={onRemove}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={13} color={Colors.danger} />
                <Text style={[styles.docActionBtnText, { color: Colors.danger }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadPlaceholder} onPress={onUpload} activeOpacity={0.75}>
            <View style={styles.uploadIconCircle}>
              <Ionicons name="cloud-upload-outline" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.uploadPlaceholderText}>Upload or Capture Photo</Text>
            <Text style={styles.uploadPlaceholderSub}>JPG, PNG • Camera or Photo Gallery</Text>
          </TouchableOpacity>
        )}

        {/* Optional Interactive Date Picker for Document Validity */}
        {datePicker && (
          <View style={styles.cardDatePickerSection}>
            <View style={styles.cardDatePickerHeader}>
              <View style={styles.cardDatePickerHeaderLeft}>
                <Ionicons name="calendar-outline" size={13} color={Colors.primary} />
                <Text style={styles.cardDatePickerLabel}>{datePicker.label}</Text>
              </View>
              <Text style={styles.mandatoryPillSm}>Mandatory</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.datePickerTrigger,
                datePicker.error ? styles.datePickerTriggerError : null,
                datePicker.value ? styles.datePickerTriggerFilled : null,
              ]}
              onPress={datePicker.onPress}
              activeOpacity={0.8}
            >
              <View style={styles.datePickerTriggerLeft}>
                <Ionicons
                  name={datePicker.value ? 'calendar' : 'calendar-outline'}
                  size={18}
                  color={datePicker.value ? Colors.primary : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.datePickerTriggerText,
                    !datePicker.value && styles.datePickerTriggerPlaceholder,
                  ]}
                >
                  {datePicker.value || 'Select validity / expiry date'}
                </Text>
              </View>
              <View style={styles.datePickerTriggerRight}>
                {datePicker.value ? (
                  <View style={styles.dateSelectedBadge}>
                    <Ionicons name="checkmark-circle" size={13} color={Colors.successDark} />
                    <Text style={styles.dateSelectedBadgeText}>Confirmed</Text>
                  </View>
                ) : (
                  <View style={styles.datePickAction}>
                    <Text style={styles.datePickActionText}>Pick Date</Text>
                    <Ionicons name="chevron-forward" size={13} color={Colors.primary} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
            {datePicker.error ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={13} color={Colors.danger} />
                <Text style={styles.errorText}>{datePicker.error}</Text>
              </View>
            ) : null}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* ── Fixed Top Stepper Bar ── */}
      <View style={styles.topStepper}>
        <View style={styles.stepperHeader}>
          <View style={styles.stepperBrandRow}>
            <View style={styles.brandIconMini}>
              <Ionicons name="shield-checkmark" size={14} color={Colors.white} />
            </View>
            <Text style={styles.stepperTitle}>Driver Onboarding</Text>
          </View>
          <View style={styles.stepCounterBadge}>
            <Text style={styles.stepCounterText}>
              {currentStep === 'PROFILE'
                ? 'Step 1 of 3'
                : currentStep === 'DRIVER_DOCS'
                ? 'Step 2 of 3'
                : 'Step 3 of 3'}
            </Text>
          </View>
        </View>

        {/* 3-Step Interactive Timeline */}
        <View style={styles.timelineRow}>
          {/* Step 1 */}
          <View style={styles.timelineStepItem}>
            <View
              style={[
                styles.stepCircle,
                currentStep === 'PROFILE'
                  ? styles.stepCircleActive
                  : styles.stepCircleCompleted,
              ]}
            >
              {currentStep !== 'PROFILE' ? (
                <Ionicons name="checkmark" size={14} color={Colors.white} />
              ) : (
                <Text style={styles.stepNumberActive}>1</Text>
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                currentStep === 'PROFILE' && styles.stepLabelActive,
              ]}
            >
              Profile
            </Text>
          </View>

          {/* Line 1 -> 2 */}
          <View
            style={[
              styles.timelineLine,
              currentStep === 'DRIVER_DOCS' || currentStep === 'VEHICLE_DOCS'
                ? styles.timelineLineActive
                : null,
            ]}
          />

          {/* Step 2 */}
          <View style={styles.timelineStepItem}>
            <View
              style={[
                styles.stepCircle,
                currentStep === 'DRIVER_DOCS'
                  ? styles.stepCircleActive
                  : currentStep === 'VEHICLE_DOCS'
                  ? styles.stepCircleCompleted
                  : styles.stepCircleUpcoming,
              ]}
            >
              {currentStep === 'VEHICLE_DOCS' ? (
                <Ionicons name="checkmark" size={14} color={Colors.white} />
              ) : (
                <Text
                  style={[
                    styles.stepNumber,
                    currentStep === 'DRIVER_DOCS' && styles.stepNumberActive,
                  ]}
                >
                  2
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                currentStep === 'DRIVER_DOCS' && styles.stepLabelActive,
              ]}
            >
              License
            </Text>
          </View>

          {/* Line 2 -> 3 */}
          <View
            style={[
              styles.timelineLine,
              currentStep === 'VEHICLE_DOCS' ? styles.timelineLineActive : null,
            ]}
          />

          {/* Step 3 */}
          <View style={styles.timelineStepItem}>
            <View
              style={[
                styles.stepCircle,
                currentStep === 'VEHICLE_DOCS'
                  ? styles.stepCircleActive
                  : styles.stepCircleUpcoming,
              ]}
            >
              <Text
                style={[
                  styles.stepNumber,
                  currentStep === 'VEHICLE_DOCS' && styles.stepNumberActive,
                ]}
              >
                3
              </Text>
            </View>
            <Text
              style={[
                styles.stepLabel,
                currentStep === 'VEHICLE_DOCS' && styles.stepLabelActive,
              ]}
            >
              Vehicle
            </Text>
          </View>
        </View>
      </View>

      {/* ── Main Scrollable Content ── */}
      <KeyboardAvoidingView
        style={styles.contentWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          key={currentStep}
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ================================================================ */}
          {/* STAGE 0: BASIC PROFILE SETUP                                     */}
          {/* ================================================================ */}
          {currentStep === 'PROFILE' && (
            <View style={styles.stepInner}>
              <View style={styles.header}>
                <View style={styles.stepBadge}>
                  <Ionicons name="sparkles" size={12} color={Colors.primary} />
                  <Text style={styles.stepBadgeText}>Step 1: Driver Profile</Text>
                </View>
                <Text style={styles.title}>Create Your Profile</Text>
                <Text style={styles.subtitle}>
                  Enter your details to register as an active PickMi Driver Partner.
                </Text>
              </View>

              {/* Profile Photo / Selfie Card */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardLabel}>PROFILE SELFIE</Text>
                  <View style={styles.mandatoryPill}>
                    <Text style={styles.mandatoryPillText}>Mandatory</Text>
                  </View>
                </View>

                <View style={styles.photoCenterBox}>
                  <View style={styles.avatarWrap}>
                    {photoUri ? (
                      <Image source={{ uri: photoUri }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarEmpty}>
                        <Ionicons name="person" size={38} color="#94A3B8" />
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.avatarCameraBadge}
                      onPress={() =>
                        pickImage('Profile Photo', (uri) => setPhotoUri(uri), [1, 1])
                      }
                      activeOpacity={0.8}
                    >
                      <Ionicons name="camera" size={16} color={Colors.white} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.photoActionRow}>
                    <TouchableOpacity
                      style={styles.photoPillBtn}
                      onPress={() =>
                        pickImage('Profile Photo', (uri) => setPhotoUri(uri), [1, 1])
                      }
                      activeOpacity={0.8}
                    >
                      <Ionicons name="camera-outline" size={16} color={Colors.primary} />
                      <Text style={styles.photoPillBtnText}>
                        {photoUri ? 'Change Selfie' : 'Take / Upload Selfie'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.photoTipsRow}>
                    <View style={styles.tipItem}>
                      <Ionicons name="checkmark-circle" size={12} color={Colors.successDark} />
                      <Text style={styles.tipText}>Front-facing</Text>
                    </View>
                    <View style={styles.tipItem}>
                      <Ionicons name="checkmark-circle" size={12} color={Colors.successDark} />
                      <Text style={styles.tipText}>Good lighting</Text>
                    </View>
                    <View style={styles.tipItem}>
                      <Ionicons name="checkmark-circle" size={12} color={Colors.successDark} />
                      <Text style={styles.tipText}>No sunglasses</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Full Name */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardLabel}>FULL LEGAL NAME</Text>
                  <View style={styles.mandatoryPill}>
                    <Text style={styles.mandatoryPillText}>Mandatory</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.inputWrapper,
                    nameError ? styles.inputWrapperError : null,
                    name.length > 0 && !nameError ? styles.inputWrapperFilled : null,
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={
                      nameError ? Colors.danger : name.length > 0 ? Colors.primary : Colors.textMuted
                    }
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter full name as printed on Driving License"
                    placeholderTextColor={Colors.textPlaceholder}
                    value={name}
                    onChangeText={(t) => {
                      setName(t);
                      if (nameError) setNameError('');
                    }}
                    autoCapitalize="words"
                    returnKeyType="done"
                    maxLength={40}
                  />
                </View>
                {nameError ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={13} color={Colors.danger} />
                    <Text style={styles.errorText}>{nameError}</Text>
                  </View>
                ) : null}
              </View>

              {/* Gender */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardLabel}>GENDER</Text>
                  <View style={styles.mandatoryPill}>
                    <Text style={styles.mandatoryPillText}>Mandatory</Text>
                  </View>
                </View>
                <View style={styles.genderRow}>
                  {(['Male', 'Female', 'Other'] as Gender[]).map((g) => (
                    <TouchableOpacity
                      key={g!}
                      style={[
                        styles.genderChip,
                        gender === g && styles.genderChipActive,
                        genderError ? styles.genderChipError : null,
                      ]}
                      onPress={() => {
                        setGender(g);
                        if (genderError) setGenderError('');
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={GENDER_ICONS[g!]}
                        size={17}
                        color={gender === g ? Colors.white : Colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.genderLabel,
                          gender === g && styles.genderLabelActive,
                        ]}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Registered Mobile */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardLabel}>REGISTERED MOBILE NUMBER</Text>
                  <View style={styles.verifiedPill}>
                    <Ionicons name="shield-checkmark" size={12} color={Colors.successDark} />
                    <Text style={styles.verifiedPillText}>Verified</Text>
                  </View>
                </View>
                <View style={[styles.inputWrapper, styles.inputWrapperDisabled]}>
                  <Ionicons name="call-outline" size={18} color={Colors.primary} />
                  <TextInput
                    style={[styles.input, styles.inputDisabled]}
                    value={driverMobile}
                    editable={false}
                    keyboardType="phone-pad"
                  />
                  <Ionicons name="lock-closed" size={16} color="#94A3B8" />
                </View>
                <Text style={styles.inputHelperText}>
                  Linked via OTP verification. Contact dispatch to change number.
                </Text>
              </View>
            </View>
          )}

          {/* ================================================================ */}
          {/* STEP 1: DRIVING LICENSE (FRONT & BACK)                            */}
          {/* ================================================================ */}
          {currentStep === 'DRIVER_DOCS' && (
            <View style={styles.stepInner}>
              <View style={styles.header}>
                <View style={styles.stepBadge}>
                  <Ionicons name="card" size={12} color={Colors.primary} />
                  <Text style={styles.stepBadgeText}>Step 2: License Verification</Text>
                </View>
                <Text style={styles.title}>Driving License Details</Text>
                <Text style={styles.subtitle}>
                  Provide your official DL number and upload high-resolution front and back photos.
                </Text>
              </View>

              {/* DL Number Input */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardLabel}>DRIVING LICENSE NUMBER</Text>
                  <View style={styles.mandatoryPill}>
                    <Text style={styles.mandatoryPillText}>Mandatory</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.inputWrapper,
                    dlError ? styles.inputWrapperError : null,
                    dlNumber.length > 0 && !dlError ? styles.inputWrapperFilled : null,
                  ]}
                >
                  <Ionicons
                    name="card-outline"
                    size={18}
                    color={dlError ? Colors.danger : Colors.primary}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. KA0520210048219"
                    placeholderTextColor={Colors.textPlaceholder}
                    value={dlNumber}
                    onChangeText={(t) => {
                      setDlNumber(t.toUpperCase());
                      if (dlError) setDlError('');
                    }}
                    autoCapitalize="characters"
                    returnKeyType="next"
                    maxLength={20}
                  />
                </View>
                {dlError ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={13} color={Colors.danger} />
                    <Text style={styles.errorText}>{dlError}</Text>
                  </View>
                ) : null}
              </View>

              {/* DL Validity */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardLabel}>LICENSE VALID UNTIL / EXPIRY</Text>
                  <View style={styles.mandatoryPill}>
                    <Text style={styles.mandatoryPillText}>Mandatory</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.datePickerTrigger,
                    dlValidError ? styles.datePickerTriggerError : null,
                    dlValidUntil ? styles.datePickerTriggerFilled : null,
                  ]}
                  onPress={() => setDatePickerTarget('DL')}
                  activeOpacity={0.8}
                >
                  <View style={styles.datePickerTriggerLeft}>
                    <Ionicons
                      name={dlValidUntil ? 'calendar' : 'calendar-outline'}
                      size={18}
                      color={dlValidUntil ? Colors.primary : Colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.datePickerTriggerText,
                        !dlValidUntil && styles.datePickerTriggerPlaceholder,
                      ]}
                    >
                      {dlValidUntil || 'Tap to select license expiry date'}
                    </Text>
                  </View>
                  <View style={styles.datePickerTriggerRight}>
                    {dlValidUntil ? (
                      <View style={styles.dateSelectedBadge}>
                        <Ionicons name="checkmark-circle" size={13} color={Colors.successDark} />
                        <Text style={styles.dateSelectedBadgeText}>Confirmed</Text>
                      </View>
                    ) : (
                      <View style={styles.datePickAction}>
                        <Text style={styles.datePickActionText}>Pick Date</Text>
                        <Ionicons name="chevron-forward" size={13} color={Colors.primary} />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
                {dlValidError ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={13} color={Colors.danger} />
                    <Text style={styles.errorText}>{dlValidError}</Text>
                  </View>
                ) : null}
              </View>

              {/* DL Front Side Photo Upload Card */}
              {renderDocCard(
                'Driving License (Front Side)',
                'Clear photo showing portrait, name, and DL number',
                dlFrontPhotoUri,
                () => pickImage('DL Front Side', (uri) => setDlFrontPhotoUri(uri)),
                () => setDlFrontPhotoUri(null),
                'card-outline'
              )}

              {/* DL Back Side Photo Upload Card */}
              {renderDocCard(
                'Driving License (Back Side)',
                'Photo showing vehicle category badges and address',
                dlBackPhotoUri,
                () => pickImage('DL Back Side', (uri) => setDlBackPhotoUri(uri)),
                () => setDlBackPhotoUri(null),
                'card-outline'
              )}
            </View>
          )}

          {/* ================================================================ */}
          {/* STEP 2: VEHICLE DETAILS & COMPLIANCE DOCUMENTS                   */}
          {/* ================================================================ */}
          {currentStep === 'VEHICLE_DOCS' && (
            <View style={styles.stepInner}>
              <View style={styles.header}>
                <View style={styles.stepBadge}>
                  <Ionicons name="car" size={12} color={Colors.primary} />
                  <Text style={styles.stepBadgeText}>Step 3: Vehicle & Documents</Text>
                </View>
                <Text style={styles.title}>Vehicle Information</Text>
                <Text style={styles.subtitle}>
                  Add your vehicle specifications and upload RC, insurance, and permit.
                </Text>
              </View>

              {/* Vehicle Type Selection */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardLabel}>SELECT VEHICLE CATEGORY</Text>
                  <View style={styles.mandatoryPill}>
                    <Text style={styles.mandatoryPillText}>Mandatory</Text>
                  </View>
                </View>
                <View style={styles.vehicleTypeGrid}>
                  {VEHICLE_TYPES.map(({ type, icon }) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.vehicleTypeCard,
                        vehicleType === type && styles.vehicleTypeCardActive,
                      ]}
                      onPress={() => setVehicleType(type)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={icon}
                        size={20}
                        color={vehicleType === type ? Colors.primary : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.vehicleTypeCardText,
                          vehicleType === type && styles.vehicleTypeCardTextActive,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Vehicle Model & Registration Number */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardLabel}>VEHICLE MODEL & MAKE</Text>
                  <View style={styles.mandatoryPill}>
                    <Text style={styles.mandatoryPillText}>Mandatory</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.inputWrapper,
                    vehicleModelError ? styles.inputWrapperError : null,
                  ]}
                >
                  <Ionicons name="car-outline" size={18} color={Colors.primary} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Maruti Suzuki Dzire VXI"
                    placeholderTextColor={Colors.textPlaceholder}
                    value={vehicleModel}
                    onChangeText={(t) => {
                      setVehicleModel(t);
                      if (vehicleModelError) setVehicleModelError('');
                    }}
                    returnKeyType="next"
                  />
                </View>
                {vehicleModelError ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={13} color={Colors.danger} />
                    <Text style={styles.errorText}>{vehicleModelError}</Text>
                  </View>
                ) : null}

                <View style={[styles.cardHeaderRow, { marginTop: 14 }]}>
                  <Text style={styles.cardLabel}>VEHICLE REGISTRATION NUMBER (NUMBER PLATE)</Text>
                  <View style={styles.mandatoryPill}>
                    <Text style={styles.mandatoryPillText}>Mandatory</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.inputWrapper,
                    vehicleNumberError ? styles.inputWrapperError : null,
                  ]}
                >
                  <Ionicons name="browsers-outline" size={18} color={Colors.primary} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. KA 05 MN 4821"
                    placeholderTextColor={Colors.textPlaceholder}
                    value={vehicleNumber}
                    onChangeText={(t) => {
                      setVehicleNumber(t.toUpperCase());
                      if (vehicleNumberError) setVehicleNumberError('');
                    }}
                    autoCapitalize="characters"
                    returnKeyType="done"
                  />
                </View>
                {vehicleNumberError ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={13} color={Colors.danger} />
                    <Text style={styles.errorText}>{vehicleNumberError}</Text>
                  </View>
                ) : null}
              </View>

              {/* 1. Vehicle Exterior Photo */}
              {renderDocCard(
                'Vehicle Photo (Exterior)',
                'Front angle photo showing number plate clearly',
                vehiclePhotoUri,
                () => pickImage('Vehicle Photo', (uri) => setVehiclePhotoUri(uri)),
                () => setVehiclePhotoUri(null),
                'car-outline'
              )}

              {/* 2. Vehicle RC Photo & Fitness Certificate (FC) Validity */}
              {renderDocCard(
                'RC (Registration Certificate)',
                'Clear photo of original RC smart card or booklet',
                rcPhotoUri,
                () => pickImage('RC Document', (uri) => setRcPhotoUri(uri)),
                () => setRcPhotoUri(null),
                'document-text-outline',
                {
                  label: 'RC / Fitness Certificate (FC) Validity',
                  value: fcValidUntil,
                  error: fcValidError,
                  onPress: () => setDatePickerTarget('RC_FC'),
                }
              )}

              {/* 3. Vehicle Insurance Photo & Policy Expiry */}
              {renderDocCard(
                'Vehicle Insurance Policy',
                'Valid commercial or comprehensive insurance document',
                insurancePhotoUri,
                () => pickImage('Insurance Photo', (uri) => setInsurancePhotoUri(uri)),
                () => setInsurancePhotoUri(null),
                'shield-checkmark-outline',
                {
                  label: 'Insurance Policy Expiry Date',
                  value: insuranceValidUntil,
                  error: insuranceValidError,
                  onPress: () => setDatePickerTarget('INSURANCE'),
                }
              )}

              {/* 4. Commercial / State Permit Photo & Expiry */}
              {renderDocCard(
                'Vehicle Commercial Permit',
                'Valid passenger carriage or tourist taxi permit',
                permitPhotoUri,
                () => pickImage('Permit Photo', (uri) => setPermitPhotoUri(uri)),
                () => setPermitPhotoUri(null),
                'ribbon-outline',
                {
                  label: 'Commercial Permit Expiry Date',
                  value: permitValidUntil,
                  error: permitValidError,
                  onPress: () => setDatePickerTarget('PERMIT'),
                }
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Fixed Bottom Call-To-Action (CTA) Bar (Flat, No Shadows) ── */}
      <View style={styles.bottomBar}>
        {currentStep === 'PROFILE' && (
          <PickMiButton
            title="Next: Driver License (Step 2) →"
            onPress={handleProfileNext}
            variant="primary"
            size="lg"
          />
        )}

        {currentStep === 'DRIVER_DOCS' && (
          <View style={styles.bottomBarRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setCurrentStep('PROFILE')}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={18} color={Colors.textSecondary} />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>

            <PickMiButton
              title="Next: Vehicle (Step 3) →"
              onPress={handleDriverDocsNext}
              variant="primary"
              size="lg"
              style={{ flex: 1 }}
            />
          </View>
        )}

        {currentStep === 'VEHICLE_DOCS' && (
          <View style={styles.bottomBarRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setCurrentStep('DRIVER_DOCS')}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={18} color={Colors.textSecondary} />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>

            {isSubmitting ? (
              <View style={styles.submittingRow}>
                <ActivityIndicator color={Colors.primary} size="small" />
                <Text style={styles.submittingText}>Registering Driver Partner…</Text>
              </View>
            ) : (
              <PickMiButton
                title="Complete Registration ✓"
                onPress={handleFinalSubmit}
                variant="success"
                size="lg"
                style={{ flex: 1 }}
              />
            )}
          </View>
        )}
      </View>

      {/* ── Interactive Date Picker Modal for Driving License, RC/FC, Insurance, Permit ── */}
      <PickMiDatePickerModal
        visible={datePickerTarget !== null}
        futureOnly={true}
        title={
          datePickerTarget === 'DL'
            ? 'Driving License Expiry'
            : datePickerTarget === 'RC_FC'
            ? 'RC / Fitness Certificate Expiry'
            : datePickerTarget === 'INSURANCE'
            ? 'Insurance Policy Expiry Date'
            : 'Commercial Permit Expiry Date'
        }
        subtitle={
          datePickerTarget === 'DL'
            ? 'Select the valid-until date printed on your Driving License'
            : datePickerTarget === 'RC_FC'
            ? 'Select RC or Fitness Certificate (FC) validity date'
            : datePickerTarget === 'INSURANCE'
            ? 'Select insurance policy validity / expiration date'
            : 'Select commercial tourist / passenger permit validity date'
        }
        initialDate={
          datePickerTarget === 'DL'
            ? dlValidUntil
            : datePickerTarget === 'RC_FC'
            ? fcValidUntil
            : datePickerTarget === 'INSURANCE'
            ? insuranceValidUntil
            : permitValidUntil
        }
        onConfirm={(pickedDate) => {
          if (datePickerTarget === 'DL') {
            setDlValidUntil(pickedDate);
            if (dlValidError) setDlValidError('');
          } else if (datePickerTarget === 'RC_FC') {
            setFcValidUntil(pickedDate);
            if (fcValidError) setFcValidError('');
          } else if (datePickerTarget === 'INSURANCE') {
            setInsuranceValidUntil(pickedDate);
            if (insuranceValidError) setInsuranceValidError('');
          } else if (datePickerTarget === 'PERMIT') {
            setPermitValidUntil(pickedDate);
            if (permitValidError) setPermitValidError('');
          }
          setDatePickerTarget(null);
        }}
        onClose={() => setDatePickerTarget(null)}
      />

      {/* ── Account Created Successfully Popup Modal ── */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleProceedToHome}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalCard}>
            {/* Animated Celebration Icon */}
            <View style={styles.successIconCircleOuter}>
              <View style={styles.successIconCircleInner}>
                <Ionicons name="checkmark-sharp" size={36} color={Colors.white} />
              </View>
            </View>

            {/* Title & Subtitle */}
            <Text style={styles.successModalTitle}>Registration Complete!</Text>
            <Text style={styles.successModalSubtitle}>
              Your driver profile, driving license, and vehicle documents have been verified and submitted successfully.
            </Text>

            {/* Profile Overview Card */}
            <View style={styles.successDriverCard}>
              <Image
                source={{ uri: photoUri || SAMPLE_AVATAR }}
                style={styles.successDriverAvatar}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.successDriverName}>{name.trim() || 'Driver Partner'}</Text>
                <Text style={styles.successVehicleInfo}>
                  {vehicleModel.trim()} • {vehicleNumber.trim().toUpperCase()}
                </Text>
                <View style={styles.verifiedTagRow}>
                  <Ionicons name="shield-checkmark" size={13} color={Colors.successDark} />
                  <Text style={styles.verifiedTagText}>All Documents Submitted</Text>
                </View>
              </View>
            </View>

            {/* Welcome message pill */}
            <View style={styles.welcomePill}>
              <Ionicons name="sparkles" size={14} color="#D97706" />
              <Text style={styles.welcomePillText}>Welcome to PickMi Driver Partner Network</Text>
            </View>

            {/* Action CTA Button to land on Home */}
            <TouchableOpacity
              style={styles.goToHomeBtn}
              onPress={handleProceedToHome}
              activeOpacity={0.85}
            >
              <Text style={styles.goToHomeBtnText}>Go to Driver Dashboard →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentWrap: {
    flex: 1,
  },
  topStepper: {
    backgroundColor: Colors.white,
    paddingTop: Platform.OS === 'ios' ? 50 : 36,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  stepperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  stepperBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIconMini: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  stepCounterBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  stepCounterText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  timelineStepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: Colors.primary,
  },
  stepCircleCompleted: {
    backgroundColor: Colors.success,
  },
  stepCircleUpcoming: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  stepNumberActive: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.white,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  stepLabelActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  timelineLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
    marginBottom: 16,
  },
  timelineLineActive: {
    backgroundColor: Colors.primary,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  stepInner: {
    flex: 1,
  },
  header: {
    marginBottom: 16,
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    gap: 5,
    marginBottom: 8,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.5,
  },
  mandatoryPill: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  mandatoryPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  photoCenterBox: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarEmpty: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  photoActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  photoPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  photoPillBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  photoTipsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tipText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputWrapperFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  inputWrapperError: {
    borderColor: Colors.danger,
    backgroundColor: '#FEF2F2',
  },
  inputWrapperDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginLeft: 8,
  },
  inputDisabled: {
    color: '#64748B',
  },
  inputHelperText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  errorText: {
    fontSize: 11,
    color: Colors.danger,
    fontWeight: '600',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  genderChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genderChipError: {
    borderColor: Colors.danger,
  },
  genderLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  genderLabelActive: {
    color: Colors.white,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.successDark,
  },
  vehicleTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vehicleTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  vehicleTypeCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  vehicleTypeCardText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  vehicleTypeCardTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  docIconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  docSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  uploadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  uploadedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.successDark,
  },
  docPreviewContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    height: 130,
    backgroundColor: '#0F172A',
  },
  docImagePreview: {
    width: '100%',
    height: '100%',
  },
  docPreviewOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    gap: 6,
  },
  docActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  docRemoveBtn: {
    backgroundColor: '#FEF2F2',
  },
  docActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  uploadPlaceholder: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#BFDBFE',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  uploadPlaceholderText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  uploadPlaceholderSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  cardDatePickerSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cardDatePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardDatePickerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardDatePickerLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.5,
  },
  mandatoryPillSm: {
    fontSize: 9,
    fontWeight: '700',
    color: '#DC2626',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  datePickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  datePickerTriggerFilled: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  datePickerTriggerError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  datePickerTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  datePickerTriggerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  datePickerTriggerPlaceholder: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },
  datePickerTriggerRight: {
    marginLeft: 6,
  },
  dateSelectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  dateSelectedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.successDark,
  },
  datePickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  datePickActionText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
  },
  bottomBar: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  bottomBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  submittingRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    gap: 8,
  },
  submittingText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  successIconCircleOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successIconCircleInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successModalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  successModalSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  successDriverCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  successDriverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
  },
  successDriverName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  successVehicleInfo: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  verifiedTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.successDark,
  },
  welcomePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 18,
  },
  welcomePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  goToHomeBtn: {
    width: '100%',
    backgroundColor: Colors.success,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goToHomeBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.2,
  },
});
