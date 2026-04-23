/**
 * Entity Structuring Optimizer — Plan B
 *
 * Evaluates multi-entity legal structures to optimize 280E defensibility
 * and 471(c) inventory capitalization. This is a stealth module — not
 * advertised in navigation until activated via internal flag.
 *
 * Core strategies:
 *   - Dispensary front + cultivator/manufacturer back (separate 280E buckets)
 *   - Service entity ring-fencing (marketing, tech, delivery)
 *   - IP holding company structure
 *   - Real estate REIT wrapper (if applicable)
 *
 * Input: company profile, revenue breakdown, state tax profile
 * Output: ranked legal structure recommendations with projected impact
 */

export type EntityStructure =
  | "single_entity"
  | "dual_entity_segregated"
  | "tri_entity_full"
  | "ip_holding"
  | "real_estate_reit"
  | "service_entity_ring";

export interface StructureRecommendation {
  structure: EntityStructure;
  score: number; // 0-100 suitability score
  annualTaxSavings: number;
  complianceComplexity: "low" | "medium" | "high";
  setupCost: number;
  requiredPartners: string[]; // e.g., ["CA attorney", "tax advisor"]
  description: string;
  keyRisks: string[];
  suggestedEntities: {
    name: string;
    purpose: string;
    expectedRevenue: number;
    licenseType?: string;
  }[];
}

export interface OptimizationInput {
  currentRevenue: number;
  revenueByCategory: {
    retail: number;
    cultivation: number;
    manufacturing: number;
    distribution: number;
    delivery: number;
  };
  state: string;
  currentStructure: "single" | "multi";
  hasCultivationLicense: boolean;
  hasManufacturingLicense: boolean;
  hasRetailLicense: boolean;
  hasDistributionLicense: boolean;
  priority: "tax_savings" | "simplicity" | "defensibility";
}

/**
 * Evaluate entity structures and return ranked recommendations.
 */
export function evaluateStructures(
  input: OptimizationInput,
): StructureRecommendation[] {
  const recommendations: StructureRecommendation[] = [];

  // ── Single entity baseline ─────────────────────────────────────────
  const baselineSavings = estimateTaxSavings(input.currentRevenue, input.state);
  recommendations.push({
    structure: "single_entity",
    score: input.priority === "simplicity" ? 100 : 40,
    annualTaxSavings: baselineSavings,
    complianceComplexity: "low",
    setupCost: 0,
    requiredPartners: [],
    description:
      "All operations under one entity. Simple but exposes entire revenue to 280E limitations.",
    keyRisks: ["Full 280E exposure", "Single audit target", "No internal segregation"],
    suggestedEntities: [{ name: "Operator LLC", purpose: "All operations", expectedRevenue: input.currentRevenue }],
  });

  // ── Dual-entity: segregated cost centers ───────────────────────────
  if (input.hasCultivationLicense || input.hasManufacturingLicense) {
    const cultivationRevenue =
      input.revenueByCategory.cultivation + input.revenueByCategory.manufacturing;
    const retailRevenue =
      input.revenueByCategory.retail +
      input.revenueByCategory.distribution +
      input.revenueByCategory.delivery;

    if (cultivationRevenue > 0 && retailRevenue > 0) {
      const dualSavings = baselineSavings * 1.25; // +25% from segregation
      recommendations.push({
        structure: "dual_entity_segregated",
        score: 75,
        annualTaxSavings: dualSavings,
        complianceComplexity: "medium",
        setupCost: 15000,
        requiredPartners: ["business attorney", "tax advisor"],
        description:
          "Separate cultivation/manufacturing entity from retail/dispensary entity. Each gets its own 471(c) election and 280E cost bucket.",
        keyRisks: ["Transfer pricing scrutiny", "dual compliance overhead", "state licensing complexity"],
        suggestedEntities: [
          {
            name: "CultivationCo",
            purpose: "Cultivation & manufacturing COGS",
            expectedRevenue: cultivationRevenue,
            licenseType: input.hasCultivationLicense ? "cultivation" : "manufacturer",
          },
          {
            name: "RetailCo",
            purpose: "Retail & distribution operations",
            expectedRevenue: retailRevenue,
            licenseType: "dispensary",
          },
        ],
      });
    }
  }

  // ── Tri-entity: full segregation with service entity ─────────────────
  if (
    input.currentRevenue > 5_000_000 &&
    (input.hasCultivationLicense || input.hasManufacturingLicense)
  ) {
    const serviceRevenue = input.currentRevenue * 0.1; // 10% service charge
    const tripleSavings = baselineSavings * 1.45; // +45% from full segregation

    recommendations.push({
      structure: "tri_entity_full",
      score: input.priority === "tax_savings" ? 95 : 60,
      annualTaxSavings: tripleSavings,
      complianceComplexity: "high",
      setupCost: 45000,
      requiredPartners: ["business attorney", "tax advisor", "CPA firm"],
      description:
        "Three-entity structure: (1) Cultivation/manufacturing, (2) Retail, (3) Service entity. Max 280E segregation + service fee deduction optimization.",
      keyRisks: ["IRS scrutiny on intercompany pricing", "state-level combined reporting", "higher maintenance"],
      suggestedEntities: [
        {
          name: "CultivationCo",
          purpose: "Growing & processing COGS",
          expectedRevenue: input.revenueByCategory.cultivation + input.revenueByCategory.manufacturing,
          licenseType: input.hasCultivationLicense ? "cultivation" : "manufacturer",
        },
        {
          name: "RetailCo",
          purpose: "Dispensary operations",
          expectedRevenue:
            input.revenueByCategory.retail +
            input.revenueByCategory.distribution +
            input.revenueByCategory.delivery,
          licenseType: "dispensary",
        },
        {
          name: "ServicesCo",
          purpose: "Management, tech, delivery services",
          expectedRevenue: serviceRevenue,
        },
      ],
    });
  }

  // ── IP holding company ──────────────────────────────────────────────
  if (input.currentRevenue > 10_000_000) {
    const ipSavings = baselineSavings * 1.12; // +12% via IP royalty deductions
    recommendations.push({
      structure: "ip_holding",
      score: 70,
      annualTaxSavings: ipSavings,
      complianceComplexity: "high",
      setupCost: 30000,
      requiredPartners: ["IP attorney", "tax advisor"],
      description:
        "Hold trademarks, brand, and software in a separate entity. License back to operating entities for royalty deductions.",
      keyRisks: [" royalty rate scrutiny ", "valuation challenges", "state tax treatment varies"],
      suggestedEntities: [
        { name: "BrandHoldco", purpose: "IP holding", expectedRevenue: input.currentRevenue * 0.05 },
        { name: "OperatingCo", purpose: "Core business", expectedRevenue: input.currentRevenue * 0.95 },
      ],
    });
  }

  // Sort by score descending
  return recommendations.sort((a, b) => b.score - a.score);
}

/**
 * Rough estimate of annual tax savings from 471(c) election + 280E allocation
 * based on revenue and state. For demo purposes; production would use real tax calc.
 */
function estimateTaxSavings(revenue: number, state: string): number {
  const federalRate = 0.21; // 21% federal
  const stateRate = state === "CA" ? 0.0884 : state === "CO" ? 0.0784 : 0.07; // rough avg
  const effectiveRate = federalRate + stateRate;

  // Assume ~40% COGS allocable under 471(c), producing a deduction of revenue * 0.4
  // Without 471(c), that deduction is lost under 280E. Tax savings = deduction * rate.
  const cogsDeduction = revenue * 0.4;
  return Math.round(cogsDeduction * effectiveRate);
}
