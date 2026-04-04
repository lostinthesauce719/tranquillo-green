import { AppShell } from "@/components/shell/app-shell";
import { ChartOfAccountsTable } from "@/components/accounting/chart-of-accounts-table";
import { MetricCard } from "@/components/ui/metric-card";
import { californiaOperatorDemo, demoChartOfAccounts, summarizeDemoChartOfAccounts } from "@/lib/demo/accounting";

export default function AccountingPage() {
  const summary = summarizeDemoChartOfAccounts(demoChartOfAccounts);

  return (
    <AppShell
      title="Accounting"
      description="California-first chart of accounts workspace for operator close, 280E review, and reporting period control. The page uses local demo data so the static build stays green until Convex is wired into the client."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total accounts" value={String(summary.total)} detail={`${summary.active} active, ${summary.inactive} inactive`} />
        <MetricCard label="COGS eligible" value={String(summary.cogsAccounts)} detail="Accounts mapped for inventory capitalization and 471 basis support" />
        <MetricCard label="280E exposure" value={String(summary.nondeductibleAccounts)} detail="Operational expense accounts limited for federal deduction treatment" />
        <MetricCard label="Current period" value={californiaOperatorDemo.reportingPeriod.label} detail={`${californiaOperatorDemo.reportingPeriod.status.toUpperCase()} close for ${californiaOperatorDemo.company.name}`} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-accent">Temporary demo source</div>
              <h2 className="mt-2 text-xl font-semibold">Chart of accounts</h2>
              <p className="mt-2 max-w-2xl text-sm text-text-muted">
                Realistic default ledger for a vertically integrated California operator. This mirrors the new Convex modules without requiring
                client-side Convex credentials during static generation.
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
              <li>• Revenue and COGS bands separate retail vs manufacturing activity.</li>
              <li>• Tax treatment badges highlight deductible, capitalizable, and 280E-limited accounts.</li>
              <li>• Suspense account remains inactive until imported transactions need review.</li>
              <li>• Seed module includes matching company, locations, licenses, accounts, and reporting period.</li>
            </ul>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
