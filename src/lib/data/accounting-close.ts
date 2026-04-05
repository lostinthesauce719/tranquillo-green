import "server-only";

import { summarizeDemoReportingPeriods, summarizeDemoTransactions, type DemoReportingPeriod, type DemoTransaction } from "@/lib/demo/accounting";
import {
  buildDemoCloseDashboard,
  type DemoCloseArea,
  type DemoCloseAreaStatus,
  type DemoCloseDashboard,
} from "@/lib/demo/accounting-close";
import {
  demoAllocationReviewQueue,
  summarizeAllocationQueue,
  summarizeCashReconciliations,
} from "@/lib/demo/accounting-operations";
import { demoSupportScheduleReport } from "@/lib/demo/accounting-reports";
import { loadAccountingWorkspace, type AccountingWorkspace, DEMO_COMPANY_SLUG } from "@/lib/data/accounting-core";
import { loadImportWorkspace } from "@/lib/data/import-jobs";
import type { ImportWorkspace, ImportWorkspaceDataset } from "@/lib/import-job-types";

export type MonthEndCloseDashboardData = DemoCloseDashboard & {
  source: "demo" | "mixed" | "convex";
  sourceSummary: string;
  computedAreas: string[];
  fallbackAreas: string[];
  caveats: string[];
};

function closeAreaStatus(score: number, blocker?: string): DemoCloseAreaStatus {
  if (blocker) return score >= 0.8 ? "watch" : "blocked";
  if (score >= 0.95) return "ready";
  return score >= 0.7 ? "on_track" : "watch";
}

function ratio(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return 0;
  }
  return numerator / denominator;
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatTargetLockDate(period: DemoReportingPeriod) {
  const end = Date.parse(period.endDate);
  if (Number.isNaN(end)) {
    return `Target lock ${period.closeWindowDays} days after period end`;
  }

  const lockDate = new Date(end + period.closeWindowDays * 86_400_000);
  return `Target lock ${formatDate(lockDate)}`;
}

function scoreReadiness(areas: DemoCloseArea[]) {
  return clampPercent(
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
      Math.max(areas.length, 1)) * 100,
  );
}

function pickCurrentPeriod(periods: DemoReportingPeriod[]) {
  const sorted = [...periods].sort((a, b) => Date.parse(b.endDate) - Date.parse(a.endDate));
  return sorted.find((period) => period.status !== "closed") ?? sorted[0];
}

function filterCurrentPeriodTransactions(transactions: DemoTransaction[], currentPeriodLabel: string) {
  return transactions.filter((transaction) => transaction.periodLabel === currentPeriodLabel);
}

function filterCurrentPeriodDatasets(datasets: ImportWorkspaceDataset[], currentPeriodLabel: string) {
  return datasets.filter((dataset) => dataset.periodLabel === currentPeriodLabel);
}

function buildPeriodChecklistArea(currentPeriod: DemoReportingPeriod, allPeriods: DemoReportingPeriod[]): DemoCloseArea {
  const periodSummary = summarizeDemoReportingPeriods(allPeriods);
  const completed = currentPeriod.taskSummary.completed;
  const total = Math.max(currentPeriod.taskSummary.total, 1);
  const blocker = currentPeriod.blockers[0];

  return {
    id: "period-checklist",
    label: "Reporting period checklist",
    owner: currentPeriod.closeOwner,
    routeHref: "/dashboard/accounting/periods",
    status: closeAreaStatus(ratio(completed, total), blocker),
    completionLabel: `${completed}/${total} checklist items complete`,
    readinessCue: `${periodSummary.review} period in review, ${periodSummary.blocked} with blockers`,
    blocker,
    nextAction: blocker ? "Clear period blocker and finish close checklist" : currentPeriod.status === "closed" ? "Period already locked" : "Finalize lock checklist and controller approval",
    signoffLabel: `${currentPeriod.status} • owner ${currentPeriod.closeOwner}`,
  };
}

function buildImportsArea(datasets: ImportWorkspaceDataset[], fallback: DemoCloseArea): DemoCloseArea {
  if (datasets.length === 0) {
    return {
      ...fallback,
      completionLabel: "0 persisted jobs linked to current period",
      readinessCue: "No import job activity surfaced from the connected backend for this period",
      blocker: "No persisted import jobs found for current period",
      nextAction: "Stage and validate the current-period import jobs",
      signoffLabel: "0 jobs loaded from persisted import workspace",
      status: "blocked",
    };
  }

  const totalRows = datasets.reduce((sum, dataset) => sum + dataset.rows.length, 0);
  const promotedRows = datasets.reduce((sum, dataset) => sum + dataset.promotedRowCount, 0);
  const readyRows = datasets.reduce((sum, dataset) => sum + dataset.promotionReadyCount, 0);
  const blockedRows = datasets.reduce((sum, dataset) => sum + dataset.blockedRowCount, 0);
  const failedJobs = datasets.filter((dataset) => dataset.persistedStatus === "failed").length;
  const blocker =
    failedJobs > 0
      ? `${failedJobs} import job${failedJobs === 1 ? "" : "s"} failed`
      : blockedRows > 0
        ? `${blockedRows} import row${blockedRows === 1 ? "" : "s"} still blocked`
        : undefined;

  return {
    id: "imports",
    label: "Imports readiness",
    owner: "Accounting Ops",
    routeHref: "/dashboard/accounting/imports",
    status: closeAreaStatus(ratio(promotedRows + readyRows, totalRows), blocker),
    completionLabel: `${promotedRows + readyRows}/${totalRows} rows promoted or promotion-ready`,
    readinessCue: `${blockedRows} blocked rows across ${datasets.length} persisted import job${datasets.length === 1 ? "" : "s"}`,
    blocker,
    nextAction: blocker ? "Repair blocked rows and rerun promotion" : "Promote validated rows into the transaction queue",
    signoffLabel: `${promotedRows} promoted • ${readyRows} still ready to promote`,
  };
}

function buildTransactionArea(transactions: DemoTransaction[], fallback: DemoCloseArea): DemoCloseArea {
  if (transactions.length === 0) {
    return {
      ...fallback,
      completionLabel: "0 transactions linked to current period",
      readinessCue: "No persisted transaction workflow found for this period yet",
      blocker: "No persisted transactions found for current period",
      nextAction: "Promote imports or draft the missing period transactions",
      signoffLabel: "0 posted • 0 ready to release",
      status: "blocked",
    };
  }

  const summary = summarizeDemoTransactions(transactions);
  const missingSupport = transactions.filter((transaction) => transaction.needsReceipt).length;
  const blocker =
    summary.needsMapping > 0
      ? `${summary.needsMapping} transactions still need review`
      : missingSupport > 0
        ? `${missingSupport} transactions still missing support`
        : undefined;

  return {
    id: "transaction-posting",
    label: "Transaction review + posting",
    owner: "Assistant Controller",
    routeHref: "/dashboard/accounting/pipeline",
    status: closeAreaStatus(ratio(summary.ready + summary.posted, summary.total), blocker),
    completionLabel: `${summary.ready + summary.posted}/${summary.total} transactions cleared for posting or already posted`,
    readinessCue: `${summary.drafted} drafted journals, ${summary.manualQueue} manual-entry candidates, ${missingSupport} missing support`,
    blocker,
    nextAction: blocker ? "Clear review holds and support gaps from the posting queue" : "Bundle the posting package for final release",
    signoffLabel: `${summary.posted} posted • ${summary.ready} ready to release`,
  };
}

function buildCashRecArea(workspace: AccountingWorkspace, currentPeriodLabel: string, fallback: DemoCloseArea): DemoCloseArea {
  const reconciliations = workspace.cashReconciliations.filter((item) => item.periodLabel === currentPeriodLabel);
  if (reconciliations.length === 0) {
    return {
      ...fallback,
      completionLabel: "0 reconciliations linked to current period",
      readinessCue: "No persisted cash reconciliation workspaces surfaced for this period",
      blocker: "No persisted cash reconciliations found for current period",
      nextAction: "Create or sync the current-period reconciliation workspaces",
      signoffLabel: "0 ready for review • variance $0",
      status: "blocked",
    };
  }

  const summary = summarizeCashReconciliations(reconciliations);
  const blocker =
    summary.exception > 0
      ? `${summary.exception} cash exception${summary.exception === 1 ? "" : "s"} remain open`
      : summary.investigating > 0
        ? `${summary.investigating} reconciliation${summary.investigating === 1 ? "" : "s"} still investigating`
        : undefined;

  return {
    id: "cash-recs",
    label: "Cash reconciliation",
    owner: "Staff Accountant",
    routeHref: "/dashboard/reconciliations",
    status: closeAreaStatus(ratio(summary.balanced + summary.readyToPost, summary.total), blocker),
    completionLabel: `${summary.balanced + summary.readyToPost}/${summary.total} cash workspaces tied out or ready to post`,
    readinessCue: `${summary.investigating} investigations in progress`,
    blocker,
    nextAction: blocker ? "Resolve remaining reconciliation variance and investigation items" : "Release the bank and cash rec package",
    signoffLabel: `${summary.readyToPost} ready for review • variance ${formatCurrency(summary.absoluteVariance)}`,
  };
}

function buildAllocationArea(fallback: DemoCloseArea): DemoCloseArea {
  const allocationSummary = summarizeAllocationQueue(demoAllocationReviewQueue);
  return {
    ...fallback,
    completionLabel: `${allocationSummary.approved + allocationSummary.ready}/${allocationSummary.total} allocation items ready or approved`,
    readinessCue: `${allocationSummary.pendingController} controller escalations, ${allocationSummary.needsSupport} support holds`,
    blocker:
      allocationSummary.pendingController > 0
        ? `${allocationSummary.pendingController} controller threshold review still open`
        : allocationSummary.needsSupport > 0
          ? `${allocationSummary.needsSupport} items missing support`
          : undefined,
    nextAction: "Clear labor split sign-off and missing event SKU support",
    signoffLabel: `${allocationSummary.approved} approved • deductible ${formatCurrency(allocationSummary.deductible)}`,
  };
}

function buildSupportScheduleArea(transactions: DemoTransaction[], fallback: DemoCloseArea): DemoCloseArea {
  const fallbackNeedsSupport = demoSupportScheduleReport.lineItems.filter((row) => row.reviewerStatus.toLowerCase().includes("need")).length;
  const fallbackPending = demoSupportScheduleReport.lineItems.filter((row) => row.reviewerStatus.toLowerCase().includes("pending")).length;
  if (transactions.length === 0) {
    return {
      ...fallback,
      completionLabel: `${demoSupportScheduleReport.lineItems.length - fallbackNeedsSupport}/${demoSupportScheduleReport.lineItems.length} schedule rows have acceptable support packages`,
      readinessCue: `${fallbackPending} row pending controller, ${fallbackNeedsSupport} row missing backup`,
      blocker: fallbackNeedsSupport > 0 ? `${fallbackNeedsSupport} schedule rows missing support` : undefined,
      nextAction: "Complete the support binder and attach controller memo for threshold exceptions",
      signoffLabel: `${demoSupportScheduleReport.title} prepared ${demoSupportScheduleReport.preparedAt}`,
    };
  }

  const total = transactions.length;
  const attached = transactions.filter((transaction) => !transaction.needsReceipt).length;
  const missingSupport = total - attached;
  const pendingReview = transactions.filter((transaction) => transaction.reviewState !== "posted" && transaction.reviewState !== "ready").length;

  return {
    id: "support-schedule",
    label: "Support schedule completeness",
    owner: fallback.owner,
    routeHref: fallback.routeHref,
    status: closeAreaStatus(ratio(attached, total), missingSupport > 0 ? `${missingSupport} transactions still missing support` : undefined),
    completionLabel: `${attached}/${total} current-period transactions have support attached`,
    readinessCue: `${pendingReview} transactions still in review and not binder-ready`,
    blocker: missingSupport > 0 ? `${missingSupport} transactions still missing support` : undefined,
    nextAction: missingSupport > 0 ? "Attach remaining transaction support before final binder assembly" : "Assemble export packet and controller memo set",
    signoffLabel: `${attached} support-complete transactions in the current-period packet`,
  };
}

function mergeDashboardData(args: {
  fallback: DemoCloseDashboard;
  accountingWorkspace: AccountingWorkspace;
  importWorkspace: ImportWorkspace;
}): MonthEndCloseDashboardData {
  const { fallback, accountingWorkspace, importWorkspace } = args;
  const fallbackAreasById = new Map(fallback.areas.map((area) => [area.id, area]));
  const currentPeriod = accountingWorkspace.source === "convex" ? pickCurrentPeriod(accountingWorkspace.reportingPeriods) ?? null : null;

  if (accountingWorkspace.source === "convex" && !currentPeriod) {
    return {
      ...fallback,
      source: "demo",
      sourceSummary: "Convex workspace did not return any reporting periods, so the close dashboard stayed on demo fallback.",
      computedAreas: [],
      fallbackAreas: fallback.areas.map((area) => area.label),
      caveats: ["No persisted reporting period data was available, so the month-end close dashboard is fully demo-backed."],
    };
  }

  const effectivePeriod = accountingWorkspace.source === "convex" && currentPeriod ? currentPeriod : null;
  const currentPeriodTransactions = effectivePeriod ? filterCurrentPeriodTransactions(accountingWorkspace.transactions, effectivePeriod.label) : [];
  const currentPeriodDatasets = effectivePeriod ? filterCurrentPeriodDatasets(importWorkspace.datasets, effectivePeriod.label) : [];

  const areas: DemoCloseArea[] = [
    accountingWorkspace.source === "convex" && effectivePeriod
      ? buildPeriodChecklistArea(effectivePeriod, accountingWorkspace.reportingPeriods)
      : fallbackAreasById.get("period-checklist")!,
    importWorkspace.source === "convex"
      ? buildImportsArea(currentPeriodDatasets, fallbackAreasById.get("imports")!)
      : fallbackAreasById.get("imports")!,
    accountingWorkspace.source === "convex" && effectivePeriod
      ? buildTransactionArea(currentPeriodTransactions, fallbackAreasById.get("transaction-posting")!)
      : fallbackAreasById.get("transaction-posting")!,
    accountingWorkspace.source === "convex" && effectivePeriod
      ? buildCashRecArea(accountingWorkspace, effectivePeriod.label, fallbackAreasById.get("cash-recs")!)
      : fallbackAreasById.get("cash-recs")!,
    buildAllocationArea(fallbackAreasById.get("allocations")!),
    accountingWorkspace.source === "convex" && currentPeriodTransactions.length > 0
      ? buildSupportScheduleArea(currentPeriodTransactions, fallbackAreasById.get("support-schedule")!)
      : fallbackAreasById.get("support-schedule")!,
  ];

  const openBlockers = areas.flatMap((area) => (area.blocker ? [`${area.label}: ${area.blocker}`] : []));
  const nextActions = areas.filter((area) => area.status !== "ready").slice(0, 4).map((area) => `${area.label}: ${area.nextAction}`);

  const computedAreas = [
    accountingWorkspace.source === "convex" && effectivePeriod ? "Reporting period checklist" : "",
    importWorkspace.source === "convex" ? "Imports readiness" : "",
    accountingWorkspace.source === "convex" && effectivePeriod ? "Transaction review + posting" : "",
    accountingWorkspace.source === "convex" && effectivePeriod ? "Cash reconciliation" : "",
    accountingWorkspace.source === "convex" && currentPeriodTransactions.length > 0 ? "Support schedule completeness" : "",
  ].filter(Boolean);
  const fallbackAreas = areas.map((area) => area.label).filter((label) => !computedAreas.includes(label));
  const source = computedAreas.length === areas.length ? "convex" : "mixed";
  const caveats = [
    accountingWorkspace.source === "convex"
      ? "Reporting periods, transactions, cash reconciliations, and support completeness use live Convex-backed accounting data when available."
      : "Accounting-core data was unavailable, so period, posting, reconciliation, and support status stayed on demo fallback.",
    importWorkspace.source === "convex"
      ? "Import readiness uses live persisted import jobs and row promotion state."
      : "Import readiness stayed on demo fallback because persisted import jobs were unavailable during render.",
    "280E allocation review still falls back to the static demo queue because no persisted allocation-review backend exists yet.",
  ];
  if (accountingWorkspace.source === "convex" && currentPeriodTransactions.length > 0) {
    caveats.push("Support schedule completeness is computed from current-period transaction support state until a dedicated persisted support-schedule/export model exists.");
  } else {
    caveats.push("Support schedule completeness falls back to the demo workpaper unless current-period persisted transaction support state is available.");
  }

  return {
    periodLabel: effectivePeriod?.label ?? fallback.periodLabel,
    controller: effectivePeriod?.closeOwner ?? fallback.controller,
    targetLockDate: effectivePeriod ? formatTargetLockDate(effectivePeriod) : fallback.targetLockDate,
    readinessPercent: scoreReadiness(areas),
    openBlockers,
    nextActions,
    areas,
    source,
    sourceSummary:
      source === "convex"
        ? "Close readiness is fully computed from live Convex workflow state for this period."
        : "Close readiness is computed from live Convex workflow state where persisted data exists, with targeted demo fallbacks for unsupported or unavailable workflows.",
    computedAreas,
    fallbackAreas,
    caveats,
  };
}

export async function loadMonthEndCloseDashboard(slug = DEMO_COMPANY_SLUG): Promise<MonthEndCloseDashboardData> {
  const fallback = buildDemoCloseDashboard();

  try {
    const [accountingWorkspace, importWorkspace] = await Promise.all([loadAccountingWorkspace(slug), loadImportWorkspace(slug)]);
    if (accountingWorkspace.source === "demo" && importWorkspace.source === "demo") {
      return {
        ...fallback,
        source: "demo",
        sourceSummary: "Convex was unavailable, so the close dashboard is using the static demo fallback.",
        computedAreas: [],
        fallbackAreas: fallback.areas.map((area) => area.label),
        caveats: [
          "All month-end close areas are using demo summaries because the persisted Convex workspaces were not reachable during render.",
        ],
      };
    }

    return mergeDashboardData({ fallback, accountingWorkspace, importWorkspace });
  } catch {
    return {
      ...fallback,
      source: "demo",
      sourceSummary: "An error occurred while loading live workspace state, so the dashboard reverted to the static demo fallback.",
      computedAreas: [],
      fallbackAreas: fallback.areas.map((area) => area.label),
      caveats: [
        "The close dashboard remains static-safe and build-safe by falling back to demo summaries when persisted data loading fails.",
      ],
    };
  }
}
