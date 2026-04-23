import { NextResponse } from "next/server";
import { runAutomationAgent } from "@/lib/data/automation";
import { withAuth, securityHeaders, corsHeaders } from "@/lib/api-helpers";

export const POST = withAuth(async (request) => {
  try {
    const payload = (await request.json()) as {
      agentId: string;
      companySlug?: string;
    };

    if (!payload.agentId) {
      return securityHeaders(
        NextResponse.json(
          { ok: false, message: "agentId is required." },
          { status: 400 },
        ),
      );
    }

    const result = await runAutomationAgent(
      payload.agentId,
      payload.companySlug,
    );

    return securityHeaders(NextResponse.json(result));
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        {
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : "Could not run automation agent.",
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
