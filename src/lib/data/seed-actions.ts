import "server-only";

import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import type { SeedResult, SeedSummary } from "@/lib/accounting-write-contracts";
import { DEMO_COMPANY_SLUG } from "@/lib/data/accounting-core";

function getConvexUrl() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  if (!url || !/^https?:\/\//.test(url)) {
    return null;
  }
  return url;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs = 5000): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

export async function seedDemoCompany(slug?: string): Promise<SeedResult> {
  const url = getConvexUrl();
  if (!url) {
    return {
      ok: true,
      mode: "demo",
      message: "Convex is not configured. Seed skipped and demo fallback remains active.",
    };
  }

  try {
    const client = new ConvexHttpClient(url);
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
