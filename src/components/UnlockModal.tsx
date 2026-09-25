'use client';

import React, { useState } from 'react';
import { PharmacyResultItem, Language } from '@/lib/types';
import { getTranslation } from '@/lib/localization';
import { X, ShieldCheck, Clock, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

interface UnlockModalProps {
  item: PharmacyResultItem | null;
  language: Language;
  onClose: () => void;
  onSuccess: (item: PharmacyResultItem) => void;
}

export default function UnlockModal({
  item,
  language,
  onClose,
  onSuccess,
}: UnlockModalProps) {
  const t = getTranslation(language);
  const [patientPhone, setPatientPhone] = useState('0911223344');
  const [selectedMethod, setSelectedMethod] = useState<'telebirr' | 'chapa' | 'free'>('telebirr');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  if (!item) return null;

  const handlePayAndReserve = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate Telebirr / Chapa payment webhook confirmation
    setTimeout(() => {
      setIsProcessing(false);
      setIsComplete(true);
      setTimeout(() => {
        onSuccess(item);
      }, 1200);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-5 shadow-2xl animate-in slide-in-from-bottom duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{t.reserveTitle}</h3>
              <p className="text-xs text-slate-500">Hold fee: 20.00 ETB</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isComplete ? (
          <div className="py-8 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">{t.reservationSuccess}</h4>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              Your reservation code is <strong className="font-mono text-emerald-800">MED-4912</strong>. Unlocking contact details...
            </p>
          </div>
        ) : (
          <form onSubmit={handlePayAndReserve} className="mt-4 space-y-4">
            {/* Medicine & Pharmacy Summary */}
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between font-bold text-slate-800">
                <span>{item.medicine.brandName} ({item.medicine.strength})</span>
                <span>{item.unitPrice} ETB</span>
              </div>
              <p className="text-slate-500">Pharmacy: {item.pharmacy.name} • {item.pharmacy.subCity}</p>
              <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium pt-1">
                <Clock className="h-3 w-3" />
                Guaranteed 2-hour hold once confirmed
              </div>
            </div>

            {/* Phone Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.patientPhone}
              </label>
              <input
                type="tel"
                required
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="0911223344"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <span className="block text-xs font-semibold text-slate-700">
                Payment Method (Telebirr / Chapa)
              </span>

              <div className="grid grid-cols-3 gap-2">
                {/* Telebirr */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('telebirr')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition ${
                    selectedMethod === 'telebirr'
                      ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-black text-blue-600">Telebirr</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">20 ETB</span>
                </button>

                {/* Chapa */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('chapa')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition ${
                    selectedMethod === 'chapa'
                      ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-black text-green-600">Chapa</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Card/Bank</span>
                </button>

                {/* Free Demo Tier */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('free')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition ${
                    selectedMethod === 'free'
                      ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-black text-amber-600">Free Tier</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Instant Trial</span>
                </button>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isProcessing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition active:scale-[0.98] disabled:opacity-60"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Contacting Telebirr API...</span>
                </>
              ) : (
                <>
                  <span>
                    {selectedMethod === 'telebirr'
                      ? t.payWithTelebirr
                      : selectedMethod === 'chapa'
                      ? t.payWithChapa
                      : 'Unlock with Free Tier'}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Direct Telebirr / Chapa Instant Settlement</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
