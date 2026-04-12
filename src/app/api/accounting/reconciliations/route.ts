import { NextResponse } from "next/server";
import type { ReconciliationMutation } from "@/lib/accounting-write-contracts";
import { mutateReconciliationState } from "@/lib/data/accounting-write-actions";
import { withAuth, securityHeaders, corsHeaders } from "@/lib/api-helpers";

export const POST = withAuth(async (request) => {
  try {
    const payload = (await request.json()) as ReconciliationMutation;
    const result = await mutateReconciliationState(payload);
    return securityHeaders(NextResponse.json(result));
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        {
          ok: false,
          message: error instanceof Error ? error.message : "Could not process reconciliation update.",
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
