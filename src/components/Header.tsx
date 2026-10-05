'use client';

import React from 'react';
import Link from 'next/link';
import { Language } from '@/lib/types';
import { getTranslation } from '@/lib/localization';
import { Pill, Globe, Building2, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  language: Language;
  onLanguageToggle: () => void;
  onOpenReservations?: () => void;
  activeHoldsCount?: number;
}

export default function Header({
  language,
  onLanguageToggle,
  onOpenReservations,
  activeHoldsCount = 0,
}: HeaderProps) {
  const t = getTranslation(language);

  return (
    <header className="sticky top-0 z-40 w-full bg-emerald-700 text-white shadow-md">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        {/* Brand */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 shadow-inner backdrop-blur-sm">
            <Pill className="h-6 w-6 text-emerald-200" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xl font-black tracking-tight">{t.appName}</span>
              <span className="rounded bg-emerald-800 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                Addis Ababa
              </span>
            </div>
            <p className="text-[11px] text-emerald-100/90 leading-none mt-0.5">
              {language === 'am' ? 'የመድኃኒት መፈለጊያ ፕላትፎርም' : 'Real-time Medicine Radar'}
            </p>
          </div>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          {/* Pharmacy Portal Link */}
          <Link
            href="/pharmacy"
            className="flex items-center space-x-1 rounded-full bg-emerald-800/80 px-2.5 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-900 transition active:scale-95"
            title="Pharmacy Dispensary Portal"
          >
            <Building2 className="h-3.5 w-3.5 text-emerald-300" />
            <span className="hidden sm:inline">Dispensary</span>
          </Link>

          {/* Admin Control Panel Link */}
          <Link
            href="/admin"
            className="flex items-center space-x-1 rounded-full bg-emerald-900/90 px-2.5 py-1.5 text-xs font-semibold text-amber-300 hover:bg-emerald-950 transition active:scale-95 border border-emerald-600/60 shadow-xs"
            title="Platform Super Admin Control Panel"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
            <span>Admin</span>
          </Link>

          {/* Language Switcher */}
          <button
            onClick={onLanguageToggle}
            className="flex items-center space-x-1 rounded-full bg-emerald-800/80 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-800 transition active:scale-95"
            aria-label="Switch language"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>{language === 'en' ? 'አማርኛ' : 'English'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
