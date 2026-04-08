import Link from "next/link";
import { CashReconciliationWorkspace } from "@/components/accounting/cash-reconciliation-workspace";
import { AppShell } from "@/components/shell/app-shell";
import { MetricCard } from "@/components/ui/metric-card";
import { getFeaturedCashReconciliation, getFeaturedCashReconciliationHref, summarizeCashReconciliations } from "@/lib/demo/accounting-operations";
import { loadAccountingWorkspace } from "@/lib/data/accounting-core";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default async function ReconciliationsPage() {
  const workspace = await loadAccountingWorkspace();
  const summary = summarizeCashReconciliations(workspace.cashReconciliations);
  const featuredReconciliation = getFeaturedCashReconciliation(workspace.cashReconciliations);
  const featuredReconciliationHref = getFeaturedCashReconciliationHref(workspace.cashReconciliations);

  return (
    <AppShell
      title="Reconciliations"
      description="Drawers, vault, armored clearing, and bank tie-out."
    >
      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard label="Balanced" value={String(summary.balanced)} detail={`${summary.readyToPost} staged for review`} />
        <MetricCard label="Investigations" value={String(summary.investigating + summary.exception)} detail="Variances needing follow-up" />
        <MetricCard label="Net variance" value={currencyFormatter.format(summary.netVariance)} detail="Should trend to zero" />
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl border border-border bg-surface-mid p-6">
          <div className="text-[11px] uppercase tracking-[0.15em] text-accent/70">Cash chain</div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted/50">Drawer counts capture returns, payouts, and drops.</div>
            <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted/50">Vault ties sealed bags before pickup.</div>
            <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted/50">Clearing catches timing differences and fees.</div>
            <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted/50">Bank closes the loop on statement activity.</div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface-mid p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.15em] text-accent/70">Workflow</div>
              <ol className="mt-3 space-y-2 text-sm text-text-muted/60">
                <li>1. Compare expected vs. actual.</li>
                <li>2. Open investigation when non-zero.</li>
                <li>3. Assign recounts and support.</li>
                <li>4. Move to review when explained.</li>
              </ol>
            </div>
            <Link href={featuredReconciliationHref} className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-muted transition hover:text-text-primary hover:bg-surface/70">
              {featuredReconciliation ? featuredReconciliation.accountName : "Open workspace"}
            </Link>
          </div>
        </section>
      </div>

      <div className="mt-6">
        <CashReconciliationWorkspace items={workspace.cashReconciliations} />
      </div>
    </AppShell>
  );
}
