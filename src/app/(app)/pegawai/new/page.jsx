import PageHeader from "@/components/layout/PageHeader";
import PegawaiForm from "@/components/forms/PegawaiForm";

export default function NewPegawaiPage() {
  return (
    <>
      <PageHeader title="Tambah Pegawai" description="Lengkapi data pegawai sesuai struktur database pegawai_master dan relasi pendukung." breadcrumbs={[{ label: "Data Pegawai", href: "/pegawai" }, { label: "Tambah" }]} />
      <PegawaiForm />
    </>
  );
}
