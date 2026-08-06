import { NextResponse } from "next/server";
import { withAuth, securityHeaders } from "@/lib/api-helpers";
import { rateLimitDurable } from "@/lib/rate-limit";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";

const VALID_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];

function sanitizeString(value: unknown, maxLen: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLen) return undefined;
  return trimmed;
}

export const GET = withAuth(async (request, auth) => {
  try {
    const rl = await rateLimitDurable(auth.userId ?? "anonymous", 60, 60_000);
    if (!rl.allowed) {
      return securityHeaders(
        NextResponse.json(
          { ok: false, message: "Rate limit exceeded." },
          { status: 429, headers: { "Retry-After": String((rl as { retryAfter: number }).retryAfter) } }
        )
      );
    }

    const { searchParams } = new URL(request.url);
    const companyId = sanitizeString(searchParams.get("companyId"), 128);

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

    const access = await client.query((anyApi as any).companies.checkCompanyAccess, { companyId });
    if (!access?.hasAccess) {
      return securityHeaders(
        NextResponse.json({ ok: false, message: "Unauthorized: Not a member of this company" }, { status: 403 })
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
    const rl = await rateLimitDurable(auth.userId ?? "anonymous", 30, 60_000);
    if (!rl.allowed) {
      return securityHeaders(
        NextResponse.json(
          { ok: false, message: "Rate limit exceeded." },
          { status: 429, headers: { "Retry-After": String((rl as { retryAfter: number }).retryAfter) } }
        )
      );
    }

    const body = await request.json();
    const { companyId: rawCompanyId, name: rawName, licenseNumber: rawLicense, state: rawState, city: rawCity } = body;

    const companyId = sanitizeString(rawCompanyId, 128);
    if (!companyId) {
      return securityHeaders(
        NextResponse.json({ ok: false, message: "companyId is required" }, { status: 400 })
      );
    }

    const name = sanitizeString(rawName, 256);
    if (!name) {
      return securityHeaders(
        NextResponse.json({ ok: false, message: "name is required" }, { status: 400 })
      );
    }

    const licenseNumber = sanitizeString(rawLicense, 128);
    if (!licenseNumber) {
      return securityHeaders(
        NextResponse.json({ ok: false, message: "licenseNumber is required" }, { status: 400 })
      );
    }

    const state = sanitizeString(rawState, 2);
    if (state !== undefined) {
      const upperState = state.toUpperCase();
      if (!VALID_STATES.includes(upperState)) {
        return securityHeaders(
          NextResponse.json({ ok: false, message: "Invalid state code" }, { status: 400 })
        );
      }
    }

    const city = sanitizeString(rawCity, 128);

    const client = await getAuthenticatedConvexClient();
    if (!client) {
      return securityHeaders(
        NextResponse.json({ ok: false, message: "Convex not available" }, { status: 503 })
      );
    }

    const access = await client.query((anyApi as any).companies.checkCompanyAccess, { companyId });
    if (!access?.hasAccess) {
      return securityHeaders(
        NextResponse.json({ ok: false, message: "Unauthorized: Not a member of this company" }, { status: 403 })
      );
    }

    const location = await client.mutation((anyApi as any).locations.addLocation, {
      companyId,
      name,
      licenseNumber,
      ...(state ? { state: state.toUpperCase() } : {}),
      ...(city ? { city } : {}),
    });
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
    const rl = await rateLimitDurable(auth.userId ?? "anonymous", 30, 60_000);
    if (!rl.allowed) {
      return securityHeaders(
        NextResponse.json(
          { ok: false, message: "Rate limit exceeded." },
          { status: 429, headers: { "Retry-After": String((rl as { retryAfter: number }).retryAfter) } }
        )
      );
    }

    const { searchParams } = new URL(request.url);
    const locationId = sanitizeString(searchParams.get("id"), 128);

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

    // deleteLocation mutation handles its own lookup + company access check
    await client.mutation((anyApi as any).locations.deleteLocation, { locationId });
    return securityHeaders(NextResponse.json({ ok: true }));
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to delete";
    const status = msg.includes("not found") ? 404 : msg.includes("Unauthorized") ? 403 : 400;
    return securityHeaders(NextResponse.json({ ok: false, message: msg }, { status }));
  }
});
