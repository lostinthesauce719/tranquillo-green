import { demoTransactions } from "@/lib/demo/accounting";

export type AllocationBasis = "square_footage" | "labor_hours" | "revenue_mix" | "custom_policy";
export type AllocationReviewStatus = "ready_for_review" | "needs_support" | "pending_controller" | "approved";
export type AllocationPriority = "critical" | "high" | "normal";
export type RecommendedAction = "approve_split" | "request_support" | "override_policy" | "route_to_controller";

export type DemoAllocationReviewItem = {
  id: string;
  periodLabel: string;
  transactionId?: string;
  location: string;
  accountCode: string;
  accountName: string;
  vendor: string;
  memo: string;
  basis: AllocationBasis;
  policyName: string;
  policyMethod: string;
  driverLabel: string;
  driverValue: string;
  deductibleAmount: number;
  nondeductibleAmount: number;
  confidence: number;
  reviewStatus: AllocationReviewStatus;
  reviewer: string;
  dueLabel: string;
  priority: AllocationPriority;
  recommendedAction: RecommendedAction;
  supportingEvidence: string[];
  notes: string[];
};

export type ReconciliationStatus = "balanced" | "investigating" | "exception" | "ready_to_post";
export type ReconciliationAccountType = "drawer" | "vault" | "bank_clearing" | "bank";
export type InvestigationActionStatus = "done" | "in_progress" | "todo";

export type DemoReconciliationAction = {
  title: string;
  owner: string;
  status: InvestigationActionStatus;
};

export type DemoCashReconciliationItem = {
  id: string;
  periodLabel: string;
  location: string;
  accountName: string;
  accountType: ReconciliationAccountType;
  expectedAmount: number;
  actualAmount: number;
  varianceAmount: number;
  status: ReconciliationStatus;
  lastCountedAt: string;
  owner: string;
  sourceContext: string[];
  investigationNotes: string[];
  actions: DemoReconciliationAction[];
};

const getTransaction = (id: string) => demoTransactions.find((transaction) => transaction.id === id);

const bayAlarmTransaction = getTransaction("txn_002");
const payrollTransaction = getTransaction("txn_005");
const advisoryTransaction = getTransaction("txn_006");

export const demoAllocationReviewQueue: DemoAllocationReviewItem[] = [
  {
    id: "alloc_001",
    periodLabel: "April 2026",
    transactionId: bayAlarmTransaction?.id,
    location: "Oakland Flagship Retail",
    accountCode: "6310",
    accountName: "Security Services",
    vendor: bayAlarmTransaction?.payee ?? "Bay Alarm Company",
    memo: bayAlarmTransaction?.description ?? "Monthly monitoring and armed response invoice draft",
    basis: "square_footage",
    policyName: "Shared facility occupancy + security policy",
    policyMethod: "Allocate the licensed production footprint of mixed-use facilities into COGS support, leave customer-facing retail floor as nondeductible.",
    driverLabel: "Manufacturing support footage",
    driverValue: "1,180 sf of 4,200 sf eligible (28.1%)",
    deductibleAmount: 614.04,
    nondeductibleAmount: 1570.96,
    confidence: 0.91,
    reviewStatus: "ready_for_review",
    reviewer: "Staff Accountant",
    dueLabel: "Due May 2",
    priority: "high",
    recommendedAction: "approve_split",
    supportingEvidence: [
      "Oakland mixed-use floorplan v2026.1",
      "Security camera zone map tagged to vault + receiving room",
      "April vendor invoice matched to bank reference SVB-7421-0403",
    ],
    notes: [
      "Rule engine applied square footage policy because invoice supports both vault receiving and customer floor coverage.",
      "No override needed unless operations changed camera coverage this month.",
    ],
  },
  {
    id: "alloc_002",
    periodLabel: "April 2026",
    transactionId: payrollTransaction?.id,
    location: "Richmond Manufacturing Hub",
    accountCode: "5035",
    accountName: "Production Labor Absorption",
    vendor: payrollTransaction?.payee ?? "Gusto Payroll",
    memo: payrollTransaction?.description ?? "Week 1 payroll clearing for packaging and infusion team",
    basis: "labor_hours",
    policyName: "Direct labor capitalization policy",
    policyMethod: "Capitalize employees tagged to packaging, infusion, and QC prep hours. Route support supervision and idle time to 280E-limited payroll.",
    driverLabel: "Tracked direct labor hours",
    driverValue: "612 direct hours / 824 total hours (74.3%)",
    deductibleAmount: 13836.99,
    nondeductibleAmount: 4783.45,
    confidence: 0.79,
    reviewStatus: "pending_controller",
    reviewer: "Cost Accountant",
    dueLabel: "Controller review today",
    priority: "critical",
    recommendedAction: "route_to_controller",
    supportingEvidence: [
      "Gusto hours export for packaging + infusion team",
      "Supervisor attestation on indirect sanitation time",
      "Production schedule for vape run MFG-RUN-8841",
    ],
    notes: [
      "Support labor hours increased after sanitation downtime on Apr 7.",
      "Controller sign-off required because direct labor ratio moved more than 5 points from March baseline.",
    ],
  },
  {
    id: "alloc_003",
    periodLabel: "April 2026",
    transactionId: advisoryTransaction?.id,
    location: "Oakland Flagship Retail",
    accountCode: "6415",
    accountName: "Professional Fees",
    vendor: advisoryTransaction?.payee ?? "Calyx CPA Group",
    memo: advisoryTransaction?.description ?? "Monthly accounting advisory retainer",
    basis: "custom_policy",
    policyName: "Professional services deductibility memo",
    policyMethod: "Leave general accounting and tax advisory as deductible unless engagement letter ties directly to inventory costing or production setup.",
    driverLabel: "Engagement scope",
    driverValue: "Retainer coded general ledger close + tax advisory only",
    deductibleAmount: 4500,
    nondeductibleAmount: 0,
    confidence: 0.97,
    reviewStatus: "approved",
    reviewer: "Assistant Controller",
    dueLabel: "Approved Apr 30",
    priority: "normal",
    recommendedAction: "approve_split",
    supportingEvidence: [
      "Signed retainer letter dated Jan 1, 2026",
      "Invoice scope excludes inventory implementation work",
    ],
    notes: [
      "Kept fully deductible under standing policy memo REV-PROF-02.",
    ],
  },
  {
    id: "alloc_004",
    periodLabel: "April 2026",
    location: "Oakland Flagship Retail",
    accountCode: "6210",
    accountName: "Marketing and Promotions",
    vendor: "Community Wellness Expo",
    memo: "Booth fees and compliant educational materials for local event sponsorship",
    basis: "revenue_mix",
    policyName: "Ancillary merchandise revenue split",
    policyMethod: "Allocate mixed retail events by cannabis vs non-cannabis receipts only when backup includes event SKU summary.",
    driverLabel: "Cannabis revenue mix",
    driverValue: "Backup missing; prior event average was 92% cannabis receipts",
    deductibleAmount: 184,
    nondeductibleAmount: 2116,
    confidence: 0.42,
    reviewStatus: "needs_support",
    reviewer: "Bookkeeper",
    dueLabel: "Waiting on support",
    priority: "high",
    recommendedAction: "request_support",
    supportingEvidence: [
      "Event invoice uploaded",
      "Missing POS category recap for event weekend",
    ],
    notes: [
      "Engine fell back to prior-event revenue mix benchmark, which is below approval threshold.",
      "Do not post allocation without event SKU sales recap.",
    ],
  },
];

export const demoCashReconciliations: DemoCashReconciliationItem[] = [
  {
    id: "rec_001",
    periodLabel: "April 2026",
    location: "Oakland Flagship Retail",
    accountName: "Front Drawer 1",
    accountType: "drawer",
    expectedAmount: 3250,
    actualAmount: 3184,
    varianceAmount: -66,
    status: "investigating",
    lastCountedAt: "Apr 30, 9:14 PM",
    owner: "Closing Manager",
    sourceContext: [
      "POS close batch POS-BATCH-0430-PM",
      "Shift drop log shows one manual payout for customer return",
      "Cash count witness: J. Ramos",
    ],
    investigationNotes: [
      "Variance likely tied to return payout not tagged in end-of-shift report.",
      "Need signed payout slip before recon can be cleared.",
    ],
    actions: [
      { title: "Attach payout slip for return", owner: "Shift Lead", status: "in_progress" },
      { title: "Recount with closing witness", owner: "Closing Manager", status: "todo" },
    ],
  },
  {
    id: "rec_002",
    periodLabel: "April 2026",
    location: "Oakland Flagship Retail",
    accountName: "Vault Cash",
    accountType: "vault",
    expectedAmount: 42180.52,
    actualAmount: 42180.52,
    varianceAmount: 0,
    status: "balanced",
    lastCountedAt: "Apr 30, 10:02 PM",
    owner: "General Manager",
    sourceContext: [
      "Vault count tied to three sealed drop bags",
      "Safe log agrees to armored pickup manifest draft",
    ],
    investigationNotes: ["No exception. Ready to roll to armored pickup clearing."],
    actions: [{ title: "Mark vault count reviewed", owner: "Assistant Controller", status: "done" }],
  },
  {
    id: "rec_003",
    periodLabel: "April 2026",
    location: "Oakland Flagship Retail",
    accountName: "Armored Cash Clearing",
    accountType: "bank_clearing",
    expectedAmount: 12840.52,
    actualAmount: 12760.52,
    varianceAmount: -80,
    status: "exception",
    lastCountedAt: "May 1, 8:10 AM",
    owner: "Staff Accountant",
    sourceContext: [
      "Pickup manifest references Apr 30 drop bag OAK-88419",
      "Bank credit on SVB statement posted net of service fee",
      "Receipt image from Apr 4 is still missing in close folder",
    ],
    investigationNotes: [
      "Bank posted armored deposit net of $80 fee, but fee entry has not been booked yet.",
      "Exception remains open until receipt image and fee journal are attached.",
    ],
    actions: [
      { title: "Draft bank fee reclass entry", owner: "Staff Accountant", status: "done" },
      { title: "Upload missing armored receipt image", owner: "Bookkeeper", status: "in_progress" },
      { title: "Clear exception after support review", owner: "Assistant Controller", status: "todo" },
    ],
  },
  {
    id: "rec_004",
    periodLabel: "April 2026",
    location: "Oakland Flagship Retail",
    accountName: "Operating Cash - Oakland",
    accountType: "bank",
    expectedAmount: 90655.14,
    actualAmount: 90655.14,
    varianceAmount: 0,
    status: "ready_to_post",
    lastCountedAt: "May 1, 8:22 AM",
    owner: "Assistant Controller",
    sourceContext: [
      "SVB statement through Apr 30 loaded",
      "Outstanding item: fee reclass entry linked to armored clearing variance",
    ],
    investigationNotes: [
      "Bank statement balances tie after staging reclass and deposit support.",
      "Safe to mark complete once clearing exception is closed.",
    ],
    actions: [{ title: "Post rec package to close folder", owner: "Assistant Controller", status: "todo" }],
  },
];

export function summarizeAllocationQueue(items: DemoAllocationReviewItem[]) {
  const ready = items.filter((item) => item.reviewStatus === "ready_for_review").length;
  const needsSupport = items.filter((item) => item.reviewStatus === "needs_support").length;
  const pendingController = items.filter((item) => item.reviewStatus === "pending_controller").length;
  const approved = items.filter((item) => item.reviewStatus === "approved").length;
  const deductible = items.reduce((sum, item) => sum + item.deductibleAmount, 0);
  const nondeductible = items.reduce((sum, item) => sum + item.nondeductibleAmount, 0);

  return {
    total: items.length,
    ready,
    needsSupport,
    pendingController,
    approved,
    deductible,
    nondeductible,
  };
}

export function summarizeCashReconciliations(items: DemoCashReconciliationItem[]) {
  const balanced = items.filter((item) => item.status === "balanced").length;
  const investigating = items.filter((item) => item.status === "investigating").length;
  const exception = items.filter((item) => item.status === "exception").length;
  const readyToPost = items.filter((item) => item.status === "ready_to_post").length;
  const netVariance = items.reduce((sum, item) => sum + item.varianceAmount, 0);
  const absoluteVariance = items.reduce((sum, item) => sum + Math.abs(item.varianceAmount), 0);

  return {
    total: items.length,
    balanced,
    investigating,
    exception,
    readyToPost,
    netVariance,
    absoluteVariance,
  };
}
