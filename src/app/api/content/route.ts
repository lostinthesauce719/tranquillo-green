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

    const items = await client.query((anyApi as any).contentItems.listByCompany, { companyId });
    return securityHeaders(NextResponse.json({ ok: true, items }));
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "Failed to load content" },
        { status: 500 }
      )
    );
  }
});

export const POST = withAuth(async (request) => {
  try {
    const body = await request.json();
    const { action } = body ?? {};

    const client = await getAuthenticatedConvexClient();
    if (!client) {
      return securityHeaders(NextResponse.json({ ok: false, message: "Convex not available" }, { status: 503 }));
    }

    if (action === "create") {
      const { companyId, title, channel, status, scheduledFor, body: itemBody } = body;
      if (!companyId || !title?.trim() || !channel) {
        return securityHeaders(
          NextResponse.json({ ok: false, message: "Missing companyId, title, or channel" }, { status: 400 })
        );
      }
      const itemId = await client.mutation((anyApi as any).contentItems.createItem, {
        companyId,
        title,
        channel,
        ...(status ? { status } : {}),
        ...(scheduledFor ? { scheduledFor } : {}),
        ...(itemBody ? { body: itemBody } : {}),
      });
      return securityHeaders(NextResponse.json({ ok: true, itemId }));
    }

    if (action === "update") {
      const { itemId, ...updates } = body;
      if (!itemId) {
        return securityHeaders(
          NextResponse.json({ ok: false, message: "Missing itemId" }, { status: 400 })
        );
      }
      const allowed = ["title", "channel", "status", "scheduledFor", "body"] as const;
      const patch: Record<string, unknown> = {};
      for (const key of allowed) {
        if (updates[key] !== undefined) patch[key] = updates[key];
      }
      const item = await client.mutation((anyApi as any).contentItems.updateItem, {
        itemId,
        ...patch,
      });
      return securityHeaders(NextResponse.json({ ok: true, item }));
    }

    if (action === "delete") {
      const { itemId } = body;
      if (!itemId) {
        return securityHeaders(
          NextResponse.json({ ok: false, message: "Missing itemId" }, { status: 400 })
        );
      }
      await client.mutation((anyApi as any).contentItems.deleteItem, { itemId });
      return securityHeaders(NextResponse.json({ ok: true }));
    }

    return securityHeaders(
      NextResponse.json({ ok: false, message: "Unknown action" }, { status: 400 })
    );
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "Failed to update content" },
        { status: 500 }
      )
    );
  }
});
