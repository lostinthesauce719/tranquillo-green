import { v } from "convex/values";
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
  },
  async (ctx: any, args: any, identity: any) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);

    const generatedAt = Date.now();
    const runId = await ctx.db.insert("exportPacketRuns", {
      ...args,
      generatedAt,
    });

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
