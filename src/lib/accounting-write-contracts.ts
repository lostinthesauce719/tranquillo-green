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
