import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

const accountCategory = v.union(
  v.literal("asset"),
  v.literal("liability"),
  v.literal("equity"),
  v.literal("revenue"),
  v.literal("cogs"),
  v.literal("opex")
);

const taxTreatment = v.union(v.literal("deductible"), v.literal("cogs"), v.literal("nondeductible"));

export const listByCompany = queryGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const accounts = await ctx.db
      .query("chartOfAccounts")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    return accounts
      .filter((account) => (args.activeOnly ? account.isActive : true))
      .sort((a, b) => a.code.localeCompare(b.code));
  },
});

export const getByCode = queryGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const accounts = await ctx.db
      .query("chartOfAccounts")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    return accounts.find((account) => account.code === args.code) ?? null;
  },
});

export const create = mutationGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
    code: v.string(),
    name: v.string(),
    category: accountCategory,
    subcategory: v.optional(v.string()),
    isActive: v.boolean(),
    taxTreatment,
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = (
      await ctx.db
        .query("chartOfAccounts")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect()
    ).find((account) => account.code === args.code);

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("chartOfAccounts", args);
  },
});

export const bulkUpsert = mutationGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
    accounts: v.array(
      v.object({
        code: v.string(),
        name: v.string(),
        category: accountCategory,
        subcategory: v.optional(v.string()),
        isActive: v.boolean(),
        taxTreatment,
        description: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = [] as string[];

    const existingAccounts = await ctx.db
      .query("chartOfAccounts")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    for (const account of args.accounts) {
      const existing = existingAccounts.find((record) => record.code === account.code);

      if (existing) {
        await ctx.db.patch(existing._id, {
          name: account.name,
          category: account.category,
          subcategory: account.subcategory,
          isActive: account.isActive,
          taxTreatment: account.taxTreatment,
          description: account.description,
        });
        results.push(existing._id);
        continue;
      }

      const id = await ctx.db.insert("chartOfAccounts", {
        companyId: args.companyId,
        ...account,
      });
      results.push(id);
    }

    return results;
  },
});
