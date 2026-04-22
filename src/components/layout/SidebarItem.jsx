"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

export default function SidebarItem({ item, collapsed, onNavigate }) {
  const pathname = usePathname();
  const Icon = item.icon;
  const active = item.href ? pathname === item.href || pathname.startsWith(`${item.href}/`) : item.children?.some((child) => pathname.startsWith(child.href));

  if (item.children?.length) {
    return (
      <div>
        <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${active ? "bg-dinkes-700 text-white" : "text-slate-600"}`}>
          <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
          {!collapsed ? <span className="flex-1">{item.label}</span> : null}
          {!collapsed ? <ChevronDown className="h-4 w-4" aria-hidden="true" /> : null}
        </div>
        {!collapsed ? (
          <div className="mt-1 space-y-1 pl-5">
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
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      {!collapsed ? <span>{item.label}</span> : null}
    </>
  );

  if (item.action === "logout") {
    return (
      <a className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus-ring" href={item.href}>
        {content}
      </a>
    );
  }

  return (
    <Link onClick={onNavigate} href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition focus-ring ${active ? "bg-dinkes-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>
      {content}
    </Link>
  );
}
