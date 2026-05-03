"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  FileCheck2,
  FileWarning,
  FileSignature,
  FolderSync,
  Landmark,
  Pencil,
  Plus,
  Printer,
  Save,
  Send,
  SquarePen,
  Stamp,
  Undo2,
  Upload,
  X
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import DataTable from "@/components/tables/DataTable";
import SearchFilterBar from "@/components/forms/SearchFilterBar";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { ROLES } from "@/lib/constants/roles";
import {
  CHECKLIST_DOCUMENT_MAX_BYTES,
  CHECKLIST_DOCUMENT_MAX_MB,
  PUTUS_JF_CHECKLIST_LABELS as CHECKLIST_LABELS,
  formatFileSize,
  hasChecklistDocument,
  parseChecklist,
  parseChecklistDocuments
} from "@/lib/usulan/checklist";

const FLOW_STEPS = [
  { key: 1, title: "UKPD Mengusulkan", description: "UKPD mengajukan data putus/pembebasan JF beserta alasan." },
  { key: 2, title: "Sudin Verifikasi", description: "Sudin memverifikasi dasar usulan dan kelengkapan surat." },
  { key: 3, title: "Diterima Dinas", description: "Berkas lengkap diterima Dinas untuk proses lebih lanjut." },
  { key: 4, title: "Dinas Verifikasi", description: "Dinas memeriksa kecocokan usulan, dasar hukum, dan jabatan tujuan." },
  { key: 5, title: "Surat Putus JF", description: "Jika sesuai, surat usulan putus/pembebasan JF disiapkan." }
];

const STATUS_OPTIONS = ["Diusulkan", "Verifikasi Sudin", "Diterima Dinas", "Verifikasi Dinas", "Dikembalikan", "Selesai", "Ditolak"];
const DINAS_PRINT_STATUSES = new Set(["diterima dinas", "verifikasi dinas", "diproses", "selesai"]);

const emptyForm = {
  nrk: "",
  nip: "",
  nama_pegawai: "",
  pangkat_golongan: "",
  nama_ukpd: "",
  jabatan: "",
  jabatan_baru: "",
  angka_kredit: "",
  nomor_surat: "",
  tanggal_surat: "",
  hal: "",
  pimpinan: "",
  asal_surat: "",
  alasan_pemutusan: "",
  berkas_path: "",
  keterangan: ""
};

const emptyVerifyForm = {
  id: null,
  status: "Verifikasi Sudin",
  keterangan: "",
  verif_checklist: Object.fromEntries(Object.keys(CHECKLIST_LABELS).map((key) => [key, false])),
  dokumen_checklist: Object.fromEntries(Object.keys(CHECKLIST_LABELS).map((key) => [key, null]))
};

function emptyChecklistDocuments() {
  return Object.fromEntries(Object.keys(CHECKLIST_LABELS).map((key) => [key, null]));
}

function uniqueOptions(values) {
  return [...new Set(values.map((value) => normalizeText(value)).filter(Boolean))].sort((a, b) => a.localeCompare(b, "id"));
}

function optionsWithCurrent(options, current) {
  return uniqueOptions([...options, current]);
}

function getPegawaiJabatan(item) {
  return item?.nama_jabatan_menpan || item?.nama_jabatan_orb || item?.jabatan || "";
}

function applyPegawaiToForm(current, pegawai) {
  return {
    ...current,
    nrk: pegawai.nrk || current.nrk || "",
    nip: pegawai.nip || "",
    nama_pegawai: pegawai.nama || pegawai.nama_pegawai || "",
    pangkat_golongan: pegawai.pangkat_golongan || "",
    nama_ukpd: pegawai.nama_ukpd || "",
    jabatan: getPegawaiJabatan(pegawai)
  };
}

function normalizeText(value) {
  return String(value || "").trim();
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function buildFormFromItem(item, fallbackUkpd = "") {
  return {
    ...emptyForm,
    ...item,
    nama_ukpd: item?.nama_ukpd || fallbackUkpd || "",
    angka_kredit: item?.angka_kredit === null || item?.angka_kredit === undefined ? "" : String(item.angka_kredit)
  };
}

function getChecklistSummary(item) {
  const checklist = parseChecklist(item.verif_checklist, CHECKLIST_LABELS);
  const documents = parseChecklistDocuments(item.dokumen_checklist, CHECKLIST_LABELS, "putus-jf", item.id);
  const entries = Object.entries(CHECKLIST_LABELS).map(([key, label]) => ({
    key,
    label,
    checked: Boolean(checklist[key]),
    document: documents[key],
    hasDocument: hasChecklistDocument(documents[key])
  }));
  const checked = entries.filter((entry) => entry.checked).length;
  const documentCount = entries.filter((entry) => entry.hasDocument).length;
  return {
    checklist: entries,
    total: entries.length,
    checked,
    documentCount,
    percent: entries.length ? Math.round((documentCount / entries.length) * 100) : 0
  };
}

function getPutusFlow(item) {
  const status = normalizeText(item.status).toLowerCase();
  if (status === "verifikasi sudin") return { step: 2, stageLabel: "Verifikasi Sudin", nextAction: "Sudin memverifikasi dasar usulan dan kelengkapan surat." };
  if (status === "diterima dinas") return { step: 3, stageLabel: "Diterima Dinas", nextAction: "Berkas lengkap diterima Dinas untuk proses lebih lanjut." };
  if (status === "verifikasi dinas") return { step: 4, stageLabel: "Verifikasi Dinas", nextAction: "Dinas memfinalkan usulan surat putus JF." };
  if (status === "dikembalikan" || status === "ditolak") return { step: 2, stageLabel: "Kembali ke Sudin", nextAction: "Lengkapi usulan lalu kirim ulang." };
  if (status === "selesai") return { step: 5, stageLabel: "Surat selesai", nextAction: "Arsipkan dan teruskan ke proses penetapan." };
  if (status === "diproses") return { step: 3, stageLabel: "Diterima Dinas", nextAction: "Usulan sedang diproses lebih lanjut." };
  return { step: 1, stageLabel: "Usulan UKPD", nextAction: "Lengkapi data dasar dan surat pengantar." };
}

function canPrintDinasUsulan(user, item, statusOverride = "") {
  if (user?.role !== ROLES.SUPER_ADMIN || !item?.id) return false;
  const status = normalizeText(statusOverride || item.status).toLowerCase();
  return DINAS_PRINT_STATUSES.has(status);
}

function getDownloadFileName(disposition, fallback) {
  const header = disposition || "";
  const utfName = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfName?.[1]) return decodeURIComponent(utfName[1]);

  const plainName = header.match(/filename="?([^";]+)"?/i);
  return plainName?.[1] || fallback;
}

function SummaryCard({ title, value, description, accent = "slate" }) {
  const accents = {
    slate: "border-slate-200 bg-white",
    blue: "border-sky-200 bg-sky-50/70",
    emerald: "border-emerald-200 bg-emerald-50/70",
    amber: "border-amber-200 bg-amber-50/70"
  };
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${accents[accent] || accents.slate}`}>
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function FlowStrip({ activeStep }) {
  return (
    <section className="surface p-5">
      <div className="grid gap-4 xl:grid-cols-5">
        {FLOW_STEPS.map((step) => {
          const active = step.key === activeStep;
          const passed = step.key < activeStep;
          return (
            <div key={step.key} className={`rounded-2xl border p-4 ${active ? "border-dinkes-200 bg-dinkes-50/60" : "border-slate-200 bg-white"}`}>
              <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${passed ? "bg-emerald-600 text-white" : active ? "bg-dinkes-700 text-white" : "bg-slate-100 text-slate-500"}`}>
                {step.key}
              </div>
              <p className="text-sm font-bold text-slate-900">{step.title}</p>
              <p className="mt-1 text-sm leading-5 text-slate-500">{step.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ActionPanel({
  mode,
  form,
  verifyForm,
  activeItem,
  pegawaiLookupMessage,
  referenceOptions,
  formDocuments,
  pendingFormFiles,
  onClose,
  onFormChange,
  onVerifyChange,
  onSubmitForm,
  onSubmitVerify,
  onUploadDocument,
  onSelectFormDocument,
  onPrintUsulan,
  canPrintUsulan,
  saving,
  printingUsulan,
  uploadingKey
}) {
  if (!mode) return null;

  if (mode === "verify") {
    return (
      <section className="surface space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Validasi / Verifikasi</h2>
            <p className="text-sm text-slate-500">Perbarui status, checklist, dan dokumen pendukung.</p>
          </div>
          <button className="btn-secondary" type="button" onClick={onClose}>
            <X className="h-4 w-4" />
            Tutup
          </button>
        </div>

        {activeItem ? (
          <div className="rounded-2xl border border-dinkes-100 bg-dinkes-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-dinkes-700">Sedang Diverifikasi</p>
            <h3 className="mt-1 text-base font-bold text-slate-950">{activeItem.nama_pegawai || "-"}</h3>
            <p className="mt-1 text-sm text-slate-600">NRK {activeItem.nrk || "-"} | NIP {activeItem.nip || "-"}</p>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-xl bg-white px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">UKPD</p>
                <p className="mt-1 font-medium text-slate-900">{activeItem.nama_ukpd || "-"}</p>
              </div>
              <div className="rounded-xl bg-white px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pangkat</p>
                <p className="mt-1 font-medium text-slate-900">{activeItem.pangkat_golongan || "-"}</p>
              </div>
              <div className="rounded-xl bg-white px-3 py-2 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Jabatan</p>
                <p className="mt-1 font-medium text-slate-900">{activeItem.jabatan || "-"} ke {activeItem.jabatan_baru || "-"}</p>
              </div>
            </div>
          </div>
        ) : null}

        <label className="space-y-2">
          <span className="label">Status Proses</span>
          <select className="input" value={verifyForm.status} onChange={(event) => onVerifyChange("status", event.target.value)}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>

        <div className="rounded-2xl border border-slate-200 p-4">
          <div className="mb-3 flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-dinkes-700" />
            <h3 className="text-sm font-semibold text-slate-900">Checklist Dokumen</h3>
          </div>
          <p className="mb-3 text-xs text-slate-500">Upload PDF maksimal {CHECKLIST_DOCUMENT_MAX_MB} MB untuk setiap item checklist.</p>
          <div className="space-y-2">
            {Object.entries(CHECKLIST_LABELS).map(([key, label]) => {
              const document = verifyForm.dokumen_checklist?.[key];
              const isUploading = uploadingKey === key;
              return (
                <div key={key} className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-700">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800">{label}</p>
                      {document ? (
                        <a className="mt-1 block truncate text-xs font-semibold text-dinkes-700 hover:underline" href={document.url} target="_blank" rel="noreferrer">
                          {document.name} ({formatFileSize(document.size)})
                        </a>
                      ) : (
                        <p className="mt-1 text-xs text-slate-500">Belum ada PDF</p>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(verifyForm.verif_checklist[key])}
                      onChange={(event) => onVerifyChange("verif_checklist", { ...verifyForm.verif_checklist, [key]: event.target.checked })}
                    />
                  </div>
                  <label className={`mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${isUploading ? "border-slate-200 bg-white text-slate-400" : "border-dinkes-200 bg-white text-dinkes-700 hover:bg-dinkes-50"}`}>
                    <Upload className="h-3.5 w-3.5" />
                    {isUploading ? "Mengunggah..." : document ? "Ganti PDF" : "Upload PDF"}
                    <input
                      className="sr-only"
                      type="file"
                      accept="application/pdf"
                      disabled={isUploading}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) onUploadDocument(key, file);
                        event.target.value = "";
                      }}
                    />
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        <label className="space-y-2">
          <span className="label">Catatan Verifikator</span>
          <textarea className="input min-h-32" value={verifyForm.keterangan} onChange={(event) => onVerifyChange("keterangan", event.target.value)} />
        </label>

        {canPrintUsulan ? (
          <button className="btn-secondary w-full justify-center" type="button" onClick={onPrintUsulan} disabled={printingUsulan || saving}>
            <Printer className="h-4 w-4" />
            {printingUsulan ? "Menyiapkan DOCX..." : "Cetak Usulan"}
          </button>
        ) : null}

        <button className="btn-primary w-full" type="button" onClick={onSubmitVerify} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Menyimpan..." : "Simpan Verifikasi"}
        </button>
      </section>
    );
  }

  const jabatanOptions = optionsWithCurrent([
    ...(referenceOptions?.jabatanMenpanOptions || []),
    ...(referenceOptions?.jabatanOrbOptions || [])
  ], form.jabatan_baru);

  return (
    <form className="surface space-y-4 p-5" onSubmit={onSubmitForm}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {mode === "create" ? <Plus className="h-5 w-5 text-dinkes-700" /> : <Pencil className="h-5 w-5 text-dinkes-700" />}
          <div>
            <h2 className="text-base font-semibold text-slate-900">{mode === "create" ? "Tambah Usulan Putus JF" : "Edit Usulan Putus JF"}</h2>
            <p className="text-sm text-slate-500">Form hanya dibuka saat dibutuhkan agar tampilan daftar tetap rapi.</p>
          </div>
        </div>
        <button className="btn-secondary" type="button" onClick={onClose}>
          <X className="h-4 w-4" />
          Tutup
        </button>
      </div>

      <div className="space-y-4">
        <label className="space-y-2">
          <span className="label">NRK Pegawai</span>
          <input className="input" value={form.nrk} onChange={(event) => onFormChange("nrk", event.target.value.replace(/\D/g, ""))} required placeholder="Masukkan NRK" />
          {pegawaiLookupMessage ? <p className="text-xs text-slate-500">{pegawaiLookupMessage}</p> : null}
        </label>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-dinkes-700" />
            <h3 className="text-sm font-semibold text-slate-900">Data Pegawai dari Master</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              ["NIP", form.nip],
              ["Nama Pegawai", form.nama_pegawai],
              ["Pangkat/Golongan", form.pangkat_golongan],
              ["UKPD", form.nama_ukpd],
              ["Jabatan Fungsional", form.jabatan]
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-white px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                <p className="mt-1 min-h-5 text-sm font-medium text-slate-900">{value || "-"}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="label">Jabatan Baru / Tujuan</span>
            <select className="input" value={form.jabatan_baru} onChange={(event) => onFormChange("jabatan_baru", event.target.value)}>
              <option value="">Pilih jabatan baru</option>
              {jabatanOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          {[
            ["angka_kredit", "Angka Kredit"],
            ["nomor_surat", "Nomor Surat"],
            ["tanggal_surat", "Tanggal Surat"],
            ["hal", "Hal"],
            ["pimpinan", "Pimpinan Penandatangan"],
            ["asal_surat", "Asal Surat"]
          ].map(([name, label]) => (
            <label key={name} className={`space-y-2 ${["hal", "pimpinan", "asal_surat"].includes(name) ? "md:col-span-2" : ""}`}>
              <span className="label">{label}</span>
              <input
                className="input"
                type={name === "tanggal_surat" ? "date" : name === "angka_kredit" ? "number" : "text"}
                step={name === "angka_kredit" ? "0.01" : undefined}
                value={form[name]}
                onChange={(event) => onFormChange(name, event.target.value)}
              />
            </label>
          ))}
        </div>
      </div>

      <label className="space-y-2">
        <span className="label">Alasan Putus / Pembebasan JF</span>
        <textarea className="input min-h-28" value={form.alasan_pemutusan} onChange={(event) => onFormChange("alasan_pemutusan", event.target.value)} required />
      </label>

      <div className="rounded-2xl border border-slate-200 p-4">
        <div className="mb-3 flex items-center gap-2">
          <FileCheck2 className="h-4 w-4 text-dinkes-700" />
          <h3 className="text-sm font-semibold text-slate-900">Dokumen Checklist</h3>
        </div>
        <p className="mb-3 text-xs text-slate-500">Pilih PDF maksimal {CHECKLIST_DOCUMENT_MAX_MB} MB per item. File akan diunggah saat usulan disimpan.</p>
        <div className="space-y-2">
          {Object.entries(CHECKLIST_LABELS).map(([key, label]) => {
            const document = formDocuments?.[key];
            const pendingFile = pendingFormFiles?.[key];
            const isUploading = uploadingKey === key;
            return (
              <div key={key} className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-700">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800">{label}</p>
                  {pendingFile ? (
                    <p className="mt-1 truncate text-xs font-semibold text-amber-700">
                      {pendingFile.name} ({formatFileSize(pendingFile.size)}) - siap diunggah
                    </p>
                  ) : document ? (
                    <a className="mt-1 block truncate text-xs font-semibold text-dinkes-700 hover:underline" href={document.url} target="_blank" rel="noreferrer">
                      {document.name} ({formatFileSize(document.size)})
                    </a>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500">Belum ada PDF</p>
                  )}
                </div>
                <label className={`mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${saving || isUploading ? "border-slate-200 bg-white text-slate-400" : "border-dinkes-200 bg-white text-dinkes-700 hover:bg-dinkes-50"}`}>
                  <Upload className="h-3.5 w-3.5" />
                  {isUploading ? "Mengunggah..." : pendingFile ? "Ganti pilihan" : document ? "Ganti PDF" : "Pilih PDF"}
                  <input
                    className="sr-only"
                    type="file"
                    accept="application/pdf"
                    disabled={saving || isUploading}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) onSelectFormDocument(key, file);
                      event.target.value = "";
                    }}
                  />
                </label>
              </div>
            );
          })}
        </div>
      </div>

      <label className="space-y-2">
        <span className="label">Catatan</span>
        <textarea className="input min-h-24" value={form.keterangan} onChange={(event) => onFormChange("keterangan", event.target.value)} />
      </label>

      <button className="btn-primary w-full" disabled={saving}>
        <Send className="h-4 w-4" />
        {saving ? "Menyimpan..." : mode === "create" ? "Simpan Usulan Putus JF" : "Simpan Perubahan"}
      </button>
    </form>
  );
}

export default function UsulanPutusJfPage() {
  const [rows, setRows] = useState([]);
  const [user, setUser] = useState(null);
  const [referenceOptions, setReferenceOptions] = useState({ jabatanMenpanOptions: [], jabatanOrbOptions: [] });
  const [form, setForm] = useState(emptyForm);
  const [verifyForm, setVerifyForm] = useState(emptyVerifyForm);
  const [pegawaiLookupMessage, setPegawaiLookupMessage] = useState("");
  const [formDocuments, setFormDocuments] = useState(emptyChecklistDocuments);
  const [pendingFormFiles, setPendingFormFiles] = useState(emptyChecklistDocuments);
  const [panelMode, setPanelMode] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [printingId, setPrintingId] = useState(null);
  const [uploadingKey, setUploadingKey] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function loadData() {
    setLoading(true);
    setErrorMessage("");
    try {
      const [putusResponse, userResponse, optionsResponse] = await Promise.all([
        fetch("/api/usulan/putus-jf", { cache: "no-store" }),
        fetch("/api/auth/me", { cache: "no-store" }),
        fetch("/api/pegawai/form-options", { cache: "no-store" })
      ]);
      const [putusPayload, userPayload, optionsPayload] = await Promise.all([putusResponse.json(), userResponse.json(), optionsResponse.json()]);
      if (!putusResponse.ok || !putusPayload.success) {
        throw new Error(putusPayload.message || "Data usulan putus JF gagal dimuat.");
      }
      if (optionsResponse.ok && optionsPayload.success) {
        setReferenceOptions(optionsPayload.data || {});
      }
      setRows(putusPayload.data || []);
      setSelectedId((current) => current || putusPayload.data?.[0]?.id || null);
      setUser(userPayload.data || null);
      if (userPayload.data?.nama_ukpd) {
        setForm((current) => ({ ...current, nama_ukpd: current.nama_ukpd || userPayload.data.nama_ukpd }));
      }
    } catch (error) {
      setErrorMessage(error.message || "Data usulan putus JF gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!panelMode || panelMode === "verify") return undefined;
    const nrk = normalizeText(form.nrk);
    if (!nrk) {
      setPegawaiLookupMessage("");
      return undefined;
    }
    if (nrk.length < 3) {
      setPegawaiLookupMessage("Ketik minimal 3 digit NRK.");
      return undefined;
    }

    let cancelled = false;
    setPegawaiLookupMessage("Mencari data pegawai...");
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/pegawai?q=${encodeURIComponent(nrk)}&pageSize=10`, { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.message || "Data pegawai gagal dicari.");
        const pegawai = (payload.data?.rows || []).find((item) => normalizeText(item.nrk) === nrk);
        if (cancelled) return;
        if (!pegawai) {
          setPegawaiLookupMessage("NRK tidak ditemukan pada master pegawai.");
          return;
        }
        setForm((current) => (normalizeText(current.nrk) === nrk ? applyPegawaiToForm(current, pegawai) : current));
        setPegawaiLookupMessage("Data pegawai terisi otomatis dari master.");
      } catch (error) {
        if (!cancelled) setPegawaiLookupMessage(error.message || "Data pegawai gagal dicari.");
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.nrk, panelMode]);

  const decoratedRows = useMemo(() => rows.map((item) => ({
    ...item,
    _flow: getPutusFlow(item),
    _checklist: getChecklistSummary(item)
  })), [rows]);
  const statusOptions = useMemo(() => [...new Set(rows.map((item) => normalizeText(item.status)).filter(Boolean))], [rows]);
  const stageOptions = FLOW_STEPS.map((step) => `${step.key}. ${step.title}`);
  const summaries = useMemo(() => ({
    total: decoratedRows.length,
    usulanBaru: decoratedRows.filter((item) => item._flow.step === 1).length,
    verifikasi: decoratedRows.filter((item) => item._flow.step === 2 || item._flow.step === 4).length,
    selesai: decoratedRows.filter((item) => normalizeText(item.status).toLowerCase() === "selesai").length
  }), [decoratedRows]);

  const filteredRows = useMemo(() => decoratedRows.filter((item) => {
    const haystack = [
      item.nrk,
      item.nip,
      item.nama_pegawai,
      item.nama_ukpd,
      item.jabatan,
      item.jabatan_baru,
      item.alasan_pemutusan,
      item.nomor_surat,
      item.hal
    ].join(" ").toLowerCase();
    const matchesSearch = haystack.includes(search.toLowerCase());
    const matchesStatus = !statusFilter || normalizeText(item.status) === statusFilter;
    const matchesStage = !stageFilter || `${item._flow.step}. ${FLOW_STEPS[item._flow.step - 1]?.title}` === stageFilter;
    return matchesSearch && matchesStatus && matchesStage;
  }), [decoratedRows, search, statusFilter, stageFilter]);

  const selected = filteredRows.find((item) => item.id === selectedId) || decoratedRows.find((item) => item.id === selectedId) || null;
  const activeItem = decoratedRows.find((item) => item.id === activeId) || rows.find((item) => item.id === activeId) || null;

  function closePanel() {
    setPanelMode(null);
    setActiveId(null);
    setForm((current) => ({ ...emptyForm, nama_ukpd: user?.nama_ukpd || current.nama_ukpd || "" }));
    setFormDocuments(emptyChecklistDocuments());
    setPendingFormFiles(emptyChecklistDocuments());
    setPegawaiLookupMessage("");
    setVerifyForm(emptyVerifyForm);
  }

  function openCreate() {
    setActiveId(null);
    setPanelMode("create");
    setForm(buildFormFromItem(null, user?.nama_ukpd || ""));
    setFormDocuments(emptyChecklistDocuments());
    setPendingFormFiles(emptyChecklistDocuments());
    setPegawaiLookupMessage("");
  }

  function openEdit(item) {
    setActiveId(item.id);
    setPanelMode("edit");
    setForm(buildFormFromItem(item, user?.nama_ukpd || ""));
    setFormDocuments(parseChecklistDocuments(item.dokumen_checklist, CHECKLIST_LABELS, "putus-jf", item.id));
    setPendingFormFiles(emptyChecklistDocuments());
    setPegawaiLookupMessage(item.nrk ? "" : "Isi NRK jika ingin memperbarui data pegawai dari master.");
  }

  function openVerify(item) {
    setActiveId(item.id);
    setPanelMode("verify");
    setVerifyForm({
      id: item.id,
      status: item.status || "Verifikasi Sudin",
      keterangan: item.keterangan || "",
      verif_checklist: parseChecklist(item.verif_checklist, CHECKLIST_LABELS),
      dokumen_checklist: parseChecklistDocuments(item.dokumen_checklist, CHECKLIST_LABELS, "putus-jf", item.id)
    });
  }

  function updateRow(updatedItem) {
    setRows((current) => {
      const exists = current.some((item) => item.id === updatedItem.id);
      return exists ? current.map((item) => (item.id === updatedItem.id ? updatedItem : item)) : [updatedItem, ...current];
    });
    setSelectedId(updatedItem.id);
  }

  function validatePdfFile(file) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Dokumen pendukung wajib berformat PDF.");
      return false;
    }
    if (file.size > CHECKLIST_DOCUMENT_MAX_BYTES) {
      setErrorMessage(`Ukuran PDF maksimal ${CHECKLIST_DOCUMENT_MAX_MB} MB per dokumen.`);
      return false;
    }
    setErrorMessage("");
    return true;
  }

  function selectPendingFormDocument(key, file) {
    if (!validatePdfFile(file)) return;
    setPendingFormFiles((current) => ({ ...current, [key]: file }));
  }

  async function uploadPendingDocuments(itemId, files) {
    let latestItem = null;
    const selectedFiles = Object.entries(files).filter(([, file]) => Boolean(file));

    for (const [key, file] of selectedFiles) {
      setUploadingKey(key);
      const formData = new FormData();
      formData.append("type", "putus-jf");
      formData.append("id", String(itemId));
      formData.append("key", key);
      formData.append("file", file);

      const response = await fetch("/api/usulan/dokumen", {
        method: "POST",
        body: formData
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Dokumen checklist gagal diunggah.");
      latestItem = payload.data;
    }

    setUploadingKey("");
    return latestItem;
  }

  async function handleSubmitForm(event) {
    event.preventDefault();
    if (!normalizeText(form.nrk)) {
      setErrorMessage("NRK pegawai wajib diisi.");
      return;
    }
    if (!normalizeText(form.nama_pegawai) || !normalizeText(form.nama_ukpd)) {
      setErrorMessage("Data pegawai belum terisi dari master. Periksa kembali NRK.");
      return;
    }
    setSaving(true);
    setErrorMessage("");
    try {
      const payloadBody = {
        ...form,
        angka_kredit: form.angka_kredit === "" ? null : Number(form.angka_kredit)
      };
      const response = await fetch("/api/usulan/putus-jf", {
        method: panelMode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(panelMode === "edit" ? { id: activeId, ...payloadBody } : payloadBody)
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Usulan putus JF gagal disimpan.");
      const uploadedItem = await uploadPendingDocuments(payload.data.id, pendingFormFiles);
      updateRow(uploadedItem || payload.data);
      closePanel();
    } catch (error) {
      setErrorMessage(error.message || "Usulan putus JF gagal disimpan.");
    } finally {
      setUploadingKey("");
      setSaving(false);
    }
  }

  async function handleSubmitVerify() {
    setSaving(true);
    setErrorMessage("");
    try {
      const { id, status, keterangan, verif_checklist } = verifyForm;
      const response = await fetch("/api/usulan/putus-jf", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, keterangan, verif_checklist })
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Verifikasi usulan putus JF gagal disimpan.");
      updateRow(payload.data);
      closePanel();
    } catch (error) {
      setErrorMessage(error.message || "Verifikasi usulan putus JF gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePrintUsulan(item) {
    const id = item?.id || item;
    if (!id) return;

    setPrintingId(id);
    setErrorMessage("");
    try {
      const response = await fetch(`/api/usulan/putus-jf/docx?id=${encodeURIComponent(id)}`, { cache: "no-store" });
      if (!response.ok) {
        let message = "Cetak usulan putus JF gagal dibuat.";
        const contentType = response.headers.get("Content-Type") || "";
        if (contentType.includes("application/json")) {
          const payload = await response.json();
          message = payload.message || message;
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = getDownloadFileName(response.headers.get("Content-Disposition"), `Putus_JF_${id}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setErrorMessage(error.message || "Cetak usulan putus JF gagal dibuat.");
    } finally {
      setPrintingId(null);
    }
  }

  async function handleUploadDocument(key, file) {
    if (!activeId) return;
    if (!validatePdfFile(file)) return;

    setUploadingKey(key);
    setErrorMessage("");
    try {
      const formData = new FormData();
      formData.append("type", "putus-jf");
      formData.append("id", String(activeId));
      formData.append("key", key);
      formData.append("file", file);

      const response = await fetch("/api/usulan/dokumen", {
        method: "POST",
        body: formData
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Dokumen checklist gagal diunggah.");
      updateRow(payload.data);
      setVerifyForm((current) => ({
        ...current,
        verif_checklist: parseChecklist(payload.data.verif_checklist, CHECKLIST_LABELS),
        dokumen_checklist: parseChecklistDocuments(payload.data.dokumen_checklist, CHECKLIST_LABELS, "putus-jf", payload.data.id)
      }));
    } catch (error) {
      setErrorMessage(error.message || "Dokumen checklist gagal diunggah.");
    } finally {
      setUploadingKey("");
    }
  }

  return (
    <>
      <PageHeader
        title="Usulan Putus Jabatan Fungsional"
        description="UI ini mengikuti alur usulan UKPD, verifikasi Sudin, penerimaan Dinas, verifikasi Dinas, hingga penyiapan surat usulan putus/pembebasan JF."
        breadcrumbs={[{ label: "Usulan" }, { label: "Putus JF" }]}
      />

      <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Total Usulan" value={summaries.total} description="Semua usulan putus/pembebasan JF." />
        <SummaryCard title="Usulan Baru" value={summaries.usulanBaru} description="Masih menunggu verifikasi Sudin." accent="amber" />
        <SummaryCard title="Sedang Diverifikasi" value={summaries.verifikasi} description="Sedang ditelaah oleh Sudin atau Dinas." accent="blue" />
        <SummaryCard title="Selesai" value={summaries.selesai} description="Sudah siap atau sudah dibuatkan surat." accent="emerald" />
      </div>

      <FlowStrip activeStep={selected?._flow.step || 1} />

      {errorMessage ? (
        <section className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </section>
      ) : null}

      <section className={`mt-5 grid gap-5 ${panelMode ? "xl:grid-cols-[420px_1fr]" : "xl:grid-cols-1"}`}>
        <ActionPanel
          mode={panelMode}
          form={form}
          verifyForm={verifyForm}
          activeItem={activeItem}
          pegawaiLookupMessage={pegawaiLookupMessage}
          referenceOptions={referenceOptions}
          formDocuments={formDocuments}
          pendingFormFiles={pendingFormFiles}
          saving={saving}
          onClose={closePanel}
          onFormChange={(name, value) => setForm((current) => ({ ...current, [name]: value }))}
          onVerifyChange={(name, value) => setVerifyForm((current) => ({ ...current, [name]: value }))}
          onSubmitForm={handleSubmitForm}
          onSubmitVerify={handleSubmitVerify}
          onUploadDocument={handleUploadDocument}
          onSelectFormDocument={selectPendingFormDocument}
          onPrintUsulan={() => handlePrintUsulan(activeItem)}
          canPrintUsulan={canPrintDinasUsulan(user, activeItem, verifyForm.status)}
          printingUsulan={printingId === activeItem?.id}
          uploadingKey={uploadingKey}
        />

        <div className="space-y-5">
          <SearchFilterBar
            search={search}
            onSearch={setSearch}
            filters={[
              { name: "status", label: "Semua status", value: statusFilter, onChange: setStatusFilter, options: statusOptions },
              { name: "tahap", label: "Semua tahap", value: stageFilter, onChange: setStageFilter, options: stageOptions }
            ]}
            actions={(
              <button className="btn-primary" type="button" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Tambah
              </button>
            )}
          />

          {loading ? <EmptyState title="Memuat data usulan" description="Data dari database sedang diambil." /> : (
            <DataTable
              rowKey="id"
              data={filteredRows}
              columns={[
                {
                  key: "pegawai",
                  header: "Pegawai",
                  render: (item) => (
                    <div className="max-w-[240px] whitespace-normal">
                      <p className="font-semibold text-slate-900">{item.nama_pegawai || "-"}</p>
                      <p className="text-xs text-slate-500">NRK {item.nrk || "-"} | NIP {item.nip || "-"}</p>
                    </div>
                  )
                },
                {
                  key: "jabatan",
                  header: "Jabatan",
                  render: (item) => (
                    <div className="max-w-[220px] whitespace-normal text-sm">
                      <p>{item.jabatan || "-"}</p>
                      <p className="text-slate-400">ke</p>
                      <p>{item.jabatan_baru || "-"}</p>
                    </div>
                  )
                },
                {
                  key: "surat",
                  header: "Surat",
                  render: (item) => (
                    <div className="w-44 whitespace-normal text-sm">
                      <p className="font-medium text-slate-900">{item.nomor_surat || "-"}</p>
                      <p className="text-xs text-slate-500">{formatDate(item.tanggal_surat)}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.asal_surat || "-"}</p>
                    </div>
                  )
                },
                {
                  key: "berkas",
                  header: "Berkas",
                  render: (item) => (
                    <div className="w-36 whitespace-normal text-sm">
                      <div className="mb-1 flex items-center gap-2">
                        {item._checklist.documentCount === item._checklist.total && item._checklist.total > 0 ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <FileWarning className="h-4 w-4 text-amber-600" />}
                        <span>{item._checklist.documentCount}/{item._checklist.total}</span>
                      </div>
                      <p className="text-xs text-slate-500">{item._checklist.documentCount ? "PDF checklist terlampir" : "Belum ada PDF checklist"}</p>
                    </div>
                  )
                },
                {
                  key: "tahap",
                  header: "Tahap",
                  render: (item) => (
                    <div className="w-40 whitespace-normal">
                      <p className="font-semibold text-slate-900">{item._flow.stageLabel}</p>
                      <StatusBadge status={item.status} />
                    </div>
                  )
                },
                { key: "tanggal_usulan", header: "Tgl Usulan", render: (item) => formatDate(item.tanggal_usulan || item.created_at) }
              ]}
              actions={(item) => (
                <div className="flex flex-wrap gap-2">
                  <button className="btn-secondary" type="button" onClick={() => setSelectedId(item.id)}>Detail</button>
                  <button className="btn-secondary" type="button" onClick={() => openEdit(item)}>
                    <SquarePen className="h-4 w-4" />
                    Edit
                  </button>
                  <button className="btn-secondary" type="button" onClick={() => openVerify(item)}>
                    <CheckCircle2 className="h-4 w-4" />
                    Verifikasi
                  </button>
                </div>
              )}
            />
          )}

          {selected ? (
            <section className="surface p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Detail Usulan Putus JF</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-950">{selected.nama_pegawai || "-"}</h2>
                  <p className="mt-1 text-sm text-slate-500">NRK {selected.nrk || "-"} | NIP {selected.nip || "-"} | {selected.nama_ukpd || "-"}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {canPrintDinasUsulan(user, selected) ? (
                    <button className="btn-secondary" type="button" onClick={() => handlePrintUsulan(selected)} disabled={printingId === selected.id}>
                      <Printer className="h-4 w-4" />
                      {printingId === selected.id ? "Menyiapkan..." : "Cetak Usulan"}
                    </button>
                  ) : null}
                  <StatusBadge status={selected.status} />
                  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    Tahap {selected._flow.step}
                  </span>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <FolderSync className="h-4 w-4 text-dinkes-700" />
                      <h3 className="text-sm font-semibold text-slate-900">Arah Proses</h3>
                    </div>
                    <p className="text-sm leading-6 text-slate-600">{selected._flow.nextAction}</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Angka Kredit</p>
                        <p className="mt-1 text-sm font-medium text-slate-900">{selected.angka_kredit ?? "-"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-dinkes-700" />
                      <h3 className="text-sm font-semibold text-slate-900">Data Surat</h3>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {[
                        ["Nomor Surat", selected.nomor_surat],
                        ["Tanggal Surat", formatDate(selected.tanggal_surat)],
                        ["Perihal", selected.hal],
                        ["Pimpinan", selected.pimpinan],
                        ["Asal Surat", selected.asal_surat],
                        ["Jabatan Baru", selected.jabatan_baru]
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-slate-900">{value || "-"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Stamp className="h-4 w-4 text-dinkes-700" />
                      <h3 className="text-sm font-semibold text-slate-900">Alasan Pemutusan</h3>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{selected.alasan_pemutusan || "-"}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Undo2 className="h-4 w-4 text-dinkes-700" />
                      <h3 className="text-sm font-semibold text-slate-900">Catatan Verifikator</h3>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{selected.keterangan || "-"}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <FileCheck2 className="h-4 w-4 text-dinkes-700" />
                      <h3 className="text-sm font-semibold text-slate-900">Checklist Dokumen</h3>
                    </div>
                    <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-dinkes-700" style={{ width: `${selected._checklist.percent}%` }} />
                    </div>
                    <p className="mb-3 text-xs text-slate-500">{selected._checklist.documentCount} dari {selected._checklist.total} PDF terunggah</p>
                    <div className="space-y-2">
                      {selected._checklist.checklist.map((entry) => (
                        <div key={entry.key} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                          <div className="min-w-0">
                            <span>{entry.label}</span>
                            {entry.document ? (
                              <a className="mt-1 block truncate text-xs font-semibold text-dinkes-700 hover:underline" href={entry.document.url} target="_blank" rel="noreferrer">
                                {entry.document.name} ({formatFileSize(entry.document.size)})
                              </a>
                            ) : (
                              <p className="mt-1 text-xs text-slate-500">Belum ada PDF</p>
                            )}
                          </div>
                          {entry.hasDocument ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <FileWarning className="h-4 w-4 shrink-0 text-slate-300" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-dinkes-700" />
                      <h3 className="text-sm font-semibold text-slate-900">Ringkasan Tahap</h3>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600">
                      {FLOW_STEPS.map((step) => (
                        <div key={step.key} className={`rounded-xl px-3 py-2 ${step.key === selected._flow.step ? "bg-dinkes-50 text-dinkes-800" : step.key < selected._flow.step ? "bg-emerald-50 text-emerald-700" : "bg-slate-50"}`}>
                          {step.key}. {step.title}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </>
  );
}
