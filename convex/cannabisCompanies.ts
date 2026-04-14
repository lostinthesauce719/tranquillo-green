import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { AuthenticatedContext, CustomCtx, createEnrichedContext, requireIdentity, requireCurrentUserRecord, resolveRoleFromIdentityClaims } from "./lib/withAuth";

export const getBySlug = queryGeneric({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cannabisCompanies")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

export const create = mutationGeneric({
  args: {
    name: v.string(),
    slug: v.string(),
    timezone: v.string(),
    state: v.string(),
    operatorType: v.union(
      v.literal("dispensary"),
      v.literal("cultivator"),
      v.literal("manufacturer"),
      v.literal("distributor"),
      v.literal("delivery"),
      v.literal("vertical")
    ),
    defaultAccountingMethod: v.union(v.literal("cash"), v.literal("accrual")),
    status: v.union(v.literal("onboarding"), v.literal("active"), v.literal("inactive")),
  },
  handler: async (baseCtx: AuthenticatedContext, args) => {
    const ctx = await createEnrichedContext(baseCtx);

    // Ensure only owners or system can create companies. For onboarding, this will be the user creating their first company.
    // If a company with this slug already exists, prevent creation.
    const existing = await ctx.db
      .query("cannabisCompanies")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (existing) {
      throw new Error("Company with this slug already exists.");
    }

    const role = ctx.session.role;
    if (role !== "owner" && role !== "controller") { // Only owner/controller can create
      throw new Error("Unauthorized: Only owners and controllers can create companies.");
    }

    return await ctx.db.insert("cannabisCompanies", args);
  },
});

export const updateStatus = mutationGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
    status: v.union(v.literal("onboarding"), v.literal("active"), v.literal("inactive")),
  },
  handler: async (baseCtx: AuthenticatedContext, args) => {
    const ctx = await createEnrichedContext(baseCtx);

    // Ensure the authenticated user is an owner/controller of the company
    if (ctx.session.companyId !== (args.companyId as unknown as string)) { // Fix: cast via unknown
      throw new Error("Unauthorized: Cannot update status for another company.");
    }

    const role = ctx.session.role;
    if (role !== "owner" && role !== "controller") {
      throw new Error("Unauthorized: Only owners and controllers can update company status.");
    }

    await ctx.db.patch(args.companyId, {
      status: args.status,
    });

    return await ctx.db.get(args.companyId);
  },
});
