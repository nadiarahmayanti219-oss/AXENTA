import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/misc";

export function HeroStatCard({
  icon,
  badge,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  badge: string;
  label: string;
  value: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-card bg-gradient-to-br from-primary-dark to-primary p-5 text-white shadow-hero transition-transform hover:-translate-y-0.5">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />
      <div className="relative flex items-start justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">{icon}</span>
        <Badge tone="hero">{badge}</Badge>
      </div>
      <p className="overline relative mt-4 text-white/90">{label}</p>
      <div className="relative mt-1 text-[28px] font-bold leading-9">
        {loading ? <Skeleton className="h-9 w-16 bg-white/20" /> : value}
      </div>
    </div>
  );
}

export function StatCard({
  icon,
  badge,
  label,
  value,
  caption,
  loading,
  className,
}: {
  icon: React.ReactNode;
  badge: string;
  label: string;
  value: React.ReactNode;
  caption: string;
  loading?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("rounded-card border border-line/70 bg-white p-5 shadow-card transition-transform hover:-translate-y-0.5", className)}>
      <div className="flex items-start justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary">{icon}</span>
        <Badge>{badge}</Badge>
      </div>
      <p className="overline mt-4 text-muted">{label}</p>
      <div className="mt-1 text-[28px] font-bold leading-9 text-ink">{loading ? <Skeleton className="h-9 w-16" /> : value}</div>
      <p className="text-xs text-muted">{caption}</p>
    </div>
  );
}
