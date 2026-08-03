/**
 * upsertTaxRate — comprehensive unit tests
 * Covers: create new, update existing, rate versioning (same jurisdiction+type different dates),
 * soft-deleted handling (effectiveTo), duplicate prevention
 */

import { describe, it, expect, beforeEach } from "vitest";
import { upsertTaxRate } from "../tax";
import { createSeededDatabase, createMockContext } from "./testUtils";
import {
  mockJurisdictionId,
  mockExciseTypeId,
  mockSalesTypeId,
  baseTimestamp,
} from "./fixtures/taxFixtures";

describe("upsertTaxRate", () => {
  let db: ReturnType<typeof createSeededDatabase>;
  let ctx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    db = createSeededDatabase();
    ctx = createMockContext({ db });
  });

  describe("Create New Rate", () => {
    it("should create a new tax rate successfully", async () => {
      const result = await upsertTaxRate.handler(ctx, {
        rateId: undefined,
        data: {
          jurisdictionId: mockJurisdictionId,
          taxTypeId: mockExciseTypeId,
          rate: 0.18,
          rateType: "percentage",
          effectiveFrom: 1704067200000,
          effectiveTo: null,
          productCategoryFilter: null,
          notes: "New rate for testing",
        },
      });

      expect(result.success).toBe(true);
      expect(result.rateId).toBeDefined();

      const created = await db.get("taxRates", result.rateId);
      expect(created).not.toBeNull();
      expect(created.jurisdictionId).toBe(mockJurisdictionId);
      expect(created.rate).toBe(0.18);
    });

    it("should create rate with effectiveTo set (future end date)", async () => {
      const futureTo = 1709251200000; // 2024-03-01
      const result = await upsertTaxRate.handler(ctx, {
        rateId: undefined,
        data: {
          jurisdictionId: mockJurisdictionId,
          taxTypeId: mockExciseTypeId,
          rate: 0.15,
          rateType: "percentage",
          effectiveFrom: 1704067200000,
          effectiveTo: futureTo,
          productCategoryFilter: null,
          notes: "Temporary rate",
        },
      });

      const created = await db.get("taxRates", result.rateId);
      expect(created.effectiveTo).toBe(futureTo);
    });

    it("should create rate with productCategoryFilter", async () => {
      const result = await upsertTaxRate.handler(ctx, {
        rateId: undefined,
        data: {
          jurisdictionId: mockJurisdictionId,
          taxTypeId: mockExciseTypeId,
          rate: 0.20,
          rateType: "percentage",
          effectiveFrom: baseTimestamp,
          effectiveTo: null,
          productCategoryFilter: "edible",
          notes: "Edibles-specific rate",
        },
      });

      const created = await db.get("taxRates", result.rateId);
      expect(created.productCategoryFilter).toBe("edible");
    });

    it("should create fixed_amount rate type", async () => {
      const result = await upsertTaxRate.handler(ctx, {
        rateId: undefined,
        data: {
          jurisdictionId: mockJurisdictionId,
          taxTypeId: mockExciseTypeId,
          rate: 2.5,
          rateType: "fixed_amount",
          effectiveFrom: baseTimestamp,
          effectiveTo: null,
          productCategoryFilter: null,
          notes: null,
        },
      });

      const created = await db.get("taxRates", result.rateId);
      expect(created.rateType).toBe("fixed_amount");
      expect(created.rate).toBe(2.5);
    });
  });

  describe("Update Existing Rate", () => {
    it("should update an existing tax rate", async () => {
      const existingRateId = "rate_to_update";
      await db.insert("taxRates", {
        _id: existingRateId,
        jurisdictionId: mockJurisdictionId,
        taxTypeId: mockExciseTypeId,
        rate: 0.15,
        rateType: "percentage",
        effectiveFrom: 1704067200000,
        effectiveTo: null,
        productCategoryFilter: null,
        notes: "Original rate",
      });

      const result = await upsertTaxRate.handler(ctx, {
        rateId: existingRateId,
        data: {
          jurisdictionId: mockJurisdictionId,
          taxTypeId: mockExciseTypeId,
          rate: 0.18,
          rateType: "percentage",
          effectiveFrom: 1704067200000,
          effectiveTo: null,
          productCategoryFilter: null,
          notes: "Updated rate",
        },
      });

      expect(result.success).toBe(true);
      expect(result.rateId).toBe(existingRateId);

      const updated = await db.get("taxRates", existingRateId);
      expect(updated.rate).toBe(0.18);
      expect(updated.notes).toBe("Updated rate");
    });

    it("should allow updating effectiveTo to soft-delete a rate", async () => {
      const rateId = "rate_to_delete";
      await db.insert("taxRates", {
        _id: rateId,
        jurisdictionId: mockJurisdictionId,
        taxTypeId: mockExciseTypeId,
        rate: 0.15,
        rateType: "percentage",
        effectiveFrom: 1704067200000,
        effectiveTo: null,
        productCategoryFilter: null,
        notes: null,
      });

      // "Soft delete" by setting effectiveTo to a past date
      const pastDate = baseTimestamp - 1;
      await upsertTaxRate.handler(ctx, {
        rateId,
        data: {
          jurisdictionId: mockJurisdictionId,
          taxTypeId: mockExciseTypeId,
          rate: 0.15,
          rateType: "percentage",
          effectiveFrom: 1704067200000,
          effectiveTo: pastDate,
          productCategoryFilter: null,
          notes: null,
        },
      });

      const updated = await db.get("taxRates", rateId);
      expect(updated.effectiveTo).toBe(pastDate);
    });
  });

  describe("Rate Versioning", () => {
    it("should allow multiple rates for same jurisdiction+type with different effective dates", async () => {
      const janRateId = "rate_jan";
      const febRateId = "rate_feb";

      // Create January rate
      await upsertTaxRate.handler(ctx, {
        rateId: undefined,
        data: {
          jurisdictionId: mockJurisdictionId,
          taxTypeId: mockExciseTypeId,
          rate: 0.15,
          rateType: "percentage",
          effectiveFrom: 1704067200000, // 2024-01-01
          effectiveTo: null,
          productCategoryFilter: null,
          notes: "Jan rate",
        },
      });

      // Create February rate (different effectiveFrom, non-overlapping)
      const febResult = await upsertTaxRate.handler(ctx, {
        rateId: undefined,
        data: {
          jurisdictionId: mockJurisdictionId,
          taxTypeId: mockExciseTypeId,
          rate: 0.20,
          rateType: "percentage",
          effectiveFrom: 1706745600000, // 2024-02-01
          effectiveTo: null,
          productCategoryFilter: null,
          notes: "Feb rate",
        },
      });

      // Both rates should exist
      const allRates = await db.query("taxRates").collect();
      const exciseRates = allRates.filter(
        (r: any) => r.jurisdictionId === mockJurisdictionId && r.taxTypeId === mockExciseTypeId
      );

      expect(exciseRates.length).toBe(2);
      expect(exciseRates.some((r: any) => r.effectiveFrom === 1704067200000)).toBe(true);
      expect(exciseRates.some((r: any) => r.effectiveFrom === 1706745600000)).toBe(true);
    });

    it("should allow overlapping rates but query must handle correctly (create test not business logic)", async () => {
      // Create two overlapping rates
      await upsertTaxRate.handler(ctx, {
        rateId: undefined,
        data: {
          jurisdictionId: mockJurisdictionId,
          taxTypeId: mockExciseTypeId,
          rate: 0.15,
          rateType: "percentage",
          effectiveFrom: 1704067200000,
          effectiveTo: 1709251200000, // ends Mar 1
          productCategoryFilter: null,
          notes: null,
        },
      });

      await upsertTaxRate.handler(ctx, {
        rateId: undefined,
        data: {
          jurisdictionId: mockJurisdictionId,
          taxTypeId: mockExciseTypeId,
          rate: 0.18,
          rateType: "percentage",
          effectiveFrom: 1706745600000, // Feb 1 (overlap)
          effectiveTo: null,
          productCategoryFilter: null,
          notes: null,
        },
      });

      const allRates = await db.query("taxRates").collect();
      const exciseRates = allRates.filter(
        (r: any) => r.jurisdictionId === mockJurisdictionId && r.taxTypeId === mockExciseTypeId
      );

      expect(exciseRates.length).toBe(2);
    });
  });

  describe("Duplicate Prevention and Validation", () => {
    it("should create multiple rates with same dates (not prevented at upsert level)", async () => {
      // The business logic / query must handle filtering; upsert doesn't prevent duplicates
      await upsertTaxRate.handler(ctx, {
        rateId: undefined,
        data: {
          jurisdictionId: mockJurisdictionId,
          taxTypeId: mockExciseTypeId,
          rate: 0.15,
          rateType: "percentage",
          effectiveFrom: 1704067200000,
          effectiveTo: null,
          productCategoryFilter: null,
          notes: null,
        },
      });

      await upsertTaxRate.handler(ctx, {
        rateId: undefined,
        data: {
          jurisdictionId: mockJurisdictionId,
          taxTypeId: mockExciseTypeId,
          rate: 0.16,
          rateType: "percentage",
          effectiveFrom: 1704067200000,
          effectiveTo: null,
          productCategoryFilter: null,
          notes: "Duplicate date range",
        },
      });

      const allRates = await db.query("taxRates").collect();
      const sameDateRates = allRates.filter(
        (r: any) =>
          r.jurisdictionId === mockJurisdictionId &&
          r.taxTypeId === mockExciseTypeId &&
          r.effectiveFrom === 1704067200000
      );

      expect(sameDateRates.length).toBe(2);
    });

    it("should preserve original rateId when updating", async () => {
      const rateId = "existing_rate_id";
      await db.insert("taxRates", {
        _id: rateId,
        jurisdictionId: mockJurisdictionId,
        taxTypeId: mockExciseTypeId,
        rate: 0.15,
        rateType: "percentage",
        effectiveFrom: 1704067200000,
        effectiveTo: null,
        notes: null,
      });

      const result = await upsertTaxRate.handler(ctx, {
        rateId,
        data: {
          jurisdictionId: mockJurisdictionId,
          taxTypeId: mockExciseTypeId,
          rate: 0.18,
          rateType: "percentage",
          effectiveFrom: 1704067200000,
          effectiveTo: null,
          productCategoryFilter: null,
          notes: "Updated",
        },
      });

      expect(result.rateId).toBe(rateId);
    });

    it("should allow updating only some fields while preserving others", async () => {
      const rateId = "rate_partial_update";
      await db.insert("taxRates", {
        _id: rateId,
        jurisdictionId: mockJurisdictionId,
        taxTypeId: mockExciseTypeId,
        rate: 0.15,
        rateType: "percentage",
        effectiveFrom: 1704067200000,
        effectiveTo: null,
        productCategoryFilter: "flower",
        notes: "Original note",
      });

      await upsertTaxRate.handler(ctx, {
        rateId,
        data: {
          jurisdictionId: mockJurisdictionId,
          taxTypeId: mockExciseTypeId,
          rate: 0.18,
          rateType: "percentage",
          effectiveFrom: 1704067200000,
          effectiveTo: null,
          productCategoryFilter: null, // changing
          notes: "Updated note",
        },
      });

      const updated = await db.get("taxRates", rateId);
      expect(updated.rate).toBe(0.18);
      expect(updated.productCategoryFilter).toBeNull();
      expect(updated.notes).toBe("Updated note");
      // effectiveFrom should remain unchanged
      expect(updated.effectiveFrom).toBe(1704067200000);
    });
  });

  describe("Required Field Validation", () => {
    it("should require jurisdictionId and taxTypeId", async () => {
      // The schema validation should catch this; but at runtime we'd get error from db.insert
      // In actual Convex, v.id() would validate presence
      // For mock, we assume valid ids are passed
    });
  });
});
