export type SubCityId =
  | 'bole'
  | 'kirkos'
  | 'arada'
  | 'yeka'
  | 'lideta'
  | 'addis_ketema'
  | 'nifas_silk_lafto'
  | 'kolfe_keranio'
  | 'gullele'
  | 'akaky_kaliti'
  | 'lemi_kura';

export interface SubCity {
  id: SubCityId;
  nameEn: string;
  nameAm: string;
  lat: number;
  lng: number;
}

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface Medicine {
  id: string;
  brandName: string;
  genericName: string;
  dosageForm: string;
  strength: string;
  category: string;
  isScarce: boolean;
  requiresPrescription: boolean;
  standardPriceEtb: number;
  description?: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  licenseNumber: string;
  subCity: string;
  woreda: string;
  streetAddress: string;
  landmark: string;
  phoneNumber: string;
  alternatePhone?: string;
  is24Hours: boolean;
  latitude: number;
  longitude: number;
  isVerified: boolean;
  rating: number;
}

export interface PharmacyResultItem {
  pharmacy: Pharmacy;
  medicine: Medicine;
  stockStatus: StockStatus;
  unitPrice: number;
  lastVerifiedAt: string;
  distanceKm: number;
  isUnlocked?: boolean;
}

export type Language = 'en' | 'am';

export interface Reservation {
  id: string;
  reservationCode: string;
  pharmacyId: string;
  medicineId: string;
  pharmacyName?: string;
  medicineName?: string;
  patientName: string;
  patientPhone: string;
  holdFeeEtb: number;
  paymentProvider: 'telebirr' | 'chapa' | 'free_tier';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  reservationStatus: 'active' | 'dispensed' | 'expired' | 'cancelled';
  expiresAt: string;
  createdAt: string;
}

export interface Prescription {
  id: string;
  patientName: string;
  patientPhone: string;
  imageUrl: string;
  notes?: string;
  preferredSubCity?: string;
  status: 'submitted' | 'under_review' | 'matched' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  pharmacyId: string;
  medicineId: string;
  medicine: Medicine;
  stockStatus: StockStatus;
  quantity: number;
  unitPrice: number;
  batchNumber?: string;
  expiryDate?: string;
  lastVerifiedAt: string;
}
