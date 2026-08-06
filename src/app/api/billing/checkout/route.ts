import { NextResponse } from "next/server";
import { withAuth, securityHeaders } from "@/lib/api-helpers";
import { getBillingProvider, type BillingCycle } from "@/lib/billing";

export const runtime = "nodejs";

const CYCLES: BillingCycle[] = ["monthly", "quarterly", "annually"];

export const POST = withAuth(async (request) => {
  try {
    const body = await request.json();
    const { billingCycle, customerId, customerEmail, companyName } = body ?? {};

    if (!CYCLES.includes(billingCycle)) {
      return securityHeaders(
        NextResponse.json(
          { ok: false, message: `billingCycle must be one of: ${CYCLES.join(", ")}` },
          { status: 400 },
        ),
      );
    }

    const provider = getBillingProvider();
    if (!provider.isConfigured()) {
      return securityHeaders(
        NextResponse.json(
          { ok: false, message: `Billing provider "${provider.id}" is not configured.` },
          { status: 503 },
        ),
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    const result = await provider.createCheckout({
      billingCycle,
      customerId,
      customerEmail,
      companyName,
      successUrl: `${appUrl}/dashboard/billing?status=success`,
      cancelUrl: `${appUrl}/dashboard/billing?status=cancelled`,
    });

    return securityHeaders(NextResponse.json({ ok: true, provider: provider.id, ...result }));
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "Checkout failed." },
        { status: 500 },
      ),
    );
  }
});
