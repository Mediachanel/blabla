"use client";

import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, ChevronLeft, ChevronRight } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import DataTable from "@/components/tables/DataTable";
import ErrorState from "@/components/ui/ErrorState";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function valueOrDash(value) {
  return value || "-";
}

function formatNumber(value) {
  return new Intl.NumberFormat("id-ID").format(Number(value) || 0);
}

function LoadingRows() {
  return (
    <section className="surface overflow-hidden">
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="grid gap-4 p-4 md:grid-cols-[64px_1fr_1fr_1.2fr_0.8fr_0.7fr_0.8fr_0.7fr]">
            <div className="h-5 animate-pulse rounded bg-slate-100" />
            <div className="h-5 animate-pulse rounded bg-slate-100" />
            <div className="h-5 animate-pulse rounded bg-slate-100" />
            <div className="h-5 animate-pulse rounded bg-slate-100" />
            <div className="h-5 animate-pulse rounded bg-slate-100" />
            <div className="h-5 animate-pulse rounded bg-slate-100" />
            <div className="h-5 animate-pulse rounded bg-slate-100" />
            <div className="h-5 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function PejabatPage() {
  const [rows, setRows] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [ukpdOptions, setUkpdOptions] = useState([]);
  const [ukpd, setUkpd] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function loadData() {
      setLoading(true);
      setErrorMessage("");
      try {
        const params = new URLSearchParams({
          ukpd,
          page: String(page),
          pageSize: String(pageSize)
        });
        const response = await fetch(`/api/pejabat?${params}`, { cache: "no-store", signal: controller.signal });
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.message || "Gagal memuat data pejabat.");
        const data = payload.data || {};
        if (!controller.signal.aborted) {
          setRows(data.rows || []);
          setTotalRows(data.total || 0);
          setUkpdOptions(data.filters?.ukpdOptions || []);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          setRows([]);
          setTotalRows(0);
          setErrorMessage(error.message || "Gagal memuat data pejabat.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadData();
    return () => controller.abort();
  }, [page, pageSize, refreshKey, ukpd]);

  const columns = useMemo(() => [
    { key: "nama", header: "Nama Pegawai", width: 220, render: (item) => valueOrDash(item.nama) },
    { key: "nama_ukpd", header: "Nama UKPD", width: 230, wrap: true, render: (item) => valueOrDash(item.nama_ukpd) },
    { key: "nama_jabatan_menpan", header: "Jabatan MENPAN 11", width: 260, wrap: true, render: (item) => valueOrDash(item.nama_jabatan_menpan) },
    { key: "status_rumpun", header: "Rumpun", width: 190, wrap: true, render: (item) => valueOrDash(item.status_rumpun) },
    { key: "pendidikan", header: "Pendidikan", width: 130, render: (item) => valueOrDash(item.pendidikan) },
    { key: "pangkat_golongan", header: "Pangkat/Golongan", width: 180, render: (item) => valueOrDash(item.pangkat_golongan) },
    {
      key: "no_hp_pegawai",
      header: "No HP",
      width: 140,
      render: (item) => item.no_hp_pegawai ? (
        <a className="font-semibold text-dinkes-800 hover:text-dinkes-700" href={`tel:${item.no_hp_pegawai}`}>
          {item.no_hp_pegawai}
        </a>
      ) : "-"
    }
  ], []);
  const maxPage = Math.max(1, Math.ceil(totalRows / pageSize));
  const startRow = totalRows ? (page - 1) * pageSize + 1 : 0;
  const endRow = Math.min(page * pageSize, totalRows);
  const hasActiveFilters = Boolean(ukpd);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Data Pejabat"
        breadcrumbs={[{ label: "Data Pejabat" }]}
      />

      <section className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-dinkes-50 text-dinkes-800 ring-1 ring-dinkes-100">
            <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Total Pejabat</p>
            <p className="text-2xl font-extrabold text-slate-950">{formatNumber(totalRows)}</p>
          </div>
        </div>
      </section>

      <section className="surface p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(260px,420px)_auto] md:items-end">
          <label className="grid gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Filter UKPD</span>
            <select
              className="input"
              value={ukpd}
              onChange={(event) => {
                setUkpd(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Semua UKPD</option>
              {ukpdOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          {hasActiveFilters ? (
            <button
              className="btn-secondary md:w-fit"
              type="button"
              onClick={() => {
                setUkpd("");
                setPage(1);
              }}
            >
              Reset
            </button>
          ) : null}
        </div>
      </section>

      {loading ? <LoadingRows /> : null}
      {!loading && errorMessage ? (
        <ErrorState description={errorMessage} onRetry={() => setRefreshKey((value) => value + 1)} />
      ) : null}
      {!loading && !errorMessage ? (
        <>
          <DataTable
            columns={columns}
            data={rows}
            rowKey="id_pegawai"
            showNumber
            startNumber={(page - 1) * pageSize + 1}
          />
          <footer className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              Menampilkan <span className="font-bold text-slate-900">{formatNumber(startRow)}-{formatNumber(endRow)}</span> dari <span className="font-bold text-slate-900">{formatNumber(totalRows)}</span> pejabat.
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="input w-24 py-2"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
              >
                {PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
              <button className="btn-secondary px-3 py-2" type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-24 text-center font-bold text-slate-800">Hal {page} / {maxPage}</span>
              <button className="btn-secondary px-3 py-2" type="button" onClick={() => setPage((value) => Math.min(maxPage, value + 1))} disabled={page >= maxPage}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </footer>
        </>
      ) : null}
    </div>
  );
}
