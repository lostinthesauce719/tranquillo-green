import { NextResponse } from "next/server";
import { withAuth, securityHeaders } from "@/lib/api-helpers";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";
import { requireCompanyAccessById } from "convex/lib/withAuth";

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

    // Verify user has access to the company
    const identity = await client.auth.getUserIdentity();
    if (!identity) {
      return securityHeaders(
        NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })
      );
    }
    await client.requireCompanyAccessById(identity, companyId);

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
    const { companyId } = body;

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

    // Verify user has access to the company
    const identity = await client.auth.getUserIdentity();
    if (!identity) {
      return securityHeaders(
        NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })
      );
    }
    await client.requireCompanyAccessById(identity, companyId);

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

    // Get the location to check company ownership
    const location = await client.query((anyApi as any).locations.getById, { locationId });
    if (!location) {
      return securityHeaders(
        NextResponse.json({ ok: false, message: "Location not found" }, { status: 404 })
      );
    }

    // Verify user has access to the company that owns this location
    const identity = await client.auth.getUserIdentity();
    if (!identity) {
      return securityHeaders(
        NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })
      );
    }
    await client.requireCompanyAccessById(identity, location.companyId);

    await client.mutation((anyApi as any).locations.deleteLocation, { locationId });
    return securityHeaders(NextResponse.json({ ok: true }));
  } catch (error) {
    return securityHeaders(
      NextResponse.json({ ok: false, message: "Failed to delete" }, { status: 400 })
    );
  }
});
