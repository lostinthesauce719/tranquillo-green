import type { DemoCashReconciliationItem } from "@/lib/demo/accounting-operations";
import type { DemoReportingPeriod } from "@/lib/demo/accounting";

export type ManualJournalLineInput = {
  accountCode: string;
  direction: "debit" | "credit";
  amount: number;
  memo: string;
};

export type ManualJournalSubmission = {
  companySlug: string;
  entryDate: string;
  periodLabel: string;
  reference: string;
  description: string;
  lines: ManualJournalLineInput[];
};

export type ReportingPeriodMutation = {
  companySlug: string;
  periodLabel: string;
  status: DemoReportingPeriod["status"];
  taskSummary: DemoReportingPeriod["taskSummary"];
  blockers: string[];
  lockedAt?: string;
  highlights?: string[];
};

export type ReconciliationMutation = {
  companySlug: string;
  reconciliationId: string;
  action: "log_note" | "toggle_case" | "toggle_review";
};

export type AuditTrailEntityType =
  | "transaction"
  | "allocation"
  | "reconciliation"
  | "reporting_period"
  | "import_job"
  | "packet"
  | "system";

export type AuditTrailEventInput = {
  companySlug: string;
  entityType: AuditTrailEntityType;
  entityId: string;
  action: string;
  actor: string;
  actorRole?: string;
  reason?: string;
  beforeState?: string;
  afterState?: string;
  metadata?: Record<string, string>;
};

export type OverrideDecisionInput = {
  companySlug: string;
  allocationId?: string;
  transactionId?: string;
  periodId?: string;
  decisionType: "recommendation" | "override" | "approval" | "support_request" | "policy_exception";
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
};

export type PacketChecklistSnapshotItem = {
  title: string;
  status: string;
  owner: string;
};

export type PacketGenerationInput = {
  companySlug: string;
  periodId?: string;
  bundleId: string;
  bundleName: string;
  action: "assembled" | "refreshed" | "queued" | "sent" | "dry_run";
  actor: string;
  actorRole?: string;
  exportFormats: string[];
  includedSchedules: string[];
  coverMemoMode?: string;
  checklistSnapshot: PacketChecklistSnapshotItem[];
  detail?: string;
};

export type WriteResult<T> = {
  ok: true;
  mode: "persisted" | "demo";
  message: string;
  item?: T;
};
