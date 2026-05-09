"use client";

import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

export default function SearchFilterBar({ search, onSearch, filters = [], actions }) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = filters.filter((filter) => filter.value).length;
  const hasFilters = filters.length > 0;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
      <div className="grid gap-3 xl:grid-cols-[minmax(280px,380px)_minmax(0,1fr)] xl:items-end">
        <div className="flex min-w-0 gap-2 xl:flex-1">
          <label className="relative block min-w-0 flex-1">
            <span className="section-label mb-2 hidden sm:block">Pencarian Pegawai</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input className="input h-10 pl-9 text-sm sm:h-12" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Cari nama, NIP, jabatan, atau UKPD" />
            </span>
          </label>
          {hasFilters ? (
            <button
              className="btn-secondary h-10 shrink-0 px-3 sm:hidden"
              type="button"
              onClick={() => setFiltersOpen((value) => !value)}
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filter{activeFilterCount ? ` (${activeFilterCount})` : ""}
            </button>
          ) : null}
        </div>
        {actions ? <div className="grid sm:hidden">{actions}</div> : null}
        <div className={`${filtersOpen ? "grid" : "hidden"} gap-2 sm:grid sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4 xl:items-end`}>
          {filters.map((filter) => (
            <label key={filter.name} className="min-w-0">
              <span className="section-label mb-2 hidden sm:block">{filter.label}</span>
              <select className="input h-10 text-sm sm:h-12" value={filter.value} onChange={(event) => filter.onChange(event.target.value)}>
                <option value="">{filter.label}</option>
                {filter.options.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          ))}
          {actions ? <div className="hidden sm:self-end sm:block">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}
