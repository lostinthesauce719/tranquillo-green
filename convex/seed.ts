import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { californiaOperatorDemo } from "../src/lib/demo/accounting";

export const previewCaliforniaOperator = queryGeneric({
  args: {},
  handler: async () => californiaOperatorDemo,
});

export const seedCaliforniaOperator = mutationGeneric({
  args: {
    slug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const slug = args.slug ?? californiaOperatorDemo.company.slug;
    const existingCompany = await ctx.db
      .query("cannabisCompanies")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    const companyId =
      existingCompany?._id ??
      (await ctx.db.insert("cannabisCompanies", {
        ...californiaOperatorDemo.company,
        slug,
      }));

    const locationIdsByName = new Map<string, any>();

    for (const location of californiaOperatorDemo.locations) {
      const existingLocation = (
        await ctx.db
          .query("cannabisLocations")
          .withIndex("by_company", (q) => q.eq("companyId", companyId))
          .collect()
      ).find((record) => record.name === location.name);

      const locationId =
        existingLocation?._id ??
        (await ctx.db.insert("cannabisLocations", {
          companyId,
          ...location,
        }));

      locationIdsByName.set(location.name, locationId);
    }

    for (const license of californiaOperatorDemo.licenses) {
      const existingLicense = (
        await ctx.db
          .query("cannabisLicenses")
          .withIndex("by_company", (q) => q.eq("companyId", companyId))
          .collect()
      ).find((record) => record.licenseNumber === license.licenseNumber);

      if (!existingLicense) {
        await ctx.db.insert("cannabisLicenses", {
          companyId,
          locationId: license.locationName ? locationIdsByName.get(license.locationName) : undefined,
          licenseType: license.licenseType,
          state: license.state,
          licenseNumber: license.licenseNumber,
          status: license.status,
          issuedAt: license.issuedAt,
          expiresAt: license.expiresAt,
        });
      }
    }

    const existingAccounts = await ctx.db
      .query("chartOfAccounts")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();

    for (const account of californiaOperatorDemo.chartOfAccounts) {
      const existingAccount = existingAccounts.find((record) => record.code === account.code);

      if (existingAccount) {
        await ctx.db.patch(existingAccount._id, {
          name: account.name,
          category: account.category,
          subcategory: account.subcategory,
          isActive: account.isActive,
          taxTreatment: account.taxTreatment,
        });
      } else {
        await ctx.db.insert("chartOfAccounts", {
          companyId,
          code: account.code,
          name: account.name,
          category: account.category,
          subcategory: account.subcategory,
          isActive: account.isActive,
          taxTreatment: account.taxTreatment,
        });
      }
    }

    const existingPeriod = (
      await ctx.db
        .query("reportingPeriods")
        .withIndex("by_company", (q) => q.eq("companyId", companyId))
        .collect()
    ).find((period) => period.label === californiaOperatorDemo.reportingPeriod.label);

    const reportingPeriodId =
      existingPeriod?._id ??
      (await ctx.db.insert("reportingPeriods", {
        companyId,
        ...californiaOperatorDemo.reportingPeriod,
      }));

    return {
      companyId,
      reportingPeriodId,
      locationsSeeded: californiaOperatorDemo.locations.length,
      licensesSeeded: californiaOperatorDemo.licenses.length,
      accountsSeeded: californiaOperatorDemo.chartOfAccounts.length,
      periodLabel: californiaOperatorDemo.reportingPeriod.label,
    };
  },
});
