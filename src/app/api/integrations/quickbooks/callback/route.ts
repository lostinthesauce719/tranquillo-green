import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { exchangeCodeForTokens } from "@/lib/integrations/qbo-client";
import { anyApi } from "convex/server";

/**
 * GET /api/integrations/quickbooks/callback
 * Handles the OAuth redirect from Intuit.
 * Exchanges the code for tokens and stores them in Convex.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const realmId = url.searchParams.get("realmId");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

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

  // Decode state to get company ID
  let companyId: string;
  try {
    const parsed = JSON.parse(
      Buffer.from(state, "base64url").toString("utf-8"),
    );
    companyId = parsed.companyId;
  } catch {
    return NextResponse.redirect(
      new URL("/dashboard/settings?integration=quickbooks&status=error", req.url),
    );
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, realmId);

    // Store tokens in Convex
    const convex = await getAuthenticatedConvexClient();
    if (!convex) {
      throw new Error("Convex unavailable");
    }

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
