'use client';

import type { GalleryFilters } from '@/lib/types';
import { CHAIN_OPTIONS, STYLE_OPTIONS, SORT_OPTIONS } from '@/lib/constants';

interface FilterBarProps {
  filters: GalleryFilters;
  onChange: (filters: GalleryFilters) => void;
}

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 py-4">
      {/* Chain Toggles */}
      <div className="flex rounded-lg overflow-hidden border border-white/[0.08] bg-white/[0.02]">
        {CHAIN_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange({ ...filters, chain: opt.value || undefined })}
            className={`px-4 py-2 text-xs font-medium transition-all ${
              (filters.chain || '') === opt.value
                ? 'bg-amber-500/15 text-amber-400 border-r border-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border-r border-white/[0.06] last:border-r-0'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Style Select */}
      <select
        value={filters.style || ''}
        onChange={(e) => onChange({ ...filters, style: e.target.value || undefined })}
        className="h-9 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 text-xs text-zinc-300 outline-none focus:border-amber-500/40 transition-colors cursor-pointer appearance-none"
      >
        {STYLE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-zinc-900">{opt.label}</option>
        ))}
      </select>

      {/* Sort Select */}
      <select
        value={filters.sort}
        onChange={(e) => onChange({ ...filters, sort: e.target.value as GalleryFilters['sort'] })}
        className="h-9 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 text-xs text-zinc-300 outline-none focus:border-amber-500/40 transition-colors cursor-pointer appearance-none"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-zinc-900">{opt.label}</option>
        ))}
      </select>

      {/* Min Score */}
      <div className="flex items-center gap-2 h-9 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">Min Score</span>
        <input
          type="range"
          min={0}
          max={100}
          step={10}
          value={filters.minScore ?? 0}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange({ ...filters, minScore: v > 0 ? v : undefined });
          }}
          className="w-20 h-1 accent-amber-500 cursor-pointer"
        />
        <span className="text-xs text-amber-400 font-mono w-6 text-right">
          {filters.minScore ?? 0}
        </span>
      </div>
    </div>
  );
}
