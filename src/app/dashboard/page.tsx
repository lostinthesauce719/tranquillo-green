import { AppShell } from "@/components/shell/app-shell";
import { MetricCard } from "@/components/ui/metric-card";
import { demoAllocationReviewQueue, demoCashReconciliations, summarizeAllocationQueue, summarizeCashReconciliations } from "@/lib/demo/accounting-operations";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function DashboardPage() {
  const allocationSummary = summarizeAllocationQueue(demoAllocationReviewQueue);
  const reconciliationSummary = summarizeCashReconciliations(demoCashReconciliations);

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
    </AppShell>
  );
}
