
import { NextRequest, NextResponse } from "next/server";
import {
  connectTreez,
  syncTreez,
  getTreezStatus,
  disconnectTreez,
} from "./actions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "connect":
        return NextResponse.json(await connectTreez(body));
      case "sync":
        return NextResponse.json(await syncTreez(body));
      case "disconnect":
        return NextResponse.json(await disconnectTreez(body.companyId));
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (e: any) {
    console.error("Treez route error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });
    const status = await getTreezStatus(companyId);
    return NextResponse.json(status);
  } catch (e: any) {
    console.error("Treez GET error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
