"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import MobileSidebar from "@/components/layout/MobileSidebar";

export default function AppShell({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((payload) => {
        if (!payload.success) {
          router.replace("/login");
          return;
        }
        setUser(payload.data);
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50">
        <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-soft">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 space-y-3">
            <div className="h-3 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar user={user} collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      <MobileSidebar user={user} open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className={`transition-[padding] duration-200 ${collapsed ? "lg:pl-20" : "lg:pl-72"}`}>
        <Topbar user={user} onOpenMenu={() => setMobileOpen(true)} collapsed={collapsed} onToggleSidebar={() => setCollapsed((value) => !value)} />
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
