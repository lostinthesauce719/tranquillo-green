import Link from "next/link";
import { AccountingStatusBadge } from "@/components/accounting/accounting-status-badge";
import { type DemoSupportScheduleReport } from "@/lib/demo/accounting-reports";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function supportToneClass(status: DemoSupportScheduleReport["basisSummaries"][number]["supportStatus"]) {
  switch (status) {
    case "complete":
      return "emerald" as const;
    case "watch":
      return "blue" as const;
    case "missing":
      return "amber" as const;
  }
}

function reviewerTone(status: string) {
  if (status.toLowerCase().includes("approved")) return "emerald" as const;
  if (status.toLowerCase().includes("pending")) return "violet" as const;
  if (status.toLowerCase().includes("need")) return "amber" as const;
  return "blue" as const;
}

export function SupportScheduleReport({ report }: { report: DemoSupportScheduleReport }) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-surface-mid p-5">
        <div className="flex flex-col gap-4 border-b border-border pb-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Tax workpaper package</div>
            <h2 className="mt-2 text-2xl font-semibold">{report.title} — {report.periodLabel}</h2>
            <p className="mt-2 max-w-3xl text-sm text-text-muted">
              First-pass static report for deductible versus nondeductible support. The page is intentionally demo-backed but structured like a CPA-ready workpaper binder.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text-muted">
            <div>Prepared by {report.preparedBy}</div>
            <div className="mt-1">{report.preparedAt}</div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Deductible / capitalizable</div>
            <div className="mt-2 text-2xl font-semibold text-emerald-100">{currencyFormatter.format(report.deductibleTotal)}</div>
            <div className="mt-1 text-sm text-emerald-100/80">{(report.deductiblePercent * 100).toFixed(1)}% of reviewed support</div>
          </div>
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-rose-200">280E-limited</div>
            <div className="mt-2 text-2xl font-semibold text-rose-100">{currencyFormatter.format(report.nondeductibleTotal)}</div>
            <div className="mt-1 text-sm text-rose-100/80">{(report.nondeductiblePercent * 100).toFixed(1)}% of reviewed support</div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Total reviewed</div>
            <div className="mt-2 text-2xl font-semibold text-text-primary">{currencyFormatter.format(report.totalReviewed)}</div>
            <div className="mt-1 text-sm text-text-muted">Static schedule ties to demo allocation queue</div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Binder checklist</div>
            <div className="mt-2 text-2xl font-semibold text-text-primary">{report.binderChecklist.length}</div>
            <div className="mt-1 text-sm text-text-muted">Open items for audit-ready support packaging</div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Allocation basis summaries</div>
          <div className="mt-4 space-y-3">
            {report.basisSummaries.map((summary) => (
              <div key={summary.basis} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="font-medium text-text-primary">{summary.label}</div>
                  <div className="flex flex-wrap gap-2">
                    <AccountingStatusBadge label={`${summary.itemCount} items`} tone="slate" />
                    <AccountingStatusBadge label={summary.supportStatus} tone={supportToneClass(summary.supportStatus)} className="capitalize" />
                  </div>
                </div>
                <p className="mt-3 text-sm text-text-muted">{summary.narrative}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Deductible</div>
                    <div className="mt-2 font-semibold text-emerald-100">{currencyFormatter.format(summary.deductibleAmount)}</div>
                  </div>
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-rose-200">Nondeductible</div>
                    <div className="mt-2 font-semibold text-rose-100">{currencyFormatter.format(summary.nondeductibleAmount)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Policy references</div>
          <div className="mt-4 space-y-3">
            {report.policyReferences.map((reference) => (
              <div key={reference.code} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-text-primary">{reference.code}</div>
                  <AccountingStatusBadge label="memo-backed" tone="blue" />
                </div>
                <div className="mt-2 font-medium text-text-primary">{reference.title}</div>
                <p className="mt-2 text-sm text-text-muted">{reference.note}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Binder checklist</div>
            <ul className="mt-3 space-y-2 text-sm text-text-muted">
              {report.binderChecklist.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-surface-mid p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Sample line-item schedule</div>
            <p className="mt-2 text-sm text-text-muted">
              Each row is shaped like a tax support workpaper tie-out: source context, policy reference, basis, deductible share, nondeductible share, and reviewer state.
            </p>
          </div>
          <Link href="/dashboard/allocations" className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
            Back to allocations queue
          </Link>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-left text-sm">
            <thead className="bg-surface/80 text-xs uppercase tracking-[0.2em] text-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Schedule row</th>
                <th className="px-4 py-3 font-medium">Basis / support</th>
                <th className="px-4 py-3 font-medium">Policy</th>
                <th className="px-4 py-3 font-medium">Deductible</th>
                <th className="px-4 py-3 font-medium">280E-limited</th>
                <th className="px-4 py-3 font-medium">Reviewer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {report.lineItems.map((row) => (
                <tr id={row.scheduleId} key={row.scheduleId} className="align-top scroll-mt-24 transition hover:bg-surface/60">
                  <td className="px-4 py-4">
                    <div className="font-medium text-text-primary">{row.scheduleId} · {row.accountCode} {row.accountName}</div>
                    <div className="mt-1 text-xs text-text-muted">{row.periodLabel} • {row.location}</div>
                    <div className="mt-2 text-sm text-text-muted">{row.vendor}</div>
                    {row.transactionId ? (
                      <Link href={`/dashboard/accounting/transactions/${row.transactionId}`} className="mt-2 inline-flex text-xs text-accent transition hover:text-accent/80">
                        Open transaction detail
                      </Link>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 text-sm text-text-muted">
                    <div className="font-medium text-text-primary">{row.basisLabel}</div>
                    <div className="mt-1">{row.supportPackage}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-text-muted">
                    <div>{row.policyReference}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-emerald-200">{currencyFormatter.format(row.deductibleAmount)}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-rose-200">{currencyFormatter.format(row.nondeductibleAmount)}</td>
                  <td className="px-4 py-4">
                    <AccountingStatusBadge label={row.reviewerStatus} tone={reviewerTone(row.reviewerStatus)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
