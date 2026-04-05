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
