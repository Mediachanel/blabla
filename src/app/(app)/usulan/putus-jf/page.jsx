"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import DataTable from "@/components/tables/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";

export default function UsulanPutusJfPage() {
  const [rows, setRows] = useState([]);
  const emptyForm = {
    nip: "",
    nama_pegawai: "",
    pangkat_golongan: "",
    nama_ukpd: "",
    jabatan: "",
    jabatan_baru: "",
    angka_kredit: "",
    nomor_surat: "",
    tanggal_surat: "",
    hal: "",
    pimpinan: "",
    asal_surat: "",
    alasan_pemutusan: ""
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetch("/api/usulan/putus-jf").then((res) => res.json()).then((payload) => setRows(payload.data || []));
  }, []);

  async function submit(event) {
    event.preventDefault();
    const response = await fetch("/api/usulan/putus-jf", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const payload = await response.json();
    if (payload.success) {
      setRows((current) => [payload.data, ...current]);
      setForm(emptyForm);
    }
  }

  return (
    <>
      <PageHeader title="Usulan Putus Jabatan Fungsional" description="Pencatatan awal usulan putus JF untuk proses verifikasi internal." breadcrumbs={[{ label: "Usulan" }, { label: "Putus JF" }]} />
      <section className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <form className="surface space-y-4 p-5" onSubmit={submit}>
          <h2 className="text-base font-semibold text-slate-900">Form Usulan</h2>
          {[
            ["nip", "NIP"],
            ["nama_pegawai", "Nama Pegawai"],
            ["pangkat_golongan", "Pangkat/Golongan"],
            ["nama_ukpd", "UKPD"],
            ["jabatan", "Jabatan Fungsional"],
            ["jabatan_baru", "Jabatan Baru"],
            ["angka_kredit", "Angka Kredit"],
            ["nomor_surat", "Nomor Surat"],
            ["tanggal_surat", "Tanggal Surat"],
            ["hal", "Hal"],
            ["pimpinan", "Pimpinan"],
            ["asal_surat", "Asal Surat"]
          ].map(([name, label]) => (
            <label key={name} className="space-y-2">
              <span className="label">{label}</span>
              <input className="input" type={name === "tanggal_surat" ? "date" : name === "angka_kredit" ? "number" : "text"} value={form[name]} onChange={(event) => setForm({ ...form, [name]: event.target.value })} required={["nama_pegawai", "nama_ukpd", "jabatan"].includes(name)} />
            </label>
          ))}
          <label className="space-y-2">
            <span className="label">Alasan Putus JF</span>
            <textarea className="input min-h-28" value={form.alasan_pemutusan} onChange={(event) => setForm({ ...form, alasan_pemutusan: event.target.value })} required />
          </label>
          <button className="btn-primary w-full">Simpan Usulan</button>
        </form>
        <DataTable
          rowKey="id"
          data={rows}
          columns={[
            { key: "nip", header: "NIP", render: (item) => item.nip || "-" },
            { key: "nama_pegawai", header: "Nama", render: (item) => item.nama_pegawai || item.nama || "-" },
            { key: "pangkat_golongan", header: "Pangkat/Gol", render: (item) => item.pangkat_golongan || "-" },
            { key: "nama_ukpd", header: "UKPD", render: (item) => item.nama_ukpd || "-" },
            { key: "jabatan", header: "Jabatan", render: (item) => item.jabatan || "-" },
            { key: "jabatan_baru", header: "Jabatan Baru", render: (item) => item.jabatan_baru || "-" },
            { key: "angka_kredit", header: "Angka Kredit", render: (item) => item.angka_kredit ?? "-" },
            { key: "nomor_surat", header: "Nomor Surat", render: (item) => item.nomor_surat || "-" },
            { key: "tanggal_surat", header: "Tanggal Surat", render: (item) => item.tanggal_surat || "-" },
            { key: "alasan", header: "Alasan", render: (item) => item.alasan || item.alasan_pemutusan || item.keterangan || "-" },
            { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> }
          ]}
        />
      </section>
    </>
  );
}
