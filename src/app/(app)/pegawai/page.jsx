"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Edit, Eye, Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import DataTable from "@/components/tables/DataTable";
import SearchFilterBar from "@/components/forms/SearchFilterBar";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import { WILAYAH } from "@/lib/constants/roles";
import { JENIS_PEGAWAI_OPTIONS } from "@/lib/helpers/pegawaiStatus";

export default function PegawaiPage() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [wilayah, setWilayah] = useState("");
  const [ukpd, setUkpd] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams({ q: search, status, wilayah, ukpd });
    fetch(`/api/pegawai?${params}`).then((res) => res.json()).then((payload) => setRows(payload.data || []));
  }, [search, status, wilayah, ukpd]);

  const ukpdOptions = useMemo(() => [...new Set(rows.map((item) => item.nama_ukpd))], [rows]);
  const paginated = rows.slice((page - 1) * 8, page * 8);
  const maxPage = Math.max(1, Math.ceil(rows.length / 8));

  async function removePegawai() {
    await fetch(`/api/pegawai/${deleteTarget.id_pegawai}`, { method: "DELETE" });
    setRows((current) => current.filter((item) => item.id_pegawai !== deleteTarget.id_pegawai));
    setDeleteTarget(null);
  }

  const columns = [
    { key: "nama", header: "Nama" },
    { key: "nip", header: "NIP", render: (item) => item.nip || "-" },
    { key: "nama_jabatan_menpan", header: "Jabatan Kepmenpan 11", render: (item) => item.nama_jabatan_menpan || item.nama_jabatan_orb || "-" },
    { key: "jenis_pegawai", header: "Status", render: (item) => <StatusBadge status={item.jenis_pegawai} /> },
    { key: "nama_ukpd", header: "Nama UKPD" }
  ];

  return (
    <>
      <PageHeader
        title="Data Pegawai"
        description="Kelola data pegawai dengan filter berbasis role. Admin wilayah dan UKPD tetap dibatasi oleh API."
        breadcrumbs={[{ label: "Data Pegawai" }]}
        action={<Link className="btn-primary" href="/pegawai/new"><Plus className="h-4 w-4" /> Tambah Pegawai</Link>}
      />
      <SearchFilterBar
        search={search}
        onSearch={(value) => { setSearch(value); setPage(1); }}
        filters={[
          { name: "status", label: "Semua status", value: status, onChange: setStatus, options: JENIS_PEGAWAI_OPTIONS },
          { name: "wilayah", label: "Semua wilayah", value: wilayah, onChange: setWilayah, options: WILAYAH },
          { name: "ukpd", label: "Semua UKPD", value: ukpd, onChange: setUkpd, options: ukpdOptions }
        ]}
      />
      <div className="mt-5">
        <DataTable
          columns={columns}
          data={paginated}
          rowKey="id_pegawai"
          actions={(item) => (
            <div className="flex items-center gap-2">
              <Link className="rounded-lg p-2 text-dinkes-700 hover:bg-dinkes-50 focus-ring" href={`/pegawai/${item.id_pegawai}`} target="_blank" rel="noopener noreferrer" aria-label="Lihat profil"><Eye className="h-4 w-4" /></Link>
              <Link className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 focus-ring" href={`/pegawai/${item.id_pegawai}/edit`} aria-label="Edit"><Edit className="h-4 w-4" /></Link>
              <button className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 focus-ring" onClick={() => setDeleteTarget(item)} aria-label="Hapus"><Trash2 className="h-4 w-4" /></button>
            </div>
          )}
        />
      </div>
      <footer className="mt-4 flex items-center justify-between text-sm text-slate-600">
        <span>Menampilkan {paginated.length} dari {rows.length} pegawai</span>
        <div className="flex gap-2">
          <button className="btn-secondary py-2" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Sebelumnya</button>
          <button className="btn-secondary py-2" disabled={page === maxPage} onClick={() => setPage((value) => Math.min(maxPage, value + 1))}>Berikutnya</button>
        </div>
      </footer>
      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        title="Hapus data pegawai?"
        description={`Data ${deleteTarget?.nama || ""} akan dihapus dari mock store MVP.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={removePegawai}
      />
    </>
  );
}
