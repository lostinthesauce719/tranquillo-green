import { CpaExportCenter } from "@/components/accounting/cpa-export-center";
import { AppShell } from "@/components/shell/app-shell";
import { MetricCard } from "@/components/ui/metric-card";
import { demoAutomationAgents, summarizeExportCenter } from "@/lib/demo/accounting-handoff";
import { getFeaturedCashReconciliationHref } from "@/lib/demo/accounting-operations";
import { loadPacketGenerationHistory } from "@/lib/data/audit-trail";

export default async function ExportsPage() {
  const { source, bundles, checklist, history } = await loadPacketGenerationHistory();
  const summary = summarizeExportCenter();
  const featuredReconciliationHref = getFeaturedCashReconciliationHref();

  return (
    <AppShell
      title="CPA export center"
      description={`Bundle builder for CPA and controller handoff packets. Source: ${source}.`}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Export bundles" value={String(summary.totalBundles)} detail={`${summary.readyBundles} ready for handoff`} />
        <MetricCard label="Checklist blockers" value={String(summary.blockedChecklistItems)} detail={`${summary.watchChecklistItems} items still on watch`} />
        <MetricCard label="Generation events" value={String(history.length)} detail="History preserved for packet refreshes and releases" />
        <MetricCard label="Workflow agents" value={String(summary.activeAgents)} detail="Static automation definitions attached to the handoff center" />
      </div>

      <div className="mt-6">
        <CpaExportCenter
          bundles={bundles}
          checklist={checklist}
          history={history}
          agents={demoAutomationAgents}
          featuredReconciliationHref={featuredReconciliationHref}
        />
      </div>
    </AppShell>
  );
}
