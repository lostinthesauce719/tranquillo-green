import { NextResponse } from "next/server";
import { withAuth, securityHeaders } from "@/lib/api-helpers";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";

export const GET = withAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const refresh = searchParams.get("refresh") === "1";

    if (!companyId) {
      return securityHeaders(
        NextResponse.json({ ok: false, message: "Missing companyId" }, { status: 400 })
      );
    }

    const client = await getAuthenticatedConvexClient();
    if (!client) {
      return securityHeaders(NextResponse.json({ ok: false, message: "Convex not available" }, { status: 503 }));
    }

    if (refresh) {
      // Regenerate alerts from current license/filing state before reading.
      await client.mutation((anyApi as any).compliance.generateComplianceAlerts, { companyId });
    }

    const [alerts, stats, licenses, filings] = await Promise.all([
      client.query((anyApi as any).compliance.getUnresolvedAlerts, { companyId }),
      client.query((anyApi as any).compliance.getAlertStats, { companyId }),
      client.query((anyApi as any).compliance.getLicenses, { companyId }),
      client.query((anyApi as any).compliance.getTaxFilings, { companyId }),
    ]);

    return securityHeaders(NextResponse.json({ ok: true, alerts, stats, licenses, filings }));
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "Failed to load compliance data" },
        { status: 500 }
      )
    );
  }
});

export const POST = withAuth(async (request) => {
  try {
    const body = await request.json();
    const { action, alertId } = body ?? {};

    const client = await getAuthenticatedConvexClient();
    if (!client) {
      return securityHeaders(NextResponse.json({ ok: false, message: "Convex not available" }, { status: 503 }));
    }

    if (action === "resolve") {
      if (!alertId) {
        return securityHeaders(
          NextResponse.json({ ok: false, message: "Missing alertId" }, { status: 400 })
        );
      }
      const resolved = await client.mutation((anyApi as any).compliance.resolveAlert, { alertId });
      return securityHeaders(NextResponse.json({ ok: true, alert: resolved }));
    }

    return securityHeaders(
      NextResponse.json({ ok: false, message: "Unknown action" }, { status: 400 })
    );
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "Failed to update compliance data" },
        { status: 500 }
      )
    );
  }
});
