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
