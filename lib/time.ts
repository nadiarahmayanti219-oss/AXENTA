export const TZ_DEFAULT = "Asia/Jakarta";

export const HARI_SHORT = ["", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
export const HARI_LONG = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

const WD: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

/** Pecah sebuah Date menjadi tanggal/jam/hari lokal pada zona waktu tertentu. */
export function zonedParts(date: Date, tz: string = TZ_DEFAULT) {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const p: Record<string, string> = {};
  for (const part of f.formatToParts(date)) p[part.type] = part.value;
  const hour = p.hour === "24" ? "00" : p.hour;
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    time: `${hour}:${p.minute}:${p.second}`,
    hari: WD[p.weekday] ?? 1,
  };
}

export const todayStr = (tz: string = TZ_DEFAULT) => zonedParts(new Date(), tz).date;
export const currentMonth = (tz: string = TZ_DEFAULT) => todayStr(tz).slice(0, 7);

/** Hari ISO (1=Senin..7=Minggu) dari string tanggal YYYY-MM-DD. */
export function hariOf(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return wd === 0 ? 7 : wd;
}

/** Semua tanggal dalam bulan "YYYY-MM". */
export function datesInMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const n = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Array.from({ length: n }, (_, i) => {
    const date = `${ym}-${String(i + 1).padStart(2, "0")}`;
    return { date, day: i + 1, hari: hariOf(date) };
  });
}

export function monthRange(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { start: `${ym}-01`, end: `${ym}-${String(last).padStart(2, "0")}` };
}

export function addDays(dateStr: string, n: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

export function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, 1)),
  );
}

export function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

export function formatTime(iso: string, tz: string = TZ_DEFAULT) {
  return zonedParts(new Date(iso), tz).time.slice(0, 5);
}

/** "07:15:00" -> "07:15" */
export const hhmm = (t: string) => t.slice(0, 5);

export const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export function timeAgo(iso: string | null) {
  if (!iso) return "Belum pernah";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${Math.max(s, 0)} detik lalu`;
  if (s < 3600) return `${Math.floor(s / 60)} menit lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
  return `${Math.floor(s / 86400)} hari lalu`;
}
