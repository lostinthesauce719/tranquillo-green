import "server-only";

import { anyApi } from "convex/server";
import type { SeedResult, SeedSummary } from "@/lib/accounting-write-contracts";
import { DEMO_COMPANY_SLUG } from "@/lib/data/accounting-core";
import { getAuthenticatedConvexClient, withTimeout } from "@/lib/data/convex-client";

export async function seedDemoCompany(slug?: string): Promise<SeedResult> {
  const client = await getAuthenticatedConvexClient();
  if (!client) {
    return {
      ok: true,
      mode: "demo",
      message: "Convex is not configured. Seed skipped and demo fallback remains active.",
    };
  }

  try {
    const summary = (await withTimeout(
      client.mutation((anyApi as any).seed.seedCaliforniaOperator, { slug: slug ?? DEMO_COMPANY_SLUG }),
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
      message: error instanceof Error
        ? `Convex seed failed (${error.message}). Demo fallback remains active.`
        : "Convex seed failed. Demo fallback remains active.",
    };
  }
}
