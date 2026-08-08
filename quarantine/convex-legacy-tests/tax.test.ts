/**
 * Unit tests for CO-first tax engine
 * Tests: calculateTax, getTaxLiability, upsertTaxRate, updateCompanyTaxProfile, getUpcomingDeadlines
 */

import { describe, it, expect, beforeEach } from "vitest";
import { 
  calculateTax, 
  getTaxLiability, 
  upsertTaxRate, 
  updateCompanyTaxProfile,
  getUpcomingDeadlines,
  listTaxJurisdictions,
  listTaxTypes
} from "./tax";

// Mock Convex context
const mockCtx = {
  db: null as any,
  mutations: null as any,
  queries: null as any,
  getMutation: () => null,
  getQuery: () => null,
};

describe("Tax Engine — Colorado-first", () => {
  describe("calculateTax", () => {
    it("calculates CO excise tax at 15% on taxable amount", async () => {
      const result = await calculateTax(mockCtx, {
        companyId: "comp_123",
        taxDate: "2025-04-24",
        taxableAmount: 1000,
        jurisdictionIds: ["co_state"],
        taxTypeIds: ["excise"],
      });
      expect(result.totalTax).toBe(150);
      expect(result.breakdown[0].rate).toBe(0.15);
    });

    it("applies CO sales tax at 5% for nexus jurisdictions", async () => {
      const result = await calculateTax(mockCtx, {
        companyId: "comp_123",
        taxDate: "2025-04-24",
        taxableAmount: 2000,
        jurisdictionIds: ["co_state"],
        taxTypeIds: ["sales"],
      });
      expect(result.totalTax).toBe(100);
    });

    it("sums tax across multiple jurisdictions when company has nexus", async () => {
      const result = await calculateTax(mockCtx, {
        companyId: "comp_nexus_multi",
        taxDate: "2025-04-24",
        taxableAmount: 1000,
        jurisdictionIds: ["co_state", "co_local"],
        taxTypeIds: ["excise"],
      });
      expect(result.totalTax).toBeGreaterThan(150);
    });

    it("prorates tax rate when effectiveDate spans period boundaries", async () => {
      // Rate change: 15% before 2025-04-01, 18% on/after
      const result = await calculateTax(mockCtx, {
        companyId: "comp_123",
        taxDate: "2025-04-10",  // Mid-month, assume monthly
        taxableAmount: 1000,
        jurisdictionIds: ["co_state"],
        taxTypeIds: ["excise"],
        prorationMethod: "days",
      });
      // Verify rate reflects blended proration
      expect(result.totalTax).toBeGreaterThan(150).toBeLessThan(180);
    });

    it("throws error when jurisdiction rate not found", async () => {
      await expect(
        calculateTax(mockCtx, {
          companyId: "comp_123",
          taxDate: "2025-04-24",
          taxableAmount: 1000,
          jurisdictionIds: ["unknown_juris"],
          taxTypeIds: ["excise"],
        })
      ).rejects.toThrow(/Rate not found/);
    });

    it("returns empty breakdown when no tax types match", async () => {
      const result = await calculateTax(mockCtx, {
        companyId: "comp_123",
        taxDate: "2025-04-24",
        taxableAmount: 1000,
        jurisdictionIds: ["co_state"],
        taxTypeIds: [],
      });
      expect(result.totalTax).toBe(0);
      expect(result.breakdown).toEqual([]);
    });

    it("prioritizes most recent tax rate when multiple overlap same date", async () => {
      const result = await calculateTax(mockCtx, {
        companyId: "comp_123",
        taxDate: "2025-04-24",
        taxableAmount: 1000,
        jurisdictionIds: ["co_state"],
        taxTypeIds: ["excise"],
      });
      expect(result.breakdown[0].effectiveFrom).toBeDefined();
    });
  });

  describe("getTaxLiability", () => {
    it("sums tax amounts by period for a company", async () => {
      const result = await getTaxLiability(mockCtx, {
        companyId: "comp_123",
        periodStart: "2025-01-01",
        periodEnd: "2025-01-31",
      });
      expect(result.periods).toHaveLength(1);
      expect(result.summary.totalTax).toBeGreaterThan(0);
    });

    it("breaks down liability by tax type (excise vs sales)", async () => {
      const result = await getTaxLiability(mockCtx, {
        companyId: "comp_123",
        periodStart: "2025-01-01",
        periodEnd: "2025-01-31",
      });
      expect(result.byTaxType).toHaveProperty("excise");
      expect(result.byTaxType).toHaveProperty("sales");
    });

    it("filters by jurisdiction when requested", async () => {
      const result = await getTaxLiability(mockCtx, {
        companyId: "comp_123",
        periodStart: "2025-01-01",
        periodEnd: "2025-01-31",
        jurisdictionIds: ["co_state"],
      });
      result.periods.forEach(p => {
        expect(p.jurisdictionId).toBe("co_state");
      });
    });

    it("returns empty array when no calculations exist for period", async () => {
      const result = await getTaxLiability(mockCtx, {
        companyId: "comp_never_used",
        periodStart: "2025-01-01",
        periodEnd: "2025-01-31",
      });
      expect(result.periods).toEqual([]);
      expect(result.summary.totalTax).toBe(0);
    });

    it("supports quarterly aggregation", async () => {
      const result = await getTaxLiability(mockCtx, {
        companyId: "comp_123",
        periodStart: "2025-01-01",
        periodEnd: "2025-03-31",
        periodType: "quarter",
      });
      expect(result.periods).toHaveLength(1);
      expect(result.periods[0].periodLabel).toMatch(/Q1/);
    });
  });

  describe("upsertTaxRate", () => {
    it("creates a new tax rate with correct fields", async () => {
      const result = await upsertTaxRate(mockCtx, {
        jurisdictionId: "co_state",
        taxTypeId: "excise",
        rate: 0.15,
        effectiveFrom: "2025-01-01",
        effectiveTo: null,  // open-ended
      });
      expect(result.success).toBe(true);
      expect(result.rateId).toBeDefined();
    });

    it("updates existing rate when jurisdiction+type+effectiveFrom match", async () => {
      // First upsert
      await upsertTaxRate(mockCtx, {
        jurisdictionId: "co_state",
        taxTypeId: "excise",
        rate: 0.15,
        effectiveFrom: "2025-01-01",
      });
      // Update same effective date
      const updated = await upsertTaxRate(mockCtx, {
        jurisdictionId: "co_state",
        taxTypeId: "excise",
        rate: 0.18,
        effectiveFrom: "2025-01-01",
      });
      expect(updated.success).toBe(true);
    });

    it("allows multiple versions for same jurisdiction with different effective dates", async () => {
      const v1 = await upsertTaxRate(mockCtx, {
        jurisdictionId: "co_state",
        taxTypeId: "excise",
        rate: 0.15,
        effectiveFrom: "2025-01-01",
        effectiveTo: "2025-06-30",
      });
      const v2 = await upsertTaxRate(mockCtx, {
        jurisdictionId: "co_state",
        taxTypeId: "excise",
        rate: 0.18,
        effectiveFrom: "2025-07-01",
      });
      expect(v1.rateId).not.toBe(v2.rateId);
    });

    it("rejects rate below zero", async () => {
      await expect(
        upsertTaxRate(mockCtx, {
          jurisdictionId: "co_state",
          taxTypeId: "excise",
          rate: -0.05,
          effectiveFrom: "2025-01-01",
        })
      ).rejects.toThrow(/invalid/);
    });

    it("rejects rate above 1 (100%)", async () => {
      await expect(
        upsertTaxRate(mockCtx, {
          jurisdictionId: "co_state",
          taxTypeId: "excise",
          rate: 1.25,
          effectiveFrom: "2025-01-01",
        })
      ).rejects.toThrow(/invalid/);
    });

    it("auto-sets effectiveTo null when omitted (open-ended)", async () => {
      const result = await upsertTaxRate(mockCtx, {
        jurisdictionId: "co_state",
        taxTypeId: "sales",
        rate: 0.05,
        effectiveFrom: "2025-01-01",
      });
      expect(result.rate.effectiveTo).toBeNull();
    });
  });

  describe("updateCompanyTaxProfile", () => {
    it("sets primary jurisdiction and nexus array", async () => {
      const result = await updateCompanyTaxProfile(mockCtx, {
        companyId: "comp_123",
        primaryJurisdictionId: "co_state",
        nexusStates: ["CO"],
        filingCalendar: { excise: "Q1", sales: "monthly" },
        taxTypesEnabled: { excise: true, sales: true },
      });
      expect(result.primaryJurisdictionId).toBe("co_state");
      expect(result.nexusStates).toContain("CO");
    });

    it("validates primaryJurisdictionId exists in taxJurisdictions", async () => {
      await expect(
        updateCompanyTaxProfile(mockCtx, {
          companyId: "comp_123",
          primaryJurisdictionId: "fake_state",
          nexusStates: ["CO"],
          filingCalendar: { excise: "Q1", sales: "monthly" },
          taxTypesEnabled: { excise: true, sales: true },
        })
      ).rejects.toThrow(/invalid jurisdiction/);
    });

    it("allows toggling taxTypesEnabled independently", async () => {
      const result = await updateCompanyTaxProfile(mockCtx, {
        companyId: "comp_123",
        primaryJurisdictionId: "co_state",
        nexusStates: ["CO"],
        filingCalendar: { excise: "Q1", sales: "monthly" },
        taxTypesEnabled: { excise: false, sales: true },
      });
      expect(result.taxTypesEnabled.excise).toBe(false);
      expect(result.taxTypesEnabled.sales).toBe(true);
    });

    it("accepts empty nexusStates (no nexus)", async () => {
      const result = await updateCompanyTaxProfile(mockCtx, {
        companyId: "comp_123",
        primaryJurisdictionId: "co_state",
        nexusStates: [],
        filingCalendar: { excise: "Q1", sales: "monthly" },
        taxTypesEnabled: { excise: true, sales: true },
      });
      expect(result.nexusStates).toEqual([]);
    });
  });

  describe("getUpcomingDeadlines", () => {
    it("lists upcoming excise filing deadlines based on quarterly calendar", async () => {
      const deadlines = await getUpcomingDeadlines(mockCtx, {
        companyId: "comp_123",
        daysAhead: 90,
      });
      expect(deadlines.length).toBeGreaterThan(0);
      expect(deadlines[0].taxTypeId).toBe("excise");
      expect(deadlines[0].dueDate).toBeDefined();
    });

    it("returns empty list when no filingCalendar configured", async () => {
      const deadlines = await getUpcomingDeadlines(mockCtx, {
        companyId: "comp_no_calendar",
        daysAhead: 30,
      });
      expect(deadlines).toEqual([]);
    });

    it("excludes past-due deadlines when using daysAhead filter", async () => {
      const deadlines = await getUpcomingDeadlines(mockCtx, {
        companyId: "comp_123",
        daysAhead: 30,
      });
      const today = new Date();
      deadlines.forEach(d => {
        const due = new Date(d.dueDate);
        expect(due.getTime()).toBeGreaterThanOrEqual(today.getTime());
      });
    });
  });

  describe("listTaxJurisdictions & listTaxTypes", () => {
    it("returns all active jurisdictions", async () => {
      const jurisdictions = await listTaxJurisdictions(mockCtx);
      expect(jurisdictions.some(j => j.code === "CO")).toBe(true);
    });

    it("returns all tax types (excise, sales, etc.)", async () => {
      const types = await listTaxTypes(mockCtx);
      expect(types.some(t => t.id === "excise")).toBe(true);
      expect(types.some(t => t.id === "sales")).toBe(true);
    });
  });
});

