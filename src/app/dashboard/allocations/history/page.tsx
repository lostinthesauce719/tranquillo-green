import Link from "next/link";
import { AllocationOverrideHistoryWorkspace } from "@/components/accounting/allocation-override-history-workspace";
import { AppShell } from "@/components/shell/app-shell";
import { MetricCard } from "@/components/ui/metric-card";
import { demoAllocationReviewQueue, summarizeAllocationHistory } from "@/lib/demo/accounting-operations";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export default function AllocationHistoryPage() {
  const summary = summarizeAllocationHistory(demoAllocationReviewQueue);

  return (
    <AppShell
      title="Allocation override history"
      description="Audit-trail workspace for 280E overrides, reviewer approvals, support requests, and resulting policy trail. Everything is static and demo-backed for CPA/compliance walkthroughs."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Items with history" value={String(summary.itemCount)} detail="Recommendation, override, and approval events preserved" />
        <MetricCard label="Manual overrides" value={String(summary.overrideCount)} detail="Events where deductible treatment changed after review" />
        <MetricCard label="Policy exceptions" value={String(summary.policyExceptionCount)} detail="Controller memo-backed exception decisions" />
        <MetricCard label="Deductible shift tracked" value={currencyFormatter.format(summary.totalShiftAmount)} detail={`${summary.supportRequestCount} support request events remain in audit trail`} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Review framing</div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">Original recommendation and final override amounts are shown side-by-side for each event.</div>
            <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">Actor, role, evidence, and reason fields read like a CPA-ready review binder rather than a black-box workflow log.</div>
            <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">Resulting policy trail makes it clear whether the item stayed on standing memo treatment or moved into exception handling.</div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Connected workspaces</div>
          <div className="mt-4 grid gap-3">
            <Link href="/dashboard/allocations" className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
              Back to allocation queue
            </Link>
            <Link href="/dashboard/allocations/support-schedule" className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
              Open 280E support schedule
            </Link>
            <Link href="/dashboard/exports" className="rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-100 transition hover:bg-violet-500/20">
              Open CPA export center
            </Link>
          </div>
        </section>
      </div>

      <div className="mt-6">
        <AllocationOverrideHistoryWorkspace items={demoAllocationReviewQueue} />
      </div>
    </AppShell>
  );
}
