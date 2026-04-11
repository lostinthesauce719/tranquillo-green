import { mutationGeneric, queryGeneric } from "convex/server";

type Identity = {
  subject: string;
  email?: string;
  name?: string;
  nickname?: string;
  [key: string]: any;
};

type TenantRole = "owner" | "controller" | "accountant" | "viewer";

type AuthenticatedContext = {
  auth: {
    getUserIdentity: () => Promise<Identity | null>;
  };
  db: any;
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

export async function getCurrentUserRecord(ctx: AuthenticatedContext, identity?: Identity) {
  const currentIdentity = identity ?? (await requireIdentity(ctx));
  return await getUserByClerkId(ctx, currentIdentity.subject);
}

export async function requireCurrentUserRecord(ctx: AuthenticatedContext, identity?: Identity) {
  const user = await getCurrentUserRecord(ctx, identity);
  if (!user) {
    throw new Error("Authenticated user is not provisioned.");
  }
  return user;
}

export async function resolveCompanyFromIdentityClaims(ctx: AuthenticatedContext, identity: Identity) {
  const companyIdClaim = readStringClaim(identity, [
    ["companyId"],
    ["company_id"],
    ["publicMetadata", "companyId"],
    ["publicMetadata", "company_id"],
    ["public_metadata", "companyId"],
    ["public_metadata", "company_id"],
    ["metadata", "companyId"],
    ["metadata", "company_id"],
  ]);

  if (companyIdClaim) {
    const company = await ctx.db.get(companyIdClaim);
    if (company) {
      return company;
    }
  }

  const companySlugClaim = readStringClaim(identity, [
    ["companySlug"],
    ["company_slug"],
    ["publicMetadata", "companySlug"],
    ["publicMetadata", "company_slug"],
    ["public_metadata", "companySlug"],
    ["public_metadata", "company_slug"],
    ["metadata", "companySlug"],
    ["metadata", "company_slug"],
  ]);

  if (!companySlugClaim) {
    return null;
  }

  return await ctx.db
    .query("cannabisCompanies")
    .withIndex("by_slug", (q: any) => q.eq("slug", companySlugClaim))
    .unique();
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

export async function requireCompanyAccessById(
  ctx: AuthenticatedContext,
  identity: Identity,
  companyId: string,
) {
  const user = await requireCurrentUserRecord(ctx, identity);
  if (user.companyId && user.companyId !== companyId) {
    throw new Error("Forbidden: company access denied.");
  }

  const company = await ctx.db.get(companyId);
  if (!company) {
    throw new Error("Company not found.");
  }

  return { user, company };
}

export async function requireCompanyAccessBySlug(
  ctx: AuthenticatedContext,
  identity: Identity,
  slug: string,
) {
  const company = await ctx.db
    .query("cannabisCompanies")
    .withIndex("by_slug", (q: any) => q.eq("slug", slug))
    .unique();

  if (!company) {
    return null;
  }

  await requireCompanyAccessById(ctx, identity, company._id);
  return company;
}

export async function requireTenantRecordForTransaction(
  ctx: AuthenticatedContext,
  identity: Identity,
  transactionId: string,
) {
  const transaction = await ctx.db.get(transactionId);
  if (!transaction) {
    throw new Error("Transaction not found.");
  }

  await requireCompanyAccessById(ctx, identity, transaction.companyId);
  return transaction;
}

export const authQuery = (args: any, handler: any) =>
  queryGeneric({
    args,
    handler: async (ctx: any, fnArgs: any) => {
      const identity = await requireIdentity(ctx);
      return handler(ctx, fnArgs, identity);
    },
  });

export const authMutation = (args: any, handler: any) =>
  mutationGeneric({
    args,
    handler: async (ctx: any, fnArgs: any) => {
      const identity = await requireIdentity(ctx);
      return handler(ctx, fnArgs, identity);
    },
  });