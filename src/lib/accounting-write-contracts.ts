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

export type AuditTrailEventInput = {
  companySlug: string;
  entityType: string;
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
};

export type PacketGenerationInput = {
  companySlug: string;
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

export type ExportPacketMutation = {
  companySlug: string;
  bundleId: string;
  bundleName: string;
  periodLabel: string;
  recipient: string;
  owner: string;
  status: "draft" | "generated" | "sent" | "held";
  selectedFormats: string[];
  selectedSchedules: string[];
  selectedChecklistTitles: string[];
  coverMemoMode: "controller_summary" | "cpa_handoff" | "open_items";
  includeDeliveryNotes: boolean;
  detail: string;
  blockers: string[];
};

export type WriteResult<T> = {
  ok: true;
  mode: "persisted" | "demo";
  message: string;
  item?: T;
};

export type SeedSummary = {
  companyId: string;
  companySlug: string;
  locationsSeeded: number;
  licensesSeeded: number;
  accountsSeeded: number;
  reportingPeriodsSeeded: number;
  importProfilesSeeded: number;
  importJobsSeeded: number;
  importRowsSeeded: number;
  transactionsSeeded: number;
  transactionLinesSeeded: number;
  cashReconciliationsSeeded: number;
};

export type SeedResult = {
  ok: true;
  mode: "persisted" | "demo";
  message: string;
  summary?: SeedSummary;
};
