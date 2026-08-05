/**
 * IRC Section 471(c) — Small Business Inventory Method Election
 * 
 * Section 471(c), enacted under the 2017 Tax Cuts and Jobs Act (TCJA), allows
 * eligible small businesses to treat inventory as non-incidental materials and
 * supplies. For cannabis operators barred from deducting expenses under IRC 280E,
 * 471(c) offers a critical strategy: capitalize MORE costs into COGS, making them
 * deductible even under 280E's restrictive rules.
 * 
 * KEY PRINCIPLES:
 * - Under 280E alone: only direct production costs (traditional COGS) are deductible
 * - Under 280E + 471(c): costs related to inventory handling, storage, packaging
 *   labor, facility costs tied to inventory, and shipping can be capitalized into COGS
 * - Eligibility: average annual gross receipts ≤ $25M for the 3 prior tax years
 * - Method must be elected on a timely filed return (original, not amended)
 * - Once elected, consistency is required (automatic consent to change methods)
 * 
 * WHAT MOVES FROM NONDEDUCTIBLE → COGS UNDER 471(c):
 * - Facility rent/occupancy directly tied to inventory storage
 * - Labor for inventory handling, packaging, storage management
 * - Shipping and logistics costs for product distribution
 * - Quality control / testing labor (if tied to inventory acceptance)
 * - Climate control / preservation costs for stored inventory
 * 
 * WHAT STAYS NONDEDUCTIBLE EVEN WITH 471(c):
 * - Marketing and advertising
 * - General administrative overhead (HR, finance, executive)
 * - Legal and accounting fees (non-inventory related)
 * - Sales and customer-facing labor
 * - Interest expense
 * - Penalties and fines
 */

// ─── TYPES ──────────────────────────────────────────────────────────

export type AccountingMethod = "280e_standard" | "280e_471c";

export type Section471cElection = {
  elected: boolean;
  electionDate?: string; // ISO date — when method was first elected
  taxYear?: number; // Tax year of election
  grossReceiptsTest: GrossReceiptsTest;
  consistencyRequirement: string;
  notes?: string;
};

export type GrossReceiptsTest = {
  eligible: boolean;
  priorYears: GrossReceiptsYear[];
  averageGrossReceipts: number;
  threshold: number; // $25,000,000
  testDate: string; // ISO date when test was performed
};

export type GrossReceiptsYear = {
  taxYear: number;
  grossReceipts: number;
};

export type ReclassifiableCost = {
  code: string;
  name: string;
  description: string;
  /** The cost under 280E-only treatment */
  treatment280e: "nondeductible";
  /** The cost under 280E + 471(c) treatment */
  treatment471c: "cogs" | "partially_cogs";
  /** Allocation basis for 471(c) reclassification */
  allocationBasis: string;
  /** Percentage of this cost that moves to COGS under 471(c) (0-1) */
  reclassifiablePercentage: number;
};

export type DualPathAllocation = {
  costCode: string;
  costName: string;
  totalAmount: number;
  /** Deductible under 280E only (traditional COGS) */
  deductible280eOnly: number;
  /** Additional deductible under 471(c) (reclassified costs) */
  additionalDeductible471c: number;
  /** Total deductible under 280E + 471(c) */
  totalDeductible471c: number;
  /** Still nondeductible even with 471(c) */
  nondeductible: number;
  /** Savings from 471(c) election */
  taxSavings471c: number;
};

export type AllocationComparison = {
  method: AccountingMethod;
  totalRevenue: number;
  totalCosts: number;
  deductibleAmount: number;
  nondeductibleAmount: number;
  effectiveTaxRate: number;
  estimatedTaxLiability: number;
  estimatedSavings: number;
};

// ─── CONSTANTS ──────────────────────────────────────────────────────

/** IRS threshold for 471(c) small business eligibility */
export const GROSS_RECEIPTS_THRESHOLD = 25_000_000;

/** Number of prior tax years to test */
export const PRIOR_YEARS_TEST = 3;

/** Standard corporate tax rate (post-TCJA) */
export const CORPORATE_TAX_RATE = 0.21;

/** Consistency requirement explanation */
export const CONSISTENCY_REQUIREMENT = 
  "Once a 471(c) method is elected, the taxpayer must apply it consistently. " +
  "Changing methods requires IRS consent (Form 3115). The method must be elected " +
  "on a timely filed original return for the first tax year it is to apply.";

// ─── ELIGIBILITY ────────────────────────────────────────────────────

/**
 * Test 471(c) eligibility based on prior 3 years of gross receipts.
 * 
 * Per IRC 448(c) and 26 CFR 1.448-2T, a taxpayer is a small business
 * if average annual gross receipts for the 3-taxable-year period ending
 * before the current taxable year do not exceed $25 million.
 */
export function testGrossReceiptsEligibility(
  priorYears: GrossReceiptsYear[]
): GrossReceiptsTest {
  const today = new Date().toISOString().split("T")[0];
  
  if (priorYears.length < PRIOR_YEARS_TEST) {
    return {
      eligible: false,
      priorYears,
      averageGrossReceipts: 0,
      threshold: GROSS_RECEIPTS_THRESHOLD,
      testDate: today,
    };
  }
  
  const totalReceipts = priorYears.reduce((sum, y) => sum + y.grossReceipts, 0);
  const averageReceipts = totalReceipts / priorYears.length;
  
  return {
    eligible: averageReceipts <= GROSS_RECEIPTS_THRESHOLD,
    priorYears,
    averageGrossReceipts: averageReceipts,
    threshold: GROSS_RECEIPTS_THRESHOLD,
    testDate: today,
  };
}

/**
 * Create a 471(c) election record.
 */
export function createElection(
  priorYears: GrossReceiptsYear[],
  taxYear: number,
  notes?: string
): Section471cElection {
  const test = testGrossReceiptsEligibility(priorYears);
  
  return {
    elected: test.eligible,
    electionDate: test.eligible ? new Date().toISOString().split("T")[0] : undefined,
    taxYear: test.eligible ? taxYear : undefined,
    grossReceiptsTest: test,
    consistencyRequirement: CONSISTENCY_REQUIREMENT,
    notes,
  };
}

// ─── RECLASSIFIABLE COST DEFINITIONS ────────────────────────────────

/**
 * Define which costs can move from nondeductible to COGS under 471(c).
 * These are operator-type-specific mappings of costs that have a direct
 * nexus to inventory handling, storage, or movement.
 */
export const RECLASSIFIABLE_COSTS: Record<string, ReclassifiableCost[]> = {
  dispensary: [
    {
      code: "OPEX-RENT",
      name: "Retail Rent & Occupancy",
      description: "Portion of storefront lease, utilities, and security directly tied to inventory storage and display",
      treatment280e: "nondeductible",
      treatment471c: "partially_cogs",
      allocationBasis: "square_footage",
      reclassifiablePercentage: 0.45, // 45% of rent is inventory-storage related (reduced from 60%)
    },
    {
      code: "OPEX-STAFF",
      name: "Inventory Handling Labor",
      description: "Budtender and inventory staff wages for receiving, storing, and handling cannabis products",
      treatment280e: "nondeductible",
      treatment471c: "partially_cogs",
      allocationBasis: "labor_hours",
      reclassifiablePercentage: 0.55, // 55% of retail staff time is inventory-related (reduced from 75%)
    },
    {
      code: "OPEX-TECH",
      name: "Inventory Technology",
      description: "POS system, Metrc integration, inventory tracking software costs tied to inventory management",
      treatment280e: "nondeductible",
      treatment471c: "partially_cogs",
      allocationBasis: "direct_assignment",
      reclassifiablePercentage: 0.35, // 35% of tech costs are inventory-related (reduced from 50%)
    },
  ],

  cultivator: [
    {
      code: "OPEX-FACILITY",
      name: "Facility & Equipment",
      description: "Warehouse lease, HVAC, lighting, irrigation — costs directly tied to cultivation inventory",
      treatment280e: "nondeductible",
      treatment471c: "partially_cogs",
      allocationBasis: "square_footage",
      reclassifiablePercentage: 0.6, // 60% of facility costs are directly inventory-related (reduced from 80%)
    },
    {
      code: "OPEX-STAFF",
      name: "Cultivation Staff",
      description: "Growers, trimmers, facility managers — labor directly involved in inventory production and handling",
      treatment280e: "nondeductible",
      treatment471c: "partially_cogs",
      allocationBasis: "labor_hours",
      reclassifiablePercentage: 0.65, // 65% of cultivation staff time is inventory production (reduced from 85%)
    },
    {
      code: "OPEX-COMP",
      name: "Testing & Compliance",
      description: "Lab testing costs for inventory quality acceptance — directly tied to inventory under 471(c)",
      treatment280e: "nondeductible",
      treatment471c: "partially_cogs",
      allocationBasis: "direct_assignment",
      reclassifiablePercentage: 0.65, // 65% of testing is inventory acceptance (reduced from 90%)
    },
  ],

  manufacturer: [
    {
      code: "OPEX-LAB",
      name: "Lab & Equipment",
      description: "Extraction equipment, lab lease, maintenance — costs tied to inventory processing",
      treatment280e: "nondeductible",
      treatment471c: "partially_cogs",
      allocationBasis: "machine_hours",
      reclassifiablePercentage: 0.5, // 50% of lab costs are inventory processing (reduced from 70%)
    },
    {
      code: "OPEX-STAFF",
      name: "Production Staff",
      description: "Extraction techs, QA staff — labor directly involved in inventory transformation",
      treatment280e: "nondeductible",
      treatment471c: "partially_cogs",
      allocationBasis: "labor_hours",
      reclassifiablePercentage: 0.6, // 60% of production staff time is inventory transformation (reduced from 80%)
    },
    {
      code: "OPEX-COMP",
      name: "Quality & Compliance",
      description: "GMP compliance, third-party testing for inventory acceptance",
      treatment280e: "nondeductible",
      treatment471c: "partially_cogs",
      allocationBasis: "direct_assignment",
      reclassifiablePercentage: 0.55, // 55% of quality costs are inventory acceptance (reduced from 75%)
    },
  ],

  distributor: [
    {
      code: "OPEX-STAFF",
      name: "Distribution Staff",
      description: "Drivers, warehouse workers — labor directly involved in inventory movement and handling",
      treatment280e: "nondeductible",
      treatment471c: "partially_cogs",
      allocationBasis: "labor_hours",
      reclassifiablePercentage: 0.65, // 65% of distribution staff time is inventory handling (reduced from 85%)
    },
    {
      code: "OPEX-VEHICLES",
      name: "Fleet & Maintenance",
      description: "Vehicle costs used for inventory transport and delivery",
      treatment280e: "nondeductible",
      treatment471c: "partially_cogs",
      allocationBasis: "mileage",
      reclassifiablePercentage: 0.6, // 60% of fleet costs are inventory transport (reduced from 80%)
    },
    {
      code: "OPEX-TECH",
      name: "Logistics Technology",
      description: "Route optimization, tracking, inventory systems — tied to inventory movement",
      treatment280e: "nondeductible",
      treatment471c: "partially_cogs",
      allocationBasis: "direct_assignment",
      reclassifiablePercentage: 0.65, // 65% of logistics tech is inventory movement (reduced from 90%)
    },
  ],

  delivery: [
    {
      code: "OPEX-SOFTWARE",
      name: "Delivery Software Fees",
      description: "Platform fees, route optimization — directly tied to inventory delivery",
      treatment280e: "nondeductible",
      treatment471c: "partially_cogs",
      allocationBasis: "direct_assignment",
      reclassifiablePercentage: 0.6, // 60% of software fees tied to delivery inventory (reduced from 85%)
    },
    {
      code: "OPEX-STAFF",
      name: "Dispatch Staff",
      description: "Dispatch and support staff involved in inventory routing and fulfillment",
      treatment280e: "nondeductible",
      treatment471c: "partially_cogs",
      allocationBasis: "labor_hours",
      reclassifiablePercentage: 0.5, // 50% of dispatch time is inventory-related (reduced from 70%)
    },
    {
      code: "OPEX-INSUR",
      name: "Insurance & Licenses",
      description: "Vehicle insurance and delivery licenses tied to inventory transport",
      treatment280e: "nondeductible",
      treatment471c: "partially_cogs",
      allocationBasis: "direct_assignment",
      reclassifiablePercentage: 0.4, // 40% of insurance/license tied to inventory (reduced from 60%)
    },
  ],

  vertical: [
    {
      code: "OPEX-FACILITY",
      name: "Facilities & Equipment",
      description: "All facility leases, equipment, maintenance — significant portion tied to inventory across the chain",
      treatment280e: "nondeductible",
      treatment471c: "partially_cogs",
      allocationBasis: "square_footage",
      reclassifiablePercentage: 0.5, // 50% of facility costs tied to inventory (reduced from 70%)
    },
    {
      code: "OPEX-STAFF",
      name: "All Staff",
      description: "Cultivation, production, retail, delivery staff — inventory-touching labor across operations",
      treatment280e: "nondeductible",
      treatment471c: "partially_cogs",
      allocationBasis: "labor_hours",
      reclassifiablePercentage: 0.45, // 45% of all staff time touches inventory (reduced from 65%)
    },
    {
      code: "OPEX-COMP",
      name: "Compliance & Licensing",
      description: "Metrc, testing, regulatory compliance tied to inventory tracking and acceptance",
      treatment280e: "nondeductible",
      treatment471c: "partially_cogs",
      allocationBasis: "direct_assignment",
      reclassifiablePercentage: 0.5, // 50% of compliance tied to inventory (reduced from 70%)
    },
  ],
};

// ─── ALLOCATION ENGINE ─────────────────────────────────────────────

/**
 * Calculate dual-path allocation: 280E-only vs. 280E+471(c).
 * 
 * This is the core engine that shows operators and CPAs exactly how much
 * additional COGS they capture by electing 471(c).
 */
export function calculateDualPathAllocation(
  operatorType: string,
  costCategories: { code: string; name: string; amount: number; taxTreatment: "cogs" | "nondeductible" }[],
  grossRevenue: number,
  corporateTaxRate: number = CORPORATE_TAX_RATE
): DualPathAllocation[] {
  const reclassifiableMap = new Map(
    (RECLASSIFIABLE_COSTS[operatorType] ?? []).map((rc) => [rc.code, rc])
  );
  
  return costCategories.map((cost) => {
    const reclassifiable = reclassifiableMap.get(cost.code);
    
    if (cost.taxTreatment === "cogs") {
      // Traditional COGS — deductible under both methods
      return {
        costCode: cost.code,
        costName: cost.name,
        totalAmount: cost.amount,
        deductible280eOnly: cost.amount,
        additionalDeductible471c: 0,
        totalDeductible471c: cost.amount,
        nondeductible: 0,
        taxSavings471c: 0,
      };
    }
    
    if (reclassifiable) {
      // Reclassifiable — moves partially to COGS under 471(c)
      const reclassifiedAmount = cost.amount * reclassifiable.reclassifiablePercentage;
      const remainingNondeductible = cost.amount - reclassifiedAmount;
      const savings = reclassifiedAmount * corporateTaxRate;
      
      return {
        costCode: cost.code,
        costName: cost.name,
        totalAmount: cost.amount,
        deductible280eOnly: 0,
        additionalDeductible471c: reclassifiedAmount,
        totalDeductible471c: reclassifiedAmount,
        nondeductible: remainingNondeductible,
        taxSavings471c: savings,
      };
    }
    
    // Fully nondeductible — stays that way even with 471(c)
    return {
      costCode: cost.code,
      costName: cost.name,
      totalAmount: cost.amount,
      deductible280eOnly: 0,
      additionalDeductible471c: 0,
      totalDeductible471c: 0,
      nondeductible: cost.amount,
      taxSavings471c: 0,
    };
  });
}

/**
 * Summarize allocation comparison between 280E-only and 280E+471(c).
 */
export function summarizeAllocationComparison(
  allocations: DualPathAllocation[],
  grossRevenue: number,
  corporateTaxRate: number = CORPORATE_TAX_RATE
): { standard: AllocationComparison; with471c: AllocationComparison; uplift: number } {
  const totalCosts = allocations.reduce((sum, a) => sum + a.totalAmount, 0);
  
  const deductible280eOnly = allocations.reduce((sum, a) => sum + a.deductible280eOnly, 0);
  const nondeductible280eOnly = totalCosts - deductible280eOnly;
  const taxableIncome280e = grossRevenue - deductible280eOnly;
  const tax280e = taxableIncome280e * corporateTaxRate;
  const effectiveRate280e = grossRevenue > 0 ? tax280e / grossRevenue : 0;
  
  const deductible471c = allocations.reduce((sum, a) => sum + a.totalDeductible471c, 0);
  const nondeductible471c = totalCosts - deductible471c;
  const taxableIncome471c = grossRevenue - deductible471c;
  const tax471c = taxableIncome471c * corporateTaxRate;
  const effectiveRate471c = grossRevenue > 0 ? tax471c / grossRevenue : 0;
  
  const savings = tax280e - tax471c;
  
  return {
    standard: {
      method: "280e_standard",
      totalRevenue: grossRevenue,
      totalCosts,
      deductibleAmount: deductible280eOnly,
      nondeductibleAmount: nondeductible280eOnly,
      effectiveTaxRate: effectiveRate280e,
      estimatedTaxLiability: tax280e,
      estimatedSavings: 0,
    },
    with471c: {
      method: "280e_471c",
      totalRevenue: grossRevenue,
      totalCosts,
      deductibleAmount: deductible471c,
      nondeductibleAmount: nondeductible471c,
      effectiveTaxRate: effectiveRate471c,
      estimatedTaxLiability: tax471c,
      estimatedSavings: savings,
    },
    uplift: savings,
  };
}

// ─── FORMATTING ─────────────────────────────────────────────────────

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

export function formatPercent(rate: number): string {
  return percentFormatter.format(rate);
}
