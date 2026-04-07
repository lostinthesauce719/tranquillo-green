import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { seedDemoCompany } from "@/lib/data/seed-actions";

const SeedRequestSchema = z.object({
  slug: z.string().min(1).optional(),
}).optional();

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = (SeedRequestSchema ?? z.object({})).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const payload = parsed.data ?? {};
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
