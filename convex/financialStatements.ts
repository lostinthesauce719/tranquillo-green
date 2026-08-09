import { authQuery, requireCompanyAccessById } from "./lib/withAuth";
import { v } from "convex/values";

/**
 * Financial statements computed from posted transactions and their lines.
 *
 * Normal balances: assets, COGS, and operating expenses are debit-normal;
 * liabilities, equity, and revenue are credit-normal. Account balances are
 * signed so that a positive number always means "normal balance."
 */

type AccountBalance = {
  accountId: string;
  code: string;
  name: string;
  category: "asset" | "liability" | "equity" | "revenue" | "cogs" | "opex";
  subcategory?: string;
  taxTreatment?: string;
  debit: number;
  credit: number;
  balance: number; // signed to the account's normal balance
};

const DEBIT_NORMAL = new Set(["asset", "cogs", "opex"]);

function isWithin(date: string, startDate?: string, endDate?: string): boolean {
  if (startDate && date < startDate) return false;
  if (endDate && date > endDate) return false;
  return true;
}

/**
 * Aggregates posted transaction lines into per-account balances.
 * Only transactions with status "posted" contribute to the books.
 */
async function collectBalances(
  ctx: any,
  companyId: string,
  startDate?: string,
  endDate?: string,
): Promise<{ balances: AccountBalance[]; postedCount: number; unpostedCount: number }> {
  const [accounts, transactions] = await Promise.all([
    ctx.db
      .query("chartOfAccounts")
      .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
      .collect(),
    ctx.db
      .query("transactions")
      .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
      .collect(),
  ]);

  const byAccount = new Map<string, AccountBalance>();
  for (const account of accounts) {
    byAccount.set(account._id, {
      accountId: account._id,
      code: account.code,
      name: account.name,
      category: account.category,
      subcategory: account.subcategory,
      taxTreatment: account.taxTreatment,
      debit: 0,
      credit: 0,
      balance: 0,
    });
  }

  const inRange = transactions.filter((t: any) => isWithin(t.transactionDate, startDate, endDate));
  const posted = inRange.filter((t: any) => t.status === "posted");

  for (const transaction of posted) {
    const lines = await ctx.db
      .query("transactionLines")
      .withIndex("by_transaction", (q: any) => q.eq("transactionId", transaction._id))
      .collect();

    for (const line of lines) {
      const entry = byAccount.get(line.accountId);
      if (!entry) continue;
      entry.debit += line.debit ?? 0;
      entry.credit += line.credit ?? 0;
    }
  }

  for (const entry of Array.from(byAccount.values())) {
    entry.balance = DEBIT_NORMAL.has(entry.category)
      ? entry.debit - entry.credit
      : entry.credit - entry.debit;
  }

  return {
    balances: Array.from(byAccount.values()).sort((a, b) => a.code.localeCompare(b.code)),
    postedCount: posted.length,
    unpostedCount: inRange.length - posted.length,
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  asset: "Assets",
  liability: "Liabilities",
  equity: "Equity",
  revenue: "Revenue",
  cogs: "Cost of Goods Sold",
  opex: "Operating Expenses",
};

export const getTrialBalance = authQuery({
  args: {
    companyId: v.id("cannabisCompanies"),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args, identity) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);
    const { balances, postedCount, unpostedCount } = await collectBalances(
      ctx,
      args.companyId,
      args.startDate,
      args.endDate,
    );

    const active = balances.filter((b) => b.debit !== 0 || b.credit !== 0);
    const order = ["asset", "liability", "equity", "revenue", "cogs", "opex"];
    const groups = order
      .map((category) => ({
        category: CATEGORY_LABELS[category],
        accounts: active
          .filter((b) => b.category === category)
          .map((b) => ({ code: b.code, name: b.name, debit: b.debit, credit: b.credit })),
      }))
      .filter((group) => group.accounts.length > 0);

    const totalDebits = active.reduce((sum, b) => sum + b.debit, 0);
    const totalCredits = active.reduce((sum, b) => sum + b.credit, 0);

    return {
      groups,
      totalDebits,
      totalCredits,
      balanced: Math.abs(totalDebits - totalCredits) < 0.01,
      postedCount,
      unpostedCount,
      accountsWithActivity: active.length,
    };
  },
});

export const getIncomeStatement = authQuery({
  args: {
    companyId: v.id("cannabisCompanies"),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args, identity) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);
    const { balances, postedCount, unpostedCount } = await collectBalances(
      ctx,
      args.companyId,
      args.startDate,
      args.endDate,
    );

    const lineFor = (category: string) =>
      balances
        .filter((b) => b.category === category && b.balance !== 0)
        .map((b) => ({
          code: b.code,
          name: b.name,
          amount: b.balance,
          taxTreatment: b.taxTreatment,
        }));

    const revenue = lineFor("revenue");
    const cogs = lineFor("cogs");
    const opex = lineFor("opex");

    const totalRevenue = revenue.reduce((s, l) => s + l.amount, 0);
    const totalCogs = cogs.reduce((s, l) => s + l.amount, 0);
    const totalOpex = opex.reduce((s, l) => s + l.amount, 0);
    const grossProfit = totalRevenue - totalCogs;
    const netIncome = grossProfit - totalOpex;

    // 280E view: only COGS reduces taxable income; operating expenses coded
    // nondeductible are added back.
    const nondeductibleOpex = opex
      .filter((l) => l.taxTreatment === "nondeductible")
      .reduce((s, l) => s + l.amount, 0);
    const deductibleOpex = totalOpex - nondeductibleOpex;
    const taxableIncome280e = grossProfit - deductibleOpex;

    return {
      revenue,
      cogs,
      opex,
      totalRevenue,
      totalCogs,
      totalOpex,
      grossProfit,
      grossMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
      netIncome,
      netMargin: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0,
      nondeductibleOpex,
      deductibleOpex,
      taxableIncome280e,
      estimatedFederalTax: Math.max(0, taxableIncome280e) * 0.21,
      postedCount,
      unpostedCount,
    };
  },
});

export const getBalanceSheet = authQuery({
  args: {
    companyId: v.id("cannabisCompanies"),
    asOfDate: v.optional(v.string()),
  },
  handler: async (ctx, args, identity) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);
    const { balances, postedCount, unpostedCount } = await collectBalances(
      ctx,
      args.companyId,
      undefined,
      args.asOfDate,
    );

    const lineFor = (category: string) =>
      balances
        .filter((b) => b.category === category && b.balance !== 0)
        .map((b) => ({ code: b.code, name: b.name, subcategory: b.subcategory, amount: b.balance }));

    const assets = lineFor("asset");
    const liabilities = lineFor("liability");
    const equityAccounts = lineFor("equity");

    const totalAssets = assets.reduce((s, l) => s + l.amount, 0);
    const totalLiabilities = liabilities.reduce((s, l) => s + l.amount, 0);
    const contributedEquity = equityAccounts.reduce((s, l) => s + l.amount, 0);

    // Retained earnings are derived: revenue less COGS and operating expenses
    // through the as-of date, since period close does not post a closing entry.
    const totalRevenue = balances
      .filter((b) => b.category === "revenue")
      .reduce((s, b) => s + b.balance, 0);
    const totalExpenses = balances
      .filter((b) => b.category === "cogs" || b.category === "opex")
      .reduce((s, b) => s + b.balance, 0);
    const retainedEarnings = totalRevenue - totalExpenses;

    const totalEquity = contributedEquity + retainedEarnings;

    return {
      assets,
      liabilities,
      equityAccounts,
      totalAssets,
      totalLiabilities,
      contributedEquity,
      retainedEarnings,
      totalEquity,
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
      postedCount,
      unpostedCount,
    };
  },
});
