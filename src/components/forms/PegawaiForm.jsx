"use client";

import { useEffect, useState } from "react";
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

function defaultAlamat(tipe) {
  return {
    id: null,
    tipe,
    jalan: "",
    kelurahan: "",
    kecamatan: "",
    kota_kabupaten: "",
    provinsi: "",
    kode_provinsi: "",
    kode_kota_kab: "",
    kode_kecamatan: "",
    kode_kelurahan: ""
  };
}

function defaultPasangan() {
  return {
    id: null,
    status_punya: "Tidak",
    nama: "",
    no_tlp: "",
    email: "",
    pekerjaan: ""
  };
}

function createEmptyAnak(urutan) {
  return {
    id: null,
    urutan,
    nama: "",
    jenis_kelamin: "Perempuan",
    tempat_lahir: "",
    tanggal_lahir: "",
    pekerjaan: ""
  };
}

function buildInitialForm(initialData = {}) {
  const alamat = initialData.alamat || {};
  const anak = Array.isArray(initialData.anak)
    ? initialData.anak.map((item, index) => ({
        ...createEmptyAnak(index + 1),
        ...item,
        urutan: index + 1
      }))
    : [];

  return {
    ...defaultPegawai,
    ...initialData,
    alamat: {
      domisili: { ...defaultAlamat("domisili"), ...(alamat.domisili || {}) },
      ktp: { ...defaultAlamat("ktp"), ...(alamat.ktp || {}) }
    },
    pasangan: { ...defaultPasangan(), ...(initialData.pasangan || {}) },
    anak
  };
}

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

function inputTypeFor(name) {
  return name.includes("tanggal") || name.startsWith("tmt") ? "date" : "text";
}

function Field({ name, value, onChange, required = false }) {
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
          {selectOptions[name].map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : (
        <input
          className="input"
          type={inputTypeFor(name)}
          value={value || ""}
          onChange={(event) => onChange(name, event.target.value)}
          required={required}
        />
      )}
    </label>
  );
}

function RelationField({ label, value, onChange, type = "text", placeholder = "", options = [], disabled = false }) {
  return (
    <label className="space-y-2">
      <span className="label">{label}</span>
      {options.length ? (
        <select className="input" value={value || ""} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : (
        <input
          className="input"
          type={type}
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
        />
      )}
    </label>
  );
}

export default function PegawaiForm({ initialData, mode = "create" }) {
  const router = useRouter();
  const [form, setForm] = useState(() => buildInitialForm(initialData));
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(buildInitialForm(initialData));
  }, [initialData]);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateAlamatField(tipe, name, value) {
    setForm((current) => ({
      ...current,
      alamat: {
        ...current.alamat,
        [tipe]: {
          ...current.alamat[tipe],
          [name]: value
        }
      }
    }));
  }

  function updatePasanganField(name, value) {
    setForm((current) => ({
      ...current,
      pasangan: {
        ...current.pasangan,
        [name]: value
      }
    }));
  }

  function updateAnakField(index, name, value) {
    setForm((current) => ({
      ...current,
      anak: current.anak.map((item, itemIndex) => (
        itemIndex === index
          ? { ...item, [name]: value }
          : item
      ))
    }));
  }

  function addAnak() {
    setForm((current) => ({
      ...current,
      anak: [...current.anak, createEmptyAnak(current.anak.length + 1)]
    }));
  }

  function removeAnak(index) {
    setForm((current) => ({
      ...current,
      anak: current.anak
        .filter((_, itemIndex) => itemIndex !== index)
        .map((item, itemIndex) => ({ ...item, urutan: itemIndex + 1 }))
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const payload = {
      ...form,
      anak: form.anak.map((item, index) => ({
        ...item,
        urutan: index + 1
      }))
    };

    const endpoint = mode === "edit" ? `/api/pegawai/${form.id_pegawai}` : "/api/pegawai";
    const response = await fetch(endpoint, {
      method: mode === "edit" ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    setSaving(false);

    if (!result.success) {
      setMessage(result.message);
      return;
    }

    router.push(`/pegawai/${result.data.id_pegawai}`);
    router.refresh();
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {message ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{message}</p> : null}

      {sections.map((section) => (
        <section key={section.title} className="surface p-5">
          <h2 className="text-base font-semibold text-slate-900">{section.title}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {section.fields.map((field) => (
              <Field
                key={field}
                name={field}
                value={form[field]}
                onChange={updateField}
                required={["nama", "nama_ukpd", "jenis_pegawai"].includes(field)}
              />
            ))}
          </div>
        </section>
      ))}

      <section className="surface p-5">
        <h2 className="text-base font-semibold text-slate-900">Alamat</h2>
        <div className="mt-4 grid gap-6 xl:grid-cols-2">
          {[
            { key: "domisili", title: "Alamat Domisili" },
            { key: "ktp", title: "Alamat KTP" }
          ].map((item) => (
            <div key={item.key} className="rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <RelationField label="Jalan" value={form.alamat[item.key].jalan} onChange={(value) => updateAlamatField(item.key, "jalan", value)} />
                <RelationField label="Kelurahan" value={form.alamat[item.key].kelurahan} onChange={(value) => updateAlamatField(item.key, "kelurahan", value)} />
                <RelationField label="Kecamatan" value={form.alamat[item.key].kecamatan} onChange={(value) => updateAlamatField(item.key, "kecamatan", value)} />
                <RelationField label="Kota/Kabupaten" value={form.alamat[item.key].kota_kabupaten} onChange={(value) => updateAlamatField(item.key, "kota_kabupaten", value)} />
                <RelationField label="Provinsi" value={form.alamat[item.key].provinsi} onChange={(value) => updateAlamatField(item.key, "provinsi", value)} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="surface p-5">
        <h2 className="text-base font-semibold text-slate-900">Keluarga</h2>

        <div className="mt-4 rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Data Pasangan</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <RelationField
              label="Status Memiliki Pasangan"
              value={form.pasangan.status_punya}
              onChange={(value) => updatePasanganField("status_punya", value)}
              options={["Tidak", "Ya"]}
            />
            <RelationField
              label="Nama Pasangan"
              value={form.pasangan.nama}
              onChange={(value) => updatePasanganField("nama", value)}
              disabled={form.pasangan.status_punya !== "Ya"}
            />
            <RelationField
              label="No Telepon Pasangan"
              value={form.pasangan.no_tlp}
              onChange={(value) => updatePasanganField("no_tlp", value)}
              disabled={form.pasangan.status_punya !== "Ya"}
            />
            <RelationField
              label="Email Pasangan"
              value={form.pasangan.email}
              onChange={(value) => updatePasanganField("email", value)}
              disabled={form.pasangan.status_punya !== "Ya"}
            />
            <RelationField
              label="Pekerjaan Pasangan"
              value={form.pasangan.pekerjaan}
              onChange={(value) => updatePasanganField("pekerjaan", value)}
              disabled={form.pasangan.status_punya !== "Ya"}
            />
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Data Anak</h3>
            <button type="button" className="btn-secondary" onClick={addAnak}>Tambah Anak</button>
          </div>

          <div className="mt-4 space-y-4">
            {form.anak.length ? (
              form.anak.map((item, index) => (
                <div key={item.id || `anak-${index}`} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h4 className="text-sm font-semibold text-slate-900">Anak {index + 1}</h4>
                    <button type="button" className="btn-secondary" onClick={() => removeAnak(index)}>Hapus</button>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <RelationField label="Nama Anak" value={item.nama} onChange={(value) => updateAnakField(index, "nama", value)} />
                    <RelationField
                      label="Jenis Kelamin"
                      value={item.jenis_kelamin}
                      onChange={(value) => updateAnakField(index, "jenis_kelamin", value)}
                      options={["Perempuan", "Laki-laki"]}
                    />
                    <RelationField label="Tempat Lahir" value={item.tempat_lahir} onChange={(value) => updateAnakField(index, "tempat_lahir", value)} />
                    <RelationField label="Tanggal Lahir" type="date" value={item.tanggal_lahir} onChange={(value) => updateAnakField(index, "tanggal_lahir", value)} />
                    <RelationField label="Pekerjaan" value={item.pekerjaan} onChange={(value) => updateAnakField(index, "pekerjaan", value)} />
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                Belum ada data anak. Gunakan tombol "Tambah Anak" bila diperlukan.
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" className="btn-secondary" onClick={() => router.back()}>Batal</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Menyimpan..." : "Simpan Pegawai"}</button>
      </footer>
    </form>
  );
}
