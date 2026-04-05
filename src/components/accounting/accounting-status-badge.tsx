import { cn } from "@/lib/utils";

const toneStyles = {
  emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  amber: "border-amber-500/20 bg-amber-500/10 text-amber-200",
  rose: "border-rose-500/20 bg-rose-500/10 text-rose-200",
  blue: "border-blue-500/20 bg-blue-500/10 text-blue-200",
  slate: "border-slate-500/20 bg-slate-500/10 text-slate-300",
  violet: "border-violet-500/20 bg-violet-500/10 text-violet-200",
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
    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-medium", toneStyles[tone], className)}>
      {label}
    </span>
  );
}
