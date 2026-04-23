/**
 * Export Tranquillo transactions to QuickBooks journal entry format.
 *
 * Converts internal transactions (with allocation splits) into
 * QBO-compatible journal entries ready for batch creation.
 */

import { mapToQBO } from "./mapping";
import type { QBOJournalEntry, QBOJournalLine } from "./types";

export interface TransactionForExport {
  id: string;
  transactionDate: string;
  memo?: string;
  externalRef?: string;
  reference?: string;
  amount: number;
  direction: "inflow" | "outflow";
  lines: Array<{
    accountCode: string;
    accountName: string;
    debit?: number;
    credit?: number;
    memo?: string;
  }>;
}

export interface ExportResult {
  entries: QBOJournalEntry[];
  warnings: string[];
  unmappedAccounts: string[];
}

/**
 * Convert internal transactions to QBO journal entries.
 * Each transaction becomes a balanced journal entry.
 */
export function exportToQBO(transactions: TransactionForExport[]): ExportResult {
  const entries: QBOJournalEntry[] = [];
  const warnings: string[] = [];
  const unmappedAccounts = new Set<string>();

  for (const txn of transactions) {
    const lines: QBOJournalLine[] = [];
    let hasUnmapped = false;

    for (const line of txn.lines) {
      const mapping = mapToQBO(line.accountCode);

      if (!mapping) {
        unmappedAccounts.add(`${line.accountCode} — ${line.accountName}`);
        hasUnmapped = true;
        continue;
      }

      if (line.debit && line.debit > 0) {
        lines.push({
          Description: line.memo ?? txn.memo ?? "",
          Amount: Math.abs(line.debit),
          DetailType: "JournalEntryLineDetail",
          JournalEntryLineDetail: {
            PostingType: "Debit",
            AccountRef: { value: mapping.qboName },
          },
        });
      }

      if (line.credit && line.credit > 0) {
        lines.push({
          Description: line.memo ?? txn.memo ?? "",
          Amount: Math.abs(line.credit),
          DetailType: "JournalEntryLineDetail",
          JournalEntryLineDetail: {
            PostingType: "Credit",
            AccountRef: { value: mapping.qboName },
          },
        });
      }
    }

    if (hasUnmapped) {
      warnings.push(`Transaction ${txn.id}: skipped unmapped accounts`);
    }

    if (lines.length > 0) {
      // Validate journal balance
      const totalDebits = lines
        .filter((l) => l.JournalEntryLineDetail.PostingType === "Debit")
        .reduce((sum, l) => sum + l.Amount, 0);
      const totalCredits = lines
        .filter((l) => l.JournalEntryLineDetail.PostingType === "Credit")
        .reduce((sum, l) => sum + l.Amount, 0);

      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        warnings.push(`Transaction ${txn.id}: unbalanced ($${totalDebits.toFixed(2)} Dr / $${totalCredits.toFixed(2)} Cr)`);
      }

      entries.push({
        TxnDate: txn.transactionDate,
        DocNumber: txn.externalRef ?? txn.reference ?? undefined,
        PrivateNote: txn.memo ?? undefined,
        Line: lines,
      });
    }
  }

  return {
    entries,
    warnings,
    unmappedAccounts: Array.from(unmappedAccounts),
  };
}

/**
 * Generate IIF (Intuit Interchange Format) file content for QuickBooks Desktop.
 * This is the legacy format still used by some cannabis operators on QB Desktop.
 */
export function exportToIIF(transactions: TransactionForExport[]): string {
  const lines: string[] = [];

  // IIF header
  lines.push("!TRNS\tTRNSID\tTRNSTYPE\tDATE\tACCNT\tNAME\tCLASS\tAMOUNT\tDOCNUM\tMEMO\tCLEAR");
  lines.push("!SPL\tSPLID\tTRNSTYPE\tDATE\tACCNT\tNAME\tCLASS\tAMOUNT\tDOCNUM\tMEMO\tCLEAR");
  lines.push("!ENDTRNS");

  let txnId = 1;
  for (const txn of transactions) {
    for (const line of txn.lines) {
      const mapping = mapToQBO(line.accountCode);
      const accountName = mapping?.qboName ?? line.accountName;
      const amount = (line.debit ?? 0) - (line.credit ?? 0);

      lines.push(
        `TRNS\t${txnId}\tGENERAL JOURNAL\t${txn.transactionDate}\t${accountName}\t\t\t${amount.toFixed(2)}\t${txn.externalRef ?? ""}\t${txn.memo ?? ""}\tN`
      );
    }

    // End transaction marker
    lines.push("ENDTRNS");
    txnId++;
  }

  return lines.join("\n");
}
