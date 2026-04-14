import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { getAuthorizationUrl } from "@/lib/integrations/qbo-client";
import { anyApi } from "convex/server";

/**
 * GET /api/integrations/quickbooks/connect
 * Initiates the QBO OAuth flow by redirecting to Intuit.
 * Stores company ID in the state param for the callback.
 */
export async function GET(_req: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the user's company ID to pass as state
  const convex = await getAuthenticatedConvexClient();
  if (!convex) {
    return NextResponse.json({ error: "Convex unavailable" }, { status: 503 });
  }

  // Find user's company
  const user = await convex.query(
    (anyApi as any).users.getByClerkId,
    { clerkId: userId },
  );

  if (!user?.companyId) {
    return NextResponse.json(
      { error: "No company associated with user" },
      { status: 400 },
    );
  }

  // Generate the QBO authorization URL with companyId and a CSRF token in state
  const authUrl = getAuthorizationUrl(user.companyId as string); // Pass companyId directly
  return NextResponse.redirect(authUrl);
}
