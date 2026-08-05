import "server-only";

import { anyApi } from "convex/server";
import type { SeedResult, SeedSummary } from "@/lib/accounting-write-contracts";
import { DEMO_COMPANY_SLUG } from "@/lib/data/accounting-core";
import {
  getAuthenticatedConvexClient,
  getConvexClient,
  withTimeout,
} from "@/lib/data/convex-client";

/**
 * Seed the demo company into Convex.
 * Requires an authenticated Convex client (user must be logged in).
 */
export async function seedDemoCompany(slug?: string): Promise<SeedResult> {
  const client = await getAuthenticatedConvexClient();
  if (!client) {
    return {
      ok: true,
      mode: "demo",
      message:
        "Convex is not configured. Seed skipped and demo fallback remains active.",
    };
  }

  try {
    const summary = (await withTimeout(
      client.mutation(
        (anyApi as any).seed.seedCaliforniaOperator,
        { slug: slug ?? DEMO_COMPANY_SLUG },
      ),
    )) as SeedSummary;

    return {
      ok: true,
      mode: "persisted",
      message: `Seeded Convex demo org ${summary.companySlug}.`,
      summary,
    };
  } catch (error) {
    return {
      ok: true,
      mode: "demo",
      message:
        error instanceof Error
          ? `Convex seed failed (${error.message}). Demo fallback remains active.`
          : "Convex seed failed. Demo fallback remains active.",
    };
  }
}

/**
 * Fetch backend diagnostic info using an unauthenticated Convex client.
 * Safe to call from any context — does not require login.
 */
export async function fetchBackendStatus() {
  const client = getConvexClient();
  if (!client) {
    return {
      ok: false,
      convexConfigured: false,
      message: "NEXT_PUBLIC_CONVEX_URL is not set.",
    };
  }

  try {
    const health = await withTimeout(
      client.query((anyApi as any).diagnostics.healthCheck, {}),
    );
    const seedData = await withTimeout(
      client.query((anyApi as any).diagnostics.getSeedDataSummary, {}),
    );

    return {
      ok: true,
      convexConfigured: true,
      convexReachable: true,
      ...health,
      seedData,
    };
  } catch (err) {
    return {
      ok: false,
      convexConfigured: true,
      convexReachable: false,
      message:
        err instanceof Error ? err.message : "Unknown Convex error",
    };
  }
}
