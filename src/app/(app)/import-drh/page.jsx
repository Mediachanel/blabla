"use client";

import { useState } from "react";
import { FileText, LoaderCircle, UploadCloud } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import DataTable from "@/components/tables/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";

function formatCount(value) {
  return Number(value || 0).toLocaleString("id-ID");
}

export default function ImportDrhPage() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleImport(event) {
    event.preventDefault();
    if (!file) {
      setError("Pilih file PDF DRH terlebih dahulu.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/import-drh", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Import DRH gagal diproses.");
      }
      setResult(payload.data);
    } catch (requestError) {
      setError(requestError.message || "Import DRH gagal diproses.");
    } finally {
      setLoading(false);
    }
  }

  const preview = result
    ? [
        { id: 1, bagian: "Pendidikan", jumlah: result.importedCounts.riwayat_pendidikan, status: result.importedCounts.riwayat_pendidikan ? "Tersimpan" : "Kosong" },
        { id: 2, bagian: "Keluarga", jumlah: result.importedCounts.keluarga, status: result.importedCounts.keluarga ? "Tersimpan" : "Kosong" },
        { id: 3, bagian: "Jabatan", jumlah: result.importedCounts.riwayat_jabatan, status: result.importedCounts.riwayat_jabatan ? "Tersimpan" : "Kosong" },
        { id: 4, bagian: "Gaji Pokok", jumlah: result.importedCounts.riwayat_gaji_pokok, status: result.importedCounts.riwayat_gaji_pokok ? "Tersimpan" : "Kosong" },
        { id: 5, bagian: "Pangkat", jumlah: result.importedCounts.riwayat_pangkat, status: result.importedCounts.riwayat_pangkat ? "Tersimpan" : "Kosong" },
        { id: 6, bagian: "Penghargaan", jumlah: result.importedCounts.riwayat_penghargaan, status: result.importedCounts.riwayat_penghargaan ? "Tersimpan" : "Kosong" },
        { id: 7, bagian: "SKP", jumlah: result.importedCounts.riwayat_skp, status: result.importedCounts.riwayat_skp ? "Tersimpan" : "Kosong" },
        { id: 8, bagian: "Hukuman Disiplin", jumlah: result.importedCounts.riwayat_hukuman_disiplin, status: result.importedCounts.riwayat_hukuman_disiplin ? "Tersimpan" : "Kosong" },
        { id: 9, bagian: "Prestasi Pendidikan", jumlah: result.importedCounts.riwayat_prestasi_pendidikan, status: result.importedCounts.riwayat_prestasi_pendidikan ? "Tersimpan" : "Kosong" },
        { id: 10, bagian: "Narasumber", jumlah: result.importedCounts.riwayat_narasumber, status: result.importedCounts.riwayat_narasumber ? "Tersimpan" : "Kosong" },
        { id: 11, bagian: "Kegiatan Strategis", jumlah: result.importedCounts.riwayat_kegiatan_strategis, status: result.importedCounts.riwayat_kegiatan_strategis ? "Tersimpan" : "Kosong" },
        { id: 12, bagian: "Keberhasilan", jumlah: result.importedCounts.riwayat_keberhasilan, status: result.importedCounts.riwayat_keberhasilan ? "Tersimpan" : "Kosong" },
      ]
    : [
        { id: 1, bagian: "Data Diri", jumlah: "-", status: "Menunggu File" },
        { id: 2, bagian: "Riwayat Pendidikan", jumlah: "-", status: "Menunggu File" },
        { id: 3, bagian: "Riwayat Keluarga", jumlah: "-", status: "Menunggu File" },
      ];

  return (
    <>
      <PageHeader
        title="Import DRH"
        description="Upload PDF Daftar Riwayat Hidup pegawai. Sistem akan membaca isi PDF, memetakan tiap bagian, lalu menyimpan hasilnya ke tabel pegawai dan tabel riwayat DRH."
        breadcrumbs={[{ label: "Import DRH" }]}
      />
      <section className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <form className="surface p-5" onSubmit={handleImport}>
          <label className="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-dinkes-200 bg-dinkes-50 px-6 text-center hover:bg-dinkes-100">
            <UploadCloud className="h-12 w-12 text-dinkes-700" />
            <span className="mt-4 text-base font-semibold text-slate-900">Pilih atau tarik file PDF DRH</span>
            <span className="mt-2 text-sm text-slate-500">Format yang diproses saat ini: `.pdf` dari DRH pegawai.jakarta.go.id</span>
            <input
              className="sr-only"
              type="file"
              accept=".pdf,application/pdf"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </label>

          {file ? (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <div className="inline-flex items-center gap-2 font-medium text-slate-900">
                <FileText className="h-4 w-4 text-dinkes-700" />
                {file.name}
              </div>
              <div className="mt-1 text-slate-500">{formatCount(file.size)} bytes</div>
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
          ) : null}

          <button className="btn-primary mt-4 flex w-full items-center justify-center gap-2" type="submit" disabled={loading}>
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {loading ? "Memproses PDF..." : "Import PDF DRH"}
          </button>

          {result ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <div className="font-semibold">Import berhasil untuk {result.namaPegawai || "-"}</div>
              <div className="mt-1">
                NIP: {result.nip || "-"} | Pegawai {result.createdPegawai ? "dibuat baru" : "diperbarui"} | Halaman PDF:{" "}
                {formatCount(result.parsedSummary.pages)}
              </div>
              <div className="mt-2">
                Pendidikan {formatCount(result.importedCounts.riwayat_pendidikan)}, keluarga {formatCount(result.importedCounts.keluarga)},
                jabatan {formatCount(result.importedCounts.riwayat_jabatan)}, gaji pokok {formatCount(result.importedCounts.riwayat_gaji_pokok)},
                pangkat {formatCount(result.importedCounts.riwayat_pangkat)}.
              </div>
            </div>
          ) : null}
        </form>

        <div className="space-y-5">
          <div className="surface p-5">
            <h2 className="text-lg font-semibold text-slate-950">Ringkasan Hasil Import</h2>
            <DataTable
              rowKey="id"
              data={preview}
              columns={[
                { key: "bagian", header: "Bagian DRH" },
                { key: "jumlah", header: "Jumlah", render: (item) => (typeof item.jumlah === "number" ? formatCount(item.jumlah) : item.jumlah) },
                { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> },
              ]}
            />
          </div>

          {result ? (
            <div className="surface p-5">
              <h2 className="text-lg font-semibold text-slate-950">Data Diri Terbaca</h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nama</dt>
                  <dd className="mt-1 text-sm font-medium text-slate-800">{result.parsedSummary.pegawai.nama_lengkap || "-"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">NRK / NIP</dt>
                  <dd className="mt-1 text-sm font-medium text-slate-800">
                    {(result.parsedSummary.pegawai.nrk || "-") + " / " + (result.parsedSummary.pegawai.nip || "-")}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Jabatan</dt>
                  <dd className="mt-1 text-sm font-medium text-slate-800">{result.parsedSummary.pegawai.jabatan || "-"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Unit Kerja</dt>
                  <dd className="mt-1 text-sm font-medium text-slate-800">{result.parsedSummary.pegawai.unit_kerja || "-"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Telepon / HP</dt>
                  <dd className="mt-1 text-sm font-medium text-slate-800">
                    {(result.parsedSummary.pegawai.no_telepon || "-") + " / " + (result.parsedSummary.pegawai.no_hp || "-")}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</dt>
                  <dd className="mt-1 text-sm font-medium text-slate-800">{result.parsedSummary.pegawai.email || "-"}</dd>
                </div>
              </dl>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
