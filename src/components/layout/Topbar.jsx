"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Menu, PanelLeftClose, PanelLeftOpen, Search, X } from "lucide-react";
import RoleBadge from "@/components/ui/RoleBadge";

function primaryPosition(item) {
  return item.nama_jabatan_menpan || item.nama_jabatan_orb || item.jabatan || "-";
}

export default function Topbar({ user, onOpenMenu, collapsed, onToggleSidebar }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchRef = useRef(null);
  const trimmedQuery = query.trim();
  const resultListId = "topbar-search-results";

  useEffect(() => {
    function handlePointerDown(event) {
      if (!searchRef.current?.contains(event.target)) setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (trimmedQuery.length < 2) {
      setResults([]);
      setLoading(false);
      setErrorMessage("");
      setActiveIndex(-1);
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setErrorMessage("");
      fetch(`/api/pegawai?q=${encodeURIComponent(trimmedQuery)}&pageSize=6`, {
        cache: "no-store",
        signal: controller.signal
      })
        .then((response) => response.json())
        .then((payload) => {
          if (!payload?.success) throw new Error(payload?.message || "Pencarian gagal dimuat.");
          setResults(payload.data?.rows || []);
          setOpen(true);
          setActiveIndex(-1);
        })
        .catch((error) => {
          if (error.name === "AbortError") return;
          setResults([]);
          setErrorMessage(error.message || "Pencarian gagal dimuat.");
          setOpen(true);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [trimmedQuery]);

  function closeSearch() {
    setOpen(false);
    setActiveIndex(-1);
  }

  function clearSearch() {
    setQuery("");
    setResults([]);
    setErrorMessage("");
    closeSearch();
  }

  function handleSearchKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSearch();
      return;
    }
    if (!open || !results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(results.length - 1, current + 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(0, current - 1));
      return;
    }
    if (event.key === "Enter") {
      const target = results[activeIndex >= 0 ? activeIndex : 0];
      if (target?.id_pegawai) {
        closeSearch();
        router.push(`/pegawai/${target.id_pegawai}`);
      }
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 focus-ring lg:hidden" onClick={onOpenMenu} aria-label="Buka menu">
            <Menu className="h-5 w-5" />
          </button>
          <button className="hidden rounded-xl p-2 text-slate-600 hover:bg-slate-100 focus-ring lg:inline-flex" onClick={onToggleSidebar} aria-label={collapsed ? "Buka sidebar" : "Tutup sidebar"}>
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
          <div className="relative hidden w-80 md:block" ref={searchRef}>
            <label className="sr-only" htmlFor="topbar-search-input">Pencarian cepat</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id="topbar-search-input"
              className="input py-2 pl-9 pr-10"
              placeholder="Cari pegawai atau UKPD"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpen(true);
              }}
              onFocus={() => {
                if (trimmedQuery.length >= 2) setOpen(true);
              }}
              onKeyDown={handleSearchKeyDown}
              aria-autocomplete="list"
              aria-controls={resultListId}
              aria-expanded={open}
              aria-activedescendant={activeIndex >= 0 ? `${resultListId}-${results[activeIndex]?.id_pegawai}` : undefined}
            />
            {loading ? (
              <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" aria-hidden="true" />
            ) : query ? (
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-ring" onClick={clearSearch} aria-label="Bersihkan pencarian">
                <X className="h-4 w-4" />
              </button>
            ) : null}
            {open && trimmedQuery.length >= 2 ? (
              <div id={resultListId} className="absolute left-0 top-full mt-2 w-[28rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" role="listbox">
                {errorMessage ? (
                  <div className="px-4 py-3 text-sm text-rose-700">{errorMessage}</div>
                ) : results.length ? (
                  <div className="max-h-80 overflow-y-auto py-2">
                    {results.map((item, index) => {
                      const active = index === activeIndex;
                      return (
                        <Link
                          key={item.id_pegawai}
                          id={`${resultListId}-${item.id_pegawai}`}
                          href={`/pegawai/${item.id_pegawai}`}
                          className={`block px-4 py-3 text-sm transition ${active ? "bg-dinkes-50 text-dinkes-800" : "text-slate-700 hover:bg-slate-50"}`}
                          role="option"
                          aria-selected={active}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={closeSearch}
                        >
                          <span className="block font-semibold text-slate-950">{item.nama || "-"}</span>
                          <span className="mt-1 block truncate text-xs text-slate-500">
                            {item.nip || "Tanpa NIP"} · {primaryPosition(item)} · {item.nama_ukpd || "-"}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                ) : loading ? (
                  <div className="px-4 py-3 text-sm text-slate-500">Memuat hasil pencarian...</div>
                ) : (
                  <div className="px-4 py-3 text-sm text-slate-500">Data tidak ditemukan.</div>
                )}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <RoleBadge role={user?.role} />
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-900">{user?.username}</p>
            <p className="max-w-52 truncate text-xs text-slate-500">{user?.nama_ukpd}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
