// @ts-nocheck
import { authMutation, authQuery, requireCompanyAccessById } from "./lib/withAuth";
import { v } from "convex/values";

/**
 * Tax Engine — Convex Mutations & Queries
 *
 * Manual rate tables, CO-first, extensible to multi-state.
 */


// ─── QUERIES ───────────────────────────────────────────────────────────────

/**
 * getCompanyTaxProfile — Fetch tax profile for a company
 */
export const getCompanyTaxProfile = authQuery({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, { companyId }) => {
    const profile = await db
      .query("taxProfiles")
      .filter(q => q.eq(q.field("companyId"), companyId))
      .first();
    return profile ?? null;
  },
});

/**
 * listTaxTypes — All system tax types (admin/readonly)
 */
export const listTaxTypes = authQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("taxTypes").collect();
  },
});

/**
 * listJurisdictions — Return jurisdictions for a company (system + optional company-specific)
 */
export const listJurisdictions = authQuery({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, { companyId }) => {
    // System-wide jurisdictions (companyId null) + company-specific if any
    const system = await db
      .query("taxJurisdictions")
      .filter(q => q.eq(q.field("companyId"), null))
      .collect();
    const companySpecific = await db
      .query("taxJurisdictions")
      .filter(q => q.eq(q.field("companyId"), companyId))
      .collect();
    return [...system, ...companySpecific];
  },
});

/**
 * listTaxRates — Fetch rates filtered by jurisdiction and/or tax type
 */
export const listTaxRates = authQuery({
  args: {
    jurisdictionId: v.optional(v.id("taxJurisdictions")),
    taxTypeId: v.optional(v.id("taxTypes")),
  },
  handler: async (ctx, { jurisdictionId, taxTypeId }) => {
    let q = ctx.db.query("taxRates");
    if (jurisdictionId) {
      q = q.filter(q => q.eq(q.field("jurisdictionId"), jurisdictionId));
    }
    if (taxTypeId) {
      q = q.filter(q => q.eq(q.field("taxTypeId"), taxTypeId));
    }
    return await q.collect();
  },
});


// ─── MUTATIONS ─────────────────────────────────────────────────────────────

/**
 * calculateTax — Compute tax breakdown for a transaction
 *
 * @param payload
 *   companyId, transactionAmount, productCategory, jurisdictionId (optional),
 *   taxTypeCodes (optional array), transactionDate (default now)
 */
export const calculateTax = authMutation({
  args: {
    companyId: v.id("cannabisCompanies"),
    transactionAmount: v.number(),
    productCategory: v.string(),
    jurisdictionId: v.optional(v.id("taxJurisdictions")),
    taxTypeCodes: v.optional(v.array(v.string())),
    transactionDate: v.optional(v.number()),
  },
  handler: async (ctx, payload) => {
    const { companyId, transactionAmount, productCategory, jurisdictionId, taxTypeCodes, transactionDate } = payload;
    const now = transactionDate ?? Date.now();

    // Resolve jurisdiction: use provided, else company's primary jurisdiction
    let targetJurisdiction: string | null = jurisdictionId;
    if (!targetJurisdiction) {
      const profile = await db
        .query("taxProfiles")
        .filter(q => q.eq(q.field("companyId"), companyId))
        .first();
      if (!profile) throw new Error("Company has no tax profile. Configure tax settings first.");
      targetJurisdiction = profile.primaryJurisdictionId ?? null;
    }
    if (!targetJurisdiction) throw new Error("No jurisdiction specified and company has no primary jurisdiction set.");

    // Load jurisdiction record
    const jurisdiction = await ctx.db.get(targetJurisdiction);
    if (!jurisdiction) throw new Error(`Jurisdiction ${targetJurisdiction} not found`);

    // Determine which tax types to calculate
    let typesToCalculate: string[];
    if (taxTypeCodes && taxTypeCodes.length > 0) {
      typesToCalculate = taxTypeCodes;
    } else {
      // Load company's enabled tax types from taxProfiles.taxTypesEnabled
      const profile = await db
        .query("taxProfiles")
        .filter(q => q.eq(q.field("companyId"), companyId))
        .first();
      if (!profile?.taxTypesEnabled?.length) {
        throw new Error("Company tax profile has no tax types enabled.");
      }
      typesToCalculate = profile.taxTypesEnabled;
    }

    // For each tax type, fetch active rate for this jurisdiction at this date
    const taxBreakdown: Array<{ taxTypeCode: string; taxTypeName: string; jurisdiction: string; amount: number }> = [];
    let totalTax = 0;

    for (const typeId of typesToCalculate) {
      const taxType = await ctx.db.get(typeId);
      if (!taxType) continue;

      // Filter by category
      const categoryOk =
        taxType.appliesToProductCategories?.includes("*") ||
        taxType.appliesToProductCategories?.includes(productCategory);
      if (!categoryOk) continue;

      // Find active rate
      const rateRecord = await db
        .query("taxRates")
        .filter(q =>
          q.and(
            q.eq(q.field("jurisdictionId"), targetJurisdiction),
            q.eq(q.field("taxTypeId"), typeId),
            q.lte(q.field("effectiveFrom"), now),
            q.or(q.eq(q.field("effectiveTo"), null), q.gte(q.field("effectiveTo"), now))
          )
        )
        .first();

      if (!rateRecord) {
        throw new Error(`No active tax rate found for jurisdiction ${jurisdiction.jurisdictionName}, type ${taxType.code}`);
      }

      // Compute period for filing grouping (use transaction month)
      // For MVP: period = start at first day of month, end = last day
      const txDate = new Date(now);
      const periodStart = new Date(txDate.getFullYear(), txDate.getMonth(), 1).getTime();
      const periodEnd = new Date(txDate.getFullYear(), txDate.getMonth() + 1, 0).getTime();

      const taxableAmt = transactionAmount;
      const taxAmt = rateRecord.rateType === "percentage"
        ? taxableAmt * rateRecord.rate
        : rateRecord.rate;

      // Persist audit record
      const calcId = await ctx.db.insert("taxCalculations", {
        companyId,
        transactionId: null, // optionally link later
        journalEntryId: null,
        jurisdictionId: targetJurisdiction,
        taxTypeId: typeId,
        taxableAmount: taxableAmt,
        taxAmount: taxAmt,
        calculationMethod: "manual_rate",
        calculatedAt: now,
        periodStart,
        periodEnd,
        isPosted: false,
        postedAt: null,
      });

      totalTax += taxAmt;
      taxBreakdown.push({
        taxTypeCode: taxType.code,
        taxTypeName: taxType.name,
        jurisdiction: jurisdiction.jurisdictionName,
        amount: taxAmt,
      });
    }

    return { taxBreakdown, totalTax };
  },
});

// ─── QUERIES ───────────────────────────────────────────────────────────────

/**
 * getTaxLiability — Aggregate unpaid tax calculations by jurisdiction for a period
 */
export const getTaxLiability = authQuery({
  args: {
    companyId: v.id("cannabisCompanies"),
    periodStart: v.number(),
    periodEnd: v.number(),
  },
  handler: async (ctx, { companyId, periodStart, periodEnd }) => {
    const calculations = await db
      .query("taxCalculations")
      .filter(q =>
        q.and(
          q.eq(q.field("companyId"), companyId),
          q.eq(q.field("periodStart"), periodStart),
          q.eq(q.field("periodEnd"), periodEnd),
          q.eq(q.field("isPosted"), false)
        )
      )
      .collect();

    // Group by jurisdiction
    const byJurisdiction: Record<string, { jurisdictionId: string; name: string; byTaxType: Array<{ code: string; name: string; amount: number }>; total: number }> = {};

    for (const calc of calculations) {
      const jurisdiction = await ctx.db.get(calc.jurisdictionId);
      const taxType = await ctx.db.get(calc.taxTypeId);
      if (!jurisdiction || !taxType) continue;

      const key = jurisdiction._id;
      if (!byJurisdiction[key]) {
        byJurisdiction[key] = {
          jurisdictionId: jurisdiction._id,
          name: jurisdiction.jurisdictionName,
          byTaxType: [],
          total: 0,
        };
      }
      const existing = byJurisdiction[key].byTaxType.find(t => t.code === taxType.code);
      if (existing) {
        existing.amount += calc.taxAmount;
      } else {
        byJurisdiction[key].byTaxType.push({ code: taxType.code, name: taxType.name, amount: calc.taxAmount });
      }
      byJurisdiction[key].total += calc.taxAmount;
    }

    return {
      byJurisdiction: Object.values(byJurisdiction),
      grandTotal: Object.values(byJurisdiction).reduce((sum, j) => sum + j.total, 0),
    };
  },
});

/**
 * getUpcomingDeadlines — Return filing due dates in the next N days
 */
export const getUpcomingDeadlines = authQuery({
  args: {
    companyId: v.id("cannabisCompanies"),
    lookAheadDays: v.optional(v.number()),
  },
  handler: async (ctx, { companyId, lookAheadDays = 30 }) => {
    const profile = await db
      .query("taxProfiles")
      .filter(q => q.eq(q.field("companyId"), companyId))
      .first();

    if (!profile) return [];

    // Build deadline list from filingCalendar mapping
    // e.g. { "CO-excise": "monthly" } → derive next month-end due date (typically 20th of following month for CO)
    const now = Date.now();
    const deadlines: Array<{ jurisdictionId: string | null; taxTypeCode: string; dueDate: string; filingType: string }> = [];

    // For MVP: simple monthly return due on 20th of following month
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 20);
    const dueString = nextMonth.toISOString().split("T")[0];

    // TODO: iterate over company's nexus states + enabled tax types to generate proper calendar
    // For now: placeholder showing concept
    return [
      // Example placeholder — real implementation expands this
      {
        jurisdictionId: profile.primaryJurisdictionId ?? null,
        taxTypeCode: "excise",
        dueDate: dueString,
        filingType: profile.filingCalendar?.["CO-excise"] ?? "monthly",
      },
    ];
  },
});

// ─── ADMIN / CONFIG ─────────────────────────────────────────────────────────

/**
 * upsertTaxJurisdiction — Admin tool to create or update a jurisdiction
 */
export const upsertTaxJurisdiction = authMutation({
  args: {
    jurisdictionId: v.optional(v.id("taxJurisdictions")),
    data: v.object({
      stateCode: v.string(),
      jurisdictionName: v.string(),
      jurisdictionLevel: v.union(v.literal("state"), v.literal("county"), v.literal("city"), v.literal("special")),
      filingFrequency: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("annually")),
      nexusThreshold: v.optional(v.number()),
      isActive: v.boolean(),
    }),
  },
  handler: async (ctx, { jurisdictionId, data }) => {
    // Require admin role (placeholder — implement role check in withAuth later)
    if (jurisdictionId) {
      await ctx.db.update(jurisdictionId, { ...data, updatedAt: Date.now() });
      return { success: true, jurisdictionId };
    } else {
      const id = await ctx.db.insert("taxJurisdictions", {
        ...data,
        companyId: null, // system-level
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return { success: true, jurisdictionId: id };
    }
  },
});

/**
 * upsertTaxRate — Create or update a tax rate for a jurisdiction + type
 */
export const upsertTaxRate = authMutation({
  args: {
    rateId: v.optional(v.id("taxRates")),
    data: v.object({
      jurisdictionId: v.id("taxJurisdictions"),
      taxTypeId: v.id("taxTypes"),
      rate: v.number(),
      rateType: v.union(v.literal("percentage"), v.literal("fixed_amount")),
      effectiveFrom: v.number(),
      effectiveTo: v.optional(v.number()),
      productCategoryFilter: v.optional(v.string()),
      notes: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { rateId, data }) => {
    if (rateId) {
      await ctx.db.update(rateId, { ...data });
      return { success: true, rateId };
    } else {
      const id = await ctx.db.insert("taxRates", data);
      return { success: true, rateId: id };
    }
  },
});

/**
 * updateCompanyTaxProfile — Link company to jurisdiction(s) and enable tax types
 */
export const updateCompanyTaxProfile = authMutation({
  args: {
    companyId: v.id("cannabisCompanies"),
    primaryJurisdictionId: v.id("taxJurisdictions"),
    nexusStates: v.array(v.string()),
    filingCalendar: v.record(v.string(), v.string()),
    taxTypesEnabled: v.array(v.id("taxTypes")),
  },
  handler: async (ctx, { companyId, primaryJurisdictionId, nexusStates, filingCalendar, taxTypesEnabled }) => {
    const existing = await db
      .query("taxProfiles")
      .filter(q => q.eq(q.field("companyId"), companyId))
      .first();

    if (existing) {
      await ctx.db.update(existing._id, {
        primaryJurisdictionId,
        nexusStates,
        filingCalendar,
        taxTypesEnabled,
      });
      return { success: true, profileId: existing._id };
    } else {
      const id = await ctx.db.insert("taxProfiles", {
        companyId,
        state: "", // derived from jurisdiction; keep for compatibility
        primaryJurisdictionId,
        nexusStates,
        filingCalendar,
        taxTypesEnabled,
        isPrimary: true,
      });
      return { success: true, profileId: id };
    }
  },
});
