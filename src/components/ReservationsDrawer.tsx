'use client';

import React, { useEffect, useState } from 'react';
import { Reservation, Language } from '@/lib/types';
import { getTranslation } from '@/lib/localization';
import { X, Clock, Phone, MapPin, CheckCircle, Navigation, Copy, Check, AlertCircle } from 'lucide-react';

interface ReservationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

interface StoredReservation extends Reservation {
  pharmacyPhone?: string;
  pharmacyAddress?: string;
  subCity?: string;
  medicineName?: string;
  unitPrice?: number;
}

export default function ReservationsDrawer({
  isOpen,
  onClose,
  language,
}: ReservationsDrawerProps) {
  const t = getTranslation(language);
  const [reservations, setReservations] = useState<StoredReservation[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      try {
        const stored = JSON.parse(localStorage.getItem('medfinder_reservations') || '[]');
        setReservations(stored);
      } catch (err) {
        console.error('Failed to load reservations:', err);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white p-5 shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {language === 'am' ? 'የእኔ የተያዙ መድኃኒቶች' : 'My Active Holds'}
              </h3>
              <p className="text-xs text-slate-500">
                {reservations.length} {reservations.length === 1 ? 'reservation' : 'reservations'} in Addis Ababa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="mt-4 space-y-3 overflow-y-auto flex-1 pr-1">
          {reservations.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Clock className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No Active Holds</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                {language === 'am'
                  ? 'መድኃኒት ሲያገኙ ለ2 ሰዓት ለማስያዝ "አድራሻ ክፈት" የሚለውን ይጫኑ።'
                  : 'When you find a scarce medicine, reserve it for 2 hours to guarantee pharmacy stock.'}
              </p>
            </div>
          ) : (
            reservations.map((res) => {
              const expiresDate = new Date(res.expiresAt);
              const isExpired = expiresDate < new Date();

              return (
                <div
                  key={res.id || res.reservationCode}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">
                        {res.medicineName || 'Reserved Medicine'}
                      </h4>
                      <p className="text-xs text-emerald-700 font-medium mt-0.5">
                        {res.pharmacyName || 'Partner Pharmacy'} ({res.subCity || 'Addis Ababa'})
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        isExpired
                          ? 'bg-red-100 text-red-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isExpired ? 'Expired' : 'Active 2h Hold'}
                    </span>
                  </div>

                  {/* Reservation Code block */}
                  <div className="flex items-center justify-between rounded-xl bg-white border border-slate-200 p-2.5">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Reservation Code
                      </span>
                      <span className="font-mono text-base font-black text-slate-900 tracking-wider">
                        {res.reservationCode}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopy(res.reservationCode)}
                      className="flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 transition"
                    >
                      {copiedCode === res.reservationCode ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Contact details */}
                  <div className="text-xs text-slate-600 space-y-1">
                    {res.pharmacyAddress && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{res.pharmacyAddress}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200">
                      <span className="text-slate-400">
                        Expires: {expiresDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {res.pharmacyPhone && (
                        <a
                          href={`tel:${res.pharmacyPhone}`}
                          className="flex items-center gap-1 font-bold text-emerald-700 underline"
                        >
                          <Phone className="h-3 w-3" />
                          <span>{res.pharmacyPhone}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 py-2.5 text-xs font-bold text-slate-700 transition"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
