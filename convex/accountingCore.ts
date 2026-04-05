import { queryGeneric } from "convex/server";
import { v } from "convex/values";

function sortByName<T extends { name: string }>(items: T[]) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

function sortByLabel<T extends { label: string }>(items: T[]) {
  return [...items].sort((a, b) => a.label.localeCompare(b.label));
}

export const getWorkspaceBySlug = queryGeneric({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const company = await ctx.db
      .query("cannabisCompanies")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!company) {
      return null;
    }

    const [locations, accounts, periods, counterparties, transactions, cashAccounts, reconciliations] = await Promise.all([
      ctx.db.query("cannabisLocations").withIndex("by_company", (q) => q.eq("companyId", company._id)).collect(),
      ctx.db.query("chartOfAccounts").withIndex("by_company", (q) => q.eq("companyId", company._id)).collect(),
      ctx.db.query("reportingPeriods").withIndex("by_company", (q) => q.eq("companyId", company._id)).collect(),
      ctx.db.query("counterparties").withIndex("by_company", (q) => q.eq("companyId", company._id)).collect(),
      ctx.db.query("transactions").withIndex("by_company", (q) => q.eq("companyId", company._id)).collect(),
      ctx.db.query("cashAccounts").withIndex("by_company", (q) => q.eq("companyId", company._id)).collect(),
      ctx.db.query("cashReconciliations").withIndex("by_company", (q) => q.eq("companyId", company._id)).collect(),
    ]);

    const locationsById = new Map(locations.map((location) => [location._id, location]));
    const periodsById = new Map(periods.map((period) => [period._id, period]));
    const counterpartiesById = new Map(counterparties.map((counterparty) => [counterparty._id, counterparty]));
    const cashAccountsById = new Map(cashAccounts.map((cashAccount) => [cashAccount._id, cashAccount]));

    const transactionLinesByTransactionId = new Map<string, any[]>();
    for (const transaction of transactions) {
      const transactionLines = await ctx.db
        .query("transactionLines")
        .withIndex("by_transaction", (q) => q.eq("transactionId", transaction._id))
        .collect();
      transactionLinesByTransactionId.set(transaction._id, transactionLines);
    }

    const hydratedTransactions = transactions
      .map((transaction) => {
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
      .sort((a, b) => a.transactionDate.localeCompare(b.transactionDate) || a.reference.localeCompare(b.reference));

    const hydratedReconciliations = reconciliations
      .map((reconciliation) => {
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
          relatedTransactions: (reconciliation.relatedTransactionRefs ?? []).map((item) => ({
            transactionId: hydratedTransactions.find((transaction) => transaction.externalRef === item.transactionRef || transaction._id === item.transactionRef)?.publicId ?? item.transactionRef,
            label: item.label,
            amount: item.amount,
            note: item.note,
          })),
        };
      })
      .sort((a, b) => a.accountName.localeCompare(b.accountName));

    return {
      company,
      locations: sortByName(locations),
      chartOfAccounts: [...accounts].sort((a, b) => a.code.localeCompare(b.code)),
      reportingPeriods: sortByLabel(periods),
      transactions: hydratedTransactions,
      cashAccounts: sortByName(cashAccounts),
      cashReconciliations: hydratedReconciliations,
    };
  },
});
