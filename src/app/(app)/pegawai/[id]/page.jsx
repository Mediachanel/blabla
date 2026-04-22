"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Edit } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import ProfileSectionCard from "@/components/profile/ProfileSectionCard";
import StatusBadge from "@/components/ui/StatusBadge";

export default function DetailPegawaiPage({ params }) {
  const [pegawai, setPegawai] = useState(null);

  useEffect(() => {
    fetch(`/api/pegawai/${params.id}`).then((res) => res.json()).then((payload) => setPegawai(payload.data));
  }, [params.id]);

  if (!pegawai) return <div className="h-64 animate-pulse rounded-2xl bg-white" />;

  return (
    <>
      <PageHeader
        title={pegawai.nama}
        description={`${pegawai.nama_jabatan_menpan || pegawai.nama_jabatan_orb || "Jabatan belum tersedia"} - ${pegawai.nama_ukpd}`}
        breadcrumbs={[{ label: "Data Pegawai", href: "/pegawai" }, { label: "Detail Profil" }]}
        action={<Link className="btn-primary" href={`/pegawai/${pegawai.id_pegawai}/edit`}><Edit className="h-4 w-4" /> Edit Profil</Link>}
      />
      <section className="mb-5 flex flex-wrap gap-2">
        <StatusBadge status={pegawai.jenis_pegawai} />
        <StatusBadge status={pegawai.kondisi} />
      </section>
      <section className="grid gap-5 xl:grid-cols-2">
        <ProfileSectionCard title="Data Identitas" items={[
          { label: "Nama", value: pegawai.nama },
          { label: "NIK", value: pegawai.nik },
          { label: "Jenis Kelamin", value: pegawai.jenis_kelamin },
          { label: "Tempat/Tanggal Lahir", value: `${pegawai.tempat_lahir}, ${pegawai.tanggal_lahir}` },
          { label: "Agama", value: pegawai.agama },
          { label: "Status Perkawinan", value: pegawai.status_perkawinan }
        ]} />
        <ProfileSectionCard title="Data Kepegawaian" items={[
          { label: "NIP", value: pegawai.nip },
          { label: "NRK", value: pegawai.nrk },
          { label: "Jenis Pegawai", value: pegawai.jenis_pegawai },
          { label: "UKPD", value: pegawai.nama_ukpd },
          { label: "Wilayah", value: pegawai.wilayah },
          { label: "TMT Kerja UKPD", value: pegawai.tmt_kerja_ukpd }
        ]} />
        <ProfileSectionCard title="Data Jabatan dan Pangkat" items={[
          { label: "Jabatan Kepmenpan 11", value: pegawai.nama_jabatan_menpan },
          { label: "Jabatan ORB", value: pegawai.nama_jabatan_orb },
          { label: "Rumpun", value: pegawai.status_rumpun },
          { label: "Atasan Langsung", value: pegawai.struktur_atasan_langsung },
          { label: "Pangkat/Golongan", value: pegawai.pangkat_golongan },
          { label: "TMT Pangkat", value: pegawai.tmt_pangkat_terakhir }
        ]} />
        <ProfileSectionCard title="Pendidikan dan Kontak" items={[
          { label: "Pendidikan", value: pegawai.jenjang_pendidikan },
          { label: "Program Studi", value: pegawai.program_studi },
          { label: "Universitas", value: pegawai.nama_universitas },
          { label: "No HP", value: pegawai.no_hp_pegawai },
          { label: "Email", value: pegawai.email },
          { label: "No BPJS", value: pegawai.no_bpjs }
        ]} />
        <ProfileSectionCard title="Alamat" items={(pegawai.alamat || []).map((item) => ({ label: item.tipe, value: `${item.jalan}, ${item.kelurahan}, ${item.kecamatan}, ${item.kota_kabupaten}` }))} />
        <ProfileSectionCard title="Pasangan dan Anak" items={[
          { label: "Pasangan", value: pegawai.pasangan?.nama },
          { label: "Pekerjaan Pasangan", value: pegawai.pasangan?.pekerjaan },
          ...((pegawai.anak || []).map((item) => ({ label: `Anak ${item.urutan}`, value: `${item.nama} - ${item.pekerjaan}` })))
        ]} />
      </section>
    </>
  );
}
