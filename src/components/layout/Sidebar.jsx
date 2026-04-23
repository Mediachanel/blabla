"use client";

import Image from "next/image";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { filterMenuByRole } from "@/data/menu/sidebarMenu";
import SidebarItem from "@/components/layout/SidebarItem";
import dinkesLogo from "@/Foto/Dinkes.png";

export default function Sidebar({ user, collapsed, onToggle }) {
  const menu = filterMenuByRole(user?.role);

  return (
    <aside className={`hidden border-r border-slate-200 bg-white transition-[width] duration-200 lg:fixed lg:inset-y-0 lg:flex lg:flex-col ${collapsed ? "lg:w-20" : "lg:w-72"}`}>
      <header className="flex h-20 items-center gap-3 border-b border-slate-100 px-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          <Image src={dinkesLogo} alt="Logo Dinas Kesehatan DKI Jakarta" className="h-full w-full object-cover" priority />
        </span>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight text-slate-900">SDM Kesehatan</p>
            <p className="truncate text-xs text-slate-500">Dinkes Provinsi DKI Jakarta</p>
          </div>
        ) : null}
      </header>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Menu utama">
        {menu.map((item) => (
          <SidebarItem key={item.label} item={item} collapsed={collapsed} />
        ))}
      </nav>
      <footer className="border-t border-slate-100 p-3">
        <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 focus-ring" onClick={onToggle}>
          {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          {!collapsed ? "Collapse" : null}
        </button>
      </footer>
    </aside>
  );
}
