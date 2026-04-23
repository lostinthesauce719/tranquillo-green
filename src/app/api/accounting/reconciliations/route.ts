import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { mutateReconciliationState } from "@/lib/data/accounting-write-actions";

const ReconciliationMutationSchema = z.object({
  companySlug: z.string().min(1, "companySlug is required"),
  reconciliationId: z.string().min(1, "reconciliationId is required"),
  action: z.enum(["log_note", "toggle_case", "toggle_review"]),
});

export async function POST(request: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = ReconciliationMutationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const result = await mutateReconciliationState(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Could not process reconciliation update.",
      },
      { status: 400 },
    );
  }
}
