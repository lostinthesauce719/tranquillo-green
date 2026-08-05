import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { ReportingPeriodsOverview } from "@/components/accounting/reporting-periods-overview";
import { MetricCard } from "@/components/ui/metric-card";
import { summarizeDemoReportingPeriods } from "@/lib/demo/accounting";
import { demoCloseWorkflows } from "@/lib/demo/accounting-workflows";
import { loadAccountingWorkspace } from "@/lib/data/accounting-core";

export default async function ReportingPeriodsPage() {
  const workspace = await loadAccountingWorkspace();
  const summary = summarizeDemoReportingPeriods(workspace.reportingPeriods);
  const currentPeriod = workspace.reportingPeriods.find((period) => period.status === "open" || period.status === "review") ?? workspace.reportingPeriods[0];

  return (
    <AppShell
      title="Reporting periods"
      description="Month-end control board for close tracking and lock."
    >
      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard label="Periods" value={String(summary.total)} detail={`${summary.closed} closed, ${summary.open} open`} />
        <MetricCard label="Current" value={currentPeriod.label} detail={`${currentPeriod.taskSummary.completed}/${currentPeriod.taskSummary.total} tasks done`} />
        <MetricCard label="Blocked" value={String(summary.blocked)} detail="Need attention before lock" />
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-[1.65fr_1fr]">
        <ReportingPeriodsOverview periods={workspace.reportingPeriods} workflows={demoCloseWorkflows} />

        <div className="grid gap-5">
          <section className="rounded-2xl border border-border bg-surface-mid p-6">
            <div className="text-[11px] uppercase tracking-[0.15em] text-accent/70">{currentPeriod.label}</div>
            <ul className="mt-3 space-y-1.5 text-sm text-text-muted/60">
              <li>POS batches landing into review.</li>
              <li>Editable until checklist complete.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-surface-mid p-6">
            <div className="text-[11px] uppercase tracking-[0.15em] text-accent/70">Next</div>
            <p className="mt-2 text-sm text-text-muted/60">
              Stage activity in imports, review mappings, draft entries.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/dashboard/accounting/imports" className="inline-flex rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-muted transition hover:text-text-primary hover:bg-surface/70">
                Imports
              </Link>
              <Link href="/dashboard/accounting/transactions" className="inline-flex rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-muted transition hover:text-text-primary hover:bg-surface/70">
                Transactions
              </Link>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
