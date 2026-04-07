import { CpaExportCenter } from "@/components/accounting/cpa-export-center";
import { AppShell } from "@/components/shell/app-shell";
import { MetricCard } from "@/components/ui/metric-card";
import { getFeaturedCashReconciliationHref } from "@/lib/demo/accounting-operations";
import { loadExportCenterData } from "@/lib/data/accounting-handoff";
import { DEMO_COMPANY_SLUG } from "@/lib/data/accounting-core";

export default async function ExportsPage() {
  const exportCenter = await loadExportCenterData();
  const featuredReconciliationHref = getFeaturedCashReconciliationHref();
  const readyBundles = exportCenter.bundles.filter((bundle) => bundle.status === "ready").length;
  const blockedChecklistItems = exportCenter.checklist.filter((item) => item.status === "missing").length;
  const watchChecklistItems = exportCenter.checklist.filter((item) => item.status === "watch").length;

  return (
    <AppShell
      title="CPA export center"
      description={
        exportCenter.source === "convex"
          ? "Bundle builder for CPA and controller handoff packets. Persisted Convex packet history and audit activity are now surfaced when available while packet templates remain demo-safe."
          : "Bundle builder for CPA and controller handoff packets. This workspace is running on the demo-safe fallback path because persisted Convex packet history is unavailable in this runtime."
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Export bundles" value={String(exportCenter.bundles.length)} detail={`${readyBundles} ready for handoff`} />
        <MetricCard label="Checklist blockers" value={String(blockedChecklistItems)} detail={`${watchChecklistItems} items still on watch`} />
        <MetricCard label={exportCenter.source === "convex" ? "Persisted history" : "Demo history"} value={String(exportCenter.history.length)} detail="Packet refreshes and releases preserved in the export timeline" />
        <MetricCard label="Workflow agents" value={String(exportCenter.agents.length)} detail="Static automation definitions attached to the handoff center" />
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface-mid p-5">
        <div className="text-xs uppercase tracking-[0.2em] text-accent">{exportCenter.source === "convex" ? "Persisted Convex source" : "Demo fallback source"}</div>
        <p className="mt-3 text-sm text-text-muted">{exportCenter.sourceSummary}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-muted">
            Generation timeline source: {exportCenter.source === "convex" ? "persisted export packet runs" : "demo handoff history"}
          </div>
          <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-muted">
            Audit trail events loaded: {exportCenter.auditTrail.length}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <CpaExportCenter
          companySlug={DEMO_COMPANY_SLUG}
          historySource={exportCenter.source}
          bundles={exportCenter.bundles}
          checklist={exportCenter.checklist}
          history={exportCenter.history}
          auditTrail={exportCenter.auditTrail}
          agents={exportCenter.agents}
          featuredReconciliationHref={featuredReconciliationHref}
        />
      </div>
    </AppShell>
  );
}
