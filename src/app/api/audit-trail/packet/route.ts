import { NextResponse } from "next/server";
import type { PacketGenerationInput } from "@/lib/accounting-write-contracts";
import { recordPacketGeneration } from "@/lib/data/audit-trail";
import { withAuth, securityHeaders, corsHeaders } from "@/lib/api-helpers";

function sanitizeString(value: unknown, maxLen: number = 256): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLen) return undefined;
  return trimmed;
}

function sanitizeEmail(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return undefined;
  return trimmed;
}

function sanitizeNumber(value: unknown): number | undefined {
  if (typeof value === "number" && !isNaN(value) && isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && isFinite(parsed)) return parsed;
  }
  return undefined;
}


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
