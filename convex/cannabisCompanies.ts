import { v } from "convex/values";
import { authQuery, authMutation } from "./lib/withAuth";

export const list = authQuery(
  {},
  async (ctx: any, _args: any, _identity: any) => {
    return await ctx.db.query("cannabisCompanies").collect();
  },
);

export const getBySlug = authQuery(
  {
    slug: v.string(),
  },
  async (ctx: any, args: any, _identity: any) => {
    return await ctx.db
      .query("cannabisCompanies")
      .withIndex("by_slug", (q: any) => q.eq("slug", args.slug))
      .unique();
  },
);

export const create = authMutation(
  {
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
  async (ctx: any, args: any, _identity: any) => {
    const existing = await ctx.db
      .query("cannabisCompanies")
      .withIndex("by_slug", (q: any) => q.eq("slug", args.slug))
      .unique();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("cannabisCompanies", args);
  },
);

export const updateStatus = authMutation(
  {
    companyId: v.id("cannabisCompanies"),
    status: v.union(v.literal("onboarding"), v.literal("active"), v.literal("inactive")),
  },
  async (ctx: any, args: any, _identity: any) => {
    await ctx.db.patch(args.companyId, {
      status: args.status,
    });

    return await ctx.db.get(args.companyId);
  },
);
