import "server-only";

import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { rateLimit as rateLimitInMemory } from "./api-helpers";

export type RateLimitVerdict = { allowed: true } | { allowed: false; retryAfter: number };

let client: ConvexHttpClient | null = null;

function getClient(): ConvexHttpClient | null {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return null;
  if (!client) client = new ConvexHttpClient(url);
  return client;
}

/**
 * Rate limit that holds across serverless instances.
 *
 * Counts in Convex so concurrent instances share one window. Falls back to the
 * per-instance limiter when INTERNAL_API_SECRET or Convex is unavailable, and
 * on any Convex error — a limiter outage must not take the endpoint down with
 * it, and degraded limiting beats none.
 */
export async function rateLimitDurable(
  identifier: string,
  maxRequests: number,
  windowMs: number,
): Promise<RateLimitVerdict> {
  const secret = process.env.INTERNAL_API_SECRET;
  const convex = getClient();

  if (!secret || !convex) {
    return rateLimitInMemory(identifier, maxRequests, windowMs);
  }

  try {
    const verdict = await convex.mutation((anyApi as any).rateLimits.consume, {
      secret,
      key: identifier,
      maxRequests,
      windowMs,
    });
    return verdict as RateLimitVerdict;
  } catch {
    return rateLimitInMemory(identifier, maxRequests, windowMs);
  }
}
