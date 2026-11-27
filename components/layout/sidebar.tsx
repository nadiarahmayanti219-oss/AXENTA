"use client";

import { CalendarCheck, Clock, LayoutDashboard, LogOut, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/attendance";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/components/providers/app-provider";
import { NfcStatusPill } from "./nfc-status-pill";

export const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/rekap", label: "Rekap Kehadiran", icon: CalendarCheck },
  { href: "/siswa", label: "Data Siswa", icon: Users },
  { href: "/aturan-jam", label: "Aturan Jam Sekolah", icon: Clock },
  { href: "/pengaturan", label: "Pengaturan", icon: Settings },
];

export function AxentaMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={`shrink-0 ${className}`} aria-hidden="true">
      <rect x="2" y="2" width="60" height="60" rx="16" fill="#0B1B3A" stroke="#2F6BFF" strokeWidth="2.5" />
      <path d="M16 24V18C16 16.8954 16.8954 16 18 16H24" stroke="#22D3EE" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M40 16H46C47.1046 16 48 16.8954 48 18V24" stroke="#22D3EE" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M16 40V46C16 47.1046 16.8954 48 18 48H24" stroke="#22D3EE" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M40 48H46C47.1046 48 48 47.1046 48 46V40" stroke="#22D3EE" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M23 23L41 41M41 23L23 41" stroke="url(#axenta-grad)" strokeWidth="6" strokeLinecap="round" />
      <circle cx="32" cy="32" r="3" fill="#10D9A0" />
      <defs>
        <linearGradient id="axenta-grad" x1="20" y1="20" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2F6BFF" />
          <stop offset="1" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Brand() {
  return (
    <div className="flex items-center gap-3">
      <AxentaMark className="h-10 w-10" />
      <div>
        <p className="text-xl font-extrabold tracking-wider leading-6 text-white">
          A<span className="text-[#2997FF]">X</span>ENTA
        </p>
        <p className="text-[10px] leading-3 text-sidebar-text">Automated Experience for Entry and Attendance</p>
      </div>
    </div>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profil } = useApp();

  async function logout() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-full w-60 flex-col bg-sidebar">
      <div className="px-5 pb-6 pt-6">
        <Brand />
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex h-11 items-center gap-3 rounded-xl px-4 text-sm transition-colors",
                active ? "bg-primary font-semibold text-white shadow-hero" : "text-sidebar-text hover:bg-sidebar-muted hover:text-white",
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4">
        <NfcStatusPill />
      </div>

      <div className="flex items-center gap-3 border-t border-white/10 px-4 py-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
          {initials(profil.nama).slice(0, 1)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{profil.nama}</p>
          <p className="truncate text-xs capitalize text-sidebar-text">{profil.role}</p>
        </div>
        <button
          onClick={logout}
          aria-label="Keluar"
          title="Keluar"
          className="rounded-lg p-2 text-sidebar-text hover:bg-sidebar-muted hover:text-white"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
