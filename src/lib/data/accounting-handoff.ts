import "server-only";

import { anyApi } from "convex/server";
import {
  demoAutomationAgents,
  demoExportBundles,
  demoGenerationHistory,
  demoPacketChecklist,
  demoExportManifest,
  demoQuestionQueue,
  demoOverrideRollup,
  demoPeriodState,
  demoMemoPreviews,
  type DemoAutomationAgent,
  type DemoExportBundle,
  type DemoGenerationHistoryItem,
  type DemoPacketChecklistItem,
  type DemoManifestItem,
  type DemoQuestionQueueItem,
  type DemoOverrideRollupEntry,
  type DemoPeriodState,
  type DemoMemoPreview,
} from "@/lib/demo/accounting-handoff";
import { DEMO_COMPANY_SLUG } from "@/lib/data/accounting-core";
import { getAuthenticatedConvexClient, withTimeout } from "@/lib/data/convex-client";

export type ExportCenterData = {
  source: "demo" | "convex";
  sourceSummary: string;
  bundles: DemoExportBundle[];
  checklist: DemoPacketChecklistItem[];
  history: DemoGenerationHistoryItem[];
  agents: DemoAutomationAgent[];
  auditTrail: DemoGenerationHistoryItem[];
  manifest: DemoManifestItem[];
  questionQueue: DemoQuestionQueueItem[];
  overrideRollup: DemoOverrideRollupEntry[];
  periodState: DemoPeriodState;
  memoPreviews: DemoMemoPreview[];
};

function formatTimestamp(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function toHistoryItem(run: any): DemoGenerationHistoryItem {
  return {
    timestampLabel: formatTimestamp(run.generatedAt),
    actor: run.generatedBy,
    action: run.status === "held" ? "Held export packet" : "Generated bundle",
    detail: run.detail,
  };
}

function toAuditHistoryItem(event: any): DemoGenerationHistoryItem {
  return {
    timestampLabel: formatTimestamp(event.occurredAt),
    actor: event.actor,
    action: event.action,
    detail: `${event.entityLabel}: ${event.detail}`,
  };
}

function buildDemoExportCenterData(): ExportCenterData {
  return {
    source: "demo",
    sourceSummary: "Export center is running on the demo-safe fallback path because persisted Convex packet history is unavailable in this runtime.",
    bundles: demoExportBundles,
    checklist: demoPacketChecklist,
    history: demoGenerationHistory,
    agents: demoAutomationAgents,
    auditTrail: [],
    manifest: demoExportManifest,
    questionQueue: demoQuestionQueue,
    overrideRollup: demoOverrideRollup,
    periodState: demoPeriodState,
    memoPreviews: demoMemoPreviews,
  };
}

export async function loadExportCenterData(slug = DEMO_COMPANY_SLUG): Promise<ExportCenterData> {
  try {
    const client = await getAuthenticatedConvexClient();
    if (!client) {
      return buildDemoExportCenterData();
    }

    const company = await withTimeout(client.query((anyApi as any).cannabisCompanies.getBySlug, { slug }));
    if (!company) {
      return buildDemoExportCenterData();
    }

    const [runs, auditEvents] = await Promise.all([
      withTimeout(client.query((anyApi as any).exportPackets.listRecentByCompany, { companyId: company._id, limit: 12 })),
      withTimeout(client.query((anyApi as any).accountingAudit.listRecentByCompany, { companyId: company._id, limit: 12 })),
    ]);

    return {
      source: "convex",
      sourceSummary:
        runs.length > 0
          ? "Export center is showing persisted packet generation history and accounting audit activity from Convex, while bundle templates and checklist scaffolding remain demo-backed."
          : "Convex is connected, but no persisted packet generation history exists yet. Bundle templates and checklist scaffolding remain demo-backed until the first packet run is saved.",
      bundles: demoExportBundles,
      checklist: demoPacketChecklist,
      history: runs.length > 0 ? runs.map(toHistoryItem) : demoGenerationHistory,
      agents: demoAutomationAgents,
      auditTrail: auditEvents.map(toAuditHistoryItem),
      manifest: demoExportManifest,
      questionQueue: demoQuestionQueue,
      overrideRollup: demoOverrideRollup,
      periodState: demoPeriodState,
      memoPreviews: demoMemoPreviews,
    };
  } catch {
    return buildDemoExportCenterData();
  }
}
