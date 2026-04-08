import "server-only";

import { anyApi } from "convex/server";
import type { DemoCashReconciliationItem } from "@/lib/demo/accounting-operations";
import type { DemoReportingPeriod } from "@/lib/demo/accounting";
import type {
  ExportPacketMutation,
  ManualJournalSubmission,
  ReconciliationMutation,
  ReportingPeriodMutation,
  WriteResult,
} from "@/lib/accounting-write-contracts";
import type { DemoGenerationHistoryItem } from "@/lib/demo/accounting-handoff";
import { DEMO_COMPANY_SLUG, loadAccountingWorkspace } from "@/lib/data/accounting-core";
import { getAuthenticatedConvexClient, withTimeout } from "@/lib/data/convex-client";

async function getConvexContext(companySlug: string) {
  const client = await getAuthenticatedConvexClient();
  if (!client) {
    return null;
  }

  const [company, workspace] = await Promise.all([
    withTimeout(client.query((anyApi as any).cannabisCompanies.getBySlug, { slug: companySlug })),
    withTimeout(client.query((anyApi as any).accountingCore.getWorkspaceBySlug, { slug: companySlug })),
  ]);

  if (!company || !workspace) {
    return null;
  }

  return { client, company, workspace };
}

function dedupeStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function isoTimestampLabel() {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
}

function updateActionStatus(
  actions: DemoCashReconciliationItem["actions"],
  titleIncludes: string,
  status: DemoCashReconciliationItem["actions"][number]["status"],
) {
  return actions.map((action) =>
    action.title.toLowerCase().includes(titleIncludes.toLowerCase()) ? { ...action, status } : action,
  );
}

function applyReconciliationMutation(
  item: DemoCashReconciliationItem,
  mutation: ReconciliationMutation,
): DemoCashReconciliationItem {
  const next: DemoCashReconciliationItem = {
    ...item,
    sourceContext: [...item.sourceContext],
    investigationNotes: [...item.investigationNotes],
    nextSteps: [...item.nextSteps],
    actions: item.actions.map((action) => ({ ...action })),
  };

  if (mutation.action === "log_note") {
    next.investigationNotes = dedupeStrings([
      `Workspace note logged ${isoTimestampLabel()} from the server-backed reconciliation workspace.`,
      ...next.investigationNotes,
    ]);
    next.sourceContext = dedupeStrings([
      ...next.sourceContext,
      "Workspace note logging now prefers a persisted server-backed mutation and falls back safely when Convex is unavailable.",
    ]);
    next.actions = updateActionStatus(next.actions, "review variance", item.varianceAmount === 0 ? "done" : "in_progress");
    return next;
  }

  if (mutation.action === "toggle_case") {
    const caseIsOpen = item.status === "investigating" || item.status === "exception";
    next.status = caseIsOpen ? (item.varianceAmount === 0 ? "balanced" : "ready_to_post") : (item.varianceAmount === 0 ? "investigating" : "exception");
    next.sourceContext = dedupeStrings([
      ...next.sourceContext,
      caseIsOpen
        ? "Variance case closed from the connected reconciliation workspace."
        : "Variance case opened from the connected reconciliation workspace.",
    ]);
    next.investigationNotes = dedupeStrings([
      caseIsOpen
        ? `Variance case closed ${isoTimestampLabel()} after workspace review.`
        : `Variance case opened ${isoTimestampLabel()} for follow-up and supporting evidence review.`,
      ...next.investigationNotes,
    ]);
    next.nextSteps = caseIsOpen
      ? dedupeStrings(next.nextSteps.filter((step) => !step.toLowerCase().includes("investigation case")))
      : dedupeStrings([
          "Complete investigation case support and attach reviewer note before releasing for close review.",
          ...next.nextSteps,
        ]);
    next.actions = updateActionStatus(next.actions, "review variance", caseIsOpen ? (item.varianceAmount === 0 ? "done" : "todo") : "in_progress");
    return next;
  }

  const alreadyQueued = item.status === "ready_to_post";
  next.status = alreadyQueued ? (item.varianceAmount === 0 ? "balanced" : "investigating") : "ready_to_post";
  next.sourceContext = dedupeStrings([
    ...next.sourceContext,
    alreadyQueued
      ? "Review queue flag removed from the connected reconciliation workspace."
      : "Review queue flag set from the connected reconciliation workspace.",
  ]);
  next.investigationNotes = dedupeStrings([
    alreadyQueued
      ? `Removed from review queue ${isoTimestampLabel()} to continue investigation work.`
      : `Queued for controller review ${isoTimestampLabel()} from the reconciliation workspace.`,
    ...next.investigationNotes,
  ]);
  next.actions = updateActionStatus(next.actions, "review variance", alreadyQueued ? (item.varianceAmount === 0 ? "done" : "in_progress") : "done");
  next.actions = updateActionStatus(next.actions, "controller sign-off", alreadyQueued ? "todo" : "in_progress");
  if (!next.actions.some((action) => action.title.toLowerCase().includes("controller sign-off"))) {
    next.actions.push({
      title: "Controller sign-off",
      owner: item.owner,
      status: alreadyQueued ? "todo" : "in_progress",
    });
  }
  return next;
}

function toPersistenceStatus(item: DemoCashReconciliationItem) {
  return {
    status: item.status === "balanced" || item.status === "ready_to_post" ? "resolved" : item.status === "exception" ? "investigating" : "open",
    workflowStatus: item.status,
  } as const;
}

async function logAccountingAuditEvent(
  convex: Awaited<ReturnType<typeof getConvexContext>>,
  payload: {
    periodId?: string;
    reconciliationId?: string;
    exportPacketRunId?: string;
    category: "reporting_period" | "reconciliation" | "export_packet" | "allocation_override";
    entityId: string;
    entityLabel: string;
    action: string;
    detail: string;
    actor: string;
  },
) {
  if (!convex) {
    return;
  }

  await withTimeout(
    convex.client.mutation((anyApi as any).accountingAudit.createEvent, {
      companyId: convex.company._id,
      periodId: payload.periodId as any,
      reconciliationId: payload.reconciliationId as any,
      exportPacketRunId: payload.exportPacketRunId as any,
      category: payload.category,
      entityId: payload.entityId,
      entityLabel: payload.entityLabel,
      action: payload.action,
      detail: payload.detail,
      actor: payload.actor,
      source: "server_action",
    }),
  );
}

export async function submitManualJournal(
  payload: ManualJournalSubmission,
): Promise<WriteResult<{ reference: string }>> {
  try {
    const convex = await getConvexContext(payload.companySlug || DEMO_COMPANY_SLUG);
    if (!convex) {
      return {
        ok: true,
        mode: "demo",
        message: `Saved demo-safe manual journal ${payload.reference}. Convex is not configured, so the draft remains browser-local only.`,
        item: { reference: payload.reference },
      };
    }

    const period = convex.workspace.reportingPeriods.find((entry: any) => entry.label === payload.periodLabel);
    if (!period) {
      throw new Error(`Reporting period ${payload.periodLabel} was not found.`);
    }
    const accountIdsByCode = new Map(convex.workspace.chartOfAccounts.map((account: any) => [account.code, account._id]));
    const lines = payload.lines.map((line, index) => {
      const accountId = accountIdsByCode.get(line.accountCode);
      if (!accountId) {
        throw new Error(`Account code ${line.accountCode} on line ${index + 1} was not found.`);
      }
      return {
        accountId,
        debit: line.direction === "debit" ? line.amount : undefined,
        credit: line.direction === "credit" ? line.amount : undefined,
        memo: line.memo,
      };
    });

    await withTimeout(
      convex.client.mutation((anyApi as any).transactions.createManualJournal, {
        companyId: convex.company._id,
        periodId: period._id,
        transactionDate: payload.entryDate,
        reference: payload.reference,
        memo: payload.description,
        externalRef: `manual:${payload.reference}`,
        lines,
      }),
    );

    return {
      ok: true,
      mode: "persisted",
      message: `Manual journal ${payload.reference} was persisted through the server-backed accounting path.`,
      item: { reference: payload.reference },
    };
  } catch (error) {
    return {
      ok: true,
      mode: "demo",
      message: error instanceof Error
        ? `Persisted manual journal path was unavailable (${error.message}). Draft stayed in the demo-safe local flow.`
        : "Persisted manual journal path was unavailable. Draft stayed in the demo-safe local flow.",
      item: { reference: payload.reference },
    };
  }
}

export async function persistReportingPeriodState(
  payload: ReportingPeriodMutation,
): Promise<WriteResult<DemoReportingPeriod>> {
  const demoWorkspace = await loadAccountingWorkspace();
  const demoItem = demoWorkspace.reportingPeriods.find((period) => period.label === payload.periodLabel);

  try {
    const convex = await getConvexContext(payload.companySlug || DEMO_COMPANY_SLUG);
    if (!convex) {
      return {
        ok: true,
        mode: "demo",
        message: `Updated ${payload.periodLabel} in demo mode only. Convex is not configured for persisted period workflow changes.`,
        item: demoItem ? { ...demoItem, ...payload } : undefined,
      };
    }

    const period = convex.workspace.reportingPeriods.find((entry: any) => entry.label === payload.periodLabel);
    if (!period) {
      throw new Error(`Reporting period ${payload.periodLabel} was not found.`);
    }

    await withTimeout(
      convex.client.mutation((anyApi as any).reportingPeriods.updateWorkflowState, {
        periodId: period._id,
        status: payload.status,
        taskSummary: payload.taskSummary,
        blockers: payload.blockers,
        lockedAt: payload.lockedAt,
        highlights: payload.highlights,
      }),
    );

    await logAccountingAuditEvent(convex, {
      periodId: period._id,
      category: "reporting_period",
      entityId: payload.periodLabel,
      entityLabel: payload.periodLabel,
      action: payload.status === "closed" ? "Locked reporting period" : payload.status === "review" ? "Updated reporting period review state" : "Reopened reporting period",
      detail: `${payload.taskSummary.completed}/${payload.taskSummary.total} checklist items complete with ${payload.blockers.length} blocker${payload.blockers.length === 1 ? "" : "s"}.`,
      actor: "Close workspace",
    });

    return {
      ok: true,
      mode: "persisted",
      message: `Reporting period ${payload.periodLabel} was updated through the persisted server-backed workflow path.`,
      item: demoItem ? { ...demoItem, ...payload } : undefined,
    };
  } catch (error) {
    return {
      ok: true,
      mode: "demo",
      message: error instanceof Error
        ? `Persisted reporting-period update was unavailable (${error.message}). Local close workflow changes remain demo-safe.`
        : "Persisted reporting-period update was unavailable. Local close workflow changes remain demo-safe.",
      item: demoItem ? { ...demoItem, ...payload } : undefined,
    };
  }
}

export async function mutateReconciliationState(
  payload: ReconciliationMutation,
): Promise<WriteResult<DemoCashReconciliationItem>> {
  const workspace = await loadAccountingWorkspace();
  const currentItem = workspace.cashReconciliations.find((item) => item.id === payload.reconciliationId);
  if (!currentItem) {
    throw new Error(`Reconciliation ${payload.reconciliationId} was not found.`);
  }

  const nextItem = applyReconciliationMutation(currentItem, payload);

  try {
    const convex = await getConvexContext(payload.companySlug || DEMO_COMPANY_SLUG);
    if (!convex) {
      return {
        ok: true,
        mode: "demo",
        message: `Updated reconciliation ${payload.reconciliationId} in demo mode only. Convex is not configured for persisted reconciliation actions.`,
        item: nextItem,
      };
    }

    const reconciliation = convex.workspace.cashReconciliations.find((entry: any) => {
      const candidateId = entry.publicId ?? entry.externalRef ?? entry._id;
      return candidateId === payload.reconciliationId;
    });
    if (!reconciliation) {
      throw new Error(`Reconciliation ${payload.reconciliationId} was not found in persisted data.`);
    }

    const persistenceStatus = toPersistenceStatus(nextItem);
    await withTimeout(
      convex.client.mutation((anyApi as any).cashReconciliations.updateWorkflowState, {
        reconciliationId: reconciliation._id,
        status: persistenceStatus.status,
        workflowStatus: persistenceStatus.workflowStatus,
        sourceContext: nextItem.sourceContext,
        investigationNotes: nextItem.investigationNotes,
        nextSteps: nextItem.nextSteps,
        actions: nextItem.actions,
      }),
    );

    await logAccountingAuditEvent(convex, {
      reconciliationId: reconciliation._id,
      category: "reconciliation",
      entityId: payload.reconciliationId,
      entityLabel: nextItem.accountName,
      action: payload.action === "log_note" ? "Logged reconciliation note" : payload.action === "toggle_case" ? "Updated reconciliation case" : "Updated reconciliation review queue",
      detail: `${nextItem.status.replaceAll("_", " ")} for ${nextItem.periodLabel} with variance ${nextItem.varianceAmount.toFixed(2)}.`,
      actor: nextItem.owner,
    });

    return {
      ok: true,
      mode: "persisted",
      message: `Reconciliation ${payload.reconciliationId} was updated through the persisted server-backed workflow path.`,
      item: nextItem,
    };
  } catch (error) {
    return {
      ok: true,
      mode: "demo",
      message: error instanceof Error
        ? `Persisted reconciliation action was unavailable (${error.message}). Demo-safe local reconciliation state was updated instead.`
        : "Persisted reconciliation action was unavailable. Demo-safe local reconciliation state was updated instead.",
      item: nextItem,
    };
  }
}

function buildExportHistoryItem(args: {
  actor: string;
  action: string;
  detail: string;
  timestamp: number;
}): DemoGenerationHistoryItem {
  return {
    timestampLabel: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(args.timestamp)),
    actor: args.actor,
    action: args.action,
    detail: args.detail,
  };
}

export async function persistExportPacketRun(
  payload: ExportPacketMutation,
): Promise<WriteResult<DemoGenerationHistoryItem>> {
  const fallbackItem = buildExportHistoryItem({
    actor: payload.owner,
    action: payload.status === "held" ? "Held export packet" : "Generated bundle",
    detail: payload.detail,
    timestamp: Date.now(),
  });

  try {
    const convex = await getConvexContext(payload.companySlug || DEMO_COMPANY_SLUG);
    if (!convex) {
      return {
        ok: true,
        mode: "demo",
        message: `Saved demo packet history for ${payload.bundleName}. Convex is not configured, so the generation event remains local only.`,
        item: fallbackItem,
      };
    }

    const period = convex.workspace.reportingPeriods.find((entry: any) => entry.label === payload.periodLabel);
    const run = await withTimeout(
      convex.client.mutation((anyApi as any).exportPackets.createRun, {
        companyId: convex.company._id,
        periodId: period?._id,
        bundleId: payload.bundleId,
        bundleName: payload.bundleName,
        periodLabel: payload.periodLabel,
        recipient: payload.recipient,
        owner: payload.owner,
        status: payload.status,
        selectedFormats: payload.selectedFormats,
        selectedSchedules: payload.selectedSchedules,
        selectedChecklistTitles: payload.selectedChecklistTitles,
        coverMemoMode: payload.coverMemoMode,
        includeDeliveryNotes: payload.includeDeliveryNotes,
        generatedBy: payload.owner,
        detail: payload.detail,
        blockers: payload.blockers,
      }),
    );

    return {
      ok: true,
      mode: "persisted",
      message: `Export packet run for ${payload.bundleName} was persisted to Convex history.`,
      item: buildExportHistoryItem({
        actor: run.generatedBy,
        action: run.status === "held" ? "Held export packet" : "Generated bundle",
        detail: run.detail,
        timestamp: run.generatedAt,
      }),
    };
  } catch (error) {
    return {
      ok: true,
      mode: "demo",
      message: error instanceof Error
        ? `Persisted export packet history was unavailable (${error.message}). Local demo history was updated instead.`
        : "Persisted export packet history was unavailable. Local demo history was updated instead.",
      item: fallbackItem,
    };
  }
}
