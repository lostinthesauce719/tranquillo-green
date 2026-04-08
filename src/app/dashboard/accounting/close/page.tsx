import Link from "next/link";
import { MonthEndCloseDashboard } from "@/components/accounting/month-end-close-dashboard";
import { AppShell } from "@/components/shell/app-shell";
import { MetricCard } from "@/components/ui/metric-card";
import { loadMonthEndCloseDashboard } from "@/lib/data/accounting-close";

export default async function AccountingClosePage() {
  const dashboard = await loadMonthEndCloseDashboard();
  const blockedAreas = dashboard.areas.filter((area) => area.status === "blocked").length;
  const readyAreas = dashboard.areas.filter((area) => area.status === "ready").length;
  const watchAreas = dashboard.areas.filter((area) => area.status === "watch").length;
  const computedAreaCount = dashboard.computedAreas.length;
  const fallbackAreaCount = dashboard.fallbackAreas.length;

  return (
    <AppShell
      title="Month-end close"
      description="Month-end close command center for deciding whether the current period is still in prep, ready for reviewer handoff, or ready to lock. The view stays explicit about which lanes are live-computed versus demo-backed."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Close readiness" value={`${dashboard.readinessPercent}%`} detail={`${readyAreas} workflows ready for signoff`} />
        <MetricCard label="Critical blockers" value={String(dashboard.openBlockers.length)} detail={`${blockedAreas} workflow areas are currently blocked`} />
        <MetricCard label="Watch items" value={String(watchAreas)} detail="Lanes that still need reviewer follow-up before lock" />
        <MetricCard label="Next actions" value={String(dashboard.nextActions.length)} detail="Top workflow nudges surfaced from the connected close workspaces" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-accent">Close posture</div>
              <p className="mt-3 max-w-3xl text-sm text-text-muted">
                Use this page as the controller-facing decision point: confirm the target lock date, see what is blocking signoff, and know which workspaces still need action before the binder can go out.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text-muted">
              <div>Live-computed lanes: <span className="text-text-primary">{computedAreaCount}</span></div>
              <div className="mt-1">Demo-backed lanes: <span className="text-text-primary">{fallbackAreaCount}</span></div>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">Periods and review checklists define the close calendar, lock target, and approval path.</div>
            <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">Imports and posting readiness tell you whether the ledger can move without introducing late review risk.</div>
            <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">Recs, 280E support, and binder completeness decide whether external handoff is safe even if the ledger is mostly posted.</div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Fast navigation</div>
          <div className="mt-4 grid gap-3">
            <Link href="/dashboard/accounting/pipeline" className="rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-100 transition hover:bg-violet-500/20">
              Open transaction pipeline board
            </Link>
            <Link href="/dashboard/accounting/periods" className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
              Open reporting periods
            </Link>
            <Link href="/dashboard/reconciliations" className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
              Open reconciliation workspace
            </Link>
          </div>
        </section>
      </div>

      <div className="mt-6">
        <MonthEndCloseDashboard dashboard={dashboard} />
      </div>
    </AppShell>
  );
}
