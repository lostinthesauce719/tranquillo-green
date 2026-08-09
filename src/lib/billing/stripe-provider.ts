import "server-only";

import type { BillingEvent, BillingProvider, CheckoutRequest, CheckoutResult } from "./types";

async function getStripe(): Promise<any | null> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  const { default: Stripe } = await import("stripe");
  return new Stripe(key, { apiVersion: "2026-04-22.dahlia" });
}

export const stripeProvider: BillingProvider = {
  id: "stripe",

  isConfigured() {
    return Boolean(process.env.STRIPE_SECRET_KEY);
  },

  async createCheckout(request: CheckoutRequest): Promise<CheckoutResult> {
    const stripe = await getStripe();
    if (!stripe) throw new Error("Stripe is not configured.");

    const priceIds: Record<string, string> = {
      monthly: process.env.STRIPE_PRICE_MONTHLY ?? "",
      quarterly: process.env.STRIPE_PRICE_QUARTERLY ?? "",
      annually: process.env.STRIPE_PRICE_ANNUALLY ?? "",
    };

    const priceId = priceIds[request.billingCycle];
    if (!priceId) throw new Error(`No configured price for billing cycle: ${request.billingCycle}`);

    let customerId = request.customerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: request.customerEmail,
        name: request.companyName,
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: request.successUrl,
      cancel_url: request.cancelUrl,
      client_reference_id: request.customerId,
    });

    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    return { kind: "redirect", url: session.url };
  },

  async parseWebhook(rawBody: string, headers: Headers): Promise<BillingEvent> {
    const stripe = await getStripe();
    if (!stripe) throw new Error("Stripe is not configured.");

    const signature = headers.get("stripe-signature");
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!signature || !secret) {
      throw new Error("Missing webhook signature or STRIPE_WEBHOOK_SECRET.");
    }

    // Throws on tampering — callers must not catch and proceed.
    const event = stripe.webhooks.constructEvent(rawBody, signature, secret);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const subscriptionId = session.subscription as string | undefined;
        if (!subscriptionId) return { type: "ignored", raw: event.type };
        return {
          type: "subscription_activated",
          customerId: session.client_reference_id ?? undefined,
          subscriptionId,
        };
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription as string | undefined;
        if (!subscriptionId) return { type: "ignored", raw: event.type };
        return {
          type: "payment_succeeded",
          subscriptionId,
          amount: invoice.amount_paid,
          invoiceId: invoice.id,
          periodStart: invoice.period_start,
          periodEnd: invoice.period_end,
        };
      }
      case "customer.subscription.deleted": {
        return { type: "subscription_cancelled", subscriptionId: event.data.object.id };
      }
      default:
        return { type: "ignored", raw: event.type };
    }
  },
};
