"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

export default function SidebarItem({ item, collapsed, onNavigate }) {
  const pathname = usePathname();
  const router = useRouter();
  const Icon = item.icon;
  const active = item.href ? pathname === item.href || pathname.startsWith(`${item.href}/`) : item.children?.some((child) => pathname.startsWith(child.href));

  if (item.children?.length) {
    return (
      <div>
        <div className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-dinkes-500 text-white shadow-button" : "text-slate-600 hover:bg-slate-50"}`}>
          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
          {!collapsed ? <span className="flex-1">{item.label}</span> : null}
          {!collapsed ? <ChevronDown className={`h-4 w-4 transition ${active ? "text-white/80" : "text-dinkes-500"}`} aria-hidden="true" /> : null}
        </div>
        {!collapsed ? (
          <div className="mt-2 space-y-1 rounded-md bg-[#f5f7fb] py-2 pl-5 pr-2">
            {item.children.map((child) => (
              <SidebarItem key={child.href} item={child} collapsed={false} onNavigate={onNavigate} />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  const content = (
    <>
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {!collapsed ? <span>{item.label}</span> : null}
    </>
  );

  if (item.action === "logout") {
    return (
      <button
        className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus-ring"
        type="button"
        onClick={async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          router.replace("/login");
          router.refresh();
        }}
      >
        {content}
      </button>
    );
  }

  return (
    <Link onClick={onNavigate} href={item.href} className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition focus-ring ${active ? "bg-dinkes-500 text-white shadow-button" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>
      {content}
    </Link>
  );
}
