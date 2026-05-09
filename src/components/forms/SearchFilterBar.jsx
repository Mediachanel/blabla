"use client";

import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

export default function SearchFilterBar({ search, onSearch, filters = [], actions }) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = filters.filter((filter) => filter.value).length;
  const hasFilters = filters.length > 0;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-2.5 sm:p-4">
      <div className="flex flex-col gap-2 sm:gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex min-w-0 gap-2 xl:flex-1">
          <label className="relative block min-w-0 flex-1">
            <span className="section-label mb-2 hidden sm:block">Pencarian Pegawai</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 sm:top-[2.35rem] sm:translate-y-0" aria-hidden="true" />
            <input className="input h-10 pl-9 text-sm sm:h-12" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Cari nama, NIP, jabatan, atau UKPD" />
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
        <div className={`${filtersOpen ? "grid" : "hidden"} gap-2 sm:grid sm:grid-cols-2 sm:gap-3 lg:flex lg:flex-wrap lg:items-end`}>
          {filters.map((filter) => (
            <label key={filter.name} className="min-w-0 lg:min-w-44">
              <span className="section-label mb-2 hidden sm:block">{filter.label}</span>
              <select className="input h-10 text-sm sm:h-12" value={filter.value} onChange={(event) => filter.onChange(event.target.value)}>
                <option value="">{filter.label}</option>
                {filter.options.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          ))}
          {actions ? <div className="hidden sm:block">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}
