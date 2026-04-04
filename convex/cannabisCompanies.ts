import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

export const list = queryGeneric({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("cannabisCompanies").collect();
  },
});

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
      v.literal("vertical")
    ),
    defaultAccountingMethod: v.union(v.literal("cash"), v.literal("accrual")),
    status: v.union(v.literal("onboarding"), v.literal("active"), v.literal("inactive")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("cannabisCompanies")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("cannabisCompanies", args);
  },
});

export const updateStatus = mutationGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
    status: v.union(v.literal("onboarding"), v.literal("active"), v.literal("inactive")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.companyId, {
      status: args.status,
    });

    return await ctx.db.get(args.companyId);
  },
});
