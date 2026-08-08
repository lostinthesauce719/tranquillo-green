import { NextResponse } from "next/server";
import { runAutomationAgent } from "@/lib/data/automation";
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
