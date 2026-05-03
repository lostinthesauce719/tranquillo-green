import { authMutation, authQuery } from "./lib/withAuth";
import { v } from "convex/values";
import { AuthenticatedContext, CustomCtx, createEnrichedContext, requireIdentity, requireCurrentUserRecord, resolveRoleFromIdentityClaims } from "./lib/withAuth";

/**
 * Store or update QuickBooks integration tokens for a company.
 */
export const upsertQBOTokens = authMutation({
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
export const getQBOStatus = authQuery({
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
export const disconnectQBO = authMutation({
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
export const getQBOTokensInternal = authMutation({
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

/**
 * Store or update Metrc integration credentials for a company.
 * Supports multiple state licenses via separate records.
 */
export const upsertMetrcConfig = authMutation({
  args: {
    companyId: v.id("cannabisCompanies"),
    state: v.string(),
    integratorKey: v.string(),
    userKey: v.string(),
    licenseNumber: v.string(),
    sandbox: v.boolean(),
  },
  handler: async (baseCtx: AuthenticatedContext, args) => {
    const ctx = await createEnrichedContext(baseCtx);

    if (ctx.session.companyId !== (args.companyId as unknown as string)) {
      throw new Error("Unauthorized: Cannot save Metrc config for another company.");
    }

    const existing = await ctx.db
      .query("integrationConfigs")
      .withIndex("by_company_provider", (q: any) =>
        q.eq("companyId", args.companyId).eq("provider", "metrc")
      )
      .collect();

    // For Metrc, we might have multiple configs per state — for now, update or insert per state
    const stateConfig = existing.find((c: any) => c.metrcState === args.state);

    const now = Date.now();
    const doc = {
      companyId: args.companyId,
      provider: "metrc" as const,
      integratorKey: args.integratorKey,
      userKey: args.userKey,
      licenseNumber: args.licenseNumber,
      metrcState: args.state,
      status: "connected" as const,
      connectedAt: stateConfig?.connectedAt ?? now,
      updatedAt: now,
      // OAuth token fields left empty for Metrc
      accessToken: "",
      refreshToken: "",
      accessTokenExpiresAt: 0,
      refreshTokenExpiresAt: 0,
    };

    if (stateConfig) {
      await ctx.db.replace(stateConfig._id, doc);
      return stateConfig._id;
    } else {
      return await ctx.db.insert("integrationConfigs", doc);
    }
  },
});

/**
 * Get all Metrc configurations for a company.
 * Server-only internal use.
 */
export const getMetrcConfigsInternal = authQuery({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (baseCtx: AuthenticatedContext, args) => {
    const ctx = await createEnrichedContext(baseCtx);

    if (ctx.session.companyId !== (args.companyId as unknown as string)) {
      throw new Error("Unauthorized: Cannot access Metrc config for another company.");
    }

    const configs = await ctx.db
      .query("integrationConfigs")
      .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
      .collect();

    return configs.filter((c: any) => c.provider === "metrc" && c.status === "connected");
  },
});

/**
 * Disconnect a Metrc integration for a specific state.
 */
export const disconnectMetrc = authMutation({
  args: { companyId: v.id("cannabisCompanies"), state: v.string() },
  handler: async (baseCtx: AuthenticatedContext, args) => {
    const ctx = await createEnrichedContext(baseCtx);

    if (ctx.session.companyId !== (args.companyId as unknown as string)) {
      throw new Error("Unauthorized: Cannot disconnect Metrc for another company.");
    }

    const configs = await ctx.db
      .query("integrationConfigs")
      .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
      .collect();

    const config = configs.find((c: any) => c.provider === "metrc" && c.metrcState === args.state);
    if (config) {
      await ctx.db.delete(config._id);
    }

    return { success: true };
  },
});



// ── Square POS Integration ────────────────────────────────────────────────────

/**
 * Store or update Square OAuth tokens for a company.
 */
export const upsertSquareConfig = authMutation({
  args: {
    companyId: v.id("cannabisCompanies"),
    accessToken: v.string(),
    refreshToken: v.string(),
    accessTokenExpiresAt: v.number(),
    refreshTokenExpiresAt: v.number(),
    realmId: v.optional(v.string()), // merchantId
    locationId: v.optional(v.string()),
  },
  handler: async (baseCtx: AuthenticatedContext, args) => {
    const ctx = await createEnrichedContext(baseCtx);

    if (ctx.session.companyId !== (args.companyId as unknown as string)) {
      throw new Error("Unauthorized: Cannot upsert Square config for another company.");
    }

    const existing = await ctx.db
      .query("integrationConfigs")
      .withIndex("by_company_provider", (q: any) =>
        q.eq("companyId", args.companyId).eq("provider", "square")
      )
      .collect();

    const now = Date.now();
    const doc = {
      companyId: args.companyId,
      provider: "square" as const,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      accessTokenExpiresAt: args.accessTokenExpiresAt,
      refreshTokenExpiresAt: args.refreshTokenExpiresAt,
      realmId: args.realmId,
      posLocationId: args.locationId,
      status: "connected" as const,
      connectedAt: existing[0]?.connectedAt ?? now,
      updatedAt: now,
    };

    if (existing[0]) {
      await ctx.db.replace(existing[0]._id, doc);
      return existing[0]._id;
    } else {
      return await ctx.db.insert("integrationConfigs", doc);
    }
  },
});

/**
 * Get Square integration configurations (including tokens) for internal server use.
 */
export const getSquareConfigsInternal = authQuery({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (baseCtx: AuthenticatedContext, args) => {
    const ctx = await createEnrichedContext(baseCtx);

    if (ctx.session.companyId !== (args.companyId as unknown as string)) {
      throw new Error("Unauthorized: Cannot fetch Square configs for another company.");
    }

    const configs = await ctx.db
      .query("integrationConfigs")
      .withIndex("by_company_provider", (q: any) =>
        q.eq("companyId", args.companyId).eq("provider", "square")
      )
      .collect();

    return configs.filter((c: any) => c.status === "connected");
  },
});

/**
 * Disconnect Square integration for a company.
 */
export const disconnectSquare = authMutation({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (baseCtx: AuthenticatedContext, args) => {
    const ctx = await createEnrichedContext(baseCtx);

    if (ctx.session.companyId !== (args.companyId as unknown as string)) {
      throw new Error("Unauthorized: Cannot disconnect Square for another company.");
    }

    const configs = await ctx.db
      .query("integrationConfigs")
      .withIndex("by_company_provider", (q: any) =>
        q.eq("companyId", args.companyId).eq("provider", "square")
      )
      .collect();

    for (const config of configs) {
      await ctx.db.delete(config._id);
    }

    return { success: true };
  },
});

// ── Toast POS Integration ────────────────────────────────────────────────────

/**
 * Store or update Toast OAuth tokens for a company.
 * Toast token fields: accessToken, refreshToken, expiry fields.
 * restaurantId is stored in restaurantId key (or realmId).
 */
export const upsertToastConfig = authMutation({
  args: {
    companyId: v.id("cannabisCompanies"),
    accessToken: v.string(),
    refreshToken: v.string(),
    accessTokenExpiresAt: v.number(),
    refreshTokenExpiresAt: v.number(),
    restaurantId: v.optional(v.string()),
  },
  handler: async (baseCtx: AuthenticatedContext, args) => {
    const ctx = await createEnrichedContext(baseCtx);

    if (ctx.session.companyId !== (args.companyId as unknown as string)) {
      throw new Error("Unauthorized: Cannot upsert Toast config for another company.");
    }

    const existing = await ctx.db
      .query("integrationConfigs")
      .withIndex("by_company_provider", (q: any) =>
        q.eq("companyId", args.companyId).eq("provider", "toast")
      )
      .collect();

    const now = Date.now();
    const doc = {
      companyId: args.companyId,
      provider: "toast" as const,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      accessTokenExpiresAt: args.accessTokenExpiresAt,
      refreshTokenExpiresAt: args.refreshTokenExpiresAt,
      realmId: args.restaurantId, // canonical ID for the restaurant
      restaurantId: args.restaurantId,  // dedicated field for POS mapping
      status: "connected" as const,
      connectedAt: existing[0]?.connectedAt ?? now,
      updatedAt: now,
    };

    if (existing[0]) {
      await ctx.db.replace(existing[0]._id, doc);
      return existing[0]._id;
    } else {
      return await ctx.db.insert("integrationConfigs", doc);
    }
  },
});

export const getToastConfigsInternal = authQuery({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (baseCtx: AuthenticatedContext, args) => {
    const ctx = await createEnrichedContext(baseCtx);
    if (ctx.session.companyId !== (args.companyId as unknown as string)) {
      throw new Error("Unauthorized");
    }
    const configs = await ctx.db
      .query("integrationConfigs")
      .withIndex("by_company_provider", (q: any) =>
        q.eq("companyId", args.companyId).eq("provider", "toast")
      )
      .collect();
    return configs.filter((c: any) => c.status === "connected");
  },
});

export const disconnectToast = authMutation({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (baseCtx: AuthenticatedContext, args) => {
    const ctx = await createEnrichedContext(baseCtx);
    if (ctx.session.companyId !== (args.companyId as unknown as string)) {
      throw new Error("Unauthorized");
    }
    const configs = await ctx.db
      .query("integrationConfigs")
      .withIndex("by_company_provider", (q: any) =>
        q.eq("companyId", args.companyId).eq("provider", "toast")
      )
      .collect();
    for (const config of configs) {
      await ctx.db.delete(config._id);
    }
    return { success: true };
  },
});

// ── Treez POS Integration ────────────────────────────────────────────────────

/**
 * Store Treez API credentials (key/secret).
 */
export const upsertTreezConfig = authMutation({
  args: {
    companyId: v.id("cannabisCompanies"),
    apiKey: v.string(),
    apiSecret: v.string(),
  },
  handler: async (baseCtx: AuthenticatedContext, args) => {
    const ctx = await createEnrichedContext(baseCtx);
    if (ctx.session.companyId !== (args.companyId as unknown as string)) {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db
      .query("integrationConfigs")
      .withIndex("by_company_provider", (q: any) =>
        q.eq("companyId", args.companyId).eq("provider", "treez")
      )
      .collect();

    const now = Date.now();
    const doc = {
      companyId: args.companyId,
      provider: "treez" as const,
      accessToken: args.apiKey,      // key in generic field
      apiSecret: args.apiSecret,
      status: "connected" as const,
      connectedAt: existing[0]?.connectedAt ?? now,
      updatedAt: now,
    };

    if (existing[0]) {
      await ctx.db.replace(existing[0]._id, doc);
      return existing[0]._id;
    } else {
      return await ctx.db.insert("integrationConfigs", doc);
    }
  },
});

export const getTreezConfigsInternal = authQuery({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (baseCtx: AuthenticatedContext, args) => {
    const ctx = await createEnrichedContext(baseCtx);
    if (ctx.session.companyId !== (args.companyId as unknown as string)) {
      throw new Error("Unauthorized");
    }
    const configs = await ctx.db
      .query("integrationConfigs")
      .withIndex("by_company_provider", (q: any) =>
        q.eq("companyId", args.companyId).eq("provider", "treez")
      )
      .collect();
    return configs.filter((c: any) => c.status === "connected");
  },
});

export const disconnectTreez = authMutation({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (baseCtx: AuthenticatedContext, args) => {
    const ctx = await createEnrichedContext(baseCtx);
    if (ctx.session.companyId !== (args.companyId as unknown as string)) {
      throw new Error("Unauthorized");
    }
    const configs = await ctx.db
      .query("integrationConfigs")
      .withIndex("by_company_provider", (q: any) =>
        q.eq("companyId", args.companyId).eq("provider", "treez")
      )
      .collect();
    for (const config of configs) {
      await ctx.db.delete(config._id);
    }
    return { success: true };
  },
});
