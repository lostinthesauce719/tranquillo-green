import { demoAllocationReviewQueue, type DemoAllocationReviewItem } from "@/lib/demo/accounting-operations";

export type DemoPolicyReference = {
  code: string;
  title: string;
  note: string;
};

export type DemoAllocationBasisSummary = {
  basis: DemoAllocationReviewItem["basis"];
  label: string;
  itemCount: number;
  deductibleAmount: number;
  nondeductibleAmount: number;
  supportStatus: "complete" | "watch" | "missing";
  narrative: string;
};

export type DemoSupportScheduleRow = {
  scheduleId: string;
  transactionId?: string;
  periodLabel: string;
  accountCode: string;
  accountName: string;
  location: string;
  vendor: string;
  basisLabel: string;
  supportPackage: string;
  policyReference: string;
  deductibleAmount: number;
  nondeductibleAmount: number;
  reviewerStatus: string;
};

export type DemoSupportScheduleReport = {
  title: string;
  periodLabel: string;
  preparedBy: string;
  preparedAt: string;
  deductibleTotal: number;
  nondeductibleTotal: number;
  totalReviewed: number;
  deductiblePercent: number;
  nondeductiblePercent: number;
  basisSummaries: DemoAllocationBasisSummary[];
  policyReferences: DemoPolicyReference[];
  lineItems: DemoSupportScheduleRow[];
  binderChecklist: string[];
};

const basisLabels: Record<DemoAllocationReviewItem["basis"], string> = {
  square_footage: "Square footage",
  labor_hours: "Labor hours",
  revenue_mix: "Revenue mix",
  custom_policy: "Custom policy",
};

const basisNarratives: Record<DemoAllocationReviewItem["basis"], string> = {
  square_footage: "Shared occupancy and security costs are split using the licensed production footprint documented in the facility plan set.",
  labor_hours: "Payroll and labor support items are split using tracked direct manufacturing hours versus total departmental hours.",
  revenue_mix: "Mixed retail event spend uses cannabis versus non-cannabis receipts only when event SKU support is preserved.",
  custom_policy: "Memo-backed exceptions rely on signed engagement scope, tax memo references, or controller-approved override language.",
};

const policyReferences: DemoPolicyReference[] = [
  {
    code: "POL-280E-01",
    title: "Shared facility occupancy + security policy",
    note: "Defines square-footage support needed to capitalize mixed-use security and occupancy costs into production support where appropriate.",
  },
  {
    code: "POL-280E-02",
    title: "Direct labor capitalization policy",
    note: "Requires direct-hour support, supervisor attestation for downtime, and controller review when the ratio shifts more than five points month over month.",
  },
  {
    code: "POL-280E-03",
    title: "Professional services deductibility memo",
    note: "Documents when accounting, legal, and tax advisory work remains deductible versus inventory-related implementation work.",
  },
  {
    code: "POL-280E-04",
    title: "Ancillary merchandise and event revenue split policy",
    note: "Allows revenue-mix allocations only with SKU recap and event sales support preserved in the workpaper binder.",
  },
];

const lineItems: DemoSupportScheduleRow[] = [
  {
    scheduleId: "SUP-001",
    transactionId: "txn_002",
    periodLabel: "April 2026",
    accountCode: "6310",
    accountName: "Security Services",
    location: "Oakland Flagship Retail",
    vendor: "Bay Alarm Company",
    basisLabel: basisLabels.square_footage,
    supportPackage: "Floorplan v2026.1 + camera coverage map + matched invoice",
    policyReference: "POL-280E-01",
    deductibleAmount: 614.04,
    nondeductibleAmount: 1570.96,
    reviewerStatus: "Ready for review",
  },
  {
    scheduleId: "SUP-002",
    transactionId: "txn_005",
    periodLabel: "April 2026",
    accountCode: "5035",
    accountName: "Production Labor Absorption",
    location: "Richmond Manufacturing Hub",
    vendor: "Gusto Payroll",
    basisLabel: basisLabels.labor_hours,
    supportPackage: "Hours export + downtime attestation + production schedule",
    policyReference: "POL-280E-02",
    deductibleAmount: 13836.99,
    nondeductibleAmount: 4783.45,
    reviewerStatus: "Pending controller",
  },
  {
    scheduleId: "SUP-003",
    transactionId: "txn_006",
    periodLabel: "April 2026",
    accountCode: "6415",
    accountName: "Professional Fees",
    location: "Oakland Flagship Retail",
    vendor: "Calyx CPA Group",
    basisLabel: basisLabels.custom_policy,
    supportPackage: "Signed retainer + invoice scope memo",
    policyReference: "POL-280E-03",
    deductibleAmount: 4500,
    nondeductibleAmount: 0,
    reviewerStatus: "Approved",
  },
  {
    scheduleId: "SUP-004",
    periodLabel: "April 2026",
    accountCode: "6210",
    accountName: "Marketing and Promotions",
    location: "Oakland Flagship Retail",
    vendor: "Community Wellness Expo",
    basisLabel: basisLabels.revenue_mix,
    supportPackage: "Event invoice only; SKU recap missing",
    policyReference: "POL-280E-04",
    deductibleAmount: 184,
    nondeductibleAmount: 2116,
    reviewerStatus: "Needs support",
  },
];

function buildBasisSummaries(items: DemoAllocationReviewItem[]): DemoAllocationBasisSummary[] {
  return (Object.keys(basisLabels) as DemoAllocationReviewItem["basis"][]).map((basis) => {
    const matchingItems = items.filter((item) => item.basis === basis);
    const deductibleAmount = matchingItems.reduce((sum, item) => sum + item.deductibleAmount, 0);
    const nondeductibleAmount = matchingItems.reduce((sum, item) => sum + item.nondeductibleAmount, 0);
    const hasMissingSupport = matchingItems.some((item) => item.reviewStatus === "needs_support");
    const hasWatchItem = matchingItems.some((item) => item.reviewStatus === "pending_controller" || item.reviewStatus === "ready_for_review");

    return {
      basis,
      label: basisLabels[basis],
      itemCount: matchingItems.length,
      deductibleAmount,
      nondeductibleAmount,
      supportStatus: hasMissingSupport ? "missing" : hasWatchItem ? "watch" : "complete",
      narrative: basisNarratives[basis],
    };
  });
}

const deductibleTotal = lineItems.reduce((sum, row) => sum + row.deductibleAmount, 0);
const nondeductibleTotal = lineItems.reduce((sum, row) => sum + row.nondeductibleAmount, 0);
const totalReviewed = deductibleTotal + nondeductibleTotal;

export const demoSupportScheduleReport: DemoSupportScheduleReport = {
  title: "280E Support Schedule",
  periodLabel: "April 2026",
  preparedBy: "Assistant Controller",
  preparedAt: "May 1, 2026 • 8:40 AM PT",
  deductibleTotal,
  nondeductibleTotal,
  totalReviewed,
  deductiblePercent: totalReviewed === 0 ? 0 : deductibleTotal / totalReviewed,
  nondeductiblePercent: totalReviewed === 0 ? 0 : nondeductibleTotal / totalReviewed,
  basisSummaries: buildBasisSummaries(demoAllocationReviewQueue),
  policyReferences,
  lineItems,
  binderChecklist: [
    "Preserve signed policy memos and facility maps in the monthly tax binder.",
    "Tie each schedule row to source transaction references and reviewer attribution.",
    "Attach controller sign-off for threshold exceptions before finalizing the return support package.",
    "Retain missing-support exceptions in an open-items log instead of silently posting unsupported splits.",
  ],
};
