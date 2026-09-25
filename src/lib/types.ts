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
