// AI Service Layer for Tranquillo Green
// Handles cost qualification reasoning, allocation explanations, and chat responses.
// Currently uses rule-based logic with OpenAI-ready hooks.

import "server-only";

// ─── TYPES ────────────────────────────────────────────────────────

export interface CostClassification {
  classification: "direct_production" | "indirect_production" | "non_production" | "mixed" | "pending_review";
  confidence: number;
  reasoning: string;
  factors: Array<{
    factor: string;
    weight: number;
    evidence: string;
  }>;
  allocationMethod?: "square_footage" | "labor_hours" | "revenue_mix" | "direct_tracing" | "not_applicable";
  precedentCitation?: string;
}

export interface AllocationExplanation {
  summary: string;
  confidence: number;
  reasoning: string[];
  evidence: string[];
  riskFactors: string[];
}

export interface ChatResponse {
  message: string;
  confidence: number;
  sources: string[];
  suggestedActions?: string[];
}

// ─── COST CLASSIFICATION RULES ────────────────────────────────────
// 280E cost classification based on IRS guidance and tax court precedent.
// These rules encode the legal framework for what qualifies as COGS.

const DIRECT_PRODUCTION_INDICATORS = [
  { factor: "Directly tied to inventory transformation", weight: 0.9, evidence: "Cost is incurred during growing, harvesting, extraction, or packaging of cannabis products." },
  { factor: "Variable with production volume", weight: 0.8, evidence: "Cost scales directly with units produced, not with time or revenue." },
  { factor: "Necessary for product creation", weight: 0.85, evidence: "Product cannot exist without this cost (e.g., raw materials, direct labor)." },
  { factor: "Traced to specific production batches", weight: 0.7, evidence: "Cost can be allocated to individual production runs or inventory batches." },
];

const INDIRECT_PRODUCTION_INDICATORS = [
  { factor: "Supports production but not directly traceable", weight: 0.7, evidence: "Cost enables production but isn't tied to specific batches (e.g., facility rent, production supervision)." },
  { factor: "Fixed cost shared with production", weight: 0.6, evidence: "Cost exists regardless of production volume but benefits production activities." },
  { factor: "Allocable by square footage or labor hours", weight: 0.65, evidence: "Cost can be split between production and non-production using a reasonable allocation method." },
];

const NON_PRODUCTION_INDICATORS = [
  { factor: "Related to sales, marketing, or administration", weight: 0.9, evidence: "Cost is incurred for activities that don't transform inventory (e.g., advertising, HR, legal)." },
  { factor: "Not necessary for product creation", weight: 0.8, evidence: "Product would exist without this cost." },
  { factor: "Incurred after production is complete", weight: 0.7, evidence: "Cost relates to distribution, marketing, or customer support, not manufacturing." },
];

// Known account classifications (chart of accounts code -> classification)
const KNOWN_CLASSIFICATIONS: Record<string, CostClassification> = {
  // Cultivation
  "COGS-GROW": {
    classification: "direct_production",
    confidence: 0.95,
    reasoning: "Growing media, nutrients, water, and electricity for cultivation are direct production costs. These are incurred specifically to transform raw inputs into harvestable cannabis plants.",
    factors: DIRECT_PRODUCTION_INDICATORS,
    precedentCitation: "CHAMP v. Commissioner (T.C. Memo 2007-62) — cultivation costs includible in COGS",
  },
  "COGS-HARVEST": {
    classification: "direct_production",
    confidence: 0.95,
    reasoning: "Harvest and processing labor (trimming, drying, curing) directly transforms raw plant material into finished product. These costs are capitalizable as COGS.",
    factors: DIRECT_PRODUCTION_INDICATORS,
    precedentCitation: "Alterman Foods v. Commissioner (505 F.2d 993) — processing costs includible in COGS",
  },
  "COGS-GENETICS": {
    classification: "direct_production",
    confidence: 0.9,
    reasoning: "Seeds, clones, and genetic licensing are raw material inputs to the production process. Without genetics, no product can be produced.",
    factors: DIRECT_PRODUCTION_INDICATORS,
  },
  // Extraction
  "COGS-RAW": {
    classification: "direct_production",
    confidence: 0.95,
    reasoning: "Bulk cannabis, trim, and biomass used as extraction inputs are direct raw materials. These are the primary inputs to the manufacturing process.",
    factors: DIRECT_PRODUCTION_INDICATORS,
  },
  "COGS-EXTRACT": {
    classification: "direct_production",
    confidence: 0.9,
    reasoning: "Solvents, CO2, and lab equipment consumables used during extraction are direct production costs tied to inventory transformation.",
    factors: DIRECT_PRODUCTION_INDICATORS,
  },
  // Retail
  "COGS-RET": {
    classification: "direct_production",
    confidence: 0.85,
    reasoning: "Wholesale cost of cannabis products sold at retail is the primary COGS component for dispensaries. This is the cost of inventory sold.",
    factors: DIRECT_PRODUCTION_INDICATORS,
  },
  "COGS-SHIP": {
    classification: "mixed",
    confidence: 0.7,
    reasoning: "Shipping and logistics costs are mixed — inbound freight to receive inventory is COGS, outbound delivery costs may be selling expenses.",
    factors: INDIRECT_PRODUCTION_INDICATORS,
    allocationMethod: "direct_tracing",
  },
  // Packaging
  "COGS-PKG": {
    classification: "direct_production",
    confidence: 0.85,
    reasoning: "Packaging, labels, and compliant containers are necessary for product to be sellable. They are part of the finished product cost.",
    factors: DIRECT_PRODUCTION_INDICATORS,
  },
  // Facility — MIXED (needs allocation)
  "OPEX-FACILITY": {
    classification: "mixed",
    confidence: 0.75,
    reasoning: "Facility costs (rent, utilities, HVAC) benefit both production and non-production activities. Must be allocated based on square footage dedicated to production vs. other uses.",
    factors: INDIRECT_PRODUCTION_INDICATORS,
    allocationMethod: "square_footage",
    precedentCitation: "Californians Helping to Alleviate Medical Problems v. Commissioner (128 T.C. 173) — facility costs allocable to production",
  },
  // Labor — MIXED (needs allocation)
  "OPEX-STAFF": {
    classification: "mixed",
    confidence: 0.7,
    reasoning: "Staff costs are mixed — production employees (growers, trimmers, extractors) have capitalizable wages, while admin, sales, and compliance staff wages are nondeductible.",
    factors: INDIRECT_PRODUCTION_INDICATORS,
    allocationMethod: "labor_hours",
  },
  // Non-production
  "OPEX-MKT": {
    classification: "non_production",
    confidence: 0.95,
    reasoning: "Marketing, advertising, and loyalty program costs are selling expenses. They don't transform inventory and aren't necessary for product creation.",
    factors: NON_PRODUCTION_INDICATORS,
  },
  "OPEX-ADMIN": {
    classification: "non_production",
    confidence: 0.95,
    reasoning: "Administrative costs (accounting, legal, HR) are general business expenses that don't directly contribute to inventory production.",
    factors: NON_PRODUCTION_INDICATORS,
  },
  "OPEX-CORP": {
    classification: "non_production",
    confidence: 0.95,
    reasoning: "Corporate overhead (executive salaries, board fees, strategic planning) is not tied to production and is nondeductible under 280E.",
    factors: NON_PRODUCTION_INDICATORS,
  },
  "OPEX-COMP": {
    classification: "non_production",
    confidence: 0.9,
    reasoning: "Compliance and licensing costs (METRC fees, state licenses, regulatory attorneys) are necessary for legal operation but don't transform inventory.",
    factors: NON_PRODUCTION_INDICATORS,
  },
};

// ─── CLASSIFICATION ENGINE ─────────────────────────────────────────

export function classifyCost(accountCode: string, accountName: string, description?: string): CostClassification {
  // Check known classifications first
  if (KNOWN_CLASSIFICATIONS[accountCode]) {
    return KNOWN_CLASSIFICATIONS[accountCode];
  }

  // Rule-based classification for unknown accounts
  const nameLower = (accountName + " " + (description ?? "")).toLowerCase();

  // Direct production keywords
  const directKeywords = ["raw material", "cultivation", "growing", "harvest", "extraction", "processing", "packaging", "production", "manufacturing", "inventory cost", "wholesale cost", "seed", "clone", "nutrient", "substrate"];
  const directMatches = directKeywords.filter(k => nameLower.includes(k)).length;

  // Indirect production keywords
  const indirectKeywords = ["facility", "rent", "utilities", "supervision", "quality control", "maintenance", "equipment"];
  const indirectMatches = indirectKeywords.filter(k => nameLower.includes(k)).length;

  // Non-production keywords
  const nonProdKeywords = ["marketing", "advertising", "sales", "admin", "legal", "accounting", "hr", "human resource", "compliance", "corporate", "executive", "office"];
  const nonProdMatches = nonProdKeywords.filter(k => nameLower.includes(k)).length;

  if (directMatches > indirectMatches && directMatches > nonProdMatches) {
    return {
      classification: "direct_production",
      confidence: Math.min(0.5 + directMatches * 0.1, 0.85),
      reasoning: `Based on keywords in "${accountName}", this cost appears to be directly tied to inventory production.`,
      factors: DIRECT_PRODUCTION_INDICATORS.slice(0, 2),
    };
  }

  if (indirectMatches > nonProdMatches) {
    return {
      classification: "mixed",
      confidence: 0.5 + indirectMatches * 0.1,
      reasoning: `Based on keywords in "${accountName}", this cost appears to be indirect production — benefits production but needs allocation.`,
      factors: INDIRECT_PRODUCTION_INDICATORS.slice(0, 2),
      allocationMethod: "square_footage",
    };
  }

  if (nonProdMatches > 0) {
    return {
      classification: "non_production",
      confidence: 0.5 + nonProdMatches * 0.1,
      reasoning: `Based on keywords in "${accountName}", this cost appears to be non-production and is nondeductible under 280E.`,
      factors: NON_PRODUCTION_INDICATORS.slice(0, 2),
    };
  }

  return {
    classification: "pending_review",
    confidence: 0.3,
    reasoning: `Unable to classify "${accountName}" automatically. Manual review needed to determine 280E treatment.`,
    factors: [],
  };
}

// ─── ALLOCATION EXPLANATION ────────────────────────────────────────

export function explainAllocation(params: {
  accountCode: string;
  accountName: string;
  basis: string;
  deductibleAmount: number;
  nondeductibleAmount: number;
  confidence: number;
  policyName: string;
  driverLabel: string;
  driverValue: string;
}): AllocationExplanation {
  const total = params.deductibleAmount + params.nondeductibleAmount;
  const deductiblePct = total > 0 ? (params.deductibleAmount / total * 100).toFixed(1) : "0";
  const nondeductiblePct = total > 0 ? (params.nondeductibleAmount / total * 100).toFixed(1) : "0";

  const reasoning: string[] = [];
  const evidence: string[] = [];
  const riskFactors: string[] = [];

  // Basis explanation
  switch (params.basis) {
    case "square_footage":
      reasoning.push(`Square footage allocation: ${params.driverLabel} = ${params.driverValue}. The production area percentage determines the deductible share.`);
      evidence.push("Facility costs are allocated based on the proportion of space dedicated to production vs. other uses.");
      if (parseFloat(deductiblePct) > 70) {
        riskFactors.push("High production allocation (>70%) — ensure floorplan documentation supports this split.");
      }
      break;
    case "labor_hours":
      reasoning.push(`Labor hours allocation: ${params.driverLabel} = ${params.driverValue}. Direct production labor hours determine the deductible share.`);
      evidence.push("Payroll costs are split based on tracked hours: production activities are COGS, non-production are 280E limited.");
      if (parseFloat(deductiblePct) > 80) {
        riskFactors.push("Very high labor allocation (>80%) — verify time tracking records are complete and defensible.");
      }
      break;
    case "revenue_mix":
      reasoning.push(`Revenue mix allocation: ${params.driverLabel} = ${params.driverValue}. Cannabis revenue percentage determines the deductible share.`);
      evidence.push("Mixed-use costs are allocated based on the proportion of cannabis vs. non-cannabis revenue.");
      break;
    case "custom_policy":
      reasoning.push(`Custom policy allocation: ${params.policyName}. The allocation method is defined by the company's documented accounting policy.`);
      evidence.push("Custom policies must be consistently applied and documented for audit defense.");
      break;
  }

  // Confidence assessment
  if (params.confidence < 0.5) {
    riskFactors.push("Low confidence — the allocation engine couldn't confidently match this cost. Manual review required.");
  } else if (params.confidence < 0.8) {
    riskFactors.push("Moderate confidence — controller review recommended before accepting the split.");
  }

  // Amount-based reasoning
  reasoning.push(`Recommended split: ${deductiblePct}% deductible ($${params.deductibleAmount.toFixed(2)}) / ${nondeductiblePct}% nondeductible ($${params.nondeductibleAmount.toFixed(2)}).`);

  return {
    summary: `${params.accountName}: ${deductiblePct}% deductible based on ${params.basis.replace("_", " ")} (${Math.round(params.confidence * 100)}% confidence)`,
    confidence: params.confidence,
    reasoning,
    evidence,
    riskFactors,
  };
}

// ─── CHAT RESPONSE ENGINE ─────────────────────────────────────────

const KNOWLEDGE_BASE: Record<string, string> = {
  "280e": "IRC Section 280E prohibits deductions for businesses trafficking in controlled substances. Cannabis operators can only deduct Cost of Goods Sold (COGS) — expenses directly tied to producing or purchasing inventory. All other business expenses (rent, marketing, admin, sales) are nondeductible.",
  "cogs": "COGS for cannabis includes: (1) Direct materials — seeds, clones, nutrients, packaging; (2) Direct labor — production employee wages for growing, harvesting, extraction, packaging; (3) Production overhead — facility costs allocated by production square footage. Admin, sales, and marketing costs are NOT COGS.",
  "direct_production": "Direct production costs are expenses directly tied to inventory transformation: raw materials, production labor, extraction solvents, packaging materials. These are 100% deductible as COGS under 280E. The key test: would this cost exist if no product was being made?",
  "labor_tracking": "Labor tracking for 280E requires documenting how each employee spends their time. Production activities (growing, trimming, extraction, packaging, QC) are capitalizable. Non-production activities (admin, sales, compliance, marketing) are nondeductible. The production ratio (production hours / total hours) determines what portion of payroll is COGS.",
  "allocation": "When a cost benefits both production and non-production activities, it must be allocated. Common methods: (1) Square footage — facility costs based on production vs. total area; (2) Labor hours — supervision costs based on production vs. total labor; (3) Revenue mix — mixed-use costs based on cannabis vs. total revenue.",
  "metrc": "METRC is California's seed-to-sale tracking system. It provides package-level inventory data that can be reconciled against book inventory. Metrc sync enables automatic COGS calculation from sales movements.",
  "close": "The month-end close process ensures all transactions are posted, allocations are reviewed, reconciliations are complete, and the books are ready for CPA review. Key steps: (1) Post all pending transactions; (2) Review and approve allocations; (3) Complete cash reconciliations; (4) Lock reporting period; (5) Generate CPA packet.",
  "handoff": "CPA handoff involves generating a close packet with: 280E support schedules, allocation override history, reconciliation summaries, tax provision workpapers, and compliance documentation. The packet should include a cover memo explaining any open items or overrides.",
};

export function generateChatResponse(message: string, context?: { page?: string; entity?: string }): ChatResponse {
  const lower = message.toLowerCase();

  // Find matching knowledge
  let bestMatch = "";
  let bestKey = "";
  for (const [key, value] of Object.entries(KNOWLEDGE_BASE)) {
    if (lower.includes(key.replace("_", " ")) || lower.includes(key)) {
      if (value.length > bestMatch.length) {
        bestMatch = value;
        bestKey = key;
      }
    }
  }

  if (bestMatch) {
    return {
      message: bestMatch,
      confidence: 0.9,
      sources: ["280E Knowledge Base"],
      suggestedActions: bestKey === "labor_tracking"
        ? ["Set up time tracking", "View labor allocation summary", "Import from Gusto"]
        : bestKey === "allocation"
          ? ["Review allocation queue", "Check allocation policies", "View override history"]
          : undefined,
    };
  }

  // Context-aware defaults
  if (context?.page === "allocations") {
    return {
      message: "I can explain any allocation decision. Click 'Show AI explanation' on any item to see the reasoning chain, or ask me about 280E policy, allocation methods, or cost classification.",
      confidence: 0.8,
      sources: ["Context"],
      suggestedActions: ["Explain 280E rules", "What is direct production cost?", "How does labor tracking work?"],
    };
  }

  return {
    message: "I can help with 280E allocation, COGS classification, labor tracking, close procedures, and CPA handoff. What would you like to know?",
    confidence: 0.7,
    sources: ["General"],
    suggestedActions: ["Explain 280E", "What qualifies as COGS?", "How does labor tracking work?"],
  };
}

// ─── OPENAI INTEGRATION (READY TO USE) ────────────────────────────
// Uncomment and set OPENAI_API_KEY to enable real AI responses.

/*
export async function generateAiChatResponse(message: string, context?: object): Promise<ChatResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return generateChatResponse(message, context);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a cannabis accounting assistant for Tranquillo Green. You specialize in IRC 280E tax compliance, COGS classification, allocation methods, and California regulatory requirements. Be concise, accurate, and cite relevant tax court precedent when applicable. Current context: ${JSON.stringify(context ?? {})}`,
          },
          { role: "user", content: message },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    return {
      message: data.choices?.[0]?.message?.content ?? "I couldn't generate a response. Please try again.",
      confidence: 0.85,
      sources: ["AI Model"],
    };
  } catch {
    return generateChatResponse(message, context);
  }
}
*/
