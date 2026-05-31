import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { withAuth, securityHeaders } from "@/lib/api-helpers";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";

export const GET = withAuth(async () => {
  const client = await getAuthenticatedConvexClient();
  if (!client) {
    return securityHeaders(
      NextResponse.json({ ok: false, error: "Convex unavailable" }, { status: 503 }),
    );
  }

  try {
    const result = await client.mutation(
      (anyApi as any).seed.seedCaliforniaOperator,
      { slug: "golden-state-greens" },
    );
    return securityHeaders(NextResponse.json(result));
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        {
          ok: false,
          message: error instanceof Error ? error.message : "Could not seed Convex demo org.",
        },
        { status: 400 },
      ),
    );
  }
});

export const POST = withAuth(async (req) => {
  const client = await getAuthenticatedConvexClient();
  if (!client) {
    return securityHeaders(
      NextResponse.json({ ok: false, error: "Convex unavailable" }, { status: 503 }),
    );
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { slug?: string };
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    const result = await client.mutation(
      (anyApi as any).seed.seedCaliforniaOperator,
      { slug: slug || undefined },
    );
    return securityHeaders(NextResponse.json(result));
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        {
          ok: false,
          message: error instanceof Error ? error.message : "Could not seed Convex demo org.",
        },
        { status: 400 },
      ),
    );
  }
});
