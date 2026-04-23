import { demoTransactions } from "@/lib/demo/accounting";

export type AllocationBasis = "square_footage" | "labor_hours" | "revenue_mix" | "custom_policy";
export type AllocationReviewStatus = "ready_for_review" | "needs_support" | "pending_controller" | "approved";
export type AllocationPriority = "critical" | "high" | "normal";
export type RecommendedAction = "approve_split" | "request_support" | "override_policy" | "route_to_controller";
export type AllocationDecisionType = "recommendation" | "override" | "approval" | "support_request" | "policy_exception";

export type DemoAllocationOverrideEvent = {
  id: string;
  timestampLabel: string;
  actor: string;
  role: string;
  decisionType: AllocationDecisionType;
  fromBasis: AllocationBasis;
  toBasis: AllocationBasis;
  originalDeductibleAmount: number;
  revisedDeductibleAmount: number;
  originalNondeductibleAmount: number;
  revisedNondeductibleAmount: number;
  reason: string;
  evidence: string[];
  resultingPolicyTrail: string;
};

export type DemoPolicyTrailEntry = {
  step: string;
  owner: string;
  status: "complete" | "watch" | "pending";
  note: string;
};

export type DemoSupportEvidenceLink = {
  label: string;
  documentType: string;
  status: "linked" | "needs_refresh" | "missing";
  href: string;
};

export type DemoSimilarAllocationDecision = {
  id: string;
  periodLabel: string;
  basis: AllocationBasis;
  outcome: string;
  deductiblePercent: number;
  note: string;
};

export type DemoAllocationTaxImpactPreview = {
  acceptedDeductibleDelta: number;
  acceptedNondeductibleDelta: number;
  returnLine: string;
  note: string;
};

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
  lastReviewedAt: string;
  priority: AllocationPriority;
  recommendedAction: RecommendedAction;
  flagReason: string;
  decisionRequired: string;
  acceptedOutcome: string;
  supportLinks: DemoSupportEvidenceLink[];
  supportingEvidence: string[];
  similarDecisions: DemoSimilarAllocationDecision[];
  taxImpactPreview: DemoAllocationTaxImpactPreview;
  notes: string[];
  overrideHistory: DemoAllocationOverrideEvent[];
  policyTrail: DemoPolicyTrailEntry[];
};

export type ReconciliationStatus = "balanced" | "investigating" | "exception" | "ready_to_post";
export type ReconciliationAccountType = "drawer" | "vault" | "bank_clearing" | "bank";
export type InvestigationActionStatus = "done" | "in_progress" | "todo";

export type DemoReconciliationAction = {
  title: string;
  owner: string;
  status: InvestigationActionStatus;
};

export type DemoReconciliationBreakdownLine = {
  label: string;
  source: string;
  amount: number;
};

export type DemoVarianceDriver = {
  title: string;
  impactAmount: number;
  confidenceLabel: string;
  note: string;
};

export type DemoReconciliationTransactionReference = {
  transactionId: string;
  label: string;
  amount: number;
  note: string;
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
  sourceBreakdown: DemoReconciliationBreakdownLine[];
  varianceDrivers: DemoVarianceDriver[];
  investigationNotes: string[];
  relatedTransactions: DemoReconciliationTransactionReference[];
  nextSteps: string[];
  actions: DemoReconciliationAction[];
};

const getTransaction = (id: string) => demoTransactions.find((transaction) => transaction.id === id);

const bayAlarmTransaction = getTransaction("txn_002");
const payrollTransaction = getTransaction("txn_005");
const advisoryTransaction = getTransaction("txn_006");
const retailSalesTransaction = getTransaction("txn_001");
const packagingTransaction = getTransaction("txn_004");
const exciseAccrualTransaction = getTransaction("txn_007");

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
    lastReviewedAt: "May 1, 2026 • 9:02 AM PT",
    priority: "high",
    recommendedAction: "approve_split",
    flagReason: "Shared security spend covers both production support zones and the customer floor, so the system is forcing an explicit mixed-use allocation review instead of silently posting a default expense split.",
    decisionRequired: "Confirm the square-footage basis still matches April camera coverage and approve the recommended split or override the footprint if monitored areas changed.",
    acceptedOutcome: "If accepted, 28.1% of the invoice stays in deductible or capitalizable support and the reviewed split is released into the monthly 280E binder with staff-accountant attribution.",
    supportLinks: [
      { label: "Oakland mixed-use floorplan v2026.1", documentType: "Floorplan", status: "linked", href: "/dashboard/allocations/support-schedule#SUP-001" },
      { label: "Security camera zone map", documentType: "Coverage map", status: "linked", href: "/dashboard/allocations/support-schedule#SUP-001" },
      { label: "Matched bank reference SVB-7421-0403", documentType: "Cash disbursement tie-out", status: "linked", href: "/dashboard/accounting/transactions/txn_002" },
    ],
    supportingEvidence: [
      "Oakland mixed-use floorplan v2026.1",
      "Security camera zone map tagged to vault + receiving room",
      "April vendor invoice matched to bank reference SVB-7421-0403",
    ],
    similarDecisions: [
      {
        id: "sim_alloc_001_a",
        periodLabel: "March 2026",
        basis: "square_footage",
        outcome: "Approved unchanged after facility walkthrough refresh",
        deductiblePercent: 0.281,
        note: "Production-support footage held flat after no changes to receiving room or vault coverage.",
      },
      {
        id: "sim_alloc_001_b",
        periodLabel: "January 2026",
        basis: "square_footage",
        outcome: "Minor override after camera moved into retail lobby",
        deductiblePercent: 0.243,
        note: "Prior override reduced deductible share when security coverage expanded into customer-only space.",
      },
    ],
    taxImpactPreview: {
      acceptedDeductibleDelta: 614.04,
      acceptedNondeductibleDelta: 1570.96,
      returnLine: "Schedule M-1 / 280E occupancy-support workpaper",
      note: "Accepting this recommendation preserves the production-support portion in the deductible or capitalizable bucket and leaves the retail-facing remainder in the 280E-limited schedule.",
    },
    notes: [
      "Rule engine applied square footage policy because invoice supports both vault receiving and customer floor coverage.",
      "No override needed unless operations changed camera coverage this month.",
    ],
    overrideHistory: [
      {
        id: "alloc_001_hist_01",
        timestampLabel: "Apr 30, 4:11 PM",
        actor: "Rules Engine",
        role: "System recommendation",
        decisionType: "recommendation",
        fromBasis: "square_footage",
        toBasis: "square_footage",
        originalDeductibleAmount: 614.04,
        revisedDeductibleAmount: 614.04,
        originalNondeductibleAmount: 1570.96,
        revisedNondeductibleAmount: 1570.96,
        reason: "Facility footprint and zone mapping support standard mixed-use security allocation.",
        evidence: ["Floorplan tagged on Apr 1", "Camera zone map synced to receiving room controls"],
        resultingPolicyTrail: "Stayed on default REV-SEC-04 square footage basis with no manual adjustment.",
      },
      {
        id: "alloc_001_hist_02",
        timestampLabel: "May 1, 9:02 AM",
        actor: "N. Vega",
        role: "Staff Accountant",
        decisionType: "approval",
        fromBasis: "square_footage",
        toBasis: "square_footage",
        originalDeductibleAmount: 614.04,
        revisedDeductibleAmount: 614.04,
        originalNondeductibleAmount: 1570.96,
        revisedNondeductibleAmount: 1570.96,
        reason: "Confirmed no operational change to monitored areas during April close.",
        evidence: ["Operations manager Slack attestation exported to binder", "Invoice date aligned to monitored coverage window"],
        resultingPolicyTrail: "Prepared for controller review package with unchanged recommendation and reviewer attribution.",
      },
    ],
    policyTrail: [
      {
        step: "Policy selection",
        owner: "Rules Engine",
        status: "complete",
        note: "Mapped security spend to REV-SEC-04 based on mixed-use facility metadata.",
      },
      {
        step: "Support verification",
        owner: "Staff Accountant",
        status: "complete",
        note: "Invoice, floorplan, and zone map linked to the close binder.",
      },
      {
        step: "Controller release",
        owner: "Assistant Controller",
        status: "pending",
        note: "Ready for release once final allocation packet is assembled.",
      },
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
    lastReviewedAt: "May 1, 2026 • 8:36 AM PT",
    priority: "critical",
    recommendedAction: "route_to_controller",
    flagReason: "Direct labor capitalization moved more than five points from the prior month after sanitation downtime was reclassified, which triggers controller review under the labor variance policy.",
    decisionRequired: "Decide whether the revised labor-hour split should stand as the final April treatment and whether enhanced exception retention is sufficient for recurring downtime risk.",
    acceptedOutcome: "If accepted, the revised payroll split becomes the posted April basis, controller exception language is locked into the binder, and the recurring sanitation issue stays on the watchlist for May close.",
    supportLinks: [
      { label: "Gusto hours export", documentType: "Payroll support", status: "linked", href: "/dashboard/allocations/support-schedule#SUP-002" },
      { label: "Supervisor sanitation downtime attestation", documentType: "Supervisor memo", status: "linked", href: "/dashboard/allocations/history" },
      { label: "Production schedule MFG-RUN-8841", documentType: "Production schedule", status: "linked", href: "/dashboard/allocations/support-schedule#SUP-002" },
      { label: "March-to-April labor bridge schedule", documentType: "Variance bridge", status: "linked", href: "/dashboard/allocations/history" },
    ],
    supportingEvidence: [
      "Gusto hours export for packaging + infusion team",
      "Supervisor attestation on indirect sanitation time",
      "Production schedule for vape run MFG-RUN-8841",
    ],
    similarDecisions: [
      {
        id: "sim_alloc_002_a",
        periodLabel: "March 2026",
        basis: "labor_hours",
        outcome: "Approved without override",
        deductiblePercent: 0.693,
        note: "Prior month direct labor ratio cleared policy thresholds with no downtime adjustment.",
      },
      {
        id: "sim_alloc_002_b",
        periodLabel: "December 2025",
        basis: "labor_hours",
        outcome: "Controller override after maintenance shutdown",
        deductiblePercent: 0.711,
        note: "Maintenance-related idle hours were reclassified out of capitalizable labor after controller review.",
      },
    ],
    taxImpactPreview: {
      acceptedDeductibleDelta: -858.55,
      acceptedNondeductibleDelta: 858.55,
      returnLine: "Form 1120 inventory capitalization support / 280E labor bridge",
      note: "Accepting the current override keeps $858.55 out of the deductible or capitalizable labor bucket compared with the original recommendation and documents the shift as a controller-approved exception.",
    },
    notes: [
      "Support labor hours increased after sanitation downtime on Apr 7.",
      "Controller sign-off required because direct labor ratio moved more than 5 points from March baseline.",
    ],
    overrideHistory: [
      {
        id: "alloc_002_hist_01",
        timestampLabel: "Apr 30, 7:18 PM",
        actor: "Rules Engine",
        role: "System recommendation",
        decisionType: "recommendation",
        fromBasis: "labor_hours",
        toBasis: "labor_hours",
        originalDeductibleAmount: 14695.54,
        revisedDeductibleAmount: 14695.54,
        originalNondeductibleAmount: 3924.9,
        revisedNondeductibleAmount: 3924.9,
        reason: "Timecard tags initially showed 78.9% direct labor eligibility for the week 1 run.",
        evidence: ["Initial payroll import mapping", "Timeclock tag export before sanitation adjustment"],
        resultingPolicyTrail: "Flagged for watch because direct labor ratio exceeded prior-month baseline by 9 points.",
      },
      {
        id: "alloc_002_hist_02",
        timestampLabel: "May 1, 8:07 AM",
        actor: "A. Pierce",
        role: "Cost Accountant",
        decisionType: "override",
        fromBasis: "labor_hours",
        toBasis: "labor_hours",
        originalDeductibleAmount: 14695.54,
        revisedDeductibleAmount: 13836.99,
        originalNondeductibleAmount: 3924.9,
        revisedNondeductibleAmount: 4783.45,
        reason: "Reclassified 38 sanitation downtime hours to indirect support after supervisor memo and CIP wash log review.",
        evidence: ["Sanitation downtime memo signed Apr 30", "Batch wash log for line 2", "Supervisor exception worksheet"],
        resultingPolicyTrail: "Moved to controller approval path under labor variance exception threshold policy LAB-07.",
      },
      {
        id: "alloc_002_hist_03",
        timestampLabel: "May 1, 8:36 AM",
        actor: "M. Chen",
        role: "Controller",
        decisionType: "policy_exception",
        fromBasis: "labor_hours",
        toBasis: "labor_hours",
        originalDeductibleAmount: 13836.99,
        revisedDeductibleAmount: 13836.99,
        originalNondeductibleAmount: 4783.45,
        revisedNondeductibleAmount: 4783.45,
        reason: "Accepted revised split but required enhanced support retention because sanitation downtime was tied to a recurring issue.",
        evidence: ["Controller variance memo", "March-to-April labor bridge schedule"],
        resultingPolicyTrail: "Close binder must retain labor bridge, sanitation exception memo, and approval timestamp for CPA review.",
      },
    ],
    policyTrail: [
      {
        step: "Hours import and recommendation",
        owner: "Rules Engine",
        status: "complete",
        note: "Initial labor-hour capitalization recommendation produced from tagged payroll export.",
      },
      {
        step: "Variance challenge",
        owner: "Cost Accountant",
        status: "complete",
        note: "Downtime hours reclassified after production support review.",
      },
      {
        step: "Controller approval",
        owner: "Controller",
        status: "watch",
        note: "Approved with enhanced memo retention and recurring-issue watchlist flag.",
      },
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
    lastReviewedAt: "Apr 30, 2026 • 10:26 AM PT",
    priority: "normal",
    recommendedAction: "approve_split",
    flagReason: "Professional-fee invoices are still surfaced in the queue because 280E treatment turns on engagement scope, and scope drift into inventory implementation would change the tax position immediately.",
    decisionRequired: "Confirm the retainer remains general accounting and tax advisory only, with no inventory costing or production implementation work embedded in the monthly bill.",
    acceptedOutcome: "If accepted, the invoice remains fully deductible, ties back to the standing memo, and rolls into the recurring professional-fees schedule without a policy exception.",
    supportLinks: [
      { label: "Signed retainer letter", documentType: "Engagement letter", status: "linked", href: "/dashboard/allocations/support-schedule#SUP-003" },
      { label: "Invoice scope memo", documentType: "Scope review", status: "linked", href: "/dashboard/allocations/support-schedule#SUP-003" },
      { label: "Q1 CPA packet cross-reference", documentType: "Prior packet", status: "linked", href: "/dashboard/allocations/history" },
    ],
    supportingEvidence: [
      "Signed retainer letter dated Jan 1, 2026",
      "Invoice scope excludes inventory implementation work",
    ],
    similarDecisions: [
      {
        id: "sim_alloc_003_a",
        periodLabel: "March 2026",
        basis: "custom_policy",
        outcome: "Approved unchanged under REV-PROF-02",
        deductiblePercent: 1,
        note: "Monthly retainer stayed fully deductible after the same engagement-scope check.",
      },
      {
        id: "sim_alloc_003_b",
        periodLabel: "November 2025",
        basis: "custom_policy",
        outcome: "Split after ERP inventory setup add-on",
        deductiblePercent: 0.62,
        note: "A one-time implementation rider created partial inventory-related treatment in a prior quarter.",
      },
    ],
    taxImpactPreview: {
      acceptedDeductibleDelta: 4500,
      acceptedNondeductibleDelta: 0,
      returnLine: "Ordinary deduction schedule / memo-backed professional fees",
      note: "Accepting the memo-backed recommendation leaves the entire retainer in the deductible column and avoids creating an unnecessary 280E limitation entry.",
    },
    notes: [
      "Kept fully deductible under standing policy memo REV-PROF-02.",
    ],
    overrideHistory: [
      {
        id: "alloc_003_hist_01",
        timestampLabel: "Apr 29, 2:44 PM",
        actor: "Rules Engine",
        role: "System recommendation",
        decisionType: "recommendation",
        fromBasis: "custom_policy",
        toBasis: "custom_policy",
        originalDeductibleAmount: 4500,
        revisedDeductibleAmount: 4500,
        originalNondeductibleAmount: 0,
        revisedNondeductibleAmount: 0,
        reason: "Engagement metadata tied invoice to close advisory and tax planning only.",
        evidence: ["Vendor profile scope tags", "Historical memo REV-PROF-02"],
        resultingPolicyTrail: "No override required; invoice remains deductible support expense.",
      },
      {
        id: "alloc_003_hist_02",
        timestampLabel: "Apr 30, 10:26 AM",
        actor: "K. Dalton",
        role: "Assistant Controller",
        decisionType: "approval",
        fromBasis: "custom_policy",
        toBasis: "custom_policy",
        originalDeductibleAmount: 4500,
        revisedDeductibleAmount: 4500,
        originalNondeductibleAmount: 0,
        revisedNondeductibleAmount: 0,
        reason: "Reviewed invoice and engagement letter against prior-quarter CPA handoff packet assumptions.",
        evidence: ["Invoice scope screenshot", "Q1 CPA packet cross-reference"],
        resultingPolicyTrail: "Approved and cross-linked to recurring professional-fees memo binder section.",
      },
    ],
    policyTrail: [
      {
        step: "Memo lookup",
        owner: "Rules Engine",
        status: "complete",
        note: "Matched to REV-PROF-02 because no production implementation scope was present.",
      },
      {
        step: "Reviewer validation",
        owner: "Assistant Controller",
        status: "complete",
        note: "Validated against engagement letter and prior-quarter packet treatment.",
      },
      {
        step: "CPA handoff reference",
        owner: "Tax Manager",
        status: "complete",
        note: "Included in standing memo-backed deductible expense schedule.",
      },
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
    lastReviewedAt: "May 1, 2026 • 7:41 AM PT",
    priority: "high",
    recommendedAction: "request_support",
    flagReason: "The event spend touched a mixed cannabis and non-cannabis revenue context, but the SKU recap needed to support a revenue-mix allocation is missing, so the item is explicitly blocked in review.",
    decisionRequired: "Obtain the event-day SKU recap and usage log, then decide whether the fallback benchmark should be replaced with actual sales mix or the spend should remain almost entirely 280E-limited.",
    acceptedOutcome: "If the current fallback were accepted as-is, only a small benchmark-based deductible share would remain and the item would continue carrying a support-gap note into the tax binder until real sales support arrives.",
    supportLinks: [
      { label: "Expo invoice PDF", documentType: "Vendor invoice", status: "linked", href: "/dashboard/allocations/support-schedule#SUP-004" },
      { label: "POS category recap", documentType: "Sales recap", status: "missing", href: "/dashboard/allocations/support-schedule#SUP-004" },
      { label: "Educational-material usage log", documentType: "Usage log", status: "missing", href: "/dashboard/allocations/history" },
    ],
    supportingEvidence: [
      "Event invoice uploaded",
      "Missing POS category recap for event weekend",
    ],
    similarDecisions: [
      {
        id: "sim_alloc_004_a",
        periodLabel: "February 2026",
        basis: "revenue_mix",
        outcome: "Approved after SKU recap delivered",
        deductiblePercent: 0.11,
        note: "A prior event cleared review only after category-level POS support arrived from retail ops.",
      },
      {
        id: "sim_alloc_004_b",
        periodLabel: "October 2025",
        basis: "revenue_mix",
        outcome: "Denied and left fully limited",
        deductiblePercent: 0,
        note: "Missing event support forced the team to leave the full spend in the nondeductible bucket.",
      },
    ],
    taxImpactPreview: {
      acceptedDeductibleDelta: 184,
      acceptedNondeductibleDelta: 2116,
      returnLine: "280E promotional spend schedule / unsupported mixed-event review",
      note: "Accepting the current fallback would leave most of the spend in the 280E-limited bucket and still advertise to reviewers that the tax position is benchmark-based rather than fully supported.",
    },
    notes: [
      "Engine fell back to prior-event revenue mix benchmark, which is below approval threshold.",
      "Do not post allocation without event SKU sales recap.",
    ],
    overrideHistory: [
      {
        id: "alloc_004_hist_01",
        timestampLabel: "Apr 30, 6:03 PM",
        actor: "Rules Engine",
        role: "System recommendation",
        decisionType: "recommendation",
        fromBasis: "revenue_mix",
        toBasis: "revenue_mix",
        originalDeductibleAmount: 184,
        revisedDeductibleAmount: 184,
        originalNondeductibleAmount: 2116,
        revisedNondeductibleAmount: 2116,
        reason: "Revenue mix fallback benchmark applied because event SKU-level recap was missing.",
        evidence: ["Prior event benchmark workbook", "Expo invoice PDF"],
        resultingPolicyTrail: "Auto-held because fallback benchmarks cannot clear policy approval thresholds.",
      },
      {
        id: "alloc_004_hist_02",
        timestampLabel: "May 1, 7:41 AM",
        actor: "R. Soto",
        role: "Bookkeeper",
        decisionType: "support_request",
        fromBasis: "revenue_mix",
        toBasis: "revenue_mix",
        originalDeductibleAmount: 184,
        revisedDeductibleAmount: 184,
        originalNondeductibleAmount: 2116,
        revisedNondeductibleAmount: 2116,
        reason: "Requested event-day POS category recap and educational-material usage log before any override is considered.",
        evidence: ["Support request email to retail ops", "Checklist note in close tracker"],
        resultingPolicyTrail: "Remains blocked from packet release until event support package is complete.",
      },
    ],
    policyTrail: [
      {
        step: "Fallback benchmark applied",
        owner: "Rules Engine",
        status: "complete",
        note: "Used prior-event revenue mix because event SKU summary was unavailable at close cut-off.",
      },
      {
        step: "Support request sent",
        owner: "Bookkeeper",
        status: "watch",
        note: "Awaiting POS category recap and marketing usage log from retail ops.",
      },
      {
        step: "Final approval",
        owner: "Controller",
        status: "pending",
        note: "Cannot approve or override until support arrives.",
      },
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
    sourceBreakdown: [
      { label: "POS batch cash sales", source: "Treez POS", amount: 3315 },
      { label: "Approved return payout", source: "Customer service log", amount: -65 },
      { label: "Starting till float", source: "Drawer setup sheet", amount: 0 },
    ],
    varianceDrivers: [
      {
        title: "Unsigned payout slip",
        impactAmount: -66,
        confidenceLabel: "High confidence",
        note: "Likely cause is an untagged customer return payout documented in shift notes but not attached in the drawer packet.",
      },
    ],
    investigationNotes: [
      "Variance likely tied to return payout not tagged in end-of-shift report.",
      "Need signed payout slip before recon can be cleared.",
    ],
    relatedTransactions: [
      {
        transactionId: retailSalesTransaction?.id ?? "txn_001",
        label: retailSalesTransaction?.reference ?? "POS-BATCH-0402-AM",
        amount: retailSalesTransaction?.amount ?? 12840.52,
        note: "Representative POS batch detail used to validate cash sales routing and exception handling.",
      },
      {
        transactionId: exciseAccrualTransaction?.id ?? "txn_007",
        label: exciseAccrualTransaction?.reference ?? "JE-DRAFT-0007",
        amount: exciseAccrualTransaction?.amount ?? 1311.28,
        note: "Related close journal confirms cash clearing treatment once drawer discrepancy is resolved.",
      },
    ],
    nextSteps: [
      "Obtain the signed payout slip from the shift lead and attach it to the drawer packet.",
      "Recount drawer with witness if slip cannot be produced before close cutoff.",
      "Escalate shortage to controller if variance remains unresolved after recount.",
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
    sourceBreakdown: [
      { label: "Bag OAK-88417", source: "Drop bag register", amount: 15240.16 },
      { label: "Bag OAK-88418", source: "Drop bag register", amount: 14100.24 },
      { label: "Bag OAK-88419", source: "Drop bag register", amount: 12840.12 },
    ],
    varianceDrivers: [
      {
        title: "No active variance",
        impactAmount: 0,
        confidenceLabel: "Closed",
        note: "All sealed bags and safe log totals agree to the vault count.",
      },
    ],
    investigationNotes: ["No exception. Ready to roll to armored pickup clearing."],
    relatedTransactions: [
      {
        transactionId: retailSalesTransaction?.id ?? "txn_001",
        label: retailSalesTransaction?.reference ?? "POS-BATCH-0402-AM",
        amount: retailSalesTransaction?.amount ?? 12840.52,
        note: "Representative cash batch supporting one of the sealed vault bags.",
      },
    ],
    nextSteps: [
      "Release armored pickup packet to clearing workflow.",
      "Archive signed safe log with the reconciliation package.",
    ],
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
    sourceBreakdown: [
      { label: "Armored pickup manifest", source: "Manifest OAK-88419", amount: 12840.52 },
      { label: "Bank credit received", source: "SVB statement", amount: 12760.52 },
      { label: "Unbooked armored fee", source: "Carrier fee advice", amount: -80 },
    ],
    varianceDrivers: [
      {
        title: "Carrier service fee",
        impactAmount: -80,
        confidenceLabel: "High confidence",
        note: "Bank received the deposit net of carrier fee and the reclass entry has already been drafted.",
      },
      {
        title: "Missing receipt image",
        impactAmount: 0,
        confidenceLabel: "Support gap",
        note: "Close cannot be finalized until the physical pickup receipt image is attached to the packet.",
      },
    ],
    investigationNotes: [
      "Bank posted armored deposit net of $80 fee, but fee entry has not been booked yet.",
      "Exception remains open until receipt image and fee journal are attached.",
    ],
    relatedTransactions: [
      {
        transactionId: retailSalesTransaction?.id ?? "txn_001",
        label: retailSalesTransaction?.reference ?? "POS-BATCH-0402-AM",
        amount: retailSalesTransaction?.amount ?? 12840.52,
        note: "Source retail batch that ultimately rolled into the vault and armored pickup chain.",
      },
      {
        transactionId: exciseAccrualTransaction?.id ?? "txn_007",
        label: exciseAccrualTransaction?.reference ?? "JE-DRAFT-0007",
        amount: exciseAccrualTransaction?.amount ?? 1311.28,
        note: "Companion close journal used when clearing cash and accrual balances before lock.",
      },
    ],
    nextSteps: [
      "Book the drafted $80 fee reclass into the bank clearing package.",
      "Upload the missing armored receipt image to the close binder.",
      "Move the item to ready-to-post once controller confirms both support points.",
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
    sourceBreakdown: [
      { label: "Statement ending balance", source: "SVB statement", amount: 90655.14 },
      { label: "Outstanding reconciling items", source: "Rec workbook", amount: 0 },
    ],
    varianceDrivers: [
      {
        title: "Dependent on clearing exception",
        impactAmount: 0,
        confidenceLabel: "Ready after dependency",
        note: "Bank balance ties, but final package release is waiting on the armored clearing support gap to close.",
      },
    ],
    investigationNotes: [
      "Bank statement balances tie after staging reclass and deposit support.",
      "Safe to mark complete once clearing exception is closed.",
    ],
    relatedTransactions: [
      {
        transactionId: advisoryTransaction?.id ?? "txn_006",
        label: advisoryTransaction?.reference ?? "SVB-7421-0408",
        amount: advisoryTransaction?.amount ?? 4500,
        note: "Example bank activity included in the final statement tie-out package.",
      },
      {
        transactionId: bayAlarmTransaction?.id ?? "txn_002",
        label: bayAlarmTransaction?.reference ?? "SVB-7421-0403",
        amount: bayAlarmTransaction?.amount ?? 2185,
        note: "Reviewed outflow linked to allocation support and bank statement completeness.",
      },
    ],
    nextSteps: [
      "Confirm the clearing exception is resolved and the fee reclass is posted.",
      "Publish the final bank reconciliation PDF into the CPA handoff bundle.",
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

export function summarizeAllocationHistory(items: DemoAllocationReviewItem[]) {
  const overrideCount = items.reduce((sum, item) => sum + item.overrideHistory.filter((event) => event.decisionType === "override").length, 0);
  const policyExceptionCount = items.reduce((sum, item) => sum + item.overrideHistory.filter((event) => event.decisionType === "policy_exception").length, 0);
  const supportRequestCount = items.reduce((sum, item) => sum + item.overrideHistory.filter((event) => event.decisionType === "support_request").length, 0);
  const totalShiftAmount = items.reduce(
    (sum, item) =>
      sum +
      item.overrideHistory.reduce(
        (eventSum, event) => eventSum + Math.abs(event.revisedDeductibleAmount - event.originalDeductibleAmount),
        0,
      ),
    0,
  );

  return {
    itemCount: items.length,
    overrideCount,
    policyExceptionCount,
    supportRequestCount,
    totalShiftAmount,
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

export function getDemoCashReconciliation(id: string) {
  return demoCashReconciliations.find((item) => item.id === id);
}

export function getFeaturedCashReconciliation(items: DemoCashReconciliationItem[] = demoCashReconciliations) {
  return (
    items.find((item) => item.status === "exception") ??
    items.find((item) => item.status === "investigating") ??
    items.find((item) => item.status === "ready_to_post") ??
    items[0]
  );
}

export function getFeaturedCashReconciliationHref(items: DemoCashReconciliationItem[] = demoCashReconciliations) {
  const featured = getFeaturedCashReconciliation(items);

  return featured ? `/dashboard/reconciliations/${featured.id}` : "/dashboard/reconciliations";
}
