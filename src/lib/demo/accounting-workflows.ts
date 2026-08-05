export type DemoImportTargetField =
  | "date"
  | "postedDate"
  | "description"
  | "reference"
  | "amount"
  | "debit"
  | "credit"
  | "location"
  | "memo"
  | "ignore";

export type DemoImportAmountStrategy = "single_signed" | "split_debit_credit";
export type DemoImportRowStatus = "ready" | "warning" | "error";

export type DemoImportColumn = {
  key: string;
  label: string;
  suggestedTarget: DemoImportTargetField;
  required?: boolean;
  sampleValues: string[];
};

export type DemoImportProfile = {
  id: string;
  name: string;
  description: string;
  amountStrategy: DemoImportAmountStrategy;
  fieldMappings: Record<string, DemoImportTargetField>;
};

export type DemoImportRow = {
  id: string;
  values: Record<string, string>;
  sourceAccountName: string;
  suggestedDebitAccountCode: string;
  suggestedCreditAccountCode: string;
  confidence: number;
  status: DemoImportRowStatus;
  validationIssues: string[];
};

export type DemoImportDataset = {
  id: string;
  fileName: string;
  source: string;
  periodLabel: string;
  uploadedAt: string;
  delimiter: string;
  columns: DemoImportColumn[];
  rows: DemoImportRow[];
  profiles: DemoImportProfile[];
};

export type DemoCloseChecklistStatus = "todo" | "in_progress" | "done" | "blocked";
export type DemoCloseReviewStatus = "draft" | "ready_for_review" | "approved" | "locked";

export type DemoCloseChecklistItem = {
  id: string;
  title: string;
  owner: string;
  dueLabel: string;
  status: DemoCloseChecklistStatus;
  guidance: string;
  blocker?: string;
};

export type DemoCloseWorkflow = {
  periodLabel: string;
  reviewer: string;
  approver: string;
  reviewStatus: DemoCloseReviewStatus;
  reviewNotes: string[];
  checklist: DemoCloseChecklistItem[];
};

export const demoImportDatasets: DemoImportDataset[] = [
  {
    id: "svb-april-bank-demo",
    fileName: "silicon-valley-bank-april-demo.csv",
    source: "Silicon Valley Bank",
    periodLabel: "April 2026",
    uploadedAt: "2026-04-15 09:12 PT",
    delimiter: ",",
    columns: [
      {
        key: "booking_date",
        label: "Booking Date",
        suggestedTarget: "date",
        required: true,
        sampleValues: ["2026-04-03", "2026-04-08", "2026-04-10"],
      },
      {
        key: "post_date",
        label: "Post Date",
        suggestedTarget: "postedDate",
        sampleValues: ["2026-04-03", "2026-04-08", "2026-04-11"],
      },
      {
        key: "vendor_name",
        label: "Vendor Name",
        suggestedTarget: "description",
        required: true,
        sampleValues: ["Bay Alarm Company", "Calyx CPA Group", "Oakland Cash Logistics"],
      },
      {
        key: "bank_reference",
        label: "Bank Reference",
        suggestedTarget: "reference",
        required: true,
        sampleValues: ["SVB-7421-0403", "SVB-7421-0408", "SVB-7421-0410"],
      },
      {
        key: "signed_amount",
        label: "Signed Amount",
        suggestedTarget: "amount",
        required: true,
        sampleValues: ["-2185.00", "-4500.00", "12840.52"],
      },
      {
        key: "entity",
        label: "Entity / Location",
        suggestedTarget: "location",
        sampleValues: ["Oakland Flagship Retail", "Richmond Manufacturing Hub"],
      },
      {
        key: "bank_memo",
        label: "Memo",
        suggestedTarget: "memo",
        sampleValues: ["Security monitoring APR", "Monthly advisory retainer", "Armored deposit pickup"],
      },
    ],
    profiles: [
      {
        id: "profile-svb-signed-amount",
        name: "SVB bank activity",
        description: "Maps bank export columns into a single signed amount workflow.",
        amountStrategy: "single_signed",
        fieldMappings: {
          booking_date: "date",
          post_date: "postedDate",
          vendor_name: "description",
          bank_reference: "reference",
          signed_amount: "amount",
          entity: "location",
          bank_memo: "memo",
        },
      },
      {
        id: "profile-svb-description-only",
        name: "SVB fallback review",
        description: "Minimal mapping when the team wants to stage imports with fewer fields.",
        amountStrategy: "single_signed",
        fieldMappings: {
          booking_date: "date",
          post_date: "postedDate",
          vendor_name: "description",
          bank_reference: "reference",
          signed_amount: "amount",
          entity: "location",
          bank_memo: "ignore",
        },
      },
    ],
    rows: [
      {
        id: "import_row_1",
        values: {
          booking_date: "2026-04-03",
          post_date: "2026-04-03",
          vendor_name: "Bay Alarm Company",
          bank_reference: "SVB-7421-0403",
          signed_amount: "-2185.00",
          entity: "Oakland Flagship Retail",
          bank_memo: "Security monitoring APR",
        },
        sourceAccountName: "Operating Cash - Oakland",
        suggestedDebitAccountCode: "6310",
        suggestedCreditAccountCode: "1010",
        confidence: 0.94,
        status: "warning",
        validationIssues: ["Receipt image missing before posting", "280E classification should be reviewed before final approval"],
      },
      {
        id: "import_row_2",
        values: {
          booking_date: "2026-04-08",
          post_date: "2026-04-08",
          vendor_name: "Calyx CPA Group",
          bank_reference: "SVB-7421-0408",
          signed_amount: "-4500.00",
          entity: "Oakland Flagship Retail",
          bank_memo: "Monthly advisory retainer",
        },
        sourceAccountName: "Operating Cash - Oakland",
        suggestedDebitAccountCode: "6415",
        suggestedCreditAccountCode: "1010",
        confidence: 0.98,
        status: "ready",
        validationIssues: [],
      },
      {
        id: "import_row_3",
        values: {
          booking_date: "2026-04-10",
          post_date: "2026-04-11",
          vendor_name: "Oakland Cash Logistics",
          bank_reference: "SVB-7421-0410",
          signed_amount: "12840.52",
          entity: "Oakland Flagship Retail",
          bank_memo: "Armored deposit pickup",
        },
        sourceAccountName: "Operating Cash - Oakland",
        suggestedDebitAccountCode: "1010",
        suggestedCreditAccountCode: "4010",
        confidence: 0.89,
        status: "warning",
        validationIssues: ["Excise tax payable split required before posting retail deposit"],
      },
      {
        id: "import_row_4",
        values: {
          booking_date: "",
          post_date: "2026-04-12",
          vendor_name: "Unknown ACH Vendor",
          bank_reference: "SVB-7421-0412",
          signed_amount: "-960.00",
          entity: "Oakland Flagship Retail",
          bank_memo: "No vendor enrichment match",
        },
        sourceAccountName: "Operating Cash - Oakland",
        suggestedDebitAccountCode: "6999",
        suggestedCreditAccountCode: "1010",
        confidence: 0.31,
        status: "error",
        validationIssues: ["Transaction date missing", "Suggested account fell back to suspense review"],
      },
    ],
  },
  {
    id: "payroll-allocation-demo",
    fileName: "gusto-direct-labor-allocation-demo.csv",
    source: "Gusto Payroll",
    periodLabel: "April 2026",
    uploadedAt: "2026-04-14 17:40 PT",
    delimiter: ",",
    columns: [
      {
        key: "check_date",
        label: "Check Date",
        suggestedTarget: "date",
        required: true,
        sampleValues: ["2026-04-07", "2026-04-07"],
      },
      {
        key: "employee_group",
        label: "Employee Group",
        suggestedTarget: "description",
        required: true,
        sampleValues: ["Packaging Team", "Infusion Technicians"],
      },
      {
        key: "batch_reference",
        label: "Batch Ref",
        suggestedTarget: "reference",
        sampleValues: ["PAY-APR-WK1-A", "PAY-APR-WK1-B"],
      },
      {
        key: "debit_amount",
        label: "Debit",
        suggestedTarget: "debit",
        required: true,
        sampleValues: ["9620.44", "9000.00"],
      },
      {
        key: "credit_amount",
        label: "Credit",
        suggestedTarget: "credit",
        required: true,
        sampleValues: ["0.00", "0.00"],
      },
      {
        key: "memo_text",
        label: "Memo",
        suggestedTarget: "memo",
        sampleValues: ["Direct labor allocation", "Support labor under review"],
      },
    ],
    profiles: [
      {
        id: "profile-gusto-split",
        name: "Gusto direct labor split",
        description: "Uses explicit debit and credit columns for payroll allocation journals.",
        amountStrategy: "split_debit_credit",
        fieldMappings: {
          check_date: "date",
          employee_group: "description",
          batch_reference: "reference",
          debit_amount: "debit",
          credit_amount: "credit",
          memo_text: "memo",
        },
      },
    ],
    rows: [
      {
        id: "gusto_row_1",
        values: {
          check_date: "2026-04-07",
          employee_group: "Packaging Team",
          batch_reference: "PAY-APR-WK1-A",
          debit_amount: "9620.44",
          credit_amount: "0.00",
          memo_text: "Direct labor allocation",
        },
        sourceAccountName: "Payroll Clearing",
        suggestedDebitAccountCode: "5035",
        suggestedCreditAccountCode: "1010",
        confidence: 0.92,
        status: "ready",
        validationIssues: [],
      },
      {
        id: "gusto_row_2",
        values: {
          check_date: "2026-04-07",
          employee_group: "Support Labor",
          batch_reference: "PAY-APR-WK1-B",
          debit_amount: "9000.00",
          credit_amount: "0.00",
          memo_text: "Needs manager sign-off before capitalizing",
        },
        sourceAccountName: "Payroll Clearing",
        suggestedDebitAccountCode: "6110",
        suggestedCreditAccountCode: "1010",
        confidence: 0.63,
        status: "warning",
        validationIssues: ["Capitalizable vs retail support split still pending"],
      },
    ],
  },
];

export const demoCloseWorkflows: DemoCloseWorkflow[] = [
  {
    periodLabel: "February 2026",
    reviewer: "Assistant Controller",
    approver: "Controller",
    reviewStatus: "locked",
    reviewNotes: [
      "All bank recs tied out and support archived.",
      "280E workpapers exported with period lock package.",
    ],
    checklist: [
      {
        id: "feb-bank-rec",
        title: "Complete bank reconciliations",
        owner: "Staff Accountant",
        dueLabel: "Mar 3",
        status: "done",
        guidance: "Tie bank, armored cash, and undeposited funds to the ledger before review.",
      },
      {
        id: "feb-inventory",
        title: "Finalize inventory valuation",
        owner: "Cost Accountant",
        dueLabel: "Mar 4",
        status: "done",
        guidance: "Lock finished goods, packaging, and manufacturing roll-forward balances.",
      },
      {
        id: "feb-tax",
        title: "Approve excise tax payable",
        owner: "Controller",
        dueLabel: "Mar 5",
        status: "done",
        guidance: "Confirm retail tax accrual ties to reported sales and posted journals.",
      },
    ],
  },
  {
    periodLabel: "March 2026",
    reviewer: "Controller",
    approver: "CFO",
    reviewStatus: "ready_for_review",
    reviewNotes: [
      "Wholesale transfer accrual support attached, pending final COO confirmation.",
      "Payroll split draft updated after packaging supervisor review.",
    ],
    checklist: [
      {
        id: "mar-bank-rec",
        title: "Complete bank reconciliations",
        owner: "Staff Accountant",
        dueLabel: "Apr 4",
        status: "done",
        guidance: "Tie all operating accounts and cash clearing balances.",
      },
      {
        id: "mar-wholesale-accrual",
        title: "Review wholesale transfer accrual",
        owner: "Assistant Controller",
        dueLabel: "Apr 5",
        status: "blocked",
        guidance: "Confirm intercompany transfer support before revenue is finalized.",
        blocker: "COO has not approved transfer memo detail yet.",
      },
      {
        id: "mar-payroll-split",
        title: "Approve production payroll split",
        owner: "Cost Accountant",
        dueLabel: "Apr 5",
        status: "in_progress",
        guidance: "Separate direct labor from noncapitalizable support payroll.",
      },
      {
        id: "mar-review-package",
        title: "Prepare close review package",
        owner: "Controller",
        dueLabel: "Apr 6",
        status: "done",
        guidance: "Refresh flux analysis, checklist notes, and lock recommendation.",
      },
    ],
  },
  {
    periodLabel: "April 2026",
    reviewer: "Assistant Controller",
    approver: "Controller",
    reviewStatus: "draft",
    reviewNotes: [
      "Retail deposit on Apr 10 still needs excise tax split entry.",
      "Armored cash receipt image missing for Apr 4 deposit exception.",
    ],
    checklist: [
      {
        id: "apr-pos-imports",
        title: "Validate POS and bank imports",
        owner: "Staff Accountant",
        dueLabel: "May 2",
        status: "in_progress",
        guidance: "Confirm imported activity has account mappings and no suspense items remain.",
      },
      {
        id: "apr-receipts",
        title: "Collect missing support",
        owner: "Bookkeeper",
        dueLabel: "May 3",
        status: "blocked",
        guidance: "Attach receipts and armored cash evidence for flagged transactions.",
        blocker: "One April 4 armored receipt image still missing from the close folder.",
      },
      {
        id: "apr-excise-tax",
        title: "Post excise tax accrual",
        owner: "Controller",
        dueLabel: "May 4",
        status: "todo",
        guidance: "Reclass retail sales tax portion into cannabis excise tax payable.",
      },
      {
        id: "apr-inventory-rollforward",
        title: "Review inventory roll-forward",
        owner: "Cost Accountant",
        dueLabel: "May 5",
        status: "done",
        guidance: "Tie packaging inputs and finished goods balances to the production snapshot.",
      },
    ],
  },
  {
    periodLabel: "May 2026",
    reviewer: "Controller",
    approver: "CFO",
    reviewStatus: "draft",
    reviewNotes: ["Month is still open; checklist will progress as source systems land daily activity."],
    checklist: [
      {
        id: "may-open-period",
        title: "Open source imports",
        owner: "Staff Accountant",
        dueLabel: "Jun 2",
        status: "todo",
        guidance: "Begin staging POS, bank, inventory, and payroll feeds for the month.",
      },
      {
        id: "may-inventory-plan",
        title: "Schedule month-end inventory count",
        owner: "Operations Manager",
        dueLabel: "Jun 1",
        status: "todo",
        guidance: "Confirm counting team, blind count windows, and variance review timing.",
      },
    ],
  },
];
