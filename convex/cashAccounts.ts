import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

const cashAccountType = v.union(v.literal("drawer"), v.literal("vault"), v.literal("bank_clearing"));

export const listByCompany = queryGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.query("cashAccounts").withIndex("by_company", (q) => q.eq("companyId", args.companyId)).collect();
  },
});

export const upsert = mutationGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
    locationId: v.optional(v.id("cannabisLocations")),
    name: v.string(),
    type: cashAccountType,
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = (
      await ctx.db.query("cashAccounts").withIndex("by_company", (q) => q.eq("companyId", args.companyId)).collect()
    ).find((record) => record.name === args.name);

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("cashAccounts", args);
  },
});
