import "server-only";

import { NextResponse } from "next/server";
import { anyApi } from "convex/server";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { getBillingProvider } from "./index";

/**
 * Shared webhook handling for whichever billing provider is active.
 *
 * The provider verifies the signature and normalizes the payload; this only
 * maps normalized events onto Convex mutations. Adding a processor therefore
 * touches no routing and no persistence logic.
 */
export async function handleBillingWebhook(request: Request): Promise<NextResponse> {
  const provider = getBillingProvider();

  if (!provider.isConfigured()) {
    return NextResponse.json(
      { ok: false, message: `Billing provider "${provider.id}" is not configured.` },
      { status: 503 },
    );
  }

  const rawBody = await request.text();

  let event;
  try {
    event = await provider.parseWebhook(rawBody, request.headers);
  } catch (error) {
    // Signature failures are rejected outright — an unverified webhook is an
    // unauthenticated request that would otherwise mutate subscription state.
    console.error("Billing webhook verification failed:", error);
    return NextResponse.json({ ok: false, message: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "ignored") {
    return NextResponse.json({ ok: true, ignored: event.raw });
  }

  const client = await getAuthenticatedConvexClient();
  if (!client) {
    // 500 so the provider retries rather than treating it as delivered.
    console.error("Convex client unavailable while handling billing webhook.");
    return NextResponse.json({ ok: false, message: "Server error." }, { status: 500 });
  }

  switch (event.type) {
    case "subscription_activated":
      await client.mutation((anyApi as any).business.markSubscriptionActive, {
        customerId: event.customerId,
        stripeSubscriptionId: event.subscriptionId,
      });
      break;

    case "payment_succeeded":
      await client.mutation((anyApi as any).business.recordPayment, {
        stripeSubscriptionId: event.subscriptionId,
        amount: event.amount,
        invoiceId: event.invoiceId,
        periodStart: event.periodStart,
        periodEnd: event.periodEnd,
      });
      break;

    case "subscription_cancelled":
      await client.mutation((anyApi as any).business.markCustomerChurned, {
        stripeSubscriptionId: event.subscriptionId,
      });
      break;
  }

  return NextResponse.json({ ok: true, received: true, provider: provider.id });
}
