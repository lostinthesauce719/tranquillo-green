/**
 * updateCompanyTaxProfile — comprehensive unit tests
 * Covers: nexus array validation, primary jurisdiction validation, filing calendar updates,
 * taxTypesEnabled toggles
 */

import { describe, it, expect, beforeEach } from "vitest";
import { updateCompanyTaxProfile } from "../tax";
import { createSeededDatabase, createMockContext } from "./testUtils";
import {
  mockCompanyId,
  mockJurisdictionId,
  mockExciseTypeId,
  mockSalesTypeId,
  mockTaxProfileId,
} from "./fixtures/taxFixtures";

describe("updateCompanyTaxProfile", () => {
  let db: ReturnType<typeof createSeededDatabase>;
  let ctx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    db = createSeededDatabase();
    ctx = createMockContext({ db });
  });

  describe("Create New Profile", () => {
    it("should create a new tax profile for a company without one", async () => {
      const result = await updateCompanyTaxProfile.handler(ctx, {
        companyId: mockCompanyId,
        primaryJurisdictionId: mockJurisdictionId,
        nexusStates: ["CO"],
        filingCalendar: { "CO-excise": "monthly" },
        taxTypesEnabled: [mockExciseTypeId],
      });

      expect(result.success).toBe(true);
      expect(result.profileId).toBeDefined();

      const profile = await db.get("taxProfiles", result.profileId);
      expect(profile).not.toBeNull();
      expect(profile.companyId).toBe(mockCompanyId);
      expect(profile.primaryJurisdictionId).toBe(mockJurisdictionId);
      expect(profile.nexusStates).toEqual(["CO"]);
      expect(profile.taxTypesEnabled).toEqual([mockExciseTypeId]);
      expect(profile.isPrimary).toBe(true);
    });

    it("should create profile with multiple nexus states", async () => {
      const result = await updateCompanyTaxProfile.handler(ctx, {
        companyId: mockCompanyId,
        primaryJurisdictionId: mockJurisdictionId,
        nexusStates: ["CO", "CA", "NV"],
        filingCalendar: { "CO-excise": "monthly" },
        taxTypesEnabled: [mockExciseTypeId],
      });

      const profile = await db.get("taxProfiles", result.profileId);
      expect(profile.nexusStates).toHaveLength(3);
      expect(profile.nexusStates).toContain("CO");
      expect(profile.nexusStates).toContain("CA");
      expect(profile.nexusStates).toContain("NV");
    });

    it("should create profile with multiple tax types enabled", async () => {
      const result = await updateCompanyTaxProfile.handler(ctx, {
        companyId: mockCompanyId,
        primaryJurisdictionId: mockJurisdictionId,
        nexusStates: ["CO"],
        filingCalendar: {
          "CO-excise": "monthly",
          "CO-sales": "quarterly",
        },
        taxTypesEnabled: [mockExciseTypeId, mockSalesTypeId],
      });

      const profile = await db.get("taxProfiles", result.profileId);
      expect(profile.taxTypesEnabled).toHaveLength(2);
      expect(profile.filingCalendar).toEqual({
        "CO-excise": "monthly",
        "CO-sales": "quarterly",
      });
    });
  });

  describe("Update Existing Profile", () => {
    beforeEach(async () => {
      // Create an existing profile
      await db.insert("taxProfiles", {
        _id: mockTaxProfileId,
        companyId: mockCompanyId,
        state: "CO",
        primaryJurisdictionId: mockJurisdictionId,
        nexusStates: ["CO"],
        filingCalendar: { "CO-excise": "monthly" },
        taxTypesEnabled: [mockExciseTypeId],
        isPrimary: true,
      });
    });

    it("should update nexusStates array", async () => {
      const result = await updateCompanyTaxProfile.handler(ctx, {
        companyId: mockCompanyId,
        primaryJurisdictionId: mockJurisdictionId,
        nexusStates: ["CO", "CA", "IL"],
        filingCalendar: { "CO-excise": "monthly" },
        taxTypesEnabled: [mockExciseTypeId],
      });

      expect(result.success).toBe(true);
      const profile = await db.get("taxProfiles", mockTaxProfileId);
      expect(profile.nexusStates).toEqual(["CO", "CA", "IL"]);
    });

    it("should update primaryJurisdictionId", async () => {
      const newJurisdictionId = "jurisdiction_CA";
      await db.insert("taxJurisdictions", {
        _id: newJurisdictionId,
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

      const result = await updateCompanyTaxProfile.handler(ctx, {
        companyId: mockCompanyId,
        primaryJurisdictionId: newJurisdictionId,
        nexusStates: ["CA"],
        filingCalendar: { "CA-sales": "monthly" },
        taxTypesEnabled: [mockSalesTypeId],
      });

      const profile = await db.get("taxProfiles", mockTaxProfileId);
      expect(profile.primaryJurisdictionId).toBe(newJurisdictionId);
      expect(profile.nexusStates).toEqual(["CA"]);
    });

    it("should update filingCalendar", async () => {
      const result = await updateCompanyTaxProfile.handler(ctx, {
        companyId: mockCompanyId,
        primaryJurisdictionId: mockJurisdictionId,
        nexusStates: ["CO"],
        filingCalendar: {
          "CO-excise": "quarterly",
          "CO-sales": "annually",
        },
        taxTypesEnabled: [mockExciseTypeId, mockSalesTypeId],
      });

      const profile = await db.get("taxProfiles", mockTaxProfileId);
      expect(profile.filingCalendar).toEqual({
        "CO-excise": "quarterly",
        "CO-sales": "annually",
      });
    });

    it("should update taxTypesEnabled array", async () => {
      const result = await updateCompanyTaxProfile.handler(ctx, {
        companyId: mockCompanyId,
        primaryJurisdictionId: mockJurisdictionId,
        nexusStates: ["CO"],
        filingCalendar: { "CO-excise": "monthly" },
        taxTypesEnabled: [mockSalesTypeId], // switch from excise to sales only
      });

      const profile = await db.get("taxProfiles", mockTaxProfileId);
      expect(profile.taxTypesEnabled).toEqual([mockSalesTypeId]);
    });

    it("should allow clearing nexusStates (empty array)", async () => {
      const result = await updateCompanyTaxProfile.handler(ctx, {
        companyId: mockCompanyId,
        primaryJurisdictionId: mockJurisdictionId,
        nexusStates: [],
        filingCalendar: { "CO-excise": "monthly" },
        taxTypesEnabled: [mockExciseTypeId],
      });

      const profile = await db.get("taxProfiles", mockTaxProfileId);
      expect(profile.nexusStates).toEqual([]);
    });
  });

  describe("Primary Jurisdiction Validation", () => {
    it("should accept primaryJurisdictionId that exists in taxJurisdictions", async () => {
      const result = await updateCompanyTaxProfile.handler(ctx, {
        companyId: mockCompanyId,
        primaryJurisdictionId: mockJurisdictionId,
        nexusStates: ["CO"],
        filingCalendar: {},
        taxTypesEnabled: [mockExciseTypeId],
      });

      expect(result.success).toBe(true);
      const profile = await db.get("taxProfiles", result.profileId);
      expect(profile.primaryJurisdictionId).toBe(mockJurisdictionId);
    });

    it("should allow primaryJurisdictionId not in nexusStates", async () => {
      // Primary is CO, but nexus only lists CA - allowed (primary implies nexus)
      const result = await updateCompanyTaxProfile.handler(ctx, {
        companyId: mockCompanyId,
        primaryJurisdictionId: mockJurisdictionId,
        nexusStates: ["CA"],
        filingCalendar: {},
        taxTypesEnabled: [mockExciseTypeId],
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Nexus States Validation", () => {
    it("should accept array of state codes", async () => {
      const states = ["CO", "CA", "NY", "MI"];
      const result = await updateCompanyTaxProfile.handler(ctx, {
        companyId: mockCompanyId,
        primaryJurisdictionId: mockJurisdictionId,
        nexusStates: states,
        filingCalendar: {},
        taxTypesEnabled: [mockExciseTypeId],
      });

      const profile = await db.get("taxProfiles", result.profileId);
      expect(profile.nexusStates).toEqual(states);
    });

    it("should handle single-state nexus array", async () => {
      const result = await updateCompanyTaxProfile.handler(ctx, {
        companyId: mockCompanyId,
        primaryJurisdictionId: mockJurisdictionId,
        nexusStates: ["CO"],
        filingCalendar: {},
        taxTypesEnabled: [mockExciseTypeId],
      });

      const profile = await db.get("taxProfiles", result.profileId);
      expect(profile.nexusStates).toEqual(["CO"]);
    });
  });

  describe("Tax Types Enabled Toggles", () => {
    it("should enable only specified tax types (replace array)", async () => {
      // First create with excise
      let result = await updateCompanyTaxProfile.handler(ctx, {
        companyId: mockCompanyId,
        primaryJurisdictionId: mockJurisdictionId,
        nexusStates: ["CO"],
        filingCalendar: {},
        taxTypesEnabled: [mockExciseTypeId],
      });

      // Update to only sales
      result = await updateCompanyTaxProfile.handler(ctx, {
        companyId: mockCompanyId,
        primaryJurisdictionId: mockJurisdictionId,
        nexusStates: ["CO"],
        filingCalendar: {},
        taxTypesEnabled: [mockSalesTypeId],
      });

      const profile = await db.get("taxProfiles", result.profileId);
      expect(profile.taxTypesEnabled).toEqual([mockSalesTypeId]);
      expect(profile.taxTypesEnabled).not.toContain(mockExciseTypeId);
    });

    it("should support empty taxTypesEnabled (disable all)", async () => {
      // Assume function allows empty array (no tax types collected)
      const result = await updateCompanyTaxProfile.handler(ctx, {
        companyId: mockCompanyId,
        primaryJurisdictionId: mockJurisdictionId,
        nexusStates: ["CO"],
        filingCalendar: {},
        taxTypesEnabled: [],
      });

      const profile = await db.get("taxProfiles", result.profileId);
      expect(profile.taxTypesEnabled).toEqual([]);
    });
  });

  describe("Filing Calendar Updates", () => {
    it("should accept arbitrary key-value pairs for filingCalendar", async () => {
      const calendar = {
        "CO-excise": "monthly",
        "CO-sales": "quarterly",
        "CA-sales": "monthly",
      };

      const result = await updateCompanyTaxProfile.handler(ctx, {
        companyId: mockCompanyId,
        primaryJurisdictionId: mockJurisdictionId,
        nexusStates: ["CO", "CA"],
        filingCalendar: calendar,
        taxTypesEnabled: [mockExciseTypeId, mockSalesTypeId],
      });

      const profile = await db.get("taxProfiles", result.profileId);
      expect(profile.filingCalendar).toEqual(calendar);
    });

    it("should allow empty filingCalendar", async () => {
      const result = await updateCompanyTaxProfile.handler(ctx, {
        companyId: mockCompanyId,
        primaryJurisdictionId: mockJurisdictionId,
        nexusStates: ["CO"],
        filingCalendar: {},
        taxTypesEnabled: [mockExciseTypeId],
      });

      const profile = await db.get("taxProfiles", result.profileId);
      expect(profile.filingCalendar).toEqual({});
    });
  });

  describe("Idempotency", () => {
    it("should update same profile multiple times without creating duplicates", async () => {
      // First call creates
      let result = await updateCompanyTaxProfile.handler(ctx, {
        companyId: mockCompanyId,
        primaryJurisdictionId: mockJurisdictionId,
        nexusStates: ["CO"],
        filingCalendar: { "CO-excise": "monthly" },
        taxTypesEnabled: [mockExciseTypeId],
      });
      const firstProfileId = result.profileId;

      // Second call updates existing
      result = await updateCompanyTaxProfile.handler(ctx, {
        companyId: mockCompanyId,
        primaryJurisdictionId: mockJurisdictionId,
        nexusStates: ["CO", "CA"],
        filingCalendar: { "CO-excise": "monthly" },
        taxTypesEnabled: [mockExciseTypeId],
      });

      expect(result.profileId).toBe(firstProfileId);

      // Only one profile exists for this company
      const allProfiles = await db.query("taxProfiles").collect();
      const companyProfiles = allProfiles.filter((p: any) => p.companyId === mockCompanyId);
      expect(companyProfiles).toHaveLength(1);
    });
  });
});
