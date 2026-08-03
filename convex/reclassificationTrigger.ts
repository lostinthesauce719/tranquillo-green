// @ts-nocheck
/**
 * Batch 471(c) reclassification for existing transactions.
 * 
 * This module provides:
 *  1. A Convex mutation that can be called from the client or a cron job
 *     to batch-reclassify all eligible transactions for a company.
 *  2. The inline reclassification logic is in lib/reclassificationInline.ts
 *     and is called directly from transaction mutations (upsert, createManualJournal)
 *     for real-time auto-triggering.
 *
 * Usage:
 *  - Real-time: automatic via transactions.upsert when status=posted
 *  - Batch: call reclassification.batchReclassifyForCompany from client or cron
 */

import { v } from "convex/values";
import { authMutation, requireCompanyAccessById } from "./lib/withAuth";
import { apply471cReclassificationInline } from "./lib/reclassificationInline";

export const batchReclassifyForCompany = authMutation(
  { companyId: v.id("cannabisCompanies") },
  async (ctx: any, args: any, identity: any) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);
    const { companyId } = args;

    // Check election is active
    const election = await ctx.db
      .query("section471cElections")
      .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
      .first();
    if (!election?.elected) {
      return { skipped: true, reason: "no_election" };
    }

    // Get all posted transactions that aren't already reclassifications
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
      .collect();

    const eligible = transactions.filter(
      (t: any) =>
        t.status === "posted" &&
        !(t.source === "system" && t.sourceLabel === "471c_reclassification")
    );

    let processed = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    for (const txn of eligible) {
      try {
        const result = await apply471cReclassificationInline(ctx, txn._id);
        if (result?.applied) {
          processed++;
        } else {
          skipped++;
        }
      } catch (e: any) {
        errors++;
        if (errorDetails.length < 5) {
          errorDetails.push(`${txn._id}: ${e.message}`);
        }
      }
    }

    // Audit trail entry
    await ctx.db.insert("auditTrailEvents", {
      companyId,
      entityType: "system",
      entityId: companyId,
      action: "batch_471c_reclassification",
      actor: "System",
      reason: `Batch 471(c) reclassification: ${processed} processed, ${skipped} skipped, ${errors} errors`,
      beforeState: JSON.stringify({ totalEligible: eligible.length }),
      afterState: JSON.stringify({ processed, skipped, errors }),
      timestamp: Date.now(),
    });

    return {
      total: eligible.length,
      processed,
      skipped,
      errors,
      errorDetails,
    };
  },
);
