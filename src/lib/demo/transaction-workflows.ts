import { demoAllocationReviewQueue } from "@/lib/demo/accounting-operations";
import { demoChartOfAccounts, demoTransactions, type DemoTransaction } from "@/lib/demo/accounting";

export type TransactionApprovalPathState = "completed" | "current" | "upcoming";
export type TransactionReviewerActionTone = "emerald" | "amber" | "violet" | "slate";
export type TransactionAuditEventTone = "emerald" | "amber" | "violet" | "slate" | "rose";

export type DemoTransactionApprovalStep = {
  label: string;
  owner: string;
  state: TransactionApprovalPathState;
  detail: string;
  timestamp?: string;
};

export type DemoTransactionReviewerAction = {
  label: string;
  detail: string;
  tone: TransactionReviewerActionTone;
};

export type DemoTransactionAuditEvent = {
  at: string;
  actor: string;
  action: string;
  detail: string;
  tone: TransactionAuditEventTone;
};

export type DemoTransactionDetail = {
  transactionId: string;
  summary: string;
  sourceDetail: string;
  amountImpact: {
    debitLabel: string;
    creditLabel: string;
    functionalArea: string;
    taxView: string;
  };
  suggestedMappingReason: string;
  relatedAccountCodes: string[];
  supportingDocs: {
    required: boolean;
    received: boolean;
    items: string[];
    gapNote?: string;
  };
  reviewerActions: DemoTransactionReviewerAction[];
  approvalPath: DemoTransactionApprovalStep[];
  auditTrail: DemoTransactionAuditEvent[];
  linkedAllocationId?: string;
  whatChanged?: { field: string; from: string; to: string }[];
};

const transactionDetailMap: Record<string, DemoTransactionDetail> = {
  txn_001: {
    transactionId: "txn_001",
    summary: "POS batch staged from Treez with retail sales and excise split still pending final posting package.",
    sourceDetail: "Imported from Treez daily close export, reconciled to Oakland operating cash and matched to POS batch POS-BATCH-0402-AM.",
    amountImpact: {
      debitLabel: "Operating Cash - Oakland (1010)",
      creditLabel: "Retail Cannabis Sales (4010)",
      functionalArea: "Retail close",
      taxView: "Gross sales entry is ready, but excise payable reclass remains part of the final posting set.",
    },
    suggestedMappingReason: "Treez batch metadata tied the receipt bundle to retail flower and pre-roll sales, so the engine mapped cash receipts to retail sales with an excise carveout note.",
    relatedAccountCodes: ["1010", "4010", "2210"],
    supportingDocs: {
      required: true,
      received: true,
      items: [
        "Treez register recap PDF",
        "Tender summary for cash and debit mix",
        "Excise tax worksheet prepared by controller",
      ],
    },
    reviewerActions: [
      { label: "Approve posting package", detail: "All source support is present and the batch is ready for final journal release.", tone: "emerald" },
      { label: "Preview excise reclass", detail: "Open linked accrual draft before posting the revenue package.", tone: "violet" },
      { label: "Route to close checklist", detail: "Attach the batch to the April revenue close packet.", tone: "slate" },
    ],
    approvalPath: [
      { label: "Imported", owner: "Integrations", state: "completed", detail: "Treez batch landed with batch hash validation." },
      { label: "Needs review", owner: "Staff Accountant", state: "completed", detail: "Cash totals and location mapping agreed to the POS recap." },
      { label: "Approved", owner: "Assistant Controller", state: "current", detail: "Awaiting final sign-off with excise package attached." },
      { label: "Posted", owner: "Close automation", state: "upcoming", detail: "Will lock once bundled journal is released." },
    ],
    auditTrail: [
      { at: "Apr 2, 7:09 AM", actor: "Treez import", action: "Imported batch", detail: "Created transaction from morning register close payload.", tone: "slate" },
      { at: "Apr 2, 9:22 AM", actor: "M. Santos", action: "Validated amounts", detail: "Cash and card settlement tied to source recap.", tone: "emerald" },
      { at: "Apr 2, 9:41 AM", actor: "Controller", action: "Held for bundled post", detail: "Revenue entry will release with excise accrual journal.", tone: "violet" },
    ],
  },
  txn_002: {
    transactionId: "txn_002",
    summary: "Bank-cleared security spend needs mapping confirmation, invoice support, and 280E allocation review before posting.",
    sourceDetail: "Pulled from Silicon Valley Bank activity feed with vendor match confidence 96%; reference SVB-7421-0403 aligns to Bay Alarm ACH settlement.",
    amountImpact: {
      debitLabel: "Security Services (6310)",
      creditLabel: "Operating Cash - Oakland (1010)",
      functionalArea: "Shared occupancy and security",
      taxView: "Current default treatment is nondeductible until square-footage allocation support is approved.",
    },
    suggestedMappingReason: "Vendor history and memo text point to the recurring Bay Alarm contract, but the transaction remains in review because the facility coverage map spans both retail and manufacturing support areas.",
    relatedAccountCodes: ["6310", "1010", "5035"],
    supportingDocs: {
      required: true,
      received: false,
      items: [
        "Bank activity screenshot",
        "Prior month Bay Alarm invoice on file",
      ],
      gapNote: "Current-month invoice PDF and camera coverage note are still missing from the close folder.",
    },
    reviewerActions: [
      { label: "Request invoice upload", detail: "Required before final approval because support docs are incomplete.", tone: "amber" },
      { label: "Approve recommended split", detail: "Use linked 280E allocation if operations confirms no camera coverage changes.", tone: "emerald" },
      { label: "Escalate to controller", detail: "Needed if the security footprint changed or the policy basis must be overridden.", tone: "violet" },
    ],
    approvalPath: [
      { label: "Imported", owner: "Bank feed", state: "completed", detail: "ACH debit normalized from SVB feed.", timestamp: "Apr 3, 6:11 AM" },
      { label: "Needs review", owner: "Staff Accountant", state: "current", detail: "Waiting on invoice support and allocation confirmation.", timestamp: "Apr 3, 8:55 AM" },
      { label: "Approved", owner: "Assistant Controller", state: "upcoming", detail: "Approval opens once support package is complete." },
      { label: "Posted", owner: "Close automation", state: "upcoming", detail: "Journal posts to cash after review and allocation sign-off." },
    ],
    auditTrail: [
      { at: "Apr 3, 6:11 AM", actor: "SVB import", action: "Imported transaction", detail: "Detected recurring ACH vendor pattern for Bay Alarm.", tone: "slate" },
      { at: "Apr 3, 8:55 AM", actor: "Rules engine", action: "Suggested mapping", detail: "Mapped to 6310 Security Services with 280E caution flag.", tone: "amber" },
      { at: "Apr 3, 10:18 AM", actor: "J. Patel", action: "Requested support", detail: "Invoice and updated floor coverage support required before approval.", tone: "rose" },
    ],
    linkedAllocationId: demoAllocationReviewQueue.find((item) => item.transactionId === "txn_002")?.id,
    whatChanged: [
      { field: "Debit account", from: "6310 Security Services", to: "5035 COGS - Security (allocated)" },
      { field: "Tax treatment", from: "Nondeductible", to: "COGS (with allocation support)" },
    ],
  },
  txn_003: {
    transactionId: "txn_003",
    summary: "Manufacturing inventory issue is drafted and waiting for production supervisor confirmation before posting.",
    sourceDetail: "Generated from manufacturing close event MFG-RUN-8841 when packaging inventory was relieved into a vape cartridge run.",
    amountImpact: {
      debitLabel: "Cost of Goods Sold - Manufactured Goods (5020)",
      creditLabel: "Inventory - Packaging Inputs (1135)",
      functionalArea: "Production close",
      taxView: "Capitalizable manufacturing cost supported by inventory movement and production batch records.",
    },
    suggestedMappingReason: "The SKU issue log points directly to packaging consumed in a Richmond manufacturing run, so the engine drafted a cost movement entry from packaging inventory into manufactured goods.",
    relatedAccountCodes: ["5020", "1135", "1125"],
    supportingDocs: {
      required: true,
      received: true,
      items: ["Batch consumption report", "Packaging pick ticket", "QC release for vape run MFG-RUN-8841"],
    },
    reviewerActions: [
      { label: "Confirm supervisor attestation", detail: "Draft is ready once production close confirms no scrap adjustment is needed.", tone: "violet" },
      { label: "Approve and post", detail: "All inventory support is attached and journal is materially ready.", tone: "emerald" },
    ],
    approvalPath: [
      { label: "Imported", owner: "Manufacturing event", state: "completed", detail: "Inventory issue generated from batch close." },
      { label: "Needs review", owner: "Cost Accountant", state: "completed", detail: "Quantity and cost per unit tie to the issue log." },
      { label: "Approved", owner: "Production Accounting", state: "current", detail: "Supervisor attestation pending in draft review." },
      { label: "Posted", owner: "Close automation", state: "upcoming", detail: "Posts after draft release." },
    ],
    auditTrail: [
      { at: "Apr 4, 1:04 PM", actor: "MFG close", action: "Created draft", detail: "Issued packaging inputs to the Richmond vape run.", tone: "slate" },
      { at: "Apr 4, 2:12 PM", actor: "Cost Accountant", action: "Checked valuation", detail: "Unit cost matched packaging layer valuation.", tone: "emerald" },
    ],
  },
  txn_004: {
    transactionId: "txn_004",
    summary: "Packaging vendor bill already posted and retained as a benchmark example of a completed approval path.",
    sourceDetail: "Bill entered from AP inbox and matched to Pacific Packaging Labs vendor record with manufacturing license location tagging.",
    amountImpact: {
      debitLabel: "Inventory - Packaging Inputs (1135)",
      creditLabel: "Accounts Payable (2010)",
      functionalArea: "Inventory capitalization",
      taxView: "Manufacturing packaging inputs remain capitalizable until consumed in production.",
    },
    suggestedMappingReason: "Historical vendor behavior and line-item descriptions consistently point to packaging inventory purchases for Richmond manufacturing.",
    relatedAccountCodes: ["1135", "2010", "5020"],
    supportingDocs: {
      required: true,
      received: true,
      items: ["Vendor invoice", "Receiving log", "Approved PO"],
    },
    reviewerActions: [{ label: "View posting package", detail: "Posted entry is locked; only audit review actions remain.", tone: "slate" }],
    approvalPath: [
      { label: "Imported", owner: "AP intake", state: "completed", detail: "Vendor bill received and normalized." },
      { label: "Needs review", owner: "Inventory Accountant", state: "completed", detail: "Matched to PO and receiving." },
      { label: "Approved", owner: "Assistant Controller", state: "completed", detail: "Approved for posting in AP close." },
      { label: "Posted", owner: "Posting service", state: "current", detail: "Posted Apr 5 with bill batch AP-0405-2." },
    ],
    auditTrail: [
      { at: "Apr 5, 8:03 AM", actor: "AP inbox", action: "Imported bill", detail: "OCR captured packaging line items.", tone: "slate" },
      { at: "Apr 5, 11:34 AM", actor: "Inventory Accountant", action: "Approved", detail: "Matched to receiving and PO without variance.", tone: "emerald" },
      { at: "Apr 5, 1:17 PM", actor: "Posting service", action: "Posted", detail: "Created AP journal and locked source document.", tone: "emerald" },
    ],
  },
  txn_005: {
    transactionId: "txn_005",
    summary: "Payroll clearing requires labor split review because manufacturing-direct hours shifted materially from the prior month baseline.",
    sourceDetail: "Loaded from Gusto payroll export with employee tags for packaging and infusion teams at the Richmond hub.",
    amountImpact: {
      debitLabel: "Production Labor Absorption (5035)",
      creditLabel: "Operating Cash - Oakland (1010)",
      functionalArea: "Direct labor capitalization",
      taxView: "Direct manufacturing labor is capitalizable, but support and downtime hours remain 280E-limited payroll.",
    },
    suggestedMappingReason: "Clocked labor classes indicate a majority of the payroll belongs in production labor absorption, but the sanitation downtime exception forced a pending-controller checkpoint.",
    relatedAccountCodes: ["5035", "6110", "1010"],
    supportingDocs: {
      required: true,
      received: true,
      items: ["Gusto payroll register", "Department hours export", "Supervisor downtime attestation"],
      gapNote: "Controller sign-off is still required because the direct labor ratio moved more than 5 points month over month.",
    },
    reviewerActions: [
      { label: "Route to controller", detail: "Threshold exception requires controller review before approval.", tone: "violet" },
      { label: "Approve labor split", detail: "Ready after controller confirms the 74.3% direct labor ratio.", tone: "emerald" },
      { label: "Request revised hours", detail: "Use if operations changes downtime coding.", tone: "amber" },
    ],
    approvalPath: [
      { label: "Imported", owner: "Payroll import", state: "completed", detail: "Payroll clearing loaded from Gusto export." },
      { label: "Needs review", owner: "Cost Accountant", state: "completed", detail: "Mapped direct labor vs support payroll split." },
      { label: "Approved", owner: "Controller", state: "current", detail: "Controller threshold review is open." },
      { label: "Posted", owner: "Close automation", state: "upcoming", detail: "Posts after exception sign-off." },
    ],
    auditTrail: [
      { at: "Apr 7, 7:05 AM", actor: "Gusto import", action: "Imported payroll", detail: "Created clearing transaction for week 1 payroll.", tone: "slate" },
      { at: "Apr 7, 11:30 AM", actor: "Cost Accountant", action: "Calculated split", detail: "Direct labor ratio calculated at 74.3%.", tone: "amber" },
      { at: "Apr 7, 11:44 AM", actor: "Rules engine", action: "Escalated threshold", detail: "Variance exceeded monthly policy tolerance and routed to controller.", tone: "violet" },
    ],
    linkedAllocationId: demoAllocationReviewQueue.find((item) => item.transactionId === "txn_005")?.id,
  },
  txn_006: {
    transactionId: "txn_006",
    summary: "Professional fee payment is ready to post with full memo-backed support for deductible treatment.",
    sourceDetail: "Imported from bank activity and matched to the monthly Calyx CPA retainer payment using recurring vendor and memo rules.",
    amountImpact: {
      debitLabel: "Professional Fees (6415)",
      creditLabel: "Operating Cash - Oakland (1010)",
      functionalArea: "Monthly close advisory",
      taxView: "Retainer remains deductible because the engagement letter excludes inventory implementation work.",
    },
    suggestedMappingReason: "Engagement scope and invoice history consistently point to general ledger close and tax advisory, so the engine recommends deductible professional fees.",
    relatedAccountCodes: ["6415", "1010"],
    supportingDocs: {
      required: true,
      received: true,
      items: ["Signed retainer letter", "April invoice", "Board-approved advisory budget"],
    },
    reviewerActions: [
      { label: "Approve and post", detail: "No 280E override required under standing policy memo REV-PROF-02.", tone: "emerald" },
      { label: "Attach to tax workpapers", detail: "Support package is suitable for CPA review binder.", tone: "slate" },
    ],
    approvalPath: [
      { label: "Imported", owner: "Bank feed", state: "completed", detail: "Recurring bank payment identified." },
      { label: "Needs review", owner: "Staff Accountant", state: "completed", detail: "Scope memo confirmed deductible treatment." },
      { label: "Approved", owner: "Assistant Controller", state: "current", detail: "Ready for release in close batch." },
      { label: "Posted", owner: "Close automation", state: "upcoming", detail: "Will post with remaining April advisory entries." },
    ],
    auditTrail: [
      { at: "Apr 8, 8:11 AM", actor: "SVB import", action: "Imported transaction", detail: "Matched recurring payment to Calyx CPA Group.", tone: "slate" },
      { at: "Apr 8, 9:26 AM", actor: "A. Nguyen", action: "Confirmed policy memo", detail: "Engagement remains outside inventory capitalization scope.", tone: "emerald" },
    ],
    linkedAllocationId: demoAllocationReviewQueue.find((item) => item.transactionId === "txn_006")?.id,
  },
  txn_007: {
    transactionId: "txn_007",
    summary: "Manual excise tax accrual draft exists as a reviewer-prepared journal tied to prior-day retail sales.",
    sourceDetail: "Created manually by the controller from the retail tax worksheet and linked to the April revenue close checklist.",
    amountImpact: {
      debitLabel: "Retail Cannabis Sales (4010)",
      creditLabel: "Cannabis Excise Tax Payable (2210)",
      functionalArea: "Excise accrual",
      taxView: "Reclass entry preserves gross sales reporting while capturing excise payable before period lock.",
    },
    suggestedMappingReason: "Draft uses the standard excise accrual pattern and remains unposted until the paired revenue batch is approved.",
    relatedAccountCodes: ["4010", "2210", "1010"],
    supportingDocs: {
      required: true,
      received: true,
      items: ["Retail excise worksheet", "Daily sales recap", "Controller draft checklist"],
    },
    reviewerActions: [
      { label: "Approve draft", detail: "Release once the linked retail revenue batch is approved.", tone: "emerald" },
      { label: "Bundle with revenue entry", detail: "Keep this draft attached to the same posting package as txn_001.", tone: "violet" },
    ],
    approvalPath: [
      { label: "Imported", owner: "Manual prep", state: "completed", detail: "Drafted by controller from tax worksheet." },
      { label: "Needs review", owner: "Assistant Controller", state: "current", detail: "Awaiting revenue batch approval." },
      { label: "Approved", owner: "Controller", state: "upcoming", detail: "Approves in bundled post review." },
      { label: "Posted", owner: "Close automation", state: "upcoming", detail: "Posts with paired revenue batch." },
    ],
    auditTrail: [
      { at: "Apr 9, 7:58 AM", actor: "Controller", action: "Created draft", detail: "Prepared excise accrual based on prior-day sales.", tone: "violet" },
    ],
  },
  txn_008: {
    transactionId: "txn_008",
    summary: "Internal distribution transfer is ready to post but still benefits from SKU support review in the detail workspace.",
    sourceDetail: "Generated from wholesale transfer memo XFER-WH-1092 when finished gummies were moved from manufacturing to distribution inventory staging.",
    amountImpact: {
      debitLabel: "Inventory - Finished Goods (1125)",
      creditLabel: "Wholesale Product Transfers (4025)",
      functionalArea: "Distribution transfer",
      taxView: "Transfer remains inventory-supported and should include SKU support in the close binder.",
    },
    suggestedMappingReason: "Inventory movement and transfer memo tie directly to finished goods prepared for wholesale distribution.",
    relatedAccountCodes: ["1125", "4025", "5020"],
    supportingDocs: {
      required: true,
      received: true,
      items: ["Transfer memo", "SKU quantity detail", "Finished goods valuation report"],
    },
    reviewerActions: [
      { label: "Approve transfer", detail: "Posting path is clear after confirming SKU support is attached.", tone: "emerald" },
      { label: "Attach SKU recap", detail: "Preserve line-item detail in the close packet.", tone: "slate" },
    ],
    approvalPath: [
      { label: "Imported", owner: "Inventory event", state: "completed", detail: "Transfer record created from distribution handoff." },
      { label: "Needs review", owner: "Inventory Accountant", state: "completed", detail: "SKU valuation agrees to transfer memo." },
      { label: "Approved", owner: "Assistant Controller", state: "current", detail: "Ready for batch approval." },
      { label: "Posted", owner: "Close automation", state: "upcoming", detail: "Posts with transfer batch after approval." },
    ],
    auditTrail: [
      { at: "Apr 10, 10:15 AM", actor: "Inventory event", action: "Created transaction", detail: "Finished gummies transferred to wholesale staging.", tone: "slate" },
      { at: "Apr 10, 12:02 PM", actor: "Inventory Accountant", action: "Reviewed SKU detail", detail: "Transfer quantities and valuation matched support.", tone: "emerald" },
    ],
  },
};

export function getDemoTransactionDetail(id: string) {
  return transactionDetailMap[id];
}

export function listDemoTransactionDetails() {
  return demoTransactions
    .map((transaction) => ({ transaction, detail: transactionDetailMap[transaction.id] }))
    .filter((entry): entry is { transaction: DemoTransaction; detail: DemoTransactionDetail } => Boolean(entry.detail));
}

export function getRelatedAccounts(transaction: DemoTransaction) {
  const detail = getDemoTransactionDetail(transaction.id);
  const accountCodes = detail?.relatedAccountCodes ?? [transaction.suggestedDebitAccountCode, transaction.suggestedCreditAccountCode];

  return accountCodes
    .map((code) => demoChartOfAccounts.find((account) => account.code === code))
    .filter((account): account is NonNullable<typeof account> => Boolean(account));
}
