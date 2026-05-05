"use client";

import Image from "next/image";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { filterMenuByRole } from "@/data/menu/sidebarMenu";
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
  const menu = filterMenuByRole(user?.role);

  return (
    <aside className={`hidden border-r border-[#e9edf3] bg-white shadow-[4px_0_18px_rgba(15,23,42,0.04)] transition-[width] duration-200 print:hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col ${collapsed ? "lg:w-14" : "lg:w-[200px]"}`}>
      <header className={`flex h-16 items-center gap-3 px-4 ${collapsed ? "justify-center px-2" : ""}`}>
        <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden bg-white">
          <Image src={dinkesLogo} alt="Logo Dinas Kesehatan DKI Jakarta" className="h-full w-full object-contain" priority />
        </span>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="text-[13px] font-bold leading-tight text-slate-900">SI-DATA</p>
            <p className="truncate text-[11px] font-medium text-slate-500">Dinkes DKI Jakarta</p>
          </div>
        ) : null}
      </header>
      <section className={`flex items-center gap-3 border-y border-[#e9edf3] px-4 py-3.5 ${collapsed ? "justify-center px-2" : ""}`}>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-[11px] font-medium text-slate-500 shadow-sm ring-1 ring-slate-200">
          {getInitials(user)}
        </span>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase text-slate-700">{user?.nama_ukpd || user?.username || "Pengguna"}</p>
            <p className="truncate text-[11px] text-slate-400">{user?.role || "-"}</p>
          </div>
        ) : null}
      </section>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Menu utama">
        {menu.map((item) => (
          <SidebarItem key={item.label} item={item} collapsed={collapsed} />
        ))}
      </nav>
      <footer className="border-t border-[#e9edf3] p-3">
        <button className="flex w-full items-center justify-center gap-2 rounded-md border border-[#d8dde6] px-2 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 focus-ring" onClick={onToggle}>
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!collapsed ? "Collapse" : null}
        </button>
      </footer>
    </aside>
  );
}
