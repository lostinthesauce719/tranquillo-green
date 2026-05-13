export const preferredRegion = "iad1";

import { NextResponse } from "next/server";
import { withAuth, securityHeaders } from "@/lib/api-helpers";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";

export const GET = withAuth(async (_request, auth) => {
  try {
    const client = await getAuthenticatedConvexClient();
    if (!client) {
      return securityHeaders(NextResponse.json({ ok: false, message: "Convex not available" }, { status: 503 }));
    }

    const tenant = await client.query((anyApi as any).users.getCurrentTenant, {});
    if (!tenant?.company?._id) {
      return securityHeaders(NextResponse.json({ ok: false, message: "No company found" }, { status: 404 }));
    }
    const companyId = tenant.company._id;

    const profile = await client.query((anyApi as any).tax.getCompanyTaxProfile, { companyId });
    const taxTypes = await client.query((anyApi as any).tax.listTaxTypes, {});
    const jurisdictions = await client.query((anyApi as any).tax.listJurisdictions, { companyId: tenant.companyId });

    return securityHeaders(
      NextResponse.json({ ok: true, profile, taxTypes, jurisdictions })
    );
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "Failed to load tax settings" },
        { status: 500 }
      )
    );
  }
});

export const POST = withAuth(async (request) => {
  try {
    const body = await request.json();
    const { primaryJurisdictionId, nexusStates, filingCalendar, taxTypesEnabled } = body;

    const client = await getAuthenticatedConvexClient();
    if (!client) {
      return securityHeaders(NextResponse.json({ ok: false, message: "Convex not available" }, { status: 503 }));
    }

    const tenant = await client.query((anyApi as any).users.getCurrentTenant, {});
    if (!tenant?.company?._id) {
      return securityHeaders(NextResponse.json({ ok: false, message: "No company found" }, { status: 404 }));
    }
    const companyId = tenant.company._id;

    const result = await client.mutation((anyApi as any).tax.updateCompanyTaxProfile, {
      companyId,
      primaryJurisdictionId,
      nexusStates,
      filingCalendar,
      taxTypesEnabled,
    });

    return securityHeaders(
      NextResponse.json({ ok: true, ...result })
    );
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "Failed to update tax profile" },
        { status: 400 }
      )
    );
  }
});
