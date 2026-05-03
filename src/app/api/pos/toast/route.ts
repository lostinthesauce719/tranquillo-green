
import { NextRequest, NextResponse } from "next/server";
import {
  connectToast,
  syncToast,
  getToastStatus,
  disconnectToast,
} from "./actions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "connect":
        return NextResponse.json(await connectToast(body));
      case "sync":
        return NextResponse.json(await syncToast(body));
      case "disconnect":
        return NextResponse.json(await disconnectToast(body.companyId));
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (e: any) {
    console.error("Toast route error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });
    const status = await getToastStatus(companyId);
    return NextResponse.json(status);
  } catch (e: any) {
    console.error("Toast GET error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
