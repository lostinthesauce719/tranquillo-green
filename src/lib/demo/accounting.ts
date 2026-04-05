export type OperatorType = "dispensary" | "cultivator" | "manufacturer" | "distributor" | "vertical";
export type AccountingMethod = "cash" | "accrual";
export type CompanyStatus = "onboarding" | "active" | "inactive";
export type AccountCategory = "asset" | "liability" | "equity" | "revenue" | "cogs" | "opex";
export type TaxTreatment = "deductible" | "cogs" | "nondeductible";
export type ReportingPeriodStatus = "open" | "review" | "closed";
export type TransactionSource = "pos" | "bank" | "bill" | "payroll" | "inventory" | "manual";
export type TransactionStatus = "unposted" | "in_review" | "ready_to_post" | "posted";
export type TransactionReviewState = "ready" | "needs_mapping" | "drafted" | "posted";
export type TransactionDirection = "inflow" | "outflow";
export type CannabisActivity = "retail" | "manufacturing" | "distribution" | "admin";

export type DemoCompany = {
  name: string;
  slug: string;
  timezone: string;
  state: string;
  operatorType: OperatorType;
  defaultAccountingMethod: AccountingMethod;
  status: CompanyStatus;
};

export type DemoLocation = {
  name: string;
  licenseNumber: string;
  state: string;
  city: string;
  isPrimary: boolean;
  squareFootage?: number;
};

export type DemoLicense = {
  locationName?: string;
  licenseType: string;
  state: string;
  licenseNumber: string;
  status: "active" | "pending" | "expired";
  issuedAt?: number;
  expiresAt?: number;
};

export type DemoChartOfAccount = {
  code: string;
  name: string;
  category: AccountCategory;
  subcategory?: string;
  isActive: boolean;
  taxTreatment: TaxTreatment;
  description: string;
};

export type DemoReportingPeriod = {
  label: string;
  startDate: string;
  endDate: string;
  status: ReportingPeriodStatus;
  closeOwner: string;
  closeWindowDays: number;
  lockedAt?: string;
  taskSummary: {
    completed: number;
    total: number;
  };
  blockers: string[];
  highlights: string[];
};

export type DemoTransaction = {
  id: string;
  date: string;
  postedDate: string;
  periodLabel: string;
  source: TransactionSource;
  status: TransactionStatus;
  reviewState: TransactionReviewState;
  location: string;
  reference: string;
  payee: string;
  description: string;
  amount: number;
  direction: TransactionDirection;
  activity: CannabisActivity;
  suggestedDebitAccountCode: string;
  suggestedCreditAccountCode: string;
  journalHint: string;
  readyForManualEntry: boolean;
  needsReceipt: boolean;
};

export const californiaOperatorDemo = {
  company: {
    name: "Golden State Greens, LLC",
    slug: "golden-state-greens",
    timezone: "America/Los_Angeles",
    state: "CA",
    operatorType: "vertical",
    defaultAccountingMethod: "accrual",
    status: "active",
  } satisfies DemoCompany,
  locations: [
    {
      name: "Oakland Flagship Retail",
      licenseNumber: "C10-0001845-LIC",
      state: "CA",
      city: "Oakland",
      isPrimary: true,
      squareFootage: 4200,
    },
    {
      name: "Richmond Manufacturing Hub",
      licenseNumber: "CDPH-10002711",
      state: "CA",
      city: "Richmond",
      isPrimary: false,
      squareFootage: 11800,
    },
  ] satisfies DemoLocation[],
  licenses: [
    {
      locationName: "Oakland Flagship Retail",
      licenseType: "Storefront Retailer",
      state: "CA",
      licenseNumber: "C10-0001845-LIC",
      status: "active",
      issuedAt: Date.parse("2025-07-01"),
      expiresAt: Date.parse("2026-06-30"),
    },
    {
      locationName: "Richmond Manufacturing Hub",
      licenseType: "Type N Infusion Manufacturing",
      state: "CA",
      licenseNumber: "CDPH-10002711",
      status: "active",
      issuedAt: Date.parse("2025-02-15"),
      expiresAt: Date.parse("2026-02-14"),
    },
    {
      locationName: "Richmond Manufacturing Hub",
      licenseType: "Distribution",
      state: "CA",
      licenseNumber: "C11-0009822-LIC",
      status: "active",
      issuedAt: Date.parse("2025-03-01"),
      expiresAt: Date.parse("2026-02-28"),
    },
  ] satisfies DemoLicense[],
  reportingPeriod: {
    label: "April 2026",
    startDate: "2026-04-01",
    endDate: "2026-04-30",
    status: "open",
    closeOwner: "Controller",
    closeWindowDays: 7,
    taskSummary: {
      completed: 5,
      total: 11,
    },
    blockers: ["Pending armored cash receipt image for April 4 deposit"],
    highlights: ["POS batches imported daily", "COGS roll-forward in sync with inventory snapshot"],
  } satisfies DemoReportingPeriod,
  chartOfAccounts: [
    {
      code: "1010",
      name: "Operating Cash - Oakland",
      category: "asset",
      subcategory: "Cash",
      isActive: true,
      taxTreatment: "deductible",
      description: "Primary operating cash and armored deposit clearing for the flagship dispensary.",
    },
    {
      code: "1125",
      name: "Inventory - Finished Goods",
      category: "asset",
      subcategory: "Inventory",
      isActive: true,
      taxTreatment: "cogs",
      description: "Sellable cannabis inventory awaiting retail sale or wholesale transfer.",
    },
    {
      code: "1135",
      name: "Inventory - Packaging Inputs",
      category: "asset",
      subcategory: "Inventory",
      isActive: true,
      taxTreatment: "cogs",
      description: "Packaging, labels, and compliant containers attributable to production runs.",
    },
    {
      code: "1210",
      name: "Prepaids and Deposits",
      category: "asset",
      subcategory: "Prepaid Expenses",
      isActive: true,
      taxTreatment: "deductible",
      description: "Insurance, software retainers, and facility deposits amortized over time.",
    },
    {
      code: "1510",
      name: "Extraction Equipment",
      category: "asset",
      subcategory: "Fixed Assets",
      isActive: true,
      taxTreatment: "cogs",
      description: "Manufacturing equipment used in infusion and post-harvest processes.",
    },
    {
      code: "2010",
      name: "Accounts Payable",
      category: "liability",
      subcategory: "Current Liabilities",
      isActive: true,
      taxTreatment: "deductible",
      description: "Trade payables owed to packaging, security, and compliance vendors.",
    },
    {
      code: "2210",
      name: "Cannabis Excise Tax Payable",
      category: "liability",
      subcategory: "Tax Liabilities",
      isActive: true,
      taxTreatment: "nondeductible",
      description: "California cannabis excise tax liability due on retail transactions.",
    },
    {
      code: "3010",
      name: "Members' Equity",
      category: "equity",
      subcategory: "Equity",
      isActive: true,
      taxTreatment: "deductible",
      description: "Owner capital contributions and retained operating basis.",
    },
    {
      code: "4010",
      name: "Retail Cannabis Sales",
      category: "revenue",
      subcategory: "Retail Revenue",
      isActive: true,
      taxTreatment: "nondeductible",
      description: "In-store cannabis sales before discounts and returns.",
    },
    {
      code: "4025",
      name: "Wholesale Product Transfers",
      category: "revenue",
      subcategory: "Wholesale Revenue",
      isActive: true,
      taxTreatment: "nondeductible",
      description: "Intercompany or third-party distribution revenue from finished inventory.",
    },
    {
      code: "5010",
      name: "Cost of Goods Sold - Flower",
      category: "cogs",
      subcategory: "Direct Materials",
      isActive: true,
      taxTreatment: "cogs",
      description: "Direct product cost assigned to flower and pre-roll sales.",
    },
    {
      code: "5020",
      name: "Cost of Goods Sold - Manufactured Goods",
      category: "cogs",
      subcategory: "Direct Materials",
      isActive: true,
      taxTreatment: "cogs",
      description: "Direct product cost assigned to vape, edible, and infusion units.",
    },
    {
      code: "5035",
      name: "Production Labor Absorption",
      category: "cogs",
      subcategory: "Direct Labor",
      isActive: true,
      taxTreatment: "cogs",
      description: "Capitalizable payroll allocated to manufacturing and packaging activity.",
    },
    {
      code: "6110",
      name: "Payroll - Retail Staff",
      category: "opex",
      subcategory: "Payroll",
      isActive: true,
      taxTreatment: "nondeductible",
      description: "Budtender, manager, and front-of-house payroll subject to 280E limitation.",
    },
    {
      code: "6210",
      name: "Marketing and Promotions",
      category: "opex",
      subcategory: "Sales & Marketing",
      isActive: true,
      taxTreatment: "nondeductible",
      description: "Digital campaigns, events, and patient loyalty promotions.",
    },
    {
      code: "6310",
      name: "Security Services",
      category: "opex",
      subcategory: "Occupancy & Security",
      isActive: true,
      taxTreatment: "nondeductible",
      description: "Guard staffing, camera monitoring, and mandated security compliance.",
    },
    {
      code: "6415",
      name: "Professional Fees",
      category: "opex",
      subcategory: "Professional Services",
      isActive: true,
      taxTreatment: "deductible",
      description: "Accounting, legal, and tax advisory work not directly tied to inventory.",
    },
    {
      code: "6999",
      name: "Suspense - Classification Review",
      category: "opex",
      subcategory: "Close Process",
      isActive: false,
      taxTreatment: "nondeductible",
      description: "Temporary bucket for imported transactions that require mapping review.",
    },
  ] satisfies DemoChartOfAccount[],
};

export const demoChartOfAccounts = californiaOperatorDemo.chartOfAccounts;

export const demoReportingPeriods: DemoReportingPeriod[] = [
  {
    label: "February 2026",
    startDate: "2026-02-01",
    endDate: "2026-02-28",
    status: "closed",
    closeOwner: "Controller",
    closeWindowDays: 5,
    lockedAt: "2026-03-06",
    taskSummary: { completed: 10, total: 10 },
    blockers: [],
    highlights: ["Bank recs tied out", "Inventory valuation locked", "280E support exported for tax workpapers"],
  },
  {
    label: "March 2026",
    startDate: "2026-03-01",
    endDate: "2026-03-31",
    status: "review",
    closeOwner: "Assistant Controller",
    closeWindowDays: 6,
    taskSummary: { completed: 9, total: 11 },
    blockers: ["Wholesale transfer accrual pending COO approval", "One payroll allocation line needs manufacturing split review"],
    highlights: ["Excise tax roll-forward prepared", "All retail cash batches matched to armored receipts"],
  },
  californiaOperatorDemo.reportingPeriod,
  {
    label: "May 2026",
    startDate: "2026-05-01",
    endDate: "2026-05-31",
    status: "open",
    closeOwner: "Staff Accountant",
    closeWindowDays: 7,
    taskSummary: { completed: 1, total: 11 },
    blockers: ["Period not started; bank feed loads begin on May 2"],
    highlights: ["Inventory count scheduled for month-end"],
  },
];

export const demoTransactions: DemoTransaction[] = [
  {
    id: "txn_001",
    date: "2026-04-02",
    postedDate: "2026-04-02",
    periodLabel: "April 2026",
    source: "pos",
    status: "ready_to_post",
    reviewState: "ready",
    location: "Oakland Flagship Retail",
    reference: "POS-BATCH-0402-AM",
    payee: "Treez POS",
    description: "Morning retail sales batch, flower and pre-roll mix",
    amount: 12840.52,
    direction: "inflow",
    activity: "retail",
    suggestedDebitAccountCode: "1010",
    suggestedCreditAccountCode: "4010",
    journalHint: "Book sales net to operating cash and split excise tax liability in final journal.",
    readyForManualEntry: true,
    needsReceipt: false,
  },
  {
    id: "txn_002",
    date: "2026-04-03",
    postedDate: "2026-04-03",
    periodLabel: "April 2026",
    source: "bank",
    status: "in_review",
    reviewState: "needs_mapping",
    location: "Oakland Flagship Retail",
    reference: "SVB-7421-0403",
    payee: "Bay Alarm Company",
    description: "Monthly monitoring and armed response invoice draft",
    amount: 2185,
    direction: "outflow",
    activity: "admin",
    suggestedDebitAccountCode: "6310",
    suggestedCreditAccountCode: "1010",
    journalHint: "Security cost is 280E limited unless allocated into production support.",
    readyForManualEntry: true,
    needsReceipt: true,
  },
  {
    id: "txn_003",
    date: "2026-04-04",
    postedDate: "2026-04-04",
    periodLabel: "April 2026",
    source: "inventory",
    status: "unposted",
    reviewState: "drafted",
    location: "Richmond Manufacturing Hub",
    reference: "MFG-RUN-8841",
    payee: "Production close",
    description: "Packaging inputs issued to vape cartridge run",
    amount: 3640.75,
    direction: "outflow",
    activity: "manufacturing",
    suggestedDebitAccountCode: "5020",
    suggestedCreditAccountCode: "1135",
    journalHint: "Move packaging materials from inventory to manufactured goods COGS bucket after review.",
    readyForManualEntry: true,
    needsReceipt: false,
  },
  {
    id: "txn_004",
    date: "2026-04-05",
    postedDate: "2026-04-05",
    periodLabel: "April 2026",
    source: "bill",
    status: "posted",
    reviewState: "posted",
    location: "Richmond Manufacturing Hub",
    reference: "BILL-PKG-4420",
    payee: "Pacific Packaging Labs",
    description: "Compliant pouch and label vendor bill",
    amount: 7425,
    direction: "outflow",
    activity: "manufacturing",
    suggestedDebitAccountCode: "1135",
    suggestedCreditAccountCode: "2010",
    journalHint: "Capitalize packaging as inventory input until issued to a production run.",
    readyForManualEntry: false,
    needsReceipt: false,
  },
  {
    id: "txn_005",
    date: "2026-04-07",
    postedDate: "2026-04-07",
    periodLabel: "April 2026",
    source: "payroll",
    status: "in_review",
    reviewState: "needs_mapping",
    location: "Richmond Manufacturing Hub",
    reference: "PAY-APR-WK1",
    payee: "Gusto Payroll",
    description: "Week 1 payroll clearing for packaging and infusion team",
    amount: 18620.44,
    direction: "outflow",
    activity: "manufacturing",
    suggestedDebitAccountCode: "5035",
    suggestedCreditAccountCode: "1010",
    journalHint: "Split direct labor vs noncapitalizable support payroll before posting.",
    readyForManualEntry: true,
    needsReceipt: false,
  },
  {
    id: "txn_006",
    date: "2026-04-08",
    postedDate: "2026-04-08",
    periodLabel: "April 2026",
    source: "bank",
    status: "ready_to_post",
    reviewState: "ready",
    location: "Oakland Flagship Retail",
    reference: "SVB-7421-0408",
    payee: "Calyx CPA Group",
    description: "Monthly accounting advisory retainer",
    amount: 4500,
    direction: "outflow",
    activity: "admin",
    suggestedDebitAccountCode: "6415",
    suggestedCreditAccountCode: "1010",
    journalHint: "Professional fees remain deductible and support monthly close review.",
    readyForManualEntry: true,
    needsReceipt: true,
  },
  {
    id: "txn_007",
    date: "2026-04-09",
    postedDate: "2026-04-09",
    periodLabel: "April 2026",
    source: "manual",
    status: "unposted",
    reviewState: "drafted",
    location: "Oakland Flagship Retail",
    reference: "JE-DRAFT-0007",
    payee: "Controller",
    description: "Excise tax accrual on prior-day retail sales",
    amount: 1311.28,
    direction: "outflow",
    activity: "retail",
    suggestedDebitAccountCode: "4010",
    suggestedCreditAccountCode: "2210",
    journalHint: "Reclass sales tax portion from gross sales to payable before lock.",
    readyForManualEntry: true,
    needsReceipt: false,
  },
  {
    id: "txn_008",
    date: "2026-04-10",
    postedDate: "2026-04-10",
    periodLabel: "April 2026",
    source: "inventory",
    status: "ready_to_post",
    reviewState: "ready",
    location: "Richmond Manufacturing Hub",
    reference: "XFER-WH-1092",
    payee: "Internal distribution",
    description: "Finished gummies transferred to wholesale inventory bucket",
    amount: 5820,
    direction: "inflow",
    activity: "distribution",
    suggestedDebitAccountCode: "1125",
    suggestedCreditAccountCode: "4025",
    journalHint: "Use manual entry when transfer memo needs supporting SKU detail.",
    readyForManualEntry: true,
    needsReceipt: false,
  },
];

export function summarizeDemoChartOfAccounts(accounts: DemoChartOfAccount[]) {
  const activeAccounts = accounts.filter((account) => account.isActive);
  const inactiveAccounts = accounts.length - activeAccounts.length;
  const cogsAccounts = accounts.filter((account) => account.taxTreatment === "cogs").length;
  const nondeductibleAccounts = accounts.filter((account) => account.taxTreatment === "nondeductible").length;

  return {
    total: accounts.length,
    active: activeAccounts.length,
    inactive: inactiveAccounts,
    cogsAccounts,
    nondeductibleAccounts,
  };
}

export function summarizeDemoReportingPeriods(periods: DemoReportingPeriod[]) {
  const closed = periods.filter((period) => period.status === "closed").length;
  const review = periods.filter((period) => period.status === "review").length;
  const open = periods.filter((period) => period.status === "open").length;
  const blocked = periods.filter((period) => period.blockers.length > 0).length;

  return {
    total: periods.length,
    closed,
    review,
    open,
    blocked,
  };
}

export function summarizeDemoTransactions(transactions: DemoTransaction[]) {
  const ready = transactions.filter((transaction) => transaction.reviewState === "ready").length;
  const needsMapping = transactions.filter((transaction) => transaction.reviewState === "needs_mapping").length;
  const drafted = transactions.filter((transaction) => transaction.reviewState === "drafted").length;
  const posted = transactions.filter((transaction) => transaction.reviewState === "posted").length;
  const manualQueue = transactions.filter((transaction) => transaction.readyForManualEntry && transaction.status !== "posted");
  const totalValue = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);

  return {
    total: transactions.length,
    ready,
    needsMapping,
    drafted,
    posted,
    manualQueue: manualQueue.length,
    totalValue,
  };
}
