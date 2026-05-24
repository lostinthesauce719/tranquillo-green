import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { connectMetrc, syncMetrc, getMetrcStatus } from "./actions";

export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "connect":
        return NextResponse.json(await connectMetrc(body));
      case "sync":
        return NextResponse.json(await syncMetrc(body));
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e: any) {
    console.error("[METRC] Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
});

export const GET = withAuth(async (req, auth) => {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    if (!companyId) {
      return NextResponse.json({ error: "companyId required" }, { status: 400 });
    }
    return NextResponse.json(await getMetrcStatus({ companyId }));
  } catch (e: any) {
    console.error("[METRC] GET error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
});
