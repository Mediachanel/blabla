"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import PegawaiForm from "@/components/forms/PegawaiForm";

export default function EditPegawaiPage({ params }) {
  const [pegawai, setPegawai] = useState(null);

  useEffect(() => {
    fetch(`/api/pegawai/${params.id}`).then((res) => res.json()).then((payload) => setPegawai(payload.data));
  }, [params.id]);

  if (!pegawai) return <div className="h-64 animate-pulse rounded-2xl bg-white" />;

  return (
    <>
      <PageHeader title="Edit Pegawai" description={pegawai.nama} breadcrumbs={[{ label: "Data Pegawai", href: "/pegawai" }, { label: "Edit" }]} />
      <PegawaiForm initialData={pegawai} mode="edit" />
    </>
  );
}
