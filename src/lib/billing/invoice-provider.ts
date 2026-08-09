import "server-only";

import { randomUUID } from "node:crypto";
import type { BillingEvent, BillingProvider, CheckoutRequest, CheckoutResult } from "./types";

/**
 * Invoice / ACH billing — no card rail.
 *
 * This is the safe default for a cannabis-adjacent business. Mainstream card
 * processors prohibit or quietly terminate accounts in this sector, and losing
 * the payment rail is worse than never having automated it. Many B2B cannabis
 * vendors bill by invoice and collect over ACH or wire for exactly this reason.
 *
 * Checkout here records an intent and hands back a reference for a human to
 * follow up on. It is always "configured" because it depends on no third party
 * — which is the point: revenue collection cannot be switched off by a vendor.
 */
export const invoiceProvider: BillingProvider = {
  id: "invoice",

  isConfigured() {
    return true;
  },

  async createCheckout(request: CheckoutRequest): Promise<CheckoutResult> {
    const reference = `INV-${new Date().toISOString().slice(0, 10)}-${randomUUID().slice(0, 8).toUpperCase()}`;

    // Intentionally does not take payment details. The subscription is
    // activated by an operator once payment clears, via the same normalized
    // event path a card provider would use.
    console.info(
      `[billing] Invoice requested ${reference} cycle=${request.billingCycle} ` +
        `company=${request.companyName ?? "unknown"} email=${request.customerEmail ?? "unknown"}`,
    );

    return {
      kind: "invoice_requested",
      reference,
      message:
        `We'll email an invoice for the ${request.billingCycle} plan and activate your ` +
        `subscription as soon as payment clears. Your reference is ${reference}.`,
    };
  },

  async parseWebhook(): Promise<BillingEvent> {
    // No external processor calls back; activation is operator-driven.
    throw new Error("The invoice provider does not accept webhooks.");
  },
};
