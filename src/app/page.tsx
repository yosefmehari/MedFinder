'use client';

import React, { useState, useMemo } from 'react';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import LocationPicker from '@/components/LocationPicker';
import PharmacyCard from '@/components/PharmacyCard';
import UnlockModal from '@/components/UnlockModal';
import PrescriptionModal from '@/components/PrescriptionModal';
import { SubCityId, Language, PharmacyResultItem } from '@/lib/types';
import { getMockSearchResults, ADDIS_SUB_CITIES } from '@/lib/constants';
import { getTranslation } from '@/lib/localization';
import {
  Sparkles,
  SlidersHorizontal,
  Building2,
  FileText,
  AlertCircle,
  HelpCircle,
  PhoneCall,
  Search,
  CheckCircle,
} from 'lucide-react';

export default function HomePage() {
  const [language, setLanguage] = useState<Language>('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubCity, setSelectedSubCity] = useState<SubCityId | 'all'>('all');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number; label: string }>({
    lat: 9.0016, // Bole center default
    lng: 38.7885,
    label: 'Bole / Central Addis',
  });

  // Modals state
  const [unlockTarget, setUnlockTarget] = useState<PharmacyResultItem | null>(null);
  const [unlockedItemIds, setUnlockedItemIds] = useState<Set<string>>(new Set());
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const t = getTranslation(language);

  // Filter & calculate distances
  const searchResults = useMemo(() => {
    let results = getMockSearchResults(searchQuery, userCoords.lat, userCoords.lng);

    // Filter by sub-city if specific one is selected
    if (selectedSubCity !== 'all') {
      const targetSub = ADDIS_SUB_CITIES.find((s) => s.id === selectedSubCity);
      if (targetSub) {
        results = results.filter(
          (item) => item.pharmacy.subCity.toLowerCase() === targetSub.nameEn.toLowerCase()
        );
      }
    }

    return results;
  }, [searchQuery, userCoords, selectedSubCity]);

  const handleLanguageToggle = () => {
    setLanguage((prev) => (prev === 'en' ? 'am' : 'en'));
  };

  const handleCoordinatesChange = (lat: number, lng: number, label: string) => {
    setUserCoords({ lat, lng, label });
  };

  const handleUnlockSuccess = (item: PharmacyResultItem) => {
    setUnlockedItemIds((prev) => new Set(prev).add(`${item.pharmacy.id}-${item.medicine.id}`));
    setUnlockTarget(null);
    setToastMessage(`Reserved ${item.medicine.brandName} at ${item.pharmacy.name}! Contact revealed.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handlePrescriptionSubmitted = (rxId: string) => {
    setIsPrescriptionModalOpen(false);
    setToastMessage(
      language === 'am'
        ? 'የሐኪም ማዘዣው በተሳካ ሁኔታ ተልኳል! ፋርማሲዎች ምላሽ ሲሰጡ እናሳውቆታለን።'
        : 'Prescription uploaded! Nearby pharmacies in Addis Ababa are checking their stock.'
    );
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-20">
      {/* App Header */}
      <Header language={language} onLanguageToggle={handleLanguageToggle} />

      {/* Main Container - Mobile Centered View */}
      <main className="mx-auto w-full max-w-lg px-4 py-4 space-y-4 flex-1">
        {/* Banner Alert for Addis Scarce Medicines */}
        <div className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-800 p-3.5 text-white shadow-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-xs">
            <Sparkles className="h-5 w-5 text-emerald-300" />
          </div>
          <div className="text-xs">
            <p className="font-bold tracking-tight">
              {language === 'am'
                ? 'በአዲስ አበባ ብርቅዬ የሆኑ መድኃኒቶች ክትትል'
                : 'Scarcity Radar Active in Addis Ababa'}
            </p>
            <p className="text-emerald-100/90 text-[11px] leading-tight mt-0.5">
              {language === 'am'
                ? 'ኢንሱሊን፣ ቬንቶሊን፣ ክሌክሴን እና ሌሎች ወሳኝ መድኃኒቶች በቅጽበት ይፈልጉ።'
                : 'Real-time stock alerts for Insulin, Inhalers, ICU drugs & emergency prescriptions.'}
            </p>
          </div>
        </div>

        {/* Search Bar & Quick Tags */}
        <SearchBar
          language={language}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenPrescriptionModal={() => setIsPrescriptionModalOpen(true)}
          onSelectQuickTag={(tag) => setSearchQuery(tag)}
        />

        {/* Location & Sub-City Picker */}
        <LocationPicker
          language={language}
          selectedSubCity={selectedSubCity}
          onSubCityChange={setSelectedSubCity}
          onCoordinatesChange={handleCoordinatesChange}
          activeLocationLabel={userCoords.label}
        />

        {/* Results Count & Filter Status */}
        <div className="flex items-center justify-between px-1 pt-1 text-xs">
          <div className="font-semibold text-slate-700">
            <span className="font-bold text-emerald-700">{searchResults.length}</span>{' '}
            {t.resultsFound} <span className="font-bold text-slate-900">{userCoords.label}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
            <SlidersHorizontal className="h-3 w-3" />
            <span>Nearest First</span>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="rounded-xl bg-emerald-900 text-white p-3 text-xs flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Pharmacy Results List */}
        <div className="space-y-3">
          {searchResults.length > 0 ? (
            searchResults.map((item) => {
              const itemKey = `${item.pharmacy.id}-${item.medicine.id}`;
              const isUnlocked = unlockedItemIds.has(itemKey);

              return (
                <PharmacyCard
                  key={itemKey}
                  item={item}
                  language={language}
                  onUnlockClick={(clickedItem) => setUnlockTarget(clickedItem)}
                  isUnlocked={isUnlocked}
                />
              );
            })
          ) : (
            <div className="rounded-3xl bg-white p-8 text-center border border-slate-200 shadow-xs space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                {t.noResults}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {language === 'am'
                  ? 'የሐኪም ማዘዣ ፎቶ በመጫን ፋርማሲዎች በቀጥታ እንዲያረጋግጡልዎ መጠየቅ ይችላሉ።'
                  : 'Try changing the Sub-City or upload your prescription photo to alert all licensed pharmacies.'}
              </p>
              <button
                onClick={() => setIsPrescriptionModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-800 transition"
              >
                <FileText className="h-4 w-4" />
                <span>{t.uploadPrescription}</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Info Box for Patients */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <HelpCircle className="h-4 w-4 text-emerald-600" />
            <span>How MedFinder Works</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 pl-1 leading-relaxed">
            <li>Search medicine name or upload your paper prescription.</li>
            <li>View pharmacies ordered by proximity to your current Addis Ababa location.</li>
            <li>Pay a 20 ETB reservation fee via Telebirr or Chapa to guarantee a 2-hour hold and unlock direct phone numbers.</li>
          </ol>
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 py-2 px-6 flex justify-around items-center max-w-lg mx-auto shadow-lg">
        <button
          onClick={() => {
            setSearchQuery('');
            setSelectedSubCity('all');
          }}
          className="flex flex-col items-center text-emerald-700 gap-0.5"
        >
          <Search className="h-5 w-5" />
          <span className="text-[10px] font-bold">Search</span>
        </button>

        <button
          onClick={() => setIsPrescriptionModalOpen(true)}
          className="flex flex-col items-center text-slate-500 hover:text-emerald-700 gap-0.5"
        >
          <FileText className="h-5 w-5" />
          <span className="text-[10px] font-medium">Rx Upload</span>
        </button>

        <button
          onClick={() => {
            setSearchQuery('Lantus');
          }}
          className="flex flex-col items-center text-slate-500 hover:text-emerald-700 gap-0.5"
        >
          <Sparkles className="h-5 w-5 text-amber-500" />
          <span className="text-[10px] font-medium">Scarce Radar</span>
        </button>

        <a
          href="tel:+251911223344"
          className="flex flex-col items-center text-slate-500 hover:text-emerald-700 gap-0.5"
        >
          <PhoneCall className="h-5 w-5" />
          <span className="text-[10px] font-medium">Support</span>
        </a>
      </nav>

      {/* Modals */}
      <UnlockModal
        item={unlockTarget}
        language={language}
        onClose={() => setUnlockTarget(null)}
        onSuccess={handleUnlockSuccess}
      />

      {isPrescriptionModalOpen && (
        <PrescriptionModal
          language={language}
          onClose={() => setIsPrescriptionModalOpen(false)}
          onPrescriptionSubmitted={handlePrescriptionSubmitted}
        />
      )}
    </div>
  );
}
