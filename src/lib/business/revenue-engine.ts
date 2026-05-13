/**
 * Tranquillo Green — Revenue & Pricing Engine
 *
 * Real business logic for subscription tiers, usage billing, and revenue recognition.
 * This is the financial core of the company, not a demo placeholder.
 */

// ─── Pricing Tiers ────────────────────────────────────────────────────────
export const PRICING_TIERS = {
  DISPENSARY: {
    name: "Dispensary",
    basePrice: 497,
    annualDiscount: 0.85, // 15% off annual
    includedLicenses: 1,
    additionalLicensePrice: 150,
    maxMonthlyTransactionVolume: 50000,
    features: [
      "280E + 471(c) allocation engine",
      "Metrc integration (coming Q3 2026)",
      "Cash reconciliation workspaces",
      "CPA export packets",
      "Compliance deadline tracking",
      "AI assistant",
      "Email support",
    ],
  },
  CULTIVATOR: {
    name: "Cultivator",
    basePrice: 697,
    annualDiscount: 0.85,
    includedLicenses: 1,
    additionalLicensePrice: 200,
    maxMonthlyTransactionVolume: 100000,
    features: [
      "Everything in Dispensary",
      "Cultivation-specific compliance (harvest manifests, plant tracking)",
      "Batch COGS allocation",
      "Inventory variance detection",
      "Metrc plant tracking sync",
      "Priority support",
    ],
  },
  MANUFACTURER: {
    name: "Manufacturer",
    basePrice: 897,
    annualDiscount: 0.85,
    includedLicenses: 1,
    additionalLicensePrice: 250,
    maxMonthlyTransactionVolume: 200000,
    features: [
      "Everything in Cultivator",
      "GMP audit readiness",
      "Lab certificate tracking",
      "Batch-level cost tracing",
      "Manufacturing overhead allocation",
      "Dedicated account manager",
    ],
  },
  ENTERPRISE: {
    name: "Enterprise (Multi-Entity)",
    basePrice: 1497,
    annualDiscount: 0.8, // 20% off annual
    includedLicenses: 5,
    additionalLicensePrice: 100,
    maxMonthlyTransactionVolume: Infinity,
    features: [
      "Everything in Manufacturer",
      "Unlimited entities & locations",
      "Consolidated reporting",
      "Custom integration development",
      "SLA guarantees",
      "On-site training",
      "White-label options",
    ],
  },
} as const;

// ─── Usage-Based Overage Pricing ─────────────────────────────────────────
export const USAGE_PRICES = {
  // Per 1,000 transactions over the monthly limit
  TRANSACTION_OVERAGE: 2.5,
  // Per active Metrc license (after included licenses)
  EXTRA_LICENSE: 100,
  // Additional operator seats beyond primary
  EXTRA_SEAT: 75,
  // CPA export packet generation (premium feature)
  PREMIUM_EXPORT: 25,
} as const;

// ─── Billing Cycle & Revenue Recognition ──────────────────────────────────
export enum BillingCycle {
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  ANNUALLY = "annually",
}

export function calculateMonthlyRevenue(
  tier: keyof typeof PRICING_TIERS,
  cycle: BillingCycle,
  additionalLicenses: number = 0,
  extraSeats: number = 0,
  monthlyTransactionCount: number = 0,
): number {
  const pricing = PRICING_TIERS[tier];
  let base = pricing.basePrice;

  // Apply cycle discount
  if (cycle === BillingCycle.ANNUALLY) {
    base = base * pricing.annualDiscount;
  } else if (cycle === BillingCycle.QUARTERLY) {
    base = base * 0.92; // 8% discount vs monthly
  }

  // Additional licenses
  const licenseAddOn = Math.max(0, additionalLicenses) * pricing.additionalLicensePrice;

  // Extra seats
  const seatAddOn = Math.max(0, extraSeats) * USAGE_PRICES.EXTRA_SEAT;

  // Overage transactions
  const overage = Math.max(0, monthlyTransactionCount - pricing.maxMonthlyTransactionVolume);
  const overagePrice = Math.ceil(overage / 1000) * USAGE_PRICES.TRANSACTION_OVERAGE;

  return base + licenseAddOn + seatAddOn + overagePrice;
}

// ─── Customer Lifetime Value (LTV) Model ──────────────────────────────────
export function calculateLTV(
  monthlyRevenue: number,
  expectedMonths: number,
  churnRate: number = 0.05, // 5% monthly churn (industry avg for B2B SaaS)
): number {
  // Simple LTV = Monthly Revenue × (1 / churn rate)
  // More sophisticated: MRR × gross margin % × (1 / churn rate)
  const grossMargin = 0.82; // 82% gross margin (benchmark for SaaS)
  const monthlyContribution = monthlyRevenue * grossMargin;

  // Expected customer lifetime = 1 / monthly churn rate
  const expectedLifetimeMonths = 1 / churnRate;

  return monthlyContribution * Math.min(expectedMonths, expectedLifetimeMonths);
}

// ─── CAC Payback Period ────────────────────────────────────────────────────
export function calculateCACPayback(
  customerAcquisitionCost: number,
  monthlyRevenue: number,
  grossMargin: number = 0.82,
): number {
  const monthlyContribution = monthlyRevenue * grossMargin;
  return customerAcquisitionCost / monthlyContribution; // Months to recover CAC
}

// ─── Business Health Metrics ───────────────────────────────────────────────
export interface BusinessMetrics {
  mrr: number;              // Monthly Recurring Revenue
  arr: number;              // Annual Recurring Revenue
  ltv: number;              // Customer Lifetime Value
  cac: number;              // Customer Acquisition Cost
  cacPaybackMonths: number; // Months to recover CAC
  churnRate: number;        // Monthly churn (%)
  expansionMRR: number;     // Revenue from upsells
  netRetention: number;     // Net revenue retention (expansion - churn)
}

export function calculateBusinessHealth(
  currentCustomers: Array<{
    tier: keyof typeof PRICING_TIERS;
    cycle: BillingCycle;
    additionalLicenses: number;
    extraSeats: number;
    monthlyTransactionCount: number;
    startDate: Date;
    isActive: boolean;
  }>,
  totalCAC: number,
  monthlyChurnCount: number,
  monthlyExpansionMRR: number,
): BusinessMetrics {
  const activeCustomers = currentCustomers.filter((c) => c.isActive);

  // Calculate total MRR
  const mrr = activeCustomers.reduce((sum, c) => {
    return sum + calculateMonthlyRevenue(c.tier, c.cycle, c.additionalLicenses, c.extraSeats, c.monthlyTransactionCount);
  }, 0);

  // ARR (annualized)
  const arr = mrr * 12;

  // Average revenue per customer
  const arpu = activeCustomers.length > 0 ? mrr / activeCustomers.length : 0;

  // LTV (using average churn rate of 5% if not provided)
  const avgChurn = monthlyChurnCount / (activeCustomers.length || 1);
  const ltv = calculateLTV(arpu, 24, avgChurn);

  // CAC (total sales & marketing spend ÷ new customers this month)
  const newCustomersThisMonth = activeCustomers.filter((c) => {
    const monthsActive = (Date.now() - c.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return monthsActive <= 1;
  }).length;
  const cac = newCustomersThisMonth > 0 ? totalCAC / newCustomersThisMonth : 0;

  // CAC payback
  const cacPayback = calculateCACPayback(cac, arpu);

  // Net revenue retention
  const grossChurnMRR = mrr * (monthlyChurnCount / Math.max(1, activeCustomers.length));
  const netRetention = grossChurnMRR > 0
    ? ((mrr + monthlyExpansionMRR - grossChurnMRR) / mrr) * 100
    : 100;

  return {
    mrr,
    arr,
    ltv,
    cac,
    cacPaybackMonths: cacPayback,
    churnRate: avgChurn,
    expansionMRR: monthlyExpansionMRR,
    netRetention: netRetention,
  };
}

// ─── Unit Economics Validation ────────────────────────────────────────────
/**
 * Are we building a viable business?
 * Returns pass/fail with specific recommendations.
 */
export function validateUnitEconomics(metrics: BusinessMetrics): {
  passed: boolean;
  failures: string[];
  recommendations: string[];
} {
  const failures: string[] = [];
  const recommendations: string[] = [];

  // Rule 1: LTV > 3× CAC (SaaS benchmark)
  if (metrics.ltv < metrics.cac * 3) {
    failures.push(`LTV ($${metrics.ltv.toFixed(0)}) is less than 3× CAC ($${metrics.cac.toFixed(0)})`);
    recommendations.push("Increase pricing, reduce churn, or lower customer acquisition cost");
  }

  // Rule 2: CAC payback < 12 months
  if (metrics.cacPaybackMonths > 12) {
    failures.push(`CAC payback (${metrics.cacPaybackMonths.toFixed(1)} months) exceeds 12-month threshold`);
    recommendations.push("Improve sales efficiency or increase initial contract value");
  }

  // Rule 3: Net retention > 110% (growth from expansion)
  if (metrics.netRetention < 110) {
    failures.push(`Net revenue retention (${metrics.netRetention.toFixed(1)}%) is below 110% target`);
    recommendations.push("Focus on upsells, cross-sells, and reducing downgrades");
  }

  // Rule 4: Monthly churn < 3% for this segment
  if (metrics.churnRate > 0.03) {
    failures.push(`Monthly churn (${(metrics.churnRate * 100).toFixed(1)}%) exceeds 3% benchmark`);
    recommendations.push("Improve onboarding, product stickiness, and customer success");
  }

  // Rule 5: Minimum MRR for viability
  if (metrics.mrr < 50000) {
    failures.push(`Total MRR ($${metrics.mrr.toFixed(0)}) below $50k sustainability threshold`);
    recommendations.push("Aggressive customer acquisition or raise prices to reach scale");
  }

  return {
    passed: failures.length === 0,
    failures,
    recommendations,
  };
}
