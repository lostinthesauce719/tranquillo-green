import { CpaExportCenter } from "@/components/accounting/cpa-export-center";
import { AppShell } from "@/components/shell/app-shell";
import { MetricCard } from "@/components/ui/metric-card";
import {
  demoAutomationAgents,
  demoExportBundles,
  demoGenerationHistory,
  demoPacketChecklist,
  summarizeExportCenter,
} from "@/lib/demo/accounting-handoff";

export default function ExportsPage() {
  const summary = summarizeExportCenter();

  return (
    <AppShell
      title="CPA export center"
      description="Bundle builder for CPA and controller handoff packets. This static workspace ties close posture, reconciliation detail, and 280E support into demo-backed export sets without touching live services."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Export bundles" value={String(summary.totalBundles)} detail={`${summary.readyBundles} ready for handoff`} />
        <MetricCard label="Checklist blockers" value={String(summary.blockedChecklistItems)} detail={`${summary.watchChecklistItems} items still on watch`} />
        <MetricCard label="Generation events" value={String(demoGenerationHistory.length)} detail="History preserved for packet refreshes and releases" />
        <MetricCard label="Workflow agents" value={String(summary.activeAgents)} detail="Static automation definitions attached to the handoff center" />
      </div>

      <div className="mt-6">
        <CpaExportCenter
          bundles={demoExportBundles}
          checklist={demoPacketChecklist}
          history={demoGenerationHistory}
          agents={demoAutomationAgents}
        />
      </div>
    </AppShell>
  );
}
