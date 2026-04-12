import { NextResponse } from "next/server";
import { withAuth, securityHeaders } from "@/lib/api-helpers";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";

export const POST = withAuth(async (request, auth) => {
  try {
    const body = await request.json();
    const { companyId, operatorType, accountingMethod, state } = body;

    if (!companyId) {
      return securityHeaders(
        NextResponse.json({ ok: false, message: "companyId is required" }, { status: 400 })
      );
    }

    const client = await getAuthenticatedConvexClient();
    if (!client) {
      return securityHeaders(
        NextResponse.json({ ok: false, message: "Convex not available" }, { status: 503 })
      );
    }

    const updated = await client.mutation((anyApi as any).companies.updateCompany, {
      companyId,
      operatorType,
      defaultAccountingMethod: accountingMethod,
      state,
    });

    return securityHeaders(
      NextResponse.json({ ok: true, company: updated })
    );
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "Update failed" },
        { status: 400 }
      )
    );
  }
});
