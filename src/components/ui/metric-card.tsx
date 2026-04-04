export function MetricCard({ label, value, detail }: { label: string; value: string; detail: string; }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-mid p-5">
      <div className="text-xs uppercase tracking-[0.2em] text-text-muted">{label}</div>
      <div className="mt-3 text-3xl font-semibold">{value}</div>
      <div className="mt-2 text-sm text-text-muted">{detail}</div>
    </div>
  );
}
