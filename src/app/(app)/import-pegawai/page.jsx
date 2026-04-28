"use client";

import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, LoaderCircle, UploadCloud } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import DataTable from "@/components/tables/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";

const importRules = [
  "Gunakan sheet Pegawai. Baris pertama nama kolom teknis dan tidak boleh diubah.",
  "Kolom wajib: nama, nama_ukpd, jenis_pegawai.",
  "Update memakai id_pegawai jika ada, lalu NIP, NRK, atau NIK. Jika tidak cocok, data dibuat baru.",
  "Kolom kosong pada update tidak menghapus data lama.",
  "Tanggal memakai format YYYY-MM-DD, contoh 2024-01-31.",
  "Nama UKPD harus sama dengan referensi UKPD di sistem.",
  "Jenis pegawai, agama, jenis kontrak, dan pangkat/golongan mengikuti sheet Referensi."
];

function formatNumber(value) {
  return Number(value || 0).toLocaleString("id-ID");
}

function formatBytes(value) {
  const bytes = Number(value || 0);
  if (bytes < 1024) return `${formatNumber(bytes)} bytes`;
  if (bytes < 1024 * 1024) return `${formatNumber(Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB`;
}

export default function ImportPegawaiPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [errorDetails, setErrorDetails] = useState(null);

  const errorRows = useMemo(() => {
    const rows = errorDetails?.rows || [];
    return rows.slice(0, 25).map((row, index) => ({
      id: `${row.rowNumber}-${index}`,
      rowNumber: row.rowNumber,
      fields: row.fields?.join(", ") || "-",
      messages: row.messages?.join(" | ") || "-"
    }));
  }, [errorDetails]);

  const importedRows = useMemo(() => {
    const rows = result?.imported || [];
    return rows.slice(0, 25).map((row, index) => ({
      id: `${row.rowNumber}-${index}`,
      rowNumber: row.rowNumber,
      id_pegawai: row.id_pegawai,
      nama: row.nama,
      status: row.status === "created" ? "Dibuat" : "Diperbarui"
    }));
  }, [result]);

  async function handleImport(event) {
    event.preventDefault();
    if (!file) {
      setError("Pilih file Excel terlebih dahulu.");
      return;
    }

    setLoading(true);
    setError("");
    setErrorDetails(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/import-pegawai", {
        method: "POST",
        body: formData
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        setErrorDetails(payload.errors || null);
        throw new Error(payload.message || "Import Excel pegawai gagal diproses.");
      }
      setResult(payload.data);
    } catch (requestError) {
      setError(requestError.message || "Import Excel pegawai gagal diproses.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Import Excel Pegawai"
        description="Upload template Excel pegawai untuk membuat atau memperbarui data utama pegawai secara massal."
        breadcrumbs={[{ label: "Import Excel Pegawai" }]}
        action={
          <a className="btn-secondary" href="/api/import-pegawai/template">
            <Download className="h-4 w-4" />
            Template Excel
          </a>
        }
      />

      <section className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <form className="surface p-5" onSubmit={handleImport}>
          <label className="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-dinkes-200 bg-dinkes-50 px-6 text-center hover:bg-dinkes-100">
            <UploadCloud className="h-12 w-12 text-dinkes-700" />
            <span className="mt-4 text-base font-semibold text-slate-900">Pilih atau tarik file Excel pegawai</span>
            <span className="mt-2 text-sm text-slate-500">Format: `.xlsx` dari template sistem atau `.csv` dengan kolom yang sama</span>
            <input
              className="sr-only"
              type="file"
              accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </label>

          {file ? (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <div className="inline-flex items-center gap-2 font-medium text-slate-900">
                <FileSpreadsheet className="h-4 w-4 text-dinkes-700" />
                {file.name}
              </div>
              <div className="mt-1 text-slate-500">{formatBytes(file.size)}</div>
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
          ) : null}

          {result ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <div className="font-semibold">Import berhasil</div>
              <div className="mt-1">
                {formatNumber(result.totalRows)} baris diproses, {formatNumber(result.created)} dibuat, {formatNumber(result.updated)} diperbarui.
              </div>
            </div>
          ) : null}

          <button className="btn-primary mt-4 flex w-full items-center justify-center gap-2" type="submit" disabled={loading}>
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {loading ? "Memproses Excel..." : "Import Excel Pegawai"}
          </button>
        </form>

        <div className="space-y-5">
          <section className="surface p-5">
            <h2 className="text-lg font-semibold text-slate-950">Aturan Import</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {importRules.map((rule, index) => (
                <div key={rule} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-dinkes-700 text-xs font-semibold text-white">{index + 1}</span>
                  {rule}
                </div>
              ))}
            </div>
          </section>

          {errorRows.length ? (
            <section className="surface p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Baris Perlu Diperbaiki</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Ditampilkan {formatNumber(errorRows.length)} dari {formatNumber(errorDetails?.totalErrors)} error.
                  </p>
                </div>
                <StatusBadge status="Gagal" />
              </div>
              <DataTable
                rowKey="id"
                data={errorRows}
                columns={[
                  { key: "rowNumber", header: "Baris" },
                  { key: "fields", header: "Kolom" },
                  { key: "messages", header: "Masalah" }
                ]}
              />
            </section>
          ) : null}

          {importedRows.length ? (
            <section className="surface p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Data Terakhir Diproses</h2>
                  <p className="mt-1 text-sm text-slate-500">Ditampilkan maksimal 25 baris pertama dari hasil import.</p>
                </div>
                <StatusBadge status="Tersimpan" />
              </div>
              <DataTable
                rowKey="id"
                data={importedRows}
                columns={[
                  { key: "rowNumber", header: "Baris" },
                  { key: "id_pegawai", header: "ID Pegawai" },
                  { key: "nama", header: "Nama" },
                  { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> }
                ]}
              />
            </section>
          ) : null}
        </div>
      </section>
    </>
  );
}
