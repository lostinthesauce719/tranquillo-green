/**
 * Test fixtures for tax engine unit tests
 * Shared mock data: jurisdictions, tax types, rates, company profiles, tax calculations
 */

import { v4 as uuidv4 } from "uuid";

export const coStateJurisdiction = {
  id: "jur_co_state",
  code: "CO",
  name: "Colorado",
  type: "state",
  isActive: true,
 ParentJurisdictionId: null,
};

export const coLocalJurisdiction = {
  id: "jur_co_local",
  code: "CO-COM",
  name: "Colorado (Local)",
  type: "local",
  isActive: true,
  parentJurisdictionId: "jur_co_state",
};

export const exciseTaxType = {
  id: "tax_excise",
  code: "EXCISE",
  name: "Excise Tax",
  description: "Cannabis excise tax (IRC 280E attributable)",
  isActive: true,
};

export const salesTaxType = {
  id: "tax_sales",
  code: "SALES",
  name: "Sales Tax",
  description: "General sales tax on retail transactions",
  isActive: true,
};

export const coExciseRate_15 = {
  id: "rate_co_excise_15",
  jurisdictionId: "jur_co_state",
  taxTypeId: "tax_excise",
  rate: 0.15,
  effectiveFrom: "2025-01-01",
  effectiveTo: null,
};

export const coExciseRate_18 = {
  id: "rate_co_excise_18",
  jurisdictionId: "jur_co_state",
  taxTypeId: "tax_excise",
  rate: 0.18,
  effectiveFrom: "2025-07-01",
  effectiveTo: null,
};

export const coSalesRate_5 = {
  id: "rate_co_sales_5",
  jurisdictionId: "jur_co_state",
  taxTypeId: "tax_sales",
  rate: 0.05,
  effectiveFrom: "2025-01-01",
  effectiveTo: null,
};

export const testCompanyProfile = {
  id: "comp_123",
  name: "Test Dispensary CO",
  primaryJurisdictionId: "jur_co_state",
  nexusStates: ["CO"],
  filingCalendar: {
    excise: "quarterly",
    sales: "monthly",
  },
  taxTypesEnabled: {
    excise: true,
    sales: true,
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const generatedIds = {
  taxCalc: (companyId: string, date: string) => 
    `taxcalc_${companyId}_${date.replace(/-/g,"")}`,
  company: (suffix: string) => `comp_${suffix}`,
};

