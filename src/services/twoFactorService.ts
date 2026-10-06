/**
 * 2Factor.in SMS OTP Service
 * Documentation: https://2factor.in/v3/
 * 
 * Supports:
 * - SMS OTP delivery via 2Factor AUTOGEN API
 * - OTP Verification via 2Factor VERIFY API
 * - Dynamic fallback / demo mode if API key is not configured
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SendOtpResult {
  success: boolean;
  sessionId?: string;
  message?: string;
}

export interface VerifyOtpResult {
  success: boolean;
  message?: string;
}

let activeSessionId: string | null = null;
const SESSION_STORAGE_KEY = '@pickmi_2factor_session';

export function getTwoFactorApiKey(): string {
  return (process.env.EXPO_PUBLIC_TWOFACTOR_API_KEY || '').trim();
}

export function isTwoFactorConfigured(): boolean {
  const key = getTwoFactorApiKey();
  return Boolean(key && key.length > 5);
}

/**
 * Extracts a clean 10-digit Indian mobile number suitable for 2Factor
 */
export function formatMobileFor2Factor(mobile: string): string {
  const digits = mobile.replace(/[^0-9]/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
}

/**
 * Sends an OTP via 2Factor.in SMS Gateway
 */
export async function sendOtpVia2Factor(
  rawMobile: string,
  templateName?: string
): Promise<SendOtpResult> {
  const apiKey = getTwoFactorApiKey();
  const phone = formatMobileFor2Factor(rawMobile);

  if (phone.length !== 10) {
    return {
      success: false,
      message: 'Invalid 10-digit mobile number for OTP',
    };
  }

  // Google Play Reviewer & Test Phone Numbers
  const TEST_PHONE_NUMBERS = ['9999999999', '9876543210', '8888888888', '9999999990'];
  if (TEST_PHONE_NUMBERS.includes(phone)) {
    console.log(`[2Factor] Test account detected (${phone}). Using fixed OTP 123456.`);
    activeSessionId = `test_session_${phone}_${Date.now()}`;
    await AsyncStorage.setItem(SESSION_STORAGE_KEY, activeSessionId).catch(() => {});
    return {
      success: true,
      sessionId: activeSessionId,
      message: 'Test Account Mode: Use OTP 123456',
    };
  }

  // If 2Factor API key is not configured, fall back to simulated OTP
  if (!isTwoFactorConfigured()) {
    console.log('[2Factor] No API key configured. Using local simulated mode (Code: 123456).');
    activeSessionId = `sim_session_${Date.now()}`;
    await AsyncStorage.setItem(SESSION_STORAGE_KEY, activeSessionId).catch(() => {});
    return {
      success: true,
      sessionId: activeSessionId,
      message: 'Demo mode: Use default OTP 123456',
    };
  }

  try {
    const template = templateName || process.env.EXPO_PUBLIC_TWOFACTOR_OTP_TEMPLATE;
    const url = template
      ? `https://2factor.in/API/V1/${encodeURIComponent(apiKey)}/SMS/${encodeURIComponent(phone)}/AUTOGEN/${encodeURIComponent(template)}`
      : `https://2factor.in/API/V1/${encodeURIComponent(apiKey)}/SMS/${encodeURIComponent(phone)}/AUTOGEN`;

    console.log(`[2Factor] Sending OTP to ${phone}...`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const data = await response.json();
    console.log('[2Factor] Send OTP response:', data);

    if (data.Status === 'Success') {
      activeSessionId = data.Details;
      await AsyncStorage.setItem(SESSION_STORAGE_KEY, data.Details).catch(() => {});
      return {
        success: true,
        sessionId: data.Details,
        message: 'OTP sent successfully to your mobile number via SMS.',
      };
    } else {
      return {
        success: false,
        message: data.Details || 'Failed to send OTP via 2Factor gateway.',
      };
    }
  } catch (error: any) {
    console.error('[2Factor] Error sending OTP:', error);
    return {
      success: false,
      message: error?.message || 'Network error while contacting 2Factor OTP gateway.',
    };
  }
}

/**
 * Verifies an entered OTP against 2Factor.in
 */
export async function verifyOtpVia2Factor(
  enteredOtp: string,
  sessionId?: string
): Promise<VerifyOtpResult> {
  const apiKey = getTwoFactorApiKey();
  let currentSession = sessionId || activeSessionId;
  if (!currentSession) {
    currentSession = await AsyncStorage.getItem(SESSION_STORAGE_KEY).catch(() => null);
  }
  const trimmedOtp = enteredOtp.trim();

  // Test OTP verification bypass for Google Play Reviewers & Demo sessions
  if (
    trimmedOtp === '123456' &&
    (currentSession?.startsWith('test_session_') ||
      currentSession?.startsWith('sim_session_') ||
      !isTwoFactorConfigured())
  ) {
    console.log('[2Factor] Test OTP 123456 accepted successfully.');
    activeSessionId = null;
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY).catch(() => {});
    return {
      success: true,
      message: 'Mobile number verified successfully!',
    };
  }

  if (!isTwoFactorConfigured()) {
    return {
      success: false,
      message: '2Factor is not configured. Please add your 2Factor API key in .env',
    };
  }

  if (!currentSession) {
    return {
      success: false,
      message: 'No active OTP session found. Please request a new OTP.',
    };
  }

  try {
    const url = `https://2factor.in/API/V1/${encodeURIComponent(apiKey)}/SMS/VERIFY/${encodeURIComponent(currentSession)}/${encodeURIComponent(trimmedOtp)}`;
    console.log(`[2Factor] Verifying OTP for session ${currentSession}...`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const data = await response.json();
    console.log('[2Factor] Verify OTP response:', data);

    if (data.Status === 'Success') {
      activeSessionId = null; // Session used
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY).catch(() => {});
      return {
        success: true,
        message: 'Mobile number verified successfully!',
      };
    } else {
      let friendlyMsg = data.Details || 'Invalid OTP entered.';
      if (data.Details === 'OTP Mismatch') {
        friendlyMsg = 'Incorrect OTP. Please check the SMS and try again.';
      } else if (data.Details === 'OTP Expired') {
        friendlyMsg = 'This OTP has expired. Please tap Resend Code.';
      }
      return {
        success: false,
        message: friendlyMsg,
      };
    }
  } catch (error: any) {
    console.error('[2Factor] Error verifying OTP:', error);
    return {
      success: false,
      message: error?.message || 'Network error while verifying OTP with 2Factor.',
    };
  }
}

/**
 * Get active session ID if needed
 */
export function getActive2FactorSession(): string | null {
  return activeSessionId;
}

export function setActive2FactorSession(session: string | null): void {
  activeSessionId = session;
}
