import Link from "next/link";
import { AllocationReviewQueue } from "@/components/accounting/allocation-review-queue";
import { AppShell } from "@/components/shell/app-shell";
import { MetricCard } from "@/components/ui/metric-card";
import { demoAllocationReviewQueue, summarizeAllocationQueue } from "@/lib/demo/accounting-operations";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function AllocationsPage() {
  const summary = summarizeAllocationQueue(demoAllocationReviewQueue);

  return (
    <AppShell
      title="280E Allocations"
      description="Deterministic 280E review queue for shared occupancy, labor absorption, and policy-based overrides. All decisions are demo-data-backed so operators can walk a real review workflow without live backend dependencies."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Queue items" value={String(summary.total)} detail={`${summary.ready} ready, ${summary.needsSupport} waiting on support`} />
        <MetricCard label="Controller escalations" value={String(summary.pendingController)} detail="Items exceeding policy variance thresholds" />
        <MetricCard label="Recommended deductible" value={currencyFormatter.format(summary.deductible)} detail="Capitalizable or deductible share from current queue" />
        <MetricCard label="280E-limited" value={currencyFormatter.format(summary.nondeductible)} detail={`${summary.approved} items already approved`} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Queue rules</div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">
              Square footage rules split mixed-use occupancy and security by licensed production footprint.
            </div>
            <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">
              Labor-hour rules capitalize direct manufacturing time and route support deviations over 5 points to controller review.
            </div>
            <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">
              Custom policy rules preserve memo-backed exceptions for professional fees and unusual mixed-purpose spend.
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-accent">Operator workflow</div>
              <ol className="mt-4 space-y-3 text-sm text-text-muted">
                <li>1. Review confidence, driver basis, and supporting policy before accepting the recommended split.</li>
                <li>2. Check evidence completeness. Missing support downgrades the item into a hold state instead of silent posting.</li>
                <li>3. Approve, request support, override the basis, or escalate to controller depending on threshold and policy memo.</li>
                <li>4. Carry approved splits into close workpapers and preserve reviewer attribution for audit support.</li>
              </ol>
            </div>
            <div className="grid gap-3">
              <Link href="/dashboard/allocations/support-schedule" className="rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-100 transition hover:bg-violet-500/20">
                Open support schedule
              </Link>
              <Link href="/dashboard/allocations/history" className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
                Open override history
              </Link>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6">
        <AllocationReviewQueue items={demoAllocationReviewQueue} />
      </div>
    </AppShell>
  );
}
