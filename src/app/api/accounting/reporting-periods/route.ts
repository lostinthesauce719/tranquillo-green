import { NextResponse } from "next/server";
import type { ReportingPeriodMutation } from "@/lib/accounting-write-contracts";
import { persistReportingPeriodState } from "@/lib/data/accounting-write-actions";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ReportingPeriodMutation;
    const result = await persistReportingPeriodState(payload);
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
