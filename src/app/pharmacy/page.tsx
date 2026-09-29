'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { InventoryItem, StockStatus, Prescription } from '@/lib/types';
import { ADDIS_SUB_CITIES } from '@/lib/constants';
import {
  Building2,
  Package,
  CheckCircle2,
  Clock,
  Plus,
  AlertCircle,
  Phone,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Check,
  Lock,
  User,
  MapPin,
  LogOut,
  Loader2,
  KeyRound,
  FileBadge,
} from 'lucide-react';

interface AuthSession {
  user: {
    id: string;
    name: string;
    phoneNumber: string;
    role: string;
  };
  pharmacy: {
    id: string;
    name: string;
    licenseNumber: string;
    subCity: string;
    woreda?: string;
    streetAddress: string;
    phoneNumber: string;
    is24Hours?: boolean;
  };
}

export default function PharmacyPortal() {
  // Authentication state
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('0911456789');
  const [loginPassword, setLoginPassword] = useState('password123');

  // Register form state
  const [regAdminName, setRegAdminName] = useState('');
  const [regPharmacyName, setRegPharmacyName] = useState('');
  const [regPharmacyAddress, setRegPharmacyAddress] = useState('');
  const [regSubCity, setRegSubCity] = useState('Bole');
  const [regWoreda, setRegWoreda] = useState('Woreda 03');
  const [regPhone, setRegPhone] = useState('0911');
  const [regLicense, setRegLicense] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Active dashboard tab
  const [activeTab, setActiveTab] = useState<'inventory' | 'verify' | 'prescriptions'>('inventory');

  // Inventory state
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [catalogMedicines, setCatalogMedicines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add / Upload medicine state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newMedId, setNewMedId] = useState('');
  const [newMedPrice, setNewMedPrice] = useState('');
  const [newMedQty, setNewMedQty] = useState('15');
  const [newMedStatus, setNewMedStatus] = useState<StockStatus>('in_stock');

  // Verify reservation state
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifiedReservation, setVerifiedReservation] = useState<any | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Prescriptions state
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loadingRx, setLoadingRx] = useState(false);

  // Load session from localStorage on initial render
  useEffect(() => {
    try {
      const stored = localStorage.getItem('medfinder_pharmacy_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.pharmacy?.id) {
          setSession(parsed);
        }
      }
    } catch (err) {
      console.warn('Failed to parse pharmacy session:', err);
    }
  }, []);

  // Fetch inventory for the logged-in pharmacy
  const fetchInventory = async (pharmacyId?: string) => {
    const id = pharmacyId || session?.pharmacy?.id;
    if (!id) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/inventory?pharmacyId=${id}`);
      const data = await res.json();
      if (data.success) {
        setInventory(data.inventory || []);
        if (data.catalogMedicines?.length > 0) setCatalogMedicines(data.catalogMedicines);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch prescriptions
  const fetchPrescriptions = async () => {
    setLoadingRx(true);
    try {
      const subCityParam = session?.pharmacy?.subCity ? `?subCity=${encodeURIComponent(session.pharmacy.subCity)}` : '';
      const res = await fetch(`/api/prescriptions${subCityParam}`);
      const data = await res.json();
      if (data.success) {
        setPrescriptions(data.prescriptions || []);
      }
    } catch (err) {
      console.error('Failed to load prescriptions:', err);
    } finally {
      setLoadingRx(false);
    }
  };

  useEffect(() => {
    if (session?.pharmacy?.id) {
      fetchInventory(session.pharmacy.id);
    }
  }, [session?.pharmacy?.id]);

  useEffect(() => {
    if (activeTab === 'prescriptions' && session?.pharmacy?.id) {
      fetchPrescriptions();
    }
  }, [activeTab, session?.pharmacy?.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ----------------------------------------------------
  // AUTH: SIGN IN
  // ----------------------------------------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/pharmacy/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          identifier: loginIdentifier.trim(),
          password: loginPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }

      const newSession: AuthSession = {
        user: data.user,
        pharmacy: data.pharmacy,
      };

      setSession(newSession);
      localStorage.setItem('medfinder_pharmacy_session', JSON.stringify(newSession));
      showToast(data.message || `Welcome to ${data.pharmacy.name}!`);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  // ----------------------------------------------------
  // AUTH: REGISTER
  // ----------------------------------------------------
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    if (regPassword !== regConfirmPassword) {
      setAuthError('Passwords do not match.');
      setAuthLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/pharmacy/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          adminName: regAdminName.trim(),
          pharmacyName: regPharmacyName.trim(),
          pharmacyAddress: regPharmacyAddress.trim(),
          subCity: regSubCity,
          woreda: regWoreda.trim(),
          phoneNumber: regPhone.trim(),
          licenseNumber: regLicense.trim() || undefined,
          password: regPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Registration failed.');
      }

      const newSession: AuthSession = {
        user: data.user,
        pharmacy: data.pharmacy,
      };

      setSession(newSession);
      localStorage.setItem('medfinder_pharmacy_session', JSON.stringify(newSession));
      showToast('Pharmacy account registered successfully! You can now upload stock.');
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Quick Demo Login helper
  const handleQuickDemoLogin = (phone: string, name: string) => {
    setLoginIdentifier(phone);
    setLoginPassword('password123');
    showToast(`Loaded ${name} credentials. Click "Sign In" to continue.`);
  };

  // Log Out
  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('medfinder_pharmacy_session');
    setInventory([]);
    showToast('Signed out of dispensary portal.');
  };

  // ----------------------------------------------------
  // STOCK MANAGEMENT
  // ----------------------------------------------------
  const handleStockUpdate = async (medicineId: string, status: StockStatus) => {
    if (!session?.pharmacy?.id) return;
    try {
      const res = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pharmacyId: session.pharmacy.id,
          medicineId,
          stockStatus: status,
        }),
      });
      if (res.ok) {
        setInventory((prev) =>
          prev.map((item) =>
            item.medicineId === medicineId ? { ...item, stockStatus: status } : item
          )
        );
        showToast('Stock status updated on Addis Radar');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePriceUpdate = async (medicineId: string, price: number) => {
    if (!session?.pharmacy?.id) return;
    try {
      const res = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pharmacyId: session.pharmacy.id,
          medicineId,
          unitPrice: price,
        }),
      });
      if (res.ok) {
        setInventory((prev) =>
          prev.map((item) =>
            item.medicineId === medicineId ? { ...item, unitPrice: price } : item
          )
        );
        showToast(`Price updated to ${price} ETB`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Upload/Add medicine to stock
  const handleUploadMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.pharmacy?.id || !newMedId || !newMedPrice) return;

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pharmacyId: session.pharmacy.id,
          medicineId: newMedId,
          unitPrice: parseFloat(newMedPrice),
          quantity: parseInt(newMedQty, 10) || 10,
          stockStatus: newMedStatus,
        }),
      });

      if (res.ok) {
        showToast('Medicine uploaded to your dispensary stock!');
        setIsAddOpen(false);
        setNewMedId('');
        setNewMedPrice('');
        fetchInventory(session.pharmacy.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ----------------------------------------------------
  // VERIFY 2-HOUR HOLD RESERVATION CODE
  // ----------------------------------------------------
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode.trim()) return;

    setVerifying(true);
    setVerifyError(null);
    setVerifiedReservation(null);

    try {
      const res = await fetch(`/api/reservations?code=${encodeURIComponent(verifyCode.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setVerifyError(data.error || 'Reservation code not found or expired.');
      } else {
        setVerifiedReservation(data.reservation);
      }
    } catch (err: any) {
      setVerifyError(err.message || 'Verification request failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleDispense = async (code: string) => {
    try {
      const res = await fetch('/api/reservations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, status: 'dispensed' }),
      });
      if (res.ok) {
        showToast(`Medicine marked as DISPENSED for code ${code}`);
        if (verifiedReservation) {
          setVerifiedReservation({ ...verifiedReservation, reservationStatus: 'dispensed' });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-emerald-800 text-white shadow-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1 rounded-xl bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-white/20 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Patient App</span>
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight">Pharmacy Dispensary</span>
                <span className="rounded bg-emerald-900 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                  PORTAL
                </span>
              </div>
              <p className="text-[11px] text-emerald-200">
                Authorized Pharmacist Stock & Hold Verification
              </p>
            </div>
          </div>

          {session && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchInventory()}
                className="p-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-900 text-emerald-100 transition"
                title="Refresh inventory"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 rounded-xl bg-red-600/80 hover:bg-red-700 px-2.5 py-1.5 text-xs font-bold text-white transition"
                title="Sign out of dispensary"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>

        {/* Authenticated Pharmacy Status Ribbon */}
        {session && (
          <div className="bg-emerald-900/70 px-4 py-2 border-t border-emerald-700/60">
            <div className="mx-auto max-w-2xl flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-white">{session.pharmacy.name}</span>
                  <span className="text-emerald-200 text-[11px] ml-1.5">
                    ({session.pharmacy.subCity} • {session.pharmacy.streetAddress})
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-mono text-[10px] bg-emerald-950/80 px-2 py-0.5 rounded text-emerald-300 border border-emerald-700">
                  {session.pharmacy.licenseNumber}
                </span>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-2xl px-4 py-4 space-y-4 flex-1">
        {/* Toast */}
        {toastMessage && (
          <div className="rounded-xl bg-emerald-900 text-white p-3 text-xs flex items-center gap-2 shadow-lg animate-in fade-in duration-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 1: AUTHENTICATION REQUIRED (SIGN IN OR REGISTER)  */}
        {/* ======================================================== */}
        {!session ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Intro Alert */}
            <div className="rounded-3xl bg-gradient-to-r from-emerald-800 to-teal-800 p-5 text-white shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                  <ShieldCheck className="h-5 w-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Pharmacist Access Verification</h3>
                  <p className="text-xs text-emerald-200">
                    Licensed pharmacies in Addis Ababa must create an account with pharmacy address and password to upload and update stock.
                  </p>
                </div>
              </div>
            </div>

            {/* Auth Mode Toggle Tabs */}
            <div className="flex rounded-2xl bg-white p-1 border border-slate-200 shadow-xs">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError(null);
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  authMode === 'login'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Sign In to Pharmacy</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError(null);
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  authMode === 'register'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Register New Pharmacy</span>
              </button>
            </div>

            {authError && (
              <div className="rounded-2xl bg-red-50 p-3.5 text-xs text-red-700 border border-red-200 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{authError}</span>
              </div>
            )}

            {/* TAB: SIGN IN */}
            {authMode === 'login' ? (
              <div className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm space-y-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Dispensary Sign In</h4>
                  <p className="text-xs text-slate-500">
                    Enter your pharmacy phone number or pharmacy name and your password.
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pharmacy Phone Number or Name
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <Phone className="h-4 w-4 text-emerald-600" />
                      </div>
                      <input
                        type="text"
                        required
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="e.g. 0911456789 or Kenema Pharmacy"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <KeyRound className="h-4 w-4 text-emerald-600" />
                      </div>
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition active:scale-[0.98] disabled:opacity-60"
                  >
                    {authLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Authenticating Dispensary...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        <span>Sign In to Upload Stock</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Quick Demo Credentials for Seed Pharmacies */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Quick Demo Credentials (Seed Pharmacies)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin('0911456789', 'Kenema Bole')}
                      className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-left transition"
                    >
                      <span className="block text-[11px] font-bold text-slate-800">Kenema Bole</span>
                      <span className="block text-[10px] text-slate-500">0911456789</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin('0922334455', 'Lion Kirkos')}
                      className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-left transition"
                    >
                      <span className="block text-[11px] font-bold text-slate-800">Lion Kirkos</span>
                      <span className="block text-[10px] text-slate-500">0922334455</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin('0933445566', 'Red Cross Piazza')}
                      className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-left transition"
                    >
                      <span className="block text-[11px] font-bold text-slate-800">Red Cross Piazza</span>
                      <span className="block text-[10px] text-slate-500">0933445566</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* TAB: REGISTER NEW PHARMACY */
              <div className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm space-y-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Register Licensed Pharmacy</h4>
                  <p className="text-xs text-slate-500">
                    Create your dispensary profile with name, physical address, and password to publish real-time stock to Addis Ababa patients.
                  </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Admin Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Admin Full Name *
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                          <User className="h-4 w-4 text-emerald-600" />
                        </div>
                        <input
                          type="text"
                          required
                          value={regAdminName}
                          onChange={(e) => setRegAdminName(e.target.value)}
                          placeholder="Dr. Yosef Mehari"
                          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Pharmacy Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Pharmacy Name *
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                          <Building2 className="h-4 w-4 text-emerald-600" />
                        </div>
                        <input
                          type="text"
                          required
                          value={regPharmacyName}
                          onChange={(e) => setRegPharmacyName(e.target.value)}
                          placeholder="Selam Community Pharmacy"
                          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Sub-City Selector */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Addis Ababa Sub-City *
                      </label>
                      <select
                        value={regSubCity}
                        onChange={(e) => setRegSubCity(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
                      >
                        {ADDIS_SUB_CITIES.map((s) => (
                          <option key={s.id} value={s.nameEn}>
                            {s.nameEn} ({s.nameAm})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Woreda */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Woreda / Kebele
                      </label>
                      <input
                        type="text"
                        value={regWoreda}
                        onChange={(e) => setRegWoreda(e.target.value)}
                        placeholder="Woreda 03"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Physical Address */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Exact Street Address & Landmark *
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <MapPin className="h-4 w-4 text-emerald-600" />
                      </div>
                      <input
                        type="text"
                        required
                        value={regPharmacyAddress}
                        onChange={(e) => setRegPharmacyAddress(e.target.value)}
                        placeholder="Cameroon St, opposite Medhanialem Church, Edna Mall area"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Phone Number */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Pharmacy Phone Number *
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                          <Phone className="h-4 w-4 text-emerald-600" />
                        </div>
                        <input
                          type="tel"
                          required
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="0911223344"
                          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* License Number */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        EFDA Pharmacy License # (Optional)
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                          <FileBadge className="h-4 w-4 text-emerald-600" />
                        </div>
                        <input
                          type="text"
                          value={regLicense}
                          onChange={(e) => setRegLicense(e.target.value)}
                          placeholder="EFDA-AA-2024-9988"
                          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Password */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Create Password *
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                          <KeyRound className="h-4 w-4 text-emerald-600" />
                        </div>
                        <input
                          type="password"
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Min 4 characters"
                          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                          <KeyRound className="h-4 w-4 text-emerald-600" />
                        </div>
                        <input
                          type="password"
                          required
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="Repeat password"
                          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition active:scale-[0.98] disabled:opacity-60"
                  >
                    {authLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Registering Pharmacy & Address...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span>Register Pharmacy & Access Inventory</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          /* ======================================================== */
          /* SCREEN 2: AUTHENTICATED PHARMACY DASHBOARD               */
          /* ======================================================== */
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Navigation Tabs */}
            <div className="flex rounded-2xl bg-white p-1 border border-slate-200 shadow-xs">
              <button
                onClick={() => setActiveTab('inventory')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'inventory'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package className="h-4 w-4" />
                <span>My Stock ({inventory.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('verify')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'verify'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Verify Hold</span>
              </button>

              <button
                onClick={() => setActiveTab('prescriptions')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'prescriptions'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span>Rx Broadcasts</span>
              </button>
            </div>

            {/* TAB 1: INVENTORY & STOCK MANAGER */}
            {activeTab === 'inventory' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">
                      {session.pharmacy.name} Stock Manager
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Changes update live across the Addis Ababa patient search network.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsAddOpen(!isAddOpen)}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-xs font-bold text-white shadow-xs transition"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Upload Drug to Stock</span>
                  </button>
                </div>

                {/* Upload Medicine Drawer/Form */}
                {isAddOpen && (
                  <form
                    onSubmit={handleUploadMedicine}
                    className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/70 p-4 space-y-3 animate-in fade-in"
                  >
                    <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                      <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                        <Plus className="h-4 w-4 text-emerald-700" />
                        <span>Upload Medicine to Dispensary Stock</span>
                      </h4>
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                        {session.pharmacy.subCity}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Select Medicine from Catalog *
                        </label>
                        <select
                          value={newMedId}
                          onChange={(e) => {
                            setNewMedId(e.target.value);
                            const found = catalogMedicines.find((m) => m.id === e.target.value);
                            if (found) setNewMedPrice(String(found.standard_retail_price || found.standardPriceEtb || ''));
                          }}
                          required
                          className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
                        >
                          <option value="">Choose medicine...</option>
                          {catalogMedicines.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.brand_name || m.brandName} ({m.strength}) {m.is_scarce || m.isScarce ? '🔥 [Scarce]' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Retail Price in ETB *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={newMedPrice}
                          onChange={(e) => setNewMedPrice(e.target.value)}
                          placeholder="e.g. 2850"
                          className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Stock Status
                        </label>
                        <select
                          value={newMedStatus}
                          onChange={(e) => setNewMedStatus(e.target.value as StockStatus)}
                          className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
                        >
                          <option value="in_stock">In Stock (Available)</option>
                          <option value="low_stock">Low Stock (Few Left)</option>
                          <option value="out_of_stock">Out of Stock</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Quantity on Shelf
                        </label>
                        <input
                          type="number"
                          value={newMedQty}
                          onChange={(e) => setNewMedQty(e.target.value)}
                          placeholder="15"
                          className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1 border-t border-emerald-200">
                      <button
                        type="button"
                        onClick={() => setIsAddOpen(false)}
                        className="rounded-xl bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-xl bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800"
                      >
                        Publish to Live Radar
                      </button>
                    </div>
                  </form>
                )}

                {/* Stock Items List */}
                {isLoading ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    <span>Loading your dispensary inventory...</span>
                  </div>
                ) : inventory.length === 0 ? (
                  <div className="rounded-2xl bg-white p-8 text-center text-xs text-slate-500 border border-slate-200 space-y-2">
                    <Package className="h-8 w-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-700">No medicines in stock yet</p>
                    <p className="text-slate-400 max-w-xs mx-auto text-[11px]">
                      Click "Upload Drug to Stock" above to publish your first scarce or essential medicine.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {inventory.map((item) => (
                      <div
                        key={item.id || item.medicineId}
                        className="rounded-2xl bg-white border border-slate-200 p-3.5 shadow-xs space-y-2.5"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-sm text-slate-900">
                                {item.medicine.brandName}
                              </h4>
                              {item.medicine.isScarce && (
                                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                                  Scarce Radar
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                              {item.medicine.genericName} • {item.medicine.strength}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Dosage: {item.medicine.dosageForm} | Verified: {item.lastVerifiedAt || 'Recently'}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">Unit Price (ETB)</span>
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                step="0.01"
                                defaultValue={item.unitPrice}
                                onBlur={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (val && val !== item.unitPrice) {
                                    handlePriceUpdate(item.medicineId, val);
                                  }
                                }}
                                className="w-20 text-right font-black text-sm text-slate-900 bg-slate-50 rounded border border-slate-200 px-1.5 py-0.5 focus:bg-white focus:border-emerald-500"
                              />
                              <span className="text-[10px] font-bold text-slate-500">ETB</span>
                            </div>
                          </div>
                        </div>

                        {/* Stock Status Buttons */}
                        <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                          <span className="text-slate-500 font-medium text-[11px]">
                            Live Stock Status:
                          </span>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleStockUpdate(item.medicineId, 'in_stock')}
                              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                                item.stockStatus === 'in_stock'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              In Stock
                            </button>
                            <button
                              onClick={() => handleStockUpdate(item.medicineId, 'low_stock')}
                              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                                item.stockStatus === 'low_stock'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Low Stock
                            </button>
                            <button
                              onClick={() => handleStockUpdate(item.medicineId, 'out_of_stock')}
                              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                                item.stockStatus === 'out_of_stock'
                                  ? 'bg-red-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Out of Stock
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: VERIFY HOLD CODE */}
            {activeTab === 'verify' && (
              <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-800">
                    Verify Patient 2-Hour Reservation Code
                  </h2>
                  <p className="text-xs text-slate-500">
                    When a patient arrives at your counter, enter their reservation code (e.g. MED-4912) to verify their hold and fee payment.
                  </p>
                </div>

                <form onSubmit={handleVerifyCode} className="flex gap-2">
                  <input
                    type="text"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
                    placeholder="Enter Code (e.g. MED-4912)"
                    required
                    className="flex-1 uppercase font-mono tracking-wider text-base font-bold rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={verifying}
                    className="rounded-xl bg-emerald-700 hover:bg-emerald-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition"
                  >
                    {verifying ? 'Checking...' : 'Verify Code'}
                  </button>
                </form>

                {verifyError && (
                  <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                    <span>{verifyError}</span>
                  </div>
                )}

                {verifiedReservation && (
                  <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/50 p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xl font-black text-emerald-950">
                          {verifiedReservation.reservationCode}
                        </span>
                        <h3 className="font-bold text-base text-slate-900 mt-1">
                          {verifiedReservation.medicineName} ({verifiedReservation.strength})
                        </h3>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          verifiedReservation.isExpired
                            ? 'bg-red-200 text-red-800'
                            : verifiedReservation.reservationStatus === 'dispensed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-200 text-emerald-900'
                        }`}
                      >
                        {verifiedReservation.reservationStatus.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 border-t border-emerald-200 pt-2">
                      <div>
                        <span className="text-slate-400 block">Patient Name</span>
                        <span className="font-semibold">{verifiedReservation.patientName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Patient Phone</span>
                        <a
                          href={`tel:${verifiedReservation.patientPhone}`}
                          className="font-bold text-emerald-800 underline"
                        >
                          {verifiedReservation.patientPhone}
                        </a>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Reservation Fee</span>
                        <span className="font-semibold text-emerald-800">
                          {verifiedReservation.holdFeeEtb} ETB ({verifiedReservation.paymentProvider})
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Hold Expiration</span>
                        <span className="font-semibold text-amber-800">
                          {new Date(verifiedReservation.expiresAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    {verifiedReservation.reservationStatus === 'active' && (
                      <button
                        onClick={() => handleDispense(verifiedReservation.reservationCode)}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-800 transition active:scale-[0.98]"
                      >
                        <Check className="h-4 w-4" />
                        <span>Dispense Medicine & Close Hold</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PRESCRIPTION BROADCASTS */}
            {activeTab === 'prescriptions' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">
                      Prescription Broadcasts in {session.pharmacy.subCity}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Patients in your area looking for rare medicines. Call to confirm stock.
                    </p>
                  </div>
                  <button
                    onClick={() => fetchPrescriptions()}
                    className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs"
                    title="Refresh prescriptions"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loadingRx ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {loadingRx ? (
                  <div className="p-8 text-center text-xs text-slate-400">Loading broadcasts...</div>
                ) : prescriptions.length === 0 ? (
                  <div className="rounded-2xl bg-white p-8 text-center text-xs text-slate-500 border border-slate-200">
                    No active prescription requests in {session.pharmacy.subCity} at the moment.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {prescriptions.map((rx) => (
                      <div
                        key={rx.id}
                        className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              {rx.preferredSubCity?.toUpperCase() || session.pharmacy.subCity.toUpperCase()}
                            </span>
                            <h4 className="font-bold text-sm text-slate-900 mt-1">
                              {rx.patientName || 'Patient Request'}
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              {new Date(rx.createdAt).toLocaleString()}
                            </p>
                          </div>

                          <a
                            href={`tel:${rx.patientPhone}`}
                            className="flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            <span>Call Patient</span>
                          </a>
                        </div>

                        {rx.notes && (
                          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <strong className="text-slate-700">Patient Note:</strong> {rx.notes}
                          </p>
                        )}

                        {rx.imageUrl && (
                          <div className="relative rounded-xl border border-slate-200 overflow-hidden max-h-48 bg-slate-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={rx.imageUrl}
                              alt="Doctor Prescription"
                              className="w-full h-full object-contain max-h-48"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
