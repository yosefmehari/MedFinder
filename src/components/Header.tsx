'use client';

import React from 'react';
import { Language } from '@/lib/types';
import { getTranslation } from '@/lib/localization';
import { Pill, Globe, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  language: Language;
  onLanguageToggle: () => void;
}

export default function Header({ language, onLanguageToggle }: HeaderProps) {
  const t = getTranslation(language);

  return (
    <header className="sticky top-0 z-40 w-full bg-emerald-700 text-white shadow-md">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        {/* Brand */}
        <div className="flex items-center space-x-2">
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
        </div>

        {/* Language Switcher & Trust Badge */}
        <div className="flex items-center space-x-2">
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
