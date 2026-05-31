import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";
import { auth } from "@clerk/nextjs/server";
import { createHmac } from "node:crypto";

function assertClerkIssuer(): void {
  const issuer = process.env.CLERK_JWT_ISSUER_DOMAIN?.trim();
  if (!issuer) {
    throw new Error("CLERK_JWT_ISSUER_DOMAIN is not configured.");
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const realmId = url.searchParams.get("realmId");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const { userId } = auth();
  if (!userId) {
    return NextResponse.redirect(
      new URL("/sign-in?redirect_url=/dashboard/settings", req.url),
    );
  }

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

  let companyId: string;
  let expectedState: string;
  try {
    const parsed = JSON.parse(
      Buffer.from(state, "base64url").toString("utf-8"),
    );
    companyId = parsed.companyId;
    expectedState = parsed.state;
  } catch {
    return NextResponse.redirect(
      new URL("/dashboard/settings?integration=quickbooks&status=error", req.url),
    );
  }

  const convex = await getAuthenticatedConvexClient();
  if (!convex) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?integration=quickbooks&status=error", req.url),
    );
  }

  const tenant = await convex.query((anyApi as any).users.getCurrentTenant, {});
  if (!tenant || !companyId || tenant.company?._id !== companyId) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?integration=quickbooks&status=error", req.url),
    );
  }
  if (tenant.user?.role !== "owner" && tenant.user?.role !== "controller") {
    return NextResponse.redirect(
      new URL("/dashboard/settings?integration=quickbooks&status=error", req.url),
    );
  }

  const stored = await convex.query(
    (anyApi as any).integrationLinks.getPendingState,
    { userId: userId as any, companyId: companyId as any },
  );

  if (!stored) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?integration=quickbooks&status=error", req.url),
    );
  }

  const signingSecret =
    process.env.QBO_OAUTH_STATE_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim();

  if (!signingSecret) {
    console.error("Missing QBO state secret.");
    return NextResponse.redirect(
      new URL("/dashboard/settings?integration=quickbooks&status=error", req.url),
    );
  }

  const expectedHmac = createHmac("sha256", signingSecret)
    .update(expectedState)
    .digest("hex");

  const [, candidate] = stored.state.split(".");
  if (candidate !== expectedHmac || stored.companyId !== companyId) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?integration=quickbooks&status=error", req.url),
    );
  }

  await convex.mutation((anyApi as any).integrationLinks.clearPendingState, {
    userId: userId as any,
    companyId: companyId as any,
  });

  assertClerkIssuer();

  return NextResponse.redirect(
    new URL("/dashboard/settings?integration=quickbooks&status=connected", req.url),
  );
}
