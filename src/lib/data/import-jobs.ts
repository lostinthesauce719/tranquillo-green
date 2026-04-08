import "server-only";

import { anyApi } from "convex/server";
import type { DemoPipelineCard, DemoPipelineStage, DemoPipelineStageId } from "@/lib/demo/accounting-close";
import { buildDemoPipelineStages } from "@/lib/demo/accounting-close";
import type { DemoImportDataset, DemoImportRow } from "@/lib/demo/accounting-workflows";
import { demoImportDatasets } from "@/lib/demo/accounting-workflows";
import type { DemoTransaction } from "@/lib/demo/accounting";
import { DEMO_COMPANY_SLUG, loadAccountingWorkspace } from "@/lib/data/accounting-core";
import type { ImportWorkspace, ImportWorkspaceDataset, ImportWorkspaceRow } from "@/lib/import-job-types";
import { getAuthenticatedConvexClient, withTimeout } from "@/lib/data/convex-client";

function rowAmount(row: DemoImportRow | ImportWorkspaceRow) {
  return Math.abs(Number(row.values.signed_amount || row.values.debit_amount || row.values.credit_amount || 0));
}

function mapDemoDataset(dataset: DemoImportDataset): ImportWorkspaceDataset {
  return {
    ...dataset,
    backendMode: "demo",
    persistedStatus: "validated",
    persistedStatusReason: "Demo dataset ships prevalidated so operators can review mapping and promotion behavior without writing to Convex.",
    promotedRowCount: 0,
    promotionReadyCount: dataset.rows.filter((row) => row.status !== "error").length,
    blockedRowCount: dataset.rows.filter((row) => row.status === "error").length,
    appliedProfileId: dataset.profiles[0]?.id ?? "",
    profilePersistence: "demo_only",
    selectedProfileName: dataset.profiles[0]?.name,
    sourceFileSizeBytes: undefined,
    sourceContentType: "text/csv",
    sourceChecksum: undefined,
    uploadedBy: "Demo workspace",
    rows: dataset.rows,
  };
}

function pipelinePriority(transaction: DemoTransaction): DemoPipelineCard["priority"] {
  if (transaction.status === "posted") {
    return "normal";
  }
  if (transaction.needsReceipt || transaction.reviewState === "needs_mapping") {
    return "high";
  }
  if (transaction.reference.includes("PAY")) {
    return "critical";
  }
  return "normal";
}

function transactionOwner(reference: string) {
  if (reference.includes("POS-BATCH")) return "Revenue Accountant";
  if (reference.includes("PAY")) return "Cost Accountant";
  if (reference.includes("JE-DRAFT")) return "Controller";
  if (reference.includes("XFER")) return "Inventory Accountant";
  if (reference.includes("SVB")) return "Staff Accountant";
  return "Accounting Ops";
}

function transactionReviewer(reference: string) {
  if (reference.includes("PAY")) return "Controller";
  if (reference.includes("POS-BATCH")) return "Assistant Controller";
  if (reference.includes("JE-DRAFT")) return "Assistant Controller";
  return "Assistant Controller";
}

function transactionAgeLabel(date: string) {
  const start = Date.parse(date);
  const end = Date.parse("2026-05-01");
  const diffDays = Number.isNaN(start) ? 0 : Math.max(1, Math.round((end - start) / 86_400_000));
  return `${diffDays}d in queue`;
}

function buildImportedCards(datasets: ImportWorkspaceDataset[]): DemoPipelineCard[] {
  return datasets.flatMap((dataset) =>
    dataset.rows
      .filter((row) => !row.promotedTransactionId)
      .map((row) => ({
        id: row.id,
        stage: "imported" as const,
        title: row.values.vendor_name || row.values.employee_group || row.values.bank_reference || row.values.batch_reference || "Imported row",
        reference: row.values.bank_reference || row.values.batch_reference || row.id,
        source: `${dataset.source} import`,
        owner: row.status === "error" ? "Import Analyst" : "Staff Accountant",
        reviewer: row.status === "error" ? "Accounting Ops Lead" : "Assistant Controller",
        amount: rowAmount(row),
        periodLabel: dataset.periodLabel,
        location: row.values.entity || row.values.location || "Richmond Manufacturing Hub",
        ageLabel: dataset.backendMode === "persisted" ? `${dataset.persistedStatus.replaceAll("_", " ")} job` : `Uploaded ${dataset.uploadedAt}`,
        blocker: row.validationIssues[0],
        nextAction:
          row.status === "error"
            ? "Repair mapping and re-stage import row"
            : dataset.backendMode === "persisted"
              ? "Promote eligible rows into transactions"
              : "Collect support and promote into review queue",
        linkHref: "/dashboard/accounting/imports",
        supportLabel: `${row.validationIssues.length} validation issue${row.validationIssues.length === 1 ? "" : "s"}`,
        priority: row.status === "error" ? "critical" : row.validationIssues.length > 0 ? "high" : "normal",
      })),
  );
}

function buildTransactionCards(transactions: DemoTransaction[]): DemoPipelineCard[] {
  return transactions.map((transaction) => {
    const stage: DemoPipelineStageId =
      transaction.status === "posted"
        ? "posted"
        : transaction.status === "ready_to_post"
          ? "ready_to_post"
          : "needs_review";

    return {
      id: transaction.id,
      stage,
      title: transaction.payee,
      reference: transaction.reference,
      source: transaction.source,
      owner: transactionOwner(transaction.reference),
      reviewer: transactionReviewer(transaction.reference),
      amount: transaction.amount,
      periodLabel: transaction.periodLabel,
      location: transaction.location,
      ageLabel: transactionAgeLabel(transaction.date),
      blocker: transaction.needsReceipt ? "Supporting document still missing" : transaction.reviewState === "needs_mapping" ? transaction.journalHint : undefined,
      nextAction:
        stage === "posted"
          ? "Package with period support and retain audit trail"
          : stage === "ready_to_post"
            ? "Bundle and approve the posting package"
            : "Open detail workspace and clear remaining blockers",
      linkHref: `/dashboard/accounting/transactions/${transaction.id}`,
      supportLabel: transaction.needsReceipt ? "Support package incomplete" : "Support package attached",
      priority: pipelinePriority(transaction),
    };
  });
}

function toStage(id: DemoPipelineStageId, cards: DemoPipelineCard[]): DemoPipelineStage {
  const meta: Record<DemoPipelineStageId, Omit<DemoPipelineStage, "cards" | "totalAmount" | "blockerCount">> = {
    imported: {
      id: "imported",
      label: "Imported",
      description: "Freshly staged rows that still need validation repair or promotion into the transaction queue.",
      actionLabel: "Fix mapping + promote",
      tone: "blue",
    },
    needs_review: {
      id: "needs_review",
      label: "Needs review",
      description: "Transactions that were promoted from imports or drafted manually and still need accounting judgment.",
      actionLabel: "Clear blockers",
      tone: "amber",
    },
    ready_to_post: {
      id: "ready_to_post",
      label: "Ready to post",
      description: "Transactions with mapping complete and ready for final posting approval.",
      actionLabel: "Bundle and approve",
      tone: "violet",
    },
    posted: {
      id: "posted",
      label: "Posted",
      description: "Completed transactions already released to the ledger and ready for binder retention.",
      actionLabel: "Archive support",
      tone: "emerald",
    },
  };

  return {
    ...meta[id],
    cards,
    totalAmount: cards.reduce((sum, card) => sum + card.amount, 0),
    blockerCount: cards.filter((card) => Boolean(card.blocker)).length,
  };
}

function buildPipelineStages(datasets: ImportWorkspaceDataset[], transactions: DemoTransaction[]) {
  const importedCards = buildImportedCards(datasets);
  const transactionCards = buildTransactionCards(transactions);

  return [
    toStage("imported", importedCards),
    toStage(
      "needs_review",
      transactionCards.filter((card) => card.stage === "needs_review"),
    ),
    toStage(
      "ready_to_post",
      transactionCards.filter((card) => card.stage === "ready_to_post"),
    ),
    toStage(
      "posted",
      transactionCards.filter((card) => card.stage === "posted"),
    ),
  ];
}

function formatTimestamp(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 16).replace("T", " ");
}

function persistedStatusReason(job: any) {
  if (job.status === "uploaded") {
    return job.notes || "Import file was captured, but required mappings still need review before validation can complete.";
  }
  if (job.status === "mapped") {
    return job.notes || "Mapping profile is saved, but one or more rows still have blocking validation issues.";
  }
  if (job.status === "validated") {
    return "Mappings and row validation are complete. Eligible rows can be promoted into the transaction review queue.";
  }
  if (job.status === "partially_promoted") {
    return "At least one row has already been promoted, but additional eligible or blocked rows still remain on the import job.";
  }
  if (job.status === "promoted") {
    return "All eligible rows were promoted into persisted transactions.";
  }
  return job.notes || "Import job needs operator attention before it can advance.";
}

function profilePersistence(job: any): ImportWorkspaceDataset["profilePersistence"] {
  const hasPersistedProfile = Boolean(job.importMappingProfileId);
  const selectedMappings = JSON.stringify(job.profile?.fieldMappings ?? {});
  const effectiveMappings = JSON.stringify(job.effectiveMappings ?? {});
  if (!hasPersistedProfile) {
    return "snapshot_only";
  }
  if (selectedMappings !== effectiveMappings) {
    return "saved_with_overrides";
  }
  return "saved";
}

async function loadConvexImportWorkspace(slug: string): Promise<ImportWorkspace | null> {
  const client = await getAuthenticatedConvexClient();
  if (!client) {
    return null;
  }

  const [importsResult, accountingWorkspace] = await Promise.all([
    withTimeout(client.query((anyApi as any).importJobs.getWorkspaceBySlug, { slug })),
    loadAccountingWorkspace(slug),
  ]);

  if (!importsResult) {
    return null;
  }

  const datasets: ImportWorkspaceDataset[] = importsResult.jobs.map((job: any) => ({
    id: job.publicId,
    jobId: job._id,
    backendMode: "persisted",
    persistedStatus: job.status,
    persistedStatusReason: persistedStatusReason(job),
    promotedRowCount: job.promotedRowCount ?? 0,
    promotionReadyCount: job.rows.filter((row: any) => row.status !== "error" && !row.promotedTransactionId).length,
    blockedRowCount: job.rows.filter((row: any) => row.status === "error").length,
    appliedProfileId: job.profile?.id ?? "",
    profilePersistence: profilePersistence(job),
    selectedProfileName: job.profile?.name,
    fileName: job.sourceFileName,
    source: job.sourceSystem,
    periodLabel: job.periodLabel ?? accountingWorkspace.reportingPeriods[0]?.label ?? "Current period",
    uploadedAt: formatTimestamp(job.uploadedAt),
    delimiter: job.sourceDelimiter,
    sourceFileSizeBytes: job.sourceFileSizeBytes,
    sourceContentType: job.sourceContentType,
    sourceChecksum: job.sourceChecksum,
    uploadedBy: job.uploadedBy,
    columns: job.columns,
    profiles: job.availableProfiles,
    rows: job.rows.map((row: any) => ({
      id: row.rowKey,
      values: row.rawValues,
      sourceAccountName: row.sourceAccountName,
      suggestedDebitAccountCode: row.suggestedDebitAccountCode,
      suggestedCreditAccountCode: row.suggestedCreditAccountCode,
      confidence: row.confidence,
      status: row.status,
      validationIssues: row.validationIssues,
      promotedTransactionId: row.promotedTransactionPublicId,
      promotedAt: row.promotedAt ? formatTimestamp(row.promotedAt) : undefined,
    })),
  }));

  return {
    source: "convex",
    sourceLabel: "Persisted Convex import workspace",
    sourceDetail: "Import jobs, mapping profiles, validation results, and promotion state are loading from Convex for this company.",
    datasets,
    pipelineStages: buildPipelineStages(datasets, accountingWorkspace.transactions),
  };
}

export async function loadImportWorkspace(slug = DEMO_COMPANY_SLUG): Promise<ImportWorkspace> {
  try {
    return (
      (await loadConvexImportWorkspace(slug)) ?? {
        source: "demo",
        sourceLabel: "Demo fallback import workspace",
        sourceDetail: "This runtime could not reach the persisted import-job backend, so the workspace is rendering seeded demo datasets only.",
        fallbackReason: "No authenticated Convex client was available for import workspace queries.",
        datasets: demoImportDatasets.map(mapDemoDataset),
        pipelineStages: buildDemoPipelineStages(),
      }
    );
  } catch {
    return {
      source: "demo",
      sourceLabel: "Demo fallback import workspace",
      sourceDetail: "This runtime could not reach the persisted import-job backend, so the workspace is rendering seeded demo datasets only.",
      fallbackReason: "Import workspace query failed and was downgraded to demo data.",
      datasets: demoImportDatasets.map(mapDemoDataset),
      pipelineStages: buildDemoPipelineStages(),
    };
  }
}
