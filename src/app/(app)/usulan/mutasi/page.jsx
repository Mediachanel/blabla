"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import DataTable from "@/components/tables/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";

export default function UsulanMutasiPage() {
  const [rows, setRows] = useState([]);
  const emptyForm = { nip: "", nama_pegawai: "", nama_ukpd: "", ukpd_tujuan: "", jabatan: "", jabatan_baru: "", alasan: "" };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetch("/api/usulan/mutasi").then((res) => res.json()).then((payload) => setRows(payload.data || []));
  }, []);

  async function submit(event) {
    event.preventDefault();
    const response = await fetch("/api/usulan/mutasi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const payload = await response.json();
    if (payload.success) {
      setRows((current) => [payload.data, ...current]);
      setForm(emptyForm);
    }
  }

  return (
    <>
      <PageHeader title="Usulan Mutasi" description="Pencatatan awal usulan mutasi pegawai antar unit kerja." breadcrumbs={[{ label: "Usulan" }, { label: "Mutasi" }]} />
      <section className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <form className="surface space-y-4 p-5" onSubmit={submit}>
          <h2 className="text-base font-semibold text-slate-900">Form Usulan</h2>
          {[
            ["nip", "NIP"],
            ["nama_pegawai", "Nama Pegawai"],
            ["nama_ukpd", "UKPD Asal"],
            ["ukpd_tujuan", "UKPD Tujuan"],
            ["jabatan", "Jabatan Lama"],
            ["jabatan_baru", "Jabatan Baru"]
          ].map(([name, label]) => (
            <label key={name} className="space-y-2">
              <span className="label">{label}</span>
              <input className="input" value={form[name]} onChange={(event) => setForm({ ...form, [name]: event.target.value })} required={name !== "nip" && name !== "jabatan" && name !== "jabatan_baru"} />
            </label>
          ))}
          <label className="space-y-2">
            <span className="label">Alasan Mutasi</span>
            <textarea className="input min-h-28" value={form.alasan} onChange={(event) => setForm({ ...form, alasan: event.target.value })} required />
          </label>
          <button className="btn-primary w-full">Simpan Usulan</button>
        </form>
        <DataTable
          rowKey="id"
          data={rows}
          columns={[
            { key: "nip", header: "NIP", render: (item) => item.nip || "-" },
            { key: "nama_pegawai", header: "Nama", render: (item) => item.nama_pegawai || item.nama || "-" },
            { key: "nama_ukpd", header: "UKPD Asal", render: (item) => item.nama_ukpd || item.asal || "-" },
            { key: "ukpd_tujuan", header: "UKPD Tujuan", render: (item) => item.ukpd_tujuan || item.tujuan || "-" },
            { key: "jabatan", header: "Jabatan Lama", render: (item) => item.jabatan || "-" },
            { key: "jabatan_baru", header: "Jabatan Baru", render: (item) => item.jabatan_baru || "-" },
            { key: "tanggal_usulan", header: "Tanggal", render: (item) => item.tanggal_usulan || "-" },
            { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> }
          ]}
        />
      </section>
    </>
  );
}
