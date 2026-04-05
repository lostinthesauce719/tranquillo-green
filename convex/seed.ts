import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { californiaOperatorDemo, demoReportingPeriods, demoTransactions } from "../src/lib/demo/accounting";
import { demoCashReconciliations } from "../src/lib/demo/accounting-operations";

function transactionSourceFromDemo(source: (typeof demoTransactions)[number]["source"]) {
  switch (source) {
    case "pos":
      return "pos_import" as const;
    case "manual":
      return "manual" as const;
    case "inventory":
      return "system" as const;
    case "bank":
    case "bill":
    case "payroll":
      return "csv_import" as const;
  }
}

function transactionStatusFromDemo(status: (typeof demoTransactions)[number]["status"]) {
  switch (status) {
    case "posted":
      return "posted" as const;
    case "in_review":
      return "needs_review" as const;
    case "ready_to_post":
    case "unposted":
      return "draft" as const;
  }
}

function reconciliationStatusFromDemo(status: (typeof demoCashReconciliations)[number]["status"]) {
  switch (status) {
    case "balanced":
      return "resolved" as const;
    case "ready_to_post":
      return "open" as const;
    case "investigating":
    case "exception":
      return "investigating" as const;
  }
}

export const previewCaliforniaOperator = queryGeneric({
  args: {},
  handler: async () => ({
    company: californiaOperatorDemo.company,
    locations: californiaOperatorDemo.locations,
    licenses: californiaOperatorDemo.licenses,
    chartOfAccounts: californiaOperatorDemo.chartOfAccounts,
    reportingPeriods: demoReportingPeriods,
    transactions: demoTransactions,
    cashReconciliations: demoCashReconciliations,
  }),
});

export const seedCaliforniaOperator = mutationGeneric({
  args: {
    slug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const slug = args.slug ?? californiaOperatorDemo.company.slug;
    const existingCompany = await ctx.db
      .query("cannabisCompanies")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    const companyId =
      existingCompany?._id ??
      (await ctx.db.insert("cannabisCompanies", {
        ...californiaOperatorDemo.company,
        slug,
      }));

    const locationIdsByName = new Map<string, any>();
    const existingLocations = await ctx.db
      .query("cannabisLocations")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();

    for (const location of californiaOperatorDemo.locations) {
      const existingLocation = existingLocations.find((record) => record.name === location.name);
      const locationId =
        existingLocation?._id ??
        (await ctx.db.insert("cannabisLocations", {
          companyId,
          ...location,
        }));

      if (existingLocation) {
        await ctx.db.patch(existingLocation._id, location);
      }

      locationIdsByName.set(location.name, locationId);
    }

    const existingLicenses = await ctx.db
      .query("cannabisLicenses")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();

    for (const license of californiaOperatorDemo.licenses) {
      const existingLicense = existingLicenses.find((record) => record.licenseNumber === license.licenseNumber);
      const payload = {
        companyId,
        locationId: license.locationName ? locationIdsByName.get(license.locationName) : undefined,
        licenseType: license.licenseType,
        state: license.state,
        licenseNumber: license.licenseNumber,
        status: license.status,
        issuedAt: license.issuedAt,
        expiresAt: license.expiresAt,
      };

      if (existingLicense) {
        await ctx.db.patch(existingLicense._id, payload);
      } else {
        await ctx.db.insert("cannabisLicenses", payload);
      }
    }

    const existingAccounts = await ctx.db
      .query("chartOfAccounts")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();
    const accountIdsByCode = new Map<string, any>();

    for (const account of californiaOperatorDemo.chartOfAccounts) {
      const existingAccount = existingAccounts.find((record) => record.code === account.code);
      const payload = {
        companyId,
        code: account.code,
        name: account.name,
        category: account.category,
        subcategory: account.subcategory,
        isActive: account.isActive,
        taxTreatment: account.taxTreatment,
        description: account.description,
      };

      const accountId = existingAccount?._id ?? (await ctx.db.insert("chartOfAccounts", payload));
      if (existingAccount) {
        await ctx.db.patch(existingAccount._id, payload);
      }
      accountIdsByCode.set(account.code, accountId);
    }

    const existingPeriods = await ctx.db
      .query("reportingPeriods")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();
    const reportingPeriodIdsByLabel = new Map<string, any>();

    for (const period of demoReportingPeriods) {
      const existingPeriod = existingPeriods.find((record) => record.label === period.label);
      const payload = {
        companyId,
        label: period.label,
        startDate: period.startDate,
        endDate: period.endDate,
        status: period.status,
        closeOwner: period.closeOwner,
        closeWindowDays: period.closeWindowDays,
        lockedAt: period.lockedAt,
        taskSummary: period.taskSummary,
        blockers: period.blockers,
        highlights: period.highlights,
      };

      const periodId = existingPeriod?._id ?? (await ctx.db.insert("reportingPeriods", payload));
      if (existingPeriod) {
        await ctx.db.patch(existingPeriod._id, payload);
      }
      reportingPeriodIdsByLabel.set(period.label, periodId);
    }

    const payees = Array.from(new Set(demoTransactions.map((transaction) => transaction.payee)));
    const existingCounterparties = await ctx.db
      .query("counterparties")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();
    const counterpartyIdsByName = new Map<string, any>();

    for (const payee of payees) {
      const existingCounterparty = existingCounterparties.find((record) => record.name === payee);
      const inferredType = payee.toLowerCase().includes("bank") ? "bank" : payee.toLowerCase().includes("tax") ? "tax_authority" : "vendor";
      const payload = {
        companyId,
        name: payee,
        type: inferredType,
      };
      const counterpartyId = existingCounterparty?._id ?? (await ctx.db.insert("counterparties", payload));
      if (existingCounterparty) {
        await ctx.db.patch(existingCounterparty._id, payload);
      }
      counterpartyIdsByName.set(payee, counterpartyId);
    }

    const existingTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();
    const transactionIdsByExternalRef = new Map<string, any>();

    for (const transaction of demoTransactions) {
      const existingTransaction = existingTransactions.find((record) => record.externalRef === transaction.id);
      const payload = {
        companyId,
        periodId: reportingPeriodIdsByLabel.get(transaction.periodLabel),
        locationId: locationIdsByName.get(transaction.location),
        transactionDate: transaction.date,
        source: transactionSourceFromDemo(transaction.source),
        sourceLabel: transaction.source,
        memo: transaction.description,
        status: transactionStatusFromDemo(transaction.status),
        workflowStatus: transaction.status,
        reviewState: transaction.reviewState,
        postedDate: transaction.postedDate,
        counterpartyId: counterpartyIdsByName.get(transaction.payee),
        externalRef: transaction.id,
        reference: transaction.reference,
        amount: transaction.amount,
        direction: transaction.direction,
        activity: transaction.activity,
        journalHint: transaction.journalHint,
        readyForManualEntry: transaction.readyForManualEntry,
        needsReceipt: transaction.needsReceipt,
      };

      const transactionId = existingTransaction?._id ?? (await ctx.db.insert("transactions", payload));
      if (existingTransaction) {
        await ctx.db.patch(existingTransaction._id, payload);
      }
      transactionIdsByExternalRef.set(transaction.id, transactionId);

      const existingLines = await ctx.db
        .query("transactionLines")
        .withIndex("by_transaction", (q) => q.eq("transactionId", transactionId))
        .collect();
      for (const line of existingLines) {
        await ctx.db.delete(line._id);
      }

      await ctx.db.insert("transactionLines", {
        transactionId,
        accountId: accountIdsByCode.get(transaction.suggestedDebitAccountCode),
        debit: transaction.amount,
        credit: undefined,
        locationId: locationIdsByName.get(transaction.location),
        memo: `Debit leg for ${transaction.reference}`,
      });
      await ctx.db.insert("transactionLines", {
        transactionId,
        accountId: accountIdsByCode.get(transaction.suggestedCreditAccountCode),
        debit: undefined,
        credit: transaction.amount,
        locationId: locationIdsByName.get(transaction.location),
        memo: `Credit leg for ${transaction.reference}`,
      });
    }

    const existingCashAccounts = await ctx.db
      .query("cashAccounts")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();
    const cashAccountIdsByName = new Map<string, any>();

    for (const item of demoCashReconciliations) {
      const normalizedType = item.accountType === "bank" ? "bank_clearing" : item.accountType;
      const existingCashAccount = existingCashAccounts.find((record) => record.name === item.accountName);
      const payload = {
        companyId,
        locationId: locationIdsByName.get(item.location),
        name: item.accountName,
        type: normalizedType,
        active: true,
      };
      const cashAccountId = existingCashAccount?._id ?? (await ctx.db.insert("cashAccounts", payload));
      if (existingCashAccount) {
        await ctx.db.patch(existingCashAccount._id, payload);
      }
      cashAccountIdsByName.set(item.accountName, cashAccountId);
    }

    const existingCashReconciliations = await ctx.db
      .query("cashReconciliations")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();

    for (const item of demoCashReconciliations) {
      const existingReconciliation = existingCashReconciliations.find((record) => record.externalRef === item.id);
      const payload = {
        companyId,
        periodId: reportingPeriodIdsByLabel.get(item.periodLabel),
        cashAccountId: cashAccountIdsByName.get(item.accountName),
        expectedAmount: item.expectedAmount,
        actualAmount: item.actualAmount,
        varianceAmount: item.varianceAmount,
        status: reconciliationStatusFromDemo(item.status),
        workflowStatus: item.status,
        externalRef: item.id,
        locationId: locationIdsByName.get(item.location),
        accountType: item.accountType,
        lastCountedAt: item.lastCountedAt,
        owner: item.owner,
        sourceContext: item.sourceContext,
        sourceBreakdown: item.sourceBreakdown,
        varianceDrivers: item.varianceDrivers,
        investigationNotes: item.investigationNotes,
        relatedTransactionRefs: item.relatedTransactions.map((transaction) => ({
          transactionRef: transaction.transactionId,
          label: transaction.label,
          amount: transaction.amount,
          note: transaction.note,
        })),
        nextSteps: item.nextSteps,
        actions: item.actions,
      };

      if (existingReconciliation) {
        await ctx.db.patch(existingReconciliation._id, payload);
      } else {
        await ctx.db.insert("cashReconciliations", payload);
      }
    }

    return {
      companyId,
      companySlug: slug,
      locationsSeeded: californiaOperatorDemo.locations.length,
      licensesSeeded: californiaOperatorDemo.licenses.length,
      accountsSeeded: californiaOperatorDemo.chartOfAccounts.length,
      reportingPeriodsSeeded: demoReportingPeriods.length,
      transactionsSeeded: demoTransactions.length,
      transactionLinesSeeded: demoTransactions.length * 2,
      cashReconciliationsSeeded: demoCashReconciliations.length,
    };
  },
});
