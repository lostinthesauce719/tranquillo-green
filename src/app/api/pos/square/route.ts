
import { NextRequest, NextResponse } from "next/server";
import {
  connectSquare,
  syncSquare,
  getSquareStatus,
  disconnectSquare,
} from "./actions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "connect": {
        const result = await connectSquare(body);
        return NextResponse.json(result);
      }
      case "sync": {
        const result = await syncSquare(body);
        return NextResponse.json(result);
      }
      case "disconnect": {
        const result = await disconnectSquare(body.companyId);
        return NextResponse.json(result);
      }
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (e: any) {
    console.error("Square route error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    if (!companyId) {
      return NextResponse.json({ error: "companyId required" }, { status: 400 });
    }
    const status = await getSquareStatus(companyId);
    return NextResponse.json(status);
  } catch (e: any) {
    console.error("Square GET error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
