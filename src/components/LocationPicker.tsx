'use client';

import React, { useState } from 'react';
import { SubCityId, Language } from '@/lib/types';
import { ADDIS_SUB_CITIES } from '@/lib/constants';
import { getTranslation } from '@/lib/localization';
import { MapPin, Navigation, CheckCircle2 } from 'lucide-react';

interface LocationPickerProps {
  language: Language;
  selectedSubCity: SubCityId | 'all';
  onSubCityChange: (subCityId: SubCityId | 'all') => void;
  onCoordinatesChange: (lat: number, lng: number, label: string) => void;
  activeLocationLabel: string;
}

export default function LocationPicker({
  language,
  selectedSubCity,
  onSubCityChange,
  onCoordinatesChange,
  activeLocationLabel,
}: LocationPickerProps) {
  const t = getTranslation(language);
  const [isLocating, setIsLocating] = useState(false);

  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          onSubCityChange('all');
          onCoordinatesChange(
            position.coords.latitude,
            position.coords.longitude,
            t.locationDetected
          );
        },
        () => {
          // Graceful fallback to Addis Ababa Bole center
          setIsLocating(false);
          onCoordinatesChange(9.0016, 38.7885, 'Addis Ababa (Center)');
        },
        { timeout: 8000 }
      );
    } else {
      setIsLocating(false);
      onCoordinatesChange(9.0016, 38.7885, 'Addis Ababa (Center)');
    }
  };

  const handleSubCitySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as SubCityId | 'all';
    onSubCityChange(value);
    if (value === 'all') {
      onCoordinatesChange(9.0016, 38.7885, 'Addis Ababa (All)');
    } else {
      const found = ADDIS_SUB_CITIES.find((s) => s.id === value);
      if (found) {
        onCoordinatesChange(
          found.lat,
          found.lng,
          language === 'am' ? found.nameAm : found.nameEn
        );
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-emerald-600" />
          {language === 'am' ? 'የመፈለጊያ አካባቢ' : 'Search Radius & Location'}
        </span>
        <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          {activeLocationLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Sub-city Selector */}
        <div className="relative">
          <select
            value={selectedSubCity}
            onChange={handleSubCitySelect}
            className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">📍 {t.subCityFilter}</option>
            {ADDIS_SUB_CITIES.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {language === 'am' ? sub.nameAm : sub.nameEn} Sub-City
              </option>
            ))}
          </select>
        </div>

        {/* GPS Auto-detect Button */}
        <button
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition active:scale-[0.98] disabled:opacity-60"
        >
          <Navigation className={`h-3.5 w-3.5 text-emerald-700 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Locating...' : t.currentLocation}</span>
        </button>
      </div>
    </div>
  );
}
