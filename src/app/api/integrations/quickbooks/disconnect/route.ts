import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";

/**
 * POST /api/integrations/quickbooks/disconnect
 * Disconnects QBO integration for the current user's company.
 */
export async function POST(_req: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const convex = await getAuthenticatedConvexClient();
  if (!convex) {
    return NextResponse.json({ error: "Convex unavailable" }, { status: 503 });
  }

  try {
    const user = await convex.query(
      (anyApi as any).users.getByClerkId,
      { clerkId: userId },
    );

    if (!user?.companyId) {
      return NextResponse.json({ error: "No company" }, { status: 400 });
    }

    await convex.mutation(
      (anyApi as any).integrationConfigs.disconnectQBO,
      { companyId: user.companyId },
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
  }
}
