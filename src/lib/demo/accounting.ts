export type OperatorType = "dispensary" | "cultivator" | "manufacturer" | "distributor" | "vertical";
export type AccountingMethod = "cash" | "accrual";
export type CompanyStatus = "onboarding" | "active" | "inactive";
export type AccountCategory = "asset" | "liability" | "equity" | "revenue" | "cogs" | "opex";
export type TaxTreatment = "deductible" | "cogs" | "nondeductible";
export type ReportingPeriodStatus = "open" | "review" | "closed";

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
