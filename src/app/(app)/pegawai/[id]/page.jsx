"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Edit, Mail, MapPin, Phone } from "lucide-react";
import dinkesLogo from "@/Foto/Dinkes.png";
import StatusBadge from "@/components/ui/StatusBadge";

function valueOrDash(value) {
  return value || "-";
}

function fullNameWithTitle(pegawai) {
  return [pegawai.gelar_depan, pegawai.nama, pegawai.gelar_belakang].filter(Boolean).join(" ");
}

function parseDate(value) {
  if (!value) return null;
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return new Date(`${text}T00:00:00`);
  const slash = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (slash) return new Date(Number(slash[3]), Number(slash[2]) - 1, Number(slash[1]));
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = parseDate(value);
  if (!date) return valueOrDash(value);
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "numeric", year: "numeric" }).format(date);
}

function durationFrom(value) {
  const date = parseDate(value);
  if (!date) return "-";
  const now = new Date();
  let years = now.getFullYear() - date.getFullYear();
  let months = now.getMonth() - date.getMonth();
  if (now.getDate() < date.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years <= 0) return `${months} bulan`;
  return `${years} tahun ${months} bulan`;
}

function InfoField({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
      <dt className="text-xs font-bold text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium leading-5 text-slate-900">{valueOrDash(value)}</dd>
    </div>
  );
}

function ProfileSection({ title, items }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-extrabold text-slate-950">{title}</h2>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {items.map((item) => (
          <InfoField key={item.label} label={item.label} value={item.value} />
        ))}
      </dl>
    </section>
  );
}

function relationText(items, emptyText = "-") {
  return items.filter(Boolean).join(" | ") || emptyText;
}

function buildKeluargaRows(pegawai) {
  const rows = [];

  if (pegawai?.pasangan?.status_punya === "Ya") {
    rows.push({
      key: `pasangan-${pegawai.pasangan.id || "main"}`,
      hubungan: "Pasangan",
      nama: pegawai.pasangan.nama || "-",
      jenis_kelamin: "-",
      tempatTanggalLahir: "-",
      kontak: relationText([pegawai.pasangan.no_tlp, pegawai.pasangan.email]),
      pekerjaan: pegawai.pasangan.pekerjaan || "-"
    });
  }

  if (Array.isArray(pegawai?.anak)) {
    pegawai.anak.forEach((item, index) => {
      rows.push({
        key: `anak-${item.id || index}`,
        hubungan: `Anak ${index + 1}`,
        nama: item.nama || "-",
        jenis_kelamin: item.jenis_kelamin || "-",
        tempatTanggalLahir: relationText([item.tempat_lahir, formatDate(item.tanggal_lahir)]),
        kontak: "-",
        pekerjaan: item.pekerjaan || "-"
      });
    });
  }

  return rows;
}

export default function DetailPegawaiPage({ params }) {
  const [pegawai, setPegawai] = useState(null);

  useEffect(() => {
    fetch(`/api/pegawai/${params.id}`).then((res) => res.json()).then((payload) => setPegawai(payload.data));
  }, [params.id]);

  const computed = useMemo(() => {
    if (!pegawai) return null;
    const keluargaRows = buildKeluargaRows(pegawai);
    return {
      tempatTanggalLahir: [pegawai.tempat_lahir, formatDate(pegawai.tanggal_lahir)].filter(Boolean).join(" / "),
      umur: durationFrom(pegawai.tanggal_lahir),
      tmtKerja: `${formatDate(pegawai.tmt_kerja_ukpd)} - ${durationFrom(pegawai.tmt_kerja_ukpd)}`,
      jabatan: pegawai.nama_jabatan_menpan || pegawai.nama_jabatan_orb || "-",
      keluargaRows
    };
  }, [pegawai]);

  if (!pegawai || !computed) return <div className="h-64 animate-pulse rounded-2xl bg-white" />;

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="grid h-24 w-24 shrink-0 place-items-center rounded-lg bg-slate-100 ring-1 ring-slate-200">
              <Image src={dinkesLogo} alt="Logo Dinas Kesehatan" className="h-20 w-20 object-contain" priority />
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap gap-2">
                <StatusBadge status={pegawai.jenis_pegawai} />
                <StatusBadge status={pegawai.kondisi} />
              </div>
              <h1 className="break-words text-2xl font-extrabold tracking-normal text-slate-950">{fullNameWithTitle(pegawai)}</h1>
              <p className="mt-1 text-base font-medium text-slate-600">{computed.jabatan}</p>
              <p className="mt-2 text-sm font-bold text-slate-900">Unit / UKPD: {valueOrDash(pegawai.nama_ukpd)}</p>
              <p className="mt-1 text-sm text-slate-600">Status Aktif: {valueOrDash(pegawai.kondisi)}</p>
            </div>
          </div>
          <Link className="btn-primary self-start" href={`/pegawai/${pegawai.id_pegawai}/edit`}>
            <Edit className="h-4 w-4" />
            Edit Profil
          </Link>
        </div>
      </section>

      <ProfileSection title="Identitas" items={[
        { label: "NIP", value: pegawai.nip },
        { label: "Nama Lengkap", value: fullNameWithTitle(pegawai) },
        { label: "Jenis Kelamin", value: pegawai.jenis_kelamin },
        { label: "Tempat / Tanggal Lahir", value: computed.tempatTanggalLahir },
        { label: "Umur", value: computed.umur },
        { label: "Agama", value: pegawai.agama },
        { label: "Status Pernikahan", value: pegawai.status_perkawinan },
        { label: "Golongan Darah", value: pegawai.golongan_darah },
        { label: "NPWP", value: pegawai.npwp },
        { label: "No BPJS", value: pegawai.no_bpjs }
      ]} />

      <ProfileSection title="Kepegawaian" items={[
        { label: "Jenis Pegawai", value: pegawai.jenis_pegawai },
        { label: "Status Aktif", value: pegawai.kondisi },
        { label: "Status Rumpun", value: pegawai.status_rumpun },
        { label: "Jenis Kontrak", value: pegawai.jenis_kontrak },
        { label: "Jabatan Pergub", value: pegawai.nama_jabatan_orb },
        { label: "Jabatan Kepmenpan", value: pegawai.nama_jabatan_menpan },
        { label: "TMT Kerja UKPD", value: computed.tmtKerja },
        { label: "UKPD", value: pegawai.nama_ukpd },
        { label: "Wilayah", value: pegawai.wilayah },
        { label: "Pangkat / Golongan", value: pegawai.pangkat_golongan },
        { label: "TMT Pangkat", value: formatDate(pegawai.tmt_pangkat_terakhir) }
      ]} />

      <ProfileSection title="Pendidikan & Gelar" items={[
        { label: "Jenjang Pendidikan", value: pegawai.jenjang_pendidikan },
        { label: "Jurusan Pendidikan", value: pegawai.program_studi },
        { label: "Universitas", value: pegawai.nama_universitas },
        { label: "Gelar Depan", value: pegawai.gelar_depan },
        { label: "Gelar Belakang", value: pegawai.gelar_belakang }
      ]} />

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-extrabold text-slate-950">Kontak & Alamat</h2>
        <div className="mt-3 grid gap-3 lg:grid-cols-4">
          <InfoField label="Email" value={pegawai.email} />
          <InfoField label="Telepon" value={pegawai.no_hp_pegawai} />
          <InfoField label="Alamat KTP" value={pegawai.alamat_ktp || "-"} />
          <InfoField label="Alamat Domisili" value={pegawai.alamat_domisili || "-"} />
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
          <span className="inline-flex items-center gap-2"><Mail className="h-4 w-4 text-teal-700" />{valueOrDash(pegawai.email)}</span>
          <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4 text-teal-700" />{valueOrDash(pegawai.no_hp_pegawai)}</span>
          <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-teal-700" />{valueOrDash(pegawai.wilayah)}</span>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-950">Keluarga</h2>
            <p className="mt-1 text-sm text-slate-600">
              Total anggota keluarga tercatat: {computed.keluargaRows.length}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <span className="font-semibold text-slate-700">Status pasangan:</span>{" "}
              <span className="text-slate-900">{pegawai.pasangan?.status_punya === "Ya" ? "Ada" : "Tidak ada"}</span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <span className="font-semibold text-slate-700">Jumlah anak:</span>{" "}
              <span className="text-slate-900">{Array.isArray(pegawai.anak) ? pegawai.anak.length : 0}</span>
            </div>
          </div>
        </div>

        {computed.keluargaRows.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {["Hubungan", "Nama", "Jenis Kelamin", "Tempat / Tanggal Lahir", "Kontak", "Pekerjaan"].map((label) => (
                    <th key={label} className="table-th" scope="col">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {computed.keluargaRows.map((item) => (
                  <tr key={item.key} className="hover:bg-dinkes-50/40">
                    <td className="table-td">{item.hubungan}</td>
                    <td className="table-td font-medium text-slate-900">{item.nama}</td>
                    <td className="table-td">{item.jenis_kelamin}</td>
                    <td className="table-td">{item.tempatTanggalLahir}</td>
                    <td className="table-td">{item.kontak}</td>
                    <td className="table-td">{item.pekerjaan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
            Belum ada data keluarga yang tercatat untuk pegawai ini.
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-extrabold text-slate-950">Catatan</h2>
        <div className="mt-3 min-h-16 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">-</div>
      </section>
    </div>
  );
}
