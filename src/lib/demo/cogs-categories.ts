export type IRSRiskLevel = "safe" | "moderate" | "aggressive";
export type AbsorptionMethod = "irc_263a" | "direct_capitalize" | "standard_cogs" | "not_eligible";
export type ClassificationStatus = "deductible" | "nondeductible" | "partial";

export type PriorPeriodDecision = {
  periodLabel: string;
  shiftAmount: number;
  outcome: string;
  reviewer: string;
};

export type CogsCategory = {
  id: string;
  category: string;
  subcategory: string;
  description: string;
  totalCost: number;
  currentClassification: ClassificationStatus;
  currentDeductibleAmount: number;
  recommendedClassification: ClassificationStatus;
  recommendedDeductibleAmount: number;
  dollarImpact: number;
  irsRiskLevel: IRSRiskLevel;
  absorptionMethod: AbsorptionMethod;
  absorptionMethodLabel: string;
  defensibility: string;
  priorPeriodDecisions: PriorPeriodDecision[];
};

export type PeriodSummary = {
  periodLabel: string;
  totalShifted: number;
  categoriesShifted: number;
  avgRiskLevel: IRSRiskLevel;
};

export const demoCogsCategories: CogsCategory[] = [
  {
    id: "cogs_flower",
    category: "Flower",
    subcategory: "Cultivated product inventory",
    description: "Raw flower costs including cultivation labor, nutrients, and grow media directly attributable to harvestable product. IRC 263A fully supports capitalizing these costs into inventory basis.",
    totalCost: 142800,
    currentClassification: "nondeductible",
    currentDeductibleAmount: 0,
    recommendedClassification: "deductible",
    recommendedDeductibleAmount: 142800,
    dollarImpact: 142800,
    irsRiskLevel: "safe",
    absorptionMethod: "standard_cogs",
    absorptionMethodLabel: "Standard COGS — directly traceable to sold inventory",
    defensibility: "Flower production costs are the strongest 280E defensible category. IRC 471 and IRC 263A together require capitalizing direct cultivation costs into inventory. This is a non-negotiable deduction.",
    priorPeriodDecisions: [
      { periodLabel: "March 2026", shiftAmount: 138400, outcome: "Fully capitalized into COGS — no adjustment", reviewer: "Controller" },
      { periodLabel: "February 2026", shiftAmount: 135200, outcome: "Fully capitalized — minor seed cost correction", reviewer: "Cost Accountant" },
    ],
  },
  {
    id: "cogs_concentrates",
    category: "Concentrates",
    subcategory: "Extraction and processing",
    description: "Extraction labor, solvent costs, equipment depreciation for BHO, rosin, and distillate production. Directly traceable to finished goods inventory.",
    totalCost: 67500,
    currentClassification: "nondeductible",
    currentDeductibleAmount: 0,
    recommendedClassification: "deductible",
    recommendedDeductibleAmount: 67500,
    dollarImpact: 67500,
    irsRiskLevel: "safe",
    absorptionMethod: "standard_cogs",
    absorptionMethodLabel: "Standard COGS — direct manufacturing cost",
    defensibility: "Extraction is a manufacturing process under IRC 471. Direct costs are fully capitalizable. IRS has consistently accepted manufacturing COGS for cannabis under 280E when properly documented.",
    priorPeriodDecisions: [
      { periodLabel: "March 2026", shiftAmount: 64200, outcome: "Fully capitalized — extraction run variance noted", reviewer: "Cost Accountant" },
      { periodLabel: "February 2026", shiftAmount: 61800, outcome: "Fully capitalized — solvent cost increase documented", reviewer: "Controller" },
    ],
  },
  {
    id: "cogs_edibles",
    category: "Edibles",
    subcategory: "Infused product manufacturing",
    description: "Ingredient costs, infusion labor, kitchen overhead for gummies, chocolates, and beverages. IRC 263A mixed-service costs require partial allocation.",
    totalCost: 89300,
    currentClassification: "partial",
    currentDeductibleAmount: 52700,
    recommendedClassification: "deductible",
    recommendedDeductibleAmount: 82100,
    dollarImpact: 29400,
    irsRiskLevel: "moderate",
    absorptionMethod: "irc_263a",
    absorptionMethodLabel: "IRC 263A — capitalize mixed costs with allocation method",
    defensibility: "Edible manufacturing COGS is well-supported but requires a consistent allocation method for mixed-use kitchen overhead (shared utilities, QA testing). Document the method and apply consistently across periods.",
    priorPeriodDecisions: [
      { periodLabel: "March 2026", shiftAmount: 50800, outcome: "Partial capitalization — 62% allocated to COGS under mixed method", reviewer: "Controller" },
      { periodLabel: "February 2026", shiftAmount: 48900, outcome: "Partial capitalization — 58% allocated (lower production volume)", reviewer: "Cost Accountant" },
    ],
  },
  {
    id: "cogs_labor",
    category: "Production Labor",
    subcategory: "Direct manufacturing wages",
    description: "Wages for employees directly involved in cultivation, extraction, and packaging. Must distinguish direct (capitalizable) from indirect (support) labor hours.",
    totalCost: 186200,
    currentClassification: "partial",
    currentDeductibleAmount: 118300,
    recommendedClassification: "deductible",
    recommendedDeductibleAmount: 156800,
    dollarImpact: 38500,
    irsRiskLevel: "moderate",
    absorptionMethod: "direct_capitalize",
    absorptionMethodLabel: "Direct capitalization — track hours by production function",
    defensibility: "Direct labor capitalization is defensible under IRC 471/263A but requires robust timekeeping. The 5-point variance rule applies — if the direct labor ratio shifts more than 5 points month-over-month, controller review is triggered.",
    priorPeriodDecisions: [
      { periodLabel: "March 2026", shiftAmount: 112400, outcome: "74.3% direct labor ratio — approved after sanitation adjustment", reviewer: "Controller" },
      { periodLabel: "February 2026", shiftAmount: 108700, outcome: "71.1% direct labor — within policy threshold", reviewer: "Cost Accountant" },
    ],
  },
  {
    id: "cogs_packaging",
    category: "Packaging",
    subcategory: "Compliance packaging and labeling",
    description: "Child-resistant packaging, labels, state-compliant testing stamps, and packaging labor. Directly traceable to individual SKUs.",
    totalCost: 34600,
    currentClassification: "nondeductible",
    currentDeductibleAmount: 0,
    recommendedClassification: "deductible",
    recommendedDeductibleAmount: 34600,
    dollarImpact: 34600,
    irsRiskLevel: "safe",
    absorptionMethod: "standard_cogs",
    absorptionMethodLabel: "Standard COGS — directly traceable to sold units",
    defensibility: "Packaging is a direct cost of goods. Child-resistant packaging is legally required, making it an inseparable part of the product. Full capitalization into COGS is standard practice.",
    priorPeriodDecisions: [
      { periodLabel: "March 2026", shiftAmount: 33100, outcome: "Fully capitalized — no adjustment needed", reviewer: "Cost Accountant" },
      { periodLabel: "February 2026", shiftAmount: 31800, outcome: "Fully capitalized — minor label reprint cost", reviewer: "Cost Accountant" },
    ],
  },
  {
    id: "cogs_testing",
    category: "Testing & QA",
    subcategory: "Compliance testing and quality assurance",
    description: "State-mandated lab testing (potency, contaminants, terpenes) and in-house QA/QC testing. Requires split between production testing (COGS) and batch-release testing (support).",
    totalCost: 28400,
    currentClassification: "nondeductible",
    currentDeductibleAmount: 0,
    recommendedClassification: "partial",
    recommendedDeductibleAmount: 19900,
    dollarImpact: 19900,
    irsRiskLevel: "moderate",
    absorptionMethod: "irc_263a",
    absorptionMethodLabel: "IRC 263A — split production QA from compliance release",
    defensibility: "In-process quality testing that feeds back into production adjustments is capitalizable under IRC 263A. Final batch-release testing is more defensible as COGS support. Document the split methodology.",
    priorPeriodDecisions: [
      { periodLabel: "March 2026", shiftAmount: 18200, outcome: "68% allocated to COGS — production QA portion", reviewer: "Controller" },
      { periodLabel: "February 2026", shiftAmount: 17500, outcome: "65% allocated — additional compliance testing batch", reviewer: "Cost Accountant" },
    ],
  },
  {
    id: "cogs_distribution",
    category: "Distribution",
    subcategory: "Transport and logistics",
    description: "Transport costs between cultivation, processing, and retail locations. State-compliant track-and-trace transport fees. Only production-related transport is capitalizable.",
    totalCost: 18700,
    currentClassification: "nondeductible",
    currentDeductibleAmount: 0,
    recommendedClassification: "partial",
    recommendedDeductibleAmount: 11200,
    dollarImpact: 11200,
    irsRiskLevel: "aggressive",
    absorptionMethod: "irc_263a",
    absorptionMethodLabel: "IRC 263A — production transport only; retail delivery excluded",
    defensibility: "Distribution is the grayest COGS category. Transport between production facilities is defensible. Last-mile retail delivery is nondeductible under 280E. Document the production-retail split carefully.",
    priorPeriodDecisions: [
      { periodLabel: "March 2026", shiftAmount: 10400, outcome: "58% allocated — production facility transfer only", reviewer: "Controller" },
      { periodLabel: "February 2026", shiftAmount: 9800, outcome: "55% allocated — retail delivery excluded", reviewer: "Controller" },
    ],
  },
  {
    id: "cogs_cultivation",
    category: "Cultivation Supplies",
    subcategory: "Grow media, nutrients, clones",
    description: "Consumable cultivation inputs — nutrients, soil/coco, clones/seeds, pest management supplies. Directly traceable to flower production batches.",
    totalCost: 52400,
    currentClassification: "nondeductible",
    currentDeductibleAmount: 0,
    recommendedClassification: "deductible",
    recommendedDeductibleAmount: 52400,
    dollarImpact: 52400,
    irsRiskLevel: "safe",
    absorptionMethod: "standard_cogs",
    absorptionMethodLabel: "Standard COGS — directly consumed in production",
    defensibility: "Cultivation supplies are consumable inputs that become part of the product. Full capitalization into COGS is the most defensible position under IRC 471. No allocation method needed — costs are directly traceable to harvest batches.",
    priorPeriodDecisions: [
      { periodLabel: "March 2026", shiftAmount: 49800, outcome: "Fully capitalized — nutrient cost increase documented", reviewer: "Cost Accountant" },
      { periodLabel: "February 2026", shiftAmount: 48200, outcome: "Fully capitalized — no adjustment", reviewer: "Cost Accountant" },
    ],
  },
];

export const demoPriorPeriodSummaries: PeriodSummary[] = [
  {
    periodLabel: "March 2026",
    totalShifted: 467300,
    categoriesShifted: 8,
    avgRiskLevel: "safe",
  },
  {
    periodLabel: "February 2026",
    totalShifted: 446400,
    categoriesShifted: 8,
    avgRiskLevel: "safe",
  },
  {
    periodLabel: "January 2026",
    totalShifted: 438100,
    categoriesShifted: 8,
    avgRiskLevel: "safe",
  },
];

export function summarizeCogsCategories(categories: CogsCategory[]) {
  const totalCost = categories.reduce((sum, c) => sum + c.totalCost, 0);
  const currentDeductible = categories.reduce((sum, c) => sum + c.currentDeductibleAmount, 0);
  const recommendedDeductible = categories.reduce((sum, c) => sum + c.recommendedDeductibleAmount, 0);
  const totalDollarImpact = categories.reduce((sum, c) => sum + c.dollarImpact, 0);
  const safeShifts = categories.filter((c) => c.irsRiskLevel === "safe").reduce((sum, c) => sum + c.dollarImpact, 0);
  const moderateShifts = categories.filter((c) => c.irsRiskLevel === "moderate").reduce((sum, c) => sum + c.dollarImpact, 0);
  const aggressiveShifts = categories.filter((c) => c.irsRiskLevel === "aggressive").reduce((sum, c) => sum + c.dollarImpact, 0);
  const eligibleFor263a = categories.filter((c) => c.absorptionMethod === "irc_263a").reduce((sum, c) => sum + c.recommendedDeductibleAmount, 0);

  return {
    totalCost,
    currentDeductible,
    recommendedDeductible,
    currentDeductiblePct: totalCost === 0 ? 0 : (currentDeductible / totalCost) * 100,
    recommendedDeductiblePct: totalCost === 0 ? 0 : (recommendedDeductible / totalCost) * 100,
    totalDollarImpact,
    safeShifts,
    moderateShifts,
    aggressiveShifts,
    eligibleFor263a,
    categoryCount: categories.length,
  };
}
