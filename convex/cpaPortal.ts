import { authMutation, authQuery, requireCompanyAccessById, requireIdentity } from "./lib/withAuth";
import { v } from "convex/values";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function identityEmail(identity: any): string | null {
  const email = identity.email ?? identity.emailAddress ?? null;
  return typeof email === "string" && email.includes("@") ? normalizeEmail(email) : null;
}

/**
 * listPartners: CPA emails granted access to this company (owner view).
 */
export const listPartners = authQuery({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, args, identity) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);
    return (
      await ctx.db
        .query("cpaClientLinks")
        .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
        .collect()
    ).filter((link: any) => link.status === "active");
  },
});

/**
 * addPartner: Grant a CPA (by email) read access to this company's summary.
 */
export const addPartner = authMutation({
  args: {
    companyId: v.id("cannabisCompanies"),
    cpaEmail: v.string(),
  },
  handler: async (ctx, args, identity) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);
    const email = normalizeEmail(args.cpaEmail);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Invalid email address.");
    }
    const existing = (
      await ctx.db
        .query("cpaClientLinks")
        .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
        .collect()
    ).find((link: any) => link.cpaEmail === email);

    if (existing) {
      if (existing.status === "revoked") {
        await ctx.db.patch(existing._id, { status: "active", createdAt: Date.now() });
        return existing._id;
      }
      throw new Error("This CPA already has access.");
    }

    return await ctx.db.insert("cpaClientLinks", {
      companyId: args.companyId,
      cpaEmail: email,
      status: "active",
      addedBy: identity.name ?? identity.email ?? identity.subject,
      createdAt: Date.now(),
    });
  },
});

/**
 * revokePartner: Remove a CPA's access.
 */
export const revokePartner = authMutation({
  args: { linkId: v.id("cpaClientLinks") },
  handler: async (ctx, args, identity) => {
    const link = await ctx.db.get(args.linkId);
    if (!link) throw new Error("Link not found.");
    await requireCompanyAccessById(ctx, identity, link.companyId);
    await ctx.db.patch(args.linkId, { status: "revoked" });
    return { ok: true };
  },
});

/**
 * listMyClients: Companies that granted the calling user (by verified
 * identity email) CPA access, with live close/compliance summary stats.
 */
export const listMyClients = authQuery({
  args: {},
  handler: async (ctx, _args, identity) => {
    await requireIdentity(ctx);
    const email = identityEmail(identity);
    if (!email) return [];

    const links = (
      await ctx.db
        .query("cpaClientLinks")
        .withIndex("by_email", (q: any) => q.eq("cpaEmail", email))
        .collect()
    ).filter((link: any) => link.status === "active");

    const clients = [];
    for (const link of links) {
      const company = await ctx.db.get(link.companyId);
      if (!company) continue;

      const [alerts, periods] = await Promise.all([
        ctx.db
          .query("complianceAlerts")
          .withIndex("by_company", (q: any) => q.eq("companyId", link.companyId))
          .collect(),
        ctx.db
          .query("reportingPeriods")
          .withIndex("by_company", (q: any) => q.eq("companyId", link.companyId))
          .collect(),
      ]);

      const openAlerts = alerts.filter((a: any) => !a.resolvedAt);
      const openPeriods = periods.filter((p: any) => p.status !== "closed");

      clients.push({
        linkId: link._id,
        companyId: company._id,
        name: company.name,
        state: Array.isArray(company.states) ? company.states.join(", ") : company.state ?? "—",
        operatorType: company.operatorType,
        accountingMethod: company.defaultAccountingMethod,
        status: company.status,
        openAlerts: openAlerts.length,
        criticalAlerts: openAlerts.filter((a: any) => a.severity === "critical").length,
        openPeriods: openPeriods.length,
        totalPeriods: periods.length,
        linkedAt: link.createdAt,
      });
    }

    return clients;
  },
});
