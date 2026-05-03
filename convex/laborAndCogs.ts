// @ts-nocheck
import { authMutation, authQuery, requireCompanyAccessById } from "./lib/withAuth";
import { v } from "convex/values";

// ─── LABOR TIME TRACKING ──────────────────────────────────────────

// Record a labor time entry
export const recordTimeEntry = authMutation({
  args: {
    companyId: v.id("cannabisCompanies"),
    employeeName: v.string(),
    employeeId: v.optional(v.string()),
    locationId: v.optional(v.id("cannabisLocations")),
    workDate: v.string(),
    activities: v.array(v.object({
      category: v.string(),
      hours: v.number(),
      description: v.optional(v.string()),
      isProduction: v.boolean(),
    })),
    source: v.union(v.literal("manual"), v.literal("gusto_import"), v.literal("deputy"), v.literal("tanda")),
    externalRef: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
}, async (ctx, args, identity) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);
    const now = Date.now();

    // Calculate totals
    const totalHours = args.activities.reduce((sum: number, a: any) => sum + a.hours, 0);
    const productionHours = args.activities
      .filter((a: any) => a.isProduction)
      .reduce((sum: number, a: any) => sum + a.hours, 0);
    const nonProductionHours = totalHours - productionHours;
    const productionRatio = totalHours > 0 ? productionHours / totalHours : 0;

    const entryId = await ctx.db.insert("laborTimeEntries", {
      ...args,
      totalHours,
      productionHours,
      nonProductionHours,
      productionRatio,
      reviewStatus: "submitted",
      createdAt: now,
      updatedAt: now,
    });

    return { entryId, totalHours, productionHours, nonProductionHours, productionRatio };
  },
);

// Get time entries for a company
export const getTimeEntries = authQuery({
  args: {
    companyId: v.id("cannabisCompanies"),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    employeeName: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("submitted"), v.literal("approved"), v.literal("flagged"))),
  },
}, async (ctx, args, identity) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);
    let query = ctx.db.query("laborTimeEntries")
      .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId));

    const entries = await query.collect();

    // Filter in memory for optional params
    return entries.filter((e: any) => {
      if (args.startDate && e.workDate < args.startDate) return false;
      if (args.endDate && e.workDate > args.endDate) return false;
      if (args.employeeName && e.employeeName !== args.employeeName) return false;
      if (args.status && e.reviewStatus !== args.status) return false;
      return true;
    });
  },
);

// Get labor allocation summary for a period
export const getLaborAllocationSummary = authQuery({
  args: {
    companyId: v.id("cannabisCompanies"),
    startDate: v.string(),
    endDate: v.string(),
  },
}, async (ctx, args, identity) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);
    const entries = await ctx.db.query("laborTimeEntries")
      .withIndex("by_company_date", (q: any) =>
        q.eq("companyId", args.companyId)
          .gte("workDate", args.startDate)
          .lte("workDate", args.endDate)
      )
      .collect();

    // Aggregate by activity category
    const byCategory: Record<string, { hours: number; isProduction: boolean; entries: number }> = {};
    let totalHours = 0;
    let totalProductionHours = 0;
    let totalNonProductionHours = 0;
    const employees = new Set<string>();

    for (const entry of entries) {
      totalHours += entry.totalHours;
      totalProductionHours += entry.productionHours;
      totalNonProductionHours += entry.nonProductionHours;
      employees.add(entry.employeeName);

      for (const activity of entry.activities) {
        if (!byCategory[activity.category]) {
          byCategory[activity.category] = { hours: 0, isProduction: activity.isProduction, entries: 0 };
        }
        byCategory[activity.category].hours += activity.hours;
        byCategory[activity.category].entries++;
      }
    }

    const productionRatio = totalHours > 0 ? totalProductionHours / totalHours : 0;

    return {
      period: { startDate: args.startDate, endDate: args.endDate },
      totalHours,
      totalProductionHours,
      totalNonProductionHours,
      productionRatio,
      employeeCount: employees.size,
      entryCount: entries.length,
      byCategory,
    };
  },
);

// Approve time entries
export const approveTimeEntries = authMutation({
  args: {
    companyId: v.id("cannabisCompanies"),
    entryIds: v.array(v.id("laborTimeEntries")),
    reviewedBy: v.string(),
  },
}, async (ctx, args, identity) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);
    const now = Date.now();
    let approved = 0;

    for (const entryId of args.entryIds) {
      const entry = await ctx.db.get(entryId);
      if (entry && entry.companyId === args.companyId) {
        await ctx.db.patch(entryId, {
          reviewStatus: "approved",
          reviewedBy: args.reviewedBy,
          reviewedAt: now,
          updatedAt: now,
        });
        approved++;
      }
    }

    return { approved };
  },
);

// ─── PRODUCTION COST QUALIFICATIONS ───────────────────────────────

// Classify a cost category
export const classifyCostCategory = authMutation({
  args: {
    companyId: v.id("cannabisCompanies"),
    costCategory: v.string(),
    costName: v.string(),
    classification: v.union(
      v.literal("direct_production"),
      v.literal("indirect_production"),
      v.literal("non_production"),
      v.literal("mixed"),
      v.literal("pending_review"),
    ),
    qualificationFactors: v.array(v.object({
      factor: v.string(),
      weight: v.number(),
      evidence: v.string(),
    })),
    allocationMethod: v.optional(v.union(
      v.literal("square_footage"),
      v.literal("labor_hours"),
      v.literal("revenue_mix"),
      v.literal("direct_tracing"),
      v.literal("not_applicable"),
    )),
    reasoning: v.string(),
    precedentCitation: v.optional(v.string()),
    aiConfidence: v.optional(v.number()),
    aiReasoning: v.optional(v.string()),
  },
}, async (ctx, args, identity) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);
    const now = Date.now();

    // Check if classification already exists
    const existing = await ctx.db.query("productionCostQualifications")
      .withIndex("by_company_category", (q: any) =>
        q.eq("companyId", args.companyId).eq("costCategory", args.costCategory)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        classification: args.classification,
        qualificationFactors: args.qualificationFactors,
        allocationMethod: args.allocationMethod,
        reasoning: args.reasoning,
        precedentCitation: args.precedentCitation,
        aiConfidence: args.aiConfidence,
        aiReasoning: args.aiReasoning,
        status: "draft",
        updatedAt: now,
      });
      return { qualificationId: existing._id, action: "updated" };
    }

    const qualificationId = await ctx.db.insert("productionCostQualifications", {
      ...args,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });

    return { qualificationId, action: "created" };
  },
);

// Get cost qualifications for a company
export const getCostQualifications = authQuery({
  args: {
    companyId: v.id("cannabisCompanies"),
    classification: v.optional(v.union(
      v.literal("direct_production"),
      v.literal("indirect_production"),
      v.literal("non_production"),
      v.literal("mixed"),
      v.literal("pending_review"),
    )),
  },
}, async (ctx, args, identity) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);
    let query = ctx.db.query("productionCostQualifications")
      .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId));

    const qualifications = await query.collect();

    if (args.classification) {
      return qualifications.filter((q: any) => q.classification === args.classification);
    }
    return qualifications;
  },
);

// Get COGS summary — what qualifies as direct production cost
export const getCogsSummary = authQuery({
  args: {
    companyId: v.id("cannabisCompanies"),
  },
}, async (ctx, args, identity) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);
    const qualifications = await ctx.db.query("productionCostQualifications")
      .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
      .collect();

    const directProduction = qualifications.filter((q: any) => q.classification === "direct_production");
    const indirectProduction = qualifications.filter((q: any) => q.classification === "indirect_production");
    const nonProduction = qualifications.filter((q: any) => q.classification === "non_production");
    const mixed = qualifications.filter((q: any) => q.classification === "mixed");
    const pending = qualifications.filter((q: any) => q.classification === "pending_review");

    return {
      totalClassified: qualifications.length,
      directProduction: {
        count: directProduction.length,
        items: directProduction.map((q: any) => ({
          code: q.costCategory,
          name: q.costName,
          reasoning: q.reasoning,
          aiConfidence: q.aiConfidence,
        })),
      },
      indirectProduction: {
        count: indirectProduction.length,
        items: indirectProduction.map((q: any) => ({
          code: q.costCategory,
          name: q.costName,
          method: q.allocationMethod,
          reasoning: q.reasoning,
        })),
      },
      nonProduction: {
        count: nonProduction.length,
        items: nonProduction.map((q: any) => ({
          code: q.costCategory,
          name: q.costName,
          reasoning: q.reasoning,
        })),
      },
      mixed: {
        count: mixed.length,
        items: mixed.map((q: any) => ({
          code: q.costCategory,
          name: q.costName,
          method: q.allocationMethod,
          reasoning: q.reasoning,
        })),
      },
      pending: {
        count: pending.length,
        items: pending.map((q: any) => ({
          code: q.costCategory,
          name: q.costName,
        })),
      },
    };
  },
);

// ─── AUTOMATION RUN LOGGING ───────────────────────────────────────

// Log an automation run
export const logAutomationRun = authMutation({
  args: {
    companyId: v.id("cannabisCompanies"),
    runType: v.union(
      v.literal("auto_approve"),
      v.literal("batch_approve"),
      v.literal("cogs_calculate"),
      v.literal("full_suite"),
      v.literal("scheduled"),
    ),
    triggeredBy: v.string(),
    agentsRun: v.number(),
    agentsSucceeded: v.number(),
    totalAlerts: v.number(),
    totalApproved: v.number(),
    results: v.array(v.object({
      agentId: v.string(),
      agentName: v.string(),
      alertCount: v.number(),
      details: v.array(v.string()),
      status: v.union(v.literal("success"), v.literal("error")),
    })),
    status: v.union(v.literal("completed"), v.literal("partial"), v.literal("failed")),
  },
}, async (ctx, args, identity) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);
    const now = Date.now();
    const runId = await ctx.db.insert("automationRuns", {
      ...args,
      startedAt: now - 1000, // Approximate
      completedAt: now,
    });
    return { runId };
  },
);

// Get recent automation runs
export const getAutomationRuns = authQuery({
  args: {
    companyId: v.id("cannabisCompanies"),
    limit: v.optional(v.number()),
  },
}, async (ctx, args, identity) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);
    const runs = await ctx.db.query("automationRuns")
      .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
      .order("desc")
      .take(args.limit ?? 20);

    return runs;
  },
);
