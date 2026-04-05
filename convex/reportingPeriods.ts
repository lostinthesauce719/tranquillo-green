import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

const periodStatus = v.union(v.literal("open"), v.literal("review"), v.literal("closed"));

function ensureIsoDate(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${label} must use YYYY-MM-DD format.`);
  }
}

function validateTaskSummary(taskSummary?: { completed: number; total: number }) {
  if (!taskSummary) {
    return;
  }
  if (taskSummary.completed < 0 || taskSummary.total < 0) {
    throw new Error("Task summary values must be zero or positive.");
  }
  if (taskSummary.completed > taskSummary.total) {
    throw new Error("Task summary completed count cannot exceed total count.");
  }
}

export const listByCompany = queryGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
  },
  handler: async (ctx, args) => {
    const periods = await ctx.db
      .query("reportingPeriods")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    return periods.sort((a, b) => a.startDate.localeCompare(b.startDate));
  },
});

export const getCurrentPeriod = queryGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
  },
  handler: async (ctx, args) => {
    const periods = await ctx.db
      .query("reportingPeriods")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    return periods
      .sort((a, b) => b.startDate.localeCompare(a.startDate))
      .find((period) => period.status === "open" || period.status === "review") ?? null;
  },
});

export const getByLabel = queryGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
    label: v.string(),
  },
  handler: async (ctx, args) => {
    return (
      await ctx.db.query("reportingPeriods").withIndex("by_company", (q) => q.eq("companyId", args.companyId)).collect()
    ).find((period) => period.label === args.label) ?? null;
  },
});

export const create = mutationGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
    label: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    status: periodStatus,
    closeOwner: v.optional(v.string()),
    closeWindowDays: v.optional(v.number()),
    lockedAt: v.optional(v.string()),
    taskSummary: v.optional(
      v.object({
        completed: v.number(),
        total: v.number(),
      })
    ),
    blockers: v.optional(v.array(v.string())),
    highlights: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    ensureIsoDate(args.startDate, "Reporting period start date");
    ensureIsoDate(args.endDate, "Reporting period end date");
    if (args.startDate > args.endDate) {
      throw new Error("Reporting period start date must be on or before the end date.");
    }
    if (args.lockedAt) {
      ensureIsoDate(args.lockedAt, "Reporting period lock date");
    }
    validateTaskSummary(args.taskSummary);

    const existing = (
      await ctx.db.query("reportingPeriods").withIndex("by_company", (q) => q.eq("companyId", args.companyId)).collect()
    ).find((period) => period.label === args.label);

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("reportingPeriods", args);
  },
});

export const updateStatus = mutationGeneric({
  args: {
    periodId: v.id("reportingPeriods"),
    status: periodStatus,
  },
  handler: async (ctx, args) => {
    const period = await ctx.db.get(args.periodId);
    if (!period) {
      throw new Error("Reporting period not found.");
    }
    await ctx.db.patch(args.periodId, { status: args.status });
    return await ctx.db.get(args.periodId);
  },
});

export const updateWorkflowState = mutationGeneric({
  args: {
    periodId: v.id("reportingPeriods"),
    status: periodStatus,
    taskSummary: v.object({
      completed: v.number(),
      total: v.number(),
    }),
    blockers: v.array(v.string()),
    lockedAt: v.optional(v.string()),
    highlights: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const period = await ctx.db.get(args.periodId);
    if (!period) {
      throw new Error("Reporting period not found.");
    }
    validateTaskSummary(args.taskSummary);
    if (args.lockedAt) {
      ensureIsoDate(args.lockedAt, "Reporting period lock date");
    }
    if (args.status === "closed" && !args.lockedAt) {
      throw new Error("Closed periods must include a lock date.");
    }

    await ctx.db.patch(args.periodId, {
      status: args.status,
      taskSummary: args.taskSummary,
      blockers: args.blockers,
      ...(args.status === "closed" && args.lockedAt ? { lockedAt: args.lockedAt } : {}),
      ...(args.highlights ? { highlights: args.highlights } : {}),
    });

    return await ctx.db.get(args.periodId);
  },
});
