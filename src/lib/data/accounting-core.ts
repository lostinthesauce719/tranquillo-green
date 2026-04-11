import "server-only";

import { anyApi } from "convex/server";
import {
  californiaOperatorDemo,
  demoChartOfAccounts,
  demoReportingPeriods,
  demoTransactions,
  type DemoChartOfAccount,
  type DemoReportingPeriod,
  type DemoTransaction,
} from "@/lib/demo/accounting";
import {
  demoCashReconciliations,
  getDemoCashReconciliation,
  type DemoCashReconciliationItem,
} from "@/lib/demo/accounting-operations";
import { getDemoTransactionDetail, type DemoTransactionDetail } from "@/lib/demo/transaction-workflows";
import { getAuthenticatedConvexClient, withTimeout } from "@/lib/data/convex-client";

export const DEMO_COMPANY_SLUG = californiaOperatorDemo.company.slug;

type WorkspaceSource = "demo" | "convex";

export type AccountingWorkspace = {
  source: WorkspaceSource;
  company: typeof californiaOperatorDemo.company;
  chartOfAccounts: DemoChartOfAccount[];
  reportingPeriods: DemoReportingPeriod[];
  transactions: DemoTransaction[];
  cashReconciliations: DemoCashReconciliationItem[];
};

function buildDemoWorkspace(): AccountingWorkspace {
  return {
    source: "demo",
    company: californiaOperatorDemo.company,
    chartOfAccounts: demoChartOfAccounts,
    reportingPeriods: demoReportingPeriods,
    transactions: demoTransactions,
    cashReconciliations: demoCashReconciliations,
  };
}

function toDemoAccount(account: any): DemoChartOfAccount {
  return {
    code: account.code,
    name: account.name,
    category: account.category,
    subcategory: account.subcategory,
    isActive: account.isActive,
    taxTreatment: account.taxTreatment,
    description: account.description ?? "Persisted chart-of-accounts record loaded from Convex.",
  };
}

function toDemoPeriod(period: any): DemoReportingPeriod {
  return {
    label: period.label,
    startDate: period.startDate,
    endDate: period.endDate,
    status: period.status,
    closeOwner: period.closeOwner ?? "Accounting",
    closeWindowDays: period.closeWindowDays ?? 7,
    lockedAt: period.lockedAt,
    taskSummary: period.taskSummary ?? { completed: 0, total: 0 },
    blockers: period.blockers ?? [],
    highlights: period.highlights ?? ["Persisted period loaded from Convex."],
  };
}

function toDemoTransaction(transaction: any, workspace: { reportingPeriods: DemoReportingPeriod[]; locationsById: Map<string, string> }): DemoTransaction {
  const periodLabel = transaction.periodLabel ?? workspace.reportingPeriods.find((period) => period.label === californiaOperatorDemo.reportingPeriod.label)?.label ?? californiaOperatorDemo.reportingPeriod.label;
  return {
    id: transaction.publicId ?? transaction.externalRef ?? transaction._id,
    date: transaction.transactionDate,
    postedDate: transaction.postedDate ?? transaction.transactionDate,
    periodLabel,
    source: transaction.sourceLabel ?? "manual",
    status: transaction.workflowStatus ?? (transaction.status === "posted" ? "posted" : transaction.status === "needs_review" ? "in_review" : "unposted"),
    reviewState: transaction.reviewState ?? (transaction.status === "posted" ? "posted" : transaction.status === "needs_review" ? "needs_mapping" : "drafted"),
    location: transaction.locationName ?? workspace.locationsById.get(transaction.locationId) ?? californiaOperatorDemo.locations[0]?.name ?? "Unknown location",
    reference: transaction.reference ?? transaction.externalRef ?? transaction._id,
    payee: transaction.counterpartyName ?? "Unknown counterparty",
    description: transaction.memo ?? "Persisted transaction loaded from Convex.",
    amount: transaction.amount ?? Math.max(transaction.lines?.[0]?.debit ?? 0, transaction.lines?.[0]?.credit ?? 0, 0),
    direction: transaction.direction ?? "outflow",
    activity: transaction.activity ?? "admin",
    suggestedDebitAccountCode: transaction.lines?.find((line: any) => line.debit)?.accountCode ?? transaction.lines?.[0]?.accountCode ?? "0000",
    suggestedCreditAccountCode: transaction.lines?.find((line: any) => line.credit)?.accountCode ?? transaction.lines?.[1]?.accountCode ?? "0000",
    journalHint: transaction.journalHint ?? "Persisted transaction available through the Convex-backed accounting core.",
    readyForManualEntry: transaction.readyForManualEntry ?? false,
    needsReceipt: transaction.needsReceipt ?? false,
  } as DemoTransaction;
}

function toDemoReconciliation(reconciliation: any): DemoCashReconciliationItem {
  return {
    id: reconciliation.publicId ?? reconciliation.externalRef ?? reconciliation._id,
    periodLabel: reconciliation.periodLabel ?? californiaOperatorDemo.reportingPeriod.label,
    location: reconciliation.locationName ?? californiaOperatorDemo.locations[0]?.name ?? "Unknown location",
    accountName: reconciliation.accountName ?? "Cash account",
    accountType: reconciliation.accountType ?? "bank_clearing",
    expectedAmount: reconciliation.expectedAmount,
    actualAmount: reconciliation.actualAmount,
    varianceAmount: reconciliation.varianceAmount,
    status:
      reconciliation.workflowStatus ??
      (reconciliation.status === "resolved"
        ? reconciliation.varianceAmount === 0
          ? "balanced"
          : "ready_to_post"
        : "investigating"),
    lastCountedAt: reconciliation.lastCountedAt ?? "No count timestamp yet",
    owner: reconciliation.owner ?? "Accounting",
    sourceContext: reconciliation.sourceContext ?? ["Persisted reconciliation loaded from Convex."],
    sourceBreakdown: reconciliation.sourceBreakdown ?? [
      {
        label: "Ledger expected balance",
        source: "Convex",
        amount: reconciliation.expectedAmount,
      },
      {
        label: "Observed / counted actual",
        source: "Convex",
        amount: reconciliation.actualAmount,
      },
    ],
    varianceDrivers:
      reconciliation.varianceDrivers ??
      [
        {
          title: "Recorded variance",
          impactAmount: reconciliation.varianceAmount,
          confidenceLabel: reconciliation.varianceAmount === 0 ? "cleared" : "needs review",
          note: reconciliation.varianceAmount === 0 ? "No unresolved difference remains." : "Investigate support, timing, or posting differences.",
        },
      ],
    investigationNotes: reconciliation.investigationNotes ?? ["Persisted reconciliation loaded from Convex."],
    relatedTransactions: reconciliation.relatedTransactions ?? [],
    nextSteps: reconciliation.nextSteps ?? ["Review underlying support and complete controller sign-off."],
    actions: reconciliation.actions ?? [
      {
        title: "Review variance",
        owner: reconciliation.owner ?? "Accounting",
        status: reconciliation.varianceAmount === 0 ? "done" : "todo",
      },
    ],
  };
}

async function loadConvexWorkspace(slug: string): Promise<AccountingWorkspace | null> {
  const client = await getAuthenticatedConvexClient();
  if (!client) {
    return null;
  }
  const result = await withTimeout(client.query((anyApi as any).accountingCore.getWorkspaceBySlug, { slug }));
  if (!result) {
    return null;
  }

  const chartOfAccounts = result.chartOfAccounts.map(toDemoAccount);
  const reportingPeriods = result.reportingPeriods.map(toDemoPeriod);
  const locationsById = new Map<string, string>(result.locations.map((location: any) => [location._id, location.name]));
  const accountsById = new Map<string, string>(result.chartOfAccounts.map((account: any) => [account._id, account.code]));

  const transactions = result.transactions.map((transaction: any) =>
    toDemoTransaction(
      {
        ...transaction,
        lines: (transaction.lines ?? []).map((line: any) => ({
          ...line,
          accountCode: accountsById.get(line.accountId) ?? "0000",
        })),
      },
      { reportingPeriods, locationsById },
    ),
  );

  const cashReconciliations = result.cashReconciliations.map((reconciliation: any) => ({
    ...reconciliation,
    periodLabel: result.reportingPeriods.find((period: any) => period._id === reconciliation.periodId)?.label,
  })).map(toDemoReconciliation);

  return {
    source: "convex",
    company: {
      name: result.company.name,
      slug: result.company.slug,
      timezone: result.company.timezone,
      state: result.company.state,
      operatorType: result.company.operatorType,
      defaultAccountingMethod: result.company.defaultAccountingMethod,
      status: result.company.status,
    },
    chartOfAccounts,
    reportingPeriods,
    transactions,
    cashReconciliations,
  };
}

export async function loadAccountingWorkspace(slug = DEMO_COMPANY_SLUG): Promise<AccountingWorkspace> {
  try {
    return (await loadConvexWorkspace(slug)) ?? buildDemoWorkspace();
  } catch {
    return buildDemoWorkspace();
  }
}

function buildSyntheticTransactionDetail(transaction: DemoTransaction): DemoTransactionDetail {
  return {
    transactionId: transaction.id,
    summary: `Persisted transaction ${transaction.reference} is available through the Convex-backed accounting workspace.`,
    sourceDetail: `Source ${transaction.source} imported for ${transaction.location} on ${transaction.date}.`,
    amountImpact: {
      debitLabel: `${transaction.suggestedDebitAccountCode}`,
      creditLabel: `${transaction.suggestedCreditAccountCode}`,
      functionalArea: `${transaction.activity} accounting workflow`,
      taxView: transaction.journalHint,
    },
    suggestedMappingReason: `Suggested entry derives from persisted transaction lines and fallback account mapping for ${transaction.reference}.`,
    relatedAccountCodes: [transaction.suggestedDebitAccountCode, transaction.suggestedCreditAccountCode],
    supportingDocs: {
      required: true,
      received: !transaction.needsReceipt,
      items: transaction.needsReceipt ? ["Support still needs to be attached in the connected workflow."] : ["Persisted transaction support is assumed present for this seeded record."],
      gapNote: transaction.needsReceipt ? "This transaction still indicates a support gap." : undefined,
    },
    reviewerActions: [
      {
        label: transaction.needsReceipt ? "Request support" : "Review posting package",
        detail: transaction.journalHint,
        tone: transaction.needsReceipt ? "amber" : "emerald",
      },
      {
        label: "Open related workflow",
        detail: "Use the transaction detail route as the server-safe persisted fallback path.",
        tone: "slate",
      },
    ],
    approvalPath: [
      {
        label: "Imported",
        owner: "Accounting workspace",
        state: "completed",
        detail: `Loaded from persisted data source ${transaction.source}.`,
      },
      {
        label: "Needs review",
        owner: "Accounting reviewer",
        state: transaction.status === "posted" ? "completed" : "current",
        detail: transaction.journalHint,
      },
      {
        label: "Posted",
        owner: "Posting service",
        state: transaction.status === "posted" ? "current" : "upcoming",
        detail: transaction.status === "posted" ? "This persisted transaction is already marked posted." : "Posting remains downstream from review completion.",
      },
    ],
    auditTrail: [
      {
        at: transaction.postedDate,
        actor: "Convex persistence",
        action: "Loaded persisted transaction",
        detail: `Rendered from persisted accounting data with demo-safe UI fallback support.`,
        tone: "slate",
      },
    ],
  };
}

export async function loadTransactionPageData(id: string) {
  const workspace = await loadAccountingWorkspace();
  const transaction = workspace.transactions.find((entry) => entry.id === id);

  if (!transaction) {
    return null;
  }

  return {
    source: workspace.source,
    transaction,
    detail: getDemoTransactionDetail(id) ?? buildSyntheticTransactionDetail(transaction),
  };
}

export async function loadReconciliationPageData(id: string) {
  const workspace = await loadAccountingWorkspace();
  const workspaceItem = workspace.cashReconciliations.find((entry) => entry.id === id);
  const demoItem = workspaceItem ? null : getDemoCashReconciliation(id);
  const item = workspaceItem ?? demoItem;

  if (!item) {
    return null;
  }

  return {
    source: workspaceItem ? workspace.source : "demo",
    item,
  };
}
