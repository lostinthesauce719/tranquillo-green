import { v } from "convex/values";
import { authQuery, authMutation } from "./lib/withAuth";

const accountCategory = v.union(
  v.literal("asset"),
  v.literal("liability"),
  v.literal("equity"),
  v.literal("revenue"),
  v.literal("cogs"),
  v.literal("opex")
);

const taxTreatment = v.union(v.literal("deductible"), v.literal("cogs"), v.literal("nondeductible"));

export const listByCompany = authQuery(
  {
    companyId: v.id("cannabisCompanies"),
    activeOnly: v.optional(v.boolean()),
  },
  async (ctx: any, args: any, _identity: any) => {
    const accounts = await ctx.db
      .query("chartOfAccounts")
      .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
      .collect();

    return accounts
      .filter((account: any) => (args.activeOnly ? account.isActive : true))
      .sort((a: any, b: any) => a.code.localeCompare(b.code));
  },
);

export const getByCode = authQuery(
  {
    companyId: v.id("cannabisCompanies"),
    code: v.string(),
  },
  async (ctx: any, args: any, _identity: any) => {
    // Use by_company_code index instead of collect+find
    return (
      await ctx.db
        .query("chartOfAccounts")
        .withIndex("by_company_code", (q: any) =>
          q.eq("companyId", args.companyId).eq("code", args.code)
        )
        .unique()
    ) ?? null;
  },
);

export const create = authMutation(
  {
    companyId: v.id("cannabisCompanies"),
    code: v.string(),
    name: v.string(),
    category: accountCategory,
    subcategory: v.optional(v.string()),
    isActive: v.boolean(),
    taxTreatment,
    description: v.optional(v.string()),
  },
  async (ctx: any, args: any, _identity: any) => {
    // Use by_company_code index instead of collect+find
    const existing = await ctx.db
      .query("chartOfAccounts")
      .withIndex("by_company_code", (q: any) =>
        q.eq("companyId", args.companyId).eq("code", args.code)
      )
      .unique();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("chartOfAccounts", args);
  },
);

export const bulkUpsert = authMutation(
  {
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
  async (ctx: any, args: any, _identity: any) => {
    const results = [] as string[];

    const existingAccounts = await ctx.db
      .query("chartOfAccounts")
      .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
      .collect();

    for (const account of args.accounts) {
      const existing = existingAccounts.find((record: any) => record.code === account.code);

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
);
