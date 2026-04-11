import { NextResponse } from "next/server";
import type { AuditTrailEventInput } from "@/lib/accounting-write-contracts";
import { recordAuditEvent } from "@/lib/data/audit-trail";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as AuditTrailEventInput;
    const result = await recordAuditEvent(payload);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Could not record audit event.",
      },
      { status: 400 },
    );
  }
}
