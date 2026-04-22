"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import dinkesLogo from "@/Foto/Dinkes.png";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ username: "superadmin", password: "password123" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const payload = await response.json();
    setLoading(false);
    if (!payload.success) {
      setError(payload.message);
      return;
    }
    router.replace(searchParams.get("next") || "/dashboard");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-dinkes-50 px-4 py-10">
      <section className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-soft">
        <div className="grid lg:grid-cols-[0.9fr_1fr]">
          <aside className="bg-dinkes-800 p-8 text-white">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-white ring-1 ring-white/40">
                <Image src={dinkesLogo} alt="Logo Dinas Kesehatan DKI Jakarta" className="h-full w-full object-cover" priority />
              </span>
              <div>
                <p className="font-bold">SDM Kesehatan DKI</p>
                <p className="text-xs text-dinkes-100">Dinas Kesehatan Provinsi DKI Jakarta</p>
              </div>
            </div>
            <h1 className="mt-16 text-3xl font-bold leading-tight">Login Sistem Informasi SDM Kesehatan</h1>
            <p className="mt-4 text-sm leading-6 text-dinkes-100">
              Gunakan akun internal sesuai role. Demo: superadmin, admin-timur, atau admin-cakung dengan password password123.
            </p>
          </aside>
          <form className="p-8 sm:p-10" onSubmit={submit}>
            <div className="mb-8">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-govgold-100 text-govgold-700">
                <LockKeyhole className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-2xl font-bold text-slate-950">Masuk</h2>
              <p className="mt-2 text-sm text-slate-500">Autentikasi menggunakan JWT dalam HttpOnly cookie.</p>
            </div>
            {error ? <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p> : null}
            <div className="space-y-4">
              <label className="space-y-2">
                <span className="label">Username / Nama UKPD</span>
                <input className="input" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} autoComplete="username" />
              </label>
              <label className="space-y-2">
                <span className="label">Password</span>
                <input className="input" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="current-password" />
              </label>
            </div>
            <button className="btn-primary mt-6 w-full" disabled={loading}>{loading ? "Memproses..." : "Masuk"}</button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center bg-dinkes-50"><div className="h-24 w-80 animate-pulse rounded-2xl bg-white" /></main>}>
      <LoginForm />
    </Suspense>
  );
}
