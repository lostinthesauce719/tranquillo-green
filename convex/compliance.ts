import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

const licenseStatus = v.union(v.literal("active"), v.literal("pending"), v.literal("expired"));
const filingStatus = v.union(v.literal("pending"), v.literal("ready"), v.literal("filed"), v.literal("late"));
const alertCategory = v.union(v.literal("license"), v.literal("tax"), v.literal("reconciliation"), v.literal("allocation"));
const alertSeverity = v.union(v.literal("info"), v.literal("warning"), v.literal("critical"));

/* ─── Licenses ─── */

export const getLicenses = queryGeneric({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cannabisLicenses")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();
  },
});

export const upsertLicense = mutationGeneric({
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

export const getTaxFilings = queryGeneric({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("taxFilings")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();
  },
});

export const getUpcomingFilings = queryGeneric({
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

export const upsertTaxFiling = mutationGeneric({
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

export const updateFilingStatus = mutationGeneric({
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

export const getAlerts = queryGeneric({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("complianceAlerts")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();
  },
});

export const getUnresolvedAlerts = queryGeneric({
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

export const createAlert = mutationGeneric({
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

export const resolveAlert = mutationGeneric({
  args: { alertId: v.id("complianceAlerts") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.alertId, { resolvedAt: Date.now() });
    return await ctx.db.get(args.alertId);
  },
});

/* ─── Compliance Documents ─── */

export const getDocuments = queryGeneric({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("complianceDocuments")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();
  },
});
