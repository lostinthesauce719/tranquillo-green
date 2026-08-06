import { NextRequest } from "next/server";
import { handleBillingWebhook } from "@/lib/billing/handle-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Legacy Stripe webhook path, kept so an endpoint already registered in the
 * Stripe dashboard keeps working. New configuration should point at
 * /api/billing/webhook, which is provider-neutral.
 */
export async function POST(request: NextRequest) {
  return handleBillingWebhook(request);
}
