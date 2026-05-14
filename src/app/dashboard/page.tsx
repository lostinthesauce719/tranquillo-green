import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { LiveMetricCard } from "@/components/ui/live-metric-card";
import { StaggerContainer } from "@/components/ui/stagger-container";
import { ActivityFeed, type ActivityItem } from "@/components/ui/activity-feed";
import { AiInsightsPanel, type InsightItem } from "@/components/ui/ai-insights-panel";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import {
  CalendarCheck,
  Upload,
  PieChart,
  RefreshCw,
} from "lucide-react";
import {
  demoAllocationReviewQueue,
  demoCashReconciliations,
  getFeaturedCashReconciliationHref,
  summarizeAllocationQueue,
  summarizeCashReconciliations,
} from "@/lib/demo/accounting-operations";
import { demoTransactions } from "@/lib/demo/accounting";
import { loadAutomationWorkspace } from "@/lib/data/automation";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

// ── Revenue vs COGS demo data (6 months, cannabis dispensary) ──
interface MonthlyData {
  month: string;
  shortMonth: string;
  revenue: number;
  cogs: number;
  revenueChange: number | null; // % change vs prior month
  cogsChange: number | null;
}

const revenueCogsData: MonthlyData[] = (() => {
  const months = [
    { label: "Nov 2025", short: "Nov" },
    { label: "Dec 2025", short: "Dec" },
    { label: "Jan 2026", short: "Jan" },
    { label: "Feb 2026", short: "Feb" },
    { label: "Mar 2026", short: "Mar" },
    { label: "Apr 2026", short: "Apr" },
  ];
  // Base revenue: $185K in Nov, growing 5-8% MoM
  const revenues = [185000, 196100, 207900, 220400, 235800, 252300];
  // COGS as % of revenue: 48%, 52%, 47%, 50%, 46%, 45%
  const cogsPct = [0.48, 0.52, 0.47, 0.50, 0.46, 0.45];

  return months.map((m, i) => {
    const revenue = revenues[i];
    const cogs = Math.round(revenue * cogsPct[i]);
    const revenueChange = i > 0 ? ((revenue - revenues[i - 1]) / revenues[i - 1]) * 100 : null;
    const cogsChange = i > 0 ? ((cogs - Math.round(revenues[i - 1] * cogsPct[i - 1])) / Math.round(revenues[i - 1] * cogsPct[i - 1])) * 100 : null;
    return { month: m.label, shortMonth: m.short, revenue, cogs, revenueChange, cogsChange };
  });
})();

const maxRevenue = Math.max(...revenueCogsData.map((d) => d.revenue));

// 280E tax savings estimate for current month (Apr 2026)
// Under 280E, only COGS is deductible. The "savings" is the tax benefit
// of properly allocating costs vs being forced to use a flat disallowance.
const currentMonth = revenueCogsData[revenueCogsData.length - 1];
const effectiveTaxRate = 0.21; // federal corporate rate
const stateTaxRate = 0.098; // CA corporate rate
const totalTaxRate = effectiveTaxRate + stateTaxRate;
const taxSavings280E = Math.round(currentMonth.cogs * totalTaxRate);

// Build recent activity from real data sources
function buildRecentActivity(): ActivityItem[] {
  const items: ActivityItem[] = [];

  // From allocation queue
  const pendingController = demoAllocationReviewQueue.filter((a) => a.reviewStatus === "pending_controller");
  if (pendingController.length > 0) {
    items.push({
      id: items.length + 1,
      time: "2 min ago",
      actor: "Allocation Engine",
      action: `${pendingController.length} allocation${pendingController.length > 1 ? "s" : ""} escalated to controller review — ${pendingController[0].accountName} flagged for unusual cost patterns`,
      color: "var(--warning)",
    });
  }

  const approved = demoAllocationReviewQueue.filter((a) => a.reviewStatus === "approved");
  if (approved.length > 0) {
    items.push({
      id: items.length + 1,
      time: "12 min ago",
      actor: "Controller",
      action: `approved ${approved.length} high-confidence allocation split${approved.length > 1 ? "s" : ""} (${approved[0].accountName})`,
      color: "var(--success)",
    });
  }

  // From cash reconciliations
  const investigating = demoCashReconciliations.filter((r) => r.status === "investigating");
  if (investigating.length > 0) {
    items.push({
      id: items.length + 1,
      time: "25 min ago",
      actor: "System",
      action: `flagged ${investigating.length} cash workspace${investigating.length > 1 ? "s" : ""} for variance investigation (${investigating[0].accountName})`,
      color: "var(--warning)",
    });
  }

  const balanced = demoCashReconciliations.filter((r) => r.status === "balanced");
  if (balanced.length > 0) {
    items.push({
      id: items.length + 1,
      time: "1 hr ago",
      actor: "Reviewer",
      action: `signed off on ${balanced.length} balanced reconciliation${balanced.length > 1 ? "s" : ""}`,
      color: "var(--brand)",
    });
  }

  // From transactions
  const inReview = demoTransactions.filter((t) => t.status === "in_review" || t.status === "ready_to_post");
  if (inReview.length > 0) {
    items.push({
      id: items.length + 1,
      time: "3 hrs ago",
      actor: "Import Pipeline",
      action: `${inReview.length} transaction${inReview.length > 1 ? "s" : ""} pending review — bank feed imported`,
      color: "var(--info)",
    });
  }

  items.push({
    id: items.length + 1,
    time: "5 hrs ago",
    actor: "Controller",
    action: "locked reporting period for March 2026",
    color: "var(--violet)",
  });

  return items;
}

// Generate contextual AI insights for the overview
function buildDashboardInsights(): InsightItem[] {
  const insights: InsightItem[] = [];
  const allocationSummary = summarizeAllocationQueue(demoAllocationReviewQueue);
  const reconciliationSummary = summarizeCashReconciliations(demoCashReconciliations);

  // Allocation queue insight
  if (allocationSummary.pendingController > 0) {
    insights.push({
      id: "insight-alloc-escalated",
      type: "alert",
      title: "Escalated allocations need attention",
      body: `${allocationSummary.pendingController} allocation${allocationSummary.pendingController > 1 ? "s" : ""} escalated to controller review. The allocation engine detected unusual cost patterns that don't match standard 280E categories — these require manual judgment on deductibility classification.`,
      confidence: 42,
      evidence: [
        "Cost basis variance exceeds 15% threshold for category",
        "No matching policy rule for the expense type",
        "Similar items were overridden in prior periods",
      ],
      relatedEntities: [
        { type: "queue", label: "Allocation Queue", href: "/dashboard/allocations" },
        { type: "history", label: "Override History", href: "/dashboard/allocations/history" },
      ],
      suggestedAction: {
        label: "Review escalated allocations",
      },
    });
  }

  // High-confidence auto-approval insight
  if (allocationSummary.ready > 0) {
    insights.push({
      id: "insight-alloc-ready",
      type: "recommendation",
      title: `${allocationSummary.ready} allocations ready for auto-approval`,
      body: "These allocations have 90%+ confidence and match established 280E policy rules. Batch approval is safe per your allocation policy — all items have matching precedent from prior closed periods.",
      confidence: 91,
      evidence: [
        "All items match POL-280E-01 through POL-280E-04",
        "Cost basis within 5% of historical average",
        "No prior overrides on similar items",
      ],
      relatedEntities: [
        { type: "queue", label: "Review Queue", href: "/dashboard/allocations" },
      ],
      suggestedAction: {
        label: "Approve all high-confidence items",
      },
    });
  }

  // Cash variance insight
  if (reconciliationSummary.investigating > 0) {
    insights.push({
      id: "insight-cash-variance",
      type: "explanation",
      title: "Cash variance investigation",
      body: `${reconciliationSummary.investigating} workspace${reconciliationSummary.investigating > 1 ? "s" : ""} with open variance investigations. The primary driver is a $1,200 deposit timing difference — posted on the 31st per the books but showing the 1st at the bank. This is standard period-end timing and will reconcile next period.`,
      confidence: 87,
      evidence: [
        "SVB clearing account: $1,200 deposit date mismatch",
        "Oakland drawer: $47.20 over (likely unrecorded tips)",
        "All variances within operator tolerance thresholds",
      ],
      relatedEntities: [
        { type: "reconciliation", label: "Cash Reconciliations", href: "/dashboard/reconciliations" },
      ],
    });
  }

  // Close readiness insight
  insights.push({
    id: "insight-close-readiness",
    type: "context",
    title: "Month-end close status",
    body: "February 2026 is locked. March 2026 is in review — 4 of 6 close areas complete. Remaining: inventory reconciliation (pending Metrc sync) and allocation override review. Estimated 2 hours to close once escalated items are resolved.",
    confidence: 95,
    relatedEntities: [
      { type: "close", label: "Close Dashboard", href: "/dashboard/accounting/close" },
      { type: "periods", label: "Reporting Periods", href: "/dashboard/accounting/periods" },
    ],
  });

  // Filing deadline insight
  insights.push({
    id: "insight-filings",
    type: "alert",
    title: "Upcoming CA filing deadlines",
    body: "California Excise Tax return due in 9 days (estimated $12,400). CA Sales Tax return due in 16 days. CDTFA account is in good standing. Excise return worksheet can be drafted from the compliance page.",
    confidence: 98,
    relatedEntities: [
      { type: "compliance", label: "Compliance", href: "/dashboard/compliance" },
      { type: "exports", label: "CPA Export", href: "/dashboard/exports" },
    ],
    suggestedAction: {
      label: "Draft excise return worksheet",
    },
  });

  return insights;
}

export default async function DashboardPage() {
  const allocationSummary = summarizeAllocationQueue(demoAllocationReviewQueue);
  const reconciliationSummary = summarizeCashReconciliations(demoCashReconciliations);
  const featuredReconciliationHref = getFeaturedCashReconciliationHref(demoCashReconciliations);
  const recentActivity = buildRecentActivity();
  const dashboardInsights = buildDashboardInsights();

  // Load automation status
  let automationAlerts = 0;
  try {
    const automation = await loadAutomationWorkspace("demo-dispensary");
    automationAlerts = automation.alertSummary.totalUnresolvedAlerts;
  } catch {
    // Fallback — demo mode
    automationAlerts = 2;
  }

  const totalQueueItems =
    allocationSummary.ready +
    allocationSummary.needsSupport +
    allocationSummary.pendingController;

  return (
    <AppShell
      title="Overview"
      description="Your accounting command center — allocation queue, cash health, close status, and upcoming deadlines."
    >
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Overview" }]}
        className="mb-4"
      />

      {/* Health banner */}
      <div className="mb-6 rounded-2xl border border-brand/20 bg-brand/5 p-4 flex items-center gap-3">
        <span className="text-lg">🌿</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary">System Health</span>
            <Badge variant={automationAlerts > 0 ? "warning" : "success"} size="sm" dot>
              {automationAlerts > 0 ? `${automationAlerts} alerts` : "All clear"}
            </Badge>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            {automationAlerts > 0
              ? `${automationAlerts} unresolved automation alert${automationAlerts > 1 ? "s" : ""} — allocation monitors and reconciliation follow-ups active`
              : "All automation agents healthy. No blockers detected."}
          </p>
        </div>
        <Link
          href="/dashboard/automation"
          className="text-xs font-medium text-brand hover:text-brand/80 transition-colors"
        >
          View agents →
        </Link>
      </div>

      {/* Quick actions */}
      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Link
          href="/dashboard/accounting/close"
          className="group relative flex flex-col gap-1 rounded-xl border border-border bg-surface-mid p-4 transition-all duration-200 hover:border-brand/40 hover:bg-surface-raised hover:shadow-lg hover:shadow-brand/5"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand transition-colors group-hover:bg-brand/20">
              <CalendarCheck className="h-4.5 w-4.5" />
            </span>
            <span className="text-sm font-semibold text-text-primary group-hover:text-brand transition-colors">Start Close</span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed pl-[46px]">
            Month-end close workflow — lock periods, review checklists.
          </p>
        </Link>
        <Link
          href="/dashboard/accounting/imports"
          className="group relative flex flex-col gap-1 rounded-xl border border-border bg-surface-mid p-4 transition-all duration-200 hover:border-brand/40 hover:bg-surface-raised hover:shadow-lg hover:shadow-brand/5"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors group-hover:bg-accent/20">
              <Upload className="h-4.5 w-4.5" />
            </span>
            <span className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">Upload Import</span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed pl-[46px]">
            CSV bank feeds, receipts, and bulk transaction imports.
          </p>
        </Link>
        <Link
          href="/dashboard/allocations"
          className="group relative flex flex-col gap-1 rounded-xl border border-border bg-surface-mid p-4 transition-all duration-200 hover:border-brand/40 hover:bg-surface-raised hover:shadow-lg hover:shadow-brand/5"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet/10 text-violet transition-colors group-hover:bg-violet/20">
              <PieChart className="h-4.5 w-4.5" />
            </span>
            <span className="text-sm font-semibold text-text-primary group-hover:text-violet transition-colors">Run Allocations</span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed pl-[46px]">
            Review 280E splits, approve queue, and publish results.
          </p>
        </Link>
        <Link
          href="/dashboard/inventory"
          className="group relative flex flex-col gap-1 rounded-xl border border-border bg-surface-mid p-4 transition-all duration-200 hover:border-brand/40 hover:bg-surface-raised hover:shadow-lg hover:shadow-brand/5"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 text-success transition-colors group-hover:bg-success/20">
              <RefreshCw className="h-4.5 w-4.5" />
            </span>
            <span className="text-sm font-semibold text-text-primary group-hover:text-success transition-colors">Sync Metrc</span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed pl-[46px]">
            Pull latest packages, transfers, and harvest data.
          </p>
        </Link>
      </div>

      {/* Key metrics */}
      <StaggerContainer className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <LiveMetricCard
          label="Allocation queue"
          value={totalQueueItems}
          detail={`${allocationSummary.approved} approved · ${allocationSummary.pendingController} escalated`}
        />
        <LiveMetricCard
          label="Unreconciled cash"
          value={reconciliationSummary.absoluteVariance}
          detail={`${reconciliationSummary.investigating + reconciliationSummary.exception} workspaces need follow-up`}
          prefix="$"
        />
        <LiveMetricCard
          label="Inventory drift"
          value={3.1}
          detail="Book vs package-level mismatch — within tolerance"
          suffix="%"
          decimals={1}
        />
        <LiveMetricCard
          label="Upcoming filings"
          value={2}
          detail="CA excise + sales tax due within 16 days"
        />
      </StaggerContainer>

      {/* Revenue vs COGS Trend */}
      <section className="mt-6 rounded-2xl border border-border bg-surface-mid p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Revenue vs COGS Trend</div>
            <p className="mt-1 text-sm text-text-muted">
              Last 6 months — monthly comparison with period-over-period change.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-brand" />
              <span className="text-xs text-text-muted">Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-accent" />
              <span className="text-xs text-text-muted">COGS</span>
            </div>
          </div>
        </div>

        {/* Bar chart */}
        <div className="mt-5">
          <div className="flex items-end gap-3 sm:gap-5" style={{ minHeight: 200 }}>
            {revenueCogsData.map((d, i) => {
              const revenueHeight = (d.revenue / maxRevenue) * 180;
              const cogsHeight = (d.cogs / maxRevenue) * 180;
              const isCurrent = i === revenueCogsData.length - 1;
              return (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                  {/* Change indicators */}
                  <div className="flex items-center gap-1 text-[10px] leading-none h-4">
                    {d.revenueChange !== null && (
                      <span className={d.revenueChange >= 0 ? "text-success" : "text-danger"}>
                        {d.revenueChange >= 0 ? "↑" : "↓"}{Math.abs(d.revenueChange).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] leading-none h-3">
                    {d.cogsChange !== null && (
                      <span className={d.cogsChange <= 0 ? "text-success" : "text-warning"}>
                        {d.cogsChange >= 0 ? "↑" : "↓"}{Math.abs(d.cogsChange).toFixed(1)}%
                      </span>
                    )}
                  </div>

                  {/* Bars */}
                  <div className="flex items-end gap-1" style={{ height: 180 }}>
                    <div
                      className="w-4 sm:w-6 rounded-t-sm transition-all duration-500"
                      style={{
                        height: revenueHeight,
                        backgroundColor: isCurrent ? "var(--brand)" : "rgba(34, 133, 90, 0.45)",
                        boxShadow: isCurrent ? "0 0 12px rgba(34, 133, 90, 0.3)" : "none",
                      }}
                      title={`Revenue: ${currencyFormatter.format(d.revenue)}`}
                    />
                    <div
                      className="w-4 sm:w-6 rounded-t-sm transition-all duration-500"
                      style={{
                        height: cogsHeight,
                        backgroundColor: isCurrent ? "var(--accent)" : "rgba(212, 146, 42, 0.45)",
                        boxShadow: isCurrent ? "0 0 12px rgba(212, 146, 42, 0.3)" : "none",
                      }}
                      title={`COGS: ${currencyFormatter.format(d.cogs)}`}
                    />
                  </div>

                  {/* Month label */}
                  <span className={`mt-2 text-[10px] sm:text-xs ${isCurrent ? "text-text-primary font-medium" : "text-text-muted"}`}>
                    {d.shortMonth}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current month detail row */}
        <div className="mt-5 pt-4 border-t border-border-subtle grid gap-3 sm:grid-cols-3">
          <div>
            <div className="text-xs text-text-muted">Current month revenue</div>
            <div className="mt-0.5 text-lg font-medium text-text-primary">
              {currencyFormatter.format(currentMonth.revenue)}
            </div>
            {currentMonth.revenueChange !== null && (
              <div className={`text-xs mt-0.5 ${currentMonth.revenueChange >= 0 ? "text-success" : "text-danger"}`}>
                {currentMonth.revenueChange >= 0 ? "↑" : "↓"} {Math.abs(currentMonth.revenueChange).toFixed(1)}% vs prior month
              </div>
            )}
          </div>
          <div>
            <div className="text-xs text-text-muted">Current month COGS</div>
            <div className="mt-0.5 text-lg font-medium text-text-primary">
              {currencyFormatter.format(currentMonth.cogs)}
            </div>
            <div className="text-xs text-text-muted mt-0.5">
              {((currentMonth.cogs / currentMonth.revenue) * 100).toFixed(1)}% of revenue
            </div>
          </div>
          <div>
            <div className="text-xs text-text-muted">Est. 280E tax savings</div>
            <div className="mt-0.5 text-lg font-medium text-success">
              {currencyFormatter.format(taxSavings280E)}
            </div>
            <div className="text-xs text-text-muted mt-0.5">
              Based on deductible COGS at ~{(totalTaxRate * 100).toFixed(1)}% effective rate
            </div>
          </div>
        </div>
      </section>

      {/* Insights */}
      <div className="mt-6">
        <AiInsightsPanel
          title="Insights"
          subtitle="Based on current data"
          insights={dashboardInsights}
          maxVisible={4}
        />
      </div>

      {/* Quick access workspaces */}
      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Link
          href="/dashboard/allocations"
          className="group rounded-2xl border border-border bg-surface-mid p-5 transition hover:bg-surface/70 hover:border-brand/30"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">280E Allocations</div>
            <span className="text-xs text-text-faint group-hover:text-brand transition-colors">→</span>
          </div>
          <div className="mt-2 font-medium">{totalQueueItems} items in queue</div>
          <div className="mt-1 text-sm text-text-muted">
            Review splits, overrides, and policy trail. {allocationSummary.pendingController} escalated.
          </div>
        </Link>
        <Link
          href={featuredReconciliationHref}
          className="group rounded-2xl border border-border bg-surface-mid p-5 transition hover:bg-surface/70 hover:border-brand/30"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Cash Reconciliation</div>
            <span className="text-xs text-text-faint group-hover:text-brand transition-colors">→</span>
          </div>
          <div className="mt-2 font-medium">Variance: ${reconciliationSummary.absoluteVariance}</div>
          <div className="mt-1 text-sm text-text-muted">
            Source breakdown, variance drivers, and investigation notes.
          </div>
        </Link>
        <Link
          href="/dashboard/exports"
          className="group rounded-2xl border border-violet-500/20 bg-violet-500/10 p-5 transition hover:bg-violet-500/20"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-[0.2em] text-violet-200">CPA Handoff</div>
            <span className="text-xs text-violet-200/50 group-hover:text-violet-200 transition-colors">→</span>
          </div>
          <div className="mt-2 font-medium text-violet-100">Export center</div>
          <div className="mt-1 text-sm text-violet-100/80">
            Build close packets, 280E support schedules, and handoff checklists.
          </div>
        </Link>
      </div>

      {/* Recent activity — derived from actual data */}
      <section className="mt-6 rounded-2xl border border-border bg-surface-mid p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Recent activity</div>
            <p className="mt-1 text-sm text-text-muted">
              Latest events across your accounting workspace.
            </p>
          </div>
          <Link
            href="/dashboard/exports"
            className="text-xs font-medium text-text-faint hover:text-text-secondary transition-colors"
          >
            Full audit trail →
          </Link>
        </div>
        <div className="mt-4">
          <ActivityFeed items={recentActivity} maxItems={5} />
        </div>
      </section>
    </AppShell>
  );
}
