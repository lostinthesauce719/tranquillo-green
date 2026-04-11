import { NextResponse } from "next/server";
import type { OverrideDecisionInput } from "@/lib/accounting-write-contracts";
import { recordOverrideDecision } from "@/lib/data/audit-trail";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as OverrideDecisionInput;
    const result = await recordOverrideDecision(payload);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Could not record override decision.",
      },
      { status: 400 },
    );
  }
}
