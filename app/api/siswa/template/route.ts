import { requireSession } from "@/lib/api";
import { workbookResponse } from "@/lib/excel";

export const dynamic = "force-dynamic";

export async function GET() {
  const r = await requireSession();
  if ("error" in r) return r.error;
  return workbookResponse(
    [
      {
        name: "Siswa",
        rows: [
          ["nama", "nis", "kelas", "nfc_uid"],
          ["Ahmad Rasyid", "2024001", "4A", "8159FF7B"],
          ["Aisyah Putri", "2024002", "4A", "NFC-4A-002"],
        ],
        widths: [28, 14, 8, 16],
      },
      {
        name: "Petunjuk",
        rows: [
          ["Kolom", "Wajib", "Keterangan"],
          ["nama", "Ya", "Nama lengkap siswa"],
          ["nis", "Tidak", "Nomor induk siswa"],
          ["kelas", "Ya", "Contoh: 4A"],
          ["nfc_uid", "Ya", "UID kartu NFC (HEX, tanpa spasi). Harus unik. Data dengan UID sama akan diperbarui."],
        ],
        widths: [10, 8, 80],
      },
    ],
    "Template_Import_Siswa.xlsx",
  );
}
