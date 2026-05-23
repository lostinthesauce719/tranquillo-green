import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-04-22.dahlia" });
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET ?? "");
  } catch (error: any) {
    console.error("Webhook signature verification failed:", error.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const client = await getAuthenticatedConvexClient();
  if (!client) {
    console.error("Convex client not available for webhook");
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.client_reference_id;
      const subscriptionId = session.subscription as string | undefined;

      if (!subscriptionId) {
        console.warn("Checkout session completed but no subscription ID");
        break;
      }

      await client.mutation(
        (anyApi as any).business.markSubscriptionActive,
        {
          customerId,
          stripeSubscriptionId: subscriptionId,
        }
      );
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = (invoice as any).subscription as string | undefined;

      if (!subscriptionId) {
        console.warn("Invoice payment succeeded but no subscription ID");
        break;
      }

      await client.mutation(
        (anyApi as any).business.recordPayment,
        {
          stripeSubscriptionId: subscriptionId,
          amount: invoice.amount_paid,
          invoiceId: invoice.id,
          periodStart: invoice.period_start,
          periodEnd: invoice.period_end,
        }
      );
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await client.mutation(
        (anyApi as any).business.markCustomerChurned,
        {
          stripeSubscriptionId: subscription.id,
        }
      );
      break;
    }
  }

  return NextResponse.json({ received: true });
}
