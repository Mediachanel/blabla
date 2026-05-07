"use client";

import { Search } from "lucide-react";

export default function SearchFilterBar({ search, onSearch, filters = [], actions }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-etpp sm:p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <label className="relative block min-w-0 flex-1">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Pencarian Pegawai</span>
          <Search className="pointer-events-none absolute left-3 top-[2.35rem] h-4 w-4 text-slate-400" aria-hidden="true" />
          <input className="input h-12 rounded-2xl pl-9" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Cari nama, NIP, jabatan, atau UKPD" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end">
          {filters.map((filter) => (
            <label key={filter.name} className="min-w-0 lg:min-w-44">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">{filter.label}</span>
              <select className="input h-12 rounded-2xl" value={filter.value} onChange={(event) => filter.onChange(event.target.value)}>
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
