import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';

/**
 * Request location permission and sync driver's real-time GPS coordinates to Supabase
 */
export async function syncDriverLocationToSupabase(
  driverId: string
): Promise<{ success: boolean; lat?: number; lng?: number; city?: string }> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('[Location] Permission not granted for driver location tracking');
      return { success: false };
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const lat = loc.coords.latitude;
    const lng = loc.coords.longitude;
    const speed = loc.coords.speed ? Math.round(loc.coords.speed * 3.6) : 0; // m/s to km/h

    // Attempt reverse geocoding to resolve city
    let city = 'bengaluru';
    try {
      const places = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (places && places.length > 0) {
        const p = places[0];
        const detectedCity = (p.city || p.subregion || p.region || '').toLowerCase();
        if (detectedCity.includes('chennai') || detectedCity.includes('madras')) city = 'chennai';
        else if (detectedCity.includes('coimbatore')) city = 'coimbatore';
        else if (detectedCity.includes('mysur') || detectedCity.includes('mysore')) city = 'mysuru';
        else if (detectedCity.includes('hyderabad')) city = 'hyderabad';
        else if (detectedCity.includes('salem')) city = 'salem';
        else if (detectedCity.includes('madurai')) city = 'madurai';
        else if (detectedCity.includes('kochi') || detectedCity.includes('cochin')) city = 'kochi';
        else city = 'bengaluru';
      }
    } catch {
      city = 'bengaluru';
    }

    // Update in Supabase
    await supabase
      .from('drivers')
      .update({
        current_latitude: lat,
        current_longitude: lng,
        current_city: city,
        last_location_update: new Date().toISOString(),
        speed,
      })
      .eq('id', driverId);

    console.log(`[Location] Synced driver ${driverId} location: (${lat}, ${lng}) in ${city}`);
    return { success: true, lat, lng, city };
  } catch (err) {
    console.warn('[Location] Failed to sync driver location:', err);
    return { success: false };
  }
}
