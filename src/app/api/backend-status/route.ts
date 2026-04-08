import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();

/**
 * GET /api/backend-status
 *
 * Tests Convex connectivity using an unauthenticated client
 * and reports whether seed data exists. No auth required.
 */
export async function GET() {
  const convexUrl = CONVEX_URL;

  console.log('Backend Status: Using Convex URL:', convexUrl); // DEBUG LOG
  if (!convexUrl || !/^https?:\/\//.test(convexUrl)) {
    return NextResponse.json(
      {
        status: "error",
        convexConfigured: false,
        message:
          "NEXT_PUBLIC_CONVEX_URL is not set or is not a valid URL.",
      },
      { status: 500 },
    );
  }

  const client = new ConvexHttpClient(convexUrl);

  let convexReachable = false;
  let schemaDeployed = false;
  let companyCount = 0;
  let sampleCompany: { name: string; slug: string } | null = null;
  let seedData: {
    found: boolean;
    slug: string;
    locations: number;
    accounts: number;
    periods: number;
    transactions: number;
    reconciliations: number;
    companyId?: string;
    companyName?: string;
  } | null = null;

  try {
    const health = await client.query(
      (anyApi as any).diagnostics.healthCheck,
      {},
    );
    convexReachable = true;
    schemaDeployed = health.schemaDeployed;
    companyCount = health.companyCount;
    sampleCompany = health.sampleCompany ?? null;
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        convexConfigured: true,
        convexUrl,
        convexReachable: false,
        message:
          err instanceof Error
            ? `Convex query failed: ${err.message}`
            : "Convex query failed with unknown error.",
      },
      { status: 502 },
    );
  }

  // Fetch seed data summary for the demo company
  try {
    const summary = await client.query(
      (anyApi as any).diagnostics.getSeedDataSummary,
      { slug: "golden-state-greens" },
    );
    seedData = summary;
  } catch {
    // Seed summary is best-effort
  }

  return NextResponse.json({
    status: "ok",
    convexConfigured: true,
    convexUrl,
    convexReachable,
    schemaDeployed,
    companyCount,
    sampleCompany,
    seedData,
  });
}
