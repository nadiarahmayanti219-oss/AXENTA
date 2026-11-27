"use client";

import { Loader2, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AxentaMark } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const isDefaultAdmin = email.trim().toLowerCase() === "admin@axenta.com" && password === "admin";

    if (isDefaultAdmin) {
      document.cookie = "axenta_admin_session=1; path=/; max-age=604800; SameSite=Lax";
      try {
        await createClient().auth.signInWithPassword({
          email: "admin@axenta.com",
          password: "admin",
        });
      } catch {
        // Tetap izinkan masuk menggunakan sesi default admin@AXENTA.com
      }
      toast.success("Berhasil masuk sebagai Admin AXENTA");
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    try {
      const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setLoading(false);
        toast.error(error.message === "Invalid login credentials" ? "Email atau password salah" : error.message);
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setLoading(false);
      toast.error("Tidak dapat terhubung ke server autentikasi. Gunakan akun admin@AXENTA.com / password: admin.");
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-12 lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-primary-dark/30 blur-3xl" />
        <div className="relative flex items-center gap-3.5">
          <AxentaMark className="h-11 w-11" />
          <div>
            <p className="text-2xl font-extrabold tracking-wider text-white">
              A<span className="text-[#2997FF]">X</span>ENTA
            </p>
            <p className="text-xs text-sidebar-text">Automated Experience for Entry and Attendance</p>
          </div>
        </div>
        <div className="relative">
          <h2 className="max-w-md text-3xl font-bold leading-tight text-white">
            Sistem absensi siswa berbasis NFC real-time di Gerbang Utama Sekolah.
          </h2>
          <p className="mt-4 max-w-md text-sm text-sidebar-text">
            Pantau kehadiran, ketepatan waktu, dan aktivitas tap kartu NFC siswa secara terpusat dari satu dashboard.
          </p>
        </div>
        <p className="relative text-xs text-sidebar-text">© {new Date().getFullYear()} AXENTA</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={onSubmit} className="w-full max-w-sm rounded-card bg-white p-8 shadow-card">
          <h1 className="text-2xl font-bold text-ink">Masuk AXENTA</h1>
          <p className="mt-1 text-sm text-muted">Gunakan akun sekolah Anda untuk membuka dashboard.</p>

          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
                <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" placeholder="admin@AXENTA.com" />
              </div>
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
                <Input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" placeholder="••••••••" />
              </div>
            </div>
          </div>

          <Button type="submit" className="mt-6 h-10 w-full justify-center" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Masuk
          </Button>
        </form>
      </div>
    </div>
  );
}
