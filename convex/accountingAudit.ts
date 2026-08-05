import { v } from "convex/values";
import { authMutation, authQuery, requireCompanyAccessById, requireSameCompany, getIfSameCompany } from "./lib/withAuth";

const auditCategory = v.union(
  v.literal("reporting_period"),
  v.literal("reconciliation"),
  v.literal("export_packet"),
  v.literal("allocation_override"),
);

const auditSource = v.union(v.literal("user"), v.literal("system"), v.literal("server_action"));

export const listRecentByCompany = authQuery(
  {
    args: {
      companyId: v.id("cannabisCompanies"),
      limit: v.optional(v.number()),
      category: v.optional(auditCategory),
    },
  },
  async (ctx: any, args: any, identity: any) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);

    const events = args.category
      ? await ctx.db
          .query("accountingAuditEvents")
          .withIndex("by_company_category", (q: any) => q.eq("companyId", args.companyId).eq("category", args.category))
          .collect()
      : await ctx.db
          .query("accountingAuditEvents")
          .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
          .collect();

    return events
      .sort((a: any, b: any) => b.occurredAt - a.occurredAt)
      .slice(0, Math.max(1, Math.min(args.limit ?? 25, 100)));
  },
);

export const createEvent = authMutation(
  {
    args: {
      companyId: v.id("cannabisCompanies"),
      periodId: v.optional(v.id("reportingPeriods")),
      reconciliationId: v.optional(v.id("cashReconciliations")),
      exportPacketRunId: v.optional(v.id("exportPacketRuns")),
      category: auditCategory,
      entityId: v.string(),
      entityLabel: v.string(),
      action: v.string(),
      detail: v.string(),
      actor: v.string(),
      source: auditSource,
      occurredAt: v.optional(v.number()),
    },
  },
  async (ctx: any, args: any, identity: any) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);

    // An audit event is evidence about a period, a reconciliation or an export
    // run. Attaching one to another company's record files evidence against
    // their books — in the table whose entire value is being trustworthy.
    await requireSameCompany(ctx, args.companyId, args.periodId, "reporting period");
    await requireSameCompany(ctx, args.companyId, args.reconciliationId, "reconciliation");
    await requireSameCompany(ctx, args.companyId, args.exportPacketRunId, "export packet run");

    return await ctx.db.insert("accountingAuditEvents", {
      ...args,
      occurredAt: args.occurredAt ?? Date.now(),
    });
  },
);
