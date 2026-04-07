import { v } from "convex/values";
import { authQuery, authMutation } from "./lib/withAuth";

const cashAccountType = v.union(v.literal("drawer"), v.literal("vault"), v.literal("bank_clearing"));

export const listByCompany = authQuery(
  {
    companyId: v.id("cannabisCompanies"),
  },
  async (ctx: any, args: any, _identity: any) => {
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
  async (ctx: any, args: any, _identity: any) => {
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
