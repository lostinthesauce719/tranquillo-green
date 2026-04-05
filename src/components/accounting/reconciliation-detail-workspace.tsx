import Link from "next/link";
import { AccountingStatusBadge } from "@/components/accounting/accounting-status-badge";
import type { DemoCashReconciliationItem } from "@/lib/demo/accounting-operations";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function statusTone(status: DemoCashReconciliationItem["status"]) {
  switch (status) {
    case "balanced":
      return "emerald" as const;
    case "ready_to_post":
      return "blue" as const;
    case "investigating":
      return "amber" as const;
    case "exception":
      return "rose" as const;
  }
}

function actionTone(status: DemoCashReconciliationItem["actions"][number]["status"]) {
  switch (status) {
    case "done":
      return "emerald" as const;
    case "in_progress":
      return "amber" as const;
    case "todo":
      return "slate" as const;
  }
}

export function ReconciliationDetailWorkspace({ item }: { item: DemoCashReconciliationItem }) {
  const varianceTone = item.varianceAmount === 0 ? "text-emerald-200" : item.varianceAmount < 0 ? "text-rose-200" : "text-amber-200";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-surface-mid p-5">
        <div className="flex flex-col gap-4 border-b border-border pb-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-accent">{item.periodLabel} • {item.location} • {item.id}</div>
            <h2 className="mt-2 text-2xl font-semibold">{item.accountName}</h2>
            <p className="mt-2 text-sm text-text-muted">Owner: {item.owner} · Last counted {item.lastCountedAt}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AccountingStatusBadge label={item.status.replaceAll("_", " ")} tone={statusTone(item.status)} />
            <AccountingStatusBadge label={`${item.relatedTransactions.length} related transactions`} tone="slate" />
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Expected</div>
            <div className="mt-2 text-xl font-semibold">{currencyFormatter.format(item.expectedAmount)}</div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Actual</div>
            <div className="mt-2 text-xl font-semibold">{currencyFormatter.format(item.actualAmount)}</div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Variance</div>
            <div className={`mt-2 text-xl font-semibold ${varianceTone}`}>{currencyFormatter.format(item.varianceAmount)}</div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Source breakdown</div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-left text-sm">
                <thead className="bg-surface/80 text-xs uppercase tracking-[0.2em] text-text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Line</th>
                    <th className="px-4 py-3 font-medium">Source</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {item.sourceBreakdown.map((line) => (
                    <tr key={`${item.id}-${line.label}`}>
                      <td className="px-4 py-4 text-text-primary">{line.label}</td>
                      <td className="px-4 py-4 text-text-muted">{line.source}</td>
                      <td className="px-4 py-4 text-text-primary">{currencyFormatter.format(line.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Variance drivers</div>
            <div className="mt-4 space-y-3">
              {item.varianceDrivers.map((driver) => (
                <div key={`${item.id}-${driver.title}`} className="rounded-2xl border border-border bg-surface p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="font-medium">{driver.title}</div>
                    <AccountingStatusBadge label={driver.confidenceLabel} tone={driver.impactAmount === 0 ? "blue" : "amber"} />
                  </div>
                  <div className="mt-3 text-sm text-text-muted">{driver.note}</div>
                  <div className="mt-3 text-sm text-text-primary">Impact: {currencyFormatter.format(driver.impactAmount)}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Investigation notes + next steps</div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-surface p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Notes</div>
                <ul className="mt-3 space-y-2 text-sm text-text-muted">
                  {item.investigationNotes.map((note) => (
                    <li key={note}>• {note}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Next steps</div>
                <ul className="mt-3 space-y-2 text-sm text-text-muted">
                  {item.nextSteps.map((step) => (
                    <li key={step}>• {step}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Source context</div>
            <ul className="mt-4 space-y-2 text-sm text-text-muted">
              {item.sourceContext.map((context) => (
                <li key={context}>• {context}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Related transactions</div>
            <div className="mt-4 space-y-3">
              {item.relatedTransactions.map((transaction) => (
                <div key={`${item.id}-${transaction.transactionId}`} className="rounded-2xl border border-border bg-surface p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-medium">{transaction.label}</div>
                      <div className="mt-1 text-sm text-text-muted">{transaction.note}</div>
                    </div>
                    <div className="text-sm text-text-primary">{currencyFormatter.format(transaction.amount)}</div>
                  </div>
                  <Link href={`/dashboard/accounting/transactions/${transaction.transactionId}`} className="mt-3 inline-flex text-sm text-accent transition hover:text-accent/80">
                    Open transaction detail
                  </Link>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Action queue</div>
            <div className="mt-4 space-y-3">
              {item.actions.map((action) => (
                <div key={`${item.id}-${action.title}`} className="rounded-2xl border border-border bg-surface px-4 py-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-medium">{action.title}</div>
                      <div className="mt-1 text-sm text-text-muted">Owner: {action.owner}</div>
                    </div>
                    <AccountingStatusBadge label={action.status.replaceAll("_", " ")} tone={actionTone(action.status)} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/dashboard/reconciliations" className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
                Back to reconciliation workspace
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
