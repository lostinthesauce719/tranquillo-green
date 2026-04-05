import { demoCashReconciliations, demoAllocationReviewQueue, summarizeAllocationQueue, summarizeCashReconciliations } from "@/lib/demo/accounting-operations";
import { demoSupportScheduleReport } from "@/lib/demo/accounting-reports";
import {
  californiaOperatorDemo,
  demoReportingPeriods,
  demoTransactions,
  summarizeDemoReportingPeriods,
  summarizeDemoTransactions,
} from "@/lib/demo/accounting";
import { demoCloseWorkflows, demoImportDatasets } from "@/lib/demo/accounting-workflows";
import { getDemoTransactionDetail } from "@/lib/demo/transaction-workflows";

export type DemoPipelineStageId = "imported" | "needs_review" | "ready_to_post" | "posted";
export type DemoPipelinePriority = "critical" | "high" | "normal";
export type DemoPipelineCard = {
  id: string;
  stage: DemoPipelineStageId;
  title: string;
  reference: string;
  source: string;
  owner: string;
  reviewer: string;
  amount: number;
  periodLabel: string;
  location: string;
  ageLabel: string;
  blocker?: string;
  nextAction: string;
  linkHref: string;
  supportLabel: string;
  priority: DemoPipelinePriority;
};

export type DemoPipelineStage = {
  id: DemoPipelineStageId;
  label: string;
  description: string;
  actionLabel: string;
  tone: "blue" | "amber" | "violet" | "emerald";
  cards: DemoPipelineCard[];
  totalAmount: number;
  blockerCount: number;
};

export type DemoCloseAreaStatus = "on_track" | "watch" | "blocked" | "ready";
export type DemoCloseArea = {
  id: string;
  label: string;
  owner: string;
  routeHref: string;
  status: DemoCloseAreaStatus;
  completionLabel: string;
  readinessCue: string;
  blocker?: string;
  nextAction: string;
  signoffLabel: string;
};

export type DemoCloseDashboard = {
  periodLabel: string;
  controller: string;
  targetLockDate: string;
  readinessPercent: number;
  openBlockers: string[];
  nextActions: string[];
  areas: DemoCloseArea[];
};

const currencyTotal = (cards: DemoPipelineCard[]) => cards.reduce((sum, card) => sum + card.amount, 0);

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

function buildImportedCards(): DemoPipelineCard[] {
  return demoImportDatasets.flatMap((dataset) =>
    dataset.rows
      .filter((row) => row.status !== "ready")
      .map((row) => ({
        id: row.id,
        stage: "imported" as const,
        title: row.values.vendor_name || row.values.employee_group || row.values.bank_reference || row.values.batch_reference || "Imported row",
        reference: row.values.bank_reference || row.values.batch_reference || row.id,
        source: `${dataset.source} import`,
        owner: row.status === "error" ? "Import Analyst" : "Staff Accountant",
        reviewer: row.status === "error" ? "Accounting Ops Lead" : "Assistant Controller",
        amount: Math.abs(
          Number(row.values.signed_amount || row.values.debit_amount || row.values.credit_amount || 0),
        ),
        periodLabel: dataset.periodLabel,
        location: row.values.entity || "Richmond Manufacturing Hub",
        ageLabel: `Uploaded ${dataset.uploadedAt}`,
        blocker: row.validationIssues[0],
        nextAction: row.status === "error" ? "Repair mapping and re-stage import row" : "Collect support and promote into review queue",
        linkHref: "/dashboard/accounting/imports",
        supportLabel: `${row.validationIssues.length} validation issue${row.validationIssues.length === 1 ? "" : "s"}`,
        priority: row.status === "error" ? "critical" : "high",
      })),
  );
}

function buildTransactionCards(): DemoPipelineCard[] {
  return demoTransactions.map((transaction) => {
    const detail = getDemoTransactionDetail(transaction.id);
    const blocker = transaction.needsReceipt
      ? detail?.supportingDocs.gapNote || "Supporting document still missing"
      : detail?.approvalPath.find((step) => step.state === "current")?.detail;

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
      blocker,
      nextAction:
        stage === "posted"
          ? "Package with period support and retain audit trail"
          : detail?.reviewerActions[0]?.label || "Open detail workspace",
      linkHref: `/dashboard/accounting/transactions/${transaction.id}`,
      supportLabel: detail?.supportingDocs.received ? "Support package attached" : "Support package incomplete",
      priority:
        transaction.status === "posted"
          ? "normal"
          : transaction.needsReceipt || transaction.reviewState === "needs_mapping"
            ? "high"
            : transaction.reference.includes("PAY")
              ? "critical"
              : "normal",
    } satisfies DemoPipelineCard;
  });
}

export function buildDemoPipelineStages(): DemoPipelineStage[] {
  const importedCards = buildImportedCards();
  const transactionCards = buildTransactionCards();

  const stageCards: Record<DemoPipelineStageId, DemoPipelineCard[]> = {
    imported: importedCards,
    needs_review: transactionCards.filter((card) => card.stage === "needs_review"),
    ready_to_post: transactionCards.filter((card) => card.stage === "ready_to_post"),
    posted: transactionCards.filter((card) => card.stage === "posted"),
  };

  const stageMeta: Omit<DemoPipelineStage, "cards" | "totalAmount" | "blockerCount">[] = [
    {
      id: "imported",
      label: "Imported",
      description: "Freshly staged rows from bank and payroll imports that have not cleared validation or review handoff.",
      actionLabel: "Fix mapping + enrich support",
      tone: "blue",
    },
    {
      id: "needs_review",
      label: "Needs review",
      description: "Transactions that landed in the accounting queue but still need mapping, support, or reviewer judgment.",
      actionLabel: "Clear blockers",
      tone: "amber",
    },
    {
      id: "ready_to_post",
      label: "Ready to post",
      description: "Reviewer-complete work that can move with the month-end posting package once bundled dependencies are attached.",
      actionLabel: "Bundle and approve",
      tone: "violet",
    },
    {
      id: "posted",
      label: "Posted",
      description: "Completed items already released to the ledger and ready for binder retention.",
      actionLabel: "Archive support",
      tone: "emerald",
    },
  ];

  return stageMeta.map((stage) => ({
    ...stage,
    cards: stageCards[stage.id],
    totalAmount: currencyTotal(stageCards[stage.id]),
    blockerCount: stageCards[stage.id].filter((card) => Boolean(card.blocker)).length,
  }));
}

function closeAreaStatus(score: number, blocker?: string): DemoCloseAreaStatus {
  if (blocker) return score >= 0.8 ? "watch" : "blocked";
  if (score >= 0.95) return "ready";
  return score >= 0.7 ? "on_track" : "watch";
}

export function buildDemoCloseDashboard(): DemoCloseDashboard {
  const periodSummary = summarizeDemoReportingPeriods(demoReportingPeriods);
  const transactionSummary = summarizeDemoTransactions(demoTransactions);
  const recSummary = summarizeCashReconciliations(demoCashReconciliations);
  const allocationSummary = summarizeAllocationQueue(demoAllocationReviewQueue);
  const currentWorkflow = demoCloseWorkflows.find((workflow) => workflow.periodLabel === californiaOperatorDemo.reportingPeriod.label);
  const currentPeriod = demoReportingPeriods.find((period) => period.label === californiaOperatorDemo.reportingPeriod.label) ?? californiaOperatorDemo.reportingPeriod;

  const importReadyRows = demoImportDatasets.reduce((sum, dataset) => sum + dataset.rows.filter((row) => row.status === "ready").length, 0);
  const importRows = demoImportDatasets.reduce((sum, dataset) => sum + dataset.rows.length, 0);
  const importErrors = demoImportDatasets.reduce((sum, dataset) => sum + dataset.rows.filter((row) => row.status === "error").length, 0);
  const importWarnings = demoImportDatasets.reduce((sum, dataset) => sum + dataset.rows.filter((row) => row.status === "warning").length, 0);
  const supportNeeds = demoSupportScheduleReport.lineItems.filter((row) => row.reviewerStatus.toLowerCase().includes("need")).length;
  const supportPending = demoSupportScheduleReport.lineItems.filter((row) => row.reviewerStatus.toLowerCase().includes("pending")).length;

  const areas: DemoCloseArea[] = [
    {
      id: "period-checklist",
      label: "Reporting period checklist",
      owner: currentPeriod.closeOwner,
      routeHref: "/dashboard/accounting/periods",
      status: closeAreaStatus(currentPeriod.taskSummary.completed / currentPeriod.taskSummary.total, currentPeriod.blockers[0]),
      completionLabel: `${currentPeriod.taskSummary.completed}/${currentPeriod.taskSummary.total} checklist items complete`,
      readinessCue: `${periodSummary.review} period in review, ${periodSummary.blocked} with blockers`,
      blocker: currentPeriod.blockers[0],
      nextAction: currentWorkflow?.checklist.find((item) => item.status !== "done")?.title || "Finalize lock package",
      signoffLabel: `${currentWorkflow?.reviewStatus.replaceAll("_", " ") || currentPeriod.status} • reviewer ${currentWorkflow?.reviewer || "Controller"}`,
    },
    {
      id: "imports",
      label: "Imports readiness",
      owner: "Accounting Ops",
      routeHref: "/dashboard/accounting/imports",
      status: closeAreaStatus(importReadyRows / importRows, importErrors > 0 ? `${importErrors} import row errors still open` : undefined),
      completionLabel: `${importReadyRows}/${importRows} staged rows ready`,
      readinessCue: `${importWarnings} warning rows awaiting support follow-up`,
      blocker: importErrors > 0 ? `${importErrors} import row errors still open` : undefined,
      nextAction: importErrors > 0 ? "Repair missing required fields and suspense fallbacks" : "Promote reviewed imports into transaction queue",
      signoffLabel: `${demoImportDatasets.length} demo datasets loaded for ${currentPeriod.label}`,
    },
    {
      id: "transaction-posting",
      label: "Transaction review + posting",
      owner: "Assistant Controller",
      routeHref: "/dashboard/accounting/pipeline",
      status: closeAreaStatus((transactionSummary.ready + transactionSummary.posted) / transactionSummary.total, transactionSummary.needsMapping > 0 ? `${transactionSummary.needsMapping} transactions still need review` : undefined),
      completionLabel: `${transactionSummary.ready + transactionSummary.posted}/${transactionSummary.total} transactions cleared for posting or already posted`,
      readinessCue: `${transactionSummary.drafted} drafted journals and ${transactionSummary.manualQueue} manual-entry candidates`,
      blocker: transactionSummary.needsMapping > 0 ? `${transactionSummary.needsMapping} transactions still need review` : undefined,
      nextAction: "Use the pipeline board to move receipts, payroll splits, and bundled journals forward",
      signoffLabel: `${transactionSummary.posted} posted • ${transactionSummary.ready} ready to release`,
    },
    {
      id: "cash-recs",
      label: "Cash reconciliation",
      owner: "Staff Accountant",
      routeHref: "/dashboard/reconciliations",
      status: closeAreaStatus((recSummary.balanced + recSummary.readyToPost) / recSummary.total, recSummary.exception > 0 ? `${recSummary.exception} cash exception remains open` : undefined),
      completionLabel: `${recSummary.balanced + recSummary.readyToPost}/${recSummary.total} cash workspaces tied out or staged`,
      readinessCue: `${recSummary.investigating} investigations in progress`,
      blocker: recSummary.exception > 0 ? `${recSummary.exception} cash exception remains open` : undefined,
      nextAction: "Close armored clearing receipt gap and release bank rec package",
      signoffLabel: `${recSummary.readyToPost} ready for review • variance ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(recSummary.absoluteVariance)}`,
    },
    {
      id: "allocations",
      label: "280E allocation review",
      owner: "Cost Accountant",
      routeHref: "/dashboard/allocations",
      status: closeAreaStatus((allocationSummary.approved + allocationSummary.ready) / allocationSummary.total, allocationSummary.pendingController > 0 || allocationSummary.needsSupport > 0 ? `${allocationSummary.pendingController + allocationSummary.needsSupport} allocation items are not signed off` : undefined),
      completionLabel: `${allocationSummary.approved + allocationSummary.ready}/${allocationSummary.total} allocation items ready or approved`,
      readinessCue: `${allocationSummary.pendingController} controller escalations, ${allocationSummary.needsSupport} support holds`,
      blocker: allocationSummary.pendingController > 0 ? `${allocationSummary.pendingController} controller threshold review still open` : allocationSummary.needsSupport > 0 ? `${allocationSummary.needsSupport} items missing support` : undefined,
      nextAction: "Clear labor split sign-off and missing event SKU support",
      signoffLabel: `${allocationSummary.approved} approved • deductible ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(allocationSummary.deductible)}`,
    },
    {
      id: "support-schedule",
      label: "Support schedule completeness",
      owner: demoSupportScheduleReport.preparedBy,
      routeHref: "/dashboard/allocations/support-schedule",
      status: closeAreaStatus((demoSupportScheduleReport.lineItems.length - supportNeeds - supportPending) / demoSupportScheduleReport.lineItems.length, supportNeeds > 0 ? `${supportNeeds} schedule rows missing support` : undefined),
      completionLabel: `${demoSupportScheduleReport.lineItems.length - supportNeeds}/${demoSupportScheduleReport.lineItems.length} schedule rows have acceptable support packages`,
      readinessCue: `${supportPending} row pending controller, ${supportNeeds} row missing backup`,
      blocker: supportNeeds > 0 ? `${supportNeeds} schedule rows missing support` : undefined,
      nextAction: "Complete the support binder and attach controller memo for threshold exceptions",
      signoffLabel: `${demoSupportScheduleReport.title} prepared ${demoSupportScheduleReport.preparedAt}`,
    },
  ];

  const openBlockers = areas.flatMap((area) => (area.blocker ? [`${area.label}: ${area.blocker}`] : []));
  const nextActions = areas.filter((area) => area.status !== "ready").slice(0, 4).map((area) => `${area.label}: ${area.nextAction}`);
  const readinessPercent = Math.round(
    (areas.reduce((sum, area) => {
      switch (area.status) {
        case "ready":
          return sum + 1;
        case "on_track":
          return sum + 0.75;
        case "watch":
          return sum + 0.45;
        case "blocked":
          return sum + 0.2;
      }
    }, 0) /
      areas.length) * 100,
  );

  return {
    periodLabel: currentPeriod.label,
    controller: currentWorkflow?.approver || "Controller",
    targetLockDate: "Target lock May 7, 2026",
    readinessPercent,
    openBlockers,
    nextActions,
    areas,
  };
}
