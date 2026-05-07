"use client";

import Image from "next/image";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { filterDesktopMenuByRole } from "@/data/menu/sidebarMenu";
import SidebarItem from "@/components/layout/SidebarItem";
import dinkesLogo from "@/Foto/Dinkes.png";

function getInitials(user) {
  const text = String(user?.nama_ukpd || user?.username || "SI").trim();
  return text
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function Sidebar({ user, collapsed, onToggle }) {
  const menu = filterDesktopMenuByRole(user?.role);

  return (
    <aside className={`hidden border-r border-slate-200/80 bg-white/95 shadow-[6px_0_24px_rgba(15,23,42,0.05)] backdrop-blur transition-[width] duration-200 print:hidden md:fixed md:inset-y-0 md:flex md:w-16 md:flex-col ${collapsed ? "lg:w-16" : "lg:w-64"}`}>
      <header className={`flex h-16 items-center gap-3 px-4 ${collapsed ? "lg:justify-center lg:px-2" : ""}`}>
        <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden bg-white">
          <Image src={dinkesLogo} alt="Logo Dinas Kesehatan DKI Jakarta" className="h-full w-full object-contain" priority />
        </span>
        {!collapsed ? (
          <div className="hidden min-w-0 lg:block">
            <p className="text-[13px] font-bold leading-tight text-slate-900">SI-DATA</p>
            <p className="truncate text-[11px] font-medium text-slate-500">Dinkes DKI Jakarta</p>
          </div>
        ) : null}
      </header>
      <section className={`flex items-center gap-3 border-y border-slate-200/80 px-4 py-3.5 ${collapsed ? "lg:justify-center lg:px-2" : ""}`}>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-dinkes-50 text-[11px] font-bold text-dinkes-700 shadow-sm ring-1 ring-dinkes-100">
          {getInitials(user)}
        </span>
        {!collapsed ? (
          <div className="hidden min-w-0 lg:block">
            <p className="truncate text-xs font-semibold uppercase text-slate-700">{user?.nama_ukpd || user?.username || "Pengguna"}</p>
            <p className="truncate text-[11px] text-slate-400">{user?.role || "-"}</p>
          </div>
        ) : null}
      </section>
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4 lg:px-3" aria-label="Menu utama">
        {menu.map((item) => (
          <SidebarItem key={item.label} item={item} collapsed={collapsed} />
        ))}
      </nav>
      <footer className="hidden border-t border-slate-200/80 p-3 lg:block">
        <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-2 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 focus-ring" onClick={onToggle}>
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!collapsed ? "Collapse" : null}
        </button>
      </footer>
    </aside>
  );
}
