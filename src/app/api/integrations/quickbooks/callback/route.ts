import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { exchangeCodeForTokens } from "@/lib/integrations/qbo-client";
import { anyApi } from "convex/server";
import { auth } from "@clerk/nextjs/server";

/**
 * GET /api/integrations/quickbooks/callback
 * Handles the OAuth redirect from Intuit.
 * Exchanges the code for tokens and stores them in Convex.
 * This route is now protected by Clerk middleware.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const realmId = url.searchParams.get("realmId");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  // Verify authenticated user (Clerk will protect this route)
  const { userId } = auth();
  if (!userId) {
    // This should ideally be caught by middleware, but as a fallback
    return NextResponse.redirect(
      new URL("/sign-in?redirect_url=/dashboard/settings", req.url),
    );
  }

  // Handle user denial or Intuit error
  if (error) {
    console.error("QBO OAuth error:", error);
    return NextResponse.redirect(
      new URL("/dashboard/settings?integration=quickbooks&status=error", req.url),
    );
  }

  if (!code || !realmId || !state) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?integration=quickbooks&status=error", req.url),
    );
  }

  // Decode state to get company ID and verify CSRF token
  let companyId: string;
  let csrfToken: string;
  try {
    const parsed = JSON.parse(
      Buffer.from(state, "base64url").toString("utf-8"),
    );
    companyId = parsed.companyId;
    csrfToken = parsed.csrfToken; // Assuming CSRF token is part of state

    // TODO: Implement actual CSRF token validation against a stored session token.
    // For now, we're assuming the state includes it and we just parse it.
    // A real implementation would involve storing a unique CSRF token in the user's session
    // when generating the QBO auth URL, and then verifying it here.
    if (!csrfToken) {
      throw new Error("Missing CSRF token in state");
    }
  } catch {
    return NextResponse.redirect(
      new URL("/dashboard/settings?integration=quickbooks&status=error", req.url),
    );
  }

  try {
    const convex = await getAuthenticatedConvexClient();
    if (!convex) {
      throw new Error("Convex unavailable");
    }

    // Verify the authenticated user is the owner/controller of the company from the state
    const tenant = await convex.query((anyApi as any).users.getCurrentTenant, {});
    if (!tenant || tenant.company?._id !== companyId) {
      throw new Error("Unauthorized: Mismatched company ID in QBO callback state.");
    }
    if (tenant.user?.role !== "owner" && tenant.user?.role !== "controller") {
      throw new Error("Unauthorized: Only owners/controllers can connect QBO.");
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, realmId);

    // Store tokens in Convex (using the now-protected mutation)
    await convex.mutation(
      (anyApi as any).integrationConfigs.upsertQBOTokens,
      {
        companyId: companyId as any,
        realmId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accessTokenExpiresAt: tokens.accessTokenExpiresAt,
        refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
      },
    );

    return NextResponse.redirect(
      new URL("/dashboard/settings?integration=quickbooks&status=connected", req.url),
    );
  } catch (err) {
    console.error("QBO callback error:", err);
    return NextResponse.redirect(
      new URL("/dashboard/settings?integration=quickbooks&status=error", req.url),
    );
  }
}
