/**
 * Sandbox environment management — Convex module
 * Mutations: createSandboxTenant, upgradeToProduction, extendSandbox
 * Queries: getSandboxStatus, listActiveSandboxes
 */

import { queryGeneric, mutationGeneric } from "convex/server";
import { v } from "convex/values";
import { authQuery, authMutation, requireIdentity } from "./lib/withAuth";

// ─── Queries ───────────────────────────────────────────────────────────────

export const getSandboxStatus = authQuery({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, args) => {
    const company = await ctx.db.get(args.companyId);
    if (!company) throw new Error("Company not found");

    const isSandbox = company.sandboxMode === true;
    const expiresAt = company.sandboxExpiresAt ? new Date(company.sandboxExpiresAt) : null;
    const now = Date.now();
    const daysRemaining = expiresAt
      ? Math.max(0, Math.round((expiresAt.getTime() - now) / (1000 * 60 * 60 * 24)))
      : null;
    const isExpired = expiresAt ? expiresAt.getTime() < now : false;

    return {
      isSandbox,
      isExpired,
      daysRemaining,
      expiresAt: expiresAt?.toISOString(),
      createdAt: company.sandboxCreatedAt
        ? new Date(company.sandboxCreatedAt).toISOString()
        : null,
    };
  },
});

export const listActiveSandboxes = authQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const companies = await ctx.db
      .query("cannabisCompanies")
      .filter(q => q.eq(q.field("sandboxMode"), true))
      .filter(q => q.or(
        q.eq(q.field("sandboxExpiresAt"), null),
        q.gt(q.field("sandboxExpiresAt"), now)
      ))
      .collect();

    return companies.map(c => ({
      id: c._id,
      name: c.name,
      slug: c.slug,
      operatorType: c.operatorType,
      sandboxCreatedAt: c.sandboxCreatedAt
        ? new Date(c.sandboxCreatedAt).toISOString()
        : null,
      sandboxExpiresAt: c.sandboxExpiresAt
        ? new Date(c.sandboxExpiresAt).toISOString()
        : null,
    }));
  },
});

// ─── Mutations ─────────────────────────────────────────────────────────────

export const createSandboxTenant = authMutation({
  args: {
    userId: v.string(),
    organizationId: v.optional(v.string()),
    businessType: v.optional(v.union(
      v.literal("dispensary"),
      v.literal("cultivator"),
      v.literal("manufacturer"),
    )),
  },
  handler: async (ctx, args) => {
    // Dynamic import of seed module (lazy)
    const { createSandboxTenant: seedFn } = await import("./seed/sandboxSeed");

    const result = await seedFn(ctx, {
      userId: args.userId,
      organizationId: args.organizationId,
      businessType: args.businessType ?? "dispensary",
    });

    return { companyId: result.companyId };
  },
});

export const upgradeToProduction = authMutation({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, args) => {
    const company = await ctx.db.get(args.companyId);
    if (!company) throw new Error("Company not found");
    if (!company.sandboxMode) throw new Error("Not a sandbox tenant");

    await ctx.db.patch(args.companyId, {
      sandboxMode: false,
      sandboxExpiresAt: null,
      status: "active",
    });

    return { success: true };
  },
});

export const extendSandbox = authMutation({
  args: {
    companyId: v.id("cannabisCompanies"),
    days: v.number(), // 7, 14, 30
  },
  handler: async (ctx, args) => {
    const company = await ctx.db.get(args.companyId);
    if (!company) throw new Error("Company not found");
    if (!company.sandboxMode) throw new Error("Not a sandbox tenant");

    const currentExpiry = company.sandboxExpiresAt
      ? new Date(company.sandboxExpiresAt).getTime()
      : Date.now();

    const newExpiry = currentExpiry + args.days * 24 * 60 * 60 * 1000;

    await ctx.db.patch(args.companyId, {
      sandboxExpiresAt: newExpiry,
    });

    return { success: true, newExpiresAt: new Date(newExpiry).toISOString() };
  },
});



/** Link a Clerk organization to a Convex company (multi-tenant team access) */
export const linkOrganization = authMutation({
  args: {
    orgId: v.string(),
    companyId: v.id("cannabisCompanies"),
    role: v.optional(v.union(v.literal("owner"), v.literal("admin"), v.literal("member"))),
  },
  handler: async (ctx, args) => {
    // Require authenticated user
    const identity = await requireIdentity(ctx);
    const clerkId = identity.subject;

    // Verify the caller is an owner of the target company
    const caller = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("clerkId"), clerkId))
      .filter(q => q.eq(q.field("companyId"), args.companyId))
      .filter(q => q.eq(q.field("role"), "owner"))
      .first();

    if (!caller) {
      throw new Error("Only company owners can link organizations");
    }

    // Prevent duplicate org-company link
    const existing = await ctx.db
      .query("organizationCompanies")
      .withIndex("by_org", q => q.eq("clerkOrgId", args.orgId))
      .first();

    if (existing) {
      throw new Error("This organization is already linked to a company");
    }

    await ctx.db.insert("organizationCompanies", {
      clerkOrgId: args.orgId,
      companyId: args.companyId,
      role: args.role ?? "owner",
      invitedAt: Date.now(),
      joinedAt: Date.now(),
    });

    return { success: true };
  },
});
