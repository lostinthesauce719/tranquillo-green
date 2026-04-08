import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { ManualJournalEntryForm } from "@/components/accounting/manual-journal-entry-form";
import { TransactionsTable } from "@/components/accounting/transactions-table";
import { MetricCard } from "@/components/ui/metric-card";
import { AuditContextBar } from "@/components/accounting/trust-markers";
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
      description={`Transaction review workspace for the Phase 1 MVP. Imported activity now prefers ${workspace.source === "convex" ? "persisted Convex data" : "demo fallback data"} while the manual journal flow remains static-safe.`}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Imported transactions" value={String(summary.total)} detail={`${summary.ready} ready, ${summary.posted} already posted`} />
        <MetricCard label="Needs mapping" value={String(summary.needsMapping)} detail="Transactions that still need account review or supporting docs" />
        <MetricCard label="Manual queue" value={String(summary.manualQueue)} detail="Unposted rows that are realistic candidates for manual journal prep" />
        <MetricCard label="Workspace value" value={formatCurrency(summary.totalValue)} detail="Gross transaction value represented in the current demo queue" />
      </div>

      <div className="mt-4">
        <AuditContextBar
          sourceSystem={workspace.source === "convex" ? "Convex persisted" : "Demo fallback"}
          lastVerified="Apr 8, 2026 02:42 AM"
          documentCount={summary.total}
          confidence={summary.posted / Math.max(summary.total, 1)}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.75fr_1fr]">
        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-accent">Review queue</div>
              <h2 className="mt-2 text-xl font-semibold">Imported activity table</h2>
              <p className="mt-2 max-w-2xl text-sm text-text-muted">
                Rows are modeled after POS batches, bank activity, payroll, inventory movements, and manual accruals. Each row includes realistic suggested entry codes to support manual posting work.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard/accounting/pipeline" className="rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-100 transition hover:bg-violet-500/20">
                Open pipeline board
              </Link>
              <Link href="/dashboard/accounting/imports" className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
                Open imports
              </Link>
              <Link href="/dashboard/accounting/periods" className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
                View reporting periods
              </Link>
              <Link href={`/dashboard/accounting/transactions/${workspace.transactions[1]?.id ?? workspace.transactions[0]?.id ?? "txn_002"}`} className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-100 transition hover:bg-blue-500/20">
                Open sample approval detail
              </Link>
            </div>
          </div>
          <div className="mt-5">
            <TransactionsTable transactions={workspace.transactions} />
          </div>
        </section>

        <div className="grid gap-4">
          <section className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Manual entry candidates</div>
            <ul className="mt-4 space-y-3 text-sm text-text-muted">
              {manualCandidates.map((transaction) => (
                <li key={transaction.id} className="rounded-xl border border-border bg-surface px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-text-primary">{transaction.reference}</div>
                      <div className="mt-1">{transaction.description}</div>
                      <div className="mt-2 text-xs">Dr {transaction.suggestedDebitAccountCode} / Cr {transaction.suggestedCreditAccountCode}</div>
                    </div>
                    <Link href={`/dashboard/accounting/transactions/${transaction.id}`} className="rounded-lg border border-border px-3 py-2 text-xs text-text-primary transition hover:bg-surface-mid">
                      Review
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Why this is static-safe</div>
            <ul className="mt-3 space-y-3 text-sm text-text-muted">
              <li>• No client-side Convex hook or NEXT_PUBLIC_CONVEX_URL is required.</li>
              <li>• Manual draft creation and persistence run entirely in browser state and local storage.</li>
              <li>• Server loaders now prefer persisted Convex rows and fall back to the seeded demo story when no runtime is configured.</li>
              <li>• CSV import staging lives in its own route and stays local/demo-backed.</li>
            </ul>
          </section>
        </div>
      </div>

      <div className="mt-6">
        <ManualJournalEntryForm accounts={workspace.chartOfAccounts} periods={workspace.reportingPeriods} />
      </div>
    </AppShell>
  );
}
