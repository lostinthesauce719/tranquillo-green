// @ts-nocheck
import { authQuery, requireCompanyAccessById } from "./lib/withAuth";
import { v } from "convex/values";

export const getByCompany = authQuery({
  args: {
    companyId: v.id("cannabisCompanies"),
  },
}, async (ctx, args, identity) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);

    const companyId = args.companyId;

    const periods = await ctx.db
      .query("reportingPeriods")
      .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
      .collect();

    const periodCount = periods.length;
    const openPeriods = periods.filter(
      (p: any) => p.status === "open" || p.status === "in_review"
    ).length;

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
      .collect();

    const totalTransactions = transactions.length;
    const pendingTransactions = transactions.filter(
      (t: any) => t.status === "pending" || t.status === "needs_review"
    ).length;

    const allocations = await ctx.db
      .query("cogsAllocations")
      .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
      .collect();

    const totalAllocations = allocations.length;
    const pendingAllocations = allocations.filter(
      (a: any) => a.reviewStatus === "needs_review"
    ).length;
    const totalDeductible = allocations.reduce(
      (sum: number, a: any) => sum + (a.deductibleAmount ?? 0),
      0
    );
    const totalNondeductible = allocations.reduce(
      (sum: number, a: any) => sum + (a.nondeductibleAmount ?? 0),
      0
    );

    const reconciliations = await ctx.db
      .query("cashReconciliations")
      .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
      .collect();

    const unreconciledAccounts = reconciliations.filter(
      (r: any) => r.status !== "completed"
    ).length;

    return {
      periodCount,
      openPeriods,
      totalTransactions,
      pendingTransactions,
      totalAllocations,
      pendingAllocations,
      totalDeductible,
      totalNondeductible,
      unreconciledAccounts,
    };
  },
);
