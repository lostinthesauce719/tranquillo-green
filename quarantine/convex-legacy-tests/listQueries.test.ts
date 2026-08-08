/**
 * listTaxTypes, listJurisdictions, listTaxRates — comprehensive unit tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { listTaxTypes, listJurisdictions, listTaxRates } from "../tax";
import { createSeededDatabase, createMockContext } from "./testUtils";
import {
  mockJurisdictionId,
  mockExciseTypeId,
  mockSalesTypeId,
  mockCompanyId,
} from "./fixtures/taxFixtures";

describe("List Queries", () => {
  let db: ReturnType<typeof createSeededDatabase>;
  let ctx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    db = createSeededDatabase();
    ctx = createMockContext({ db });
  });

  describe("listTaxTypes", () => {
    it("should return all tax types", async () => {
      const result = await listTaxTypes.handler(ctx, {});

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2); // excise and sales
      const codes = result.map((t: any) => t.code).sort();
      expect(codes).toEqual(["excise", "sales"]);
    });

    it("should include tax type details", async () => {
      const result = await listTaxTypes.handler(ctx, {});

      const excise = result.find((t: any) => t.code === "excise");
      expect(excise).toBeDefined();
      expect(excise.name).toBe("Cannabis Excise Tax");
      expect(excise.calculationBasis).toBe("percentage");
      expect(excise.appliesToProductCategories).toContain("*");
    });
  });

  describe("listJurisdictions", () => {
    it("should return system-wide jurisdictions (companyId null)", async () => {
      const result = await listJurisdictions.handler(ctx, {
        companyId: mockCompanyId,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].stateCode).toBe("CO");
      expect(result[0].jurisdictionName).toBe("Colorado");
    });

    it("should include company-specific jurisdictions in addition to system ones", async () => {
      // Create a company-specific jurisdiction
      const companySpecificId = "jurisdiction_company_specific";
      await db.insert("taxJurisdictions", {
        _id: companySpecificId,
        companyId: mockCompanyId,
        stateCode: "NY",
        jurisdictionName: "New York (Custom)",
        jurisdictionLevel: "state",
        filingFrequency: "monthly",
        nexusThreshold: 500000,
        isActive: true,
        createdAt: 1704067200000,
        updatedAt: 1704067200000,
      });

      const result = await listJurisdictions.handler(ctx, {
        companyId: mockCompanyId,
      });

      expect(result.length).toBe(2);
      const stateCodes = result.map((j: any) => j.stateCode);
      expect(stateCodes).toContain("CO");
      expect(stateCodes).toContain("NY");
    });

    it("should not return other companies' jurisdictions", async () => {
      const otherCompanyId = "company_other";
      await db.insert("taxJurisdictions", {
        _id: "jurisdiction_other",
        companyId: otherCompanyId,
        stateCode: "TX",
        jurisdictionName: "Texas",
        jurisdictionLevel: "state",
        filingFrequency: "monthly",
        nexusThreshold: 100000,
        isActive: true,
        createdAt: 1704067200000,
        updatedAt: 1704067200000,
      });

      const result = await listJurisdictions.handler(ctx, {
        companyId: mockCompanyId,
      });

      // Should only see system jurisdictions + company-specific (none for mockCompanyId)
      const stateCodes = result.map((j: any) => j.stateCode);
      expect(stateCodes).not.toContain("TX");
    });
  });

  describe("listTaxRates", () => {
    it("should return all tax rates when no filters provided", async () => {
      // Add another rate
      await db.insert("taxRates", {
        jurisdictionId: mockJurisdictionId,
        taxTypeId: mockSalesTypeId,
        rate: 0.05,
        rateType: "percentage",
        effectiveFrom: 1704067200000,
        effectiveTo: null,
        productCategoryFilter: null,
        notes: null,
      });

      const result = await listTaxRates.handler(ctx, {});

      expect(Array.isArray(result)).toBe(true);
      // Should have excise and sales rates
      const types = result.map((r: any) => r.taxTypeId);
      expect(types).toContain(mockExciseTypeId);
      expect(types).toContain(mockSalesTypeId);
    });

    it("should filter by jurisdictionId", async () => {
      const otherJurisdictionId = "jurisdiction_other";
      await db.insert("taxJurisdictions", {
        _id: otherJurisdictionId,
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

      await db.insert("taxRates", {
        jurisdictionId: otherJurisdictionId,
        taxTypeId: mockExciseTypeId,
        rate: 0.12,
        rateType: "percentage",
        effectiveFrom: 1704067200000,
        effectiveTo: null,
        productCategoryFilter: null,
        notes: null,
      });

      const result = await listTaxRates.handler(ctx, {
        jurisdictionId: otherJurisdictionId,
      });

      expect(result.every((r: any) => r.jurisdictionId === otherJurisdictionId)).toBe(true);
    });

    it("should filter by taxTypeId", async () => {
      const resultExcise = await listTaxRates.handler(ctx, {
        taxTypeId: mockExciseTypeId,
      });

      expect(resultExcise.every((r: any) => r.taxTypeId === mockExciseTypeId)).toBe(true);

      const resultSales = await listTaxRates.handler(ctx, {
        taxTypeId: mockSalesTypeId,
      });

      expect(resultSales.every((r: any) => r.taxTypeId === mockSalesTypeId)).toBe(true);
    });

    it("should combine jurisdictionId and taxTypeId filters", async () => {
      const result = await listTaxRates.handler(ctx, {
        jurisdictionId: mockJurisdictionId,
        taxTypeId: mockExciseTypeId,
      });

      expect(result.length).toBe(1);
      expect(result[0].jurisdictionId).toBe(mockJurisdictionId);
      expect(result[0].taxTypeId).toBe(mockExciseTypeId);
    });

    it("should return empty array when no rates match filters", async () => {
      const result = await listTaxRates.handler(ctx, {
        jurisdictionId: "fake_jurisdiction",
      });

      expect(result).toEqual([]);
    });

    it("should return rate details including effectiveFrom and effectiveTo", async () => {
      const result = await listTaxRates.handler(ctx, {
        jurisdictionId: mockJurisdictionId,
      });

      const exciseRate = result.find((r: any) => r.taxTypeId === mockExciseTypeId);
      expect(exciseRate).toBeDefined();
      expect(exciseRate.rate).toBe(0.15);
      expect(exciseRate.rateType).toBe("percentage");
      expect(exciseRate.effectiveFrom).toBe(1704067200000);
      expect(exciseRate.effectiveTo).toBeNull();
    });
  });
});
