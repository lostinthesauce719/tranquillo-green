import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { AuthenticatedContext, CustomCtx, createEnrichedContext, requireIdentity, requireCurrentUserRecord, resolveRoleFromIdentityClaims } from "./lib/withAuth";

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
  handler: async (baseCtx: AuthenticatedContext, args) => {
    const ctx = await createEnrichedContext(baseCtx);

    if (ctx.session.companyId !== (args.companyId as unknown as string)) {
      throw new Error("Unauthorized: Cannot upsert QBO tokens for another company.");
    }

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
  handler: async (baseCtx: AuthenticatedContext, args) => {
    const ctx = await createEnrichedContext(baseCtx);

    if (ctx.session.companyId !== (args.companyId as unknown as string)) {
      throw new Error("Unauthorized: Cannot get QBO status for another company.");
    }

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
 * Disconnect QuickBooks integration for a company.
 */
export const disconnectQBO = mutationGeneric({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (baseCtx: AuthenticatedContext, args) => {
    const ctx = await createEnrichedContext(baseCtx);

    if (ctx.session.companyId !== (args.companyId as unknown as string)) {
      throw new Error("Unauthorized: Cannot disconnect QBO for another company.");
    }

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

// Add a new internal action to get tokens, only callable from the server
export const getQBOTokensInternal = mutationGeneric({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (baseCtx: AuthenticatedContext, args) => {
    const ctx = await createEnrichedContext(baseCtx);

    if (ctx.session.companyId !== (args.companyId as unknown as string)) {
      throw new Error("Unauthorized: Internal QBO token access for another company.");
    }
    // Add more granular role check if needed, e.g., if (ctx.session.role !== "system")

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
