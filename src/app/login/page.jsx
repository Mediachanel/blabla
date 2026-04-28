"use client";

import { Suspense, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarClock,
  ChevronDown,
  Eye,
  EyeOff,
  FileQuestion,
  Loader2,
  LockKeyhole,
  Search,
  ShieldCheck,
  UsersRound
} from "lucide-react";
import dinkesLogo from "@/Foto/Dinkes.png";

const QUICK_ACTIONS = [
  { title: "Cari Informasi Mutasi", keyword: "mutasi", description: "Lihat syarat, alur, dan verifikasi usulan mutasi." },
  { title: "Cek Persyaratan Cuti", keyword: "cuti", description: "Temukan dokumen dan aturan cuti yang berlaku." },
  { title: "Lihat Alur Kenaikan Pangkat", keyword: "kenaikan pangkat", description: "Pahami tahapan dan dokumen kenaikan pangkat." },
  { title: "Panduan Disiplin Pegawai", keyword: "disiplin", description: "Pelajari aturan disiplin dan tindak lanjut administratif." }
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
      className="overflow-hidden rounded-[1.75rem] bg-white shadow-[0_22px_70px_rgba(15,23,42,0.08)] ring-1 ring-emerald-100/90"
    >
      <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="border-b border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_42%),linear-gradient(180deg,#f7fdfb,#eefaf6)] p-6 sm:p-8 lg:border-b-0 lg:border-r">
          <span className="inline-flex rounded-full bg-emerald-100 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.22em] text-emerald-700">Pusat QnA</span>
          <h2 id="qna-heading" className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Pusat QnA Layanan Kepegawaian</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Temukan aturan, syarat, dan alur layanan tanpa membuka dokumen panjang.
          </p>

          <label htmlFor="qna-search" className="mt-6 block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Cari topik layanan</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="qna-search"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
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
              <div key={item.label} className="rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-emerald-100">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{item.label}</p>
                  <item.icon className="h-4 w-4 text-emerald-700" aria-hidden="true" />
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
                  <div key={index} className="h-16 animate-pulse rounded-2xl bg-white/70 ring-1 ring-slate-200" />
                ))
              ) : visibleCategories.length ? (
                visibleCategories.map((category) => {
                  const active = category.id === activeCategory;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setActiveCategory(category.id)}
                      className={`rounded-2xl border p-4 text-left transition focus-ring ${active ? "border-emerald-500 bg-emerald-600 text-white shadow-lg shadow-emerald-200/80" : "border-slate-200 bg-white text-slate-800 hover:border-emerald-200 hover:bg-emerald-50/60"}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-extrabold">{highlightText(category.name, deferredSearch)}</p>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                          {category.items.length}
                        </span>
                      </div>
                      <p className={`mt-2 text-xs leading-5 ${active ? "text-emerald-50" : "text-slate-500"}`}>
                        {highlightText(category.description || "Kategori informasi layanan kepegawaian.", deferredSearch)}
                      </p>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
                  Tidak ada hasil. Coba gunakan kata kunci lain.
                </div>
              )}
            </div>
          </div>
        </aside>

        <div className="bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-emerald-600">Jawaban Terpilih</p>
              <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
                {selectedCategory?.name || (loading ? "Memuat QnA..." : "Belum ada kategori")}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {selectedCategory?.description || "Pilih kategori untuk melihat daftar pertanyaan dan jawaban yang tersedia."}
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100">
              {visibleItems.length} pertanyaan
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
              ))
            ) : error ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800">
                {error}
              </div>
            ) : visibleItems.length ? (
              visibleItems.map((item) => {
                const open = openItems.includes(item.id);
                return (
                  <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-200 hover:shadow-md">
                    <button
                      type="button"
                      onClick={() => setOpenItems((current) => current.includes(item.id) ? current.filter((entry) => entry !== item.id) : [...current, item.id])}
                      className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left focus-ring"
                    >
                      <div>
                        <p className="text-base font-bold leading-7 text-slate-900">{highlightText(item.question, deferredSearch)}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{highlightText(item.category_name, deferredSearch)}</p>
                      </div>
                      <span className={`mt-1 rounded-full border p-2 text-slate-500 transition ${open ? "rotate-180 border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white"}`}>
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
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-6 text-slate-500">
                Tidak ada hasil. Coba gunakan kata kunci lain.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function LoginCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const [form, setForm] = useState({ username: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({ username: "", password: "" });
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function focusFirstError(nextErrors) {
    if (nextErrors.username) {
      usernameRef.current?.focus();
      usernameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (nextErrors.password) {
      passwordRef.current?.focus();
      passwordRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
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
        usernameRef.current?.focus();
        usernameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      router.replace(searchParams.get("next") || "/dashboard");
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
  }

  return (
    <aside aria-labelledby="login-heading" className="flex items-center justify-center bg-[#0f8f81] p-5 sm:p-8 lg:p-10">
      <form className="w-full max-w-[520px] rounded-[1.75rem] bg-white p-6 shadow-[0_26px_80px_rgba(15,23,42,0.18)] ring-1 ring-white/60 sm:p-8" onSubmit={submit} noValidate>
        <div className="mb-5">
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
            <LockKeyhole className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 id="login-heading" className="text-xl font-extrabold tracking-normal text-slate-800 sm:text-2xl">Masuk Sistem Informasi Data Pegawai</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Masukkan akun resmi Anda untuk mengakses dashboard dan layanan kepegawaian.</p>
        </div>

        <div className="space-y-4">
          <label htmlFor="username" className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Username / UKPD ID</span>
            <input
              id="username"
              ref={usernameRef}
              name="username"
              className={`h-12 w-full rounded-xl border px-4 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-4 ${fieldErrors.username ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100" : "border-slate-200 bg-slate-50 focus:border-emerald-500 focus:bg-white focus:ring-emerald-100"}`}
              value={form.username}
              onChange={(event) => updateField("username", event.target.value)}
              autoComplete="username"
              placeholder="Masukkan Username / UKPD ID"
              aria-invalid={Boolean(fieldErrors.username)}
              aria-describedby={fieldErrors.username ? "username-error" : undefined}
              autoFocus
            />
            {fieldErrors.username ? <p id="username-error" className="mt-2 text-sm font-medium text-rose-600">{fieldErrors.username}</p> : null}
          </label>

          <label htmlFor="password" className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
            <span className="relative block">
              <input
                id="password"
                ref={passwordRef}
                name="password"
                className={`h-12 w-full rounded-xl border px-4 pr-14 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-4 ${fieldErrors.password ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100" : "border-slate-200 bg-slate-50 focus:border-emerald-500 focus:bg-white focus:ring-emerald-100"}`}
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                autoComplete="current-password"
                placeholder="Masukkan password"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? "password-error" : undefined}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-ring"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
              </button>
            </span>
            {fieldErrors.password ? <p id="password-error" className="mt-2 text-sm font-medium text-rose-600">{fieldErrors.password}</p> : null}
          </label>
        </div>

        <button
          className="btn-primary mt-5 h-12 w-full rounded-xl"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Memproses...
            </>
          ) : "Masuk"}
        </button>
        <p className="mt-3 text-xs font-medium text-slate-500">Lupa password? Hubungi admin Kepegawaian.</p>
        {formError ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{formError}</p> : null}
      </form>
    </aside>
  );
}

function LoginShell() {
  const [quickSearch, setQuickSearch] = useState("");
  const [showHelp, setShowHelp] = useState(false);

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

  function applyQuickAction(keyword) {
    setQuickSearch(keyword);
    setShowHelp(true);
    if (typeof document !== "undefined") {
      document.getElementById("qna-layanan")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <>
      <a href="#konten-utama" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-emerald-700 focus:shadow-lg">
        Lewati ke konten utama
      </a>

      <div className="min-h-screen overflow-hidden bg-[#f4fbf8] text-slate-900">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(255,255,255,0.72)_42%,rgba(20,184,166,0.10))]" />
        <div className="absolute inset-0 -z-10 opacity-[0.28] [background-image:repeating-linear-gradient(135deg,rgba(16,185,129,0.18)_0,rgba(16,185,129,0.18)_1px,transparent_1px,transparent_18px)]" />

        <header className="border-b border-white/70 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-emerald-100">
                <Image src={dinkesLogo} alt="Logo Dinas Kesehatan DKI Jakarta" className="h-full w-full object-cover" priority />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold tracking-wide text-slate-800 sm:text-base">Subkelompok Kepegawaian</p>
                <p className="truncate text-xs font-semibold text-slate-600 sm:text-sm">Dinas Kesehatan Provinsi DKI Jakarta</p>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-emerald-50 sm:flex">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
              {timestamp}
            </div>
          </div>
        </header>

        <main id="konten-utama" className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <section className="grid min-h-[420px] overflow-hidden rounded-[1.8rem] bg-emerald-700 shadow-[0_24px_80px_rgba(16,185,129,0.22)] lg:grid-cols-[1fr_0.86fr]">
            <section className="relative flex min-h-[330px] flex-col justify-center overflow-hidden bg-[#149d8f] p-7 text-white sm:p-10 lg:p-12" aria-labelledby="hero-heading">
              <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full border-[28px] border-white/10" aria-hidden="true" />
              <div className="absolute bottom-8 right-8 hidden h-32 w-32 rounded-full bg-white/10 lg:block" aria-hidden="true" />
              <span className="w-fit rounded-full border border-white/30 bg-white/12 px-4 py-2 text-xs font-bold shadow-sm backdrop-blur">
                Informasi Kepegawaian
              </span>
              <h1 id="hero-heading" className="mt-7 max-w-3xl text-3xl font-extrabold leading-tight tracking-normal text-white sm:text-4xl lg:text-5xl">
                Sistem Informasi SDM Kesehatan DKI Jakarta
              </h1>
              <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-emerald-50 sm:text-lg">
                Akses layanan kepegawaian, informasi pengembangan karir, pendayagunaan pegawai, dan pusat tanya jawab dalam satu halaman yang mudah dipahami.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button type="button" onClick={() => setShowHelp((value) => !value)} className="inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-extrabold text-emerald-800 transition hover:bg-emerald-50 focus-ring sm:w-auto">
                  {showHelp ? "Sembunyikan Bantuan" : "Buka Bantuan Kepegawaian"}
                </button>
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/90">
                Temukan aturan, syarat, dan alur layanan tanpa membuka dokumen panjang.
              </p>
            </section>

            <LoginCard />
          </section>

          {showHelp ? (
          <section aria-labelledby="quick-action-heading" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm md:col-span-2 xl:col-span-4">
              <h2 id="quick-action-heading" className="text-lg font-extrabold text-slate-900">Akses Cepat Informasi Layanan</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Gunakan shortcut ini untuk langsung memfilter pusat QnA sesuai layanan yang paling sering dicari.</p>
            </div>
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.title}
                type="button"
                onClick={() => applyQuickAction(action.keyword)}
                className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/70 focus-ring"
              >
                <p className="text-base font-bold text-slate-900">{action.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{action.description}</p>
              </button>
            ))}
          </section>
          ) : null}

          {showHelp ? <QnaSection quickSearch={quickSearch} onResetQuickSearch={() => setQuickSearch("")} /> : null}
        </main>

        <footer className="mx-auto max-w-7xl px-4 pb-8 pt-2 text-center text-xs text-slate-500 sm:px-6 lg:px-8">
          Sistem Informasi SDM Kesehatan DKI Jakarta
        </footer>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center bg-[#f4fbf8]"><CalendarClock className="h-8 w-8 animate-pulse text-emerald-700" aria-hidden="true" /></main>}>
      <LoginShell />
    </Suspense>
  );
}
