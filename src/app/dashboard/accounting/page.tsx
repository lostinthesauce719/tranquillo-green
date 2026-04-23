import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { MetricCard } from "@/components/ui/metric-card";
import { AccountVisualizer } from "@/components/accounting/account-visualizer";
import { LocationMapPane } from "@/components/ui/location-map-pane";
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
    href: "/dashboard/allocations/cogs-review",
    label: "COGS intelligence",
    detail: "Review every shiftable expense category, dollar impact, IRS risk, and IRC 263A absorption guidance for 280E survival.",
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

      <div className="mt-8 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        {/* Main Data Visualizer Panel */}
        <section className="rounded-[32px] border border-emerald-500/20 bg-white/5 p-6 backdrop-blur-md overflow-hidden relative shadow-lg">
          <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-emerald-500/10 blur-[80px]"></div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between relative z-10">
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-200/70">Chart of Accounts</div>
              <h2 className="mt-2 text-2xl font-serif text-white glowing-mint-text">Ledger Visualizer</h2>
              <p className="mt-1 max-w-2xl text-xs text-text-faint">
                Real-time topological breakdown of ledger distribution and 280E configuration for {workspace.company.name}.
              </p>
            </div>
            <div className="rounded-full border border-emerald-500/30 bg-emerald-900/40 px-4 py-2 text-[10px] uppercase tracking-wider text-emerald-100 shadow-glow backdrop-blur-sm">
              {workspace.company.operatorType} · {workspace.company.defaultAccountingMethod}
            </div>
          </div>
          
          <div className="mt-12">
            <AccountVisualizer accounts={workspace.chartOfAccounts} />
          </div>
        </section>

        <div className="flex flex-col gap-5">
          <LocationMapPane companyName={workspace.company.name} state={workspace.company.state} />

          <section className="flex-1 rounded-[24px] border border-emerald-500/20 bg-white/5 p-6 backdrop-blur-md">
            <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-200/70">Workspaces</div>
            <div className="mt-5 space-y-3">
              {workspaceLinks.map((item) => (
                <Link key={item.href} href={item.href} className="group block rounded-2xl border border-emerald-500/10 bg-white/5 px-5 py-4 transition-tranquil hover:bg-emerald-500/10 hover:border-emerald-400/30">
                  <div className="text-sm font-semibold text-white group-hover:glowing-mint-text">{item.label}</div>
                  <div className="mt-1.5 text-xs leading-relaxed text-text-faint">{item.detail}</div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
