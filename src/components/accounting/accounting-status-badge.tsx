import { cn } from "@/lib/utils";

const toneStyles = {
  emerald: "border-emerald-500/15 bg-emerald-500/5 text-emerald-300/80",
  amber: "border-amber-500/15 bg-amber-500/5 text-amber-300/80",
  rose: "border-rose-500/15 bg-rose-500/5 text-rose-300/80",
  blue: "border-blue-500/15 bg-blue-500/5 text-blue-300/80",
  slate: "border-slate-500/15 bg-slate-500/5 text-slate-300/60",
  violet: "border-violet-500/15 bg-violet-500/5 text-violet-300/80",
} as const;

export function AccountingStatusBadge({
  label,
  tone = "slate",
  className,
}: {
  label: string;
  tone?: keyof typeof toneStyles;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium", toneStyles[tone], className)}>
      {label}
    </span>
  );
}
