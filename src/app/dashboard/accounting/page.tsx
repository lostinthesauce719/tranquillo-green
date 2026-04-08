import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { ChartOfAccountsTable } from "@/components/accounting/chart-of-accounts-table";
import { MetricCard } from "@/components/ui/metric-card";
import {
  summarizeDemoChartOfAccounts,
  summarizeDemoReportingPeriods,
  summarizeDemoTransactions,
} from "@/lib/demo/accounting";
import { loadAccountingWorkspace } from "@/lib/data/accounting-core";

const workspaceLinks = [
  {
    href: "/dashboard/accounting/close",
    label: "Month-end close dashboard",
    detail: "See readiness, blockers, next actions, and signoff status across the full accounting close workflow.",
  },
  {
    href: "/dashboard/accounting/periods",
    label: "Reporting periods",
    detail: "Track month-end status, checklist progress, blockers, and lock readiness.",
  },
  {
    href: "/dashboard/accounting/pipeline",
    label: "Imported-to-posted pipeline",
    detail: "Move staged imports through review, posting readiness, and posted retention with owner and blocker visibility.",
  },
  {
    href: "/dashboard/accounting/transactions",
    label: "Transactions + manual journals",
    detail: "Review imported activity, inspect suggested accounts, and draft balanced manual entries locally.",
  },
  {
    href: "/dashboard/accounting/imports",
    label: "CSV imports",
    detail: "Stage bank and payroll files, apply column mappings, and validate row-level posting suggestions locally.",
  },
  {
    href: "/dashboard/allocations",
    label: "280E review queue",
    detail: "Work deterministic deductible vs nondeductible allocation cases with policy support and reviewer actions.",
  },
  {
    href: "/dashboard/reconciliations",
    label: "Cash reconciliations",
    detail: "Tie drawers, vault, armored clearing, and bank balances with variance investigation workflow.",
  },
  {
    href: "/dashboard/exports",
    label: "CPA export center",
    detail: "Assemble close packets, support schedules, override history, and recipient checklists for external handoff.",
  },
  {
    href: "/dashboard/automation",
    label: "Automation control surface",
    detail: "Review static workflow agents for allocation monitoring, close blockers, and reconciliation follow-up.",
  },
];

export default async function AccountingPage() {
  const workspace = await loadAccountingWorkspace();
  const accountSummary = summarizeDemoChartOfAccounts(workspace.chartOfAccounts);
  const periodSummary = summarizeDemoReportingPeriods(workspace.reportingPeriods);
  const transactionSummary = summarizeDemoTransactions(workspace.transactions);
  const currentPeriod =
    workspace.reportingPeriods.find((period) => period.status === "open" || period.status === "review") ?? workspace.reportingPeriods[0];

  return (
    <AppShell
      title="Accounting"
      description="Close, 280E review, transaction prep, and reporting period control."
    >
      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard label="Ledger accounts" value={String(accountSummary.total)} detail={`${accountSummary.active} active`} />
        <MetricCard label="Periods in motion" value={String(periodSummary.open + periodSummary.review)} detail={`${periodSummary.closed} closed, ${periodSummary.blocked} blocked`} />
        <MetricCard label="Current period" value={currentPeriod?.label ?? "No period"} detail={`${(currentPeriod?.status ?? "open").toUpperCase()} for ${workspace.company.name}`} />
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <section className="rounded-2xl border border-border bg-surface-mid p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.15em] text-accent/70">Chart of accounts</div>
              <h2 className="mt-1.5 text-lg font-semibold">Ledger</h2>
              <p className="mt-1 max-w-2xl text-sm text-text-muted/60">
                Default accounts for a vertically integrated California operator.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-muted/60">
              {workspace.company.operatorType} · {workspace.company.defaultAccountingMethod}
            </div>
          </div>
          <div className="mt-6">
            <ChartOfAccountsTable accounts={workspace.chartOfAccounts} />
          </div>
        </section>

        <div className="grid gap-5">
          <section className="rounded-2xl border border-border bg-surface-mid p-6">
            <div className="text-[11px] uppercase tracking-[0.15em] text-accent/70">Workspaces</div>
            <div className="mt-4 space-y-2.5">
              {workspaceLinks.map((item) => (
                <Link key={item.href} href={item.href} className="block rounded-2xl border border-border bg-surface px-5 py-4 transition hover:bg-surface/70">
                  <div className="text-sm font-medium text-text-primary">{item.label}</div>
                  <div className="mt-1 text-sm text-text-muted/60">{item.detail}</div>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface-mid p-6">
            <div className="text-[11px] uppercase tracking-[0.15em] text-accent/70">Entity</div>
            <h2 className="mt-2 text-lg font-semibold">{workspace.company.name}</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-text-muted">State footprint</dt>
                <dd>{workspace.company.state}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-text-muted">Locations</dt>
                <dd>{new Set(workspace.transactions.map((transaction) => transaction.location)).size || 0}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-text-muted">Licenses</dt>
                <dd>{workspace.source === "convex" ? "Seeded in Convex" : "Demo-backed"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-text-muted">Timezone</dt>
                <dd>{workspace.company.timezone}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-border bg-surface-mid p-6">
            <div className="text-[11px] uppercase tracking-[0.15em] text-accent/70">Close checklist</div>
            <ul className="mt-3 space-y-2 text-sm text-text-muted/60">
              <li>Periods with open, review, and closed states.</li>
              <li>Transactions with imported activity and suggested entries.</li>
              <li>Import-to-posted pipeline board.</li>
              <li>Month-end close dashboard.</li>
              <li>Manual journal entry with local drafts.</li>
              <li>CSV import staging with mapping profiles.</li>
            </ul>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
