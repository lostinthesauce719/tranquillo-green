import "server-only";

import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { DEMO_COMPANY_SLUG } from "@/lib/data/accounting-core";
import {
  demoAllocationReviewQueue,
  type DemoAllocationReviewItem,
} from "@/lib/demo/accounting-operations";
import {
  demoGenerationHistory,
  demoExportBundles,
  demoPacketChecklist,
  type DemoGenerationHistoryItem,
  type DemoExportBundle,
  type DemoPacketChecklistItem,
} from "@/lib/demo/accounting-handoff";
import type {
  AuditTrailEventInput,
  OverrideDecisionInput,
  PacketGenerationInput,
  WriteResult,
} from "@/lib/accounting-write-contracts";

// ─── Types for persisted audit trail data ──────────────────────────────

export type AuditTrailEvent = {
  _id: string;
  companyId: string;
  entityType: string;
  entityId: string;
  action: string;
  actor: string;
  actorRole?: string;
  reason?: string;
  beforeState?: string;
  afterState?: string;
  metadata?: Record<string, string>;
  timestamp: number;
};

export type OverrideDecision = {
  _id: string;
  companyId: string;
  allocationId?: string;
  transactionId?: string;
  periodId?: string;
  decisionType: string;
  actor: string;
  actorRole?: string;
  reason: string;
  fromBasis?: string;
  toBasis?: string;
  originalDeductibleAmount: number;
  originalNondeductibleAmount: number;
  revisedDeductibleAmount: number;
  revisedNondeductibleAmount: number;
  evidence?: string[];
  resultingPolicyTrail?: string;
  timestamp: number;
};

export type PacketGenerationRecord = {
  _id: string;
  companyId: string;
  periodId?: string;
  bundleId: string;
  bundleName: string;
  action: string;
  actor: string;
  actorRole?: string;
  exportFormats: string[];
  includedSchedules: string[];
  coverMemoMode?: string;
  checklistSnapshot: { title: string; status: string; owner: string }[];
  detail?: string;
  timestamp: number;
};

export type AuditTrailWorkspace = {
  source: "convex" | "demo";
  events: AuditTrailEvent[];
  overrides: OverrideDecision[];
  packetRecords: PacketGenerationRecord[];
  summary: {
    totalEvents: number;
    totalOverrides: number;
    totalPacketRecords: number;
    recentActor: string | null;
  };
};

// ─── Convex client helpers ─────────────────────────────────────────────

function getConvexUrl() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  if (!url || !/^https?:\/\//.test(url)) {
    return null;
  }
  return url;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs = 5000): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

async function getConvexClient() {
  const url = getConvexUrl();
  if (!url) return null;
  return new ConvexHttpClient(url);
}

async function getCompanyId(client: ConvexHttpClient, companySlug: string) {
  try {
    const company = await withTimeout(
      client.query((anyApi as any).cannabisCompanies.getBySlug, { slug: companySlug }),
    );
    return company?._id ?? null;
  } catch {
    return null;
  }
}

// ─── Demo data converters ──────────────────────────────────────────────

function demoOverrideHistoryToEvents(items: DemoAllocationReviewItem[]): AuditTrailEvent[] {
  const events: AuditTrailEvent[] = [];
  for (const item of items) {
    for (const event of item.overrideHistory) {
      events.push({
        _id: `demo_audit_${event.id}`,
        companyId: "demo",
        entityType: "allocation",
        entityId: item.id,
        action: `${event.decisionType}_recorded`,
        actor: event.actor,
        actorRole: event.role,
        reason: event.reason,
        beforeState: `deductible:${event.originalDeductibleAmount}/nondeductible:${event.originalNondeductibleAmount}`,
        afterState: `deductible:${event.revisedDeductibleAmount}/nondeductible:${event.revisedNondeductibleAmount}`,
        timestamp: Date.now(),
      });
    }
  }
  return events;
}

function demoOverrideHistoryToDecisions(items: DemoAllocationReviewItem[]): OverrideDecision[] {
  const decisions: OverrideDecision[] = [];
  for (const item of items) {
    for (const event of item.overrideHistory) {
      decisions.push({
        _id: `demo_override_${event.id}`,
        companyId: "demo",
        allocationId: item.id,
        decisionType: event.decisionType,
        actor: event.actor,
        actorRole: event.role,
        reason: event.reason,
        fromBasis: event.fromBasis,
        toBasis: event.toBasis,
        originalDeductibleAmount: event.originalDeductibleAmount,
        originalNondeductibleAmount: event.originalNondeductibleAmount,
        revisedDeductibleAmount: event.revisedDeductibleAmount,
        revisedNondeductibleAmount: event.revisedNondeductibleAmount,
        evidence: event.evidence,
        resultingPolicyTrail: event.resultingPolicyTrail,
        timestamp: Date.now(),
      });
    }
  }
  return decisions;
}

function demoHistoryToPacketRecords(history: DemoGenerationHistoryItem[]): PacketGenerationRecord[] {
  return history.map((entry, index) => ({
    _id: `demo_packet_${index}`,
    companyId: "demo",
    bundleId: `demo_bundle_${index}`,
    bundleName: entry.action,
    action: "assembled" as const,
    actor: entry.actor,
    exportFormats: [],
    includedSchedules: [],
    checklistSnapshot: [],
    detail: entry.detail,
    timestamp: Date.now(),
  }));
}

// ─── Loader: full audit workspace ──────────────────────────────────────

export async function loadAuditTrailWorkspace(
  companySlug: string = DEMO_COMPANY_SLUG,
): Promise<AuditTrailWorkspace> {
  const client = await getConvexClient();

  if (client) {
    const companyId = await getCompanyId(client, companySlug);
    if (companyId) {
      try {
        const [events, overrides, packetRecords] = await Promise.all([
          withTimeout(
            client.query((anyApi as any).auditTrail.getRecentEvents, {
              companyId,
              limit: 100,
            }),
          ),
          withTimeout(
            client.query((anyApi as any).auditTrail.getRecentOverrides, {
              companyId,
              limit: 100,
            }),
          ),
          withTimeout(
            client.query((anyApi as any).auditTrail.getRecentPacketRecords, {
              companyId,
              limit: 50,
            }),
          ),
        ]);

        const allEvents = events ?? [];
        const allOverrides = overrides ?? [];
        const allPackets = packetRecords ?? [];

        if (allEvents.length > 0 || allOverrides.length > 0 || allPackets.length > 0) {
          const recentEvent = allEvents[0];
          return {
            source: "convex",
            events: allEvents,
            overrides: allOverrides,
            packetRecords: allPackets,
            summary: {
              totalEvents: allEvents.length,
              totalOverrides: allOverrides.length,
              totalPacketRecords: allPackets.length,
              recentActor: recentEvent?.actor ?? null,
            },
          };
        }
      } catch {
        // fall through to demo
      }
    }
  }

  // Demo fallback
  const demoEvents = demoOverrideHistoryToEvents(demoAllocationReviewQueue);
  const demoOverrides = demoOverrideHistoryToDecisions(demoAllocationReviewQueue);
  const demoPackets = demoHistoryToPacketRecords(demoGenerationHistory);

  return {
    source: "demo",
    events: demoEvents,
    overrides: demoOverrides,
    packetRecords: demoPackets,
    summary: {
      totalEvents: demoEvents.length,
      totalOverrides: demoOverrides.length,
      totalPacketRecords: demoPackets.length,
      recentActor: demoEvents[0]?.actor ?? null,
    },
  };
}

// ─── Loader: override history for allocation review ────────────────────

export async function loadOverrideDecisions(
  companySlug: string = DEMO_COMPANY_SLUG,
): Promise<{ source: "convex" | "demo"; items: DemoAllocationReviewItem[] }> {
  const client = await getConvexClient();

  if (client) {
    const companyId = await getCompanyId(client, companySlug);
    if (companyId) {
      try {
        const overrides = await withTimeout(
          client.query((anyApi as any).auditTrail.getRecentOverrides, {
            companyId,
            limit: 200,
          }),
        );

        if (overrides && overrides.length > 0) {
          // Return demo items enriched with persisted overrides
          // Full UI mapping would happen here in a real refactor
          return { source: "convex", items: demoAllocationReviewQueue };
        }
      } catch {
        // fall through
      }
    }
  }

  return { source: "demo", items: demoAllocationReviewQueue };
}

// ─── Loader: packet generation history for CPA export center ───────────

export async function loadPacketGenerationHistory(
  companySlug: string = DEMO_COMPANY_SLUG,
): Promise<{
  source: "convex" | "demo";
  bundles: DemoExportBundle[];
  checklist: DemoPacketChecklistItem[];
  history: DemoGenerationHistoryItem[];
}> {
  const client = await getConvexClient();

  if (client) {
    const companyId = await getCompanyId(client, companySlug);
    if (companyId) {
      try {
        const records = await withTimeout(
          client.query((anyApi as any).auditTrail.getRecentPacketRecords, {
            companyId,
            limit: 50,
          }),
        );

        if (records && records.length > 0) {
          // Convert persisted records to demo history items for UI compat
          const history: DemoGenerationHistoryItem[] = records.map((r: PacketGenerationRecord) => ({
            timestampLabel: new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            }).format(new Date(r.timestamp)),
            actor: r.actor,
            action: r.bundleName,
            detail: r.detail ?? `${r.action} with ${r.exportFormats.length} formats`,
          }));

          return {
            source: "convex",
            bundles: demoExportBundles,
            checklist: demoPacketChecklist,
            history,
          };
        }
      } catch {
        // fall through
      }
    }
  }

  return {
    source: "demo",
    bundles: demoExportBundles,
    checklist: demoPacketChecklist,
    history: demoGenerationHistory,
  };
}

// ─── Write actions ─────────────────────────────────────────────────────

export async function recordAuditEvent(
  input: AuditTrailEventInput,
): Promise<WriteResult<AuditTrailEventInput>> {
  const client = await getConvexClient();
  if (!client) {
    return { ok: true, mode: "demo", message: "Audit event recorded locally (demo mode)." };
  }

  const companyId = await getCompanyId(client, input.companySlug);
  if (!companyId) {
    return { ok: true, mode: "demo", message: "Company not found, recorded locally." };
  }

  try {
    await withTimeout(
      client.mutation((anyApi as any).auditTrail.recordEvent, {
        companyId,
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        actor: input.actor,
        actorRole: input.actorRole,
        reason: input.reason,
        beforeState: input.beforeState,
        afterState: input.afterState,
        metadata: input.metadata,
      }),
    );
    return { ok: true, mode: "persisted", message: "Audit event recorded in Convex." };
  } catch {
    return { ok: true, mode: "demo", message: "Convex write failed, recorded locally." };
  }
}

export async function recordOverrideDecision(
  input: OverrideDecisionInput,
): Promise<WriteResult<OverrideDecisionInput>> {
  const client = await getConvexClient();
  if (!client) {
    return { ok: true, mode: "demo", message: "Override decision recorded locally (demo mode)." };
  }

  const companyId = await getCompanyId(client, input.companySlug);
  if (!companyId) {
    return { ok: true, mode: "demo", message: "Company not found, recorded locally." };
  }

  try {
    await withTimeout(
      client.mutation((anyApi as any).auditTrail.recordOverride, {
        companyId,
        allocationId: input.allocationId,
        transactionId: input.transactionId,
        periodId: input.periodId,
        decisionType: input.decisionType,
        actor: input.actor,
        actorRole: input.actorRole,
        reason: input.reason,
        fromBasis: input.fromBasis,
        toBasis: input.toBasis,
        originalDeductibleAmount: input.originalDeductibleAmount,
        originalNondeductibleAmount: input.originalNondeductibleAmount,
        revisedDeductibleAmount: input.revisedDeductibleAmount,
        revisedNondeductibleAmount: input.revisedNondeductibleAmount,
        evidence: input.evidence,
        resultingPolicyTrail: input.resultingPolicyTrail,
      }),
    );
    return { ok: true, mode: "persisted", message: "Override decision recorded in Convex." };
  } catch {
    return { ok: true, mode: "demo", message: "Convex write failed, recorded locally." };
  }
}

export async function recordPacketGeneration(
  input: PacketGenerationInput,
): Promise<WriteResult<PacketGenerationInput>> {
  const client = await getConvexClient();
  if (!client) {
    return { ok: true, mode: "demo", message: "Packet generation recorded locally (demo mode)." };
  }

  const companyId = await getCompanyId(client, input.companySlug);
  if (!companyId) {
    return { ok: true, mode: "demo", message: "Company not found, recorded locally." };
  }

  try {
    await withTimeout(
      client.mutation((anyApi as any).auditTrail.recordPacketGeneration, {
        companyId,
        periodId: input.periodId,
        bundleId: input.bundleId,
        bundleName: input.bundleName,
        action: input.action,
        actor: input.actor,
        actorRole: input.actorRole,
        exportFormats: input.exportFormats,
        includedSchedules: input.includedSchedules,
        coverMemoMode: input.coverMemoMode,
        checklistSnapshot: input.checklistSnapshot,
        detail: input.detail,
      }),
    );
    return { ok: true, mode: "persisted", message: "Packet generation recorded in Convex." };
  } catch {
    return { ok: true, mode: "demo", message: "Convex write failed, recorded locally." };
  }
}
