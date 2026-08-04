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
    // Convex exposes OpenID claims on the identity, but `email` is only present
    // if the Clerk JWT template emits it. If users are being created with an
    // empty email, add `"email": "{{user.primary_email_address}}"` to the
    // "convex" JWT template in the Clerk dashboard.
    //
    // Read the common claim spellings so a template variation does not silently
    // produce blank user records.
    const email: string =
      identity.email ??
      identity.emailAddress ??
      identity.email_address ??
      identity.primaryEmailAddress ??
      identity.primary_email_address ??
      "";
    const name = identity.name ?? identity.nickname ?? undefined;
    const company = await resolveCompanyFromIdentityClaims(ctx, identity);
    const role = resolveRoleFromIdentityClaims(identity);

    const existing = await getUserByClerkId(ctx, clerkId);

    if (existing) {
      await ctx.db.patch(existing._id, {
        // Only write email when we actually have one. This previously patched
        // unconditionally, so a login whose token lacked the claim would
        // overwrite a good address with "".
        ...(email ? { email } : {}),
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

