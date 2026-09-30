/**
 * Twilio SMS & Verify OTP Service for PickMi Driver App
 * Real SMS OTP verification only (No demo/mock bypass)
 */

export interface SendOtpResult {
  success: boolean;
  message?: string;
  service?: 'twilio_verify' | 'twilio_sms';
}

export interface VerifyOtpResult {
  success: boolean;
  message?: string;
}

// In-memory state for active OTP sessions (only for programmable SMS fallback)
let activeMobile: string | null = null;
let localGeneratedOtp: string | null = null;
let localOtpExpiresAt: number | null = null;

// Pure JS Base64 helper compatible with all React Native / Expo engines
function toBase64(str: string): string {
  try {
    if (typeof btoa === 'function') {
      return btoa(str);
    }
  } catch {}

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  for (
    let block = 0, charCode, idx = 0, map = chars;
    str.charAt(idx | 0) || ((map = '='), idx % 1);
    output += map.charAt(63 & (block >> (8 - (idx % 1) * 8)))
  ) {
    charCode = str.charCodeAt((idx += 3 / 4));
    if (charCode > 0xff) {
      throw new Error('Character out of range for base64');
    }
    block = (block << 8) | charCode;
  }
  return output;
}

export function getTwilioConfig() {
  const accountSid = (process.env.EXPO_PUBLIC_TWILIO_ACCOUNT_SID || '').trim();
  const authToken = (process.env.EXPO_PUBLIC_TWILIO_AUTH_TOKEN || '').trim();
  const verifyServiceSid = (process.env.EXPO_PUBLIC_TWILIO_VERIFY_SERVICE_SID || '').trim();
  const fromPhoneNumber = (process.env.EXPO_PUBLIC_TWILIO_PHONE_NUMBER || '').trim();

  return {
    accountSid,
    authToken,
    verifyServiceSid,
    fromPhoneNumber,
    isVerifyReady: Boolean(accountSid && authToken && verifyServiceSid),
    isSmsReady: Boolean(accountSid && authToken && fromPhoneNumber),
  };
}

export function isTwilioConfigured(): boolean {
  const config = getTwilioConfig();
  return config.isVerifyReady || config.isSmsReady;
}

/**
 * Formats any phone number into E.164 international standard (+91XXXXXXXXXX)
 */
export function formatPhoneToE164(rawPhone: string): string {
  const cleaned = rawPhone.replace(/\s+/g, '').trim();
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  const digits = rawPhone.replace(/[^0-9]/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  return `+${digits}`;
}

/**
 * Sends a real OTP via Twilio Verify or Twilio Programmable SMS
 */
export async function sendOtpViaTwilio(rawMobile: string): Promise<SendOtpResult> {
  const formattedPhone = formatPhoneToE164(rawMobile);
  activeMobile = formattedPhone;

  // Validate phone format (at least 10 digits)
  const pureDigits = formattedPhone.replace(/[^0-9]/g, '');
  if (pureDigits.length < 10) {
    return {
      success: false,
      message: 'Please enter a valid 10-digit mobile number.',
    };
  }

  const config = getTwilioConfig();

  // If Twilio credentials are not configured, reject explicitly — no demo bypass
  if (!config.isVerifyReady && !config.isSmsReady) {
    return {
      success: false,
      message: 'Twilio credentials not configured in .env file (Account SID & Auth Token required).',
    };
  }

  // 1. Preferred: Twilio Verify API (Recommended)
  if (config.isVerifyReady) {
    try {
      console.log(`[Twilio Verify] Sending real OTP to ${formattedPhone}...`);
      const url = `https://verify.twilio.com/v2/Services/${encodeURIComponent(config.verifyServiceSid)}/Verifications`;
      const authHeader = 'Basic ' + toBase64(`${config.accountSid}:${config.authToken}`);

      const params = new URLSearchParams();
      params.append('To', formattedPhone);
      params.append('Channel', 'sms');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: params.toString(),
      });

      const data = await response.json();
      console.log('[Twilio Verify] Response:', data);

      if (response.ok && (data.status === 'pending' || data.status === 'approved')) {
        return {
          success: true,
          service: 'twilio_verify',
          message: 'Real OTP sent to your phone via SMS.',
        };
      } else {
        return {
          success: false,
          message: data.message || `Twilio error: ${data.status || 'Failed to send SMS'}`,
        };
      }
    } catch (err: any) {
      console.error('[Twilio Verify] Exception:', err);
      return {
        success: false,
        message: err?.message || 'Network error while contacting Twilio service.',
      };
    }
  }

  // 2. Secondary: Twilio Programmable SMS API
  if (config.isSmsReady) {
    try {
      // Generate secure 6-digit random code
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      localGeneratedOtp = randomCode;
      localOtpExpiresAt = Date.now() + 5 * 60 * 1000; // 5 min expiry

      console.log(`[Twilio SMS] Sending SMS from ${config.fromPhoneNumber} to ${formattedPhone}...`);
      const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(config.accountSid)}/Messages.json`;
      const authHeader = 'Basic ' + toBase64(`${config.accountSid}:${config.authToken}`);

      const bodyText = `Your PickMi Driver verification code is: ${randomCode}. Valid for 5 minutes.`;

      const params = new URLSearchParams();
      params.append('To', formattedPhone);
      params.append('From', config.fromPhoneNumber);
      params.append('Body', bodyText);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: params.toString(),
      });

      const data = await response.json();
      console.log('[Twilio SMS] Response:', data);

      if (response.ok && (data.status === 'queued' || data.status === 'sent')) {
        return {
          success: true,
          service: 'twilio_sms',
          message: 'Real OTP sent to your phone via SMS.',
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to send SMS via Twilio.',
        };
      }
    } catch (err: any) {
      console.error('[Twilio SMS] Exception:', err);
      return {
        success: false,
        message: err?.message || 'Network error while contacting Twilio SMS service.',
      };
    }
  }

  return {
    success: false,
    message: 'Twilio configuration is incomplete in .env.',
  };
}

/**
 * Verifies entered OTP strictly against Twilio (No demo 123456 bypass)
 */
export async function verifyOtpViaTwilio(
  enteredOtp: string,
  rawMobile?: string
): Promise<VerifyOtpResult> {
  const code = enteredOtp.trim();
  const phone = rawMobile ? formatPhoneToE164(rawMobile) : activeMobile;

  const config = getTwilioConfig();

  // If Twilio not configured, fail immediately
  if (!config.isVerifyReady && !config.isSmsReady) {
    return {
      success: false,
      message: 'Twilio is not configured. Please add your Twilio credentials in .env.',
    };
  }

  // 1. Verify via Twilio Verify API
  if (config.isVerifyReady) {
    if (!phone) {
      return {
        success: false,
        message: 'No phone number available. Please request OTP again.',
      };
    }

    try {
      console.log(`[Twilio Verify] Checking code for ${phone}...`);
      const url = `https://verify.twilio.com/v2/Services/${encodeURIComponent(config.verifyServiceSid)}/VerificationCheck`;
      const authHeader = 'Basic ' + toBase64(`${config.accountSid}:${config.authToken}`);

      const params = new URLSearchParams();
      params.append('To', phone);
      params.append('Code', code);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: params.toString(),
      });

      const data = await response.json();
      console.log('[Twilio Verify] VerificationCheck Response:', data);

      if (response.ok && data.status === 'approved' && data.valid === true) {
        return {
          success: true,
          message: 'Mobile number verified successfully!',
        };
      } else {
        return {
          success: false,
          message: data.message || 'Incorrect OTP. Please check the SMS and try again.',
        };
      }
    } catch (err: any) {
      console.error('[Twilio Verify] Check exception:', err);
      return {
        success: false,
        message: err?.message || 'Failed to verify OTP with Twilio.',
      };
    }
  }

  // 2. Verify via Local Generated SMS OTP
  if (config.isSmsReady) {
    if (!localGeneratedOtp) {
      return {
        success: false,
        message: 'No active OTP found. Please request a new OTP.',
      };
    }
    if (localOtpExpiresAt && Date.now() > localOtpExpiresAt) {
      return {
        success: false,
        message: 'OTP has expired. Please tap Resend OTP.',
      };
    }
    if (code === localGeneratedOtp) {
      localGeneratedOtp = null; // Clear once used
      return {
        success: true,
        message: 'Mobile number verified successfully!',
      };
    } else {
      return {
        success: false,
        message: 'Incorrect OTP. Please enter the code sent to your mobile.',
      };
    }
  }

  return {
    success: false,
    message: 'Twilio verification service unavailable.',
  };
}
