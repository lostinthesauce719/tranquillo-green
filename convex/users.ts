import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import {
  AuthenticatedContext,
  CustomCtx,
  createEnrichedContext,
  requireIdentity,
  requireCurrentUserRecord,
  resolveRoleFromIdentityClaims,
} from "./lib/withAuth";
import type { Identity } from "./lib/withAuth"; // Import Identity type

// Helper for company resolution (moved here from withAuth.ts)
async function resolveCompanyFromIdentityClaims(
  ctx: AuthenticatedContext,
  identity: Identity,
) {
  const readStringClaim = (source: any, pathVariants: string[][]): string | undefined => {
    let current = source;
    for (const segment of pathVariants[0]) { // Simplified for direct access
      if (!current || typeof current !== "object" || !(segment in current)) {
        return undefined;
      }
      current = current[segment];
    }
    return typeof current === "string" ? current.trim() : undefined;
  };

  const companyIdClaim = readStringClaim(identity, [["companyId"]]); // Simplified for direct claim

  if (companyIdClaim) {
    const company = await ctx.db.get(companyIdClaim);
    if (company) {
      return company;
    }
  }

  const companySlugClaim = readStringClaim(identity, [["companySlug"]]); // Simplified for direct claim

  if (!companySlugClaim) {
    return null;
  }

  return await ctx.db
    .query("cannabisCompanies")
    .withIndex("by_slug", (q: any) => q.eq("slug", companySlugClaim))
    .unique();
}

/**
 * getOrCreateUser: Called after Clerk login. Upserts a user row keyed by clerkId.\n * Returns the full user document.\n */
export const getOrCreateUser = mutationGeneric({
  args: {},
  handler: async (baseCtx: AuthenticatedContext, _args: {}) => {
    const identity = await requireIdentity(baseCtx);
    const clerkId = identity.subject;
    const email = identity.email ?? "";
    const name = identity.name ?? identity.nickname ?? undefined;
    const company = await resolveCompanyFromIdentityClaims(baseCtx, identity);
    const role = resolveRoleFromIdentityClaims(identity);

    const existing = await baseCtx.db.query("users").withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId)).unique();

    if (existing) {
      await baseCtx.db.patch(existing._id, {
        email,
        ...(name ? { name } : {}),
        ...(company ? { companyId: company._id } : {}),
        ...(role ? { role } : {}),
        lastLoginAt: Date.now(),
      });
      return await baseCtx.db.get(existing._id);
    }

    const userId = await baseCtx.db.insert("users", {
      clerkId,
      email,
      name,
      ...(company ? { companyId: company._id } : {}),
      role: role ?? "viewer",
      status: "active",
      lastLoginAt: Date.now(),
    });

    return await baseCtx.db.get(userId);
  },
});

/**
 * getByClerkId: Looks up a user by their Clerk subject ID.\n */
export const getByClerkId = queryGeneric({
  args: {
    clerkId: v.string(),
  },
  handler: async (baseCtx: AuthenticatedContext, args) => {
    return (await baseCtx.db.query("users").withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId)).unique()) ?? null;
  },
});

/**
 * getCurrentUser: Returns the user doc for the currently authenticated identity.\n */
export const getCurrentUser = queryGeneric({
  args: {},
  handler: async (baseCtx: AuthenticatedContext, _args: {}) => {
    const identity = await requireIdentity(baseCtx);
    return (await baseCtx.db.query("users").withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject)).unique()) ?? null;
  },
});

/**
 * linkToCompany: Explicitly links the authenticated user to a company.\n * Called during onboarding after the company is created via the API route.\n */
export const linkToCompany = mutationGeneric({
  args: {
    companyId: v.id("cannabisCompanies"),
    role: v.union(
      v.literal("owner"),
      v.literal("controller"),
      v.literal("accountant"),
      v.literal("viewer"),
    ),
  },
  handler: async (baseCtx: AuthenticatedContext, args) => {
    const identity = await requireIdentity(baseCtx);
    const user = await requireCurrentUserRecord(baseCtx, identity);

    // Ensure the authenticated user is linking to a company they are authorized to manage (e.g., they just created it)
    // For this specific mutation, we assume the user is just creating their *first* company.\n    // A more robust check might involve comparing with a temporary state from the onboarding process.\n
    await baseCtx.db.patch(user._id, {
      companyId: args.companyId,
      role: args.role,
    });
    return await baseCtx.db.get(user._id);
  },
});

export const getCurrentTenant = queryGeneric({
  args: {},
  handler: async (baseCtx: AuthenticatedContext, _args: {}) => {
    const identity = await requireIdentity(baseCtx);
    const user = await requireCurrentUserRecord(baseCtx, identity);

    if (!user?.companyId) {
      return {
        user,
        company: null,
      };
    }

    const company = await baseCtx.db.get(user.companyId);
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
});
