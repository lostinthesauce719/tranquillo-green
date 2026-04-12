import { NextResponse } from "next/server";
import type { ManualJournalSubmission } from "@/lib/accounting-write-contracts";
import { submitManualJournal } from "@/lib/data/accounting-write-actions";
import { withAuth, securityHeaders, corsHeaders } from "@/lib/api-helpers";

export const POST = withAuth(async (request) => {
  try {
    const payload = (await request.json()) as ManualJournalSubmission;
    const result = await submitManualJournal(payload);
    return securityHeaders(NextResponse.json(result));
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        {
          ok: false,
          message: error instanceof Error ? error.message : "Could not process manual journal request.",
        },
        { status: 400 },
      ),
    );
  }
});

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("Origin") ?? undefined;
  return corsHeaders(new NextResponse(null, { status: 204 }), origin);
}
