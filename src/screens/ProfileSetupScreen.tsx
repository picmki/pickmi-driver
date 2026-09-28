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
import { Colors, Shadows } from '../theme/colors';
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

const VEHICLE_TYPES: VehicleType[] = ['Sedan', 'SUV', 'Hatchback', 'Prime Sedan', 'EV'];

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

  // ─── Step 0: Profile Info (Empty by default) ───────────────────────────────
  const [name, setName] = useState(driver.name || '');
  const [driverMobile, setDriverMobile] = useState(pendingMobile || driver.mobile || '');
  const [gender, setGender] = useState<Gender>('Male');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [nameError, setNameError] = useState('');
  const [genderError, setGenderError] = useState('');

  // ─── Step 1: Driver License Details (Front & Back - Empty by default) ──────
  const [dlNumber, setDlNumber] = useState('');
  const [dlValidUntil, setDlValidUntil] = useState('');
  const [dlFrontPhotoUri, setDlFrontPhotoUri] = useState<string | null>(null);
  const [dlBackPhotoUri, setDlBackPhotoUri] = useState<string | null>(null);
  const [dlError, setDlError] = useState('');
  const [dlValidError, setDlValidError] = useState('');

  // ─── Step 2: Vehicle & Documents (Empty by default) ────────────────────────
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

  // ─── Interactive Date Picker Modal State ─────────────────────────────────
  const [datePickerTarget, setDatePickerTarget] = useState<
    'DL' | 'RC_FC' | 'INSURANCE' | 'PERMIT' | null
  >(null);

  // ─── Account Created Success Popup Modal State ───────────────────────────
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Image Picker Handler ─────────────────────────────────────────────────
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
            quality: 0.85,
          });
          if (!result.canceled && result.assets[0]) {
            onSuccess(result.assets[0].uri);
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
            quality: 0.85,
          });
          if (!result.canceled && result.assets[0]) {
            onSuccess(result.assets[0].uri);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };



  // ─── Stage Transitions (All Mandatory) ───────────────────────────────────
  const handleProfileNext = () => {
    let valid = true;
    if (!name.trim()) {
      setNameError('Please enter your full name');
      valid = false;
    } else {
      setNameError('');
    }

    if (!gender) {
      setGenderError('Please select gender');
      valid = false;
    } else {
      setGenderError('');
    }

    if (!photoUri) {
      Alert.alert(
        'Profile Photo Required',
        'Please upload or take a clear profile photo before proceeding.'
      );
      return;
    }

    if (!valid) return;
    setCurrentStep('DRIVER_DOCS');
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
      setDlValidError('Please enter license expiry date');
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
      setVehicleNumberError('Please enter vehicle registration number (number plate)');
      valid = false;
    } else {
      setVehicleNumberError('');
    }

    if (!vehiclePhotoUri) {
      Alert.alert('Vehicle Photo Required', 'Please upload a photo of your vehicle.');
      return;
    }

    if (!rcPhotoUri) {
      Alert.alert('RC Document Required', 'Please upload your vehicle Registration Certificate (RC).');
      return;
    }

    if (!fcValidUntil.trim()) {
      setFcValidError('Please select RC / FC validity date');
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

    const updatedDriver: Driver = {
      ...driver,
      id: targetDriverId,
      name: name.trim(),
      profile_image: photoUri || SAMPLE_AVATAR,
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
      vehicle_image: vehiclePhotoUri || SAMPLE_VEHICLE,
      created_at: new Date().toISOString(),
    };

    // 1. Save Driver Info
    updateProfile(updatedDriver);

    // 2. Save Vehicle Info
    updateVehicle(updatedVehicle);

    // 3. Save Driver Documents (Including DL Front & Back)
    const newDocs: DriverDocument[] = [
      {
        id: `doc_dl_front_${Date.now()}`,
        driver_id: targetDriverId,
        document_type: 'Driving Licence (Front)',
        document_url: dlFrontPhotoUri || SAMPLE_DL_FRONT,
        document_number: dlNumber.trim().toUpperCase(),
        valid_until: dlValidUntil.trim() || '15 Jun 2035',
        verification_status: 'Pending',
        created_at: new Date().toISOString(),
      },
      {
        id: `doc_dl_back_${Date.now()}`,
        driver_id: targetDriverId,
        document_type: 'Driving Licence (Back)',
        document_url: dlBackPhotoUri || SAMPLE_DL_BACK,
        document_number: dlNumber.trim().toUpperCase(),
        valid_until: dlValidUntil.trim() || '15 Jun 2035',
        verification_status: 'Pending',
        created_at: new Date().toISOString(),
      },
      {
        id: `doc_rc_${Date.now()}`,
        driver_id: targetDriverId,
        document_type: 'RC',
        document_url: rcPhotoUri || SAMPLE_RC,
        document_number: `${vehicleNumber.trim().toUpperCase().replace(/\s+/g, '')}-REG`,
        valid_until: fcValidUntil.trim() || '18 Nov 2038',
        verification_status: 'Pending',
        created_at: new Date().toISOString(),
      },
      {
        id: `doc_ins_${Date.now()}`,
        driver_id: targetDriverId,
        document_type: 'Insurance',
        document_url: insurancePhotoUri || SAMPLE_INSURANCE,
        document_number: 'BAJAJ-ALLIANZ-7821',
        valid_until: insuranceValidUntil.trim() || '24 Oct 2027',
        verification_status: 'Pending',
        created_at: new Date().toISOString(),
      },
      {
        id: `doc_pmt_${Date.now()}`,
        driver_id: targetDriverId,
        document_type: 'Permit',
        document_url: permitPhotoUri || SAMPLE_PERMIT,
        document_number: 'KA-COMM-CAB-9102',
        valid_until: permitValidUntil.trim() || '31 Dec 2026',
        verification_status: 'Pending',
        created_at: new Date().toISOString(),
      },
    ];
    updateDocuments(newDocs);

    // Push everything directly to Supabase now
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

  // ─── Render Document Upload Card Helper ───────────────────────────────────
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
      <View style={[styles.docUploadCard, Shadows.sm]}>
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
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredBadgeText}>Mandatory</Text>
            </View>
          )}
        </View>

        {photoUrl ? (
          <View style={styles.docPreviewContainer}>
            <Image source={{ uri: photoUrl }} style={styles.docImagePreview} resizeMode="cover" />
            <View style={styles.docPreviewOverlay}>
              <TouchableOpacity style={styles.docActionBtn} onPress={onUpload}>
                <Ionicons name="camera-reverse" size={14} color={Colors.textPrimary} />
                <Text style={styles.docActionBtnText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.docActionBtn, styles.docRemoveBtn]} onPress={onRemove}>
                <Ionicons name="trash-outline" size={14} color={Colors.danger} />
                <Text style={[styles.docActionBtnText, { color: Colors.danger }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadPlaceholder} onPress={onUpload} activeOpacity={0.8}>
            <View style={styles.uploadIconCircle}>
              <Ionicons name="cloud-upload-outline" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.uploadPlaceholderText}>Tap to upload or take photo</Text>
            <Text style={styles.uploadPlaceholderSub}>Camera or Gallery • JPG, PNG</Text>
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
                  {datePicker.value || 'Tap to select expiry date'}
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
          <Text style={styles.stepperTitle}>Driver Onboarding</Text>
          <View style={styles.stepPillHeader}>
            <Text style={styles.stepperStepText}>
              {currentStep === 'PROFILE' && 'Basic Profile'}
              {currentStep === 'DRIVER_DOCS' && 'Step 1: Driver License'}
              {currentStep === 'VEHICLE_DOCS' && 'Step 2: Vehicle & Docs'}
            </Text>
          </View>
        </View>

        {/* 3-segment progress indicator */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressBar,
              {
                width:
                  currentStep === 'PROFILE'
                    ? '33%'
                    : currentStep === 'DRIVER_DOCS'
                    ? '66%'
                    : '100%',
              },
            ]}
          />
        </View>

      </View>

      {/* ── Main Scrollable Content with Fresh Key on Each Step for Guaranteed Scrolling ── */}
      <KeyboardAvoidingView
        style={styles.contentWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          key={currentStep}
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          bounces={true}
          alwaysBounceVertical={true}
        >
          {/* ================================================================ */}
          {/* STAGE 0: PROFILE SETUP                                           */}
          {/* ================================================================ */}
          {currentStep === 'PROFILE' && (
            <View style={styles.stepInner}>
              <View style={styles.header}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>Welcome to PickMi Driver</Text>
                </View>
                <Text style={styles.title}>Create Your Profile</Text>
                <Text style={styles.subtitle}>
                  Passengers and dispatch will identify you by your name and verified photo.
                </Text>
              </View>

              {/* Profile Photo Upload */}
              <View style={[styles.card, Shadows.sm]}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardLabel}>PROFILE PHOTO</Text>
                  <Text style={styles.mandatoryPill}>Mandatory</Text>
                </View>

                <View style={styles.photoSection}>
                  <View style={styles.avatarWrap}>
                    {photoUri ? (
                      <Image source={{ uri: photoUri }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarEmpty}>
                        <Ionicons name="person" size={34} color={Colors.textMuted} />
                      </View>
                    )}
                    {photoUri && (
                      <View style={styles.avatarCheckBadge}>
                        <Ionicons name="checkmark" size={13} color={Colors.white} />
                      </View>
                    )}
                  </View>

                  <View style={styles.uploadActions}>
                    <TouchableOpacity
                      style={styles.uploadBtn}
                      onPress={() =>
                        pickImage('Profile Photo', (uri) => setPhotoUri(uri), [1, 1])
                      }
                      activeOpacity={0.8}
                    >
                      <Ionicons name="camera-outline" size={18} color={Colors.primary} />
                      <Text style={styles.uploadBtnText}>
                        {photoUri ? 'Change Photo' : 'Take / Upload Selfie'}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.uploadHint}>
                      Clear front-facing photo required.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Full Name */}
              <View style={[styles.card, Shadows.sm]}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardLabel}>YOUR FULL LEGAL NAME</Text>
                  <Text style={styles.mandatoryPill}>Mandatory</Text>
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
                    size={20}
                    color={
                      nameError ? Colors.danger : name.length > 0 ? Colors.primary : Colors.textMuted
                    }
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name as per DL"
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
              <View style={[styles.card, Shadows.sm]}>
                <Text style={styles.cardLabel}>GENDER</Text>
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
                        size={18}
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
              <View style={[styles.card, Shadows.sm]}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardLabel}>REGISTERED MOBILE NUMBER</Text>
                  <Text style={styles.mandatoryPill}>Mandatory</Text>
                </View>
                <View style={[styles.inputWrapper, styles.inputWrapperFilled]}>
                  <Ionicons name="call-outline" size={20} color={Colors.primary} />
                  <TextInput
                    style={styles.input}
                    placeholder="+91 98765 43210"
                    placeholderTextColor={Colors.textPlaceholder}
                    value={driverMobile}
                    onChangeText={setDriverMobile}
                    keyboardType="phone-pad"
                    maxLength={18}
                  />
                  <View style={styles.verifiedPill}>
                    <Ionicons name="shield-checkmark" size={13} color={Colors.successDark} />
                    <Text style={styles.verifiedPillText}>Verified</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ================================================================ */}
          {/* STEP 1: DRIVER DETAILS & DRIVING LICENSE (FRONT & BACK)          */}
          {/* ================================================================ */}
          {currentStep === 'DRIVER_DOCS' && (
            <View style={styles.stepInner}>
              <View style={styles.header}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>Step 1 of 2: Driver Documents</Text>
                </View>
                <Text style={styles.title}>Driving License Details</Text>
                <Text style={styles.subtitle}>
                  Enter your DL number and upload both Front and Back photos. All fields are mandatory.
                </Text>
              </View>

              {/* Verified Driver Info Pill */}
              <View style={[styles.mobilePill, Shadows.sm, { marginBottom: 14 }]}>
                <View style={styles.mobilePillLeft}>
                  <Ionicons name="person-circle-outline" size={20} color={Colors.primary} />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textPrimary }}>
                      {name || 'Registered Driver'}
                    </Text>
                    <Text style={{ fontSize: 11, color: Colors.textMuted }}>{pendingMobile}</Text>
                  </View>
                </View>
                <View style={styles.verifiedPill}>
                  <Ionicons name="shield-checkmark" size={13} color={Colors.successDark} />
                  <Text style={styles.verifiedPillText}>Identity Set</Text>
                </View>
              </View>

              {/* DL Number Input */}
              <View style={[styles.card, Shadows.sm]}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardLabel}>DRIVING LICENSE NUMBER</Text>
                  <Text style={styles.mandatoryPill}>Mandatory</Text>
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
                    size={20}
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

              {/* DL Validity (Date Picker Trigger) */}
              <View style={[styles.card, Shadows.sm]}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardLabel}>LICENSE EXPIRY / VALID UNTIL</Text>
                  <Text style={styles.mandatoryPill}>Mandatory</Text>
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
                      size={20}
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

              {/* 1. DL Front Side Photo Upload Card (Starts Empty) */}
              {renderDocCard(
                'Driving License (Front Side)',
                'Photo showing driver name, DL number & portrait',
                dlFrontPhotoUri,
                () => pickImage('DL Front Side', (uri) => setDlFrontPhotoUri(uri)),
                () => setDlFrontPhotoUri(null),
                'card-outline'
              )}

              {/* 2. DL Back Side Photo Upload Card (Starts Empty) */}
              {renderDocCard(
                'Driving License (Back Side)',
                'Photo showing vehicle category, badge & address',
                dlBackPhotoUri,
                () => pickImage('DL Back Side', (uri) => setDlBackPhotoUri(uri)),
                () => setDlBackPhotoUri(null),
                'card-outline'
              )}
            </View>
          )}

          {/* ================================================================ */}
          {/* STEP 2: VEHICLE DETAILS & VEHICLE DOCUMENTS                      */}
          {/* ================================================================ */}
          {currentStep === 'VEHICLE_DOCS' && (
            <View style={styles.stepInner}>
              <View style={styles.header}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>Step 2 of 2: Vehicle & Documents</Text>
                </View>
                <Text style={styles.title}>Vehicle Details & Documents</Text>
                <Text style={styles.subtitle}>
                  All fields and document uploads below are mandatory to complete registration.
                </Text>
              </View>

              {/* Vehicle Type Selection */}
              <View style={[styles.card, Shadows.sm]}>
                <Text style={styles.cardLabel}>SELECT VEHICLE CATEGORY</Text>
                <View style={styles.vehicleTypeRow}>
                  {VEHICLE_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.vehicleTypeChip,
                        vehicleType === type && styles.vehicleTypeChipActive,
                      ]}
                      onPress={() => setVehicleType(type)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="car-sport"
                        size={16}
                        color={vehicleType === type ? Colors.white : Colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.vehicleTypeLabel,
                          vehicleType === type && styles.vehicleTypeLabelActive,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Vehicle Model & Registration Number */}
              <View style={[styles.card, Shadows.sm]}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardLabel}>VEHICLE MODEL & MAKE</Text>
                  <Text style={styles.mandatoryPill}>Mandatory</Text>
                </View>
                <View
                  style={[
                    styles.inputWrapper,
                    vehicleModelError ? styles.inputWrapperError : null,
                  ]}
                >
                  <Ionicons name="car-outline" size={20} color={Colors.primary} />
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
                  <Text style={styles.cardLabel}>VEHICLE NUMBER (NUMBER PLATE)</Text>
                  <Text style={styles.mandatoryPill}>Mandatory</Text>
                </View>
                <View
                  style={[
                    styles.inputWrapper,
                    vehicleNumberError ? styles.inputWrapperError : null,
                  ]}
                >
                  <Ionicons name="browsers-outline" size={20} color={Colors.primary} />
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

              {/* 1. Vehicle Front/Exterior Photo (Mandatory) */}
              {renderDocCard(
                'Vehicle Photo (Exterior)',
                'Front angle photo showing number plate clearly',
                vehiclePhotoUri,
                () => pickImage('Vehicle Photo', (uri) => setVehiclePhotoUri(uri)),
                () => setVehiclePhotoUri(null),
                'car-outline'
              )}

              {/* 2. Vehicle RC Photo & Fitness Certificate (FC) Validity (Mandatory) */}
              {renderDocCard(
                'RC (Registration Certificate)',
                'Clear photo of original RC smart card or book',
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

              {/* 3. Vehicle Insurance Photo & Policy Expiry (Mandatory) */}
              {renderDocCard(
                'Vehicle Insurance',
                'Valid commercial or comprehensive insurance policy',
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

              {/* 4. Commercial / State Permit Photo & Expiry (Mandatory) */}
              {renderDocCard(
                'Vehicle Permit',
                'Commercial passenger carriage or tourist permit',
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

      {/* ── Fixed Bottom Call-To-Action (CTA) Bar with Background & Elevation ── */}
      <View style={[styles.bottomBar, Shadows.bottomSheet]}>
        {currentStep === 'PROFILE' && (
          <PickMiButton
            title="Next: Driver License (Step 1) →"
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
              title="Next: Vehicle (Step 2) →"
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
                <ActivityIndicator color={Colors.primary} />
                <Text style={styles.submittingText}>Registering Driver…</Text>
              </View>
            ) : (
              <PickMiButton
                title="Complete Setup & Enter App →"
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
          <View style={[styles.successModalCard, Shadows.lg]}>
            {/* Animated Celebration Icon */}
            <View style={styles.successIconCircleOuter}>
              <View style={styles.successIconCircleInner}>
                <Ionicons name="checkmark-sharp" size={40} color={Colors.white} />
              </View>
            </View>

            {/* Title & Subtitle */}
            <Text style={styles.successModalTitle}>Account Created Successfully!</Text>
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
                  <Text style={styles.verifiedTagText}>All 5 Documents Submitted</Text>
                </View>
              </View>
            </View>

            {/* Welcome message pill */}
            <View style={styles.welcomePill}>
              <Ionicons name="sparkles" size={14} color="#D97706" />
              <Text style={styles.welcomePillText}>Welcome to PickMi Driver Partner</Text>
            </View>

            {/* Action CTA Button to land on Home */}
            <TouchableOpacity
              style={styles.goToHomeBtn}
              onPress={handleProceedToHome}
              activeOpacity={0.85}
            >
              <Text style={styles.goToHomeBtnText}>Go to Home Page →</Text>
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
    backgroundColor: Colors.background,
  },
  contentWrap: {
    flex: 1,
  },
  topStepper: {
    backgroundColor: Colors.white,
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    zIndex: 10,
  },
  stepperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepperTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  stepPillHeader: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  stepperStepText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },

  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  stepInner: {
    flex: 1,
  },
  header: {
    marginBottom: 16,
    marginTop: 4,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
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
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  mandatoryPill: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  photoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.borderLight,
  },
  avatarEmpty: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
  },
  avatarCheckBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.success,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  uploadActions: {
    flex: 1,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 6,
    marginBottom: 6,
  },
  uploadBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  uploadHint: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 15,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
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
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginLeft: 10,
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
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
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
    color: Colors.textSecondary,
  },
  genderLabelActive: {
    color: Colors.white,
  },
  mobilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  mobilePillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobilePillText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginLeft: 10,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  verifiedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.successDark,
  },
  vehicleTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vehicleTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 6,
  },
  vehicleTypeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  vehicleTypeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  vehicleTypeLabelActive: {
    color: Colors.white,
  },
  docUploadCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  docIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  docSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  uploadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  uploadedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.successDark,
  },
  requiredBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  requiredBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  docPreviewContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    position: 'relative',
    height: 140,
    backgroundColor: '#000',
  },
  docImagePreview: {
    width: '100%',
    height: '100%',
    opacity: 0.95,
  },
  docPreviewOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
  },
  docActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  docRemoveBtn: {
    backgroundColor: 'rgba(255, 235, 235, 0.94)',
  },
  docActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  uploadPlaceholder: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#93C5FD',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  uploadPlaceholderText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  uploadPlaceholderSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  bottomBar: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  bottomBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 6,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  submittingRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    gap: 8,
  },
  submittingText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  cardDatePickerSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cardDatePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardDatePickerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardDatePickerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mandatoryPillSm: {
    fontSize: 9,
    fontWeight: '700',
    color: '#DC2626',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  datePickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
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
    gap: 10,
    flex: 1,
  },
  datePickerTriggerText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  datePickerTriggerPlaceholder: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPlaceholder,
  },
  datePickerTriggerRight: {
    marginLeft: 8,
  },
  dateSelectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  dateSelectedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.successDark,
  },
  datePickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  datePickActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  successIconCircleOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successIconCircleInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  successModalSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
    paddingHorizontal: 10,
  },
  successDriverCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  successDriverAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.borderLight,
  },
  successDriverName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  successVehicleInfo: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  verifiedTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  verifiedTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.successDark,
  },
  welcomePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 20,
  },
  welcomePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  goToHomeBtn: {
    width: '100%',
    backgroundColor: Colors.success,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goToHomeBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.2,
  },
});
