import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { MetricCard } from "@/components/ui/metric-card";
import { demoAllocationReviewQueue, demoCashReconciliations, getFeaturedCashReconciliationHref, summarizeAllocationQueue, summarizeCashReconciliations } from "@/lib/demo/accounting-operations";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function DashboardPage() {
  const allocationSummary = summarizeAllocationQueue(demoAllocationReviewQueue);
  const reconciliationSummary = summarizeCashReconciliations(demoCashReconciliations);
  const featuredReconciliationHref = getFeaturedCashReconciliationHref(demoCashReconciliations);

  return (
    <AppShell
      title="Overview"
      description="Phase 1 dashboard for accounting/compliance MVP: close period status, 280E exceptions, reconciliation health, and filing deadlines."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Allocation queue" value={String(allocationSummary.ready + allocationSummary.needsSupport + allocationSummary.pendingController)} detail={`${allocationSummary.approved} items already approved`} />
        <MetricCard label="Unreconciled cash" value={currencyFormatter.format(reconciliationSummary.absoluteVariance)} detail={`${reconciliationSummary.investigating + reconciliationSummary.exception} cash workspaces need follow-up`} />
        <MetricCard label="Inventory drift" value="3.1%" detail="Book vs package-level movement mismatch" />
        <MetricCard label="Upcoming filings" value="2" detail="California excise + sales tax due in 9 days" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Link href="/dashboard/allocations/history" className="rounded-2xl border border-border bg-surface-mid px-5 py-4 transition hover:bg-surface/70">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">New workspace</div>
          <div className="mt-2 font-medium">Allocation override history</div>
          <div className="mt-2 text-sm text-text-muted">Audit trail view of recommendations, overrides, evidence, and policy trail.</div>
        </Link>
        <Link href={featuredReconciliationHref} className="rounded-2xl border border-border bg-surface-mid px-5 py-4 transition hover:bg-surface/70">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">New detail</div>
          <div className="mt-2 font-medium">Reconciliation drill-down</div>
          <div className="mt-2 text-sm text-text-muted">Controller-style detail page with source breakdown, variance drivers, and next steps.</div>
        </Link>
        <Link href="/dashboard/exports" className="rounded-2xl border border-violet-500/20 bg-violet-500/10 px-5 py-4 transition hover:bg-violet-500/20">
          <div className="text-xs uppercase tracking-[0.2em] text-violet-200">New handoff</div>
          <div className="mt-2 font-medium text-violet-100">CPA export center</div>
          <div className="mt-2 text-sm text-violet-100/80">Build demo-backed close packets, included schedules, and handoff checklist history.</div>
        </Link>
      </div>
    </AppShell>
  );
}
