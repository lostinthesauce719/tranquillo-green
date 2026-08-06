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

    const campaigns = await client.query((anyApi as any).campaigns.listByCompany, { companyId });
    return securityHeaders(NextResponse.json({ ok: true, campaigns }));
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "Failed to load campaigns" },
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
      const { companyId, name, channel, budget, startDate, endDate, notes } = body;
      if (!companyId || !name?.trim() || !channel) {
        return securityHeaders(
          NextResponse.json({ ok: false, message: "Missing companyId, name, or channel" }, { status: 400 })
        );
      }
      const campaignId = await client.mutation((anyApi as any).campaigns.createCampaign, {
        companyId,
        name,
        channel,
        budget: typeof budget === "number" && budget >= 0 ? budget : 0,
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
        ...(notes ? { notes } : {}),
      });
      return securityHeaders(NextResponse.json({ ok: true, campaignId }));
    }

    if (action === "update") {
      const { campaignId, ...updates } = body;
      if (!campaignId) {
        return securityHeaders(
          NextResponse.json({ ok: false, message: "Missing campaignId" }, { status: 400 })
        );
      }
      const allowed = ["name", "channel", "status", "budget", "spent", "impressions", "clicks", "leads", "startDate", "endDate", "notes"] as const;
      const patch: Record<string, unknown> = {};
      for (const key of allowed) {
        if (updates[key] !== undefined) patch[key] = updates[key];
      }
      const campaign = await client.mutation((anyApi as any).campaigns.updateCampaign, {
        campaignId,
        ...patch,
      });
      return securityHeaders(NextResponse.json({ ok: true, campaign }));
    }

    if (action === "delete") {
      const { campaignId } = body;
      if (!campaignId) {
        return securityHeaders(
          NextResponse.json({ ok: false, message: "Missing campaignId" }, { status: 400 })
        );
      }
      await client.mutation((anyApi as any).campaigns.deleteCampaign, { campaignId });
      return securityHeaders(NextResponse.json({ ok: true }));
    }

    return securityHeaders(
      NextResponse.json({ ok: false, message: "Unknown action" }, { status: 400 })
    );
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "Failed to update campaign" },
        { status: 500 }
      )
    );
  }
});
