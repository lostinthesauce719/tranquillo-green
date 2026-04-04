import { AppShell } from "@/components/shell/app-shell";
import { MetricCard } from "@/components/ui/metric-card";

export default function DashboardPage() {
  return (
    <AppShell
      title="Overview"
      description="Phase 1 dashboard for accounting/compliance MVP: close period status, 280E exceptions, reconciliation health, and filing deadlines."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Open exceptions" value="14" detail="Transactions waiting for 280E review" />
        <MetricCard label="Unreconciled cash" value="$8.4k" detail="Drawer and vault variances across locations" />
        <MetricCard label="Inventory drift" value="3.1%" detail="Book vs package-level movement mismatch" />
        <MetricCard label="Upcoming filings" value="2" detail="California excise + sales tax due in 9 days" />
      </div>
    </AppShell>
  );
}
