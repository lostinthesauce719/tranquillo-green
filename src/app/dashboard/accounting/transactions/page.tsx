import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { ManualJournalEntryForm } from "@/components/accounting/manual-journal-entry-form";
import { TransactionsTable } from "@/components/accounting/transactions-table";
import { MetricCard } from "@/components/ui/metric-card";
import { summarizeDemoTransactions } from "@/lib/demo/accounting";
import { loadAccountingWorkspace } from "@/lib/data/accounting-core";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function AccountingTransactionsPage() {
  const workspace = await loadAccountingWorkspace();
  const summary = summarizeDemoTransactions(workspace.transactions);
  const manualCandidates = workspace.transactions.filter((transaction) => transaction.readyForManualEntry && transaction.status !== "posted");

  return (
    <AppShell
      title="Transactions"
      description="Review imported activity, inspect suggested entries, and prepare manual journals."
    >
      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard label="Imported" value={String(summary.total)} detail={`${summary.ready} ready, ${summary.posted} posted`} />
        <MetricCard label="Needs mapping" value={String(summary.needsMapping)} detail="Still need account review or docs" />
        <MetricCard label="Manual queue" value={String(summary.manualQueue)} detail="Candidates for journal prep" />
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-[1.75fr_1fr]">
        <section className="rounded-2xl border border-border bg-surface-mid p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.15em] text-accent/70">Review</div>
              <h2 className="mt-1.5 text-lg font-semibold">Imported activity</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard/accounting/pipeline" className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-muted transition hover:text-text-primary hover:bg-surface/70">
                Pipeline
              </Link>
              <Link href="/dashboard/accounting/imports" className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-muted transition hover:text-text-primary hover:bg-surface/70">
                Imports
              </Link>
              <Link href={`/dashboard/accounting/transactions/${workspace.transactions[1]?.id ?? workspace.transactions[0]?.id ?? "txn_002"}`} className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-muted transition hover:text-text-primary hover:bg-surface/70">
                Sample detail
              </Link>
            </div>
          </div>
          <div className="mt-5">
            <TransactionsTable transactions={workspace.transactions} />
          </div>
        </section>

        <div className="grid gap-5">
          <section className="rounded-2xl border border-border bg-surface-mid p-6">
            <div className="text-[11px] uppercase tracking-[0.15em] text-accent/70">Manual entries</div>
            <ul className="mt-4 space-y-2.5 text-sm text-text-muted/60">
              {manualCandidates.map((transaction) => (
                <li key={transaction.id} className="rounded-xl border border-border bg-surface px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-text-primary">{transaction.reference}</div>
                      <div className="mt-0.5 text-xs">{transaction.description}</div>
                      <div className="mt-1 text-[10px] text-text-muted/40">Dr {transaction.suggestedDebitAccountCode} / Cr {transaction.suggestedCreditAccountCode}</div>
                    </div>
                    <Link href={`/dashboard/accounting/transactions/${transaction.id}`} className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted transition hover:text-text-primary hover:bg-surface-mid">
                      Review
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-surface-mid p-6">
            <div className="text-[11px] uppercase tracking-[0.15em] text-accent/70">Notes</div>
            <ul className="mt-3 space-y-1.5 text-sm text-text-muted/50">
              <li>No Convex runtime required for static builds.</li>
              <li>Manual drafts run in browser state.</li>
              <li>CSV staging stays local.</li>
            </ul>
          </section>
        </div>
      </div>

      <div className="mt-8">
        <ManualJournalEntryForm accounts={workspace.chartOfAccounts} periods={workspace.reportingPeriods} />
      </div>
    </AppShell>
  );
}
