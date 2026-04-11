import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

// ─── 280E Allocation Monitor ─────────────────────────────────────────
// Scans cogsAllocations for low confidence or needs_review items.
// Creates complianceAlerts for any items that match.

export const checkAllocationAlerts = mutationGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const details: string[] = [];
    let alertCount = 0;

    // Find allocations needing review
    const allAllocations = await ctx.db
      .query("cogsAllocations")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    const pendingAllocations = allAllocations.filter(
      (a) => a.reviewStatus === "needs_review"
    );

    if (pendingAllocations.length > 0) {
      const title = `${pendingAllocations.length} allocation(s) need review`;
      const body = pendingAllocations
        .map((a) => {
          const confPct = a.confidence != null ? `${Math.round(a.confidence * 100)}%` : "N/A";
          return `- Deductible: $${a.deductibleAmount.toFixed(2)} | Nondeductible: $${a.nondeductibleAmount.toFixed(2)} | Confidence: ${confPct}`;
        })
        .join("\n");

      // Check if a matching unresolved alert already exists
      const existing = await ctx.db
        .query("complianceAlerts")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect();

      const hasUnresolved = existing.some(
        (a) => a.category === "allocation" && a.title === title && !a.resolvedAt
      );

      if (!hasUnresolved) {
        await ctx.db.insert("complianceAlerts", {
          companyId: args.companyId,
          category: "allocation",
          severity: "warning",
          title,
          body,
        });
        alertCount++;
        details.push(`Created alert: ${title}`);
      } else {
        details.push(`Skipped duplicate alert: ${title}`);
      }
    }

    // Find low-confidence allocations (confidence < 0.8)
    const lowConfidence = allAllocations.filter(
      (a) => a.confidence != null && a.confidence < 0.8
    );

    if (lowConfidence.length > 0) {
      const title = `${lowConfidence.length} low-confidence allocation(s) (< 80%)`;
      const body = lowConfidence
        .map((a) => {
          const confPct = `${Math.round((a.confidence ?? 0) * 100)}%`;
          return `- Deductible: $${a.deductibleAmount.toFixed(2)} | Confidence: ${confPct} | Basis: ${a.basisType}`;
        })
        .join("\n");

      const existing = await ctx.db
        .query("complianceAlerts")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect();

      const hasUnresolved = existing.some(
        (a) => a.category === "allocation" && a.title === title && !a.resolvedAt
      );

      if (!hasUnresolved) {
        await ctx.db.insert("complianceAlerts", {
          companyId: args.companyId,
          category: "allocation",
          severity: "warning",
          title,
          body,
        });
        alertCount++;
        details.push(`Created alert: ${title}`);
      } else {
        details.push(`Skipped duplicate alert: ${title}`);
      }
    }

    if (alertCount === 0) {
      details.push("No allocation alerts needed. All items are reviewed and confident.");
    }

    return {
      agentId: "agent_alloc_monitor",
      agentName: "280E allocation monitor",
      completedAt: now,
      alertCount,
      details,
      status: "success" as const,
    };
  },
});

// ─── Close Blocker Monitor ────────────────────────────────────────────
// Scans reportingPeriods for open blockers and reconciliations with open status.

export const checkCloseBlockers = mutationGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const details: string[] = [];
    let alertCount = 0;

    // Find open/review periods with blockers
    const periods = await ctx.db
      .query("reportingPeriods")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    const activePeriods = periods.filter(
      (p) => (p.status === "open" || p.status === "review") && p.blockers && p.blockers.length > 0
    );

    for (const period of activePeriods) {
      const blockerCount = period.blockers?.length ?? 0;
      const title = `${blockerCount} open blocker(s) in period "${period.label}"`;
      const body = (period.blockers ?? []).map((b) => `- ${b}`).join("\n");

      const existing = await ctx.db
        .query("complianceAlerts")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect();

      const hasUnresolved = existing.some(
        (a) =>
          a.category === "reconciliation" &&
          a.title === title &&
          !a.resolvedAt
      );

      if (!hasUnresolved) {
        await ctx.db.insert("complianceAlerts", {
          companyId: args.companyId,
          category: "reconciliation",
          severity: blockerCount > 1 ? "critical" : "warning",
          title,
          body,
        });
        alertCount++;
        details.push(`Created alert: ${title}`);
      } else {
        details.push(`Skipped duplicate: ${title}`);
      }
    }

    // Find open/investigating reconciliations
    const allRecs = await ctx.db
      .query("cashReconciliations")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    const unresolvedRecs = allRecs.filter(
      (r) => r.status === "open" || r.status === "investigating"
    );

    if (unresolvedRecs.length > 0) {
      const title = `${unresolvedRecs.length} unresolved reconciliation(s)`;
      const body = unresolvedRecs
        .map(
          (r) =>
            `- Status: ${r.status} | Variance: $${r.varianceAmount.toFixed(2)} | Expected: $${r.expectedAmount.toFixed(2)} | Actual: $${r.actualAmount.toFixed(2)}`
        )
        .join("\n");

      const existing = await ctx.db
        .query("complianceAlerts")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect();

      const hasUnresolved = existing.some(
        (a) =>
          a.category === "reconciliation" &&
          a.title === title &&
          !a.resolvedAt
      );

      if (!hasUnresolved) {
        await ctx.db.insert("complianceAlerts", {
          companyId: args.companyId,
          category: "reconciliation",
          severity: "warning",
          title,
          body,
        });
        alertCount++;
        details.push(`Created alert: ${title}`);
      } else {
        details.push(`Skipped duplicate: ${title}`);
      }
    }

    if (alertCount === 0) {
      details.push("No close blockers found. Periods and reconciliations are clean.");
    }

    return {
      agentId: "agent_close_monitor",
      agentName: "Close blocker monitor",
      completedAt: now,
      alertCount,
      details,
      status: "success" as const,
    };
  },
});

// ─── Reconciliation Follow-up Agent ──────────────────────────────────
// Scans cashReconciliations for unresolved variances and pending actions.

export const checkReconciliationVariances = mutationGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const details: string[] = [];
    let alertCount = 0;

    // Find reconciliations with non-zero variance that are not resolved
    const allRecs = await ctx.db
      .query("cashReconciliations")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    const unresolvedVariances = allRecs.filter(
      (r) => r.status !== "resolved" && r.varianceAmount !== 0
    );

    if (unresolvedVariances.length > 0) {
      const title = `${unresolvedVariances.length} reconciliation(s) with unresolved variances`;
      const body = unresolvedVariances
        .map((r) => {
          const owner = r.owner ?? "Unassigned";
          const actionCount = r.actions?.filter((a) => a.status !== "done").length ?? 0;
          return `- Variance: $${r.varianceAmount.toFixed(2)} | Owner: ${owner} | Pending actions: ${actionCount} | Status: ${r.status}`;
        })
        .join("\n");

      const existing = await ctx.db
        .query("complianceAlerts")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect();

      const hasUnresolved = existing.some(
        (a) =>
          a.category === "reconciliation" &&
          a.title === title &&
          !a.resolvedAt
      );

      if (!hasUnresolved) {
        await ctx.db.insert("complianceAlerts", {
          companyId: args.companyId,
          category: "reconciliation",
          severity: "warning",
          title,
          body,
        });
        alertCount++;
        details.push(`Created alert: ${title}`);
      } else {
        details.push(`Skipped duplicate: ${title}`);
      }
    }

    // Find reconciliations with pending todo actions
    const withPendingActions = allRecs.filter(
      (r) => r.actions && r.actions.some((a) => a.status === "todo")
    );

    if (withPendingActions.length > 0) {
      const title = `${withPendingActions.length} reconciliation(s) with pending follow-up actions`;
      const body = withPendingActions
        .map((r) => {
          const todoActions = r.actions?.filter((a) => a.status === "todo") ?? [];
          const actionList = todoActions.map((a) => `  * ${a.title} (${a.owner})`).join("\n");
          return `- Rec variance $${r.varianceAmount.toFixed(2)}:\n${actionList}`;
        })
        .join("\n");

      const existing = await ctx.db
        .query("complianceAlerts")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect();

      const hasUnresolved = existing.some(
        (a) =>
          a.category === "reconciliation" &&
          a.title === title &&
          !a.resolvedAt
      );

      if (!hasUnresolved) {
        await ctx.db.insert("complianceAlerts", {
          companyId: args.companyId,
          category: "reconciliation",
          severity: "info",
          title,
          body,
        });
        alertCount++;
        details.push(`Created alert: ${title}`);
      } else {
        details.push(`Skipped duplicate: ${title}`);
      }
    }

    if (alertCount === 0) {
      details.push("No reconciliation variances or pending actions found.");
    }

    return {
      agentId: "agent_rec_followup",
      agentName: "Reconciliation follow-up agent",
      completedAt: now,
      alertCount,
      details,
      status: "success" as const,
    };
  },
});

// ─── Query: get alert summary per agent category ──────────────────────

export const getAgentStatuses = queryGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
  },
  handler: async (ctx, args) => {
    const alerts = await ctx.db
      .query("complianceAlerts")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    const unresolved = alerts.filter((a) => !a.resolvedAt);

    const allocationAlerts = unresolved.filter((a) => a.category === "allocation").length;
    const reconciliationAlerts = unresolved.filter((a) => a.category === "reconciliation").length;

    return {
      totalUnresolvedAlerts: unresolved.length,
      allocationAlerts,
      reconciliationAlerts,
      alerts: unresolved.map((a) => ({
        _id: a._id,
        category: a.category,
        severity: a.severity,
        title: a.title,
        body: a.body,
      })),
    };
  },
});
