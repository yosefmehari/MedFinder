'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Building2,
  Package,
  Clock,
  Plus,
  AlertCircle,
  Phone,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Lock,
  User,
  MapPin,
  LogOut,
  Loader2,
  KeyRound,
  FileBadge,
  CreditCard,
  Calendar,
  Check,
  X,
  Search,
  SlidersHorizontal,
  Flame,
  Tag,
  DollarSign,
  TrendingUp,
  Megaphone,
  Save,
  Trash2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { ADDIS_SUB_CITIES } from '@/lib/constants';
import { SubscriptionPlan, PharmacySubscription, PlatformSettings } from '@/lib/types';

interface AdminSession {
  user: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    role: string;
  };
}

interface PharmacyRow {
  id: string;
  name: string;
  licenseNumber: string;
  subCity: string;
  woreda?: string;
  streetAddress: string;
  landmark?: string;
  phoneNumber: string;
  is24Hours: boolean;
  isVerified: boolean;
  verificationStatus: string;
  rating?: number;
  ownerName?: string;
  ownerPhone?: string;
  inventoryCount?: number;
  activePlanName?: string;
  subscriptionStatus?: string;
  subscriptionExpiresAt?: string;
}

interface MedicineRow {
  id: string;
  brandName: string;
  genericName: string;
  dosageForm: string;
  strength: string;
  manufacturer?: string;
  category: string;
  isScarce: boolean;
  requiresPrescription: boolean;
  standardPriceEtb: number;
  description?: string;
  stockingPharmaciesCount?: number;
}

export default function AdminPage() {
  // Session & Authentication
  const [session, setSession] = useState<AdminSession | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginPhone, setLoginPhone] = useState('0911223344');
  const [loginPassword, setLoginPassword] = useState('admin123');

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'pharmacies' | 'medicines' | 'reservations' | 'settings'>('overview');

  // Dashboard Overview state
  const [stats, setStats] = useState<any>({
    totalPharmacies: 0,
    verifiedPharmacies: 0,
    pendingPharmacies: 0,
    activeSubscriptions: 0,
    totalRevenueEtb: 0,
    totalMedicines: 0,
    scarceMedicines: 0,
    totalReservations: 0,
    activeHolds: 0,
    totalPrescriptions: 0,
  });
  const [recentReservations, setRecentReservations] = useState<any[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
    holdFeeEtb: 20.0,
    announcement: { active: false, message: '' },
    allowNewRegistrations: true,
  });

  // Subscriptions & Plans state
  const [subscriptions, setSubscriptions] = useState<PharmacySubscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [pharmaciesList, setPharmaciesList] = useState<PharmacyRow[]>([]);
  const [isAddSubOpen, setIsAddSubOpen] = useState(false);
  const [subFilter, setSubFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [subSearch, setSubSearch] = useState('');

  // Add Subscription Form State ("Add subscription by myself")
  const [selectedPharmaId, setSelectedPharmaId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [customPlanName, setCustomPlanName] = useState('Pro Dispensary Radar');
  const [customPriceEtb, setCustomPriceEtb] = useState('650');
  const [customDurationDays, setCustomDurationDays] = useState('30');
  const [customPaymentMethod, setCustomPaymentMethod] = useState('cbe_transfer');
  const [customPaymentRef, setCustomPaymentRef] = useState('');
  const [customAdminNotes, setCustomAdminNotes] = useState('');
  const [autoVerifyOnSub, setAutoVerifyOnSub] = useState(true);
  const [savingSub, setSavingSub] = useState(false);

  // Pharmacies Management State
  const [pharmaSearch, setPharmaSearch] = useState('');
  const [pharmaSubCityFilter, setPharmaSubCityFilter] = useState<string>('all');
  const [pharmaStatusFilter, setPharmaStatusFilter] = useState<'all' | 'verified' | 'pending'>('all');
  const [isAddPharmaOpen, setIsAddPharmaOpen] = useState(false);
  const [newPharmaName, setNewPharmaName] = useState('');
  const [newPharmaSubCity, setNewPharmaSubCity] = useState('Bole');
  const [newPharmaWoreda, setNewPharmaWoreda] = useState('Woreda 03');
  const [newPharmaAddress, setNewPharmaAddress] = useState('');
  const [newPharmaPhone, setNewPharmaPhone] = useState('0911');
  const [newPharmaLicense, setNewPharmaLicense] = useState('');
  const [newPharmaIs24H, setNewPharmaIs24H] = useState(false);

  // Medicines Management State
  const [medicines, setMedicines] = useState<MedicineRow[]>([]);
  const [medSearch, setMedSearch] = useState('');
  const [medScarceFilter, setMedScarceFilter] = useState<'all' | 'scarce' | 'normal'>('all');
  const [isAddMedOpen, setIsAddMedOpen] = useState(false);
  const [newMedBrand, setNewMedBrand] = useState('');
  const [newMedGeneric, setNewMedGeneric] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('Tablet');
  const [newMedStrength, setNewMedStrength] = useState('500mg');
  const [newMedCategory, setNewMedCategory] = useState('Cardiovascular');
  const [newMedPrice, setNewMedPrice] = useState('450');
  const [newMedIsScarce, setNewMedIsScarce] = useState(false);
  const [newMedDescription, setNewMedDescription] = useState('');

  // Plans Management State
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanCode, setNewPlanCode] = useState('');
  const [newPlanPrice, setNewPlanPrice] = useState('500');
  const [newPlanDuration, setNewPlanDuration] = useState('30');
  const [newPlanDescription, setNewPlanDescription] = useState('');
  const [newPlanFeatures, setNewPlanFeatures] = useState('Priority search boost, Verified badge, Unlimited stock');

  // Password changer state
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  // Global UI State
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Restore session from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('medfinder_admin_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.user?.role === 'super_admin') {
          setSession(parsed);
        }
      }
    } catch (e) {
      console.warn('Could not read admin session:', e);
    }
  }, []);

  // Fetch Dashboard & Overview Data
  const loadOverviewData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/overview');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        if (data.recentReservations) setRecentReservations(data.recentReservations);
        if (data.settings) setPlatformSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to load overview data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Subscriptions & Plans
  const loadSubscriptionsData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/subscriptions');
      const data = await res.json();
      if (data.success) {
        setSubscriptions(data.subscriptions || []);
        if (data.plans) setPlans(data.plans);
        if (data.pharmacies) setPharmaciesList(data.pharmacies);
      }
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Pharmacies
  const loadPharmaciesData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/pharmacies');
      const data = await res.json();
      if (data.success) {
        setPharmaciesList(data.pharmacies || []);
      }
    } catch (err) {
      console.error('Failed to load pharmacies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Medicines
  const loadMedicinesData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/medicines');
      const data = await res.json();
      if (data.success) {
        setMedicines(data.medicines || []);
      }
    } catch (err) {
      console.error('Failed to load medicines:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when active tab changes or session is loaded
  useEffect(() => {
    if (!session) return;
    if (activeTab === 'overview') loadOverviewData();
    if (activeTab === 'subscriptions') loadSubscriptionsData();
    if (activeTab === 'pharmacies') loadPharmaciesData();
    if (activeTab === 'medicines') loadMedicinesData();
    if (activeTab === 'reservations') loadOverviewData();
  }, [session, activeTab]);

  // Handle Super Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          identifier: loginPhone.trim(),
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed.');
      }

      const newSession: AdminSession = { user: data.user };
      setSession(newSession);
      localStorage.setItem('medfinder_admin_session', JSON.stringify(newSession));
      showToast('Welcome, Super Admin! Full platform control enabled.');
    } catch (err: any) {
      setAuthError(err.message || 'Login failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminLogout = () => {
    setSession(null);
    localStorage.removeItem('medfinder_admin_session');
    showToast('Signed out of Super Admin Portal.');
  };

  // Quick Demo Login helper
  const handleLoadDemoAdmin = () => {
    setLoginPhone('0911223344');
    setLoginPassword('admin123');
    showToast('Super Admin demo credentials loaded. Click "Enter Admin Portal".');
  };

  // ========================================================
  // SUBSCRIPTION MANAGEMENT ACTIONS ("add subscription by myself")
  // ========================================================
  const handlePlanSelection = (planId: string) => {
    setSelectedPlanId(planId);
    const chosenPlan = plans.find((p) => p.id === planId);
    if (chosenPlan) {
      setCustomPlanName(chosenPlan.name);
      setCustomPriceEtb(chosenPlan.priceEtb.toString());
      setCustomDurationDays(chosenPlan.durationDays.toString());
    }
  };

  const handleAddSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPharmaId) {
      alert('Please select a pharmacy.');
      return;
    }

    setSavingSub(true);
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pharmacyId: selectedPharmaId,
          planId: selectedPlanId || undefined,
          planName: customPlanName.trim(),
          pricePaidEtb: parseFloat(customPriceEtb) || 0,
          durationDays: parseInt(customDurationDays, 10) || 30,
          paymentMethod: customPaymentMethod,
          paymentReference: customPaymentRef.trim() || undefined,
          adminNotes: customAdminNotes.trim() || undefined,
          autoVerifyPharmacy: autoVerifyOnSub,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add subscription.');
      }

      showToast(data.message || 'Subscription added successfully!');
      setIsAddSubOpen(false);
      // Reset form
      setSelectedPharmaId('');
      setCustomPaymentRef('');
      setCustomAdminNotes('');
      // Reload subscriptions & pharmacies
      loadSubscriptionsData();
    } catch (err: any) {
      alert(err.message || 'Error creating subscription');
    } finally {
      setSavingSub(false);
    }
  };

  // Extend subscription +30 days
  const handleExtendSubscription = async (subId: string, days: number = 30) => {
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: subId,
          action: 'renew',
          extensionDays: days,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Subscription extended by ${days} days!`);
        loadSubscriptionsData();
      } else {
        alert(data.error || 'Failed to extend subscription.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete subscription
  const handleDeleteSubscription = async (subId: string) => {
    if (!confirm('Are you sure you want to remove this subscription record?')) return;
    try {
      const res = await fetch(`/api/admin/subscriptions?id=${subId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Subscription deleted.');
        setSubscriptions((prev) => prev.filter((s) => s.id !== subId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Add Subscription modal pre-filled for a specific pharmacy
  const handleAssignSubForPharma = (pharmaId: string) => {
    setSelectedPharmaId(pharmaId);
    if (plans.length > 0) {
      handlePlanSelection(plans[1]?.id || plans[0].id);
    }
    setIsAddSubOpen(true);
    setActiveTab('subscriptions');
  };

  // Create new Subscription Plan
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const featureList = newPlanFeatures.split(',').map((f) => f.trim()).filter(Boolean);
      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPlanName.trim(),
          code: newPlanCode.trim() || undefined,
          priceEtb: parseFloat(newPlanPrice) || 0,
          durationDays: parseInt(newPlanDuration, 10) || 30,
          description: newPlanDescription.trim(),
          features: featureList,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Subscription Plan created successfully!');
        setIsAddPlanOpen(false);
        setNewPlanName('');
        setNewPlanCode('');
        loadSubscriptionsData();
      } else {
        alert(data.error || 'Failed to create plan.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ========================================================
  // PHARMACY MANAGEMENT ACTIONS
  // ========================================================
  const handleToggleVerification = async (pharmaId: string, currentVerified: boolean) => {
    try {
      const res = await fetch('/api/admin/pharmacies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pharmaId,
          isVerified: !currentVerified,
        }),
      });
      if (res.ok) {
        setPharmaciesList((prev) =>
          prev.map((p) =>
            p.id === pharmaId
              ? { ...p, isVerified: !currentVerified, verificationStatus: !currentVerified ? 'approved' : 'pending' }
              : p
          )
        );
        showToast(!currentVerified ? 'Pharmacy verified & approved!' : 'Pharmacy verification revoked.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePharmacy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/pharmacies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPharmaName.trim(),
          subCity: newPharmaSubCity,
          woreda: newPharmaWoreda.trim(),
          streetAddress: newPharmaAddress.trim(),
          phoneNumber: newPharmaPhone.trim(),
          licenseNumber: newPharmaLicense.trim() || undefined,
          is24Hours: newPharmaIs24H,
          isVerified: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('New pharmacy registered and verified!');
        setIsAddPharmaOpen(false);
        setNewPharmaName('');
        setNewPharmaAddress('');
        loadPharmaciesData();
      } else {
        alert(data.error || 'Failed to register pharmacy');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePharmacy = async (pharmaId: string) => {
    if (!confirm('Are you sure you want to delete this pharmacy? This will also remove its inventory and subscriptions.')) return;
    try {
      const res = await fetch(`/api/admin/pharmacies?id=${pharmaId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Pharmacy deleted.');
        setPharmaciesList((prev) => prev.filter((p) => p.id !== pharmaId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ========================================================
  // MEDICINES CATALOG MANAGEMENT ACTIONS
  // ========================================================
  const handleToggleScarce = async (medId: string, currentScarce: boolean) => {
    try {
      const res = await fetch('/api/admin/medicines', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: medId,
          isScarce: !currentScarce,
        }),
      });
      if (res.ok) {
        setMedicines((prev) =>
          prev.map((m) => (m.id === medId ? { ...m, isScarce: !currentScarce } : m))
        );
        showToast(!currentScarce ? 'Marked as SCARCE on Addis Radar!' : 'Removed scarce priority flag.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: newMedBrand.trim(),
          genericName: newMedGeneric.trim(),
          dosageForm: newMedDosage,
          strength: newMedStrength.trim(),
          category: newMedCategory.trim(),
          standardPriceEtb: parseFloat(newMedPrice) || 100,
          isScarce: newMedIsScarce,
          description: newMedDescription.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Medicine added to global Addis catalog!');
        setIsAddMedOpen(false);
        setNewMedBrand('');
        setNewMedGeneric('');
        loadMedicinesData();
      } else {
        alert(data.error || 'Failed to add medicine');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMedicine = async (medId: string) => {
    if (!confirm('Are you sure you want to delete this medicine from the catalog?')) return;
    try {
      const res = await fetch(`/api/admin/medicines?id=${medId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Medicine removed from catalog.');
        setMedicines((prev) => prev.filter((m) => m.id !== medId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ========================================================
  // SETTINGS ACTIONS
  // ========================================================
  const handleSaveSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(platformSettings),
      });
      if (res.ok) {
        showToast('Platform settings updated successfully!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id || newAdminPassword.length < 4) {
      alert('Password must be at least 4 characters long.');
      return;
    }
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_password',
          userId: session.user.id,
          newPassword: newAdminPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordChangeSuccess(true);
        setNewAdminPassword('');
        showToast('Super Admin password successfully changed!');
      } else {
        alert(data.error || 'Failed to update password');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered subscriptions
  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (subFilter === 'active' && sub.status !== 'active') return false;
    if (subFilter === 'expired' && sub.status !== 'expired') return false;
    if (subSearch) {
      const q = subSearch.toLowerCase();
      const pharmaName = (sub.pharmacyName || '').toLowerCase();
      const planName = (sub.planName || '').toLowerCase();
      const ref = (sub.paymentReference || '').toLowerCase();
      return pharmaName.includes(q) || planName.includes(q) || ref.includes(q);
    }
    return true;
  });

  // Filtered pharmacies
  const filteredPharmacies = pharmaciesList.filter((p) => {
    if (pharmaStatusFilter === 'verified' && !p.isVerified) return false;
    if (pharmaStatusFilter === 'pending' && p.isVerified) return false;
    if (pharmaSubCityFilter !== 'all' && p.subCity.toLowerCase() !== pharmaSubCityFilter.toLowerCase()) return false;
    if (pharmaSearch) {
      const q = pharmaSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.phoneNumber.includes(q) ||
        (p.licenseNumber || '').toLowerCase().includes(q) ||
        p.streetAddress.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filtered medicines
  const filteredMedicines = medicines.filter((m) => {
    if (medScarceFilter === 'scarce' && !m.isScarce) return false;
    if (medScarceFilter === 'normal' && m.isScarce) return false;
    if (medSearch) {
      const q = medSearch.toLowerCase();
      return (
        m.brandName.toLowerCase().includes(q) ||
        m.genericName.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // ========================================================
  // RENDER: IF NOT AUTHENTICATED -> SHOW ADMIN LOGIN
  // ========================================================
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 shadow-xl shadow-emerald-950/50">
              <ShieldCheck className="h-9 w-9 text-slate-950" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">MedFinder Super Admin</h1>
            <p className="text-xs text-slate-400">
              Control platform settings, verify pharmacies, and manage dispensary subscriptions
            </p>
          </div>

          {/* Login Card */}
          <div className="rounded-3xl bg-slate-800/90 border border-slate-700/80 p-6 shadow-2xl backdrop-blur-md space-y-5">
            <div>
              <h2 className="font-bold text-white text-base">Super Admin Sign In</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Enter your authorized credentials to access master controls.
              </p>
            </div>

            {authError && (
              <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-3.5 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Admin Phone or Email
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Phone className="h-4 w-4 text-amber-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="0911223344 or admin@medfinder.et"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-2.5 pl-9 pr-3 text-xs font-medium text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Admin Master Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <KeyRound className="h-4 w-4 text-amber-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-2.5 pl-9 pr-3 text-xs font-medium text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-950/40 hover:opacity-95 transition active:scale-[0.98] disabled:opacity-60"
              >
                {authLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                    <span>Verifying Access...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>Enter Admin Portal</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Fill Helper */}
            <div className="pt-3 border-t border-slate-700/60">
              <button
                type="button"
                onClick={handleLoadDemoAdmin}
                className="w-full py-2 px-3 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>One-Click Demo Admin Credentials</span>
              </button>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to MedFinder Search</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // RENDER: SUPER ADMIN PORTAL DASHBOARD
  // ========================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 rounded-2xl bg-emerald-600 text-white px-4 py-3 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom duration-300 border border-emerald-400/40">
          <CheckCircle2 className="h-4 w-4 text-emerald-200 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 shadow-md shadow-emerald-950/40">
              <ShieldCheck className="h-6 w-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-white tracking-tight">MedFinder Admin</span>
                <span className="rounded-md bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  Super Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Addis Ababa Central Medicine & Dispensary Management Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition"
            >
              <ExternalLink className="h-3.5 w-3.5 text-emerald-400" />
              <span>Patient App</span>
            </Link>

            <Link
              href="/pharmacy"
              className="hidden sm:flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition"
            >
              <Building2 className="h-3.5 w-3.5 text-amber-400" />
              <span>Dispensary</span>
            </Link>

            <button
              onClick={() => {
                if (activeTab === 'overview') loadOverviewData();
                if (activeTab === 'subscriptions') loadSubscriptionsData();
                if (activeTab === 'pharmacies') loadPharmaciesData();
                if (activeTab === 'medicines') loadMedicinesData();
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Refresh Current View"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            <button
              onClick={handleAdminLogout}
              className="flex items-center gap-1.5 rounded-xl bg-red-600/80 hover:bg-red-700 px-3 py-1.5 text-xs font-bold text-white transition active:scale-95"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mx-auto max-w-7xl px-4 flex gap-1 overflow-x-auto no-scrollbar border-t border-slate-800/60 pt-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-3.5 text-xs font-bold rounded-t-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`py-2 px-3.5 text-xs font-bold rounded-t-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'subscriptions'
                ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>Subscriptions ({subscriptions.length})</span>
            <span className="rounded-full bg-emerald-500/20 px-1.5 text-[10px] text-emerald-300 font-extrabold">
              Active
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pharmacies')}
            className={`py-2 px-3.5 text-xs font-bold rounded-t-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'pharmacies'
                ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Pharmacies & Verification</span>
          </button>

          <button
            onClick={() => setActiveTab('medicines')}
            className={`py-2 px-3.5 text-xs font-bold rounded-t-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'medicines'
                ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Medicines Catalog</span>
          </button>

          <button
            onClick={() => setActiveTab('reservations')}
            className={`py-2 px-3.5 text-xs font-bold rounded-t-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'reservations'
                ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>2-Hour Holds & Orders</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-3.5 text-xs font-bold rounded-t-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Megaphone className="h-4 w-4" />
            <span>Settings & Banners</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl px-4 py-6 flex-1 space-y-6">
        {/* ======================================================== */}
        {/* TAB 1: DASHBOARD OVERVIEW                                */}
        {/* ======================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Pharmacies */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Pharmacies</span>
                  <Building2 className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white">{stats.totalPharmacies}</div>
                <p className="text-[11px] text-emerald-400 font-semibold">
                  {stats.verifiedPharmacies} verified ({stats.pendingPharmacies} pending)
                </p>
              </div>

              {/* Active Subscriptions */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Active Subscriptions</span>
                  <CreditCard className="h-4 w-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-400">{stats.activeSubscriptions}</div>
                <p className="text-[11px] text-slate-400 font-semibold">
                  {stats.totalRevenueEtb.toLocaleString()} ETB collected
                </p>
              </div>

              {/* Medicines Catalog */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Medicines Catalog</span>
                  <Package className="h-4 w-4 text-teal-400" />
                </div>
                <div className="text-2xl font-black text-white">{stats.totalMedicines}</div>
                <p className="text-[11px] text-red-400 font-semibold flex items-center gap-1">
                  <Flame className="h-3 w-3 text-red-400" />
                  <span>{stats.scarceMedicines} scarce in Addis</span>
                </p>
              </div>

              {/* 2-Hour Holds */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Total Reservations</span>
                  <Clock className="h-4 w-4 text-sky-400" />
                </div>
                <div className="text-2xl font-black text-white">{stats.totalReservations}</div>
                <p className="text-[11px] text-sky-400 font-semibold">
                  {stats.activeHolds} active 2-hour holds
                </p>
              </div>
            </div>

            {/* Quick Action Shortcuts Banner */}
            <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 border border-slate-800 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center md:text-left">
                <h3 className="font-bold text-white text-base flex items-center gap-2 justify-center md:justify-start">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  <span>Quick Admin Controls</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Manually add pharmacy subscriptions, approve licenses, or flag scarce drugs on the Addis radar.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => {
                    setIsAddSubOpen(true);
                    setActiveTab('subscriptions');
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 text-xs font-black shadow-lg shadow-amber-950/40 transition active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Add Subscription By Myself</span>
                </button>

                <button
                  onClick={() => {
                    setIsAddPharmaOpen(true);
                    setActiveTab('pharmacies');
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2.5 text-xs font-bold transition active:scale-95 border border-slate-700"
                >
                  <Building2 className="h-4 w-4 text-emerald-400" />
                  <span>Register Pharmacy</span>
                </button>

                <button
                  onClick={() => {
                    setIsAddMedOpen(true);
                    setActiveTab('medicines');
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2.5 text-xs font-bold transition active:scale-95 border border-slate-700"
                >
                  <Package className="h-4 w-4 text-teal-400" />
                  <span>Add Medicine</span>
                </button>
              </div>
            </div>

            {/* Recent Subscriptions & Recent Holds Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Subscriptions */}
              <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-amber-400" />
                    <h4 className="font-bold text-white text-sm">Recent Dispensary Subscriptions</h4>
                  </div>
                  <button
                    onClick={() => setActiveTab('subscriptions')}
                    className="text-xs text-amber-400 hover:underline font-semibold"
                  >
                    View All ({subscriptions.length})
                  </button>
                </div>

                <div className="space-y-2.5">
                  {recentReservations.length === 0 && subscriptions.length === 0 && (
                    <p className="text-xs text-slate-500 py-4 text-center">No subscriptions recorded yet.</p>
                  )}
                  {subscriptions.slice(0, 4).map((sub) => (
                    <div
                      key={sub.id}
                      className="rounded-2xl bg-slate-800/70 border border-slate-800 p-3.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">{sub.pharmacyName}</span>
                          <span className="text-[10px] text-slate-400">({sub.pharmacySubCity})</span>
                        </div>
                        <p className="text-[11px] text-amber-300 font-medium mt-0.5">{sub.planName}</p>
                        <span className="text-[10px] text-slate-400">
                          Expires: {new Date(sub.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block font-black text-white">{sub.pricePaidEtb} ETB</span>
                        <span className="inline-block rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold uppercase mt-1">
                          {sub.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent 2-Hour Holds */}
              <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-sky-400" />
                    <h4 className="font-bold text-white text-sm">Recent 2-Hour Patient Holds</h4>
                  </div>
                  <button
                    onClick={() => setActiveTab('reservations')}
                    className="text-xs text-sky-400 hover:underline font-semibold"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-2.5">
                  {recentReservations.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      No active patient holds recorded yet.
                    </p>
                  ) : (
                    recentReservations.slice(0, 4).map((res) => (
                      <div
                        key={res.id}
                        className="rounded-2xl bg-slate-800/70 border border-slate-800 p-3.5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800 text-[10px]">
                              {res.reservationCode}
                            </span>
                            <span className="font-bold text-white">{res.patientName}</span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            {res.medicineName} • {res.pharmacyName}
                          </p>
                          <span className="text-[10px] text-slate-400">{res.patientPhone}</span>
                        </div>
                        <div className="text-right">
                          <span className="block font-black text-emerald-400">{res.holdFeeEtb} ETB</span>
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase mt-1 ${
                              res.reservationStatus === 'active'
                                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                : 'bg-slate-700 text-slate-400'
                            }`}
                          >
                            {res.reservationStatus}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: SUBSCRIPTIONS ("add subscription by myself")      */}
        {/* ======================================================== */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            {/* Subscriptions Hero & Add Button */}
            <div className="rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-900/30 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-amber-400" />
                  <h3 className="font-bold text-lg text-white">Dispensary Subscriptions & Plans</h3>
                </div>
                <p className="text-xs text-slate-400 max-w-xl">
                  Add, renew, or grant subscriptions directly to licensed Addis Ababa pharmacies. Manage tier durations, CBE/Telebirr payment receipts, and features.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsAddPlanOpen(true)}
                  className="rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2.5 text-xs font-bold transition border border-slate-700 flex items-center gap-1.5"
                >
                  <Tag className="h-4 w-4 text-teal-400" />
                  <span>Configure Plans</span>
                </button>

                <button
                  onClick={() => {
                    setIsAddSubOpen(true);
                    if (pharmaciesList.length > 0 && !selectedPharmaId) {
                      setSelectedPharmaId(pharmaciesList[0].id);
                    }
                  }}
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:opacity-95 text-slate-950 px-4 py-2.5 text-xs font-black shadow-lg shadow-amber-950/40 transition active:scale-95 flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Add Subscription By Myself</span>
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={subSearch}
                  onChange={(e) => setSubSearch(e.target.value)}
                  placeholder="Search pharmacy, plan, receipt..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <span className="text-xs text-slate-500 mr-1">Status:</span>
                {(['all', 'active', 'expired'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSubFilter(filter)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition ${
                      subFilter === filter
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Subscriptions Table */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Pharmacy</th>
                      <th className="py-3 px-4">Plan Name</th>
                      <th className="py-3 px-4">Fee Paid</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4">Valid Until</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredSubscriptions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          No subscriptions matching criteria. Click "+ Add Subscription By Myself" to create one.
                        </td>
                      </tr>
                    ) : (
                      filteredSubscriptions.map((sub) => {
                        const isExpired = sub.status === 'expired' || new Date(sub.expiresAt) < new Date();
                        const daysLeft = sub.daysRemaining !== undefined ? sub.daysRemaining : Math.ceil((new Date(sub.expiresAt).getTime() - Date.now()) / (1000 * 86400));

                        return (
                          <tr key={sub.id} className="hover:bg-slate-800/40 transition">
                            <td className="py-3 px-4">
                              <div className="font-bold text-white">{sub.pharmacyName}</div>
                              <div className="text-[11px] text-slate-400">
                                {sub.pharmacySubCity} • {sub.pharmacyPhone}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-semibold text-amber-300">
                              {sub.planName}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                              {sub.pricePaidEtb} ETB
                            </td>
                            <td className="py-3 px-4">
                              <span className="capitalize font-medium text-slate-200">
                                {sub.paymentMethod.replace('_', ' ')}
                              </span>
                              {sub.paymentReference && (
                                <span className="block font-mono text-[10px] text-slate-400">
                                  Ref: {sub.paymentReference}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-white font-medium">
                                {new Date(sub.expiresAt).toLocaleDateString()}
                              </div>
                              <div className="text-[10px]">
                                {daysLeft > 0 ? (
                                  <span className="text-emerald-400 font-semibold">{daysLeft} days left</span>
                                ) : (
                                  <span className="text-red-400 font-semibold">Expired</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                  !isExpired
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}
                              >
                                {!isExpired ? 'Active' : 'Expired'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleExtendSubscription(sub.id, 30)}
                                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold transition"
                                  title="Renew & extend by 30 days"
                                >
                                  +30 Days
                                </button>
                                <button
                                  onClick={() => handleDeleteSubscription(sub.id)}
                                  className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                                  title="Delete subscription"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Active Plans Catalog Display */}
            <div className="space-y-3 pt-4">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Tag className="h-4 w-4 text-teal-400" />
                <span>Configured Subscription Tier Plans</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {plans.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-black text-white text-sm">{p.name}</span>
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-900">
                          {p.durationDays}d
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                      <div className="mt-3 text-lg font-black text-emerald-400">
                        {p.priceEtb} ETB
                        <span className="text-xs text-slate-500 font-normal"> / cycle</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        handlePlanSelection(p.id);
                        setIsAddSubOpen(true);
                      }}
                      className="w-full mt-2 py-1.5 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 text-xs font-bold transition"
                    >
                      Assign Plan
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: PHARMACIES & VERIFICATION                         */}
        {/* ======================================================== */}
        {activeTab === 'pharmacies' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg text-white">Registered Addis Ababa Pharmacies</h3>
                <p className="text-xs text-slate-400">
                  Review licenses, toggle EFDA verification status, and attach subscription plans.
                </p>
              </div>

              <button
                onClick={() => setIsAddPharmaOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 px-4 py-2.5 text-xs font-black shadow-lg shadow-emerald-950/40 transition active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>+ Register New Pharmacy</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={pharmaSearch}
                  onChange={(e) => setPharmaSearch(e.target.value)}
                  placeholder="Search by name, address, phone..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <select
                  value={pharmaSubCityFilter}
                  onChange={(e) => setPharmaSubCityFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="all">All Addis Sub-Cities</option>
                  {ADDIS_SUB_CITIES.map((s) => (
                    <option key={s.id} value={s.nameEn}>
                      {s.nameEn} ({s.nameAm})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-1.5">
                {(['all', 'verified', 'pending'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setPharmaStatusFilter(filter)}
                    className={`flex-1 rounded-xl py-2 text-xs font-bold capitalize transition ${
                      pharmaStatusFilter === filter
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Pharmacies List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPharmacies.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-500">
                  No pharmacies found matching filters.
                </div>
              ) : (
                filteredPharmacies.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-3xl bg-slate-900 border border-slate-800 p-5 space-y-4 flex flex-col justify-between hover:border-slate-700 transition"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-white text-sm">{p.name}</h4>
                          <span className="font-mono text-[10px] text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/50">
                            {p.licenseNumber}
                          </span>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                            p.isVerified
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {p.isVerified ? 'Verified' : 'Pending'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          <span>
                            {p.subCity} • {p.streetAddress}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          <span className="font-mono">{p.phoneNumber}</span>
                        </div>
                      </div>

                      {/* Subscription badge */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">Subscription:</span>
                        {p.activePlanName ? (
                          <span className="font-semibold text-amber-400 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-900/40 text-[11px]">
                            {p.activePlanName}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">No Active Plan</span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleToggleVerification(p.id, p.isVerified)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                            p.isVerified
                              ? 'bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>{p.isVerified ? 'Revoke' : 'Approve'}</span>
                        </button>

                        <button
                          onClick={() => handleAssignSubForPharma(p.id)}
                          className="py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 text-xs font-bold transition flex items-center justify-center gap-1"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          <span>+ Subscribe</span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleDeletePharmacy(p.id)}
                        className="w-full py-1 text-[11px] text-slate-500 hover:text-red-400 transition"
                      >
                        Delete Pharmacy Profile
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: MEDICINES CATALOG & SCARCITY RADAR                */}
        {/* ======================================================== */}
        {activeTab === 'medicines' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg text-white">Addis Ababa Medicines Catalog</h3>
                <p className="text-xs text-slate-400">
                  Control drug classifications, standard retail ETB pricing, and scarcity radar flags.
                </p>
              </div>

              <button
                onClick={() => setIsAddMedOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 px-4 py-2.5 text-xs font-black shadow-lg shadow-teal-950/40 transition active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>+ Add Medicine to Catalog</span>
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={medSearch}
                  onChange={(e) => setMedSearch(e.target.value)}
                  placeholder="Search brand, generic name, category..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                {(['all', 'scarce', 'normal'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setMedScarceFilter(filter)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition ${
                      medScarceFilter === filter
                        ? 'bg-teal-500 text-slate-950'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {filter === 'scarce' ? '🔥 Scarce Only' : filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Medicines Table */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Medicine Brand & Generic</th>
                      <th className="py-3 px-4">Form & Strength</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Estimated Price</th>
                      <th className="py-3 px-4">Scarcity Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredMedicines.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{m.brandName}</div>
                          <div className="text-[11px] text-slate-400 italic">{m.genericName}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {m.dosageForm} ({m.strength})
                        </td>
                        <td className="py-3 px-4 text-slate-400">{m.category}</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                          {m.standardPriceEtb} ETB
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleScarce(m.id, m.isScarce)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition ${
                              m.isScarce
                                ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            {m.isScarce ? '🔥 Scarce Radar' : 'Standard'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteMedicine(m.id)}
                            className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                            title="Remove drug from catalog"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: 2-HOUR RESERVATIONS & ORDERS                      */}
        {/* ======================================================== */}
        {activeTab === 'reservations' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-lg text-white">Customer 2-Hour Holds & Orders</h3>
              <p className="text-xs text-slate-400">
                Live monitoring of pay-to-unlock customer reservations and inventory locks across Addis Ababa dispensaries.
              </p>
            </div>

            <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Hold Code</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Medicine</th>
                      <th className="py-3 px-4">Pharmacy</th>
                      <th className="py-3 px-4">Fee</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Expires At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {recentReservations.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          No reservations active right now.
                        </td>
                      </tr>
                    ) : (
                      recentReservations.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4 font-mono font-bold text-amber-400">
                            {r.reservationCode}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-white">{r.patientName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{r.patientPhone}</div>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-200">{r.medicineName}</td>
                          <td className="py-3 px-4 text-slate-400">{r.pharmacyName}</td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                            {r.holdFeeEtb} ETB
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                r.reservationStatus === 'active'
                                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {r.reservationStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400">
                            {new Date(r.expiresAt).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: SETTINGS & PLATFORM CONTROLS                      */}
        {/* ======================================================== */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="font-bold text-lg text-white">Platform Settings & Web Controls</h3>
              <p className="text-xs text-slate-400">
                Configure global announcements, customer reservation hold fees, and super admin security.
              </p>
            </div>

            {/* Global Announcement Banner */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-amber-400" />
                  <h4 className="font-bold text-white text-sm">Global Announcement Banner</h4>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs font-semibold text-slate-300">Active</span>
                  <input
                    type="checkbox"
                    checked={platformSettings.announcement.active}
                    onChange={(e) =>
                      setPlatformSettings({
                        ...platformSettings,
                        announcement: {
                          ...platformSettings.announcement,
                          active: e.target.checked,
                        },
                      })
                    }
                    className="h-4 w-4 rounded accent-amber-500"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Ticker / Notice Message
                </label>
                <textarea
                  rows={2}
                  value={platformSettings.announcement.message}
                  onChange={(e) =>
                    setPlatformSettings({
                      ...platformSettings,
                      announcement: {
                        ...platformSettings.announcement,
                        message: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g. Notice: Insulin and Ventolin stock arrived in Bole Kenema today."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 text-xs font-bold transition"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Announcement</span>
                </button>
              </div>
            </div>

            {/* Hold Fee ETB Config */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-400" />
                <h4 className="font-bold text-white text-sm">Reservation Hold Fee (ETB)</h4>
              </div>
              <p className="text-xs text-slate-400">
                Amount charged to patients via Telebirr/Chapa to lock scarce medicines for 2 hours.
              </p>

              <div className="flex items-center gap-3">
                <div className="relative w-44">
                  <input
                    type="number"
                    value={platformSettings.holdFeeEtb}
                    onChange={(e) =>
                      setPlatformSettings({
                        ...platformSettings,
                        holdFeeEtb: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-sm font-bold text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="pointer-events-none absolute right-3 top-2.5 text-xs text-slate-400 font-bold">
                    ETB
                  </span>
                </div>

                <button
                  onClick={handleSaveSettings}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 text-xs font-bold transition"
                >
                  <Save className="h-4 w-4" />
                  <span>Update Hold Fee</span>
                </button>
              </div>
            </div>

            {/* Change Admin Password */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-amber-400" />
                <h4 className="font-bold text-white text-sm">Super Admin Password Security</h4>
              </div>

              {passwordChangeSuccess && (
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400">
                  Password updated successfully.
                </div>
              )}

              <form onSubmit={handleChangeAdminPassword} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    New Super Admin Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs text-white focus:border-amber-400 focus:outline-none max-w-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 text-xs font-bold transition border border-slate-700"
                >
                  <Lock className="h-4 w-4" />
                  <span>Update Password</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODAL: ADD / ASSIGN SUBSCRIPTION ("Add by myself")       */}
      {/* ======================================================== */}
      {isAddSubOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <CreditCard className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Add Subscription By Myself</h3>
                  <p className="text-[11px] text-slate-400">
                    Directly grant or attach a subscription to an Addis pharmacy.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddSubOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubscription} className="space-y-4">
              {/* Select Pharmacy */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  1. Select Target Pharmacy *
                </label>
                <select
                  required
                  value={selectedPharmaId}
                  onChange={(e) => setSelectedPharmaId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 px-3 text-xs text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="">-- Choose Addis Ababa Pharmacy --</option>
                  {pharmaciesList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.subCity} • {p.phoneNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Choose from preset plans */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  2. Choose Subscription Plan Tier
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {plans.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handlePlanSelection(p.id)}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        selectedPlanId === p.id
                          ? 'border-amber-400 bg-amber-500/10 text-white'
                          : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="block text-xs font-bold text-white">{p.name}</span>
                      <span className="block text-[11px] text-emerald-400 font-mono mt-0.5">
                        {p.priceEtb} ETB ({p.durationDays}d)
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Plan Name & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Plan Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customPlanName}
                    onChange={(e) => setCustomPlanName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 px-3 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Amount Paid (ETB) *
                  </label>
                  <input
                    type="number"
                    required
                    value={customPriceEtb}
                    onChange={(e) => setCustomPriceEtb(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 px-3 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Duration in Days */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Duration (Days from Today) *
                </label>
                <div className="flex items-center gap-2">
                  {[14, 30, 90, 180, 365].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setCustomDurationDays(d.toString())}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        customDurationDays === d.toString()
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                  <input
                    type="number"
                    value={customDurationDays}
                    onChange={(e) => setCustomDurationDays(e.target.value)}
                    placeholder="Custom days"
                    className="w-24 rounded-lg border border-slate-700 bg-slate-800 py-1 px-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Payment Method & Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={customPaymentMethod}
                    onChange={(e) => setCustomPaymentMethod(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 px-3 text-xs text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="cbe_transfer">Commercial Bank of Ethiopia (CBE)</option>
                    <option value="telebirr">Telebirr Merchant / Transfer</option>
                    <option value="cash">Direct Cash to Admin</option>
                    <option value="chapa">Chapa Payment Gateway</option>
                    <option value="complimentary">Complimentary / Free Grant</option>
                    <option value="manual_admin">Manual Admin Grant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Receipt / Transaction Ref
                  </label>
                  <input
                    type="text"
                    value={customPaymentRef}
                    onChange={(e) => setCustomPaymentRef(e.target.value)}
                    placeholder="e.g. CBE-TX-998124 or Cash"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 px-3 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Admin Internal Notes
                </label>
                <input
                  type="text"
                  value={customAdminNotes}
                  onChange={(e) => setCustomAdminNotes(e.target.value)}
                  placeholder="e.g. Paid in full for 3 months promotion"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 px-3 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Auto Verify */}
              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoVerifyOnSub}
                  onChange={(e) => setAutoVerifyOnSub(e.target.checked)}
                  className="h-4 w-4 rounded accent-emerald-500"
                />
                <span className="text-xs text-slate-300">
                  Automatically verify & approve pharmacy license upon subscription activation
                </span>
              </label>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddSubOpen(false)}
                  className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSub}
                  className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 font-bold text-xs shadow-lg transition active:scale-95 disabled:opacity-60 flex items-center gap-2"
                >
                  {savingSub ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                      <span>Activating...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Activate Pharmacy Subscription</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: REGISTER PHARMACY                                 */}
      {/* ======================================================== */}
      {isAddPharmaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Building2 className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Register New Pharmacy</h3>
                  <p className="text-[11px] text-slate-400">Add an authorized dispensary to Addis Ababa search</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddPharmaOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePharmacy} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Pharmacy Name *
                </label>
                <input
                  type="text"
                  required
                  value={newPharmaName}
                  onChange={(e) => setNewPharmaName(e.target.value)}
                  placeholder="e.g. Selam Community Pharmacy"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Addis Sub-City *
                  </label>
                  <select
                    value={newPharmaSubCity}
                    onChange={(e) => setNewPharmaSubCity(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {ADDIS_SUB_CITIES.map((s) => (
                      <option key={s.id} value={s.nameEn}>
                        {s.nameEn} ({s.nameAm})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Woreda
                  </label>
                  <input
                    type="text"
                    value={newPharmaWoreda}
                    onChange={(e) => setNewPharmaWoreda(e.target.value)}
                    placeholder="Woreda 03"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Exact Street Address & Landmark *
                </label>
                <input
                  type="text"
                  required
                  value={newPharmaAddress}
                  onChange={(e) => setNewPharmaAddress(e.target.value)}
                  placeholder="e.g. Cameroon St, near Edna Mall, Bole"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newPharmaPhone}
                    onChange={(e) => setNewPharmaPhone(e.target.value)}
                    placeholder="0911223344"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    License Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={newPharmaLicense}
                    onChange={(e) => setNewPharmaLicense(e.target.value)}
                    placeholder="EFDA-AA-2024-9988"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPharmaIs24H}
                  onChange={(e) => setNewPharmaIs24H(e.target.checked)}
                  className="h-4 w-4 rounded accent-emerald-500"
                />
                <span className="text-xs text-slate-300">Open 24 Hours / Night Pharmacy</span>
              </label>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddPharmaOpen(false)}
                  className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition active:scale-95"
                >
                  Register Pharmacy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD MEDICINE TO CATALOG                           */}
      {/* ======================================================== */}
      {isAddMedOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/20">
                  <Package className="h-5 w-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Add Medicine to Catalog</h3>
                  <p className="text-[11px] text-slate-400">Publish new drug across Addis Ababa dispensaries</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddMedOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMedicine} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newMedBrand}
                    onChange={(e) => setNewMedBrand(e.target.value)}
                    placeholder="e.g. Ventolin Evohaler"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 px-3 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Generic Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newMedGeneric}
                    onChange={(e) => setNewMedGeneric(e.target.value)}
                    placeholder="e.g. Salbutamol"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 px-3 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Dosage Form
                  </label>
                  <select
                    value={newMedDosage}
                    onChange={(e) => setNewMedDosage(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 px-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Inhaler">Inhaler</option>
                    <option value="Pen Injector">Pen Injector</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Pre-filled Syringe">Pre-filled Syringe</option>
                    <option value="Ointment">Ointment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Strength
                  </label>
                  <input
                    type="text"
                    value={newMedStrength}
                    onChange={(e) => setNewMedStrength(e.target.value)}
                    placeholder="500mg"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 px-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Price (ETB)
                  </label>
                  <input
                    type="number"
                    value={newMedPrice}
                    onChange={(e) => setNewMedPrice(e.target.value)}
                    placeholder="450"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 px-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Therapeutic Category
                </label>
                <input
                  type="text"
                  value={newMedCategory}
                  onChange={(e) => setNewMedCategory(e.target.value)}
                  placeholder="e.g. Respiratory / Asthma or Cardiovascular"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 px-3 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Clinical Description
                </label>
                <textarea
                  rows={2}
                  value={newMedDescription}
                  onChange={(e) => setNewMedDescription(e.target.value)}
                  placeholder="Usage instructions and temperature conditions..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newMedIsScarce}
                  onChange={(e) => setNewMedIsScarce(e.target.checked)}
                  className="h-4 w-4 rounded accent-red-500"
                />
                <span className="text-xs text-red-400 font-bold flex items-center gap-1">
                  <Flame className="h-4 w-4" />
                  <span>Highlight as SCARCE in Addis Ababa (Shortage Radar)</span>
                </span>
              </label>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddMedOpen(false)}
                  className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg transition active:scale-95"
                >
                  Save Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE SUBSCRIPTION PLAN                          */}
      {/* ======================================================== */}
      {isAddPlanOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <Tag className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Create Subscription Plan</h3>
                  <p className="text-[11px] text-slate-400">Define a new subscription tier for pharmacies</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddPlanOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Plan Name *
                </label>
                <input
                  type="text"
                  required
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  placeholder="e.g. VIP Chain Dispensary"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 px-3 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Price in ETB *
                  </label>
                  <input
                    type="number"
                    required
                    value={newPlanPrice}
                    onChange={(e) => setNewPlanPrice(e.target.value)}
                    placeholder="1200"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 px-3 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Billing Cycle (Days) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newPlanDuration}
                    onChange={(e) => setNewPlanDuration(e.target.value)}
                    placeholder="30"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 px-3 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Plan Description
                </label>
                <input
                  type="text"
                  value={newPlanDescription}
                  onChange={(e) => setNewPlanDescription(e.target.value)}
                  placeholder="High priority listing for prime Addis pharmacies..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 px-3 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Perks / Features (comma-separated)
                </label>
                <textarea
                  rows={2}
                  value={newPlanFeatures}
                  onChange={(e) => setNewPlanFeatures(e.target.value)}
                  placeholder="Unlimited stock, Top search boost, Verified badge"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddPlanOpen(false)}
                  className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition active:scale-95"
                >
                  Create Plan Tier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
