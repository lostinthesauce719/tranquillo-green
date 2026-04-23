import { v } from "convex/values";
import { authQuery, authMutation, requireCompanyAccessById } from "./lib/withAuth";

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

export const listByCompany = authQuery(
  {
    companyId: v.id("cannabisCompanies"),
  },
  async (ctx: any, args: any, identity: any) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);

    const periods = await ctx.db
      .query("reportingPeriods")
      .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
      .collect();

    return periods.sort((a: any, b: any) => a.startDate.localeCompare(b.startDate));
  },
);

export const getCurrentPeriod = authQuery(
  {
    companyId: v.id("cannabisCompanies"),
  },
  async (ctx: any, args: any, identity: any) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);

    const periods = await ctx.db
      .query("reportingPeriods")
      .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
      .collect();

    return periods
      .sort((a: any, b: any) => b.startDate.localeCompare(a.startDate))
      .find((period: any) => period.status === "open" || period.status === "review") ?? null;
  },
);

export const getByLabel = authQuery(
  {
    companyId: v.id("cannabisCompanies"),
    label: v.string(),
  },
  async (ctx: any, args: any, identity: any) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);

    // Use by_company_label index instead of collect+find
    return (
      await ctx.db
        .query("reportingPeriods")
        .withIndex("by_company_label", (q: any) =>
          q.eq("companyId", args.companyId).eq("label", args.label)
        )
        .unique()
    ) ?? null;
  },
);

export const create = authMutation(
  {
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
  async (ctx: any, args: any, identity: any) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);

    ensureIsoDate(args.startDate, "Reporting period start date");
    ensureIsoDate(args.endDate, "Reporting period end date");
    if (args.startDate > args.endDate) {
      throw new Error("Reporting period start date must be on or before the end date.");
    }
    if (args.lockedAt) {
      ensureIsoDate(args.lockedAt, "Reporting period lock date");
    }
    validateTaskSummary(args.taskSummary);

    // Use by_company_label index instead of collect+find
    const existing = await ctx.db
      .query("reportingPeriods")
      .withIndex("by_company_label", (q: any) =>
        q.eq("companyId", args.companyId).eq("label", args.label)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("reportingPeriods", args);
  },
);

export const updateStatus = authMutation(
  {
    periodId: v.id("reportingPeriods"),
    status: periodStatus,
  },
  async (ctx: any, args: any, identity: any) => {
    const period = await ctx.db.get(args.periodId);
    if (!period) {
      throw new Error("Reporting period not found.");
    }
    await requireCompanyAccessById(ctx, identity, period.companyId);
    await ctx.db.patch(args.periodId, { status: args.status });
    return await ctx.db.get(args.periodId);
  },
);

export const updateWorkflowState = authMutation(
  {
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
  async (ctx: any, args: any, identity: any) => {
    const period = await ctx.db.get(args.periodId);
    if (!period) {
      throw new Error("Reporting period not found.");
    }
    await requireCompanyAccessById(ctx, identity, period.companyId);
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
);
