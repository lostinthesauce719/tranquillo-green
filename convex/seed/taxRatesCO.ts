import { internal } from "@/convex/server";
import { v } from "convex/values";

/**
 * CO Tax Rate Seed — Manual Rate Tables
 *
 * Seeds Colorado state-level jurisdictions and tax types:
 * - Cannabis Excise Tax: 15% (adult-use; medical would be 8% but simplified)
 * - Sales Tax: 5% (simplified MVP; actual CO is ~2.9% state + local avg ~2.8%)
 *
 * This seed runs once via `npx convex seed --file convex/seed/taxRatesCO.ts`
 * or can be called from a migration script.
 */

export default async function() {
  // ─── 1. Create CO State Jurisdiction ────────────────────────────────────
  const coJurisdiction = await internal.db.insert("taxJurisdictions", {
    companyId: null, // system-wide jurisdiction, not company-specific
    stateCode: "CO",
    jurisdictionName: "Colorado",
    jurisdictionLevel: "state",
    filingFrequency: "monthly",
    nexusThreshold: 100000, // $100k threshold for economic nexus (typical)
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  // ─── 2. Create Tax Types ─────────────────────────────────────────────────
  const exciseType = await internal.db.insert("taxTypes", {
    code: "excise",
    name: "Cannabis Excise Tax",
    description: "State cannabis excise tax on retail sales",
    calculationBasis: "percentage",
    appliesToProductCategories: ["*"], // all cannabis products
    isIncludedInPrice: false,
  });

  const salesType = await internal.db.insert("taxTypes", {
    code: "sales",
    name: "State Sales Tax",
    description: "General state sales tax",
    calculationBasis: "percentage",
    appliesToProductCategories: ["*"],
    isIncludedInPrice: false,
  });

  // ─── 3. Create Tax Rates ─────────────────────────────────────────────────
  // CO Excise: 15% (adult-use cannabis)
  await internal.db.insert("taxRates", {
    jurisdictionId: coJurisdiction,
    taxTypeId: exciseType,
    rate: 0.15,
    rateType: "percentage",
    effectiveFrom: 1704067200000, // 2024-01-01
    effectiveTo: null, // currently active
    productCategoryFilter: null,
    notes: "Colorado adult-use cannabis excise tax (15%). Medical is 8% — use category filter to distinguish.",
  });

  // CO Sales: 5% simplified (actual varies by locality)
  await internal.db.insert("taxRates", {
    jurisdictionId: coJurisdiction,
    taxTypeId: salesType,
    rate: 0.05,
    rateType: "percentage",
    effectiveFrom: 1704067200000,
    effectiveTo: null,
    productCategoryFilter: null,
    notes: "Simplified CO sales tax for MVP. Real rates require county/city lookup.",
  });

  console.log("✓ Seeded CO tax jurisdictions, types, and rates");
}
