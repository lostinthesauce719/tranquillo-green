import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { persistReportingPeriodState } from "@/lib/data/accounting-write-actions";

const ReportingPeriodMutationSchema = z.object({
  companySlug: z.string().min(1, "companySlug is required"),
  periodLabel: z.string().min(1, "periodLabel is required"),
  status: z.enum(["open", "review", "closed"]),
  taskSummary: z.object({
    completed: z.number(),
    total: z.number(),
  }),
  blockers: z.array(z.string()),
  lockedAt: z.string().optional(),
  highlights: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = ReportingPeriodMutationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const result = await persistReportingPeriodState(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Could not process reporting period update.",
      },
      { status: 400 },
    );
  }
}
