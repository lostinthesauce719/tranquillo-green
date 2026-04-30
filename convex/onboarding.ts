import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { requireIdentity, requireCurrentUserRecord, getUserByClerkId } from "./lib/withAuth";

/**
 * Get the onboarding progress record for the current user and a given tour.
 * Returns null if no record exists.
 */
export const getProgress = queryGeneric({
  args: {
    tourId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const user = await requireCurrentUserRecord(ctx, identity);
    const userId = user.clerkId;

    const record = await ctx.db
      .query("onboardingProgress")
      .withIndex("by_user_tour", (q) => q.eq("userId", userId).eq("tourId", args.tourId))
      .first();

    return record ?? null;
  },
});

/**
 * Mark a tour as started (or restart it). Sets status to "in_progress".
 */
export const startTour = mutationGeneric({
  args: {
    tourId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const user = await requireCurrentUserRecord(ctx, identity);
    const userId = user.clerkId;

    const existing = await ctx.db
      .query("onboardingProgress")
      .withIndex("by_user_tour", (q) => q.eq("userId", userId).eq("tourId", args.tourId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "in_progress",
        startedAt: Date.now(),
        completedAt: null,
        currentStep: 0,
      });
    } else {
      await ctx.db.insert("onboardingProgress", {
        userId,
        tourId: args.tourId,
        status: "in_progress",
        startedAt: Date.now(),
        currentStep: 0,
      });
    }
  },
});

/**
 * Mark a tour as completed.
 */
export const completeTour = mutationGeneric({
  args: {
    tourId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const user = await requireCurrentUserRecord(ctx, identity);
    const userId = user.clerkId;

    const existing = await ctx.db
      .query("onboardingProgress")
      .withIndex("by_user_tour", (q) => q.eq("userId", userId).eq("tourId", args.tourId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "completed",
        completedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("onboardingProgress", {
        userId,
        tourId: args.tourId,
        status: "completed",
        completedAt: Date.now(),
        startedAt: Date.now(),
      });
    }
  },
});

/**
 * Create a new cannabis company during onboarding and link it to the current user.
 * This is the core backend integration for the onboarding flow.
 */
export const createCompany = mutationGeneric({
  args: {
    name: v.string(),
    states: v.array(v.string()),
    operatorTypes: v.array(
      v.union(
        v.literal("dispensary"),
        v.literal("cultivator"),
        v.literal("manufacturer"),
        v.literal("distributor"),
        v.literal("delivery"),
        v.literal("vertical")
      )
    ),
    accountingMethods: v.array(v.union(v.literal("cash"), v.literal("accrual"))),
    timezone: v.optional(v.string()),
    slug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Ensure user is authenticated
    const identity = await requireIdentity(ctx);
    const clerkId = identity.subject;

    // Validate arrays are non-empty
    if (!args.operatorTypes?.length) {
      throw new Error("At least one operator type must be selected.");
    }
    if (!args.accountingMethods?.length) {
      throw new Error("At least one accounting method must be selected.");
    }

    // Derive primary operator and additional types
    const primaryOperatorType = args.operatorTypes[0];
    const additionalOperatorTypes = args.operatorTypes.slice(1);

    // Generate slug from name if not provided
    const baseSlug = args.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const slug = args.slug ?? baseSlug;

    // Default timezone (can be made configurable later)
    const timezone = args.timezone ?? "America/Denver";

    // Verify no company with this slug already exists
    const existing = await ctx.db
      .query("cannabisCompanies")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (existing) {
      throw new Error("Company with this slug already exists.");
    }

    // Insert the company record
    const companyId = await ctx.db.insert("cannabisCompanies", {
      name: args.name,
      slug,
      timezone,
      states: args.states,
      operatorType: primaryOperatorType,
      primaryOperatorType,
      additionalOperatorTypes: additionalOperatorTypes.length > 0 ? additionalOperatorTypes : null,
      defaultAccountingMethod: args.accountingMethods[0] ?? "cash",
      accountingMethods: args.accountingMethods,
      status: "active",
    });

    // Create tax profiles for each operating state
    for (const state of args.states) {
      await ctx.db.insert("taxProfiles", {
        companyId,
        state,
        exciseRule: "default",
        salesTaxRule: "default",
        filingFrequency: "monthly",
        isPrimary: args.states.length === 1 || state === "CO",
      });
    }

    // Find the user record and link it to the new company, also promote to owner
    let user = await getUserByClerkId(ctx, clerkId);
    if (!user) {
      // Create a minimal user record if it doesn't exist yet
      const userId = await ctx.db.insert("users", {
        clerkId,
        email: identity.email ?? `user-${clerkId}@placeholder.local`,
        name: identity.name ?? null,
        companyId,
        role: "owner" as const,
        status: "active" as const,
        lastLoginAt: Date.now(),
      });
      user = await ctx.db.get(userId);
      if (!user) {
        throw new Error("Failed to create user record.");
      }
    } else {
      // Patch existing user to link company and elevate role
      await ctx.db.patch(user._id, {
        companyId,
        role: "owner" as const,
      });
    }

    return { companyId, slug };
  },
});
