"use client";

import Image from "next/image";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { filterMenuByRole } from "@/data/menu/sidebarMenu";
import SidebarItem from "@/components/layout/SidebarItem";
import dinkesLogo from "@/Foto/Dinkes.png";

function getInitials(user) {
  const text = String(user?.username || user?.nama_ukpd || "SI").trim();
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
    <aside className={`hidden border-r border-[#edf0f5] bg-white shadow-[4px_0_18px_rgba(15,23,42,0.04)] transition-[width] duration-200 lg:fixed lg:inset-y-0 lg:flex lg:flex-col ${collapsed ? "lg:w-20" : "lg:w-64"}`}>
      <header className="flex h-20 items-center gap-3 px-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden bg-white">
          <Image src={dinkesLogo} alt="Logo Dinas Kesehatan DKI Jakarta" className="h-full w-full object-contain" priority />
        </span>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="text-base font-bold leading-tight text-slate-900">SI-DATA</p>
            <p className="truncate text-xs font-medium text-slate-500">Dinkes DKI Jakarta</p>
          </div>
        ) : null}
      </header>
      <section className={`flex items-center gap-3 border-y border-[#edf0f5] px-5 py-4 ${collapsed ? "justify-center px-3" : ""}`}>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-medium text-slate-500 shadow-sm ring-1 ring-slate-200">
          {getInitials(user)}
        </span>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-700">{user?.username || "Pengguna"}</p>
            <p className="truncate text-xs text-slate-400">{user?.nama_ukpd || user?.role || "-"}</p>
          </div>
        ) : null}
      </section>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5" aria-label="Menu utama">
        {menu.map((item) => (
          <SidebarItem key={item.label} item={item} collapsed={collapsed} />
        ))}
      </nav>
      <footer className="border-t border-[#edf0f5] p-3">
        <button className="flex w-full items-center justify-center gap-2 rounded-md border border-[#d8dde6] px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 focus-ring" onClick={onToggle}>
          {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          {!collapsed ? "Collapse" : null}
        </button>
      </footer>
    </aside>
  );
}
