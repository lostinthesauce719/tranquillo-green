import { NextResponse } from "next/server";
import { runAutomationAgent } from "@/lib/data/automation";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      agentId: string;
      companySlug?: string;
    };

    if (!payload.agentId) {
      return NextResponse.json(
        { ok: false, message: "agentId is required." },
        { status: 400 },
      );
    }

    const result = await runAutomationAgent(
      payload.agentId,
      payload.companySlug,
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Could not run automation agent.",
      },
      { status: 400 },
    );
  }
}
