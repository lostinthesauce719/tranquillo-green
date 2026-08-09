import { NextResponse } from "next/server";
import { withAuth, securityHeaders } from "@/lib/api-helpers";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";

export const GET = withAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view") ?? "clients";
    const companyId = searchParams.get("companyId");

    const client = await getAuthenticatedConvexClient();
    if (!client) {
      return securityHeaders(NextResponse.json({ ok: false, message: "Convex not available" }, { status: 503 }));
    }

    if (view === "clients") {
      const clients = await client.query((anyApi as any).cpaPortal.listMyClients, {});
      return securityHeaders(NextResponse.json({ ok: true, clients }));
    }

    if (view === "partners") {
      if (!companyId) {
        return securityHeaders(
          NextResponse.json({ ok: false, message: "Missing companyId" }, { status: 400 })
        );
      }
      const partners = await client.query((anyApi as any).cpaPortal.listPartners, { companyId });
      return securityHeaders(NextResponse.json({ ok: true, partners }));
    }

    return securityHeaders(
      NextResponse.json({ ok: false, message: "Unknown view" }, { status: 400 })
    );
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "Failed to load CPA portal data" },
        { status: 500 }
      )
    );
  }
});

export const POST = withAuth(async (request) => {
  try {
    const body = await request.json();
    const { action, companyId, cpaEmail, linkId } = body ?? {};

    const client = await getAuthenticatedConvexClient();
    if (!client) {
      return securityHeaders(NextResponse.json({ ok: false, message: "Convex not available" }, { status: 503 }));
    }

    if (action === "addPartner") {
      if (!companyId || !cpaEmail) {
        return securityHeaders(
          NextResponse.json({ ok: false, message: "Missing companyId or cpaEmail" }, { status: 400 })
        );
      }
      const partnerLinkId = await client.mutation((anyApi as any).cpaPortal.addPartner, {
        companyId,
        cpaEmail,
      });
      return securityHeaders(NextResponse.json({ ok: true, linkId: partnerLinkId }));
    }

    if (action === "revokePartner") {
      if (!linkId) {
        return securityHeaders(
          NextResponse.json({ ok: false, message: "Missing linkId" }, { status: 400 })
        );
      }
      await client.mutation((anyApi as any).cpaPortal.revokePartner, { linkId });
      return securityHeaders(NextResponse.json({ ok: true }));
    }

    return securityHeaders(
      NextResponse.json({ ok: false, message: "Unknown action" }, { status: 400 })
    );
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "Failed to update CPA portal" },
        { status: 500 }
      )
    );
  }
});
