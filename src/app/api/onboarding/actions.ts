"use server";

import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";

/**
 * Get the onboarding progress for a given tour.
 * Returns null if Convex is unavailable (demo mode).
 */
export async function getOnboardingProgress(tourId: string) {
  try {
    const convex = await getAuthenticatedConvexClient();
    if (!convex) return null;
    return await convex.query((anyApi as any).onboarding.getProgress, { tourId });
  } catch {
    // Convex unavailable or auth error — return null for demo mode
    return null;
  }
}

/**
 * Mark a tour as started.
 */
export async function startOnboardingTour(tourId: string) {
  try {
    const convex = await getAuthenticatedConvexClient();
    if (!convex) return { ok: true };
    await convex.mutation((anyApi as any).onboarding.startTour, { tourId });
    return { ok: true };
  } catch {
    return { ok: true };
  }
}

/**
 * Mark a tour as completed.
 */
export async function completeOnboardingTour(tourId: string) {
  try {
    const convex = await getAuthenticatedConvexClient();
    if (!convex) return { ok: true };
    await convex.mutation((anyApi as any).onboarding.completeTour, { tourId });
    return { ok: true };
  } catch {
    return { ok: true };
  }
}
