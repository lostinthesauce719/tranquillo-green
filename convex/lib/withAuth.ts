import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

export type Identity = { // Exported Identity
  subject: string;
  email?: string;
  name?: string;
  nickname?: string;
  [key: string]: any;
};

export type TenantRole = "owner" | "controller" | "accountant" | "viewer";

export type AuthenticatedContext = {
  auth: {
    getUserIdentity: () => Promise<Identity | null>;
  };
  db: any;
};

export type CustomCtx = AuthenticatedContext & {
  session: {
    userId: string;
    companyId: string;
    role: TenantRole;
  };
};

function readPath(source: any, path: string[]) {
  let current = source;
  for (const segment of path) {
    if (!current || typeof current !== "object" || !(segment in current)) {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

function readStringClaim(source: any, pathVariants: string[][]): string | undefined {
  for (const path of pathVariants) {
    const value = readPath(source, path);
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }
  return undefined;
}

export async function requireIdentity(ctx: AuthenticatedContext): Promise<Identity> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthenticated");
  }
  return identity;
}

export async function getUserByClerkId(ctx: AuthenticatedContext, clerkId: string) {
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
    .unique();
}

export async function requireCurrentUserRecord(ctx: AuthenticatedContext, identity?: Identity) {
  const currentIdentity = identity ?? (await requireIdentity(ctx));
  const user = await getUserByClerkId(ctx, currentIdentity.subject);
  if (!user) {
    throw new Error("Authenticated user is not provisioned.");
  }
  return user;
}

export function resolveRoleFromIdentityClaims(identity: Identity): TenantRole | undefined {
  const role = readStringClaim(identity, [
    ["role"],
    ["publicMetadata", "role"],
    ["public_metadata", "role"],
    ["metadata", "role"],
  ]);

  if (role === "owner" || role === "controller" || role === "accountant" || role === "viewer") {
    return role;
  }

  return undefined;
}

// Helper to create an enriched context for internal use within Convex functions
export async function createEnrichedContext(baseCtx: AuthenticatedContext): Promise<CustomCtx> {
  const identity = await requireIdentity(baseCtx);
  const user = await requireCurrentUserRecord(baseCtx, identity);
  const company = user.companyId ? await baseCtx.db.get(user.companyId) : null;

  if (!company) {
    throw new Error("User not associated with a company or company not found.");
  }

  const enrichedCtx: CustomCtx = {
    ...baseCtx,
    session: {
      userId: user.clerkId,
      companyId: company._id,
      role: resolveRoleFromIdentityClaims(identity) ?? "viewer",
    },
  };
  return enrichedCtx;
}

/* ─── AUTH HELPERS ────────────────────────────────────────────────────────── */

/**
 * Wraps a mutation to enforce authentication and inject the user's identity.
 * Handler signature: (ctx, args, identity) => result
 */
export function authMutation<Args extends any[]>(
  spec: { args: any },
  handler: (ctx: AuthenticatedContext, args: any, identity: Identity) => Promise<any>
) {
  return mutationGeneric({
    args: spec.args,
    handler: async (ctx: AuthenticatedContext, args: any) => {
      const identity = await requireIdentity(ctx);
      return await handler(ctx, args, identity);
    },
  });
}

/**
 * Wraps a query to enforce authentication and inject the user's identity.
 */
export function authQuery<Args extends any[]>(
  spec: { args: any },
  handler: (ctx: AuthenticatedContext, args: any, identity: Identity) => Promise<any>
) {
  return queryGeneric({
    args: spec.args,
    handler: async (ctx: AuthenticatedContext, args: any) => {
      const identity = await requireIdentity(ctx);
      return await handler(ctx, args, identity);
    },
  });
}

/**
 * Verify that the authenticated user is a member of the given company.
 */
export async function requireCompanyAccessById(
  ctx: AuthenticatedContext,
  identity: Identity,
  companyId: string
) {
  const user = await getUserByClerkId(ctx, identity.subject);
  if (!user || user.companyId !== companyId) {
    throw new Error("Unauthorized: Not a member of this company.");
  }
}

/**
 * Verify access by company slug (looks up the company first).
 */
export async function requireCompanyAccessBySlug(
  ctx: AuthenticatedContext,
  identity: Identity,
  slug: string
) {
  const company = await ctx.db
    .query("cannabisCompanies")
    .withIndex("by_slug", (q: any) => q.eq("slug", slug))
    .unique();
  if (!company) {
    throw new Error("Company not found.");
  }
  await requireCompanyAccessById(ctx, identity, company._id);
}

/**
 * Resolve a company from Clerk identity claims (e.g. org membership).
 * Currently a stub — can be extended when Clerk org IDs are mapped to companies.
 */
export async function resolveCompanyFromIdentityClaims(
  ctx: AuthenticatedContext,
  identity: Identity
): Promise<any> {
  // Future: look up organizationId in identity.publicMetadata and map to a company record.
  // For now, return null (no automatic company assignment).
  return null;
}
