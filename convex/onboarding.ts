import { authMutation, authQuery } from "./lib/withAuth";
import { v } from "convex/values";
import { requireIdentity, requireCurrentUserRecord, getUserByClerkId } from "./lib/withAuth";

/**
 * Get the onboarding progress record for the current user and a given tour.
 * Returns null if no record exists.
 */
export const getProgress = authQuery({
  args: {
    tourId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const user = await requireCurrentUserRecord(ctx, identity);
    const userId = user.clerkId;

    const record = await ctx.db
      .query("onboardingProgress")
      .withIndex("by_user_tour", (q: any) => q.eq("userId", userId).eq("tourId", args.tourId))
      .first();

    return record ?? null;
  },
});

/**
 * Mark a tour as started (or restart it). Sets status to "in_progress".
 */
export const startTour = authMutation({
  args: {
    tourId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const user = await requireCurrentUserRecord(ctx, identity);
    const userId = user.clerkId;

    const existing = await ctx.db
      .query("onboardingProgress")
      .withIndex("by_user_tour", (q: any) => q.eq("userId", userId).eq("tourId", args.tourId))
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
export const completeTour = authMutation({
  args: {
    tourId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const user = await requireCurrentUserRecord(ctx, identity);
    const userId = user.clerkId;

    const existing = await ctx.db
      .query("onboardingProgress")
      .withIndex("by_user_tour", (q: any) => q.eq("userId", userId).eq("tourId", args.tourId))
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
export const createCompany = authMutation({
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
    /**
     * IRC 471 inventory classification. Determines whether indirect production
     * costs may be capitalised at all — Reg. 1.471-3(b) for resellers vs
     * 1.471-11 full absorption for producers.
     */
    inventoryRole: v.optional(
      v.union(v.literal("reseller"), v.literal("producer"))
    ),
    /**
     * Measured allocation bases. Without these the 471(c) reclassification
     * engine correctly refuses to reclassify anything, because the honest
     * answer to "how much of this rent is inventoriable" is not a guess.
     */
    productionSqFt: v.optional(v.number()),
    totalSqFt: v.optional(v.number()),
    productionHours: v.optional(v.number()),
    totalHours: v.optional(v.number()),
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

    // Measurements must be internally coherent. A production area larger than
    // the total, or a negative figure, is a data-entry error — not a position.
    if (args.totalSqFt !== undefined && args.totalSqFt < 0) {
      throw new Error("Total square footage must not be negative.");
    }
    if (args.productionSqFt !== undefined && args.productionSqFt < 0) {
      throw new Error("Production square footage must not be negative.");
    }
    if (
      args.productionSqFt !== undefined &&
      args.totalSqFt !== undefined &&
      args.productionSqFt > args.totalSqFt
    ) {
      throw new Error(
        `Production space (${args.productionSqFt.toLocaleString()} sq ft) cannot exceed ` +
        `total space (${args.totalSqFt.toLocaleString()} sq ft).`
      );
    }
    if (args.totalHours !== undefined && args.totalHours < 0) {
      throw new Error("Total hours must not be negative.");
    }
    if (args.productionHours !== undefined && args.productionHours < 0) {
      throw new Error("Production hours must not be negative.");
    }
    if (
      args.productionHours !== undefined &&
      args.totalHours !== undefined &&
      args.productionHours > args.totalHours
    ) {
      throw new Error(
        `Production hours (${args.productionHours.toLocaleString()}) cannot exceed ` +
        `total paid hours (${args.totalHours.toLocaleString()}).`
      );
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
      additionalOperatorTypes: additionalOperatorTypes,
      defaultAccountingMethod: args.accountingMethods[0] ?? "cash",
      accountingMethods: args.accountingMethods,
      status: "active",
      ...(args.inventoryRole ? { inventoryRole: args.inventoryRole } : {}),
      ...(args.productionSqFt !== undefined ? { productionSqFt: args.productionSqFt } : {}),
      ...(args.totalSqFt !== undefined ? { totalSqFt: args.totalSqFt } : {}),
      ...(args.productionHours !== undefined ? { productionHours: args.productionHours } : {}),
      ...(args.totalHours !== undefined ? { totalHours: args.totalHours } : {}),
    });

    // Create tax profiles for each operating state
    for (const state of args.states) {
      // exciseRule / salesTaxRule / filingFrequency are not in the taxProfiles
      // schema and never were — this insert could not have succeeded. The
      // schema models filing cadence as `filingCalendar`, a record keyed by
      // "<STATE>-<taxType>", which is the form tax.ts reads:
      //   tax.ts:295  profile.filingCalendar?.["CO-excise"]
      await ctx.db.insert("taxProfiles", {
        companyId,
        state,
        filingCalendar: {
          [`${state}-excise`]: "monthly",
          [`${state}-sales`]: "monthly",
        },
        nexusStates: args.states,
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
