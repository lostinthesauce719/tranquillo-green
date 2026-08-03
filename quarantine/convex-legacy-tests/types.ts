/**
 * Type stubs for tax engine tests
 * Uses real types from _generated/server.d.ts where possible.
 */

import type { DataModel } from "../_generated/dataModel";
import type { Id } from "../_generated/server";

// Re-export commonly used types from schema
export type TaxProfile = DataModel["taxProfiles"][0];
export type TaxJurisdiction = DataModel["taxJurisdictions"][0];
export type TaxType = DataModel["taxTypes"][0];
export type TaxRate = DataModel["taxRates"][0];
export type TaxCalculation = DataModel["taxCalculations"][0];
export type TaxFiling = DataModel["taxFilings"][0];

// Helper type for Id<T>
export type Id<T extends keyof DataModel> = Id<T>;

// Shape of calculateTax result
export interface TaxBreakdownItem {
  taxTypeCode: string;
  taxTypeName: string;
  jurisdiction: string;
  amount: number;
}

export interface TaxCalculationResult {
  taxBreakdown: TaxBreakdownItem[];
  totalTax: number;
}

// Shape of getTaxLiability result
export interface TaxTypeSummary {
  code: string;
  name: string;
  amount: number;
}

export interface JurisdictionLiability {
  jurisdictionId: string;
  name: string;
  byTaxType: TaxTypeSummary[];
  total: number;
}

export interface TaxLiabilityResult {
  byJurisdiction: JurisdictionLiability[];
  grandTotal: number;
}

// Shape of getUpcomingDeadlines result
export interface DeadlineItem {
  jurisdictionId: string | null;
  taxTypeCode: string;
  dueDate: string;
  filingType: string;
}

// upsertTaxRate payload
export interface UpsertTaxRateData {
  jurisdictionId: string;
  taxTypeId: string;
  rate: number;
  rateType: "percentage" | "fixed_amount";
  effectiveFrom: number;
  effectiveTo?: number;
  productCategoryFilter?: string | null;
  notes?: string | null;
}

export interface UpsertTaxRateResult {
  success: boolean;
  rateId: string;
}

// updateCompanyTaxProfile payload
export interface UpdateCompanyTaxProfileData {
  companyId: string;
  primaryJurisdictionId: string;
  nexusStates: string[];
  filingCalendar: Record<string, string>;
  taxTypesEnabled: string[];
}

export interface UpdateCompanyTaxProfileResult {
  success: boolean;
  profileId: string;
}
