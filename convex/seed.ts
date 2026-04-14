import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
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

    const existingImportProfiles = await ctx.db
      .query("importMappingProfiles")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();
    const importProfileIdsByKey = new Map<string, any>();

    for (const dataset of demoImportDatasets) {
      for (const profile of dataset.profiles) {
        const profileKey = `${dataset.source}:${profile.id}`;
        const existingProfile = existingImportProfiles.find((record) => record.profileKey === profileKey);
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
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();

    for (const dataset of demoImportDatasets) {
      const profile = dataset.profiles[0]!;
      const profileKey = `${dataset.source}:${profile.id}`;
      const existingJob = existingImportJobs.find((record) => record.externalRef === `import-job:${dataset.id}`);
      const validationSummary = {
        ready: dataset.rows.filter((row) => row.status === "ready").length,
        warning: dataset.rows.filter((row) => row.status === "warning").length,
        error: dataset.rows.filter((row) => row.status === "error").length,
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
        .withIndex("by_job", (q) => q.eq("importJobId", jobId))
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

    // ─── Audit trail seed data ────────────────────────────────────────

    const existingAuditEvents = await ctx.db
      .query("auditTrailEvents")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();

    if (existingAuditEvents.length === 0) {
      const now = Date.now();
      const auditSeedEvents = [
        {
          entityType: "allocation" as const,
          entityId: "alloc_sqft_001",
          action: "override_recorded",
          actor: "Tax Manager",
          actorRole: "tax_manager",
          reason: "Square footage methodology adjusted after site inspection confirmed reduced cultivation area due to remediation zone.",
          beforeState: "deductible:42500/nondeductible:18200",
          afterState: "deductible:38700/nondeductible:22000",
          metadata: { decisionType: "override", deductibleShift: "-3800", nondeductibleShift: "3800" },
          timestamp: now - 86400000,
        },
        {
          entityType: "allocation" as const,
          entityId: "alloc_labor_002",
          action: "approval_recorded",
          actor: "Controller",
          actorRole: "controller",
          reason: "Labor allocation approved as recommended. Time tracking records support the 73/27 split between cultivation and retail operations.",
          beforeState: "deductible:31200/nondeductible:11500",
          afterState: "deductible:31200/nondeductible:11500",
          metadata: { decisionType: "approval" },
          timestamp: now - 172800000,
        },
        {
          entityType: "allocation" as const,
          entityId: "alloc_custom_003",
          action: "policy_exception_recorded",
          actor: "Controller",
          actorRole: "controller",
          reason: "Custom policy exception for event sponsorship expense. Marketing directly supports retail revenue; treated as partially deductible under revised memo.",
          beforeState: "deductible:0/nondeductible:8500",
          afterState: "deductible:5100/nondeductible:3400",
          metadata: { decisionType: "policy_exception", deductibleShift: "5100", nondeductibleShift: "-5100" },
          timestamp: now - 259200000,
        },
        {
          entityType: "reconciliation" as const,
          entityId: "rec_operating_cash",
          action: "status_changed",
          actor: "Staff Accountant",
          actorRole: "staff_accountant",
          reason: "Operating cash reconciliation balanced after correcting misapplied POS deposit from Apr 12.",
          beforeState: "investigating",
          afterState: "resolved",
          timestamp: now - 43200000,
        },
        {
          entityType: "transaction" as const,
          entityId: "txn_2026_0415_payroll",
          action: "status_changed",
          actor: "Assistant Controller",
          actorRole: "assistant_controller",
          reason: "Payroll journal entry reviewed and posted. Allocations verified against labor timecards.",
          beforeState: "needs_review",
          afterState: "posted",
          timestamp: now - 7200000,
        },
        {
          entityType: "packet" as const,
          entityId: "bundle_280e",
          action: "packet_assembled",
          actor: "Tax Manager",
          actorRole: "tax_manager",
          reason: "Published 280E support + override binder for CPA review with PDF, CSV, and evidence ZIP outputs.",
          afterState: "3 formats, 4 schedules",
          metadata: { bundleName: "280E support + override binder", action: "assembled", scheduleCount: "4", formatCount: "3" },
          timestamp: now - 3600000,
        },
        {
          entityType: "packet" as const,
          entityId: "bundle_close",
          action: "packet_refreshed",
          actor: "Assistant Controller",
          actorRole: "assistant_controller",
          reason: "Rebuilt close handoff packet after bank reconciliation tied, leaving clearing support as the remaining blocker.",
          afterState: "2 formats, 4 schedules",
          metadata: { bundleName: "Month-end close handoff packet", action: "refreshed", scheduleCount: "4", formatCount: "2" },
          timestamp: now - 5400000,
        },
      ];

      for (const event of auditSeedEvents) {
        await ctx.db.insert("auditTrailEvents", {
          companyId,
          ...event,
        });
      }

      // Seed override decisions
      const overrideSeedData = [
        {
          allocationId: undefined,
          transactionId: undefined,
          decisionType: "override" as const,
          actor: "Tax Manager",
          actorRole: "tax_manager",
          reason: "Square footage methodology adjusted after site inspection confirmed reduced cultivation area due to remediation zone.",
          fromBasis: "square_footage",
          toBasis: "square_footage",
          originalDeductibleAmount: 42500,
          originalNondeductibleAmount: 18200,
          revisedDeductibleAmount: 38700,
          revisedNondeductibleAmount: 22000,
          evidence: ["Site inspection report dated Apr 10", "Updated floor plan showing remediation zone", "Memo from facilities manager"],
          resultingPolicyTrail: "Exception memo filed. Standing square footage methodology retained for non-remediation areas; remediation zone carved out with 0% deductibility until Q3 reassessment.",
          timestamp: now - 86400000,
        },
        {
          allocationId: undefined,
          transactionId: undefined,
          decisionType: "approval" as const,
          actor: "Controller",
          actorRole: "controller",
          reason: "Labor allocation approved as recommended. Time tracking records support the 73/27 split.",
          fromBasis: "labor_hours",
          toBasis: "labor_hours",
          originalDeductibleAmount: 31200,
          originalNondeductibleAmount: 11500,
          revisedDeductibleAmount: 31200,
          revisedNondeductibleAmount: 11500,
          evidence: ["March timecards", "Payroll register tie-out"],
          resultingPolicyTrail: "Approved on standing labor methodology. No exception needed.",
          timestamp: now - 172800000,
        },
        {
          allocationId: undefined,
          transactionId: undefined,
          decisionType: "policy_exception" as const,
          actor: "Controller",
          actorRole: "controller",
          reason: "Custom policy exception for event sponsorship expense. Marketing directly supports retail revenue.",
          fromBasis: "custom_policy",
          toBasis: "custom_policy",
          originalDeductibleAmount: 0,
          originalNondeductibleAmount: 8500,
          revisedDeductibleAmount: 5100,
          revisedNondeductibleAmount: 3400,
          evidence: ["Event ROI analysis", "Marketing spend allocation memo", "CPA standing memo reference"],
          resultingPolicyTrail: "Exception memo filed. 60% of event sponsorship treated as deductible retail marketing expense under revised standing memo effective April 1.",
          timestamp: now - 259200000,
        },
      ];

      for (const override of overrideSeedData) {
        await ctx.db.insert("overrideDecisions", {
          companyId,
          ...override,
        });
      }

      // Seed packet generation records
      const packetSeedData = [
        {
          bundleId: "bundle_280e",
          bundleName: "280E support + override binder",
          action: "assembled" as const,
          actor: "Tax Manager",
          actorRole: "tax_manager",
          exportFormats: ["PDF binder", "CSV line-item support", "ZIP evidence packet"],
          includedSchedules: ["280E support schedule", "Allocation override history workspace", "Policy memo index", "Reviewer sign-off summary"],
          coverMemoMode: "cpa_handoff",
          checklistSnapshot: [
            { title: "Close dashboard readiness snapshot exported", status: "done", owner: "Assistant Controller" },
            { title: "280E support schedule included", status: "done", owner: "Tax Manager" },
            { title: "Allocation override audit trail attached", status: "done", owner: "Controller" },
          ],
          detail: "Published 280E support + override binder for CPA review with PDF, CSV, and evidence ZIP outputs.",
          timestamp: now - 3600000,
        },
        {
          bundleId: "bundle_close",
          bundleName: "Month-end close handoff packet",
          action: "refreshed" as const,
          actor: "Assistant Controller",
          actorRole: "assistant_controller",
          exportFormats: ["PDF close pack", "XLSX lead sheet export"],
          includedSchedules: ["Close dashboard summary", "Bank and cash reconciliation tie-outs", "Open blocker list", "Journal entry recap"],
          coverMemoMode: "controller_summary",
          checklistSnapshot: [
            { title: "Close dashboard readiness snapshot exported", status: "done", owner: "Assistant Controller" },
            { title: "Bank and cash reconciliation PDFs attached", status: "watch", owner: "Staff Accountant" },
            { title: "Recipient delivery notes reviewed", status: "watch", owner: "Controller" },
          ],
          detail: "Rebuilt close handoff packet after bank reconciliation tied, leaving clearing support as the remaining blocker.",
          timestamp: now - 5400000,
        },
      ];

      for (const packet of packetSeedData) {
        await ctx.db.insert("packetGenerationRecords", {
          companyId,
          ...packet,
        });
      }
    }

    // ─── Products & Inventory ───
    const existingProducts = await ctx.db
      .query("products")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();

    const productIdsBySku = new Map<string, any>();

    if (existingProducts.length === 0) {
      const productSeeds = [
        { sku: "FLWR-OG-KUSH-3.5", name: "OG Kush Flower 3.5g", category: "flower", unitOfMeasure: "g", active: true },
        { sku: "PRRL-GLUE-10PK", name: "GG #4 Pre-Roll 10pk", category: "pre-roll", unitOfMeasure: "pk", active: true },
        { sku: "VPE-GSC-1G", name: "GSC Live Resin Cart 1g", category: "vape", unitOfMeasure: "ea", active: true },
        { sku: "EDBL-GUMMY-20PK", name: "Sativa Gummies 20ct", category: "edible", unitOfMeasure: "ea", active: true },
        { sku: "CONC-BHO-1G", name: "Blue Dream BHO Shatter 1g", category: "concentrate", unitOfMeasure: "g", active: true },
        { sku: "FLWR-PINK-7G", name: "Pink Panties Flower 7g", category: "flower", unitOfMeasure: "g", active: true },
      ];

      for (const product of productSeeds) {
        const id = await ctx.db.insert("products", { companyId, ...product });
        productIdsBySku.set(product.sku, id);
      }
    } else {
      for (const product of existingProducts) {
        productIdsBySku.set(product.sku, product._id);
      }
    }

    const existingBatches = await ctx.db
      .query("inventoryBatches")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();

    if (existingBatches.length === 0) {
      const primaryLocation = Array.from(locationIdsByName.values())[0];
      const batchSeeds = [
        { sku: "FLWR-OG-KUSH-3.5", packageTag: "1A4060300001C10000010012", quantityOnHand: 420, costBasis: 5.25, source: "metrc_import" as const },
        { sku: "FLWR-OG-KUSH-3.5", packageTag: "1A4060300001C10000010018", quantityOnHand: 112, costBasis: 5.50, source: "metrc_import" as const },
        { sku: "PRRL-GLUE-10PK", packageTag: "1A4060300001C20000020045", quantityOnHand: 340, costBasis: 18.00, source: "manual" as const },
        { sku: "VPE-GSC-1G", packageTag: "1A4060300001C30000030078", quantityOnHand: 560, costBasis: 22.50, source: "metrc_import" as const },
        { sku: "EDBL-GUMMY-20PK", packageTag: "1A4060300001C40000040091", quantityOnHand: 180, costBasis: 14.00, source: "manual" as const },
        { sku: "CONC-BHO-1G", packageTag: "1A4060300001C50000050112", quantityOnHand: 95, costBasis: 28.00, source: "metrc_import" as const },
        { sku: "FLWR-PINK-7G", packageTag: "1A4060300001C10000060130", quantityOnHand: 224, costBasis: 4.75, source: "metrc_import" as const },
      ];

      for (const batch of batchSeeds) {
        const productId = productIdsBySku.get(batch.sku);
        if (productId) {
          await ctx.db.insert("inventoryBatches", {
            companyId,
            productId,
            locationId: primaryLocation,
            packageTag: batch.packageTag,
            quantityOnHand: batch.quantityOnHand,
            costBasis: batch.costBasis,
            source: batch.source,
          });
        }
      }
    }

    // ─── Tax Filings ───
    const existingTaxFilings = await ctx.db
      .query("taxFilings")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();

    if (existingTaxFilings.length === 0) {
      const taxFilingSeeds = [
        {
          filingType: "CA Cannabis Excise Tax",
          periodLabel: "Q1 2026",
          dueDate: "2026-04-30",
          status: "ready" as const,
        },
        {
          filingType: "CA Sales & Use Tax",
          periodLabel: "March 2026",
          dueDate: "2026-04-30",
          status: "pending" as const,
        },
        {
          filingType: "CA Cannabis Cultivation Tax Report",
          periodLabel: "Q1 2026",
          dueDate: "2026-04-30",
          status: "filed" as const,
        },
      ];

      for (const filing of taxFilingSeeds) {
        await ctx.db.insert("taxFilings", {
          companyId,
          ...filing,
        });
      }
    }

    // ─── Compliance Alerts ───
    const existingAlerts = await ctx.db
      .query("complianceAlerts")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();

    if (existingAlerts.length === 0) {
      const alertSeeds = [
        {
          category: "license" as const,
          severity: "warning" as const,
          title: "Distribution license expiring in 10 months",
          body: "C11-0009822-LIC (Distribution) expires on 2026-02-28. Begin renewal preparation 90 days before expiry.",
        },
        {
          category: "tax" as const,
          severity: "critical" as const,
          title: "Excise tax return due in 19 days",
          body: "Q1 2026 California cannabis excise tax return is due April 30. Ensure METRC sales data reconciles to filed amount.",
        },
        {
          category: "reconciliation" as const,
          severity: "info" as const,
          title: "METRC manifest variance detected",
          body: "Three incoming transfer manifests show weight discrepancies between METRC recorded quantities and received quantities. Investigate before next reconciliation cycle.",
        },
      ];

      for (const alert of alertSeeds) {
        await ctx.db.insert("complianceAlerts", {
          companyId,
          ...alert,
        });
      }
    }

    const auditEventsSeeded = existingAuditEvents.length === 0 ? 7 : 0;
    const overrideDecisionsSeeded = existingAuditEvents.length === 0 ? 3 : 0;
    const packetRecordsSeeded = existingAuditEvents.length === 0 ? 2 : 0;
    const taxFilingsSeeded = existingTaxFilings.length === 0 ? 3 : 0;
    const complianceAlertsSeeded = existingAlerts.length === 0 ? 3 : 0;

    const productsSeeded = existingProducts.length === 0 ? 6 : 0;
    const batchesSeeded = existingBatches.length === 0 ? 7 : 0;

    return {
      companyId,
      companySlug: slug,
      locationsSeeded: californiaOperatorDemo.locations.length,
      licensesSeeded: californiaOperatorDemo.licenses.length,
      accountsSeeded: californiaOperatorDemo.chartOfAccounts.length,
      reportingPeriodsSeeded: demoReportingPeriods.length,
      importProfilesSeeded: demoImportDatasets.reduce((sum, dataset) => sum + dataset.profiles.length, 0),
      importJobsSeeded: demoImportDatasets.length,
      importRowsSeeded: demoImportDatasets.reduce((sum, dataset) => sum + dataset.rows.length, 0),
      transactionsSeeded: demoTransactions.length,
      transactionLinesSeeded: demoTransactions.length * 2,
      cashReconciliationsSeeded: demoCashReconciliations.length,
      productsSeeded,
      batchesSeeded,
      taxFilingsSeeded,
      complianceAlertsSeeded,
      auditEventsSeeded,
      overrideDecisionsSeeded,
      packetRecordsSeeded,
    };
  },
});
