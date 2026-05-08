"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

export default function SidebarItem({ item, collapsed, onNavigate, drawer = false }) {
  const pathname = usePathname();
  const router = useRouter();
  const Icon = item.icon;
  const active = item.href ? pathname === item.href || pathname.startsWith(`${item.href}/`) : item.children?.some((child) => pathname.startsWith(child.href));
  const [open, setOpen] = useState(Boolean(active));

  useEffect(() => {
    if (active) setOpen(true);
  }, [active]);

  if (item.children?.length) {
    return (
      <div>
        <button
          type="button"
          className={`flex min-h-11 w-full items-center rounded-xl text-left text-[13px] font-semibold leading-tight transition focus-ring ${drawer ? "gap-3 px-3 py-2.5" : "md:justify-center md:px-2 md:py-2.5 lg:justify-start"} ${collapsed ? "lg:justify-center lg:px-2 lg:py-2.5" : drawer ? "" : "lg:gap-3 lg:px-3 lg:py-2.5"} ${active ? "bg-dinkes-600 text-white shadow-button" : "text-slate-600 hover:bg-dinkes-50 hover:text-dinkes-800"}`}
          title={collapsed ? item.label : undefined}
          aria-expanded={!collapsed && open}
          onClick={() => setOpen((value) => !value)}
        >
          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
          {!collapsed ? <span className={`${drawer ? "block" : "hidden lg:block"} min-w-0 flex-1`}>{item.label}</span> : null}
          {!collapsed ? <ChevronDown className={`${drawer ? "block" : "hidden lg:block"} h-4 w-4 transition ${open ? "rotate-180" : ""} ${active ? "text-white/80" : "text-dinkes-500"}`} aria-hidden="true" /> : null}
        </button>
        {!collapsed && open ? (
          <div className={`mt-1.5 space-y-1 rounded-xl bg-slate-50 py-2 pl-4 pr-2 ${drawer ? "block" : "hidden lg:block"}`}>
            {item.children.map((child) => (
              <SidebarItem key={child.href} item={child} collapsed={false} onNavigate={onNavigate} drawer={drawer} />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  const content = (
    <>
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {!collapsed ? <span className={drawer ? "" : "hidden lg:inline"}>{item.label}</span> : null}
    </>
  );

  if (item.action === "logout") {
    return (
      <button
        className={`flex min-h-11 w-full items-center rounded-xl text-left text-[13px] font-medium leading-tight text-slate-600 transition hover:bg-slate-100 focus-ring ${drawer ? "gap-3 px-3 py-2.5" : "md:justify-center md:px-2 md:py-2.5 lg:justify-start"} ${collapsed ? "lg:justify-center lg:px-2 lg:py-2.5" : drawer ? "" : "lg:gap-3 lg:px-3 lg:py-2.5"}`}
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
      className={`flex min-h-11 items-center rounded-xl text-[13px] font-medium leading-tight transition focus-ring ${drawer ? "gap-3 px-3 py-2.5" : "md:justify-center md:px-2 md:py-2.5 lg:justify-start"} ${collapsed ? "lg:justify-center lg:px-2 lg:py-2.5" : drawer ? "" : "lg:gap-3 lg:px-3 lg:py-2.5"} ${active ? "bg-dinkes-600 text-white shadow-button" : "text-slate-600 hover:bg-dinkes-50 hover:text-dinkes-800"}`}
    >
      {content}
    </Link>
  );
}
