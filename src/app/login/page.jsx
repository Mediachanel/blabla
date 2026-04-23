"use client";

import { Suspense, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarClock, Eye, EyeOff, FileQuestion, LockKeyhole, Search, ShieldCheck, UsersRound } from "lucide-react";
import dinkesLogo from "@/Foto/Dinkes.png";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const payload = await response.json();
      if (!payload.success) {
        setError(payload.message);
        return;
      }
      router.replace(searchParams.get("next") || "/dashboard");
    } catch (err) {
      setError("Status: server aplikasi belum aktif atau perlu direstart. Jalankan npm run dev lalu buka ulang halaman login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f4ee] text-slate-900">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(15,118,110,0.16),rgba(255,255,255,0.58)_42%,rgba(251,146,60,0.16))]" />
      <div className="absolute inset-0 -z-10 opacity-[0.34] [background-image:repeating-linear-gradient(135deg,rgba(15,118,110,0.20)_0,rgba(15,118,110,0.20)_1px,transparent_1px,transparent_16px)]" />

      <header className="border-b border-white/70 bg-white/72 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-teal-100">
              <Image src={dinkesLogo} alt="Logo Dinas Kesehatan DKI Jakarta" className="h-full w-full object-cover" priority />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold tracking-wide text-slate-800 sm:text-base">Subkelompok Kepegawaian</p>
              <p className="truncate text-xs font-semibold text-slate-600 sm:text-sm">Dinas Kesehatan</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-teal-50 sm:flex">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />
            {timestamp}
          </div>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid min-h-[420px] overflow-hidden rounded-[1.6rem] bg-teal-700 shadow-[0_24px_80px_rgba(15,118,110,0.24)] lg:grid-cols-[1fr_0.86fr]">
          <aside className="relative flex min-h-[330px] flex-col justify-center overflow-hidden bg-[#15998d] p-7 text-white sm:p-10 lg:p-12">
            <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full border-[28px] border-white/10" />
            <div className="absolute bottom-8 right-8 hidden h-32 w-32 rounded-full bg-white/10 lg:block" />
            <span className="w-fit rounded-full border border-white/30 bg-white/12 px-4 py-2 text-xs font-bold shadow-sm backdrop-blur">
              Informasi Kepegawaian
            </span>
            <h1 className="mt-7 max-w-3xl text-3xl font-extrabold leading-tight tracking-normal text-white sm:text-4xl lg:text-5xl">
              Layanan Kepegawaian Dinas Kesehatan Provinsi DKI Jakarta
            </h1>
            <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-teal-50 sm:text-lg">
              Akses informasi perencanaan dan pendayagunaan pegawai, kesejahteraan pegawai, pengembangan karir, serta disiplin pegawai terintegrasi.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#qna-layanan" className="inline-flex items-center justify-center rounded-full bg-orange-300 px-5 py-3 text-sm font-extrabold text-slate-900 transition hover:bg-orange-200 focus-ring">
                Baca Selengkapnya
              </a>
            </div>
          </aside>

          <div className="flex items-center justify-center bg-teal-700/95 p-5 sm:p-8 lg:p-10">
            <form className="w-full max-w-[520px] rounded-2xl bg-white p-6 shadow-[0_26px_80px_rgba(15,23,42,0.18)] ring-1 ring-white/60 sm:p-8" onSubmit={submit}>
              <div className="mb-5">
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-700">
                  <LockKeyhole className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-extrabold tracking-normal text-slate-800 sm:text-2xl">Masuk Sistem Informasi Data Pegawai</h2>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-extrabold text-slate-500">Username / UKPD ID</span>
                  <input
                    className="h-12 w-full rounded-xl border border-teal-300 bg-slate-50 px-4 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                    value={form.username}
                    onChange={(event) => setForm({ ...form, username: event.target.value })}
                    autoComplete="username"
                    placeholder="Username"
                    autoFocus
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-extrabold text-slate-500">Password</span>
                  <span className="relative block">
                    <input
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-12 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(event) => setForm({ ...form, password: event.target.value })}
                      autoComplete="current-password"
                      placeholder="Password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-ring"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </span>
                </label>
              </div>

              <button
                className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl bg-teal-100 px-5 text-sm font-extrabold text-slate-800 transition hover:bg-teal-200 focus-ring disabled:cursor-not-allowed disabled:opacity-70"
                disabled={loading}
              >
                {loading ? "Memproses..." : "Masuk"}
              </button>
              <p className="mt-3 text-xs font-medium text-slate-500">Lupa password? Hubungi admin Kepegawaian</p>
              {error ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p> : null}
            </form>
          </div>
        </div>

        <section id="qna-layanan" className="grid gap-5 rounded-[1.4rem] bg-white/85 p-5 shadow-[0_18px_70px_rgba(15,23,42,0.08)] ring-1 ring-teal-100/80 backdrop-blur sm:p-7 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="min-w-0">
            <span className="inline-flex rounded-full bg-teal-50 px-4 py-2 text-xs font-extrabold text-teal-700 shadow-sm">QnA Layanan</span>
            <h2 className="mt-5 text-2xl font-extrabold tracking-normal text-slate-800 sm:text-3xl">Pusat jawaban cepat kepegawaian</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Temukan aturan, syarat, dan alur kerja mutasi atau pemutusan JF dengan cepat, tanpa perlu membuka dokumen panjang.
            </p>
            <div className="mt-5 flex max-w-xl items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-400">
              <Search className="h-5 w-5 shrink-0" />
              <span className="truncate text-sm">Cari topik layanan kepegawaian</span>
            </div>
          </article>
          <aside className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { label: "Total FAQ", value: "3", icon: FileQuestion },
              { label: "Status Data", value: "Contoh", icon: ShieldCheck },
              { label: "Ruang Lingkup", value: "Pegawai", icon: UsersRound }
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-teal-50/80 p-4 ring-1 ring-teal-100">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-extrabold text-slate-500">{item.label}</p>
                  <item.icon className="h-4 w-4 text-teal-700" />
                </div>
                <p className="mt-3 text-2xl font-extrabold text-slate-800">{item.value}</p>
              </div>
            ))}
          </aside>
        </section>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center bg-[#f7f4ee]"><CalendarClock className="h-8 w-8 animate-pulse text-teal-700" /></main>}>
      <LoginForm />
    </Suspense>
  );
}
