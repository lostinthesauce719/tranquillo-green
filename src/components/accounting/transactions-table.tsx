import { AccountingStatusBadge } from "@/components/accounting/accounting-status-badge";
import { DemoTransaction } from "@/lib/demo/accounting";

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

export function TransactionsTable({ transactions }: { transactions: DemoTransaction[] }) {
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
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="align-top transition hover:bg-surface/60">
                <td className="whitespace-nowrap px-4 py-4 text-text-muted">
                  <div>{transaction.date}</div>
                  <div className="mt-1 text-xs">{transaction.location}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="font-medium capitalize text-text-primary">{transaction.source}</div>
                  <div className="mt-1 text-xs capitalize text-text-muted">{transaction.activity}</div>
                </td>
                <td className="px-4 py-4 font-mono text-xs text-text-muted">{transaction.reference}</td>
                <td className="px-4 py-4">
                  <div className="font-medium text-text-primary">{transaction.payee}</div>
                  <div className="mt-1 max-w-md text-xs text-text-muted">{transaction.description}</div>
                  <div className="mt-2 text-xs text-text-muted">{transaction.journalHint}</div>
                </td>
                <td className="px-4 py-4 text-xs text-text-muted">
                  <div>Dr {transaction.suggestedDebitAccountCode}</div>
                  <div className="mt-1">Cr {transaction.suggestedCreditAccountCode}</div>
                  {transaction.needsReceipt ? (
                    <div className="mt-2 inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200">
                      Receipt follow-up
                    </div>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  <div className="font-medium text-text-primary">{transaction.direction === "inflow" ? formatCurrency(transaction.amount) : `(${formatCurrency(transaction.amount)})`}</div>
                  <div className="mt-1 text-xs text-text-muted">{transaction.periodLabel}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <AccountingStatusBadge label={transaction.status.replaceAll("_", " ")} tone={getStatusTone(transaction.status)} className="capitalize" />
                    <AccountingStatusBadge label={transaction.reviewState.replaceAll("_", " ")} tone={getReviewTone(transaction.reviewState)} className="capitalize" />
                    {transaction.readyForManualEntry ? <AccountingStatusBadge label="manual entry candidate" tone="violet" /> : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
