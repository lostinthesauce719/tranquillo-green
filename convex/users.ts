import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

/**
 * getOrCreateUser: Called after Clerk login. Upserts a user row keyed by clerkId.
 * Returns the full user document.
 */
export const getOrCreateUser = mutationGeneric({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const clerkId = identity.subject;
    const email = identity.email ?? "";
    const name = identity.name ?? identity.nickname ?? undefined;

    // Look up existing user by clerkId
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
      .unique();

    if (existing) {
      // Update last login and any changed profile fields
      await ctx.db.patch(existing._id, {
        email,
        ...(name ? { name } : {}),
        lastLoginAt: Date.now(),
      });
      return await ctx.db.get(existing._id);
    }

    // Create new user with default role
    const userId = await ctx.db.insert("users", {
      clerkId,
      email,
      name,
      role: "viewer",
      status: "active",
      lastLoginAt: Date.now(),
    });

    return await ctx.db.get(userId);
  },
});

/**
 * getByClerkId: Looks up a user by their Clerk subject ID.
 */
export const getByClerkId = queryGeneric({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    return (
      (await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", args.clerkId))
        .unique()) ?? null
    );
  },
});

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

    return (
      (await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
        .unique()) ?? null
    );
  },
});
