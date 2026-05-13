// @ts-nocheck
/**
 * Metrc Rate Limiter
 *
 * Implements a token bucket rate limiter for Metrc API calls.
 * Metrc typically allows 60 requests per minute per license.
 *
 * This limiter is distributed — state is stored in Convex so all
 * serverless instances coordinate.
 */

// @ts-ignore
import { getOrCreateRateLimitState, updateRateLimitState } from "../convex/integrationConfigs";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";

export interface RateLimitConfig {
  maxRequests: number;      // Maximum tokens (default 60)
  refillPeriodMs: number;   // Period after which tokens refill (default 60_000 ms)
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 60,
  refillPeriodMs: 60_000,
};

/**
 * Wait until a rate limit token is available for the given company/state.
 * This should be called before making any Metrc API request.
 */
export async function acquireRateLimitToken(companyId: string, state: string): Promise<void> {
  const convex = await getAuthenticatedConvexClient();
  if (!convex) {
    // No Convex client available — in development, just wait a bit
    await sleep(1000);
    return;
  }

  const stateKey = `${companyId}:${state}`;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    // Fetch current rate limit state
    const current = await convex.query(getOrCreateRateLimitState, {
      companyId,
      state,
    }) as any;

    const now = Date.now();
    const tokens = current.remaining;
    const resetAt = current.resetAt;

    // If window has reset, refill tokens
    if (now >= resetAt) {
      const newRemaining = DEFAULT_CONFIG.maxRequests - 1;
      await convex.mutation(updateRateLimitState, {
        companyId,
        state,
        remaining: newRemaining,
        resetAt: now + DEFAULT_CONFIG.refillPeriodMs,
      });
      return; // Token acquired
    }

    if (tokens > 0) {
      // Consume a token
      await convex.mutation(updateRateLimitState, {
        companyId,
        state,
        remaining: tokens - 1,
        resetAt,
      });
      return; // Token acquired
    }

    // No tokens available — wait until reset
    const waitMs = resetAt - now + 100; // Add 100ms buffer
    if (waitMs > 0) {
      await sleep(Math.min(waitMs, 50_000)); // Cap wait to avoid excessive delays
    }
    attempts++;
  }

  // After max attempts, proceed anyway but log warning
  console.warn(`Rate limit token acquisition timed out for ${state} (company ${companyId})`);
}

/**
 * Update rate limit state after a response with Retry-After header.
 * Called when Metrc returns 429 with a Retry-After value.
 */
export async function handleRateLimitHeader(
  companyId: string,
  state: string,
  retryAfterSeconds: number,
): Promise<void> {
  const convex = await getAuthenticatedConvexClient();
  if (!convex) return;

  const now = Date.now();
  const resetAt = now + retryAfterSeconds * 1000;

  await convex.mutation(updateRateLimitState, {
    companyId,
    state,
    remaining: 0,
    resetAt,
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
