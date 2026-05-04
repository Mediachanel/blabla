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
        <div
          className={`flex min-h-10 items-center rounded-md text-[13px] font-semibold leading-tight transition ${collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2.5"} ${active ? "bg-dinkes-500 text-white shadow-button" : "text-slate-600 hover:bg-slate-50"}`}
          title={collapsed ? item.label : undefined}
        >
          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
          {!collapsed ? <span className="min-w-0 flex-1">{item.label}</span> : null}
          {!collapsed ? <ChevronDown className={`h-4 w-4 transition ${active ? "text-white/80" : "text-dinkes-500"}`} aria-hidden="true" /> : null}
        </div>
        {!collapsed ? (
          <div className="mt-1.5 space-y-1 rounded-md bg-[#f5f7fb] py-2 pl-4 pr-2">
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
        className={`flex min-h-10 w-full items-center rounded-md text-left text-[13px] font-medium leading-tight text-slate-600 transition hover:bg-slate-100 focus-ring ${collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2.5"}`}
        type="button"
        title={collapsed ? item.label : undefined}
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
    <Link
      onClick={onNavigate}
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={`flex min-h-10 items-center rounded-md text-[13px] font-medium leading-tight transition focus-ring ${collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2.5"} ${active ? "bg-dinkes-500 text-white shadow-button" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
    >
      {content}
    </Link>
  );
}
