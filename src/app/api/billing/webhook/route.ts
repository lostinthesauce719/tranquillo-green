import { NextRequest } from "next/server";
import { handleBillingWebhook } from "@/lib/billing/handle-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Canonical webhook endpoint for whichever billing provider is configured. */
export async function POST(request: NextRequest) {
  return handleBillingWebhook(request);
}
