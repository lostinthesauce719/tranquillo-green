"use client";

import { useState, useCallback } from "react";
import { AccountingStatusBadge } from "@/components/accounting/accounting-status-badge";
import { AiInsightsPanel, type InsightItem } from "@/components/ui/ai-insights-panel";
import { Badge } from "@/components/ui/badge";
import type { DemoAllocationReviewItem } from "@/lib/demo/accounting-operations";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function basisLabel(basis: DemoAllocationReviewItem["basis"]) {
  switch (basis) {
    case "square_footage":
      return "Square footage";
    case "labor_hours":
      return "Labor hours";
    case "revenue_mix":
      return "Revenue mix";
    case "custom_policy":
      return "Custom policy";
  }
}

function statusTone(status: DemoAllocationReviewItem["reviewStatus"]) {
  switch (status) {
    case "approved":
      return "emerald" as const;
    case "ready_for_review":
      return "blue" as const;
    case "pending_controller":
      return "violet" as const;
    case "needs_support":
      return "amber" as const;
  }
}

function priorityTone(priority: DemoAllocationReviewItem["priority"]) {
  switch (priority) {
    case "critical":
      return "rose" as const;
    case "high":
      return "amber" as const;
    case "normal":
      return "slate" as const;
  }
}

function actionLabel(action: DemoAllocationReviewItem["recommendedAction"]) {
  switch (action) {
    case "approve_split":
      return "Approve recommended split";
    case "request_support":
      return "Request support";
    case "override_policy":
      return "Override policy";
    case "route_to_controller":
      return "Route to controller";
  }
}

// Generate AI insight for a specific allocation
function buildAllocationInsight(item: DemoAllocationReviewItem): InsightItem[] {
  const insights: InsightItem[] = [];

  // Why this split?
  const total = item.deductibleAmount + item.nondeductibleAmount;
  const deductiblePct = total > 0 ? ((item.deductibleAmount / total) * 100).toFixed(1) : "0";

  insights.push({
    id: `${item.id}-why`,
    type: "explanation",
    title: `Why ${deductiblePct}% deductible?`,
    body: `The allocation engine applied ${basisLabel(item.basis)} as the cost driver using ${item.policyName}. ${item.driverLabel} = ${item.driverValue}. This splits the ${currencyFormatter.format(total)} between COGS (deductible under 280E) and non-COGS operating expenses (nondeductible).`,
    confidence: Math.round(item.confidence * 100),
    evidence: item.supportingEvidence,
    relatedEntities: [
      { type: "policy", label: item.policyName },
      { type: "basis", label: basisLabel(item.basis) ?? item.basis },
      { type: "period", label: item.periodLabel },
    ],
  });

  // Why escalated?
  if (item.reviewStatus === "pending_controller" || item.priority === "critical" || item.priority === "high") {
    insights.push({
      id: `${item.id}-escalation`,
      type: "alert",
      title: "Why this was escalated",
      body: item.confidence < 0.5
        ? `Low confidence (${Math.round(item.confidence * 100)}%) — the engine couldn't confidently match this cost to an established 280E category. Manual classification needed.`
        : item.priority === "critical"
          ? "Critical priority — this cost has significant tax impact and requires controller sign-off before close."
          : "Escalated per policy — allocation amount or cost type exceeds auto-approval thresholds.",
      confidence: Math.round(item.confidence * 100),
    });
  }

  // Recommendation
  insights.push({
    id: `${item.id}-rec`,
    type: "recommendation",
    title: actionLabel(item.recommendedAction) ?? "Review recommended",
    body: item.notes.join(" ") || "Review the allocation split and supporting evidence before taking action.",
    suggestedAction: {
      label: actionLabel(item.recommendedAction) ?? "Review",
    },
  });

  return insights;
}

type ActionState = {
  itemId: string;
  action: "approved" | "support_requested" | "overridden" | "escalated";
  timestamp: Date;
} | null;

export function AllocationReviewQueue({ items }: { items: DemoAllocationReviewItem[] }) {
  const [actionStates, setActionStates] = useState<Record<string, ActionState>>({});
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());

  const handleAction = useCallback(
    (itemId: string, action: "approved" | "support_requested" | "overridden" | "escalated") => {
      setActionStates((prev) => ({
        ...prev,
        [itemId]: { itemId, action, timestamp: new Date() },
      }));
    },
    []
  );

  const toggleInsights = useCallback((id: string) => {
    setExpandedInsights((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const total = item.deductibleAmount + item.nondeductibleAmount;
        const deductibleShare = total === 0 ? 0 : (item.deductibleAmount / total) * 100;
        const nondeductibleShare = 100 - deductibleShare;
        const actionState = actionStates[item.id];
        const showInsights = expandedInsights.has(item.id);
        const insights = buildAllocationInsight(item);

        return (
          <section key={item.id} className="rounded-2xl border border-border bg-surface-mid p-5">
            {/* Header */}
            <div className="flex flex-col gap-4 border-b border-border pb-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-accent">
                  {item.periodLabel} · {item.location}
                </div>
                <h2 className="mt-2 text-xl font-semibold">
                  {item.accountCode} · {item.accountName}
                </h2>
                <p className="mt-2 text-sm text-text-muted">
                  {item.vendor} — {item.memo}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <AccountingStatusBadge
                  label={item.reviewStatus.replaceAll("_", " ")}
                  tone={statusTone(item.reviewStatus)}
                />
                <AccountingStatusBadge
                  label={`${item.priority} priority`}
                  tone={priorityTone(item.priority)}
                />
                <AccountingStatusBadge
                  label={`${Math.round(item.confidence * 100)}% confidence`}
                  tone="slate"
                />
                {actionState && (
                  <Badge
                    variant={
                      actionState.action === "approved"
                        ? "success"
                        : actionState.action === "escalated"
                          ? "warning"
                          : "info"
                    }
                    size="sm"
                    dot
                  >
                    {actionState.action === "approved"
                      ? "Approved"
                      : actionState.action === "support_requested"
                        ? "Support requested"
                        : actionState.action === "overridden"
                          ? "Overridden"
                          : "Escalated"}
                  </Badge>
                )}
              </div>
            </div>

            {/* AI Insights toggle */}
            <button
              onClick={() => toggleInsights(item.id)}
              className="mt-3 flex items-center gap-2 text-xs font-medium text-text-muted hover:text-text-primary transition-colors"
            >
              <span>🤖</span>
              <span>{showInsights ? "Hide" : "Show"} AI explanation</span>
              <span className="text-text-faint">{showInsights ? "▾" : "▸"}</span>
            </button>

            {showInsights && (
              <div className="mt-3">
                <AiInsightsPanel
                  title=""
                  insights={insights}
                  compact
                  maxVisible={5}
                />
              </div>
            )}

            {/* Main content */}
            <div className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-surface p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-text-muted">
                      Allocation basis
                    </div>
                    <div className="mt-2 font-medium">{basisLabel(item.basis)}</div>
                    <div className="mt-1 text-sm text-text-muted">
                      {item.driverLabel}: {item.driverValue}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border bg-surface p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-text-muted">
                      Assigned reviewer
                    </div>
                    <div className="mt-2 font-medium">{item.reviewer}</div>
                    <div className="mt-1 text-sm text-text-muted">{item.dueLabel}</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-text-muted">
                    Policy + method
                  </div>
                  <div className="mt-2 font-medium">{item.policyName}</div>
                  <p className="mt-2 text-sm text-text-muted">{item.policyMethod}</p>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-text-muted">
                    Supporting evidence
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-text-muted">
                    {item.supportingEvidence.map((evidence) => (
                      <li key={evidence}>· {evidence}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="flex items-center justify-between gap-4 text-xs uppercase tracking-[0.2em] text-text-muted">
                    <span>Recommended split</span>
                    <span>{currencyFormatter.format(total)}</span>
                  </div>
                  <div className="mt-4 overflow-hidden rounded-full bg-background">
                    <div className="flex h-3">
                      <div
                        className="bg-emerald-500/70 transition-all duration-500"
                        style={{ width: `${deductibleShare}%` }}
                      />
                      <div
                        className="bg-rose-500/70 transition-all duration-500"
                        style={{ width: `${nondeductibleShare}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                        Deductible / COGS
                      </div>
                      <div className="mt-2 text-xl font-semibold text-emerald-100">
                        {currencyFormatter.format(item.deductibleAmount)}
                      </div>
                      <div className="mt-1 text-sm text-emerald-200/80">
                        {deductibleShare.toFixed(1)}% of amount
                      </div>
                    </div>
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-rose-200">
                        Nondeductible / 280E
                      </div>
                      <div className="mt-2 text-xl font-semibold text-rose-100">
                        {currencyFormatter.format(item.nondeductibleAmount)}
                      </div>
                      <div className="mt-1 text-sm text-rose-200/80">
                        {nondeductibleShare.toFixed(1)}% of amount
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-text-muted">
                    Actions
                  </div>
                  <div className="mt-3 rounded-xl border border-accent/20 bg-accent/5 px-3 py-3 text-sm text-text-primary">
                    Recommended: {actionLabel(item.recommendedAction)}
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-text-muted">
                    {item.notes.map((note) => (
                      <li key={note}>· {note}</li>
                    ))}
                  </ul>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <button
                      onClick={() => handleAction(item.id, "approved")}
                      disabled={!!actionState}
                      className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionState?.action === "approved" ? "✓ Approved" : "Approve split"}
                    </button>
                    <button
                      onClick={() => handleAction(item.id, "support_requested")}
                      disabled={!!actionState}
                      className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-text-muted hover:bg-surface-raised transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionState?.action === "support_requested" ? "✓ Requested" : "Request support"}
                    </button>
                    <button
                      onClick={() => handleAction(item.id, "overridden")}
                      disabled={!!actionState}
                      className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-text-muted hover:bg-surface-raised transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionState?.action === "overridden" ? "✓ Overridden" : "Override basis"}
                    </button>
                    <button
                      onClick={() => handleAction(item.id, "escalated")}
                      disabled={!!actionState}
                      className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-sm text-violet-100 hover:bg-violet-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionState?.action === "escalated" ? "✓ Escalated" : "Escalate reviewer"}
                    </button>
                  </div>
                  {actionState && (
                    <div className="mt-3 text-[10px] text-text-faint">
                      Action taken at {actionState.timestamp.toLocaleTimeString()} — persisted to session
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
