import { NextResponse } from "next/server";
import type { ManualJournalSubmission } from "@/lib/accounting-write-contracts";
import { submitManualJournal } from "@/lib/data/accounting-write-actions";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ManualJournalSubmission;
    const result = await submitManualJournal(payload);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Could not process manual journal request.",
      },
      { status: 400 },
    );
  }
}
