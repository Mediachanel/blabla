"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { JENIS_PEGAWAI_OPTIONS } from "@/lib/helpers/pegawaiStatus";

const defaultPegawai = {
  nama: "",
  jenis_kelamin: "Perempuan",
  tempat_lahir: "",
  tanggal_lahir: "",
  nik: "",
  agama: "",
  nama_ukpd: "",
  jenis_pegawai: "PNS",
  status_rumpun: "",
  jenis_kontrak: "",
  nrk: "",
  nip: "",
  nama_jabatan_orb: "",
  nama_jabatan_menpan: "",
  struktur_atasan_langsung: "",
  pangkat_golongan: "",
  tmt_pangkat_terakhir: "",
  jenjang_pendidikan: "",
  program_studi: "",
  nama_universitas: "",
  no_hp_pegawai: "",
  email: "",
  no_bpjs: "",
  kondisi: "Aktif",
  status_perkawinan: "Belum Kawin",
  gelar_depan: "",
  gelar_belakang: "",
  tmt_kerja_ukpd: ""
};

const sections = [
  { title: "Identitas Pribadi", fields: ["nama", "gelar_depan", "gelar_belakang", "jenis_kelamin", "tempat_lahir", "tanggal_lahir", "nik", "agama"] },
  { title: "Data Kepegawaian", fields: ["nama_ukpd", "jenis_pegawai", "status_rumpun", "jenis_kontrak", "nrk", "nip", "kondisi", "tmt_kerja_ukpd"] },
  { title: "Jabatan dan Pangkat", fields: ["nama_jabatan_orb", "nama_jabatan_menpan", "struktur_atasan_langsung", "pangkat_golongan", "tmt_pangkat_terakhir"] },
  { title: "Pendidikan dan Kontak", fields: ["jenjang_pendidikan", "program_studi", "nama_universitas", "no_hp_pegawai", "email", "no_bpjs", "status_perkawinan"] }
];

const labels = {
  nama: "Nama Lengkap",
  jenis_kelamin: "Jenis Kelamin",
  tempat_lahir: "Tempat Lahir",
  tanggal_lahir: "Tanggal Lahir",
  nik: "NIK",
  agama: "Agama",
  nama_ukpd: "Nama UKPD",
  jenis_pegawai: "Jenis Pegawai",
  status_rumpun: "Status Rumpun",
  jenis_kontrak: "Jenis Kontrak",
  nrk: "NRK",
  nip: "NIP",
  nama_jabatan_orb: "Jabatan ORB",
  nama_jabatan_menpan: "Jabatan Kepmenpan 11",
  struktur_atasan_langsung: "Atasan Langsung",
  pangkat_golongan: "Pangkat/Golongan",
  tmt_pangkat_terakhir: "TMT Pangkat",
  jenjang_pendidikan: "Jenjang Pendidikan",
  program_studi: "Program Studi",
  nama_universitas: "Universitas",
  no_hp_pegawai: "No HP",
  email: "Email",
  no_bpjs: "No BPJS",
  kondisi: "Kondisi",
  status_perkawinan: "Status Perkawinan",
  gelar_depan: "Gelar Depan",
  gelar_belakang: "Gelar Belakang",
  tmt_kerja_ukpd: "TMT Kerja UKPD"
};

function Field({ name, value, onChange }) {
  const selectOptions = {
    jenis_kelamin: ["Perempuan", "Laki-laki"],
    jenis_pegawai: JENIS_PEGAWAI_OPTIONS,
    kondisi: ["Aktif", "Cuti", "Tugas Belajar", "Tidak Aktif"],
    status_perkawinan: ["Belum Kawin", "Kawin", "Cerai Hidup", "Cerai Mati"],
    jenjang_pendidikan: ["SMA", "D3", "S1", "S2", "S3"]
  };

  return (
    <label className="space-y-2">
      <span className="label">{labels[name]}</span>
      {selectOptions[name] ? (
        <select className="input" value={value || ""} onChange={(event) => onChange(name, event.target.value)}>
          {selectOptions[name].map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : (
        <input className="input" type={name.includes("tanggal") || name.startsWith("tmt") ? "date" : "text"} value={value || ""} onChange={(event) => onChange(name, event.target.value)} required={["nama", "nama_ukpd", "jenis_pegawai"].includes(name)} />
      )}
    </label>
  );
}

export default function PegawaiForm({ initialData, mode = "create" }) {
  const router = useRouter();
  const [form, setForm] = useState({ ...defaultPegawai, ...initialData });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const endpoint = mode === "edit" ? `/api/pegawai/${form.id_pegawai}` : "/api/pegawai";
    const response = await fetch(endpoint, {
      method: mode === "edit" ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const payload = await response.json();
    setSaving(false);
    if (!payload.success) {
      setMessage(payload.message);
      return;
    }
    router.push(`/pegawai/${payload.data.id_pegawai}`);
    router.refresh();
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {message ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{message}</p> : null}
      {sections.map((section) => (
        <section key={section.title} className="surface p-5">
          <h2 className="text-base font-semibold text-slate-900">{section.title}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {section.fields.map((field) => <Field key={field} name={field} value={form[field]} onChange={updateField} />)}
          </div>
        </section>
      ))}
      <section className="surface p-5">
        <h2 className="text-base font-semibold text-slate-900">Alamat, Pasangan, dan Anak</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {["Alamat Domisili", "Alamat KTP", "Nama Pasangan", "Anak 1", "Anak 2", "Anak 3"].map((label) => (
            <label key={label} className="space-y-2">
              <span className="label">{label}</span>
              <input className="input" placeholder="Siap dikembangkan sesuai tabel relasi" />
            </label>
          ))}
        </div>
      </section>
      <footer className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" className="btn-secondary" onClick={() => router.back()}>Batal</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Menyimpan..." : "Simpan Pegawai"}</button>
      </footer>
    </form>
  );
}
