/**
 * QuickBooks Integration — Public API
 *
 * Provides export (Tranquillo → QBO) and sync capabilities.
 *
 * Usage:
 *   import { exportToQBO, exportToIIF, QBOClient } from "@/lib/integrations/quickbooks";
 */

// Types
export type { QBOAccount, QBOCompanyInfo, QBOJournalEntry, QBOJournalLine, QBOTokenResponse, QBOBatchRequest, QBOBatchResponse } from "./types";

// Account mapping
export { STANDARD_MAPPINGS, mapToQBO, mapFromQBO, generateQBOChartOfAccounts } from "./mapping";
export type { AccountMapping, TranquilloCategory, TaxTreatment } from "./mapping";

// Export functions
export { exportToQBO, exportToIIF } from "./export";
export type { TransactionForExport, ExportResult } from "./export";

// QBO API client
export { QBOClient } from "./client";
export type { QBOClientConfig, QBOTokenRefreshResult } from "./client";
