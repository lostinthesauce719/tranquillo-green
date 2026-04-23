import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { LiveMetricCard } from "@/components/ui/live-metric-card";
import { StaggerContainer } from "@/components/ui/stagger-container";
import { ActivityFeed, type ActivityItem } from "@/components/ui/activity-feed";
import { AiInsightsPanel, type InsightItem } from "@/components/ui/ai-insights-panel";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Badge } from "@/components/ui/badge";
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
