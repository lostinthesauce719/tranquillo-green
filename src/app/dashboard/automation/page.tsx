import { GreenAutomationWorkspace } from "@/components/accounting/green-automation-workspace";
import { AppShell } from "@/components/shell/app-shell";
import { MetricCard } from "@/components/ui/metric-card";
import { loadAutomationWorkspace } from "@/lib/data/automation";

export default async function AutomationPage() {
  const workspace = await loadAutomationWorkspace();

  const attentionCount = workspace.agents.filter(
    (agent) => agent.status === "attention",
  ).length;
  const watchCount = workspace.agents.filter(
    (agent) => agent.status === "watch",
  ).length;
  const healthyCount = workspace.agents.filter(
    (agent) => agent.status === "healthy",
  ).length;

  const sourceLabel =
    workspace.source === "convex" ? "Live Convex data" : "Static demo definitions";

  return (
    <AppShell
      title="Automation control surface"
      description={
        workspace.source === "convex"
          ? "Live automation agents scanning Convex data. Run agents manually to produce real compliance alerts."
          : "Lightweight static workflow definitions for Green accounting operations. Connect Convex to enable live scanning and alert generation."
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Defined agents"
          value={String(workspace.agents.length)}
          detail={sourceLabel}
        />
        <MetricCard
          label="Healthy"
          value={String(healthyCount)}
          detail="No current workflow attention required"
        />
        <MetricCard
          label="Watch"
          value={String(watchCount)}
          detail="Definitions surfacing notable review conditions"
        />
        <MetricCard
          label="Attention"
          value={String(attentionCount)}
          detail="Example workflow with close-impacting blocker logic"
        />
      </div>

      {workspace.alertSummary.totalUnresolvedAlerts > 0 && (
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Unresolved alerts"
            value={String(workspace.alertSummary.totalUnresolvedAlerts)}
            detail="Across all agent categories"
          />
          <MetricCard
            label="Allocation alerts"
            value={String(workspace.alertSummary.allocationAlerts)}
            detail="280E allocation review queue"
          />
          <MetricCard
            label="Reconciliation alerts"
            value={String(workspace.alertSummary.reconciliationAlerts)}
            detail="Close blockers and variance follow-ups"
          />
        </div>
      )}

      <div className="mt-6">
        <GreenAutomationWorkspace agents={workspace.agents} />
      </div>
    </AppShell>
  );
}
