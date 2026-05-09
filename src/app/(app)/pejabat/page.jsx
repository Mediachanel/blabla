"use client";

import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import DataTable from "@/components/tables/DataTable";
import ErrorState from "@/components/ui/ErrorState";

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
          <div key={index} className="grid gap-4 p-4 md:grid-cols-[64px_1.3fr_1.4fr_1fr_1fr_1fr]">
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
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      setErrorMessage("");
      try {
        const response = await fetch("/api/pejabat", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.message || "Gagal memuat data pejabat.");
        if (active) setRows(payload.data?.rows || []);
      } catch (error) {
        if (active) {
          setRows([]);
          setErrorMessage(error.message || "Gagal memuat data pejabat.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const columns = useMemo(() => [
    { key: "nama", header: "Nama Pegawai", width: 260, render: (item) => valueOrDash(item.nama) },
    { key: "nama_ukpd", header: "Nama UKPD", width: 280, wrap: true, render: (item) => valueOrDash(item.nama_ukpd) },
    { key: "pendidikan", header: "Pendidikan", width: 150, render: (item) => valueOrDash(item.pendidikan) },
    { key: "pangkat_golongan", header: "Pangkat/Golongan", width: 180, render: (item) => valueOrDash(item.pangkat_golongan) },
    {
      key: "no_hp_pegawai",
      header: "No HP",
      width: 150,
      render: (item) => item.no_hp_pegawai ? (
        <a className="font-semibold text-dinkes-800 hover:text-dinkes-700" href={`tel:${item.no_hp_pegawai}`}>
          {item.no_hp_pegawai}
        </a>
      ) : "-"
    }
  ], []);

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
            <p className="text-2xl font-extrabold text-slate-950">{formatNumber(rows.length)}</p>
          </div>
        </div>
      </section>

      {loading ? <LoadingRows /> : null}
      {!loading && errorMessage ? (
        <ErrorState description={errorMessage} onRetry={() => setRefreshKey((value) => value + 1)} />
      ) : null}
      {!loading && !errorMessage ? (
        <DataTable
          columns={columns}
          data={rows}
          rowKey="id_pegawai"
        />
      ) : null}
    </div>
  );
}
