import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

/**
 * Store or update QuickBooks integration tokens for a company.
 */
export const upsertQBOTokens = mutationGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
    realmId: v.string(),
    accessToken: v.string(),
    refreshToken: v.string(),
    accessTokenExpiresAt: v.number(),
    refreshTokenExpiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("integrationConfigs")
      .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
      .collect();

    const qboConfig = existing.find((c: any) => c.provider === "quickbooks");

    const now = Date.now();
    const doc = {
      companyId: args.companyId,
      provider: "quickbooks" as const,
      realmId: args.realmId,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      accessTokenExpiresAt: args.accessTokenExpiresAt,
      refreshTokenExpiresAt: args.refreshTokenExpiresAt,
      status: "connected" as const,
      connectedAt: qboConfig?.connectedAt ?? now,
      updatedAt: now,
    };

    if (qboConfig) {
      await ctx.db.replace(qboConfig._id, doc);
      return qboConfig._id;
    } else {
      return await ctx.db.insert("integrationConfigs", doc);
    }
  },
});

/**
 * Get QuickBooks integration status for a company.
 * Returns connection status but never exposes tokens.
 */
export const getQBOStatus = queryGeneric({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, args) => {
    const configs = await ctx.db
      .query("integrationConfigs")
      .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
      .collect();

    const config = configs.find((c: any) => c.provider === "quickbooks");

    if (!config) {
      return { connected: false, status: "not_connected" };
    }

    return {
      connected: true,
      status: config.status,
      realmId: config.realmId,
      connectedAt: config.connectedAt,
      tokenExpiresAt: config.accessTokenExpiresAt,
      needsRefresh: config.accessTokenExpiresAt < Date.now() + 300_000,
    };
  },
});

/**
 * Get QBO tokens for server-side API calls (used by API routes).
 */
export const getQBOTokens = queryGeneric({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, args) => {
    const configs = await ctx.db
      .query("integrationConfigs")
      .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
      .collect();

    const config = configs.find((c: any) => c.provider === "quickbooks");
    if (!config) return null;

    return {
      realmId: config.realmId,
      accessToken: config.accessToken,
      refreshToken: config.refreshToken,
      accessTokenExpiresAt: config.accessTokenExpiresAt,
      refreshTokenExpiresAt: config.refreshTokenExpiresAt,
    };
  },
});

/**
 * Disconnect QuickBooks integration for a company.
 */
export const disconnectQBO = mutationGeneric({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, args) => {
    const configs = await ctx.db
      .query("integrationConfigs")
      .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
      .collect();

    const config = configs.find((c: any) => c.provider === "quickbooks");
    if (config) {
      await ctx.db.delete(config._id);
    }

    return { success: true };
  },
});
