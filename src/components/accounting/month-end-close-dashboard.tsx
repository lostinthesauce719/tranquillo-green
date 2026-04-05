import Link from "next/link";
import { AccountingStatusBadge } from "@/components/accounting/accounting-status-badge";
import type { DemoCloseArea } from "@/lib/demo/accounting-close";
import type { MonthEndCloseDashboardData } from "@/lib/data/accounting-close";

function statusTone(status: DemoCloseArea["status"]) {
  switch (status) {
    case "ready":
      return "emerald" as const;
    case "on_track":
      return "blue" as const;
    case "watch":
      return "amber" as const;
    case "blocked":
      return "rose" as const;
  }
}

function progressWidth(area: DemoCloseArea) {
  if (area.status === "ready") return "100%";
  if (area.status === "on_track") return "76%";
  if (area.status === "watch") return "48%";
  return "22%";
}

export function MonthEndCloseDashboard({ dashboard }: { dashboard: MonthEndCloseDashboardData }) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-surface-mid p-5">
        <div className="flex flex-col gap-4 border-b border-border pb-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Controller command center</div>
            <h2 className="mt-2 text-2xl font-semibold">{dashboard.periodLabel} close readiness</h2>
            <p className="mt-2 max-w-3xl text-sm text-text-muted">
              Computed month-end dashboard that ties reporting periods, imports, transaction posting, reconciliations, and support packet signals into one close view while preserving demo-safe fallbacks.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text-muted">
            <div>Approver: {dashboard.controller}</div>
            <div className="mt-1">{dashboard.targetLockDate}</div>
            <div className="mt-1 capitalize">Source mode: {dashboard.source}</div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">
          <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Data source summary</div>
          <p className="mt-3 text-text-primary">{dashboard.sourceSummary}</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Live-computed areas</div>
              <ul className="mt-2 space-y-2">
                {dashboard.computedAreas.map((area) => (
                  <li key={area}>• {area}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Fallback areas</div>
              <ul className="mt-2 space-y-2">
                {dashboard.fallbackAreas.map((area) => (
                  <li key={area}>• {area}</li>
                ))}
              </ul>
            </div>
          </div>
          {dashboard.caveats.length > 0 ? (
            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-3 text-amber-100">
              <div className="text-xs uppercase tracking-[0.2em]">Fallback and runtime caveats</div>
              <ul className="mt-2 space-y-2 text-sm">
                {dashboard.caveats.map((caveat) => (
                  <li key={caveat}>• {caveat}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-violet-200">Readiness score</div>
            <div className="mt-2 text-4xl font-semibold text-violet-100">{dashboard.readinessPercent}%</div>
            <div className="mt-4 overflow-hidden rounded-full bg-background">
              <div className="h-3 bg-violet-400/80" style={{ width: `${dashboard.readinessPercent}%` }} />
            </div>
            <div className="mt-3 text-sm text-violet-100/80">Use this view to decide whether the period is still in prep, in reviewer hands, or ready to lock.</div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Critical blockers</div>
              <ul className="mt-3 space-y-2 text-sm text-text-muted">
                {dashboard.openBlockers.map((blocker) => (
                  <li key={blocker}>• {blocker}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Next actions</div>
              <ul className="mt-3 space-y-2 text-sm text-text-muted">
                {dashboard.nextActions.map((action) => (
                  <li key={action}>• {action}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface-mid p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Workflow status grid</div>
            <p className="mt-2 text-sm text-text-muted">Each lane below links to the underlying workspace so the close owner can work the bottleneck without leaving the command center.</p>
          </div>
          <Link href="/dashboard/accounting/pipeline" className="rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-100 transition hover:bg-violet-500/20">
            Open posting pipeline
          </Link>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {dashboard.areas.map((area) => (
            <article key={area.id} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-text-primary">{area.label}</div>
                  <div className="mt-1 text-sm text-text-muted">Owner: {area.owner}</div>
                </div>
                <AccountingStatusBadge label={area.status.replaceAll("_", " ")} tone={statusTone(area.status)} className="capitalize" />
              </div>

              <div className="mt-4 overflow-hidden rounded-full bg-background">
                <div className="h-2.5 bg-accent/80" style={{ width: progressWidth(area) }} />
              </div>

              <div className="mt-4 space-y-3 text-sm text-text-muted">
                <div>
                  <span className="text-text-primary">Completion:</span> {area.completionLabel}
                </div>
                <div>
                  <span className="text-text-primary">Readiness cue:</span> {area.readinessCue}
                </div>
                <div>
                  <span className="text-text-primary">Signoff:</span> {area.signoffLabel}
                </div>
                {area.blocker ? (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-3 text-amber-100">
                    Blocker: {area.blocker}
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-3 text-emerald-100">
                    No active blocker. This lane is in a good state for reviewer handoff.
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-xl border border-accent/20 bg-accent/5 px-3 py-3 text-sm text-text-primary">
                Next action: {area.nextAction}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={area.routeHref} className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-text-primary transition hover:bg-surface-mid">
                  Open workspace
                </Link>
                <button className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm text-blue-100">Request signoff</button>
                <button className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-text-muted">Add close note</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
