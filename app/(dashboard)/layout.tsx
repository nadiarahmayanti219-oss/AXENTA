import { AlertTriangle } from "lucide-react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { AppProvider } from "@/components/providers/app-provider";
import { getSessionContext } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");

  if (!ctx.profil || !ctx.sekolah) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-card bg-white p-8 text-center shadow-card">
          <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-warning" />
          <h1 className="text-lg font-bold">Akun belum terhubung ke sekolah</h1>
          <p className="mt-2 text-sm text-muted">
            Profil untuk <b>{ctx.user.email}</b> tidak ditemukan. Pastikan migrasi database sudah dijalankan, lalu
            hubungi admin untuk menambahkan akun Anda ke tabel <code>profil</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppProvider profil={ctx.profil} sekolah={ctx.sekolah}>
      <AppShell>{children}</AppShell>
    </AppProvider>
  );
}
