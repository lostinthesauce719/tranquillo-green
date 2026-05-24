import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";

export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { companyId, scenario } = body;

    if (!companyId) {
      return NextResponse.json({ error: "companyId required" }, { status: 400 });
    }

    const convex = await getAuthenticatedConvexClient();
    if (!convex) {
      return NextResponse.json({ error: "Convex unavailable" }, { status: 503 });
    }

    // Run optimization scenario
    const result = await convex.query(
      (anyApi as any).allocationPolicies.getActivePolicy,
      { companyId }
    );

    return NextResponse.json({ success: true, result });
  } catch (e: any) {
    console.error("[PLAN-B] Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
});
