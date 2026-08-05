import { NextResponse } from "next/server";
import type { AuditTrailEventInput } from "@/lib/accounting-write-contracts";
import { recordAuditEvent } from "@/lib/data/audit-trail";
import { withAuth, securityHeaders, corsHeaders } from "@/lib/api-helpers";

function sanitizeString(value: unknown, maxLen: number = 256): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLen) return undefined;
  return trimmed;
}

function sanitizeEmail(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return undefined;
  return trimmed;
}

function sanitizeNumber(value: unknown): number | undefined {
  if (typeof value === "number" && !isNaN(value) && isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && isFinite(parsed)) return parsed;
  }
  return undefined;
}


export const GET = withAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const limit = sanitizeNumber(searchParams.get("limit"));

    if (!companyId) {
      return securityHeaders(
        NextResponse.json({ ok: false, message: "Missing companyId" }, { status: 400 }),
      );
    }

    const { getAuthenticatedConvexClient } = await import("@/lib/data/convex-client");
    const { anyApi } = await import("convex/server");
    const client = await getAuthenticatedConvexClient();
    if (!client) {
      return securityHeaders(
        NextResponse.json({ ok: false, message: "Convex not available" }, { status: 503 }),
      );
    }

    const events = await client.query((anyApi as any).auditTrail.getRecentEvents, {
      companyId,
      limit: limit && limit > 0 ? Math.min(limit, 500) : 200,
    });
    return securityHeaders(NextResponse.json({ ok: true, events }));
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        {
          ok: false,
          message: error instanceof Error ? error.message : "Could not load audit events.",
        },
        { status: 500 },
      ),
    );
  }
});

export const POST = withAuth(async (request) => {
  try {
    const payload = (await request.json()) as AuditTrailEventInput;
    const result = await recordAuditEvent(payload);
    return securityHeaders(NextResponse.json(result));
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        {
          ok: false,
          message: error instanceof Error ? error.message : "Could not record audit event.",
        },
        { status: 400 },
      ),
    );
  }
});

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("Origin") ?? undefined;
  return corsHeaders(new NextResponse(null, { status: 204 }), origin);
}
