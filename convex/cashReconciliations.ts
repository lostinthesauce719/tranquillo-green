import { v } from "convex/values";
import { authQuery, authMutation, requireCompanyAccessById } from "./lib/withAuth";

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

function normalizeAmount(value: number) {
  return Number(value.toFixed(2));
}

function validateReconciliationArgs(args: {
  companyId: string;
  periodId?: string;
  cashAccountId: string;
  expectedAmount: number;
  actualAmount: number;
  varianceAmount: number;
  sourceBreakdown?: { amount: number }[];
}) {
  const expectedVariance = normalizeAmount(args.actualAmount - args.expectedAmount);
  if (normalizeAmount(args.varianceAmount) !== expectedVariance) {
    throw new Error("Reconciliation variance must equal actual minus expected.");
  }
  if (args.sourceBreakdown && args.sourceBreakdown.length > 0) {
    const breakdownTotal = normalizeAmount(args.sourceBreakdown.reduce((sum, item) => sum + item.amount, 0));
    const expectedTotal = normalizeAmount(args.expectedAmount + args.actualAmount);
    if (breakdownTotal !== expectedTotal) {
      throw new Error("Reconciliation source breakdown must tie to expected plus actual balances.");
    }
  }
}

export const listByCompany = authQuery(
  {
    companyId: v.id("cannabisCompanies"),
  },
  async (ctx: any, args: any, identity: any) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);

    return await ctx.db.query("cashReconciliations").withIndex("by_company", (q: any) => q.eq("companyId", args.companyId)).collect();
  },
);

export const getByExternalRef = authQuery(
  {
    companyId: v.id("cannabisCompanies"),
    externalRef: v.string(),
  },
  async (ctx: any, args: any, identity: any) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);

    // Use by_company_external_ref index instead of collect+find
    return (
      await ctx.db
        .query("cashReconciliations")
        .withIndex("by_company_external_ref", (q: any) =>
          q.eq("companyId", args.companyId).eq("externalRef", args.externalRef)
        )
        .unique()
    ) ?? null;
  },
);

export const upsert = authMutation(
  reconciliationShape,
  async (ctx: any, args: any, identity: any) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);

    validateReconciliationArgs(args);

    const cashAccount = await ctx.db.get(args.cashAccountId);
    if (!cashAccount || cashAccount.companyId !== args.companyId) {
      throw new Error("Reconciliation cash account must belong to the same company.");
    }
    if (args.periodId) {
      const period = await ctx.db.get(args.periodId);
      if (!period || period.companyId !== args.companyId) {
        throw new Error("Reconciliation period must belong to the same company.");
      }
    }
    if (args.locationId) {
      const location = await ctx.db.get(args.locationId);
      if (!location || location.companyId !== args.companyId) {
        throw new Error("Reconciliation location must belong to the same company.");
      }
    }

    // Use by_company_external_ref index instead of collect+find
    const existing = args.externalRef
      ? (await ctx.db
          .query("cashReconciliations")
          .withIndex("by_company_external_ref", (q: any) =>
            q.eq("companyId", args.companyId).eq("externalRef", args.externalRef)
          )
          .unique()) ?? null
      : null;

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("cashReconciliations", args);
  },
);

export const updateWorkflowState = authMutation(
  {
    reconciliationId: v.id("cashReconciliations"),
    status: reconciliationStatus,
    workflowStatus: workflowStatus,
    sourceContext: v.array(v.string()),
    investigationNotes: v.array(v.string()),
    nextSteps: v.array(v.string()),
    actions: v.array(
      v.object({
        title: v.string(),
        owner: v.string(),
        status: actionStatus,
      })
    ),
  },
  async (ctx: any, args: any, identity: any) => {
    const reconciliation = await ctx.db.get(args.reconciliationId);
    if (!reconciliation) {
      throw new Error("Reconciliation not found.");
    }
    await requireCompanyAccessById(ctx, identity, reconciliation.companyId);

    await ctx.db.patch(args.reconciliationId, {
      status: args.status,
      workflowStatus: args.workflowStatus,
      sourceContext: args.sourceContext,
      investigationNotes: args.investigationNotes,
      nextSteps: args.nextSteps,
      actions: args.actions,
    });

    return await ctx.db.get(args.reconciliationId);
  },
);
