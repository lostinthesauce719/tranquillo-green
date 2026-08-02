// SECURITY / COMPLIANCE: these functions were declared with the raw `query` and
// `mutation` builders, making them callable with NO authentication at all.
// `recordElection` writes an IRC 471(c) election — a binding tax position that
// must be made on a timely filed original return and applied consistently.
// Recording it anonymously is both an access-control hole and an audit-trail
// gap. authQuery/authMutation require a signed-in identity and enforce that the
// caller belongs to the companyId being written.
import { authMutation, authQuery } from "./lib/withAuth";
import { v } from "convex/values";

/**
 * IRC Section 471(c) Election Management
 * 
 * Tracks small business inventory method elections for cannabis operators.
 * The election must be made on a timely filed original return and applied
 * consistently once elected.
 */

// ─── QUERIES ────────────────────────────────────────────────────────

/**
 * Get the current 471(c) election for a company.
 */
export const getElection = authQuery({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, args) => {
    const election = await ctx.db
      .query("section471cElections")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .order("desc")
      .first();
    
    return election ?? null;
  },
});

/**
 * Test 471(c) eligibility based on prior 3 years of gross receipts.
 * Returns eligibility status without saving.
 */
export const testEligibility = authQuery({
  args: {
    companyId: v.id("cannabisCompanies"),
    priorYear1: v.number(),
    priorYear1Receipts: v.number(),
    priorYear2: v.number(),
    priorYear2Receipts: v.number(),
    priorYear3: v.number(),
    priorYear3Receipts: v.number(),
  },
  handler: async (ctx, args) => {
    const totalReceipts = args.priorYear1Receipts + args.priorYear2Receipts + args.priorYear3Receipts;
    const averageReceipts = totalReceipts / 3;
    const threshold = 25_000_000;
    
    return {
      eligible: averageReceipts <= threshold,
      averageGrossReceipts: averageReceipts,
      threshold,
      priorYears: [
        { taxYear: args.priorYear1, grossReceipts: args.priorYear1Receipts },
        { taxYear: args.priorYear2, grossReceipts: args.priorYear2Receipts },
        { taxYear: args.priorYear3, grossReceipts: args.priorYear3Receipts },
      ],
    };
  },
});

// ─── MUTATIONS ──────────────────────────────────────────────────────

/**
 * Record a new 471(c) election.
 */
export const recordElection = authMutation({
  args: {
    companyId: v.id("cannabisCompanies"),
    taxYear: v.number(),
    priorYear1: v.number(),
    priorYear1Receipts: v.number(),
    priorYear2: v.number(),
    priorYear2Receipts: v.number(),
    priorYear3: v.number(),
    priorYear3Receipts: v.number(),
    notes: v.optional(v.string()),
    electedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const totalReceipts = args.priorYear1Receipts + args.priorYear2Receipts + args.priorYear3Receipts;
    const averageReceipts = totalReceipts / 3;
    const threshold = 25_000_000;
    const eligible = averageReceipts <= threshold;
    
    // Check for existing election
    const existing = await ctx.db
      .query("section471cElections")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .first();
    
    if (existing && existing.elected) {
      throw new Error("Company already has an active 471(c) election. Method changes require IRS consent (Form 3115).");
    }
    
    if (!eligible) {
      throw new Error(`Company is not eligible for 471(c). Average gross receipts (${averageReceipts.toLocaleString()}) exceed the $25M threshold.`);
    }
    
    const electionId = await ctx.db.insert("section471cElections", {
      companyId: args.companyId,
      elected: true,
      electionDate: new Date().toISOString().split("T")[0],
      taxYear: args.taxYear,
      priorYear1: args.priorYear1,
      priorYear1Receipts: args.priorYear1Receipts,
      priorYear2: args.priorYear2,
      priorYear2Receipts: args.priorYear2Receipts,
      priorYear3: args.priorYear3,
      priorYear3Receipts: args.priorYear3Receipts,
      averageGrossReceipts: averageReceipts,
      eligible: true,
      notes: args.notes,
      electedBy: args.electedBy,
    });
    
    // Set the company-level election flag
    await ctx.db.patch(args.companyId, {
      section471cElected: true,
      section471cElectionId: electionId,
    });

    return { electionId, eligible, averageGrossReceipts: averageReceipts };
  },
});

/**
 * Update election notes (e.g., to record CPA review or audit notes).
 */
export const updateElectionNotes = authMutation({
  args: {
    electionId: v.id("section471cElections"),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.electionId, { notes: args.notes });
    return { updated: true };
  },
});
