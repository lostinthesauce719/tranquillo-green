/**
 * Chart of Accounts mapping between Tranquillo Green and QuickBooks.
 *
 * Tranquillo uses standard account codes (4-digit) with categories.
 * QuickBooks uses AccountType + AccountSubType for classification.
 *
 * This module provides bidirectional mapping for import/export.
 */

export type TranquilloCategory = "asset" | "liability" | "equity" | "revenue" | "cogs" | "opex";
export type TaxTreatment = "deductible" | "cogs" | "nondeductible";

export interface AccountMapping {
  tranquilloCode: string;
  tranquilloName: string;
  tranquilloCategory: TranquilloCategory;
  taxTreatment: TaxTreatment;
  qboAccountType: string;
  qboAccountSubType: string;
  qboName: string;
}

/** Standard cannabis 280E-aware chart of accounts → QuickBooks mapping */
export const STANDARD_MAPPINGS: AccountMapping[] = [
  // Assets
  { tranquilloCode: "1010", tranquilloName: "Cash — Operating", tranquilloCategory: "asset", taxTreatment: "deductible", qboAccountType: "Bank", qboAccountSubType: "Checking", qboName: "Cash — Operating" },
  { tranquilloCode: "1020", tranquilloName: "Cash — Vault", tranquilloCategory: "asset", taxTreatment: "deductible", qboAccountType: "Bank", qboAccountSubType: "CashOnHand", qboName: "Cash — Vault" },
  { tranquilloCode: "1100", tranquilloName: "Accounts Receivable", tranquilloCategory: "asset", taxTreatment: "deductible", qboAccountType: "Accounts Receivable", qboAccountSubType: "AccountsReceivable", qboName: "Accounts Receivable" },
  { tranquilloCode: "1200", tranquilloName: "Inventory — Cannabis", tranquilloCategory: "asset", taxTreatment: "cogs", qboAccountType: "Other Current Asset", qboAccountSubType: "Inventory", qboName: "Inventory — Cannabis" },
  { tranquilloCode: "1210", tranquilloName: "Inventory — Non-Cannabis", tranquilloCategory: "asset", taxTreatment: "deductible", qboAccountType: "Other Current Asset", qboAccountSubType: "Inventory", qboName: "Inventory — Non-Cannabis" },

  // Liabilities
  { tranquilloCode: "2010", tranquilloName: "Accounts Payable", tranquilloCategory: "liability", taxTreatment: "deductible", qboAccountType: "Accounts Payable", qboAccountSubType: "AccountsPayable", qboName: "Accounts Payable" },
  { tranquilloCode: "2100", tranquilloName: "Excise Tax Payable", tranquilloCategory: "liability", taxTreatment: "nondeductible", qboAccountType: "Other Current Liability", qboAccountSubType: "OtherCurrentLiabilities", qboName: "Excise Tax Payable" },
  { tranquilloCode: "2110", tranquilloName: "Sales Tax Payable", tranquilloCategory: "liability", taxTreatment: "nondeductible", qboAccountType: "Other Current Liability", qboAccountSubType: "OtherCurrentLiabilities", qboName: "Sales Tax Payable" },

  // Equity
  { tranquilloCode: "3010", tranquilloName: "Owner's Equity", tranquilloCategory: "equity", taxTreatment: "deductible", qboAccountType: "Equity", qboAccountSubType: "OwnersEquity", qboName: "Owner's Equity" },

  // Revenue
  { tranquilloCode: "4010", tranquilloName: "Cannabis Sales", tranquilloCategory: "revenue", taxTreatment: "deductible", qboAccountType: "Income", qboAccountSubType: "SalesOfProductIncome", qboName: "Cannabis Sales" },
  { tranquilloCode: "4020", tranquilloName: "Non-Cannabis Sales", tranquilloCategory: "revenue", taxTreatment: "deductible", qboAccountType: "Income", qboAccountSubType: "SalesOfProductIncome", qboName: "Non-Cannabis Sales" },

  // COGS (280E deductible)
  { tranquilloCode: "5010", tranquilloName: "Cost of Goods — Cultivation", tranquilloCategory: "cogs", taxTreatment: "cogs", qboAccountType: "Cost of Goods Sold", qboAccountSubType: "CostOfGoodsSold", qboName: "COGS — Cultivation" },
  { tranquilloCode: "5020", tranquilloName: "Cost of Goods — Manufacturing", tranquilloCategory: "cogs", taxTreatment: "cogs", qboAccountType: "Cost of Goods Sold", qboAccountSubType: "CostOfGoodsSold", qboName: "COGS — Manufacturing" },
  { tranquilloCode: "5030", tranquilloName: "Cost of Goods — Distribution", tranquilloCategory: "cogs", taxTreatment: "cogs", qboAccountType: "Cost of Goods Sold", qboAccountSubType: "CostOfGoodsSold", qboName: "COGS — Distribution" },
  { tranquilloCode: "5040", tranquilloName: "Cost of Goods — Retail", tranquilloCategory: "cogs", taxTreatment: "cogs", qboAccountType: "Cost of Goods Sold", qboAccountSubType: "CostOfGoodsSold", qboName: "COGS — Retail" },

  // OpEx (280E nondeductible)
  { tranquilloCode: "6010", tranquilloName: "Rent — Office", tranquilloCategory: "opex", taxTreatment: "nondeductible", qboAccountType: "Expense", qboAccountSubType: "RentOrLeaseOfBuildings", qboName: "Rent — Office" },
  { tranquilloCode: "6020", tranquilloName: "Wages — Admin", tranquilloCategory: "opex", taxTreatment: "nondeductible", qboAccountType: "Expense", qboAccountSubType: "WagesAndSalaries", qboName: "Wages — Admin" },
  { tranquilloCode: "6030", tranquilloName: "Marketing", tranquilloCategory: "opex", taxTreatment: "nondeductible", qboAccountType: "Expense", qboAccountSubType: "AdvertisingPromotional", qboName: "Marketing" },
  { tranquilloCode: "6040", tranquilloName: "Professional Fees", tranquilloCategory: "opex", taxTreatment: "deductible", qboAccountType: "Expense", qboAccountSubType: "LegalProfessionalFees", qboName: "Professional Fees" },
  { tranquilloCode: "6050", tranquilloName: "Depreciation", tranquilloCategory: "opex", taxTreatment: "nondeductible", qboAccountType: "Expense", qboAccountSubType: "Depreciation", qboName: "Depreciation" },
  { tranquilloCode: "6060", tranquilloName: "Insurance", tranquilloCategory: "opex", taxTreatment: "deductible", qboAccountType: "Expense", qboAccountSubType: "Insurance", qboName: "Insurance" },
];

/** Map a Tranquillo account code to its QuickBooks equivalent */
export function mapToQBO(code: string): AccountMapping | undefined {
  return STANDARD_MAPPINGS.find((m) => m.tranquilloCode === code);
}

/** Map a QuickBooks account name back to Tranquillo */
export function mapFromQBO(qboName: string): AccountMapping | undefined {
  return STANDARD_MAPPINGS.find((m) => m.qboName === qboName);
}

/** Generate default chart of accounts for a new QuickBooks company */
export function generateQBOChartOfAccounts(): Array<{ Name: string; AccountType: string; AccountSubType: string; Description: string }> {
  return STANDARD_MAPPINGS.map((m) => ({
    Name: m.qboName,
    AccountType: m.qboAccountType,
    AccountSubType: m.qboAccountSubType,
    Description: `[${m.tranquilloCode}] ${m.tranquilloName} — ${m.taxTreatment}`,
  }));
}
