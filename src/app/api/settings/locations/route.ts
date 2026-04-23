import { NextResponse } from "next/server";
import { withAuth, securityHeaders } from "@/lib/api-helpers";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";

export const GET = withAuth(async (request, auth) => {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return securityHeaders(
        NextResponse.json({ ok: false, message: "companyId required" }, { status: 400 })
      );
    }

    const client = await getAuthenticatedConvexClient();
    if (!client) {
      return securityHeaders(
        NextResponse.json({ ok: false, message: "Convex not available" }, { status: 503 })
      );
    }

    const locations = await client.query((anyApi as any).locations.listByCompany, { companyId });
    return securityHeaders(NextResponse.json({ ok: true, locations }));
  } catch (error) {
    return securityHeaders(
      NextResponse.json({ ok: false, message: "Failed to load locations" }, { status: 500 })
    );
  }
});

export const POST = withAuth(async (request, auth) => {
  try {
    const body = await request.json();
    const client = await getAuthenticatedConvexClient();
    if (!client) {
      return securityHeaders(
        NextResponse.json({ ok: false, message: "Convex not available" }, { status: 503 })
      );
    }

    const location = await client.mutation((anyApi as any).locations.addLocation, body);
    return securityHeaders(NextResponse.json({ ok: true, location }));
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "Failed" },
        { status: 400 }
      )
    );
  }
});

export const DELETE = withAuth(async (request, auth) => {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("id");

    if (!locationId) {
      return securityHeaders(
        NextResponse.json({ ok: false, message: "id required" }, { status: 400 })
      );
    }

    const client = await getAuthenticatedConvexClient();
    if (!client) {
      return securityHeaders(
        NextResponse.json({ ok: false, message: "Convex not available" }, { status: 503 })
      );
    }

    await client.mutation((anyApi as any).locations.deleteLocation, { locationId });
    return securityHeaders(NextResponse.json({ ok: true }));
  } catch (error) {
    return securityHeaders(
      NextResponse.json({ ok: false, message: "Failed to delete" }, { status: 400 })
    );
  }
});
