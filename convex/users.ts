import { v } from "convex/values";
import {
  authMutation,
  authQuery,
  getUserByClerkId,
  resolveCompanyFromIdentityClaims,
  resolveRoleFromIdentityClaims,
} from "./lib/withAuth";

/**
 * getOrCreateUser: Called after Clerk login. Upserts a user row keyed by clerkId.
 * Returns the full user document.
 */
export const getOrCreateUser = authMutation(
  {},
  async (ctx: any, _args: any, identity: any) => {
    const clerkId = identity.subject;
    const email = identity.email ?? "";
    const name = identity.name ?? identity.nickname ?? undefined;
    const company = await resolveCompanyFromIdentityClaims(ctx, identity);
    const role = resolveRoleFromIdentityClaims(identity);

    const existing = await getUserByClerkId(ctx, clerkId);

    if (existing) {
      await ctx.db.patch(existing._id, {
        email,
        ...(name ? { name } : {}),
        ...(company ? { companyId: company._id } : {}),
        ...(role ? { role } : {}),
        lastLoginAt: Date.now(),
      });
      return await ctx.db.get(existing._id);
    }

    const userId = await ctx.db.insert("users", {
      clerkId,
      email,
      name,
      ...(company ? { companyId: company._id } : {}),
      role: role ?? "viewer",
      status: "active",
      lastLoginAt: Date.now(),
    });

    return await ctx.db.get(userId);
  },
);

/**
 * getByClerkId: Looks up a user by their Clerk subject ID.
 * Restricted to self-lookup or owner/controller roles.
 */
export const getByClerkId = authQuery(
  { clerkId: v.string() },
  async (ctx: any, args: any, identity: any) => {
    const isSelf = identity.subject === args.clerkId;
    if (!isSelf) {
      const caller = await getUserByClerkId(ctx, identity.subject);
      const role = caller?.role;
      if (role !== "owner" && role !== "controller") {
        throw new Error("Forbidden: insufficient permissions.");
      }
    }
    return (await getUserByClerkId(ctx, args.clerkId)) ?? null;
  },
);

/**
 * getCurrentUser: Returns the user doc for the currently authenticated identity.
 */
export const getCurrentUser = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return (await getUserByClerkId(ctx as any, identity.subject)) ?? null;
  },
});

export const getCurrentTenant = authQuery(
  {},
  async (ctx: any, _args: any, identity: any) => {
    const user = await getUserByClerkId(ctx, identity.subject);
    if (!user?.companyId) {
      return {
        user,
        company: null,
      };
    }

    const company = await ctx.db.get(user.companyId);
    return {
      user,
      company: company
        ? {
            _id: company._id,
            name: company.name,
            slug: company.slug,
            timezone: company.timezone,
            state: company.state,
            operatorType: company.operatorType,
            defaultAccountingMethod: company.defaultAccountingMethod,
            status: company.status,
          }
        : null,
    };
  },
);

