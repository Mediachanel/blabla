"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  BriefcaseBusiness,
  ChevronDown,
  Download,
  Edit,
  FileText,
  Mail,
  MapPin,
  Phone,
  Printer,
  Search,
  UserRound
} from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import ErrorState from "@/components/ui/ErrorState";

const tabs = [
  { id: "overview", label: "Ringkasan" },
  { id: "employment", label: "Kepegawaian" },
  { id: "contact", label: "Kontak & Alamat" },
  { id: "family", label: "Keluarga" },
  { id: "history", label: "Riwayat" }
];

async function readApiPayload(response) {
  const raw = await response.text();
  if (!raw) throw new Error("Respons API kosong.");
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(raw.slice(0, 200) || "Respons API tidak valid.");
  }
}

function hasValue(value) {
  if (value === null || value === undefined) return false;
  return String(value).trim() !== "" && String(value).trim() !== "-";
}

function valueOrDash(value) {
  return hasValue(value) ? value : "-";
}

function fullNameWithTitle(pegawai) {
  return [pegawai.gelar_depan, pegawai.nama, pegawai.gelar_belakang].filter(hasValue).join(" ");
}

function initials(name) {
  const words = String(name || "P")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return (words[0]?.[0] || "P") + (words[1]?.[0] || "");
}

function isValidDate(date) {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

function buildLocalDate(year, month, day) {
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  if (!isValidDate(date)) return null;
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function parseDate(value) {
  if (!value) return null;
  const text = String(value).trim();
  if (!text || text === "0" || text === "0000-00-00") return null;
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return buildLocalDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  const slash = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (slash) return buildLocalDate(Number(slash[3]), Number(slash[2]), Number(slash[1]));
  const date = new Date(text);
  return isValidDate(date) ? date : null;
}

function formatDate(value) {
  const date = parseDate(value);
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function formatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? new Intl.NumberFormat("id-ID").format(number) : valueOrDash(value);
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
  if (years <= 0) return `${Math.max(months, 0)} bulan`;
  return `${years} tahun ${months} bulan`;
}

function normalizeJenisRiwayat(value) {
  return String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function normalizeSearch(value) {
  return String(value || "").toLowerCase().trim();
}

function relationText(items) {
  return items.filter(hasValue).join(" | ");
}

function filterFilledItems(items) {
  return items.filter((item) => hasValue(item.value));
}

function fieldText(value) {
  if (!hasValue(value)) return "";
  if (typeof value === "number") return String(value);
  return String(value);
}

function hasRealName(value) {
  return hasValue(value) && String(value).trim() !== "0";
}

function LinkValue({ type, value }) {
  if (!hasValue(value)) return null;
  if (type === "email") {
    return <a className="font-semibold text-dinkes-700 hover:text-dinkes-900" href={`mailto:${value}`}>{value}</a>;
  }
  if (type === "phone") {
    const clean = String(value).replace(/[^\d+]/g, "");
    return <a className="font-semibold text-dinkes-700 hover:text-dinkes-900" href={`tel:${clean}`}>{value}</a>;
  }
  return value;
}

function InfoGrid({ items, columns = "lg:grid-cols-2" }) {
  const visibleItems = filterFilledItems(items);
  if (!visibleItems.length) return null;

  return (
    <dl className={`grid gap-3 sm:grid-cols-2 ${columns}`}>
      {visibleItems.map((item) => (
        <div key={item.label} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.label}</dt>
          <dd className="mt-1 break-words text-sm font-semibold leading-6 text-slate-950">
            {item.type ? <LinkValue type={item.type} value={item.value} /> : item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function SectionCard({ id, title, description, children }) {
  if (!children) return null;
  return (
    <section id={id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-extrabold text-slate-950">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function EmptyTabState({ label = "Belum ada data" }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm font-medium text-slate-500">
      {label}
    </div>
  );
}

function TabsNavigation({ activeTab, onChange }) {
  return (
    <div className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50/95 py-3 backdrop-blur">
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={[
                "whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold transition",
                active ? "bg-dinkes-700 text-white shadow-sm" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-dinkes-50 hover:text-dinkes-800"
              ].join(" ")}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QuickNav({ items }) {
  const visibleItems = items.filter(Boolean);
  if (!visibleItems.length) return null;
  return (
    <aside className="hidden xl:block">
      <nav className="sticky top-24 rounded-lg border border-slate-200 bg-white p-4 shadow-sm" aria-label="Navigasi cepat">
        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Navigasi Cepat</p>
        <div className="mt-3 space-y-1">
          {visibleItems.map((item) => (
            <a key={item.href} href={item.href} className="block rounded-md px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-dinkes-50 hover:text-dinkes-800">
              {item.label}
            </a>
          ))}
        </div>
      </nav>
    </aside>
  );
}

function ProfileSummary({ pegawai, computed }) {
  const name = fullNameWithTitle(pegawai);
  const isActive = String(pegawai.kondisi || "").toLowerCase().includes("aktif");
  const summaryItems = [
    { label: "UKPD", value: pegawai.nama_ukpd },
    { label: "Status Pegawai", value: pegawai.jenis_pegawai },
    { label: "Pangkat/Golongan", value: pegawai.pangkat_golongan },
    { label: "Masa Kerja", value: computed.masaKerja },
    { label: "Kontak Utama", value: pegawai.email || pegawai.no_hp_pegawai }
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-dinkes-700 text-2xl font-extrabold uppercase text-white shadow-sm">
            {initials(pegawai.nama)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={isActive ? "Aktif" : "Tidak Aktif"} />
              <StatusBadge status={pegawai.jenis_pegawai} />
            </div>
            <h1 className="mt-3 break-words text-2xl font-extrabold tracking-normal text-slate-950 lg:text-3xl">{name}</h1>
            <p className="mt-1 text-base font-semibold text-slate-600">{computed.jabatan}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Link className="btn-primary" href={`/pegawai/${pegawai.id_pegawai}/edit`}>
            <Edit className="h-4 w-4" />
            Edit Profil
          </Link>
          <button className="btn-secondary" type="button" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Cetak Profil
          </button>
          <button className="btn-secondary" type="button" onClick={() => window.print()}>
            <Download className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {filterFilledItems(summaryItems).map((item) => (
          <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="mt-1 line-clamp-2 text-sm font-extrabold text-slate-950">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CompactListTable({ columns, data, rowKey = "id" }) {
  if (!data?.length) return null;
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500" scope="col">{column.header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {data.map((row, index) => (
              <tr key={row[rowKey] || `${rowKey}-${index}`} className="hover:bg-dinkes-50/40">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-sm text-slate-700">
                    {column.render ? column.render(row, index) : valueOrDash(row[column.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HistoryAccordion({ title, description, columns, data }) {
  if (!data?.length) return null;
  return (
    <details className="group rounded-lg border border-slate-200 bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-950">{title}</h3>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{data.length} data</span>
          <ChevronDown className="h-5 w-5 text-slate-500 transition group-open:rotate-180" />
        </div>
      </summary>
      <div className="border-t border-slate-200 p-4">
        <CompactListTable columns={columns} data={data} />
      </div>
    </details>
  );
}

function buildKeluargaRows(pegawai) {
  if (Array.isArray(pegawai?.keluarga) && pegawai.keluarga.length) {
    return pegawai.keluarga.map((item, index) => ({
      id: item.id || `keluarga-${index}`,
      hubungan: item.hubungan,
      hubungan_detail: item.hubungan_detail,
      nama: item.nama,
      jenis_kelamin: item.jenis_kelamin,
      tempat_tanggal_lahir: relationText([item.tempat_lahir, formatDate(item.tanggal_lahir)]),
      status_tunjangan: item.status_tunjangan,
      pekerjaan: item.pekerjaan,
      kontak: relationText([item.no_tlp, item.email])
    })).filter((item) => hasRealName(item.nama));
  }

  const rows = [];
  if (pegawai?.pasangan?.status_punya === "Ya" && hasValue(pegawai.pasangan.nama)) {
    rows.push({
      id: pegawai.pasangan.id || "pasangan-main",
      hubungan: "Pasangan",
      hubungan_detail: "Pasangan",
      nama: pegawai.pasangan.nama,
      jenis_kelamin: "",
      tempat_tanggal_lahir: "",
      status_tunjangan: "",
      pekerjaan: pegawai.pasangan.pekerjaan,
      kontak: relationText([pegawai.pasangan.no_tlp, pegawai.pasangan.email])
    });
  }

  if (Array.isArray(pegawai?.anak)) {
    pegawai.anak.forEach((item, index) => {
      if (!hasRealName(item.nama)) return;
      rows.push({
        id: item.id || `anak-${index}`,
        hubungan: "Anak",
        hubungan_detail: `Anak ${index + 1}`,
        nama: item.nama,
        jenis_kelamin: item.jenis_kelamin,
        tempat_tanggal_lahir: relationText([item.tempat_lahir, formatDate(item.tanggal_lahir)]),
        status_tunjangan: "",
        pekerjaan: item.pekerjaan,
        kontak: ""
      });
    });
  }

  return rows;
}

const keluargaColumns = [
  { key: "hubungan", header: "Hubungan" },
  { key: "nama", header: "Nama", render: (item) => <span className="font-bold text-slate-950">{valueOrDash(item.nama)}</span> },
  { key: "jenis_kelamin", header: "Jenis Kelamin" },
  { key: "tempat_tanggal_lahir", header: "Tempat / Tgl Lahir" },
  { key: "status_tunjangan", header: "Tunjangan" },
  { key: "pekerjaan", header: "Pekerjaan" },
  { key: "kontak", header: "Kontak" }
];

const pendidikanColumns = [
  { key: "jenis_riwayat", header: "Jenis" },
  { key: "jenjang_pendidikan", header: "Jenjang" },
  { key: "program_studi", header: "Program Studi" },
  { key: "nama_institusi", header: "Institusi", render: (item) => valueOrDash(item.nama_institusi || item.nama_universitas) },
  { key: "tanggal_ijazah", header: "Tgl Ijazah", render: (item) => formatDate(item.tanggal_ijazah) },
  { key: "tahun_lulus", header: "Tahun" }
];

const jabatanColumns = [
  { key: "tmt_jabatan", header: "TMT", render: (item) => formatDate(item.tmt_jabatan) },
  { key: "nama_jabatan_menpan", header: "Jabatan", render: (item) => valueOrDash(item.nama_jabatan_menpan || item.nama_jabatan_orb) },
  { key: "nama_ukpd", header: "UKPD" },
  { key: "pangkat_golongan", header: "Pangkat" },
  { key: "nomor_sk", header: "No SK" },
  { key: "tanggal_sk", header: "Tgl SK", render: (item) => formatDate(item.tanggal_sk) }
];

const gajiColumns = [
  { key: "tmt_gaji", header: "TMT", render: (item) => formatDate(item.tmt_gaji) },
  { key: "pangkat_golongan", header: "Pangkat" },
  { key: "gaji_pokok", header: "Gaji Pokok", render: (item) => formatNumber(item.gaji_pokok) },
  { key: "nomor_sk", header: "No SK" }
];

const pangkatColumns = [
  { key: "tmt_pangkat", header: "TMT", render: (item) => formatDate(item.tmt_pangkat) },
  { key: "pangkat_golongan", header: "Pangkat" },
  { key: "lokasi", header: "Lokasi" },
  { key: "nomor_sk", header: "No SK" },
  { key: "tanggal_sk", header: "Tgl SK", render: (item) => formatDate(item.tanggal_sk) }
];

const penghargaanColumns = [
  { key: "nama_penghargaan", header: "Penghargaan" },
  { key: "asal_penghargaan", header: "Asal" },
  { key: "tanggal_sk", header: "Tanggal", render: (item) => formatDate(item.tanggal_sk) },
  { key: "keterangan", header: "Keterangan" }
];

const skpColumns = [
  { key: "tahun", header: "Tahun" },
  { key: "nilai_skp", header: "Nilai SKP" },
  { key: "nilai_perilaku", header: "Nilai Perilaku" },
  { key: "nilai_prestasi", header: "Nilai Prestasi" }
];

const hukumanColumns = [
  { key: "tanggal_mulai", header: "Tgl Mulai", render: (item) => formatDate(item.tanggal_mulai) },
  { key: "tanggal_akhir", header: "Tgl Akhir", render: (item) => formatDate(item.tanggal_akhir) },
  { key: "hukuman_disiplin", header: "Hukuman" },
  { key: "nomor_sk", header: "No SK" },
  { key: "keterangan", header: "Keterangan" }
];

const prestasiColumns = [
  { key: "kategori", header: "Kategori" },
  { key: "jenjang_pendidikan", header: "Jenjang" },
  { key: "prestasi", header: "Prestasi" }
];

const narasumberColumns = [
  { key: "kegiatan", header: "Kegiatan" },
  { key: "judul_materi", header: "Judul Materi" },
  { key: "lembaga_penyelenggara", header: "Penyelenggara" }
];

const kegiatanStrategisColumns = [
  { key: "kegiatan", header: "Kegiatan" },
  { key: "tahun_anggaran", header: "Tahun" },
  { key: "jumlah_anggaran", header: "Anggaran", render: (item) => formatNumber(item.jumlah_anggaran) },
  { key: "kedudukan_dalam_kegiatan", header: "Kedudukan" }
];

const keberhasilanColumns = [
  { key: "jabatan", header: "Jabatan" },
  { key: "tahun", header: "Tahun" },
  { key: "keberhasilan", header: "Keberhasilan" },
  { key: "kendala_yang_dihadapi", header: "Kendala" },
  { key: "solusi_yang_dilakukan", header: "Solusi" }
];

function getHistoryYear(row) {
  const values = [
    row.tahun,
    row.tahun_lulus,
    row.tahun_anggaran,
    row.tmt_jabatan,
    row.tmt_pangkat,
    row.tmt_gaji,
    row.tanggal_sk,
    row.tanggal_ijazah,
    row.tanggal_mulai
  ];
  const match = values.map(fieldText).join(" ").match(/\b(19|20)\d{2}\b/);
  return match?.[0] || "";
}

function filterHistoryRows(rows, query, year) {
  const q = normalizeSearch(query);
  return (rows || []).filter((row) => {
    const textMatch = !q || normalizeSearch(Object.values(row).join(" ")).includes(q);
    const yearMatch = !year || getHistoryYear(row) === year;
    return textMatch && yearMatch;
  });
}

function historyConfig(pegawai, computed, query, year) {
  return [
    {
      title: "Riwayat Pendidikan Formal",
      description: "Pendidikan formal yang tersimpan.",
      columns: pendidikanColumns,
      data: filterHistoryRows(computed.riwayatPendidikanFormal, query, year)
    },
    {
      title: "Riwayat Pendidikan Non Formal",
      description: "Pelatihan atau pendidikan non formal.",
      columns: pendidikanColumns,
      data: filterHistoryRows(computed.riwayatPendidikanNonFormal, query, year)
    },
    { title: "Riwayat Jabatan", description: "Perubahan jabatan dan unit kerja.", columns: jabatanColumns, data: filterHistoryRows(pegawai.riwayat_jabatan, query, year) },
    { title: "Riwayat Pangkat", description: "Pangkat dan golongan.", columns: pangkatColumns, data: filterHistoryRows(pegawai.riwayat_pangkat, query, year) },
    { title: "Riwayat Gaji Pokok", description: "Perubahan gaji pokok.", columns: gajiColumns, data: filterHistoryRows(pegawai.riwayat_gaji_pokok, query, year) },
    { title: "Riwayat SKP", description: "Nilai SKP tahunan.", columns: skpColumns, data: filterHistoryRows(pegawai.riwayat_skp, query, year) },
    { title: "Riwayat Penghargaan", description: "Penghargaan pegawai.", columns: penghargaanColumns, data: filterHistoryRows(pegawai.riwayat_penghargaan, query, year) },
    { title: "Riwayat Hukuman Disiplin", description: "Catatan disiplin bila ada.", columns: hukumanColumns, data: filterHistoryRows(pegawai.riwayat_hukuman_disiplin, query, year) },
    { title: "Prestasi Pendidikan", description: "Prestasi terkait pendidikan.", columns: prestasiColumns, data: filterHistoryRows(pegawai.riwayat_prestasi_pendidikan, query, year) },
    { title: "Pengalaman Narasumber", description: "Kegiatan sebagai narasumber.", columns: narasumberColumns, data: filterHistoryRows(pegawai.riwayat_narasumber, query, year) },
    { title: "Kegiatan Strategis", description: "Kegiatan strategis dan anggaran.", columns: kegiatanStrategisColumns, data: filterHistoryRows(pegawai.riwayat_kegiatan_strategis, query, year) },
    { title: "Keberhasilan", description: "Capaian kerja penting.", columns: keberhasilanColumns, data: filterHistoryRows(pegawai.riwayat_keberhasilan, query, year) }
  ];
}

export default function DetailPegawaiPage() {
  const routeParams = useParams();
  const pegawaiId = routeParams?.id;
  const [pegawai, setPegawai] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [historyActivated, setHistoryActivated] = useState(false);
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyYear, setHistoryYear] = useState("");

  useEffect(() => {
    if (!pegawaiId) return;
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    async function loadPegawai() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/pegawai/${pegawaiId}`, { cache: "no-store", signal: controller.signal });
        const payload = await readApiPayload(response);
        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.message || "Data pegawai tidak dapat dimuat.");
        }
        if (!cancelled) setPegawai(payload.data);
      } catch (loadError) {
        if (!cancelled) {
          setPegawai(null);
          setError(loadError.name === "AbortError" ? "Memuat detail pegawai terlalu lama. Silakan muat ulang halaman." : (loadError.message || "Terjadi kesalahan saat memuat data pegawai."));
        }
      } finally {
        if (!cancelled) setLoading(false);
        clearTimeout(timeout);
      }
    }

    loadPegawai();
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [pegawaiId, refreshKey]);

  function changeTab(tabId) {
    setActiveTab(tabId);
    if (tabId === "history") setHistoryActivated(true);
  }

  const computed = useMemo(() => {
    if (!pegawai) return null;
    const riwayatPendidikan = Array.isArray(pegawai.riwayat_pendidikan) ? pegawai.riwayat_pendidikan : [];
    const latestRiwayatPangkat = Array.isArray(pegawai.riwayat_pangkat) && pegawai.riwayat_pangkat.length ? pegawai.riwayat_pangkat[0] : null;
    const historyRows = [
      ...riwayatPendidikan,
      ...(pegawai.riwayat_jabatan || []),
      ...(pegawai.riwayat_gaji_pokok || []),
      ...(pegawai.riwayat_pangkat || []),
      ...(pegawai.riwayat_penghargaan || []),
      ...(pegawai.riwayat_skp || []),
      ...(pegawai.riwayat_hukuman_disiplin || []),
      ...(pegawai.riwayat_prestasi_pendidikan || []),
      ...(pegawai.riwayat_narasumber || []),
      ...(pegawai.riwayat_kegiatan_strategis || []),
      ...(pegawai.riwayat_keberhasilan || [])
    ];

    return {
      nama: fullNameWithTitle(pegawai),
      tempatTanggalLahir: relationText([pegawai.tempat_lahir, formatDate(pegawai.tanggal_lahir)]),
      umur: durationFrom(pegawai.tanggal_lahir),
      masaKerja: durationFrom(pegawai.tmt_kerja_ukpd),
      tmtKerja: relationText([formatDate(pegawai.tmt_kerja_ukpd), durationFrom(pegawai.tmt_kerja_ukpd)]),
      jabatan: pegawai.nama_jabatan_menpan || pegawai.nama_jabatan_orb || "-",
      tmtPangkatTerbaru: latestRiwayatPangkat?.tmt_pangkat || pegawai.tmt_pangkat_terakhir || null,
      keluargaRows: buildKeluargaRows(pegawai),
      riwayatPendidikanFormal: riwayatPendidikan.filter((item) => normalizeJenisRiwayat(item.jenis_riwayat) === "formal"),
      riwayatPendidikanNonFormal: riwayatPendidikan.filter((item) => normalizeJenisRiwayat(item.jenis_riwayat) === "non_formal"),
      totalRiwayat: historyRows.length,
      historyYears: [...new Set(historyRows.map(getHistoryYear).filter(Boolean))].sort((a, b) => Number(b) - Number(a))
    };
  }, [pegawai]);

  const visibleHistory = useMemo(() => {
    if (!pegawai || !computed || !historyActivated) return [];
    return historyConfig(pegawai, computed, historyQuery, historyYear).filter((section) => section.data?.length);
  }, [computed, historyActivated, historyQuery, historyYear, pegawai]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-500">Memuat detail pegawai...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => setRefreshKey((value) => value + 1)} />;
  }

  if (!pegawai || !computed) return <EmptyTabState />;

  const overviewIdentity = (
    <InfoGrid
      columns="lg:grid-cols-3"
      items={[
        { label: "NRK", value: pegawai.nrk },
        { label: "NIP", value: pegawai.nip },
        { label: "Jenis Kelamin", value: pegawai.jenis_kelamin },
        { label: "Tempat / Tanggal Lahir", value: computed.tempatTanggalLahir },
        { label: "Umur", value: computed.umur },
        { label: "Agama", value: pegawai.agama }
      ]}
    />
  );

  const quickNavItems = {
    overview: [
      { label: "Ringkasan", href: "#summary" },
      overviewIdentity && { label: "Identitas", href: "#identity" },
      { label: "Kontak Utama", href: "#contact-snapshot" }
    ],
    employment: [
      { label: "Status", href: "#employment-status" },
      { label: "Jabatan", href: "#employment-position" },
      { label: "Pendidikan", href: "#employment-education" }
    ],
    contact: [
      { label: "Kontak", href: "#contact-main" },
      { label: "Alamat", href: "#address-main" }
    ],
    family: [{ label: "Keluarga", href: "#family-main" }],
    history: [
      { label: "Filter Riwayat", href: "#history-filter" },
      { label: "Daftar Riwayat", href: "#history-list" }
    ]
  }[activeTab];

  return (
    <div className="space-y-5">
      <ProfileSummary pegawai={pegawai} computed={computed} />
      <TabsNavigation activeTab={activeTab} onChange={changeTab} />

      <div className="grid gap-5 xl:grid-cols-[1fr_220px]">
        <main className="space-y-5">
          {activeTab === "overview" ? (
            <>
              <SectionCard id="summary" title="Ringkasan Pegawai" description="Data paling sering dipakai untuk identifikasi cepat.">
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <BriefcaseBusiness className="h-5 w-5 text-dinkes-700" />
                    <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">Jabatan</p>
                    <p className="mt-1 text-sm font-extrabold text-slate-950">{computed.jabatan}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <MapPin className="h-5 w-5 text-dinkes-700" />
                    <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">UKPD</p>
                    <p className="mt-1 text-sm font-extrabold text-slate-950">{valueOrDash(pegawai.nama_ukpd)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <FileText className="h-5 w-5 text-dinkes-700" />
                    <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">Total Riwayat</p>
                    <p className="mt-1 text-sm font-extrabold text-slate-950">{formatNumber(computed.totalRiwayat)}</p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard id="identity" title="Identitas" description="Informasi personal utama.">
                {overviewIdentity}
              </SectionCard>

              <SectionCard id="contact-snapshot" title="Kontak Utama" description="Kanal komunikasi yang bisa langsung digunakan.">
                <div className="grid gap-3 md:grid-cols-3">
                  {hasValue(pegawai.email) ? (
                    <a className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-dinkes-700 hover:bg-dinkes-50" href={`mailto:${pegawai.email}`}>
                      <Mail className="mb-2 h-5 w-5" />
                      {pegawai.email}
                    </a>
                  ) : null}
                  {hasValue(pegawai.no_hp_pegawai) ? (
                    <a className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-dinkes-700 hover:bg-dinkes-50" href={`tel:${String(pegawai.no_hp_pegawai).replace(/[^\d+]/g, "")}`}>
                      <Phone className="mb-2 h-5 w-5" />
                      {pegawai.no_hp_pegawai}
                    </a>
                  ) : null}
                  {hasValue(pegawai.wilayah) ? (
                    <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700">
                      <MapPin className="mb-2 h-5 w-5 text-dinkes-700" />
                      {pegawai.wilayah}
                    </div>
                  ) : null}
                </div>
              </SectionCard>
            </>
          ) : null}

          {activeTab === "employment" ? (
            <>
              <SectionCard id="employment-status" title="Status Kepegawaian" description="Status kerja, rumpun, dan masa kerja.">
                <InfoGrid
                  items={[
                    { label: "Jenis Pegawai", value: pegawai.jenis_pegawai },
                    { label: "Status Aktif", value: pegawai.kondisi },
                    { label: "Status Rumpun", value: pegawai.status_rumpun },
                    { label: "Jenis Kontrak", value: pegawai.jenis_kontrak },
                    { label: "TMT Kerja UKPD", value: computed.tmtKerja },
                    { label: "UKPD", value: pegawai.nama_ukpd },
                    { label: "Wilayah", value: pegawai.wilayah }
                  ]}
                />
              </SectionCard>

              <SectionCard id="employment-position" title="Jabatan & Pangkat" description="Posisi aktif dan pangkat terakhir.">
                <InfoGrid
                  items={[
                    { label: "Jabatan Pergub", value: pegawai.nama_jabatan_orb },
                    { label: "Jabatan Standar Kepgub 11", value: pegawai.nama_jabatan_menpan },
                    { label: "Atasan Langsung", value: pegawai.struktur_atasan_langsung },
                    { label: "Pangkat / Golongan", value: pegawai.pangkat_golongan },
                    { label: "TMT Pangkat", value: formatDate(computed.tmtPangkatTerbaru) }
                  ]}
                />
              </SectionCard>

              <SectionCard id="employment-education" title="Pendidikan Terakhir" description="Informasi pendidikan yang melekat pada profil aktif.">
                <InfoGrid
                  items={[
                    { label: "Jenjang", value: pegawai.jenjang_pendidikan },
                    { label: "Program Studi", value: pegawai.program_studi },
                    { label: "Universitas / Institusi", value: pegawai.nama_universitas }
                  ]}
                />
              </SectionCard>
            </>
          ) : null}

          {activeTab === "contact" ? (
            <>
              <SectionCard id="contact-main" title="Kontak" description="Email dan nomor yang dapat dihubungi.">
                <InfoGrid
                  items={[
                    { label: "Email", value: pegawai.email, type: "email" },
                    { label: "No. HP", value: pegawai.no_hp_pegawai, type: "phone" },
                    { label: "No. BPJS", value: pegawai.no_bpjs }
                  ]}
                />
              </SectionCard>
              <SectionCard id="address-main" title="Alamat" description="Alamat KTP dan domisili yang tercatat.">
                <InfoGrid
                  columns="lg:grid-cols-2"
                  items={[
                    { label: "Alamat KTP", value: pegawai.alamat_ktp },
                    { label: "Alamat Domisili", value: pegawai.alamat_domisili }
                  ]}
                />
              </SectionCard>
            </>
          ) : null}

          {activeTab === "family" ? (
            <SectionCard id="family-main" title="Keluarga" description="Anggota keluarga yang tercatat pada profil pegawai.">
              {computed.keluargaRows.length ? <CompactListTable columns={keluargaColumns} data={computed.keluargaRows} /> : <EmptyTabState />}
            </SectionCard>
          ) : null}

          {activeTab === "history" ? (
            <section className="space-y-4" id="history-list">
              <div id="history-filter" className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 lg:grid-cols-[1fr_180px]">
                  <label className="relative">
                    <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      className="input pl-10"
                      value={historyQuery}
                      onChange={(event) => setHistoryQuery(event.target.value)}
                      placeholder="Cari riwayat jabatan, pendidikan, SK, penghargaan..."
                    />
                  </label>
                  <select className="input" value={historyYear} onChange={(event) => setHistoryYear(event.target.value)}>
                    <option value="">Semua tahun</option>
                    {computed.historyYears.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              {visibleHistory.length ? (
                visibleHistory.map((section) => (
                  <HistoryAccordion
                    key={section.title}
                    title={section.title}
                    description={section.description}
                    columns={section.columns}
                    data={section.data}
                  />
                ))
              ) : (
                <EmptyTabState />
              )}
            </section>
          ) : null}
        </main>
        <QuickNav items={quickNavItems} />
      </div>
    </div>
  );
}
