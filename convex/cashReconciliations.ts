import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

const reconciliationStatus = v.union(v.literal("open"), v.literal("investigating"), v.literal("resolved"));
const workflowStatus = v.union(v.literal("balanced"), v.literal("investigating"), v.literal("exception"), v.literal("ready_to_post"));
const accountType = v.union(v.literal("drawer"), v.literal("vault"), v.literal("bank_clearing"), v.literal("bank"));
const actionStatus = v.union(v.literal("done"), v.literal("in_progress"), v.literal("todo"));

const reconciliationShape = {
  companyId: v.id("cannabisCompanies"),
  periodId: v.optional(v.id("reportingPeriods")),
  cashAccountId: v.id("cashAccounts"),
  expectedAmount: v.number(),
  actualAmount: v.number(),
  varianceAmount: v.number(),
  status: reconciliationStatus,
  workflowStatus: v.optional(workflowStatus),
  externalRef: v.optional(v.string()),
  locationId: v.optional(v.id("cannabisLocations")),
  accountType: v.optional(accountType),
  lastCountedAt: v.optional(v.string()),
  owner: v.optional(v.string()),
  sourceContext: v.optional(v.array(v.string())),
  sourceBreakdown: v.optional(
    v.array(
      v.object({
        label: v.string(),
        source: v.string(),
        amount: v.number(),
      })
    )
  ),
  varianceDrivers: v.optional(
    v.array(
      v.object({
        title: v.string(),
        impactAmount: v.number(),
        confidenceLabel: v.string(),
        note: v.string(),
      })
    )
  ),
  investigationNotes: v.optional(v.array(v.string())),
  relatedTransactionRefs: v.optional(
    v.array(
      v.object({
        transactionRef: v.string(),
        label: v.string(),
        amount: v.number(),
        note: v.string(),
      })
    )
  ),
  nextSteps: v.optional(v.array(v.string())),
  actions: v.optional(
    v.array(
      v.object({
        title: v.string(),
        owner: v.string(),
        status: actionStatus,
      })
    )
  ),
};

export const listByCompany = queryGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.query("cashReconciliations").withIndex("by_company", (q) => q.eq("companyId", args.companyId)).collect();
  },
});

export const getByExternalRef = queryGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
    externalRef: v.string(),
  },
  handler: async (ctx, args) => {
    return (
      await ctx.db.query("cashReconciliations").withIndex("by_company", (q) => q.eq("companyId", args.companyId)).collect()
    ).find((reconciliation) => reconciliation.externalRef === args.externalRef) ?? null;
  },
});

export const upsert = mutationGeneric({
  args: reconciliationShape,
  handler: async (ctx, args) => {
    const existing = args.externalRef
      ? (
          await ctx.db.query("cashReconciliations").withIndex("by_company", (q) => q.eq("companyId", args.companyId)).collect()
        ).find((reconciliation) => reconciliation.externalRef === args.externalRef) ?? null
      : null;

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("cashReconciliations", args);
  },
});
