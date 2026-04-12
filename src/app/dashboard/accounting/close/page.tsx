import Link from "next/link";
import { MonthEndCloseDashboard } from "@/components/accounting/month-end-close-dashboard";
import { AppShell } from "@/components/shell/app-shell";
import { LiveMetricCard } from "@/components/ui/live-metric-card";
import { StaggerContainer } from "@/components/ui/stagger-container";
import { BarChartAnimated, type BarChartDatum } from "@/components/ui/bar-chart-animated";
import { PulseDot } from "@/components/ui/pulse-dot";
import { loadMonthEndCloseDashboard } from "@/lib/data/accounting-close";

function statusColor(status: string): string {
  switch (status) {
    case "ready": return "var(--success)";
    case "on_track": return "var(--info)";
    case "watch": return "var(--warning)";
    case "blocked": return "var(--danger)";
    default: return "var(--text-muted)";
  }
}

function statusPulseColor(status: string): "green" | "amber" | "red" | "blue" | "violet" | undefined {
  if (status === "watch") return "amber";
  if (status === "blocked") return "red";
  return undefined;
}

function readinessForStatus(status: string): number {
  switch (status) {
    case "ready": return 100;
    case "on_track": return 76;
    case "watch": return 48;
    case "blocked": return 22;
    default: return 0;
  }
}

export default async function AccountingClosePage() {
  const dashboard = await loadMonthEndCloseDashboard();
  const blockedAreas = dashboard.areas.filter((area) => area.status === "blocked").length;
  const readyAreas = dashboard.areas.filter((area) => area.status === "ready").length;
  const watchAreas = dashboard.areas.filter((area) => area.status === "watch").length;

  const areaChartData: BarChartDatum[] = dashboard.areas.map((area) => ({
    label: area.label.length > 18 ? area.label.slice(0, 16) + "..." : area.label,
    value: readinessForStatus(area.status),
    color: statusColor(area.status),
  }));

  return (
    <AppShell
      title="Month-end close"
      description="Month-end close command center that now computes readiness from live persisted reporting periods, import jobs, transaction workflow state, cash reconciliations, and support signals when backend data is available, while staying demo-safe for static builds and unsupported workflows."
    >
      <StaggerContainer className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <LiveMetricCard label="Close readiness" value={dashboard.readinessPercent} detail={`${readyAreas} workflows ready for signoff`} suffix="%" dotColor={dashboard.readinessPercent >= 80 ? "green" : dashboard.readinessPercent >= 50 ? "amber" : "red"} />
        <LiveMetricCard label="Critical blockers" value={dashboard.openBlockers.length} detail={`${blockedAreas} workflow areas are currently blocked`} dotColor={dashboard.openBlockers.length > 0 ? "red" : "green"} />
        <LiveMetricCard label="Watch items" value={watchAreas} detail="Lanes that still need reviewer follow-up before lock" dotColor={watchAreas > 0 ? "amber" : undefined} />
        <LiveMetricCard label="Next actions" value={dashboard.nextActions.length} detail="Top workflow nudges surfaced from the connected close workspaces" />
      </StaggerContainer>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Close posture</div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">Periods and review checklists define the calendar, lock target, and approval path.</div>
            <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">The posting pipeline turns staged imports and reviewed transactions into a controlled release queue.</div>
            <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">Recs, 280E support, and binder completeness decide whether the period is truly signoff-ready.</div>
          </div>

          <div className="mt-5">
            <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Area readiness breakdown</div>
            <div className="mt-3">
              <BarChartAnimated data={areaChartData} barHeight="md" />
            </div>
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

          <div className="mt-5">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Area status</div>
            <div className="mt-3 space-y-2">
              {dashboard.areas.map((area) => {
                const pulseColor = statusPulseColor(area.status);
                return (
                  <div key={area.id} className="flex items-center gap-2 text-sm">
                    {pulseColor ? <PulseDot color={pulseColor} size="sm" /> : <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: statusColor(area.status) }} />}
                    <span className="flex-1 text-text-primary">{area.label}</span>
                    <span className="capitalize text-text-muted">{area.status.replace("_", " ")}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6">
        <MonthEndCloseDashboard dashboard={dashboard} />
      </div>
    </AppShell>
  );
}
