import { mutationGeneric, queryGeneric } from "convex/server";
import { authQuery, authMutation, requireRecordAccess, getOwnedRecord } from "./lib/withAuth";
import { v } from "convex/values";

const reviewStatus = v.union(
  v.literal("system_applied"),
  v.literal("needs_review"),
  v.literal("approved")
);

export const listByCompany = authQuery({
  args: {
    companyId: v.id("cannabisCompanies"),
    reviewStatusFilter: v.optional(reviewStatus),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("cogsAllocations")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId));

    const allocations = (await query.collect()).filter(
      (a) => !args.reviewStatusFilter || a.reviewStatus === args.reviewStatusFilter
    );

    // Enrich with transaction and policy data
    const enriched = await Promise.all(
      allocations.map(async (alloc) => {
        const transaction = alloc.transactionId
          ? await ctx.db.get(alloc.transactionId)
          : null;
        const policy = alloc.policyId
          ? await ctx.db.get(alloc.policyId)
          : null;
        return { ...alloc, transaction, policy };
      })
    );

    return enriched.sort((a, b) => {
      // Needs review first, then system_applied, then approved
      const order = { needs_review: 0, system_applied: 1, approved: 2 };
      return (
        (order[a.reviewStatus] ?? 3) - (order[b.reviewStatus] ?? 3)
      );
    });
  },
});

export const getById = authQuery({
  args: { allocationId: v.id("cogsAllocations") },
  handler: async (ctx, args, identity) => {
    const allocation = await ctx.db.get(args.allocationId);
    if (!allocation) return null;
    // Reached by allocation ID, so the wrapper cannot scope it. See withAuth.
    await requireRecordAccess(ctx, identity, allocation, "allocation");

    const transaction = allocation.transactionId
      ? await ctx.db.get(allocation.transactionId)
      : null;
    const policy = allocation.policyId
      ? await ctx.db.get(allocation.policyId)
      : null;

    return { ...allocation, transaction, policy };
  },
});

export const getQueueSummary = authQuery({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, args) => {
    const allocations = await ctx.db
      .query("cogsAllocations")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    const needsReview = allocations.filter(
      (a) => a.reviewStatus === "needs_review"
    );
    const systemApplied = allocations.filter(
      (a) => a.reviewStatus === "system_applied"
    );
    const approved = allocations.filter(
      (a) => a.reviewStatus === "approved"
    );

    const deductible = allocations.reduce(
      (sum, a) => sum + a.deductibleAmount,
      0
    );
    const nondeductible = allocations.reduce(
      (sum, a) => sum + a.nondeductibleAmount,
      0
    );

    return {
      total: allocations.length,
      needsReview: needsReview.length,
      systemApplied: systemApplied.length,
      approved: approved.length,
      deductible: Math.round(deductible * 100) / 100,
      nondeductible: Math.round(nondeductible * 100) / 100,
    };
  },
});

export const create = authMutation({
  args: {
    companyId: v.id("cannabisCompanies"),
    transactionId: v.optional(v.id("transactions")),
    policyId: v.optional(v.id("allocationPolicies")),
    basisType: v.string(),
    deductibleAmount: v.number(),
    nondeductibleAmount: v.number(),
    confidence: v.optional(v.number()),
    reviewStatus: reviewStatus,
  },
  handler: async (ctx, args) => {
    const company = await ctx.db.get(args.companyId);
    if (!company) {
      throw new Error("Company not found.");
    }

    // Validate amounts
    if (args.deductibleAmount < 0 || args.nondeductibleAmount < 0) {
      throw new Error("Allocation amounts cannot be negative.");
    }

    if (args.transactionId) {
      const txn = await ctx.db.get(args.transactionId);
      if (!txn || txn.companyId !== args.companyId) {
        throw new Error(
          "Transaction must belong to the same company."
        );
      }
    }

    if (args.policyId) {
      const policy = await ctx.db.get(args.policyId);
      if (!policy || policy.companyId !== args.companyId) {
        throw new Error(
          "Policy must belong to the same company."
        );
      }
    }

    return await ctx.db.insert("cogsAllocations", args);
  },
});

export const approve = authMutation({
  args: {
    allocationId: v.id("cogsAllocations"),
    overrideDeductible: v.optional(v.number()),
    overrideNondeductible: v.optional(v.number()),
  },
  handler: async (ctx, args, identity) => {
    const allocation = await ctx.db.get(args.allocationId);
    await requireRecordAccess(ctx, identity, allocation, "allocation");
    if (!allocation) {
      throw new Error("Allocation not found.");
    }

    const updates: Record<string, unknown> = {
      reviewStatus: "approved",
    };

    if (
      args.overrideDeductible !== undefined ||
      args.overrideNondeductible !== undefined
    ) {
      updates.deductibleAmount =
        args.overrideDeductible ?? allocation.deductibleAmount;
      updates.nondeductibleAmount =
        args.overrideNondeductible ?? allocation.nondeductibleAmount;
    }

    await ctx.db.patch(args.allocationId, updates);
    return await ctx.db.get(args.allocationId);
  },
});

export const markNeedsReview = authMutation({
  args: {
    allocationId: v.id("cogsAllocations"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args, identity) => {
    const allocation = await ctx.db.get(args.allocationId);
    await requireRecordAccess(ctx, identity, allocation, "allocation");
    if (!allocation) {
      throw new Error("Allocation not found.");
    }

    await ctx.db.patch(args.allocationId, {
      reviewStatus: "needs_review",
    });
    return await ctx.db.get(args.allocationId);
  },
});

export const bulkCreate = authMutation({
  args: {
    companyId: v.id("cannabisCompanies"),
    allocations: v.array(
      v.object({
        transactionId: v.optional(v.id("transactions")),
        policyId: v.optional(v.id("allocationPolicies")),
        basisType: v.string(),
        deductibleAmount: v.number(),
        nondeductibleAmount: v.number(),
        confidence: v.optional(v.number()),
        reviewStatus: reviewStatus,
      })
    ),
  },
  handler: async (ctx, args) => {
    const company = await ctx.db.get(args.companyId);
    if (!company) {
      throw new Error("Company not found.");
    }

    const results: string[] = [];
    for (const alloc of args.allocations) {
      const id = await ctx.db.insert("cogsAllocations", {
        companyId: args.companyId,
        ...alloc,
      });
      results.push(id);
    }
    return results;
  },
});
