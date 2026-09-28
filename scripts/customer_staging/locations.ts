import type { LocationItem } from './types';

export const POPULAR_LOCATIONS: LocationItem[] = [
  // Airport Hubs
  {
    id: 'loc_blr_t1',
    title: 'Kempegowda Int. Airport (BLR) - Terminal 1',
    address: 'KIAL Rd, Devanahalli, Bengaluru, Karnataka 560300',
    latitude: 13.1986,
    longitude: 77.7066,
    category: 'airport',
    subtext: 'Domestic & International Gates 1–12',
  },
  {
    id: 'loc_blr_t2',
    title: 'Kempegowda Int. Airport (BLR) - Terminal 2 (Garden)',
    address: 'Terminal in a Garden, BLR Airport, Devanahalli 560300',
    latitude: 13.1989,
    longitude: 77.7068,
    category: 'airport',
    subtext: 'Air India, Vistara, International Flights',
  },
  // Key City Hubs
  {
    id: 'loc_koramangala',
    title: 'Koramangala 5th Block',
    address: '80 Feet Road, Near Sony World Signal, Bengaluru 560095',
    latitude: 12.9352,
    longitude: 77.6245,
    category: 'hub',
    subtext: 'Nexus Mall, Startup Hub, Cafes',
  },
  {
    id: 'loc_indiranagar',
    title: 'Indiranagar 100ft Road',
    address: '100 Feet Rd, HAL 2nd Stage, Indiranagar, Bengaluru 560038',
    latitude: 12.9784,
    longitude: 77.6408,
    category: 'hub',
    subtext: 'Metro Station, Shopping & Dining Corridor',
  },
  {
    id: 'loc_whitefield',
    title: 'Whitefield - ITPL Main Gate',
    address: 'International Tech Park, Pattandur Agrahara, Bengaluru 560066',
    latitude: 12.9866,
    longitude: 77.7335,
    category: 'hub',
    subtext: 'Tech Park, Ascendas, Export Promotion Zone',
  },
  {
    id: 'loc_ecity',
    title: 'Electronic City Phase 1',
    address: 'Hosur Rd, Near Infosys Gate 1 & Wipro, Bengaluru 560100',
    latitude: 12.8452,
    longitude: 77.6602,
    category: 'hub',
    subtext: 'Elevated Expressway Exit, Tech Hub',
  },
  {
    id: 'loc_mgroad',
    title: 'MG Road Metro & Trinity',
    address: 'Mahatma Gandhi Rd, Ashok Nagar, Bengaluru 560001',
    latitude: 12.9738,
    longitude: 77.6192,
    category: 'hub',
    subtext: 'Central Business District & Metro Station',
  },
  {
    id: 'loc_ksr_rly',
    title: 'KSR Bengaluru City Railway Station (SBC)',
    address: 'Kempegowda, Majestic, Bengaluru, Karnataka 560023',
    latitude: 12.9781,
    longitude: 77.5696,
    category: 'railway',
    subtext: 'Platform 1 & Main Entrance, Majestic Interchange',
  },
  // Outstation Hotspots
  {
    id: 'loc_mysore',
    title: 'Mysuru Palace & City Center',
    address: 'Sayyaji Rao Rd, Agrahara, Chamrajpura, Mysuru 570001',
    latitude: 12.3051,
    longitude: 76.6551,
    category: 'outstation',
    subtext: 'Approx 145 km via Expressway • 2.5 hrs',
  },
  {
    id: 'loc_ooty',
    title: 'Ooty (Udhagamandalam) - Nilgiris',
    address: 'Charing Cross & Commercial Rd, Ooty, Tamil Nadu 643001',
    latitude: 11.4102,
    longitude: 76.6950,
    category: 'outstation',
    subtext: 'Approx 280 km • Hill Station Ghat Road',
  },
  {
    id: 'loc_coorg',
    title: 'Coorg (Madikeri Hills)',
    address: 'Madikeri Town, Kodagu District, Karnataka 571201',
    latitude: 12.4244,
    longitude: 75.7382,
    category: 'outstation',
    subtext: 'Approx 250 km • Scenic Coffee Plantation Hills',
  },
  {
    id: 'loc_pondicherry',
    title: 'Pondicherry (Puducherry) White Town',
    address: 'Goubert Ave, Promenade Beach, Puducherry 605001',
    latitude: 11.9340,
    longitude: 79.8354,
    category: 'outstation',
    subtext: 'Approx 310 km • French Quarters & Beach',
  },
];

// Calculate approximate road distance between two points (Haversine formula * road winding factor 1.25)
export function estimateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 5;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLine = R * c;
  // Road factor typically 1.25 to 1.35x of great circle
  const roadEstimate = straightLine * 1.28;
  return Math.max(8, Math.round(roadEstimate * 10) / 10);
}
