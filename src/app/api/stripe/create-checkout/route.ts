import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

function getStripe(): any {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Stripe = require("stripe");
  return new Stripe(key, { apiVersion: "2026-04-22.dahlia" });
}

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
    }
    const { customerId, billingCycle, customerEmail, companyName } = await req.json();

    const priceIds: Record<string, string> = {
      monthly: process.env.STRIPE_PRICE_MONTHLY ?? "",
      quarterly: process.env.STRIPE_PRICE_QUARTERLY ?? "",
      annually: process.env.STRIPE_PRICE_ANNUALLY ?? "",
    };

    const priceId = priceIds[billingCycle];
    if (!priceId) throw new Error("Invalid billing cycle");

    let stripeCustomerId: string;
    if (customerId) {
      stripeCustomerId = customerId;
    } else {
      const customer = await stripe.customers.create({
        email: customerEmail,
        name: companyName,
      });
      stripeCustomerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
      client_reference_id: customerId,
    });

    if (!session.url) {
      throw new Error("Failed to create checkout session");
    }
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
