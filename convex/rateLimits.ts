import { mutationGeneric } from "convex/server";
import { v } from "convex/values";

/**
 * Durable rate limiting.
 *
 * The in-process limiter in src/lib/api-helpers.ts resets on every cold start
 * and counts independently per serverless instance, so an attacker spreading
 * requests across instances gets N times the intended quota. Convex mutations
 * are transactional, so counting here is correct across all of them.
 *
 * Callers must present INTERNAL_API_SECRET (set on the Convex deployment).
 * Without that gate this mutation would itself be an abuse vector: anyone
 * could burn through another user's quota by calling it with their key.
 */
function assertInternal(provided: string) {
  const expected = process.env.INTERNAL_API_SECRET;
  if (!expected) {
    throw new Error("INTERNAL_API_SECRET is not configured on this Convex deployment.");
  }
  if (provided.length !== expected.length) {
    throw new Error("Unauthorized.");
  }
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (mismatch !== 0) {
    throw new Error("Unauthorized.");
  }
}

export const consume = mutationGeneric({
  args: {
    secret: v.string(),
    key: v.string(),
    maxRequests: v.number(),
    windowMs: v.number(),
  },
  handler: async (ctx: any, args) => {
    assertInternal(args.secret);

    const now = Date.now();
    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_key", (q: any) => q.eq("key", args.key))
      .unique();

    // No window yet, or the previous one has expired — start a fresh one.
    if (!existing || now >= existing.resetAt) {
      const resetAt = now + args.windowMs;
      if (existing) {
        await ctx.db.patch(existing._id, { count: 1, resetAt });
      } else {
        await ctx.db.insert("rateLimits", { key: args.key, count: 1, resetAt });
      }
      return { allowed: true as const };
    }

    const count = existing.count + 1;
    await ctx.db.patch(existing._id, { count });

    if (count > args.maxRequests) {
      return {
        allowed: false as const,
        retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      };
    }

    return { allowed: true as const };
  },
});

/**
 * Housekeeping: drops windows that expired more than an hour ago. Safe to run
 * from a cron; skipping it only wastes storage, never correctness.
 */
export const pruneExpired = mutationGeneric({
  args: { secret: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx: any, args) => {
    assertInternal(args.secret);
    const cutoff = Date.now() - 60 * 60 * 1000;
    const stale = (await ctx.db.query("rateLimits").take(args.limit ?? 500)).filter(
      (row: any) => row.resetAt < cutoff,
    );
    for (const row of stale) {
      await ctx.db.delete(row._id);
    }
    return { pruned: stale.length };
  },
});
