import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Read environment variables with hardcoded production fallbacks for standalone APK builds
const DEFAULT_SUPABASE_URL = 'https://awwrbgwpzgtbunrvsmyu.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_MVv7fXTjS6R79oXLOHuCLA_ij0lDSRE';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project-ref') &&
    !supabaseUrl.includes('placeholder')
  );
};

// Use configured URL and Key
const safeUrl = isSupabaseConfigured() ? supabaseUrl : DEFAULT_SUPABASE_URL;
const safeKey = isSupabaseConfigured() ? supabaseAnonKey : DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
