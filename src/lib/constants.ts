import { SubCity, Pharmacy, Medicine, PharmacyResultItem } from './types';

export const ADDIS_SUB_CITIES: SubCity[] = [
  { id: 'bole', nameEn: 'Bole', nameAm: 'ቦሌ', lat: 9.0016, lng: 38.7885 },
  { id: 'kirkos', nameEn: 'Kirkos', nameAm: 'ቂርቆስ', lat: 9.0108, lng: 38.7460 },
  { id: 'arada', nameEn: 'Arada', nameAm: 'አራዳ', lat: 9.0345, lng: 38.7518 },
  { id: 'yeka', nameEn: 'Yeka', nameAm: 'የካ', lat: 9.0205, lng: 38.7963 },
  { id: 'lideta', nameEn: 'Lideta', nameAm: 'ልደታ', lat: 9.0125, lng: 38.7360 },
  { id: 'addis_ketema', nameEn: 'Addis Ketema', nameAm: 'አዲስ ከተማ', lat: 9.0332, lng: 38.7380 },
  { id: 'nifas_silk_lafto', nameEn: 'Nifas Silk-Lafto', nameAm: 'ንፋስ ስልክ ላፍቶ', lat: 8.9721, lng: 38.7495 },
  { id: 'kolfe_keranio', nameEn: 'Kolfe Keranio', nameAm: 'ኮልፌ ቀራኒዮ', lat: 9.0245, lng: 38.7065 },
  { id: 'gullele', nameEn: 'Gullele', nameAm: 'ጉለሌ', lat: 9.0620, lng: 38.7382 },
  { id: 'akaky_kaliti', nameEn: 'Akaky Kaliti', nameAm: 'አቃቂ ቃሊቲ', lat: 8.9056, lng: 38.7758 },
  { id: 'lemi_kura', nameEn: 'Lemi Kura', nameAm: 'ለሚ ኩራ', lat: 9.0280, lng: 38.8350 },
];

export const MOCK_MEDICINES: Medicine[] = [
  {
    id: 'med-1',
    brandName: 'Lantus SoloStar',
    genericName: 'Insulin Glargine',
    dosageForm: 'Pen Injector',
    strength: '100 IU/ml (3ml)',
    category: 'Endocrine / Diabetes',
    isScarce: true,
    requiresPrescription: true,
    standardPriceEtb: 2850,
    description: 'Long-acting analog insulin. Must be kept refrigerated (2°C - 8°C). Highly scarce in Addis Ababa.',
  },
  {
    id: 'med-2',
    brandName: 'Ventolin Evohaler',
    genericName: 'Salbutamol',
    dosageForm: 'Inhaler',
    strength: '100mcg (200 doses)',
    category: 'Respiratory / Asthma',
    isScarce: true,
    requiresPrescription: true,
    standardPriceEtb: 850,
    description: 'Fast-acting bronchodilator for asthma relief and bronchospasm attacks.',
  },
  {
    id: 'med-3',
    brandName: 'Clexane',
    genericName: 'Enoxaparin Sodium',
    dosageForm: 'Pre-filled Syringe',
    strength: '40mg / 0.4ml',
    category: 'Cardiovascular / Anticoagulant',
    isScarce: true,
    requiresPrescription: true,
    standardPriceEtb: 1450,
    description: 'Low molecular weight heparin for deep vein thrombosis prevention and cardiology.',
  },
  {
    id: 'med-4',
    brandName: 'Augmentin',
    genericName: 'Amoxicillin + Clavulanic Acid',
    dosageForm: 'Film Tablet',
    strength: '1000mg (1g)',
    category: 'Antibiotic',
    isScarce: false,
    requiresPrescription: true,
    standardPriceEtb: 620,
    description: 'Broad-spectrum antibiotic used for respiratory and bacterial infections.',
  },
  {
    id: 'med-5',
    brandName: 'Glucophage',
    genericName: 'Metformin Hydrochloride',
    dosageForm: 'Tablet',
    strength: '850mg',
    category: 'Endocrine / Diabetes',
    isScarce: false,
    requiresPrescription: true,
    standardPriceEtb: 380,
    description: 'First-line medication for the treatment of type 2 diabetes.',
  },
  {
    id: 'med-6',
    brandName: 'Norvasc',
    genericName: 'Amlodipine Besylate',
    dosageForm: 'Tablet',
    strength: '5mg',
    category: 'Cardiovascular / Blood Pressure',
    isScarce: false,
    requiresPrescription: true,
    standardPriceEtb: 420,
    description: 'Calcium channel blocker used to treat high blood pressure and coronary artery disease.',
  },
];

export const MOCK_PHARMACIES: Pharmacy[] = [
  {
    id: 'pharma-1',
    name: 'Kenema Pharmacy No. 1 - Bole',
    licenseNumber: 'EFDA-AA-2023-8910',
    subCity: 'Bole',
    woreda: 'Woreda 03',
    streetAddress: 'Cameroon St, opposite Edna Mall / Harmony Hotel',
    landmark: 'Medhanialem Area',
    phoneNumber: '+251911456789',
    is24Hours: true,
    latitude: 9.0016,
    longitude: 38.7885,
    isVerified: true,
    rating: 4.9,
  },
  {
    id: 'pharma-2',
    name: 'Lion Pharmacy & Special Dispensary',
    licenseNumber: 'EFDA-AA-2022-4412',
    subCity: 'Kirkos',
    woreda: 'Woreda 08',
    streetAddress: 'Ras Abebe Aregay Ave, Mexico Square',
    landmark: 'Beside Wabi Shebelle Hotel',
    phoneNumber: '+251922334455',
    is24Hours: false,
    latitude: 9.0108,
    longitude: 38.7460,
    isVerified: true,
    rating: 4.8,
  },
  {
    id: 'pharma-3',
    name: 'Ethiopian Red Cross Pharmacy',
    licenseNumber: 'EFDA-AA-2021-0021',
    subCity: 'Arada',
    woreda: 'Woreda 01',
    streetAddress: 'Cunningham St, Piazza',
    landmark: 'Near Taitu Hotel & Churchill Ave',
    phoneNumber: '+251933445566',
    is24Hours: true,
    latitude: 9.0345,
    longitude: 38.7518,
    isVerified: true,
    rating: 4.95,
  },
  {
    id: 'pharma-4',
    name: 'CarePlus Pharmacy - Megenagna',
    licenseNumber: 'EFDA-AA-2024-5589',
    subCity: 'Yeka',
    woreda: 'Woreda 06',
    streetAddress: 'Haile Gebreselassie Ave, Megenagna Roundabout',
    landmark: 'Near Zefmesh Grand Mall',
    phoneNumber: '+251944556677',
    is24Hours: false,
    latitude: 9.0205,
    longitude: 38.7963,
    isVerified: true,
    rating: 4.7,
  },
  {
    id: 'pharma-5',
    name: 'Bethel Community Pharmacy',
    licenseNumber: 'EFDA-AA-2023-1190',
    subCity: 'Lideta',
    woreda: 'Woreda 04',
    streetAddress: 'Balcha Aba Nefso Hospital area',
    landmark: 'Across from Lideta High Court',
    phoneNumber: '+251955667788',
    is24Hours: true,
    latitude: 9.0125,
    longitude: 38.7360,
    isVerified: true,
    rating: 4.6,
  },
];

// Helper: Haversine distance formula (in km)
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
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
  const d = R * c;
  return Math.round(d * 10) / 10;
}

// Generate mock inventory search results
export function getMockSearchResults(
  query: string,
  userLat: number = 9.0016, // Bole center default
  userLng: number = 38.7885
): PharmacyResultItem[] {
  const normalizedQuery = query.toLowerCase().trim();

  const inventoryMappings: {
    pharmacyId: string;
    medicineId: string;
    status: 'in_stock' | 'low_stock';
    price: number;
    verified: string;
  }[] = [
    { pharmacyId: 'pharma-1', medicineId: 'med-1', status: 'in_stock', price: 2850, verified: '12 mins ago' },
    { pharmacyId: 'pharma-3', medicineId: 'med-1', status: 'low_stock', price: 2790, verified: '25 mins ago' },
    { pharmacyId: 'pharma-1', medicineId: 'med-2', status: 'in_stock', price: 850, verified: '18 mins ago' },
    { pharmacyId: 'pharma-4', medicineId: 'med-2', status: 'in_stock', price: 860, verified: '40 mins ago' },
    { pharmacyId: 'pharma-2', medicineId: 'med-3', status: 'in_stock', price: 1450, verified: '5 mins ago' },
    { pharmacyId: 'pharma-1', medicineId: 'med-4', status: 'in_stock', price: 620, verified: '1 hour ago' },
    { pharmacyId: 'pharma-3', medicineId: 'med-4', status: 'in_stock', price: 590, verified: '2 hours ago' },
    { pharmacyId: 'pharma-4', medicineId: 'med-5', status: 'in_stock', price: 380, verified: '30 mins ago' },
    { pharmacyId: 'pharma-2', medicineId: 'med-6', status: 'in_stock', price: 420, verified: '15 mins ago' },
    { pharmacyId: 'pharma-5', medicineId: 'med-2', status: 'low_stock', price: 890, verified: '2 hours ago' },
  ];

  const results: PharmacyResultItem[] = [];

  for (const item of inventoryMappings) {
    const med = MOCK_MEDICINES.find((m) => m.id === item.medicineId);
    const pharma = MOCK_PHARMACIES.find((p) => p.id === item.pharmacyId);

    if (!med || !pharma) continue;

    if (
      normalizedQuery === '' ||
      med.brandName.toLowerCase().includes(normalizedQuery) ||
      med.genericName.toLowerCase().includes(normalizedQuery) ||
      med.category.toLowerCase().includes(normalizedQuery)
    ) {
      const distance = calculateDistanceKm(userLat, userLng, pharma.latitude, pharma.longitude);
      results.push({
        pharmacy: pharma,
        medicine: med,
        stockStatus: item.status,
        unitPrice: item.price,
        lastVerifiedAt: item.verified,
        distanceKm: distance,
      });
    }
  }

  // Sort by nearest distance first
  return results.sort((a, b) => a.distanceKm - b.distanceKm);
}
