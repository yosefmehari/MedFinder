'use client';

import React, { useState } from 'react';
import { PharmacyResultItem, Language } from '@/lib/types';
import { getTranslation } from '@/lib/localization';
import {
  MapPin,
  Clock,
  CheckCircle,
  Phone,
  Lock,
  Unlock,
  AlertCircle,
  Sparkles,
  Navigation,
  Share2,
  Check,
} from 'lucide-react';

interface PharmacyCardProps {
  item: PharmacyResultItem;
  language: Language;
  onUnlockClick: (item: PharmacyResultItem) => void;
  isUnlocked: boolean;
  reservationCode?: string;
}

export default function PharmacyCard({
  item,
  language,
  onUnlockClick,
  isUnlocked,
  reservationCode,
}: PharmacyCardProps) {
  const t = getTranslation(language);
  const { pharmacy, medicine, stockStatus, unitPrice, lastVerifiedAt, distanceKm } = item;
  const [shared, setShared] = useState(false);

  // Approximate driving time in Addis Ababa traffic (avg 18 km/h)
  const approxDriveMins = Math.max(3, Math.round((distanceKm / 18) * 60));

  const handleShare = async () => {
    const text = `Found ${medicine.brandName} (${medicine.strength}) at ${pharmacy.name}, ${pharmacy.subCity}! Price: ${unitPrice} ETB. Check on MedFinder Addis.`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `MedFinder: ${medicine.brandName} in Stock`,
          text,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(text);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${pharmacy.latitude},${pharmacy.longitude}`;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Top Row: Pharmacy Name & Badges */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              {pharmacy.name}
            </h3>
            {pharmacy.isVerified && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                <CheckCircle className="h-3 w-3 fill-blue-500 text-white" />
                {t.verified}
              </span>
            )}
            {pharmacy.is24Hours && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
                <Clock className="h-3 w-3" />
                24h
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <MapPin className="h-3.5 w-3.5" />
              {pharmacy.subCity} {pharmacy.woreda ? `(${pharmacy.woreda})` : ''}
            </span>
            <span>•</span>
            <span className="font-semibold text-slate-700">
              {distanceKm} km {t.distanceAway} (~{approxDriveMins} {t.estimatedDrive})
            </span>
          </div>
        </div>

        {/* Stock Badge */}
        <div className="shrink-0 text-right">
          {stockStatus === 'in_stock' ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {t.inStock}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
              <AlertCircle className="h-3 w-3 text-amber-600" />
              {t.lowStock}
            </span>
          )}
          <p className="text-[10px] text-slate-400 mt-1">
            {t.lastVerified}: {lastVerifiedAt}
          </p>
        </div>
      </div>

      {/* Middle Section: Medicine Details Box */}
      <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 mb-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-sm text-slate-800">
                {medicine.brandName}
              </h4>
              {medicine.isScarce && (
                <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                  <Sparkles className="h-2.5 w-2.5" />
                  {t.scarceBadge}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 font-medium">
              {medicine.genericName} • {medicine.strength}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Form: {medicine.dosageForm} | {medicine.category}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500 block">Retail Price</span>
            <span className="text-base font-extrabold text-slate-900">
              {unitPrice.toLocaleString()} <span className="text-xs font-normal">ETB</span>
            </span>
          </div>
        </div>
      </div>

      {/* Action / Unlock Section */}
      <div className="pt-1">
        {isUnlocked ? (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                <Unlock className="h-4 w-4 text-emerald-600" />
                Contact Info Unlocked (Reserved 2h)
              </span>
              {reservationCode ? (
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300">
                  Code: {reservationCode}
                </span>
              ) : (
                <span className="text-[11px] font-bold text-emerald-700">Stock Held</span>
              )}
            </div>

            <div className="text-xs text-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{t.pharmacyAddress}</span>
                <span className="font-medium text-right max-w-[220px] truncate">{pharmacy.streetAddress}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{t.pharmacyContact}</span>
                <a
                  href={`tel:${pharmacy.phoneNumber}`}
                  className="font-bold text-emerald-700 underline flex items-center gap-1"
                >
                  <Phone className="h-3 w-3" />
                  {pharmacy.phoneNumber}
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={`tel:${pharmacy.phoneNumber}`}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-800 transition active:scale-[0.98]"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>{t.callPharmacy}</span>
              </a>

              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-xl bg-white border border-emerald-300 py-2.5 text-xs font-bold text-emerald-800 shadow-xs hover:bg-emerald-50 transition active:scale-[0.98]"
              >
                <Navigation className="h-3.5 w-3.5 text-emerald-600" />
                <span>Directions</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
                title="Share medicine info"
              >
                {shared ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
              </button>
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <Lock className="h-3.5 w-3.5 text-slate-400" />
                <span>Exact address locked</span>
              </div>
            </div>

            <button
              onClick={() => onUnlockClick(item)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition active:scale-95 shrink-0"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>{t.unlockToView}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
