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
  const sentBundles = exportCenter.bundles.filter((bundle) => bundle.status === "sent").length;

  return (
    <AppShell
      title="CPA export center"
      description={
        exportCenter.source === "convex"
          ? "Bundle builder for CPA and controller handoff packets. Packet history and audit activity can come from Convex, while the builder stays explicit about which packet content is still demo-scaffolded."
          : "Bundle builder for CPA and controller handoff packets. This workspace is using demo-safe history and packet scaffolding, with no live delivery or file transfer happening from this page."
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Export bundles" value={String(exportCenter.bundles.length)} detail={`${readyBundles} ready for handoff`} />
        <MetricCard label="Checklist blockers" value={String(blockedChecklistItems)} detail={`${watchChecklistItems} items still on watch`} />
        <MetricCard label={exportCenter.source === "convex" ? "Persisted history" : "Demo history"} value={String(exportCenter.history.length)} detail={`${sentBundles} bundles already marked sent in the current packet lineup`} />
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
          <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-muted">
            Bundle templates: static demo packet definitions with configurable section mix and memo framing
          </div>
          <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-muted">
            Delivery behavior: this workspace records packet intent and history only; it does not send live files to recipients
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
