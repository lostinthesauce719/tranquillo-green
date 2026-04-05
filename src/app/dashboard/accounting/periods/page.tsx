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
      description={`Month-end control board for the Phase 1 MVP. Periods now load from ${workspace.source === "convex" ? "persisted Convex period records" : "demo fallback data"} so the close board stays build-safe without giving up a server persistence path.`}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Tracked periods" value={String(summary.total)} detail={`${summary.closed} closed, ${summary.review} in review, ${summary.open} open`} />
        <MetricCard label="Current focus" value={currentPeriod.label} detail={`${currentPeriod.taskSummary.completed}/${currentPeriod.taskSummary.total} close tasks complete`} />
        <MetricCard label="Blocked periods" value={String(summary.blocked)} detail="Periods with open blocker lists that need attention before lock" />
        <MetricCard label="Close owner" value={currentPeriod.closeOwner} detail={`Target close window is ${currentPeriod.closeWindowDays} days`} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.65fr_1fr]">
        <ReportingPeriodsOverview periods={workspace.reportingPeriods} workflows={demoCloseWorkflows} />

        <div className="grid gap-4">
          <section className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Current period notes</div>
            <h2 className="mt-2 text-lg font-semibold">{currentPeriod.label}</h2>
            <ul className="mt-4 space-y-3 text-sm text-text-muted">
              <li>• Retail batches are landing daily from POS into the review queue.</li>
              <li>• Period stays editable for manual journals until checklist completion and blocker resolution.</li>
              <li>• Close status now comes through a server loader that prefers persisted data and safely falls back to demo records.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Next accounting action</div>
            <p className="mt-3 text-sm text-text-muted">
              Use the imports and transactions workspaces to stage source activity, review mappings, and draft balancing entries that support the current close.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/dashboard/accounting/imports" className="inline-flex rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
                Open imports workspace
              </Link>
              <Link href="/dashboard/accounting/transactions" className="inline-flex rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
                Open transactions workspace
              </Link>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
