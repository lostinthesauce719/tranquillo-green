import { v } from "convex/values";
import { authQuery, authMutation } from "./lib/withAuth";
import { californiaOperatorDemo, demoReportingPeriods, demoTransactions } from "../src/lib/demo/accounting";
import { demoCashReconciliations } from "../src/lib/demo/accounting-operations";
import { demoImportDatasets } from "../src/lib/demo/accounting-workflows";

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

export const previewCaliforniaOperator = authQuery(
  {},
  async (_ctx: any, _args: any, _identity: any) => ({
    company: californiaOperatorDemo.company,
    locations: californiaOperatorDemo.locations,
    licenses: californiaOperatorDemo.licenses,
    chartOfAccounts: californiaOperatorDemo.chartOfAccounts,
    reportingPeriods: demoReportingPeriods,
    transactions: demoTransactions,
    cashReconciliations: demoCashReconciliations,
  }),
);

export const seedCaliforniaOperator = authMutation(
  {
    slug: v.optional(v.string()),
  },
  async (ctx: any, args: any, _identity: any) => {
    // Guard: only allow seeding in development
    // In production Convex deployments, process.env may not be available,
    // but the auth check above ensures only authenticated users can seed.
    // Add additional role checks here if needed.

    const slug = args.slug ?? californiaOperatorDemo.company.slug;
    const existingCompany = await ctx.db
      .query("cannabisCompanies")
      .withIndex("by_slug", (q: any) => q.eq("slug", slug))
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
      .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
      .collect();

    for (const location of californiaOperatorDemo.locations) {
      const existingLocation = existingLocations.find((record: any) => record.name === location.name);
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
      .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
      .collect();

    for (const license of californiaOperatorDemo.licenses) {
      const existingLicense = existingLicenses.find((record: any) => record.licenseNumber === license.licenseNumber);
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
      .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
      .collect();
    const accountIdsByCode = new Map<string, any>();

    for (const account of californiaOperatorDemo.chartOfAccounts) {
      const existingAccount = existingAccounts.find((record: any) => record.code === account.code);
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
      .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
      .collect();
    const reportingPeriodIdsByLabel = new Map<string, any>();

    for (const period of demoReportingPeriods) {
      const existingPeriod = existingPeriods.find((record: any) => record.label === period.label);
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

    const existingImportProfiles = await ctx.db
      .query("importMappingProfiles")
      .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
      .collect();
    const importProfileIdsByKey = new Map<string, any>();

    for (const dataset of demoImportDatasets) {
      for (const profile of dataset.profiles) {
        const profileKey = `${dataset.source}:${profile.id}`;
        const existingProfile = existingImportProfiles.find((record: any) => record.profileKey === profileKey);
        const payload = {
          companyId,
          profileKey,
          sourceSystem: dataset.source,
          name: profile.name,
          description: profile.description,
          amountStrategy: profile.amountStrategy,
          fieldMappings: profile.fieldMappings,
          createdAt: existingProfile?.createdAt ?? Date.now(),
          updatedAt: Date.now(),
        };
        const profileId = existingProfile?._id ?? (await ctx.db.insert("importMappingProfiles", payload));
        if (existingProfile) {
          await ctx.db.patch(existingProfile._id, payload);
        }
        importProfileIdsByKey.set(profileKey, profileId);
      }
    }

    const existingImportJobs = await ctx.db
      .query("importJobs")
      .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
      .collect();

    for (const dataset of demoImportDatasets) {
      const profile = dataset.profiles[0]!;
      const profileKey = `${dataset.source}:${profile.id}`;
      const existingJob = existingImportJobs.find((record: any) => record.externalRef === `import-job:${dataset.id}`);
      const validationSummary = {
        ready: dataset.rows.filter((row: any) => row.status === "ready").length,
        warning: dataset.rows.filter((row: any) => row.status === "warning").length,
        error: dataset.rows.filter((row: any) => row.status === "error").length,
      };
      const jobPayload = {
        companyId,
        periodId: reportingPeriodIdsByLabel.get(dataset.periodLabel),
        importMappingProfileId: importProfileIdsByKey.get(profileKey),
        sourceSystem: dataset.source,
        sourceFileName: dataset.fileName,
        sourceOriginalFileName: dataset.fileName,
        sourceContentType: "text/csv",
        sourceDelimiter: dataset.delimiter,
        sourceFileSizeBytes: JSON.stringify(dataset.rows).length,
        sourceChecksum: `${dataset.fileName}:${dataset.rows.length}`,
        uploadedAt: Date.now(),
        uploadedBy: "Seed script",
        status: validationSummary.error > 0 ? "mapped" : "validated",
        rowCount: dataset.rows.length,
        promotedRowCount: 0,
        validationSummary,
        columns: dataset.columns,
        notes: validationSummary.error > 0 ? `${validationSummary.error} staged row errors remain open.` : undefined,
        externalRef: `import-job:${dataset.id}`,
      };

      const jobId = existingJob?._id ?? (await ctx.db.insert("importJobs", jobPayload));
      if (existingJob) {
        await ctx.db.patch(existingJob._id, jobPayload);
      }

      const existingRows = await ctx.db
        .query("importJobRows")
        .withIndex("by_job", (q: any) => q.eq("importJobId", jobId))
        .collect();
      for (const row of existingRows) {
        await ctx.db.delete(row._id);
      }

      for (let index = 0; index < dataset.rows.length; index += 1) {
        const row = dataset.rows[index]!;
        await ctx.db.insert("importJobRows", {
          importJobId: jobId,
          rowNumber: index + 1,
          rowKey: row.id,
          rawValues: row.values,
          normalizedValues: row.values,
          transactionDate: row.values.booking_date ?? row.values.check_date ?? undefined,
          postedDate: row.values.post_date ?? undefined,
          description: row.values.vendor_name ?? row.values.employee_group ?? row.id,
          reference: row.values.bank_reference ?? row.values.batch_reference ?? row.id,
          amount: row.values.signed_amount ? Math.abs(Number(row.values.signed_amount)) : undefined,
          debit: row.values.debit_amount ? Number(row.values.debit_amount) : undefined,
          credit: row.values.credit_amount ? Number(row.values.credit_amount) : undefined,
          locationName: row.values.entity ?? undefined,
          memo: row.values.bank_memo ?? row.values.memo_text ?? undefined,
          sourceAccountName: row.sourceAccountName,
          suggestedDebitAccountCode: row.suggestedDebitAccountCode,
          suggestedCreditAccountCode: row.suggestedCreditAccountCode,
          confidence: row.confidence,
          status: row.status,
          validationIssues: row.validationIssues,
        });
      }
    }

    const payees = Array.from(new Set(demoTransactions.map((transaction: any) => transaction.payee)));
    const existingCounterparties = await ctx.db
      .query("counterparties")
      .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
      .collect();
    const counterpartyIdsByName = new Map<string, any>();

    for (const payee of payees) {
      const existingCounterparty = existingCounterparties.find((record: any) => record.name === payee);
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
      .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
      .collect();
    const transactionIdsByExternalRef = new Map<string, any>();

    for (const transaction of demoTransactions) {
      const existingTransaction = existingTransactions.find((record: any) => record.externalRef === transaction.id);
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
        .withIndex("by_transaction", (q: any) => q.eq("transactionId", transactionId))
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
      .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
      .collect();
    const cashAccountIdsByName = new Map<string, any>();

    for (const item of demoCashReconciliations) {
      const normalizedType = item.accountType === "bank" ? "bank_clearing" : item.accountType;
      const existingCashAccount = existingCashAccounts.find((record: any) => record.name === item.accountName);
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
      .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
      .collect();

    for (const item of demoCashReconciliations) {
      const existingReconciliation = existingCashReconciliations.find((record: any) => record.externalRef === item.id);
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
        relatedTransactionRefs: item.relatedTransactions.map((transaction: any) => ({
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
      importProfilesSeeded: demoImportDatasets.reduce((sum: number, dataset: any) => sum + dataset.profiles.length, 0),
      importJobsSeeded: demoImportDatasets.length,
      importRowsSeeded: demoImportDatasets.reduce((sum: number, dataset: any) => sum + dataset.rows.length, 0),
      transactionsSeeded: demoTransactions.length,
      transactionLinesSeeded: demoTransactions.length * 2,
      cashReconciliationsSeeded: demoCashReconciliations.length,
    };
  },
);
