import { NextResponse } from "next/server";
import { withAuth, securityHeaders } from "@/lib/api-helpers";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";

export const GET = withAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    if (!companyId) {
      return securityHeaders(
        NextResponse.json({ ok: false, message: "Missing companyId" }, { status: 400 })
      );
    }

    const client = await getAuthenticatedConvexClient();
    if (!client) {
      return securityHeaders(NextResponse.json({ ok: false, message: "Convex not available" }, { status: 503 }));
    }

    const feed = await client.query((anyApi as any).notifications.getFeed, { companyId });
    return securityHeaders(NextResponse.json({ ok: true, ...feed }));
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "Failed to load notifications" },
        { status: 500 }
      )
    );
  }
});

export const POST = withAuth(async (request) => {
  try {
    const body = await request.json();
    const { action, sourceId, sourceIds } = body ?? {};

    const client = await getAuthenticatedConvexClient();
    if (!client) {
      return securityHeaders(NextResponse.json({ ok: false, message: "Convex not available" }, { status: 503 }));
    }

    if (action === "markRead") {
      const ids = Array.isArray(sourceIds) ? sourceIds : sourceId ? [sourceId] : [];
      if (ids.length === 0) {
        return securityHeaders(
          NextResponse.json({ ok: false, message: "Missing sourceIds" }, { status: 400 })
        );
      }
      await client.mutation((anyApi as any).notifications.markRead, { sourceIds: ids });
      return securityHeaders(NextResponse.json({ ok: true }));
    }

    if (action === "dismiss") {
      if (!sourceId) {
        return securityHeaders(
          NextResponse.json({ ok: false, message: "Missing sourceId" }, { status: 400 })
        );
      }
      await client.mutation((anyApi as any).notifications.dismiss, { sourceId });
      return securityHeaders(NextResponse.json({ ok: true }));
    }

    return securityHeaders(
      NextResponse.json({ ok: false, message: "Unknown action" }, { status: 400 })
    );
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "Failed to update notifications" },
        { status: 500 }
      )
    );
  }
});
