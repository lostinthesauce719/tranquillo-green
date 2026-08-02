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
 * The codebase calls authQuery/authMutation with THREE different shapes:
 *
 *   A) authQuery({ args: {...}, handler })          — single spec object
 *   B) authQuery({ args: {...} }, handler)          — positional, args nested
 *   C) authQuery({ ...bareValidators }, handler)    — positional, args bare
 *
 * The previous implementation only supported (A). Shapes (B) and (C) silently
 * produced `spec.handler === undefined`, so every one of those functions threw
 * `TypeError: spec.handler is not a function` at call time — and because
 * `spec.args` was also wrong, Convex applied NO argument validation to them.
 *
 * normalizeSpec accepts all three and yields a single canonical { args, handler }.
 */
type AuthHandler = (
  ctx: AuthenticatedContext,
  args: any,
  identity: Identity
) => Promise<any>;

function normalizeSpec(
  a: any,
  b?: AuthHandler
): { args: any; handler: AuthHandler } {
  // Shapes (B) and (C): handler passed positionally.
  if (typeof b === "function") {
    const args =
      a && typeof a === "object" && "args" in a && typeof a.args === "object"
        ? a.args // (B)
        : a; // (C)
    return { args: args ?? {}, handler: b };
  }

  // Shape (A): single spec object.
  if (a && typeof a.handler === "function") {
    return { args: a.args ?? {}, handler: a.handler };
  }

  throw new Error(
    "authQuery/authMutation: could not resolve a handler function. " +
      "Expected ({args, handler}) or (args, handler)."
  );
}

/**
 * Defence in depth: enforce tenant scope in the wrapper itself.
 *
 * Previously, tenant isolation relied on each handler remembering to call
 * requireCompanyAccessById/BySlug. Auditing showed 79 authenticated functions
 * that accept a companyId/slug and never called a guard — any signed-in user
 * could read or write another operator's books by passing a different id.
 *
 * Enforcing here means a handler cannot forget. Individual handlers may still
 * call the guards explicitly; doing so is now redundant but harmless.
 */
async function enforceTenantScope(
  ctx: AuthenticatedContext,
  args: any,
  identity: Identity
) {
  if (!args || typeof args !== "object") return;

  if (typeof args.companyId === "string" && args.companyId) {
    await requireCompanyAccessById(ctx, identity, args.companyId);
    return;
  }

  const slug = typeof args.slug === "string" ? args.slug : args.companySlug;
  if (typeof slug === "string" && slug) {
    await requireCompanyAccessBySlug(ctx, identity, slug);
  }
}

/**
 * Wraps a mutation to enforce authentication AND tenant authorization.
 * Handler signature: (ctx, args, identity) => result
 */
export function authMutation(a: any, b?: AuthHandler) {
  const { args, handler } = normalizeSpec(a, b);
  return mutationGeneric({
    args,
    handler: async (ctx: AuthenticatedContext, callArgs: any) => {
      const identity = await requireIdentity(ctx);
      await enforceTenantScope(ctx, callArgs, identity);
      return await handler(ctx, callArgs, identity);
    },
  });
}

/**
 * Wraps a query to enforce authentication AND tenant authorization.
 * Handler signature: (ctx, args, identity) => result
 */
export function authQuery(a: any, b?: AuthHandler) {
  const { args, handler } = normalizeSpec(a, b);
  return queryGeneric({
    args,
    handler: async (ctx: AuthenticatedContext, callArgs: any) => {
      const identity = await requireIdentity(ctx);
      await enforceTenantScope(ctx, callArgs, identity);
      return await handler(ctx, callArgs, identity);
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
  // Callers destructure `{ company }` (e.g. companies.ts::updateCompany), so the
  // record must be returned — previously this returned undefined and those call
  // sites threw "Cannot destructure property 'company' of undefined".
  const company = await ctx.db.get(companyId);
  if (!company) {
    throw new Error("Company not found.");
  }
  return { company, user };
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
  // Callers assign the result directly and read `company._id`
  // (accountingCore.ts::getWorkspaceBySlug, importJobs.ts). Must return it.
  return company;
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


export async function requireTenantRecordForTransaction(
  ctx: AuthenticatedContext,
  identity: Identity,
  transactionId: string
) {
  const transaction = await ctx.db.get(transactionId);
  if (!transaction) {
    throw new Error("Transaction not found.");
  }
  const user = await getUserByClerkId(ctx, identity.subject);
  if (!user || user.companyId !== transaction.companyId) {
    throw new Error("Unauthorized: Transaction does not belong to your company.");
  }
  return transaction;
}

