import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";

/**
 * GET /api/integrations/quickbooks/status
 * Returns QBO connection status for the current user's company.
 */
export async function GET(_req: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const convex = await getAuthenticatedConvexClient();
  if (!convex) {
    return NextResponse.json({ connected: false, status: "unavailable" });
  }

  try {
    const user = await convex.query(
      (anyApi as any).users.getByClerkId,
      { clerkId: userId },
    );

    if (!user?.companyId) {
      return NextResponse.json({ connected: false, status: "no_company" });
    }

    const status = await convex.query(
      (anyApi as any).integrationConfigs.getQBOStatus,
      { companyId: user.companyId },
    );

    return NextResponse.json(status);
  } catch {
    return NextResponse.json({ connected: false, status: "error" });
  }
}
