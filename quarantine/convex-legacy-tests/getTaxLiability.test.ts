/**
 * getTaxLiability — comprehensive unit tests
 * Covers: period aggregation (monthly/annual roll-up), summary breakdown by tax type,
 * filter by companyId, empty periods, date-range queries
 */

import { describe, it, expect, beforeEach } from "vitest";
import { getTaxLiability } from "../tax";
import { createSeededDatabase, createMockContext } from "./testUtils";
import {
  mockCompanyId,
  mockJurisdictionId,
  mockExciseTypeId,
  mockSalesTypeId,
  mockTaxProfileId,
  baseTimestamp,
  monthStart,
  monthEnd,
} from "./fixtures/taxFixtures";

describe("getTaxLiability", () => {
  let db: ReturnType<typeof createSeededDatabase>;
  let ctx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    db = createSeededDatabase();
    ctx = createMockContext({ db });
  });

  describe("Basic Aggregation", () => {
    it("should aggregate tax calculations by jurisdiction for a period", async () => {
      // Setup: create tax profile and some calculation records
      await db.insert("taxProfiles", {
        _id: mockTaxProfileId,
        companyId: mockCompanyId,
        state: "CO",
        primaryJurisdictionId: mockJurisdictionId,
        nexusStates: ["CO"],
        filingCalendar: {},
        taxTypesEnabled: [mockExciseTypeId],
        isPrimary: true,
      });

      const periodStart = monthStart(baseTimestamp);
      const periodEnd = monthEnd(baseTimestamp);

      // Create two tax calculations: one excise, one sales
      await db.insert("taxCalculations", {
        companyId: mockCompanyId,
        jurisdictionId: mockJurisdictionId,
        taxTypeId: mockExciseTypeId,
        taxableAmount: 100,
        taxAmount: 15,
        calculationMethod: "manual_rate",
        calculatedAt: baseTimestamp,
        periodStart,
        periodEnd,
        isPosted: false,
        postedAt: null,
      });

      await db.insert("taxCalculations", {
        companyId: mockCompanyId,
        jurisdictionId: mockJurisdictionId,
        taxTypeId: mockSalesTypeId,
        taxableAmount: 100,
        taxAmount: 5,
        calculationMethod: "manual_rate",
        calculatedAt: baseTimestamp,
        periodStart,
        periodEnd,
        isPosted: false,
        postedAt: null,
      });

      // Act
      const result = await getTaxLiability.handler(ctx, {
        companyId: mockCompanyId,
        periodStart,
        periodEnd,
      });

      // Assert
      expect(result.byJurisdiction).toHaveLength(1);
      const jurisdiction = result.byJurisdiction[0];
      expect(jurisdiction.name).toBe("Colorado");
      expect(jurisdiction.total).toBe(20);
      expect(jurisdiction.byTaxType).toHaveLength(2);

      const excise = jurisdiction.byTaxType.find(t => t.code === "excise");
      const sales = jurisdiction.byTaxType.find(t => t.code === "sales");
      expect(excise?.amount).toBe(15);
      expect(sales?.amount).toBe(5);

      expect(result.grandTotal).toBe(20);
    });

    it("should aggregate multiple periods separately", async () => {
      await db.insert("taxProfiles", {
        _id: mockTaxProfileId,
        companyId: mockCompanyId,
        state: "CO",
        primaryJurisdictionId: mockJurisdictionId,
        nexusStates: ["CO"],
        filingCalendar: {},
        taxTypesEnabled: [mockExciseTypeId],
        isPrimary: true,
      });

      const janStart = monthStart(baseTimestamp);
      const janEnd = monthEnd(baseTimestamp);

      const febTimestamp = baseTimestamp + 31 * 24 * 60 * 60 * 1000;
      const febStart = monthStart(febTimestamp);
      const febEnd = monthEnd(febTimestamp);

      // January calculation
      await db.insert("taxCalculations", {
        companyId: mockCompanyId,
        jurisdictionId: mockJurisdictionId,
        taxTypeId: mockExciseTypeId,
        taxableAmount: 100,
        taxAmount: 15,
        calculationMethod: "manual_rate",
        calculatedAt: baseTimestamp,
        periodStart: janStart,
        periodEnd: janEnd,
        isPosted: false,
        postedAt: null,
      });

      // February calculation
      await db.insert("taxCalculations", {
        companyId: mockCompanyId,
        jurisdictionId: mockJurisdictionId,
        taxTypeId: mockExciseTypeId,
        taxableAmount: 200,
        taxAmount: 30,
        calculationMethod: "manual_rate",
        calculatedAt: febTimestamp,
        periodStart: febStart,
        periodEnd: febEnd,
        isPosted: false,
        postedAt: null,
      });

      // Query January only
      const janResult = await getTaxLiability.handler(ctx, {
        companyId: mockCompanyId,
        periodStart: janStart,
        periodEnd: janEnd,
      });
      expect(janResult.grandTotal).toBe(15);

      // Query February only
      const febResult = await getTaxLiability.handler(ctx, {
        companyId: mockCompanyId,
        periodStart: febStart,
        periodEnd: febEnd,
      });
      expect(febResult.grandTotal).toBe(30);
    });

    it("should group by jurisdiction when company has nexus in multiple states", async () => {
      // Create two jurisdictions
      const caJurisdictionId = "jurisdiction_CA";
      await db.insert("taxJurisdictions", {
        _id: caJurisdictionId,
        companyId: null,
        stateCode: "CA",
        jurisdictionName: "California",
        jurisdictionLevel: "state",
        filingFrequency: "monthly",
        nexusThreshold: 100000,
        isActive: true,
        createdAt: 1704067200000,
        updatedAt: 1704067200000,
      });

      const caSalesTypeId = "type_sales_CA";
      await db.insert("taxTypes", {
        _id: caSalesTypeId,
        code: "sales_CA",
        name: "CA Sales Tax",
        calculationBasis: "percentage",
        appliesToProductCategories: ["*"],
        isIncludedInPrice: false,
      });

      await db.insert("taxRates", {
        jurisdictionId: caJurisdictionId,
        taxTypeId: caSalesTypeId,
        rate: 0.08,
        rateType: "percentage",
        effectiveFrom: 1704067200000,
        effectiveTo: null,
      });

      // Profile with nexus in both CO and CA
      const profileId = "profile_multi";
      await db.insert("taxProfiles", {
        _id: profileId,
        companyId: mockCompanyId,
        state: "CO",
        primaryJurisdictionId: mockJurisdictionId,
        nexusStates: ["CO", "CA"],
        filingCalendar: {},
        taxTypesEnabled: [mockExciseTypeId, caSalesTypeId],
        isPrimary: true,
      });

      const periodStart = monthStart(baseTimestamp);
      const periodEnd = monthEnd(baseTimestamp);

      // Calculation for CO
      await db.insert("taxCalculations", {
        companyId: mockCompanyId,
        jurisdictionId: mockJurisdictionId,
        taxTypeId: mockExciseTypeId,
        taxableAmount: 100,
        taxAmount: 15,
        calculationMethod: "manual_rate",
        calculatedAt: baseTimestamp,
        periodStart,
        periodEnd,
        isPosted: false,
        postedAt: null,
      });

      // Calculation for CA
      await db.insert("taxCalculations", {
        companyId: mockCompanyId,
        jurisdictionId: caJurisdictionId,
        taxTypeId: caSalesTypeId,
        taxableAmount: 100,
        taxAmount: 8,
        calculationMethod: "manual_rate",
        calculatedAt: baseTimestamp,
        periodStart,
        periodEnd,
        isPosted: false,
        postedAt: null,
      });

      const result = await getTaxLiability.handler(ctx, {
        companyId: mockCompanyId,
        periodStart,
        periodEnd,
      });

      expect(result.byJurisdiction).toHaveLength(2);
      expect(result.grandTotal).toBe(23);

      const coJur = result.byJurisdiction.find(j => j.name === "Colorado");
      const caJur = result.byJurisdiction.find(j => j.name === "California");
      expect(coJur?.total).toBe(15);
      expect(caJur?.total).toBe(8);
    });
  });

  describe("Filtering and Querying", () => {
    it("should filter by companyId correctly", async () => {
      // Two companies' data
      const companyA = "company_A";
      const companyB = "company_B";

      await db.insert("taxProfiles", {
        _id: "profile_A",
        companyId: companyA,
        state: "CO",
        primaryJurisdictionId: mockJurisdictionId,
        nexusStates: ["CO"],
        filingCalendar: {},
        taxTypesEnabled: [mockExciseTypeId],
        isPrimary: true,
      });

      const periodStart = monthStart(baseTimestamp);
      const periodEnd = monthEnd(baseTimestamp);

      await db.insert("taxCalculations", {
        companyId: companyA,
        jurisdictionId: mockJurisdictionId,
        taxTypeId: mockExciseTypeId,
        taxableAmount: 100,
        taxAmount: 15,
        calculationMethod: "manual_rate",
        calculatedAt: baseTimestamp,
        periodStart,
        periodEnd,
        isPosted: false,
        postedAt: null,
      });

      await db.insert("taxCalculations", {
        companyId: companyB,
        jurisdictionId: mockJurisdictionId,
        taxTypeId: mockExciseTypeId,
        taxableAmount: 50,
        taxAmount: 7.5,
        calculationMethod: "manual_rate",
        calculatedAt: baseTimestamp,
        periodStart,
        periodEnd,
        isPosted: false,
        postedAt: null,
      });

      const resultA = await getTaxLiability.handler(ctx, {
        companyId: companyA,
        periodStart,
        periodEnd,
      });

      const resultB = await getTaxLiability.handler(ctx, {
        companyId: companyB,
        periodStart,
        periodEnd,
      });

      expect(resultA.grandTotal).toBe(15);
      expect(resultB.grandTotal).toBe(7.5);
    });

    it("should exclude posted calculations (isPosted = true)", async () => {
      await db.insert("taxProfiles", {
        _id: mockTaxProfileId,
        companyId: mockCompanyId,
        state: "CO",
        primaryJurisdictionId: mockJurisdictionId,
        nexusStates: ["CO"],
        filingCalendar: {},
        taxTypesEnabled: [mockExciseTypeId],
        isPrimary: true,
      });

      const periodStart = monthStart(baseTimestamp);
      const periodEnd = monthEnd(baseTimestamp);

      // Unposted calculation
      await db.insert("taxCalculations", {
        companyId: mockCompanyId,
        jurisdictionId: mockJurisdictionId,
        taxTypeId: mockExciseTypeId,
        taxableAmount: 100,
        taxAmount: 15,
        calculationMethod: "manual_rate",
        calculatedAt: baseTimestamp,
        periodStart,
        periodEnd,
        isPosted: false,
        postedAt: null,
      });

      // Posted calculation (should be excluded)
      await db.insert("taxCalculations", {
        companyId: mockCompanyId,
        jurisdictionId: mockJurisdictionId,
        taxTypeId: mockExciseTypeId,
        taxableAmount: 50,
        taxAmount: 7.5,
        calculationMethod: "manual_rate",
        calculatedAt: baseTimestamp,
        periodStart,
        periodEnd,
        isPosted: true,
        postedAt: baseTimestamp,
      });

      const result = await getTaxLiability.handler(ctx, {
        companyId: mockCompanyId,
        periodStart,
        periodEnd,
      });

      expect(result.grandTotal).toBe(15);
    });

    it("should return empty result when no calculations exist for period", async () => {
      await db.insert("taxProfiles", {
        _id: mockTaxProfileId,
        companyId: mockCompanyId,
        state: "CO",
        primaryJurisdictionId: mockJurisdictionId,
        nexusStates: ["CO"],
        filingCalendar: {},
        taxTypesEnabled: [mockExciseTypeId],
        isPrimary: true,
      });

      const futurePeriodStart = monthStart(baseTimestamp + 365 * 24 * 60 * 60 * 1000); // next year
      const futurePeriodEnd = monthEnd(futurePeriodStart);

      const result = await getTaxLiability.handler(ctx, {
        companyId: mockCompanyId,
        periodStart: futurePeriodStart,
        periodEnd: futurePeriodEnd,
      });

      expect(result.byJurisdiction).toEqual([]);
      expect(result.grandTotal).toBe(0);
    });
  });

  describe("Date Range Queries", () => {
    it("should support custom date ranges beyond single month", async () => {
      await db.insert("taxProfiles", {
        _id: mockTaxProfileId,
        companyId: mockCompanyId,
        state: "CO",
        primaryJurisdictionId: mockJurisdictionId,
        nexusStates: ["CO"],
        filingCalendar: {},
        taxTypesEnabled: [mockExciseTypeId],
        isPrimary: true,
      });

      const q1Start = monthStart(1704067200000); // Jan 2024
      const q1End = monthStart(1706745600000) - 1; // day before Apr 1

      // Jan calculation
      await db.insert("taxCalculations", {
        companyId: mockCompanyId,
        jurisdictionId: mockJurisdictionId,
        taxTypeId: mockExciseTypeId,
        taxableAmount: 100,
        taxAmount: 15,
        calculationMethod: "manual_rate",
        calculatedAt: 1705273200000,
        periodStart: monthStart(1704067200000),
        periodEnd: monthEnd(1704067200000),
        isPosted: false,
        postedAt: null,
      });

      // Feb calculation
      await db.insert("taxCalculations", {
        companyId: mockCompanyId,
        jurisdictionId: mockJurisdictionId,
        taxTypeId: mockExciseTypeId,
        taxableAmount: 200,
        taxAmount: 30,
        calculationMethod: "manual_rate",
        calculatedAt: 1707951600000,
        periodStart: monthStart(1706745600000),
        periodEnd: monthEnd(1706745600000),
        isPosted: false,
        postedAt: null,
      });

      // Mar calculation
      await db.insert("taxCalculations", {
        companyId: mockCompanyId,
        jurisdictionId: mockJurisdictionId,
        taxTypeId: mockExciseTypeId,
        taxableAmount: 150,
        taxAmount: 22.5,
        calculationMethod: "manual_rate",
        calculatedAt: 1710543600000,
        periodStart: monthStart(1709251200000),
        periodEnd: monthEnd(1709251200000),
        isPosted: false,
        postedAt: null,
      });

      const result = await getTaxLiability.handler(ctx, {
        companyId: mockCompanyId,
        periodStart: q1Start,
        periodEnd: q1End,
      });

      expect(result.grandTotal).toBeCloseTo(67.5, 1);
    });
  });

  describe("Tax Type Breakdown", () => {
    it("should break down totals by tax type within each jurisdiction", async () => {
      await db.insert("taxProfiles", {
        _id: mockTaxProfileId,
        companyId: mockCompanyId,
        state: "CO",
        primaryJurisdictionId: mockJurisdictionId,
        nexusStates: ["CO"],
        filingCalendar: {},
        taxTypesEnabled: [mockExciseTypeId, mockSalesTypeId],
        isPrimary: true,
      });

      const periodStart = monthStart(baseTimestamp);
      const periodEnd = monthEnd(baseTimestamp);

      // Multiple excise calculations (e.g. multiple transactions)
      await db.insert("taxCalculations", {
        companyId: mockCompanyId,
        jurisdictionId: mockJurisdictionId,
        taxTypeId: mockExciseTypeId,
        taxableAmount: 100,
        taxAmount: 15,
        calculationMethod: "manual_rate",
        calculatedAt: baseTimestamp,
        periodStart,
        periodEnd,
        isPosted: false,
        postedAt: null,
      });

      await db.insert("taxCalculations", {
        companyId: mockCompanyId,
        jurisdictionId: mockJurisdictionId,
        taxTypeId: mockExciseTypeId,
        taxableAmount: 200,
        taxAmount: 30,
        calculationMethod: "manual_rate",
        calculatedAt: baseTimestamp + 10000,
        periodStart,
        periodEnd,
        isPosted: false,
        postedAt: null,
      });

      // One sales calculation
      await db.insert("taxCalculations", {
        companyId: mockCompanyId,
        jurisdictionId: mockJurisdictionId,
        taxTypeId: mockSalesTypeId,
        taxableAmount: 100,
        taxAmount: 5,
        calculationMethod: "manual_rate",
        calculatedAt: baseTimestamp,
        periodStart,
        periodEnd,
        isPosted: false,
        postedAt: null,
      });

      const result = await getTaxLiability.handler(ctx, {
        companyId: mockCompanyId,
        periodStart,
        periodEnd,
      });

      const jurisdiction = result.byJurisdiction[0];
      const excise = jurisdiction.byTaxType.find(t => t.code === "excise");
      const sales = jurisdiction.byTaxType.find(t => t.code === "sales");

      expect(excise?.amount).toBe(45); // 15 + 30
      expect(sales?.amount).toBe(5);
      expect(jurisdiction.total).toBe(50);
    });
  });

  describe("Missing Profile Handling", () => {
    it("should return empty when company has no tax profile", async () => {
      // Don't create any tax profile for this company
      const periodStart = monthStart(baseTimestamp);
      const periodEnd = monthEnd(baseTimestamp);

      const result = await getTaxLiability.handler(ctx, {
        companyId: "company_without_profile",
        periodStart,
        periodEnd,
      });

      // Query returns empty array because no calculations can exist without profile (but doesn't throw)
      expect(result.byJurisdiction).toEqual([]);
      expect(result.grandTotal).toBe(0);
    });
  });
});
