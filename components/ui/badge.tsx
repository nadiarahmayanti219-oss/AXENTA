import { cn } from "@/lib/cn";

type Tone = "neutral" | "hero" | "success" | "warning" | "danger" | "primary";

const tones: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-600",
  hero: "bg-white/20 text-white",
  success: "bg-green-50 text-success",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-danger-50 text-danger",
  primary: "bg-primary-50 text-primary",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[11px] font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
