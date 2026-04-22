import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BarChart3, DatabaseZap, LockKeyhole, ShieldCheck, UsersRound } from "lucide-react";
import dinkesLogo from "@/Foto/Dinkes.png";

const features = [
  { title: "Data Terpusat", description: "Profil pegawai, jabatan, pendidikan, alamat, pasangan, dan anak disiapkan dalam struktur terpadu.", icon: DatabaseZap },
  { title: "Akses Berbasis Role", description: "Super Admin, Admin Wilayah, dan Admin UKPD hanya melihat data sesuai kewenangan.", icon: ShieldCheck },
  { title: "Dashboard Pimpinan", description: "KPI dan grafik agregat membantu pemantauan SDM kesehatan lintas wilayah dan unit kerja.", icon: BarChart3 }
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-slate-200 bg-white/90">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8" aria-label="Navigasi utama">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
              <Image src={dinkesLogo} alt="Logo Dinas Kesehatan DKI Jakarta" className="h-full w-full object-cover" priority />
            </span>
            <div>
              <p className="font-bold text-slate-950">SDM Kesehatan DKI</p>
              <p className="text-xs text-slate-500">Dinas Kesehatan Provinsi DKI Jakarta</p>
            </div>
          </div>
          <Link className="btn-primary" href="/login">Login <ArrowRight className="h-4 w-4" /></Link>
        </nav>
      </header>

      <section className="relative overflow-hidden bg-dinkes-50">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8 lg:py-20">
          <article className="flex flex-col justify-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-dinkes-700">Aplikasi internal pemerintahan</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Sistem Informasi SDM Kesehatan Dinas Kesehatan Provinsi DKI Jakarta
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              Platform MVP untuk mengelola data pegawai secara terpusat, aman, responsif, dan siap dikembangkan menjadi sistem enterprise internal.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="btn-primary" href="/login">Masuk ke Sistem</Link>
              <a className="btn-secondary" href="#fitur">Lihat Fitur</a>
            </div>
          </article>

          <aside className="surface p-5" aria-label="Ilustrasi dashboard">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {["12.840", "6 Wilayah", "148 UKPD"].map((item) => (
                  <div key={item} className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-500">Statistik</p>
                    <p className="mt-2 text-xl font-bold text-dinkes-800">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 h-44 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex h-full items-end gap-3">
                  {[60, 90, 55, 75, 48, 82].map((height, index) => (
                    <span key={index} className="flex-1 rounded-t-lg bg-dinkes-300" style={{ height: `${height}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section id="fitur" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="surface p-6">
              <feature.icon className="h-7 w-7 text-dinkes-700" aria-hidden="true" />
              <h2 className="mt-4 text-lg font-semibold text-slate-950">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
        Pemerintah Provinsi DKI Jakarta - Dinas Kesehatan. MVP internal untuk pengembangan lanjutan.
      </footer>
    </main>
  );
}
