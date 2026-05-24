import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import {
  connectToast,
  syncToast,
  getToastStatus,
  disconnectToast,
} from "./actions";

export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "connect": {
        const result = await connectToast(body);
        return NextResponse.json(result);
      }
      case "sync": {
        const result = await syncToast(body);
        return NextResponse.json(result);
      }
      case "disconnect": {
        const result = await disconnectToast(body.companyId);
        return NextResponse.json(result);
      }
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (e: any) {
    console.error("Toast route error:", e);
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
    const status = await getToastStatus(companyId);
    return NextResponse.json(status);
  } catch (e: any) {
    console.error("Toast GET error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
});
