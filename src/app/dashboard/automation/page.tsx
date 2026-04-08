import { GreenAutomationWorkspace } from "@/components/accounting/green-automation-workspace";
import { AppShell } from "@/components/shell/app-shell";
import { MetricCard } from "@/components/ui/metric-card";
import { demoAutomationAgents } from "@/lib/demo/accounting-handoff";
import Link from "next/link";

export default function AutomationPage() {
  const attentionCount = demoAutomationAgents.filter((agent) => agent.status === "attention").length;
  const watchCount = demoAutomationAgents.filter((agent) => agent.status === "watch").length;
  const healthyCount = demoAutomationAgents.filter((agent) => agent.status === "healthy").length;
  const totalReviewed = demoAutomationAgents.reduce((sum, a) => sum + a.itemsReviewed, 0);
  const totalExceptions = demoAutomationAgents.reduce((sum, a) => sum + a.exceptionsFound, 0);

  return (
    <AppShell
      title="Automation control surface"
      description="Reviewer-first automation agents for Green accounting operations. Each agent scans a specific accounting surface, produces recommendations, and stops — nothing is posted, delivered, or acted on without a human reviewer approving it."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Defined agents" value={String(demoAutomationAgents.length)} detail="All are design specs, not live jobs" />
        <MetricCard label="Healthy" value={String(healthyCount)} detail="Last run: all items passed review" />
        <MetricCard label="Watch" value={String(watchCount)} detail="Last run: items flagged for manual review" />
        <MetricCard label="Attention" value={String(attentionCount)} detail="Last run: open blockers need resolution" />
      </div>

      <div className="mt-6">
        <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <GreenAutomationWorkspace agents={demoAutomationAgents} />

          {/* Right rail: how to read + trust model */}
          <div className="space-y-4">
            <section className="rounded-2xl border border-border bg-surface-mid p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-accent">How to read this page</div>
              <div className="mt-4 space-y-3 text-sm text-text-muted">
                <div className="rounded-xl border border-border bg-surface px-4 py-3">
                  These agents are design specs, not running jobs. Status reflects the current demo storyline, not live execution health.
                </div>
                <div className="rounded-xl border border-border bg-surface px-4 py-3">
                  Each card clarifies the trigger conditions, review outputs, and guardrails that would matter if the workflow were promoted beyond demo mode.
                </div>
                <div className="rounded-xl border border-border bg-surface px-4 py-3">
                  &ldquo;Items reviewed&rdquo; and &ldquo;exceptions found&rdquo; come from the most recent run. &ldquo;Recent run history&rdquo; shows the last several runs as pass / flag / hold.
                </div>
                <div className="rounded-xl border border-border bg-surface px-4 py-3">
                  Use the linked workspaces below to see the operational surfaces the agents are describing.
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-surface-mid p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-accent">Automation trust model</div>
              <h3 className="mt-2 text-lg font-semibold">Think of these as a junior analyst, not a mysterious robot</h3>
              <div className="mt-4 space-y-3 text-sm text-text-muted">
                <div className="rounded-xl border border-border bg-surface px-4 py-3">
                  <span className="font-medium text-text-primary">What it does:</span> Reads through accounting data on a schedule, counts items, flags conditions that match predefined rules, and drafts structured recommendations.
                </div>
                <div className="rounded-xl border border-border bg-surface px-4 py-3">
                  <span className="font-medium text-text-primary">What it never does:</span> Post journal entries. Send emails. Move money. Change allocation outcomes. Approve close. Deliver packets to CPAs. Any of that requires a human click.
                </div>
                <div className="rounded-xl border border-border bg-surface px-4 py-3">
                  <span className="font-medium text-text-primary">How to trust it:</span> Check the run history row. Green dots mean &ldquo;nothing unusual.&rdquo; Amber means &ldquo;something needs your eye.&rdquo; Red means &ldquo;this is blocked until you act.&rdquo;
                </div>
                <div className="rounded-xl border border-border bg-surface px-4 py-3">
                  <span className="font-medium text-text-primary">Approval model:</span> Every agent has explicit approval rules showing who reviews and who can approve. No agent approves its own recommendations.
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-border bg-surface px-4 py-3 text-sm">
                <div className="text-xs uppercase tracking-[0.2em] text-text-muted">This period snapshot</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-text-muted">
                  <div>Total items reviewed: <span className="text-text-primary">{totalReviewed}</span></div>
                  <div>Exceptions raised: <span className="text-text-primary">{totalExceptions}</span></div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-surface-mid p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-accent">Workflow connections</div>
              <p className="mt-2 text-sm text-text-muted">
                These agents support specific accounting workflows. Open the workspace to see the data the agent would be reading.
              </p>
              <div className="mt-4 grid gap-3">
                <Link href="/dashboard/accounting/close" className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
                  <div className="font-medium">Month-end close</div>
                  <div className="mt-0.5 text-xs text-text-muted">Close blocker monitor reads this surface</div>
                </Link>
                <Link href="/dashboard/reconciliations" className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
                  <div className="font-medium">Cash reconciliation</div>
                  <div className="mt-0.5 text-xs text-text-muted">Reconciliation follow-up agent reads this surface</div>
                </Link>
                <Link href="/dashboard/allocations" className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
                  <div className="font-medium">Allocation review queue</div>
                  <div className="mt-0.5 text-xs text-text-muted">280E allocation monitor reads this surface</div>
                </Link>
                <Link href="/dashboard/exports" className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
                  <div className="font-medium">Export center</div>
                  <div className="mt-0.5 text-xs text-text-muted">All agents contribute to packet generation</div>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
