import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

const policyMethod = v.union(
  v.literal("square_footage"),
  v.literal("labor"),
  v.literal("custom")
);

const policyStatus = v.union(v.literal("active"), v.literal("inactive"));

export const listByCompany = queryGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
    status: v.optional(policyStatus),
  },
  handler: async (ctx, args) => {
    const policies = await ctx.db
      .query("allocationPolicies")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    if (args.status) {
      return policies.filter((p) => p.status === args.status);
    }
    return policies.sort(
      (a, b) =>
        new Date(b.effectiveFrom).getTime() -
        new Date(a.effectiveFrom).getTime()
    );
  },
});

export const getById = queryGeneric({
  args: { policyId: v.id("allocationPolicies") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.policyId);
  },
});

export const getActivePolicy = queryGeneric({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, args) => {
    const policies = await ctx.db
      .query("allocationPolicies")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    const active = policies
      .filter((p) => p.status === "active")
      .sort(
        (a, b) =>
          new Date(b.effectiveFrom).getTime() -
          new Date(a.effectiveFrom).getTime()
      );

    return active[0] ?? null;
  },
});

export const create = mutationGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
    name: v.string(),
    method: policyMethod,
    effectiveFrom: v.string(),
    status: policyStatus,
  },
  handler: async (ctx, args) => {
    // Validate company exists
    const company = await ctx.db.get(args.companyId);
    if (!company) {
      throw new Error("Company not found.");
    }

    // If setting active, deactivate other active policies for this company
    if (args.status === "active") {
      const existing = await ctx.db
        .query("allocationPolicies")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect();

      for (const policy of existing.filter((p) => p.status === "active")) {
        await ctx.db.patch(policy._id, { status: "inactive" });
      }
    }

    return await ctx.db.insert("allocationPolicies", args);
  },
});

export const update = mutationGeneric({
  args: {
    policyId: v.id("allocationPolicies"),
    name: v.optional(v.string()),
    method: v.optional(policyMethod),
    effectiveFrom: v.optional(v.string()),
    status: v.optional(policyStatus),
  },
  handler: async (ctx, args) => {
    const policy = await ctx.db.get(args.policyId);
    if (!policy) {
      throw new Error("Allocation policy not found.");
    }

    const { policyId, ...updates } = args;

    // If activating, deactivate other policies for same company
    if (updates.status === "active") {
      const existing = await ctx.db
        .query("allocationPolicies")
        .withIndex("by_company", (q) =>
          q.eq("companyId", policy.companyId)
        )
        .collect();

      for (const other of existing.filter(
        (p) => p.status === "active" && p._id !== args.policyId
      )) {
        await ctx.db.patch(other._id, { status: "inactive" });
      }
    }

    await ctx.db.patch(args.policyId, updates);
    return await ctx.db.get(args.policyId);
  },
});

export const remove = mutationGeneric({
  args: { policyId: v.id("allocationPolicies") },
  handler: async (ctx, args) => {
    const policy = await ctx.db.get(args.policyId);
    if (!policy) {
      throw new Error("Allocation policy not found.");
    }

    // Check for linked allocations
    const linkedAllocations = await ctx.db
      .query("cogsAllocations")
      .withIndex("by_company", (q) => q.eq("companyId", policy.companyId))
      .collect();

    const hasLinks = linkedAllocations.some((a) => a.policyId === args.policyId);
    if (hasLinks) {
      throw new Error(
        "Cannot delete policy with linked allocations. Deactivate instead."
      );
    }

    await ctx.db.delete(args.policyId);
    return { success: true };
  },
});
