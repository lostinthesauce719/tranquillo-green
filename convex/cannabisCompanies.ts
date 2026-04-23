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
    states: v.array(v.string()), // Changed to array
    operatorType: v.union(
      v.literal("dispensary"),
      v.literal("cultivator"),
      v.literal("manufacturer"),
      v.literal("distributor"),
      v.literal("delivery"),
      v.literal("vertical")
    ),
    defaultAccountingMethod: v.union(v.literal("cash"), v.literal("accrual")),
    status: v.optional(v.union(v.literal("onboarding"), v.literal("active"), v.literal("inactive"))), // Make status optional for initial creation
    timezone: v.optional(v.string()), // Make timezone optional
    slug: v.optional(v.string()), // Make slug optional
  },
  handler: async (baseCtx: AuthenticatedContext, args) => {
    const ctx = await createEnrichedContext(baseCtx);
    const identity = await requireIdentity(baseCtx);

    const nameSlug = args.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const slug = args.slug ?? nameSlug;
    const timezone = args.timezone ?? "America/Denver"; // Default to Denver

    const existing = await ctx.db
      .query("cannabisCompanies")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    if (existing) {
      throw new Error("Company with this slug already exists.");
    }

    // Allow anyone to create their *first* company during onboarding
    const role = resolveRoleFromIdentityClaims(identity);
    // No role-based restriction during onboarding for first company creation.

    const companyId = await ctx.db.insert("cannabisCompanies", {
      name: args.name,
      states: args.states,
      operatorType: args.operatorType,
      defaultAccountingMethod: args.defaultAccountingMethod,
      status: args.status ?? "onboarding", // Default to onboarding
      slug,
      timezone,
    });

    // Also create a tax profile for each state
    for (const state of args.states) {
      await ctx.db.insert("taxProfiles", {
        companyId,
        state,
        exciseRule: "default", // Placeholder
        salesTaxRule: "default", // Placeholder
        filingFrequency: "monthly", // Placeholder
        isPrimary: args.states.length === 1 || state === "CO", // Mark CO as primary if multiple, or if single state
      });
    }

    // Link user to this company
    const user = await requireCurrentUserRecord(ctx);
    await ctx.db.patch(user._id, {
      companyId,
    });

    return companyId;
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
