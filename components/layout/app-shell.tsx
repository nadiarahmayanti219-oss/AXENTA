"use client";

import { Menu, School } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { initials } from "@/lib/attendance";
import { useApp } from "@/components/providers/app-provider";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { profil, sekolah } = useApp();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="min-h-screen">
      {/* Sidebar desktop */}
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">
        <Sidebar />
      </div>

      {/* Sidebar mobile (drawer) */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 animate-fade-in">
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-white px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 text-muted hover:bg-slate-100 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Buka menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3.5 py-1.5 text-[13px] font-semibold text-ink">
              <School className="h-3.5 w-3.5 text-primary" />
              {sekolah.nama}
            </span>
          </div>
          <div className="flex items-center gap-3 border-l border-line pl-4">
            <div className="text-right">
              <p className="text-[13px] font-bold leading-4 text-ink">{profil.nama}</p>
              <p className="text-xs capitalize text-muted">{profil.role}</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
              {initials(profil.nama).slice(0, 1)}
            </span>
          </div>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <h1 className="text-2xl font-bold leading-8 text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
