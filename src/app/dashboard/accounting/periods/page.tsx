import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { ReportingPeriodsOverview } from "@/components/accounting/reporting-periods-overview";
import { MetricCard } from "@/components/ui/metric-card";
import { californiaOperatorDemo, demoReportingPeriods, summarizeDemoReportingPeriods } from "@/lib/demo/accounting";

export default function ReportingPeriodsPage() {
  const summary = summarizeDemoReportingPeriods(demoReportingPeriods);
  const currentPeriod = demoReportingPeriods.find((period) => period.label === californiaOperatorDemo.reportingPeriod.label) ?? demoReportingPeriods[0];

  return (
    <AppShell
      title="Reporting periods"
      description="Month-end control board for the Phase 1 MVP. Periods are backed by local demo data so close status, blockers, and lock state render during static builds with no live backend dependency."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Tracked periods" value={String(summary.total)} detail={`${summary.closed} closed, ${summary.review} in review, ${summary.open} open`} />
        <MetricCard label="Current focus" value={currentPeriod.label} detail={`${currentPeriod.taskSummary.completed}/${currentPeriod.taskSummary.total} close tasks complete`} />
        <MetricCard label="Blocked periods" value={String(summary.blocked)} detail="Periods with open blocker lists that need attention before lock" />
        <MetricCard label="Close owner" value={currentPeriod.closeOwner} detail={`Target close window is ${currentPeriod.closeWindowDays} days`} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.65fr_1fr]">
        <ReportingPeriodsOverview periods={demoReportingPeriods} />

        <div className="grid gap-4">
          <section className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Current period notes</div>
            <h2 className="mt-2 text-lg font-semibold">{currentPeriod.label}</h2>
            <ul className="mt-4 space-y-3 text-sm text-text-muted">
              <li>• Retail batches are landing daily from POS into the review queue.</li>
              <li>• Period stays editable for manual journals until checklist completion and blocker resolution.</li>
              <li>• Close status is realistic demo data and intentionally decoupled from Convex hooks for now.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Next accounting action</div>
            <p className="mt-3 text-sm text-text-muted">
              Use the transactions workspace to review imported activity and draft balancing entries that support the current close.
            </p>
            <Link href="/dashboard/accounting/transactions" className="mt-4 inline-flex rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
              Open transactions workspace
            </Link>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
