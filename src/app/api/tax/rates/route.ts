export const preferredRegion = "iad1";

import { NextResponse } from "next/server";
import { withAuth, securityHeaders } from "@/lib/api-helpers";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";

export const GET = withAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const jurisdictionId = searchParams.get("jurisdictionId") || undefined;
    const taxTypeId = searchParams.get("taxTypeId") || undefined;

    const client = await getAuthenticatedConvexClient();
    if (!client) {
      return securityHeaders(NextResponse.json({ ok: false, message: "Convex not available" }, { status: 503 }));
    }

    const rates = await client.query((anyApi as any).tax.listTaxRates, {
      jurisdictionId,
      taxTypeId,
    });

    return securityHeaders(NextResponse.json({ ok: true, rates }));
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "Failed to fetch tax rates" },
        { status: 500 }
      )
    );
  }
});

export const POST = withAuth(async (request) => {
  try {
    const body = await request.json();
    const { rateId, jurisdictionId, taxTypeId, rate, rateType, effectiveFrom, effectiveTo, productCategoryFilter, notes } = body;

    const client = await getAuthenticatedConvexClient();
    if (!client) {
      return securityHeaders(NextResponse.json({ ok: false, message: "Convex not available" }, { status: 503 }));
    }

    const result = await client.mutation((anyApi as any).tax.upsertTaxRate, {
      rateId,
      data: { jurisdictionId, taxTypeId, rate, rateType, effectiveFrom, effectiveTo, productCategoryFilter, notes },
    });

    return securityHeaders(NextResponse.json({ ok: true, ...result }));
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "Failed to upsert tax rate" },
        { status: 400 }
      )
    );
  }
});
