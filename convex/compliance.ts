import { authMutation, authQuery } from "./lib/withAuth";
import { v } from "convex/values";

const licenseStatus = v.union(v.literal("active"), v.literal("pending"), v.literal("expired"));
const filingStatus = v.union(v.literal("pending"), v.literal("ready"), v.literal("filed"), v.literal("late"));
const alertCategory = v.union(v.literal("license"), v.literal("tax"), v.literal("reconciliation"), v.literal("allocation"));
const alertSeverity = v.union(v.literal("info"), v.literal("warning"), v.literal("critical"));

/* ─── Licenses ─── */

export const getLicenses = authQuery({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cannabisLicenses")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();
  },
});

export const upsertLicense = authMutation({
  args: {
    companyId: v.id("cannabisCompanies"),
    locationId: v.optional(v.id("cannabisLocations")),
    licenseType: v.string(),
    state: v.string(),
    licenseNumber: v.string(),
    status: licenseStatus,
    issuedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = (
      await ctx.db
        .query("cannabisLicenses")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect()
    ).find((lic) => lic.licenseNumber === args.licenseNumber);

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("cannabisLicenses", args);
  },
});

/* ─── Tax Filings ─── */

export const getTaxFilings = authQuery({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("taxFilings")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();
  },
});

export const getUpcomingFilings = authQuery({
  args: { companyId: v.id("cannabisCompanies"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("taxFilings")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    const now = new Date().toISOString().slice(0, 10);
    const upcoming = all
      .filter((f) => f.dueDate >= now && f.status !== "filed")
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    return upcoming.slice(0, args.limit ?? 10);
  },
});

export const upsertTaxFiling = authMutation({
  args: {
    companyId: v.id("cannabisCompanies"),
    taxProfileId: v.optional(v.id("taxProfiles")),
    filingType: v.string(),
    periodLabel: v.string(),
    dueDate: v.string(),
    status: filingStatus,
  },
  handler: async (ctx, args) => {
    const existing = (
      await ctx.db
        .query("taxFilings")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect()
    ).find(
      (f) => f.filingType === args.filingType && f.periodLabel === args.periodLabel,
    );

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("taxFilings", args);
  },
});

export const updateFilingStatus = authMutation({
  args: {
    filingId: v.id("taxFilings"),
    status: filingStatus,
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.filingId, { status: args.status });
    return await ctx.db.get(args.filingId);
  },
});

/* ─── Compliance Alerts ─── */

export const getAlerts = authQuery({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("complianceAlerts")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();
  },
});

export const getUnresolvedAlerts = authQuery({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, args) => {
    return (
      await ctx.db
        .query("complianceAlerts")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect()
    ).filter((a) => !a.resolvedAt);
  },
});

export const createAlert = authMutation({
  args: {
    companyId: v.id("cannabisCompanies"),
    category: alertCategory,
    severity: alertSeverity,
    title: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("complianceAlerts", {
      ...args,
      resolvedAt: undefined,
    });
  },
});

export const resolveAlert = authMutation({
  args: { alertId: v.id("complianceAlerts") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.alertId, { resolvedAt: Date.now() });
    return await ctx.db.get(args.alertId);
  },
});

/* ─── Compliance Documents ─── */

export const getDocuments = authQuery({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("complianceDocuments")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();
  },
});

/* ─── Alert Generation Engine ─── */

async function findExistingAlert(
  ctx: any,
  companyId: string,
  sourceType: string,
  sourceId: string,
) {
  const existing = await ctx.db
    .query("complianceAlerts")
    .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
    .collect();

  return existing.find(
    (a: any) => a.sourceType === sourceType && a.sourceId === sourceId && !a.resolvedAt,
  );
}

export const generateComplianceAlerts = authMutation({
  args: {
    companyId: v.optional(v.id("cannabisCompanies")),
  },
  handler: async (ctx, args) => {
    const companies = args.companyId
      ? [{ _id: args.companyId } as any]
      : await ctx.db.query("cannabisCompanies").collect();

    let totalCreated = 0;
    let totalResolved = 0;
    const now = Date.now();

    for (const company of companies) {
      const companyId = company._id;

      /* ── 1. License expiry alerts ── */
      const licenses = await ctx.db
        .query("cannabisLicenses")
        .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
        .collect();

      for (const lic of licenses) {
        if (!lic.expiresAt) continue;

        const daysUntil = Math.floor((lic.expiresAt - now) / (1000 * 60 * 60 * 24));
        let severity: "info" | "warning" | "critical" = "info";
        let title = `License ${lic.licenseNumber} expiring soon`;
        let body = `License ${lic.licenseType} (${lic.licenseNumber}) expires on ${new Date(
          lic.expiresAt,
        ).toLocaleDateString()}.`;
        let dueAt = lic.expiresAt;

        if (daysUntil <= 0) {
          severity = "critical";
          title = "License has EXPIRED";
          body = `License ${lic.licenseType} (${lic.licenseNumber}) expired on ${new Date(
            lic.expiresAt,
          ).toLocaleDateString()}. Immediate renewal required.`;
        } else if (daysUntil <= 30) {
          severity = "critical";
          title = "License expires within 30 days";
        } else if (daysUntil <= 60) {
          severity = "warning";
          title = "License expires within 60 days";
        } else if (daysUntil <= 90) {
          severity = "info";
          title = "License expires within 90 days";
        } else {
          continue;
        }

        const existing = await findExistingAlert(ctx, companyId, "license", lic._id);

        if (!existing) {
          await ctx.db.insert("complianceAlerts", {
            companyId,
            category: "license",
            severity,
            title,
            body,
            resolvedAt: undefined,
            sourceType: "license",
            sourceId: lic._id,
            dueAt,
          });
          totalCreated++;
        } else if (
          existing.severity !== severity ||
          existing.title !== title ||
          existing.body !== body
        ) {
          await ctx.db.patch(existing._id, { severity, title, body, dueAt });
        }
      }

      /* ── 2. Tax filing deadline alerts ── */
      const filings = await ctx.db
        .query("taxFilings")
        .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
        .collect();

      for (const filing of filings) {
        if (!filing.dueDate) continue;
        if (filing.status === "filed") continue;

        const dueDate = new Date(filing.dueDate).getTime();
        const daysUntil = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24));

        let severity: "info" | "warning" | "critical" = "info";
        let title = `Tax filing "${filing.filingType}" due soon`;
        let body = `Filing ${filing.filingType} for period ${filing.periodLabel} is due on ${filing.dueDate}. Current status: ${filing.status}.`;
        let dueAt = dueDate;

        if (daysUntil <= 0) {
          severity = "critical";
          title = "Tax filing OVERDUE";
          body = `Filing ${filing.filingType} for period ${filing.periodLabel} was due on ${filing.dueDate}. Status: ${filing.status}.`;
        } else if (daysUntil <= 7) {
          severity = "critical";
          title = "Tax filing due within 7 days";
        } else if (daysUntil <= 14) {
          severity = "warning";
          title = "Tax filing due within 14 days";
        } else if (daysUntil <= 30) {
          severity = "info";
          title = "Tax filing due within 30 days";
        } else {
          continue;
        }

        const existing = await findExistingAlert(ctx, companyId, "tax_filing", filing._id);

        if (!existing) {
          await ctx.db.insert("complianceAlerts", {
            companyId,
            category: "tax",
            severity,
            title,
            body,
            resolvedAt: undefined,
            sourceType: "tax_filing",
            sourceId: filing._id,
            dueAt,
          });
          totalCreated++;
        } else if (
          existing.severity !== severity ||
          existing.title !== title ||
          existing.body !== body
        ) {
          await ctx.db.patch(existing._id, { severity, title, body, dueAt });
        }
      }

      /* ── 3. Auto-resolve stale alerts ── */
      const unresolved = await ctx.db
        .query("complianceAlerts")
        .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
        .collect();

      for (const alert of unresolved) {
        if (!alert.sourceType || !alert.sourceId) continue;
        let sourceResolved = false;

        if (alert.sourceType === "license") {
          const lic = await ctx.db.get(alert.sourceId);
          if (!lic) sourceResolved = true;
          else if (lic.status === "active" && lic.expiresAt && lic.expiresAt > now + 90 * 24 * 60 * 60 * 1000) {
            sourceResolved = true;
          }
        } else if (alert.sourceType === "tax_filing") {
          const filing = await ctx.db.get(alert.sourceId);
          if (!filing) sourceResolved = true;
          else if (filing.status === "filed") sourceResolved = true;
        }

        if (sourceResolved) {
          await ctx.db.patch(alert._id, { resolvedAt: now });
          totalResolved++;
        }
      }
    }

    return {
      companiesReviewed: companies.length,
      alertsCreated: totalCreated,
      alertsResolved: totalResolved,
    };
  },
});

export const getAlertStats = authQuery({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, args) => {
    const alerts = await ctx.db
      .query("complianceAlerts")
      .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
      .collect();

    const unresolved = alerts.filter((a) => !a.resolvedAt);

    return {
      total: unresolved.length,
      critical: unresolved.filter((a) => a.severity === "critical").length,
      warning: unresolved.filter((a) => a.severity === "warning").length,
      info: unresolved.filter((a) => a.severity === "info").length,
    };
  },
});
