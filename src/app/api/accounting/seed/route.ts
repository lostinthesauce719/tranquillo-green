import { NextResponse } from "next/server";
import { seedDemoCompany } from "@/lib/data/seed-actions";

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => ({}))) as { slug?: string };
    const result = await seedDemoCompany(payload.slug);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Could not seed Convex demo org.",
      },
      { status: 400 },
    );
  }
}
