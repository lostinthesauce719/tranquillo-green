// @ts-nocheck
import { v } from "convex/values";
import {
  gatherBlockingWarnings,
  requireAcknowledgement,
} from "./lib/acknowledgement";
import { authMutation, authQuery, requireCompanyAccessById } from "./lib/withAuth";

const exportPacketStatus = v.union(
  v.literal("draft"),
  v.literal("generated"),
  v.literal("sent"),
  v.literal("held"),
);

const coverMemoMode = v.union(
  v.literal("controller_summary"),
  v.literal("cpa_handoff"),
  v.literal("open_items"),
);

export const listRecentByCompany = authQuery(
  {
    companyId: v.id("cannabisCompanies"),
    periodLabel: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  async (ctx: any, args: any, identity: any) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);

    const runs = args.periodLabel
      ? await ctx.db
          .query("exportPacketRuns")
          .withIndex("by_company_period", (q: any) => q.eq("companyId", args.companyId).eq("periodLabel", args.periodLabel))
          .collect()
      : await ctx.db
          .query("exportPacketRuns")
          .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
          .collect();

    return runs
      .sort((a: any, b: any) => b.generatedAt - a.generatedAt)
      .slice(0, Math.max(1, Math.min(args.limit ?? 25, 100)));
  },
);

export const createRun = authMutation(
  {
    companyId: v.id("cannabisCompanies"),
    periodId: v.optional(v.id("reportingPeriods")),
    bundleId: v.string(),
    bundleName: v.string(),
    periodLabel: v.string(),
    recipient: v.string(),
    owner: v.string(),
    status: exportPacketStatus,
    selectedFormats: v.array(v.string()),
    selectedSchedules: v.array(v.string()),
    selectedChecklistTitles: v.array(v.string()),
    coverMemoMode,
    includeDeliveryNotes: v.boolean(),
    generatedBy: v.string(),
    detail: v.string(),
    blockers: v.array(v.string()),
    /**
     * Typed confirmation for contestable tax positions. Required only when the
     * packet contains allocations carrying unacknowledged warnings — a reseller
     * using a production basis, an unmeasured flat figure, or an entity with no
     * IRC 471 classification.
     *
     * This is the point at which a position leaves the building, which is why
     * the gate sits here rather than on day-to-day categorising.
     */
    acknowledgement: v.optional(v.string()),
  },
  async (ctx: any, args: any, identity: any) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);

    // Gather every allocation in this packet that asserts a contestable
    // position and has not yet been affirmed.
    const allocations = await ctx.db
      .query("cogsAllocations")
      .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
      .collect();

    const blocking = gatherBlockingWarnings(allocations);

    // Throws AcknowledgementRequiredError, carrying the warnings and the
    // required phrase, when the operator has not typed it.
    const ack = requireAcknowledgement({
      warnings: blocking,
      acknowledgement: args.acknowledgement,
      actor: identity.subject,
    });

    const generatedAt = Date.now();
    const { acknowledgement: _typed, ...packetArgs } = args;
    const runId = await ctx.db.insert("exportPacketRuns", {
      ...packetArgs,
      generatedAt,
      // Record what was affirmed, by whom, and when — the acknowledgement is
      // part of the evidence, not merely a gate that was passed.
      ...(ack.acknowledged
        ? {
            acknowledgedAt: ack.acknowledgedAt,
            acknowledgedBy: ack.acknowledgedBy,
            acknowledgedWarnings: ack.acknowledgedWarnings,
          }
        : {}),
    });

    // Mark the allocations themselves, so a later packet does not re-prompt for
    // positions already affirmed.
    if (ack.acknowledged) {
      for (const a of allocations) {
        if (a.requiresAcknowledgement && !a.acknowledgedAt) {
          await ctx.db.patch(a._id, {
            acknowledgedAt: ack.acknowledgedAt,
            acknowledgedBy: ack.acknowledgedBy,
          });
        }
      }
    }

    await ctx.db.insert("accountingAuditEvents", {
      companyId: args.companyId,
      periodId: args.periodId,
      exportPacketRunId: runId,
      category: "export_packet",
      entityId: args.bundleId,
      entityLabel: args.bundleName,
      action: args.status === "held" ? "Held export packet" : "Generated export packet",
      detail: args.detail,
      actor: args.generatedBy,
      source: "server_action",
      occurredAt: generatedAt,
    });

    return await ctx.db.get(runId);
  },
);
