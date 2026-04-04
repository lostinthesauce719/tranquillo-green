import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

const periodStatus = v.union(v.literal("open"), v.literal("review"), v.literal("closed"));

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

export const create = mutationGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
    label: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    status: periodStatus,
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("reportingPeriods", args);
  },
});

export const updateStatus = mutationGeneric({
  args: {
    periodId: v.id("reportingPeriods"),
    status: periodStatus,
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.periodId, { status: args.status });
    return await ctx.db.get(args.periodId);
  },
});
