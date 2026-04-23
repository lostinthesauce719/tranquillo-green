import { queryGeneric } from "convex/server";
import { v } from "convex/values";

/**
 * Public diagnostic function — no auth required.
 * Used by the /api/backend-status endpoint to verify Convex is reachable
 * and report on seed data status.
 */
export const healthCheck = queryGeneric({
  args: {},
  handler: async (ctx) => {
    let schemaOk = true;
    let companyCount = 0;
    let sampleCompany: { name: string; slug: string } | null = null;

    try {
      const companies = await ctx.db.query("cannabisCompanies").collect();
      companyCount = companies.length;
      if (companies.length > 0) {
        const first = companies[0]!;
        sampleCompany = { name: first.name, slug: first.slug };
      }
    } catch {
      schemaOk = false;
    }

    return {
      status: "ok" as const,
      schemaDeployed: schemaOk,
      companyCount,
      sampleCompany,
      timestamp: Date.now(),
    };
  },
});

/**
 * Public query: count seed-data entities for a given company slug.
 * Returns zeros if the slug does not exist (no auth required).
 */
export const getSeedDataSummary = queryGeneric({
  args: { slug: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const slug = args.slug ?? "golden-state-greens";

    const company = await ctx.db
      .query("cannabisCompanies")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    if (!company) {
      return {
        found: false,
        slug,
        locations: 0,
        accounts: 0,
        periods: 0,
        transactions: 0,
        reconciliations: 0,
      };
    }

    const [locations, accounts, periods, transactions, reconciliations] =
      await Promise.all([
        ctx.db
          .query("cannabisLocations")
          .withIndex("by_company", (q) => q.eq("companyId", company._id))
          .collect(),
        ctx.db
          .query("chartOfAccounts")
          .withIndex("by_company", (q) => q.eq("companyId", company._id))
          .collect(),
        ctx.db
          .query("reportingPeriods")
          .withIndex("by_company", (q) => q.eq("companyId", company._id))
          .collect(),
        ctx.db
          .query("transactions")
          .withIndex("by_company", (q) => q.eq("companyId", company._id))
          .collect(),
        ctx.db
          .query("cashReconciliations")
          .withIndex("by_company", (q) => q.eq("companyId", company._id))
          .collect(),
      ]);

    return {
      found: true,
      slug,
      companyId: company._id,
      companyName: company.name,
      locations: locations.length,
      accounts: accounts.length,
      periods: periods.length,
      transactions: transactions.length,
      reconciliations: reconciliations.length,
    };
  },
});
