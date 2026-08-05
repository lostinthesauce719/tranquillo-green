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
 * Verify that a secondary reference belongs to the same company.
 *
 * A different leak from the by-ID one, and harder to see, because every access
 * check involved passes.
 *
 * The caller is authorised for their own company and the wrapper correctly lets
 * them through. The problem is what they are allowed to point at: functions
 * taking `{ companyId, transactionId, policyId }` stored those references
 * without checking they belonged to the same company. The resulting record is
 * correctly owned — it just points somewhere it should not.
 *
 * That becomes an exfiltration path when a list query resolves the reference
 * with ctx.db.get() and returns the joined record. The allocation is yours; the
 * transaction hanging off it is a competitor's, and it comes back in full.
 *
 * Returns the record, so callers can use it without a second fetch.
 */
export async function requireSameCompany(
  ctx: AuthenticatedContext,
  companyId: string,
  id: string | undefined | null,
  label = "record"
): Promise<any | null> {
  if (!id) return null;
  const record: any = await ctx.db.get(id);
  if (!record) {
    throw new Error(`Referenced ${label} not found.`);
  }
  if (record.companyId !== companyId) {
    // Deliberately does not say which company owns it. Confirming that an ID
    // exists and belongs to someone else is itself a small disclosure.
    throw new Error(
      `Referenced ${label} does not belong to this company and cannot be used here.`
    );
  }
  return record;
}

/**
 * Verify a reference to data that may legitimately be shared.
 *
 * Some tables hold both platform reference records and tenant-specific ones.
 * Tax jurisdictions are the case here: a state-level jurisdiction has
 * `companyId: null` and is meant to be used by everyone, while a company may
 * also define its own local jurisdiction.
 *
 * requireSameCompany is wrong for these — it would refuse the system records,
 * which are the ordinary case. The rule is: shared, or ours. Never someone
 * else's.
 */
export async function requireSharedOrOwnedReference(
  ctx: AuthenticatedContext,
  companyId: string,
  id: string | undefined | null,
  label = "record"
): Promise<any | null> {
  if (!id) return null;
  const record: any = await ctx.db.get(id);
  if (!record) {
    throw new Error(`Referenced ${label} not found.`);
  }
  // null or undefined companyId means platform-wide reference data.
  const owner = record.companyId ?? null;
  if (owner !== null && owner !== companyId) {
    throw new Error(
      `Referenced ${label} belongs to another company and cannot be used here.`
    );
  }
  return record;
}

/**
 * Resolve a reference for display, returning null when it is not ours.
 *
 * The read-side counterpart to requireSameCompany. Used where a query joins a
 * reference into its response: a bad reference should render as absent rather
 * than throw, so one malformed row cannot take out the whole list — but it must
 * never serve the foreign record.
 */
export async function getIfSameCompany(
  ctx: AuthenticatedContext,
  companyId: string,
  id: string | undefined | null
): Promise<any | null> {
  if (!id) return null;
  const record: any = await ctx.db.get(id);
  if (!record || record.companyId !== companyId) return null;
  return record;
}

/**
 * Refuse an operation that maintains platform-wide reference data.
 *
 * Tax jurisdictions and rate tables are shared by every tenant. They were
 * exposed as ordinary authMutations, with the comment "Require admin role
 * (placeholder — implement role check in withAuth later)" standing in for the
 * check. So any signed-in dispensary owner could rewrite the rate that every
 * other company's filings are computed from. That is worse than a cross-tenant
 * read: it is a single write that corrupts everyone's numbers, silently, with
 * the wrong figure looking entirely legitimate afterwards.
 *
 * Every role in this product is tenant-scoped (owner, controller, accountant,
 * viewer). None of them is a platform administrator, so there is currently no
 * caller who should succeed here — and this refuses accordingly.
 *
 * Rate maintenance belongs in an internal, audited process, not in a mutation
 * the customer application can reach. When that process exists, give it a real
 * identity and let it through here explicitly.
 */
export async function requirePlatformAdmin(
  ctx: AuthenticatedContext,
  identity: Identity,
  what = "platform record"
): Promise<never> {
  throw new Error(
    `Editing ${what} data is not a tenant operation. These tables are shared by ` +
      `every company on the platform, so a change here would alter other ` +
      `businesses' tax calculations. Rate and jurisdiction maintenance is done ` +
      `through an internal process against published state guidance. If a rate ` +
      `looks wrong, report it rather than editing it.`
  );
}

/**
 * Verify access to a record reached by its own ID.
 *
 * WHY THIS EXISTS
 *
 * The authQuery/authMutation wrapper enforces tenant scope by inspecting the
 * request for a companyId or slug. That covers most of the API, and it is why
 * `listByCompany`-style functions are safe without writing anything.
 *
 * It cannot help a function whose only argument is an opaque record ID. There is
 * nothing in `{ policyId }` for the wrapper to check, so it let the call through
 * — and 21 functions were reached that way with no check of their own. Anyone
 * signed in could read or rewrite another company's allocation policies, tax
 * filings, inventory batches, COGS allocations and transaction lines, given an
 * ID. Convex IDs are not secrets; they travel in URLs and API responses.
 *
 * The tenant isolation suite missed all of it because those tests passed a
 * companyId, which is exactly the case the wrapper already handled.
 *
 * Pass the record's own owning company. Returns the record so callers do not
 * fetch it twice.
 */
export async function requireRecordAccess<T extends { companyId?: string }>(
  ctx: AuthenticatedContext,
  identity: Identity,
  record: T | null,
  label = "record"
): Promise<T> {
  if (!record) {
    throw new Error(`${label} not found.`);
  }
  if (!record.companyId) {
    // A record with no owner cannot be scoped to a tenant. Refuse rather than
    // assume it is public — silently allowing it is how this class of hole
    // appears in the first place.
    throw new Error(
      `Unauthorized: this ${label} has no owning company and cannot be accessed this way.`
    );
  }
  await requireCompanyAccessById(ctx, identity, record.companyId);
  return record;
}

/**
 * Fetch a record by ID and verify the caller owns it, in one step.
 */
export async function getOwnedRecord(
  ctx: AuthenticatedContext,
  identity: Identity,
  id: string,
  label = "record"
): Promise<any> {
  const record = await ctx.db.get(id);
  return requireRecordAccess(ctx, identity, record, label);
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

