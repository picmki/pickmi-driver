/**
 * Utility to format trip titles with City and Destination names
 * (e.g., "Bangalore to Airport", "Bangalore to Mysuru")
 * while preserving the full detailed pickup and drop locations.
 */

// Known iconic locations / cities
const CITY_PATTERNS: Array<{ city: string; regex: RegExp }> = [
  // 1. Airport (Higher priority so "Bangalore Airport" resolves to "Airport")
  {
    city: 'Airport',
    regex: /(airport|kempegowda|kia|blr\s*airport|terminal\s*[12]|aerodrome|bial)/i,
  },
  // 2. Bangalore / Bengaluru & Key Areas
  {
    city: 'Bangalore',
    regex: /(bangalore|bengaluru|koramangala|indiranagar|whitefield|hsr|jayanagar|marathahalli|electronic\s*city|bellandur|sarjapur|jp\s*nagar|banashankari|malleswaram|rajajinagar|btm|domlur|majestic|silk\s*board|kr\s*puram|yeshwanthpur|ulsoor|shivajinagar|frazer\s*town|kalyan\s*nagar|kammanahalli|cv\s*raman|bannerghatta|kengeri|rr\s*nagar|yelahanka|hebbal|nagavara|peenya|basavanagudi|richmond|mg\s*road|brigade\s*road|lavelle|cunningham|cubbon|itpl|ecity|hebbal)/i,
  },
  // 3. Mysuru / Mysore
  {
    city: 'Mysuru',
    regex: /(mysuru|mysore|nanjangud|srirangapatna|chamundi)/i,
  },
  // 4. Coorg / Madikeri
  {
    city: 'Coorg',
    regex: /(coorg|madikeri|kushalnagar|virajpet|somwarpet)/i,
  },
  // 5. Ooty
  {
    city: 'Ooty',
    regex: /(ooty|udhagamandalam|coonoor|kotagiri)/i,
  },
  // 6. Chikmagalur
  {
    city: 'Chikmagalur',
    regex: /(chikmagalur|chikkamagaluru|mullayanagiri|kudremukh)/i,
  },
  // 7. Coimbatore
  {
    city: 'Coimbatore',
    regex: /(coimbatore|kovai)/i,
  },
  // 8. Chennai
  {
    city: 'Chennai',
    regex: /(chennai|madras|tambaram|guindy|t\s*nagar|velachery)/i,
  },
  // 9. Hyderabad
  {
    city: 'Hyderabad',
    regex: /(hyderabad|secunderabad|cyberabad|hitec\s*city|gachibowli)/i,
  },
  // 10. Hosur
  {
    city: 'Hosur',
    regex: /(hosur)/i,
  },
  // 11. Nandi Hills
  {
    city: 'Nandi Hills',
    regex: /(nandi\s*hills|nandi)/i,
  },
  // 12. Tirupati
  {
    city: 'Tirupati',
    regex: /(tirupati|tirumala)/i,
  },
  // 13. Mangalore
  {
    city: 'Mangalore',
    regex: /(mangalore|mangaluru|udupi|manipal)/i,
  },
  // 14. Pondicherry
  {
    city: 'Pondicherry',
    regex: /(pondicherry|puducherry|auroville)/i,
  },
  // 15. Wayanad
  {
    city: 'Wayanad',
    regex: /(wayanad|kalpetta|sulthan\s*bathery)/i,
  },
  // 16. Hassan
  {
    city: 'Hassan',
    regex: /(hassan|belur|halebeedu)/i,
  },
  // 17. Mumbai
  {
    city: 'Mumbai',
    regex: /(mumbai|bombay|navi\s*mumbai|thane)/i,
  },
  // 18. Pune
  {
    city: 'Pune',
    regex: /(pune|pcmc|hinjewadi)/i,
  },
  // 19. Goa
  {
    city: 'Goa',
    regex: /(goa|panaji|calangute|candolim|margao)/i,
  },
  // 20. Kochi
  {
    city: 'Kochi',
    regex: /(kochi|cochin|ernakulam)/i,
  },
];

/**
 * Extracts a clean city or destination name from an address
 */
export function getCityNameFromLocation(location: string = ''): string {
  if (!location || typeof location !== 'string') return 'Bangalore';

  for (const { city, regex } of CITY_PATTERNS) {
    if (regex.test(location)) {
      return city;
    }
  }

  // Fallback: look at comma separated parts
  const parts = location.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const candidate = parts[parts.length - 2] || parts[parts.length - 1];
    // Strip pincodes or state keywords
    const cleaned = candidate.replace(/\b\d{6}\b/g, '').replace(/Karnataka|Tamil Nadu|Kerala/gi, '').trim();
    if (cleaned.length > 2) return cleaned;
  }

  return parts[0] || 'Bangalore';
}

/**
 * Extracts short area name for intra-city trips
 */
export function getAreaName(location: string = ''): string {
  if (!location) return '';
  const first = location.split(',')[0].trim();
  // Strip block/sector/cross noise if desirable
  return first;
}

/**
 * Generates the clean city-based route title for Trip Cards
 * Example: "Bangalore to Airport", "Bangalore to Mysuru", "Koramangala to Whitefield"
 */
export function getTripRouteTitle(pickupLocation: string = '', dropLocation: string = ''): string {
  const pickupCity = getCityNameFromLocation(pickupLocation);
  const dropCity = getCityNameFromLocation(dropLocation);

  // If different cities (e.g. Bangalore to Airport, Bangalore to Mysuru)
  if (pickupCity.toLowerCase() !== dropCity.toLowerCase()) {
    return `${pickupCity} to ${dropCity}`;
  }

  // If same city (e.g., intra-Bangalore ride from Koramangala to Whitefield)
  const pickupArea = getAreaName(pickupLocation);
  const dropArea = getAreaName(dropLocation);

  if (pickupArea && dropArea && pickupArea.toLowerCase() !== dropArea.toLowerCase()) {
    return `${pickupArea} to ${dropArea}`;
  }

  return `${pickupCity} City Ride`;
}
