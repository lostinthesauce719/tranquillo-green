import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { requireIdentity, requireCurrentUserRecord } from "./lib/withAuth";

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
