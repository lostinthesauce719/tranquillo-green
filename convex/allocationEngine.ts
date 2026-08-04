import { v } from "convex/values";
import { authQuery, authMutation, requireCompanyAccessById } from "./lib/withAuth";

function normalizeAmount(value: number): number {
  return Number(value.toFixed(2));
}

// ---------------------------------------------------------------------------
// 280E allocation helpers
// ---------------------------------------------------------------------------

type AllocationMethod =
  | "square_footage"
  | "labor"
  | "custom"
  | "flat_percentage"
  | "flat_amount";

/** IRC 471 inventory classification. See schema.ts cannabisCompanies. */
export type InventoryRole = "reseller" | "producer";

/**
 * Methods that capitalise indirect production costs. Under Reg. 1.471-3(b) a
 * reseller is generally limited to invoice price plus costs of acquiring
 * possession, so applying these to a reseller asserts a contested position.
 */
const PRODUCTION_BASIS_METHODS: AllocationMethod[] = [
  "square_footage",
  "labor",
];

interface AllocationInput {
  totalCost: number;
  method: AllocationMethod;
  basisDetails: Record<string, number>;
}

interface AllocationResult {
  deductibleAmount: number;
  nondeductibleAmount: number;
  ratio: number;
  confidence: number;
  basisType: string;
}

/** A condition the operator must explicitly acknowledge before handoff. */
export interface AllocationWarning {
  code: string;
  message: string;
}

/**
 * Refuses arithmetic that does not reconcile. There is no override for this —
 * an allocation that creates or destroys value is a bug, never a tax position.
 * Contestable *positions* are handled separately, via warnings that require
 * acknowledgement at submission or CPA handoff.
 */
export function assertAllocationIntegrity(
  totalCost: number,
  deductible: number,
  nondeductible: number
): void {
  if (!Number.isFinite(deductible) || !Number.isFinite(nondeductible)) {
    throw new Error(
      "Allocation produced a non-finite amount. Check the basis values."
    );
  }
  if (deductible < 0 || nondeductible < 0) {
    throw new Error(
      `Allocation produced a negative amount (COGS ${deductible}, non-COGS ${nondeductible}). ` +
        "Basis values must not be negative."
    );
  }
  // Allow a cent of tolerance for rounding on repeating decimals.
  const drift = Math.abs(deductible + nondeductible - totalCost);
  if (drift > 0.01) {
    throw new Error(
      `Allocation does not reconcile: ${deductible} + ${nondeductible} != ${totalCost} ` +
        `(off by ${normalizeAmount(drift)}). Refusing to record it.`
    );
  }
}

/**
 * Positions that are permitted but contestable, and must be acknowledged before
 * a filing or CPA handoff. Returning them rather than throwing is deliberate:
 * the operator may have a defensible reason, but it must be a conscious choice.
 */
export function collectAllocationWarnings(params: {
  method: AllocationMethod;
  inventoryRole?: InventoryRole;
  operatorType?: string;
  confidence: number;
}): AllocationWarning[] {
  const warnings: AllocationWarning[] = [];
  const { method, inventoryRole, confidence } = params;

  if (!inventoryRole) {
    warnings.push({
      code: "inventory_role_unset",
      message:
        "This entity has no IRC 471 inventory classification. Whether indirect " +
        "costs may be capitalised depends on reseller vs producer status.",
    });
  }

  if (inventoryRole === "reseller" && PRODUCTION_BASIS_METHODS.includes(method)) {
    warnings.push({
      code: "reseller_production_basis",
      message:
        `This entity is classified as a reseller, but "${method}" capitalises ` +
        "indirect production costs. Reg. 1.471-3(b) generally limits a reseller " +
        "to invoice price plus costs of acquiring possession. This position was " +
        "denied in Harborside.",
    });
  }

  if (method === "flat_percentage" || method === "flat_amount") {
    warnings.push({
      code: "unmeasured_basis",
      message:
        "A flat figure has no measured basis behind it. CCA 201504011 and " +
        "Reg. 1.471-11 contemplate measured allocations such as direct labour " +
        "or machine hours. Retain documentation supporting this figure.",
    });
  }

  if (confidence < 70) {
    warnings.push({
      code: "low_confidence",
      message: `Allocation confidence is ${confidence}. Review before filing.`,
    });
  }

  return warnings;
}

/**
 * Core 280E allocation math.
 *
 * Under IRC 280E a cannabis business may only deduct costs that are
 * attributable to COGS (cost of goods sold).  Every other cost is
 * nondeductible.  We split a cost between deductible (COGS-eligible) and
 * nondeductible based on the selected allocation method.
 *
 * Methods:
 *   square_footage  – ratio of cultivation / production sq footage to total
 *   labor           – ratio of cultivation / production labor hours to total
 *   custom          – user-supplied ratio via basisDetails.ratio (0-1)
 */
function computeAllocation(input: AllocationInput): AllocationResult {
  const { totalCost, method, basisDetails } = input;

  let ratio = 0;
  let confidence = 50; // base confidence – adjusted per method
  let basisType = method;

  switch (method) {
    case "square_footage": {
      const productionSqFt = basisDetails.productionSqFt ?? 0;
      const totalSqFt = basisDetails.totalSqFt ?? 0;
      if (totalSqFt <= 0) {
        throw new Error("totalSqFt must be greater than zero for square footage allocation.");
      }
      if (productionSqFt < 0) {
        throw new Error("productionSqFt must not be negative.");
      }
      // Clamp both ends. Previously Math.min(x, 1) only, so a negative basis
      // produced negative COGS and a nondeductible amount exceeding the cost.
      ratio = Math.max(0, Math.min(productionSqFt / totalSqFt, 1));
      confidence = 85; // objective, verifiable metric
      basisType = "square_footage";
      break;
    }
    case "labor": {
      const productionHours = basisDetails.productionHours ?? 0;
      const totalHours = basisDetails.totalHours ?? 0;
      if (totalHours <= 0) {
        throw new Error("totalHours must be greater than zero for labor allocation.");
      }
      if (productionHours < 0) {
        throw new Error("productionHours must not be negative.");
      }
      ratio = Math.max(0, Math.min(productionHours / totalHours, 1));
      confidence = 80; // reasonable but depends on time-keeping accuracy
      basisType = "labor";
      break;
    }
    case "custom": {
      const customRatio = basisDetails.ratio ?? 0;
      if (customRatio < 0 || customRatio > 1) {
        throw new Error("Custom ratio must be between 0 and 1.");
      }
      ratio = customRatio;
      confidence = 55; // less defensible without documentation
      basisType = "custom";
      break;
    }
    case "flat_percentage": {
      // A fixed percentage of every cost, expressed 0..1 (or 0..100 for
      // convenience — both accepted, normalised here).
      const raw = basisDetails.percentage ?? basisDetails.ratio ?? 0;
      const pct = raw > 1 ? raw / 100 : raw;
      if (pct < 0 || pct > 1) {
        throw new Error("Flat percentage must be between 0 and 100.");
      }
      ratio = pct;
      // Deliberately low: a flat percentage has no measured basis, which is
      // exactly what an examiner asks for.
      confidence = 40;
      basisType = "flat_percentage";
      break;
    }
    case "flat_amount": {
      // A fixed dollar amount treated as COGS-eligible, capped at the cost so
      // the allocation cannot exceed what was actually spent.
      const amount = basisDetails.amount ?? 0;
      if (amount < 0) {
        throw new Error("Flat amount must not be negative.");
      }
      if (totalCost <= 0) {
        throw new Error("Cannot apply a flat amount to a zero cost.");
      }
      ratio = Math.max(0, Math.min(amount / totalCost, 1));
      confidence = 40;
      basisType = "flat_amount";
      break;
    }
    default:
      throw new Error(`Unsupported allocation method: ${method}`);
  }

  const deductibleAmount = normalizeAmount(totalCost * ratio);
  const nondeductibleAmount = normalizeAmount(totalCost - deductibleAmount);

  // Refuse arithmetic that does not reconcile. No override: this is a bug
  // condition, not a tax position.
  assertAllocationIntegrity(totalCost, deductibleAmount, nondeductibleAmount);

  return { deductibleAmount, nondeductibleAmount, ratio, confidence, basisType };
}

/**
 * Classify a transaction's lines into COGS-eligible vs non-COGS buckets.
 * Returns the total COGS-eligible cost and the total non-COGS cost.
 */
async function classifyTransactionLines(
  ctx: any,
  transactionId: string,
): Promise<{ cogsCost: number; nonCogsCost: number; lineDetails: Array<{ accountId: string; accountCode: string; accountName: string; taxTreatment: string; amount: number }> }> {
  const lines = await ctx.db
    .query("transactionLines")
    .withIndex("by_transaction", (q: any) => q.eq("transactionId", transactionId))
    .collect();

  let cogsCost = 0;
  let nonCogsCost = 0;
  const lineDetails: Array<{ accountId: string; accountCode: string; accountName: string; taxTreatment: string; amount: number }> = [];

  for (const line of lines) {
    const account = await ctx.db.get(line.accountId);
    if (!account) continue;

    const amount = Math.abs((line.debit ?? 0) - (line.credit ?? 0));
    const taxTreatment = account.taxTreatment as string;

    if (taxTreatment === "cogs") {
      cogsCost += amount;
    } else {
      nonCogsCost += amount;
    }

    lineDetails.push({
      accountId: line.accountId,
      accountCode: account.code,
      accountName: account.name,
      taxTreatment,
      amount: normalizeAmount(amount),
    });
  }

  return { cogsCost: normalizeAmount(cogsCost), nonCogsCost: normalizeAmount(nonCogsCost), lineDetails };
}

// ---------------------------------------------------------------------------
// 1. allocateTransaction
// ---------------------------------------------------------------------------

export const allocateTransaction = authMutation(
  {
    companyId: v.id("cannabisCompanies"),
    transactionId: v.id("transactions"),
    policyId: v.id("allocationPolicies"),
    basisDetails: v.optional(v.record(v.string(), v.number())),
  },
  async (ctx: any, args: any, identity: any) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);

    // Verify transaction belongs to company
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction || transaction.companyId !== args.companyId) {
      throw new Error("Transaction not found or does not belong to this company.");
    }

    // Verify policy belongs to company and is active
    const policy = await ctx.db.get(args.policyId);
    if (!policy || policy.companyId !== args.companyId) {
      throw new Error("Allocation policy not found or does not belong to this company.");
    }
    if (policy.status !== "active") {
      throw new Error("Allocation policy is not active.");
    }

    // Classify transaction lines
    const { cogsCost, nonCogsCost, lineDetails } = await classifyTransactionLines(ctx, args.transactionId);
    const totalCost = normalizeAmount(cogsCost + nonCogsCost);

    if (totalCost <= 0) {
      throw new Error("Transaction has zero cost – nothing to allocate.");
    }

    // Use provided basisDetails or fall back to policy defaults
    const basisDetails = args.basisDetails ?? {};

    // Compute allocation on the COGS-eligible portion
    const allocation = computeAllocation({
      totalCost: cogsCost,
      method: policy.method as AllocationMethod,
      basisDetails,
    });

    // The nondeductible portion = non-COGS costs + the non-allocated slice of COGS
    const totalDeductible = allocation.deductibleAmount;
    const totalNondeductible = normalizeAmount(nonCogsCost + allocation.nondeductibleAmount);

    // Whole-transaction reconciliation, not just the COGS slice.
    assertAllocationIntegrity(totalCost, totalDeductible, totalNondeductible);

    // Contestable positions. These do not block recording the allocation, but
    // they must be acknowledged before a filing or CPA handoff.
    const company = await ctx.db.get(args.companyId);
    const warnings = collectAllocationWarnings({
      method: policy.method as AllocationMethod,
      inventoryRole: company?.inventoryRole,
      operatorType: company?.operatorType,
      confidence: allocation.confidence,
    });

    // Determine review status: low confidence, large amounts, or any contestable
    // position needs human review.
    const reviewStatus =
      allocation.confidence < 70 || totalCost > 10_000 || warnings.length > 0
        ? ("needs_review" as const)
        : ("system_applied" as const);

    // Check for existing allocation for this transaction
    const existing = await ctx.db
      .query("cogsAllocations")
      .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
      .filter((q: any) => q.eq(q.field("transactionId"), args.transactionId))
      .first();

    // Persist the warnings with the allocation. Acknowledgement is deliberately
    // NOT collected here — it is required at filing or CPA handoff, so the
    // operator confirms a position at the point it leaves the building, not
    // while routinely categorising costs.
    const persisted = {
      policyId: args.policyId,
      basisType: allocation.basisType,
      deductibleAmount: totalDeductible,
      nondeductibleAmount: totalNondeductible,
      confidence: allocation.confidence,
      reviewStatus,
      warnings,
      requiresAcknowledgement: warnings.length > 0,
      acknowledgedAt: undefined as number | undefined,
      acknowledgedBy: undefined as string | undefined,
    };

    let allocationId: string;
    if (existing) {
      await ctx.db.patch(existing._id, persisted);
      allocationId = existing._id;
    } else {
      allocationId = await ctx.db.insert("cogsAllocations", {
        companyId: args.companyId,
        transactionId: args.transactionId,
        ...persisted,
      });
    }

    // Audit trail
    await ctx.db.insert("auditTrailEvents", {
      companyId: args.companyId,
      entityType: "allocation",
      entityId: allocationId,
      action: existing ? "allocation_updated" : "allocation_created",
      actor: identity.subject,
      timestamp: Date.now(),
      metadata: {
        transactionId: args.transactionId,
        policyId: args.policyId,
        method: policy.method,
        ratio: String(allocation.ratio),
        deductibleAmount: String(totalDeductible),
        nondeductibleAmount: String(totalNondeductible),
      },
    });

    return {
      allocationId,
      transactionId: args.transactionId,
      policyId: args.policyId,
      method: policy.method,
      basisType: allocation.basisType,
      ratio: allocation.ratio,
      cogsCost,
      nonCogsCost,
      deductibleAmount: totalDeductible,
      nondeductibleAmount: totalNondeductible,
      totalCost,
      confidence: allocation.confidence,
      reviewStatus,
      lineDetails,
    };
  },
);

// ---------------------------------------------------------------------------
// 2. batchAllocate
// ---------------------------------------------------------------------------

export const batchAllocate = authMutation(
  {
    companyId: v.id("cannabisCompanies"),
    policyId: v.id("allocationPolicies"),
    transactionIds: v.array(v.id("transactions")),
    basisDetails: v.optional(v.record(v.string(), v.number())),
  },
  async (ctx: any, args: any, identity: any) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);

    if (args.transactionIds.length === 0) {
      throw new Error("At least one transaction ID is required.");
    }

    const results: Array<{
      transactionId: string;
      allocationId: string | null;
      status: "allocated" | "error";
      deductibleAmount: number;
      nondeductibleAmount: number;
      error?: string;
    }> = [];

    let totalDeductible = 0;
    let totalNondeductible = 0;
    let successCount = 0;
    let errorCount = 0;

    for (const transactionId of args.transactionIds) {
      try {
        // Inline allocation logic to avoid self-call overhead
        const transaction = await ctx.db.get(transactionId);
        if (!transaction || transaction.companyId !== args.companyId) {
          results.push({
            transactionId,
            allocationId: null,
            status: "error",
            deductibleAmount: 0,
            nondeductibleAmount: 0,
            error: "Transaction not found or wrong company.",
          });
          errorCount++;
          continue;
        }

        const policy = await ctx.db.get(args.policyId);
        if (!policy || policy.companyId !== args.companyId) {
          results.push({
            transactionId,
            allocationId: null,
            status: "error",
            deductibleAmount: 0,
            nondeductibleAmount: 0,
            error: "Policy not found or wrong company.",
          });
          errorCount++;
          continue;
        }

        const { cogsCost, nonCogsCost } = await classifyTransactionLines(ctx, transactionId);
        const totalCost = normalizeAmount(cogsCost + nonCogsCost);

        if (totalCost <= 0) {
          results.push({
            transactionId,
            allocationId: null,
            status: "error",
            deductibleAmount: 0,
            nondeductibleAmount: 0,
            error: "Zero-cost transaction.",
          });
          errorCount++;
          continue;
        }

        const allocation = computeAllocation({
          totalCost: cogsCost,
          method: policy.method as AllocationMethod,
          basisDetails: args.basisDetails ?? {},
        });

        const deductible = allocation.deductibleAmount;
        const nondeductible = normalizeAmount(nonCogsCost + allocation.nondeductibleAmount);

        const reviewStatus =
          allocation.confidence < 70 || totalCost > 10_000
            ? ("needs_review" as const)
            : ("system_applied" as const);

        const existing = await ctx.db
          .query("cogsAllocations")
          .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
          .filter((q: any) => q.eq(q.field("transactionId"), transactionId))
          .first();

        let allocationId: string;
        if (existing) {
          await ctx.db.patch(existing._id, {
            policyId: args.policyId,
            basisType: allocation.basisType,
            deductibleAmount: deductible,
            nondeductibleAmount: nondeductible,
            confidence: allocation.confidence,
            reviewStatus,
          });
          allocationId = existing._id;
        } else {
          allocationId = await ctx.db.insert("cogsAllocations", {
            companyId: args.companyId,
            transactionId,
            policyId: args.policyId,
            basisType: allocation.basisType,
            deductibleAmount: deductible,
            nondeductibleAmount: nondeductible,
            confidence: allocation.confidence,
            reviewStatus,
          });
        }

        totalDeductible += deductible;
        totalNondeductible += nondeductible;
        successCount++;

        results.push({
          transactionId,
          allocationId,
          status: "allocated",
          deductibleAmount: deductible,
          nondeductibleAmount: nondeductible,
        });
      } catch (err: any) {
        results.push({
          transactionId,
          allocationId: null,
          status: "error",
          deductibleAmount: 0,
          nondeductibleAmount: 0,
          error: err.message ?? "Unknown error.",
        });
        errorCount++;
      }
    }

    // Audit trail for the batch
    await ctx.db.insert("auditTrailEvents", {
      companyId: args.companyId,
      entityType: "allocation",
      entityId: `batch:${Date.now()}`,
      action: "batch_allocation",
      actor: identity.subject,
      timestamp: Date.now(),
      metadata: {
        policyId: args.policyId,
        totalTransactions: String(args.transactionIds.length),
        successCount: String(successCount),
        errorCount: String(errorCount),
        totalDeductible: String(normalizeAmount(totalDeductible)),
        totalNondeductible: String(normalizeAmount(totalNondeductible)),
      },
    });

    return {
      totalTransactions: args.transactionIds.length,
      successCount,
      errorCount,
      totalDeductible: normalizeAmount(totalDeductible),
      totalNondeductible: normalizeAmount(totalNondeductible),
      results,
    };
  },
);

// ---------------------------------------------------------------------------
// 3. getAllocationSummary
// ---------------------------------------------------------------------------

export const getAllocationSummary = authQuery(
  {
    companyId: v.id("cannabisCompanies"),
  },
  async (ctx: any, args: any, identity: any) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);

    const allocations = await ctx.db
      .query("cogsAllocations")
      .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
      .collect();

    let totalDeductible = 0;
    let totalNondeductible = 0;
    let totalConfidence = 0;
    let systemAppliedCount = 0;
    let needsReviewCount = 0;
    let approvedCount = 0;

    // Group by period (fiscal month derived from transaction date)
    const byPeriod = new Map<
      string,
      {
        totalDeductible: number;
        totalNondeductible: number;
        count: number;
        needsReview: number;
      }
    >();

    for (const alloc of allocations) {
      totalDeductible += alloc.deductibleAmount;
      totalNondeductible += alloc.nondeductibleAmount;
      totalConfidence += alloc.confidence ?? 0;

      switch (alloc.reviewStatus) {
        case "system_applied":
          systemAppliedCount++;
          break;
        case "needs_review":
          needsReviewCount++;
          break;
        case "approved":
          approvedCount++;
          break;
      }

      // Resolve period from transaction date
      if (alloc.transactionId) {
        const txn = await ctx.db.get(alloc.transactionId);
        if (txn?.transactionDate) {
          const periodKey = txn.transactionDate.slice(0, 7); // YYYY-MM
          const bucket = byPeriod.get(periodKey) ?? {
            totalDeductible: 0,
            totalNondeductible: 0,
            count: 0,
            needsReview: 0,
          };
          bucket.totalDeductible += alloc.deductibleAmount;
          bucket.totalNondeductible += alloc.nondeductibleAmount;
          bucket.count++;
          if (alloc.reviewStatus === "needs_review") bucket.needsReview++;
          byPeriod.set(periodKey, bucket);
        }
      }
    }

    const count = allocations.length;
    const averageConfidence = count > 0 ? Math.round(totalConfidence / count) : 0;

    // Build sorted period breakdown
    const periodBreakdown = Array.from(byPeriod.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, data]) => ({
        period,
        totalDeductible: normalizeAmount(data.totalDeductible),
        totalNondeductible: normalizeAmount(data.totalNondeductible),
        allocationCount: data.count,
        needsReviewCount: data.needsReview,
      }));

    return {
      totalDeductible: normalizeAmount(totalDeductible),
      totalNondeductible: normalizeAmount(totalNondeductible),
      totalCost: normalizeAmount(totalDeductible + totalNondeductible),
      averageConfidence,
      allocationCount: count,
      systemAppliedCount,
      needsReviewCount,
      approvedCount,
      periodBreakdown,
    };
  },
);

// ---------------------------------------------------------------------------
// 4. overrideAllocation
// ---------------------------------------------------------------------------

export const overrideAllocation = authMutation(
  {
    allocationId: v.id("cogsAllocations"),
    newDeductibleAmount: v.number(),
    newNondeductibleAmount: v.number(),
    overrideReason: v.string(),
  },
  async (ctx: any, args: any, identity: any) => {
    const allocation = await ctx.db.get(args.allocationId);
    if (!allocation) {
      throw new Error("Allocation not found.");
    }

    await requireCompanyAccessById(ctx, identity, allocation.companyId);

    if (args.newDeductibleAmount < 0 || args.newNondeductibleAmount < 0) {
      throw new Error("Amounts must be zero or positive.");
    }

    const originalDeductible = allocation.deductibleAmount;
    const originalNondeductible = allocation.nondeductibleAmount;
    const newDeductible = normalizeAmount(args.newDeductibleAmount);
    const newNondeductible = normalizeAmount(args.newNondeductibleAmount);

    // Total must remain consistent
    const originalTotal = normalizeAmount(originalDeductible + originalNondeductible);
    const newTotal = normalizeAmount(newDeductible + newNondeductible);
    if (Math.abs(originalTotal - newTotal) > 0.01) {
      throw new Error(
        `Override total (${newTotal}) must equal original total (${originalTotal}). ` +
          `Adjust deductible and nondeductible amounts so their sum matches.`,
      );
    }

    // Record the override decision
    await ctx.db.insert("overrideDecisions", {
      companyId: allocation.companyId,
      allocationId: args.allocationId,
      transactionId: allocation.transactionId,
      decisionType: "override",
      actor: identity.subject,
      reason: args.overrideReason,
      fromBasis: allocation.basisType,
      toBasis: `${allocation.basisType}_overridden`,
      originalDeductibleAmount: originalDeductible,
      originalNondeductibleAmount: originalNondeductible,
      revisedDeductibleAmount: newDeductible,
      revisedNondeductibleAmount: newNondeductible,
      timestamp: Date.now(),
    });

    // Update the allocation
    await ctx.db.patch(args.allocationId, {
      deductibleAmount: newDeductible,
      nondeductibleAmount: newNondeductible,
      reviewStatus: "approved",
      confidence: 100, // human-approved = highest confidence
      basisType: `${allocation.basisType}_overridden`,
    });

    // Audit trail
    await ctx.db.insert("auditTrailEvents", {
      companyId: allocation.companyId,
      entityType: "allocation",
      entityId: args.allocationId,
      action: "allocation_overridden",
      actor: identity.subject,
      reason: args.overrideReason,
      beforeState: JSON.stringify({
        deductibleAmount: originalDeductible,
        nondeductibleAmount: originalNondeductible,
      }),
      afterState: JSON.stringify({
        deductibleAmount: newDeductible,
        nondeductibleAmount: newNondeductible,
      }),
      timestamp: Date.now(),
    });

    return {
      allocationId: args.allocationId,
      originalDeductibleAmount: originalDeductible,
      originalNondeductibleAmount: originalNondeductible,
      revisedDeductibleAmount: newDeductible,
      revisedNondeductibleAmount: newNondeductible,
      reviewStatus: "approved",
      overrideReason: args.overrideReason,
    };
  },
);

// ---------------------------------------------------------------------------
// 5. getSupportSchedule
// ---------------------------------------------------------------------------

export const getSupportSchedule = authQuery(
  {
    companyId: v.id("cannabisCompanies"),
    periodLabel: v.string(),
  },
  async (ctx: any, args: any, identity: any) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);

    // Find the reporting period
    const period = await ctx.db
      .query("reportingPeriods")
      .withIndex("by_company_label", (q: any) =>
        q.eq("companyId", args.companyId).eq("label", args.periodLabel),
      )
      .unique();

    // Gather all allocations for this company
    const allocations = await ctx.db
      .query("cogsAllocations")
      .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
      .collect();

    // Build enriched schedule rows
    const scheduleRows: Array<{
      transactionId: string;
      transactionDate: string;
      memo: string;
      accountCode: string;
      accountName: string;
      category: string;
      taxTreatment: string;
      totalAmount: number;
      allocationBasis: string;
      deductibleAmount: number;
      nondeductibleAmount: number;
      confidence: number;
      reviewStatus: string;
    }> = [];

    for (const alloc of allocations) {
      if (!alloc.transactionId) continue;

      const txn = await ctx.db.get(alloc.transactionId);
      if (!txn || txn.companyId !== args.companyId) continue;

      // Filter to period if period was resolved
      if (period) {
        const txnDate = txn.transactionDate;
        if (txnDate < period.startDate || txnDate > period.endDate) continue;
      }

      // Get the primary account from transaction lines
      const lines = await ctx.db
        .query("transactionLines")
        .withIndex("by_transaction", (q: any) => q.eq("transactionId", alloc.transactionId))
        .collect();

      // Sum up per-account
      const accountBuckets = new Map<
        string,
        { accountCode: string; accountName: string; taxTreatment: string; category: string; amount: number }
      >();

      for (const line of lines) {
        const account = await ctx.db.get(line.accountId);
        if (!account) continue;
        const amount = Math.abs((line.debit ?? 0) - (line.credit ?? 0));
        const key = account.code;
        const existing = accountBuckets.get(key);
        if (existing) {
          existing.amount += amount;
        } else {
          accountBuckets.set(key, {
            accountCode: account.code,
            accountName: account.name,
            taxTreatment: account.taxTreatment,
            category: account.category,
            amount,
          });
        }
      }

      for (const [, bucket] of Array.from(accountBuckets)) {
        // Pro-rate allocation amounts to this account line
        const txnAmount = txn.amount ?? 1;
        const lineRatio = txnAmount > 0 ? bucket.amount / txnAmount : 0;
        const deductible = normalizeAmount(alloc.deductibleAmount * lineRatio);
        const nondeductible = normalizeAmount(alloc.nondeductibleAmount * lineRatio);

        scheduleRows.push({
          transactionId: alloc.transactionId,
          transactionDate: txn.transactionDate,
          memo: txn.memo ?? txn.reference ?? "",
          accountCode: bucket.accountCode,
          accountName: bucket.accountName,
          category: bucket.category,
          taxTreatment: bucket.taxTreatment,
          totalAmount: normalizeAmount(bucket.amount),
          allocationBasis: alloc.basisType,
          deductibleAmount: deductible,
          nondeductibleAmount: nondeductible,
          confidence: alloc.confidence ?? 0,
          reviewStatus: alloc.reviewStatus,
        });
      }
    }

    // Sort by date then account code
    scheduleRows.sort(
      (a, b) => a.transactionDate.localeCompare(b.transactionDate) || a.accountCode.localeCompare(b.accountCode),
    );

    // Build summary grouped by cost category
    const categorySummary = new Map<
      string,
      { totalDeductible: number; totalNondeductible: number; count: number }
    >();

    for (const row of scheduleRows) {
      const cat = row.category;
      const existing = categorySummary.get(cat) ?? { totalDeductible: 0, totalNondeductible: 0, count: 0 };
      existing.totalDeductible += row.deductibleAmount;
      existing.totalNondeductible += row.nondeductibleAmount;
      existing.count++;
      categorySummary.set(cat, existing);
    }

    const categoryBreakdown = Array.from(categorySummary.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, data]) => ({
        category,
        transactionCount: data.count,
        totalDeductible: normalizeAmount(data.totalDeductible),
        totalNondeductible: normalizeAmount(data.totalNondeductible),
        total: normalizeAmount(data.totalDeductible + data.totalNondeductible),
      }));

    const grandTotalDeductible = normalizeAmount(scheduleRows.reduce((s, r) => s + r.deductibleAmount, 0));
    const grandTotalNondeductible = normalizeAmount(scheduleRows.reduce((s, r) => s + r.nondeductibleAmount, 0));

    return {
      periodLabel: args.periodLabel,
      periodFound: !!period,
      generatedAt: new Date().toISOString(),
      summary: {
        totalTransactions: scheduleRows.length,
        totalDeductible: grandTotalDeductible,
        totalNondeductible: grandTotalNondeductible,
        totalCost: normalizeAmount(grandTotalDeductible + grandTotalNondeductible),
      },
      categoryBreakdown,
      rows: scheduleRows,
    };
  },
);
