import { GreenAutomationWorkspace } from "@/components/accounting/green-automation-workspace";
import { AppShell } from "@/components/shell/app-shell";
import { MetricCard } from "@/components/ui/metric-card";
import { demoAutomationAgents } from "@/lib/demo/accounting-handoff";

export default function AutomationPage() {
  const attentionCount = demoAutomationAgents.filter((agent) => agent.status === "attention").length;
  const watchCount = demoAutomationAgents.filter((agent) => agent.status === "watch").length;
  const healthyCount = demoAutomationAgents.filter((agent) => agent.status === "healthy").length;

  return (
    <AppShell
      title="Automation control surface"
      description="Lightweight static workflow definitions for Green accounting operations. These cards describe what an agent would monitor without introducing real jobs, polling, or backend dependencies."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Defined agents" value={String(demoAutomationAgents.length)} detail="Static definitions only" />
        <MetricCard label="Healthy" value={String(healthyCount)} detail="No current workflow attention required" />
        <MetricCard label="Watch" value={String(watchCount)} detail="Definitions surfacing notable review conditions" />
        <MetricCard label="Attention" value={String(attentionCount)} detail="Example workflow with close-impacting blocker logic" />
      </div>

      <div className="mt-6">
        <GreenAutomationWorkspace agents={demoAutomationAgents} />
      </div>
    </AppShell>
  );
}
