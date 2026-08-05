import { mutationGeneric, queryGeneric } from "convex/server";
import { authQuery, authMutation, requireCompanyAccessById } from "./lib/withAuth";
import { v } from "convex/values";

/*
 * Every method the allocation engine implements must be selectable here.
 *
 * flat_percentage and flat_amount were added to computeAllocation but never to
 * this validator, so a policy could not be created for either one. The engine
 * supported them and the product could not reach them.
 */
const policyMethod = v.union(
  v.literal("square_footage"),
  v.literal("labor"),
  v.literal("custom"),
  v.literal("flat_percentage"),
  v.literal("flat_amount")
);

const policyStatus = v.union(v.literal("active"), v.literal("inactive"));

export const listByCompany = authQuery({
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

export const getById = authQuery({
  args: { policyId: v.id("allocationPolicies") },
  handler: async (ctx, args, identity) => {
    const policy = await ctx.db.get(args.policyId);
    if (!policy) return null;
    // Read path, same by-ID hole as update and remove.
    await requireCompanyAccessById(ctx, identity, policy.companyId);
    return policy;
  },
});

export const getActivePolicy = authQuery({
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

export const create = authMutation({
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

export const update = authMutation({
  args: {
    policyId: v.id("allocationPolicies"),
    name: v.optional(v.string()),
    method: v.optional(policyMethod),
    effectiveFrom: v.optional(v.string()),
    status: v.optional(policyStatus),
  },
  handler: async (ctx, args, identity) => {
    const policy = await ctx.db.get(args.policyId);
    if (!policy) {
      throw new Error("Allocation policy not found.");
    }

    /*
     * Tenant check. This was missing.
     *
     * The withAuth wrapper enforces scope when a request carries a companyId,
     * which covers create and listByCompany. update and remove take only a
     * policyId, so nothing was enforced: any authenticated user who knew or
     * guessed a policy ID could rewrite or delete another company's allocation
     * policy — the document that governs how that company's costs split under
     * 280E.
     *
     * The wrapper cannot infer the tenant from an opaque ID, so records reached
     * by their own ID have to resolve the owner and check it here.
     */
    await requireCompanyAccessById(ctx, identity, policy.companyId);

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

export const remove = authMutation({
  args: { policyId: v.id("allocationPolicies") },
  handler: async (ctx, args, identity) => {
    const policy = await ctx.db.get(args.policyId);
    if (!policy) {
      throw new Error("Allocation policy not found.");
    }

    // Same hole as update: reached by policy ID, so the wrapper cannot scope it.
    await requireCompanyAccessById(ctx, identity, policy.companyId);

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
