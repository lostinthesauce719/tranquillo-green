import { CpaExportCenter } from "@/components/accounting/cpa-export-center";
import { AppShell } from "@/components/shell/app-shell";
import { LiveMetricCard } from "@/components/ui/live-metric-card";
import { StaggerContainer } from "@/components/ui/stagger-container";
import { PulseDot } from "@/components/ui/pulse-dot";
import { demoAutomationAgents, summarizeExportCenter } from "@/lib/demo/accounting-handoff";
import { getFeaturedCashReconciliationHref } from "@/lib/demo/accounting-operations";
import { loadPacketGenerationHistory } from "@/lib/data/audit-trail";

export default async function ExportsPage() {
  const { source, bundles, checklist, history } = await loadPacketGenerationHistory();
  const summary = summarizeExportCenter();
  const featuredReconciliationHref = getFeaturedCashReconciliationHref();

  const buildingBundles = bundles.filter((b) => b.status === "building");

  return (
    <AppShell
      title="CPA export center"
      description={`Bundle builder for CPA and controller handoff packets. Source: ${source}.`}
    >
      <StaggerContainer className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <LiveMetricCard label="Export bundles" value={summary.totalBundles} detail={`${summary.readyBundles} ready for handoff`} />
        <LiveMetricCard label="Checklist blockers" value={summary.blockedChecklistItems} detail={`${summary.watchChecklistItems} items still on watch`} dotColor={summary.blockedChecklistItems > 0 ? "red" : undefined} />
        <LiveMetricCard label="Generation events" value={history.length} detail="History preserved for packet refreshes and releases" />
        <LiveMetricCard label="Workflow agents" value={summary.activeAgents} detail="Static automation definitions attached to the handoff center" dotColor="blue" />
      </StaggerContainer>

      {buildingBundles.length > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-5 py-3 text-sm text-blue-200">
          <PulseDot color="blue" size="sm" />
          {buildingBundles.length} bundle{buildingBundles.length > 1 ? "s" : ""} currently building
        </div>
      )}

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
