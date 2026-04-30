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

export type WriteResult<T> = {
  ok: true;
  mode: "persisted" | "demo";
  message: string;
  item?: T;
};

export type AuditTrailEventInput = {
  companySlug: string;
  eventType?: string;
  entityType: string;
  entityId: string;
  action: string;
  actor: string;
  actorRole?: string;
  reason?: string;
  detail?: string;
  beforeState?: string;
  afterState?: string;
  metadata?: Record<string, unknown>;
};

export type OverrideDecisionInput = {
  companySlug: string;
  allocationId: string;
  transactionId?: string;
  periodId?: string;
  decisionType: string;
  actor: string;
  actorRole?: string;
  reason?: string;
  fromBasis?: string;
  toBasis?: string;
  originalDeductibleAmount: number;
  revisedDeductibleAmount: number;
  originalNondeductibleAmount: number;
  revisedNondeductibleAmount: number;
  evidence?: string[];
  resultingPolicyTrail?: string;
  decision?: string;
  role?: string;
};

export type PacketGenerationInput = {
  companySlug: string;
  periodId?: string;
  bundleId: string;
  bundleName: string;
  action?: string;
  actor: string;
  actorRole?: string;
  exportFormats?: string[];
  includedSchedules?: string[];
  coverMemoMode?: string;
  checklistSnapshot?: string[];
  detail?: string;
  periodLabel?: string;
  recipient?: string;
  owner?: string;
  status?: string;
  selectedFormats?: string[];
  selectedSchedules?: string[];
  selectedChecklistTitles?: string[];
  includeDeliveryNotes?: boolean;
  blockers?: string[];
};

export type SeedResult = {
  ok: boolean;
  mode: string;
  message: string;
  summary?: SeedSummary;
};

export type SeedSummary = {
  companySlug: string;
  companiesCreated: number;
  transactionsCreated: number;
  accountsCreated: number;
};
