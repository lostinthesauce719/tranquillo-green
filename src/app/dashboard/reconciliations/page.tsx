import Link from "next/link";
import { CashReconciliationWorkspace } from "@/components/accounting/cash-reconciliation-workspace";
import { AppShell } from "@/components/shell/app-shell";
import { MetricCard } from "@/components/ui/metric-card";
import { demoCashReconciliations, summarizeCashReconciliations } from "@/lib/demo/accounting-operations";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function ReconciliationsPage() {
  const summary = summarizeCashReconciliations(demoCashReconciliations);

  return (
    <AppShell
      title="Reconciliations"
      description="Cash reconciliation workspace for drawers, vault, armored clearing, and bank tie-out. The UI shows expected vs actual, variance investigation, and operator follow-up without any live service dependency."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Balanced accounts" value={String(summary.balanced)} detail={`${summary.readyToPost} workspaces staged for review package`} />
        <MetricCard label="Active investigations" value={String(summary.investigating + summary.exception)} detail="Drawer and clearing variances still need follow-up" />
        <MetricCard label="Absolute variance" value={currencyFormatter.format(summary.absoluteVariance)} detail="Total workflow exposure across cash workspaces" />
        <MetricCard label="Net variance" value={currencyFormatter.format(summary.netVariance)} detail="Should trend back to zero after fee and support entries" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Cash chain</div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">Drawer counts close each shift and capture returns, payouts, and drop logs.</div>
            <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">Vault workspace ties sealed bags and safe logs before armored pickup.</div>
            <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">Clearing catches timing differences, fees, and missing receipts between pickup and bank credit.</div>
            <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">Bank reconciliation closes the loop once statement activity and staging journals match.</div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-accent">Variance workflow</div>
              <ol className="mt-4 space-y-3 text-sm text-text-muted">
                <li>1. Compare expected ledger or POS cash to physical count / statement actuals.</li>
                <li>2. Open an investigation case when variance is non-zero or support is missing.</li>
                <li>3. Assign actions for recounts, support collection, and fee or reclass journal drafts.</li>
                <li>4. Move workspace to ready-for-review only after evidence and notes explain the remaining difference.</li>
              </ol>
            </div>
            <Link href="/dashboard/reconciliations/rec_003" className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
              Open clearing detail
            </Link>
          </div>
        </section>
      </div>

      <div className="mt-6">
        <CashReconciliationWorkspace items={demoCashReconciliations} />
      </div>
    </AppShell>
  );
}
