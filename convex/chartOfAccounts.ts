import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

/** Default cannabis chart of accounts seeded for every new tenant. */
const DEFAULT_CHART: Array<{
  code: string;
  name: string;
  category: "asset" | "liability" | "equity" | "revenue" | "cogs" | "opex";
  subcategory?: string;
  isActive: boolean;
  taxTreatment: "deductible" | "cogs" | "nondeductible";
  description?: string;
}> = [
  { code: "1010", name: "Operating Cash", category: "asset", subcategory: "Cash", isActive: true, taxTreatment: "deductible", description: "Primary operating cash account." },
  { code: "1125", name: "Inventory - Finished Goods", category: "asset", subcategory: "Inventory", isActive: true, taxTreatment: "cogs", description: "Sellable cannabis inventory." },
  { code: "1135", name: "Inventory - Packaging Inputs", category: "asset", subcategory: "Inventory", isActive: true, taxTreatment: "cogs", description: "Packaging and labels for production." },
  { code: "1210", name: "Prepaids and Deposits", category: "asset", subcategory: "Prepaid Expenses", isActive: true, taxTreatment: "deductible", description: "Insurance, software retainers, facility deposits." },
  { code: "1510", name: "Extraction Equipment", category: "asset", subcategory: "Fixed Assets", isActive: true, taxTreatment: "cogs", description: "Manufacturing equipment." },
  { code: "2010", name: "Accounts Payable", category: "liability", subcategory: "Current Liabilities", isActive: true, taxTreatment: "deductible", description: "Trade payables." },
  { code: "2210", name: "Cannabis Excise Tax Payable", category: "liability", subcategory: "Tax Liabilities", isActive: true, taxTreatment: "nondeductible", description: "Cannabis excise tax liability." },
  { code: "3010", name: "Members' Equity", category: "equity", subcategory: "Equity", isActive: true, taxTreatment: "deductible", description: "Owner capital contributions." },
  { code: "4010", name: "Retail Cannabis Sales", category: "revenue", subcategory: "Retail Revenue", isActive: true, taxTreatment: "nondeductible", description: "In-store cannabis sales." },
  { code: "4025", name: "Wholesale Product Transfers", category: "revenue", subcategory: "Wholesale Revenue", isActive: true, taxTreatment: "nondeductible", description: "Distribution revenue." },
  { code: "5010", name: "Cost of Goods Sold - Flower", category: "cogs", subcategory: "Direct Materials", isActive: true, taxTreatment: "cogs", description: "Direct product cost for flower." },
  { code: "5020", name: "Cost of Goods Sold - Manufactured Goods", category: "cogs", subcategory: "Direct Materials", isActive: true, taxTreatment: "cogs", description: "Direct product cost for manufactured goods." },
  { code: "5035", name: "Production Labor Absorption", category: "cogs", subcategory: "Direct Labor", isActive: true, taxTreatment: "cogs", description: "Capitalizable payroll for manufacturing." },
  { code: "6110", name: "Payroll - Retail Staff", category: "opex", subcategory: "Payroll", isActive: true, taxTreatment: "nondeductible", description: "Retail staff payroll subject to 280E." },
  { code: "6210", name: "Marketing and Promotions", category: "opex", subcategory: "Sales & Marketing", isActive: true, taxTreatment: "nondeductible", description: "Marketing spend." },
  { code: "6310", name: "Security Services", category: "opex", subcategory: "Occupancy & Security", isActive: true, taxTreatment: "nondeductible", description: "Security compliance costs." },
  { code: "6415", name: "Professional Fees", category: "opex", subcategory: "Professional Services", isActive: true, taxTreatment: "deductible", description: "Accounting, legal, tax advisory." },
  { code: "6999", name: "Suspense - Classification Review", category: "opex", subcategory: "Close Process", isActive: false, taxTreatment: "nondeductible", description: "Temporary bucket for unmapped transactions." },
];

/** Seed the default chart of accounts for a new company. */
export const seedDefaults = mutationGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("chartOfAccounts")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    if (existing.length > 0) {
      return existing.map((a: any) => a._id);
    }

    const ids: string[] = [];
    for (const account of DEFAULT_CHART) {
      const id = await ctx.db.insert("chartOfAccounts", {
        companyId: args.companyId,
        ...account,
      });
      ids.push(id);
    }
    return ids;
  },
});

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
