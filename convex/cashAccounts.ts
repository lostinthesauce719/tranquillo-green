import { v } from "convex/values";
import { authQuery, authMutation, requireCompanyAccessById } from "./lib/withAuth";

const cashAccountType = v.union(v.literal("drawer"), v.literal("vault"), v.literal("bank_clearing"));

export const listByCompany = authQuery(
  {
    companyId: v.id("cannabisCompanies"),
  },
  async (ctx: any, args: any, identity: any) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);

    return await ctx.db.query("cashAccounts").withIndex("by_company", (q: any) => q.eq("companyId", args.companyId)).collect();
  },
);

export const upsert = authMutation(
  {
    companyId: v.id("cannabisCompanies"),
    locationId: v.optional(v.id("cannabisLocations")),
    name: v.string(),
    type: cashAccountType,
    active: v.boolean(),
  },
  async (ctx: any, args: any, identity: any) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);

    if (args.locationId) {
      const location = await ctx.db.get(args.locationId);
      if (!location || location.companyId !== args.companyId) {
        throw new Error("Cash account location must belong to the same company.");
      }
    }

    // Use by_company_name index instead of collect+find
    const existing = await ctx.db
      .query("cashAccounts")
      .withIndex("by_company_name", (q: any) =>
        q.eq("companyId", args.companyId).eq("name", args.name)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("cashAccounts", args);
  },
);
