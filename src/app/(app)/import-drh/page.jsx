"use client";

import { useState } from "react";
import { UploadCloud } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import DataTable from "@/components/tables/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";

export default function ImportDrhPage() {
  const [result, setResult] = useState(null);
  const [fileName, setFileName] = useState("");

  async function simulateImport(event) {
    event.preventDefault();
    const response = await fetch("/api/import-drh", { method: "POST" });
    const payload = await response.json();
    setResult(payload.data);
  }

  const preview = [
    { id: 1, kolom: "nama", contoh: "dr. Andini Rahma, M.Kes", status: "Selesai" },
    { id: 2, kolom: "nip", contoh: "198802122010012001", status: "Selesai" },
    { id: 3, kolom: "nama_ukpd", contoh: "Puskesmas Kecamatan Cakung", status: "Selesai" }
  ];

  return (
    <>
      <PageHeader title="Import DRH" description="Upload dan simulasi pemetaan Data Riwayat Hidup pegawai. Endpoint produksi dapat dihubungkan ke parser Excel/CSV." breadcrumbs={[{ label: "Import DRH" }]} />
      <section className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <form className="surface p-5" onSubmit={simulateImport}>
          <label className="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-dinkes-200 bg-dinkes-50 px-6 text-center hover:bg-dinkes-100">
            <UploadCloud className="h-12 w-12 text-dinkes-700" />
            <span className="mt-4 text-base font-semibold text-slate-900">Pilih atau tarik file DRH</span>
            <span className="mt-2 text-sm text-slate-500">Format disiapkan untuk .xlsx, .csv, atau .xls</span>
            <input className="sr-only" type="file" accept=".xlsx,.xls,.csv" onChange={(event) => setFileName(event.target.files?.[0]?.name || "")} />
          </label>
          {fileName ? <p className="mt-3 text-sm font-medium text-slate-700">File: {fileName}</p> : null}
          <button className="btn-primary mt-4 w-full" type="submit">Simulasikan Import</button>
          {result ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              {result.successRows.toLocaleString("id-ID")} baris pegawai terbaca, {result.totalUkpd} UKPD, {result.totalAlamat.toLocaleString("id-ID")} alamat, {result.totalPasangan.toLocaleString("id-ID")} pasangan, dan {result.totalAnak.toLocaleString("id-ID")} anak.
            </div>
          ) : null}
          {result?.wilayahAnomalies && Object.keys(result.wilayahAnomalies).length ? (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Ada {Object.keys(result.wilayahAnomalies).length} baris dengan wilayah anomali. Periksa hasil mapping sebelum masuk MySQL produksi.
            </div>
          ) : null}
        </form>
        <div>
          <h2 className="mb-3 text-lg font-semibold text-slate-950">Preview Pemetaan Kolom</h2>
          <DataTable
            rowKey="id"
            data={preview}
            columns={[
              { key: "kolom", header: "Kolom Database" },
              { key: "contoh", header: "Contoh Data" },
              { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> }
            ]}
          />
        </div>
      </section>
    </>
  );
}
