"use client";

import { Search } from "lucide-react";

export default function SearchFilterBar({ search, onSearch, filters = [], actions }) {
  return (
    <section className="surface p-3 sm:p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">Cari data</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input className="input pl-9" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Cari nama, NIP, jabatan, atau UKPD" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap">
          {filters.map((filter) => (
            <label key={filter.name} className="min-w-0 lg:min-w-40">
              <span className="sr-only">{filter.label}</span>
              <select className="input" value={filter.value} onChange={(event) => filter.onChange(event.target.value)}>
                <option value="">{filter.label}</option>
                {filter.options.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          ))}
          {actions}
        </div>
      </div>
    </section>
  );
}
