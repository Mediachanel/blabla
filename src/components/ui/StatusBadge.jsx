import { normalizeJenisPegawai } from "@/lib/helpers/pegawaiStatus";

const statusStyles = {
  Aktif: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  PNS: "bg-dinkes-50 text-dinkes-700 ring-dinkes-200",
  CPNS: "bg-sky-50 text-sky-700 ring-sky-200",
  PPPK: "bg-govgold-50 text-govgold-700 ring-govgold-300",
  "PPPK Paruh Waktu": "bg-amber-50 text-amber-700 ring-amber-200",
  "NON PNS": "bg-slate-100 text-slate-700 ring-slate-200",
  PJLP: "bg-violet-50 text-violet-700 ring-violet-200",
  Diajukan: "bg-amber-50 text-amber-700 ring-amber-200",
  Diusulkan: "bg-amber-50 text-amber-700 ring-amber-200",
  Verifikasi: "bg-sky-50 text-sky-700 ring-sky-200",
  Diproses: "bg-sky-50 text-sky-700 ring-sky-200",
  Selesai: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Ditolak: "bg-rose-50 text-rose-700 ring-rose-200"
};

function normalizeUsulanStatus(status) {
  const value = String(status || "").trim();
  const lower = value.toLowerCase();
  if (lower === "selesai") return "Selesai";
  if (lower === "ditolak") return "Ditolak";
  if (lower === "diproses") return "Diproses";
  if (lower === "diusulkan" || lower === "diajukan") return "Diusulkan";
  return value;
}

export default function StatusBadge({ status }) {
  const normalized = statusStyles[normalizeUsulanStatus(status)]
    ? normalizeUsulanStatus(status)
    : normalizeJenisPegawai(status);
  const label = statusStyles[normalized] ? normalized : status;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusStyles[normalized] || statusStyles[status] || "bg-slate-100 text-slate-700 ring-slate-200"}`}>
      {label || "-"}
    </span>
  );
}
