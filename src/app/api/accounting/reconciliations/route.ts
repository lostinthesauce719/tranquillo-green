import { NextResponse } from "next/server";
import type { ReconciliationMutation } from "@/lib/accounting-write-contracts";
import { mutateReconciliationState } from "@/lib/data/accounting-write-actions";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ReconciliationMutation;
    const result = await mutateReconciliationState(payload);
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
