import { DemoReportingPeriod } from "@/lib/demo/accounting";
import { AccountingStatusBadge } from "@/components/accounting/accounting-status-badge";

function formatRange(startDate: string, endDate: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${startDate}T00:00:00`)) + " – " + new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${endDate}T00:00:00`));
}

function getStatusTone(status: DemoReportingPeriod["status"]) {
  switch (status) {
    case "closed":
      return "emerald" as const;
    case "review":
      return "amber" as const;
    case "open":
      return "blue" as const;
  }
}

export function ReportingPeriodsOverview({ periods }: { periods: DemoReportingPeriod[] }) {
  return (
    <div className="grid gap-4">
      {periods.map((period) => {
        const progress = `${period.taskSummary.completed}/${period.taskSummary.total}`;
        const progressWidth = `${(period.taskSummary.completed / period.taskSummary.total) * 100}%`;

        return (
          <section key={period.label} className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-semibold">{period.label}</h2>
                  <AccountingStatusBadge label={period.status.toUpperCase()} tone={getStatusTone(period.status)} />
                  {period.blockers.length > 0 ? <AccountingStatusBadge label={`${period.blockers.length} blockers`} tone="rose" /> : null}
                </div>
                <p className="mt-2 text-sm text-text-muted">{formatRange(period.startDate, period.endDate)} • Owner: {period.closeOwner} • Target close in {period.closeWindowDays} days</p>
              </div>
              <div className="min-w-[220px] rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-muted">
                <div className="flex items-center justify-between gap-4">
                  <span>Checklist progress</span>
                  <span className="font-medium text-text-primary">{progress}</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-background">
                  <div className="h-2 rounded-full bg-accent" style={{ width: progressWidth }} />
                </div>
                <div className="mt-3 text-xs">
                  {period.lockedAt ? `Locked ${period.lockedAt}` : "Still editable for manual journals and reconciliations"}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-accent">Close highlights</div>
                <ul className="mt-3 space-y-2 text-sm text-text-muted">
                  {period.highlights.map((highlight) => (
                    <li key={highlight}>• {highlight}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-accent">Open blockers</div>
                {period.blockers.length === 0 ? (
                  <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                    No blockers. Period is ready for lock or already locked.
                  </div>
                ) : (
                  <ul className="mt-3 space-y-2 text-sm text-text-muted">
                    {period.blockers.map((blocker) => (
                      <li key={blocker}>• {blocker}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
