"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { AccountingStatusBadge } from "@/components/accounting/accounting-status-badge";
import { cn } from "@/lib/utils";
import type { DemoTransaction } from "@/lib/demo/accounting";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function getStatusTone(status: DemoTransaction["status"]) {
  switch (status) {
    case "posted":
      return "emerald" as const;
    case "ready_to_post":
      return "blue" as const;
    case "in_review":
      return "amber" as const;
    case "unposted":
      return "slate" as const;
  }
}

function getReviewTone(state: DemoTransaction["reviewState"]) {
  switch (state) {
    case "ready":
      return "emerald" as const;
    case "needs_mapping":
      return "rose" as const;
    case "drafted":
      return "violet" as const;
    case "posted":
      return "blue" as const;
  }
}

// Generate "why" context for a transaction
function getTransactionWhy(transaction: DemoTransaction): {
  reason: string;
  detail: string;
  icon: string;
} {
  // Why is it in this status?
  if (transaction.status === "posted") {
    return {
      reason: "Posted to ledger",
      detail: "Approved and locked in a closed reporting period. No further changes allowed without override.",
      icon: "✅",
    };
  }

  if (transaction.status === "ready_to_post") {
    return {
      reason: "Ready to post",
      detail: "All validations passed — debits equal credits, accounts mapped, receipts attached. Awaiting final approval.",
      icon: "🔵",
    };
  }

  if (transaction.status === "in_review") {
    if (transaction.reviewState === "needs_mapping") {
      return {
        reason: "Needs account mapping",
        detail: `Imported from ${transaction.source} but the engine couldn't auto-map to a chart-of-accounts entry. Manual classification needed before posting.`,
        icon: "🔴",
      };
    }
    if (transaction.needsReceipt) {
      return {
        reason: "Missing receipt",
        detail: "Transaction is mapped correctly but supporting documentation is missing. Upload receipt to move to ready-to-post.",
        icon: "🟡",
      };
    }
    if (transaction.readyForManualEntry) {
      return {
        reason: "Manual entry candidate",
        detail: "This item needs a manual journal entry to supplement the imported transaction (e.g., accrual, reclassification).",
        icon: "📝",
      };
    }
    return {
      reason: "In review queue",
      detail: `Imported from ${transaction.source}. Awaiting reviewer sign-off. ${transaction.journalHint}`,
      icon: "👀",
    };
  }

  // unposted
  return {
    reason: "Draft — not yet submitted",
    detail: "Created manually but not submitted for review. Complete the entry and submit to enter the pipeline.",
    icon: "📄",
  };
}

export function TransactionsTable({ transactions }: { transactions: DemoTransaction[] }) {
  const [expandedWhy, setExpandedWhy] = useState<Set<string>>(new Set());

  const toggleWhy = useCallback((id: string) => {
    setExpandedWhy((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface-mid">
      <div className="border-b border-border bg-surface/80 px-4 py-3 text-xs uppercase tracking-[0.2em] text-text-muted">
        Imported activity ready for review, mapping, and manual journal preparation
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-left text-sm">
          <thead className="bg-surface/80 text-xs uppercase tracking-[0.2em] text-text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Suggested entry</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Why</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.map((transaction) => {
              const why = getTransactionWhy(transaction);
              const isExpanded = expandedWhy.has(transaction.id);

              return (
                <React.Fragment key={transaction.id}>
                  <tr
                    className="align-top transition hover:bg-surface/60"
                  >
                    <td className="whitespace-nowrap px-4 py-4 text-text-muted">
                      <div>{transaction.date}</div>
                      <div className="mt-1 text-xs">{transaction.location}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium capitalize text-text-primary">
                        {transaction.source}
                      </div>
                      <div className="mt-1 text-xs capitalize text-text-muted">
                        {transaction.activity}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-text-muted">
                      <Link
                        href={`/dashboard/accounting/transactions/${transaction.id}`}
                        className="transition hover:text-text-primary hover:underline"
                      >
                        {transaction.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-text-primary">
                        {transaction.payee}
                      </div>
                      <div className="mt-1 max-w-md text-xs text-text-muted">
                        {transaction.description}
                      </div>
                      <div className="mt-2 text-xs text-text-muted">
                        {transaction.journalHint}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-text-muted">
                      <div>Dr {transaction.suggestedDebitAccountCode}</div>
                      <div className="mt-1">
                        Cr {transaction.suggestedCreditAccountCode}
                      </div>
                      {transaction.needsReceipt ? (
                        <div className="mt-2 inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200">
                          Receipt follow-up
                        </div>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <div className="font-medium text-text-primary">
                        {transaction.direction === "inflow"
                          ? formatCurrency(transaction.amount)
                          : `(${formatCurrency(transaction.amount)})`}
                      </div>
                      <div className="mt-1 text-xs text-text-muted">
                        {transaction.periodLabel}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <AccountingStatusBadge
                          label={transaction.status.replaceAll("_", " ")}
                          tone={getStatusTone(transaction.status)}
                          className="capitalize"
                        />
                        <AccountingStatusBadge
                          label={transaction.reviewState.replaceAll("_", " ")}
                          tone={getReviewTone(transaction.reviewState)}
                          className="capitalize"
                        />
                        {transaction.readyForManualEntry ? (
                          <AccountingStatusBadge
                            label="manual entry candidate"
                            tone="violet"
                          />
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => toggleWhy(transaction.id)}
                        className="flex items-center gap-1 text-[11px] text-text-faint hover:text-text-muted transition-colors"
                      >
                        <span>{why.icon}</span>
                        <span>{why.reason}</span>
                        <span className="text-text-faint">
                          {isExpanded ? "▾" : "▸"}
                        </span>
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${transaction.id}-why`} className="bg-surface-raised/50">
                      <td colSpan={8} className="px-4 py-3">
                        <div className="flex items-start gap-2 ml-4">
                          <span className="text-sm mt-0.5">{why.icon}</span>
                          <div>
                            <span className="text-xs font-medium text-text-secondary">
                              {why.reason}
                            </span>
                            <p className="text-xs text-text-muted mt-0.5 max-w-2xl">
                              {why.detail}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
