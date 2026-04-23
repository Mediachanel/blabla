"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Edit, Eye, Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import DataTable from "@/components/tables/DataTable";
import SearchFilterBar from "@/components/forms/SearchFilterBar";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import { WILAYAH } from "@/lib/constants/roles";
import { JENIS_PEGAWAI_OPTIONS } from "@/lib/helpers/pegawaiStatus";

function displayNip(item) {
  return item.nip || "-";
}

export default function PegawaiPage() {
  const [rows, setRows] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [ukpdOptions, setUkpdOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [wilayah, setWilayah] = useState("");
  const [ukpd, setUkpd] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const pageSize = 8;

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ q: search, status, wilayah, ukpd, page: String(page), pageSize: String(pageSize) });
    setLoading(true);
    fetch(`/api/pegawai?${params}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((payload) => {
        const data = payload.data || {};
        setRows(data.rows || []);
        setTotalRows(data.total || 0);
        setUkpdOptions(data.filters?.ukpdOptions || []);
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setRows([]);
          setTotalRows(0);
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [search, status, wilayah, ukpd, page]);

  const maxPage = Math.max(1, Math.ceil(totalRows / pageSize));

  async function removePegawai() {
    await fetch(`/api/pegawai/${deleteTarget.id_pegawai}`, { method: "DELETE" });
    setRows((current) => current.filter((item) => item.id_pegawai !== deleteTarget.id_pegawai));
    setTotalRows((current) => Math.max(0, current - 1));
    setDeleteTarget(null);
  }

  const columns = [
    { key: "nama", header: "Nama" },
    { key: "nip", header: "NIP", render: displayNip },
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
          { name: "status", label: "Semua status", value: status, onChange: (value) => { setStatus(value); setPage(1); }, options: JENIS_PEGAWAI_OPTIONS },
          { name: "wilayah", label: "Semua wilayah", value: wilayah, onChange: (value) => { setWilayah(value); setPage(1); }, options: WILAYAH },
          { name: "ukpd", label: "Semua UKPD", value: ukpd, onChange: (value) => { setUkpd(value); setPage(1); }, options: ukpdOptions }
        ]}
      />
      <div className="mt-5">
        {loading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-white" />
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            rowKey="id_pegawai"
            actions={(item) => (
              <div className="flex items-center gap-2">
                <Link className="rounded-lg p-2 text-dinkes-700 hover:bg-dinkes-50 focus-ring" href={`/pegawai/${item.id_pegawai}`} target="_blank" rel="noopener noreferrer" aria-label="Lihat profil"><Eye className="h-4 w-4" /></Link>
                <Link className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 focus-ring" href={`/pegawai/${item.id_pegawai}/edit`} aria-label="Edit"><Edit className="h-4 w-4" /></Link>
                <button className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 focus-ring" onClick={() => setDeleteTarget(item)} aria-label="Hapus"><Trash2 className="h-4 w-4" /></button>
              </div>
            )}
          />
        )}
      </div>
      <footer className="mt-4 flex items-center justify-between text-sm text-slate-600">
        <span>Menampilkan {rows.length} dari {totalRows} pegawai</span>
        <div className="flex gap-2">
          <button className="btn-secondary py-2" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Sebelumnya</button>
          <button className="btn-secondary py-2" disabled={page === maxPage} onClick={() => setPage((value) => Math.min(maxPage, value + 1))}>Berikutnya</button>
        </div>
      </footer>
      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        title="Hapus data pegawai?"
        description={`Data ${deleteTarget?.nama || ""} akan dihapus dari database.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={removePegawai}
      />
    </>
  );
}
