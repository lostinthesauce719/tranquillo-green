import { AppShell } from "@/components/shell/app-shell";

export default function ReconciliationsPage() {
  return (
    <AppShell title="Reconciliations" description="Cash, bank, and inventory reconciliations with period-close signoff.">
      <div className="rounded-2xl border border-border bg-surface-mid p-5 text-sm text-text-muted">
        Tracks vault-to-drawer-to-deposit movement plus inventory drift between package records and accounting entries.
      </div>
    </AppShell>
  );
}
