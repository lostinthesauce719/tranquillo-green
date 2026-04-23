import { NextResponse } from "next/server";
import type { PacketGenerationInput } from "@/lib/accounting-write-contracts";
import { recordPacketGeneration } from "@/lib/data/audit-trail";
import { withAuth, securityHeaders, corsHeaders } from "@/lib/api-helpers";

export const POST = withAuth(async (request) => {
  try {
    const payload = (await request.json()) as PacketGenerationInput;
    const result = await recordPacketGeneration(payload);
    return securityHeaders(NextResponse.json(result));
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        {
          ok: false,
          message: error instanceof Error ? error.message : "Could not record packet generation.",
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
