"use client";

import { Suspense, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Bell,
  Building2,
  CalendarClock,
  ChevronDown,
  ClipboardList,
  Eye,
  EyeOff,
  FileQuestion,
  Fingerprint,
  HeartPulse,
  IdCard,
  Landmark,
  Loader2,
  LockKeyhole,
  Menu,
  ScanFace,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound
} from "lucide-react";
import dinkesLogo from "@/Foto/Dinkes.png";
import { isWebAuthnAvailable, requestOptionsFromJSON, serializePublicKeyCredential } from "@/lib/auth/webauthnClient";

const QUICK_ACTIONS = [
  { title: "Cari Informasi Mutasi", keyword: "mutasi", description: "Lihat syarat, alur, dan verifikasi usulan mutasi." },
  { title: "Cek Persyaratan Cuti", keyword: "cuti", description: "Temukan dokumen dan aturan cuti yang berlaku." },
  { title: "Lihat Alur Kenaikan Pangkat", keyword: "kenaikan pangkat", description: "Pahami tahapan dan dokumen kenaikan pangkat." },
  { title: "Panduan Disiplin Pegawai", keyword: "disiplin", description: "Pelajari aturan disiplin dan tindak lanjut administratif." }
];

const MOBILE_SERVICE_ACTIONS = [
  { title: "Pegawai", description: "Profil SDMK", icon: UsersRound },
  { title: "Usulan", description: "Mutasi & JF", icon: ClipboardList },
  { title: "DUK", description: "Urutan kerja", icon: IdCard },
  { title: "QnA", description: "Bantuan", icon: FileQuestion }
];

const BIOMETRIC_OPTIONS = [
  { label: "Finger", method: "sidik jari", icon: Fingerprint },
  { label: "Face", method: "pengenalan wajah", icon: ScanFace }
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(text, keyword) {
  if (!keyword) return text;
  const normalized = keyword.trim();
  if (!normalized) return text;
  const parts = String(text || "").split(new RegExp(`(${escapeRegex(normalized)})`, "ig"));
  return parts.map((part, index) => (
    part.toLowerCase() === normalized.toLowerCase()
      ? <mark key={`${part}-${index}`} className="rounded bg-amber-200/80 px-1 text-slate-900">{part}</mark>
      : <span key={`${part}-${index}`}>{part}</span>
  ));
}

function QnaSection({ quickSearch, onResetQuickSearch }) {
  const [data, setData] = useState({ categories: [], items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [openItems, setOpenItems] = useState([]);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    async function loadQna() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/qna/public", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.message || "QnA belum dapat dimuat.");
        }
        const categories = payload.data?.categories || [];
        setData(payload.data || { categories: [], items: [] });
        setActiveCategory(categories[0]?.id || null);
      } catch (err) {
        setError(err.message || "QnA belum dapat dimuat.");
      } finally {
        setLoading(false);
      }
    }

    loadQna();
  }, []);

  useEffect(() => {
    if (!quickSearch) return;
    setSearch(quickSearch);
    setOpenItems([]);
  }, [quickSearch]);

  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const visibleCategories = useMemo(() => {
    return data.categories.filter((category) => {
      if (!normalizedSearch) return true;
      const categoryText = [category.name, category.description, ...(category.items || []).flatMap((item) => [item.question, item.answer])].join(" ").toLowerCase();
      return categoryText.includes(normalizedSearch);
    });
  }, [data.categories, normalizedSearch]);

  useEffect(() => {
    if (!visibleCategories.length) {
      setActiveCategory(null);
      return;
    }
    if (!visibleCategories.some((category) => category.id === activeCategory)) {
      setActiveCategory(visibleCategories[0]?.id || null);
    }
  }, [visibleCategories, activeCategory]);

  const selectedCategory = visibleCategories.find((category) => category.id === activeCategory) || null;
  const visibleItems = useMemo(() => {
    const source = selectedCategory?.items || [];
    if (!normalizedSearch) return source;
    return source.filter((item) => `${item.question} ${item.answer}`.toLowerCase().includes(normalizedSearch));
  }, [selectedCategory, normalizedSearch]);

  const totalFaq = data.items.length;

  function resetSearch() {
    setSearch("");
    setOpenItems([]);
    onResetQuickSearch?.();
  }

  return (
    <section
      id="qna-layanan"
      aria-labelledby="qna-heading"
      className="overflow-hidden rounded-xl bg-white shadow-[0_22px_70px_rgba(15,23,42,0.08)] ring-1 ring-dinkes-100/90"
    >
      <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="border-b border-slate-200/80 bg-[linear-gradient(180deg,#f6f9ff,#eef5ff)] p-6 sm:p-8 lg:border-b-0 lg:border-r">
          <span className="inline-flex rounded-md bg-dinkes-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-dinkes-700">Pusat QnA</span>
          <h2 id="qna-heading" className="mt-5 text-2xl font-bold tracking-normal text-slate-900 sm:text-3xl">Pusat QnA Layanan Kepegawaian</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Temukan aturan, syarat, dan alur layanan tanpa membuka dokumen panjang.
          </p>

          <label htmlFor="qna-search" className="mt-6 block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Cari topik layanan</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="qna-search"
                className="h-12 w-full rounded-md border border-[#d8dde6] bg-white px-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-dinkes-500 focus:ring-2 focus:ring-dinkes-100"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari mutasi, cuti, kenaikan pangkat, disiplin..."
              />
            </span>
          </label>

          <div className="mt-3 flex flex-wrap gap-3">
            <button type="button" onClick={resetSearch} className="btn-secondary w-full sm:w-auto">
              Reset Pencarian
            </button>
            {normalizedSearch ? <p className="text-sm text-slate-500">Menampilkan hasil untuk: <span className="font-semibold text-slate-800">{deferredSearch}</span></p> : null}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { label: "Kategori Aktif", value: String(data.categories.length), icon: FileQuestion },
              { label: "FAQ Terbit", value: String(totalFaq), icon: ShieldCheck },
              { label: "Akses", value: "Publik", icon: UsersRound }
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-white/90 p-4 shadow-sm ring-1 ring-dinkes-100">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{item.label}</p>
                  <item.icon className="h-4 w-4 text-dinkes-700" aria-hidden="true" />
                </div>
                <p className="mt-3 text-2xl font-extrabold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-500">Kategori</h3>
              <span className="text-xs font-semibold text-slate-400">{visibleCategories.length} tampil</span>
            </div>

            <div className="grid gap-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-16 animate-pulse rounded-lg bg-white/70 ring-1 ring-slate-200" />
                ))
              ) : visibleCategories.length ? (
                visibleCategories.map((category) => {
                  const active = category.id === activeCategory;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setActiveCategory(category.id)}
                      className={`rounded-lg border p-4 text-left transition focus-ring ${active ? "border-dinkes-500 bg-dinkes-500 text-white shadow-button" : "border-slate-200 bg-white text-slate-800 hover:border-dinkes-200 hover:bg-dinkes-50/60"}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-extrabold">{highlightText(category.name, deferredSearch)}</p>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                          {category.items.length}
                        </span>
                      </div>
                      <p className={`mt-2 text-xs leading-5 ${active ? "text-dinkes-50" : "text-slate-500"}`}>
                        {highlightText(category.description || "Kategori informasi layanan kepegawaian.", deferredSearch)}
                      </p>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
                  Tidak ada hasil. Coba gunakan kata kunci lain.
                </div>
              )}
            </div>
          </div>
        </aside>

        <div className="bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-dinkes-600">Jawaban Terpilih</p>
              <h3 className="mt-2 text-2xl font-bold tracking-normal text-slate-900">
                {selectedCategory?.name || (loading ? "Memuat QnA..." : "Belum ada kategori")}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {selectedCategory?.description || "Pilih kategori untuk melihat daftar pertanyaan dan jawaban yang tersedia."}
              </p>
            </div>
            <div className="rounded-md bg-dinkes-50 px-4 py-3 text-sm font-semibold text-dinkes-700 ring-1 ring-dinkes-100">
              {visibleItems.length} pertanyaan
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-lg bg-slate-100" />
              ))
            ) : error ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800">
                {error}
              </div>
            ) : visibleItems.length ? (
              visibleItems.map((item) => {
                const open = openItems.includes(item.id);
                return (
                  <article key={item.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-dinkes-200 hover:shadow-md">
                    <button
                      type="button"
                      onClick={() => setOpenItems((current) => current.includes(item.id) ? current.filter((entry) => entry !== item.id) : [...current, item.id])}
                      className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left focus-ring"
                    >
                      <div>
                        <p className="text-base font-bold leading-7 text-slate-900">{highlightText(item.question, deferredSearch)}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{highlightText(item.category_name, deferredSearch)}</p>
                      </div>
                      <span className={`mt-1 rounded-md border p-2 text-slate-500 transition ${open ? "rotate-180 border-dinkes-200 bg-dinkes-50 text-dinkes-700" : "border-slate-200 bg-white"}`}>
                        <ChevronDown className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </button>
                    {open ? (
                      <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4">
                        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{highlightText(item.answer, deferredSearch)}</p>
                      </div>
                    ) : null}
                  </article>
                );
              })
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-6 text-slate-500">
                Tidak ada hasil. Coba gunakan kata kunci lain.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function JakartaSilhouette({ compact = false }) {
  return (
    <div className={`pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden ${compact ? "h-32" : "h-48"}`} aria-hidden="true">
      <div className="absolute inset-x-0 bottom-0 h-10 bg-white/10" />
      <div className="absolute bottom-8 left-[4%] h-14 w-12 rounded-t-md bg-white/10" />
      <div className="absolute bottom-8 left-[18%] h-20 w-10 rounded-t-lg bg-white/10" />
      <div className="absolute bottom-8 left-[29%] h-12 w-16 rounded-t-md bg-white/10" />
      <div className="absolute bottom-8 right-[26%] h-16 w-12 rounded-t-md bg-white/10" />
      <div className="absolute bottom-8 right-[11%] h-24 w-11 rounded-t-lg bg-white/10" />
      <div className="absolute bottom-8 right-[3%] h-14 w-14 rounded-t-md bg-white/10" />
      <div className="absolute bottom-8 left-1/2 h-28 w-20 -translate-x-1/2">
        <span className="absolute left-1/2 top-0 h-8 w-1.5 -translate-x-1/2 rounded-full bg-amber-200/90 shadow-[0_0_18px_rgba(254,240,138,0.55)]" />
        <span className="absolute left-1/2 top-7 h-16 w-3 -translate-x-1/2 rounded-t-full bg-white/30" />
        <span className="absolute bottom-3 left-1/2 h-8 w-10 -translate-x-1/2 rounded-t-[28px] bg-white/25" />
        <span className="absolute bottom-0 left-1/2 h-5 w-20 -translate-x-1/2 rounded-t-xl bg-white/20" />
      </div>
    </div>
  );
}

function LoginCard() {
  const router = useRouter();
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const desktopUsernameRef = useRef(null);
  const desktopPasswordRef = useRef(null);
  const [form, setForm] = useState({ username: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({ username: "", password: "" });
  const [formError, setFormError] = useState("");
  const [biometricNotice, setBiometricNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function focusLoginField(field) {
    const isDesktop = typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
    const ref = field === "username"
      ? (isDesktop ? desktopUsernameRef : usernameRef)
      : (isDesktop ? desktopPasswordRef : passwordRef);
    ref.current?.focus();
    ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function focusFirstError(nextErrors) {
    if (nextErrors.username) {
      focusLoginField("username");
      return;
    }
    if (nextErrors.password) {
      focusLoginField("password");
    }
  }

  function validateBeforeSubmit() {
    const nextErrors = {
      username: form.username.trim() ? "" : "Username / UKPD ID wajib diisi.",
      password: form.password ? "" : "Password wajib diisi."
    };
    setFieldErrors(nextErrors);
    setFormError("");
    const hasError = Boolean(nextErrors.username || nextErrors.password);
    if (hasError) {
      focusFirstError(nextErrors);
    }
    return !hasError;
  }

  async function submit(event) {
    event.preventDefault();
    if (loading) return;
    if (!validateBeforeSubmit()) return;

    setLoading(true);
    setFormError("");
    setBiometricNotice("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password
        })
      });
      const payload = await response.json();
      if (!payload.success) {
        const message = response.status === 401 || response.status === 422
          ? "Username atau password tidak sesuai."
          : "Login belum berhasil. Silakan coba lagi.";
        setFormError(message);
        setFieldErrors((current) => ({
          ...current,
          username: current.username || "Username atau password tidak sesuai.",
          password: current.password || "Username atau password tidak sesuai."
        }));
        focusLoginField("username");
        return;
      }
      const nextPath = typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("next")
        : "";
      router.replace(nextPath || "/dashboard");
    } catch {
      setFormError("Login belum berhasil. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
    setFormError("");
    setBiometricNotice("");
  }

  async function requestBiometricLogin(method) {
    if (loading || passkeyLoading) return;

    setFieldErrors({ username: "", password: "" });
    setFormError("");

    if (!isWebAuthnAvailable()) {
      setBiometricNotice(`Perangkat atau browser ini belum mendukung login ${method}. Gunakan username dan password resmi.`);
      return;
    }

    const username = form.username.trim();
    if (!username) {
      setBiometricNotice("Isi Username / UKPD ID dulu, lalu pilih Finger atau Face.");
      focusLoginField("username");
      return;
    }

    setPasskeyLoading(method);
    setBiometricNotice("");

    try {
      const optionsResponse = await fetch("/api/auth/passkey/login/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
      });
      const optionsPayload = await optionsResponse.json();
      if (!optionsResponse.ok || !optionsPayload.success) {
        throw new Error(optionsPayload.message || "Login passkey belum dapat dimulai.");
      }

      const credential = await navigator.credentials.get({
        publicKey: requestOptionsFromJSON(optionsPayload.data.options)
      });
      const verifyResponse = await fetch("/api/auth/passkey/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: serializePublicKeyCredential(credential) })
      });
      const verifyPayload = await verifyResponse.json();
      if (!verifyResponse.ok || !verifyPayload.success) {
        throw new Error(verifyPayload.message || "Login passkey belum berhasil.");
      }

      const nextPath = typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("next")
        : "";
      router.replace(nextPath || "/dashboard");
    } catch (error) {
      const cancelled = error?.name === "NotAllowedError";
      setBiometricNotice(cancelled ? "Verifikasi biometrik dibatalkan." : (error.message || "Login passkey belum berhasil."));
    } finally {
      setPasskeyLoading("");
    }
  }

  return (
    <aside aria-labelledby="login-heading" className="relative flex min-h-screen w-full justify-center overflow-hidden bg-[#effbff] px-0 text-slate-900 sm:min-h-[720px] sm:items-center sm:px-6 sm:py-8 lg:min-h-full lg:items-center lg:bg-transparent lg:px-0 lg:py-0">
      <form className="relative flex min-h-screen w-full max-w-[430px] flex-col overflow-hidden bg-[#f7fffb] shadow-[0_28px_90px_rgba(14,116,144,0.18)] sm:min-h-[720px] sm:rounded-[2rem] sm:ring-1 sm:ring-white/80 lg:hidden" onSubmit={submit} noValidate>
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.22),transparent_24%),radial-gradient(circle_at_84%_12%,rgba(167,243,208,0.34),transparent_26%),linear-gradient(145deg,#0f5ea8,#1287c7_52%,#10b981)] px-5 pb-16 pt-5 text-white">
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-1.5 shadow-sm">
                <Image src={dinkesLogo} alt="Logo Dinas Kesehatan DKI Jakarta" className="h-full w-full object-contain" priority />
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-extrabold leading-tight text-white">SI-DATA</p>
                <p className="truncate text-[11px] font-semibold text-white/75">Dinkes DKI Jakarta</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" className="relative grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white backdrop-blur transition hover:bg-white/20 focus-ring" aria-label="Notifikasi">
                <Bell className="h-5 w-5" aria-hidden="true" />
                <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-emerald-300 ring-2 ring-[#0f6fa8]" />
              </button>
              <button type="button" className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white backdrop-blur transition hover:bg-white/20 focus-ring" aria-label="Buka menu">
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="relative z-10 mt-8 max-w-[280px]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/75">Selamat datang</p>
            <h2 id="login-heading" className="mt-3 text-3xl font-extrabold leading-tight tracking-normal text-white">
              Masuk ke SI-DATA Mobile
            </h2>
            <p className="mt-3 text-sm font-medium leading-6 text-white/80">
              Akses data pegawai, usulan, DUK, dan QnA layanan kepegawaian.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white backdrop-blur">
              <Landmark className="h-4 w-4 text-amber-200" aria-hidden="true" />
              Jakarta - Monas
            </div>
          </div>
          <JakartaSilhouette compact />
        </section>

        <section className="relative z-10 -mt-10 flex flex-1 flex-col rounded-t-[2rem] bg-[#f7fffb] px-5 pb-6 pt-6">
          <div className="rounded-2xl bg-white p-4 shadow-[0_18px_46px_rgba(14,116,144,0.12)] ring-1 ring-cyan-100">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-600">Akun resmi</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">Gunakan UKPD ID Anda</p>
              </div>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-50 text-cyan-700">
                <LockKeyhole className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>

            <div className="space-y-3">
              <label htmlFor="username" className="block">
                <span className="sr-only">Username / UKPD ID</span>
                <span className="relative block">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-500" aria-hidden="true" />
                  <input
                    id="username"
                    ref={usernameRef}
                    name="username"
                    className={`h-12 w-full rounded-xl border px-12 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2 ${fieldErrors.username ? "border-amber-300 bg-amber-50 focus:border-amber-400 focus:ring-amber-100" : "border-cyan-100 bg-cyan-50/50 focus:border-cyan-500 focus:ring-cyan-100"}`}
                    value={form.username}
                    onChange={(event) => updateField("username", event.target.value)}
                    autoComplete="username"
                    placeholder="Username / UKPD ID"
                    aria-invalid={Boolean(fieldErrors.username)}
                    aria-describedby={fieldErrors.username ? "username-error" : undefined}
                  />
                </span>
                {fieldErrors.username ? <p id="username-error" className="mt-2 text-sm font-medium text-amber-700">{fieldErrors.username}</p> : null}
              </label>

              <label htmlFor="password" className="block">
                <span className="sr-only">Password</span>
                <span className="relative block">
                  <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-500" aria-hidden="true" />
                  <input
                    id="password"
                    ref={passwordRef}
                    name="password"
                    className={`h-12 w-full rounded-xl border px-12 pr-14 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2 ${fieldErrors.password ? "border-amber-300 bg-amber-50 focus:border-amber-400 focus:ring-amber-100" : "border-cyan-100 bg-cyan-50/50 focus:border-cyan-500 focus:ring-cyan-100"}`}
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(event) => updateField("password", event.target.value)}
                    autoComplete="current-password"
                    placeholder="Password"
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={fieldErrors.password ? "password-error" : undefined}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-slate-500 transition hover:bg-white hover:text-slate-800 focus-ring"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                  </button>
                </span>
                {fieldErrors.password ? <p id="password-error" className="mt-2 text-sm font-medium text-amber-700">{fieldErrors.password}</p> : null}
              </label>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <label className="flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-500">
                <input type="checkbox" className="h-4 w-4 rounded border-cyan-200 text-emerald-600 focus:ring-emerald-200" />
                <span className="truncate">Simpan User ID</span>
              </label>
              <button type="button" className="shrink-0 text-xs font-bold text-cyan-700 hover:text-emerald-700">
                Lupa password?
              </button>
            </div>

            <button className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-dinkes-600 via-cyan-600 to-emerald-500 px-4 text-sm font-extrabold text-white shadow-[0_12px_26px_rgba(14,116,144,0.28)] transition hover:brightness-95 focus-ring disabled:cursor-not-allowed disabled:opacity-60" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Memproses...
                </>
              ) : "Masuk"}
            </button>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {BIOMETRIC_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  disabled={loading || Boolean(passkeyLoading)}
                  onClick={() => requestBiometricLogin(option.method)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-cyan-100 bg-white text-sm font-bold text-cyan-800 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 focus-ring disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {passkeyLoading === option.method ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <option.icon className="h-5 w-5" aria-hidden="true" />}
                  {option.label}
                </button>
              ))}
            </div>

            {biometricNotice ? <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-800">{biometricNotice}</p> : null}
            {formError ? <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">{formError}</p> : null}
          </div>

          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-extrabold text-slate-800">Menu cepat</p>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-700">Mobile</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {MOBILE_SERVICE_ACTIONS.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setBiometricNotice("Silakan masuk terlebih dahulu untuk membuka layanan ini.")}
                  className="min-w-0 rounded-2xl bg-white px-2 py-3 text-center shadow-sm ring-1 ring-cyan-100 transition hover:-translate-y-0.5 hover:ring-emerald-200 focus-ring"
                >
                  <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-cyan-50 text-cyan-700">
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="mt-2 block truncate text-[11px] font-extrabold text-slate-800">{item.title}</span>
                  <span className="mt-0.5 block truncate text-[10px] font-medium text-slate-400">{item.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto flex items-center justify-center pt-6">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-dinkes-600 to-emerald-500 text-sm font-extrabold text-white shadow-[0_16px_34px_rgba(14,116,144,0.28)] ring-4 ring-white">
              SI
            </span>
          </div>
        </section>
      </form>

      <form className="hidden w-full max-w-[560px] rounded-[28px] bg-white p-8 shadow-[0_30px_90px_rgba(14,116,144,0.16)] ring-1 ring-cyan-100 lg:block xl:p-10" onSubmit={submit} noValidate>
        <div className="flex items-start justify-between gap-5">
          <div>
            <span className="inline-flex items-center gap-2 rounded-xl bg-cyan-50 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-700 ring-1 ring-cyan-100">
              <LockKeyhole className="h-4 w-4" aria-hidden="true" />
              Portal Login
            </span>
            <h2 id="login-heading-desktop" className="mt-5 text-3xl font-extrabold leading-tight tracking-normal text-slate-900">
              Sistem Informasi Data Pegawai
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Gunakan akun resmi UKPD untuk mengakses dashboard, data pegawai, usulan, DUK, dan QnA layanan kepegawaian.
            </p>
          </div>
          <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white p-2 shadow-sm ring-1 ring-cyan-100">
            <Image src={dinkesLogo} alt="Logo Dinas Kesehatan DKI Jakarta" className="h-full w-full object-contain" priority />
          </span>
        </div>

        <div className="mt-8 grid gap-4">
          <label htmlFor="desktop-username" className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">Username / UKPD ID</span>
            <span className="relative block">
              <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-500" aria-hidden="true" />
              <input
                id="desktop-username"
                ref={desktopUsernameRef}
                name="username"
                className={`h-12 w-full rounded-xl border px-12 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2 ${fieldErrors.username ? "border-amber-300 bg-amber-50 focus:border-amber-400 focus:ring-amber-100" : "border-cyan-100 bg-cyan-50/50 focus:border-cyan-500 focus:ring-cyan-100"}`}
                value={form.username}
                onChange={(event) => updateField("username", event.target.value)}
                autoComplete="username"
                placeholder="Masukkan Username / UKPD ID"
                aria-invalid={Boolean(fieldErrors.username)}
                aria-describedby={fieldErrors.username ? "desktop-username-error" : undefined}
              />
            </span>
            {fieldErrors.username ? <p id="desktop-username-error" className="mt-2 text-sm font-medium text-amber-700">{fieldErrors.username}</p> : null}
          </label>

          <label htmlFor="desktop-password" className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">Password</span>
            <span className="relative block">
              <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-500" aria-hidden="true" />
              <input
                id="desktop-password"
                ref={desktopPasswordRef}
                name="password"
                className={`h-12 w-full rounded-xl border px-12 pr-14 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2 ${fieldErrors.password ? "border-amber-300 bg-amber-50 focus:border-amber-400 focus:ring-amber-100" : "border-cyan-100 bg-cyan-50/50 focus:border-cyan-500 focus:ring-cyan-100"}`}
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                autoComplete="current-password"
                placeholder="Masukkan password"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? "desktop-password-error" : undefined}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-slate-500 transition hover:bg-white hover:text-slate-800 focus-ring"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
              </button>
            </span>
            {fieldErrors.password ? <p id="desktop-password-error" className="mt-2 text-sm font-medium text-amber-700">{fieldErrors.password}</p> : null}
          </label>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <label className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-500">
            <input type="checkbox" className="h-4 w-4 rounded border-cyan-200 text-emerald-600 focus:ring-emerald-200" />
            <span className="truncate">Simpan User ID</span>
          </label>
          <button type="button" className="shrink-0 text-sm font-bold text-cyan-700 hover:text-emerald-700">
            Lupa password?
          </button>
        </div>

        <button className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-dinkes-600 via-cyan-600 to-emerald-500 px-4 text-sm font-extrabold text-white shadow-[0_12px_26px_rgba(14,116,144,0.28)] transition hover:brightness-95 focus-ring disabled:cursor-not-allowed disabled:opacity-60" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Memproses...
            </>
          ) : "Masuk"}
        </button>

        <div className="mt-6 rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-emerald-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold text-slate-900">Login Biometrik</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">Isi Username / UKPD ID, lalu gunakan passkey yang sudah didaftarkan di Profil Akun.</p>
            </div>
            <Fingerprint className="h-5 w-5 shrink-0 text-cyan-700" aria-hidden="true" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {BIOMETRIC_OPTIONS.map((option) => (
              <button
                key={`desktop-${option.label}`}
                type="button"
                disabled={loading || Boolean(passkeyLoading)}
                onClick={() => requestBiometricLogin(option.method)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-cyan-100 bg-white text-sm font-bold text-cyan-800 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 focus-ring disabled:cursor-not-allowed disabled:opacity-60"
              >
                {passkeyLoading === option.method ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <option.icon className="h-5 w-5" aria-hidden="true" />}
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {biometricNotice ? <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">{biometricNotice}</p> : null}
        {formError ? <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">{formError}</p> : null}
      </form>
    </aside>
  );
}

function LoginShell() {
  const timestamp = useMemo(() => {
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short"
    }).format(new Date());
  }, []);

  return (
    <>
      <a href="#konten-utama" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-dinkes-600 focus:shadow-lg">
        Lewati ke konten utama
      </a>

      <div className="min-h-screen overflow-hidden bg-[#effbff] text-slate-900">
        <header className="hidden border-b border-cyan-100 bg-white/90 backdrop-blur sm:block">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-1 shadow-sm ring-1 ring-cyan-100">
                <Image src={dinkesLogo} alt="Logo Dinas Kesehatan DKI Jakarta" className="h-full w-full object-contain" priority />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold tracking-wide text-slate-800 sm:text-base">SI-DATA</p>
                <p className="truncate text-xs font-semibold text-slate-600 sm:text-sm">Dinas Kesehatan Provinsi DKI Jakarta</p>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100 sm:flex">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
              {timestamp}
            </div>
          </div>
        </header>

        <main id="konten-utama" className="mx-auto grid min-h-screen w-full max-w-7xl lg:min-h-[calc(100vh-69px)] lg:grid-cols-[1fr_0.78fr] lg:items-stretch lg:gap-8 lg:px-8 lg:py-8">
          <section className="relative hidden min-h-[720px] overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,#0f5ea8,#1287c7_52%,#10b981)] p-10 text-white shadow-[0_30px_90px_rgba(14,116,144,0.22)] lg:flex lg:flex-col lg:justify-between" aria-labelledby="hero-heading">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.18),transparent_26%),radial-gradient(circle_at_82%_10%,rgba(167,243,208,0.28),transparent_27%)]" aria-hidden="true" />
            <div className="relative z-10 max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/80 backdrop-blur">
                <Landmark className="h-4 w-4 text-amber-200" aria-hidden="true" />
                Jakarta digital service
              </span>
              <h1 id="hero-heading" className="mt-8 max-w-3xl text-5xl font-extrabold leading-tight tracking-normal text-white">
                Sistem Informasi SDM Kesehatan DKI Jakarta
              </h1>
              <p className="mt-5 max-w-xl text-base font-medium leading-7 text-white/80">
                Portal terpadu untuk pengelolaan data pegawai, layanan usulan, DUK, dan informasi kepegawaian Dinas Kesehatan Provinsi DKI Jakarta.
              </p>
            </div>

            <div className="relative z-10 grid max-w-xl grid-cols-3 gap-3">
              {[
                { label: "Akun UKPD", icon: Building2 },
                { label: "Biometrik", icon: Fingerprint },
                { label: "Data SDMK", icon: HeartPulse }
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                  <item.icon className="h-6 w-6 text-amber-100" aria-hidden="true" />
                  <p className="mt-4 text-sm font-extrabold text-white">{item.label}</p>
                </div>
              ))}
            </div>

            <JakartaSilhouette />
          </section>

          <section className="flex min-h-screen w-full items-stretch justify-center lg:min-h-[720px]">
            <LoginCard />
          </section>
        </main>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center bg-[#f5f5f5]"><CalendarClock className="h-8 w-8 animate-pulse text-dinkes-600" aria-hidden="true" /></main>}>
      <LoginShell />
    </Suspense>
  );
}
