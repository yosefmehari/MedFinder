'use client';

import React, { useState } from 'react';
import { SubCityId, Language } from '@/lib/types';
import { ADDIS_SUB_CITIES } from '@/lib/constants';
import { getTranslation } from '@/lib/localization';
import { X, UploadCloud, FileText, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface PrescriptionModalProps {
  language: Language;
  onClose: () => void;
  onPrescriptionSubmitted: (prescriptionId: string) => void;
}

export default function PrescriptionModal({
  language,
  onClose,
  onPrescriptionSubmitted,
}: PrescriptionModalProps) {
  const t = getTranslation(language);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [patientPhone, setPatientPhone] = useState('0911223344');
  const [preferredSubCity, setPreferredSubCity] = useState<SubCityId>('bole');
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    setTimeout(() => {
      setIsUploading(false);
      setIsSuccess(true);
      setTimeout(() => {
        onPrescriptionSubmitted('rx-9912');
      }, 1500);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-5 shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <UploadCloud className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{t.uploadPrescription}</h3>
              <p className="text-xs text-slate-500">{t.uploadSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">
              {language === 'am' ? 'የሐኪም ማዘዣው በተሳካ ሁኔታ ተልኳል!' : 'Prescription Submitted!'}
            </h4>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              Pharmacies in <strong className="font-semibold text-emerald-800">{preferredSubCity.toUpperCase()}</strong> have been alerted. You will receive an SMS response shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* File drop / preview */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {language === 'am' ? 'የሐኪም ማዘዣ ፎቶ ወይም ዶክመንት' : 'Prescription Photo (JPG, PNG, PDF)'}
              </label>

              {previewUrl ? (
                <div className="relative rounded-2xl border border-emerald-300 bg-emerald-50/50 p-2 text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Prescription preview"
                    className="max-h-48 mx-auto rounded-xl object-contain shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="mt-2 text-xs font-semibold text-red-600 hover:underline"
                  >
                    Change photo
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/30 transition">
                  <UploadCloud className="h-8 w-8 text-slate-400 mb-2" />
                  <span className="text-xs font-bold text-slate-700">
                    Tap to take photo or choose file
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">
                    Clear photo of doctor handwriting / drug names
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    required
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Sub-city preference */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {language === 'am' ? 'ተመራጭ ክፍለ ከተማ' : 'Preferred Sub-City'}
              </label>
              <select
                value={preferredSubCity}
                onChange={(e) => setPreferredSubCity(e.target.value as SubCityId)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                {ADDIS_SUB_CITIES.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {language === 'am' ? sub.nameAm : sub.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Phone */}
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
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {language === 'am' ? 'ተጨማሪ ማስታወሻ' : 'Notes / Dosage / Brand Preference'}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Generic ok, need 2 packs immediately"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition active:scale-[0.98] disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Scanning Prescription & Alerting Pharmacies...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>{language === 'am' ? 'አሁን ፈልግ' : 'Broadcast to Local Pharmacies'}</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
