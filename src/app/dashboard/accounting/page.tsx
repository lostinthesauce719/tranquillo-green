import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { ChartOfAccountsTable } from "@/components/accounting/chart-of-accounts-table";
import { MetricCard } from "@/components/ui/metric-card";
import {
  californiaOperatorDemo,
  demoChartOfAccounts,
  demoReportingPeriods,
  demoTransactions,
  summarizeDemoChartOfAccounts,
  summarizeDemoReportingPeriods,
  summarizeDemoTransactions,
} from "@/lib/demo/accounting";

const workspaceLinks = [
  {
    href: "/dashboard/accounting/periods",
    label: "Reporting periods",
    detail: "Track month-end status, checklist progress, blockers, and lock readiness.",
  },
  {
    href: "/dashboard/accounting/transactions",
    label: "Transactions + manual journals",
    detail: "Review imported activity, inspect suggested accounts, and draft balanced manual entries locally.",
  },
];

export default function AccountingPage() {
  const accountSummary = summarizeDemoChartOfAccounts(demoChartOfAccounts);
  const periodSummary = summarizeDemoReportingPeriods(demoReportingPeriods);
  const transactionSummary = summarizeDemoTransactions(demoTransactions);

  return (
    <AppShell
      title="Accounting"
      description="California-first accounting workspace for close, 280E review, transaction prep, and reporting period control. All UI is backed by local demo data so static builds stay green while backend modules mature."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Ledger accounts" value={String(accountSummary.total)} detail={`${accountSummary.active} active, ${accountSummary.inactive} inactive`} />
        <MetricCard label="Periods in motion" value={String(periodSummary.open + periodSummary.review)} detail={`${periodSummary.closed} closed and ${periodSummary.blocked} currently blocked`} />
        <MetricCard label="Manual entry queue" value={String(transactionSummary.manualQueue)} detail={`${transactionSummary.needsMapping} transactions still need mapping review`} />
        <MetricCard label="Current period" value={californiaOperatorDemo.reportingPeriod.label} detail={`${californiaOperatorDemo.reportingPeriod.status.toUpperCase()} close for ${californiaOperatorDemo.company.name}`} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-accent">Temporary demo source</div>
              <h2 className="mt-2 text-xl font-semibold">Chart of accounts</h2>
              <p className="mt-2 max-w-2xl text-sm text-text-muted">
                Realistic default ledger for a vertically integrated California operator. This mirrors the evolving domain model without
                requiring client-side Convex credentials during static generation.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-muted">
              {californiaOperatorDemo.company.operatorType} operator • {californiaOperatorDemo.company.defaultAccountingMethod} basis
            </div>
          </div>
          <div className="mt-5">
            <ChartOfAccountsTable accounts={demoChartOfAccounts} />
          </div>
        </section>

        <div className="grid gap-4">
          <section className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Workspace entry points</div>
            <div className="mt-4 grid gap-3">
              {workspaceLinks.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-2xl border border-border bg-surface px-4 py-4 transition hover:bg-surface/70">
                  <div className="font-medium text-text-primary">{item.label}</div>
                  <div className="mt-2 text-sm text-text-muted">{item.detail}</div>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Entity snapshot</div>
            <h2 className="mt-2 text-lg font-semibold">Golden State Greens</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-text-muted">State footprint</dt>
                <dd>California</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-text-muted">Locations</dt>
                <dd>{californiaOperatorDemo.locations.length}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-text-muted">Licenses</dt>
                <dd>{californiaOperatorDemo.licenses.length}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-text-muted">Timezone</dt>
                <dd>{californiaOperatorDemo.company.timezone}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Close checklist alignment</div>
            <ul className="mt-3 space-y-3 text-sm text-text-muted">
              <li>• Reporting periods now show open, review, and closed states with checklist progress and blockers.</li>
              <li>• Transactions table includes imported activity, suggested entry codes, and receipt follow-up flags.</li>
              <li>• Manual journal entry flow validates balanced debits and credits locally with no backend dependency.</li>
              <li>• Static-safe demo data still mirrors companies, locations, licenses, accounts, periods, and transaction prep.</li>
            </ul>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
