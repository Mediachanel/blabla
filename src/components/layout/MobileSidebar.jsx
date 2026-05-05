"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { filterMenuByRole } from "@/data/menu/sidebarMenu";
import SidebarItem from "@/components/layout/SidebarItem";
import dinkesLogo from "@/Foto/Dinkes.png";

export default function MobileSidebar({ user, open, onClose }) {
  if (!open) return null;
  const menu = filterMenuByRole(user?.role);

  return (
    <div className="fixed inset-0 z-50 print:hidden lg:hidden">
      <div className="absolute inset-0 bg-slate-950/40" onClick={onClose} />
      <aside className="relative z-10 flex h-full w-72 max-w-[88vw] flex-col bg-white shadow-2xl">
        <header className="flex h-16 items-center justify-between border-b border-[#e9edf3] px-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden bg-white">
              <Image src={dinkesLogo} alt="Logo Dinas Kesehatan DKI Jakarta" className="h-full w-full object-contain" priority />
            </span>
            <div>
              <p className="font-bold text-slate-900">SI-DATA</p>
              <p className="text-xs text-slate-500">Dinkes DKI Jakarta</p>
            </div>
          </div>
          <button className="rounded-md p-2 text-slate-600 hover:bg-slate-100 focus-ring" onClick={onClose} aria-label="Tutup menu">
            <X className="h-5 w-5" />
          </button>
        </header>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5" aria-label="Menu mobile">
          {menu.map((item) => (
            <SidebarItem key={item.label} item={item} collapsed={false} onNavigate={onClose} />
          ))}
        </nav>
      </aside>
    </div>
  );
}
