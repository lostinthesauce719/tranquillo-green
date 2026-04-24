import { NextResponse } from "next/server";
import { withAuth, securityHeaders } from "@/lib/api-helpers";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";

export const GET = withAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const periodStart = Number(searchParams.get("periodStart"));
    const periodEnd = Number(searchParams.get("periodEnd"));

    if (!companyId || !periodStart || !periodEnd) {
      return securityHeaders(
        NextResponse.json({ ok: false, message: "Missing companyId, periodStart, or periodEnd" }, { status: 400 })
      );
    }

    const client = await getAuthenticatedConvexClient();
    if (!client) {
      return securityHeaders(NextResponse.json({ ok: false, message: "Convex not available" }, { status: 503 }));
    }

    const liability = await client.query((anyApi as any).tax.getTaxLiability, {
      companyId,
      periodStart,
      periodEnd,
    });

    return securityHeaders(NextResponse.json({ ok: true, ...liability }));
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "Failed to fetch tax liability" },
        { status: 500 }
      )
    );
  }
});
