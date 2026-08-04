import { NextRequest, NextResponse } from "next/server";
import { withAuth, securityHeaders } from "@/lib/api-helpers";
import { auth } from "@clerk/nextjs/server";

export const POST = withAuth(async (req) => {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      slug?: string;
    };
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";

    if (!slug) {
      return securityHeaders(
        NextResponse.json({ ok: false, error: "slug is required" }, { status: 400 }),
      );
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return securityHeaders(
        NextResponse.json({ error: "Convex URL not configured" }, { status: 500 }),
      );
    }

    const response = await fetch(`${convexUrl}/api/mutation`, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${(await auth().getToken()) ?? ""}`,
      },
      body: JSON.stringify({
        path: "seed:seedCaliforniaOperator",
        args: { slug },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return securityHeaders(
        NextResponse.json(
          { error: `Convex error: ${response.status} - ${errorText}` },
          { status: 502 },
        ),
      );
    }

    const data = await response.json();
    return securityHeaders(NextResponse.json(data));
  } catch (err) {
    return securityHeaders(
      NextResponse.json({ error: String(err) }, { status: 500 }),
    );
  }
});
