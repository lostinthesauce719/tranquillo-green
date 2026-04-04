import { AppShell } from "@/components/shell/app-shell";

export default function ExportsPage() {
  return (
    <AppShell title="Exports" description="QuickBooks exports, CPA review packages, and close-period output files.">
      <div className="rounded-2xl border border-border bg-surface-mid p-5 text-sm text-text-muted">
        MVP export set: QBO journal export, 280E support schedule CSV/PDF, filing support packet, month-end checklist.
      </div>
    </AppShell>
  );
}
