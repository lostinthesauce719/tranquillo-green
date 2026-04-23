"use server";

import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";

/**
 * Get the onboarding progress for a given tour.
 */
export async function getOnboardingProgress(tourId: string) {
  const convex = await getAuthenticatedConvexClient();
  if (!convex) throw new Error("Convex client unavailable");

  return await convex.query((anyApi as any).onboarding.getProgress, { tourId });
}

/**
 * Mark a tour as started.
 */
export async function startOnboardingTour(tourId: string) {
  const convex = await getAuthenticatedConvexClient();
  if (!convex) throw new Error("Convex client unavailable");

  await convex.mutation((anyApi as any).onboarding.startTour, { tourId });
  return { ok: true };
}

/**
 * Mark a tour as completed.
 */
export async function completeOnboardingTour(tourId: string) {
  const convex = await getAuthenticatedConvexClient();
  if (!convex) throw new Error("Convex client unavailable");

  await convex.mutation((anyApi as any).onboarding.completeTour, { tourId });
  return { ok: true };
}
