// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

export async function POST(req: NextRequest) {
  try {
    const { customerId, billingCycle, customerEmail, companyName } = await req.json();

    // Map billing cycle to price IDs (set these in Stripe Dashboard)
    const priceIds: Record<string, string> = {
      monthly: process.env.STRIPE_PRICE_MONTHLY!,
      quarterly: process.env.STRIPE_PRICE_QUARTERLY!,
      annually: process.env.STRIPE_PRICE_ANNUALLY!,
    };

    const priceId = priceIds[billingCycle];
    if (!priceId) throw new Error("Invalid billing cycle");

    // Create or update Stripe customer
    let stripeCustomerId: string;
    if (customerId && (await getCustomerStripeId(customerId))) {
      stripeCustomerId = await getCustomerStripeId(customerId);
    } else {
      const customer = await stripe.customers.create({
        email: customerEmail,
        name: companyName,
        metadata: { convexCustomerId: customerId || "" },
      });
      stripeCustomerId = customer.id;
      // Save to Convex
      await updateCustomerStripeId(customerId, stripeCustomerId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/business/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/business/acquisition`,
      client_reference_id: customerId,
    });

    if (!session.url) {
      throw new Error("Failed to create checkout session: no URL returned");
    }
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function getCustomerStripeId(customerId: string): Promise<string | null> {
  // TODO: query Convex customer record
  return null;
}

async function updateCustomerStripeId(customerId: string, stripeId: string) {
  // TODO: convex mutation to update
}
