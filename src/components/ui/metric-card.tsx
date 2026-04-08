export function MetricCard({ label, value, detail }: { label: string; value: string; detail: string; }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-mid p-6">
      <div className="text-[11px] uppercase tracking-[0.15em] text-text-muted/60">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      <div className="mt-1.5 text-sm text-text-muted/70">{detail}</div>
    </div>
  );
}
