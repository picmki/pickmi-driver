import type { VehicleOption, VehicleType } from './types';

export const VEHICLE_OPTIONS: VehicleOption[] = [
  {
    id: 'sedan',
    name: 'Premier Sedan',
    type: 'Sedan',
    models: 'Maruti Dzire, Toyota Etios, Hyundai Aura',
    seating: '4 Seats',
    luggage: '2 Large Bags',
    ratePerKm: 14,
    baseFare: 649,
    allowedKm: 40,
    isPopular: true,
    tag: 'MOST POPULAR',
    amenities: ['100% Chilled AC', 'Extra Legroom', 'Guaranteed On-Time', 'FASTag'],
    description: 'Clean, reliable sedan ideal for business travel, airport runs, and city transfers.',
    iconName: 'car-sport',
  },
  {
    id: 'prime-sedan',
    name: 'Prime Sedan',
    type: 'Prime Sedan',
    models: 'Honda City, Hyundai Verna, Maruti Ciaz',
    seating: '4 Seats',
    luggage: '3 Large Bags',
    ratePerKm: 16,
    baseFare: 849,
    allowedKm: 45,
    tag: 'EXECUTIVE CLASS',
    amenities: ['Leatherette Seats', 'Whisper Quiet Cabin', 'Top 5★ Chauffeurs', 'Bottled Water'],
    description: 'Premium sedans with top-rated veteran chauffeurs for distinguished comfort.',
    iconName: 'car',
  },
  {
    id: 'suv',
    name: 'PickMi XL (SUV)',
    type: 'SUV',
    models: 'Toyota Innova Crysta, Maruti Ertiga, Kia Carens',
    seating: '6–7 Seats',
    luggage: '4 Large Bags',
    ratePerKm: 19,
    baseFare: 1199,
    allowedKm: 50,
    tag: 'FAMILY & GROUP',
    amenities: ['Dual AC Blowers', 'Huge Luggage Boot', 'Hill Station Certified', 'USB Chargers'],
    description: 'Generous multi-seater for family getaways, airport luggage runs, and outstation tours.',
    iconName: 'bus',
  },
  {
    id: 'ev',
    name: 'PickMi Green (EV)',
    type: 'EV',
    models: 'Tata Nexon EV, Tigor EV, MG ZS EV',
    seating: '4 Seats',
    luggage: '2 Medium Bags',
    ratePerKm: 14,
    baseFare: 699,
    allowedKm: 40,
    isEco: true,
    tag: 'ZERO EMISSION',
    amenities: ['Zero Engine Noise', 'Carbon Neutral Ride', 'Modern Tech Cockpit', 'Fast Airflow AC'],
    description: 'Eco-conscious ride with whisper-quiet electric drive and high torque comfort.',
    iconName: 'flash',
  },
  {
    id: 'hatchback',
    name: 'PickMi Mini',
    type: 'Hatchback',
    models: 'Maruti WagonR, Swift, Tata Tiago',
    seating: '4 Seats',
    luggage: '1 Medium Bag',
    ratePerKm: 12,
    baseFare: 449,
    allowedKm: 30,
    tag: 'POCKET FRIENDLY',
    amenities: ['Chilled Air Conditioning', 'Compact City Transit', 'Verified Chauffeur'],
    description: 'Cost-effective ride for light travel, solo commutes, and short transfers.',
    iconName: 'car-outline',
  },
];

export function calculateEstimatedFare(
  vehicle: VehicleOption,
  distanceKm: number,
  isAirport: boolean = false
): {
  baseFare: number;
  extraKmCharges: number;
  tollEstimate: number;
  totalFare: number;
} {
  const allowedKm = vehicle.allowedKm;
  const extraKm = Math.max(0, distanceKm - allowedKm);
  const extraKmCharges = Math.round(extraKm * vehicle.ratePerKm);
  
  // Airport toll if applicable
  const tollEstimate = isAirport ? 115 : 0;
  
  const rawTotal = vehicle.baseFare + extraKmCharges + tollEstimate;
  // Round to nearest multiple of 10 for clean Indian currency billing
  const totalFare = Math.ceil(rawTotal / 10) * 10;

  return {
    baseFare: vehicle.baseFare,
    extraKmCharges,
    tollEstimate,
    totalFare,
  };
}
