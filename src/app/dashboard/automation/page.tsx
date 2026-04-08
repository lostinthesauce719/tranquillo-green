import { GreenAutomationWorkspace } from "@/components/accounting/green-automation-workspace";
import { AppShell } from "@/components/shell/app-shell";
import { MetricCard } from "@/components/ui/metric-card";
import { demoAutomationAgents } from "@/lib/demo/accounting-handoff";
import Link from "next/link";

export default function AutomationPage() {
  const attentionCount = demoAutomationAgents.filter((agent) => agent.status === "attention").length;
  const watchCount = demoAutomationAgents.filter((agent) => agent.status === "watch").length;
  const healthyCount = demoAutomationAgents.filter((agent) => agent.status === "healthy").length;

  return (
    <AppShell
      title="Automation control surface"
      description="Static workflow definitions for Green accounting operations. This page explains what each agent would watch, what it would produce for a reviewer, and what remains intentionally non-automated in the demo."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Defined agents" value={String(demoAutomationAgents.length)} detail="Static definitions only" />
        <MetricCard label="Healthy" value={String(healthyCount)} detail="No current workflow attention required" />
        <MetricCard label="Watch" value={String(watchCount)} detail="Definitions surfacing notable review conditions" />
        <MetricCard label="Attention" value={String(attentionCount)} detail="Example workflow with close-impacting blocker logic" />
      </div>

      <div className="mt-6">
        <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <GreenAutomationWorkspace agents={demoAutomationAgents} />
          <section className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">How to read this page</div>
            <div className="mt-4 space-y-3 text-sm text-text-muted">
              <div className="rounded-xl border border-border bg-surface px-4 py-3">These agents are design specs, not running jobs. Status reflects the current demo storyline, not live execution health.</div>
              <div className="rounded-xl border border-border bg-surface px-4 py-3">Each card clarifies the trigger conditions, review outputs, and guardrails that would matter if the workflow were promoted beyond demo mode.</div>
              <div className="rounded-xl border border-border bg-surface px-4 py-3">Use the linked workspaces below to see the operational surfaces the agents are describing.</div>
            </div>
            <div className="mt-4 grid gap-3">
              <Link href="/dashboard/accounting/close" className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
                Open month-end close
              </Link>
              <Link href="/dashboard/exports" className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
                Open export center
              </Link>
              <Link href="/dashboard/reconciliations" className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
                Open reconciliation workspace
              </Link>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
