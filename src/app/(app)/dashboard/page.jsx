"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { BarChart3, BriefcaseMedical, ChevronDown, ChevronRight, Download, FilePlus2, GraduationCap, Home, Landmark, PieChart, Search, ShieldCheck, UserRoundCheck, UsersRound } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import KpiCard from "@/components/cards/KpiCard";
import DataTable from "@/components/tables/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import ErrorState from "@/components/ui/ErrorState";

const DashboardChartCard = dynamic(() => import("@/components/charts/DashboardChartCard"), {
  ssr: false,
  loading: () => <div className="h-80 animate-pulse rounded-2xl bg-white" />
});

const analyticsTabs = [
  { id: "ukpd", label: "Daftar UKPD" },
  { id: "rumpun", label: "Rumpun Jabatan" },
  { id: "jabatan", label: "Jabatan" },
  { id: "pendidikan", label: "Pendidikan-Jurusan" },
  { id: "masa-kerja", label: "Masa Kerja" }
];

const dashboardMenuOrder = ["dashboard", "pangkat", "eselon", "umur", "pendidikan", "pensiun"];
const dashboardMenuIcons = {
  dashboard: Home,
  pangkat: BarChart3,
  eselon: Landmark,
  umur: PieChart,
  pendidikan: GraduationCap,
  pensiun: UserRoundCheck
};

const pivotHeadCell = "bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600";
const pivotLabelHeadCell = `${pivotHeadCell} sticky left-0 z-20 text-left`;
const pivotNumberHeadCell = `${pivotHeadCell} text-right`;
const pivotLabelCell = "sticky left-0 z-10 border-r border-slate-100 px-3 py-2";
const pivotNumberCell = "px-3 py-2 text-right text-sm tabular-nums";

function formatNumber(value) {
  return Number(value || 0).toLocaleString("id-ID");
}

function formatPercent(value, total) {
  const denominator = Number(total || 0);
  if (!denominator) return "0%";
  return `${((Number(value || 0) / denominator) * 100).toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  })}%`;
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

function downloadCsv(filename, headers, rows) {
  const content = [
    headers.map((header) => escapeCsv(header)).join(","),
    ...rows.map((row) => row.map((cell) => escapeCsv(cell)).join(","))
  ].join("\n");
  const blob = new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function buildPivotAggregates(rows, labelKey) {
  const map = new Map();
  for (const row of rows) {
    const label = row[labelKey] || "Tidak Diketahui";
    if (!map.has(label)) {
      map.set(label, {
        label,
        total: 0,
        pnsCpns: 0,
        pppk: 0,
        pppkParuhWaktu: 0,
        nonPns: 0,
        pjlp: 0
      });
    }
    const item = map.get(label);
    const jumlah = Number(row.jumlah || 0);
    item.total += jumlah;
    if (row.jenis_pegawai === "PNS" || row.jenis_pegawai === "CPNS") item.pnsCpns += jumlah;
    if (row.jenis_pegawai === "PPPK") item.pppk += jumlah;
    if (row.jenis_pegawai === "PPPK Paruh Waktu") item.pppkParuhWaktu += jumlah;
    if (row.jenis_pegawai === "NON PNS") item.nonPns += jumlah;
    if (row.jenis_pegawai === "PJLP") item.pjlp += jumlah;
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
}

function PivotDrillPanel({ mode, query }) {
  const [loadingTree, setLoadingTree] = useState(false);
  const [treeError, setTreeError] = useState("");
  const [tree, setTree] = useState([]);
  const [open1, setOpen1] = useState({});
  const [open2, setOpen2] = useState({});
  const [employeesByNode, setEmployeesByNode] = useState({});
  const [loadingNode, setLoadingNode] = useState("");
  const [pageByNode, setPageByNode] = useState({});
  const pageSize = 20;
  const title = mode === "jabatan"
    ? "Jabatan -> UKPD -> Pegawai"
    : mode === "pendidikan"
      ? "Jenjang Pendidikan -> Jurusan -> Pegawai"
      : mode === "masa-kerja"
        ? "Masa Kerja -> Jabatan -> Pegawai"
      : "Rumpun -> Jabatan -> Pegawai";
  const getCount = (counts, key) => formatNumber(counts?.[key] || 0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ mode });
      if (query) params.set("q", query);
      setLoadingTree(true);
      setTreeError("");
      fetch(`/api/dashboard/pivot-tree?${params.toString()}`)
        .then((res) => res.json())
        .then((payload) => {
          if (!payload?.success) throw new Error(payload?.message || "Struktur pivot gagal dimuat.");
          const nextTree = payload?.data?.tree || [];
          setTree(nextTree);
          setOpen1({});
          setOpen2({});
          setEmployeesByNode({});
          setPageByNode({});
        })
        .catch((error) => {
          setTree([]);
          setTreeError(error.message || "Struktur pivot gagal dimuat.");
        })
        .finally(() => setLoadingTree(false));
    }, 350);

    return () => clearTimeout(timer);
  }, [mode, query]);

  function toggleLevel1(label) {
    setOpen1((current) => ({ ...current, [label]: !current[label] }));
  }

  async function loadEmployees(group1, group2, page = 1) {
    const nodeKey = `${group1}::${group2}`;
    setLoadingNode(nodeKey);
    const params = new URLSearchParams({ mode, group1, group2, page: String(page), pageSize: String(pageSize) });
    if (query) params.set("q", query);
    try {
      const response = await fetch(`/api/dashboard/pivot-tree?${params.toString()}`);
      const payload = await response.json();
      if (!payload?.success) throw new Error(payload?.message || "Data pegawai gagal dimuat.");
      setEmployeesByNode((current) => ({
        ...current,
        [nodeKey]: {
          items: payload?.data?.employees || [],
          total: payload?.data?.total || 0,
          page: payload?.data?.page || page
        }
      }));
      setPageByNode((current) => ({ ...current, [nodeKey]: page }));
    } catch (error) {
      setTreeError(error.message || "Data pegawai gagal dimuat.");
    } finally {
      setLoadingNode("");
    }
  }

  async function toggleLevel2(group1, group2) {
    const nodeKey = `${group1}::${group2}`;
    const willOpen = !open2[nodeKey];
    setOpen2((current) => ({ ...current, [nodeKey]: willOpen }));
    if (willOpen) {
      const page = pageByNode[nodeKey] || 1;
      await loadEmployees(group1, group2, page);
    }
  }

  return (
    <section className="mb-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      <h3 className="text-sm font-semibold text-slate-900">Rincian Pivot: {title}</h3>
      {loadingTree ? <p className="mt-3 text-sm text-slate-500">Memuat struktur...</p> : null}
      {treeError ? <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{treeError}</p> : null}
      <p className="mt-2 text-xs text-slate-500">Geser horizontal untuk melihat kolom jumlah per jenis pegawai.</p>
      <div className="mt-3 max-w-[1100px] overflow-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[860px] table-fixed">
          <colgroup>
            <col className="w-[300px]" />
            <col className="w-[96px]" />
            <col className="w-[112px]" />
            <col className="w-[96px]" />
            <col className="w-[150px]" />
            <col className="w-[112px]" />
            <col className="w-[96px]" />
          </colgroup>
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className={pivotLabelHeadCell}>Label Baris</th>
              <th className={pivotNumberHeadCell}>Total</th>
              <th className={pivotNumberHeadCell}>PNS/CPNS</th>
              <th className={pivotNumberHeadCell}>PPPK</th>
              <th className={pivotNumberHeadCell}>PPPK Paruh Waktu</th>
              <th className={pivotNumberHeadCell}>NON PNS</th>
              <th className={pivotNumberHeadCell}>PJLP</th>
            </tr>
          </thead>
          <tbody>
            {tree.map((group1) => {
              const isOpen1 = Boolean(open1[group1.label]);
              return (
                <Fragment key={group1.label}>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <td className={`${pivotLabelCell} bg-slate-50/95`}>
                      <button className="flex w-full min-w-0 items-center gap-1 text-left text-sm font-semibold text-slate-900" onClick={() => toggleLevel1(group1.label)}>
                        {isOpen1 ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <span className="truncate">{group1.label}</span>
                      </button>
                    </td>
                    <td className={`${pivotNumberCell} font-semibold text-slate-900`}>{formatNumber(group1.total)}</td>
                    <td className={`${pivotNumberCell} text-slate-700`}>{getCount(group1.counts, "pnsCpns")}</td>
                    <td className={`${pivotNumberCell} text-slate-700`}>{getCount(group1.counts, "pppk")}</td>
                    <td className={`${pivotNumberCell} text-slate-700`}>{getCount(group1.counts, "pppkParuhWaktu")}</td>
                    <td className={`${pivotNumberCell} text-slate-700`}>{getCount(group1.counts, "nonPns")}</td>
                    <td className={`${pivotNumberCell} text-slate-700`}>{getCount(group1.counts, "pjlp")}</td>
                  </tr>
                  {isOpen1
                    ? group1.children.map((group2) => {
                      const nodeKey = `${group1.label}::${group2.label}`;
                      const isOpen2 = Boolean(open2[nodeKey]);
                      const employeeData = employeesByNode[nodeKey];
                      const totalPages = Math.max(1, Math.ceil((employeeData?.total || 0) / pageSize));
                      return (
                        <Fragment key={nodeKey}>
                          <tr className="border-b border-slate-100">
                            <td className={`${pivotLabelCell} bg-white`}>
                              <button className="ml-6 flex max-w-[230px] items-center gap-1 text-left text-sm font-medium text-slate-800" onClick={() => toggleLevel2(group1.label, group2.label)}>
                                {isOpen2 ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                <span className="truncate">{group2.label}</span>
                              </button>
                            </td>
                            <td className={`${pivotNumberCell} font-medium text-slate-900`}>{formatNumber(group2.total)}</td>
                            <td className={`${pivotNumberCell} text-slate-700`}>{getCount(group2.counts, "pnsCpns")}</td>
                            <td className={`${pivotNumberCell} text-slate-700`}>{getCount(group2.counts, "pppk")}</td>
                            <td className={`${pivotNumberCell} text-slate-700`}>{getCount(group2.counts, "pppkParuhWaktu")}</td>
                            <td className={`${pivotNumberCell} text-slate-700`}>{getCount(group2.counts, "nonPns")}</td>
                            <td className={`${pivotNumberCell} text-slate-700`}>{getCount(group2.counts, "pjlp")}</td>
                          </tr>
                          {isOpen2 ? (
                            <>
                              {(employeeData?.items || []).map((employee) => (
                                <tr key={employee.id_pegawai} className="border-b border-slate-100 hover:bg-dinkes-50/40">
                                  <td className={`${pivotLabelCell} bg-white py-1 text-sm text-slate-700`}>
                                    <div className="ml-12 flex min-w-0 items-center justify-between gap-3">
                                      <span className="truncate">{employee.nama} <span className="text-xs text-slate-500">({employee.jenis_pegawai || "-"})</span></span>
                                      <Link className="shrink-0 text-xs font-semibold text-dinkes-700 hover:text-dinkes-900" href={`/pegawai/${employee.id_pegawai}`}>
                                        Lihat Profil
                                      </Link>
                                    </div>
                                  </td>
                                  <td className="px-3 py-1 text-right text-xs text-slate-400">-</td>
                                  <td className="px-3 py-1 text-right text-xs text-slate-400">-</td>
                                  <td className="px-3 py-1 text-right text-xs text-slate-400">-</td>
                                  <td className="px-3 py-1 text-right text-xs text-slate-400">-</td>
                                  <td className="px-3 py-1 text-right text-xs text-slate-400">-</td>
                                  <td className="px-3 py-1 text-right text-xs text-slate-400">-</td>
                                </tr>
                              ))}
                              {loadingNode === nodeKey ? (
                                <tr className="border-b border-slate-100">
                                  <td className="px-3 py-2 text-xs text-slate-500" colSpan={7}>
                                    <span className="ml-12">Memuat pegawai...</span>
                                  </td>
                                </tr>
                              ) : null}
                              {(employeeData?.total || 0) > pageSize ? (
                                <tr className="border-b border-slate-100">
                                  <td className="px-3 py-2" colSpan={7}>
                                    <div className="ml-12 flex items-center gap-2 text-xs text-slate-600">
                                      <button
                                        className="rounded border border-slate-200 px-2 py-1 disabled:opacity-50"
                                        disabled={(employeeData?.page || 1) <= 1}
                                        onClick={() => loadEmployees(group1.label, group2.label, Math.max(1, (employeeData?.page || 1) - 1))}
                                      >
                                        Sebelumnya
                                      </button>
                                      <span>Hal {(employeeData?.page || 1)} / {totalPages}</span>
                                      <button
                                        className="rounded border border-slate-200 px-2 py-1 disabled:opacity-50"
                                        disabled={(employeeData?.page || 1) >= totalPages}
                                        onClick={() => loadEmployees(group1.label, group2.label, Math.min(totalPages, (employeeData?.page || 1) + 1))}
                                      >
                                        Berikutnya
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ) : null}
                            </>
                          ) : null}
                        </Fragment>
                      );
                    })
                    : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {!loadingTree && !tree.length ? <p className="px-4 py-8 text-center text-sm text-slate-500">Data drilldown tidak ditemukan.</p> : null}
      </div>
    </section>
  );
}

function UkpdDrillPanel({ query }) {
  const [loadingTree, setLoadingTree] = useState(false);
  const [treeError, setTreeError] = useState("");
  const [tree, setTree] = useState([]);
  const [open1, setOpen1] = useState({});
  const [open2, setOpen2] = useState({});
  const [open3, setOpen3] = useState({});
  const [employeesByNode, setEmployeesByNode] = useState({});
  const [loadingNode, setLoadingNode] = useState("");
  const [pageByNode, setPageByNode] = useState({});
  const pageSize = 20;
  const getCount = (counts, key) => formatNumber(counts?.[key] || 0);
  const groupedTree = useMemo(() => {
    const groups = new Map();
    for (const ukpd of tree) {
      const wilayah = ukpd.wilayah || "Tidak Diketahui";
      if (!groups.has(wilayah)) groups.set(wilayah, []);
      groups.get(wilayah).push(ukpd);
    }
    return [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b, "id"))
      .map(([wilayah, items]) => [
        wilayah,
        items.sort((a, b) => a.label.localeCompare(b.label, "id"))
      ]);
  }, [tree]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ mode: "ukpd" });
      if (query) params.set("q", query);
      setLoadingTree(true);
      setTreeError("");
      fetch(`/api/dashboard/pivot-tree?${params.toString()}`)
        .then((res) => res.json())
        .then((payload) => {
          if (!payload?.success) throw new Error(payload?.message || "Struktur pivot gagal dimuat.");
          setTree(payload?.data?.tree || []);
          setOpen1({});
          setOpen2({});
          setOpen3({});
          setEmployeesByNode({});
          setPageByNode({});
        })
        .catch((error) => {
          setTree([]);
          setTreeError(error.message || "Struktur pivot gagal dimuat.");
        })
        .finally(() => setLoadingTree(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  async function loadEmployees(group1, group2, group3, page = 1) {
    const nodeKey = `${group1}::${group2}::${group3}`;
    setLoadingNode(nodeKey);
    const params = new URLSearchParams({ mode: "ukpd", group1, group2, group3, page: String(page), pageSize: String(pageSize) });
    if (query) params.set("q", query);
    try {
      const response = await fetch(`/api/dashboard/pivot-tree?${params.toString()}`);
      const payload = await response.json();
      if (!payload?.success) throw new Error(payload?.message || "Data pegawai gagal dimuat.");
      setEmployeesByNode((current) => ({
        ...current,
        [nodeKey]: { items: payload?.data?.employees || [], total: payload?.data?.total || 0, page: payload?.data?.page || page }
      }));
      setPageByNode((current) => ({ ...current, [nodeKey]: page }));
    } catch (error) {
      setTreeError(error.message || "Data pegawai gagal dimuat.");
    } finally {
      setLoadingNode("");
    }
  }

  return (
    <section className="mb-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      <h3 className="text-sm font-semibold text-slate-900">Rincian Pivot: UKPD -&gt; Rumpun -&gt; Jabatan -&gt; Pegawai</h3>
      {loadingTree ? <p className="mt-3 text-sm text-slate-500">Memuat struktur...</p> : null}
      {treeError ? <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{treeError}</p> : null}
      <div className="mt-3 max-w-[1180px] overflow-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[940px] table-fixed">
          <colgroup>
            <col className="w-[64px]" />
            <col className="w-[300px]" />
            <col className="w-[96px]" />
            <col className="w-[112px]" />
            <col className="w-[96px]" />
            <col className="w-[150px]" />
            <col className="w-[112px]" />
            <col className="w-[96px]" />
          </colgroup>
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className={`${pivotHeadCell} text-center`}>No</th>
              <th className={pivotLabelHeadCell}>Label Baris</th>
              <th className={pivotNumberHeadCell}>Total</th>
              <th className={pivotNumberHeadCell}>PNS/CPNS</th>
              <th className={pivotNumberHeadCell}>PPPK</th>
              <th className={pivotNumberHeadCell}>PPPK Paruh Waktu</th>
              <th className={pivotNumberHeadCell}>NON PNS</th>
              <th className={pivotNumberHeadCell}>PJLP</th>
            </tr>
          </thead>
          <tbody>
            {groupedTree.map(([wilayah, items]) => (
              <Fragment key={wilayah}>
                <tr className="border-b border-slate-200 bg-dinkes-50">
                  <td className="px-3 py-2" />
                  <td colSpan={7} className="px-3 py-2 text-sm font-bold text-slate-900">
                    Wilayah {wilayah}
                  </td>
                </tr>
                {items.map((ukpd, index) => {
              const isOpen1 = Boolean(open1[ukpd.label]);
              return (
                <Fragment key={ukpd.label}>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <td className="px-3 py-2 text-center text-sm font-semibold text-slate-700">{index + 1}</td>
                    <td className={`${pivotLabelCell} bg-slate-50/95`}>
                      <button className="flex w-full min-w-0 items-center gap-1 text-left text-sm font-semibold text-slate-900" onClick={() => setOpen1((s) => ({ ...s, [ukpd.label]: !s[ukpd.label] }))}>
                        {isOpen1 ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <span className="truncate">{ukpd.label}</span>
                      </button>
                    </td>
                    <td className={`${pivotNumberCell} font-semibold text-slate-900`}>{formatNumber(ukpd.total)}</td>
                    <td className={`${pivotNumberCell} text-slate-700`}>{getCount(ukpd.counts, "pnsCpns")}</td>
                    <td className={`${pivotNumberCell} text-slate-700`}>{getCount(ukpd.counts, "pppk")}</td>
                    <td className={`${pivotNumberCell} text-slate-700`}>{getCount(ukpd.counts, "pppkParuhWaktu")}</td>
                    <td className={`${pivotNumberCell} text-slate-700`}>{getCount(ukpd.counts, "nonPns")}</td>
                    <td className={`${pivotNumberCell} text-slate-700`}>{getCount(ukpd.counts, "pjlp")}</td>
                  </tr>
                  {isOpen1 ? ukpd.children.map((rumpun) => {
                    const key2 = `${ukpd.label}::${rumpun.label}`;
                    const isOpen2 = Boolean(open2[key2]);
                    return (
                      <Fragment key={key2}>
                        <tr className="border-b border-slate-100">
                          <td className="px-3 py-2" />
                          <td className={`${pivotLabelCell} bg-white`}>
                            <button className="ml-6 flex max-w-[230px] items-center gap-1 text-left text-sm font-medium text-slate-800" onClick={() => setOpen2((s) => ({ ...s, [key2]: !s[key2] }))}>
                              {isOpen2 ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              <span className="truncate">{rumpun.label}</span>
                            </button>
                          </td>
                          <td className={`${pivotNumberCell} font-medium text-slate-900`}>{formatNumber(rumpun.total)}</td>
                          <td className={`${pivotNumberCell} text-slate-700`}>{getCount(rumpun.counts, "pnsCpns")}</td>
                          <td className={`${pivotNumberCell} text-slate-700`}>{getCount(rumpun.counts, "pppk")}</td>
                          <td className={`${pivotNumberCell} text-slate-700`}>{getCount(rumpun.counts, "pppkParuhWaktu")}</td>
                          <td className={`${pivotNumberCell} text-slate-700`}>{getCount(rumpun.counts, "nonPns")}</td>
                          <td className={`${pivotNumberCell} text-slate-700`}>{getCount(rumpun.counts, "pjlp")}</td>
                        </tr>
                        {isOpen2 ? rumpun.children.map((jabatan) => {
                          const key3 = `${ukpd.label}::${rumpun.label}::${jabatan.label}`;
                          const isOpen3 = Boolean(open3[key3]);
                          const employeeData = employeesByNode[key3];
                          const totalPages = Math.max(1, Math.ceil((employeeData?.total || 0) / pageSize));
                          return (
                            <Fragment key={key3}>
                              <tr className="border-b border-slate-100">
                                <td className="px-3 py-2" />
                                <td className={`${pivotLabelCell} bg-white`}>
                                  <button className="ml-12 flex max-w-[210px] items-center gap-1 text-left text-sm text-slate-700" onClick={async () => {
                                    const next = !open3[key3];
                                    setOpen3((s) => ({ ...s, [key3]: next }));
                                    if (next) await loadEmployees(ukpd.label, rumpun.label, jabatan.label, pageByNode[key3] || 1);
                                  }}>
                                    {isOpen3 ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    <span className="truncate">{jabatan.label}</span>
                                  </button>
                                </td>
                                <td className={`${pivotNumberCell} font-medium text-slate-900`}>{formatNumber(jabatan.total)}</td>
                                <td className={`${pivotNumberCell} text-slate-700`}>{getCount(jabatan.counts, "pnsCpns")}</td>
                                <td className={`${pivotNumberCell} text-slate-700`}>{getCount(jabatan.counts, "pppk")}</td>
                                <td className={`${pivotNumberCell} text-slate-700`}>{getCount(jabatan.counts, "pppkParuhWaktu")}</td>
                                <td className={`${pivotNumberCell} text-slate-700`}>{getCount(jabatan.counts, "nonPns")}</td>
                                <td className={`${pivotNumberCell} text-slate-700`}>{getCount(jabatan.counts, "pjlp")}</td>
                              </tr>
                              {isOpen3 ? (
                                <>
                                  {(employeeData?.items || []).map((employee) => (
                                    <tr key={employee.id_pegawai} className="border-b border-slate-100 hover:bg-dinkes-50/40">
                                      <td className="px-3 py-1" />
                                      <td className={`${pivotLabelCell} bg-white py-1 text-sm text-slate-700`}>
                                        <div className="ml-16 flex min-w-0 items-center justify-between gap-3">
                                          <span className="truncate">{employee.nama}</span>
                                          <Link className="shrink-0 text-xs font-semibold text-dinkes-700 hover:text-dinkes-900" href={`/pegawai/${employee.id_pegawai}`}>
                                            Lihat Profil
                                          </Link>
                                        </div>
                                      </td>
                                      <td className="px-3 py-1 text-right text-xs text-slate-400">-</td>
                                      <td className="px-3 py-1 text-right text-xs text-slate-400">-</td>
                                      <td className="px-3 py-1 text-right text-xs text-slate-400">-</td>
                                      <td className="px-3 py-1 text-right text-xs text-slate-400">-</td>
                                      <td className="px-3 py-1 text-right text-xs text-slate-400">-</td>
                                      <td className="px-3 py-1 text-right text-xs text-slate-400">-</td>
                                    </tr>
                                  ))}
                                  {loadingNode === key3 ? (
                                    <tr className="border-b border-slate-100">
                                      <td className="px-3 py-2 text-xs text-slate-500" colSpan={8}>
                                        <span className="ml-16">Memuat pegawai...</span>
                                      </td>
                                    </tr>
                                  ) : null}
                                  {(employeeData?.total || 0) > pageSize ? (
                                    <tr className="border-b border-slate-100">
                                      <td className="px-3 py-2" colSpan={8}>
                                        <div className="ml-16 flex items-center gap-2 text-xs text-slate-600">
                                          <button className="rounded border border-slate-200 px-2 py-1 disabled:opacity-50" disabled={(employeeData?.page || 1) <= 1} onClick={() => loadEmployees(ukpd.label, rumpun.label, jabatan.label, Math.max(1, (employeeData?.page || 1) - 1))}>Sebelumnya</button>
                                          <span>Hal {(employeeData?.page || 1)} / {totalPages}</span>
                                          <button className="rounded border border-slate-200 px-2 py-1 disabled:opacity-50" disabled={(employeeData?.page || 1) >= totalPages} onClick={() => loadEmployees(ukpd.label, rumpun.label, jabatan.label, Math.min(totalPages, (employeeData?.page || 1) + 1))}>Berikutnya</button>
                                        </div>
                                      </td>
                                    </tr>
                                  ) : null}
                                </>
                              ) : null}
                            </Fragment>
                          );
                        }) : null}
                      </Fragment>
                    );
                  }) : null}
                </Fragment>
              );
            })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DashboardAnalyticsPanel({ analytics }) {
  const [activeTab, setActiveTab] = useState("ukpd");
  const [query, setQuery] = useState("");
  const normalizedQuery = query.toLowerCase();
  const masaKerjaRows = analytics?.masaKerjaByJenisPegawai || [];
  const pendidikanJurusanRows = analytics?.pendidikanJurusanByJenisPegawai || [];
  const rumpunRows = analytics?.rumpunByJenisPegawai || [];
  const jabatanRows = analytics?.jabatanMenpanByJenisPegawai || [];
  const ukpdRows = analytics?.ukpdSummary || [];

  const rows = useMemo(() => {
    if (!analytics) return [];
    if (activeTab === "ukpd") {
      return ukpdRows.filter((row) => [row.nama_ukpd, row.wilayah, row.jenis_ukpd].join(" ").toLowerCase().includes(normalizedQuery));
    }
    if (activeTab === "pendidikan") {
      return pendidikanJurusanRows.filter((row) => [row.jenis_pegawai, row.pendidikan_jurusan].join(" ").toLowerCase().includes(normalizedQuery));
    }
    if (activeTab === "rumpun") {
      return rumpunRows.filter((row) => {
        const matchQuery = [row.jenis_pegawai, row.rumpun_jabatan].join(" ").toLowerCase().includes(normalizedQuery);
        return matchQuery;
      });
    }
    if (activeTab === "jabatan") {
      return jabatanRows.filter((row) => {
        const matchQuery = [row.jenis_pegawai, row.jabatan_kepmenpan_11].join(" ").toLowerCase().includes(normalizedQuery);
        return matchQuery;
      });
    }
    return masaKerjaRows.filter((row) => {
      return [row.jenis_pegawai, row.masa_kerja_rentang].join(" ").toLowerCase().includes(normalizedQuery);
    });
  }, [activeTab, analytics, jabatanRows, masaKerjaRows, normalizedQuery, pendidikanJurusanRows, rumpunRows, ukpdRows]);

  const exportRows = useMemo(() => {
    if (activeTab === "ukpd") {
      const grouped = new Map();
      for (const row of rows) {
        const wilayah = row.wilayah || "Tidak Diketahui";
        if (!grouped.has(wilayah)) grouped.set(wilayah, []);
        grouped.get(wilayah).push(row);
      }
      const result = [];
      for (const [wilayah, items] of [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b))) {
        const sortedItems = items.sort((a, b) => a.nama_ukpd.localeCompare(b.nama_ukpd));
        sortedItems.forEach((item, index) => {
          const pnsCpns = (item.byJenisPegawai?.PNS || 0) + (item.byJenisPegawai?.CPNS || 0);
          result.push([
            wilayah,
            index + 1,
            item.nama_ukpd,
            item.total || 0,
            pnsCpns,
            item.byJenisPegawai?.PPPK || 0,
            item.byJenisPegawai?.["PPPK Paruh Waktu"] || 0,
            item.byJenisPegawai?.["NON PNS"] || 0,
            item.byJenisPegawai?.PJLP || 0
          ]);
        });
      }
      return {
        filename: "daftar-ukpd.csv",
        headers: ["Wilayah", "No", "Nama UKPD", "Total Pegawai", "PNS/CPNS", "PPPK", "PPPK Paruh Waktu", "NON PNS", "PJLP"],
        rows: result
      };
    }

    if (activeTab === "masa-kerja") {
      return {
        filename: "masa-kerja.csv",
        headers: ["No", "Rentang Masa Kerja", "Total Pegawai", "PNS/CPNS", "PPPK", "PPPK Paruh Waktu", "NON PNS", "PJLP"],
        rows: buildPivotAggregates(rows, "masa_kerja_rentang").map((item, index) => [
          index + 1,
          item.label,
          item.total,
          item.pnsCpns,
          item.pppk,
          item.pppkParuhWaktu,
          item.nonPns,
          item.pjlp
        ])
      };
    }

    const labelKey = activeTab === "rumpun"
      ? "rumpun_jabatan"
      : activeTab === "pendidikan"
        ? "pendidikan_jurusan"
        : activeTab === "masa-kerja"
          ? "masa_kerja_rentang"
          : "jabatan_kepmenpan_11";
    const labelTitle = activeTab === "rumpun"
      ? "Rumpun Jabatan"
      : activeTab === "pendidikan"
        ? "Pendidikan-Jurusan"
        : activeTab === "masa-kerja"
          ? "Masa Kerja"
          : "Jabatan";
    const filename = activeTab === "rumpun"
      ? "rumpun-jabatan.csv"
      : activeTab === "pendidikan"
        ? "pendidikan-jurusan.csv"
        : activeTab === "masa-kerja"
          ? "masa-kerja.csv"
          : "jabatan.csv";
    const aggregated = buildPivotAggregates(rows, labelKey);
    return {
      filename,
      headers: ["No", labelTitle, "Total Pegawai", "PNS/CPNS", "PPPK", "PPPK Paruh Waktu", "NON PNS", "PJLP"],
      rows: aggregated.map((item, index) => [
        index + 1,
        item.label,
        item.total,
        item.pnsCpns,
        item.pppk,
        item.pppkParuhWaktu,
        item.nonPns,
        item.pjlp
      ])
    };
  }, [activeTab, rows]);
  const titleByTab = {
    ukpd: "Daftar UKPD (Aktif)",
    pendidikan: "Daftar Pendidikan-Jurusan",
    rumpun: "Daftar Rumpun Jabatan",
    jabatan: "Daftar Jabatan",
    "masa-kerja": "Daftar Masa Kerja"
  };

  const placeholderByTab = {
    ukpd: "Cari UKPD/Wilayah...",
    pendidikan: "Cari jenjang pendidikan atau jurusan...",
    rumpun: "Cari rumpun jabatan...",
    jabatan: "Cari jabatan...",
    "masa-kerja": "Cari rentang masa kerja..."
  };

  return (
    <section className="mt-6">
      <nav className="flex gap-2 overflow-x-auto pb-3" aria-label="Menu analitik dashboard">
        {analyticsTabs.map((tab) => (
          <button
            key={tab.id}
            className={`inline-flex shrink-0 items-center rounded-t-xl border border-b-0 px-4 py-2 text-sm font-semibold transition focus-ring ${activeTab === tab.id ? "border-dinkes-700 bg-dinkes-700 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
            onClick={() => {
              setActiveTab(tab.id);
              setQuery("");
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="rounded-2xl rounded-tl-none border border-slate-200 bg-white p-4 shadow-soft">
        <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-bold text-slate-900">{titleByTab[activeTab]}</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
          <button
            className="btn-secondary"
            onClick={() => downloadCsv(exportRows.filename, exportRows.headers, exportRows.rows)}
            type="button"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <label className="relative min-w-64">
            <span className="sr-only">Cari analitik</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="input py-2 pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={placeholderByTab[activeTab]} />
          </label>
        </div>
      </header>

      <div>
        {activeTab === "ukpd" ? (
          <>
            <UkpdDrillPanel query={query} />
          </>
        ) : activeTab === "pendidikan" ? (
          <PivotDrillPanel mode="pendidikan" query={query} />
        ) : activeTab === "rumpun" ? (
          <PivotDrillPanel mode="rumpun" query={query} />
        ) : activeTab === "jabatan" ? (
          <PivotDrillPanel mode="jabatan" query={query} />
        ) : activeTab === "masa-kerja" ? (
          <PivotDrillPanel mode="masa-kerja" query={query} />
        ) : null}
      </div>
      <footer className="mt-3 text-sm text-slate-500">
        Ditemukan {formatNumber(rows.length)} baris. Gunakan pencarian untuk mempersempit daftar.
      </footer>
      </div>
    </section>
  );
}

function DashboardMiniStats({ cards = [] }) {
  if (!cards.length) return null;

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
          <strong className="mt-1 block text-2xl font-bold tabular-nums text-slate-950">{formatNumber(card.value)}</strong>
          {card.helper ? <p className="mt-1 text-xs text-slate-500">{card.helper}</p> : null}
        </div>
      ))}
    </div>
  );
}

function DashboardMenuCharts({
  menus = {},
  menusByStatus = {},
  statusOptions = [],
  activeStatus = "total",
  onStatusChange,
  activeMenu,
  onMenuChange
}) {
  const activeMenus = menusByStatus[activeStatus] || menusByStatus.total || menus;
  const menuItems = dashboardMenuOrder
    .filter((id) => activeMenus[id])
    .map((id) => ({ id, ...activeMenus[id] }));
  const fallbackId = menuItems[0]?.id;
  const activeId = activeMenus[activeMenu] ? activeMenu : fallbackId;
  const activeView = activeMenus[activeId];

  if (!activeView) return null;

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
      <nav className="flex gap-1 overflow-x-auto bg-emerald-600 px-3 py-2" aria-label="Menu dashboard">
        {menuItems.map((item) => {
          const Icon = dashboardMenuIcons[item.id] || BarChart3;
          const selected = item.id === activeId;
          return (
            <button
              key={item.id}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white transition focus-ring ${selected ? "bg-white/20 shadow-sm" : "hover:bg-white/10"}`}
              onClick={() => onMenuChange(item.id)}
              type="button"
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 sm:p-5">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-slate-950">{activeView.title}</h2>
            {activeView.subtitle ? <p className="text-sm text-slate-500">{activeView.subtitle}</p> : null}
          </div>
          {statusOptions.length ? (
            <label className="flex w-full flex-col gap-1 text-sm font-semibold text-slate-700 sm:w-72">
              <span>Status Pegawai</span>
              <select
                className="input py-2"
                value={activeStatus}
                onChange={(event) => onStatusChange(event.target.value)}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({formatNumber(option.total)})
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </header>
        <DashboardMiniStats cards={activeView.statCards || []} />
        <section className="mt-4 grid gap-5 xl:grid-cols-2">
          {(activeView.charts || []).map((chart) => (
            <DashboardChartCard
              key={chart.id || chart.title}
              title={chart.title}
              type={chart.type || "bar"}
              labels={chart.labels || []}
              values={chart.values || []}
              colors={chart.colors}
              datasets={chart.datasets}
              horizontal={Boolean(chart.horizontal)}
              stacked={Boolean(chart.stacked)}
              heightClass={chart.heightClass || "h-80"}
            />
          ))}
        </section>
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [dashboardMenu, setDashboardMenu] = useState("dashboard");
  const [dashboardStatus, setDashboardStatus] = useState("total");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setErrorMessage("");
    fetch("/api/dashboard", { cache: "no-store" })
      .then((res) => res.json())
      .then((payload) => {
        if (!payload?.success) throw new Error(payload?.message || "Dashboard gagal dimuat.");
        if (active) setData(payload.data);
      })
      .catch((error) => {
        if (active) {
          setData(null);
          setErrorMessage(error.message || "Dashboard gagal dimuat.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  if (loading) {
    return (
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl bg-white" />)}
      </section>
    );
  }

  if (errorMessage) {
    return <ErrorState description={errorMessage} onRetry={() => setRefreshKey((value) => value + 1)} />;
  }

  if (!data) return null;

  const columns = [
    { key: "nama", header: "Nama" },
    { key: "nip", header: "NIP", render: (item) => item.nip || "-" },
    { key: "nama_jabatan_menpan", header: "Jabatan", render: (item) => item.nama_jabatan_menpan || item.nama_jabatan_orb || "-" },
    { key: "jenis_pegawai", header: "Status", render: (item) => <StatusBadge status={item.jenis_pegawai} /> },
    { key: "nama_ukpd", header: "UKPD" }
  ];
  const totalPegawai = Number(data.summary.total || 0);

  return (
    <>
      <PageHeader
        title={`Selamat datang, ${data.user.nama_ukpd || data.user.username}`}
        description={`Dashboard ${data.user.role} untuk ${data.user.wilayah || data.user.nama_ukpd}. Data Yang Ditampilkan Sesuai Session Login.`}
        action={<Link className="btn-primary" href="/pegawai/new"><FilePlus2 className="h-4 w-4" /> Tambah Pegawai</Link>}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard title="Total Pegawai" value={data.summary.total} percentage="100%" helper="Jumlah Pegawai Seluruh UKPD" icon={UsersRound} />
        <KpiCard title="PNS/CPNS" value={data.summary.pnsCpns} percentage={formatPercent(data.summary.pnsCpns, totalPegawai)} helper="ASN aktif" icon={ShieldCheck} tone="green" />
        <KpiCard title="PPPK" value={data.summary.pppk} percentage={formatPercent(data.summary.pppk, totalPegawai)} helper="Penuh waktu" icon={UserRoundCheck} tone="gold" />
        <KpiCard title="PPPK Paruh Waktu" value={data.summary.pppkParuhWaktu} percentage={formatPercent(data.summary.pppkParuhWaktu, totalPegawai)} helper="Paruh waktu" icon={UserRoundCheck} tone="gold" />
        <KpiCard title="NON PNS" value={data.summary.nonPns} percentage={formatPercent(data.summary.nonPns, totalPegawai)} helper="Pegawai Profesional" icon={BriefcaseMedical} tone="slate" />
        <KpiCard title="PJLP" value={data.summary.pjlp} percentage={formatPercent(data.summary.pjlp, totalPegawai)} helper="PJLP" icon={UsersRound} />
      </section>

      <DashboardMenuCharts
        menus={data.dashboardMenus || {}}
        menusByStatus={data.dashboardMenusByStatus || {}}
        statusOptions={data.dashboardMenuStatusOptions || []}
        activeStatus={dashboardStatus}
        onStatusChange={setDashboardStatus}
        activeMenu={dashboardMenu}
        onMenuChange={setDashboardMenu}
      />

      <DashboardAnalyticsPanel analytics={data.analytics} />

      <section className="mt-6 grid gap-5 xl:grid-cols-[1fr_360px]">
        <article>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-950">Pegawai Terbaru</h2>
            <Link className="text-sm font-semibold text-dinkes-700 hover:text-dinkes-900" href="/pegawai">Lihat semua</Link>
          </div>
          <DataTable columns={columns} data={data.latestEmployees} rowKey="id_pegawai" />
        </article>
        <aside className="surface p-5">
          <h2 className="text-lg font-semibold text-slate-950">Ringkasan Usulan</h2>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Usulan Mutasi</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{data.usulanSummary.mutasi}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Usulan Putus JF</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{data.usulanSummary.putusJf}</p>
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}
