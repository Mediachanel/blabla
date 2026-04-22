"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import DataTable from "@/components/tables/DataTable";
import SearchFilterBar from "@/components/forms/SearchFilterBar";

export default function DukPage() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [pangkat, setPangkat] = useState("");
  const [jabatan, setJabatan] = useState("");

  useEffect(() => {
    fetch("/api/duk").then((res) => res.json()).then((payload) => setRows(payload.data || []));
  }, []);

  const pangkatOptions = useMemo(() => [...new Set(rows.map((item) => item.pangkat_golongan).filter(Boolean))], [rows]);
  const jabatanOptions = useMemo(() => [...new Set(rows.map((item) => item.nama_jabatan_menpan).filter(Boolean))], [rows]);
  const filtered = rows.filter((item) => {
    const matchSearch = [item.nama, item.nip, item.nama_ukpd].join(" ").toLowerCase().includes(search.toLowerCase());
    return matchSearch && (!pangkat || item.pangkat_golongan === pangkat) && (!jabatan || item.nama_jabatan_menpan === jabatan);
  });

  return (
    <>
      <PageHeader title="Daftar Urut Kepangkatan" description="Daftar DUK khusus PNS dengan filter pangkat, jabatan, dan unit kerja. Tampilan dibuat rapi untuk kebutuhan cetak." breadcrumbs={[{ label: "DUK" }]} />
      <SearchFilterBar
        search={search}
        onSearch={setSearch}
        filters={[
          { name: "pangkat", label: "Semua pangkat", value: pangkat, onChange: setPangkat, options: pangkatOptions },
          { name: "jabatan", label: "Semua jabatan", value: jabatan, onChange: setJabatan, options: jabatanOptions }
        ]}
      />
      <div className="mt-5">
        <DataTable
          rowKey="id_pegawai"
          data={filtered}
          columns={[
            { key: "nama", header: "Nama" },
            { key: "nip", header: "NIP" },
            { key: "pangkat_golongan", header: "Pangkat/Gol" },
            { key: "tmt_pangkat_terakhir", header: "TMT Pangkat" },
            { key: "nama_jabatan_menpan", header: "Jabatan" },
            { key: "jenjang_pendidikan", header: "Pendidikan" },
            { key: "nama_ukpd", header: "Unit Kerja" }
          ]}
        />
      </div>
    </>
  );
}
