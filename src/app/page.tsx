'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import LocationPicker from '@/components/LocationPicker';
import PharmacyCard from '@/components/PharmacyCard';
import UnlockModal from '@/components/UnlockModal';
import PrescriptionModal from '@/components/PrescriptionModal';
import ReservationsDrawer from '@/components/ReservationsDrawer';
import { SubCityId, Language, PharmacyResultItem, Reservation } from '@/lib/types';
import { getMockSearchResults } from '@/lib/constants';
import { getTranslation } from '@/lib/localization';
import {
  Sparkles,
  SlidersHorizontal,
  FileText,
  AlertCircle,
  HelpCircle,
  PhoneCall,
  Search,
  CheckCircle,
  Clock,
  Loader2,
  Database,
  Building2,
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [language, setLanguage] = useState<Language>('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubCity, setSelectedSubCity] = useState<SubCityId | 'all'>('all');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number; label: string }>({
    lat: 9.0016, // Bole center default
    lng: 38.7885,
    label: 'Bole / Central Addis',
  });

  // Results & API status
  const [searchResults, setSearchResults] = useState<PharmacyResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dataSource, setDataSource] = useState<'neon_postgis' | 'mock_fallback'>('neon_postgis');

  // Modals & drawers state
  const [unlockTarget, setUnlockTarget] = useState<PharmacyResultItem | null>(null);
  const [unlockedItemIds, setUnlockedItemIds] = useState<Set<string>>(new Set());
  const [reservationCodes, setReservationCodes] = useState<Record<string, string>>({});
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isReservationsDrawerOpen, setIsReservationsDrawerOpen] = useState(false);
  const [activeHoldsCount, setActiveHoldsCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const t = getTranslation(language);

  // Restore unlocked items and active holds from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('medfinder_reservations') || '[]');
      if (Array.isArray(stored) && stored.length > 0) {
        const idSet = new Set<string>();
        const codeMap: Record<string, string> = {};
        let activeCount = 0;

        stored.forEach((res: any) => {
          if (res.pharmacyId && res.medicineId) {
            const key = `${res.pharmacyId}-${res.medicineId}`;
            idSet.add(key);
            if (res.reservationCode) codeMap[key] = res.reservationCode;
          }
          if (new Date(res.expiresAt) > new Date()) {
            activeCount++;
          }
        });

        setUnlockedItemIds(idSet);
        setReservationCodes(codeMap);
        setActiveHoldsCount(activeCount);
      }
    } catch (e) {
      console.warn('Could not read stored reservations:', e);
    }
  }, []);

  // Fetch search results from Neon PostGIS API with graceful fallback
  const fetchResults = useCallback(async (query: string, subCity: string, lat: number, lng: number) => {
    setIsSearching(true);
    try {
      const params = new URLSearchParams({
        q: query,
        lat: lat.toString(),
        lng: lng.toString(),
        subcity: subCity,
      });

      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      setSearchResults(data.results || []);
      setDataSource(data.source === 'neon_postgis' ? 'neon_postgis' : 'mock_fallback');
    } catch (err) {
      console.warn('API Search failed, using local offline calculation:', err);
      const fallback = getMockSearchResults(query, lat, lng);
      setSearchResults(fallback);
      setDataSource('mock_fallback');
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchResults(searchQuery, selectedSubCity, userCoords.lat, userCoords.lng);
    }, 280);

    return () => clearTimeout(handler);
  }, [searchQuery, selectedSubCity, userCoords, fetchResults]);

  const handleLanguageToggle = () => {
    setLanguage((prev) => (prev === 'en' ? 'am' : 'en'));
  };

  const handleCoordinatesChange = (lat: number, lng: number, label: string) => {
    setUserCoords({ lat, lng, label });
  };

  const handleUnlockSuccess = (item: PharmacyResultItem, res?: Reservation) => {
    const itemKey = `${item.pharmacy.id}-${item.medicine.id}`;
    setUnlockedItemIds((prev) => new Set(prev).add(itemKey));

    if (res?.reservationCode) {
      setReservationCodes((prev) => ({ ...prev, [itemKey]: res.reservationCode }));
      setActiveHoldsCount((prev) => prev + 1);
    }

    setUnlockTarget(null);
    setToastMessage(`Stock reserved for 2 hours! Pharmacy phone & exact address unlocked.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handlePrescriptionSubmitted = (rxId: string) => {
    setIsPrescriptionModalOpen(false);
    setToastMessage(
      language === 'am'
        ? 'የሐኪም ማዘዣው በተሳካ ሁኔታ ተልኳል! ፋርማሲዎች ምላሽ ሲሰጡ እናሳውቆታለን።'
        : 'Prescription uploaded! Nearby licensed pharmacies in Addis Ababa are checking their stock.'
    );
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-24">
      {/* App Header */}
      <Header
        language={language}
        onLanguageToggle={handleLanguageToggle}
        onOpenReservations={() => setIsReservationsDrawerOpen(true)}
        activeHoldsCount={activeHoldsCount}
      />

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

        {/* Results Header & PostGIS Indicator */}
        <div className="flex items-center justify-between px-1 pt-1 text-xs">
          <div className="font-semibold text-slate-700 flex items-center gap-1.5">
            <span className="font-bold text-emerald-700">{searchResults.length}</span>
            <span>{t.resultsFound}</span>
            <span className="font-bold text-slate-900 truncate max-w-[120px]">
              {userCoords.label}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
            <Database className="h-3 w-3 text-emerald-600" />
            <span>{dataSource === 'neon_postgis' ? 'PostGIS Spatial' : 'Offline GPS'}</span>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="rounded-xl bg-emerald-900 text-white p-3 text-xs flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Pharmacy Results List / Loading State */}
        <div className="space-y-3">
          {isSearching ? (
            <div className="rounded-3xl bg-white p-10 text-center border border-slate-200 shadow-xs space-y-3">
              <Loader2 className="h-7 w-7 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-600">
                {language === 'am' ? 'በአቅራቢያ ያሉ ፋርማሲዎችን በመፈለግ ላይ...' : 'Searching matching Addis Ababa pharmacies...'}
              </p>
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((item) => {
              const itemKey = `${item.pharmacy.id}-${item.medicine.id}`;
              const isUnlocked = unlockedItemIds.has(itemKey);
              const reservationCode = reservationCodes[itemKey];

              return (
                <PharmacyCard
                  key={itemKey}
                  item={item}
                  language={language}
                  onUnlockClick={(clickedItem) => setUnlockTarget(clickedItem)}
                  isUnlocked={isUnlocked}
                  reservationCode={reservationCode}
                />
              );
            })
          ) : (
            <div className="rounded-3xl bg-white p-8 text-center border border-slate-200 shadow-xs space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">{t.noResults}</h4>
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
            <span>How MedFinder Addis Works</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 pl-1 leading-relaxed">
            <li>Search medicine name or upload your paper prescription.</li>
            <li>View pharmacies ordered by proximity to your current Addis Ababa location.</li>
            <li>Pay a 20 ETB reservation fee via Telebirr or Chapa to guarantee a 2-hour hold and unlock direct phone numbers.</li>
          </ol>
        </div>

        {/* Quick Link to Dispensary Portal */}
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-700" />
            <div>
              <p className="font-bold text-emerald-950">Are you an Addis Ababa Pharmacy?</p>
              <p className="text-[11px] text-emerald-700">Update your stock levels & verify patient holds</p>
            </div>
          </div>
          <Link
            href="/pharmacy"
            className="rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition shrink-0"
          >
            Dispensary
          </Link>
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 py-2 px-4 flex justify-around items-center max-w-lg mx-auto shadow-lg">
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
          <span className="text-[10px] font-medium">Scarce</span>
        </button>

        <button
          onClick={() => setIsReservationsDrawerOpen(true)}
          className="relative flex flex-col items-center text-slate-500 hover:text-emerald-700 gap-0.5"
        >
          <Clock className="h-5 w-5" />
          {activeHoldsCount > 0 && (
            <span className="absolute -top-1 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-bold text-white">
              {activeHoldsCount}
            </span>
          )}
          <span className="text-[10px] font-medium">My Holds</span>
        </button>

        <a
          href="tel:+251911223344"
          className="flex flex-col items-center text-slate-500 hover:text-emerald-700 gap-0.5"
        >
          <PhoneCall className="h-5 w-5" />
          <span className="text-[10px] font-medium">Support</span>
        </a>
      </nav>

      {/* Modals & Drawers */}
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

      <ReservationsDrawer
        isOpen={isReservationsDrawerOpen}
        onClose={() => setIsReservationsDrawerOpen(false)}
        language={language}
      />
    </div>
  );
}
