import { NextResponse } from "next/server";
import type { PacketGenerationInput } from "@/lib/accounting-write-contracts";
import { recordPacketGeneration } from "@/lib/data/audit-trail";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as PacketGenerationInput;
    const result = await recordPacketGeneration(payload);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Could not record packet generation.",
      },
      { status: 400 },
    );
  }
}
