import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

const importAmountStrategy = v.union(v.literal("single_signed"), v.literal("split_debit_credit"));
const importRowStatus = v.union(v.literal("ready"), v.literal("warning"), v.literal("error"));
const importJobStatus = v.union(
  v.literal("uploaded"),
  v.literal("mapped"),
  v.literal("validated"),
  v.literal("partially_promoted"),
  v.literal("promoted"),
  v.literal("failed"),
);
const importTargetField = v.union(
  v.literal("date"),
  v.literal("postedDate"),
  v.literal("description"),
  v.literal("reference"),
  v.literal("amount"),
  v.literal("debit"),
  v.literal("credit"),
  v.literal("location"),
  v.literal("memo"),
  v.literal("ignore"),
);

const columnValidator = v.object({
  key: v.string(),
  label: v.string(),
  suggestedTarget: importTargetField,
  required: v.optional(v.boolean()),
  sampleValues: v.array(v.string()),
});

const rowValidator = v.object({
  id: v.string(),
  values: v.record(v.string(), v.string()),
  sourceAccountName: v.string(),
  suggestedDebitAccountCode: v.string(),
  suggestedCreditAccountCode: v.string(),
  confidence: v.number(),
  status: importRowStatus,
  validationIssues: v.array(v.string()),
});

const profileValidator = v.object({
  id: v.string(),
  name: v.string(),
  description: v.string(),
  amountStrategy: importAmountStrategy,
  fieldMappings: v.record(v.string(), importTargetField),
});

const stageDatasetValidator = v.object({
  id: v.string(),
  fileName: v.string(),
  source: v.string(),
  periodLabel: v.string(),
  uploadedAt: v.string(),
  delimiter: v.string(),
  columns: v.array(columnValidator),
  rows: v.array(rowValidator),
  selectedProfile: profileValidator,
  effectiveMappings: v.record(v.string(), importTargetField),
});

function normalizeAmount(value: number | undefined) {
  return Number((value ?? 0).toFixed(2));
}

function parseNumber(value: string | undefined) {
  const parsed = Number(value ?? "0");
  return Number.isFinite(parsed) ? normalizeAmount(parsed) : 0;
}

function dedupeStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function isoDate(value: string | undefined) {
  if (!value) {
    return undefined;
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

function checksumForDataset(dataset: { fileName: string; periodLabel: string; source: string; rows: { id: string }[] }) {
  return `${dataset.fileName}:${dataset.periodLabel}:${dataset.source}:${dataset.rows.map((row) => row.id).join("|")}`;
}

function requiredMappingIssues(fieldMappings: Record<string, string>, amountStrategy: "single_signed" | "split_debit_credit") {
  const mapped = new Set(Object.values(fieldMappings));
  const issues: string[] = [];
  for (const field of ["date", "description", "reference"]) {
    if (!mapped.has(field)) {
      issues.push(`Missing required mapping for ${field}`);
    }
  }
  if (amountStrategy === "split_debit_credit") {
    if (!mapped.has("debit")) {
      issues.push("Missing required mapping for debit");
    }
    if (!mapped.has("credit")) {
      issues.push("Missing required mapping for credit");
    }
  } else if (!mapped.has("amount")) {
    issues.push("Missing required mapping for amount");
  }
  return issues;
}

function invertMappings(fieldMappings: Record<string, string>) {
  return Object.entries(fieldMappings).reduce<Record<string, string>>((acc, [columnKey, target]) => {
    acc[target] = columnKey;
    return acc;
  }, {});
}

function validateRow(
  row: {
    values: Record<string, string>;
    status: "ready" | "warning" | "error";
    validationIssues: string[];
  },
  fieldMappings: Record<string, string>,
  amountStrategy: "single_signed" | "split_debit_credit",
) {
  const issues = dedupeStrings([...requiredMappingIssues(fieldMappings, amountStrategy), ...row.validationIssues]);
  const targetToColumn = invertMappings(fieldMappings);
  const dateValue = row.values[targetToColumn.date] ?? "";
  const descriptionValue = row.values[targetToColumn.description] ?? "";
  const referenceValue = row.values[targetToColumn.reference] ?? "";

  if (!dateValue.trim()) {
    issues.push("Transaction date missing");
  }
  if (!descriptionValue.trim()) {
    issues.push("Description missing");
  }
  if (!referenceValue.trim()) {
    issues.push("Reference missing");
  }

  if (amountStrategy === "single_signed") {
    const amountValue = row.values[targetToColumn.amount] ?? "";
    if (!amountValue.trim() || !Number.isFinite(Number(amountValue))) {
      issues.push("Signed amount missing or invalid");
    }
  } else {
    const debitValue = row.values[targetToColumn.debit] ?? "";
    const creditValue = row.values[targetToColumn.credit] ?? "";
    if (!Number.isFinite(Number(debitValue || 0))) {
      issues.push("Debit amount missing or invalid");
    }
    if (!Number.isFinite(Number(creditValue || 0))) {
      issues.push("Credit amount missing or invalid");
    }
  }

  const nextStatus = issues.length > 0 ? (row.status === "error" || issues.some((issue) => issue.toLowerCase().includes("missing")) ? "error" : "warning") : row.status;
  return { issues: dedupeStrings(issues), status: nextStatus } as const;
}

export const getWorkspaceBySlug = queryGeneric({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const company = await ctx.db.query("cannabisCompanies").withIndex("by_slug", (q) => q.eq("slug", args.slug)).unique();
    if (!company) {
      return null;
    }

    const [periods, mappingProfiles, jobs] = await Promise.all([
      ctx.db.query("reportingPeriods").withIndex("by_company", (q) => q.eq("companyId", company._id)).collect(),
      ctx.db.query("importMappingProfiles").withIndex("by_company", (q) => q.eq("companyId", company._id)).collect(),
      ctx.db.query("importJobs").withIndex("by_company", (q) => q.eq("companyId", company._id)).collect(),
    ]);

    const periodsById = new Map(periods.map((period) => [period._id, period]));
    const jobsWithRows: any[] = [];
    for (const job of jobs) {
      const rows = await ctx.db.query("importJobRows").withIndex("by_job", (q) => q.eq("importJobId", job._id)).collect();
      const profile = job.importMappingProfileId ? await ctx.db.get(job.importMappingProfileId) : null;
      const profileOptions = mappingProfiles
        .filter((item) => item.sourceSystem === job.sourceSystem)
        .map((item) => ({
          id: item.profileKey,
          name: item.name,
          description: item.description,
          amountStrategy: item.amountStrategy,
          fieldMappings: item.fieldMappings,
        }));
      if (profile && !profileOptions.some((item) => item.id === profile.profileKey)) {
        profileOptions.unshift({
          id: profile.profileKey,
          name: profile.name,
          description: profile.description,
          amountStrategy: profile.amountStrategy,
          fieldMappings: profile.fieldMappings,
        });
      }

      jobsWithRows.push({
        ...job,
        publicId: job.externalRef ?? job._id,
        periodLabel: job.periodId ? periodsById.get(job.periodId)?.label : undefined,
        profile: profile
          ? {
              id: profile.profileKey,
              name: profile.name,
              description: profile.description,
              amountStrategy: profile.amountStrategy,
              fieldMappings: profile.fieldMappings,
            }
          : null,
        availableProfiles: profileOptions,
        rows: rows
          .map((row) => ({
            ...row,
            promotedTransactionPublicId: row.promotedTransactionId ? row.promotedTransactionId : undefined,
          }))
          .sort((a, b) => a.rowNumber - b.rowNumber),
      });
    }

    return {
      company,
      jobs: jobsWithRows.sort((a, b) => b.uploadedAt - a.uploadedAt),
      mappingProfiles: mappingProfiles.sort((a, b) => a.name.localeCompare(b.name)),
    };
  },
});

export const stageDemoImportJob = mutationGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
    dataset: stageDatasetValidator,
  },
  handler: async (ctx, args) => {
    const company = await ctx.db.get(args.companyId);
    if (!company) {
      throw new Error("Company not found.");
    }

    const periods = await ctx.db.query("reportingPeriods").withIndex("by_company", (q) => q.eq("companyId", args.companyId)).collect();
    const period = periods.find((item) => item.label === args.dataset.periodLabel) ?? null;
    const profileKey = `${args.dataset.source}:${args.dataset.selectedProfile.id}`;
    const existingProfile = (
      await ctx.db.query("importMappingProfiles").withIndex("by_company", (q) => q.eq("companyId", args.companyId)).collect()
    ).find((profile) => profile.profileKey === profileKey);

    const profilePayload = {
      companyId: args.companyId,
      profileKey,
      sourceSystem: args.dataset.source,
      name: args.dataset.selectedProfile.name,
      description: args.dataset.selectedProfile.description,
      amountStrategy: args.dataset.selectedProfile.amountStrategy,
      fieldMappings: args.dataset.effectiveMappings,
      updatedAt: Date.now(),
      createdAt: existingProfile?.createdAt ?? Date.now(),
    };

    const profileId = existingProfile?._id ?? (await ctx.db.insert("importMappingProfiles", profilePayload));
    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, profilePayload);
    }

    const externalRef = `import-job:${args.dataset.id}`;
    const existingJob = (
      await ctx.db.query("importJobs").withIndex("by_company", (q) => q.eq("companyId", args.companyId)).collect()
    ).find((job) => job.externalRef === externalRef);

    const mappingIssues = requiredMappingIssues(args.dataset.effectiveMappings, args.dataset.selectedProfile.amountStrategy);
    const validationSummary = { ready: 0, warning: 0, error: 0 };
    const previewRows = args.dataset.rows.map((row, index) => {
      const validation = validateRow(row, args.dataset.effectiveMappings, args.dataset.selectedProfile.amountStrategy);
      validationSummary[validation.status] += 1;
      const targetToColumn = invertMappings(args.dataset.effectiveMappings);
      return {
        rowNumber: index + 1,
        rowKey: row.id,
        rawValues: row.values,
        normalizedValues: {
          date: row.values[targetToColumn.date] ?? "",
          postedDate: row.values[targetToColumn.postedDate] ?? "",
          description: row.values[targetToColumn.description] ?? "",
          reference: row.values[targetToColumn.reference] ?? "",
          amount: row.values[targetToColumn.amount] ?? "",
          debit: row.values[targetToColumn.debit] ?? "",
          credit: row.values[targetToColumn.credit] ?? "",
          location: row.values[targetToColumn.location] ?? "",
          memo: row.values[targetToColumn.memo] ?? "",
        },
        sourceAccountName: row.sourceAccountName,
        suggestedDebitAccountCode: row.suggestedDebitAccountCode,
        suggestedCreditAccountCode: row.suggestedCreditAccountCode,
        confidence: row.confidence,
        status: validation.status,
        validationIssues: validation.issues,
      };
    });

    const jobStatus = validationSummary.error > 0 ? "mapped" : "validated";
    const jobPayload = {
      companyId: args.companyId,
      periodId: period?._id,
      importMappingProfileId: profileId,
      sourceSystem: args.dataset.source,
      sourceFileName: args.dataset.fileName,
      sourceOriginalFileName: args.dataset.fileName,
      sourceContentType: "text/csv",
      sourceDelimiter: args.dataset.delimiter,
      sourceFileSizeBytes: JSON.stringify(args.dataset.rows).length,
      sourceChecksum: checksumForDataset(args.dataset),
      uploadedAt: Date.now(),
      uploadedBy: "Accounting workspace",
      status: jobStatus,
      rowCount: args.dataset.rows.length,
      promotedRowCount: existingJob?.promotedRowCount ?? 0,
      validationSummary,
      columns: args.dataset.columns,
      notes: mappingIssues.length > 0 ? mappingIssues.join("; ") : undefined,
      externalRef,
    };

    const jobId = existingJob?._id ?? (await ctx.db.insert("importJobs", jobPayload));
    if (existingJob) {
      await ctx.db.patch(existingJob._id, { ...jobPayload, promotedRowCount: 0, status: jobStatus });
      const existingRows = await ctx.db.query("importJobRows").withIndex("by_job", (q) => q.eq("importJobId", existingJob._id)).collect();
      for (const row of existingRows) {
        await ctx.db.delete(row._id);
      }
    }

    for (const row of previewRows) {
      await ctx.db.insert("importJobRows", {
        importJobId: jobId,
        rowNumber: row.rowNumber,
        rowKey: row.rowKey,
        rawValues: row.rawValues,
        normalizedValues: row.normalizedValues,
        transactionDate: isoDate(row.normalizedValues.date),
        postedDate: isoDate(row.normalizedValues.postedDate),
        description: row.normalizedValues.description || row.rawValues.vendor_name || row.rawValues.employee_group || row.rowKey,
        reference: row.normalizedValues.reference || row.rowKey,
        amount: row.normalizedValues.amount ? Math.abs(parseNumber(row.normalizedValues.amount)) : undefined,
        debit: row.normalizedValues.debit ? parseNumber(row.normalizedValues.debit) : undefined,
        credit: row.normalizedValues.credit ? parseNumber(row.normalizedValues.credit) : undefined,
        locationName: row.normalizedValues.location || undefined,
        memo: row.normalizedValues.memo || undefined,
        sourceAccountName: row.sourceAccountName,
        suggestedDebitAccountCode: row.suggestedDebitAccountCode,
        suggestedCreditAccountCode: row.suggestedCreditAccountCode,
        confidence: row.confidence,
        status: row.status,
        validationIssues: row.validationIssues,
      });
    }

    return await ctx.db.get(jobId);
  },
});

export const promoteJobToTransactions = mutationGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
    jobId: v.id("importJobs"),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job || job.companyId !== args.companyId) {
      throw new Error("Import job not found.");
    }

    const [rows, accounts, locations, counterparties] = await Promise.all([
      ctx.db.query("importJobRows").withIndex("by_job", (q) => q.eq("importJobId", args.jobId)).collect(),
      ctx.db.query("chartOfAccounts").withIndex("by_company", (q) => q.eq("companyId", args.companyId)).collect(),
      ctx.db.query("cannabisLocations").withIndex("by_company", (q) => q.eq("companyId", args.companyId)).collect(),
      ctx.db.query("counterparties").withIndex("by_company", (q) => q.eq("companyId", args.companyId)).collect(),
    ]);

    const accountIdsByCode = new Map(accounts.map((account) => [account.code, account._id]));
    const locationIdsByName = new Map(locations.map((location) => [location.name, location._id]));
    const counterpartiesByName = new Map(counterparties.map((counterparty) => [counterparty.name, counterparty._id]));

    let promotedCount = 0;
    let skippedCount = 0;

    for (const row of rows.sort((a, b) => a.rowNumber - b.rowNumber)) {
      if (row.status === "error" || row.promotedTransactionId) {
        skippedCount += 1;
        continue;
      }

      const debitAccountId = accountIdsByCode.get(row.suggestedDebitAccountCode);
      const creditAccountId = accountIdsByCode.get(row.suggestedCreditAccountCode);
      if (!debitAccountId || !creditAccountId) {
        await ctx.db.patch(row._id, {
          status: "error",
          validationIssues: dedupeStrings([...row.validationIssues, "Suggested chart of accounts mapping is no longer available"]),
        });
        skippedCount += 1;
        continue;
      }

      const transactionExternalRef = `import-row:${job._id}:${row.rowKey}`;
      const existingTransaction = (
        await ctx.db.query("transactions").withIndex("by_company", (q) => q.eq("companyId", args.companyId)).collect()
      ).find((transaction) => transaction.externalRef === transactionExternalRef);
      if (existingTransaction) {
        await ctx.db.patch(row._id, {
          promotedTransactionId: existingTransaction._id,
          promotedAt: row.promotedAt ?? Date.now(),
        });
        skippedCount += 1;
        continue;
      }

      const description = row.description || row.reference || row.rowKey;
      let counterpartyId = counterpartiesByName.get(description);
      if (!counterpartyId) {
        counterpartyId = await ctx.db.insert("counterparties", {
          companyId: args.companyId,
          name: description,
          type: job.sourceSystem.toLowerCase().includes("bank") ? "bank" : "vendor",
          externalRef: `import-payee:${description}`,
        });
        counterpartiesByName.set(description, counterpartyId);
      }

      const amount = normalizeAmount(row.amount ?? Math.max(row.debit ?? 0, row.credit ?? 0));
      if (amount <= 0) {
        await ctx.db.patch(row._id, {
          status: "error",
          validationIssues: dedupeStrings([...row.validationIssues, "Row could not be promoted because no balanced amount was derived"]),
        });
        skippedCount += 1;
        continue;
      }

      const transactionId = await ctx.db.insert("transactions", {
        companyId: args.companyId,
        periodId: job.periodId,
        locationId: row.locationName ? locationIdsByName.get(row.locationName) : undefined,
        importJobId: job._id,
        importRowId: row._id,
        transactionDate: row.transactionDate ?? new Date(job.uploadedAt).toISOString().slice(0, 10),
        postedDate: row.postedDate ?? row.transactionDate ?? new Date(job.uploadedAt).toISOString().slice(0, 10),
        source: "csv_import",
        sourceLabel: `${job.sourceSystem} import`,
        memo: row.memo ?? description,
        status: row.status === "ready" ? "draft" : "needs_review",
        workflowStatus: row.status === "ready" ? "ready_to_post" : "in_review",
        reviewState: row.status === "ready" ? "ready" : "needs_mapping",
        counterpartyId,
        externalRef: transactionExternalRef,
        reference: row.reference,
        amount,
        direction: (row.amount ?? 0) >= 0 ? "inflow" : "outflow",
        activity: job.sourceSystem.toLowerCase().includes("payroll") ? "manufacturing" : "admin",
        journalHint: row.validationIssues.length > 0 ? row.validationIssues.join("; ") : `Promoted from import job ${job.sourceFileName}.`,
        readyForManualEntry: false,
        needsReceipt: row.status === "warning",
      });

      const debit = normalizeAmount(row.debit ?? amount);
      const credit = normalizeAmount(row.credit ?? amount);
      await ctx.db.insert("transactionLines", {
        transactionId,
        accountId: debitAccountId,
        debit,
        locationId: row.locationName ? locationIdsByName.get(row.locationName) : undefined,
        memo: `Promoted debit leg for ${row.reference}`,
      });
      await ctx.db.insert("transactionLines", {
        transactionId,
        accountId: creditAccountId,
        credit,
        locationId: row.locationName ? locationIdsByName.get(row.locationName) : undefined,
        memo: `Promoted credit leg for ${row.reference}`,
      });

      await ctx.db.patch(row._id, {
        promotedTransactionId: transactionId,
        promotedAt: Date.now(),
      });
      promotedCount += 1;
    }

    const refreshedRows = await ctx.db.query("importJobRows").withIndex("by_job", (q) => q.eq("importJobId", args.jobId)).collect();
    const unpromotedEligibleCount = refreshedRows.filter((row) => row.status !== "error" && !row.promotedTransactionId).length;
    const blockedCount = refreshedRows.filter((row) => row.status === "error").length;
    const nextStatus = promotedCount === 0
      ? blockedCount > 0
        ? "mapped"
        : job.status
      : unpromotedEligibleCount === 0
        ? blockedCount > 0
          ? "partially_promoted"
          : "promoted"
        : "partially_promoted";

    await ctx.db.patch(job._id, {
      promotedRowCount: refreshedRows.filter((row) => Boolean(row.promotedTransactionId)).length,
      status: nextStatus,
      validationSummary: {
        ready: refreshedRows.filter((row) => row.status === "ready").length,
        warning: refreshedRows.filter((row) => row.status === "warning").length,
        error: refreshedRows.filter((row) => row.status === "error").length,
      },
    });

    return {
      promotedCount,
      skippedCount,
      status: nextStatus,
    };
  },
});
