import { v } from "convex/values";
import { authMutation, authQuery, requireRecordAccess, getOwnedRecord } from "./lib/withAuth";

/**
 * Tax Filings — Generate and manage tax filings from calculations.
 *
 * After tax calculations are performed (e.g., monthly), generate a filing for each jurisdiction.
 */

// ─── QUERIES ───────────────────────────────────────────────────────────────

/**
 * Get tax filings for a company by period or status.
 */
export const getTaxFilings = authQuery({
  args: {
    companyId: v.id("cannabisCompanies"),
    periodStart: v.optional(v.number()),
    periodEnd: v.optional(v.number()),
    status: v.optional(
      v.union(v.literal("pending"), v.literal("ready"), v.literal("filed"), v.literal("late"))
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { companyId, periodStart, periodEnd, status, limit = 50 }) => {
    let q = ctx.db.query("taxFilings").eq("companyId", companyId);
    if (periodStart || periodEnd) {
      q = q.filter(q =>
        q.gte(q.field("periodStart"), periodStart).lte(q.field("periodEnd"), periodEnd)
      );
    }
    if (status) q = q.eq("status", status);
    return await q.order("desc").limit(limit).collect();
  },
});

/**
 * Get a specific tax filing by ID.
 */
export const getTaxFiling = authQuery({
  args: {
    filingId: v.id("taxFilings"),
  },
  handler: async (ctx, { filingId }, identity) => {
    return await getOwnedRecord(ctx, identity, filingId, "filing");
  },
});

// ─── MUTATIONS ─────────────────────────────────────────────────────────────

/**
 * Generate tax filings for a given period from tax calculations.
 * This aggregates all tax calculations for a company within a period,
 * groups them by jurisdiction and tax type, and creates filing records.
 *
 * @param args - companyId, periodStart, periodEnd, filingType (optional)
 */
export const generateTaxFilings = authMutation({
  args: {
    companyId: v.id("cannabisCompanies"),
    periodStart: v.number(),
    periodEnd: v.number(),
    filingType: v.optional(v.string()), // e.g., "monthly", "quarterly", "annual"
  },
  handler: async (ctx, { companyId, periodStart, periodEnd, filingType }) => {
    // Fetch all tax calculations for the period that are not yet posted to a filing
    const calculations = await ctx.db
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

    if (calculations.length === 0) {
      throw new Error("No tax calculations found for the specified period.");
    }

    // Group by jurisdiction and tax type
    const grouped: Record<string, Array<{ calculation: any; taxType: any }>> = {};
    for (const calc of calculations) {
      const jurisdiction = await ctx.db.get(calc.jurisdictionId);
      const taxType = await ctx.db.get(calc.taxTypeId);
      if (!jurisdiction || !taxType) continue;

      const key = `${jurisdiction._id}_${taxType._id}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({ calculation: calc, taxType });
    }

    const filings: Array<Promise<any>> = [];
    let totalAmount = 0;

    // Create a filing record for each jurisdiction + tax type combination
    for (const [key, items] of Object.entries(grouped)) {
      const jurisdiction = await ctx.db.get(items[0].calculation.jurisdictionId);
      const taxType = await ctx.db.get(items[0].taxType._id);

      const filingId = await ctx.db.insert("taxFilings", {
        companyId,
        taxProfileId: null, // could link to a tax profile later
        filingType: filingType ?? "monthly",
        periodLabel: new Date(periodStart).toLocaleString("default", { month: "long", year: "numeric" }), // e.g., "October 2024"
        dueDate: null, // calculate based on jurisdiction rules
        status: "pending",
        jurisdictionId: jurisdiction._id,
        taxTypeId: taxType._id,
        taxableAmount: items.reduce((sum, item) => sum + item.calculation.taxableAmount, 0),
        taxAmount: items.reduce((sum, item) => sum + item.calculation.taxAmount, 0),
        calculationCount: items.length,
        generatedAt: Date.now(),
      });

      // Mark calculations as posted to this filing (optional)
      for (const item of items) {
        await ctx.db.patch(item.calculation._id, {
          isPosted: true,
          filingId: filingId,
          postedAt: Date.now(),
        });
      }

      filings.push(ctx.db.get(filingId));
      totalAmount += items.reduce((sum, item) => sum + item.calculation.taxAmount, 0);
    }

    const results = await Promise.all(filings);
    return {
      filings: results,
      totalTaxAmount: totalAmount,
      periodStart,
      periodEnd,
    };
  },
});

/**
 * Update a tax filing status (e.g., mark as filed, ready, etc.)
 */
export const updateTaxFiling = authMutation({
  args: {
    filingId: v.id("taxFilings"),
    updates: v.object({
      status: v.union(v.literal("pending"), v.literal("ready"), v.literal("filed"), v.literal("late")),
      filedAt: v.optional(v.number()),
      filedVia: v.optional(v.string()), // e.g., "efile", "paper"
      notes: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { filingId, updates }, identity) => {
    const filing = await ctx.db.get(filingId);
    await requireRecordAccess(ctx, identity, filing, "filing");
    if (!filing) throw new Error("Tax filing not found");

    await ctx.db.patch(filingId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(filingId);
  },
});

/**
 * Delete a tax filing (soft delete or hard?)
 * For now, hard delete — but careful, this is sensitive.
 */
export const deleteTaxFiling = authMutation({
  args: { filingId: v.id("taxFilings") },
  handler: async (ctx, { filingId }, identity) => {
    const filing = await ctx.db.get(filingId);
    await requireRecordAccess(ctx, identity, filing, "filing");
    if (!filing) throw new Error("Tax filing not found");

    await ctx.db.delete(filingId);
    return { success: true, filingId };
  },
});

// ─── HELPERS ───────────────────────────────────────────────────────────────

/**
 * Calculate and generate all overdue tax filings.
 * Useful for initial setup or catching up.
 */
export const catchUpTaxFilings = authMutation({
  args: {
    companyId: v.id("cannabisCompanies"),
    endDate: v.number(), // up to which date to catch up
  },
  handler: async (ctx, { companyId, endDate }) => {
    // Implementation: find all open periods up to endDate and generate filings.
    // This could be a heavy operation; maybe run as a background job.
    // For now, placeholder.
    throw new Error("Not implemented yet");
  },
});