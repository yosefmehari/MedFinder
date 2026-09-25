'use client';

import React from 'react';
import { Language } from '@/lib/types';
import { getTranslation } from '@/lib/localization';
import { Search, Camera, Flame, X } from 'lucide-react';

interface SearchBarProps {
  language: Language;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenPrescriptionModal: () => void;
  onSelectQuickTag: (tag: string) => void;
}

export default function SearchBar({
  language,
  searchQuery,
  onSearchChange,
  onOpenPrescriptionModal,
  onSelectQuickTag,
}: SearchBarProps) {
  const t = getTranslation(language);

  const quickTags = [
    { label: 'Insulin (Lantus)', query: 'Lantus', scarce: true },
    { label: 'Ventolin Inhaler', query: 'Ventolin', scarce: true },
    { label: 'Clexane 40mg', query: 'Clexane', scarce: true },
    { label: 'Augmentin 1g', query: 'Augmentin', scarce: false },
  ];

  return (
    <div className="space-y-2.5">
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
          <Search className="h-5 w-5 text-emerald-600" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-24 text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />

        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-12 p-1 text-slate-400 hover:text-slate-600"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Prescription Scanner Action Button */}
        <button
          onClick={onOpenPrescriptionModal}
          className="absolute right-2 flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition active:scale-95"
          title="Upload or scan doctor's prescription"
        >
          <Camera className="h-4 w-4" />
          <span className="hidden sm:inline">Rx Scan</span>
        </button>
      </div>

      {/* Quick Tag Pills for Scarce Drugs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 uppercase shrink-0">
          <Flame className="h-3 w-3 fill-amber-500 text-amber-500" />
          {t.quickFilters}
        </span>
        {quickTags.map((tag) => (
          <button
            key={tag.query}
            onClick={() => onSelectQuickTag(tag.query)}
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold transition active:scale-95 ${
              searchQuery.toLowerCase().includes(tag.query.toLowerCase())
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-400'
            }`}
          >
            {tag.label}
          </button>
        ))}
      </div>
    </div>
  );
}
