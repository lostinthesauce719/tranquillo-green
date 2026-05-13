import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest) {
  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json({ error: "Convex URL not configured" }, { status: 500 });
    }

    // Call Convex seed mutation
    const response = await fetch(`${convexUrl}/api/mutation`, {
      method: "POST",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify({
        path: "seed:seedCaliforniaOperator",
        args: { slug: "golden-state-greens" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Convex error: ${response.status} - ${errorText}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
