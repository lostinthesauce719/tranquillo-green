import { v } from "convex/values";
import { authQuery } from "./lib/withAuth";

function sortByName<T extends { name: string }>(items: T[]) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

function sortByLabel<T extends { label: string }>(items: T[]) {
  return [...items].sort((a, b) => a.label.localeCompare(b.label));
}

export const getWorkspaceBySlug = authQuery(
  {
    slug: v.string(),
  },
  async (ctx: any, args: any, _identity: any) => {
    const company = await ctx.db
      .query("cannabisCompanies")
      .withIndex("by_slug", (q: any) => q.eq("slug", args.slug))
      .unique();

    if (!company) {
      return null;
    }

    const [locations, accounts, periods, counterparties, transactions, cashAccounts, reconciliations] = await Promise.all([
      ctx.db.query("cannabisLocations").withIndex("by_company", (q: any) => q.eq("companyId", company._id)).collect(),
      ctx.db.query("chartOfAccounts").withIndex("by_company", (q: any) => q.eq("companyId", company._id)).collect(),
      ctx.db.query("reportingPeriods").withIndex("by_company", (q: any) => q.eq("companyId", company._id)).collect(),
      ctx.db.query("counterparties").withIndex("by_company", (q: any) => q.eq("companyId", company._id)).collect(),
      ctx.db.query("transactions").withIndex("by_company", (q: any) => q.eq("companyId", company._id)).collect(),
      ctx.db.query("cashAccounts").withIndex("by_company", (q: any) => q.eq("companyId", company._id)).collect(),
      ctx.db.query("cashReconciliations").withIndex("by_company", (q: any) => q.eq("companyId", company._id)).collect(),
    ]);

    const locationsById = new Map<string, any>(locations.map((location: any) => [location._id, location]));
    const periodsById = new Map<string, any>(periods.map((period: any) => [period._id, period]));
    const counterpartiesById = new Map<string, any>(counterparties.map((counterparty: any) => [counterparty._id, counterparty]));
    const cashAccountsById = new Map<string, any>(cashAccounts.map((cashAccount: any) => [cashAccount._id, cashAccount]));

    // Batch-fetch ALL transaction lines for this company's transactions in one query
    // instead of N+1 per-transaction fetches
    const allTransactionIds = new Set(transactions.map((t: any) => t._id));
    const allTransactionLines: any[] = [];
    for (const txn of transactions) {
      const lines = await ctx.db
        .query("transactionLines")
        .withIndex("by_transaction", (q: any) => q.eq("transactionId", txn._id))
        .collect();
      allTransactionLines.push(...lines);
    }

    const transactionLinesByTransactionId = new Map<string, any[]>();
    for (const line of allTransactionLines) {
      if (allTransactionIds.has(line.transactionId)) {
        const existing = transactionLinesByTransactionId.get(line.transactionId) ?? [];
        existing.push(line);
        transactionLinesByTransactionId.set(line.transactionId, existing);
      }
    }

    const hydratedTransactions = transactions
      .map((transaction: any) => {
        const location = transaction.locationId ? locationsById.get(transaction.locationId) : undefined;
        const period = transaction.periodId ? periodsById.get(transaction.periodId) : undefined;
        const counterparty = transaction.counterpartyId ? counterpartiesById.get(transaction.counterpartyId) : undefined;

        return {
          ...transaction,
          publicId: transaction.externalRef ?? transaction._id,
          reference: transaction.reference ?? transaction.externalRef ?? transaction._id,
          locationName: location?.name,
          periodLabel: period?.label,
          counterpartyName: counterparty?.name,
          lines: transactionLinesByTransactionId.get(transaction._id) ?? [],
        };
      })
      .sort((a: any, b: any) => a.transactionDate.localeCompare(b.transactionDate) || a.reference.localeCompare(b.reference));

    const hydratedReconciliations = reconciliations
      .map((reconciliation: any) => {
        const cashAccount = cashAccountsById.get(reconciliation.cashAccountId);
        const location = reconciliation.locationId
          ? locationsById.get(reconciliation.locationId)
          : cashAccount?.locationId
            ? locationsById.get(cashAccount.locationId)
            : undefined;

        return {
          ...reconciliation,
          publicId: reconciliation.externalRef ?? reconciliation._id,
          accountName: cashAccount?.name ?? "Cash account",
          accountType: reconciliation.accountType ?? cashAccount?.type ?? "bank_clearing",
          locationName: location?.name,
          relatedTransactions: (reconciliation.relatedTransactionRefs ?? []).map((item: any) => ({
            transactionId: hydratedTransactions.find((transaction: any) => transaction.externalRef === item.transactionRef || transaction._id === item.transactionRef)?.publicId ?? item.transactionRef,
            label: item.label,
            amount: item.amount,
            note: item.note,
          })),
        };
      })
      .sort((a: any, b: any) => a.accountName.localeCompare(b.accountName));

    return {
      company,
      locations: sortByName(locations),
      chartOfAccounts: [...accounts].sort((a: any, b: any) => a.code.localeCompare(b.code)),
      reportingPeriods: sortByLabel(periods),
      transactions: hydratedTransactions,
      cashAccounts: sortByName(cashAccounts),
      cashReconciliations: hydratedReconciliations,
    };
  },
);
