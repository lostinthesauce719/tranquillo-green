import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { ChartOfAccountsTable } from "@/components/accounting/chart-of-accounts-table";
import { LiveMetricCard } from "@/components/ui/live-metric-card";
import { StaggerContainer } from "@/components/ui/stagger-container";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { PulseDot } from "@/components/ui/pulse-dot";
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

  const isLive = workspace.source === "convex";

  return (
    <AppShell
      title="Accounting"
      description={`California-first accounting workspace for close, 280E review, transaction prep, and reporting period control. Rendering from ${workspace.source === "convex" ? "persisted Convex accounting data" : "demo fallback data"} so static builds stay safe while the backend path matures.`}
    >
      <StaggerContainer className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <LiveMetricCard label="Ledger accounts" value={accountSummary.total} detail={`${accountSummary.active} active, ${accountSummary.inactive} inactive`} dotColor={isLive ? "green" : undefined} />
        <LiveMetricCard label="Periods in motion" value={periodSummary.open + periodSummary.review} detail={`${periodSummary.closed} closed and ${periodSummary.blocked} currently blocked`} dotColor={isLive ? "green" : undefined} />
        <LiveMetricCard label="Manual entry queue" value={transactionSummary.manualQueue} detail={`${transactionSummary.needsMapping} transactions still need mapping review`} dotColor={transactionSummary.needsMapping > 0 ? "amber" : "green"} />
        <div className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Current period</div>
          <div className="mt-3 flex items-center text-3xl font-semibold">
            <span>{currentPeriod?.label ?? "No period"}</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-text-muted">
            {isLive && <PulseDot color="green" size="sm" />}
            {(currentPeriod?.status ?? "open").toUpperCase()} close for {workspace.company.name}
          </div>
        </div>
      </StaggerContainer>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-accent">{workspace.source === "convex" ? "Persisted Convex source" : "Demo fallback source"}</div>
              <h2 className="mt-2 text-xl font-semibold">Chart of accounts</h2>
              <p className="mt-2 max-w-2xl text-sm text-text-muted">
                Realistic default ledger for a vertically integrated California operator. The route now prefers persisted Convex data on the server and falls back to demo records when runtime config is unavailable.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-muted">
              {workspace.company.operatorType} operator • {workspace.company.defaultAccountingMethod} basis
            </div>
          </div>
          <div className="mt-5">
            <ChartOfAccountsTable accounts={workspace.chartOfAccounts} />
          </div>
        </section>

        <div className="grid gap-4">
          <section className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Workspace entry points</div>
            <StaggerContainer className="mt-4 grid gap-3" staggerMs={60} baseDelayMs={50}>
              {workspaceLinks.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-2xl border border-border bg-surface px-4 py-4 transition hover:bg-surface/70">
                  <div className="font-medium text-text-primary">{item.label}</div>
                  <div className="mt-2 text-sm text-text-muted">{item.detail}</div>
                </Link>
              ))}
            </StaggerContainer>
          </section>

          <section className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Entity snapshot</div>
            <h2 className="mt-2 text-lg font-semibold">{workspace.company.name}</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-text-muted">State footprint</dt>
                <dd>{workspace.company.state}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-text-muted">Locations</dt>
                <dd><AnimatedCounter value={new Set((workspace.transactions ?? []).map((transaction) => transaction.location)).size || 0} /></dd>
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

          <section className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Close checklist alignment</div>
            <ul className="mt-3 space-y-3 text-sm text-text-muted">
              <li>• Reporting periods now show open, review, and closed states with checklist progress and blockers.</li>
              <li>• Transactions table includes imported activity, suggested entry codes, and receipt follow-up flags.</li>
              <li>• New imported-to-posted pipeline board shows staged handoff from import validation into reviewer and posting lanes.</li>
              <li>• New month-end close dashboard connects periods, imports, posting, reconciliations, allocations, and support schedule readiness.</li>
              <li>• Manual journal entry flow now restores working drafts and keeps a recent local draft list.</li>
              <li>• CSV import staging adds mapping profiles, required-field validation, and row-level preview without backend jobs.</li>
              <li>• Static-safe demo data still mirrors companies, locations, licenses, accounts, periods, and transaction prep.</li>
            </ul>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
