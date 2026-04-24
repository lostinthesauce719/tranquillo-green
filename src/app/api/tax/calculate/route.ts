export const runtime = "edge";
export const preferredRegion = "iad1";

import { NextResponse } from "next/server";
import { withAuth, securityHeaders } from "@/lib/api-helpers";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";

export const POST = withAuth(async (request) => {
  try {
    const body = await request.json();
    const { transactionAmount, productCategory, jurisdictionId, taxTypeCodes, transactionDate } = body;

    const client = await getAuthenticatedConvexClient();
    if (!client) {
      return securityHeaders(NextResponse.json({ ok: false, message: "Convex not available" }, { status: 503 }));
    }

    const tenant = await client.query((anyApi as any).users.getCurrentTenant, {});
    if (!tenant?.company?._id) {
      return securityHeaders(NextResponse.json({ ok: false, message: "No company found" }, { status: 404 }));
    }
    const companyId = tenant.company._id;

    const result = await client.mutation((anyApi as any).tax.calculateTax, {
      companyId,
      transactionAmount,
      productCategory,
      jurisdictionId,
      taxTypeCodes,
      transactionDate,
    });

    return securityHeaders(NextResponse.json({ ok: true, ...result }));
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "Tax calculation failed" },
        { status: 400 }
      )
    );
  }
});
