import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

const transactionSource = v.union(v.literal("manual"), v.literal("csv_import"), v.literal("metrc_import"), v.literal("pos_import"), v.literal("system"));
const transactionStatus = v.union(v.literal("draft"), v.literal("posted"), v.literal("needs_review"));
const workflowStatus = v.union(v.literal("unposted"), v.literal("in_review"), v.literal("ready_to_post"), v.literal("posted"));
const reviewState = v.union(v.literal("ready"), v.literal("needs_mapping"), v.literal("drafted"), v.literal("posted"));
const direction = v.union(v.literal("inflow"), v.literal("outflow"));
const activity = v.union(v.literal("retail"), v.literal("manufacturing"), v.literal("distribution"), v.literal("admin"));

const transactionShape = {
  companyId: v.id("cannabisCompanies"),
  periodId: v.optional(v.id("reportingPeriods")),
  locationId: v.optional(v.id("cannabisLocations")),
  transactionDate: v.string(),
  source: transactionSource,
  sourceLabel: v.optional(v.string()),
  memo: v.optional(v.string()),
  status: transactionStatus,
  workflowStatus: v.optional(workflowStatus),
  reviewState: v.optional(reviewState),
  postedDate: v.optional(v.string()),
  counterpartyId: v.optional(v.id("counterparties")),
  externalRef: v.optional(v.string()),
  reference: v.optional(v.string()),
  amount: v.optional(v.number()),
  direction: v.optional(direction),
  activity: v.optional(activity),
  journalHint: v.optional(v.string()),
  readyForManualEntry: v.optional(v.boolean()),
  needsReceipt: v.optional(v.boolean()),
};

function ensureIsoDate(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${label} must use YYYY-MM-DD format.`);
  }
}

function normalizeAmount(value: number | undefined) {
  return Number((value ?? 0).toFixed(2));
}

export const listByCompany = queryGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();
  },
});

export const getByExternalRef = queryGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
    externalRef: v.string(),
  },
  handler: async (ctx, args) => {
    return (
      await ctx.db.query("transactions").withIndex("by_company", (q) => q.eq("companyId", args.companyId)).collect()
    ).find((transaction) => transaction.externalRef === args.externalRef) ?? null;
  },
});

export const upsert = mutationGeneric({
  args: transactionShape,
  handler: async (ctx, args) => {
    ensureIsoDate(args.transactionDate, "Transaction date");
    if (args.postedDate) {
      ensureIsoDate(args.postedDate, "Posted date");
    }
    if (args.amount !== undefined && args.amount < 0) {
      throw new Error("Transaction amount must be zero or positive.");
    }
    if (args.periodId) {
      const period = await ctx.db.get(args.periodId);
      if (!period || period.companyId !== args.companyId) {
        throw new Error("Transaction period must belong to the same company.");
      }
    }
    if (args.locationId) {
      const location = await ctx.db.get(args.locationId);
      if (!location || location.companyId !== args.companyId) {
        throw new Error("Transaction location must belong to the same company.");
      }
    }
    if (args.counterpartyId) {
      const counterparty = await ctx.db.get(args.counterpartyId);
      if (!counterparty || counterparty.companyId !== args.companyId) {
        throw new Error("Transaction counterparty must belong to the same company.");
      }
    }

    const existing = args.externalRef
      ? (
          await ctx.db.query("transactions").withIndex("by_company", (q) => q.eq("companyId", args.companyId)).collect()
        ).find((transaction) => transaction.externalRef === args.externalRef) ?? null
      : null;

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("transactions", args);
  },
});

export const createManualJournal = mutationGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
    periodId: v.optional(v.id("reportingPeriods")),
    locationId: v.optional(v.id("cannabisLocations")),
    transactionDate: v.string(),
    reference: v.string(),
    memo: v.string(),
    externalRef: v.optional(v.string()),
    lines: v.array(
      v.object({
        accountId: v.id("chartOfAccounts"),
        debit: v.optional(v.number()),
        credit: v.optional(v.number()),
        memo: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    ensureIsoDate(args.transactionDate, "Transaction date");

    if (!args.memo.trim()) {
      throw new Error("Manual journal description is required.");
    }
    if (!args.reference.trim()) {
      throw new Error("Manual journal reference is required.");
    }
    if (args.lines.length < 2) {
      throw new Error("Manual journals require at least two lines.");
    }

    if (args.periodId) {
      const period = await ctx.db.get(args.periodId);
      if (!period || period.companyId !== args.companyId) {
        throw new Error("Manual journal period must belong to the same company.");
      }
      if (period.status === "closed") {
        throw new Error("Closed periods cannot accept manual journals.");
      }
    }

    if (args.locationId) {
      const location = await ctx.db.get(args.locationId);
      if (!location || location.companyId !== args.companyId) {
        throw new Error("Manual journal location must belong to the same company.");
      }
    }

    let totalDebits = 0;
    let totalCredits = 0;
    for (let index = 0; index < args.lines.length; index += 1) {
      const line = args.lines[index];
      const account = await ctx.db.get(line.accountId);
      if (!account || account.companyId !== args.companyId) {
        throw new Error(`Manual journal line ${index + 1} account must belong to the same company.`);
      }

      const debit = normalizeAmount(line.debit);
      const credit = normalizeAmount(line.credit);
      const populatedCount = Number(debit > 0) + Number(credit > 0);
      if (populatedCount !== 1) {
        throw new Error(`Manual journal line ${index + 1} must have either a debit or a credit.`);
      }

      totalDebits += debit;
      totalCredits += credit;
    }

    totalDebits = normalizeAmount(totalDebits);
    totalCredits = normalizeAmount(totalCredits);
    if (totalDebits !== totalCredits) {
      throw new Error("Manual journal debits and credits must balance.");
    }

    const externalRef = args.externalRef?.trim() || `manual:${args.reference.trim()}`;
    const existing = (
      await ctx.db.query("transactions").withIndex("by_company", (q) => q.eq("companyId", args.companyId)).collect()
    ).find((transaction) => transaction.externalRef === externalRef);

    if (existing) {
      throw new Error("A manual journal with this reference already exists.");
    }

    const transactionId = await ctx.db.insert("transactions", {
      companyId: args.companyId,
      ...(args.periodId ? { periodId: args.periodId } : {}),
      ...(args.locationId ? { locationId: args.locationId } : {}),
      transactionDate: args.transactionDate,
      postedDate: args.transactionDate,
      source: "manual",
      sourceLabel: "manual",
      memo: args.memo.trim(),
      status: "draft",
      workflowStatus: "unposted",
      reviewState: "drafted",
      reference: args.reference.trim(),
      externalRef,
      amount: totalDebits,
      direction: "outflow",
      activity: "admin",
      journalHint: "Manual journal created from the connected accounting workspace.",
      readyForManualEntry: false,
      needsReceipt: false,
    });

    for (const line of args.lines) {
      const debit = normalizeAmount(line.debit);
      const credit = normalizeAmount(line.credit);
      await ctx.db.insert("transactionLines", {
        transactionId,
        accountId: line.accountId,
        ...(debit > 0 ? { debit } : {}),
        ...(credit > 0 ? { credit } : {}),
        ...(args.locationId ? { locationId: args.locationId } : {}),
        ...(line.memo?.trim() ? { memo: line.memo.trim() } : {}),
      });
    }

    return await ctx.db.get(transactionId);
  },
});
