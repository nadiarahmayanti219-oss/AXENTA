"use client";

import { createContext, useContext } from "react";
import type { Profil, Sekolah } from "@/lib/types";

interface AppContextValue {
  profil: Profil;
  sekolah: Sekolah;
  isAdmin: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ profil, sekolah, children }: { profil: Profil; sekolah: Sekolah; children: React.ReactNode }) {
  return <AppContext.Provider value={{ profil, sekolah, isAdmin: profil.role === "admin" }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp harus dipakai di dalam AppProvider");
  return ctx;
}
