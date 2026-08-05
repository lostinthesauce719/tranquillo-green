// @ts-nocheck
import { v } from "convex/values";
import {
  authMutation,
  authQuery,
  getUserByClerkId,
  requireCompanyAccessById,
  resolveCompanyFromIdentityClaims,
  resolveRoleFromIdentityClaims,
} from "./lib/withAuth";

async function requireCompanyOwner(ctx: any, identity: any, companyId: string) {
  const caller = await getUserByClerkId(ctx, identity.subject);
  if (!caller || caller.companyId !== companyId) {
    throw new Error("Unauthorized: Not a member of this company.");
  }
  if (caller.role !== "owner") {
    throw new Error("Unauthorized: Only the owner can manage team members.");
  }
  return caller;
}

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

    // Auto-provision sandbox for new users (no existing company)
    if (!company) {
      try {
        const { createSandboxTenant } = await import("./seed/sandboxSeed");
        const result = await createSandboxTenant(ctx, {
          userId: clerkId,
          businessType: "dispensary",
        });
        // Link user to the new sandbox company
        if (result?.companyId) {
          await ctx.db.patch(userId, { companyId: result.companyId });
        }
      } catch (e) {
        // Sandbox provisioning is best-effort; don't block login
        console.error("Failed to auto-provision sandbox:", e);
      }
    }

    return await ctx.db.get(userId);
  },
);

/**
 * getByClerkId: Looks up a user by their Clerk subject ID.
 */
export const getByClerkId = authQuery({
  args: {
    clerkId: v.string(),
  },
}, async (ctx, args, identity) => {
    return (await getUserByClerkId(ctx, args.clerkId)) ?? null;
  }
);

/**
 * getCurrentUser: Returns the user doc for the currently authenticated identity.
 */
export const getCurrentUser = authQuery(
  {},
  async (ctx: any, _args: any, identity: any) => {
    return (await getUserByClerkId(ctx, identity.subject)) ?? null;
  },
);

/**
 * listCompanyMembers: Team roster for the settings page. Any member of the
 * company can view; sensitive fields are not returned.
 */
export const listCompanyMembers = authQuery({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx: any, args: any, identity: any) => {
    await requireCompanyAccessById(ctx, identity, args.companyId);
    const members = await ctx.db
      .query("users")
      .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
      .collect();

    return members
      .filter((m: any) => m.status !== "deactivated")
      .map((m: any) => ({
        id: m._id,
        name: m.name ?? m.email,
        email: m.email,
        role: m.role ?? "viewer",
        status: m.status === "invited" ? "pending" : "active",
        joinedAt: new Date(m._creationTime).toISOString(),
        isSelf: m.clerkId === identity.subject,
      }));
  },
});

/**
 * updateMemberRole: Owner-only role change for a company member.
 */
export const updateMemberRole = authMutation({
  args: {
    companyId: v.id("cannabisCompanies"),
    userId: v.id("users"),
    role: v.union(v.literal("controller"), v.literal("accountant"), v.literal("viewer")),
  },
  handler: async (ctx: any, args: any, identity: any) => {
    const caller = await requireCompanyOwner(ctx, identity, args.companyId);
    const target = await ctx.db.get(args.userId);
    if (!target || target.companyId !== args.companyId) {
      throw new Error("Member not found in this company.");
    }
    if (target._id === caller._id) {
      throw new Error("You cannot change your own role.");
    }
    if (target.role === "owner") {
      throw new Error("The owner role cannot be reassigned here.");
    }
    await ctx.db.patch(args.userId, { role: args.role });
    return await ctx.db.get(args.userId);
  },
});

/**
 * removeMember: Owner-only soft removal (deactivation) of a company member.
 */
export const removeMember = authMutation({
  args: {
    companyId: v.id("cannabisCompanies"),
    userId: v.id("users"),
  },
  handler: async (ctx: any, args: any, identity: any) => {
    const caller = await requireCompanyOwner(ctx, identity, args.companyId);
    const target = await ctx.db.get(args.userId);
    if (!target || target.companyId !== args.companyId) {
      throw new Error("Member not found in this company.");
    }
    if (target._id === caller._id) {
      throw new Error("You cannot remove yourself.");
    }
    if (target.role === "owner") {
      throw new Error("The owner cannot be removed.");
    }
    await ctx.db.patch(args.userId, { status: "deactivated", companyId: undefined });
    return { ok: true };
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

